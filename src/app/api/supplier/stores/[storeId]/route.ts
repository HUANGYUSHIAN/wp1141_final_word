import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT - 更新店鋪
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
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

    const { storeId } = await params;
    const supplier = user.supplierData;

    // 檢查店鋪是否屬於該供應商
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || store.supplierId !== supplier.id) {
      return NextResponse.json({ error: "無權限修改此店鋪" }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, website, businessHours } = body;

    if (!name) {
      return NextResponse.json({ error: "店名為必填" }, { status: 400 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        location: location || null,
        website: website || null,
        businessHours: businessHours || null,
      },
    });

    return NextResponse.json({ store: updatedStore });
  } catch (error: any) {
    console.error("Error updating store:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// DELETE - 刪除店鋪
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
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

    const { storeId } = await params;
    const supplier = user.supplierData;

    // 檢查店鋪是否屬於該供應商
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || store.supplierId !== supplier.id) {
      return NextResponse.json({ error: "無權限刪除此店鋪" }, { status: 403 });
    }

    // 刪除店鋪
    await prisma.store.delete({
      where: { id: storeId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting store:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

