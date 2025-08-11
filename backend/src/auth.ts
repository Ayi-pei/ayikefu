// 用于 HTTP 层的简单 admin 校验中间件（供 admin routes 使用）
// WebSocket 认证在 server.ts 中处理（通过 token 校验卡密或 admin secret）

import express from 'express';
const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
export function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token === ADMIN_SECRET) return next();
  res.status(401).json({ error: 'unauthorized' });
}
