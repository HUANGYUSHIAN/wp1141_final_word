import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLLMQuota } from "@/lib/llmQuota";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const { todayCost, totalCost, records } = await getLLMQuota(session.userId);

    return NextResponse.json({
      todayCost,
      totalCost,
      records,
    });
  } catch (error: any) {
    console.error("Error fetching LLM usage:", error);
    return NextResponse.json(
      { error: "獲取 LLM 使用狀況失敗" },
      { status: 500 }
    );
  }
}

