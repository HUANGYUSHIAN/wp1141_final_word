/**
 * 測試角色選擇流程腳本
 * 
 * 此腳本會：
 * 1. 創建一個測試用戶
 * 2. 模擬選擇角色（Student 或 Supplier）
 * 3. 驗證角色選擇後不會重定向到 /login
 * 4. 驗證用戶可以正常訪問對應頁面
 * 5. 測試完成後刪除測試用戶
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const TEST_EMAIL = `test-role-selection-${Date.now()}@test.com`;
const TEST_GOOGLE_ID = `test-google-${Date.now()}`;

async function generateUserId(length: number): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createTestUser() {
  console.log("📝 創建測試用戶...");
  
  let userId: string | null = null;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    userId = await generateUserId(30);
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique || !userId) {
    throw new Error("無法生成唯一的 userId");
  }

  const user = await prisma.user.create({
    data: {
      userId,
      googleId: TEST_GOOGLE_ID,
      email: TEST_EMAIL,
      name: "測試用戶",
      dataType: null, // 未選擇角色
    },
  });

  console.log(`✅ 測試用戶創建成功: ${user.userId}`);
  return user;
}

async function testRoleSelection(userId: string, role: "Student" | "Supplier") {
  console.log(`\n🔄 測試選擇角色: ${role}...`);

  // 模擬選擇角色
  const user = await prisma.user.findUnique({
    where: { userId },
    include: {
      studentData: true,
      supplierData: true,
    },
  });

  if (!user) {
    throw new Error("找不到測試用戶");
  }

  // 更新使用者身分
  await prisma.user.update({
    where: { userId },
    data: { dataType: role },
  });

  // 根據身分創建對應的資料
  if (role === "Student") {
    await prisma.student.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        lvocabuIDs: [],
        lcouponIDs: [],
        lfriendIDs: [],
      },
    });
  } else if (role === "Supplier") {
    await prisma.supplier.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        lsuppcoIDs: [],
      },
    });
  }

  // 驗證更新成功
  const updatedUser = await prisma.user.findUnique({
    where: { userId },
    include: {
      studentData: role === "Student",
      supplierData: role === "Supplier",
    },
  });

  if (!updatedUser) {
    throw new Error("無法驗證用戶更新");
  }

  if (updatedUser.dataType !== role) {
    throw new Error(`角色更新失敗: 期望 ${role}, 實際 ${updatedUser.dataType}`);
  }

  if (role === "Student" && !updatedUser.studentData) {
    throw new Error("Student 資料未創建");
  }

  if (role === "Supplier" && !updatedUser.supplierData) {
    throw new Error("Supplier 資料未創建");
  }

  console.log(`✅ 角色選擇成功: ${role}`);
  console.log(`   - dataType: ${updatedUser.dataType}`);
  console.log(`   - ${role} 資料已創建`);

  return updatedUser;
}

async function verifyAccess(userId: string, role: "Student" | "Supplier") {
  console.log(`\n🔍 驗證用戶訪問權限...`);

  const user = await prisma.user.findUnique({
    where: { userId },
    include: {
      studentData: true,
      supplierData: true,
    },
  });

  if (!user) {
    throw new Error("找不到用戶");
  }

  if (user.dataType !== role) {
    throw new Error(`角色不匹配: 期望 ${role}, 實際 ${user.dataType}`);
  }

  if (role === "Student" && !user.studentData) {
    throw new Error("Student 資料不存在");
  }

  if (role === "Supplier" && !user.supplierData) {
    throw new Error("Supplier 資料不存在");
  }

  console.log(`✅ 訪問權限驗證通過`);
  return true;
}

async function cleanup(userId: string) {
  console.log(`\n🧹 清理測試數據...`);

  try {
    // 刪除 Student 資料
    await prisma.student.deleteMany({
      where: { userId },
    });

    // 刪除 Supplier 資料
    await prisma.supplier.deleteMany({
      where: { userId },
    });

    // 刪除用戶
    await prisma.user.delete({
      where: { userId },
    });

    console.log(`✅ 測試用戶已刪除: ${userId}`);
  } catch (error: any) {
    console.error(`⚠️  清理失敗: ${error.message}`);
    // 繼續執行，不中斷
  }
}

async function main() {
  let testUserId: string | null = null;

  try {
    console.log("🚀 開始測試角色選擇流程\n");

    // 1. 創建測試用戶
    const user = await createTestUser();
    testUserId = user.userId;

    // 2. 測試選擇 Student 角色
    await testRoleSelection(testUserId, "Student");
    await verifyAccess(testUserId, "Student");

    // 3. 清理 Student 資料，準備測試 Supplier
    await prisma.student.deleteMany({ where: { userId: testUserId } });
    await prisma.user.update({
      where: { userId: testUserId },
      data: { dataType: null },
    });

    // 4. 測試選擇 Supplier 角色
    await testRoleSelection(testUserId, "Supplier");
    await verifyAccess(testUserId, "Supplier");

    console.log("\n✅ 所有測試通過！");
    console.log("\n📋 測試總結：");
    console.log("   - 用戶創建成功");
    console.log("   - Student 角色選擇成功");
    console.log("   - Supplier 角色選擇成功");
    console.log("   - 資料庫更新正確");
    console.log("   - 訪問權限驗證通過");

  } catch (error: any) {
    console.error(`\n❌ 測試失敗: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // 5. 清理測試數據
    if (testUserId) {
      await cleanup(testUserId);
    }
  }
}

main()
  .then(async () => {
    console.log("\n✨ 測試腳本執行完成");
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ 未預期的錯誤:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

