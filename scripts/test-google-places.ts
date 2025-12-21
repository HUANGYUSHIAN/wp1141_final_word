/**
 * 測試 Google Places API 是否正確配置並可以正常工作
 * 
 * 使用方法：
 * npx tsx scripts/test-google-places.ts
 */

import dotenv from "dotenv";
import path from "path";

// 載入環境變數
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testGooglePlacesAPI() {
  console.log("🔍 測試 Google Places API 配置...\n");

  // 檢查 API Key
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("❌ 錯誤：GOOGLE_MAPS_API_KEY 未設置");
    console.log("\n請在 .env.local 或 .env 文件中添加：");
    console.log("GOOGLE_MAPS_API_KEY=your_api_key_here");
    process.exit(1);
  }

  console.log("✅ API Key 已設置");
  console.log(`   Key 前綴: ${apiKey.substring(0, 10)}...`);
  console.log(`   Key 長度: ${apiKey.length} 字元\n`);

  // 測試查詢
  const testQueries = [
    {
      name: "測試 1: 店名 + 地址",
      textQuery: "五九麵館 100臺北市中正區羅斯福路三段286巷4弄12號",
    },
    {
      name: "測試 2: 只有店名",
      textQuery: "麥當勞",
    },
    {
      name: "測試 3: 只有地址",
      textQuery: "100臺北市中正區羅斯福路三段286巷4弄12號",
    },
  ];

  for (const test of testQueries) {
    console.log(`\n📝 ${test.name}`);
    console.log(`   查詢字串: "${test.textQuery}"`);
    
    try {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.googleMapsUri,places.displayName",
          },
          body: JSON.stringify({
            textQuery: test.textQuery,
            maxResultCount: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`   ❌ API 請求失敗 (狀態碼: ${response.status})`);
        console.error(`   錯誤詳情:`, JSON.stringify(errorData, null, 2));
        
        if (response.status === 403) {
          console.error("\n   ⚠️  可能的問題：");
          console.error("   1. API Key 無效或已過期");
          console.error("   2. Places API (New) 未啟用");
          console.error("   3. API Key 沒有 Places API (New) 的權限");
          console.error("\n   請檢查 Google Cloud Console：");
          console.error("   https://console.cloud.google.com/apis/library");
        }
        continue;
      }

      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        console.log(`   ✅ 找到結果！`);
        console.log(`   店家名稱: ${place.displayName?.text || "N/A"}`);
        console.log(`   Place ID: ${place.id || "N/A"}`);
        console.log(`   Google Maps URI: ${place.googleMapsUri || "N/A"}`);
      } else {
        console.log(`   ⚠️  未找到匹配的結果`);
      }
    } catch (error: any) {
      console.error(`   ❌ 請求發生錯誤: ${error.message}`);
      if (error.message.includes("fetch")) {
        console.error("   請檢查網路連線");
      }
    }
  }

  console.log("\n\n✨ 測試完成！");
}

// 執行測試
testGooglePlacesAPI().catch((error) => {
  console.error("未預期的錯誤:", error);
  process.exit(1);
});

