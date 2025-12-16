require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(title, 'cyan');
    console.log('='.repeat(70) + '\n');
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function checkEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        log('⚠️  File .env chưa tồn tại!', 'yellow');
        return false;
    }
    return true;
}

function checkEnvVar(varName, displayName) {
    const value = process.env[varName];
    if (!value || value.trim() === '' || value.includes('your-') || value.includes('change-this')) {
        log(`   ❌ ${displayName}: Chưa cấu hình`, 'red');
        return false;
    }
    log(`   ✅ ${displayName}: Đã cấu hình`, 'green');
    return true;
}

async function checkCurrentConfig() {
    logSection('📋 KIỂM TRA CẤU HÌNH HIỆN TẠI');

    if (!checkEnvFile()) {
        log('💡 Tạo file .env từ .env.example', 'yellow');
        return false;
    }

    log('Đang kiểm tra các biến môi trường...\n', 'blue');

    const checks = {
        database: checkEnvVar('DATABASE_URL', 'Database URL'),
        jwt: checkEnvVar('JWT_SECRET', 'JWT Secret'),
        email: {
            smtp: checkEnvVar('SMTP_HOST', 'SMTP Host') || checkEnvVar('EMAIL_HOST', 'Email Host'),
            port: checkEnvVar('SMTP_PORT', 'SMTP Port') || checkEnvVar('EMAIL_PORT', 'Email Port'),
            user: checkEnvVar('SMTP_USER', 'SMTP User') || checkEnvVar('EMAIL_USER', 'Email User'),
            pass: checkEnvVar('SMTP_PASS', 'SMTP Password') || checkEnvVar('EMAIL_PASS', 'Email Password')
        },
        google: {
            clientId: checkEnvVar('GOOGLE_CLIENT_ID', 'Google Client ID'),
            secret: checkEnvVar('GOOGLE_CLIENT_SECRET', 'Google Client Secret')
        }
    };

    const emailConfigured = checks.email.smtp && checks.email.port && checks.email.user && checks.email.pass;
    const googleConfigured = checks.google.clientId && checks.google.secret;

    console.log();
    log('📊 TÓM TẮT:', 'cyan');
    log(`   Database: ${checks.database ? '✅' : '❌'}`, checks.database ? 'green' : 'red');
    log(`   JWT Secret: ${checks.jwt ? '✅' : '❌'}`, checks.jwt ? 'green' : 'red');
    log(`   Email: ${emailConfigured ? '✅' : '❌'}`, emailConfigured ? 'green' : 'yellow');
    log(`   Google OAuth: ${googleConfigured ? '✅' : '⚠️  (Tùy chọn)'}`, googleConfigured ? 'green' : 'yellow');

    return { checks, emailConfigured, googleConfigured };
}

async function setupEmail() {
    logSection('📧 SETUP EMAIL (SMTP)');

    log('Chọn SMTP provider:', 'blue');
    log('1. Gmail (Khuyến nghị cho test)', 'green');
    log('2. SendGrid (Khuyến nghị cho production)', 'green');
    log('3. Mailgun', 'green');
    log('4. Outlook/Hotmail', 'green');
    log('5. Custom SMTP', 'green');
    log('6. Bỏ qua (không setup)', 'yellow');

    const choice = await question('\nChọn (1-6): ');

    if (choice === '6') {
        log('Đã bỏ qua setup Email', 'yellow');
        return null;
    }

    let config = {};

    switch (choice) {
        case '1': // Gmail
            log('\n📝 Hướng dẫn Gmail:', 'cyan');
            log('1. Vào https://myaccount.google.com/apppasswords', 'yellow');
            log('2. Tạo App Password mới', 'yellow');
            log('3. Copy password (16 ký tự)\n', 'yellow');

            config = {
                SMTP_HOST: 'smtp.gmail.com',
                SMTP_PORT: '587',
                SMTP_SECURE: 'false'
            };
            config.SMTP_USER = await question('Email của bạn: ');
            config.SMTP_PASS = await question('App Password (16 ký tự): ');
            config.SMTP_FROM = config.SMTP_USER;
            break;

        case '2': // SendGrid
            config = {
                SMTP_HOST: 'smtp.sendgrid.net',
                SMTP_PORT: '587',
                SMTP_SECURE: 'false',
                SMTP_USER: 'apikey'
            };
            config.SMTP_PASS = await question('SendGrid API Key: ');
            config.SMTP_FROM = await question('Email đã verify: ');
            break;

        case '3': // Mailgun
            config = {
                SMTP_HOST: 'smtp.mailgun.org',
                SMTP_PORT: '587',
                SMTP_SECURE: 'false'
            };
            config.SMTP_USER = await question('Mailgun Username: ');
            config.SMTP_PASS = await question('Mailgun Password: ');
            config.SMTP_FROM = await question('Email đã verify: ');
            break;

        case '4': // Outlook
            config = {
                SMTP_HOST: 'smtp-mail.outlook.com',
                SMTP_PORT: '587',
                SMTP_SECURE: 'false'
            };
            config.SMTP_USER = await question('Outlook Email: ');
            config.SMTP_PASS = await question('Password: ');
            config.SMTP_FROM = config.SMTP_USER;
            break;

        case '5': // Custom
            config.SMTP_HOST = await question('SMTP Host: ');
            config.SMTP_PORT = await question('SMTP Port (587/465): ');
            config.SMTP_USER = await question('SMTP Username: ');
            config.SMTP_PASS = await question('SMTP Password: ');
            config.SMTP_SECURE = await question('Use SSL? (true/false): ');
            config.SMTP_FROM = await question('From Email: ');
            break;

        default:
            log('Lựa chọn không hợp lệ', 'red');
            return null;
    }

    return config;
}

