/**
 * PostHog 配置测试脚本
 * 用于验证 PostHog 环境变量配置是否正确，以及能否成功发送事件
 */

import dotenv from "dotenv";
import path from "path";

// 加载 .env 文件
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

async function testPostHog() {
  console.log("🔍 开始测试 PostHog 配置...\n");

  // 1. 检查环境变量
  console.log("1️⃣ 检查环境变量:");
  console.log(`   NEXT_PUBLIC_POSTHOG_KEY: ${POSTHOG_KEY ? "✅ 已设置" : "❌ 未设置"}`);
  console.log(`   NEXT_PUBLIC_POSTHOG_HOST: ${POSTHOG_HOST}`);
  
  if (!POSTHOG_KEY) {
    console.error("\n❌ 错误: NEXT_PUBLIC_POSTHOG_KEY 未设置！");
    console.error("   请在 .env 文件中添加: NEXT_PUBLIC_POSTHOG_KEY=your_key");
    process.exit(1);
  }

  if (!POSTHOG_KEY.startsWith("phc_") && !POSTHOG_KEY.startsWith("phx_")) {
    console.warn("\n⚠️  警告: PostHog Key 格式可能不正确");
    console.warn("   通常 PostHog Key 应该以 'phc_' 或 'phx_' 开头");
  }

  // 2. 测试 PostHog API 连接
  console.log("\n2️⃣ 测试 PostHog API 连接:");
  
  const testEvent = {
    event: "test_event",
    properties: {
      test: true,
      timestamp: new Date().toISOString(),
      source: "test_script",
    },
    distinct_id: "test_user_" + Date.now(),
  };

  try {
    const apiUrl = `${POSTHOG_HOST}/capture/`;
    console.log(`   发送测试事件到: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: testEvent.event,
        properties: testEvent.properties,
        distinct_id: testEvent.distinct_id,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ API 连接成功！");
      console.log(`   响应: ${JSON.stringify(data, null, 2)}`);
    } else {
      const errorText = await response.text();
      console.error(`   ❌ API 连接失败 (状态码: ${response.status})`);
      console.error(`   错误信息: ${errorText}`);
      
      if (response.status === 401) {
        console.error("\n   💡 提示: 可能是 API Key 无效，请检查:");
        console.error("      - API Key 是否正确复制");
        console.error("      - API Key 是否已激活");
        console.error("      - 项目是否已创建");
      } else if (response.status === 404) {
        console.error("\n   💡 提示: 可能是 PostHog Host 地址不正确");
        console.error(`      当前 Host: ${POSTHOG_HOST}`);
        console.error("      如果是自托管，请确认地址正确");
      }
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`   ❌ 连接错误: ${error.message}`);
    console.error("\n   💡 可能的原因:");
    console.error("      - 网络连接问题");
    console.error("      - PostHog Host 地址无法访问");
    console.error(`      - 当前 Host: ${POSTHOG_HOST}`);
    process.exit(1);
  }

  // 3. 测试 Personal API Key 和 Project ID
  console.log("\n3️⃣ 测试数据查询配置:");
  console.log(`   POSTHOG_PERSONAL_API_KEY: ${POSTHOG_PERSONAL_API_KEY ? "✅ 已设置" : "❌ 未设置"}`);
  console.log(`   POSTHOG_PROJECT_ID: ${POSTHOG_PROJECT_ID ? "✅ 已设置" : "❌ 未设置"}`);
  
  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("\n   ⚠️  警告: 未配置完整的数据查询参数");
    console.warn("   ℹ️  这不会影响事件追踪功能，但无法在 /admin/statistics 查询统计数据");
    console.warn("   💡 要启用统计数据查询，请在 .env 文件中添加:");
    if (!POSTHOG_PERSONAL_API_KEY) {
      console.warn("      POSTHOG_PERSONAL_API_KEY=你的_personal_api_key");
    }
    if (!POSTHOG_PROJECT_ID) {
      console.warn("      POSTHOG_PROJECT_ID=你的_project_id");
    }
  } else {
    // 测试 Personal API Key 格式
    if (!POSTHOG_PERSONAL_API_KEY.startsWith("phx_") && !POSTHOG_PERSONAL_API_KEY.startsWith("phc_")) {
      console.warn("\n   ⚠️  警告: Personal API Key 格式可能不正确");
      console.warn("   通常 Personal API Key 应该以 'phx_' 开头");
    }
    
    // 测试 Project ID 格式
    if (isNaN(Number(POSTHOG_PROJECT_ID))) {
      console.warn("\n   ⚠️  警告: Project ID 格式可能不正确");
      console.warn("   Project ID 通常是一个数字");
    }
    
    // 测试 API Key 和 Project ID 的基本验证（通过检查项目信息）
    try {
      console.log("\n   测试 Personal API Key 和 Project ID 有效性...");
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
        console.log("   ✅ Personal API Key 和 Project ID 验证成功！");
        console.log(`   项目名称: ${projectData.name || "未知"}`);
        console.log(`   项目 ID: ${projectData.id || POSTHOG_PROJECT_ID}`);
      } else {
        const errorText = await projectResponse.text();
        console.error(`   ❌ 验证失败 (状态码: ${projectResponse.status})`);
        
        if (projectResponse.status === 401) {
          console.error("\n   💡 提示: Personal API Key 可能无效，请检查:");
          console.error("      - Personal API Key 是否正确复制");
          console.error("      - Personal API Key 是否已激活");
        } else if (projectResponse.status === 403) {
          console.error("\n   ⚠️  警告: Personal API Key 缺少必要权限");
          console.error("   💡 解决方法:");
          console.error("      1. 前往 PostHog → Settings → Personal API Keys");
          console.error("      2. 编辑或创建新的 Personal API Key");
          console.error("      3. 确保勾选以下权限:");
          console.error("         - project:read (读取项目信息)");
          console.error("         - query:read (查询数据)");
          console.error("      4. 保存后更新 .env 文件中的 POSTHOG_PERSONAL_API_KEY");
        } else if (projectResponse.status === 404) {
          console.error("\n   💡 提示: Project ID 可能不正确");
          console.error(`      当前 Project ID: ${POSTHOG_PROJECT_ID}`);
          console.error("      请在 PostHog 项目设置中确认 Project ID");
        } else {
          console.error(`   错误信息: ${errorText}`);
        }
      }
    } catch (error: any) {
      console.warn(`   ⚠️  验证测试错误: ${error.message}`);
      console.warn("   ℹ️  这不影响基本配置，但可能影响数据查询功能");
      console.warn("   💡 如果 /admin/statistics 无法显示数据，请检查:");
      console.warn("      - Personal API Key 是否正确");
      console.warn("      - Project ID 是否正确");
      console.warn("      - Personal API Key 是否有访问该项目的权限");
    }
  }

  // 4. 总结
  console.log("\n✅ PostHog 配置测试完成！");
  console.log("\n📊 配置摘要:");
  console.log(`   Project API Key: ${POSTHOG_KEY ? `${POSTHOG_KEY.substring(0, 10)}...${POSTHOG_KEY.substring(POSTHOG_KEY.length - 4)}` : "❌ 未设置"}`);
  console.log(`   Personal API Key: ${POSTHOG_PERSONAL_API_KEY ? `${POSTHOG_PERSONAL_API_KEY.substring(0, 10)}...${POSTHOG_PERSONAL_API_KEY.substring(POSTHOG_PERSONAL_API_KEY.length - 4)}` : "❌ 未设置"}`);
  console.log(`   Project ID: ${POSTHOG_PROJECT_ID || "❌ 未设置"}`);
  console.log(`   Host: ${POSTHOG_HOST}`);
  
  console.log("\n📋 功能状态:");
  console.log(`   ✅ 事件追踪: ${POSTHOG_KEY ? "已配置" : "❌ 未配置"}`);
  console.log(`   ${POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID ? "✅" : "⚠️"} 数据查询: ${POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID ? "已配置" : "未完整配置"}`);
  
  console.log("\n💡 下一步:");
  console.log("   1. 启动开发服务器: npm run dev");
  console.log("   2. 访问应用并执行一些操作");
  console.log("   3. 在 PostHog 仪表板查看事件");
  if (POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID) {
    console.log("   4. 访问 /admin/statistics 查看统计数据");
  } else {
    console.log("   4. 配置 POSTHOG_PERSONAL_API_KEY 和 POSTHOG_PROJECT_ID 后，可访问 /admin/statistics 查看统计数据");
  }
}

// 运行测试
testPostHog().catch((error) => {
  console.error("\n❌ 测试过程中发生错误:", error);
  process.exit(1);
});

