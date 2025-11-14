import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { encode, decode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const MIN_LENGTH = 5;
const USER_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID 不可為空" }, { status: 400 });
    }

    const trimmed = userId.trim();

    if (trimmed.length < MIN_LENGTH) {
      return NextResponse.json({ error: `User ID 至少需要 ${MIN_LENGTH} 個字元` }, { status: 400 });
    }

    if (!USER_ID_PATTERN.test(trimmed)) {
      return NextResponse.json({ error: "User ID 只能包含英文、數字、底線或連字號" }, { status: 400 });
    }

    // 檢查是否已存在相同 userId
    const existing = await prisma.user.findUnique({
      where: { userId: trimmed },
      select: { userId: true },
    });

    if (existing && existing.userId !== session.userId) {
      return NextResponse.json({ error: "User ID 已被使用" }, { status: 409 });
    }

    if (trimmed === session.userId) {
      // 只需標記為已確認
      await prisma.user.update({
        where: { userId: session.userId },
        data: { isUserIdConfirmed: true },
      });

      const response = NextResponse.json({ success: true, userId: trimmed, unchanged: true });
      await refreshSessionToken(trimmed, response);
      return response;
    }

    // 更新 userId 以及相關資料
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userId: session.userId },
        data: {
          userId: trimmed,
          isUserIdConfirmed: true,
        },
      });

      await tx.student.updateMany({
        where: { userId: session.userId },
        data: { userId: trimmed },
      });

      await tx.supplier.updateMany({
        where: { userId: session.userId },
        data: { userId: trimmed },
      });

      await tx.admin.updateMany({
        where: { userId: session.userId },
        data: { userId: trimmed },
      });
    });

    const response = NextResponse.json({ success: true, userId: trimmed });
    await refreshSessionToken(trimmed, response);
    return response;
  } catch (error: any) {
    console.error("Error setting userId:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

async function refreshSessionToken(newUserId: string, response: NextResponse) {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn("NEXTAUTH_SECRET 未設定，無法更新 session token");
      return;
    }

    const cookieStore = cookies();
    const sessionCookie = authOptions.cookies?.sessionToken;
    const cookieName =
      sessionCookie?.name ||
      (process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token");

    const existingToken = cookieStore.get(cookieName)?.value;
    if (!existingToken) {
      console.warn("找不到 session token cookie，無法更新 userId");
      return;
    }

    const decoded = await decode({
      token: existingToken,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!decoded) {
      console.warn("無法解碼 session token");
      return;
    }

    decoded.userId = newUserId;
    decoded.sub = newUserId;

    const maxAge = authOptions.session?.maxAge ?? 30 * 24 * 60 * 60;
    const newToken = await encode({
      token: decoded,
      secret: process.env.NEXTAUTH_SECRET,
      maxAge,
    });

    response.cookies.set(cookieName, newToken, {
      ...(sessionCookie?.options || {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }),
      maxAge,
    });
  } catch (error) {
    console.error("Failed to refresh session token:", error);
  }
}


