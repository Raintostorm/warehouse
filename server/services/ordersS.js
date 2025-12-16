const OrdersM = require('../models/ordersM');

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
        if (!orderData.id || !orderData.type || !orderData.date) {
            throw new Error('Missing required fields: id, type, date');
        }
        const existingOrder = await OrdersM.findById(orderData.id);
        if (existingOrder) {
            throw new Error('Order ID already exists');
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

