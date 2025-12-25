const express = require('express');
const router = express.Router();
const StatisticsC = require('../controllers/statisticsC');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET dashboard statistics
router.get('/dashboard', StatisticsC.getDashboardStats);

// Advanced Analytics Routes
router.get('/sales-trends', StatisticsC.getSalesTrends);
router.get('/product-performance', StatisticsC.getProductPerformance);
router.get('/warehouse-utilization', StatisticsC.getWarehouseUtilization);
router.get('/revenue-by-period', StatisticsC.getRevenueByPeriod);
router.get('/inventory-turnover', StatisticsC.getInventoryTurnover);
router.get('/customer-analytics', StatisticsC.getCustomerAnalytics);
router.get('/supplier-analytics', StatisticsC.getSupplierAnalytics);

module.exports = router;

