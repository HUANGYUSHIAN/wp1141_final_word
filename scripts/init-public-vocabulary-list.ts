import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("開始初始化 public_Vocabulary 列表...");

  try {
    // 獲取所有單字本
    const allVocabularies = await prisma.vocabulary.findMany({
      select: {
        vocabularyId: true,
        public: true,
      },
    });

    // 過濾出 public 為 true 或 null/undefined 的單字本（因為默認是 true）
    const vocabularyIds = allVocabularies
      .filter((v) => v.public === true || v.public === null || v.public === undefined)
      .map((v) => v.vocabularyId);

    console.log(`找到 ${vocabularyIds.length} 個公開單字本`);

    // 檢查是否已存在記錄
    const existing = await prisma.publicVocabularyList.findFirst();

    if (existing) {
      // 更新現有記錄
      await prisma.publicVocabularyList.update({
        where: { id: existing.id },
        data: {
          vocabularyIds: vocabularyIds,
        },
      });
      console.log(`已更新 public_Vocabulary 列表，包含 ${vocabularyIds.length} 個單字本`);
    } else {
      // 創建新記錄
      await prisma.publicVocabularyList.create({
        data: {
          vocabularyIds: vocabularyIds,
        },
      });
      console.log(`已創建 public_Vocabulary 列表，包含 ${vocabularyIds.length} 個單字本`);
    }

    console.log("初始化完成！");
  } catch (error) {
    console.error("初始化失敗:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

