const express = require('express');
const router = express.Router();

const ReportC = require('../controllers/reportC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication và admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Generate Revenue Report
router.get('/revenue', ReportC.generateRevenueReport);

// Generate Inventory Report
router.get('/inventory', ReportC.generateInventoryReport);

// Generate Orders Report
router.get('/orders', ReportC.generateOrdersReport);

module.exports = router;

