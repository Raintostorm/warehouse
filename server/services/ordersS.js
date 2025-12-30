const OrdersM = require('../models/ordersM');
const db = require('../db');
const logger = require('../utils/logger');

// Helper function để xác định prefix dựa trên order type
function getOrderPrefix(orderType = '') {
    const type = (orderType || '').toLowerCase();
    if (type === 'sale' || type === 'sell') {
        return 'SA';
    } else if (type === 'import') {
        return 'IM';
    } else if (type === 'export') {
        return 'EX';
    }
    return 'ORD';
}

// Helper function để generate order ID tự động dựa trên type
async function generateOrderId(orderType = '') {
    const prefix = getOrderPrefix(orderType);
    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // Lấy order ID lớn nhất hiện tại với prefix tương ứng
            const prefixLength = prefix.length;
            const result = await db.query(
                `SELECT id FROM orders WHERE id LIKE $1 ORDER BY CAST(SUBSTRING(id FROM $2) AS INTEGER) DESC LIMIT 1`,
                [`${prefix}%`, prefixLength + 1]
            );

            let nextNumber = 1;
            if (result.rows.length > 0) {
                const lastId = result.rows[0].id;
                // Extract number từ prefixXXX (6 digits)
                const match = lastId.match(new RegExp(`${prefix}(\\d+)`));
                if (match) {
                    nextNumber = parseInt(match[1], 10) + 1;
                }
            }

            const newId = `${prefix}${nextNumber.toString().padStart(6, '0')}`;

            // Double-check: Kiểm tra lại xem ID này đã tồn tại chưa
            const checkResult = await db.query(
                'SELECT id FROM orders WHERE id = $1',
                [newId]
            );

            if (checkResult.rows.length === 0) {
                // ID chưa tồn tại, an toàn để sử dụng
                return newId;
            }

            // Nếu đã tồn tại, retry với số tiếp theo
            retryCount++;
            if (retryCount >= maxRetries) {
                // Fallback to timestamp-based ID nếu retry quá nhiều lần
                logger.warn('Max retries reached for order ID generation, using timestamp fallback', { prefix, retryCount });
                return `${prefix}${Date.now().toString().slice(-6)}`;
            }

            // Tiếp tục retry với số tiếp theo
            logger.warn('Generated ID already exists, trying next number', { newId, prefix, retryCount });
        } catch (error) {
            logger.error('Error generating order ID:', { error: error.message, prefix, retryCount });
            retryCount++;
            if (retryCount >= maxRetries) {
                // Fallback to timestamp-based ID
                return `${prefix}${Date.now().toString().slice(-6)}`;
            }
        }
    }

    // Final fallback
    return `${prefix}${Date.now().toString().slice(-6)}`;
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
            orderData.id = await generateOrderId(orderData.type);
        } else {
            // Check nếu ID đã tồn tại
            const existingOrder = await OrdersM.findById(orderData.id);
            if (existingOrder) {
                throw new Error('Order ID already exists');
            }
        }

        // Retry logic khi gặp duplicate key error (race condition)
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const order = await OrdersM.create(orderData);
                return order;
            } catch (error) {
                // Kiểm tra nếu là duplicate key error (PostgreSQL error code 23505)
                if (error.code === '23505' ||
                    error.message?.includes('duplicate key') ||
                    error.message?.includes('unique constraint') ||
                    error.message?.includes('orders_pkey')) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        logger.error('Failed to create order after retries', {
                            orderData,
                            retryCount,
                            error: error.message
                        });
                        throw new Error(`Failed to create order after ${maxRetries} retries: Order ID conflict`);
                    }
                    // Generate ID mới và retry
                    logger.warn('Duplicate key error, generating new order ID and retrying', {
                        oldId: orderData.id,
                        retryCount,
                        error: error.message
                    });
                    orderData.id = await generateOrderId(orderData.type);
                } else {
                    // Nếu không phải duplicate error, throw ngay
                    throw error;
                }
            }
        }

        throw new Error('Failed to create order after retries');
    },
    updateOrder: async (id, orderData) => {
        const existingOrder = await OrdersM.findById(id);
        if (!existingOrder) {
            throw new Error('Order not found');
        }

        // Check if this is a sale order that is fully paid
        const orderType = (existingOrder.type || '').toLowerCase();
        if (orderType === 'sale' || orderType === 'sell') {
            const PaymentsM = require('../models/paymentsM');
            const totalPaid = await PaymentsM.getTotalByOrderId(id);
            const orderTotal = parseFloat(existingOrder.total || 0);
            const remaining = orderTotal - totalPaid;

            if (remaining <= 0) {
                throw new Error('Cannot update order: This sale order has been fully paid. Only viewing is allowed.');
            }
        }

        return await OrdersM.update(id, orderData);
    },
    deleteOrder: async (id) => {
        const existingOrder = await OrdersM.findById(id);
        if (!existingOrder) {
            throw new Error('Order not found');
        }

        // Check if this is a sale order that is fully paid
        const orderType = (existingOrder.type || '').toLowerCase();
        if (orderType === 'sale' || orderType === 'sell') {
            const PaymentsM = require('../models/paymentsM');
            const totalPaid = await PaymentsM.getTotalByOrderId(id);
            const orderTotal = parseFloat(existingOrder.total || 0);
            const remaining = orderTotal - totalPaid;

            if (remaining <= 0) {
                throw new Error('Cannot delete order: This sale order has been fully paid. Only viewing is allowed.');
            }
        }

        return await OrdersM.delete(id);
    }
};

module.exports = OrdersS;

