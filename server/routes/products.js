const express = require('express');
const router = express.Router();

const ProductsC = require('../controllers/productsC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes - có thể cho phép nhiều roles xem
router.get('/', ProductsC.getAllProducts);
router.get('/:id', ProductsC.getProductById);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), ProductsC.createProduct);
router.put('/:id', roleMiddleware('admin'), ProductsC.updateProduct);
router.delete('/:id', roleMiddleware('admin'), ProductsC.deleteProduct);

module.exports = router;