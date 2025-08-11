# no-register-chat (split frontend & backend)

结构：
- backend/: TypeScript 后端（Express + ws + Redis + SQLite 卡密持久化）
- frontend/: 静态前端（embed snippet），用于 Netlify 部署

本地运行示例：
1. 启动 Redis（本地或外部）
2. 后端：
   cd backend
   npm install
   cp .env.example .env
   # 编辑 .env 填写 Redis 地址等
   npm run dev

3. 前端（本地调试或打包）：
   cd frontend
   npm install
   npm run dev         # vite 本地
   npm run build       # 生成 dist，可上传到 Netlify

部署建议：
- 前端：Netlify（将 frontend 仓库或子目录导入）
- 后端：Railway / Render / VPS（需长期运行 WebSocket 服务）
- Redis：本地测试使用本地 Redis；生产推荐托管 Redis（Upstash / Redis Cloud / cloud provider）

本地运行步骤（逐步，阿义注意按顺序）
在本地安装 Redis 并运行。常见方式：

macOS: brew install redis → brew services start redis

Ubuntu (WSL): sudo apt update && sudo apt install redis-server → redis-server --protected-mode no

或者使用托管 Redis（修改 .env 为提供的 host/port/password）

启动后端：
cd project-root/backend
npm install
cp .env.example .env

# 编辑 .env 如需修改
npm run dev
后端会监听 .env 中的 PORT（默认 3001）。

本地调试前端（可选）：
cd project-root/frontend
npm install
npm run dev   # 打开 vite dev server，或
npm run build # 生成打包文件在 frontend/dist
若 frontend/dist 存在，后端 server.ts 会把它作为静态目录（方便单域测试）。

生成卡密（示例）：
curl -X POST http://localhost:3001/admin/keys \
  -H "Authorization: Bearer SUPERSECRET1234" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT001","days":7}'
把返回的 key_code 给坐席，坐席用此 token 建立 websocket：
ws://<backend-host>/?role=agent&token=<key_code>

访客连接示例（snippet 注入 iframe 或直接页面）会建立 websocket：
ws://<backend-host>/?role=user&id=<guestId>

五、注意事项与建议（小结）
Netlify 只能托管 静态前端（embed 脚本）。后端需放到可运行 Node 的平台（Railway/Render/VPS）。

SQLite 是最简单的持久化卡密方案，适合单实例测试；正式生产 不要 在多实例环境下使用 SQLite，建议切换到 Postgres/MySQL（平台通常提供）。

Redis 负责会话历史缓存与卡密缓存，能让多后端实例共享会话历史（前提是都指向同一个 Redis）。

WebSocket 在一些 Serverless 平台（如 Vercel Serverless）不稳定，选常驻 Node 环境更稳。