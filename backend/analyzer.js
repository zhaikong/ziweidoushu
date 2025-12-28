/**
 * AI分析引擎
 * 使用Gemini API对紫微斗数命盘进行深度分析
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ZiweiAnalyzer {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // 使用 Gemini 3.0 Pro (用户已配置付费配额)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      }
    });
  }


  /**
   * 分析命盘（分批次生成版）
   * @param {object} parsedData - 解析后的命盘数据
   * @returns {object} 分析结果
   */
  async analyze(parsedData) {
    try {
      console.log('🚀 开始分批次深度分析...');
      
      // 第一步：格局与性格
      console.log('1️⃣ 正在分析格局与性格...');
      const step1Prompt = this.buildStep1Prompt(parsedData);
      const step1Result = await this.generateAndParse(step1Prompt, parsedData);
      
      // 第二步：十二宫位详解（分批避免截断）
      console.log('2️⃣ 正在分析十二宫位...');
      const palaceBatches = [
        ['命宫', '兄弟宫', '夫妻宫'],
        ['子女宫', '财帛宫', '疾厄宫'],
        ['迁移宫', '交友宫', '官禄宫'],
        ['田宅宫', '福德宫', '父母宫'],
      ];
      const palaceResults = {};
      for (const batch of palaceBatches) {
        console.log(`  - ${batch.join('、')}`);
        const step2Prompt = this.buildStep2Prompt(parsedData, batch);
        const step2Result = await this.generateAndParse(step2Prompt, parsedData);
        if (step2Result && step2Result.palaces) {
          Object.assign(palaceResults, step2Result.palaces);
        }
        for (const palaceName of batch) {
          if (!palaceResults[palaceName]) {
            const singlePrompt = this.buildStep2Prompt(parsedData, [palaceName]);
            const singleResult = await this.generateAndParse(singlePrompt, parsedData);
            if (singleResult && singleResult.palaces) {
              Object.assign(palaceResults, singleResult.palaces);
            }
          }
        }
      }
      
      const birthYear = this.getBirthYear(parsedData);
      const currentYear = new Date().getFullYear();
      const currentAge = currentYear - birthYear + 1; // 虚岁
      const startLuckAge = this.getStartLuckAge(parsedData);
      const startLuckYear = startLuckAge ? birthYear + startLuckAge - 1 : null;

      // 第三步：流年运势（从1岁开始，分段避免截断）
      console.log('3️⃣ 正在分析流年运势...');
      const ageRanges = this.buildAgeRanges(1, currentAge, 5);
      const yearlyFortune = [];
      for (const [ageStart, ageEnd] of ageRanges) {
        const startYear = birthYear + ageStart - 1;
        const endYear = birthYear + ageEnd - 1;
        console.log(`  - ${ageStart}-${ageEnd}岁 (${startYear}-${endYear})`);
        const step3Prompt = this.buildStep3Prompt(
          parsedData,
          startYear,
          endYear,
          ageStart,
          ageEnd,
          startLuckAge,
          startLuckYear
        );
        const step3Result = await this.generateAndParse(step3Prompt, parsedData);
        if (Array.isArray(step3Result.yearlyFortune)) {
          const normalized = step3Result.yearlyFortune.map(item => {
            const yearNum = typeof item.year === 'number' ? item.year : parseInt(item.year, 10);
            const ageNum = typeof item.age === 'number' ? item.age : parseInt(item.age, 10);
            return { ...item, year: yearNum, age: Number.isNaN(ageNum) ? item.age : ageNum };
          });
          const filtered = normalized.filter(item =>
            typeof item.year === 'number' && item.year >= startYear && item.year <= endYear
          );
          yearlyFortune.push(...filtered);
        }
      }
      yearlyFortune.sort((a, b) => (a.year || 0) - (b.year || 0));
      const dedupedFortune = [];
      const seenYears = new Set();
      for (const item of yearlyFortune) {
        const yearNum = typeof item.year === 'number' ? item.year : parseInt(item.year, 10);
        if (!Number.isFinite(yearNum)) continue;
        if (seenYears.has(yearNum)) continue;
        seenYears.add(yearNum);
        item.year = yearNum;
        dedupedFortune.push(item);
      }
      yearlyFortune.length = 0;
      yearlyFortune.push(...dedupedFortune);
      
      // 第四步：专项分析（分段避免截断）
      console.log('4️⃣ 正在进行专项分析...');
      const specialParts = [
        ['career', 'study'],
        ['marriage', 'health', 'relationship'],
      ];
      const specialAnalysis = {};
      for (const part of specialParts) {
        const step4aPrompt = this.buildSpecialAnalysisPrompt(parsedData, part);
        const step4aResult = await this.generateAndParse(step4aPrompt, parsedData);
        if (step4aResult && step4aResult.specialAnalysis) {
          Object.assign(specialAnalysis, step4aResult.specialAnalysis);
        }
        for (const section of part) {
          if (!specialAnalysis[section]) {
            const singlePrompt = this.buildSpecialAnalysisPrompt(parsedData, [section]);
            const singleResult = await this.generateAndParse(singlePrompt, parsedData);
            if (singleResult && singleResult.specialAnalysis) {
              Object.assign(specialAnalysis, singleResult.specialAnalysis);
            }
          }
        }
      }
      
      // 第五步：建议与关键事件
      console.log('5️⃣ 正在生成建议与关键事件...');
      const step4bPrompt = this.buildSuggestionsPrompt(parsedData);
      const step4bResult = await this.generateAndParse(step4bPrompt, parsedData);

      console.log('✅ 所有分析步骤完成，正在合并结果...');

      // 合并所有结果
      const finalAnalysis = {
        overall: step1Result.overall || {},
        palaces: palaceResults,
        yearlyFortune,
        specialAnalysis,
        suggestions: step4bResult.suggestions || {},
        keyEvents: step4bResult.keyEvents || []
      };

      // 补充基础信息
      return this.enrichAnalysisData(finalAnalysis, parsedData);

    } catch (error) {
      console.error('AI分析错误:', error);
      throw new Error('命盘分析失败: ' + error.message);
    }
  }

  /**
   * 通用生成与解析方法
   */
  async generateAndParse(prompt, parsedData) {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return this.parseAnalysis(text, parsedData);
  }

  // --- 提示词构建区域 ---

  buildStep1Prompt(data) {
      return `你现在是紫微斗数专家。请综合使用三合紫微、飞星紫微、河洛紫微、钦天四化等技法，根据以下命盘信息，仅分析【格局总论】和【命主性格】。
要求：理论来源为紫微斗数各派系的综合取法，三合紫微用于定格局、飞星紫微用于看隐性性格；请结合四化飞星逻辑，深度分析命盘格局高低。结论必须有推导链，点名具体宫位/主星/四化/组合，避免空话。
      
【命主基本信息】
${this.formatBasicInfo(data.basicInfo)}

【命宫、身宫及三方四正】
${this.formatPalace(data.palaces['命宫'], '命宫')}
${this.formatPalace(data.palaces['财帛宫'], '财帛宫')}
${this.formatPalace(data.palaces['官禄宫'], '官禄宫')}
${this.formatPalace(data.palaces['迁移宫'], '迁移宫')}

请严格输出JSON（不要包含Markdown或多余文字），仅包含overall对象，不要返回其他字段。白话解读要写清“因果”，说明结论怎么推出来；推算依据写成3-5条要点，必须点名具体宫位/主星/四化/组合；每条结论都要给出2-4条对应化解/强化建议；内容中如需引用请使用中文引号「」或《》，不要使用英文双引号。格式如下：
{
  "overall": {
    "pattern": "格局总论（300字以上，深度分析命盘格局高低、成格与破格）",
    "patternPlain": "格局总论的白话解读",
    "patternBasis": ["依据1", "依据2", "依据3"],
    "patternSolutions": ["建议1", "建议2"],
    "personality": "性格特质（200字以上，分析显性与隐性性格、优缺点）",
    "personalityPlain": "性格特质的白话解读",
    "personalityBasis": ["依据1", "依据2", "依据3"],
    "personalitySolutions": ["建议1", "建议2"],
    "lifeTrend": "人生大势（200字以上，概括一生起伏、成就高低）",
    "lifeTrendPlain": "人生大势的白话解读",
    "lifeTrendBasis": ["依据1", "依据2", "依据3"],
    "lifeTrendSolutions": ["建议1", "建议2"]
  }
}`;
  }

  buildStep2Prompt(data, palaceNames) {
      const palaceOrder = palaceNames && palaceNames.length
        ? palaceNames
        : this.getDefaultPalaceOrder();
      const palaceListText = palaceOrder.join('、');
      const palaceSchema = palaceOrder.map(name => (
        `    "${name}": { "analysis": "...", "analysisPlain": "...", "basis": ["..."], "solutions": ["..."], "keywords": [...] }`
      )).join(',\n');

      return `你现在是紫微斗数专家。请综合使用三合紫微、飞星紫微、河洛紫微、钦天四化等技法，对该命盘进行【十二宫位】的详细扫描分析。
要求：对十二宫位进行扫描时，不仅要看本宫星曜（三合），还要结合河洛紫微的对应宫位原理，以及各宫位的自化（钦天四化）现象进行吉凶判断；每宫结论必须有推导链，点名具体宫位/主星/四化/组合，避免空话；说明宫位间的飞宫四化与三方四正联动。
仅分析以下宫位：${palaceListText}。

【十二宫位详细信息】
${this.formatPalacesForPrompt(data.palaces, palaceOrder)}

请严格输出JSON（不要包含Markdown或多余文字），仅包含palaces对象，不要返回其他字段。每宫位至少150字，包含具体吉凶判断和关键词；白话解读80-120字；推算依据写成3-5条要点，必须点名具体宫位/主星/四化/组合；每宫位给出2-4条对应化解/强化建议；内容中如需引用请使用中文引号「」或《》，不要使用英文双引号。格式如下：
{
  "palaces": {
${palaceSchema}
  }
}`;
  }

  buildStep3Prompt(data, startYear, endYear, startAge, endAge, startLuckAge, startLuckYear) {
      return `你现在是紫微斗数专家。请综合使用三合紫微、飞星紫微、河洛紫微、钦天四化等技法，分析该命盘的【流年运势】。
要求：在分析流年时，重点运用钦天四化的流年四化叠宫技巧，以及飞星的流年大限应期理论，判断每年的具体吉凶和事件；每年结论必须有推导链，点名相关宫位/主星/四化，避免空话；若为凶/大凶必须给出化解方案，若为吉/大吉给出强化建议。只输出${startYear}-${endYear}年范围内的年份，并确保年龄与年份对应。

【时间范围】${startYear}-${endYear}年
【年龄范围】${startAge}-${endAge}虚岁
【起运年龄】${startLuckAge ? `${startLuckAge}岁（${startLuckYear}年）` : '未知'}
【基本信息】${JSON.stringify(data.basicInfo)}
【命盘信息】
${this.formatPalacesForPrompt(data.palaces)}

请严格输出JSON（不要包含Markdown或多余文字），仅包含yearlyFortune数组，不要返回其他字段。每年至少80字；白话解读40-80字；推算依据写成2-4条要点，点名相关宫位/主星/四化；每年给出2-3条对应化解/强化建议；内容中如需引用请使用中文引号「」或《》，不要使用英文双引号。格式如下：
{
  "yearlyFortune": [
    {
      "year": ${startYear},
      "age": 38,
      "fortune": "详细运势描述...",
      "fortunePlain": "白话解读...",
      "basis": ["依据1", "依据2"],
      "solutions": ["建议1", "建议2"],
      "focus": ["关键词1", "关键词2"],
      "level": "大吉/吉/平/凶/大凶",
      "warning": "关键提醒"
    }
  ]
}`;
  }

  buildSpecialAnalysisPrompt(data, sections) {
      const sectionMeta = {
        career: {
          label: '事业财运',
          analysis: '事业财运深度分析（300字，职业方向、财富规模、投资建议）'
        },
        study: {
          label: '学业进修',
          analysis: '学业进修深度分析（200字，学习能力、考试运、适合方向）'
        },
        marriage: {
          label: '婚姻感情',
          analysis: '婚姻感情深度分析（300字，配偶特征、相处模式、婚姻危机）'
        },
        health: {
          label: '健康疾厄',
          analysis: '健康疾厄深度分析（200字，体质强弱、易患疾病、养生建议）'
        },
        relationship: {
          label: '人际交往',
          analysis: '人际交往深度分析（200字，贵人运、小人防范）'
        }
      };
      const selected = (sections && sections.length ? sections : Object.keys(sectionMeta))
        .filter(key => sectionMeta[key]);
      const schemaLines = selected.map(key => {
        const label = sectionMeta[key].label;
        return [
          `    "${key}": "${sectionMeta[key].analysis}"`,
          `    "${key}Plain": "${label}白话解读"`,
          `    "${key}Basis": ["依据1", "依据2", "依据3"]`,
          `    "${key}Solutions": ["建议1", "建议2"]`
        ].join(',\n');
      }).join(',\n');
      const birthYear = this.getBirthYear(data);
      const startLuckAge = this.getStartLuckAge(data);
      const startLuckYear = startLuckAge ? birthYear + startLuckAge - 1 : null;
      return `你现在是紫微斗数专家。请综合使用三合紫微、飞星紫微、河洛紫微、钦天四化等技法，对该命盘进行【专项深度分析】。
要求：综合运用各派系技法，给出具体的化解建议与可执行的人生规划方向（写在solutions中，不要新增字段）；结论必须有推导链，点名具体宫位/主星/四化/组合，避免空话；白话解读要写清因果与推导；内容中如需引用请使用中文引号「」或《》，不要使用英文双引号。
仅分析以下主题：${selected.map(key => sectionMeta[key].label).join('、')}。

【当前时间】${new Date().getFullYear()}年
【起运年龄】${startLuckAge ? `${startLuckAge}岁（${startLuckYear}年）` : '未知'}
【命主基本信息】${JSON.stringify(data.basicInfo)}
【命盘信息】
${this.formatPalacesForPrompt(data.palaces)}

请严格输出JSON（不要包含Markdown或多余文字），仅包含specialAnalysis对象，不要返回其他字段。每段落包含白话解读80-120字，推算依据写成3-5条要点，并给出2-4条对应化解/强化建议。格式如下：
{
  "specialAnalysis": {
${schemaLines}
  }
}`;
  }

  buildSuggestionsPrompt(data) {
      const birthYear = this.getBirthYear(data);
      const startLuckAge = this.getStartLuckAge(data);
      const startLuckYear = startLuckAge ? birthYear + startLuckAge - 1 : null;
      return `你现在是紫微斗数专家。请综合使用三合紫微、飞星紫微、河洛紫微、钦天四化等技法，对该命盘给出【化解建议】与【关键事件提示】。
要求：结论必须有推导链，点名具体宫位/主星/四化/组合，避免空话；若提及问题必须给出化解方案；关键事件列出6-10条，覆盖早年/中年/未来10年，标注时间范围、吉凶与影响程度，并给出对应化解/行动建议。

【当前时间】${new Date().getFullYear()}年
【起运年龄】${startLuckAge ? `${startLuckAge}岁（${startLuckYear}年）` : '未知'}
【命主基本信息】${JSON.stringify(data.basicInfo)}
【命盘信息】
${this.formatPalacesForPrompt(data.palaces)}

请严格输出JSON（不要包含Markdown或多余文字），仅包含suggestions与keyEvents对象，不要返回其他字段。白话解读80-120字；推算依据写成2-5条要点；每项给出2-4条对应建议；内容中如需引用请使用中文引号「」或《》，不要使用英文双引号。格式如下：
{
  "suggestions": {
    "solutions": ["化解建议1", "化解建议2", "化解建议3"],
    "solutionsPlain": "化解建议白话解读",
    "solutionsBasis": ["依据1", "依据2"],
    "luckyElements": {
      "directions": ["利方1", "利方2"],
      "colors": ["幸运色1", "幸运色2"],
      "numbers": [1, 6, 8]
    },
    "lifePlanning": "人生整体规划建议（300字）",
    "lifePlanningPlain": "人生规划白话解读",
    "lifePlanningBasis": ["依据1", "依据2", "依据3"]
  },
  "keyEvents": [
    {
      "timeRange": "时间范围（公历年或年龄段）",
      "ageRange": "年龄范围（虚岁）",
      "area": "事业/财运/感情/健康/学业/人际等",
      "event": "关键事件描述",
      "level": "大吉/吉/平/凶/大凶",
      "impact": "轻/中/重",
      "basis": ["依据1", "依据2", "依据3"],
      "solutions": ["建议1", "建议2"]
    }
  ]
}`;
  }

  formatBasicInfo(info) {
      return `性别: ${info.gender}, 农历: ${info.lunarTime}, 五行局: ${info.element}, 命主: ${info.lifeMaster}, 身主: ${info.bodyMaster}`;
  }

  formatPalace(palace, name) {
      if (!palace) return '';
      return `【${name}】位于${palace.position}
      主星: ${this.formatStars(palace.mainStars)}
      辅星: ${this.formatStars(palace.assistStars)}
      四化: ${this.formatStars(palace.mainStars.filter(s=>s.fourTransforms))}`; 
  }


  /**
   * 格式化宫位信息用于提示词（批量）
   */
  formatPalacesForPrompt(palaces, palaceNames) {
    let result = '';
    
    const palaceOrder = palaceNames && palaceNames.length
      ? palaceNames
      : this.getDefaultPalaceOrder();

    for (const name of palaceOrder) {
      const palace = palaces[name];
      if (palace) {
          result += this.formatPalace(palace, name) + '\n';
      }
    }
    
    return result;
  }

  getDefaultPalaceOrder() {
    return [
      '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', 
      '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
    ];
  }

  getBirthYear(parsedData) {
    const timeStr = parsedData?.basicInfo?.clockTime
      || parsedData?.basicInfo?.solarTime
      || '';
    const year = parseInt(timeStr.split('-')[0], 10);
    return Number.isFinite(year) ? year : 1980;
  }

  getStartLuckAge(parsedData) {
    const palaces = parsedData?.palaces || {};
    let minAge = null;
    for (const palace of Object.values(palaces)) {
      const major = palace?.ages?.major;
      if (!major) continue;
      const match = major.match(/(\d+)/);
      if (!match) continue;
      const age = parseInt(match[1], 10);
      if (Number.isNaN(age)) continue;
      minAge = minAge === null ? age : Math.min(minAge, age);
    }
    return minAge;
  }

  buildAgeRanges(startAge, endAge, chunkSize) {
    if (!Number.isFinite(startAge) || !Number.isFinite(endAge) || endAge < startAge) {
      return [];
    }
    const ranges = [];
    for (let age = startAge; age <= endAge; age += chunkSize) {
      const rangeEnd = Math.min(age + chunkSize - 1, endAge);
      ranges.push([age, rangeEnd]);
    }
    return ranges;
  }

  /**
   * 格式化星曜信息
   */
  formatStars(stars) {
    return stars.map(star => {
      let str = star.name;
      
      if (star.attributes && star.attributes.length > 0) {
        str += `(${star.attributes.join(',')})`;
      }
      
      if (star.fourTransforms) {
        const ft = star.fourTransforms;
        if (ft.isNatal) {
          str += `[生年${ft.type}]`;
        } else if (ft.direction === 'out') {
          str += `[↓${ft.type}]`;
        } else if (ft.direction === 'in') {
          str += `[↑${ft.type}]`;
        } else {
          str += `[${ft.type}]`;
        }
      }
      
      return str;
    }).join(', ');
  }

  /**
   * 解析AI返回的分析结果
   */
  parseAnalysis(text, parsedData) {
    try {
      const rawText = text || '';
      const trimmedText = rawText.trim();
      if (trimmedText.startsWith('{')) {
        try {
          return this.parseAndEnrich(trimmedText, parsedData);
        } catch (e) {
          // 继续尝试提取JSON
        }
      }

      // 提取JSON部分
      let jsonStr = '';
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        jsonStr = this.extractFirstJsonObject(jsonMatch[1]) || jsonMatch[1];
      } else {
        jsonStr = this.extractFirstJsonObject(rawText);
      }

      if (jsonStr) {
        // 尝试修复被截断的 JSON
          try {
            return this.parseAndEnrich(jsonStr, parsedData);
          } catch (e) {
            const extracted = this.extractFirstJsonObject(jsonStr);
            if (extracted && extracted !== jsonStr) {
              try {
                return this.parseAndEnrich(extracted, parsedData);
              } catch (innerError) {
                // 继续尝试修复
              }
            }
            console.log('JSON解析失败，尝试修复截断...');
            const fixedJson = this.tryFixJson(jsonStr);
            return this.parseAndEnrich(fixedJson, parsedData);
          }
      }
      
      // 如果没有找到JSON格式，返回原始文本
      return {
        rawAnalysis: rawText,
        error: 'AI返回格式不符合预期，请查看原始分析'
      };
    } catch (error) {
      console.error('解析分析结果错误:', error);
      return {
        rawAnalysis: text || '',
        error: '解析失败: ' + error.message
      };
    }
  }

  extractFirstJsonObject(text) {
    if (!text) return '';
    const start = text.indexOf('{');
    if (start === -1) return '';
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else {
        if (ch === '"') {
          inString = true;
        } else if (ch === '{') {
          depth += 1;
        } else if (ch === '}') {
          depth -= 1;
          if (depth === 0) {
            return text.slice(start, i + 1);
          }
        }
      }
    }

    return text.slice(start);
  }

  enrichAnalysisData(analysis, parsedData) {
      if (!parsedData || !parsedData.basicInfo) return analysis;

      // 计算当前年龄（基于出生年份）
      const currentYear = new Date().getFullYear();
      let birthYear = this.getBirthYear(parsedData);

      const currentAge = currentYear - birthYear + 1; // 虚岁
      const startLuckAge = this.getStartLuckAge(parsedData);
      const startLuckYear = startLuckAge ? birthYear + startLuckAge - 1 : null;
      
      // 确保流年数据包含年龄信息
      if (analysis.yearlyFortune) {
        analysis.yearlyFortune = analysis.yearlyFortune.map(yf => {
          if (typeof yf.age === 'string') {
            const ageNum = parseInt(yf.age, 10);
            if (!Number.isNaN(ageNum)) {
              yf.age = ageNum;
            }
          }
          if (!yf.age && yf.year) {
            yf.age = yf.year - birthYear + 1;
          }
          return yf;
        });
      }
      
      analysis.currentAge = currentAge;
      analysis.birthYear = birthYear;
      analysis.startLuckAge = startLuckAge;
      analysis.startLuckYear = startLuckYear;
      
      return analysis;
  }

  parseAndEnrich(jsonStr, parsedData) {
      // 这里的逻辑已经移动到了 enrichAnalysisData，仅保留 JSON.parse
      return JSON.parse(jsonStr);
  }

  tryFixJson(jsonStr) {
    // 简单的 JSON 修复逻辑：补全缺失的括号和引号
    let fixed = jsonStr.trim();
    
    // 移除末尾可能的逗号
    if (fixed.endsWith(',')) {
        fixed = fixed.slice(0, -1);
    }

    // 统计括号数量
    let openBraces = (fixed.match(/{/g) || []).length;
    let closeBraces = (fixed.match(/}/g) || []).length;
    let openBrackets = (fixed.match(/\[/g) || []).length;
    let closeBrackets = (fixed.match(/\]/g) || []).length;
    let quotes = (fixed.match(/"/g) || []).length;

    // 补全引号
    if (quotes % 2 !== 0) {
        fixed += '"';
    }

    // 补全中括号
    while (openBrackets > closeBrackets) {
        fixed += ']';
        closeBrackets++;
    }

    // 补全大括号
    while (openBraces > closeBraces) {
        fixed += '}';
        closeBraces++;
    }

    return fixed;

  }
}

module.exports = ZiweiAnalyzer;
