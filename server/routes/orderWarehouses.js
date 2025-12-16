const express = require('express');
const router = express.Router();

const OrderWarehousesC = require('../controllers/orderWarehousesC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes
router.get('/', OrderWarehousesC.getAllOrderWarehouses);
router.get('/order/:oid', OrderWarehousesC.getOrderWarehousesByOrderId);
router.get('/warehouse/:wid', OrderWarehousesC.getOrderWarehousesByWarehouseId);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), OrderWarehousesC.createOrderWarehouse);
router.put('/:wid/:oid', roleMiddleware('admin'), OrderWarehousesC.updateOrderWarehouse);
router.delete('/:wid/:oid', roleMiddleware('admin'), OrderWarehousesC.deleteOrderWarehouse);

module.exports = router;

