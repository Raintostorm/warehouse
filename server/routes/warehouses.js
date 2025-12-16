const express = require('express');
const router = express.Router();

const WarehousesC = require('../controllers/warehousesC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes - có thể cho phép nhiều roles xem
router.get('/', WarehousesC.getAllWarehouses);
router.get('/:id', WarehousesC.getWarehouseById);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), WarehousesC.createWarehouse);
router.put('/:id', roleMiddleware('admin'), WarehousesC.updateWarehouse);
router.delete('/:id', roleMiddleware('admin'), WarehousesC.deleteWarehouse);

module.exports = router;
