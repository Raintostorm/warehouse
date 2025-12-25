require('dotenv').config();
const express = require('express');
const app = express();

/**
 * Script để reset rate limit bằng cách gọi endpoint
 * Hoặc đơn giản là restart server (vì dùng memory store)
 */

console.log('📋 Thông tin đăng nhập mặc định:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   👤 Admin:');
console.log('     Email: admin@example.com');
console.log('     Password: admin123');
console.log('   👤 Manager:');
console.log('     Email: manager@example.com');
console.log('     Password: manager123');
console.log('   👤 Staff (3 users):');
console.log('     Email: staff1@example.com, staff2@example.com, staff3@example.com');
console.log('     Password: staff123');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 Để reset rate limit:');
console.log('   1. Restart server (Ctrl+C rồi npm start)');
console.log('   2. Hoặc đợi 5 phút (trong development mode)');
console.log('   3. Rate limit: 20 requests / 5 phút (chỉ đếm failed logins)\n');

process.exit(0);
