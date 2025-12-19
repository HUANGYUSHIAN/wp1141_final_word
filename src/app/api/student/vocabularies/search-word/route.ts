import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { checkLLMQuotaExceeded } from "@/lib/checkLLMQuota";
import { updateLLMQuota } from "@/lib/llmQuota";
import { calculateCostFromUsage } from "@/lib/llmCost";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_LANGUAGES = ["Japanese", "Traditional Chinese", "English", "Korean"] as const;
type AllowedLang = (typeof ALLOWED_LANGUAGES)[number];

interface Word {
  word: string;
  spelling: string | null;
  explanation: string;
  partOfSpeech: string | null;
  sentence: string;
}

/**
 * 驗證單字是否符合規範
 */
function validateWord(
  word: any,
  langUse: AllowedLang,
  langExp: AllowedLang
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. 必填欄位檢查
  if (!word.word || typeof word.word !== "string" || word.word.trim() === "") {
    errors.push("Word.word 不能為空");
  }

  if (!word.explanation || typeof word.explanation !== "string" || word.explanation.trim() === "") {
    errors.push("Word.explanation 不能為空");
  }

  if (!word.sentence || typeof word.sentence !== "string" || word.sentence.trim() === "") {
    errors.push("Word.sentence 不能為空");
  }

  // 2. Sentence 格式檢查（必須包含 <word<）
  if (word.sentence && !word.sentence.includes("<" + word.word + "<")) {
    errors.push(`Word.sentence 必須包含 <${word.word}< 格式`);
  }

  // 3. Spelling 規則檢查
  if (langUse === "English") {
    // 英文的 spelling 必須為 null
    if (word.spelling !== null && word.spelling !== undefined) {
      errors.push("英文的 Word.spelling 必須為 null");
    }
  } else {
    // 日文、繁體中文、韓文的 spelling 不能為 null
    if (!word.spelling || word.spelling.trim() === "") {
      errors.push(`${langUse} 的 Word.spelling 不能為 null`);
    }
  }

  // 4. 日文特殊規則：純平假名或純片假名的 spelling 自動填充
  if (langUse === "Japanese" && word.word && word.spelling === null) {
    // 這個會在後處理中自動填充，這裡只檢查是否有 spelling
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 安全解析 JSON
 */
function safeParseWords(text: string): Word[] {
  try {
    // 嘗試直接解析
    const parsed = JSON.parse(text);
    if (parsed.words && Array.isArray(parsed.words)) {
      return parsed.words;
    }
    return [];
  } catch (e) {
    // 如果解析失敗，嘗試提取 JSON 部分
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.words && Array.isArray(parsed.words)) {
          return parsed.words;
        }
      } catch (e2) {
        console.error("Failed to parse JSON:", e2);
      }
    }
    return [];
  }
}

/**
 * 標準化和過濾單字
 */
function filterAndNormalize(
  words: Word[],
  langUse: AllowedLang,
  langExp: AllowedLang
): Word[] {
  const validWords: Word[] = [];

  for (const word of words) {
    // 標準化
    const normalized: Word = {
      word: word.word?.trim() || "",
      spelling: word.spelling?.trim() || null,
      explanation: word.explanation?.trim() || "",
      partOfSpeech: word.partOfSpeech?.trim() || null,
      sentence: word.sentence?.trim() || "",
    };

    // 日文特殊規則：純平假名或純片假名的 spelling 自動填充
    if (langUse === "Japanese" && normalized.word && !normalized.spelling) {
      // 檢查是否為純平假名或純片假名
      const hasKanji = /[\u4e00-\u9faf]/.test(normalized.word);
      if (!hasKanji) {
        normalized.spelling = normalized.word;
      }
    }

    // 驗證
    const validation = validateWord(normalized, langUse, langExp);
    if (validation.valid) {
      validWords.push(normalized);
    }
  }

  return validWords;
}

/**
 * 構建 prompt
 */
