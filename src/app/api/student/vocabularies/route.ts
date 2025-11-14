import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUserId } from "@/lib/utils";

const DEFAULT_LIMIT = 10;

async function ensureStudent(userId: string) {
  return prisma.user.findUnique({
    where: { userId },
    include: {
      studentData: true,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const user = await ensureStudent(session.userId);

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "僅限學生使用" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(
      searchParams.get("limit") || String(DEFAULT_LIMIT),
      10
    );
    const scope = searchParams.get("scope") || "owned";

    const skip = page * limit;

    const favoriteIds = user.studentData.lvocabuIDs || [];
    let whereClause: any;

    if (scope === "favorites") {
      if (!favoriteIds.length) {
        return NextResponse.json({
          vocabularies: [],
          total: 0,
          page,
          limit,
          scope,
        });
      }
      whereClause = {
        vocabularyId: { in: favoriteIds },
      };
    } else {
      // default owned
      whereClause = { establisher: session.userId };
    }

    const [vocabularies, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { words: true },
          },
        },
      }),
      prisma.vocabulary.count({
        where: whereClause,
      }),
    ]);

    const responseData = vocabularies.map((vocabulary) => ({
      vocabularyId: vocabulary.vocabularyId,
      name: vocabulary.name,
      langUse: vocabulary.langUse,
      langExp: vocabulary.langExp,
      copyrights: vocabulary.copyrights,
      establisher: vocabulary.establisher,
      wordCount: vocabulary._count?.words || 0,
      createdAt:
        typeof vocabulary.createdAt === "string"
          ? vocabulary.createdAt
          : vocabulary.createdAt.toISOString(),
      isOwned: vocabulary.establisher === session.userId,
    }));

    return NextResponse.json({
      vocabularies: responseData,
      total,
      page,
      limit,
      scope,
    });
  } catch (error) {
    console.error("Error fetching student vocabularies:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const user = await ensureStudent(session.userId);

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "僅限學生使用" }, { status: 403 });
    }

    const body = await request.json();
    const { name, langUse, langExp, copyrights } = body;

    if (!name || !langUse || !langExp) {
      return NextResponse.json({ error: "請填寫完整資料" }, { status: 400 });
    }

    // 生成唯一 vocabularyId
    let vocabularyId: string;
    let unique = false;
    while (!unique) {
      vocabularyId = generateUserId(24);
      const existing = await prisma.vocabulary.findUnique({
        where: { vocabularyId },
      });
      if (!existing) {
        unique = true;
      }
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        vocabularyId: vocabularyId!,
        name,
        langUse,
        langExp,
        copyrights: copyrights || null,
        establisher: session.userId,
      },
    });

    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error("Error creating student vocabulary:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}


