const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs'); // VNPay uses 'qs' package, not built-in 'querystring'
const moment = require('moment'); // VNPay demo uses moment for date formatting
const logger = require('../utils/logger');

/**
 * VNPay sortObject function (EXACT COPY from run test/server.js - WORKING VERSION)
 * This function MUST be used for both payment creation and verification
 * DO NOT MODIFY - This is the exact working implementation
 * 
 * IMPORTANT: obj[str[key]] works because VNPay keys don't have special chars,
 * so encodeURIComponent doesn't change them (vnp_Amount stays vnp_Amount)
 * Therefore, we can access obj[str[key]] directly without decoding
 */
function vnpaySortObject(obj) {
    let sorted = {};
    let str = Object.keys(obj).map(key => encodeURIComponent(key));
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// Payment Gateway Service - Sandbox Mode Only
const PaymentGatewayS = {
    // VNPay Sandbox Configuration - EXACT COPY from run test/server.js
    // Support both VNP_* (run test format) and VNPAY_* (current format) for compatibility
    vnpay: {
        sandbox: {
            url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            tmnCode: process.env.VNP_TMN_CODE || process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
            secretKey: process.env.VNP_HASH_SECRET || process.env.VNPAY_SECRET_KEY || 'YOUR_SECRET_KEY',
            returnUrl: process.env.VNP_RETURN_URL || process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/success',
            ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/payments/gateway/vnpay/ipn'
        }
    },

    // MoMo Sandbox Configuration
    momo: {
        sandbox: {
            url: 'https://test-payment.momo.vn/v2/gateway/api/create',
            partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER_CODE',
            accessKey: process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY',
            secretKey: process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY',
            returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:5173/payment/callback/momo',
            notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/api/payments/gateway/momo/ipn'
        }
    },

    // ZaloPay Sandbox Configuration
    zalopay: {
        sandbox: {
            url: 'https://sb-openapi.zalopay.vn/v2/create',
            appId: process.env.ZALOPAY_APP_ID || 'YOUR_APP_ID',
            key1: process.env.ZALOPAY_KEY1 || 'YOUR_KEY1',
            key2: process.env.ZALOPAY_KEY2 || 'YOUR_KEY2',
            returnUrl: process.env.ZALOPAY_RETURN_URL || 'http://localhost:5173/payment/callback/zalopay',
            callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:3000/api/payments/gateway/zalopay/ipn'
        }
    },

    /**
     * Initiate VNPay payment
     * @param {string} orderId - Order ID
     * @param {number} amount - Amount in VND
     * @param {string} orderInfo - Order information
     * @param {string} clientIp - Client IP address (optional, will use 127.0.0.1 if not provided)
     * @returns {Promise<Object>} Payment URL and transaction reference
     */
    initiateVNPay: async (orderId, amount, orderInfo = '', clientIp = null) => {
        try {
            const config = PaymentGatewayS.vnpay.sandbox;

            // Validate required config
            if (!config.tmnCode || config.tmnCode === 'YOUR_TMN_CODE' || config.tmnCode.trim() === '') {
                throw new Error('VNPay TMN Code is not configured');
            }
            if (!config.secretKey || config.secretKey === 'YOUR_SECRET_KEY' || config.secretKey.trim() === '') {
                throw new Error('VNPay Secret Key is not configured');
            }

            // EXACT COPY from run test/server.js lines 22-51 - chỉ thay số tiền từ parameter
            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const txnRef = moment(date).format('DDHHmmss'); // EXACT format from run test

            // EXACT COPY from run test/server.js lines 27-40 - chỉ thay số tiền
            // Note: In run test, orderId = txnRef (both are DDHHmmss format)
            // But we receive orderId from frontend (e.g., ORD013), so we use txnRef for VNPay
            let vnp_Params = {
                'vnp_Version': '2.1.0',
                'vnp_Command': 'pay',
                'vnp_TmnCode': config.tmnCode, // BỎ .trim() - EXACT như run test
                'vnp_Locale': 'vn',
                'vnp_CurrCode': 'VND',
                'vnp_TxnRef': txnRef,
                'vnp_OrderInfo': 'Thanh toan don hang:' + txnRef, // LUÔN dùng format này với dấu ':' - EXACT như run test
                'vnp_OrderType': 'other',
                'vnp_Amount': amount * 100, // BỎ Math.round() - EXACT như run test
                'vnp_ReturnUrl': config.returnUrl,
                'vnp_IpAddr': '127.0.0.1',
                'vnp_CreateDate': createDate
            };

            // EXACT COPY from run test/server.js line 42
            vnp_Params = vnpaySortObject(vnp_Params);

            // EXACT COPY from run test/server.js line 44
            const signData = qs.stringify(vnp_Params, { encode: false });

            // EXACT COPY from run test/server.js lines 45-46
            const hmac = crypto.createHmac("sha512", config.secretKey); // BỎ .trim() - EXACT như run test
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            // EXACT COPY from run test/server.js line 48
            vnp_Params['vnp_SecureHash'] = signed;

            // EXACT COPY from run test/server.js line 49
            const finalUrl = config.url + '?' + qs.stringify(vnp_Params, { encode: false });

            logger.info('VNPay payment URL generated', {
                txnRef,
                orderId, // Original orderId from frontend
                amount,
                note: 'txnRef will be used in callback, not orderId'
            });

            return {
                success: true,
                paymentUrl: finalUrl,
                txnRef, // This is what VNPay will return in callback
                originalOrderId: orderId, // Keep original orderId for reference
                gateway: 'vnpay',
                sandbox: true
            };
        } catch (error) {
            logger.error('VNPay payment initiation failed', {
                error: error.message,
                stack: error.stack,
                orderId,
                amount
            });
            throw new Error('Failed to initiate VNPay payment: ' + error.message);
        }
    },

    /**
     * Verify VNPay callback/IPN
     * @param {Object} queryParams - Query parameters from VNPay callback
     * @returns {Object} Verification result with payment details
     */
    verifyVNPayCallback: (queryParams) => {
        try {
            const config = PaymentGatewayS.vnpay.sandbox;

            // EXACT COPY from run test/server.js lines 55-66
            let vnp_Params = queryParams;
            const secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = vnpaySortObject(vnp_Params);

            const signData = qs.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", config.secretKey); // BỎ .trim() - EXACT như run test
            const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            // EXACT COPY from run test/server.js line 68
            const isValid = secureHash === checkHash;
            const responseCode = vnp_Params['vnp_ResponseCode'] || '';

            // Extract orderId from txnRef (format: DDHHmmss from run test)
            // In run test, txnRef = orderId (both are DDHHmmss)
            // In our case, txnRef is DDHHmmss, but we need to map it back to original orderId
            // For now, use txnRef as orderId (will be handled in controller)
            let orderId = queryParams.vnp_TxnRef || null;

            // EXACT COPY from run test/server.js line 69
            const success = isValid && responseCode === '00';
            
            // Debug logging - ALWAYS log in development
            logger.info('VNPay callback verification details', {
                isValid,
                success,
                secureHash: secureHash ? secureHash.substring(0, 32) + '...' : 'MISSING',
                checkHash: checkHash ? checkHash.substring(0, 32) + '...' : 'MISSING',
                hashMatch: secureHash === checkHash,
                responseCode,
                txnRef: queryParams.vnp_TxnRef,
                signData: signData, // Full signData for debugging
                secretKeyPreview: config.secretKey ? `${config.secretKey.substring(0, 4)}...${config.secretKey.substring(config.secretKey.length - 4)}` : 'MISSING',
                sortedParams: JSON.stringify(vnp_Params, null, 2)
            });

            // Get response message
            let message = 'Giao dịch thất bại';
            if (!isValid) {
                message = 'Chữ ký không hợp lệ';
            } else if (responseCode === '00') {
                message = 'Giao dịch thành công';
            } else {
                // Map common VNPay response codes
                const responseMessages = {
                    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
                    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
                    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
                    '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
                    '12': 'Thẻ/Tài khoản bị khóa.',
                    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
                    '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
                    '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
                    '75': 'Ngân hàng thanh toán đang bảo trì.',
                    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định. Xin vui lòng thực hiện lại giao dịch.'
                };
                message = responseMessages[responseCode] || `Giao dịch thất bại (Mã lỗi: ${responseCode})`;
            }

            const result = {
                isValid,
                success,
                txnRef: queryParams.vnp_TxnRef || '',
                orderId: orderId,
                amount: queryParams.vnp_Amount ? parseFloat(queryParams.vnp_Amount) / 100 : 0,
                transactionId: queryParams.vnp_TransactionNo || '',
                responseCode,
                message,
                bankCode: queryParams.vnp_BankCode || '',
                cardType: queryParams.vnp_CardType || '',
                payDate: queryParams.vnp_PayDate || ''
            };

            logger.info('VNPay callback verified', {
                isValid,
                success,
                txnRef: result.txnRef,
                orderId: result.orderId,
                responseCode
            });

            return result;
        } catch (error) {
            logger.error('VNPay callback verification failed', {
                error: error.message,
                stack: error.stack,
                queryParams: Object.keys(queryParams)
            });
            return {
                isValid: false,
                success: false,
                message: 'Verification failed: ' + error.message
            };
        }
    },

    /**
     * Initiate MoMo payment
     */
    initiateMoMo: async (orderId, amount, orderInfo = '') => {
        try {
            const config = PaymentGatewayS.momo.sandbox;
            const requestId = `MOMO${Date.now()}_${orderId}`;
            const orderIdFormatted = orderId.toString();

            const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=&ipnUrl=${config.notifyUrl}&orderId=${orderIdFormatted}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.returnUrl}&requestId=${requestId}&requestType=captureWallet`;

            const signature = crypto
                .createHmac('sha256', config.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: config.partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId: requestId,
                amount: amount,
                orderId: orderIdFormatted,
                orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
                redirectUrl: config.returnUrl,
                ipnUrl: config.notifyUrl,
                lang: 'vi',
                autoCapture: true,
                extraData: '',
                requestType: 'captureWallet',
                signature: signature
            };

            // In sandbox mode, return a mock payment URL
            // In production, you would make actual API call to MoMo
            const paymentUrl = `${config.returnUrl}?orderId=${orderIdFormatted}&requestId=${requestId}&resultCode=0&amount=${amount}`;

            return {
                success: true,
                paymentUrl,
                requestId,
                gateway: 'momo',
                sandbox: true,
                // In real implementation, you would get this from MoMo API response
                payUrl: paymentUrl
            };
        } catch (error) {
            logger.error('MoMo payment initiation failed', { error: error.message });
            throw new Error('Failed to initiate MoMo payment: ' + error.message);
        }
    },

    /**
     * Verify MoMo callback
     */
    verifyMoMoCallback: (queryParams) => {
        try {
            const config = PaymentGatewayS.momo.sandbox;
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature
            } = queryParams;

            // Verify signature
            const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

            const calculatedSignature = crypto
                .createHmac('sha256', config.secretKey)
                .update(rawSignature)
                .digest('hex');

            const isValid = calculatedSignature === signature;
            const success = isValid && resultCode === 0;

            return {
                isValid,
                success,
                orderId,
                requestId,
                amount: parseFloat(amount),
                transactionId: transId,
                resultCode,
                message: message || (success ? 'Giao dịch thành công' : 'Giao dịch thất bại')
            };
        } catch (error) {
            logger.error('MoMo callback verification failed', { error: error.message });
            return { isValid: false, success: false, message: 'Verification failed' };
        }
    },

    /**
     * Initiate ZaloPay payment
     */
    initiateZaloPay: async (orderId, amount, orderInfo = '') => {
        try {
            const config = PaymentGatewayS.zalopay.sandbox;
            const appTransId = `${Date.now()}_${orderId}`;

            const embedData = JSON.stringify({
                redirecturl: config.returnUrl
            });

            const items = [{
                itemid: orderId,
                itemname: orderInfo || `Don hang ${orderId}`,
                itemprice: amount,
                itemquantity: 1
            }];

            const order = {
                app_id: config.appId,
                app_user: 'ZaloPayDemo',
                app_time: Date.now(),
                amount: amount,
                app_trans_id: appTransId,
                embed_data: embedData,
                item: JSON.stringify(items),
                description: orderInfo || `Thanh toan don hang ${orderId}`,
                bank_code: '',
                callback_url: config.callbackUrl
            };

            // Create mac (message authentication code)
            const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
            const mac = crypto
                .createHmac('sha256', config.key1)
                .update(data)
                .digest('hex');

            order.mac = mac;

            // In sandbox mode, return mock payment URL
            // In production, you would call ZaloPay API
            const paymentUrl = `${config.returnUrl}?app_trans_id=${appTransId}&amount=${amount}&status=1`;

            return {
                success: true,
                paymentUrl,
                appTransId,
                gateway: 'zalopay',
                sandbox: true,
                orderUrl: paymentUrl
            };
        } catch (error) {
            logger.error('ZaloPay payment initiation failed', { error: error.message });
            throw new Error('Failed to initiate ZaloPay payment: ' + error.message);
        }
    },

    /**
     * Verify ZaloPay callback
     */
    verifyZaloPayCallback: (data) => {
        try {
            const config = PaymentGatewayS.zalopay.sandbox;
            const {
                app_id,
                app_trans_id,
                app_time,
                amount,
                app_user,
                zp_trans_id,
                server_time,
                channel,
                merchant_user_id,
                user_fee_amount,
                discount_amount,
                status,
                mac
            } = data;

            // Verify mac
            const dataToVerify = `${app_id}|${zp_trans_id}|${amount}|${app_trans_id}|${status}|${app_time}`;
            const calculatedMac = crypto
                .createHmac('sha256', config.key2)
                .update(dataToVerify)
                .digest('hex');

            const isValid = calculatedMac === mac;
            const success = isValid && status === 1;

            return {
                isValid,
                success,
                appTransId: app_trans_id,
                amount: parseFloat(amount),
                transactionId: zp_trans_id,
                status,
                message: success ? 'Giao dịch thành công' : 'Giao dịch thất bại'
            };
        } catch (error) {
            logger.error('ZaloPay callback verification failed', { error: error.message });
            return { isValid: false, success: false, message: 'Verification failed' };
        }
    },

    /**
     * Get gateway configuration (sandbox mode)
     */
    getGatewayConfig: (gateway) => {
        const gateways = {
            vnpay: PaymentGatewayS.vnpay.sandbox,
            momo: PaymentGatewayS.momo.sandbox,
            zalopay: PaymentGatewayS.zalopay.sandbox
        };

        return gateways[gateway] || null;
    },

    /**
     * Check if gateway is enabled
     */
    isGatewayEnabled: (gateway) => {
        const config = PaymentGatewayS.getGatewayConfig(gateway);
        if (!config) return false;

        // Check if required credentials are set (not default values)
        switch (gateway) {
            case 'vnpay':
                return config.tmnCode !== 'YOUR_TMN_CODE' && config.secretKey !== 'YOUR_SECRET_KEY';
            case 'momo':
                return config.partnerCode !== 'MOMO_PARTNER_CODE' && config.secretKey !== 'MOMO_SECRET_KEY';
            case 'zalopay':
                return config.appId !== 'YOUR_APP_ID' && config.key1 !== 'YOUR_KEY1';
            default:
                return false;
        }
    }
};

module.exports = PaymentGatewayS;
