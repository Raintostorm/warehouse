require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fixOAuth2AndTest() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        FIX OAUTH2 VÀ TEST NGAY                          ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    log('\n💾 Đang cập nhật .env để dùng OAuth2...', 'blue');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Enable OAuth2
    const useOAuth2Regex = /^USE_OAUTH2=.*$/m;
    if (useOAuth2Regex.test(envContent)) {
        envContent = envContent.replace(useOAuth2Regex, 'USE_OAUTH2=true');
    } else {
        envContent += `\nUSE_OAUTH2=true`;
    }

    // Ensure OAuth2 credentials exist (chỉ thêm nếu chưa có, không ghi đè)
    const requiredVars = {
        'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID || '',
        'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET || '',
        'GMAIL_REFRESH_TOKEN': process.env.GMAIL_REFRESH_TOKEN || '',
        'GMAIL_USER': process.env.GMAIL_USER || '',
        'SMTP_FROM': process.env.SMTP_FROM || ''
    };

    for (const [key, defaultValue] of Object.entries(requiredVars)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (!regex.test(envContent)) {
            // Chỉ thêm nếu chưa có trong file
            if (defaultValue) {
                envContent += `\n${key}=${defaultValue}`;
            } else {
                envContent += `\n${key}=`;
            }
        }
        // Không ghi đè giá trị đã có
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    log('✅ Đã cập nhật .env với OAuth2', 'green');

    log('\n🧪 Đang test email với OAuth2 (Gmail API + SMTP fallback)...', 'blue');
    console.log();

    try {
        execSync('node scripts/testEmail.js', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
    } catch (error) {
        log('\n⚠️  Test có lỗi. Kiểm tra lại.', 'yellow');
    }
}

if (require.main === module) {
    fixOAuth2AndTest().catch(error => {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { fixOAuth2AndTest };
