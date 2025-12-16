require('dotenv').config();
const readline = require('readline');
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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function switchToAppPassword() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        CHUYỂN SANG APP PASSWORD                           ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    log('\n📝 Nhập App Password (16 ký tự, không có dấu cách):', 'blue');
    log('   💡 Lấy App Password tại: https://myaccount.google.com/apppasswords', 'yellow');
    const appPassword = await question('   App Password: ');

    if (!appPassword || appPassword.trim().length === 0) {
        log('\n❌ App Password không được để trống!', 'red');
        rl.close();
        return;
    }

    const cleanPassword = appPassword.trim().replace(/\s/g, '');

    if (cleanPassword.length !== 16) {
        log(`\n⚠️  Cảnh báo: App Password thường có 16 ký tự, nhưng bạn nhập ${cleanPassword.length} ký tự`, 'yellow');
        log('   Bạn có muốn tiếp tục? (y/n): ', 'yellow');
        const confirm = await question('');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            log('   Đã hủy', 'yellow');
            rl.close();
            return;
        }
    }

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

    log('\n🧪 Bạn có muốn test email ngay không?', 'yellow');
    const test = await question('   Test? (y/n): ');

    rl.close();

    if (test.toLowerCase() === 'y' || test.toLowerCase() === 'yes') {
        log('\n🔄 Đang test email...', 'blue');
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
    } else {
        log('\n💡 Để test email, chạy:', 'yellow');
        log('   npm run test:email', 'cyan');
    }
}

if (require.main === module) {
    switchToAppPassword().catch(error => {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
        rl.close();
        process.exit(1);
    });
}

module.exports = { switchToAppPassword };
