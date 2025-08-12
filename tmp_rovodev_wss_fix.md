# 🔧 WebSocket HTTPS 协议修复

## ❌ 问题
生产环境使用 HTTPS，但 WebSocket 连接使用了不安全的 `ws://` 协议，被浏览器阻止。

## ✅ 修复
自动检测页面协议：
- HTTP 页面 → 使用 `ws://`
- HTTPS 页面 → 使用 `wss://`

## 📋 修复代码
```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/?role=user&id=${userId}`;
```

## 🚀 部署后测试
1. 等待 Render 重新部署（约2-3分钟）
2. 重新访问: https://ayikefu.onrender.com/?embed=1&agent=AGENT001
3. 检查浏览器控制台，应该没有 WebSocket 错误
4. 聊天功能应该正常工作

## 🎯 预期结果
- ✅ WebSocket 连接成功
- ✅ 状态显示"已连接，等待客服..."
- ✅ 可以发送消息
- ✅ 没有安全错误