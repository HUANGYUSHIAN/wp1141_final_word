import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - 獲取遊戲參數（供遊戲組件使用）
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 獲取系統參數
    let sysPara = await prisma.sys_para.findFirst();

    if (!sysPara) {
      // 返回默認值
      return NextResponse.json({
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
      });
    }

    // 解析 gameParams
    let gameParams: any = {};
    if (sysPara.gameParams) {
      try {
        gameParams = JSON.parse(sysPara.gameParams);
      } catch (e) {
        gameParams = {};
      }
    }

    // 返回遊戲參數（只返回遊戲相關的，不包含 lottery）
    return NextResponse.json({
      wordle: gameParams.wordle || {
        winPoints: 10,
        losePoints: 0,
      },
      snake: gameParams.snake || {
        pointsPerRound: 10,
        maxPointsPerGame: null,
        gridWidth: 30,
        gridHeight: 15,
      },
      aiKing: gameParams.aiKing || {
        aiMinTime: 2,
        aiMaxTime: 5,
        aiCorrectRate: 0.9,
        totalQuestions: 10,
        scoreMultiplier: 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching game parameters:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

