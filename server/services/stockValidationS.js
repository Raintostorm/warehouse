const InventoryS = require('./inventoryS');
const ProductDetailsM = require('../models/productDetailsM');
const ProductsM = require('../models/productsM');
const logger = require('../utils/logger');

const StockValidationS = {
    /**
     * Validate stock availability for a single product in a warehouse
     */
    validateStockInWarehouse: async (productId, warehouseId, requestedQuantity) => {
        try {
            const currentStock = await InventoryS.getCurrentStock(productId, warehouseId);
            
            return {
                isValid: currentStock >= requestedQuantity,
                available: currentStock,
                requested: requestedQuantity,
                shortage: Math.max(0, requestedQuantity - currentStock),
                productId,
                warehouseId
            };
        } catch (error) {
            logger.error('Error validating stock in warehouse', { error: error.message, productId, warehouseId });
            throw error;
        }
    },

    /**
     * Validate stock availability for a sale order
     * Checks all products in order_details have sufficient stock in specified warehouses
     */
    validateSaleOrder: async (orderDetails) => {
        try {
            const validationResults = [];
            let isValid = true;

            for (const detail of orderDetails) {
                const productId = detail.productId || detail.product_id || detail.pid;
                const warehouseId = detail.warehouseId || detail.warehouse_id || detail.wid;
                const quantity = detail.number || detail.quantity || 0;

                if (!productId) {
                    validationResults.push({
                        isValid: false,
                        error: 'Product ID is required',
                        detail
                    });
                    isValid = false;
                    continue;
                }

                if (!warehouseId) {
                    validationResults.push({
                        isValid: false,
                        error: 'Warehouse ID is required',
                        detail
                    });
                    isValid = false;
                    continue;
                }

                if (quantity <= 0) {
                    validationResults.push({
                        isValid: false,
                        error: 'Quantity must be greater than 0',
                        detail
                    });
                    isValid = false;
                    continue;
                }

                // Get product info for better error messages
                let productName = productId;
                try {
                    const product = await ProductsM.findById(productId);
                    if (product) {
                        productName = product.name || product.Name || productId;
                    }
                } catch (e) {
                    // Ignore if product not found, will be caught later
                }

                // Validate stock
                const stockValidation = await StockValidationS.validateStockInWarehouse(
                    productId,
                    warehouseId,
                    quantity
                );

                validationResults.push({
                    ...stockValidation,
                    productName,
                    productId,
                    warehouseId,
                    requestedQuantity: quantity
                });

                if (!stockValidation.isValid) {
                    isValid = false;
                }
            }

            return {
                isValid,
                results: validationResults,
                summary: {
                    total: validationResults.length,
                    valid: validationResults.filter(r => r.isValid).length,
                    invalid: validationResults.filter(r => !r.isValid).length,
                    errors: validationResults.filter(r => !r.isValid).map(r => ({
                        product: r.productName || r.productId,
                        warehouse: r.warehouseId,
                        requested: r.requestedQuantity,
                        available: r.available,
                        shortage: r.shortage,
                        error: r.error
                    }))
                }
            };
        } catch (error) {
            logger.error('Error validating sale order', { error: error.message, stack: error.stack });
            throw error;
        }
    },

    /**
     * Validate stock availability for a sale order (checking total stock across all warehouses)
     * This is used when warehouse is not specified or when checking overall availability
     */
    validateSaleOrderTotalStock: async (orderDetails) => {
        try {
            const validationResults = [];
            let isValid = true;

            for (const detail of orderDetails) {
                const productId = detail.productId || detail.product_id || detail.pid;
                const quantity = detail.number || detail.quantity || 0;

                if (!productId) {
                    validationResults.push({
                        isValid: false,
                        error: 'Product ID is required',
                        detail
                    });
                    isValid = false;
                    continue;
                }

                if (quantity <= 0) {
                    validationResults.push({
                        isValid: false,
                        error: 'Quantity must be greater than 0',
                        detail
                    });
                    isValid = false;
                    continue;
                }

                // Get total stock across all warehouses (pass null as warehouseId)
                const totalStock = await InventoryS.getCurrentStock(productId, null);

                // Get product info for better error messages
                let productName = productId;
                try {
                    const product = await ProductsM.findById(productId);
                    if (product) {
                        productName = product.name || product.Name || productId;
                    }
                } catch (e) {
                    // Ignore if product not found
                }

                validationResults.push({
                    isValid: totalStock >= quantity,
                    available: totalStock,
                    requested: quantity,
                    shortage: Math.max(0, quantity - totalStock),
                    productId,
                    productName,
                    requestedQuantity: quantity
                });

                if (totalStock < quantity) {
                    isValid = false;
                }
            }

            return {
                isValid,
                results: validationResults,
                summary: {
                    total: validationResults.length,
                    valid: validationResults.filter(r => r.isValid).length,
                    invalid: validationResults.filter(r => !r.isValid).length,
                    errors: validationResults.filter(r => !r.isValid).map(r => ({
                        product: r.productName || r.productId,
                        requested: r.requestedQuantity,
                        available: r.available,
                        shortage: r.shortage,
                        error: r.error
                    }))
                }
            };
        } catch (error) {
            logger.error('Error validating sale order total stock', { error: error.message, stack: error.stack });
            throw error;
        }
    },

    /**
     * Find a warehouse with sufficient stock for a product
     * Returns the first warehouse that has enough stock, or null if none found
     */
    findWarehouseWithStock: async (productId, requestedQuantity) => {
        try {
            const productDetails = await ProductDetailsM.findByProductId(productId);
            
            if (!productDetails || productDetails.length === 0) {
                logger.warn('No product details found for product', { productId });
                return null;
            }
            
            // Find first warehouse with sufficient stock
            for (const detail of productDetails) {
                const stock = detail.number || 0;
                const warehouseId = detail.wid || detail.warehouse_id || detail.warehouseId;
                if (stock >= requestedQuantity && warehouseId) {
                    logger.info('Found warehouse with sufficient stock', { productId, warehouseId, stock, requestedQuantity });
                    return warehouseId;
                }
            }
            
            // If no single warehouse has enough, return null (don't use partial stock)
            logger.warn('No warehouse found with sufficient stock', { productId, requestedQuantity, availableWarehouses: productDetails.map(pd => ({ wid: pd.wid || pd.warehouse_id, stock: pd.number || 0 })) });
            return null;
        } catch (error) {
            logger.error('Error finding warehouse with stock', { error: error.message, productId, requestedQuantity });
            return null;
        }
    },

    /**
     * Get available stock for multiple products in multiple warehouses
     * Useful for displaying stock info in UI
     */
    getStockInfo: async (productWarehousePairs) => {
        try {
            const stockInfo = [];

            for (const pair of productWarehousePairs) {
                const productId = pair.productId || pair.product_id || pair.pid;
                const warehouseId = pair.warehouseId || pair.warehouse_id || pair.wid;

                if (!productId || !warehouseId) {
                    continue;
                }

                const stock = await InventoryS.getCurrentStock(productId, warehouseId);
                
                // Get product and warehouse names
                let productName = productId;
                let warehouseName = warehouseId;
                try {
                    const product = await ProductsM.findById(productId);
                    if (product) {
                        productName = product.name || product.Name || productId;
                    }
                } catch (e) {
                    // Ignore
                }

                stockInfo.push({
                    productId,
                    productName,
                    warehouseId,
                    warehouseName,
                    availableStock: stock
                });
            }

            return stockInfo;
        } catch (error) {
            logger.error('Error getting stock info', { error: error.message });
            throw error;
        }
    }
};

module.exports = StockValidationS;


