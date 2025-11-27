import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateUserId } from "@/lib/utils";

// GET - 獲取供應商的優惠券列表
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
    const couponIds = supplier.lsuppcoIDs || [];

    // 獲取所有優惠券
    const coupons = await prisma.coupon.findMany({
      where: {
        couponId: { in: couponIds },
      },
      orderBy: { createdAt: "desc" },
    });

    const couponsWithDate = coupons.map((c: any) => ({
      ...c,
      period: c.period.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({
      coupons: couponsWithDate,
    });
  } catch (error: any) {
    console.error("Error fetching supplier coupons:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST - 新增優惠券
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
    const { name, period, link, text, picture, storeName, storeLocation, storeHours, storeWebsite } = body;

    if (!name || !period) {
      return NextResponse.json({ error: "名稱和使用期限為必填" }, { status: 400 });
    }

    // 如果沒有提供店鋪資訊，從供應商資料獲取
    let finalStoreName = storeName;
    let finalStoreLocation = storeLocation;
    let finalStoreHours = storeHours;
    let finalStoreWebsite = storeWebsite;

    if (!finalStoreName || !finalStoreLocation) {
      const supplier = user.supplierData;
      if (!finalStoreName) finalStoreName = supplier.storeName || null;
      if (!finalStoreLocation) finalStoreLocation = supplier.storeLocation || null;
      if (!finalStoreHours) finalStoreHours = supplier.storeHours || null;
      if (!finalStoreWebsite) finalStoreWebsite = supplier.storeWebsite || null;
    }

    // 生成唯一的 couponId
    let couponId: string;
    let isUnique = false;

    while (!isUnique) {
      couponId = generateUserId(30);
      const existing = await prisma.coupon.findUnique({
        where: { couponId },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // 創建優惠券
    const coupon = await prisma.coupon.create({
      data: {
        couponId: couponId!,
        name,
        period: new Date(period),
        link: link || null,
        text: text || null,
        picture: picture || null,
        storeName: finalStoreName || null,
        storeLocation: finalStoreLocation || null,
        storeHours: finalStoreHours || null,
        storeWebsite: finalStoreWebsite || null,
      },
    });

    // 將優惠券 ID 添加到供應商的 lsuppcoIDs
    const supplier = user.supplierData;
    const updatedCouponIds = [...(supplier.lsuppcoIDs || []), coupon.couponId];

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        lsuppcoIDs: updatedCouponIds,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error: any) {
    console.error("Error creating supplier coupon:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

