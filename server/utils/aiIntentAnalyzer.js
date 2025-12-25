const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

/**
 * AI Intent Analyzer using Google Gemini API
 * Phân tích intent và extract entities từ user message bằng AI
 */

let genAI = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

// Initialize Gemini if API key is available
if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        logger.info('✅ AI Intent Analyzer initialized successfully');
    } catch (error) {
        logger.error('❌ Failed to initialize AI Intent Analyzer', {
            error: error.message
        });
    }
} else {
    logger.warn('⚠️ GEMINI_API_KEY not set. AI Intent Analyzer will use fallback.');
}

/**
 * Analyze intent and extract entities using Gemini AI
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Object} {intent, entities, confidence, reasoning}
 */
async function analyzeIntentWithAI(message, conversationHistory = []) {
    if (!genAI || !GEMINI_API_KEY) {
        return null; // Fallback to rule-based
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Build context from conversation history
        let contextText = '';
        if (conversationHistory.length > 0) {
            contextText = '\n\nLịch sử hội thoại gần đây:\n';
            conversationHistory.slice(-3).forEach((msg, idx) => {
                contextText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
        }

        const systemPrompt = `Bạn là AI assistant cho hệ thống quản lý kho hàng (Warehouse Management System).

NHIỆM VỤ: Phân tích câu hỏi/yêu cầu của người dùng và trả về JSON với intent và entities.

CÁC INTENT CÓ THỂ:
1. search_products - Tìm kiếm sản phẩm
2. get_product_details - Xem chi tiết sản phẩm (cần productId)
3. list_products - Liệt kê danh sách sản phẩm
4. create_order - Tạo đơn hàng mới (cần customerName)
5. get_order_status - Kiểm tra trạng thái đơn hàng (cần orderId)
6. list_orders - Liệt kê danh sách đơn hàng
7. check_inventory - Kiểm tra tồn kho, sản phẩm sắp hết hàng
8. list_warehouses - Liệt kê danh sách kho
9. get_statistics - Xem thống kê hệ thống
10. get_revenue - Xem doanh thu
11. get_top_products - Xem sản phẩm bán chạy
12. query - Câu hỏi chung về hệ thống
13. help - Yêu cầu hướng dẫn

ENTITIES CẦN EXTRACT:
- productId: ID sản phẩm (P001, PROD123, etc.)
- productName: Tên sản phẩm
- orderId: ID đơn hàng (ORD001, ORD123, etc.)
- customerName: Tên khách hàng
- query: Từ khóa tìm kiếm
- quantity: Số lượng
- warehouseId: ID kho

QUY TẮC:
- Trả về JSON hợp lệ, không có markdown formatting
- Intent phải là một trong các intent trên
- Entities chỉ include những gì có trong message
- Confidence từ 0.0 đến 1.0
- Reasoning: giải thích ngắn gọn tại sao chọn intent này

VÍ DỤ:
Input: "Tìm sản phẩm laptop"
Output: {"intent": "search_products", "entities": {"query": "laptop"}, "confidence": 0.95, "reasoning": "User muốn tìm kiếm sản phẩm laptop"}

Input: "Tạo đơn hàng cho khách hàng Nguyễn Văn A"
Output: {"intent": "create_order", "entities": {"customerName": "Nguyễn Văn A"}, "confidence": 0.98, "reasoning": "User muốn tạo đơn hàng cho khách hàng cụ thể"}

Input: "Có bao nhiêu sản phẩm?"
Output: {"intent": "get_statistics", "entities": {}, "confidence": 0.9, "reasoning": "User hỏi về số lượng sản phẩm - thuộc thống kê"}

Input: "Sản phẩm nào sắp hết hàng?"
Output: {"intent": "check_inventory", "entities": {}, "confidence": 0.95, "reasoning": "User hỏi về tình trạng tồn kho"}

Bây giờ phân tích câu hỏi sau:${contextText}

Câu hỏi: "${message}"

Trả về JSON:`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        
        // Check for blocked content
        if (response.promptFeedback?.blockReason) {
            logger.warn('AI response blocked', {
                reason: response.promptFeedback.blockReason
            });
            return null;
        }
        
        let text = response.text().trim();

        // Clean up response - remove markdown code blocks if any
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to extract JSON from response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }

        // Parse JSON with error handling
        let analysis;
        try {
            analysis = JSON.parse(text);
            
            // Validate analysis structure
            if (!analysis.intent) {
                throw new Error('Missing intent in AI response');
            }
            
            // Ensure entities is an object
            if (!analysis.entities || typeof analysis.entities !== 'object') {
                analysis.entities = {};
            }
            
            // Ensure confidence is a number
            if (typeof analysis.confidence !== 'number') {
                analysis.confidence = 0.7;
            }
        } catch (parseError) {
            logger.warn('Failed to parse AI response as JSON', {
                text: text.substring(0, 200),
                error: parseError.message
            });
            
            // Try to extract intent manually from text
            const intentMatch = text.match(/"intent"\s*:\s*"([^"]+)"/i) || 
                               text.match(/intent["\s:]+([a-z_]+)/i);
            const confidenceMatch = text.match(/"confidence"\s*:\s*([\d.]+)/i);
            
            // Try to extract entities
            const entitiesMatch = text.match(/"entities"\s*:\s*\{([^}]*)\}/i);
            let entities = {};
            if (entitiesMatch) {
                try {
                    entities = JSON.parse(`{${entitiesMatch[1]}}`);
                } catch (e) {
                    // Ignore entity parsing errors
                }
            }
            
            if (intentMatch) {
                analysis = {
                    intent: intentMatch[1],
                    entities: entities,
                    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7,
                    reasoning: 'Parsed from partial response'
                };
            } else {
                // If we can't parse at all, return null to use rule-based
                return null;
            }
        }

        logger.info('AI Intent Analysis', {
            intent: analysis.intent,
            confidence: analysis.confidence,
            entities: analysis.entities
        });

        return {
            intent: analysis.intent || 'query',
            entities: analysis.entities || {},
            confidence: analysis.confidence || 0.5,
            reasoning: analysis.reasoning || ''
        };
    } catch (error) {
        logger.error('Error analyzing intent with AI', {
            error: error.message,
            stack: error.stack
        });
        return null; // Fallback to rule-based
    }
}

/**
 * Generate natural language response using AI
 * @param {string} message - User message
 * @param {Object} context - System context (stats, data, etc.)
 * @param {string} actionResult - Result from action execution
 * @returns {string} Natural language response
 */
async function generateResponseWithAI(message, context, actionResult = null) {
    if (!genAI || !GEMINI_API_KEY) {
        return null; // Fallback to template-based
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        let prompt = `Bạn là AI assistant thân thiện cho hệ thống quản lý kho hàng.

THÔNG TIN HỆ THỐNG:
- Tổng số sản phẩm: ${context.stats?.products || 0}
- Tổng số đơn hàng: ${context.stats?.orders || 0}
- Tổng số kho: ${context.stats?.warehouses || 0}
- Doanh thu tổng: ${(context.revenue?.total || 0).toLocaleString('vi-VN')} VNĐ

NGƯỜI DÙNG HỎI: "${message}"

`;

        if (actionResult) {
            prompt += `KẾT QUẢ THỰC HIỆN ACTION:
${JSON.stringify(actionResult, null, 2)}

Hãy tạo câu trả lời tự nhiên, thân thiện bằng tiếng Việt dựa trên kết quả trên.`;
        } else {
            prompt += `Hãy trả lời câu hỏi một cách tự nhiên, thân thiện bằng tiếng Việt.`;
        }

        prompt += `\n\nQUY TẮC:
- Trả lời ngắn gọn, rõ ràng
- Sử dụng emoji phù hợp
- Nếu có dữ liệu, hiển thị dữ liệu
- Nếu không có dữ liệu, giải thích rõ ràng
- Luôn thân thiện và chuyên nghiệp`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        logger.error('Error generating response with AI', {
            error: error.message
        });
        return null; // Fallback to template-based
    }
}

/**
 * Check if AI is available
 */
function isAIAvailable() {
    return !!genAI && !!GEMINI_API_KEY;
}

module.exports = {
    analyzeIntentWithAI,
    generateResponseWithAI,
    isAIAvailable
};

