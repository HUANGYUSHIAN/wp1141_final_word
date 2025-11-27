import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取擁有此優惠券的學生列表
export async function GET(
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
      return NextResponse.json({ error: "無權限查看此優惠券" }, { status: 403 });
    }

    // 查找所有擁有此優惠券的學生
    const students = await prisma.student.findMany({
      where: {
        lcouponIDs: {
          has: couponId,
        },
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const owners = students.map((student) => ({
      userId: student.user.userId,
      name: student.user.name || "未命名",
      email: student.user.email || "",
    }));

    return NextResponse.json({
      count: owners.length,
      owners: owners,
    });
  } catch (error: any) {
    console.error("Error fetching coupon owners:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

