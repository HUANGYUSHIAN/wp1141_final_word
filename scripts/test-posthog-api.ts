/**
 * Script to test PostHog API connection and query
 * Usage: npm run test:posthog-api
 */

import * as dotenv from "dotenv";

dotenv.config();

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

async function testPostHogAPI() {
  console.log("\n🔍 PostHog API 連接測試");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 檢查環境變數
  console.log("📋 環境變數檢查：");
  console.log(`   POSTHOG_HOST: ${POSTHOG_HOST}`);
  console.log(`   POSTHOG_PERSONAL_API_KEY: ${POSTHOG_PERSONAL_API_KEY ? "✅ 已設置" : "❌ 未設置"}`);
  console.log(`   POSTHOG_PROJECT_ID: ${POSTHOG_PROJECT_ID ? `✅ ${POSTHOG_PROJECT_ID}` : "❌ 未設置"}`);
  console.log("");

  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
    console.log("❌ 錯誤：缺少必要的環境變數");
    console.log("\n📝 請在 .env 文件中設置：");
    if (!POSTHOG_PERSONAL_API_KEY) {
      console.log("   POSTHOG_PERSONAL_API_KEY=your-personal-api-key");
      console.log("   獲取方式：PostHog 設置 > Personal API Keys > Create new key");
    }
    if (!POSTHOG_PROJECT_ID) {
      console.log("   POSTHOG_PROJECT_ID=your-project-id");
      console.log("   獲取方式：PostHog 項目設置 > Project ID");
    }
    console.log("");
    process.exit(1);
  }

  // 測試 API 連接
  const queryUrl = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`;
  console.log("🌐 測試 API 連接：");
  console.log(`   URL: ${queryUrl}\n`);

  // 將 ISO 格式轉換為 ClickHouse DateTime 格式
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

  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startFormatted = formatDateTime(startDate);
  
  const testQuery = {
    query: {
      kind: "HogQLQuery",
      query: `SELECT event, count() as count
              FROM events
              WHERE timestamp >= toDateTime('${startFormatted}')
              GROUP BY event
              ORDER BY count DESC
              LIMIT 10`,
    },
  };

  try {
    console.log("📤 發送測試查詢...");
    const response = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testQuery),
    });

    console.log(`   HTTP 狀態碼: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ API 請求失敗：");
      console.log(`   錯誤內容: ${errorText.substring(0, 500)}\n`);
      
      if (response.status === 401) {
        console.log("💡 提示：可能是 Personal API Key 無效或過期");
      } else if (response.status === 404) {
        console.log("💡 提示：可能是 Project ID 不正確或 URL 格式錯誤");
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log("✅ API 連接成功！\n");
    console.log("📊 查詢結果：");
    
    if (result.results && Array.isArray(result.results)) {
      console.log(`   找到 ${result.results.length} 個事件\n`);
      if (result.results.length > 0) {
        console.log("   📋 原始數據格式（前 3 個）：");
        result.results.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`   ${index + 1}.`, JSON.stringify(item));
        });
        console.log("\n   🔍 解析後的事件：");
        result.results.slice(0, 5).forEach((item: any, index: number) => {
          // 處理陣列格式：["event_name", count]
          let event: string;
          let count: number;
          
          if (Array.isArray(item)) {
            // 陣列格式：["event_name", count, ...]
            event = item[0] || "未知";
            count = Number(item[1]) || 0;
          } else if (typeof item === "object") {
            // 對象格式：{ event: "...", count: ... }
            event = item.event || item[0] || "未知";
            count = Number(item.count || item[1] || item["count()"] || 0);
          } else {
            event = "未知";
            count = 0;
          }
          
          console.log(`   ${index + 1}. ${event}: ${count} 次`);
        });
      } else {
        console.log("   ⚠️  沒有找到任何事件數據");
        console.log("   這可能是因為：");
        console.log("   1. 時間範圍內沒有事件");
        console.log("   2. PostHog SDK 未正確集成");
        console.log("   3. 事件追蹤未啟用");
      }
    } else {
      console.log("   ⚠️  響應格式異常：");
      console.log(`   ${JSON.stringify(result, null, 2).substring(0, 500)}`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 測試完成\n");
  } catch (error: any) {
    console.error("❌ 測試失敗：", error.message);
    console.error("   詳細錯誤：", error.stack);
    console.log("\n💡 可能的原因：");
    console.log("   1. 網絡連接問題");
    console.log("   2. PostHog 服務器無法訪問");
    console.log("   3. API Key 或 Project ID 不正確");
    console.log("");
    process.exit(1);
  }
}

testPostHogAPI();

