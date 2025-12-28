# 如何获取有效的 Gemini API 密钥

## 问题说明
您当前的API密钥显示为无效（API_KEY_INVALID）。这可能是因为：
- 密钥已过期或被撤销
- 密钥没有启用Gemini API权限
- 密钥来源不正确

## 获取新的API密钥步骤

### 方法一：Google AI Studio（推荐）

1. **访问 Google AI Studio**
   - 打开浏览器访问：https://aistudio.google.com/app/apikey
   - 使用您的Google账号登录

2. **创建API密钥**
   - 点击 "Create API key" 按钮
   - 选择一个Google Cloud项目（或创建新项目）
   - 系统会生成一个新的API密钥

3. **复制API密钥**
   - 点击复制按钮，保存好这个密钥
   - ⚠️ 注意：密钥只显示一次，请妥善保管

4. **配置到系统**
   - 打开项目目录下的 `.env` 文件
   - 将 `GEMINI_API_KEY=` 后面替换为新的密钥
   - 保存文件

### 方法二：Google Cloud Console

1. **访问 Google Cloud Console**
   - https://console.cloud.google.com/

2. **启用 Generative Language API**
   - 在搜索框搜索 "Generative Language API"
   - 点击启用（Enable）

3. **创建凭据**
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "API key"
   - 复制生成的API密钥

## 验证API密钥

配置完成后，重新启动服务器：
```bash
双击 "一键启动.command" 文件
```

## 常见问题

### Q: 为什么我的密钥无效？
A: 可能原因：
- 密钥格式错误（有多余的空格或换行）
- 密钥已被撤销
- 没有启用Gemini API权限
- 使用了错误的API密钥类型

### Q: API密钥是免费的吗？
A: Google AI Studio提供免费配额，足够个人使用。超出免费配额后需要付费。

### Q: 如何检查密钥是否有效？
A: 配置后启动系统，如果能成功分析命盘，说明密钥有效。

## 安全提示

⚠️ **重要**：
- 不要将API密钥分享给他人
- 不要将包含密钥的.env文件上传到公开仓库
- 定期更换API密钥以保证安全

## 联系支持

如果仍然遇到问题，请访问：
- Google AI Studio帮助中心：https://ai.google.dev/docs
- Google Cloud支持：https://cloud.google.com/support

---

**当前系统配置**：
- 模型：gemini-1.5-flash（稳定版本）
- 配置文件：/Users/jishudashen/Desktop/sm大师/.env
