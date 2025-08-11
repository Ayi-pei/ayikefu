# 🔧 部署问题修复指南

## ❌ 问题分析
`better-sqlite3` 包含原生二进制文件，在本地 Windows 编译后上传到 Linux 服务器会出现兼容性问题。

## ✅ 解决方案

### 1. 已修复的内容：
- ✅ 添加了 `postinstall` 脚本自动重建二进制文件
- ✅ 修改了 `build` 脚本确保正确编译
- ✅ 创建了 `render.yaml` 配置文件

### 2. 推荐的部署平台调整：

#### 选项 A: 继续使用 Render (推荐)
1. **重新部署**：
   - 推送修复代码到 GitHub
   - 在 Render 中触发重新部署
   - 等待构建完成

#### 选项 B: 切换到 Railway (更简单)
Railway 对 SQLite 支持更好：
1. 访问 [railway.app](https://railway.app)
2. 用 GitHub 登录
3. 选择 "Deploy from GitHub repo"
4. 选择 ayikefu 仓库，backend 目录
5. 设置环境变量

#### 选项 C: 使用 PostgreSQL (生产推荐)
完全避免 SQLite 兼容性问题：
- 使用云数据库 (Railway/Render 都提供免费 PostgreSQL)
- 修改代码使用 PostgreSQL

## 🚀 立即行动方案

### 最快解决方案 - 切换到 Railway：

1. **访问 Railway**：
   - 打开 [railway.app](https://railway.app)
   - GitHub 登录

2. **创建项目**：
   - "New Project" → "Deploy from GitHub repo"
   - 选择 "ayikefu" 仓库
   - Root Directory: `backend`

3. **环境变量**：
   ```
   PORT=3001
   AGENT_DEFAULT_SECRET=AYIKEFU_SUPER_SECRET_2024_PRODUCTION_KEY_32CHARS
   SQLITE_PATH=./data/sqlite.db
   ```

4. **添加 Redis**：
   - 项目中点击 "+ New"
   - 选择 "Database" → "Add Redis"

5. **生成域名**：
   - Settings → "Generate Domain"

### Railway 优势：
- ✅ 更好的 Node.js 支持
- ✅ 自动处理二进制依赖
- ✅ 免费 Redis 服务
- ✅ 更稳定的 WebSocket 支持

## 📋 部署后测试清单

### 1. 测试后端 API：
```bash
curl -X POST https://your-app.railway.app/admin/keys \
  -H "Authorization: Bearer AYIKEFU_SUPER_SECRET_2024_PRODUCTION_KEY_32CHARS" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"PROD001","days":30}'
```

### 2. 测试 WebSocket：
- 访问: `https://your-app.railway.app/?embed=1&agent=PROD001`
- 检查聊天界面是否正常

### 3. 测试嵌入脚本：
```html
<script src="https://your-app.railway.app/embed.iife.js" 
        data-agent="PROD001" 
        data-url="https://your-app.railway.app"></script>
```

## 🎯 推荐行动

**立即切换到 Railway 部署，避免 SQLite 兼容性问题！**

Railway 部署通常在 3-5 分钟内完成，比修复 Render 问题更快。