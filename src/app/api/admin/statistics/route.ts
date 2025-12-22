import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
// 注意：查询数据需要 Personal API Key，不是 Project API Key
// 如果没有设置，将返回空数据
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

// 计算日期范围
function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// 安全除法，避免除零错误
function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !denominator || isNaN(denominator)) {
    return null;
  }
  return numerator / denominator;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 检查是否为 Admin - 直接查询数据库，而不是调用 API
    const admin = await prisma.user.findUnique({
      where: { userId: session.userId },
      include: { adminData: true },
    });

    if (!admin || admin.dataType !== "Admin" || !admin.adminData) {
      return NextResponse.json({ error: "無權限" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "30d";
    const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
    const { start, end } = getDateRange(days);

    // 如果没有 Personal API Key 或 Project ID，返回空数据
    if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
      return NextResponse.json({
        studentStats: {
          totalUsers: 0,
          activeUsers: 0,
          pageViews: [],
          topEvents: [],
        },
        supplierStats: {
          totalUsers: 0,
          activeUsers: 0,
          pageViews: [],
          topEvents: [],
        },
        featureStats: {
          popularFeatures: [],
          errorRates: [],
          abandonmentRates: [],
        },
        message: !POSTHOG_PERSONAL_API_KEY 
          ? "未配置 POSTHOG_PERSONAL_API_KEY，無法查詢數據。請在 PostHog 設置中創建 Personal API Key 並添加到 .env 文件。"
          : "未配置 POSTHOG_PROJECT_ID，無法查詢數據。請在 .env 文件中添加 POSTHOG_PROJECT_ID。",
      });
    }

    // 使用 PostHog Query API 查询数据
    try {
      // 查询页面访问事件
      const pageViewsQuery = {
        kind: "EventsQuery",
        select: [
          "properties.$current_url as page",
          "count() as views",
          "count(DISTINCT distinct_id) as unique_users",
        ],
        where: [
          ["event", "=", "page_viewed"],
          ["timestamp", ">=", start],
          ["timestamp", "<=", end],
        ],
        groupBy: ["page"],
        orderBy: [["views", "desc"]],
        limit: 50,
      };

      // 查询所有事件
      const eventsQuery = {
        kind: "EventsQuery",
        select: [
          "event",
          "count() as count",
          "count(DISTINCT distinct_id) as unique_users",
        ],
        where: [
          ["timestamp", ">=", start],
          ["timestamp", "<=", end],
        ],
        groupBy: ["event"],
        orderBy: [["count", "desc"]],
        limit: 50,
      };

      // 调用 PostHog Query API
      const queryUrl = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`;

      // 查询页面访问
      const pageViewsResponse = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageViewsQuery),
      });

      // 查询事件
      const eventsResponse = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventsQuery),
      });

      let pageViewsData: any[] = [];
      let eventsData: any[] = [];
      let allUsers = new Set<string>();
      let activeUsers = new Set<string>();

      if (pageViewsResponse.ok) {
        const pageViewsResult = await pageViewsResponse.json();
        if (pageViewsResult.results && Array.isArray(pageViewsResult.results)) {
          pageViewsData = pageViewsResult.results;
        }
      }

      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json();
        if (eventsResult.results && Array.isArray(eventsResult.results)) {
          eventsData = eventsResult.results;
          
          // 收集所有用户
          eventsData.forEach((item: any) => {
            if (item.distinct_id) {
              allUsers.add(item.distinct_id);
              activeUsers.add(item.distinct_id);
            }
          });
        }
      }

      // 分离 Student 和 Supplier 数据
      const studentPageViews: any[] = [];
      const supplierPageViews: any[] = [];
      const studentEvents: any[] = [];
      const supplierEvents: any[] = [];

      pageViewsData.forEach((item: any) => {
        const page = item.page || "";
        if (page.includes("/student/")) {
          studentPageViews.push({
            page,
            views: item.views || 0,
            uniqueUsers: item.unique_users || 0,
          });
        } else if (page.includes("/supplier/")) {
          supplierPageViews.push({
            page,
            views: item.views || 0,
            uniqueUsers: item.unique_users || 0,
          });
        }
      });

      eventsData.forEach((item: any) => {
        const event = item.event || "";
        // 根据事件名称判断角色
        if (
          event.includes("vocabulary") ||
          event.includes("grammar") ||
          event.includes("game") ||
          event.includes("test") ||
          event.includes("review") ||
          event.includes("lottery")
        ) {
          studentEvents.push({
            event,
            count: item.count || 0,
            uniqueUsers: item.unique_users || 0,
          });
        } else if (event.includes("coupon") || event.includes("store")) {
          supplierEvents.push({
            event,
            count: item.count || 0,
            uniqueUsers: item.unique_users || 0,
          });
        }
      });

      // 计算功能分析数据
      const vocabularyCreated = eventsData.find((e: any) => e.event === "vocabulary_created")?.count || 0;
      const gameStarted = eventsData.find((e: any) => e.event === "game_started")?.count || 0;
      const grammarAsked = eventsData.find((e: any) => e.event === "grammar_question_asked")?.count || 0;
      const testStarted = eventsData.find((e: any) => e.event === "test_started")?.count || 0;
      const totalStudentEvents = vocabularyCreated + gameStarted + grammarAsked + testStarted;

      const popularFeatures: any[] = [];
      if (vocabularyCreated > 0) {
        popularFeatures.push({
          feature: "單字本管理",
          usage: safeDivide(vocabularyCreated, totalStudentEvents) 
            ? ((safeDivide(vocabularyCreated, totalStudentEvents)! * 100).toFixed(1))
            : "0",
          satisfaction: null,
        });
      }
      if (grammarAsked > 0) {
        popularFeatures.push({
          feature: "文法家教",
          usage: safeDivide(grammarAsked, totalStudentEvents)
            ? ((safeDivide(grammarAsked, totalStudentEvents)! * 100).toFixed(1))
            : "0",
          satisfaction: null,
        });
      }
      if (gameStarted > 0) {
        popularFeatures.push({
          feature: "單字遊戲",
          usage: safeDivide(gameStarted, totalStudentEvents)
            ? ((safeDivide(gameStarted, totalStudentEvents)! * 100).toFixed(1))
            : "0",
          satisfaction: null,
        });
      }
      if (testStarted > 0) {
        popularFeatures.push({
          feature: "單字測驗",
          usage: safeDivide(testStarted, totalStudentEvents)
            ? ((safeDivide(testStarted, totalStudentEvents)! * 100).toFixed(1))
            : "0",
          satisfaction: null,
        });
      }

      // 错误率和放弃率（需要更多数据，暂时返回空数组）
      const errorRates: any[] = [];
      const abandonmentRates: any[] = [];

      return NextResponse.json({
        studentStats: {
          totalUsers: allUsers.size,
          activeUsers: activeUsers.size,
          pageViews: studentPageViews.sort((a, b) => b.views - a.views),
          topEvents: studentEvents.sort((a, b) => b.count - a.count),
        },
        supplierStats: {
          totalUsers: allUsers.size, // 简化处理
          activeUsers: activeUsers.size,
          pageViews: supplierPageViews.sort((a, b) => b.views - a.views),
          topEvents: supplierEvents.sort((a, b) => b.count - a.count),
        },
        featureStats: {
          popularFeatures,
          errorRates,
          abandonmentRates,
        },
      });
    } catch (apiError: any) {
      console.error("PostHog API 错误:", apiError);
      // 如果 API 调用失败，返回空数据而不是错误
      return NextResponse.json({
        studentStats: {
          totalUsers: 0,
          activeUsers: 0,
          pageViews: [],
          topEvents: [],
        },
        supplierStats: {
          totalUsers: 0,
          activeUsers: 0,
          pageViews: [],
          topEvents: [],
        },
        featureStats: {
          popularFeatures: [],
          errorRates: [],
          abandonmentRates: [],
        },
        error: apiError.message,
      });
    }
  } catch (error: any) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
