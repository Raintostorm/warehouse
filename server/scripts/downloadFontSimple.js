/**
 * Script đơn giản để tải font Noto Sans từ Google Fonts
 * Sử dụng wget hoặc curl nếu có, hoặc hướng dẫn download thủ công
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const fontsDir = path.join(__dirname, '..', 'fonts');

// Tạo thư mục fonts nếu chưa có
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
    console.log('✅ Created fonts directory');
}

// URLs trực tiếp từ Google Fonts CDN
const fonts = [
    {
        name: 'NotoSans-Regular.ttf',
        url: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff2',
        // Fallback: TTF từ GitHub releases
        altUrl: 'https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf'
    },
    {
        name: 'NotoSans-Bold.ttf',
        url: 'https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFlY9aA.woff2',
        altUrl: 'https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf'
    }
];

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filepath);
                return downloadFile(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                reject(new Error(`HTTP ${response.statusCode}`));
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

async function main() {
    console.log('📥 Downloading Noto Sans fonts for Vietnamese support...\n');

    for (const font of fonts) {
        const filepath = path.join(fontsDir, font.name);

        if (fs.existsSync(filepath)) {
            console.log(`⏭️  ${font.name} already exists, skipping...`);
            continue;
        }

        try {
            console.log(`⬇️  Downloading ${font.name}...`);
            let downloaded = false;

            // Thử URL chính
            try {
                await downloadFile(font.url, filepath);
                downloaded = true;
            } catch (firstError) {
                // Thử URL alternative nếu có
                if (font.altUrl) {
                    console.log(`   Retrying with alternative URL...`);
                    try {
                        await downloadFile(font.altUrl, filepath);
                        downloaded = true;
                    } catch (secondError) {
                        throw new Error(`Both URLs failed: ${firstError.message}, ${secondError.message}`);
                    }
                } else {
                    throw firstError;
                }
            }

            // Verify file was downloaded
            if (downloaded) {
                const stats = fs.statSync(filepath);
                if (stats.size > 0) {
                    console.log(`✅ Downloaded ${font.name} (${(stats.size / 1024).toFixed(2)} KB)\n`);
                } else {
                    throw new Error('File is empty');
                }
            }
        } catch (error) {
            console.error(`❌ Failed to download ${font.name}:`, error.message);
            console.log(`\n💡 Manual download instructions:`);
            console.log(`   1. Visit: https://fonts.google.com/noto/specimen/Noto+Sans`);
            console.log(`   2. Click "Download family" button`);
            console.log(`   3. Extract the ZIP file`);
            console.log(`   4. Copy ${font.name} to: ${filepath}\n`);
        }
    }

    // Check if fonts are available
    const regularPath = path.join(fontsDir, 'NotoSans-Regular.ttf');
    const boldPath = path.join(fontsDir, 'NotoSans-Bold.ttf');

    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
        console.log('✨ All fonts downloaded successfully!');
        console.log(`📁 Fonts location: ${fontsDir}`);
        console.log('\n✅ Bill generation will now support Vietnamese characters!\n');
    } else {
        console.log('\n⚠️  Warning: Some fonts are missing. Bill generation will use Helvetica (may have encoding issues).\n');
    }
}

main().catch(console.error);
