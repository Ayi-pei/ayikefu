# 🚀 生产环境部署指南

## 📋 部署概览

你的聊天系统现在完全可用，包括：
- ✅ 实时 WebSocket 聊天
- ✅ 坐席卡密管理
- ✅ 前端嵌入脚本
- ✅ 会话历史记录
- ✅ 自动重连功能

## 🌐 部署选项

### 选项 1: 快速部署 (推荐新手)

#### 前端部署 - Netlify
1. **准备文件**:
   ```bash
   cd frontend
   npm run build
   # 上传 dist/ 目录到 Netlify
   ```

2. **Netlify 部署步骤**:
   - 访问 [netlify.com](https://netlify.com)
   - 拖拽 `frontend/dist/` 文件夹到部署区域
   - 获得域名如: `https://your-app.netlify.app`

#### 后端部署 - Railway
1. **准备代码**:
   - 推送代码到 GitHub 仓库
   
2. **Railway 部署**:
   - 访问 [railway.app](https://railway.app)
   - 连接 GitHub 仓库
   - 选择 `backend` 目录
   - 设置环境变量:
     ```
     PORT=3001
     REDIS_HOST=<railway-redis-host>
     REDIS_PORT=6379
     REDIS_PASSWORD=<railway-redis-password>
     AGENT_DEFAULT_SECRET=<your-strong-secret>
     ```

### 选项 2: 专业部署

#### 前端 - Vercel/Netlify
- 自动 CI/CD
- 自定义域名
- CDN 加速

#### 后端 - Render/DigitalOcean
- 容器化部署
- 自动扩容
- 监控告警

#### 数据库 - 云服务
- PostgreSQL (推荐生产环境)
- Redis Cloud (会话缓存)

## 🔧 部署前准备

### 1. 环境变量配置
创建生产环境 `.env`:
```bash
PORT=3001
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
AGENT_DEFAULT_SECRET=your-super-secret-key-min-32-chars
SQLITE_PATH=./data/sqlite.db
```

### 2. 安全配置
- 修改默认管理员密钥
- 启用 HTTPS
- 配置 CORS 策略
- 设置防火墙规则

### 3. 性能优化
- 启用 Redis 缓存
- 配置负载均衡
- 设置 CDN

## 📦 Docker 部署 (可选)

### Dockerfile 示例:
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### docker-compose.yml:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 🔗 集成使用

### 在网站中嵌入聊天:
```html
<script src="https://your-backend-domain.com/embed.iife.js" 
        data-agent="AGENT001" 
        data-url="https://your-backend-domain.com"></script>
```

### 坐席管理:
```bash
# 创建卡密
curl -X POST https://your-backend-domain.com/admin/keys \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT001","days":30}'

# 坐席连接
ws://your-backend-domain.com/?role=agent&token=GENERATED_KEY
```

## 📊 监控和维护

### 日志监控
- WebSocket 连接数
- 消息发送量
- 错误率统计

### 性能指标
- 响应时间
- 内存使用
- CPU 使用率

### 备份策略
- 数据库定期备份
- 配置文件备份
- 日志归档

## 🆘 故障排除

### 常见问题:
1. **WebSocket 连接失败** → 检查防火墙和代理设置
2. **Redis 连接超时** → 验证网络连接和认证
3. **静态文件 404** → 确认文件路径和权限
4. **CORS 错误** → 配置正确的域名白名单

## 📞 技术支持

如需帮助，请检查:
- 服务器日志
- 浏览器控制台
- 网络连接状态
- 环境变量配置