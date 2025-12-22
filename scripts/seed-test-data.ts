/**
 * Script to seed test data for local development
 * Usage: npm run db:seed-test-data
 * 
 * This script creates:
 * - Test users (Student, Supplier, Admin)
 * - Sample vocabularies with words
 * - Sample coupons
 * - Sample stores
 */

import * as dotenv from "dotenv";
import { prisma } from "../src/lib/prisma";

dotenv.config();

function generateUserId(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateVocabularyId(): string {
  return `vocab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateCouponId(): string {
  return `COUPON_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

async function seedTestData() {
  try {
    console.log("\n🌱 開始建立測試資料...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 1. 建立測試用戶
    console.log("👤 建立測試用戶...");
    
    // 建立學生用戶
    let studentUserId = generateUserId(30);
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.user.findUnique({ where: { userId: studentUserId } });
      if (!existing) {
        isUnique = true;
      } else {
        studentUserId = generateUserId(30);
      }
    }

    const studentUser = await prisma.user.create({
      data: {
        userId: studentUserId,
        name: "測試學生",
        email: "student@test.com",
        dataType: "Student",
      },
    });
    await prisma.student.create({
      data: {
        userId: studentUserId,
        lvocabuIDs: [],
        lcouponIDs: [],
        lfriendIDs: [],
      },
    });
    console.log(`  ✅ 學生用戶: ${studentUserId}`);

    // 建立廠商用戶
    let supplierUserId = generateUserId(30);
    isUnique = false;
    while (!isUnique) {
      const existing = await prisma.user.findUnique({ where: { userId: supplierUserId } });
      if (!existing) {
        isUnique = true;
      } else {
        supplierUserId = generateUserId(30);
      }
    }

    const supplierUser = await prisma.user.create({
      data: {
        userId: supplierUserId,
        name: "測試廠商",
        email: "supplier@test.com",
        dataType: "Supplier",
      },
    });
    const supplier = await prisma.supplier.create({
      data: {
        userId: supplierUserId,
        lsuppcoIDs: [],
        storeName: "五九麵館",
        storeLocation: "106臺北市大安區新生南路三段88之2號",
        storeHours: "週一至週五 11:00-21:00",
        storeWebsite: "https://example.com",
      },
    });
    console.log(`  ✅ 廠商用戶: ${supplierUserId}`);

    // 建立管理員用戶
    let adminUserId = generateUserId(30);
    isUnique = false;
    while (!isUnique) {
      const existing = await prisma.user.findUnique({ where: { userId: adminUserId } });
      if (!existing) {
        isUnique = true;
      } else {
        adminUserId = generateUserId(30);
      }
    }

    const adminUser = await prisma.user.create({
      data: {
        userId: adminUserId,
        name: "測試管理員",
        email: "admin@test.com",
        dataType: "Admin",
      },
    });
    await prisma.admin.create({
      data: {
        userId: adminUserId,
        permissions: [],
      },
    });
    console.log(`  ✅ 管理員用戶: ${adminUserId}\n`);

    // 2. 建立單字本
    console.log("📚 建立單字本...");
    
    const vocabularies = [
      {
        name: "TOEIC 基礎單字",
        langUse: "English",
        langExp: "Traditional Chinese",
        establisher: studentUserId,
        public: true,
        copyrights: "測試用單字本",
        words: [
          { word: "apple", spelling: "ˈæpl", explanation: "蘋果", partOfSpeech: "noun", sentence: "I eat an apple every day." },
          { word: "banana", spelling: "bəˈnænə", explanation: "香蕉", partOfSpeech: "noun", sentence: "Bananas are rich in potassium." },
          { word: "orange", spelling: "ˈɔrɪndʒ", explanation: "橘子", partOfSpeech: "noun", sentence: "I like orange juice." },
          { word: "study", spelling: "ˈstʌdi", explanation: "學習", partOfSpeech: "verb", sentence: "I study English every day." },
          { word: "book", spelling: "bʊk", explanation: "書本", partOfSpeech: "noun", sentence: "This is a good book." },
        ],
      },
      {
        name: "JLPT N5 日文單字",
        langUse: "Japanese",
        langExp: "Traditional Chinese",
        establisher: studentUserId,
        public: true,
        copyrights: "測試用單字本",
        words: [
          { word: "りんご", spelling: null, explanation: "蘋果", partOfSpeech: "名詞", sentence: "りんごを食べます。" },
          { word: "本", spelling: "ほん", explanation: "書本", partOfSpeech: "名詞", sentence: "これは本です。" },
          { word: "勉強", spelling: "べんきょう", explanation: "學習", partOfSpeech: "名詞/動詞", sentence: "日本語を勉強します。" },
          { word: "水", spelling: "みず", explanation: "水", partOfSpeech: "名詞", sentence: "水を飲みます。" },
          { word: "食べる", spelling: "たべる", explanation: "吃", partOfSpeech: "動詞", sentence: "ご飯を食べます。" },
        ],
      },
      {
        name: "餐廳用餐英文",
        langUse: "English",
        langExp: "Traditional Chinese",
        establisher: studentUserId,
        public: true,
        copyrights: "由 AI 生成",
        words: [
          { word: "menu", spelling: "ˈmenju", explanation: "菜單", partOfSpeech: "noun", sentence: "Can I see the menu, please?" },
          { word: "order", spelling: "ˈɔrdər", explanation: "點餐", partOfSpeech: "verb", sentence: "I would like to order a pizza." },
          { word: "bill", spelling: "bɪl", explanation: "帳單", partOfSpeech: "noun", sentence: "Can I have the bill, please?" },
          { word: "tip", spelling: "tɪp", explanation: "小費", partOfSpeech: "noun", sentence: "I left a 10% tip." },
        ],
      },
    ];

    const vocabularyIds: string[] = [];
    for (const vocabData of vocabularies) {
      const vocabularyId = generateVocabularyId();
      const vocabulary = await prisma.vocabulary.create({
        data: {
          vocabularyId,
          name: vocabData.name,
          langUse: vocabData.langUse,
          langExp: vocabData.langExp,
          establisher: vocabData.establisher,
          public: vocabData.public,
          copyrights: vocabData.copyrights,
        },
      });

      // 建立單字
      const useLocalDb = process.env.DATABASE_local === "true";
      for (const wordData of vocabData.words) {
        await prisma.word.create({
          data: {
            vocabularyId: useLocalDb ? vocabularyId : vocabulary.id,
            word: wordData.word,
            spelling: wordData.spelling || null,
            explanation: wordData.explanation,
            partOfSpeech: wordData.partOfSpeech || null,
            sentence: wordData.sentence || null,
          },
        });
      }

      vocabularyIds.push(vocabularyId);
      console.log(`  ✅ ${vocabData.name} (${vocabData.words.length} 個單字)`);
    }

    // 更新學生的單字本列表
    await prisma.student.update({
      where: { userId: studentUserId },
      data: { lvocabuIDs: vocabularyIds },
    });

    // 更新公開單字本列表（如果 prisma 支援）
    try {
      const publicList = await prisma.publicVocabularyList?.findFirst();
      if (publicList) {
        await prisma.publicVocabularyList.update({
          where: { id: publicList.id },
          data: {
            vocabularyIds: [...(publicList.vocabularyIds || []), ...vocabularyIds],
          },
        });
      } else {
        await prisma.publicVocabularyList?.create({
          data: {
            vocabularyIds,
          },
        });
      }
    } catch (error) {
      console.log("  ⚠️  公開單字本列表更新失敗（可能不支援此功能）");
    }
    console.log("");

    // 3. 建立優惠券
    console.log("🎫 建立優惠券...");
    
    const coupons = [
      {
        couponId: generateCouponId(),
        name: "滿百折十",
        period: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天後
        text: "消費滿100元即可折抵10元",
        storeName: "五九麵館",
        storeLocation: "106臺北市大安區新生南路三段88之2號",
        storeHours: "週一至週五 11:00-21:00",
      },
      {
        couponId: generateCouponId(),
        name: "學生優惠",
        period: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60天後
        text: "憑學生證可享9折優惠",
        storeName: "五九麵館 公館店",
        storeLocation: "100臺北市中正區羅斯福路三段286巷4弄12號",
        storeHours: "週一至週日 10:00-22:00",
      },
      {
        couponId: generateCouponId(),
        name: "新店開幕優惠",
        period: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天後
        text: "開幕期間全品項8折",
        storeName: "五九麵館 信義店",
        storeLocation: "110臺北市信義區信義路五段7號",
        storeHours: "週一至週日 11:00-23:00",
      },
    ];

    const couponIds: string[] = [];
    for (const couponData of coupons) {
      const coupon = await prisma.coupon.create({
        data: couponData,
      });
      couponIds.push(couponData.couponId);
      console.log(`  ✅ ${couponData.name} (${couponData.couponId})`);
    }

    // 更新廠商的優惠券列表
    await prisma.supplier.update({
      where: { userId: supplierUserId },
      data: { lsuppcoIDs: couponIds },
    });
    console.log("");

    // 4. 建立分店
    console.log("🏪 建立分店...");
    
    const stores = [
      {
        supplierId: supplier.id,
        name: "五九麵館 公館店",
        location: "100臺北市中正區羅斯福路三段286巷4弄12號",
        businessHours: "週一至週日 10:00-22:00",
        website: "https://example.com/gongguan",
      },
      {
        supplierId: supplier.id,
        name: "五九麵館 信義店",
        location: "110臺北市信義區信義路五段7號",
        businessHours: "週一至週日 11:00-23:00",
        website: "https://example.com/xinyi",
      },
    ];

    for (const storeData of stores) {
      await prisma.store.create({
        data: storeData,
      });
      console.log(`  ✅ ${storeData.name}`);
    }
    console.log("");

    // 5. 建立系統參數（如果 prisma 支援）
    console.log("⚙️  建立系統參數...");
    try {
      const sysPara = await prisma.sys_para?.findFirst();
      if (!sysPara) {
        await prisma.sys_para?.create({
          data: {
            LLM_quota: 0.005,
            new_points: 100,
            gameParams: JSON.stringify({}),
          },
        });
        console.log("  ✅ 系統參數已建立\n");
      } else {
        console.log("  ✅ 系統參數已存在\n");
      }
    } catch (error) {
      console.log("  ⚠️  系統參數建立失敗（可能不支援此功能）\n");
    }

    // 顯示登入資訊
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 測試資料建立完成！");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📝 測試帳號資訊：\n");
    console.log("👤 學生帳號：");
    console.log(`   User ID: ${studentUserId}`);
    console.log(`   名稱: 測試學生`);
    console.log(`   郵箱: student@test.com\n`);
    console.log("🏪 廠商帳號：");
    console.log(`   User ID: ${supplierUserId}`);
    console.log(`   名稱: 測試廠商`);
    console.log(`   郵箱: supplier@test.com\n`);
    console.log("👨‍💼 管理員帳號：");
    console.log(`   User ID: ${adminUserId}`);
    console.log(`   名稱: 測試管理員`);
    console.log(`   郵箱: admin@test.com\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 使用方式：");
    console.log("   1. 啟動開發伺服器: npm run dev");
    console.log("   2. 前往登入頁面: http://localhost:3000/login");
    console.log("   3. 選擇「測試登入」");
    console.log("   4. 輸入上述 User ID 進行登入");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error: any) {
    console.error("❌ 建立測試資料失敗:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (prisma.$disconnect) {
      await prisma.$disconnect();
    }
  }
}

seedTestData();
