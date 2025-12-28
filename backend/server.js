/**
 * 紫微斗数命盘分析系统 - 后端服务器
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const ZiweiParser = require('./parser');
const ZiweiAnalyzer = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// 初始化解析器和分析器
const parser = new ZiweiParser();
const analyzer = new ZiweiAnalyzer(process.env.GEMINI_API_KEY);

// 数据目录
const DATA_DIR = path.join(__dirname, '../data/analyses');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * API: 分析命盘
 * POST /api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, name } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '请提供命盘文本' });
    }
    
    console.log('开始解析命盘...');
    
    // 1. 解析命盘文本
    const parsedData = parser.parse(text);
    
    console.log('命盘解析完成，开始AI分析...');
    
    // 2. AI分析
    const analysis = await analyzer.analyze(parsedData);
    
    console.log('AI分析完成，保存结果...');
    
    // 3. 生成唯一ID和保存数据
    const timestamp = Date.now();
    const id = `${timestamp}_${name || 'unknown'}`;
    
    const result = {
      id,
      timestamp,
      name: name || '未命名',
      parsedData,
      analysis,
      createdAt: new Date().toISOString()
    };
    
    // 4. 保存到文件
    await ensureDataDir();
    const filename = `${id}.json`;
    const filepath = path.join(DATA_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(result, null, 2), 'utf-8');
    
    console.log('分析结果已保存:', filename);
    
    res.json({
      success: true,
      id,
      data: result
    });
    
  } catch (error) {
    console.error('分析错误:', error);
    res.status(500).json({
      error: '分析失败',
      message: error.message
    });
  }
});

/**
 * API: 获取所有分析列表
 * GET /api/analyses
 */
app.get('/api/analyses', async (req, res) => {
  try {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    
    const analyses = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filepath = path.join(DATA_DIR, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const data = JSON.parse(content);
        
        // 只返回摘要信息
        analyses.push({
          id: data.id,
          name: data.name,
          timestamp: data.timestamp,
          createdAt: data.createdAt,
          basicInfo: data.parsedData.basicInfo
        });
      }
    }
    
    // 按时间倒序排列
    analyses.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({
      success: true,
      count: analyses.length,
      data: analyses
    });
    
  } catch (error) {
    console.error('获取列表错误:', error);
    res.status(500).json({
      error: '获取列表失败',
      message: error.message
    });
  }
});

/**
 * API: 获取特定分析详情
 * GET /api/analysis/:id
 */
app.get('/api/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找匹配的文件
    const files = await fs.readdir(DATA_DIR);
    const matchFile = files.find(f => f.startsWith(id));
    
    if (!matchFile) {
      return res.status(404).json({ error: '未找到该分析记录' });
    }
    
    const filepath = path.join(DATA_DIR, matchFile);
    const content = await fs.readFile(filepath, 'utf-8');
    const data = JSON.parse(content);
    
    res.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('获取详情错误:', error);
    res.status(500).json({
      error: '获取详情失败',
      message: error.message
    });
  }
});

/**
 * API: 删除分析记录
 * DELETE /api/analysis/:id
 */
app.delete('/api/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const files = await fs.readdir(DATA_DIR);
    const matchFile = files.find(f => f.startsWith(id));
    
    if (!matchFile) {
      return res.status(404).json({ error: '未找到该分析记录' });
    }
    
    const filepath = path.join(DATA_DIR, matchFile);
    await fs.unlink(filepath);
    
    res.json({
      success: true,
      message: '删除成功'
    });
    
  } catch (error) {
    console.error('删除错误:', error);
    res.status(500).json({
      error: '删除失败',
      message: error.message
    });
  }
});

/**
 * API: 健康检查
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🌟 紫微斗数分析系统已启动`);
  console.log(`📡 服务器运行在: http://localhost:${PORT}`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '已配置' : '未配置'}`);
  console.log(`\n请在浏览器中打开: http://localhost:${PORT}\n`);
});
