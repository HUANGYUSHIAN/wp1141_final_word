import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getStudent(userId: string) {
  return prisma.user.findUnique({
    where: { userId },
    include: { studentData: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vocabularyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const user = await getStudent(session.userId);

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "僅限學生使用" }, { status: 403 });
    }

    const { vocabularyId } = await params;
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { vocabularyId },
    });

    if (!vocabulary) {
      return NextResponse.json({ error: "找不到單字本" }, { status: 404 });
    }

    const isOwned = vocabulary.establisher === session.userId;
    const isFavorite = (user.studentData.lvocabuIDs || []).includes(
      vocabularyId
    );

    if (!isOwned && !isFavorite) {
      return NextResponse.json({ error: "無權限查看" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = page * limit;

    const useLocalDb = process.env.DATABASE_local === "true";
    const vocabularyFilter = {
      vocabularyId: useLocalDb ? vocabularyId : (vocabulary as any).id,
    };

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where: vocabularyFilter,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.word.count({
        where: vocabularyFilter,
      }),
    ]);

    return NextResponse.json({
      words,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching student vocabulary words:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}


