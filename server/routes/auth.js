const express = require('express');
const router = express.Router();

const AuthC = require('../controllers/authC');
const { loginLimiter } = require('../middlewares/rateLimiter');

// Route để reset rate limit (chỉ trong development)
// NODE_ENV có thể undefined (default là development)
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
if (isDevelopment) {
    router.post('/reset-rate-limit', (req, res) => {
        res.json({
            success: true,
            message: 'Rate limit đã được disable trong development mode. Bạn có thể login ngay.',
            note: 'Rate limit đã tạm thời disable để debug.'
        });
    });

    // Route để xem rate limit status
    router.get('/rate-limit-status', (req, res) => {
        res.json({
            success: true,
            data: {
                mode: 'development',
                disabled: true,
                note: 'Rate limit đã được disable trong development để debug login issue'
            }
        });
    });
}

// Apply rate limiter (đã được disable trong development)
router.post('/login', loginLimiter, AuthC.login);
router.get('/verify', AuthC.verify);
router.post('/google', AuthC.googleLogin);
router.post('/google/register', AuthC.googleRegister);
router.post('/forgot-password', AuthC.forgotPassword);
router.post('/reset-password', AuthC.resetPassword);
router.post('/fix-admin-role', require('../middlewares/authMiddleware'), AuthC.fixAdminRole);

module.exports = router;

