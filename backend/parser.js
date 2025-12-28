/**
 * 紫微斗数命盘文本解析器
 * 将标准格式的命盘文本转换为结构化JSON数据
 */

class ZiweiParser {
  /**
   * 解析命盘文本
   * @param {string} text - 原始命盘文本
   * @returns {object} 结构化的命盘数据
   */
  parse(text) {
    const result = {
      version: this.extractVersion(text),
      basicInfo: this.extractBasicInfo(text),
      palaces: this.extractPalaces(text),
      rawText: text
    };
    
    return result;
  }

  /**
   * 提取版本信息
   */
  extractVersion(text) {
    const apiVersion = text.match(/API 版本\s*:\s*([\d.]+)/);
    const appVersion = text.match(/App版本\s*:\s*([\d.]+)/);
    const code = text.match(/安星码\s*:\s*(\w+)/);
    
    return {
      api: apiVersion ? apiVersion[1] : null,
      app: appVersion ? appVersion[1] : null,
      code: code ? code[1] : null
    };
  }

  /**
   * 提取基本信息
   */
  extractBasicInfo(text) {
    const info = {};
    
    // 性别
    const gender = text.match(/性别\s*:\s*(\S+)/);
    info.gender = gender ? gender[1] : null;
    
    // 经度
    const longitude = text.match(/地理经度\s*:\s*([\d.]+)/);
    info.longitude = longitude ? parseFloat(longitude[1]) : null;
    
    // 钟表时间
    const clockTime = text.match(/钟表时间\s*:\s*([\d-\s:]+)/);
    info.clockTime = clockTime ? clockTime[1].trim() : null;
    
    // 真太阳时
    const solarTime = text.match(/真太阳时\s*:\s*([\d-\s:]+)/);
    info.solarTime = solarTime ? solarTime[1].trim() : null;
    
    // 农历时间
    const lunarTime = text.match(/农历时间\s*:\s*(.+)/);
    info.lunarTime = lunarTime ? lunarTime[1].trim() : null;
    
    // 节气四柱
    const solarPillars = text.match(/节气四柱\s*:\s*(.+)/);
    info.solarPillars = solarPillars ? solarPillars[1].trim() : null;
    
    // 非节气四柱
    const nonSolarPillars = text.match(/非节气四柱\s*:\s*(.+)/);
    info.nonSolarPillars = nonSolarPillars ? nonSolarPillars[1].trim() : null;
    
    // 五行局数
    const element = text.match(/五行局数\s*:\s*(.+)/);
    info.element = element ? element[1].trim() : null;
    
    // 身主、命主等
    const masters = text.match(/身主:(.+?);\s*命主:(.+?);\s*子年斗君:(.+?);\s*身宫:(.+)/);
    if (masters) {
      info.bodyMaster = masters[1].trim();
      info.lifeMaster = masters[2].trim();
      info.douJun = masters[3].trim();
      info.bodyPalace = masters[4].trim();
    }
    
    return info;
  }

  /**
   * 提取十二宫位信息
   */
  extractPalaces(text) {
    const palaces = {};
    const palaceNames = [
      '命  宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
      '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
    ];
    
    palaceNames.forEach(name => {
      const palace = this.extractPalace(text, name);
      if (palace) {
        // 规范化宫位名称
        const normalizedName = name.replace(/\s+/g, '');
        palaces[normalizedName] = palace;
      }
    });
    
    return palaces;
  }

  /**
   * 提取单个宫位信息
   */
  extractPalace(text, palaceName) {
    // 匹配宫位块
    const escapedName = palaceName.replace(/\s+/g, '\\s*');
    const pattern = new RegExp(`├${escapedName}\\[([^\\]]+)\\]([^├└]*?)(?=├|└)`, 's');
    const match = text.match(pattern);
    
    if (!match) return null;
    
    const position = match[1];
    const content = match[2];
    
    const palace = {
      position: position,
      mainStars: this.extractStars(content, '主星'),
      assistStars: this.extractStars(content, '辅星'),
      minorStars: this.extractStars(content, '小星'),
      spirits: this.extractSpirits(content),
      ages: this.extractAges(content)
    };
    
    // 检查是否为身宫
    if (content.includes('[身宫]')) {
      palace.isBodyPalace = true;
    }
    
    // 检查是否为来因宫
    if (content.includes('[来因]')) {
      palace.isKarmaPalace = true;
    }
    
    return palace;
  }

  /**
   * 提取星曜信息
   */
  extractStars(content, type) {
    const pattern = new RegExp(`├${type}\\s*:\\s*(.+)`);
    const match = content.match(pattern);
    
    if (!match || match[1].trim() === '无') return [];
    
    const starsText = match[1].trim();
    const stars = [];
    
    // 解析星曜及其属性
    const starPattern = /(\S+?)(\[[^\]]+\])+/g;
    let starMatch;
    
    while ((starMatch = starPattern.exec(starsText)) !== null) {
      const starName = starMatch[1];
      const attributes = [];
      const fourTransforms = {};
      
      // 提取所有属性
      const attrPattern = /\[([^\]]+)\]/g;
      let attrMatch;
      const fullMatch = starMatch[0];
      
      while ((attrMatch = attrPattern.exec(fullMatch)) !== null) {
        const attr = attrMatch[1];
        
        // 识别四化
        if (attr.includes('禄') || attr.includes('权') || attr.includes('科') || attr.includes('忌')) {
          // 检查是否有方向标记
          if (attr.includes('↓')) {
            fourTransforms.type = attr.replace('↓', '');
            fourTransforms.direction = 'out'; // 离心自化
          } else if (attr.includes('↑')) {
            fourTransforms.type = attr.replace('↑', '');
            fourTransforms.direction = 'in'; // 向心自化
          } else if (attr.startsWith('生年')) {
            fourTransforms.type = attr.replace('生年', '');
            fourTransforms.isNatal = true; // 生年四化
          } else {
            fourTransforms.type = attr;
          }
        } else {
          attributes.push(attr);
        }
      }
      
      const star = { name: starName, attributes };
      if (Object.keys(fourTransforms).length > 0) {
        star.fourTransforms = fourTransforms;
      }
      
      stars.push(star);
    }
    
    return stars;
  }

  /**
   * 提取神煞信息
   */
  extractSpirits(content) {
    const spirits = {};
    
    const patterns = {
      yearSpirit: /岁前星\s*:\s*(.+)/,
      generalSpirit: /将前星\s*:\s*(.+)/,
      lifeStage: /十二长生\s*:\s*(.+)/,
      taisuiSpirit: /太岁煞禄\s*:\s*(.+)/
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        spirits[key] = match[1].trim();
      }
    }
    
    return spirits;
  }

  /**
   * 提取年龄信息
   */
  extractAges(content) {
    const ages = {
      major: null,    // 大限
      minor: [],      // 小限
      yearly: []      // 流年
    };
    
    const majorMatch = content.match(/大限\s*:\s*(.+)/);
    if (majorMatch) {
      ages.major = majorMatch[1].trim();
    }
    
    const minorMatch = content.match(/小限\s*:\s*(.+)/);
    if (minorMatch) {
      ages.minor = minorMatch[1].trim().split(',').map(s => s.trim());
    }
    
    const yearlyMatch = content.match(/流年\s*:\s*(.+)/);
    if (yearlyMatch) {
      ages.yearly = yearlyMatch[1].trim().split(',').map(s => s.trim());
    }
    
    return ages;
  }
}

module.exports = ZiweiParser;
