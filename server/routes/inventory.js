const express = require('express');
const router = express.Router();
const InventoryC = require('../controllers/inventoryC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get stock history
router.get('/history', InventoryC.getStockHistory);

// Get current stock for a product
router.get('/stock/:productId', InventoryC.getCurrentStock);

// Get stock summary for a product
router.get('/summary/:productId', InventoryC.getStockSummary);

// Check low stock for a product
router.get('/low-stock/:productId', InventoryC.checkLowStock);

// Adjust stock (admin only)
router.post('/adjust/:productId', roleMiddleware(['admin']), InventoryC.adjustStock);

// Transfer stock (admin only)
router.post('/transfer', roleMiddleware(['admin']), InventoryC.transferStock);

module.exports = router;

