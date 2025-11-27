import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 瀏覽所有可用的優惠券（用於抽獎）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為學生
    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { studentData: true },
    });

    if (!user || user.dataType !== "Student" || !user.studentData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const student = user.studentData;
    const ownedCouponIds = student.lcouponIDs || [];

    // 獲取所有未過期的優惠券
    const now = new Date();
    const allCoupons = await prisma.coupon.findMany({
      where: {
        period: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    // 標記哪些是已擁有的
    const couponsWithStatus = allCoupons.map((c: any) => ({
      ...c,
      period: c.period.toISOString(),
      createdAt: c.createdAt.toISOString(),
      isOwned: ownedCouponIds.includes(c.couponId),
    }));

    return NextResponse.json({
      coupons: couponsWithStatus,
    });
  } catch (error: any) {
    console.error("Error browsing coupons:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

