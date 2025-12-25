require('dotenv').config();

/**
 * Script helper để hướng dẫn reset rate limit
 * Rate limit được lưu trong memory, nên cần restart server
 */

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 Reset Rate Limit');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  Rate limit được lưu trong MEMORY của server process.');
console.log('   Cách duy nhất để reset là RESTART SERVER.\n');

console.log('📋 Các bước:');
console.log('   1. Dừng server: Nhấn Ctrl+C trong terminal đang chạy server');
console.log('   2. Start lại: cd server && npm start');
console.log('   3. Sau đó thử login lại\n');

console.log('⏱️  Hoặc đợi 5 phút để rate limit tự động reset\n');

console.log('📊 Rate Limit Config (Development):');
console.log('   - Max requests: 20');
console.log('   - Window: 5 phút');
console.log('   - Skip successful requests: Có (chỉ đếm failed logins)\n');

console.log('💡 Tip: Successful logins không bị đếm vào rate limit!');
console.log('   Chỉ failed logins mới bị đếm.\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(0);
