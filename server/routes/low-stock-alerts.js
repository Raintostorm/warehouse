const express = require('express');
const router = express.Router();
const LowStockAlertsC = require('../controllers/lowStockAlertsC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all alerts (with filters)
router.get('/', LowStockAlertsC.getAllAlerts);

// Get active alerts only
router.get('/active', LowStockAlertsC.getActiveAlerts);

// Check and create alerts (admin only)
router.post('/check', roleMiddleware(['admin']), LowStockAlertsC.checkAndCreateAlerts);

// Auto-resolve alerts (admin only)
router.post('/auto-resolve', roleMiddleware(['admin']), LowStockAlertsC.autoResolveAlerts);

// Get alert by ID
router.get('/:id', LowStockAlertsC.getAlertById);

// Get alerts by product ID
router.get('/product/:productId', LowStockAlertsC.getAlertsByProduct);

// Get alerts by warehouse ID
router.get('/warehouse/:warehouseId', LowStockAlertsC.getAlertsByWarehouse);

// Resolve alert (admin only)
router.post('/:id/resolve', roleMiddleware(['admin']), LowStockAlertsC.resolveAlert);

// Delete alert (admin only)
router.delete('/:id', roleMiddleware(['admin']), LowStockAlertsC.deleteAlert);

module.exports = router;

