require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

async function updateAppPasswordFromFile() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        CẬP NHẬT APP PASSWORD TỪ FILE                     ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    const passwordFile = path.join(__dirname, '..', 'app_password.txt');

    if (!fs.existsSync(passwordFile)) {
        log('\n❌ Không tìm thấy file app_password.txt', 'red');
        return;
    }

    const appPassword = fs.readFileSync(passwordFile, 'utf8').trim();
    const cleanPassword = appPassword.replace(/\s/g, '');

    if (!cleanPassword || cleanPassword.length === 0) {
        log('\n❌ File app_password.txt trống!', 'red');
        return;
    }

    log(`\n📋 App Password từ file: ${cleanPassword.substring(0, 4)}****${cleanPassword.substring(cleanPassword.length - 4)}`, 'blue');
    log(`   Độ dài: ${cleanPassword.length} ký tự`, 'blue');

    log('\n💾 Đang cập nhật .env...', 'blue');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update SMTP_PASS
    const smtpPassRegex = /^SMTP_PASS=.*$/m;
    if (smtpPassRegex.test(envContent)) {
        envContent = envContent.replace(smtpPassRegex, `SMTP_PASS=${cleanPassword}`);
        log('   ✅ Đã cập nhật SMTP_PASS', 'green');
    } else {
        envContent += `\nSMTP_PASS=${cleanPassword}`;
        log('   ✅ Đã thêm SMTP_PASS', 'green');
    }

    // Disable OAuth2
    const useOAuth2Regex = /^USE_OAUTH2=.*$/m;
    if (useOAuth2Regex.test(envContent)) {
        envContent = envContent.replace(useOAuth2Regex, 'USE_OAUTH2=false');
        log('   ✅ Đã tắt OAuth2 (USE_OAUTH2=false)', 'green');
    } else {
        envContent += `\nUSE_OAUTH2=false`;
        log('   ✅ Đã thêm USE_OAUTH2=false', 'green');
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    log('\n✅ Đã cập nhật .env thành công!', 'green');

    log('\n🧪 Đang test email...', 'blue');
    console.log();

    const { execSync } = require('child_process');
    try {
        execSync('node scripts/testEmail.js', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
    } catch (error) {
        log('\n⚠️  Test có lỗi. Kiểm tra lại App Password.', 'yellow');
    }
}

if (require.main === module) {
    updateAppPasswordFromFile().catch(error => {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { updateAppPasswordFromFile };
