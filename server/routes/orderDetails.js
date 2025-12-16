const express = require('express');
const router = express.Router();

const OrderDetailsC = require('../controllers/orderDetailsC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes
router.get('/', OrderDetailsC.getAllOrderDetails);
router.get('/order/:oid', OrderDetailsC.getOrderDetailsByOrderId);
router.get('/product/:pid', OrderDetailsC.getOrderDetailsByProductId);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), OrderDetailsC.createOrderDetail);
router.put('/:oid/:pid', roleMiddleware('admin'), OrderDetailsC.updateOrderDetail);
router.delete('/:oid/:pid', roleMiddleware('admin'), OrderDetailsC.deleteOrderDetail);

module.exports = router;

