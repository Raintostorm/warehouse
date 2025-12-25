const express = require('express');
const router = express.Router();
const ChatbotC = require('../controllers/chatbotC');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Chat with custom chatbot
router.post('/chat', ChatbotC.chat);

// Get chatbot status
router.get('/status', ChatbotC.getStatus);

// Get available actions
router.get('/actions', ChatbotC.getActions);

module.exports = router;

