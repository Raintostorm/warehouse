const nlpHelper = require('../utils/nlpHelper');
const aiIntentAnalyzer = require('../utils/aiIntentAnalyzer');
const ProductActions = require('./chatbotActions/productActions');
const OrderActions = require('./chatbotActions/orderActions');
const WarehouseActions = require('./chatbotActions/warehouseActions');
const StatisticsActions = require('./chatbotActions/statisticsActions');
const StatisticsM = require('../models/statisticsM');
const logger = require('../utils/logger');

/**
 * Custom Chatbot Service - Hybrid Approach
 * Kết hợp AI (Gemini) + Rule-based để có độ chính xác cao nhất
 */
const ChatbotS = {
    /**
     * Process user message và trả về response - Hybrid approach
     */
    processMessage: async (message, user, conversationHistory = []) => {
        try {
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return {
                    success: false,
                    message: 'Vui lòng nhập câu hỏi hoặc yêu cầu'
                };
            }

            const trimmedMessage = message.trim();

            // Check if it's a help request
            if (nlpHelper.isHelpRequest(trimmedMessage)) {
                return {
                    success: true,
                    message: nlpHelper.getHelpMessage(),
                    type: 'help'
                };
            }

            // HYBRID APPROACH: Try AI first, fallback to rule-based
            let intentAnalysis = null;
            let useAI = false;

            // Step 1: Try AI Intent Analysis (if available)
            if (aiIntentAnalyzer.isAIAvailable()) {
                try {
                    // Set timeout for AI analysis (5 seconds)
                    const aiAnalysisPromise = aiIntentAnalyzer.analyzeIntentWithAI(
                        trimmedMessage,
                        conversationHistory
                    );
                    
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('AI analysis timeout')), 5000)
                    );
                    
                    intentAnalysis = await Promise.race([aiAnalysisPromise, timeoutPromise]);
                    
                    if (intentAnalysis && intentAnalysis.confidence > 0.6) {
                        useAI = true;
                        logger.info('Using AI intent analysis', {
                            intent: intentAnalysis.intent,
                            confidence: intentAnalysis.confidence,
                            reasoning: intentAnalysis.reasoning
                        });
                    } else {
                        logger.info('AI confidence too low, using rule-based', {
                            confidence: intentAnalysis?.confidence
                        });
                    }
                } catch (error) {
                    logger.warn('AI intent analysis failed, using rule-based', {
                        error: error.message
                    });
                    intentAnalysis = null; // Reset to ensure fallback
                }
            }

            // Step 2: Fallback to rule-based if AI not available or low confidence
            if (!useAI) {
                const ruleBasedAnalysis = nlpHelper.parseAction(trimmedMessage);
                intentAnalysis = {
                    intent: ruleBasedAnalysis.action,
                    entities: ruleBasedAnalysis.params,
                    confidence: 0.6,
                    reasoning: 'Rule-based analysis'
                };
                logger.info('Using rule-based intent analysis', {
                    intent: intentAnalysis.intent
                });
            }

            // Step 3: Merge entities from both methods for better accuracy
            const ruleBasedEntities = nlpHelper.extractEntities(trimmedMessage, intentAnalysis.intent);
            const mergedEntities = {
                ...intentAnalysis.entities,
                ...ruleBasedEntities
            };

            // Clean up merged entities
            const cleanedEntities = {};
            for (const [key, value] of Object.entries(mergedEntities)) {
                if (value !== null && value !== undefined && value !== '' && value !== 0) {
                    cleanedEntities[key] = value;
                }
            }

            logger.info('Chatbot processing message', {
                intent: intentAnalysis.intent,
                entities: cleanedEntities,
                method: useAI ? 'AI' : 'Rule-based',
                confidence: intentAnalysis.confidence,
                userId: user?.id || user?.Id
            });

            // Step 4: Execute action based on intent
            let result;
            switch (intentAnalysis.intent) {
                case 'search_products':
                    result = await ProductActions.searchProducts(cleanedEntities);
                    break;

                case 'get_product_details':
                    result = await ProductActions.getProductDetails(cleanedEntities);
                    break;

                case 'list_products':
                    result = await ProductActions.listProducts(cleanedEntities);
                    break;

                case 'create_order':
                    result = await OrderActions.createOrder(cleanedEntities, user);
                    break;

                case 'get_order_status':
                    result = await OrderActions.getOrderStatus(cleanedEntities);
                    break;

                case 'list_orders':
                    result = await OrderActions.listOrders(cleanedEntities);
                    break;

                case 'check_inventory':
                    result = await WarehouseActions.checkInventory(cleanedEntities);
                    break;

                case 'list_warehouses':
                    result = await WarehouseActions.listWarehouses(cleanedEntities);
                    break;

                case 'get_statistics':
                    result = await StatisticsActions.getStatistics(cleanedEntities);
                    break;

                case 'get_revenue':
                    result = await StatisticsActions.getRevenue(cleanedEntities);
                    break;

                case 'get_top_products':
                    result = await StatisticsActions.getTopProducts(cleanedEntities);
                    break;

                case 'query':
                default:
                    // For queries, try to get system context and use AI for response
                    result = await ChatbotS.handleQuery(trimmedMessage, user, conversationHistory, useAI);
                    break;
            }

            // Step 5: Enhance response with AI if available and it's a query
            let finalMessage = result.message;
            if (intentAnalysis.intent === 'query' && aiIntentAnalyzer.isAIAvailable() && useAI) {
                try {
                    const stats = await StatisticsM.getCounts().catch(() => ({
                        users: 0, products: 0, orders: 0, warehouses: 0, suppliers: 0
                    }));
                    const revenue = await StatisticsM.getRevenue().catch(() => ({
                        total: 0, today: 0, thisMonth: 0
                    }));

                    const aiResponse = await aiIntentAnalyzer.generateResponseWithAI(
                        trimmedMessage,
                        { stats, revenue },
                        result.data
                    );

                    if (aiResponse) {
                        finalMessage = aiResponse;
                    }
                } catch (error) {
                    logger.warn('AI response generation failed, using template', {
                        error: error.message
                    });
                }
            }

            // Format response
            return {
                success: result.success !== false,
                message: finalMessage,
                type: intentAnalysis.intent === 'query' ? 'query' : 'action',
                action: intentAnalysis.intent,
                data: result.data,
                count: result.count,
                method: useAI ? 'AI' : 'Rule-based',
                confidence: intentAnalysis.confidence,
                ...(result.status && { status: result.status, statusText: result.statusText })
            };
        } catch (error) {
            logger.error('Error processing chatbot message', {
                error: error.message,
                stack: error.stack,
                userId: user?.id || user?.Id
            });

            return {
                success: false,
                message: 'Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            };
        }
    },

    /**
     * Handle general queries about the system - Enhanced with AI support
     */
    handleQuery: async (message, user, conversationHistory = [], useAI = false) => {
        try {
            const lowerMessage = message.toLowerCase();
            const normalizedMessage = nlpHelper.normalizeVietnamese(lowerMessage);

            // Get system context
            const stats = await StatisticsM.getCounts().catch(() => ({
                users: 0,
                products: 0,
                orders: 0,
                warehouses: 0,
                suppliers: 0
            }));

            const revenue = await StatisticsM.getRevenue().catch(() => ({
                total: 0,
                today: 0,
                thisMonth: 0
            }));

            // Enhanced query patterns - Statistics queries
            if (normalizedMessage.match(/(?:tong so|co bao nhieu|how many|total|count)\s+(?:san pham|don hang|nguoi dung|kho|nha cung cap|products|orders|users|warehouses|suppliers)/i) ||
                lowerMessage.includes('tổng số') || 
                lowerMessage.includes('có bao nhiêu') ||
                lowerMessage.includes('how many') ||
                lowerMessage.includes('total')) {
                
                // Check what specific thing they're asking about
                let response = 'Thống kê hệ thống:\n\n';
                
                if (normalizedMessage.includes('san pham') || lowerMessage.includes('sản phẩm') || lowerMessage.includes('product')) {
                    response = `Tổng số sản phẩm trong hệ thống: **${stats.products}** sản phẩm`;
                } else if (normalizedMessage.includes('don hang') || lowerMessage.includes('đơn hàng') || lowerMessage.includes('order')) {
                    response = `Tổng số đơn hàng trong hệ thống: **${stats.orders}** đơn hàng`;
                } else if (normalizedMessage.includes('nguoi dung') || lowerMessage.includes('người dùng') || lowerMessage.includes('user')) {
                    response = `Tổng số người dùng trong hệ thống: **${stats.users}** người dùng`;
                } else if (normalizedMessage.includes('kho') || lowerMessage.includes('warehouse')) {
                    response = `Tổng số kho hàng trong hệ thống: **${stats.warehouses}** kho`;
                } else if (normalizedMessage.includes('nha cung cap') || lowerMessage.includes('nhà cung cấp') || lowerMessage.includes('supplier')) {
                    response = `Tổng số nhà cung cấp trong hệ thống: **${stats.suppliers}** nhà cung cấp`;
                } else {
                    // General stats
                    response += `📊 **Tổng quan:**\n`;
                    response += `- 👥 Người dùng: ${stats.users}\n`;
                    response += `- 📦 Sản phẩm: ${stats.products}\n`;
                    response += `- 📋 Đơn hàng: ${stats.orders}\n`;
                    response += `- 🏭 Kho hàng: ${stats.warehouses}\n`;
                    response += `- 🏢 Nhà cung cấp: ${stats.suppliers}\n`;
                    response += `\n💰 **Doanh thu:**\n`;
                    response += `- Tổng: ${(revenue.total || 0).toLocaleString('vi-VN')} VNĐ\n`;
                    response += `- Hôm nay: ${(revenue.today || 0).toLocaleString('vi-VN')} VNĐ\n`;
                    response += `- Tháng này: ${(revenue.thisMonth || 0).toLocaleString('vi-VN')} VNĐ`;
                }

                return {
                    success: true,
                    message: response,
                    data: { stats, revenue }
                };
            }

            // Revenue queries - enhanced
            if (normalizedMessage.match(/(?:doanh thu|revenue|sales|ban duoc)/i) ||
                lowerMessage.includes('doanh thu') || 
                lowerMessage.includes('revenue') ||
                lowerMessage.includes('bán được')) {
                
                let response = `💰 **Doanh thu:**\n\n`;
                
                if (normalizedMessage.includes('hom nay') || lowerMessage.includes('hôm nay') || lowerMessage.includes('today')) {
                    response = `Doanh thu hôm nay: **${(revenue.today || 0).toLocaleString('vi-VN')} VNĐ**`;
                } else if (normalizedMessage.includes('thang nay') || lowerMessage.includes('tháng này') || lowerMessage.includes('this month')) {
                    response = `Doanh thu tháng này: **${(revenue.thisMonth || 0).toLocaleString('vi-VN')} VNĐ**`;
                } else {
                    response += `- Tổng: ${(revenue.total || 0).toLocaleString('vi-VN')} VNĐ\n`;
                    response += `- Hôm nay: ${(revenue.today || 0).toLocaleString('vi-VN')} VNĐ\n`;
                    response += `- Tháng này: ${(revenue.thisMonth || 0).toLocaleString('vi-VN')} VNĐ`;
                }
                
                return {
                    success: true,
                    message: response,
                    data: revenue
                };
            }

            // Product-related queries
            if (normalizedMessage.match(/(?:san pham|product|hang)\s+(?:nao|co|gi|what|which)/i) ||
                lowerMessage.includes('sản phẩm nào') ||
                lowerMessage.includes('hàng nào') ||
                lowerMessage.includes('có sản phẩm')) {
                // Try to route to product search
                const { action, params } = nlpHelper.parseAction(message);
                if (action === 'search_products' || params.query) {
                    return await ProductActions.searchProducts(params);
                }
            }

            // Order-related queries
            if (normalizedMessage.match(/(?:don hang|order)\s+(?:nao|co|gi|what|which)/i) ||
                lowerMessage.includes('đơn hàng nào') ||
                lowerMessage.includes('có đơn hàng')) {
                return await OrderActions.listOrders({ limit: 10 });
            }

            // Inventory queries
            if (normalizedMessage.match(/(?:het hang|sap het|low stock|out of stock)/i) ||
                lowerMessage.includes('hết hàng') ||
                lowerMessage.includes('sắp hết') ||
                lowerMessage.includes('còn hàng')) {
                return await WarehouseActions.checkInventory({ lowStock: true });
            }

            // Greeting patterns
            if (normalizedMessage.match(/(?:xin chao|chao|hello|hi|hey)/i) ||
                lowerMessage.match(/^(xin chào|chào|hello|hi|hey)[\s!]*$/i)) {
                return {
                    success: true,
                    message: `Xin chào! 👋\n\nTôi là AI Chatbot của hệ thống quản lý kho hàng.\n\nTôi có thể giúp bạn:\n• Tìm kiếm sản phẩm\n• Tạo đơn hàng\n• Kiểm tra tồn kho\n• Xem thống kê\n• Và nhiều tính năng khác\n\nHãy thử: "Giúp tôi" để xem danh sách đầy đủ!`,
                    data: { stats, revenue }
                };
            }

            // Try to extract any product/order ID and route accordingly
            const orderIdMatch = message.match(/\b(ORD[-_]?\d+)\b/i);
            const productIdMatch = message.match(/\b(P[-_]?\d+|PROD[-_]?\d+)\b/i);
            
            if (orderIdMatch) {
                return await OrderActions.getOrderStatus({ orderId: orderIdMatch[1].toUpperCase().replace(/[-_]/g, '') });
            }
            
            if (productIdMatch) {
                return await ProductActions.getProductDetails({ productId: productIdMatch[1].toUpperCase().replace(/[-_]/g, '') });
            }

            // Default response with suggestions
            return {
                success: true,
                message: `Tôi có thể giúp bạn với:\n\n📦 **Sản phẩm:**\n• "Tìm sản phẩm laptop"\n• "Có bao nhiêu sản phẩm?"\n• "Sản phẩm nào sắp hết hàng?"\n\n📋 **Đơn hàng:**\n• "Tạo đơn hàng cho khách hàng ABC"\n• "Có bao nhiêu đơn hàng?"\n• "Trạng thái đơn hàng ORD001"\n\n📊 **Thống kê:**\n• "Thống kê hệ thống"\n• "Doanh thu tháng này"\n• "Tổng số sản phẩm"\n\n💡 Gõ "Giúp tôi" để xem danh sách đầy đủ!`,
                data: { stats, revenue }
            };
        } catch (error) {
            logger.error('Error handling query', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi xử lý câu hỏi. Vui lòng thử lại hoặc gõ "Giúp tôi" để xem hướng dẫn.',
                error: error.message
            };
        }
    },

    /**
     * Get available actions
     */
    getAvailableActions: () => {
        return {
            success: true,
            actions: [
                {
                    name: 'search_products',
                    description: 'Tìm kiếm sản phẩm',
                    example: 'Tìm sản phẩm laptop'
                },
                {
                    name: 'get_product_details',
                    description: 'Xem chi tiết sản phẩm',
                    example: 'Thông tin sản phẩm P001'
                },
                {
                    name: 'create_order',
                    description: 'Tạo đơn hàng mới',
                    example: 'Tạo đơn hàng cho khách hàng ABC'
                },
                {
                    name: 'get_order_status',
                    description: 'Kiểm tra trạng thái đơn hàng',
                    example: 'Trạng thái đơn hàng ORD001'
                },
                {
                    name: 'check_inventory',
                    description: 'Kiểm tra tồn kho',
                    example: 'Sản phẩm nào sắp hết hàng?'
                },
                {
                    name: 'get_statistics',
                    description: 'Xem thống kê hệ thống',
                    example: 'Thống kê hệ thống'
                }
            ],
            aiEnabled: aiIntentAnalyzer.isAIAvailable()
        };
    },

    /**
     * Check if chatbot is available
     */
    isAvailable: () => {
        return true; // Always available, uses AI if available, otherwise rule-based
    },

    /**
     * Check if AI is enabled
     */
    isAIEnabled: () => {
        return aiIntentAnalyzer.isAIAvailable();
    }
};

module.exports = ChatbotS;
