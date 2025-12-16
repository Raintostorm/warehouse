const WarehouseManagementM = require('../models/warehouseManagementM');

const WarehouseManagementS = {
    findAll: async () => {
        return await WarehouseManagementM.findAll();
    },
    findByWarehouseId: async (wid) => {
        return await WarehouseManagementM.findByWarehouseId(wid);
    },
    findByUserId: async (uid) => {
        return await WarehouseManagementM.findByUserId(uid);
    },
    createWarehouseManagement: async (warehouseManagementData) => {
        if (!warehouseManagementData.wid || !warehouseManagementData.uid) {
            throw new Error('Missing required fields: wid, uid');
        }
        const existing = await WarehouseManagementM.findByWarehouseAndUser(warehouseManagementData.wid, warehouseManagementData.uid);
        if (existing) {
            throw new Error('Warehouse management already exists for this warehouse and user');
        }
        return await WarehouseManagementM.create(warehouseManagementData);
    },
    updateWarehouseManagement: async (wid, uid, warehouseManagementData) => {
        const existing = await WarehouseManagementM.findByWarehouseAndUser(wid, uid);
        if (!existing) {
            throw new Error('Warehouse management not found');
        }
        return await WarehouseManagementM.update(wid, uid, warehouseManagementData);
    },
    deleteWarehouseManagement: async (wid, uid) => {
        const existing = await WarehouseManagementM.findByWarehouseAndUser(wid, uid);
        if (!existing) {
            throw new Error('Warehouse management not found');
        }
        return await WarehouseManagementM.delete(wid, uid);
    }
};

module.exports = WarehouseManagementS;

