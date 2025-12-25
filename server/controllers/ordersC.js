const OrdersS = require('../services/ordersS');
const generateBillS = require('../services/generateBillS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

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
                console.error('Failed to create notification:', notifError);
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
    },
    generateBill: async (req, res) => {
        try {
            const { id } = req.params;
            const { orderIds, productIds } = req.body; // Support multiple orderIds or single id

            // Support both single orderId (from params) and multiple orderIds (from body)
            const ordersToProcess = orderIds && orderIds.length > 0 ? orderIds : [id];

            const doc = await generateBillS.generateBill(ordersToProcess, productIds, req);

            // Set headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            const filename = ordersToProcess.length === 1
                ? `bill-${ordersToProcess[0]}-${Date.now()}.pdf`
                : `bill-${ordersToProcess.join('-')}-${Date.now()}.pdf`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Pipe PDF to response
            doc.pipe(res);
            doc.end();
        } catch (error) {
            return sendError(res, error, 'Failed to generate bill');
        }
    }
};

module.exports = OrdersC;

