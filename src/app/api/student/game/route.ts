import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取遊戲狀態和點數
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

    // 解析遊戲參數
    let gameData: any = {};
    if (student.paraGame) {
      try {
        gameData = JSON.parse(student.paraGame);
      } catch (e) {
        gameData = {};
      }
    }

    return NextResponse.json({
      points: gameData.points || 0,
      gameData: gameData,
    });
  } catch (error: any) {
    console.error("Error fetching game data:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST - 保存遊戲結果和更新點數
export async function POST(request: Request) {
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
    const { accuracy, totalTime, questionCount, correctCount, earnedPoints: providedEarnedPoints } = body;

    if (accuracy === undefined || totalTime === undefined || questionCount === undefined) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const student = user.studentData;

    // 解析現有遊戲參數
    let gameData: any = {};
    if (student.paraGame) {
      try {
        gameData = JSON.parse(student.paraGame);
      } catch (e) {
        gameData = {};
      }
    }

    // 計算點數
    // 如果提供了 earnedPoints，直接使用（例如 Wordle 遊戲固定 100 點）
    // 否則根據 accuracy 和時間計算
    let earnedPoints: number;
    if (providedEarnedPoints !== undefined) {
      earnedPoints = providedEarnedPoints;
    } else {
      // 基礎點數：答對率 * 10
      // 時間獎勵：如果平均答題時間 < 10秒，額外加分
      const basePoints = Math.round(accuracy * 10);
      const averageTime = questionCount > 0 ? totalTime / questionCount / 1000 : 0; // 轉換為秒
      const timeBonus = averageTime < 10 ? Math.round((10 - averageTime) * 2) : 0;
      earnedPoints = basePoints + timeBonus;
    }

    // 更新點數
    const currentPoints = gameData.points || 0;
    gameData.points = currentPoints + earnedPoints;

    // 保存遊戲記錄
    if (!gameData.gameHistory) {
      gameData.gameHistory = [];
    }
    gameData.gameHistory.push({
      accuracy,
      totalTime,
      questionCount,
      correctCount,
      earnedPoints,
      timestamp: new Date().toISOString(),
    });

    // 只保留最近 50 筆記錄
    if (gameData.gameHistory.length > 50) {
      gameData.gameHistory = gameData.gameHistory.slice(-50);
    }

    // 更新統計
    gameData.totalGames = (gameData.totalGames || 0) + 1;
    gameData.totalPoints = gameData.points;

    // 保存到資料庫
    await prisma.student.update({
      where: { id: student.id },
      data: {
        paraGame: JSON.stringify(gameData),
      },
    });

    return NextResponse.json({
      earnedPoints,
      totalPoints: gameData.points,
      gameData: gameData,
    });
  } catch (error: any) {
    console.error("Error saving game data:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

