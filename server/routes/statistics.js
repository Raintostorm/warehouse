const express = require('express');
const router = express.Router();
const StatisticsC = require('../controllers/statisticsC');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET dashboard statistics
router.get('/dashboard', StatisticsC.getDashboardStats);

module.exports = router;

