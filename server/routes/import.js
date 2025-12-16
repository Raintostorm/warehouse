const express = require('express');
const router = express.Router();
const ImportC = require('../controllers/importC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { importLimiter } = require('../middlewares/rateLimiter');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Import route - chỉ admin mới có quyền import
router.post('/:table', roleMiddleware('admin'), ImportC.upload, importLimiter, ImportC.importData);

module.exports = router;

