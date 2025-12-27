const OrdersM = require('../models/ordersM');
const db = require('../db');

// Helper function để generate order ID tự động
async function generateOrderId() {
    try {
        // Lấy order ID lớn nhất hiện tại
        const result = await db.query(
            `SELECT id FROM orders WHERE id LIKE 'ORD%' ORDER BY CAST(SUBSTRING(id FROM 4) AS INTEGER) DESC LIMIT 1`
        );

        if (result.rows.length === 0) {
            // Chưa có order nào, bắt đầu từ ORD001
            return 'ORD001';
        }

        const lastId = result.rows[0].id;
        // Extract number từ ORDXXX
        const match = lastId.match(/ORD(\d+)/);
        if (match) {
            const nextNumber = parseInt(match[1], 10) + 1;
            // Format với 3 digits (001, 002, ...)
            return `ORD${nextNumber.toString().padStart(3, '0')}`;
        }

        // Fallback nếu format không đúng
        return `ORD${Date.now().toString().slice(-6)}`;
    } catch (error) {
        console.error('Error generating order ID:', error);
        // Fallback to timestamp-based ID
        return `ORD${Date.now().toString().slice(-6)}`;
    }
}

const OrdersS = {
    findAll: async () => {
        return await OrdersM.findAll();
    },
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const order = await OrdersM.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    },
    createOrder: async (orderData) => {
        if (!orderData.type || !orderData.date) {
            throw new Error('Missing required fields: type, date');
        }

        const orderType = (orderData.type || '').toLowerCase();

        // Validate order type requirements
        if (orderType === 'sale') {
            if (!orderData.customerName && !orderData.customer_name) {
                throw new Error('Sale orders require customer_name');
            }
        } else if (orderType === 'import') {
            if (!orderData.supplierId && !orderData.supplier_id) {
                throw new Error('Import orders require supplier_id');
            }
        }

        // Auto-generate order ID nếu không có
        if (!orderData.id) {
            orderData.id = await generateOrderId();
        } else {
            // Check nếu ID đã tồn tại
            const existingOrder = await OrdersM.findById(orderData.id);
            if (existingOrder) {
                throw new Error('Order ID already exists');
            }
        }

        const order = await OrdersM.create(orderData);

        // Tự động tạo bill cho orders type "sale" hoặc "sell" (case-insensitive)
        // Note: Import orders do NOT create bills
        if (orderType === 'sale' || orderType === 'sell') {
            try {
                const BillsS = require('./billsS');
                const BillsM = require('../models/billsM');
                const logger = require('../utils/logger');

                const actorInfo = orderData.actor || order.actor || 'system';
                const orderId = order.id || order.Id;

                if (!orderId) {
                    logger.error('Cannot create bill: order ID is missing', { order, orderData });
                    return order;
                }

                logger.info('Auto-creating bill for sale order', { orderId, orderType });

                // Check if bill already exists for this order
                let existingBills = [];
                try {
                    existingBills = await BillsM.getBillsByOrderIdFromJunction(orderId);
                } catch (err) {
                    // If junction table doesn't exist or query fails, try old method
                    logger.warn('Junction table query failed, trying old method', { error: err.message });
                    try {
                        existingBills = await BillsM.findByOrderId(orderId);
                    } catch (err2) {
                        logger.error('Failed to check existing bills', { error: err2.message });
                    }
                }

                if (existingBills.length === 0) {
                    // Calculate total from order
                    const orderTotal = parseFloat(order.total || order.Total || orderData.total || 0) || 0;

                    if (orderTotal <= 0) {
                        logger.warn('Order total is 0 or invalid, skipping bill creation', { orderId, orderTotal });
                        return order;
                    }

                    logger.info('Creating bill for order', { orderId, orderTotal });

                    // Create bill automatically
                    const bill = await BillsS.createBill({
                        orderIds: [orderId],
                        totalAmount: orderTotal,
                        status: 'pending',
                        actor: actorInfo
                    });

                    logger.info(`✅ Auto-created bill ${bill.id} for order ${orderId}`, {
                        billId: bill.id,
                        orderId,
                        totalAmount: orderTotal
                    });
                    console.log(`✅ Auto-created bill ${bill.id} for order ${orderId} (Total: ${orderTotal})`);
                } else {
                    logger.info(`Bill already exists for order ${orderId}`, {
                        orderId,
                        existingBillId: existingBills[0].id
                    });
                }
            } catch (billError) {
                // Log error but don't fail order creation
                const logger = require('../utils/logger');
                logger.error('❌ Failed to auto-create bill for order', {
                    orderId: order.id || order.Id,
                    orderType: orderData.type || order.type,
                    error: billError.message,
                    stack: billError.stack
                });
                // Also log to console for immediate visibility
                console.error('❌ Failed to auto-create bill:', {
                    orderId: order.id || order.Id,
                    error: billError.message
                });
            }
        }

        return order;
    },
    updateOrder: async (id, orderData) => {
        const existingOrder = await OrdersM.findById(id);
        if (!existingOrder) {
            throw new Error('Order not found');
        }
        return await OrdersM.update(id, orderData);
    },
    deleteOrder: async (id) => {
        const existingOrder = await OrdersM.findById(id);
        if (!existingOrder) {
            throw new Error('Order not found');
        }
        return await OrdersM.delete(id);
    }
};

module.exports = OrdersS;

