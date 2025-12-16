const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        // Nếu retry quá nhiều, dừng lại (không crash app)
        if (times > 10) {
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
    // Fallback: Nếu Redis down, app vẫn chạy được (không cache)
    // Không log để tránh spam logs khi Redis không có sẵn
});

// Handle max retries error gracefully
redis.on('close', () => {
    // Connection closed, app sẽ tiếp tục hoạt động
});

module.exports = redis;
