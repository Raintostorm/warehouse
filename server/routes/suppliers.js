const express = require('express');
const router = express.Router();

const SuppliersC = require('../controllers/suppliersC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes - có thể cho phép nhiều roles xem
router.get('/', SuppliersC.getAllSuppliers);
router.get('/:id', SuppliersC.getSupplierById);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), SuppliersC.createSupplier);
router.put('/:id', roleMiddleware('admin'), SuppliersC.updateSupplier);
router.delete('/:id', roleMiddleware('admin'), SuppliersC.deleteSupplier);

module.exports = router;

