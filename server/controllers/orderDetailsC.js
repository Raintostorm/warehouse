const OrderDetailsS = require('../services/orderDetailsS');

const OrderDetailsC = {
    getAllOrderDetails: async (req, res) => {
        try {
            const orderDetails = await OrderDetailsS.findAll();
            res.json({
                success: true,
                message: 'Order details fetched successfully',
                data: orderDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order details',
                error: error.message
            });
        }
    },
    getOrderDetailsByOrderId: async (req, res) => {
        try {
            const orderDetails = await OrderDetailsS.findByOrderId(req.params.oid);
            res.json({
                success: true,
                message: 'Order details fetched successfully',
                data: orderDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order details',
                error: error.message
            });
        }
    },
    getOrderDetailsByProductId: async (req, res) => {
        try {
            const orderDetails = await OrderDetailsS.findByProductId(req.params.pid);
            res.json({
                success: true,
                message: 'Order details fetched successfully',
                data: orderDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order details',
                error: error.message
            });
        }
    },
    createOrderDetail: async (req, res) => {
        try {
            const orderDetail = await OrderDetailsS.createOrderDetail(req.body);
            
            // Record stock OUT in inventory history (non-blocking)
            try {
                const InventoryS = require('../services/inventoryS');
                const ProductDetailsM = require('../models/productDetailsM');
                const getActor = require('../utils/getActor');
                
                // Get order to check type (only OUT orders reduce stock)
                const OrdersM = require('../models/ordersM');
                const order = await OrdersM.findById(orderDetail.order_id || orderDetail.orderId);
                
                if (order && (order.type === 'OUT' || order.type === 'out')) {
                    // Get current stock before reduction
                    const productId = orderDetail.product_id || orderDetail.productId;
                    const quantity = orderDetail.number || 0;
                    
                    // Try to get warehouse from order_warehouses or use null for global
                    let warehouseId = null;
                    try {
                        const OrderWarehousesM = require('../models/orderWarehousesM');
                        const orderWarehouses = await OrderWarehousesM.findByOrderId(order.id || order.Id);
                        if (orderWarehouses && orderWarehouses.length > 0) {
                            warehouseId = orderWarehouses[0].wid || orderWarehouses[0].warehouseId;
                        }
                    } catch (e) {
                        // Ignore if order_warehouses doesn't exist or has no data
                    }
                    
                    const previousQuantity = await InventoryS.getCurrentStock(productId, warehouseId);
                    const newQuantity = Math.max(0, previousQuantity - quantity);
                    
                    await InventoryS.recordStockChange({
                        productId,
                        warehouseId,
                        transactionType: 'OUT',
                        quantity: -quantity,
                        previousQuantity,
                        newQuantity,
                        referenceId: order.id || order.Id,
                        referenceType: 'order',
                        notes: `Order ${order.id || order.Id} - ${orderDetail.note || ''}`
                    });
                    
                    // Update actual stock
                    if (warehouseId) {
                        const existing = await ProductDetailsM.findByProductAndWarehouse(productId, warehouseId);
                        if (existing) {
                            await ProductDetailsM.update(productId, warehouseId, { number: newQuantity });
                        }
                    } else {
                        const ProductsM = require('../models/productsM');
                        await ProductsM.update(productId, { number: newQuantity });
                    }
                    
                    // Check for low stock
                    await InventoryS.checkLowStock(productId, warehouseId);
                }
            } catch (invError) {
                // Log but don't fail the request
                console.error('Failed to record inventory change for order detail:', invError);
            }
            
            res.status(201).json({
                success: true,
                message: 'Order detail created successfully',
                data: orderDetail
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('already exists')) {
                statusCode = 409;
            } else if (error.message.includes('Missing required fields')) {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to create order detail',
                error: error.message
            });
        }
    },
    updateOrderDetail: async (req, res) => {
        try {
            const { oid, pid } = req.params;
            const orderDetail = await OrderDetailsS.updateOrderDetail(oid, pid, req.body);
            res.json({
                success: true,
                message: 'Order detail updated successfully',
                data: orderDetail
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Order detail not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update order detail',
                error: error.message
            });
        }
    },
    deleteOrderDetail: async (req, res) => {
        try {
            const { oid, pid } = req.params;
            const orderDetail = await OrderDetailsS.deleteOrderDetail(oid, pid);
            res.json({
                success: true,
                message: 'Order detail deleted successfully',
                data: orderDetail
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Order detail not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to delete order detail',
                error: error.message
            });
        }
    }
};

module.exports = OrderDetailsC;

