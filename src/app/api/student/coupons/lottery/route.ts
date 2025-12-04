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
      (c: { couponId: string }) => !ownedCouponIds.includes(c.couponId)
    );

    // 根據點數設定中獎率
    let winRate: number;
    if (points === 50) {
      winRate = 0.05; // 5%
    } else if (points === 100) {
      winRate = 0.10; // 10%
    } else if (points === 200) {
      winRate = 0.30; // 30%
    } else {
      // 預設中獎率（如果點數不符合上述值）
      winRate = 0.05;
    }

    // 扣除點數（無論是否中獎都要扣除）
    gameData.points = currentPoints - points;

    // 決定是否中獎
    const randomValue = Math.random();
    const won = randomValue < winRate;

    if (won) {
      // 中獎：需要檢查是否有可用的優惠券
      if (availableCoupons.length === 0) {
        // 即使中獎但沒有可用優惠券，也要扣除點數
        await prisma.student.update({
          where: { id: student.id },
          data: {
            paraGame: JSON.stringify(gameData),
          },
        });
        return NextResponse.json({ error: "恭喜中獎！但目前沒有可用的優惠券，點數已扣除" }, { status: 400 });
      }

      // 隨機選擇一個優惠券
      const randomIndex = Math.floor(Math.random() * availableCoupons.length);
      const wonCoupon = availableCoupons[randomIndex];

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
        won: true,
      });
    } else {
      // 未中獎：只扣除點數，不給優惠券
      await prisma.student.update({
        where: { id: student.id },
        data: {
          paraGame: JSON.stringify(gameData),
        },
      });

      return NextResponse.json({
        coupon: null,
        remainingPoints: gameData.points,
        won: false,
        message: "很遺憾，這次沒有中獎，請再試試！",
      });
    }
  } catch (error: any) {
    console.error("Error in lottery:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

