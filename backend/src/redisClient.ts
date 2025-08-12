import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = +(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;

const redis = new Redis({
  host,
  port,
  password,
  retryStrategy(times) { return Math.min(times * 50, 2000); },
  lazyConnect: true,
  maxRetriesPerRequest: 1
});

let redisAvailable = false;

redis.on('connect', () => {
  console.log('Redis connected successfully');
  redisAvailable = true;
});

redis.on('error', (err) => {
  console.warn('Redis connection failed:', err.message);
  console.warn('Application will continue without Redis caching');
  redisAvailable = false;
});

redis.on('close', () => {
  console.log('Redis connection closed');
  redisAvailable = false;
});

// Safe Redis operations wrapper
export const safeRedis = {
  async get(key: string): Promise<string | null> {
    if (!redisAvailable) return null;
    try {
      return await redis.get(key);
    } catch (err) {
      console.warn('Redis GET failed:', err);
      return null;
    }
  },

  async set(key: string, value: string, ...args: any[]): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.set(key, value, ...args);
    } catch (err) {
      console.warn('Redis SET failed:', err);
    }
  },

  async del(key: string): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.del(key);
    } catch (err) {
      console.warn('Redis DEL failed:', err);
    }
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!redisAvailable) return [];
    try {
      return await redis.lrange(key, start, stop);
    } catch (err) {
      console.warn('Redis LRANGE failed:', err);
      return [];
    }
  },

  async rpush(key: string, value: string): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.rpush(key, value);
    } catch (err) {
      console.warn('Redis RPUSH failed:', err);
    }
  },

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (!redisAvailable) return;
    try {
      await redis.ltrim(key, start, stop);
    } catch (err) {
      console.warn('Redis LTRIM failed:', err);
    }
  }
};

export function keyPrefix(...parts: string[]) {
  return parts.join(':');
}