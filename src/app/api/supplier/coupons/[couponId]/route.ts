import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT - 更新優惠券
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
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

    const { couponId } = await params;
    const supplier = user.supplierData;

    // 檢查優惠券是否屬於該供應商
    if (!supplier.lsuppcoIDs || !supplier.lsuppcoIDs.includes(couponId)) {
      return NextResponse.json({ error: "無權限修改此優惠券" }, { status: 403 });
    }

    const body = await request.json();
    const { name, period, link, text, picture, storeName, storeLocation, storeHours, storeWebsite } = body;

    const coupon = await prisma.coupon.update({
      where: { couponId },
      data: {
        name,
        period: new Date(period),
        link: link || null,
        text: text || null,
        picture: picture || null,
        storeName: storeName || null,
        storeLocation: storeLocation || null,
        storeHours: storeHours || null,
        storeWebsite: storeWebsite || null,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error: any) {
    console.error("Error updating supplier coupon:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// DELETE - 刪除優惠券
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
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

    const { couponId } = await params;
    const supplier = user.supplierData;

    // 檢查優惠券是否屬於該供應商
    if (!supplier.lsuppcoIDs || !supplier.lsuppcoIDs.includes(couponId)) {
      return NextResponse.json({ error: "無權限刪除此優惠券" }, { status: 403 });
    }

    // 刪除優惠券
    await prisma.coupon.delete({
      where: { couponId },
    });

    // 從供應商的 lsuppcoIDs 中移除
    const updatedCouponIds = (supplier.lsuppcoIDs || []).filter(
      (id: string) => id !== couponId
    );

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        lsuppcoIDs: updatedCouponIds,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting supplier coupon:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

