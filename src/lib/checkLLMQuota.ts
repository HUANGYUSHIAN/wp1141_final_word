import { prisma } from "@/lib/prisma";
import { getLLMQuota } from "./llmQuota";

/**
 * 檢查用戶是否超過每日 LLM 額度（美金）
 * @param userId 用戶 ID
 * @returns 是否超過額度
 */
export async function checkLLMQuotaExceeded(userId: string): Promise<boolean> {
  try {
    // 獲取系統參數
    const sysPara = await prisma.sys_para.findFirst();
    const dailyLimit = sysPara?.LLM_quota || 0.005; // 預設 0.005 美金

    // 獲取用戶今日使用量（美金）
    const { todayCost } = await getLLMQuota(userId);

    return todayCost >= dailyLimit;
  } catch (error) {
    console.error("Error checking LLM quota:", error);
    // 如果檢查失敗，為了安全起見，返回 true（禁止使用）
    return true;
  }
}

