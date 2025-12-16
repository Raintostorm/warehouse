const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../utils/redis');

// Helper để format thời gian
const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours} giờ ${minutes % 60} phút`;
    } else if (minutes > 0) {
        return `${minutes} phút ${seconds % 60} giây`;
    } else {
        return `${seconds} giây`;
    }
};

// Helper để tạo Redis store với fallback
const createStore = (prefix) => {
    try {
        // Kiểm tra Redis connection (ioredis không có .status, dùng .status thay vào đó)
        // ioredis có thể check qua ping hoặc connection state
        const isRedisReady = redis && typeof redis.ping === 'function';

        if (isRedisReady) {
            // Test connection với ping (async nhưng không await ở đây)
            // Nếu Redis down, sẽ fallback về memory store khi rate limiter chạy
            return new RedisStore({
                sendCommand: (...args) => {
                    try {
                        return redis.call(...args);
                    } catch (err) {
                        // Redis down, fallback sẽ xử lý
                        throw err;
                    }
                },
                prefix: `rl:${prefix}:`,
            });
        } else {
            console.warn(`⚠️  Redis not available, using memory store for ${prefix}`);
        }
    } catch (error) {
        console.warn(`⚠️  Redis store error for ${prefix}:`, error.message);
        console.warn(`   Will use memory store (will reset on server restart)`);
    }
    return undefined; // Fallback về memory store
};

// Rate limiter cho login
const loginLimiter = rateLimit({
    store: createStore('login'),
    keyGenerator: (req) => {
        // Sử dụng IP address với ipKeyGenerator helper
        const { ipKeyGenerator } = require('express-rate-limit');
        return ipKeyGenerator(req);
    },
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // 5 requests
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Đếm tất cả requests (kể cả thành công)
    handler: (req, res, next, options) => {
        const resetTime = res.get('X-RateLimit-Reset');
        const remaining = res.get('X-RateLimit-Remaining') || 0;
        const limit = res.get('X-RateLimit-Limit') || options.max;
        const retryAfter = resetTime ? Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000) : 900;
        const retryAfterFormatted = formatTime(retryAfter * 1000);

        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

        res.status(429).json({
            success: false,
            message: `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${retryAfterFormatted}`,
            retryAfter: retryAfter,
            retryAfterFormatted: retryAfterFormatted,
            resetTime: resetTime,
            limit: parseInt(limit) || options.max,
            remaining: parseInt(remaining) || 0,
            windowMs: options.windowMs
        });
    }
});

// Rate limiter cho API (chung)
const apiLimiter = rateLimit({
    store: createStore('api'),
    keyGenerator: (req) => {
        // Đếm theo user ID nếu có, nếu không thì theo IP
        if (req.user?.id) {
            return `user:${req.user.id}`;
        }
        const { ipKeyGenerator } = require('express-rate-limit');
        return ipKeyGenerator(req);
    },
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 100, // 100 requests
    message: (req, res) => {
        const resetTime = res.get('X-RateLimit-Reset');
        const retryAfter = resetTime ? Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000) : 3600;
        const retryAfterFormatted = formatTime(retryAfter * 1000);

        return {
            success: false,
            message: `Quá nhiều requests. Vui lòng thử lại sau ${retryAfterFormatted}`,
            retryAfter: retryAfter,
            retryAfterFormatted: retryAfterFormatted
        };
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter cho export
const exportLimiter = rateLimit({
    store: createStore('export'),
    keyGenerator: (req) => {
        // Đếm theo user ID
        if (req.user?.id) {
            return `user:${req.user.id}`;
        }
        const { ipKeyGenerator } = require('express-rate-limit');
        return ipKeyGenerator(req);
    },
    windowMs: 24 * 60 * 60 * 1000, // 24 giờ
    max: 10, // 10 requests/ngày
    message: (req, res) => {
        const resetTime = res.get('X-RateLimit-Reset');
        const retryAfter = resetTime ? Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000) : 86400;
        const retryAfterFormatted = formatTime(retryAfter * 1000);

        return {
            success: false,
            message: `Đã vượt quá giới hạn export (10 lần/ngày). Vui lòng thử lại sau ${retryAfterFormatted}`,
            retryAfter: retryAfter,
            retryAfterFormatted: retryAfterFormatted,
            limit: 10
        };
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter cho import
const importLimiter = rateLimit({
    store: createStore('import'),
    keyGenerator: (req) => {
        // Đếm theo user ID
        if (req.user?.id) {
            return `user:${req.user.id}`;
        }
        const { ipKeyGenerator } = require('express-rate-limit');
        return ipKeyGenerator(req);
    },
    windowMs: 24 * 60 * 60 * 1000, // 24 giờ
    max: 5, // 5 requests/ngày
    message: (req, res) => {
        const resetTime = res.get('X-RateLimit-Reset');
        const retryAfter = resetTime ? Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000) : 86400;
        const retryAfterFormatted = formatTime(retryAfter * 1000);

        return {
            success: false,
            message: `Đã vượt quá giới hạn import (5 lần/ngày). Vui lòng thử lại sau ${retryAfterFormatted}`,
            retryAfter: retryAfter,
            retryAfterFormatted: retryAfterFormatted,
            limit: 5
        };
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    apiLimiter,
    exportLimiter,
    importLimiter
};
