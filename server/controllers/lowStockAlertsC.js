const LowStockAlertS = require('../services/lowStockAlertS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const LowStockAlertsC = {
    getAllAlerts: async (req, res) => {
        try {
            const filters = {
                productId: req.query.productId,
                warehouseId: req.query.warehouseId,
                alertLevel: req.query.alertLevel,
                isResolved: req.query.isResolved !== undefined ? req.query.isResolved === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : null,
                offset: req.query.offset ? parseInt(req.query.offset) : null
            };

            const alerts = await LowStockAlertS.getAlertHistory(filters);
            return sendSuccess(res, alerts, 'Low stock alerts fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch low stock alerts');
        }
    },

    getActiveAlerts: async (req, res) => {
        try {
            const filters = {
                productId: req.query.productId,
                warehouseId: req.query.warehouseId,
                alertLevel: req.query.alertLevel
            };

            const alerts = await LowStockAlertS.getActiveAlerts(filters);
            return sendSuccess(res, alerts, 'Active low stock alerts fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch active low stock alerts');
        }
    },

    getAlertById: async (req, res) => {
        try {
            const alert = await LowStockAlertS.getAlertById(req.params.id);
            return sendSuccess(res, alert, 'Low stock alert fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch low stock alert');
        }
    },

    getAlertsByProduct: async (req, res) => {
        try {
            const { productId } = req.params;
            const includeResolved = req.query.includeResolved === 'true';

            const alerts = await LowStockAlertS.getAlertsByProduct(productId, includeResolved);
            return sendSuccess(res, alerts, 'Product alerts fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch product alerts');
        }
    },

    getAlertsByWarehouse: async (req, res) => {
        try {
            const { warehouseId } = req.params;
            const includeResolved = req.query.includeResolved === 'true';

            const alerts = await LowStockAlertS.getAlertsByWarehouse(warehouseId, includeResolved);
            return sendSuccess(res, alerts, 'Warehouse alerts fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch warehouse alerts');
        }
    },

    checkAndCreateAlerts: async (req, res) => {
        try {
            const { productId, warehouseId } = req.query;
            const result = await LowStockAlertS.checkAndCreateAlerts(productId || null, warehouseId || null);
            return sendSuccess(res, result, 'Low stock check completed');
        } catch (error) {
            return sendError(res, error, 'Failed to check and create alerts');
        }
    },

    resolveAlert: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const { id } = req.params;
            const resolvedBy = req.body?.resolvedBy;

            const oldAlert = await LowStockAlertS.getAlertById(id);
            const alert = await LowStockAlertS.resolveAlert(id, resolvedBy || actorInfo);

            // Log audit
            await auditLogger({
                tableName: 'low_stock_alerts',
                recordId: alert.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldAlert,
                newData: alert,
                req
            });

            return sendSuccess(res, alert, 'Alert resolved successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to resolve alert');
        }
    },

    autoResolveAlerts: async (req, res) => {
        try {
            const result = await LowStockAlertS.autoResolveAlerts();
            return sendSuccess(res, result, 'Auto-resolve completed');
        } catch (error) {
            return sendError(res, error, 'Failed to auto-resolve alerts');
        }
    },

    deleteAlert: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldAlert = await LowStockAlertS.getAlertById(req.params.id);
            const alert = await LowStockAlertS.deleteAlert(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'low_stock_alerts',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldAlert,
                req
            });

            return sendSuccess(res, alert, 'Alert deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete alert');
        }
    }
};

module.exports = LowStockAlertsC;

