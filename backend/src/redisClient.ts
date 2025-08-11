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
  retryStrategy(times) { return Math.min(times * 50, 2000); }
});

export function keyPrefix(...parts: string[]) {
  return parts.join(':');
}
