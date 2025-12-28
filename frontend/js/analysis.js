/**
 * 分析结果页面逻辑
 */

const API_BASE = '/api';

// 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const analysisId = urlParams.get('id');

// DOM元素
const loadingIndicator = document.getElementById('loadingIndicator');
const analysisContent = document.getElementById('analysisContent');

/**
 * 生成白话解读块
 */
function renderPlainBlock(text) {
    if (!text) return '';
    return `
        <div class="plain-explain">
            <div class="plain-label">白话解读</div>
            <p>${text}</p>
        </div>
    `;
}

/**
 * 生成推算依据列表
 */
function renderBasisList(items) {
    const list = Array.isArray(items) ? items : (typeof items === 'string' ? [items] : []);
    if (list.length === 0) return '';
    return `
        <div class="basis-block">
            <div class="basis-label">推算依据</div>
            <ul class="basis-list">
                ${list.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}

/**
 * 生成化解/强化建议列表
 */
function renderSolutionList(items) {
    const list = Array.isArray(items) ? items : (typeof items === 'string' ? [items] : []);
    if (list.length === 0) return '';
    return `
        <div class="solution-block">
            <div class="solution-label">应对建议</div>
            <ul class="solution-list">
                ${list.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    if (!analysisId) {
        alert('缺少分析ID');
        window.location.href = 'index.html';
        return;
    }
    
    loadAnalysis();
});

/**
 * 加载分析结果
 */
