const InventoryS = require('../services/inventoryS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const InventoryC = {
    getStockHistory: async (req, res) => {
        try {
            const filters = {
                productId: req.query.productId,
                warehouseId: req.query.warehouseId,
                transactionType: req.query.transactionType,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit ? parseInt(req.query.limit) : null,
                offset: req.query.offset ? parseInt(req.query.offset) : null
            };

            const history = await InventoryS.getStockHistory(filters);
            return sendSuccess(res, history, 'Stock history fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch stock history');
        }
    },

    getCurrentStock: async (req, res) => {
        try {
            const { productId } = req.params;
            const { warehouseId } = req.query;

            const stock = await InventoryS.getCurrentStock(productId, warehouseId || null);
            return sendSuccess(res, { productId, warehouseId: warehouseId || null, stock }, 'Current stock fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch current stock');
        }
    },

    getStockSummary: async (req, res) => {
        try {
            const { productId } = req.params;
            const summary = await InventoryS.getStockSummary(productId);
            return sendSuccess(res, summary, 'Stock summary fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch stock summary');
        }
    },

    checkLowStock: async (req, res) => {
        try {
            const { productId } = req.params;
            const { warehouseId } = req.query;

            const result = await InventoryS.checkLowStock(productId, warehouseId || null);
            return sendSuccess(res, result, 'Low stock check completed');
        } catch (error) {
            return sendError(res, error, 'Failed to check low stock');
        }
    },

    adjustStock: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const { productId } = req.params;
            const { warehouseId, newQuantity, notes } = req.body;

            if (newQuantity === undefined || newQuantity === null) {
                return sendError(res, new Error('newQuantity is required'), 'Validation error');
            }

            const result = await InventoryS.adjustStock(productId, warehouseId || null, newQuantity, notes);

            // Log audit
            await auditLogger({
                tableName: 'stock_history',
                recordId: `adjustment_${productId}_${warehouseId || 'global'}_${Date.now()}`,
                action: 'UPDATE',
                actor: actorInfo,
                newData: result,
                req
            });

            return sendSuccess(res, result, 'Stock adjusted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to adjust stock');
        }
    },

    transferStock: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

            if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
                return sendError(res, new Error('productId, fromWarehouseId, toWarehouseId, and quantity are required'), 'Validation error');
            }

            const result = await InventoryS.transferStock({
                productId,
                fromWarehouseId,
                toWarehouseId,
                quantity,
                notes
            });

            // Log audit
            await auditLogger({
                tableName: 'stock_history',
                recordId: `transfer_${productId}_${fromWarehouseId}_${toWarehouseId}_${Date.now()}`,
                action: 'UPDATE',
                actor: actorInfo,
                newData: result,
                req
            });

            return sendSuccess(res, result, 'Stock transferred successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to transfer stock');
        }
    }
};

module.exports = InventoryC;

