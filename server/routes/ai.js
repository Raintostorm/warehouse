const express = require('express');
const router = express.Router();
const AIC = require('../controllers/aiC');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Check AI status
router.get('/status', AIC.getStatus);

// Chat with AI
router.post('/chat', AIC.chat);

// Analyze data
router.post('/analyze', AIC.analyze);

module.exports = router;
