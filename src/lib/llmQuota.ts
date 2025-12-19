import { prisma } from "@/lib/prisma";

interface QuotaRecord {
  date: string; // YYYY-MM-DD
  cost: number; // 美金成本
}

/**
 * 更新用户的 LLM API 美金使用量
 * @param userId 用户 ID
 * @param cost 本次使用的美金成本
 */
export async function updateLLMQuota(userId: string, cost: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let quotaRecords: QuotaRecord[] = [];

    // 解析现有的 quota 记录
    if (user.llmQuota) {
      try {
        quotaRecords = JSON.parse(user.llmQuota);
      } catch (e) {
        quotaRecords = [];
      }
    }

    // 查找今天的记录
    const todayRecordIndex = quotaRecords.findIndex((r) => r.date === today);

    if (todayRecordIndex >= 0) {
      // 更新今天的记录
      quotaRecords[todayRecordIndex].cost += cost;
    } else {
      // 添加新记录
      quotaRecords.push({ date: today, cost });
    }

    // 只保留最近 30 天的记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

    quotaRecords = quotaRecords.filter((r) => r.date >= cutoffDate);

    // 按日期排序
    quotaRecords.sort((a, b) => a.date.localeCompare(b.date));

    // 更新数据库
    await prisma.user.update({
      where: { userId },
      data: {
        llmQuota: JSON.stringify(quotaRecords),
      },
    });
  } catch (error) {
    console.error("Error updating LLM quota:", error);
  }
}

/**
 * 获取用户的 LLM API 美金使用量
 * @param userId 用户 ID
 * @returns 今日使用量和总使用量（美金）
 */
export async function getLLMQuota(userId: string): Promise<{
  todayCost: number;
  totalCost: number;
  records: QuotaRecord[];
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user || !user.llmQuota) {
      return { todayCost: 0, totalCost: 0, records: [] };
    }

    const quotaRecords: QuotaRecord[] = JSON.parse(user.llmQuota);
    const today = new Date().toISOString().split("T")[0];

    const todayRecord = quotaRecords.find((r) => r.date === today);
    const todayCost = todayRecord ? todayRecord.cost : 0;
    const totalCost = quotaRecords.reduce((sum, r) => sum + r.cost, 0);

    return {
      todayCost,
      totalCost,
      records: quotaRecords,
    };
  } catch (error) {
    console.error("Error getting LLM quota:", error);
    return { todayCost: 0, totalCost: 0, records: [] };
  }
}

