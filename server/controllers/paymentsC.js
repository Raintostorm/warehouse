const PaymentsS = require('../services/paymentsS');
const PaymentGatewayS = require('../services/paymentGatewayS');
const PaymentsM = require('../models/paymentsM');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const PaymentsC = {
    getAllPayments: async (req, res) => {
        try {
            const payments = await PaymentsS.getAllPayments();
            return sendSuccess(res, payments, 'Payments fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch payments');
        }
    },

    getPaymentById: async (req, res) => {
        try {
            const payment = await PaymentsS.getPaymentById(req.params.id);
            return sendSuccess(res, payment, 'Payment fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch payment');
        }
    },

    getPaymentsByOrderId: async (req, res) => {
        try {
            const payments = await PaymentsS.getPaymentsByOrderId(req.params.orderId);
            return sendSuccess(res, payments, 'Payments fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch payments');
        }
    },

    getOrderPaymentSummary: async (req, res) => {
        try {
            const summary = await PaymentsS.getOrderPaymentSummary(req.params.orderId);
            return sendSuccess(res, summary, 'Payment summary fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch payment summary');
        }
    },

    getUnpaidSaleOrders: async (req, res) => {
        try {
            const orders = await PaymentsS.getUnpaidSaleOrders();
            return sendSuccess(res, orders, 'Unpaid sale orders fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch unpaid sale orders');
        }
    },

    createPayment: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const paymentData = {
                ...req.body,
                actor: actorInfo
            };
            const payment = await PaymentsS.createPayment(paymentData);

            // Log audit
            await auditLogger({
                tableName: 'payments',
                recordId: payment.id,
                action: 'CREATE',
                actor: actorInfo,
                newData: payment,
                req
            });

            return sendSuccess(res, payment, 'Payment created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create payment');
        }
    },

    updatePayment: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldPayment = await PaymentsS.getPaymentById(req.params.id);
            const payment = await PaymentsS.updatePayment(req.params.id, req.body);

            // Log audit
            await auditLogger({
                tableName: 'payments',
                recordId: payment.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldPayment,
                newData: payment,
                req
            });

            return sendSuccess(res, payment, 'Payment updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update payment');
        }
    },

    deletePayment: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldPayment = await PaymentsS.getPaymentById(req.params.id);
            const payment = await PaymentsS.deletePayment(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'payments',
                recordId: payment.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldPayment,
                req
            });

            return sendSuccess(res, payment, 'Payment deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete payment');
        }
    },

    // Payment Gateway Methods
    initiateGatewayPayment: async (req, res) => {
        try {
            const { orderId, amount, gateway, orderInfo } = req.body;

            if (!orderId || !amount || !gateway) {
                return sendError(res, new Error('Missing required fields: orderId, amount, gateway'), 'Validation failed', 400);
            }

            // Validate amount
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                return sendError(res, new Error('Invalid amount. Amount must be a positive number'), 'Validation failed', 400);
            }

            const validGateways = ['vnpay', 'momo', 'zalopay'];
            if (!validGateways.includes(gateway)) {
                return sendError(res, new Error('Invalid gateway. Supported: vnpay, momo, zalopay'), 'Invalid gateway', 400);
            }

            // Check if gateway is enabled
            if (!PaymentGatewayS.isGatewayEnabled(gateway)) {
                return sendError(res, new Error(`Gateway ${gateway} is not configured. Please set up sandbox credentials.`), 'Gateway not configured', 400);
            }

            // Get client IP address
            const clientIp = req.ip ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.connection?.remoteAddress ||
                '127.0.0.1';

            let result;
            switch (gateway) {
                case 'vnpay':
                    result = await PaymentGatewayS.initiateVNPay(orderId, amountNum, orderInfo, clientIp);
                    break;
                case 'momo':
                    result = await PaymentGatewayS.initiateMoMo(orderId, amountNum, orderInfo);
                    break;
                case 'zalopay':
                    result = await PaymentGatewayS.initiateZaloPay(orderId, amountNum, orderInfo);
                    break;
            }

            return sendSuccess(res, result, `Payment initiated via ${gateway} (sandbox mode)`);
        } catch (error) {
            return sendError(res, error, 'Failed to initiate gateway payment');
        }
    },

    handleVNPayCallback: async (req, res) => {
        let verification = null;
        try {
            logger.info('VNPay callback received', { 
                query: Object.keys(req.query),
                txnRef: req.query.vnp_TxnRef,
                responseCode: req.query.vnp_ResponseCode
            });

            verification = PaymentGatewayS.verifyVNPayCallback(req.query);

            logger.info('VNPay callback verification result', {
                isValid: verification.isValid,
                success: verification.success,
                txnRef: verification.txnRef,
                orderId: verification.orderId,
                responseCode: verification.responseCode,
                message: verification.message
            });

            if (verification.isValid && verification.success) {
                // Check if payment already exists (avoid duplicates)
                // Try to find by transactionId first (more reliable)
                let payment;
                try {
                    // First, try to find by transactionId (if exists)
                    if (verification.transactionId) {
                        const allPayments = await PaymentsS.getAllPayments();
                        payment = allPayments.find(p =>
                            p.transaction_id === verification.transactionId &&
                            p.payment_method === 'vnpay'
                        );
                    }
                    
                    // If not found, try by orderId
                    if (!payment && verification.orderId) {
                        const existingPayments = await PaymentsS.getPaymentsByOrderId(verification.orderId);
                        payment = existingPayments.find(p =>
                            p.transaction_id === verification.transactionId &&
                            p.payment_method === 'vnpay'
                        );
                    }
                } catch (err) {
                    logger.warn('Could not check existing payments', { error: err.message });
                }

                if (!payment) {
                    // Create payment record
                    // Use txnRef as orderId if orderId is not available or is just txnRef format
                    const orderIdToUse = verification.orderId || verification.txnRef;
                    const actorInfo = getActor(req);
                    
                    // Validate amount
                    const amount = verification.amount && verification.amount > 0 
                        ? verification.amount 
                        : (req.query.vnp_Amount ? parseFloat(req.query.vnp_Amount) / 100 : 0);
                    
                    if (!amount || amount <= 0) {
                        throw new Error(`Invalid payment amount: ${verification.amount || req.query.vnp_Amount}`);
                    }
                    
                    // Check if order exists, if not create a temporary order for gateway payment
                    const OrdersM = require('../models/ordersM');
                    let order = await OrdersM.findById(orderIdToUse);
                    
                    if (!order) {
                        // Create a temporary order for gateway payment
                        logger.info('Order not found, creating temporary order for gateway payment', { orderId: orderIdToUse });
                        try {
                            order = await OrdersM.create({
                                id: orderIdToUse,
                                type: 'gateway_payment',
                                date: new Date().toISOString().split('T')[0],
                                customer_name: `VNPay Payment - ${verification.txnRef}`,
                                total: amount,
                                user_id: req.user?.id || req.user?.Id || null,
                                actor: actorInfo
                            });
                            logger.info('Temporary order created for gateway payment', { orderId: order.id });
                        } catch (orderError) {
                            // If order creation fails (e.g., ID already exists from previous attempt), try to find it again
                            logger.warn('Failed to create temporary order, trying to find existing', { 
                                error: orderError.message,
                                orderId: orderIdToUse 
                            });
                            order = await OrdersM.findById(orderIdToUse);
                            if (!order) {
                                throw new Error(`Failed to create or find order for payment: ${orderError.message}`);
                            }
                        }
                    }
                    
                    const paymentData = {
                        orderId: orderIdToUse,
                        amount: amount,
                        paymentMethod: 'vnpay',
                        paymentStatus: 'completed',
                        transactionId: verification.transactionId,
                        paymentDate: new Date(),
                        notes: `VNPay payment - ${verification.message}${verification.bankCode ? ` (Bank: ${verification.bankCode})` : ''} - TxnRef: ${verification.txnRef}`,
                        actor: actorInfo
                    };

                    logger.info('Creating VNPay payment record', { paymentData });
                    try {
                        // Use createGatewayPayment to skip order validation (order already exists)
                        payment = await PaymentsS.createGatewayPayment(paymentData);

                        // Log audit (non-blocking)
                        auditLogger({
                            tableName: 'payments',
                            recordId: payment.id,
                            action: 'CREATE',
                            actor: actorInfo,
                            newData: payment,
                            req
                        }).catch(err => {
                            logger.warn('Failed to log audit for VNPay payment', { error: err.message });
                        });

                        logger.info('VNPay payment created', {
                            paymentId: payment.id,
                            orderId: verification.orderId,
                            orderIdToUse,
                            transactionId: verification.transactionId,
                            amount: payment.amount
                        });
                    } catch (createError) {
                        logger.error('Failed to create VNPay payment record', {
                            error: createError.message,
                            stack: createError.stack,
                            paymentData
                        });
                        throw createError; // Re-throw to be caught by outer catch
                    }
                } else {
                    logger.info('VNPay payment already exists', {
                        paymentId: payment.id,
                        transactionId: verification.transactionId
                    });
                }

                // Redirect to frontend success page
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                return res.redirect(`${frontendUrl}/payment/success?paymentId=${payment.id}&gateway=vnpay&txnRef=${verification.txnRef}`);
            } else {
                // Redirect to failure page - verification failed or payment not successful
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                // Ensure we always have a message
                let errorMessage = 'Payment failed';
                if (verification && verification.message) {
                    errorMessage = verification.message;
                } else if (!verification.isValid) {
                    errorMessage = 'Chữ ký không hợp lệ';
                } else if (verification.responseCode && verification.responseCode !== '00') {
                    errorMessage = `Giao dịch thất bại (Mã lỗi: ${verification.responseCode})`;
                }
                
                logger.warn('VNPay callback failed', {
                    isValid: verification ? verification.isValid : false,
                    success: verification ? verification.success : false,
                    responseCode: verification ? verification.responseCode : 'UNKNOWN',
                    message: errorMessage,
                    txnRef: verification ? verification.txnRef : req.query.vnp_TxnRef || '',
                    queryParams: Object.keys(req.query),
                    fullQuery: req.query
                });
                
                // Always include message to avoid "Invalid payment callback" error in frontend
                const txnRef = verification ? verification.txnRef : req.query.vnp_TxnRef || '';
                return res.redirect(`${frontendUrl}/payment/failed?gateway=vnpay&message=${encodeURIComponent(errorMessage)}&txnRef=${txnRef}`);
            }
        } catch (error) {
            logger.error('VNPay callback handling failed', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                queryKeys: Object.keys(req.query),
                verification: verification ? {
                    isValid: verification.isValid,
                    success: verification.success,
                    orderId: verification.orderId,
                    txnRef: verification.txnRef,
                    amount: verification.amount
                } : null
            });
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const txnRef = req.query.vnp_TxnRef || '';
            const errorMessage = error.message || 'Internal server error';
            return res.redirect(`${frontendUrl}/payment/failed?gateway=vnpay&message=${encodeURIComponent(errorMessage)}&txnRef=${txnRef}`);
        }
    },

    handleVNPayIPN: async (req, res) => {
        try {
            logger.info('VNPay IPN received', {
                method: req.method,
                query: Object.keys(req.query),
                body: Object.keys(req.body || {})
            });

            // VNPay IPN can be GET or POST, check both
            const params = req.method === 'POST' ? req.body : req.query;
            const verification = PaymentGatewayS.verifyVNPayCallback(params);

            if (verification.isValid && verification.success) {
                // Check if payment already exists
                let payment;
                try {
                    const existingPayments = await PaymentsS.getPaymentsByOrderId(verification.orderId);
                    payment = existingPayments.find(p =>
                        p.transaction_id === verification.transactionId &&
                        p.payment_method === 'vnpay'
                    );

                    if (!payment) {
                        // Create payment record from IPN
                        const orderIdToUse = verification.orderId || verification.txnRef;
                        const actorInfo = getActor(req);
                        
                        // Check if order exists, if not create a temporary order for gateway payment
                        const OrdersM = require('../models/ordersM');
                        let order = await OrdersM.findById(orderIdToUse);
                        
                        if (!order) {
                            // Create a temporary order for gateway payment
                            logger.info('Order not found in IPN, creating temporary order', { orderId: orderIdToUse });
                            try {
                                order = await OrdersM.create({
                                    id: orderIdToUse,
                                    type: 'gateway_payment',
                                    date: new Date().toISOString().split('T')[0],
                                    customer_name: `VNPay Payment - ${verification.txnRef}`,
                                    total: verification.amount,
                                    user_id: req.user?.id || req.user?.Id || null,
                                    actor: actorInfo
                                });
                                logger.info('Temporary order created for IPN payment', { orderId: order.id });
                            } catch (orderError) {
                                // If order creation fails, try to find it again
                                logger.warn('Failed to create temporary order in IPN, trying to find existing', { 
                                    error: orderError.message,
                                    orderId: orderIdToUse 
                                });
                                order = await OrdersM.findById(orderIdToUse);
                                if (!order) {
                                    throw new Error(`Failed to create or find order for IPN payment: ${orderError.message}`);
                                }
                            }
                        }
                        
                        const paymentData = {
                            orderId: orderIdToUse,
                            amount: verification.amount,
                            paymentMethod: 'vnpay',
                            paymentStatus: 'completed',
                            transactionId: verification.transactionId,
                            paymentDate: new Date(),
                            notes: `VNPay IPN - ${verification.message}${verification.bankCode ? ` (Bank: ${verification.bankCode})` : ''} - TxnRef: ${verification.txnRef}`,
                            actor: actorInfo
                        };

                        // Use createGatewayPayment to skip order validation (order already exists)
                        payment = await PaymentsS.createGatewayPayment(paymentData);

                        // Log audit
                        await auditLogger({
                            tableName: 'payments',
                            recordId: payment.id,
                            action: 'CREATE',
                            actor: actorInfo,
                            newData: payment,
                            req
                        });

                        logger.info('VNPay payment created from IPN', {
                            paymentId: payment.id,
                            orderId: verification.orderId,
                            orderIdToUse,
                            transactionId: verification.transactionId,
                            amount: payment.amount
                        });
                    } else {
                        logger.info('VNPay payment already exists (IPN)', {
                            paymentId: payment.id,
                            transactionId: verification.transactionId
                        });
                    }
                } catch (dbError) {
                    logger.error('Failed to create/update payment from IPN', {
                        error: dbError.message,
                        orderId: verification.orderId
                    });
                    // Still return success to VNPay to avoid retries
                }

                // Always return success to VNPay (format: RspCode='00' means success)
                return res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
                logger.warn('VNPay IPN verification failed', {
                    isValid: verification.isValid,
                    responseCode: verification.responseCode,
                    message: verification.message
                });
                // Return fail code to VNPay
                return res.status(200).json({ RspCode: '99', Message: verification.message || 'Fail' });
            }
        } catch (error) {
            logger.error('VNPay IPN handling failed', {
                error: error.message,
                stack: error.stack
            });
            // Return error code to VNPay
            return res.status(200).json({ RspCode: '99', Message: 'Error' });
        }
    },

    handleMoMoCallback: async (req, res) => {
        try {
            const verification = PaymentGatewayS.verifyMoMoCallback(req.query);

            if (verification.isValid && verification.success) {
                const actorInfo = getActor(req);
                const paymentData = {
                    orderId: verification.orderId,
                    amount: verification.amount,
                    paymentMethod: 'momo',
                    paymentStatus: 'completed',
                    transactionId: verification.transactionId,
                    paymentDate: new Date(),
                    notes: `MoMo payment - ${verification.message}`,
                    actor: actorInfo
                };

                const payment = await PaymentsS.createPayment(paymentData);

                await auditLogger({
                    tableName: 'payments',
                    recordId: payment.id,
                    action: 'CREATE',
                    actor: actorInfo,
                    newData: payment,
                    req
                });

                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?paymentId=${payment.id}&gateway=momo`);
            } else {
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?gateway=momo&message=${encodeURIComponent(verification.message)}`);
            }
        } catch (error) {
            logger.error('MoMo callback handling failed', { error: error.message });
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?gateway=momo&message=Error`);
        }
    },

    handleMoMoIPN: async (req, res) => {
        try {
            const verification = PaymentGatewayS.verifyMoMoCallback(req.body);

            if (verification.isValid && verification.success) {
                return res.status(200).json({ resultCode: 0, message: 'Success' });
            } else {
                return res.status(200).json({ resultCode: 1, message: 'Fail' });
            }
        } catch (error) {
            logger.error('MoMo IPN handling failed', { error: error.message });
            return res.status(200).json({ resultCode: 1, message: 'Error' });
        }
    },

    handleZaloPayCallback: async (req, res) => {
        try {
            const verification = PaymentGatewayS.verifyZaloPayCallback(req.query);

            if (verification.isValid && verification.success) {
                const actorInfo = getActor(req);
                const orderId = verification.appTransId.split('_')[1];
                const paymentData = {
                    orderId: orderId,
                    amount: verification.amount,
                    paymentMethod: 'zalopay',
                    paymentStatus: 'completed',
                    transactionId: verification.transactionId,
                    paymentDate: new Date(),
                    notes: `ZaloPay payment - ${verification.message}`,
                    actor: actorInfo
                };

                const payment = await PaymentsS.createPayment(paymentData);

                await auditLogger({
                    tableName: 'payments',
                    recordId: payment.id,
                    action: 'CREATE',
                    actor: actorInfo,
                    newData: payment,
                    req
                });

                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?paymentId=${payment.id}&gateway=zalopay`);
            } else {
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?gateway=zalopay&message=${encodeURIComponent(verification.message)}`);
            }
        } catch (error) {
            logger.error('ZaloPay callback handling failed', { error: error.message });
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?gateway=zalopay&message=Error`);
        }
    },

    handleZaloPayIPN: async (req, res) => {
        try {
            const verification = PaymentGatewayS.verifyZaloPayCallback(req.body);

            if (verification.isValid && verification.success) {
                return res.status(200).json({ return_code: 1, return_message: 'Success' });
            } else {
                return res.status(200).json({ return_code: 0, return_message: 'Fail' });
            }
        } catch (error) {
            logger.error('ZaloPay IPN handling failed', { error: error.message });
            return res.status(200).json({ return_code: 0, return_message: 'Error' });
        }
    },

    getGatewayStatus: async (req, res) => {
        try {
            const gateways = ['vnpay', 'momo', 'zalopay'];
            const status = {};

            gateways.forEach(gateway => {
                status[gateway] = {
                    enabled: PaymentGatewayS.isGatewayEnabled(gateway),
                    sandbox: true, // Always sandbox mode
                    config: PaymentGatewayS.getGatewayConfig(gateway)
                };
            });

            return sendSuccess(res, status, 'Gateway status retrieved');
        } catch (error) {
            return sendError(res, error, 'Failed to get gateway status');
        }
    }
};

module.exports = PaymentsC;
