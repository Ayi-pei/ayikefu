import { randomBytes } from 'crypto';
import { safeRedis as redis, keyPrefix } from '../redisClient';

// 内存存储，避免 SQLite 编译问题
const memoryKeys = new Map<string, {
  id: number;
  key_code: string;
  agent_id: string;
  expires_at: number | null;
  status: string;
  created_at: number;
}>();

let keyIdCounter = 1;

export interface AgentKey {
  id?: number;
  key_code: string;
  agent_id: string;
  expires_at?: number | null;
  status?: string;
  created_at?: number;
}

export function genRandomKey(): string {
  return randomBytes(8).toString('hex').toUpperCase(); // 16 hex chars
}

export function createKey(agentId: string, daysValid = 7): AgentKey {
  const key = genRandomKey();
  const expiresAt = daysValid ? Math.floor(Date.now() / 1000) + daysValid * 86400 : null;
  const createdAt = Math.floor(Date.now() / 1000);
  
  const keyData = {
    id: keyIdCounter++,
    key_code: key,
    agent_id: agentId,
    expires_at: expiresAt,
    status: 'active',
    created_at: createdAt
  };
  
  memoryKeys.set(key, keyData);
  
  const payload = JSON.stringify({ agentId, expiresAt });
  
  // Try to cache in Redis, but don't fail if Redis is unavailable
  try {
    if (expiresAt) {
      const ttl = expiresAt - Math.floor(Date.now() / 1000);
      if (ttl > 0) redis.set(keyPrefix('agent_key', key), payload, 'EX', ttl);
    } else {
      redis.set(keyPrefix('agent_key', key), payload);
    }
  } catch (err) {
    console.warn('Failed to cache key in Redis:', err);
  }
  
  return keyData;
}

export function getKeyFromMemory(key: string): AgentKey | null {
  return memoryKeys.get(key) || null;
}

export async function validateKey(key: string): Promise<{ valid: boolean; agentId?: string; reason?: string }> {
  // Try to get from Redis cache first, but fallback to memory if Redis fails
  try {
    const cache = await redis.get(keyPrefix('agent_key', key));
    if (cache) {
      const parsed = JSON.parse(cache);
      if (parsed.expiresAt && parsed.expiresAt < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'expired' };
      return { valid: true, agentId: parsed.agentId };
    }
  } catch (err) {
    console.warn('Failed to get key from Redis cache:', err);
  }
  
  const keyData = getKeyFromMemory(key);
  if (!keyData) return { valid: false, reason: 'notfound' };
  if (keyData.status !== 'active') return { valid: false, reason: 'disabled' };
  if (keyData.expires_at && keyData.expires_at < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'expired' };
  
  // Try to cache the result, but don't fail if Redis is unavailable
  try {
    const payload = JSON.stringify({ agentId: keyData.agent_id, expiresAt: keyData.expires_at });
    if (keyData.expires_at) {
      const ttl = keyData.expires_at - Math.floor(Date.now() / 1000);
      if (ttl > 0) await redis.set(keyPrefix('agent_key', key), payload, 'EX', ttl);
    } else {
      await redis.set(keyPrefix('agent_key', key), payload);
    }
  } catch (err) {
    console.warn('Failed to cache key in Redis:', err);
  }
  
  return { valid: true, agentId: keyData.agent_id };
}

export function listKeys(): AgentKey[] {
  return Array.from(memoryKeys.values())
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 200);
}

export function disableKey(key: string) {
  const keyData = memoryKeys.get(key);
  if (keyData) {
    keyData.status = 'disabled';
    memoryKeys.set(key, keyData);
  }
  
  // Try to remove from Redis cache, but don't fail if Redis is unavailable
  try {
    redis.del(keyPrefix('agent_key', key));
  } catch (err) {
    console.warn('Failed to remove key from Redis cache:', err);
  }
}