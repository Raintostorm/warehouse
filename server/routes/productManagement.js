const express = require('express');
const router = express.Router();

const ProductManagementC = require('../controllers/productManagementC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes
router.get('/', ProductManagementC.getAllProductManagements);
router.get('/product/:pid', ProductManagementC.getProductManagementsByProductId);
router.get('/user/:uid', ProductManagementC.getProductManagementsByUserId);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), ProductManagementC.createProductManagement);
router.put('/:pid/:uid', roleMiddleware('admin'), ProductManagementC.updateProductManagement);
router.delete('/:pid/:uid', roleMiddleware('admin'), ProductManagementC.deleteProductManagement);

module.exports = router;