function buildPrompt(word: string, langUse: AllowedLang, langExp: AllowedLang): string {
  const langUseLabel = {
    Japanese: "日文",
    "Traditional Chinese": "繁體中文",
    English: "英文",
    Korean: "韓文",
  }[langUse];

  const langExpLabel = {
    Japanese: "日文",
    "Traditional Chinese": "繁體中文",
    English: "英文",
    Korean: "韓文",
  }[langExp];

  let spellingRule = "";
  if (langUse === "Japanese") {
    spellingRule = `
- 如果 word 包含漢字 → spelling 必須是該單字的平假名讀音（例如：刺身 → さしみ）
- 如果 word 是純平假名（無漢字、無片假名）→ spelling 必須與 word 相同（例如：おすすめ → おすすめ）
- 如果 word 是純片假名（無漢字、無平假名）→ spelling 必須與 word 相同（例如：メニュー → メニュー）
- spelling 絕對不能為 null`;
  } else if (langUse === "Traditional Chinese") {
    spellingRule = `- spelling 必須填寫注音（例如：你好 → ㄋㄧˇ ㄏㄠˇ），絕對不能為 null`;
  } else if (langUse === "Korean") {
    spellingRule = `- spelling 必須填寫字母拼寫（將韓文字母拆解，例如：가방 → ㄱㅏㅂㅏㅇ），絕對不能為 null`;
  } else if (langUse === "English") {
    spellingRule = `- spelling 必須為 null（英文不需要拼音欄位）`;
  }

  return `請根據輸入的單字或資訊，用 ${langUseLabel} 生成單字，並提供同義字、反義字與相關字。

要求：
1. Word.word：必須使用 ${langUseLabel}
2. Word.spelling：
${spellingRule}
3. Word.explanation：必須使用 ${langExpLabel}，準確描述單字的含義
4. Word.partOfSpeech：必須使用 ${langExpLabel}，可以為 null（但建議填寫）。若為日文動詞，必須標示動詞類別（格式：動詞(I)、動詞(II)、動詞(III)）
5. Word.sentence：必須使用 ${langUseLabel}，必須包含該單字，格式為 <單字<（用左尖括號包裹單字）。盡量避免單字出現在句子一開頭或最尾端，要適量放在句子中間，可配合時態等做變化。

如果該單字一字多意，每個意思都要造句，Word.Word 會相同，但是 Word.Explanation & Word.Sentence 會不同。

輸入單字：${word}

請以 JSON 格式返回：
{
  "words": [
    {
      "word": "單字",
      "spelling": "拼音或null",
      "explanation": "解釋",
      "partOfSpeech": "詞性",
      "sentence": "例句（必須包含 <單字< 格式）"
    }
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 檢查 LLM 額度
    const quotaExceeded = await checkLLMQuotaExceeded(session.userId);
    if (quotaExceeded) {
      return NextResponse.json(
        { error: "今日 LLM 額度已用完，請明日再試" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { word, langUse, langExp } = body;

    if (!word || !langUse || !langExp) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    if (!ALLOWED_LANGUAGES.includes(langUse) || !ALLOWED_LANGUAGES.includes(langExp)) {
      return NextResponse.json({ error: "僅支援日文、繁體中文、英文、韓文" }, { status: 400 });
    }

    const prompt = buildPrompt(word, langUse as AllowedLang, langExp as AllowedLang);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是一個嚴謹的語言學習助手，請只輸出有效 JSON，並嚴格遵守使用者的格式與語言要求。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    // 計算成本並更新額度
    if (completion.usage) {
      const cost = calculateCostFromUsage(completion.usage);
      await updateLLMQuota(session.userId, cost);
    }

    const responseText = completion.choices[0]?.message?.content || "{}";
    const words = safeParseWords(responseText);
    const filtered = filterAndNormalize(words, langUse as AllowedLang, langExp as AllowedLang);

    return NextResponse.json({
      words: filtered,
      rawWords: words, // 也返回原始單字，用於顯示驗證錯誤
    });
  } catch (error: any) {
    console.error("Error searching word:", error);
    return NextResponse.json(
      { error: error.message || "搜尋單字失敗" },
      { status: 500 }
    );
  }
}

