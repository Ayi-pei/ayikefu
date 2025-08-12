# 🔧 Railway Node.js 检测修复

## ✅ 已修复的问题：

1. **添加了 Node.js 版本声明**：
   - 在 `backend/package.json` 中添加了 `engines` 字段
   - 指定 Node.js 18.x 和 npm 9.x

2. **创建了 nixpacks.toml 配置**：
   - 明确告诉 Railway 安装 Node.js 和 npm
   - 指定正确的构建和启动命令

## 🚀 下一步操作：

### 1. 推送代码到 GitHub：
```bash
git add .
git commit -m "Fix Railway Node.js detection and add nixpacks config"
git push
```

### 2. 在 Railway 中重新部署：
- 方法 A: 自动触发（推送后自动部署）
- 方法 B: 手动触发（在 Railway 中点击 "Deploy"）

### 3. 清空之前的自定义命令：
在 Railway 配置中：
- **Build Command**: 留空（让 nixpacks.toml 处理）
- **Start Command**: 留空（让 nixpacks.toml 处理）
- **Watch Paths**: 保持 `backend/**`

## 📋 预期结果：

部署成功后应该看到：
```
✅ Installing Node.js 18.x
✅ Installing npm 9.x  
✅ Running: cd backend && npm install
✅ Running: cd backend && npm run build
✅ Starting: cd backend && npm start
✅ Backend listening on 3001
```

## 🎯 如果还有问题：

### 备用方案 - 简化部署：
1. 在 Railway 中删除当前服务
2. 重新创建项目
3. **Root Directory 设置为**: `backend`
4. 让 Railway 自动检测（不设置自定义命令）

这样 Railway 会直接在 backend 目录中找到 package.json 并自动配置。