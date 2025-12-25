/**
 * Script để tải font Noto Sans hỗ trợ tiếng Việt
 * Font này sẽ được dùng cho PDF generation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'fonts');

// Tạo thư mục fonts nếu chưa có
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
    console.log('✅ Created fonts directory');
}

// URLs của font Noto Sans từ Google Fonts
// Sử dụng Google Fonts API để tải font
const fonts = {
    regular: {
        url: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff2',
        filename: 'NotoSans-Regular.ttf',
        // Alternative: Direct download từ GitHub
        altUrl: 'https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf'
    },
    bold: {
        url: 'https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFlY9aA.woff2',
        filename: 'NotoSans-Bold.ttf',
        altUrl: 'https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf'
    }
};

function downloadFont(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                return downloadFont(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            reject(err);
        });
    });
}

async function downloadFonts() {
    console.log('📥 Downloading Noto Sans fonts...\n');

    for (const [type, font] of Object.entries(fonts)) {
        const filepath = path.join(fontsDir, font.filename);

        // Skip nếu đã có
        if (fs.existsSync(filepath)) {
            console.log(`⏭️  ${font.filename} already exists, skipping...`);
            continue;
        }

        try {
            console.log(`⬇️  Downloading ${font.filename}...`);
            try {
                await downloadFont(font.url, filepath);
                console.log(`✅ Downloaded ${font.filename}\n`);
            } catch (firstError) {
                // Thử URL alternative nếu có
                if (font.altUrl) {
                    console.log(`   Retrying with alternative URL...`);
                    await downloadFont(font.altUrl, filepath);
                    console.log(`✅ Downloaded ${font.filename} (from alternative URL)\n`);
                } else {
                    throw firstError;
                }
            }
        } catch (error) {
            console.error(`❌ Failed to download ${font.filename}:`, error.message);
            console.log(`\n💡 Please download manually:`);
            console.log(`   1. Go to: https://fonts.google.com/noto/specimen/Noto+Sans`);
            console.log(`   2. Click "Download family"`);
            console.log(`   3. Extract and copy NotoSans-Regular.ttf and NotoSans-Bold.ttf`);
            console.log(`   4. Save to: ${filepath}\n`);
        }
    }

    console.log('✨ Font download complete!');
    console.log(`📁 Fonts location: ${fontsDir}`);
}

// Chạy script
downloadFonts().catch(console.error);
