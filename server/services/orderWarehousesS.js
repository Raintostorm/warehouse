const OrderWarehousesM = require('../models/orderWarehousesM');

const OrderWarehousesS = {
    findAll: async () => {
        return await OrderWarehousesM.findAll();
    },
    findByOrderId: async (oid) => {
        return await OrderWarehousesM.findByOrderId(oid);
    },
    findByWarehouseId: async (wid) => {
        return await OrderWarehousesM.findByWarehouseId(wid);
    },
    createOrderWarehouse: async (orderWarehouseData) => {
        if (!orderWarehouseData.wid || !orderWarehouseData.oid) {
            throw new Error('Missing required fields: wid, oid');
        }
        const existing = await OrderWarehousesM.findByOrderAndWarehouse(orderWarehouseData.oid, orderWarehouseData.wid);
        if (existing) {
            throw new Error('Order warehouse already exists for this order and warehouse');
        }
        return await OrderWarehousesM.create(orderWarehouseData);
    },
    updateOrderWarehouse: async (wid, oid, orderWarehouseData) => {
        const existing = await OrderWarehousesM.findByOrderAndWarehouse(oid, wid);
        if (!existing) {
            throw new Error('Order warehouse not found');
        }
        return await OrderWarehousesM.update(wid, oid, orderWarehouseData);
    },
    deleteOrderWarehouse: async (wid, oid) => {
        const existing = await OrderWarehousesM.findByOrderAndWarehouse(oid, wid);
        if (!existing) {
            throw new Error('Order warehouse not found');
        }
        return await OrderWarehousesM.delete(wid, oid);
    }
};

module.exports = OrderWarehousesS;

