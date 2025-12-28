/**
 * 主页交互逻辑
 */

const API_BASE = '/api';

// DOM元素
const analyzeBtn = document.getElementById('analyzeBtn');
const clientNameInput = document.getElementById('clientName');
const chartTextInput = document.getElementById('chartText');
const loadingMsg = document.getElementById('loadingMsg');
const historyList = document.getElementById('historyList');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    
    // 绑定事件
    analyzeBtn.addEventListener('click', handleAnalyze);
    refreshBtn.addEventListener('click', loadHistory);
    searchInput.addEventListener('input', handleSearch);
});

/**
 * 处理分析请求
 */
async function handleAnalyze() {
    const text = chartTextInput.value.trim();
    const name = clientNameInput.value.trim() || '未命名';
    
    if (!text) {
        alert('请输入命盘文本数据');
        return;
    }
    
    // 显示加载状态
    analyzeBtn.disabled = true;
    loadingMsg.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, name })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 跳转到分析结果页
            window.location.href = `analysis.html?id=${result.id}`;
        } else {
            alert('分析失败: ' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('分析错误:', error);
        alert('分析失败: ' + error.message);
    } finally {
        analyzeBtn.disabled = false;
        loadingMsg.style.display = 'none';
    }
}

/**
 * 加载历史记录
 */
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/analyses`);
        const result = await response.json();
        
        if (result.success) {
            displayHistory(result.data);
        }
    } catch (error) {
        console.error('加载历史记录错误:', error);
        historyList.innerHTML = '<p style="text-align: center; color: #999;">加载失败</p>';
    }
}

/**
 * 显示历史记录
 */
function displayHistory(analyses) {
    if (analyses.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999;">暂无分析记录</p>';
        return;
    }
    
    historyList.innerHTML = analyses.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-info">
                <h3>${item.name}</h3>
                <p>出生时间: ${item.basicInfo.lunarTime || '未知'}</p>
                <p>分析时间: ${new Date(item.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            <div class="history-item-actions">
                <button class="btn-view" onclick="viewAnalysis('${item.id}')">查看</button>
                <button class="btn-delete" onclick="deleteAnalysis('${item.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

/**
 * 查看分析结果
 */
function viewAnalysis(id) {
    window.location.href = `analysis.html?id=${id}`;
}

/**
 * 删除分析记录
 */
async function deleteAnalysis(id) {
    if (!confirm('确定要删除这条分析记录吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/analysis/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadHistory(); // 重新加载列表
        } else {
            alert('删除失败: ' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('删除错误:', error);
        alert('删除失败: ' + error.message);
    }
}

/**
 * 搜索历史记录
 */
function handleSearch(e) {
    const keyword = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.history-item');
    
    items.forEach(item => {
        const name = item.querySelector('h3').textContent.toLowerCase();
        if (name.includes(keyword)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}
