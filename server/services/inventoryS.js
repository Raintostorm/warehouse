const StockHistoryM = require('../models/stockHistoryM');
const ProductDetailsM = require('../models/productDetailsM');
const ProductsM = require('../models/productsM');
const LowStockAlertsM = require('../models/lowStockAlertsM');
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

const InventoryS = {
    /**
     * Record a stock change in history
     */
    recordStockChange: async (changeData) => {
        try {
            const history = {
                productId: changeData.productId,
                warehouseId: changeData.warehouseId || null,
                transactionType: changeData.transactionType, // 'IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'
                quantity: changeData.quantity,
                previousQuantity: changeData.previousQuantity || null,
                newQuantity: changeData.newQuantity,
                referenceId: changeData.referenceId || null,
                referenceType: changeData.referenceType || null,
                notes: changeData.notes || null,
                actor: changeData.actor || getActor()
            };

            return await StockHistoryM.create(history);
        } catch (error) {
            logger.error('Error recording stock change', { error: error.message, stack: error.stack, changeData });
            throw error;
        }
    },

    /**
     * Get stock history with filters
     */
    getStockHistory: async (filters = {}) => {
        try {
            return await StockHistoryM.findAll(filters);
        } catch (error) {
            logger.error('Error getting stock history', { error: error.message, filters });
            throw error;
        }
    },

    /**
     * Get current stock for a product in a warehouse
     */
    getCurrentStock: async (productId, warehouseId = null) => {
        try {
            if (warehouseId) {
                const productDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                return productDetail ? productDetail.number : 0;
            } else {
                // Get total stock across all warehouses
                const productDetails = await ProductDetailsM.findByProductId(productId);
                return productDetails.reduce((sum, pd) => sum + (pd.number || 0), 0);
            }
        } catch (error) {
            logger.error('Error getting current stock', { error: error.message, productId, warehouseId });
            throw error;
        }
    },

    /**
     * Get stock summary for a product
     */
    getStockSummary: async (productId) => {
        try {
            const productDetails = await ProductDetailsM.findByProductId(productId);
            const totalStock = productDetails.reduce((sum, pd) => sum + (pd.number || 0), 0);
            
            return {
                productId,
                totalStock,
                warehouses: productDetails.map(pd => ({
                    warehouseId: pd.wid,
                    quantity: pd.number || 0
                }))
            };
        } catch (error) {
            logger.error('Error getting stock summary', { error: error.message, productId });
            throw error;
        }
    },

    /**
     * Check and create low stock alerts
     */
    checkLowStock: async (productId, warehouseId = null) => {
        try {
            const product = await ProductsM.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            const threshold = product.low_stock_threshold || 10;
            let currentQuantity;

            if (warehouseId) {
                currentQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
            } else {
                const summary = await InventoryS.getStockSummary(productId);
                currentQuantity = summary.totalStock;
            }

            // Determine alert level
            let alertLevel = 'warning';
            if (currentQuantity === 0) {
                alertLevel = 'out_of_stock';
            } else if (currentQuantity < threshold * 0.3) {
                alertLevel = 'critical';
            }

            // Check if alert already exists and is unresolved
            const existingAlerts = await LowStockAlertsM.findAll({
                productId,
                warehouseId: warehouseId || null,
                isResolved: false
            });

            // Only create alert if stock is below threshold and no active alert exists
            if (currentQuantity < threshold && existingAlerts.length === 0) {
                const alert = await LowStockAlertsM.create({
                    productId,
                    warehouseId: warehouseId || null,
                    currentQuantity,
                    threshold,
                    alertLevel,
                    actor: getActor()
                });

                return {
                    alertCreated: true,
                    alert,
                    currentQuantity,
                    threshold,
                    alertLevel
                };
            }

            return {
                alertCreated: false,
                currentQuantity,
                threshold,
                alertLevel: currentQuantity < threshold ? alertLevel : null
            };
        } catch (error) {
            logger.error('Error checking low stock', { error: error.message, productId, warehouseId });
            throw error;
        }
    },

    /**
     * Validate stock availability
     */
    validateStockAvailability: async (productId, warehouseId, requestedQuantity) => {
        try {
            const currentStock = await InventoryS.getCurrentStock(productId, warehouseId);
            return {
                isValid: currentStock >= requestedQuantity,
                available: currentStock,
                requested: requestedQuantity,
                shortage: Math.max(0, requestedQuantity - currentStock)
            };
        } catch (error) {
            logger.error('Error validating stock availability', { error: error.message, productId, warehouseId });
            throw error;
        }
    },

    /**
     * Adjust stock manually (for corrections)
     * NOTE: Manual adjustments should be restricted - only allow via orders
     * This method is kept for emergency corrections but should be used with caution
     */
    adjustStock: async (productId, warehouseId, newQuantity, notes = null) => {
        try {
            const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
            
            // Update product_details
            if (warehouseId) {
                const existing = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                if (existing) {
                    await ProductDetailsM.update(productId, warehouseId, { number: newQuantity });
                } else {
                    await ProductDetailsM.create({
                        pid: productId,
                        wid: warehouseId,
                        number: newQuantity,
                        note: notes
                    });
                }
            } else {
                // Update main product number
                await ProductsM.update(productId, { number: newQuantity });
            }

            // Record in history
            await InventoryS.recordStockChange({
                productId,
                warehouseId,
                transactionType: 'ADJUSTMENT',
                quantity: newQuantity - previousQuantity,
                previousQuantity,
                newQuantity,
                referenceType: 'adjustment',
                notes: notes || 'Manual stock adjustment'
            });

            // Check for low stock after adjustment
            await InventoryS.checkLowStock(productId, warehouseId);

            return {
                productId,
                warehouseId,
                previousQuantity,
                newQuantity,
                adjustment: newQuantity - previousQuantity
            };
        } catch (error) {
            logger.error('Error adjusting stock', { error: error.message, productId, warehouseId, newQuantity });
            throw error;
        }
    },

    /**
     * Transfer stock between warehouses
     */
    transferStock: async (transferData) => {
        try {
            const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = transferData;

            // Check if source warehouse has enough stock
            const sourceStock = await InventoryS.getCurrentStock(productId, fromWarehouseId);
            if (sourceStock < quantity) {
                throw new Error(`Insufficient stock. Available: ${sourceStock}, Requested: ${quantity}`);
            }

            // Get current stock in destination warehouse
            const destStock = await InventoryS.getCurrentStock(productId, toWarehouseId);

            // Update source warehouse
            const sourceDetail = await ProductDetailsM.findByProductAndWarehouse(productId, fromWarehouseId);
            if (sourceDetail) {
                await ProductDetailsM.update(productId, fromWarehouseId, {
                    number: sourceStock - quantity
                });
            }

            // Update destination warehouse
            const destDetail = await ProductDetailsM.findByProductAndWarehouse(productId, toWarehouseId);
            if (destDetail) {
                await ProductDetailsM.update(productId, toWarehouseId, {
                    number: destStock + quantity
                });
            } else {
                await ProductDetailsM.create({
                    pid: productId,
                    wid: toWarehouseId,
                    number: quantity,
                    note: notes || 'Stock transfer'
                });
            }

            // Record history for both warehouses
            await InventoryS.recordStockChange({
                productId,
                warehouseId: fromWarehouseId,
                transactionType: 'TRANSFER_OUT',
                quantity: -quantity,
                previousQuantity: sourceStock,
                newQuantity: sourceStock - quantity,
                referenceId: transferData.transferId || null,
                referenceType: 'transfer',
                notes: notes || `Transferred to warehouse ${toWarehouseId}`
            });

            await InventoryS.recordStockChange({
                productId,
                warehouseId: toWarehouseId,
                transactionType: 'TRANSFER_IN',
                quantity: quantity,
                previousQuantity: destStock,
                newQuantity: destStock + quantity,
                referenceId: transferData.transferId || null,
                referenceType: 'transfer',
                notes: notes || `Transferred from warehouse ${fromWarehouseId}`
            });

            // Check low stock for both warehouses
            await InventoryS.checkLowStock(productId, fromWarehouseId);
            await InventoryS.checkLowStock(productId, toWarehouseId);

            return {
                productId,
                fromWarehouseId,
                toWarehouseId,
                quantity,
                sourceStockBefore: sourceStock,
                sourceStockAfter: sourceStock - quantity,
                destStockBefore: destStock,
                destStockAfter: destStock + quantity
            };
        } catch (error) {
            logger.error('Error transferring stock', { error: error.message, transferData });
            throw error;
        }
    }
};

module.exports = InventoryS;

