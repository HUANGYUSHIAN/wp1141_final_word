import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取 LLM 額度設定
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為管理員
    const admin = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { adminData: true },
    });

    if (!admin || admin.dataType !== "Admin" || !admin.adminData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    // 獲取系統參數
    let sysPara = await prisma.sys_para.findFirst();

    if (!sysPara) {
      sysPara = await prisma.sys_para.create({
        data: {
          LLM_quota: 0.005,
          new_points: 100,
        },
      });
    }

    // 嘗試查詢 OpenAI 餘額
    let openAIBalance: number | null = null;
    let balanceType: "remaining" | "total_used" = "remaining";
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (openaiApiKey) {
      try {
        const response = await fetch(
          "https://api.openai.com/v1/dashboard/billing/credit_grants",
          {
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // 嘗試解析餘額（根據 OpenAI API 實際返回格式）
          // 可能的字段：total_available, total_granted, total_used, remaining_credits 等
          if (data.total_available !== undefined) {
            openAIBalance = data.total_available;
            balanceType = "remaining";
          } else if (data.remaining_credits !== undefined) {
            openAIBalance = data.remaining_credits;
            balanceType = "remaining";
          } else if (data.total_granted !== undefined && data.total_used !== undefined) {
            openAIBalance = data.total_granted - data.total_used;
            balanceType = "remaining";
          }
        } else {
          console.warn("無法查詢 OpenAI 餘額，API 返回狀態:", response.status);
        }
      } catch (error) {
        console.error("查詢 OpenAI 餘額失敗:", error);
      }
    }

    // 如果無法查詢 OpenAI 餘額，則計算所有用戶的總消耗額度
    if (openAIBalance === null) {
      try {
        const allUsers = await prisma.user.findMany({
          select: {
            llmQuota: true,
          },
        });

        let totalCost = 0;
        for (const user of allUsers) {
          if (user.llmQuota) {
            try {
              const quotaRecords = JSON.parse(user.llmQuota);
              if (Array.isArray(quotaRecords)) {
                const userTotal = quotaRecords.reduce(
                  (sum: number, r: { date: string; cost: number }) => sum + (r.cost || 0),
                  0
                );
                totalCost += userTotal;
              }
            } catch (e) {
              // 忽略解析錯誤
            }
          }
        }

        openAIBalance = totalCost;
        balanceType = "total_used";
      } catch (error) {
        console.error("計算總消耗額度失敗:", error);
      }
    }

    return NextResponse.json({
      LLM_quota: sysPara.LLM_quota,
      openAIBalance: openAIBalance,
      balanceType: balanceType,
    });
  } catch (error: any) {
    console.error("Error fetching LLM quota:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// PUT - 更新 LLM 額度設定
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為管理員
    const admin = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { adminData: true },
    });

    if (!admin || admin.dataType !== "Admin" || !admin.adminData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const body = await request.json();
    const { LLM_quota } = body;

    if (LLM_quota === undefined) {
      return NextResponse.json({ error: "參數不完整" }, { status: 400 });
    }

    // 獲取或創建系統參數
    let sysPara = await prisma.sys_para.findFirst();

    if (!sysPara) {
      sysPara = await prisma.sys_para.create({
        data: {
          LLM_quota: LLM_quota || 0.005,
          new_points: 100,
        },
      });
    } else {
      sysPara = await prisma.sys_para.update({
        where: { id: sysPara.id },
        data: {
          LLM_quota: LLM_quota,
        },
      });
    }

    return NextResponse.json({
      LLM_quota: sysPara.LLM_quota,
    });
  } catch (error: any) {
    console.error("Error updating LLM quota:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

