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

module.exports = router;