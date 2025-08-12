"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRandomKey = genRandomKey;
exports.createKey = createKey;
exports.getKeyFromMemory = getKeyFromMemory;
exports.validateKey = validateKey;
exports.listKeys = listKeys;
exports.disableKey = disableKey;
const crypto_1 = require("crypto");
const redisClient_1 = require("../redisClient");
// 内存存储，避免 SQLite 编译问题
const memoryKeys = new Map();
let keyIdCounter = 1;
function genRandomKey() {
    return (0, crypto_1.randomBytes)(8).toString('hex').toUpperCase(); // 16 hex chars
}
function createKey(agentId, daysValid = 7) {
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
    return keyData;
}
function getKeyFromMemory(key) {
    return memoryKeys.get(key) || null;
}
async function validateKey(key) {
    // Try to get from Redis cache first, but fallback to memory if Redis fails
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
    const keyData = getKeyFromMemory(key);
    if (!keyData)
        return { valid: false, reason: 'notfound' };
    if (keyData.status !== 'active')
        return { valid: false, reason: 'disabled' };
    if (keyData.expires_at && keyData.expires_at < Math.floor(Date.now() / 1000))
        return { valid: false, reason: 'expired' };
    // Try to cache the result, but don't fail if Redis is unavailable
    try {
        const payload = JSON.stringify({ agentId: keyData.agent_id, expiresAt: keyData.expires_at });
        if (keyData.expires_at) {
            const ttl = keyData.expires_at - Math.floor(Date.now() / 1000);
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
    return { valid: true, agentId: keyData.agent_id };
}
function listKeys() {
    return Array.from(memoryKeys.values())
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 200);
}
function disableKey(key) {
    const keyData = memoryKeys.get(key);
    if (keyData) {
        keyData.status = 'disabled';
        memoryKeys.set(key, keyData);
    }
    // Try to remove from Redis cache, but don't fail if Redis is unavailable
    try {
        redisClient_1.redis.del((0, redisClient_1.keyPrefix)('agent_key', key));
    }
    catch (err) {
        console.warn('Failed to remove key from Redis cache:', err);
    }
}
