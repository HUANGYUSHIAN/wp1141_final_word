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
      const missingVar = !POSTHOG_PERSONAL_API_KEY ? "POSTHOG_PERSONAL_API_KEY" : "POSTHOG_PROJECT_ID";
      console.warn(`[PostHog] 環境變數未設置: ${missingVar}`);
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

    console.log("[PostHog] 開始查詢統計數據...", {
      host: POSTHOG_HOST,
      projectId: POSTHOG_PROJECT_ID,
      hasPersonalKey: !!POSTHOG_PERSONAL_API_KEY,
    });

    // 使用 PostHog Query API 查询数据
    try {
      // 將 ISO 格式轉換為 ClickHouse DateTime 格式 (YYYY-MM-DD HH:MM:SS)
      const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startFormatted = formatDateTime(start);
      const endFormatted = formatDateTime(end);

      console.log("[PostHog] 時間格式轉換:", {
        original: { start, end },
        formatted: { startFormatted, endFormatted },
      });

      // 查询页面访问事件 - 使用 HogQL 查詢格式，使用 toDateTime() 函數
      const pageViewsQuery = {
        query: {
          kind: "HogQLQuery",
          query: `SELECT properties.$current_url as page, count() as views, count(DISTINCT person_id) as unique_users
                  FROM events
                  WHERE event = '$pageview'
                    AND timestamp >= toDateTime('${startFormatted}')
                    AND timestamp <= toDateTime('${endFormatted}')
                  GROUP BY properties.$current_url
                  ORDER BY views DESC
                  LIMIT 50`,
        },
      };

      // 查询所有事件
      const eventsQuery = {
        query: {
          kind: "HogQLQuery",
          query: `SELECT event, count() as count, count(DISTINCT person_id) as unique_users
                  FROM events
                  WHERE timestamp >= toDateTime('${startFormatted}')
                    AND timestamp <= toDateTime('${endFormatted}')
                  GROUP BY event
                  ORDER BY count DESC
                  LIMIT 50`,
        },
      };

      // 查询總用戶數（所有時間的所有用戶）
      const totalUsersQuery = {
        query: {
          kind: "HogQLQuery",
          query: `SELECT count(DISTINCT person_id) as total_users
                  FROM events`,
        },
      };

      // 查询活躍用戶數（時間範圍內有活動的用戶）
      const activeUsersQuery = {
        query: {
          kind: "HogQLQuery",
          query: `SELECT count(DISTINCT person_id) as active_users
                  FROM events
                  WHERE timestamp >= toDateTime('${startFormatted}')
                    AND timestamp <= toDateTime('${endFormatted}')`,
        },
      };

      // 调用 PostHog Query API
      const queryUrl = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`;

      console.log("[PostHog] 查詢 URL:", queryUrl);
      console.log("[PostHog] 時間範圍:", { start, end, days });

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

      // 查询總用戶數
      const totalUsersResponse = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(totalUsersQuery),
      });

      // 查询活躍用戶數
      const activeUsersResponse = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activeUsersQuery),
      });

      let pageViewsData: any[] = [];
      let eventsData: any[] = [];
      let totalUsersCount = 0;
      let activeUsersCount = 0;

      // 處理頁面訪問響應
      if (!pageViewsResponse.ok) {
        const errorText = await pageViewsResponse.text();
        console.error("[PostHog] 頁面訪問查詢失敗:", {
          status: pageViewsResponse.status,
          statusText: pageViewsResponse.statusText,
          error: errorText.substring(0, 500),
        });
      } else {
        try {
          const pageViewsResult = await pageViewsResponse.json();
          console.log("[PostHog] 頁面訪問查詢結果:", {
            hasResults: !!pageViewsResult.results,
            resultsCount: pageViewsResult.results?.length || 0,
            resultKeys: Object.keys(pageViewsResult),
          });
          // PostHog Query API 返回 results 陣列
          // HogQL 查詢返回的格式是陣列陣列：[[value1, value2, value3], ...]
          const results = pageViewsResult.results || [];
          if (Array.isArray(results)) {
            // HogQL 查詢返回的格式：[[page, views, unique_users], ...]
            if (results.length > 0 && Array.isArray(results[0])) {
              // 轉換為對象格式
              pageViewsData = results.map((row: any[]) => ({
                page: row[0] || "",
                views: Number(row[1]) || 0,
                unique_users: Number(row[2]) || 0,
              }));
              console.log("[PostHog] 頁面訪問數據解析（前 3 個）:", pageViewsData.slice(0, 3));
            } else if (results.length > 0 && typeof results[0] === "object") {
              // 已經是對象格式
              pageViewsData = results.map((item: any) => ({
                page: item.page || item["properties.$current_url"] || "",
                views: Number(item.views || item["count()"] || 0),
                unique_users: Number(item.unique_users || item["count(DISTINCT person_id)"] || 0),
              }));
            } else {
              pageViewsData = [];
            }
          }
        } catch (parseError) {
          console.error("[PostHog] 解析頁面訪問響應失敗:", parseError);
        }
      }

      // 處理事件響應
      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error("[PostHog] 事件查詢失敗:", {
          status: eventsResponse.status,
          statusText: eventsResponse.statusText,
          error: errorText.substring(0, 500),
        });
      } else {
        try {
          const eventsResult = await eventsResponse.json();
          console.log("[PostHog] 事件查詢結果:", {
            hasResults: !!eventsResult.results,
            resultsCount: eventsResult.results?.length || 0,
            resultKeys: Object.keys(eventsResult),
          });
          // PostHog Query API 返回 results 陣列
          // HogQL 查詢返回的格式是陣列陣列：[[value1, value2, value3], ...]
          const results = eventsResult.results || [];
          if (Array.isArray(results)) {
            // HogQL 查詢返回的格式：[[event, count, unique_users], ...]
            if (results.length > 0 && Array.isArray(results[0])) {
              // 轉換為對象格式
              eventsData = results.map((row: any[]) => ({
                event: row[0] || "",
                count: Number(row[1]) || 0,
                unique_users: Number(row[2]) || 0,
              }));
              console.log("[PostHog] 事件數據解析（前 3 個）:", eventsData.slice(0, 3));
            } else if (results.length > 0 && typeof results[0] === "object") {
              // 已經是對象格式
              eventsData = results.map((item: any) => ({
                event: item.event || "",
                count: Number(item.count || item["count()"] || 0),
                unique_users: Number(item.unique_users || item["count(DISTINCT person_id)"] || 0),
              }));
            } else {
              eventsData = [];
            }
            
            // 收集所有用户（從事件數據中提取，需要額外查詢）
            // 注意：HogQL 查詢可能不直接返回 person_id，需要單獨查詢
          }
        } catch (parseError) {
          console.error("[PostHog] 解析事件響應失敗:", parseError);
        }
      }

      // 處理總用戶數查詢結果
      if (totalUsersResponse.ok) {
        try {
          const totalUsersResult = await totalUsersResponse.json();
          if (totalUsersResult.results && Array.isArray(totalUsersResult.results) && totalUsersResult.results.length > 0) {
            const result = totalUsersResult.results[0];
            if (Array.isArray(result)) {
              totalUsersCount = Number(result[0]) || 0;
            } else if (typeof result === "object") {
              totalUsersCount = Number(result.total_users || result[0] || 0);
            }
            console.log("[PostHog] 總用戶數:", totalUsersCount);
          }
        } catch (parseError) {
          console.error("[PostHog] 解析總用戶數響應失敗:", parseError);
        }
      } else {
        const errorText = await totalUsersResponse.text();
        console.error("[PostHog] 總用戶數查詢失敗:", {
          status: totalUsersResponse.status,
          error: errorText.substring(0, 200),
        });
      }

      // 處理活躍用戶數查詢結果
      if (activeUsersResponse.ok) {
        try {
          const activeUsersResult = await activeUsersResponse.json();
          if (activeUsersResult.results && Array.isArray(activeUsersResult.results) && activeUsersResult.results.length > 0) {
            const result = activeUsersResult.results[0];
            if (Array.isArray(result)) {
              activeUsersCount = Number(result[0]) || 0;
            } else if (typeof result === "object") {
              activeUsersCount = Number(result.active_users || result[0] || 0);
            }
            console.log("[PostHog] 活躍用戶數:", activeUsersCount);
          }
        } catch (parseError) {
          console.error("[PostHog] 解析活躍用戶數響應失敗:", parseError);
        }
      } else {
        const errorText = await activeUsersResponse.text();
        console.error("[PostHog] 活躍用戶數查詢失敗:", {
          status: activeUsersResponse.status,
          error: errorText.substring(0, 200),
        });
      }

      console.log("[PostHog] 數據摘要:", {
        pageViewsCount: pageViewsData.length,
        eventsCount: eventsData.length,
        totalUsers: totalUsersCount,
        activeUsers: activeUsersCount,
      });

      // 分离 Student 和 Supplier 数据
      const studentPageViews: any[] = [];
      const supplierPageViews: any[] = [];
      const studentEvents: any[] = [];
      const supplierEvents: any[] = [];

      pageViewsData.forEach((item: any) => {
        // HogQL 查詢返回的格式（已轉換為對象）
        const page = item.page || item["properties.$current_url"] || "";
        const views = item.views || item["count()"] || 0;
        const uniqueUsers = item.unique_users || item["count(DISTINCT person_id)"] || item.uniqueUsers || 0;
        
        if (page && typeof page === "string" && page.includes("/student/")) {
          studentPageViews.push({
            page,
            views: Number(views) || 0,
            uniqueUsers: Number(uniqueUsers) || 0,
          });
        } else if (page && typeof page === "string" && page.includes("/supplier/")) {
          supplierPageViews.push({
            page,
            views: Number(views) || 0,
            uniqueUsers: Number(uniqueUsers) || 0,
          });
        }
      });

      eventsData.forEach((item: any) => {
        const event = item.event || "";
        const count = item.count || item["count()"] || 0;
        const uniqueUsers = item.unique_users || item["count(DISTINCT person_id)"] || item.uniqueUsers || 0;
        
        // 根据事件名称判断角色
        if (event && typeof event === "string") {
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
              count: Number(count) || 0,
              uniqueUsers: Number(uniqueUsers) || 0,
            });
          } else if (event.includes("coupon") || event.includes("store")) {
            supplierEvents.push({
              event,
              count: Number(count) || 0,
              uniqueUsers: Number(uniqueUsers) || 0,
            });
          }
        }
      });

      // 计算功能分析数据
      const getEventCount = (eventName: string) => {
        const event = eventsData.find((e: any) => e.event === eventName);
        return event ? (event["count()"] || event.count || 0) : 0;
      };
      
      // 查詢功能相關事件
      const vocabularyCreated = getEventCount("vocabulary_created");
      const gameStarted = getEventCount("game_started");
      const gameCompleted = getEventCount("game_completed");
      const grammarAsked = getEventCount("grammar_question_asked");
      const testStarted = getEventCount("test_started");
      const testCompleted = getEventCount("test_completed");
      const reviewStarted = getEventCount("review_started");
      const reviewCompleted = getEventCount("review_completed");
      
      // 查詢錯誤相關事件
      const vocabularyError = getEventCount("vocabulary_error");
      const gameError = getEventCount("game_error");
      const grammarError = getEventCount("grammar_error");
      const testError = getEventCount("test_error");
      
      // 查詢滿意度相關事件（如果有評分事件）
      const vocabularyRating = getEventCount("vocabulary_rated");
      const gameRating = getEventCount("game_rated");
      
      const totalStudentEvents = vocabularyCreated + gameStarted + grammarAsked + testStarted + reviewStarted;

      // 計算功能受歡迎度
      const popularFeatures: any[] = [];
      if (vocabularyCreated > 0) {
        const usage = safeDivide(vocabularyCreated, totalStudentEvents) 
          ? ((safeDivide(vocabularyCreated, totalStudentEvents)! * 100).toFixed(1))
          : "0";
        popularFeatures.push({
          feature: "單字本管理",
          usage,
          satisfaction: vocabularyRating > 0 ? "N/A" : null, // 如果有評分事件可以計算平均分
        });
      }
      if (grammarAsked > 0) {
        const usage = safeDivide(grammarAsked, totalStudentEvents)
          ? ((safeDivide(grammarAsked, totalStudentEvents)! * 100).toFixed(1))
          : "0";
        popularFeatures.push({
          feature: "文法家教",
          usage,
          satisfaction: null,
        });
      }
      if (gameStarted > 0) {
        const usage = safeDivide(gameStarted, totalStudentEvents)
          ? ((safeDivide(gameStarted, totalStudentEvents)! * 100).toFixed(1))
          : "0";
        popularFeatures.push({
          feature: "單字遊戲",
          usage,
          satisfaction: gameRating > 0 ? "N/A" : null,
        });
      }
      if (testStarted > 0) {
        const usage = safeDivide(testStarted, totalStudentEvents)
          ? ((safeDivide(testStarted, totalStudentEvents)! * 100).toFixed(1))
          : "0";
        popularFeatures.push({
          feature: "單字測驗",
          usage,
          satisfaction: null,
        });
      }
      if (reviewStarted > 0) {
        const usage = safeDivide(reviewStarted, totalStudentEvents)
          ? ((safeDivide(reviewStarted, totalStudentEvents)! * 100).toFixed(1))
          : "0";
        popularFeatures.push({
          feature: "單字複習",
          usage,
          satisfaction: null,
        });
      }

      // 計算錯誤率
      const errorRates: any[] = [];
      if (vocabularyCreated > 0) {
        const totalUses = vocabularyCreated;
        const errors = vocabularyError;
        const errorRate = safeDivide(errors, totalUses) 
          ? ((safeDivide(errors, totalUses)! * 100).toFixed(1))
          : "0";
        errorRates.push({
          feature: "單字本管理",
          errorRate: parseFloat(errorRate),
          totalUses,
        });
      }
      if (gameStarted > 0) {
        const totalUses = gameStarted;
        const errors = gameError;
        const errorRate = safeDivide(errors, totalUses)
          ? ((safeDivide(errors, totalUses)! * 100).toFixed(1))
          : "0";
        errorRates.push({
          feature: "單字遊戲",
          errorRate: parseFloat(errorRate),
          totalUses,
        });
      }
      if (grammarAsked > 0) {
        const totalUses = grammarAsked;
        const errors = grammarError;
        const errorRate = safeDivide(errors, totalUses)
          ? ((safeDivide(errors, totalUses)! * 100).toFixed(1))
          : "0";
        errorRates.push({
          feature: "文法家教",
          errorRate: parseFloat(errorRate),
          totalUses,
        });
      }
      if (testStarted > 0) {
        const totalUses = testStarted;
        const errors = testError;
        const errorRate = safeDivide(errors, totalUses)
          ? ((safeDivide(errors, totalUses)! * 100).toFixed(1))
          : "0";
        errorRates.push({
          feature: "單字測驗",
          errorRate: parseFloat(errorRate),
          totalUses,
        });
      }

      // 計算放棄率（開始但未完成）
      const abandonmentRates: any[] = [];
      if (gameStarted > 0) {
        const totalStarts = gameStarted;
        const completed = gameCompleted;
        const abandoned = totalStarts - completed;
        const abandonmentRate = safeDivide(abandoned, totalStarts)
          ? ((safeDivide(abandoned, totalStarts)! * 100).toFixed(1))
          : "0";
        abandonmentRates.push({
          feature: "單字遊戲",
          abandonmentRate: parseFloat(abandonmentRate),
          totalStarts,
        });
      }
      if (testStarted > 0) {
        const totalStarts = testStarted;
        const completed = testCompleted;
        const abandoned = totalStarts - completed;
        const abandonmentRate = safeDivide(abandoned, totalStarts)
          ? ((safeDivide(abandoned, totalStarts)! * 100).toFixed(1))
          : "0";
        abandonmentRates.push({
          feature: "單字測驗",
          abandonmentRate: parseFloat(abandonmentRate),
          totalStarts,
        });
      }
      if (reviewStarted > 0) {
        const totalStarts = reviewStarted;
        const completed = reviewCompleted;
        const abandoned = totalStarts - completed;
        const abandonmentRate = safeDivide(abandoned, totalStarts)
          ? ((safeDivide(abandoned, totalStarts)! * 100).toFixed(1))
          : "0";
        abandonmentRates.push({
          feature: "單字複習",
          abandonmentRate: parseFloat(abandonmentRate),
          totalStarts,
        });
      }

      return NextResponse.json({
        studentStats: {
          totalUsers: totalUsersCount,
          activeUsers: activeUsersCount,
          pageViews: studentPageViews.sort((a, b) => b.views - a.views),
          topEvents: studentEvents.sort((a, b) => b.count - a.count),
        },
        supplierStats: {
          totalUsers: totalUsersCount,
          activeUsers: activeUsersCount,
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
      console.error("[PostHog] API 調用錯誤:", {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name,
      });
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
        error: apiError.message || "PostHog API 調用失敗",
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
