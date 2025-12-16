const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        // Nếu retry quá nhiều, dừng lại (không crash app)
        if (times > 10) {
            console.warn('⚠️  Redis connection failed after multiple retries, continuing without Redis');
            return null; // Dừng retry
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: null, // Không giới hạn retries (sẽ dừng ở retryStrategy)
    lazyConnect: false, // Kết nối ngay
    enableOfflineQueue: true, // Không queue requests khi offline
});

redis.on('connect', () => {
});

redis.on('error', (err) => {
    // Chỉ log warning, không crash app
    if (err.code !== 'ECONNREFUSED') {
        console.warn('⚠️  Redis error:', err.message);
    }
    // Fallback: Nếu Redis down, app vẫn chạy được (không cache)
});

// Handle max retries error gracefully
redis.on('close', () => {
    console.warn('⚠️  Redis connection closed, continuing without Redis');
});

module.exports = redis;
