const OrderDetailsM = require('../models/orderDetailsM');
const OrdersM = require('../models/ordersM');
const InventoryS = require('./inventoryS');
const ProductDetailsM = require('../models/productDetailsM');
const ProductsM = require('../models/productsM');
const SupplierImportHistoryM = require('../models/supplierImportHistoryM');
const StockValidationS = require('./stockValidationS');
const logger = require('../utils/logger');

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

        // Get order to determine type first
        const order = await OrdersM.findById(orderDetailData.oid);
        if (!order) {
            throw new Error('Order not found');
        }

        const orderType = (order.type || '').toLowerCase();
        const productId = orderDetailData.pid || orderDetailData.product_id || orderDetailData.productId;
        const quantity = orderDetailData.number || orderDetailData.quantity || 0;

        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }

        // Get warehouse_id - for sale orders, try to find one with stock if not provided
        let warehouseId = orderDetailData.wid || orderDetailData.warehouse_id || orderDetailData.warehouseId;
        
        // For sale orders, if warehouseId is not provided, try to find one with sufficient stock
        if (!warehouseId && orderType === 'sale') {
            const StockValidationS = require('./stockValidationS');
            // First check if there's already an order detail for this order and product
            // If exists, we might want to update it or find a different warehouse
            const existingWithoutWarehouse = await OrderDetailsM.findByOrderAndProduct(
                orderDetailData.oid,
                productId,
                null // Check without warehouse
            );
            
            if (existingWithoutWarehouse) {
                // If order detail already exists, use its warehouse or find another one
                const existingWarehouseId = existingWithoutWarehouse.warehouse_id || existingWithoutWarehouse.wid;
                // Check if existing warehouse still has stock
                const existingStock = await InventoryS.getCurrentStock(productId, existingWarehouseId);
                if (existingStock >= quantity) {
                    warehouseId = existingWarehouseId;
                    logger.info('Using existing warehouse from order detail', { orderId: orderDetailData.oid, productId, warehouseId });
                } else {
                    // Existing warehouse doesn't have enough stock, find another one
                    warehouseId = await StockValidationS.findWarehouseWithStock(productId, quantity);
                    if (!warehouseId) {
                        throw new Error(`No warehouse found with sufficient stock for product ${productId}. Existing order detail uses warehouse ${existingWarehouseId} which has insufficient stock.`);
                    }
                    logger.info('Found different warehouse with stock', { orderId: orderDetailData.oid, productId, oldWarehouse: existingWarehouseId, newWarehouse: warehouseId });
                }
            } else {
                // No existing order detail, find warehouse with stock
                // Try to find warehouse that doesn't already have an order detail for this order/product
                const productDetails = await ProductDetailsM.findByProductId(productId);
                let foundWarehouse = false;
                
                // Sort by stock descending to prefer warehouses with more stock
                const sortedDetails = productDetails.sort((a, b) => (b.number || 0) - (a.number || 0));
                
                for (const detail of sortedDetails) {
                    const candidateWarehouseId = detail.wid || detail.warehouse_id || detail.warehouseId;
                    const stock = detail.number || 0;
                    
                    if (stock >= quantity && candidateWarehouseId) {
                        // Check if this warehouse already has an order detail for this order/product
                        const existingForWarehouse = await OrderDetailsM.findByOrderAndProduct(
                            orderDetailData.oid,
                            productId,
                            candidateWarehouseId
                        );
                        
                        if (!existingForWarehouse) {
                            warehouseId = candidateWarehouseId;
                            foundWarehouse = true;
                            logger.info('Found warehouse with stock for new order detail', { orderId: orderDetailData.oid, productId, warehouseId, stock });
                            break;
                        }
                    }
                }
                
                if (!foundWarehouse) {
                    // Fallback: use findWarehouseWithStock (might return warehouse with existing order detail)
                    warehouseId = await StockValidationS.findWarehouseWithStock(productId, quantity);
                    if (!warehouseId) {
                        throw new Error(`No warehouse found with sufficient stock for product ${productId}`);
                    }
                    logger.warn('Using warehouse that might have existing order detail', { orderId: orderDetailData.oid, productId, warehouseId });
                }
            }
        } else if (!warehouseId) {
            throw new Error('Missing required field: warehouse_id');
        }

        // Check if order detail already exists for this order, product, and warehouse
        const existing = await OrderDetailsM.findByOrderAndProduct(
            orderDetailData.oid, 
            orderDetailData.pid, 
            warehouseId
        );
        if (existing) {
            // For sale orders, if we just found this warehouse and order detail exists,
            // it means we're trying to create duplicate. Throw error with more info.
            logger.warn('Order detail already exists', { 
                orderId: orderDetailData.oid, 
                productId: orderDetailData.pid, 
                warehouseId,
                existingDetail: existing
            });
            throw new Error(`Order detail already exists for order ${orderDetailData.oid}, product ${productId}, and warehouse ${warehouseId}. Use update instead.`);
        }

        // For sale orders: validate stock before creating detail
        if (orderType === 'sale') {
            const StockValidationS = require('./stockValidationS');
            const stockValidation = await StockValidationS.validateStockInWarehouse(
                productId,
                warehouseId,
                quantity
            );

            if (!stockValidation.isValid) {
                throw new Error(
                    `Insufficient stock. Available: ${stockValidation.available}, Requested: ${stockValidation.requested}`
                );
            }
        }

        // Create order detail
        const orderDetail = await OrderDetailsM.create({
            ...orderDetailData,
            wid: warehouseId,
            warehouse_id: warehouseId,
            warehouseId: warehouseId
        });

        // Handle stock changes based on order type
        try {
            if (orderType === 'sale') {
                // Reduce stock for sale orders
                const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                const newQuantity = Math.max(0, previousQuantity - quantity);

                // Update product_details
                const existingDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                if (existingDetail) {
                    await ProductDetailsM.update(productId, warehouseId, { number: newQuantity });
                } else {
                    // Should not happen if validation passed, but handle it
                    logger.warn('Product detail not found after stock validation', { productId, warehouseId });
                    await ProductDetailsM.create({
                        pid: productId,
                        wid: warehouseId,
                        number: newQuantity,
                        note: 'Created from sale order'
                    });
                }

                // Record in stock history
                await InventoryS.recordStockChange({
                    productId,
                    warehouseId,
                    transactionType: 'OUT',
                    quantity: -quantity,
                    previousQuantity,
                    newQuantity,
                    referenceId: orderDetailData.oid,
                    referenceType: 'order',
                    notes: `Sale order ${orderDetailData.oid} - ${orderDetail.note || ''}`
                });

                // Check for low stock alerts
                await InventoryS.checkLowStock(productId, warehouseId);
            } else if (orderType === 'import') {
                // Increase stock for import orders
                const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                const newQuantity = previousQuantity + quantity;

                // Update product_details
                const existingDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                if (existingDetail) {
                    await ProductDetailsM.update(productId, warehouseId, { number: newQuantity });
                } else {
                    await ProductDetailsM.create({
                        pid: productId,
                        wid: warehouseId,
                        number: newQuantity,
                        note: 'Created from import order'
                    });
                }

                // Record in stock history
                await InventoryS.recordStockChange({
                    productId,
                    warehouseId,
                    transactionType: 'IN',
                    quantity: quantity,
                    previousQuantity,
                    newQuantity,
                    referenceId: orderDetailData.oid,
                    referenceType: 'order',
                    notes: `Import order ${orderDetailData.oid} - ${orderDetail.note || ''}`
                });

                // Record in supplier import history
                const supplierId = order.supplier_id || order.supplierId;
                if (supplierId) {
                    await SupplierImportHistoryM.create({
                        supplierId,
                        productId,
                        warehouseId,
                        orderId: orderDetailData.oid,
                        quantity,
                        importDate: order.date || new Date().toISOString().split('T')[0],
                        notes: orderDetail.note || null,
                        actor: orderDetail.actor || order.actor || null
                    });
                }

                // Check for low stock alerts
                await InventoryS.checkLowStock(productId, warehouseId);
            }
        } catch (stockError) {
            // Log error but don't fail the order detail creation
            // The order detail is already created, so we need to handle this carefully
            logger.error('Error updating stock after order detail creation', {
                error: stockError.message,
                orderDetailData,
                orderType
            });
            // Note: In production, you might want to rollback the order detail creation
            // For now, we'll log and continue
        }

        return orderDetail;
    },
    updateOrderDetail: async (oid, pid, wid, orderDetailData) => {
        const warehouseId = wid || orderDetailData.wid || orderDetailData.warehouse_id || orderDetailData.warehouseId;
        if (!warehouseId) {
            throw new Error('warehouse_id is required for update');
        }

        const existing = await OrderDetailsM.findByOrderAndProduct(oid, pid, warehouseId);
        if (!existing) {
            throw new Error('Order detail not found');
        }
        return await OrderDetailsM.update(oid, pid, warehouseId, orderDetailData);
    },
    deleteOrderDetail: async (oid, pid, wid = null) => {
        const existing = wid 
            ? await OrderDetailsM.findByOrderAndProduct(oid, pid, wid)
            : await OrderDetailsM.findByOrderAndProduct(oid, pid);
        if (!existing) {
            throw new Error('Order detail not found');
        }
        return await OrderDetailsM.delete(oid, pid, wid);
    }
};

module.exports = OrderDetailsS;

