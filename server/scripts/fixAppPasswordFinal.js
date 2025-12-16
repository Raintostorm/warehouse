require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

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

async function fixAppPasswordFinal() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        FIX APP PASSWORD - FINAL                           ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    // Đọc App Password
    const passwordFile = path.join(__dirname, '..', 'app_password.txt');
    const appPassword = fs.readFileSync(passwordFile, 'utf8').trim();

    log(`\n📋 App Password: "${appPassword}"`, 'blue');

    // Đọc và sửa .env
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Xóa dòng comment cũ
    envContent = envContent.replace(/^# SMTP_PASS=.*$/m, '');

    // Update SMTP_PASS
    const smtpPassRegex = /^SMTP_PASS=.*$/m;
    if (smtpPassRegex.test(envContent)) {
        envContent = envContent.replace(smtpPassRegex, `SMTP_PASS=${appPassword}`);
    } else {
        envContent += `\nSMTP_PASS=${appPassword}`;
    }

    // Disable OAuth2
    envContent = envContent.replace(/^USE_OAUTH2=.*$/m, 'USE_OAUTH2=false');

    fs.writeFileSync(envPath, envContent, 'utf8');
    log('✅ Đã cập nhật .env', 'green');

    // Test trực tiếp với nodemailer
    log('\n🧪 Test trực tiếp với App Password...', 'blue');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'trungontq1@gmail.com',
            pass: appPassword
        }
    });

    try {
        log('   Đang verify...', 'blue');
        await transporter.verify();
        log('   ✅ Verify thành công!', 'green');

        log('   Đang gửi email test...', 'blue');
        const info = await transporter.sendMail({
            from: 'trungontq1@gmail.com',
            to: 'trungontq1@gmail.com',
            subject: 'Test Email - App Password',
            text: 'Email test thành công với App Password!'
        });

        log('   ✅ Email đã được gửi!', 'green');
        log(`   📧 Message ID: ${info.messageId}`, 'green');
        log('\n🎉 THÀNH CÔNG! App Password hoạt động!', 'green');
    } catch (error) {
        log(`   ❌ Lỗi: ${error.message}`, 'red');
        log('\n💡 App Password có thể đã hết hạn hoặc không đúng', 'yellow');
        log('   → Tạo App Password mới tại: https://myaccount.google.com/apppasswords', 'yellow');
    }
}

if (require.main === module) {
    fixAppPasswordFinal().catch(error => {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { fixAppPasswordFinal };
