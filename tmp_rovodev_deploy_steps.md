# 🚀 15分钟快速部署指南

## 📋 部署清单

### ✅ 准备工作 (2分钟)
- [x] 系统测试完成
- [x] 前端构建完成
- [x] 后端编译完成
- [ ] GitHub 仓库创建
- [ ] 生产环境密钥生成

### 🎯 部署目标
- **前端**: Netlify (免费，自动 HTTPS)
- **后端**: Railway (免费额度，支持 WebSocket)
- **数据库**: SQLite (简单) + Redis (Railway 提供)

## 🔥 开始部署！

### 步骤 1: 创建 GitHub 仓库 (3分钟)

1. **访问 GitHub.com，创建新仓库**
   - 仓库名: `no-register-chat`
   - 设为 Public
   - 不要添加 README

2. **上传代码到 GitHub**:
   ```bash
   cd D:\xiangmu\ayi\no-register-chat-split
   git init
   git add .
   git commit -m "Initial commit - working chat system"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/no-register-chat.git
   git push -u origin main
   ```

### 步骤 2: 部署前端到 Netlify (3分钟)

1. **访问 [netlify.com](https://netlify.com)**
   - 点击 "Sign up" 用 GitHub 账号注册

2. **部署方式选择**:
   
   **方法 A: 拖拽部署 (最简单)**
   - 点击 "Deploy manually"
   - 拖拽 `frontend/dist` 文件夹到页面
   - 等待部署完成
   - 获得域名: `https://random-name.netlify.app`

   **方法 B: Git 部署 (推荐)**
   - 点击 "New site from Git"
   - 选择 GitHub，授权访问
   - 选择你的仓库
   - Build settings:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `dist`

### 步骤 3: 部署后端到 Railway (5分钟)

1. **访问 [railway.app](https://railway.app)**
   - 用 GitHub 账号登录

2. **创建新项目**:
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库
   - 选择 `backend` 目录

3. **配置环境变量**:
   点击项目 → Variables → 添加:
   ```
   PORT=3001
   AGENT_DEFAULT_SECRET=SUPER_SECRET_KEY_2024_PRODUCTION_MIN_32_CHARS
   SQLITE_PATH=./data/sqlite.db
   ```

4. **添加 Redis**:
   - 在项目中点击 "Add Service"
   - 选择 "Redis"
   - 等待部署完成
   - Railway 会自动设置 Redis 环境变量

### 步骤 4: 配置域名和 HTTPS (2分钟)

1. **获取后端域名**:
   - 在 Railway 项目中点击 "Settings"
   - 点击 "Generate Domain"
   - 获得域名如: `your-app.railway.app`

2. **更新前端配置**:
   需要重新构建前端，指向生产后端

## 🔧 生产环境配置

### 安全配置
```bash
# 生成强密钥
AGENT_DEFAULT_SECRET=YOUR_SUPER_SECRET_KEY_MIN_32_CHARS_2024_PROD
```

### 环境变量完整列表
```
PORT=3001
REDIS_HOST=<railway-auto-generated>
REDIS_PORT=<railway-auto-generated>
REDIS_PASSWORD=<railway-auto-generated>
AGENT_DEFAULT_SECRET=YOUR_SUPER_SECRET_KEY_MIN_32_CHARS_2024_PROD
SQLITE_PATH=./data/sqlite.db
```

## ✅ 部署验证

### 测试清单:
- [ ] 前端页面可访问
- [ ] 后端 API 响应正常
- [ ] WebSocket 连接成功
- [ ] 创建卡密功能正常
- [ ] 聊天功能正常

### 测试命令:
```bash
# 测试后端 API
curl -X POST https://your-app.railway.app/admin/keys \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"PROD001","days":30}'
```

## 🎯 部署后使用

### 在任何网站中嵌入:
```html
<script src="https://your-app.railway.app/embed.iife.js" 
        data-agent="PROD001" 
        data-url="https://your-app.railway.app"></script>
```

### 坐席连接:
```
wss://your-app.railway.app/?role=agent&token=GENERATED_KEY
```

## 🆘 如果遇到问题

### 常见问题:
1. **构建失败** → 检查 package.json 和依赖
2. **环境变量错误** → 重新设置并重启服务
3. **域名访问失败** → 等待 DNS 传播 (最多10分钟)
4. **WebSocket 连接失败** → 检查 HTTPS/WSS 协议

### 调试方法:
- Railway: 查看 "Deployments" 日志
- Netlify: 查看 "Deploy log"
- 浏览器: F12 查看控制台错误