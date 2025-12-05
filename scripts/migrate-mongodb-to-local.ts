/**
 * Script to migrate data from MongoDB to local database
 * Usage: npm run db:migrate-to-local
 * 
 * ⚠️  WARNING: This script will overwrite local database files.
 * Make sure you have backed up your local database before running this.
 * 
 * Prerequisites:
 * 1. Set DATABASE_local=false in .env (temporarily)
 * 2. Set DATABASE_URL to your MongoDB connection string
 * 3. Ensure MongoDB is accessible
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const useLocalDb = process.env.DATABASE_local === "true";

if (useLocalDb) {
  console.error("\n❌ 錯誤：請先將 .env 中的 DATABASE_local 設置為 false");
  console.error("   然後設置正確的 DATABASE_URL\n");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("\n❌ 錯誤：DATABASE_URL 未設置");
  console.error("   請在 .env 中設置 DATABASE_URL\n");
  process.exit(1);
}

const DB_DIR = path.join(process.cwd(), ".local-db");
const DB_FILES = {
  users: path.join(DB_DIR, "users.json"),
  students: path.join(DB_DIR, "students.json"),
  suppliers: path.join(DB_DIR, "suppliers.json"),
  admins: path.join(DB_DIR, "admins.json"),
  coupons: path.join(DB_DIR, "coupons.json"),
  vocabularies: path.join(DB_DIR, "vocabularies.json"),
  words: path.join(DB_DIR, "words.json"),
  stores: path.join(DB_DIR, "stores.json"),
  comments: path.join(DB_DIR, "comments.json"),
};

// 確保 .local-db 目錄存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function writeLocalData(filePath: string, data: any[]): void {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, "utf-8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

async function migrateData() {
  const prisma = new PrismaClient();

  try {
    console.log("\n🔄 開始遷移 MongoDB 資料到本地資料庫...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 1. 遷移 Users
    console.log("📦 遷移 Users...");
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.users, users);
    console.log(`   ✅ 已遷移 ${users.length} 筆 Users\n`);

    // 2. 遷移 Students
    console.log("📦 遷移 Students...");
    const students = await prisma.student.findMany({
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.students, students);
    console.log(`   ✅ 已遷移 ${students.length} 筆 Students\n`);

    // 3. 遷移 Suppliers
    console.log("📦 遷移 Suppliers...");
    const suppliers = await prisma.supplier.findMany({
      include: {
        stores: {
          include: {
            lcomments: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.suppliers, suppliers);
    console.log(`   ✅ 已遷移 ${suppliers.length} 筆 Suppliers\n`);

    // 4. 遷移 Admins
    console.log("📦 遷移 Admins...");
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.admins, admins);
    console.log(`   ✅ 已遷移 ${admins.length} 筆 Admins\n`);

    // 5. 遷移 Coupons
    console.log("📦 遷移 Coupons...");
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.coupons, coupons);
    console.log(`   ✅ 已遷移 ${coupons.length} 筆 Coupons\n`);

    // 6. 遷移 Vocabularies
    console.log("📦 遷移 Vocabularies...");
    const vocabularies = await prisma.vocabulary.findMany({
      include: {
        words: true,
      },
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.vocabularies, vocabularies);
    console.log(`   ✅ 已遷移 ${vocabularies.length} 筆 Vocabularies\n`);

    // 7. 遷移 Words
    console.log("📦 遷移 Words...");
    const words = await prisma.word.findMany({
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.words, words);
    console.log(`   ✅ 已遷移 ${words.length} 筆 Words\n`);

    // 8. 遷移 Stores
    console.log("📦 遷移 Stores...");
    const stores = await prisma.store.findMany({
      include: {
        lcomments: true,
      },
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.stores, stores);
    console.log(`   ✅ 已遷移 ${stores.length} 筆 Stores\n`);

    // 9. 遷移 Comments
    console.log("📦 遷移 Comments...");
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "asc" },
    });
    writeLocalData(DB_FILES.comments, comments);
    console.log(`   ✅ 已遷移 ${comments.length} 筆 Comments\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 遷移完成！");
    console.log("\n📝 下一步：");
    console.log("   1. 將 .env 中的 DATABASE_local 設置為 true");
    console.log("   2. 重新啟動應用程式\n");
  } catch (error) {
    console.error("\n❌ 遷移過程中發生錯誤：", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 執行遷移
migrateData()
  .then(() => {
    console.log("✅ 腳本執行完成\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 腳本執行失敗：", error);
    process.exit(1);
  });

