import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT - 更新單字本
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vocabularyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為管理員
    const admin = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { adminData: true },
    });

    if (!admin || admin.dataType !== "Admin" || !admin.adminData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const { vocabularyId } = await params;
    const body = await request.json();
    const { name, langUse, langExp, copyrights, establisher, public: isPublic } = body;

    // 獲取當前單字本狀態
    const currentVocabulary = await prisma.vocabulary.findUnique({
      where: { vocabularyId },
    });

    if (!currentVocabulary) {
      return NextResponse.json({ error: "找不到單字本" }, { status: 404 });
    }

    const oldPublicStatus = currentVocabulary.public !== undefined ? currentVocabulary.public : true;
    const newPublicStatus = isPublic !== undefined ? isPublic : true;

    const vocabulary = await prisma.vocabulary.update({
      where: { vocabularyId },
      data: {
        name,
        langUse,
        langExp,
        copyrights: copyrights || null,
        establisher,
        public: newPublicStatus,
      },
    });

    // 同步更新 public_Vocabulary 列表
    if (oldPublicStatus !== newPublicStatus) {
      const { addToPublicVocabularyList, removeFromPublicVocabularyList } = await import("@/lib/publicVocabularyList");
      if (newPublicStatus) {
        await addToPublicVocabularyList(vocabularyId);
      } else {
        await removeFromPublicVocabularyList(vocabularyId);
      }
    }

    return NextResponse.json({ vocabulary });
  } catch (error: any) {
    console.error("Error updating vocabulary:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// DELETE - 刪除單字本
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vocabularyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為管理員
    const admin = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { adminData: true },
    });

    if (!admin || admin.dataType !== "Admin" || !admin.adminData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const { vocabularyId } = await params;

    await prisma.vocabulary.delete({
      where: { vocabularyId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting vocabulary:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

