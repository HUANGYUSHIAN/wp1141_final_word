import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取供應商的店鋪列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為供應商
    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { supplierData: true },
    });

    if (!user || user.dataType !== "Supplier" || !user.supplierData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const supplier = user.supplierData;

    // 獲取所有店鋪
    const stores = await prisma.store.findMany({
      where: {
        supplierId: supplier.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const storesWithDate = stores.map((s: any) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      stores: storesWithDate,
    });
  } catch (error: any) {
    console.error("Error fetching supplier stores:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST - 新增店鋪
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 檢查是否為供應商
    const user = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { supplierData: true },
    });

    if (!user || user.dataType !== "Supplier" || !user.supplierData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, website, businessHours } = body;

    if (!name) {
      return NextResponse.json({ error: "店名為必填" }, { status: 400 });
    }

    const supplier = user.supplierData;

    // 創建店鋪
    const store = await prisma.store.create({
      data: {
        supplierId: supplier.id,
        name,
        location: location || null,
        website: website || null,
        businessHours: businessHours || null,
      },
    });

    return NextResponse.json({ store });
  } catch (error: any) {
    console.error("Error creating store:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

