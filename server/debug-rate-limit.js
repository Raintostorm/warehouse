/**
 * Script debug rate limiting
 * Kiểm tra Redis connection và rate limit keys
 */

const redis = require('./utils/redis');

async function debugRateLimit() {
    console.log('🔍 Debugging Rate Limit...\n');

    // 1. Kiểm tra Redis connection
    console.log('1. Redis Status:');
    console.log(`   Status: ${redis.status}`);
    console.log(`   Host: ${redis.options.host}`);
    console.log(`   Port: ${redis.options.port}`);

    try {
        const ping = await redis.ping();
        console.log(`   Ping: ${ping} ✅`);
    } catch (error) {
        console.log(`   Ping: FAILED ❌`);
        console.log(`   Error: ${error.message}`);
    }

    // 2. Kiểm tra rate limit keys
    console.log('\n2. Rate Limit Keys in Redis:');
    try {
        const keys = await redis.keys('rl:*');
        console.log(`   Found ${keys.length} keys:`);
        keys.forEach(key => {
            console.log(`   - ${key}`);
        });

        if (keys.length > 0) {
            console.log('\n3. Rate Limit Values:');
            for (const key of keys.slice(0, 5)) { // Chỉ show 5 keys đầu
                const value = await redis.get(key);
                const ttl = await redis.ttl(key);
                console.log(`   ${key}:`);
                console.log(`     Value: ${value}`);
                console.log(`     TTL: ${ttl}s (${Math.floor(ttl / 60)} minutes)`);
            }
        }
    } catch (error) {
        console.log(`   Error getting keys: ${error.message}`);
    }

    // 3. Test rate limit store
    console.log('\n4. Testing Rate Limit Store:');
    try {
        const RedisStore = require('rate-limit-redis');
        const store = new RedisStore({
            client: redis,
            prefix: 'rl:test:',
        });
        console.log('   ✅ RedisStore created successfully');

        // Test increment
        const key = 'test-key';
        const result = await store.increment(key);
        console.log(`   ✅ Increment test: ${JSON.stringify(result)}`);
    } catch (error) {
        console.log(`   ❌ RedisStore error: ${error.message}`);
    }

    console.log('\n✅ Debug completed!');
    process.exit(0);
}

debugRateLimit().catch(error => {
    console.error('❌ Debug error:', error);
    process.exit(1);
});
