import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateUserId } from "@/lib/utils";
import { addToPublicVocabularyList } from "@/lib/publicVocabularyList";

// GET - 獲取當前 student 的單字本列表（包括自己建立的和加入的）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 獲取 student 資料，包含 lvocabuIDs
    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { studentData: true },
    });

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = page * limit;

    // 獲取所有在 lvocabuIDs 中的單字本（包括自己建立的和加入的）
    const lvocabuIDs = user.studentData.lvocabuIDs || [];

    if (lvocabuIDs.length === 0) {
      return NextResponse.json({
        vocabularies: [],
        total: 0,
        page,
        limit,
      });
    }

    // 構建過濾條件
    const name = searchParams.get("name");
    const langUseParams = searchParams.getAll("langUse");
    const langExpParams = searchParams.getAll("langExp");

    const where: any = {
      vocabularyId: {
        in: lvocabuIDs,
      },
    };

    // Name 過濾（部分匹配）
    if (name) {
      where.name = {
        contains: name,
      };
    }

    // LangUse 過濾（支援多選）
    if (langUseParams.length > 0) {
      where.langUse = {
        in: langUseParams,
      };
    }

    // LangExp 過濾（支援多選）
    if (langExpParams.length > 0) {
      where.langExp = {
        in: langExpParams,
      };
    }

    const vocabularies = await prisma.vocabulary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.vocabulary.count({ where });

    // 直接使用 word.count 獲取每個單字本的單字數（更可靠）
    const useLocalDb = process.env.DATABASE_local === "true";
    const vocabulariesWithCount = await Promise.all(
      vocabularies.map(async (v: any) => {
        const vocabId = useLocalDb ? v.vocabularyId : v.id;
        const wordCount = await prisma.word.count({
          where: { vocabularyId: vocabId },
        });
        return {
          vocabularyId: v.vocabularyId,
          name: v.name,
          langUse: v.langUse,
          langExp: v.langExp,
          copyrights: v.copyrights,
          establisher: v.establisher,
          wordCount: wordCount,
          public: v.public !== undefined ? v.public : true,
          createdAt: typeof v.createdAt === "string" ? v.createdAt : v.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      vocabularies: vocabulariesWithCount,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Error fetching vocabularies:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST - 建立新單字本
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { studentData: true },
    });

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const body = await request.json();
    const { name, langUse, langExp, public: isPublic, words } = body;

    if (!name || !langUse || !langExp || !words || !Array.isArray(words)) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    if (words.length === 0) {
      return NextResponse.json({ error: "單字本至少需要一個單字" }, { status: 400 });
    }

    if (words.length > 30) {
      return NextResponse.json({ error: "單字本最多只能有 30 個單字" }, { status: 400 });
    }

    // 驗證所有單字格式
    const errors: string[] = [];
    words.forEach((word: any, index: number) => {
      if (!word.word || word.word.trim() === "") {
        errors.push(`第 ${index + 1} 個單字：Word.word 不能為空`);
      }
      if (!word.explanation || word.explanation.trim() === "") {
        errors.push(`第 ${index + 1} 個單字：Word.explanation 不能為空`);
      }
      if (!word.sentence || word.sentence.trim() === "") {
        errors.push(`第 ${index + 1} 個單字：Word.sentence 不能為空`);
      }
      if (word.sentence && !word.sentence.includes("<" + word.word + "<")) {
        errors.push(`第 ${index + 1} 個單字：Word.sentence 必須包含 <${word.word}< 格式`);
      }
      if (langUse === "English") {
        if (word.spelling !== null && word.spelling !== undefined) {
          errors.push(`第 ${index + 1} 個單字：英文的 Word.spelling 必須為 null`);
        }
      } else {
        if (!word.spelling || word.spelling.trim() === "") {
          errors.push(`第 ${index + 1} 個單字：${langUse} 的 Word.spelling 不能為 null`);
        }
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "驗證失敗：\n" + errors.join("\n") },
        { status: 400 }
      );
    }

    // 生成唯一的 vocabularyId
    let vocabularyId: string;
    let isUnique = false;
    while (!isUnique) {
      vocabularyId = generateUserId(30);
      const existing = await prisma.vocabulary.findUnique({
        where: { vocabularyId },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // 創建單字本
    const vocabulary = await prisma.vocabulary.create({
      data: {
        vocabularyId: vocabularyId!,
        name: name.trim(),
        langUse,
        langExp,
        copyrights: null,
        establisher: session.userId,
        public: isPublic !== undefined ? isPublic : true,
      },
    });

    // 創建單字
    const useLocalDb = process.env.DATABASE_local === "true";
    const vocabDbId = useLocalDb ? vocabulary.vocabularyId : vocabulary.id;

    await Promise.all(
      words.map((word: any) =>
        prisma.word.create({
          data: {
            vocabularyId: vocabDbId,
            word: word.word.trim(),
            spelling: word.spelling?.trim() || null,
            explanation: word.explanation.trim(),
            partOfSpeech: word.partOfSpeech?.trim() || null,
            sentence: word.sentence.trim(),
          },
        })
      )
    );

    // 將單字本加入學生列表
    await prisma.student.update({
      where: { userId: session.userId },
      data: {
        lvocabuIDs: { push: vocabulary.vocabularyId },
      },
    });

    // 如果是公開的，加入 public_Vocabulary 列表
    if (isPublic) {
      await addToPublicVocabularyList(vocabulary.vocabularyId);
    }

    return NextResponse.json({
      success: true,
      vocabulary: {
        vocabularyId: vocabulary.vocabularyId,
        name: vocabulary.name,
        wordCount: words.length,
      },
    });
  } catch (error: any) {
    console.error("Error creating vocabulary:", error);
    return NextResponse.json(
      { error: error.message || "建立單字本失敗" },
      { status: 500 }
    );
  }
}

