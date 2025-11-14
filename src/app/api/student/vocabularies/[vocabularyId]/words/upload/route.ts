import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function ensureStudent(userId: string) {
  return prisma.user.findUnique({
    where: { userId },
    include: { studentData: true },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vocabularyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const user = await ensureStudent(session.userId);

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

    if (vocabulary.establisher !== session.userId) {
      return NextResponse.json({ error: "僅有建立者可上傳" }, { status: 403 });
    }

    const body = await request.json();
    const { words } = body;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "無效的單字資料" }, { status: 400 });
    }

    const useLocalDb = process.env.DATABASE_local === "true";
    const vocabId = useLocalDb ? vocabularyId : (vocabulary as any).id;

    const wordData = words.map((word: any) => ({
      vocabularyId: vocabId,
      word: word.word,
      spelling: word.spelling || null,
      explanation: word.explanation,
      partOfSpeech: word.partOfSpeech || null,
      sentence: word.sentence || null,
    }));

    await prisma.word.createMany({ data: wordData });

    return NextResponse.json({ success: true, count: words.length });
  } catch (error) {
    console.error("Error uploading student vocabulary words:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}


