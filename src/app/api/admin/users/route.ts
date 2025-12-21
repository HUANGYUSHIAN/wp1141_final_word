import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - 獲取用戶列表（分頁）
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = page * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          userId: true,
          name: true,
          email: true,
          phoneNumber: true,
          birthday: true,
          language: true,
          isLock: true,
          dataType: true,
          llmQuota: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// POST - 新增用戶
export async function POST(request: Request) {
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
    const { name, email, dataType } = body;

    // 驗證必填欄位
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "名稱為必填欄位" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email為必填欄位" }, { status: 400 });
    }
    if (!dataType || !["Student", "Admin", "Supplier"].includes(dataType)) {
      return NextResponse.json({ error: "角色為必填欄位，且必須為 Student、Admin 或 Supplier" }, { status: 400 });
    }

    // 生成唯一的 userId
    const { generateUserId } = await import("@/lib/utils");
    let userId: string;
    let isUnique = false;

    while (!isUnique) {
      userId = generateUserId(30);
      const existingUser = await prisma.user.findUnique({
        where: { userId },
      });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // 生成唯一的 googleId（避免唯一約束衝突）
    let googleId: string;
    let googleIdUnique = false;

    while (!googleIdUnique) {
      googleId = `manual_${generateUserId(25)}`;
      const existingUser = await prisma.user.findUnique({
        where: { googleId },
      });
      if (!existingUser) {
        googleIdUnique = true;
      }
    }

    // 創建用戶
    const user = await prisma.user.create({
      data: {
        userId: userId!,
        googleId: googleId!,
        name: name.trim(),
        email: email.trim(),
        dataType: dataType,
      },
    });

    // 根據 dataType 創建對應的資料記錄
    if (dataType === "Student") {
      await prisma.student.create({
        data: {
          userId: userId!,
          lvocabuIDs: [],
          lcouponIDs: [],
          lfriendIDs: [],
        },
      });
    } else if (dataType === "Supplier") {
      await prisma.supplier.create({
        data: {
          userId: userId!,
          lsuppcoIDs: [],
        },
      });
    } else if (dataType === "Admin") {
      await prisma.admin.create({
        data: {
          userId: userId!,
          permissions: [],
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "用戶已存在（Email 或 GoogleId 重複）" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "伺服器錯誤" }, { status: 500 });
  }
}

