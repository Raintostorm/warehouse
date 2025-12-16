const express = require('express');
const router = express.Router();
const ExportC = require('../controllers/exportC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { exportLimiter } = require('../middlewares/rateLimiter');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Export routes - chỉ admin mới có quyền export
router.get('/excel/:table', roleMiddleware('admin'), exportLimiter, ExportC.exportToExcel);
router.get('/csv/:table', roleMiddleware('admin'), exportLimiter, ExportC.exportToCSV);

module.exports = router;

