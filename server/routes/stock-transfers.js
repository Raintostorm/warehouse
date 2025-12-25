const express = require('express');
const router = express.Router();
const StockTransfersC = require('../controllers/stockTransfersC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all transfers
router.get('/', StockTransfersC.getAllTransfers);

// Get transfer by ID
router.get('/:id', StockTransfersC.getTransferById);

// Create transfer (admin only)
router.post('/', roleMiddleware(['admin']), StockTransfersC.createTransfer);

// Update transfer (admin only)
router.put('/:id', roleMiddleware(['admin']), StockTransfersC.updateTransfer);

// Approve transfer (admin only)
router.post('/:id/approve', roleMiddleware(['admin']), StockTransfersC.approveTransfer);

// Cancel transfer (admin only)
router.post('/:id/cancel', roleMiddleware(['admin']), StockTransfersC.cancelTransfer);

// Delete transfer (admin only)
router.delete('/:id', roleMiddleware(['admin']), StockTransfersC.deleteTransfer);

module.exports = router;

