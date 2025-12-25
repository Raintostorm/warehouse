const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const logger = require('../utils/logger');
const StatisticsM = require('../models/statisticsM');
const ProductsM = require('../models/productsM');
const OrdersM = require('../models/ordersM');
const WarehousesM = require('../models/warehousesM');
const SuppliersM = require('../models/suppliersM');

// Initialize Gemini AI
let genAI = null;

// List of models to try in order (newest/most stable first)
// Will be dynamically updated with available models
let MODEL_NAMES = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
];

// Cache for available models
let availableModelsCache = null;
let lastModelsFetchTime = null;
const MODELS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Initialize Gemini if API key is available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        logger.info('✅ Gemini AI client initialized successfully');
    } catch (error) {
        logger.error('❌ Failed to initialize Gemini AI', {
            error: error.message,
            stack: error.stack
        });
    }
} else {
    logger.warn('⚠️ GEMINI_API_KEY not set. AI features will be disabled.');
}

/**
 * Fetch available models from Gemini API
 */
async function fetchAvailableModels() {
    if (!GEMINI_API_KEY) {
        return [];
    }

    // Check cache
    if (availableModelsCache && lastModelsFetchTime) {
        const cacheAge = Date.now() - lastModelsFetchTime;
        if (cacheAge < MODELS_CACHE_DURATION) {
            logger.info('Using cached available models list');
            return availableModelsCache;
        }
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
        logger.info('Fetching available models from Gemini API...');

        const response = await axios.get(url, {
            timeout: 10000 // 10 second timeout
        });

        if (response.data && response.data.models) {
            // Filter models that support generateContent
            const models = response.data.models
                .filter(model => {
                    // Check if model supports generateContent
                    const supportedMethods = model.supportedGenerationMethods || [];
                    return supportedMethods.includes('generateContent');
                })
                .map(model => model.name.replace('models/', '')) // Remove 'models/' prefix
                .filter(name => name.startsWith('gemini')); // Only Gemini models

            // Prioritize our preferred models if they exist
            const preferredOrder = [
                'gemini-1.5-flash',
                'gemini-1.5-pro',
                'gemini-pro',
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro-latest'
            ];

            const sortedModels = [];
            // Add preferred models first (if available)
            for (const preferred of preferredOrder) {
                if (models.includes(preferred)) {
                    sortedModels.push(preferred);
                }
            }
            // Add remaining models
            for (const model of models) {
                if (!sortedModels.includes(model)) {
                    sortedModels.push(model);
                }
            }

            availableModelsCache = sortedModels.length > 0 ? sortedModels : MODEL_NAMES;
            lastModelsFetchTime = Date.now();

            logger.info(`✅ Found ${availableModelsCache.length} available models:`, availableModelsCache);

            // Update MODEL_NAMES for use in generateContent
            MODEL_NAMES = availableModelsCache;

            return availableModelsCache;
        }

        logger.warn('No models found in API response, using default list');
        return MODEL_NAMES;
    } catch (error) {
        logger.error('Error fetching available models', {
            error: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText
        });

        // Return default list on error
        return MODEL_NAMES;
    }
}

// Fetch available models asynchronously on startup (don't block initialization)
if (GEMINI_API_KEY && genAI) {
    fetchAvailableModels().catch(err => {
        logger.warn('⚠️ Could not fetch available models on startup, using default list', {
            error: err.message
        });
    });
}

