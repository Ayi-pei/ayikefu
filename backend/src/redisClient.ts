import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = +(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;

export const redis = new Redis({
  host,
  port,
  password,
  retryStrategy(times) { return Math.min(times * 50, 2000); },
  lazyConnect: true,
  maxRetriesPerRequest: 1
});

// Add error handling to prevent crashes when Redis is unavailable
redis.on('error', (err) => {
  console.warn('Redis connection failed:', err.message);
  console.warn('Application will continue without Redis caching');
});

export function keyPrefix(...parts: string[]) {
  return parts.join(':');
}