async function setupGoogleOAuth() {
    logSection('🔐 SETUP GOOGLE OAUTH (Tùy chọn)');

    const setup = await question('Bạn có muốn setup Google OAuth? (y/n): ');

    if (setup.toLowerCase() !== 'y') {
        log('Đã bỏ qua setup Google OAuth', 'yellow');
        return null;
    }

    log('\n📝 Hướng dẫn:', 'cyan');
    log('1. Vào https://console.cloud.google.com/', 'yellow');
    log('2. Tạo project hoặc chọn project có sẵn', 'yellow');
    log('3. Vào APIs & Services → Credentials', 'yellow');
    log('4. Create Credentials → OAuth client ID', 'yellow');
    log('5. Copy Client ID và Client Secret\n', 'yellow');

    const config = {};
    config.GOOGLE_CLIENT_ID = await question('Google Client ID: ');
    config.GOOGLE_CLIENT_SECRET = await question('Google Client Secret: ');

    return config;
}

function updateEnvFile(config) {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';

    // Đọc file .env hiện tại nếu có
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Thêm hoặc cập nhật các biến
    for (const [key, value] of Object.entries(config)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    }

    // Xóa dòng trống thừa
    envContent = envContent.replace(/\n{3,}/g, '\n\n').trim();

    fs.writeFileSync(envPath, envContent);
    log(`\n✅ Đã cập nhật file .env`, 'green');
}

async function main() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║          SETUP HELPER - Cấu hình tự động                   ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    // Kiểm tra cấu hình hiện tại
    const status = await checkCurrentConfig();

    if (!status) {
        log('\n⚠️  File .env chưa tồn tại. Tạo file .env trước.', 'yellow');
        log('💡 Copy từ .env.example hoặc tạo mới', 'yellow');
        rl.close();
        return;
    }

    const { emailConfigured, googleConfigured } = status;

    // Setup Email nếu chưa có
    if (!emailConfigured) {
        log('\n📧 Email chưa được cấu hình. Cần setup để password reset hoạt động.', 'yellow');
        const emailConfig = await setupEmail();
        if (emailConfig) {
            updateEnvFile(emailConfig);
        }
    } else {
        log('\n✅ Email đã được cấu hình', 'green');
    }

    // Setup Google OAuth nếu chưa có
    if (!googleConfigured) {
        const googleConfig = await setupGoogleOAuth();
        if (googleConfig) {
            updateEnvFile(googleConfig);
        }
    } else {
        log('\n✅ Google OAuth đã được cấu hình', 'green');
    }

    logSection('✅ HOÀN THÀNH');

    log('📝 Các bước tiếp theo:', 'cyan');
    log('1. Kiểm tra lại: npm run test:connections', 'green');
    log('2. Restart server nếu đang chạy', 'green');
    log('3. Test password reset để đảm bảo email hoạt động', 'green');

    console.log('\n');
    rl.close();
}

if (require.main === module) {
    main().catch(error => {
        log(`\n❌ Lỗi: ${error.message}`, 'red');
        console.error(error);
        rl.close();
        process.exit(1);
    });
}

module.exports = { checkCurrentConfig, setupEmail, setupGoogleOAuth };
