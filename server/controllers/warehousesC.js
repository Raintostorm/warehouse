const WarehousesS = require('../services/warehousesS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const WarehousesC = {
    getAllWarehouses: async (req, res) => {
        try {
            const warehouses = await WarehousesS.findAll();
            return sendSuccess(res, warehouses, 'Warehouses fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch warehouses');
        }
    },

    getWarehouseById: async (req, res) => {
        try {
            const warehouse = await WarehousesS.findById(req.params.id);
            return sendSuccess(res, warehouse, 'Warehouse fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch warehouse');
        }
    },

    createWarehouse: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const warehouseData = {
                ...req.body,
                actor: actorInfo
            };
            const warehouse = await WarehousesS.createWarehouse(warehouseData);

            // Log audit
            await auditLogger({
                tableName: 'warehouses',
                recordId: warehouse.id || warehouse.Id,
                action: 'CREATE',
                actor: actorInfo,
                newData: warehouse,
                req
            });

            return sendSuccess(res, warehouse, 'Warehouse created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create warehouse');
        }
    },

    updateWarehouse: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before update
            const oldWarehouse = await WarehousesS.findById(req.params.id);

            const warehouseData = {
                ...req.body,
                actor: actorInfo
            };
            const warehouse = await WarehousesS.updateWarehouse(req.params.id, warehouseData);

            // Log audit
            await auditLogger({
                tableName: 'warehouses',
                recordId: warehouse.id || warehouse.Id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldWarehouse,
                newData: warehouse,
                req
            });

            return sendSuccess(res, warehouse, 'Warehouse updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update warehouse');
        }
    },

    deleteWarehouse: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before delete
            const oldWarehouse = await WarehousesS.findById(req.params.id);

            const warehouse = await WarehousesS.deleteWarehouse(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'warehouses',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldWarehouse,
                req
            });

            return sendSuccess(res, warehouse, 'Warehouse deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete warehouse');
        }
    }
};

module.exports = WarehousesC;

