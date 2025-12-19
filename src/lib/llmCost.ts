/**
 * OpenAI GPT-4o-mini 價格（每 1M tokens）
 * 來源：https://openai.com/pricing
 */
const INPUT_COST_PER_MILLION = 0.15; // $0.15 per 1M input tokens
const OUTPUT_COST_PER_MILLION = 0.60; // $0.60 per 1M output tokens

/**
 * 計算 LLM API 調用的美金成本
 * @param inputTokens 輸入 token 數量
 * @param outputTokens 輸出 token 數量
 * @returns 美金成本
 */
export function calculateLLMCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * 從 OpenAI Usage 對象計算成本
 * @param usage OpenAI API 返回的 usage 對象
 * @returns 美金成本
 */
export function calculateCostFromUsage(usage: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}): number {
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  return calculateLLMCost(inputTokens, outputTokens);
}