async function loadAnalysis() {
    try {
        loadingIndicator.style.display = 'block';
        
        const response = await fetch(`${API_BASE}/analysis/${analysisId}`);
        const result = await response.json();
        
        if (result.success) {
            displayAnalysis(result.data);
        } else {
            alert('加载失败: ' + (result.message || '未知错误'));
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('加载错误:', error);
        alert('加载失败: ' + error.message);
        window.location.href = 'index.html';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * 显示分析结果
 */
function displayAnalysis(data) {
    const { parsedData, analysis } = data;
    
    // 显示基本信息
    displayBasicInfo(parsedData.basicInfo, analysis);
    
    // 显示总论
    displayOverallAnalysis(analysis.overall);
    
    // 显示宫位分析
    displayPalaceAnalysis(analysis.palaces, parsedData.palaces);
    
    // 绘制命盘图
    drawPalaceChart(parsedData.palaces, parsedData.basicInfo.bodyPalace);
    
    // 显示流年运势
    displayYearlyFortune(analysis.yearlyFortune, analysis);

    // 显示关键事件
    displayKeyEvents(analysis.keyEvents);
    
    // 显示专项分析
    displaySpecialAnalysis(analysis.specialAnalysis);
    
    // 显示建议
    displaySuggestions(analysis.suggestions);
    
    // 显示内容
    analysisContent.style.display = 'block';
}

/**
 * 显示基本信息
 */
function displayBasicInfo(basicInfo, analysis) {
    const container = document.getElementById('basicInfo');
    
    const items = [
        { label: '性别', value: basicInfo.gender },
        { label: '出生时间', value: basicInfo.lunarTime },
        { label: '四柱', value: basicInfo.solarPillars },
        { label: '五行局', value: basicInfo.element },
        { label: '命主', value: basicInfo.lifeMaster },
        { label: '身主', value: basicInfo.bodyMaster },
        { label: '身宫', value: basicInfo.bodyPalace }
    ];

    if (analysis && analysis.startLuckAge) {
        items.push({ label: '起运年龄', value: `${analysis.startLuckAge}岁` });
    }
    if (analysis && analysis.startLuckYear) {
        items.push({ label: '起运年份', value: `${analysis.startLuckYear}年` });
    }
    
    container.innerHTML = items.map(item => `
        <div class="info-item">
            <div class="info-label">${item.label}</div>
            <div class="info-value">${item.value || '未知'}</div>
        </div>
    `).join('');
}

/**
 * 显示总论
 */
function displayOverallAnalysis(overall) {
    const container = document.getElementById('overallAnalysis');
    
    if (!overall) {
        container.innerHTML = '<p>暂无总论数据</p>';
        return;
    }
    
    const items = [
        { title: '格局特点', content: overall.pattern, plain: overall.patternPlain, basis: overall.patternBasis, solutions: overall.patternSolutions },
        { title: '性格特质', content: overall.personality, plain: overall.personalityPlain, basis: overall.personalityBasis, solutions: overall.personalitySolutions },
        { title: '人生走向', content: overall.lifeTrend, plain: overall.lifeTrendPlain, basis: overall.lifeTrendBasis, solutions: overall.lifeTrendSolutions }
    ];
    
    container.innerHTML = items.map(item => `
        <div class="overall-item">
            <h3>${item.title}</h3>
            <p>${item.content || '暂无数据'}</p>
            ${renderPlainBlock(item.plain)}
            ${renderBasisList(item.basis)}
            ${renderSolutionList(item.solutions)}
        </div>
    `).join('');
}

/**
 * 显示宫位分析
 */
function displayPalaceAnalysis(palaceAnalysis, palaceData) {
    const container = document.getElementById('palaceAnalysis');
    
    if (!palaceAnalysis) {
        container.innerHTML = '<p>暂无宫位分析数据</p>';
        return;
    }
    
    const palaceOrder = [
        '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
        '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
    ];
    
    container.innerHTML = palaceOrder.map(name => {
        const analysis = palaceAnalysis[name];
        if (!analysis) return '';
        
        const keywords = analysis.keywords || [];
        const keywordsHtml = keywords.map(kw => 
            `<span class="keyword-tag">${kw}</span>`
        ).join('');
        
        return `
            <div class="palace-item">
                <h3>${name}</h3>
                ${keywords.length > 0 ? `<div class="palace-keywords">${keywordsHtml}</div>` : ''}
                <p>${analysis.analysis || '暂无分析'}</p>
                ${renderPlainBlock(analysis.analysisPlain)}
                ${renderBasisList(analysis.basis)}
                ${renderSolutionList(analysis.solutions)}
            </div>
        `;
    }).join('');
}

/**
 * 绘制命盘图
 */
function drawPalaceChart(palaces, bodyPalace) {
    const visualizer = new PalaceVisualizer('palaceCanvas');
    visualizer.draw(palaces, bodyPalace);
}

/**
 * 显示流年运势
 */
function displayYearlyFortune(yearlyFortune, analysis) {
    const container = document.getElementById('yearlyFortune');
    
    if (!yearlyFortune || yearlyFortune.length === 0) {
        container.innerHTML = '<p>暂无流年运势数据</p>';
        return;
    }

    const ages = yearlyFortune
        .map(item => (typeof item.age === 'number' ? item.age : parseInt(item.age, 10)))
        .filter(age => Number.isFinite(age));
    const years = yearlyFortune
        .map(item => (typeof item.year === 'number' ? item.year : parseInt(item.year, 10)))
        .filter(year => Number.isFinite(year));
    const minAge = ages.length ? Math.min(...ages) : null;
    const maxAge = ages.length ? Math.max(...ages) : null;
    const minYear = years.length ? Math.min(...years) : null;
    const maxYear = years.length ? Math.max(...years) : null;
    const metaParts = [];
    if (analysis && analysis.startLuckAge) {
        metaParts.push(`起运年龄：${analysis.startLuckAge}岁`);
    }
    if (analysis && analysis.startLuckYear) {
        metaParts.push(`起运年份：${analysis.startLuckYear}年`);
    }
    if (minAge !== null && maxAge !== null) {
        metaParts.push(`流年范围：${minAge}-${maxAge}岁`);
    }
    if (minYear !== null && maxYear !== null) {
        metaParts.push(`年份范围：${minYear}-${maxYear}年`);
    }
    const metaHtml = metaParts.length > 0
        ? `<div class="fortune-meta">${metaParts.join(' · ')}</div>`
        : '';
    
    container.innerHTML = metaHtml + yearlyFortune.map(year => {
        const focusHtml = (year.focus || []).map(f => 
            `<span class="focus-tag">${f}</span>`
        ).join('');
        
        return `
            <div class="fortune-year level-${year.level}">
                <div class="fortune-header">
                    <span class="fortune-year-title">${year.year}年 (${year.age}岁)</span>
                    <span class="fortune-level ${year.level}">${year.level}</span>
                </div>
                ${year.focus && year.focus.length > 0 ? `<div class="fortune-focus">${focusHtml}</div>` : ''}
                <p>${year.fortune}</p>
                ${renderPlainBlock(year.fortunePlain)}
                ${renderBasisList(year.basis)}
                ${renderSolutionList(year.solutions)}
                ${year.warning ? `<p class="warning-text">⚠️ ${year.warning}</p>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * 显示关键事件
 */
function displayKeyEvents(keyEvents) {
    const container = document.getElementById('keyEvents');
    if (!container) return;
    
    if (!Array.isArray(keyEvents) || keyEvents.length === 0) {
        container.innerHTML = '<p>暂无关键事件数据</p>';
        return;
    }
    
    container.innerHTML = keyEvents.map(event => `
        <div class="event-item level-${event.level}">
            <div class="event-header">
                <div>
                    <div class="event-time">${event.timeRange || '时间范围未知'}</div>
                    ${event.ageRange ? `<div class="event-age">年龄范围：${event.ageRange}</div>` : ''}
                </div>
                <div class="event-tags">
                    ${event.level ? `<span class="event-level ${event.level}">${event.level}</span>` : ''}
                    ${event.impact ? `<span class="event-impact">影响：${event.impact}</span>` : ''}
                </div>
            </div>
            ${event.area ? `<div class="event-area">领域：${event.area}</div>` : ''}
            <p class="event-desc">${event.event || '暂无描述'}</p>
            ${renderBasisList(event.basis)}
            ${renderSolutionList(event.solutions)}
        </div>
    `).join('');
}

/**
 * 显示专项分析
 */
function displaySpecialAnalysis(specialAnalysis) {
    const container = document.getElementById('specialAnalysis');
    
    if (!specialAnalysis) {
        container.innerHTML = '<p>暂无专项分析数据</p>';
        return;
    }
    
    const items = [
        { title: '事业财运', icon: '💼', content: specialAnalysis.career, plain: specialAnalysis.careerPlain, basis: specialAnalysis.careerBasis, solutions: specialAnalysis.careerSolutions },
        { title: '学业进修', icon: '📚', content: specialAnalysis.study, plain: specialAnalysis.studyPlain, basis: specialAnalysis.studyBasis, solutions: specialAnalysis.studySolutions },
        { title: '婚姻感情', icon: '💕', content: specialAnalysis.marriage, plain: specialAnalysis.marriagePlain, basis: specialAnalysis.marriageBasis, solutions: specialAnalysis.marriageSolutions },
        { title: '健康养生', icon: '🏥', content: specialAnalysis.health, plain: specialAnalysis.healthPlain, basis: specialAnalysis.healthBasis, solutions: specialAnalysis.healthSolutions },
        { title: '人际关系', icon: '👥', content: specialAnalysis.relationship, plain: specialAnalysis.relationshipPlain, basis: specialAnalysis.relationshipBasis, solutions: specialAnalysis.relationshipSolutions }
    ];
    
    container.innerHTML = items.map(item => `
        <div class="special-item">
            <h3><span class="special-item-icon">${item.icon}</span>${item.title}</h3>
            <p>${item.content || '暂无数据'}</p>
            ${renderPlainBlock(item.plain)}
            ${renderBasisList(item.basis)}
            ${renderSolutionList(item.solutions)}
        </div>
    `).join('');
}

/**
 * 显示建议
 */
function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestions');
    
    if (!suggestions) {
        container.innerHTML = '<p>暂无建议数据</p>';
        return;
    }
    
    let html = '';
    
    // 化解方法
    if (suggestions.solutions && suggestions.solutions.length > 0) {
        html += `
            <div class="suggestion-group">
                <h3>化解方法</h3>
                <ul class="suggestion-list">
                    ${suggestions.solutions.map(s => `<li>${s}</li>`).join('')}
                </ul>
                ${renderPlainBlock(suggestions.solutionsPlain)}
                ${renderBasisList(suggestions.solutionsBasis)}
            </div>
        `;
    }
    
    // 开运元素
    if (suggestions.luckyElements) {
        const { directions, colors, numbers } = suggestions.luckyElements;
        
        html += `
            <div class="suggestion-group">
                <h3>开运元素</h3>
                <div class="lucky-elements">
                    ${directions && directions.length > 0 ? `
                        <div class="lucky-item">
                            <h4>吉利方位</h4>
                            <div class="lucky-values">
                                ${directions.map(d => `<span class="lucky-value">${d}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${colors && colors.length > 0 ? `
                        <div class="lucky-item">
                            <h4>幸运颜色</h4>
                            <div class="lucky-values">
                                ${colors.map(c => `<span class="lucky-value">${c}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${numbers && numbers.length > 0 ? `
                        <div class="lucky-item">
                            <h4>幸运数字</h4>
                            <div class="lucky-values">
                                ${numbers.map(n => `<span class="lucky-value">${n}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // 人生规划
    if (suggestions.lifePlanning) {
        html += `
            <div class="suggestion-group">
                <h3>人生规划建议</h3>
                <p style="line-height: 2; text-indent: 2em;">${suggestions.lifePlanning}</p>
                ${renderPlainBlock(suggestions.lifePlanningPlain)}
                ${renderBasisList(suggestions.lifePlanningBasis)}
            </div>
        `;
    }
    
    container.innerHTML = html;
}
