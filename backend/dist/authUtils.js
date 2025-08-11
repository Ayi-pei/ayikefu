"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timingSafeStringCompare = timingSafeStringCompare;
exports.authenticateWebSocket = authenticateWebSocket;
exports.generateSecureToken = generateSecureToken;
exports.validatePasswordStrength = validatePasswordStrength;
// 认证工具函数
const crypto_1 = __importDefault(require("crypto"));
const keyService_1 = require("./services/keyService");
/**
 * 时间安全的字符串比较，防止时序攻击
 */
function timingSafeStringCompare(a, b) {
    try {
        const bufferA = Buffer.from(a, 'utf8');
        const bufferB = Buffer.from(b, 'utf8');
        if (bufferA.length !== bufferB.length) {
            return false;
        }
        return crypto_1.default.timingSafeEqual(bufferA, bufferB);
    }
    catch (error) {
        return false;
    }
}
/**
 * 验证 WebSocket 连接的认证信息
 */
async function authenticateWebSocket(role, token, userId) {
    if (role === 'agent') {
        if (!token) {
            return { valid: false, role: 'agent', error: 'Missing token for agent role' };
        }
        const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
        // 检查是否为管理员密钥
        if (timingSafeStringCompare(token, ADMIN_SECRET)) {
            return { valid: true, role: 'agent', agentId: 'ADMIN' };
        }
        // 验证卡密
        try {
            const keyValidation = await (0, keyService_1.validateKey)(token);
            if (keyValidation.valid) {
                return {
                    valid: true,
                    role: 'agent',
                    agentId: keyValidation.agentId
                };
            }
            return { valid: false, role: 'agent', error: 'Invalid agent token' };
        }
        catch (error) {
            return { valid: false, role: 'agent', error: 'Token validation failed' };
        }
    }
    if (role === 'user') {
        // 用户连接不需要特殊认证，但可以验证 userId 格式
        if (userId && !/^[a-zA-Z0-9_-]+$/.test(userId)) {
            return { valid: false, role: 'user', error: 'Invalid user ID format' };
        }
        return { valid: true, role: 'user', userId };
    }
    return { valid: false, role: 'user', error: 'Invalid role' };
}
/**
 * 生成安全的随机字符串
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * 验证密钥强度
 */
function validatePasswordStrength(password) {
    if (password.length < 12) {
        return { valid: false, message: 'Password must be at least 12 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true, message: 'Password is strong' };
}
