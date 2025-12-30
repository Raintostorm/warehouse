const express = require('express');
const router = express.Router();
const PaymentsC = require('../controllers/paymentsC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Gateway callbacks (NO AUTH REQUIRED - called by payment gateways)
// These MUST be defined BEFORE authMiddleware to avoid authentication
router.get('/gateway/vnpay/callback', PaymentsC.handleVNPayCallback);
router.get('/gateway/vnpay/ipn', PaymentsC.handleVNPayIPN);
router.get('/gateway/momo/callback', PaymentsC.handleMoMoCallback);
router.post('/gateway/momo/ipn', PaymentsC.handleMoMoIPN);
router.get('/gateway/zalopay/callback', PaymentsC.handleZaloPayCallback);
router.post('/gateway/zalopay/ipn', PaymentsC.handleZaloPayIPN);

// All other routes require authentication
router.use(authMiddleware);

// Get all payments (admin only)
router.get('/', roleMiddleware('admin'), PaymentsC.getAllPayments);

// Get payment by ID
router.get('/:id', PaymentsC.getPaymentById);

// Get payments by order ID
router.get('/order/:orderId', PaymentsC.getPaymentsByOrderId);

// Get order payment summary
router.get('/order/:orderId/summary', PaymentsC.getOrderPaymentSummary);

// Get unpaid sale orders
router.get('/orders/unpaid', PaymentsC.getUnpaidSaleOrders);

// Create payment (admin only) - with rate limiting
router.post('/', apiLimiter, roleMiddleware('admin'), PaymentsC.createPayment);

// Update payment (admin only)
router.put('/:id', roleMiddleware('admin'), PaymentsC.updatePayment);

// Delete payment (admin only)
router.delete('/:id', roleMiddleware('admin'), PaymentsC.deletePayment);

// Payment Gateway Routes (requires auth) - with rate limiting
// Initiate gateway payment
router.post('/gateway/initiate', apiLimiter, PaymentsC.initiateGatewayPayment);

// Get gateway status
router.get('/gateway/status', PaymentsC.getGatewayStatus);

module.exports = router;
