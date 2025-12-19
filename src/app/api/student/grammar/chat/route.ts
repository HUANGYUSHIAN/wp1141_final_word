import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkLLMQuotaExceeded } from "@/lib/checkLLMQuota";
import OpenAI from "openai";
import { updateLLMQuota } from "@/lib/llmQuota";
import { calculateCostFromUsage } from "@/lib/llmCost";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Chat {
  timestamp: number;
  content: string;
  direction: "user" | "ai";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { userId: session.userId },
        include: { studentData: true },
      });
    } catch (dbError: any) {
      console.error("Database error in grammar chat:", dbError);
      return NextResponse.json(
        { error: "資料庫連接失敗，請稍後再試" },
        { status: 503 }
      );
    }

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const body = await request.json();
    const { message, grammarLang, responseLang, level, mode, chatHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "訊息格式錯誤" }, { status: 400 });
    }

    const grammarLanguage = grammarLang || "English";
    const responseLanguage = responseLang || "Traditional Chinese";
    const userLevel = level || (grammarLanguage === "English" ? "A1" : "N5");
    const chatMode = mode || "ask";

    // 檢查 LLM 額度（雖然目前只是固定回覆，但預先檢查）
    const quotaExceeded = await checkLLMQuotaExceeded(session.userId);
    if (quotaExceeded) {
      return NextResponse.json(
        { error: "今日 LLM 額度已用完，請明日再試" },
        { status: 403 }
      );
    }

    // 獲取現有聊天紀錄
    let chats: Chat[] = [];
    if (user.studentData.chathistory) {
      try {
        chats = JSON.parse(user.studentData.chathistory);
      } catch (e) {
        console.error("Error parsing chathistory JSON:", e);
        chats = [];
      }
    }

    // 添加用戶訊息
    const userChat: Chat = {
      timestamp: Date.now(),
      content: message,
      direction: "user",
    };
    chats.push(userChat);

    // 構建系統提示詞
    const systemPrompt = buildSystemPrompt(grammarLanguage, responseLanguage, userLevel);
    
    // 構建用戶提示詞
    const userPrompt = buildUserPrompt(message, chatMode, grammarLanguage, responseLanguage, userLevel);

    // 構建對話歷史
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    // 添加歷史對話（最近 10 輪）
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // 添加當前用戶訊息
    messages.push({ role: "user", content: userPrompt });

    // 調用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    // 計算成本並更新額度
    if (completion.usage) {
      const cost = calculateCostFromUsage(completion.usage);
      await updateLLMQuota(session.userId, cost);
    }

    const aiResponse = completion.choices[0]?.message?.content || "grammar功能開發中";
    
    // 解析回應（提取 Quick Replies）
    const { content, quickReplies } = parseAIResponse(aiResponse, chatMode, grammarLanguage);

    // AI 回應
    const aiChat: Chat = {
      timestamp: Date.now(),
      content,
      direction: "ai",
    };
    chats.push(aiChat);

    // 儲存到資料庫（如果失败也不影响响应）
    try {
      await prisma.student.update({
        where: { userId: session.userId },
        data: {
          chathistory: JSON.stringify(chats),
        },
      });
    } catch (dbError: any) {
      // 数据库保存失败时记录错误，但不影响响应
      console.error("Database error saving chat history:", dbError);
      // 继续返回响应，让用户知道消息已发送
    }

    return NextResponse.json({ 
      response: aiChat.content,
      quickReplies: quickReplies || []
    });
  } catch (error: any) {
    console.error("Error processing chat:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

/**
 * 構建系統提示詞
 */
function buildSystemPrompt(
  grammarLang: string,
  responseLang: string,
  level: string
): string {
  const levelDesc = grammarLang === "English"
    ? `CEFR ${level} 等級`
    : `JLPT ${level} 等級`;

  return `你是一個專業的${grammarLang}文法家教，使用${responseLang}回答。

你的教學目標：
- 幫助學習者理解${grammarLang}文法
- 根據學習者的${levelDesc}程度調整教學內容
- 提供清晰、實用的文法解釋

教學原則：
1. 使用${responseLang}回答
2. 內容要符合${levelDesc}的程度
3. 回答要結構化、易於理解
4. 提供實用的例句和記憶技巧`;
}

/**
 * 構建用戶提示詞
 */
function buildUserPrompt(
  message: string,
  mode: string,
  grammarLang: string,
  responseLang: string,
  level: string
): string {
  if (mode === "recommend") {
    // Mode A: 探索型 - 推薦文法主題
    return buildRecommendPrompt(grammarLang, responseLang, level);
  } else {
    // Mode B: 目標型 - 回答文法問題
    return buildAnswerPrompt(message, grammarLang, responseLang, level);
  }
}

/**
 * Mode A: 構建推薦提示詞
 */
function buildRecommendPrompt(
  grammarLang: string,
  responseLang: string,
  level: string
): string {
  const levelDesc = grammarLang === "English"
    ? `CEFR ${level} 等級`
    : `JLPT ${level} 等級`;

  const examples = grammarLang === "English"
    ? `例如：
- 現在完成式 vs 過去式
- 常見但容易錯的介系詞
- 口語中常省略的句型
- 看得懂但不會用的時態`
    : `例如：
- は vs が 的差別
- 〜ている 的真正用法
- 初學者常搞錯的助詞
- 聽得懂但說不出來的句型`;

  return `學習者表示不知道今天要學什麼${grammarLang}文法。

請你：
1. 主動推薦 4 個適合${levelDesc}程度的文法主題
2. 每個主題用簡短的一句話說明為什麼適合
3. 使用${responseLang}回答
4. 語氣要親切、鼓勵

${examples}

請以以下格式回答：
「沒問題！這裡有幾個適合${levelDesc}程度的主題，你想從哪個開始？

✅ [主題1] - [簡短說明]
✅ [主題2] - [簡短說明]
✅ [主題3] - [簡短說明]
✅ [主題4] - [簡短說明]

選一個後，我會詳細為你解釋！」

重要：每個主題名稱必須是完整的、可以獨立作為查詢的完整短語，例如：
- 英文：「現在簡單式」、「基本名詞與動詞」（不是「基」或「簡單式」）
- 日文：「は vs が 的差別」、「初學者常搞錯的助詞」（不是「は」或「助詞」）`;
}

/**
 * Mode B: 構建回答提示詞
 */
function buildAnswerPrompt(
  message: string,
  grammarLang: string,
  responseLang: string,
  level: string
): string {
  const levelDesc = grammarLang === "English"
    ? `CEFR ${level} 等級`
    : `JLPT ${level} 等級`;

  // 檢查是否為推薦主題的查詢（通常是簡短的主題名稱）
  const isTopicQuery = message.length < 50 && (
    message.includes("vs") || 
    message.includes("的") || 
    message.includes("用法") || 
    message.includes("助詞") ||
    message.includes("句型") ||
    message.includes("時態") ||
    message.includes("介系詞") ||
    message.includes("名詞") ||
    message.includes("動詞") ||
    message.includes("形容詞") ||
    message.match(/^[はがをにでとからまで]+/) || // 日文助詞開頭
    message.match(/^[A-Za-z\s]+式$/) || // 英文時態結尾
    message.match(/^[A-Za-z\s]+詞$/) // 英文詞類結尾
  );

  const queryContext = isTopicQuery 
    ? `學習者選擇了一個推薦的${grammarLang}文法主題：${message}。請詳細解釋這個主題。`
    : `學習者問了一個${grammarLang}文法問題：${message}`;

  return `${queryContext}

請你使用「黃金教學結構」回答，內容要符合${levelDesc}程度，使用${responseLang}：

📘 文法教學標準格式：

1️⃣ 一句話結論（先給安心感）
👉 [用一句話清楚說明答案]

2️⃣ 使用時機（什麼情境用）
[說明什麼時候使用這個文法]

3️⃣ 對比例（和容易混淆的比）
❌ [錯誤或容易混淆的用法]
✅ [正確的用法]

4️⃣ 例句（至少 2 個）
[例句1]
[例句2]

5️⃣ 小技巧 / 常見錯誤
👉 [記憶小技巧或常見錯誤提醒]

回答要：
- 使用${responseLang}
- 符合${levelDesc}程度
- 結構清晰
- 實用易懂`;
}

/**
 * 解析 AI 回應，提取 Quick Replies
 */
function parseAIResponse(
  response: string,
  mode: string,
  grammarLang: string
): { content: string; quickReplies: string[] } {
  let content = response;
  const quickReplies: string[] = [];

  if (mode === "recommend") {
    // 推薦模式：提取推薦的主題作為 Quick Replies
    const lines = response.split("\n");
    const topics: string[] = [];
    
    lines.forEach((line) => {
      // 匹配 "✅ [主題] - [說明]" 或 "✅ [主題]" 格式
      // 使用更精確的匹配，確保提取完整的主題（包括中文、日文、英文）
      const match = line.match(/✅\s*([^-\n]+?)(?:\s*-\s*[^\n]+)?$/);
      if (match) {
        const topic = match[1].trim();
        // 確保主題不為空且長度合理
        if (topic && topic.length > 0 && topic.length < 100) {
          topics.push(topic);
        }
      }
    });

    if (topics.length > 0) {
      quickReplies.push(...topics);
    } else {
      // 如果沒有找到，嘗試更寬鬆的匹配
      const allLines = response.split("\n");
      allLines.forEach((line) => {
        // 匹配任何包含 ✅ 的行，提取後面的內容直到換行或破折號
        const looseMatch = line.match(/✅\s*(.+?)(?:\s*-\s*|$)/);
        if (looseMatch) {
          const topic = looseMatch[1].trim();
          if (topic && topic.length > 0 && topic.length < 100 && !topics.includes(topic)) {
            topics.push(topic);
          }
        }
      });
      
      if (topics.length > 0) {
        quickReplies.push(...topics);
      } else {
        // 如果還是沒有找到，生成預設的 Quick Replies
        if (grammarLang === "English") {
          quickReplies.push(
            "現在完成式 vs 過去式",
            "常見但容易錯的介系詞",
            "口語中常省略的句型",
            "看得懂但不會用的時態"
          );
        } else {
          quickReplies.push(
            "は vs が 的差別",
            "〜ている 的真正用法",
            "初學者常搞錯的助詞",
            "聽得懂但說不出來的句型"
          );
        }
      }
    }
  } else {
    // 回答模式：生成繼續學習的 Quick Replies
    if (grammarLang === "English") {
      quickReplies.push(
        "再看一個例句",
        "來個小測驗",
        "常見錯誤",
        "跟另一個文法比較",
        "口語怎麼說？",
        "換一個文法"
      );
    } else {
      quickReplies.push(
        "もう一つの例文を見る",
        "小テストをする",
        "よくある間違い",
        "別の文法と比較する",
        "口語ではどう言う？",
        "別の文法に変える"
      );
    }
  }

  return { content, quickReplies };
}

