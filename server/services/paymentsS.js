const PaymentsM = require('../models/paymentsM');
const OrdersM = require('../models/ordersM');
const logger = require('../utils/logger');

const PaymentsS = {
    getAllPayments: async () => {
        return await PaymentsM.findAll();
    },

    getPaymentById: async (id) => {
        const payment = await PaymentsM.findById(id);
        if (!payment) {
            throw new Error('Payment not found');
        }
        return payment;
    },

    getPaymentsByOrderId: async (orderId) => {
        return await PaymentsM.findByOrderId(orderId);
    },

    createPayment: async (paymentData) => {
        const orderId = paymentData.orderId || paymentData.order_id;
        
        // Validate order ID format (should start with SA, IM, EX, or ORD)
        if (orderId && !/^(SA|IM|EX|ORD)\d+$/.test(orderId)) {
            throw new Error(`Invalid order ID format: ${orderId}. Order ID must start with SA, IM, EX, or ORD followed by numbers.`);
        }
        
        // Validate order exists
        const order = await OrdersM.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Bills đã được disable - bill_id là optional, không cần tìm nữa
        // Payments sẽ link trực tiếp với orders qua order_id

        // Generate payment ID if not provided
        if (!paymentData.id) {
            const timestamp = Date.now();
            paymentData.id = `PAY${timestamp}`;
        }

        // Set payment date if not provided and status is completed
        if (!paymentData.paymentDate && !paymentData.payment_date) {
            if (paymentData.paymentStatus === 'completed' || paymentData.payment_status === 'completed') {
                paymentData.paymentDate = new Date();
            }
        }

        return await PaymentsM.create(paymentData);
    },

    // Create payment from gateway callback (skip order validation)
    // Used when order might not exist yet or orderId is a transaction reference
    createGatewayPayment: async (paymentData) => {
        // Generate payment ID if not provided
        if (!paymentData.id) {
            const timestamp = Date.now();
            paymentData.id = `PAY${timestamp}`;
        }

        // Bills đã được disable - bill_id là optional, không cần tìm nữa
        // Payments sẽ link trực tiếp với orders qua order_id

        // Set payment date if not provided and status is completed
        if (!paymentData.paymentDate && !paymentData.payment_date) {
            if (paymentData.paymentStatus === 'completed' || paymentData.payment_status === 'completed') {
                paymentData.paymentDate = new Date();
            }
        }

        return await PaymentsM.create(paymentData);
    },

    updatePayment: async (id, paymentData) => {
        const existingPayment = await PaymentsM.findById(id);
        if (!existingPayment) {
            throw new Error('Payment not found');
        }

        // If status changed to completed, set payment_date
        if (paymentData.paymentStatus === 'completed' || paymentData.payment_status === 'completed') {
            if (!existingPayment.payment_date && !paymentData.paymentDate && !paymentData.payment_date) {
                paymentData.paymentDate = new Date();
            }
        }

        return await PaymentsM.update(id, paymentData);
    },

    deletePayment: async (id) => {
        const payment = await PaymentsM.findById(id);
        if (!payment) {
            throw new Error('Payment not found');
        }
        return await PaymentsM.delete(id);
    },

    getOrderPaymentSummary: async (orderId) => {
        const order = await OrdersM.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const payments = await PaymentsM.findByOrderId(orderId);
        const totalPaid = await PaymentsM.getTotalByOrderId(orderId);
        const orderTotal = parseFloat(order.total || 0);
        const remaining = orderTotal - totalPaid;

        return {
            orderId,
            orderTotal,
            totalPaid,
            remaining,
            payments,
            isFullyPaid: remaining <= 0,
            paymentStatus: remaining <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid')
        };
    },

    getUnpaidSaleOrders: async () => {
        // Get all sale orders
        const allOrders = await OrdersM.findAll();
        const saleOrders = allOrders.filter(order => {
            const orderType = (order.type || '').toLowerCase();
            return orderType === 'sale' || orderType === 'sell';
        });

        // Check payment status for each sale order
        const unpaidOrders = [];
        for (const order of saleOrders) {
            try {
                const orderId = order.id || order.Id;
                const orderTotal = parseFloat(order.total || order.Total || 0);
                
                // Skip orders with total = 0
                if (orderTotal <= 0) {
                    continue;
                }

                const totalPaid = await PaymentsM.getTotalByOrderId(orderId);
                const remaining = orderTotal - totalPaid;

                // Only include orders that are not fully paid
                if (remaining > 0) {
                    unpaidOrders.push({
                        id: orderId,
                        type: order.type || order.Type,
                        date: order.date || order.Date,
                        customer_name: order.customer_name || order.customerName || order.CustomerName,
                        total: orderTotal,
                        totalPaid: totalPaid,
                        remaining: remaining
                    });
                }
            } catch (err) {
                logger.warn('Error checking payment status for order', { orderId: order.id, error: err.message });
            }
        }

        // Sort by date (newest first)
        unpaidOrders.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });

        return unpaidOrders;
    }
};

module.exports = PaymentsS;
