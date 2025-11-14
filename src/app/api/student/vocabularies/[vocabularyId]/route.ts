import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getStudent(userId: string) {
  return prisma.user.findUnique({
    where: { userId },
    include: { studentData: true },
  });
}

export async function DELETE(
  request: Request,
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

    if (vocabulary.establisher !== session.userId) {
      return NextResponse.json({ error: "僅能刪除自己建立的單字本" }, { status: 403 });
    }

    const useLocalDb = process.env.DATABASE_local === "true";
    const vocabId = useLocalDb ? vocabularyId : (vocabulary as any).id;

    await prisma.$transaction(async (tx) => {
      await tx.word.deleteMany({
        where: { vocabularyId: vocabId },
      });

      await tx.vocabulary.delete({
        where: { vocabularyId },
      });

      if (user.studentData?.lvocabuIDs?.includes(vocabularyId)) {
        await tx.student.update({
          where: { userId: session.userId },
          data: {
            lvocabuIDs: (user.studentData.lvocabuIDs || []).filter(
              (id) => id !== vocabularyId
            ),
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student vocabulary:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}


