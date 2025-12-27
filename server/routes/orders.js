const express = require('express');
const router = express.Router();

const OrdersC = require('../controllers/ordersC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes - có thể cho phép nhiều roles xem
router.get('/', OrdersC.getAllOrders);
router.get('/:id', OrdersC.getOrderById);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), OrdersC.createOrder);
router.put('/:id', roleMiddleware('admin'), OrdersC.updateOrder);
router.delete('/:id', roleMiddleware('admin'), OrdersC.deleteOrder);

// Generate bill - có thể cho phép nhiều roles
router.post('/:id/generate-bill', OrdersC.generateBill);

// Stock validation endpoint (with warehouse)
router.post('/validate-stock', async (req, res) => {
    try {
        const StockValidationS = require('../services/stockValidationS');
        const { orderDetails } = req.body;

        if (!orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'orderDetails array is required',
                error: 'orderDetails must be a non-empty array'
            });
        }

        const validation = await StockValidationS.validateSaleOrder(orderDetails);
        
        return res.json({
            success: true,
            message: validation.isValid ? 'Stock validation passed' : 'Stock validation failed',
            data: validation
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to validate stock',
            error: error.message
        });
    }
});

// Stock validation endpoint (total stock across all warehouses)
router.post('/validate-stock-total', async (req, res) => {
    try {
        const StockValidationS = require('../services/stockValidationS');
        const { orderDetails } = req.body;

        if (!orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'orderDetails array is required',
                error: 'orderDetails must be a non-empty array'
            });
        }

        const validation = await StockValidationS.validateSaleOrderTotalStock(orderDetails);
        
        return res.json({
            success: true,
            message: validation.isValid ? 'Stock validation passed' : 'Stock validation failed',
            data: validation
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to validate stock',
            error: error.message
        });
    }
});

module.exports = router;