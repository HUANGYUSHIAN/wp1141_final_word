/**
 * Script to check PostHog Personal API Key permissions
 * Usage: npm run check:posthog-permissions
 */

import * as dotenv from "dotenv";

dotenv.config();

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

async function checkPostHogPermissions() {
  console.log("\n🔍 檢查 PostHog Personal API Key 權限");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
    console.log("❌ 錯誤：環境變數未設置");
    if (!POSTHOG_PERSONAL_API_KEY) {
      console.log("   缺少: POSTHOG_PERSONAL_API_KEY");
    }
    if (!POSTHOG_PROJECT_ID) {
      console.log("   缺少: POSTHOG_PROJECT_ID");
    }
    console.log("\n📝 請在 .env 文件中設置這些變數\n");
    process.exit(1);
  }

  try {
    // 1. 測試項目訪問權限
    console.log("1️⃣ 測試項目訪問權限 (project:read)...");
    const projectUrl = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/`;
    const projectResponse = await fetch(projectUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      console.log("   ✅ 項目訪問成功");
      console.log(`   項目名稱: ${projectData.name || "未知"}`);
      console.log(`   項目 ID: ${projectData.id || POSTHOG_PROJECT_ID}\n`);
    } else {
      const errorText = await projectResponse.text();
      console.log(`   ❌ 項目訪問失敗 (${projectResponse.status})`);
      if (projectResponse.status === 401) {
        console.log("   💡 Personal API Key 無效或過期");
      } else if (projectResponse.status === 403) {
        console.log("   💡 缺少 project:read 權限");
        console.log("   📝 解決方法：");
        console.log("      1. 前往 PostHog → Settings → Personal API Keys");
        console.log("      2. 編輯您的 Personal API Key");
        console.log("      3. 勾選 'project:read' 權限");
        console.log("      4. 保存並更新 .env 文件\n");
      } else {
        console.log(`   錯誤: ${errorText.substring(0, 200)}\n`);
      }
      process.exit(1);
    }

    // 2. 測試 Query API 權限
    console.log("2️⃣ 測試 Query API 權限 (query:read)...");
    const queryUrl = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`;
    
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

    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const startFormatted = formatDateTime(startDate);
    
    const testQuery = {
      query: {
        kind: "HogQLQuery",
        query: `SELECT event, count() as count
                FROM events
                WHERE timestamp >= toDateTime('${startFormatted}')
                GROUP BY event
                ORDER BY count DESC
                LIMIT 5`,
      },
    };

    const queryResponse = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testQuery),
    });

    if (queryResponse.ok) {
      const queryResult = await queryResponse.json();
      console.log("   ✅ Query API 訪問成功");
      if (queryResult.results && Array.isArray(queryResult.results)) {
        console.log(`   找到 ${queryResult.results.length} 個事件\n`);
        if (queryResult.results.length > 0) {
          console.log("   前 3 個事件（原始數據格式）：");
          queryResult.results.slice(0, 3).forEach((item: any, index: number) => {
            console.log(`   ${index + 1}.`, JSON.stringify(item, null, 2));
          });
          console.log("\n   解析後的事件：");
          queryResult.results.slice(0, 3).forEach((item: any, index: number) => {
            const event = item.event || item[0] || "未知";
            const count = item.count || item[1] || item.count || 0;
            console.log(`   ${index + 1}. ${event}: ${count} 次`);
          });
        }
      } else {
        console.log("   ⚠️  沒有找到事件數據（可能是時間範圍內沒有事件）\n");
      }
    } else {
      const errorText = await queryResponse.text();
      console.log(`   ❌ Query API 訪問失敗 (${queryResponse.status})`);
      
      if (queryResponse.status === 401) {
        console.log("   💡 Personal API Key 無效或過期");
      } else if (queryResponse.status === 403) {
        console.log("   💡 缺少 query:read 權限");
        console.log("   📝 解決方法：");
        console.log("      1. 前往 PostHog → Settings → Personal API Keys");
        console.log("      2. 編輯您的 Personal API Key");
        console.log("      3. 勾選 'query:read' 權限");
        console.log("      4. 保存並更新 .env 文件\n");
      } else if (queryResponse.status === 400) {
        console.log("   💡 查詢格式錯誤");
        console.log(`   錯誤詳情: ${errorText.substring(0, 300)}\n`);
      } else {
        console.log(`   錯誤: ${errorText.substring(0, 200)}\n`);
      }
      process.exit(1);
    }

    // 3. 總結
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 權限檢查完成！");
    console.log("\n📋 權限狀態：");
    console.log("   ✅ project:read - 已授權");
    console.log("   ✅ query:read - 已授權");
    console.log("\n💡 如果統計數據頁面仍無法顯示數據，請檢查：");
    console.log("   1. 是否有事件數據（訪問應用並執行一些操作）");
    console.log("   2. 時間範圍是否正確");
    console.log("   3. 查看瀏覽器控制台和服務器日誌\n");

  } catch (error: any) {
    console.error("❌ 檢查過程中發生錯誤：", error.message);
    console.error("   詳細錯誤：", error.stack);
    console.log("\n💡 可能的原因：");
    console.log("   1. 網絡連接問題");
    console.log("   2. PostHog 服務器無法訪問");
    console.log("   3. API Key 格式不正確\n");
    process.exit(1);
  }
}

checkPostHogPermissions();

