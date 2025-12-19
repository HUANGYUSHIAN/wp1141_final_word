import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { studentData: true },
    });

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const body = await request.json();
    const { indices } = body;

    if (!Array.isArray(indices)) {
      return NextResponse.json({ error: "參數格式錯誤" }, { status: 400 });
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

    // 刪除選中的對話（從後往前刪除，避免索引變化）
    const sortedIndices = [...indices].sort((a, b) => b - a);
    sortedIndices.forEach((index) => {
      if (index >= 0 && index < chats.length) {
        chats.splice(index, 1);
      }
    });

    // 儲存到資料庫
    await prisma.student.update({
      where: { userId: session.userId },
      data: {
        chathistory: JSON.stringify(chats),
      },
    });

    return NextResponse.json({ success: true, deletedCount: sortedIndices.length });
  } catch (error: any) {
    console.error("Error deleting chats:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

