const LowStockAlertsM = require('../models/lowStockAlertsM');
const ProductsM = require('../models/productsM');
const InventoryS = require('./inventoryS');
const logger = require('../utils/logger');

// Helper to get actor (works with or without req)
const getActor = (reqOrActor) => {
    if (!reqOrActor) return 'System';
    if (typeof reqOrActor === 'string') return reqOrActor;
    if (reqOrActor.user) {
        return reqOrActor.user.email || reqOrActor.user.id || 'System';
    }
    return 'System';
};

const LowStockAlertS = {
    /**
     * Check and create alerts for all products or a specific product
     */
    checkAndCreateAlerts: async (productId = null, warehouseId = null) => {
        try {
            const alertsCreated = [];

            if (productId) {
                // Check specific product
                const result = await InventoryS.checkLowStock(productId, warehouseId);
                if (result.alertCreated) {
                    alertsCreated.push(result.alert);
                }
            } else {
                // Check all products
                const products = await ProductsM.findAll();
                for (const product of products) {
                    try {
                        const result = await InventoryS.checkLowStock(product.id, warehouseId);
                        if (result.alertCreated) {
                            alertsCreated.push(result.alert);
                        }
                    } catch (error) {
                        logger.warn('Error checking low stock for product', {
                            productId: product.id,
                            error: error.message
                        });
                    }
                }
            }

            return {
                alertsCreated: alertsCreated.length,
                alerts: alertsCreated
            };
        } catch (error) {
            logger.error('Error checking and creating alerts', { error: error.message, productId, warehouseId });
            throw error;
        }
    },

    /**
     * Resolve an alert
     */
    resolveAlert: async (alertId, resolvedBy = null) => {
        try {
            const alert = await LowStockAlertsM.findById(alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }

            if (alert.is_resolved) {
                throw new Error('Alert is already resolved');
            }

            const resolvedByValue = resolvedBy || getActor() || 'System';
            return await LowStockAlertsM.update(alertId, {
                isResolved: true,
                resolvedBy: resolvedByValue
            });
        } catch (error) {
            logger.error('Error resolving alert', { error: error.message, alertId });
            throw error;
        }
    },

    /**
     * Get active (unresolved) alerts
     */
    getActiveAlerts: async (filters = {}) => {
        try {
            return await LowStockAlertsM.findAll({
                ...filters,
                isResolved: false
            });
        } catch (error) {
            logger.error('Error getting active alerts', { error: error.message, filters });
            throw error;
        }
    },

    /**
     * Get alert history (including resolved)
     */
    getAlertHistory: async (filters = {}) => {
        try {
            return await LowStockAlertsM.findAll(filters);
        } catch (error) {
            logger.error('Error getting alert history', { error: error.message, filters });
            throw error;
        }
    },

    /**
     * Get alert by ID
     */
    getAlertById: async (alertId) => {
        try {
            const alert = await LowStockAlertsM.findById(alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }
            return alert;
        } catch (error) {
            logger.error('Error getting alert by ID', { error: error.message, alertId });
            throw error;
        }
    },

    /**
     * Get alerts by product ID
     */
    getAlertsByProduct: async (productId, includeResolved = false) => {
        try {
            return await LowStockAlertsM.findByProductId(productId, includeResolved);
        } catch (error) {
            logger.error('Error getting alerts by product', { error: error.message, productId });
            throw error;
        }
    },

    /**
     * Get alerts by warehouse ID
     */
    getAlertsByWarehouse: async (warehouseId, includeResolved = false) => {
        try {
            return await LowStockAlertsM.findByWarehouseId(warehouseId, includeResolved);
        } catch (error) {
            logger.error('Error getting alerts by warehouse', { error: error.message, warehouseId });
            throw error;
        }
    },

    /**
     * Auto-resolve alerts that are no longer low stock
     */
    autoResolveAlerts: async () => {
        try {
            const activeAlerts = await LowStockAlertsM.findActive();
            const resolved = [];

            for (const alert of activeAlerts) {
                try {
                    // Check current stock
                    const currentStock = await InventoryS.getCurrentStock(
                        alert.product_id,
                        alert.warehouse_id
                    );

                    // Get product threshold
                    const product = await ProductsM.findById(alert.product_id);
                    const threshold = product?.low_stock_threshold || 10;

                    // If stock is now above threshold, resolve the alert
                    if (currentStock >= threshold) {
                        await LowStockAlertsM.update(alert.id, {
                            isResolved: true,
                            resolvedBy: 'system'
                        });
                        resolved.push(alert.id);
                    }
                } catch (error) {
                    logger.warn('Error auto-resolving alert', {
                        alertId: alert.id,
                        error: error.message
                    });
                }
            }

            return {
                resolved: resolved.length,
                alertIds: resolved
            };
        } catch (error) {
            logger.error('Error auto-resolving alerts', { error: error.message });
            throw error;
        }
    },

    /**
     * Delete an alert
     */
    deleteAlert: async (alertId) => {
        try {
            const alert = await LowStockAlertsM.findById(alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }

            return await LowStockAlertsM.delete(alertId);
        } catch (error) {
            logger.error('Error deleting alert', { error: error.message, alertId });
            throw error;
        }
    }
};

module.exports = LowStockAlertS;

