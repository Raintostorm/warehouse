const express = require('express');
const router = express.Router();

const AuthC = require('../controllers/authC');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginLimiter, AuthC.login);
router.get('/verify', AuthC.verify);
router.post('/google', AuthC.googleLogin);
router.post('/google/register', AuthC.googleRegister);
router.post('/forgot-password', AuthC.forgotPassword);
router.post('/reset-password', AuthC.resetPassword);
router.post('/fix-admin-role', require('../middlewares/authMiddleware'), AuthC.fixAdminRole);

module.exports = router;

