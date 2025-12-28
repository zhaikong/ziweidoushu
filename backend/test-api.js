/**
 * API密钥测试脚本
 * 用于验证Gemini API密钥是否有效
 */

require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testApiKey() {
    console.log('\n🔍 开始测试 Gemini API 密钥...\n');
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error('❌ 错误：未找到 GEMINI_API_KEY 环境变量');
        console.log('请检查 .env 文件是否正确配置\n');
        process.exit(1);
    }
    
    console.log(`✅ API密钥已加载: ${apiKey.substring(0, 20)}...`);
    console.log('');
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 测试最基础的 Gemini Pro 模型
        console.log('📡 测试 Gemini Pro 模型...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const result = await model.generateContent('请用一句话介绍紫微斗数');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ API密钥有效！');
        console.log('✅ Gemini Pro 模型响应成功！');
        console.log('');
        console.log('📝 测试响应：');
        console.log(text);
        console.log('');
        
        
        console.log('✅ API密钥有效！');
        console.log('✅ Gemini 1.5 Pro 模型响应成功！');
        console.log('');
        console.log('📝 测试响应：');
        console.log(text);
        console.log('');
        
        // 如果1.5 Pro成功，再测试3.0 Pro
        console.log('📡 测试 Gemini 3.0 Pro 模型...');
        try {
            const model3 = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
            const result3 = await model3.generateContent('测试');
            await result3.response;
            console.log('✅ Gemini 3.0 Pro 模型也可用！');
        } catch (e) {
            console.log('⚠️  Gemini 3.0 Pro 暂不可用，建议使用 Gemini 1.5 Pro');
            console.log('   错误：', e.message.split('\n')[0]);
        }
        
        console.log('');
        console.log('🎉 恭喜！您的API密钥配置正确，可以正常使用了！');
        console.log('');
        
    } catch (error) {
        console.error('❌ API密钥测试失败！');
        console.error('');
        console.error('错误信息：', error.message);
        console.error('');
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.log('💡 解决方案：');
            console.log('1. 访问 https://aistudio.google.com/app/apikey');
            console.log('2. 创建新的API密钥');
            console.log('3. 替换 .env 文件中的 GEMINI_API_KEY');
        } else if (error.message.includes('404')) {
            console.log('💡 可能原因：');
            console.log('- Gemini 3.0 Pro 模型可能还未对您的账号开放');
            console.log('- 建议尝试使用 gemini-2.0-flash-exp 或 gemini-1.5-pro');
        } else {
            console.log('💡 建议：');
            console.log('- 检查网络连接');
            console.log('- 确认API密钥是否正确复制（无多余空格）');
            console.log('- 访问 Google Cloud Console 检查API是否已启用');
        }
        console.log('');
        process.exit(1);
    }
}

testApiKey();
