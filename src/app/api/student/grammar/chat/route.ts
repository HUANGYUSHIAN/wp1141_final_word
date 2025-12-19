import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkLLMQuotaExceeded } from "@/lib/checkLLMQuota";

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
    const { message, grammarLang, responseLang } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "訊息格式錯誤" }, { status: 400 });
    }

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

    // AI 回應（目前固定回覆）
    const aiChat: Chat = {
      timestamp: Date.now(),
      content: "grammar功能開發中",
      direction: "ai",
    };
    chats.push(aiChat);

    // 儲存到資料庫
    await prisma.student.update({
      where: { userId: session.userId },
      data: {
        chathistory: JSON.stringify(chats),
      },
    });

    return NextResponse.json({ response: aiChat.content });
  } catch (error: any) {
    console.error("Error processing chat:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

