const AIS = require('../services/aiS');
const logger = require('../utils/logger');

const AIC = {
    /**
     * Check AI availability
     * GET /api/ai/status
     */
    getStatus: async (req, res) => {
        try {
            const isAvailable = AIS.isAvailable();
            res.json({
                success: true,
                data: {
                    available: isAvailable,
                    message: isAvailable
                        ? 'AI Assistant is ready'
                        : 'AI Assistant is not configured. Please set GEMINI_API_KEY in environment variables.'
                }
            });
        } catch (error) {
            logger.error('Error checking AI status', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to check AI status'
            });
        }
    },

    /**
     * Chat with AI
     * POST /api/ai/chat
     */
    chat: async (req, res) => {
        try {
            const { message, conversationHistory = [] } = req.body;
            const userRole = req.user?.role || req.user?.Role || 'staff';

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

            const response = await AIS.generateResponse(
                message.trim(),
                userRole,
                conversationHistory
            );

            if (response.success) {
                res.json({
                    success: true,
                    data: {
                        message: response.message,
                        context: response.context
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: response.message,
                    suggestion: response.suggestion
                });
            }
        } catch (error) {
            logger.error('Error in AI chat', {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                userId: req.user?.id
            });

            res.status(500).json({
                success: false,
                message: 'Failed to process chat message',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                details: process.env.NODE_ENV === 'development' ? {
                    stack: error.stack?.split('\n').slice(0, 3).join('\n')
                } : undefined
            });
        }
    },

    /**
     * Analyze data
     * POST /api/ai/analyze
     */
    analyze: async (req, res) => {
        try {
            const { dataType = 'overview' } = req.body;
            const userRole = req.user?.role || req.user?.Role || 'staff';

            const analysis = await AIS.analyzeData(dataType, userRole);

            if (analysis.success) {
                res.json({
                    success: true,
                    data: {
                        analysis: analysis.analysis,
                        context: analysis.context
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: analysis.message
                });
            }
        } catch (error) {
            logger.error('Error in AI analyze', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id
            });

            res.status(500).json({
                success: false,
                message: 'Failed to analyze data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = AIC;
