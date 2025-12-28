const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../.env' });

async function diagnose() {
  console.log("🔍 开始诊断 API 密钥和模型...");
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ 错误: .env 文件中未找到 GEMINI_API_KEY");
    return;
  }
  
  console.log(`🔑 当前使用的密钥: ${apiKey.substring(0, 10)}******`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // 尝试列出所有可用模型
    // 这是最基础的API权限检查
    console.log("📡 正在连接 Google API 获取可用模型列表...");
    
    // 注意: 目前 Node.js SDK 没有直接公开 listModels，我们用 fetch 直接调用 REST API
    // 这样可以排除 SDK 版本问题，直接测试 API 和 密钥
    const fetch = global.fetch || require('node-fetch');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ API 请求失败!`);
      console.error(`   状态码: ${response.status}`);
      console.error(`   错误信息: ${JSON.stringify(data.error, null, 2)}`);
      
      if (response.status === 400 && data.error.status === 'INVALID_ARGUMENT') {
        console.log("\n💡 分析: API密钥无效");
        console.log("   请检查密钥是否复制完整，或者项目是否已被删除。");
      }
      return;
    }
    
    console.log("\n✅ API 密钥验证成功！您可以访问以下模型：\n");
    
    const models = data.models || [];
    if (models.length === 0) {
      console.warn("⚠️  警告: 没有找到可用模型。请确认您的项目已启用 Generative Language API。");
    }
    
    let hasGeminiPro = false;
    let hasGemini15Pro = false;
    
    models.forEach(model => {
      console.log(`   - ${model.name.replace('models/', '')}`);
      // console.log(`     支持操作: ${model.supportedGenerationMethods.join(', ')}`);
      
      if (model.name.includes('gemini-pro')) hasGeminiPro = true;
      if (model.name.includes('gemini-1.5-pro')) hasGemini15Pro = true;
    });
    
    console.log("\n📊 模型可用性总结:");
    console.log(`   Gemini Pro: ${hasGeminiPro ? '✅ 可用' : '❌ 不可用'}`);
    console.log(`   Gemini 1.5 Pro: ${hasGemini15Pro ? '✅ 可用' : '❌ 不可用'}`);
    
  } catch (error) {
    console.error("❌ 网络连接失败");
    console.error("   错误信息:", error.message);
    console.log("\n💡 提示: 如果您在中国大陆，请确保您的终端已配置代理/VPN。");
    console.log("   Google API (generativelanguage.googleapis.com) 在国内无法直接访问。");
  }
}

diagnose();
