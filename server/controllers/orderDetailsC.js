const OrderDetailsS = require('../services/orderDetailsS');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const OrderDetailsC = {
    getAllOrderDetails: async (req, res) => {
        try {
            const orderDetails = await OrderDetailsS.findAll();
            return sendSuccess(res, orderDetails, 'Order details fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch order details');
        }
    },
    getOrderDetailsByOrderId: async (req, res) => {
        try {
            const orderDetails = await OrderDetailsS.findByOrderId(req.params.oid);
            return sendSuccess(res, orderDetails, 'Order details fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch order details');
        }
    },
    getOrderDetailsByProductId: async (req, res) => {
        try {
            const orderDetails = await OrderDetailsS.findByProductId(req.params.pid);
            return sendSuccess(res, orderDetails, 'Order details fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch order details');
        }
    },
    createOrderDetail: async (req, res) => {
        try {
            // Don't require warehouse_id here - service will handle it
            // For sale orders, service will automatically find warehouse with stock
            // For import/export orders, service will throw error if missing

            const orderDetail = await OrderDetailsS.createOrderDetail(req.body);
            
            // Stock changes are now handled in OrderDetailsS.createOrderDetail()
            // No need for duplicate logic here
            
            return sendSuccess(res, orderDetail, 'Order detail created successfully', 201);
        } catch (error) {
            // sendError will automatically determine status code based on error message
            return sendError(res, error, 'Failed to create order detail');
        }
    },
    updateOrderDetail: async (req, res) => {
        try {
            const { oid, pid } = req.params;
            const wid = req.params.wid || req.body.wid || req.body.warehouse_id || req.body.warehouseId;
            
            if (!wid) {
                return sendError(res, new Error('warehouse_id is required for updating order details'), 'Missing required field: warehouse_id', 400);
            }

            const orderDetail = await OrderDetailsS.updateOrderDetail(oid, pid, wid, req.body);
            return sendSuccess(res, orderDetail, 'Order detail updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update order detail');
        }
    },
    deleteOrderDetail: async (req, res) => {
        try {
            const { oid, pid } = req.params;
            const wid = req.params.wid || req.body.wid || req.body.warehouse_id || req.body.warehouseId;
            const orderDetail = await OrderDetailsS.deleteOrderDetail(oid, pid, wid);
            return sendSuccess(res, orderDetail, 'Order detail deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete order detail');
        }
    }
};

module.exports = OrderDetailsC;

