const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

/**
 * Get OAuth2 access token using refresh token
 */
async function getAccessToken() {
    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
        throw new Error('OAuth2 configuration is missing. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in .env');
    }

    const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: GMAIL_REFRESH_TOKEN
    });

    const { token } = await oauth2Client.getAccessToken();
    return token;
}

/**
 * Send email using Gmail API directly (more reliable than SMTP)
 */
async function sendEmailViaGmailAPI(to, subject, html, text) {
    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN,
        GMAIL_USER
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
        throw new Error('OAuth2 configuration is missing');
    }

    const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: GMAIL_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const email = GMAIL_USER || process.env.SMTP_USER;

    // Create email message
    const message = [
        `From: ${email}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        html || text
    ].join('\n');

    // Encode message
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });

    return response.data;
}

/**
 * Create a reusable transporter using environment variables.
 * Supports Gmail SMTP with OAuth2 or App Password, or any other SMTP provider.
 */
async function createTransporter() {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        SMTP_SECURE,
        SMTP_FROM,
        USE_OAUTH2,
        GMAIL_USER,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN
    } = process.env;

    const useOAuth2 = USE_OAUTH2 === 'true';
    const email = GMAIL_USER || SMTP_USER;

    if (useOAuth2) {
        // Use OAuth2 for Gmail
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
            throw new Error('OAuth2 configuration is missing. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN in .env');
        }

        // Create OAuth2 client for token generation
        const oauth2Client = new OAuth2Client(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            refresh_token: GMAIL_REFRESH_TOKEN
        });

        // Get initial access token
        const { token: accessToken } = await oauth2Client.getAccessToken();

        // Create OAuth2 transporter using SMTP with OAuth2
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: email,
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                refreshToken: GMAIL_REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        return { transporter, from: SMTP_FROM || email };
    } else {
        // Use App Password or regular SMTP
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
            throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
        }

        const secure = SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465;

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        return { transporter, from: SMTP_FROM || SMTP_USER };
    }
}

/**
 * Send a password reset email with the given link.
 * @param {string} to - Recipient email
 * @param {string} resetLink - Full URL to reset password page
 */
async function sendPasswordResetEmail(to, resetLink) {
    const useOAuth2 = process.env.USE_OAUTH2 === 'true';

    const subject = 'Đặt lại mật khẩu - MyWarehouse';
    const html = `
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản MyWarehouse.</p>
        <p>Vui lòng bấm vào link bên dưới để đặt mật khẩu mới (link có hiệu lực trong 15 phút):</p>
        <p><a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a></p>
        <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.</p>
        <p>Trân trọng,<br/>Hệ thống MyWarehouse</p>
    `;

    try {
        // Try Gmail API first if OAuth2
        if (useOAuth2) {
            try {
                await sendEmailViaGmailAPI(to, subject, html, '');
                return;
            } catch (gmailApiError) {
                console.error('Gmail API failed, falling back to SMTP:', gmailApiError.message);
                // Fall through to SMTP
            }
        }

        // Use SMTP (OAuth2 or App Password)
        const { transporter, from } = await createTransporter();
        await transporter.sendMail({
            from,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

/**
 * Send welcome email to new user
 * @param {string} to - Recipient email
 * @param {string} fullname - User's full name
 */
async function sendWelcomeEmail(to, fullname) {
    const subject = 'Chào mừng đến với MyWarehouse!';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Chào mừng ${fullname}!</h2>
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>MyWarehouse</strong>!</p>
            <p>Tài khoản của bạn đã được tạo thành công. Bạn có thể bắt đầu sử dụng hệ thống ngay bây giờ.</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br/><strong>Đội ngũ MyWarehouse</strong></p>
        </div>
    `;

    try {
        const { transporter, from } = await createTransporter();
        await transporter.sendMail({
            from,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error('Welcome email sending failed:', error);
        throw error;
    }
}

/**
 * Send low stock alert email to admins
 * @param {string|string[]} to - Recipient email(s) - can be single email or array
 * @param {Object} productData - Product information
 */
async function sendLowStockAlertEmail(to, productData) {
    const subject = `⚠️ Cảnh báo: ${productData.productName} sắp hết hàng`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Cảnh báo: Sản phẩm sắp hết hàng</h2>
            <p>Xin chào,</p>
            <p>Hệ thống phát hiện sản phẩm <strong>${productData.productName}</strong> đang sắp hết hàng:</p>
            <ul>
                <li><strong>Sản phẩm:</strong> ${productData.productName}</li>
                <li><strong>Mã sản phẩm:</strong> ${productData.productId}</li>
                <li><strong>Tồn kho hiện tại:</strong> ${productData.currentStock}</li>
                <li><strong>Ngưỡng cảnh báo:</strong> ${productData.threshold}</li>
            </ul>
            <p style="color: #dc2626;"><strong>Vui lòng kiểm tra và nhập hàng sớm!</strong></p>
            <p>Trân trọng,<br/><strong>Hệ thống MyWarehouse</strong></p>
        </div>
    `;

    try {
        const { transporter, from } = await createTransporter();
        const recipients = Array.isArray(to) ? to : [to];

        await transporter.sendMail({
            from,
            to: recipients.join(', '),
            subject,
            html
        });
    } catch (error) {
        console.error('Low stock alert email sending failed:', error);
        throw error;
    }
}

/**
 * Send new order notification email to admins
 * @param {string|string[]} to - Recipient email(s)
 * @param {Object} orderData - Order information
 */
async function sendNewOrderEmail(to, orderData) {
    const subject = `📦 Đơn hàng mới #${orderData.orderId}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">📦 Đơn hàng mới</h2>
            <p>Xin chào,</p>
            <p>Bạn có một đơn hàng mới cần xử lý:</p>
            <ul>
                <li><strong>Mã đơn hàng:</strong> #${orderData.orderId}</li>
                <li><strong>Loại đơn:</strong> ${orderData.orderType || 'N/A'}</li>
                <li><strong>Khách hàng:</strong> ${orderData.customerName || 'N/A'}</li>
                <li><strong>Tổng tiền:</strong> ${orderData.total ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.total) : 'N/A'}</li>
                <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
            </ul>
            <p>Vui lòng đăng nhập vào hệ thống để xử lý đơn hàng.</p>
            <p>Trân trọng,<br/><strong>Hệ thống MyWarehouse</strong></p>
        </div>
    `;

    try {
        const { transporter, from } = await createTransporter();
        const recipients = Array.isArray(to) ? to : [to];

        await transporter.sendMail({
            from,
            to: recipients.join(', '),
            subject,
            html
        });
    } catch (error) {
        console.error('New order email sending failed:', error);
        throw error;
    }
}

/**
 * Generic email sender
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content (optional)
 */
async function sendEmail(to, subject, html, text = '') {
    try {
        const useOAuth2 = process.env.USE_OAUTH2 === 'true';

        if (useOAuth2) {
            try {
                await sendEmailViaGmailAPI(to, subject, html, text);
                return;
            } catch (gmailApiError) {
                console.error('Gmail API failed, falling back to SMTP:', gmailApiError.message);
            }
        }

        const { transporter, from } = await createTransporter();
        const recipients = Array.isArray(to) ? to : [to];

        await transporter.sendMail({
            from,
            to: recipients.join(', '),
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML if no text provided
        });
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

/**
 * Send video call invitation email
 * @param {string} to - Recipient email
 * @param {string} callerName - Name of person calling
 * @param {string} callLink - Link to join the video call
 */
async function sendVideoCallInvitationEmail(to, callerName, callLink) {
    const subject = `📹 Video Call Invitation từ ${callerName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📹 Video Call Invitation</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">Xin chào,</p>
                <p style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">
                    <strong>${callerName}</strong> đang mời bạn tham gia một cuộc gọi video.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${callLink}" 
                       style="display: inline-block; 
                              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                              color: white; 
                              padding: 16px 32px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: 600; 
                              font-size: 16px;
                              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                        📹 Tham gia Video Call
                    </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    Hoặc copy link sau vào trình duyệt:<br/>
                    <a href="${callLink}" style="color: #2563eb; word-break: break-all;">${callLink}</a>
                </p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                    Link này sẽ hết hạn sau khi cuộc gọi kết thúc.
                </p>
            </div>
        </div>
    `;
    const text = `${callerName} đang mời bạn tham gia video call. Link: ${callLink}`;

    try {
        await sendEmail(to, subject, html, text);
    } catch (error) {
        console.error('Video call invitation email sending failed:', error);
        throw error;
    }
}

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendLowStockAlertEmail,
    sendNewOrderEmail,
    sendEmail,
    sendVideoCallInvitationEmail,
    createTransporter,
    sendEmailViaGmailAPI
};
