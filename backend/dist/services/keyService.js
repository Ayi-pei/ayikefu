"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRandomKey = genRandomKey;
exports.createKey = createKey;
exports.getKeyFromDb = getKeyFromDb;
exports.validateKey = validateKey;
exports.listKeys = listKeys;
exports.disableKey = disableKey;
const crypto_1 = require("crypto");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const redisClient_1 = require("../redisClient");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbPath = process.env.SQLITE_PATH || path_1.default.join(__dirname, '..', '..', 'data', 'sqlite.db');
const dir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dir))
    fs_1.default.mkdirSync(dir, { recursive: true });
const db = new better_sqlite3_1.default(dbPath);
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
function genRandomKey() {
    return (0, crypto_1.randomBytes)(8).toString('hex').toUpperCase(); // 16 hex chars
}
function createKey(agentId, daysValid = 7) {
    const key = genRandomKey();
    const expiresAt = daysValid ? Math.floor(Date.now() / 1000) + daysValid * 86400 : null;
    let info;
    info = db.prepare(`INSERT INTO agent_keys (key_code, agent_id, expires_at) VALUES (?, ?, ?)`).run(key, agentId, expiresAt);
    const payload = JSON.stringify({ agentId, expiresAt });
    // Try to cache in Redis, but don't fail if Redis is unavailable
    try {
        if (expiresAt) {
            const ttl = expiresAt - Math.floor(Date.now() / 1000);
            if (ttl > 0)
                redisClient_1.redis.set((0, redisClient_1.keyPrefix)('agent_key', key), payload, 'EX', ttl);
        }
        else {
            redisClient_1.redis.set((0, redisClient_1.keyPrefix)('agent_key', key), payload);
        }
    }
    catch (err) {
        console.warn('Failed to cache key in Redis:', err);
    }
    return { id: info.lastInsertRowid, key_code: key, agent_id: agentId, expires_at: expiresAt, status: 'active' };
}
function getKeyFromDb(key) {
    const row = db.prepare(`SELECT * FROM agent_keys WHERE key_code = ?`).get(key);
    if (!row)
        return null;
    return {
        id: row.id,
        key_code: row.key_code,
        agent_id: row.agent_id,
        expires_at: row.expires_at,
        status: row.status,
        created_at: row.created_at
    };
}
async function validateKey(key) {
    // Try to get from Redis cache first, but fallback to database if Redis fails
    try {
        const cache = await redisClient_1.redis.get((0, redisClient_1.keyPrefix)('agent_key', key));
        if (cache) {
            const parsed = JSON.parse(cache);
            if (parsed.expiresAt && parsed.expiresAt < Math.floor(Date.now() / 1000))
                return { valid: false, reason: 'expired' };
            return { valid: true, agentId: parsed.agentId };
        }
    }
    catch (err) {
        console.warn('Failed to get key from Redis cache:', err);
    }
    const row = getKeyFromDb(key);
    if (!row)
        return { valid: false, reason: 'notfound' };
    if (row.status !== 'active')
        return { valid: false, reason: 'disabled' };
    if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000))
        return { valid: false, reason: 'expired' };
    // Try to cache the result, but don't fail if Redis is unavailable
    try {
        const payload = JSON.stringify({ agentId: row.agent_id, expiresAt: row.expires_at });
        if (row.expires_at) {
            const ttl = row.expires_at - Math.floor(Date.now() / 1000);
            if (ttl > 0)
                await redisClient_1.redis.set((0, redisClient_1.keyPrefix)('agent_key', key), payload, 'EX', ttl);
        }
        else {
            await redisClient_1.redis.set((0, redisClient_1.keyPrefix)('agent_key', key), payload);
        }
    }
    catch (err) {
        console.warn('Failed to cache key in Redis:', err);
    }
    return { valid: true, agentId: row.agent_id };
}
function listKeys() {
    return db.prepare(`SELECT * FROM agent_keys ORDER BY created_at DESC LIMIT 200`).all();
}
function disableKey(key) {
    db.prepare(`UPDATE agent_keys SET status='disabled' WHERE key_code = ?`).run(key);
    // Try to remove from Redis cache, but don't fail if Redis is unavailable
    try {
        redisClient_1.redis.del((0, redisClient_1.keyPrefix)('agent_key', key));
    }
    catch (err) {
        console.warn('Failed to remove key from Redis cache:', err);
    }
}
