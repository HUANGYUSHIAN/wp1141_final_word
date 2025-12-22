import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取遊戲參數
export async function GET() {
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

    // 獲取系統參數
    let sysPara = await prisma.sys_para.findFirst();

    if (!sysPara) {
      // 創建默認值
      const defaultGameParams = {
        lottery: {
          options: [
            { points: 50, winRate: 0.05 },
            { points: 100, winRate: 0.10 },
            { points: 200, winRate: 0.30 },
          ],
          defaultPoints: 50,
          defaultWinRate: 0.05,
        },
        wordle: {
          winPoints: 10,
          losePoints: 0,
        },
        snake: {
          pointsPerRound: 10,
          maxPointsPerGame: null,
          gridWidth: 30,
          gridHeight: 15,
        },
        aiKing: {
          aiMinTime: 2,
          aiMaxTime: 5,
          aiCorrectRate: 0.9,
          totalQuestions: 10,
          scoreMultiplier: 1,
        },
        test: {
          pointsPerCorrect: 10,
        },
        default: {
          basePointsMultiplier: 10,
          timeBonusEnabled: true,
          timeBonusThreshold: 10,
          timeBonusMultiplier: 2,
        },
      };

      sysPara = await prisma.sys_para.create({
        data: {
          LLM_quota: 0.005,
          new_points: 100,
          gameParams: JSON.stringify(defaultGameParams),
        },
      });
    }

    // 解析 gameParams
    let gameParams = {};
    if (sysPara.gameParams) {
      try {
        gameParams = JSON.parse(sysPara.gameParams);
      } catch (e) {
        gameParams = {};
      }
    }

    return NextResponse.json({
      gameParams: gameParams,
      new_points: sysPara.new_points,
    });
  } catch (error: any) {
    console.error("Error fetching game parameters:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// PUT - 更新遊戲參數
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { gameParams, new_points } = body;

    // 獲取或創建系統參數
    let sysPara = await prisma.sys_para.findFirst();

    const updateData: any = {};
    if (gameParams !== undefined) {
      updateData.gameParams = JSON.stringify(gameParams);
    }
    if (new_points !== undefined) {
      updateData.new_points = new_points;
    }

    if (!sysPara) {
      sysPara = await prisma.sys_para.create({
        data: {
          LLM_quota: 0.005,
          new_points: new_points || 100,
          gameParams: gameParams ? JSON.stringify(gameParams) : null,
        },
      });
    } else {
      sysPara = await prisma.sys_para.update({
        where: { id: sysPara.id },
        data: updateData,
      });
    }

    // 解析返回的 gameParams
    let parsedGameParams = {};
    if (sysPara.gameParams) {
      try {
        parsedGameParams = JSON.parse(sysPara.gameParams);
      } catch (e) {
        parsedGameParams = {};
      }
    }

    return NextResponse.json({
      gameParams: parsedGameParams,
      new_points: sysPara.new_points,
    });
  } catch (error: any) {
    console.error("Error updating game parameters:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

