# Backend - no-register-chat-backend

环境：
1. 复制 .env.example -> .env 并修改
2. 需要 Redis 可用（本地或外部）

本地调试：
- 安装依赖：npm install
- 启动：npm run dev

生成卡密：
curl -X POST http://localhost:3001/admin/keys -H "Authorization: Bearer SUPERSECRET1234" -H "Content-Type: application/json" -d '{"agentId":"AGENT001","days":7}'
