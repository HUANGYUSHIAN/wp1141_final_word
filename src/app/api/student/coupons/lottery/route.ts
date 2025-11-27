import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST - 抽獎（消耗點數）
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { points } = body;

    if (!points || points <= 0) {
      return NextResponse.json({ error: "點數必須大於 0" }, { status: 400 });
    }

    const student = user.studentData;

    // 解析遊戲參數
    let gameData: any = {};
    if (student.paraGame) {
      try {
        gameData = JSON.parse(student.paraGame);
      } catch (e) {
        gameData = {};
      }
    }

    const currentPoints = gameData.points || 0;

    if (currentPoints < points) {
      return NextResponse.json({ error: "點數不足" }, { status: 400 });
    }

    // 獲取所有可用的優惠券（未過期且未被該學生擁有）
    const now = new Date();
    const allCoupons = await prisma.coupon.findMany({
      where: {
        period: { gte: now },
      },
    });

    // 過濾掉學生已經擁有的優惠券
    const ownedCouponIds = student.lcouponIDs || [];
    const availableCoupons = allCoupons.filter(
      (c) => !ownedCouponIds.includes(c.couponId)
    );

    if (availableCoupons.length === 0) {
      return NextResponse.json({ error: "目前沒有可用的優惠券" }, { status: 400 });
    }

    // 隨機選擇一個優惠券
    const randomIndex = Math.floor(Math.random() * availableCoupons.length);
    const wonCoupon = availableCoupons[randomIndex];

    // 扣除點數
    gameData.points = currentPoints - points;

    // 將優惠券添加到學生的 lcouponIDs
    const updatedCouponIds = [...ownedCouponIds, wonCoupon.couponId];

    // 更新學生資料
    await prisma.student.update({
      where: { id: student.id },
      data: {
        lcouponIDs: updatedCouponIds,
        paraGame: JSON.stringify(gameData),
      },
    });

    const couponWithDate = {
      ...wonCoupon,
      period: wonCoupon.period.toISOString(),
      createdAt: wonCoupon.createdAt.toISOString(),
    };

    return NextResponse.json({
      coupon: couponWithDate,
      remainingPoints: gameData.points,
    });
  } catch (error: any) {
    console.error("Error in lottery:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

