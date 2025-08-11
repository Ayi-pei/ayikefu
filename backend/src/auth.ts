// 用于 HTTP 层的简单 admin 校验中间件（供 admin routes 使用）
// WebSocket 认证在 server.ts 中处理（通过 token 校验卡密或 admin secret）

import express from 'express';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';

export function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token || token.length === 0) {
    return res.status(401).json({ error: 'Empty token' });
  }
  
  try {
    // 使用时间安全的比较防止时序攻击
    const expectedToken = Buffer.from(ADMIN_SECRET, 'utf8');
    const providedToken = Buffer.from(token, 'utf8');
    
    if (expectedToken.length !== providedToken.length) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    if (crypto.timingSafeEqual(expectedToken, providedToken)) {
      return next();
    }
    
    return res.status(401).json({ error: 'unauthorized' });
  } catch (error) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}
