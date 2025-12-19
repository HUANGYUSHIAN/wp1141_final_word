import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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

    let chats: any[] = [];
    if (user.studentData.chathistory) {
      try {
        chats = JSON.parse(user.studentData.chathistory);
      } catch (e) {
        console.error("Error parsing chathistory JSON:", e);
        chats = [];
      }
    }

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

