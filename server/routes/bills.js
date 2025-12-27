const express = require('express');
const router = express.Router();
const BillsC = require('../controllers/billsC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all bills
router.get('/', BillsC.getAllBills);

// Get unpaid bills (for payment creation)
router.get('/unpaid', BillsC.getUnpaidBills);

// Get bill by ID
router.get('/:id', BillsC.getBillById);

// Get bills by order ID
router.get('/order/:orderId', BillsC.getBillsByOrderId);

// Get orders by bill ID
router.get('/:id/orders', BillsC.getOrdersByBillId);

// Get all order IDs that are in bills (for filtering)
router.get('/orders/in-bills', BillsC.getOrdersInBills);

// Create bill (admin only)
router.post('/', roleMiddleware(['admin']), BillsC.createBill);

// Update bill (admin only)
router.put('/:id', roleMiddleware(['admin']), BillsC.updateBill);

// Delete bill (admin only)
router.delete('/:id', roleMiddleware(['admin']), BillsC.deleteBill);

module.exports = router;

