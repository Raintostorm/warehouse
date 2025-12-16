const WarehousesM = require('../models/warehousesM');

const WarehousesS = {
    findAll: async () => {
        return await WarehousesM.findAll();
    },
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const warehouse = await WarehousesM.findById(id);
        if (!warehouse) {
            throw new Error('Warehouse not found');
        }
        return warehouse;
    },
    createWarehouse: async (warehouseData) => {
        if (!warehouseData.id || !warehouseData.name) {
            throw new Error('Missing required fields: id, name');
        }
        const existingWarehouse = await WarehousesM.findById(warehouseData.id);
        if (existingWarehouse) {
            throw new Error('Warehouse ID already exists');
        }
        return await WarehousesM.create(warehouseData);
    },
    updateWarehouse: async (id, warehouseData) => {
        const existingWarehouse = await WarehousesM.findById(id);
        if (!existingWarehouse) {
            throw new Error('Warehouse not found');
        }
        return await WarehousesM.update(id, warehouseData);
    },
    deleteWarehouse: async (id) => {
        const existingWarehouse = await WarehousesM.findById(id);
        if (!existingWarehouse) {
            throw new Error('Warehouse not found');
        }
        return await WarehousesM.delete(id);
    }
};

module.exports = WarehousesS;