const AIS = {
    /**
     * Check if AI is available
     */
    isAvailable: () => {
        return !!genAI;
    },

    /**
     * Get list of available models (with caching)
     */
    getAvailableModels: async () => {
        if (!genAI) {
            return [];
        }
        return await fetchAvailableModels();
    },

    /**
     * Refresh available models list (force fetch)
     */
    refreshAvailableModels: async () => {
        if (!genAI) {
            return [];
        }
        availableModelsCache = null;
        lastModelsFetchTime = null;
        return await fetchAvailableModels();
    },

    /**
     * Get system context about the warehouse management system
     */
    getSystemContext: async (userRole = 'staff') => {
        try {
            // Get basic statistics
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

            const lowStockProducts = await StatisticsM.getLowStockProducts().catch(() => []);
            const topProducts = await StatisticsM.getTopProducts(5).catch(() => []);

            return {
                stats,
                revenue,
                lowStockProducts: lowStockProducts.slice(0, 5),
                topProducts: topProducts.slice(0, 5),
                userRole
            };
        } catch (error) {
            logger.error('Error getting system context', { error: error.message });
            return {
                stats: { users: 0, products: 0, orders: 0, warehouses: 0, suppliers: 0 },
                revenue: { total: 0, today: 0, thisMonth: 0 },
                lowStockProducts: [],
                topProducts: [],
                userRole
            };
        }
    },

    /**
     * Query products by natural language
     */
    queryProducts: async (query) => {
        try {
            const products = await ProductsM.findAll();
            // Simple keyword matching for now
            const keywords = query.toLowerCase().split(' ');
            return products.filter(product => {
                const searchText = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
                return keywords.some(keyword => searchText.includes(keyword));
            }).slice(0, 10);
        } catch (error) {
            logger.error('Error querying products', { error: error.message });
            return [];
        }
    },

    /**
     * Query orders by natural language
     */
    queryOrders: async (query) => {
        try {
            const orders = await OrdersM.findAll();
            // Simple keyword matching
            const keywords = query.toLowerCase().split(' ');
            return orders.filter(order => {
                const searchText = `${order.order_id || ''} ${order.status || ''} ${order.customer_name || ''}`.toLowerCase();
                return keywords.some(keyword => searchText.includes(keyword));
            }).slice(0, 10);
        } catch (error) {
            logger.error('Error querying orders', { error: error.message });
            return [];
        }
    },

    /**
     * Generate AI response using Gemini with automatic model fallback
     */
    generateResponse: async (userMessage, userRole = 'staff', conversationHistory = []) => {
        if (!genAI) {
            return {
                success: false,
                message: 'AI service is not configured. Please set GEMINI_API_KEY in environment variables.',
                suggestion: 'Get your API key from https://makersuite.google.com/app/apikey'
            };
        }

        try {
            // Get system context
            console.log('[AI] Getting system context for AI', { userRole });
            logger.info('Getting system context for AI', { userRole });

            let context;
            try {
                context = await AIS.getSystemContext(userRole);
                console.log('[AI] System context retrieved successfully');
                logger.info('System context retrieved', {
                    statsCount: Object.keys(context.stats).length,
                    hasRevenue: !!context.revenue
                });
            } catch (contextError) {
                console.error('[AI] Error getting system context:', contextError);
                throw contextError;
            }

            // Build system prompt
            console.log('[AI] Building system prompt...');
            const systemPrompt = `Bạn là AI Assistant cho hệ thống quản lý kho hàng (Warehouse Management System).

THÔNG TIN HỆ THỐNG:
- Tổng số người dùng: ${context.stats.users}
- Tổng số sản phẩm: ${context.stats.products}
- Tổng số đơn hàng: ${context.stats.orders}
- Tổng số kho: ${context.stats.warehouses}
- Tổng số nhà cung cấp: ${context.stats.suppliers}
- Tổng doanh thu: ${(context.revenue.total || 0).toLocaleString('vi-VN')} VNĐ
- Doanh thu hôm nay: ${(context.revenue.today || 0).toLocaleString('vi-VN')} VNĐ
- Doanh thu tháng này: ${(context.revenue.thisMonth || 0).toLocaleString('vi-VN')} VNĐ

SẢN PHẨM SẮP HẾT HÀNG:
${context.lowStockProducts && context.lowStockProducts.length > 0 ? context.lowStockProducts.map(p => `- ${p.name || 'N/A'}: Còn ${p.stock_quantity || 0} sản phẩm`).join('\n') : 'Không có sản phẩm nào sắp hết hàng'}

SẢN PHẨM BÁN CHẠY:
${context.topProducts && context.topProducts.length > 0 ? context.topProducts.map((p, i) => `${i + 1}. ${p.name || 'N/A'}: ${p.total_sold || 0} sản phẩm`).join('\n') : 'Chưa có dữ liệu'}

VAI TRÒ NGƯỜI DÙNG: ${userRole}

NHIỆM VỤ:
1. Trả lời câu hỏi về hệ thống quản lý kho hàng
2. Hướng dẫn sử dụng các tính năng
3. Phân tích dữ liệu và đưa ra insights
4. Gợi ý các hành động cần thiết
5. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp

QUY TẮC:
- Chỉ trả lời về hệ thống quản lý kho hàng
- Không trả lời các câu hỏi không liên quan
- Đưa ra số liệu cụ thể khi có thể
- Gợi ý các hành động cụ thể khi phù hợp
- Giữ câu trả lời ngắn gọn và dễ hiểu`;

            // Build conversation history
            let conversationText = '';
            if (conversationHistory.length > 0) {
                conversationText = '\n\nLỊCH SỬ HỘI THOẠI:\n';
                conversationHistory.slice(-5).forEach((msg, idx) => {
                    conversationText += `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}\n`;
                });
            }

            const fullPrompt = `${systemPrompt}${conversationText}\n\nNgười dùng: ${userMessage}\n\nAI:`;

            // Log prompt length for debugging
            console.log('[AI] Prompt length:', fullPrompt.length, 'chars');
            logger.info('AI prompt length', {
                length: fullPrompt.length,
                messageLength: userMessage.length
            });

            // Generate response with automatic model fallback
            console.log('[AI] Calling Gemini API...');
            let result, response, text;
            let modelUsed = null;
            let lastError = null;

            // Try each model until one works
            for (const modelName of MODEL_NAMES) {
                try {
                    console.log(`[AI] Trying model: ${modelName}`);
                    const currentModel = genAI.getGenerativeModel({ model: modelName });
                    result = await currentModel.generateContent(fullPrompt);
                    response = await result.response;
                    modelUsed = modelName;
                    console.log(`[AI] ✅ Success with model: ${modelName}`);

                    // Check for blocked content or errors in response
                    if (response.promptFeedback?.blockReason) {
                        throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
                    }

                    text = response.text();

                    if (!text || text.trim().length === 0) {
                        throw new Error('Empty response from Gemini API');
                    }

                    // Success! Break out of loop
                    break;
                } catch (apiError) {
                    lastError = apiError;
                    const is404 = apiError.status === 404 ||
                        apiError.message?.includes('404') ||
                        apiError.message?.includes('not found') ||
                        apiError.message?.includes('is not found');

                    console.log(`[AI] ❌ Model ${modelName} failed:`, apiError.message);

                    // If it's a 404 (model not found), try next model
                    if (is404) {
                        console.log(`[AI] Model ${modelName} not found (404), trying next model...`);
                        continue; // Try next model
                    }

                    // For other errors (API key, quota, etc.), don't try other models
                    if (apiError.message?.includes('API key') || apiError.message?.includes('401')) {
                        throw new Error('Invalid API key. Please check GEMINI_API_KEY in .env');
                    }
                    if (apiError.message?.includes('quota') || apiError.message?.includes('rate limit') || apiError.message?.includes('429')) {
                        throw new Error('API quota exceeded. Please try again later.');
                    }
                    if (apiError.message?.includes('blocked') || apiError.message?.includes('safety')) {
                        throw new Error('Content was blocked by safety filters. Please rephrase your question.');
                    }

                    // If it's not a 404, throw immediately (don't try other models)
                    throw apiError;
                }
            }

            // If we tried all models and none worked, try fetching fresh list
            if (!text && lastError) {
                logger.warn('All models failed, fetching fresh list of available models...');

                // Clear cache and fetch fresh models
                availableModelsCache = null;
                lastModelsFetchTime = null;
                const freshModels = await fetchAvailableModels();

                // If we got new models, try them
                if (freshModels && freshModels.length > 0 && JSON.stringify(freshModels) !== JSON.stringify(MODEL_NAMES)) {
                    logger.info('Retrying with fresh model list:', freshModels);

                    for (const modelName of freshModels) {
                        try {
                            console.log(`[AI] Retrying with model: ${modelName}`);
                            const currentModel = genAI.getGenerativeModel({ model: modelName });
                            result = await currentModel.generateContent(fullPrompt);
                            response = await result.response;
                            modelUsed = modelName;
                            console.log(`[AI] ✅ Success with model: ${modelName}`);

                            if (response.promptFeedback?.blockReason) {
                                throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
                            }

                            text = response.text();

                            if (!text || text.trim().length === 0) {
                                throw new Error('Empty response from Gemini API');
                            }

                            // Success! Break out of loop
                            break;
                        } catch (retryError) {
                            console.log(`[AI] ❌ Model ${modelName} failed on retry:`, retryError.message);
                            continue;
                        }
                    }
                }

                // If still no success, throw error
                if (!text) {
                    logger.error('Gemini API error - all models failed', {
                        error: lastError.message,
                        errorName: lastError.name,
                        status: lastError.status,
                        modelsTried: MODEL_NAMES,
                        freshModelsTried: freshModels || []
                    });

                    console.error('=== Gemini API Error - All Models Failed ===');
                    console.error('Last Error:', lastError.message);
                    console.error('Status:', lastError.status);
                    console.error('Models Tried:', MODEL_NAMES);
                    console.error('Fresh Models Tried:', freshModels || []);

                    throw new Error(`All Gemini models failed. Last error: ${lastError.message}. Please check available models at https://ai.google.dev/models/gemini or verify your API key has access to Generative Language API.`);
                }
            }

            // Log which model was used
            if (modelUsed) {
                logger.info(`AI response generated successfully using model: ${modelUsed}`);
            }

            return {
                success: true,
                message: text,
                context: {
                    stats: context.stats,
                    revenue: context.revenue,
                    lowStockCount: context.lowStockProducts.length
                }
            };
        } catch (error) {
            // Log full error details for debugging - ALWAYS log to console for immediate visibility
            console.error('=== AI Error Details ===');
            console.error('Error Message:', error.message);
            console.error('Error Name:', error.name);
            console.error('Error Code:', error.code);
            console.error('Error Status:', error.status);
            console.error('Error:', error);
            console.error('Stack:', error.stack);

            logger.error('Error generating AI response', {
                error: error.message,
                errorName: error.name,
                errorCode: error.code,
                errorStatus: error.status,
                stack: error.stack
            });

            // Return user-friendly error message
            let errorMessage = 'Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';

            if (error.message?.includes('API key')) {
                errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
            } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
                errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút.';
            } else if (error.message?.includes('All Gemini models failed')) {
                errorMessage = 'Không thể kết nối với AI. Vui lòng kiểm tra API key hoặc thử lại sau.';
            }

            return {
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            };
        }
    },

    /**
     * Analyze data and provide insights
     */
    analyzeData: async (dataType, userRole = 'staff') => {
        if (!genAI) {
            return {
                success: false,
                message: 'AI service is not configured.'
            };
        }

        try {
            const context = await AIS.getSystemContext(userRole);
            let analysisPrompt = '';

            switch (dataType) {
                case 'inventory':
                    analysisPrompt = `Phân tích tình trạng tồn kho:
- Tổng số sản phẩm: ${context.stats.products}
- Sản phẩm sắp hết hàng: ${context.lowStockProducts.length}
${context.lowStockProducts.length > 0 ? context.lowStockProducts.map(p => `- ${p.name}: Còn ${p.stock_quantity} sản phẩm`).join('\n') : ''}

Hãy đưa ra phân tích và gợi ý.`;
                    break;
                case 'sales':
                    analysisPrompt = `Phân tích doanh số:
- Tổng doanh thu: ${context.revenue.total.toLocaleString('vi-VN')} VNĐ
- Doanh thu hôm nay: ${context.revenue.today.toLocaleString('vi-VN')} VNĐ
- Doanh thu tháng này: ${context.revenue.thisMonth.toLocaleString('vi-VN')} VNĐ
- Tổng số đơn hàng: ${context.stats.orders}
- Sản phẩm bán chạy:
${context.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.total_sold || 0} sản phẩm`).join('\n')}

Hãy đưa ra phân tích và gợi ý.`;
                    break;
                default:
                    analysisPrompt = `Phân tích tổng quan hệ thống:
${JSON.stringify(context, null, 2)}

Hãy đưa ra phân tích và gợi ý.`;
            }

            // Try models with fallback
            let result, response, text;
            let lastError = null;

            for (const modelName of MODEL_NAMES) {
                try {
                    const currentModel = genAI.getGenerativeModel({ model: modelName });
                    result = await currentModel.generateContent(analysisPrompt);
                    response = await result.response;
                    text = response.text();
                    break; // Success
                } catch (apiError) {
                    lastError = apiError;
                    const is404 = apiError.status === 404 || apiError.message?.includes('404') || apiError.message?.includes('not found');
                    if (is404) {
                        continue; // Try next model
                    }
                    throw apiError; // Other errors, throw immediately
                }
            }

            if (!text && lastError) {
                throw lastError;
            }

            return {
                success: true,
                analysis: text,
                context
            };
        } catch (error) {
            logger.error('Error analyzing data', { error: error.message });
            return {
                success: false,
                message: 'Không thể phân tích dữ liệu. Vui lòng thử lại sau.'
            };
        }
    }
};

module.exports = AIS;
