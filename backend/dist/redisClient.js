"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.keyPrefix = keyPrefix;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const host = process.env.REDIS_HOST || '127.0.0.1';
const port = +(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;
exports.redis = new ioredis_1.default({
    host,
    port,
    password,
    retryStrategy(times) { return Math.min(times * 50, 2000); },
    lazyConnect: true,
    maxRetriesPerRequest: 1
});
// Add error handling to prevent crashes when Redis is unavailable
exports.redis.on('error', (err) => {
    console.warn('Redis connection failed:', err.message);
    console.warn('Application will continue without Redis caching');
});
function keyPrefix(...parts) {
    return parts.join(':');
}
