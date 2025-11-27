import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取學生擁有的優惠券列表
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
    const couponIds = student.lcouponIDs || [];

    // 獲取所有優惠券
    const coupons = await prisma.coupon.findMany({
      where: {
        couponId: { in: couponIds },
      },
      orderBy: { createdAt: "desc" },
    });

    const couponsWithDate = coupons.map((c: any) => ({
      ...c,
      period: c.period.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({
      coupons: couponsWithDate,
    });
  } catch (error: any) {
    console.error("Error fetching student coupons:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

