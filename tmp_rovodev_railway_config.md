# 🚀 Railway 配置设置

## 📋 在 Railway 配置页面填写以下内容：

### 1. **Build Command (构建命令)**
```bash
cd backend && npm install && npm run build
```

### 2. **Start Command (启动命令)**
```bash
cd backend && npm start
```

### 3. **Watch Paths (监控路径)**
```
backend/**
```

### 4. **Environment Variables (环境变量)**
点击 "Variables" 标签，添加：

```
PORT=3001
AGENT_DEFAULT_SECRET=AYIKEFU_SUPER_SECRET_2024_PRODUCTION_KEY_32CHARS
SQLITE_PATH=./data/sqlite.db
NODE_ENV=production
```

## 🔧 完整配置步骤：

1. **Build Command**: 
   - 粘贴: `cd backend && npm install && npm run build`

2. **Start Command**: 
   - 粘贴: `cd backend && npm start`

3. **Watch Paths**: 
   - 粘贴: `backend/**`

4. **保存配置**:
   - 点击 "Save" 或 "Deploy"

5. **等待部署**:
   - 查看部署日志
   - 等待 "Deployment successful" 消息

## ✅ 预期结果：

部署成功后你会看到：
- ✅ "Backend listening on 3001"
- ✅ 自动生成的域名
- ✅ 服务状态显示为 "Running"

## 🎯 部署完成后测试：

1. **获取域名**:
   - 在 Settings 中点击 "Generate Domain"
   - 获得类似: `https://ayikefu-production.railway.app`

2. **测试 API**:
   ```bash
   curl -X POST https://your-domain.railway.app/admin/keys \
     -H "Authorization: Bearer AYIKEFU_SUPER_SECRET_2024_PRODUCTION_KEY_32CHARS" \
     -H "Content-Type: application/json" \
     -d '{"agentId":"PROD001","days":30}'
   ```

3. **测试聊天界面**:
   - 访问: `https://your-domain.railway.app/?embed=1&agent=PROD001`

## 🆘 如果遇到问题：

- 查看 "Deployments" 标签的构建日志
- 确保所有命令都正确复制粘贴
- 检查环境变量是否正确设置