// 认证工具函数
import crypto from 'crypto';
import { WebSocketAuthResult, Role } from './types';
import { validateKey } from './services/memoryKeyService';

/**
 * 时间安全的字符串比较，防止时序攻击
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  try {
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch (error) {
    return false;
  }
}

/**
 * 验证 WebSocket 连接的认证信息
 */
export async function authenticateWebSocket(
  role: string | null,
  token: string | undefined,
  userId: string | undefined
): Promise<WebSocketAuthResult> {
  
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
      const keyValidation = await validateKey(token);
      if (keyValidation.valid) {
        return { 
          valid: true, 
          role: 'agent', 
          agentId: keyValidation.agentId as string 
        };
      }
      return { valid: false, role: 'agent', error: 'Invalid agent token' };
    } catch (error) {
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
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 验证密钥强度
 */
export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
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