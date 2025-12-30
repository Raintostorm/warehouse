const OrderDetailsM = require('../models/orderDetailsM');
const OrdersM = require('../models/ordersM');
const InventoryS = require('./inventoryS');
const ProductDetailsM = require('../models/productDetailsM');
const ProductsM = require('../models/productsM');
const SupplierImportHistoryM = require('../models/supplierImportHistoryM');
const StockValidationS = require('./stockValidationS');
const logger = require('../utils/logger');
const db = require('../db');

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
            // Merge quantity instead of throwing error
            const existingQuantity = existing.number || 0;
            const additionalQuantity = quantity;
            const newQuantity = existingQuantity + additionalQuantity;
            
            logger.info('Order detail already exists, merging quantities', { 
                orderId: orderDetailData.oid, 
                productId: orderDetailData.pid, 
                warehouseId,
                existingQuantity,
                additionalQuantity,
                newQuantity
            });
            
            // For sale orders, validate stock with new total quantity
            if (orderType === 'sale') {
                const StockValidationS = require('./stockValidationS');
                const stockValidation = await StockValidationS.validateStockInWarehouse(
                    productId,
                    warehouseId,
                    newQuantity // Validate với tổng quantity mới
                );

                if (!stockValidation.isValid) {
                    throw new Error(
                        `Insufficient stock for merged quantity. Available: ${stockValidation.available}, Requested: ${newQuantity} (existing: ${existingQuantity} + new: ${additionalQuantity})`
                    );
                }
            }
            
            // Update existing order detail with merged quantity
            const updatedDetail = await OrderDetailsM.update(
                orderDetailData.oid,
                orderDetailData.pid,
                warehouseId,
                { number: newQuantity }
            );
            
            // Update stock based on the additional quantity
            try {
                if (orderType === 'sale') {
                    // Reduce stock by additional quantity
                    const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                    const newStockQuantity = Math.max(0, previousQuantity - additionalQuantity);

                    const existingDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                    if (existingDetail) {
                        await ProductDetailsM.update(productId, warehouseId, { number: newStockQuantity });
                    } else {
                        logger.warn('Product detail not found after stock validation', { productId, warehouseId });
                        await ProductDetailsM.create({
                            pid: productId,
                            wid: warehouseId,
                            number: newStockQuantity,
                            note: 'Created from sale order merge'
                        });
                    }

                    // Note: recordStockChange and checkLowStock removed - tables don't exist
                } else if (orderType === 'import') {
                    // Increase stock by additional quantity
                    const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                    const newStockQuantity = previousQuantity + additionalQuantity;

                    const existingDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                    if (existingDetail) {
                        await ProductDetailsM.update(productId, warehouseId, { number: newStockQuantity });
                    } else {
                        await ProductDetailsM.create({
                            pid: productId,
                            wid: warehouseId,
                            number: newStockQuantity,
                            note: 'Created from import order merge'
                        });
                    }

                    // Note: recordStockChange and checkLowStock removed - tables don't exist
                }
            } catch (stockError) {
                // Check if error is from missing tables (expected behavior)
                const isTableNotExist = stockError.code === '42P01' || 
                                       stockError.message?.includes('does not exist') || 
                                       stockError.message?.includes('relation') ||
                                       stockError.message?.includes('stock_history') ||
                                       stockError.message?.includes('low_stock_alerts');
                
                if (!isTableNotExist) {
                    // Real error - log it
                    logger.error('Error updating stock after order detail merge', {
                        error: stockError.message,
                        orderDetailData,
                        orderType,
                        additionalQuantity
                    });
                    // Note: Order detail đã được update, nhưng stock chưa update
                    // Có thể cần rollback hoặc manual fix
                    throw new Error(`Failed to update stock after merging order detail: ${stockError.message}`);
                }
                // If table doesn't exist, silently continue - it's expected behavior
            }

            // Record in supplier import history - TÁCH RA NGOÀI try-catch của stock update
            // Để đảm bảo nó luôn được tạo dù stock history fail
            if (orderType === 'import') {
                const supplierId = order.supplier_id || order.supplierId;
                if (supplierId) {
                    try {
                        await SupplierImportHistoryM.create({
                            supplierId,
                            productId,
                            warehouseId,
                            orderId: orderDetailData.oid,
                            quantity: additionalQuantity,
                            importDate: order.date || new Date().toISOString().split('T')[0],
                            notes: `Merged quantity: ${additionalQuantity}`,
                            actor: orderDetailData.actor || order.actor || null
                        });
                    } catch (supplierHistoryError) {
                        // Log nhưng không throw - để order detail vẫn được tạo thành công
                        logger.error('Failed to create supplier import history', {
                            error: supplierHistoryError.message,
                            orderId: orderDetailData.oid,
                            supplierId,
                            productId,
                            warehouseId,
                            quantity: additionalQuantity
                        });
                    }
                }
            }
            
            return updatedDetail;
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

        // Wrap order detail creation and stock update in transaction
        const orderDetail = await db.withTransaction(async (client) => {
            // Create order detail using transaction client
            const orderDetailResult = await client.query(
                'INSERT INTO order_details (order_id, product_id, warehouse_id, number, note, actor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [
                    orderDetailData.oid || orderDetailData.order_id,
                    productId,
                    warehouseId,
                    quantity,
                    orderDetailData.note || null,
                    orderDetailData.actor || null
                ]
            );
            const createdOrderDetail = orderDetailResult.rows[0];

            // Handle stock changes based on order type
            if (orderType === 'sale') {
                // Reduce stock for sale orders
                const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                const newQuantity = Math.max(0, previousQuantity - quantity);

                // Update product_details using transaction client
                const existingDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                if (existingDetail) {
                    await client.query(
                        'UPDATE product_details SET number = $1, updated_at = CURRENT_DATE WHERE pid = $2 AND wid = $3',
                        [newQuantity, productId, warehouseId]
                    );
                } else {
                    logger.warn('Product detail not found after stock validation', { productId, warehouseId });
                    await client.query(
                        'INSERT INTO product_details (pid, wid, updated_at, number, note) VALUES ($1, $2, CURRENT_DATE, $3, $4)',
                        [productId, warehouseId, newQuantity, 'Created from sale order']
                    );
                }
            } else if (orderType === 'import') {
                // Increase stock for import orders
                const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                const newQuantity = previousQuantity + quantity;

                // Update product_details using transaction client
                const existingDetail = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                if (existingDetail) {
                    await client.query(
                        'UPDATE product_details SET number = $1, updated_at = CURRENT_DATE WHERE pid = $2 AND wid = $3',
                        [newQuantity, productId, warehouseId]
                    );
                } else {
                    await client.query(
                        'INSERT INTO product_details (pid, wid, updated_at, number, note) VALUES ($1, $2, CURRENT_DATE, $3, $4)',
                        [productId, warehouseId, newQuantity, 'Created from import order']
                    );
                }
            }

            return createdOrderDetail;
        });

        // Record in supplier import history - TÁCH RA NGOÀI try-catch của stock update
        // Để đảm bảo nó luôn được tạo dù stock history fail
        if (orderType === 'import') {
            const supplierId = order.supplier_id || order.supplierId;
            if (supplierId) {
                try {
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
                } catch (supplierHistoryError) {
                    // Log nhưng không throw - để order detail vẫn được tạo thành công
                    logger.error('Failed to create supplier import history', {
                        error: supplierHistoryError.message,
                        orderId: orderDetailData.oid,
                        supplierId,
                        productId,
                        warehouseId,
                        quantity
                    });
                }
            }
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

