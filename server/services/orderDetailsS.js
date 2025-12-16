const OrderDetailsM = require('../models/orderDetailsM');

const OrderDetailsS = {
    findAll: async () => {
        return await OrderDetailsM.findAll();
    },
    findByOrderId: async (oid) => {
        return await OrderDetailsM.findByOrderId(oid);
    },
    findByProductId: async (pid) => {
        return await OrderDetailsM.findByProductId(pid);
    },
    createOrderDetail: async (orderDetailData) => {
        if (!orderDetailData.oid || !orderDetailData.pid) {
            throw new Error('Missing required fields: oid, pid');
        }
        const existing = await OrderDetailsM.findByOrderAndProduct(orderDetailData.oid, orderDetailData.pid);
        if (existing) {
            throw new Error('Order detail already exists for this order and product');
        }
        return await OrderDetailsM.create(orderDetailData);
    },
    updateOrderDetail: async (oid, pid, orderDetailData) => {
        const existing = await OrderDetailsM.findByOrderAndProduct(oid, pid);
        if (!existing) {
            throw new Error('Order detail not found');
        }
        return await OrderDetailsM.update(oid, pid, orderDetailData);
    },
    deleteOrderDetail: async (oid, pid) => {
        const existing = await OrderDetailsM.findByOrderAndProduct(oid, pid);
        if (!existing) {
            throw new Error('Order detail not found');
        }
        return await OrderDetailsM.delete(oid, pid);
    }
};

module.exports = OrderDetailsS;

