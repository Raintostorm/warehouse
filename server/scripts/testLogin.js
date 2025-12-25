require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcrypt');

async function testLogin() {
    try {
        const email = 'admin@example.com';
        const password = 'admin123';

        console.log('Testing login for:', email);

        // Check if user exists
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }

        const user = userResult.rows[0];
        console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            hasPassword: !!user.password,
            passwordLength: user.password ? user.password.length : 0
        });

        if (!user.password) {
            console.log('❌ User has no password');
            return;
        }

        // Test password
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password match:', isValid);

        if (isValid) {
            console.log('✅ Login should succeed');
        } else {
            console.log('❌ Password does not match');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testLogin();
