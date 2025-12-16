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

