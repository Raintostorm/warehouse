const express = require('express');
const router = express.Router();

const WarehouseManagementC = require('../controllers/warehouseManagementC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes
router.get('/', WarehouseManagementC.getAllWarehouseManagements);
router.get('/warehouse/:wid', WarehouseManagementC.getWarehouseManagementsByWarehouseId);
router.get('/user/:uid', WarehouseManagementC.getWarehouseManagementsByUserId);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), WarehouseManagementC.createWarehouseManagement);
router.put('/:wid/:uid', roleMiddleware('admin'), WarehouseManagementC.updateWarehouseManagement);
router.delete('/:wid/:uid', roleMiddleware('admin'), WarehouseManagementC.deleteWarehouseManagement);

module.exports = router;

