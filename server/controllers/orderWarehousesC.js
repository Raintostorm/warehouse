const OrderWarehousesS = require('../services/orderWarehousesS');

const OrderWarehousesC = {
    getAllOrderWarehouses: async (req, res) => {
        try {
            const orderWarehouses = await OrderWarehousesS.findAll();
            res.json({
                success: true,
                message: 'Order warehouses fetched successfully',
                data: orderWarehouses
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order warehouses',
                error: error.message
            });
        }
    },
    getOrderWarehousesByOrderId: async (req, res) => {
        try {
            const orderWarehouses = await OrderWarehousesS.findByOrderId(req.params.oid);
            res.json({
                success: true,
                message: 'Order warehouses fetched successfully',
                data: orderWarehouses
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order warehouses',
                error: error.message
            });
        }
    },
    getOrderWarehousesByWarehouseId: async (req, res) => {
        try {
            const orderWarehouses = await OrderWarehousesS.findByWarehouseId(req.params.wid);
            res.json({
                success: true,
                message: 'Order warehouses fetched successfully',
                data: orderWarehouses
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order warehouses',
                error: error.message
            });
        }
    },
    createOrderWarehouse: async (req, res) => {
        try {
            const orderWarehouse = await OrderWarehousesS.createOrderWarehouse(req.body);
            res.status(201).json({
                success: true,
                message: 'Order warehouse created successfully',
                data: orderWarehouse
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
                message: 'Failed to create order warehouse',
                error: error.message
            });
        }
    },
    updateOrderWarehouse: async (req, res) => {
        try {
            const { wid, oid } = req.params;
            const orderWarehouse = await OrderWarehousesS.updateOrderWarehouse(wid, oid, req.body);
            res.json({
                success: true,
                message: 'Order warehouse updated successfully',
                data: orderWarehouse
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Order warehouse not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update order warehouse',
                error: error.message
            });
        }
    },
    deleteOrderWarehouse: async (req, res) => {
        try {
            const { wid, oid } = req.params;
            const orderWarehouse = await OrderWarehousesS.deleteOrderWarehouse(wid, oid);
            res.json({
                success: true,
                message: 'Order warehouse deleted successfully',
                data: orderWarehouse
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Order warehouse not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to delete order warehouse',
                error: error.message
            });
        }
    }
};

module.exports = OrderWarehousesC;

