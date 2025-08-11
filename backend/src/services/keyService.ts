import { randomBytes } from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { redis, keyPrefix } from '../redisClient';
import dotenv from 'dotenv';
dotenv.config();

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '..', '..', 'data', 'sqlite.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.prepare(`
CREATE TABLE IF NOT EXISTS agent_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_code TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,
  expires_at INTEGER,
  status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
`).run();

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
  let info: Database.RunResult;
  info = db.prepare(`INSERT INTO agent_keys (key_code, agent_id, expires_at) VALUES (?, ?, ?)`).run(key, agentId, expiresAt);
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
  
  return { id: info.lastInsertRowid as number, key_code: key, agent_id: agentId, expires_at: expiresAt, status: 'active' };
}

export function getKeyFromDb(key: string): AgentKey | null {
  const row = db.prepare(`SELECT * FROM agent_keys WHERE key_code = ?`).get(key) as any;
  if (!row) return null;
  return {
    id: row.id,
    key_code: row.key_code,
    agent_id: row.agent_id,
    expires_at: row.expires_at,
    status: row.status,
    created_at: row.created_at
  };
}

export async function validateKey(key: string): Promise<{ valid: boolean; agentId?: string; reason?: string }> {
  // Try to get from Redis cache first, but fallback to database if Redis fails
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
  
  const row = getKeyFromDb(key);
  if (!row) return { valid: false, reason: 'notfound' };
  if (row.status !== 'active') return { valid: false, reason: 'disabled' };
  if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'expired' };
  
  // Try to cache the result, but don't fail if Redis is unavailable
  try {
    const payload = JSON.stringify({ agentId: row.agent_id, expiresAt: row.expires_at });
    if (row.expires_at) {
      const ttl = row.expires_at - Math.floor(Date.now() / 1000);
      if (ttl > 0) await redis.set(keyPrefix('agent_key', key), payload, 'EX', ttl);
    } else {
      await redis.set(keyPrefix('agent_key', key), payload);
    }
  } catch (err) {
    console.warn('Failed to cache key in Redis:', err);
  }
  
  return { valid: true, agentId: row.agent_id };
}

export function listKeys(): AgentKey[] {
  return db.prepare(`SELECT * FROM agent_keys ORDER BY created_at DESC LIMIT 200`).all() as AgentKey[];
}

export function disableKey(key: string) {
  db.prepare(`UPDATE agent_keys SET status='disabled' WHERE key_code = ?`).run(key);
  
  // Try to remove from Redis cache, but don't fail if Redis is unavailable
  try {
    redis.del(keyPrefix('agent_key', key));
  } catch (err) {
    console.warn('Failed to remove key from Redis cache:', err);
  }
}
