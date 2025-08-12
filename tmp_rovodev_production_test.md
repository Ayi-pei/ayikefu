# 🎉 生产环境测试指南

## 🌐 你的生产环境地址
**后端**: https://ayikefu.onrender.com

## 🧪 测试步骤

### 1. 测试后端 API
```bash
curl -X POST https://ayikefu.onrender.com/admin/keys \
  -H "Authorization: Bearer AYIKEFU_SUPER_SECRET_2024_PRODUCTION_KEY_32CHARS" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"PROD001","days":30}'
```

**预期响应**:
```json
{
  "id": 1,
  "key_code": "A1B2C3D4E5F6G7H8",
  "agent_id": "PROD001",
  "expires_at": 1755557918,
  "status": "active"
}
```

### 2. 测试聊天界面
访问: https://ayikefu.onrender.com/?embed=1&agent=PROD001

**预期结果**:
- ✅ 显示聊天界面
- ✅ 连接状态显示"已连接，等待客服..."
- ✅ 可以输入消息

### 3. 测试嵌入脚本
创建测试 HTML 文件:
```html
<!DOCTYPE html>
<html>
<head>
    <title>聊天测试</title>
</head>
<body>
    <h1>我的网站</h1>
    <p>聊天窗口会出现在右下角</p>
    
    <!-- 嵌入聊天脚本 -->
    <script src="https://ayikefu.onrender.com/embed.iife.js" 
            data-agent="PROD001" 
            data-url="https://ayikefu.onrender.com"></script>
</body>
</html>
```

### 4. 测试完整聊天流程
1. **创建坐席卡密** (使用上面的 API)
2. **坐席连接**: `wss://ayikefu.onrender.com/?role=agent&token=GENERATED_KEY`
3. **用户访问**: 打开嵌入脚本的网页
4. **坐席接入**: 坐席获取会话列表并加入用户会话
5. **双向聊天**: 测试消息发送和接收

## 🎯 成功标志
- ✅ API 返回正确的卡密信息
- ✅ 聊天界面正常显示
- ✅ WebSocket 连接成功
- ✅ 消息可以双向传递
- ✅ 嵌入脚本在网页中正常工作

## 🚀 部署完成！

你现在拥有一个完全可用的生产环境聊天系统：
- **后端**: https://ayikefu.onrender.com
- **功能**: 实时聊天、坐席管理、嵌入脚本
- **部署**: 自动化 CI/CD
- **扩展**: 可以轻松添加新功能