const OrdersS = require('../services/ordersS');
// Generate bill functionality removed - bills module disabled
// const generateBillS = require('../services/generateBillS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');
const logger = require('../utils/logger');

const OrdersC = {
    getAllOrders: async (req, res) => {
        try {
            const orders = await OrdersS.findAll();
            return sendSuccess(res, orders, 'Orders fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch orders');
        }
    },

    getOrderById: async (req, res) => {
        try {
            const order = await OrdersS.findById(req.params.id);
            return sendSuccess(res, order, 'Order fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch order');
        }
    },

    createOrder: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const orderData = {
                ...req.body,
                actor: actorInfo
            };

            // Validate order type requirements
            const orderType = (orderData.type || '').toLowerCase();
            if (orderType === 'sale') {
                if (!orderData.customerName && !orderData.customer_name) {
                    return sendError(res, new Error('Sale orders require customer_name'), 'Validation failed', 400);
                }

                // Validate stock availability before creating order
                // For sale orders, check total stock across all warehouses
                // If order_details are provided, validate them
                if (orderData.orderDetails && Array.isArray(orderData.orderDetails) && orderData.orderDetails.length > 0) {
                    const StockValidationS = require('../services/stockValidationS');
                    // Use validateSaleOrderTotalStock to check total stock, not specific warehouse
                    const validation = await StockValidationS.validateSaleOrderTotalStock(orderData.orderDetails);

                    if (!validation.isValid) {
                        return sendError(
                            res,
                            new Error('Insufficient stock for one or more products'),
                            'Stock validation failed',
                            400,
                            { validation: validation.summary }
                        );
                    }
                }
            } else if (orderType === 'import') {
                if (!orderData.supplierId && !orderData.supplier_id) {
                    return sendError(res, new Error('Import orders require supplier_id'), 'Validation failed', 400);
                }
            }

            const order = await OrdersS.createOrder(orderData);

            // Log audit
            await auditLogger({
                tableName: 'orders',
                recordId: order.id || order.Id,
                action: 'CREATE',
                actor: actorInfo,
                newData: order,
                req
            });

            // Create notification for new order (non-blocking)
            try {
                const NotificationsS = require('../services/notificationsS');
                await NotificationsS.notifyNewOrder(order);
            } catch (notifError) {
                logger.error('Failed to create notification', { error: notifError.message, stack: notifError.stack });
            }

            return sendSuccess(res, order, 'Order created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create order');
        }
    },

    updateOrder: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before update
            const oldOrder = await OrdersS.findById(req.params.id);

            const orderData = {
                ...req.body,
                actor: actorInfo
            };
            const order = await OrdersS.updateOrder(req.params.id, orderData);

            // Log audit
            await auditLogger({
                tableName: 'orders',
                recordId: order.id || order.Id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldOrder,
                newData: order,
                req
            });

            return sendSuccess(res, order, 'Order updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update order');
        }
    },

    deleteOrder: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before delete
            const oldOrder = await OrdersS.findById(req.params.id);

            const order = await OrdersS.deleteOrder(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'orders',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldOrder,
                req
            });

            return sendSuccess(res, order, 'Order deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete order');
        }
    }
    // Generate bill functionality removed - bills module disabled
    // generateBill: async (req, res) => { ... }
};

module.exports = OrdersC;

