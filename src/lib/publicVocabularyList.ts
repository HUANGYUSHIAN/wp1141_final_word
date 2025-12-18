import { prisma } from "@/lib/prisma";

/**
 * 將 vocabularyId 加入到 public_Vocabulary 列表
 */
export async function addToPublicVocabularyList(vocabularyId: string) {
  try {
    const existing = await prisma.publicVocabularyList.findFirst();
    
    if (existing) {
      // 檢查是否已存在
      if (!existing.vocabularyIds.includes(vocabularyId)) {
        await prisma.publicVocabularyList.update({
          where: { id: existing.id },
          data: {
            vocabularyIds: {
              push: vocabularyId,
            },
          },
        });
      }
    } else {
      // 創建新記錄
      await prisma.publicVocabularyList.create({
        data: {
          vocabularyIds: [vocabularyId],
        },
      });
    }
  } catch (error) {
    console.error("Error adding to public vocabulary list:", error);
  }
}

/**
 * 從 public_Vocabulary 列表中移除 vocabularyId
 */
export async function removeFromPublicVocabularyList(vocabularyId: string) {
  try {
    const existing = await prisma.publicVocabularyList.findFirst();
    
    if (existing && existing.vocabularyIds.includes(vocabularyId)) {
      await prisma.publicVocabularyList.update({
        where: { id: existing.id },
        data: {
          vocabularyIds: {
            set: existing.vocabularyIds.filter((id: string) => id !== vocabularyId),
          },
        },
      });
    }
  } catch (error) {
    console.error("Error removing from public vocabulary list:", error);
  }
}

/**
 * 獲取所有公開單字本的 vocabularyId 列表
 * 如果列表不存在，返回空陣列（會觸發重新初始化）
 */
export async function getPublicVocabularyIds(): Promise<string[]> {
  try {
    const existing = await prisma.publicVocabularyList.findFirst({
      orderBy: { updatedAt: "desc" }, // 獲取最新的記錄
    });
    return existing?.vocabularyIds || [];
  } catch (error) {
    console.error("Error getting public vocabulary ids:", error);
    return [];
  }
}

