import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getPublicVocabularyIds } from "@/lib/publicVocabularyList";

// GET - 瀏覽所有單字本，支援過濾
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = page * limit;

    const name = searchParams.get("name");
    const langUseParams = searchParams.getAll("langUse");
    const langExpParams = searchParams.getAll("langExp");

    // 獲取 student 資料，包含 lvocabuIDs
    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { studentData: true },
    });

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const lvocabuIDs = user.studentData.lvocabuIDs || [];

    // 獲取所有公開單字本的 ID 列表
    const publicVocabularyIds = await getPublicVocabularyIds();

    if (publicVocabularyIds.length === 0) {
      return NextResponse.json({
        vocabularies: [],
        total: 0,
        page,
        limit,
      });
    }

    // 構建過濾條件
    // 使用 public_Vocabulary 列表來查詢
    const where: any = {
      vocabularyId: {
        in: publicVocabularyIds,
      },
    };

    // 只有在有設定 filter 時才排除自己建立的單字本
    // 這樣可以讓用戶看到自己建立的公開單字本
    const hasFilter = name || langUseParams.length > 0 || langExpParams.length > 0;
    if (hasFilter) {
      // 排除自己建立的單字本（因為在瀏覽時，自己的單字本應該在"我的單字本"中）
      where.establisher = {
        not: session.userId,
      };
    }

    // Name 過濾（部分匹配）
    if (name) {
      // Prisma 的 contains 在 MongoDB 中會轉換為正則表達式
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
          isInMyList: lvocabuIDs.includes(v.vocabularyId), // 標記是否已在列表中
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
    console.error("Error browsing vocabularies:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

