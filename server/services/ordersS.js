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

        return await OrdersM.create(orderData);
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

