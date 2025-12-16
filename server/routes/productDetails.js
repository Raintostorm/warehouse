const express = require('express');
const router = express.Router();

const ProductDetailsC = require('../controllers/productDetailsC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes
router.get('/', ProductDetailsC.getAllProductDetails);
router.get('/product/:pid', ProductDetailsC.getProductDetailsByProductId);
router.get('/warehouse/:wid', ProductDetailsC.getProductDetailsByWarehouseId);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), ProductDetailsC.createProductDetail);
router.put('/:pid/:wid', roleMiddleware('admin'), ProductDetailsC.updateProductDetail);
router.delete('/:pid/:wid', roleMiddleware('admin'), ProductDetailsC.deleteProductDetail);

module.exports = router;

