import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取供應商的店鋪資訊
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

    // 返回供應商的店鋪資訊
    return NextResponse.json({
      store: {
        name: supplier.storeName || "",
        location: supplier.storeLocation || "",
        businessHours: supplier.storeHours || "",
        website: supplier.storeWebsite || "",
      },
    });
  } catch (error: any) {
    console.error("Error fetching supplier store:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// PUT - 更新供應商的店鋪資訊
export async function PUT(request: Request) {
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
    const { name, location, businessHours, website } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "店名為必填" }, { status: 400 });
    }

    const supplier = user.supplierData;

    // 直接更新 Supplier 的店鋪資訊
    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        storeName: name.trim(),
        storeLocation: location?.trim() || null,
        storeHours: businessHours?.trim() || null,
        storeWebsite: website?.trim() || null,
      },
    });

    return NextResponse.json({
      store: {
        name: updatedSupplier.storeName || "",
        location: updatedSupplier.storeLocation || "",
        businessHours: updatedSupplier.storeHours || "",
        website: updatedSupplier.storeWebsite || "",
      },
    });
  } catch (error: any) {
    console.error("Error updating supplier store:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json({ 
      error: "伺服器錯誤",
      details: error.message || "未知錯誤"
    }, { status: 500 });
  }
}

