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

    try {
      const user = await prisma.user.findUnique({
        where: { userId: session.userId },
        include: { studentData: true },
      });

      if (!user || user.dataType !== "Student" || !user.studentData) {
        // 如果不是 Student 或没有 studentData，返回空数组而不是错误
        return NextResponse.json({ chats: [] });
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
    } catch (dbError: any) {
      // 数据库连接错误时，返回空数组而不是错误，避免阻塞前端
      console.error("Database error fetching chat history:", dbError);
      return NextResponse.json({ chats: [] });
    }
  } catch (error: any) {
    console.error("Error fetching chat history:", error);
    // 任何其他错误也返回空数组，避免阻塞前端
    return NextResponse.json({ chats: [] });
  }
}

