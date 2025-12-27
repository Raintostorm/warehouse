const PaymentsM = require('../models/paymentsM');
const OrdersM = require('../models/ordersM');
const BillsM = require('../models/billsM');
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
        // Validate order exists
        const order = await OrdersM.findById(paymentData.orderId || paymentData.order_id);
        if (!order) {
            throw new Error('Order not found');
        }

        // Find bill_id from order_id if not provided
        if (!paymentData.billId && !paymentData.bill_id) {
            const bills = await BillsM.findByOrderId(paymentData.orderId || paymentData.order_id);
            if (bills.length > 0) {
                paymentData.billId = bills[0].id;
            }
        }

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

        // Find bill_id from order_id if not provided
        if (!paymentData.billId && !paymentData.bill_id && paymentData.orderId) {
            try {
                const bills = await BillsM.findByOrderId(paymentData.orderId);
                if (bills.length > 0) {
                    paymentData.billId = bills[0].id;
                } else {
                    // Try to find bill by amount if orderId doesn't match
                    const allBills = await BillsM.findAll();
                    const paymentAmount = parseFloat(paymentData.amount || 0);
                    const matchingBill = allBills.find(bill => {
                        const billTotal = parseFloat(bill.total_amount || 0);
                        return Math.abs(billTotal - paymentAmount) < 0.01 && bill.status === 'pending';
                    });
                    if (matchingBill) {
                        paymentData.billId = matchingBill.id;
                        // Also update orderId to match the bill's order_id
                        if (!paymentData.orderId || paymentData.orderId === paymentData.txnRef) {
                            paymentData.orderId = matchingBill.order_id;
                        }
                    }
                }
            } catch (err) {
                // Don't fail if bill lookup fails
                logger.warn('Could not find bill for gateway payment', {
                    orderId: paymentData.orderId,
                    error: err.message
                });
            }
        }

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
    }
};

module.exports = PaymentsS;
