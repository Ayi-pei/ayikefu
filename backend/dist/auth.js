"use strict";
// 用于 HTTP 层的简单 admin 校验中间件（供 admin routes 使用）
// WebSocket 认证在 server.ts 中处理（通过 token 校验卡密或 admin secret）
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const crypto_1 = __importDefault(require("crypto"));
const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
function requireAdmin(req, res, next) {
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
        if (crypto_1.default.timingSafeEqual(expectedToken, providedToken)) {
            return next();
        }
        return res.status(401).json({ error: 'unauthorized' });
    }
    catch (error) {
        return res.status(401).json({ error: 'unauthorized' });
    }
}
