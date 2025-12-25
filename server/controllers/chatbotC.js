const ChatbotS = require('../services/chatbotS');
const logger = require('../utils/logger');

const ChatbotC = {
    /**
     * Chat with custom chatbot
     * POST /api/chatbot/chat
     */
    chat: async (req, res) => {
        try {
            const { message, conversationHistory = [] } = req.body;
            const user = req.user;

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            // Validate conversation history format
            if (!Array.isArray(conversationHistory)) {
                return res.status(400).json({
                    success: false,
                    message: 'conversationHistory must be an array'
                });
            }

            const response = await ChatbotS.processMessage(
                message.trim(),
                user,
                conversationHistory
            );

            if (response.success) {
                res.json({
                    success: true,
                    data: {
                        message: response.message,
                        type: response.type || 'query',
                        action: response.action,
                        data: response.data,
                        count: response.count,
                        method: response.method || 'rule-based',
                        confidence: response.confidence,
                        ...(response.status && { status: response.status, statusText: response.statusText })
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: response.message,
                    error: response.error
                });
            }
        } catch (error) {
            logger.error('Error in chatbot chat', {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                userId: req.user?.id || req.user?.Id
            });

            res.status(500).json({
                success: false,
                message: 'Failed to process chat message',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * Get chatbot status
     * GET /api/chatbot/status
     */
    getStatus: async (req, res) => {
        try {
            const isAvailable = ChatbotS.isAvailable();
            const isAIEnabled = ChatbotS.isAIEnabled();
            res.json({
                success: true,
                data: {
                    available: isAvailable,
                    aiEnabled: isAIEnabled,
                    message: isAvailable
                        ? (isAIEnabled 
                            ? 'AI Chatbot is ready (AI + Rule-based hybrid mode)'
                            : 'Chatbot is ready (Rule-based mode)')
                        : 'Chatbot is not available',
                    mode: isAIEnabled ? 'hybrid' : 'rule-based'
                }
            });
        } catch (error) {
            logger.error('Error checking chatbot status', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to check chatbot status'
            });
        }
    },

    /**
     * Get available actions
     * GET /api/chatbot/actions
     */
    getActions: async (req, res) => {
        try {
            const result = ChatbotS.getAvailableActions();
            res.json(result);
        } catch (error) {
            logger.error('Error getting available actions', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get available actions'
            });
        }
    }
};

module.exports = ChatbotC;

