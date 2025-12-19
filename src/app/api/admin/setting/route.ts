import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取系統參數
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

    // 獲取系統參數，如果不存在則創建默認值
    let sysPara = await prisma.sys_para.findFirst();

    if (!sysPara) {
      sysPara = await prisma.sys_para.create({
        data: {
          LLM_quota: 0.005, // 預設 0.005 美金
          new_points: 100,
        },
      });
    }

    return NextResponse.json({
      LLM_quota: sysPara.LLM_quota,
      new_points: sysPara.new_points,
    });
  } catch (error: any) {
    console.error("Error fetching system parameters:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// PUT - 更新系統參數
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
    const { LLM_quota, new_points } = body;

    if (LLM_quota === undefined || new_points === undefined) {
      return NextResponse.json(
        { error: "參數不完整" },
        { status: 400 }
      );
    }

    // 獲取或創建系統參數
    let sysPara = await prisma.sys_para.findFirst();

    if (!sysPara) {
      sysPara = await prisma.sys_para.create({
        data: {
          LLM_quota: LLM_quota || 0.005,
          new_points: new_points || 100,
        },
      });
    } else {
      sysPara = await prisma.sys_para.update({
        where: { id: sysPara.id },
        data: {
          LLM_quota: LLM_quota,
          new_points: new_points,
        },
      });
    }

    return NextResponse.json({
      LLM_quota: sysPara.LLM_quota,
      new_points: sysPara.new_points,
    });
  } catch (error: any) {
    console.error("Error updating system parameters:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

