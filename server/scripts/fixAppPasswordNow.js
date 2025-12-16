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

async function fixAppPasswordNow() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        FIX APP PASSWORD NGAY                             ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    // Đọc App Password từ file
    const passwordFile = path.join(__dirname, '..', 'app_password.txt');
    if (!fs.existsSync(passwordFile)) {
        log('\n❌ Không tìm thấy file app_password.txt', 'red');
        return;
    }

    const appPassword = fs.readFileSync(passwordFile, 'utf8').trim();
    log(`\n📋 App Password từ file: "${appPassword}"`, 'blue');
    log(`   Độ dài: ${appPassword.length} ký tự`, 'blue');

    log('\n💾 Đang cập nhật .env...', 'blue');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update SMTP_PASS - GIỮ NGUYÊN DẤU CÁCH
    const smtpPassRegex = /^SMTP_PASS=.*$/m;
    if (smtpPassRegex.test(envContent)) {
        envContent = envContent.replace(smtpPassRegex, `SMTP_PASS=${appPassword}`);
        log('   ✅ Đã cập nhật SMTP_PASS (giữ nguyên dấu cách)', 'green');
    } else {
        envContent += `\nSMTP_PASS=${appPassword}`;
        log('   ✅ Đã thêm SMTP_PASS (giữ nguyên dấu cách)', 'green');
    }

    // Disable OAuth2
    const useOAuth2Regex = /^USE_OAUTH2=.*$/m;
    if (useOAuth2Regex.test(envContent)) {
        envContent = envContent.replace(useOAuth2Regex, 'USE_OAUTH2=false');
        log('   ✅ Đã tắt OAuth2', 'green');
    } else {
        envContent += `\nUSE_OAUTH2=false`;
        log('   ✅ Đã thêm USE_OAUTH2=false', 'green');
    }

    // Đảm bảo SMTP settings đúng
    const smtpHostRegex = /^SMTP_HOST=.*$/m;
    if (!smtpHostRegex.test(envContent)) {
        envContent += `\nSMTP_HOST=smtp.gmail.com`;
    }

    const smtpPortRegex = /^SMTP_PORT=.*$/m;
    if (!smtpPortRegex.test(envContent)) {
        envContent += `\nSMTP_PORT=587`;
    }

    const smtpUserRegex = /^SMTP_USER=.*$/m;
    if (!smtpUserRegex.test(envContent)) {
        envContent += `\nSMTP_USER=trungontq1@gmail.com`;
    }

    const smtpFromRegex = /^SMTP_FROM=.*$/m;
    if (!smtpFromRegex.test(envContent)) {
        envContent += `\nSMTP_FROM=trungontq1@gmail.com`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    log('\n✅ Đã cập nhật .env thành công!', 'green');

    log('\n🧪 Đang test email với App Password...', 'blue');
    console.log();

    try {
        execSync('node scripts/testEmail.js', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
    } catch (error) {
        log('\n⚠️  Test có lỗi.', 'yellow');
    }
}

if (require.main === module) {
    fixAppPasswordNow().catch(error => {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { fixAppPasswordNow };
