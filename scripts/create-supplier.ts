/**
 * Script to create a supplier account for testing
 * Usage: npx tsx scripts/create-supplier.ts [name] [email]
 * 
 * This script creates a new user account with Supplier role.
 * You can use the returned userId to login via test login.
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { initLocalDb } from "../src/lib/local-db";

dotenv.config();

const useLocalDb = process.env.DATABASE_local === "true";

// 本地資料庫路徑
const DB_DIR = path.join(process.cwd(), ".local-db");
const USERS_FILE = path.join(DB_DIR, "users.json");
const SUPPLIERS_FILE = path.join(DB_DIR, "suppliers.json");

// 初始化本地資料庫
if (useLocalDb) {
  initLocalDb();
}

// 根據環境選擇使用本地或 MongoDB
let prisma: any;

if (useLocalDb) {
  // 本地資料庫操作
  prisma = {
    user: {
      findUnique: async (where: { userId?: string; googleId?: string }) => {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
        if (where.userId) {
          const user = users.find((u: any) => {
            const userId = u.userId || (u.data && u.data.userId);
            return userId === where.userId;
          });
          if (!user) return null;
          if (user.data) {
            return { ...user, ...user.data };
          }
          return user;
        }
        if (where.googleId) {
          const user = users.find((u: any) => {
            const googleId = u.googleId || (u.data && u.data.googleId);
            return googleId === where.googleId;
          });
          if (!user) return null;
          if (user.data) {
            return { ...user, ...user.data };
          }
          return user;
        }
        return null;
      },
      create: async (data: any) => {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
        const newUser = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          userId: data.userId,
          googleId: data.googleId || null,
          name: data.name || null,
          email: data.email || null,
          image: data.image || null,
          phoneNumber: data.phoneNumber || null,
          birthday: data.birthday || null,
          language: data.language || null,
          isLock: data.isLock || false,
          dataType: data.dataType || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
        return newUser;
      },
    },
    supplier: {
      create: async (data: any) => {
        const suppliers = JSON.parse(fs.readFileSync(SUPPLIERS_FILE, "utf-8"));
        const newSupplier = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        suppliers.push(newSupplier);
        fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(suppliers, null, 2), "utf-8");
        return newSupplier;
      },
    },
    $disconnect: async () => {},
  };
} else {
  // MongoDB
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
}

function generateUserId(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createSupplier() {
  const args = process.argv.slice(2);
  const name = args[0] || "Supplier User";
  const email = args[1] || `supplier${Date.now()}@example.com`;

  // 生成唯一的userId
  let userId: string;
  let isUnique = false;

  while (!isUnique) {
    userId = generateUserId(30);
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });
    if (!existingUser) {
      isUnique = true;
    }
  }

  try {
    // 生成唯一的測試用 googleId（避免唯一約束問題）
    let testGoogleId: string;
    let isGoogleIdUnique = false;
    
    while (!isGoogleIdUnique) {
      testGoogleId = `test_${generateUserId(25)}`;
      const existingUser = await prisma.user.findUnique({
        where: { googleId: testGoogleId },
      });
      if (!existingUser) {
        isGoogleIdUnique = true;
      }
    }

    // 創建用戶
    const user = await prisma.user.create({
      data: {
        userId: userId!,
        name,
        email,
        dataType: "Supplier",
        googleId: testGoogleId!, // 使用唯一的測試 Google ID
      },
    });

    // 創建 Supplier 資料
    const supplier = await prisma.supplier.create({
      data: {
        userId: userId!,
        lsuppcoIDs: [],
      },
    });

    // 確保 user 對象有正確的屬性
    const userDisplay = {
      userId: user.userId || userId!,
      name: user.name || name,
      email: user.email || email,
      createdAt: user.createdAt || new Date().toISOString(),
    };

    console.log("\n✅ 供應商帳號創建成功！");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`User ID: ${userDisplay.userId}`);
    console.log(`Name: ${userDisplay.name}`);
    console.log(`Email: ${userDisplay.email}`);
    console.log(`Role: Supplier`);
    console.log(`Created At: ${userDisplay.createdAt}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📝 使用方式：");
    console.log(`   1. 前往登入頁面: http://localhost:3000/login`);
    console.log(`   2. 選擇「測試登入」`);
    console.log(`   3. 輸入 User ID: ${userDisplay.userId}`);
    console.log(`   4. 登入後即可進入 /supplier 供應商後台`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  重要：請複製並保存以下 User ID，用於測試登入：");
    console.log(`\n   ${userDisplay.userId}\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error: any) {
    console.error("❌ 創建供應商帳號失敗:", error);
    process.exit(1);
  } finally {
    if (!useLocalDb && prisma.$disconnect) {
      await prisma.$disconnect();
    }
  }
}

createSupplier();

