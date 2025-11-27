/**
 * Script to add points to a student account
 * Usage: npx tsx scripts/add-points.ts <userId> <points>
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { initLocalDb } from "../src/lib/local-db";

dotenv.config();

const useLocalDb = process.env.DATABASE_local === "true";

// 本地資料庫路徑
const DB_DIR = path.join(process.cwd(), ".local-db");
const STUDENTS_FILE = path.join(DB_DIR, "students.json");

// 初始化本地資料庫
if (useLocalDb) {
  initLocalDb();
}

// 根據環境選擇使用本地或 MongoDB
let prisma: any;

if (useLocalDb) {
  // 本地資料庫操作
  prisma = {
    student: {
      findUnique: async (where: { userId: string }) => {
        const students = JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf-8"));
        const student = students.find((s: any) => s.userId === where.userId);
        return student || null;
      },
      update: async (where: { userId: string }, data: any) => {
        const students = JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf-8"));
        const index = students.findIndex((s: any) => s.userId === where.userId);
        if (index === -1) {
          throw new Error("Student not found");
        }
        students[index] = {
          ...students[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf-8");
        return students[index];
      },
    },
    $disconnect: async () => {},
  };
} else {
  // MongoDB
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
}

async function addPoints(userId: string, points: number) {
  try {
    // 查找學生
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      console.error(`❌ 找不到 userId 為 "${userId}" 的學生帳號`);
      console.log("請確認該用戶已選擇 Student 角色");
      process.exit(1);
    }

    // 解析現有遊戲參數
    let gameData: any = {};
    if (student.paraGame) {
      try {
        gameData = JSON.parse(student.paraGame);
      } catch (e) {
        gameData = {};
      }
    }

    // 獲取當前點數
    const currentPoints = gameData.points || 0;
    const newPoints = currentPoints + points;

    // 更新點數
    gameData.points = newPoints;

    // 更新資料庫
    await prisma.student.update({
      where: { userId },
      data: {
        paraGame: JSON.stringify(gameData),
      },
    });

    console.log("\n✅ 點數增加成功！");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`User ID: ${userId}`);
    console.log(`原有點數: ${currentPoints}`);
    console.log(`增加點數: +${points}`);
    console.log(`目前點數: ${newPoints}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error: any) {
    console.error("❌ 增加點數失敗:", error.message);
    process.exit(1);
  } finally {
    if (!useLocalDb && prisma.$disconnect) {
      await prisma.$disconnect();
    }
  }
}

// 從命令行參數獲取 userId 和 points
const args = process.argv.slice(2);
const userId = args[0];
const points = parseInt(args[1] || "0", 10);

if (!userId) {
  console.error("❌ 請提供 userId");
  console.log("使用方法: npx tsx scripts/add-points.ts <userId> <points>");
  process.exit(1);
}

if (isNaN(points) || points <= 0) {
  console.error("❌ 請提供有效的點數（必須是大於 0 的數字）");
  console.log("使用方法: npx tsx scripts/add-points.ts <userId> <points>");
  process.exit(1);
}

addPoints(userId, points);

