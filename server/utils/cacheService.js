const redis = require('./redis');

class CacheService {
    /**
     * Lấy data từ cache, nếu không có thì gọi function và cache lại
     * @param {string} key - Cache key (ví dụ: 'products:all')
     * @param {Function} fetchFn - Function để fetch data nếu cache miss
     * @param {number} ttl - Time to live (seconds), mặc định 300 (5 phút)
     */
    static async getOrSet(key, fetchFn, ttl = 300) {
        try {
            // Thử lấy từ cache
            const cached = await redis.get(key);
            if (cached) {
                return JSON.parse(cached);
            }

            // Cache miss → Fetch data
            const data = await fetchFn();

            // Lưu vào cache
            await redis.setex(key, ttl, JSON.stringify(data));

            return data;
        } catch (error) {
            // Nếu Redis lỗi, fallback về fetch trực tiếp
            console.error('Cache error:', error.message);
            return await fetchFn();
        }
    }

    /**
     * Xóa cache theo pattern
     * @param {string} pattern - Pattern (ví dụ: 'products:*')
     */
    static async invalidate(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache invalidation error:', error.message);
        }
    }

    /**
     * Xóa cache theo key cụ thể
     */
    static async delete(key) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error('Cache delete error:', error.message);
        }
    }
}

module.exports = CacheService;
