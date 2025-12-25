const logger = require('./logger');

/**
 * Natural Language Processing Helper - Enhanced Version
 * Phát hiện intent và trích xuất entities từ user message
 * Đã được cải thiện với nhiều patterns và keywords hơn
 */

// Expanded keywords mapping cho các intents với nhiều từ đồng nghĩa
const INTENT_KEYWORDS = {
    search_products: [
        'tìm', 'tìm kiếm', 'search', 'sản phẩm', 'product', 'hàng hóa', 'mặt hàng',
        'có sản phẩm', 'có hàng', 'bán', 'bán gì', 'có gì', 'mua', 'mua gì',
        'tìm hàng', 'tìm đồ', 'kiếm', 'kiếm sản phẩm', 'kiếm hàng',
        'sản phẩm nào', 'hàng nào', 'có loại', 'loại nào',
        'show product', 'find product', 'list product', 'get product'
    ],
    get_product_details: [
        'chi tiết', 'thông tin', 'details', 'info', 'sản phẩm', 'product',
        'xem', 'xem sản phẩm', 'sản phẩm này', 'hàng này',
        'giá', 'giá bao nhiêu', 'giá của', 'cost', 'price',
        'mô tả', 'description', 'đặc điểm', 'tính năng',
        'product info', 'product detail', 'show product', 'view product'
    ],
    create_order: [
        'tạo', 'create', 'thêm', 'add', 'đơn hàng', 'order', 'đặt hàng',
        'làm đơn', 'tạo đơn', 'thêm đơn', 'new order', 'make order',
        'đặt', 'đặt mua', 'mua hàng', 'order now', 'place order',
        'tạo cho', 'đặt cho', 'mua cho', 'order for'
    ],
    get_order_status: [
        'trạng thái', 'status', 'tình trạng', 'đơn hàng', 'order',
        'đơn này', 'đơn hàng này', 'order status', 'order state',
        'đơn hàng như thế nào', 'đơn hàng ra sao', 'đơn hàng thế nào',
        'đơn hàng đã', 'đơn hàng chưa', 'đơn hàng đang',
        'check order', 'order info', 'xem đơn hàng'
    ],
    check_inventory: [
        'kiểm tra', 'check', 'tồn kho', 'inventory', 'kho', 'hết hàng', 'sắp hết',
        'còn hàng', 'còn bao nhiêu', 'số lượng', 'quantity', 'stock',
        'hàng còn', 'sản phẩm còn', 'còn không', 'còn gì',
        'sản phẩm nào sắp hết', 'sản phẩm nào hết', 'hàng nào hết',
        'check stock', 'inventory check', 'stock level', 'còn bao nhiêu hàng',
        'kiểm tra hàng', 'xem kho', 'xem tồn kho', 'tồn kho như thế nào'
    ],
    get_statistics: [
        'thống kê', 'statistics', 'stats', 'báo cáo', 'report', 'doanh thu', 'revenue',
        'tổng số', 'có bao nhiêu', 'số lượng', 'count', 'total',
        'tổng quan', 'overview', 'summary', 'tổng hợp',
        'báo cáo', 'report', 'thống kê hệ thống', 'system stats',
        'dashboard', 'tổng kết', 'kết quả', 'results'
    ],
    list_products: [
        'danh sách', 'list', 'liệt kê', 'hiển thị', 'show', 'sản phẩm',
        'tất cả sản phẩm', 'all products', 'sản phẩm có', 'products',
        'xem sản phẩm', 'xem hàng', 'show all', 'list all',
        'sản phẩm trong hệ thống', 'hàng trong kho'
    ],
    list_orders: [
        'danh sách', 'list', 'liệt kê', 'hiển thị', 'show', 'đơn hàng',
        'tất cả đơn hàng', 'all orders', 'đơn hàng có', 'orders',
        'xem đơn hàng', 'show orders', 'list orders',
        'đơn hàng trong hệ thống', 'orders list'
    ],
    list_warehouses: [
        'danh sách', 'list', 'liệt kê', 'hiển thị', 'show', 'kho',
        'tất cả kho', 'all warehouses', 'kho có', 'warehouses',
        'xem kho', 'show warehouses', 'list warehouses',
        'kho trong hệ thống', 'warehouse list'
    ],
    help: [
        'giúp', 'help', 'hướng dẫn', 'guide', 'làm sao', 'cách', 'how',
        'giúp tôi', 'help me', 'hướng dẫn sử dụng', 'user guide',
        'làm thế nào', 'như thế nào', 'cách dùng', 'cách sử dụng',
        'tutorial', 'manual', 'instructions', '?', '???'
    ]
};

// Expanded action patterns với nhiều cách diễn đạt hơn
const ACTION_PATTERNS = {
    search_products: [
        /tìm\s+(?:sản\s+phẩm|hàng\s+hóa|mặt\s+hàng|hàng|đồ)\s+(.+)/i,
        /search\s+(?:product|item|for)\s+(.+)/i,
        /tìm\s+kiếm\s+(.+)/i,
        /kiếm\s+(?:sản\s+phẩm|hàng|đồ)\s+(.+)/i,
        /có\s+(?:sản\s+phẩm|hàng)\s+(.+)/i,
        /(?:sản\s+phẩm|hàng)\s+(.+)\s+(?:nào|có|ở đâu)/i,
        /(?:bán|mua)\s+(.+)/i,
        /(?:show|find|list|get)\s+(?:product|item)\s+(.+)/i,
        /(.+)\s+(?:sản\s+phẩm|hàng|product)/i
    ],
    create_order: [
        /tạo\s+đơn\s+hàng\s+(?:cho|với|tên)?\s*(?:khách\s+hàng\s+)?(.+)/i,
        /create\s+order\s+(?:for\s+)?(.+)/i,
        /thêm\s+đơn\s+hàng\s+(?:cho|với)?\s*(?:khách\s+hàng\s+)?(.+)/i,
        /đặt\s+hàng\s+(?:cho|với)?\s*(?:khách\s+hàng\s+)?(.+)/i,
        /mua\s+hàng\s+(?:cho|với)?\s*(?:khách\s+hàng\s+)?(.+)/i,
        /(?:new|make|place)\s+order\s+(?:for\s+)?(.+)/i,
        /tạo\s+đơn\s+(?:cho|với)?\s*(.+)/i
    ],
    get_order_status: [
        /trạng\s+thái\s+đơn\s+hàng\s+(.+)/i,
        /status\s+of\s+order\s+(.+)/i,
        /đơn\s+hàng\s+(.+)\s+(?:có\s+)?trạng\s+thái/i,
        /đơn\s+hàng\s+(.+)\s+(?:như thế nào|ra sao|thế nào)/i,
        /đơn\s+hàng\s+(.+)\s+(?:đã|chưa|đang)/i,
        /order\s+(.+)\s+status/i,
        /check\s+order\s+(.+)/i,
        /xem\s+đơn\s+hàng\s+(.+)/i
    ],
    check_inventory: [
        /kiểm\s+tra\s+tồn\s+kho/i,
        /check\s+inventory/i,
        /sản\s+phẩm\s+(?:nào\s+)?sắp\s+hết\s+hàng/i,
        /sản\s+phẩm\s+(?:nào\s+)?hết\s+hàng/i,
        /hàng\s+(?:nào\s+)?(?:sắp\s+)?hết/i,
        /(?:còn|tồn)\s+(?:bao nhiêu|gì|hàng)/i,
        /(?:số lượng|quantity|stock)\s+(?:còn|hiện tại)/i,
        /(?:kiểm tra|xem)\s+(?:kho|tồn kho|hàng)/i,
        /(?:hàng|sản phẩm)\s+còn\s+(?:bao nhiêu|gì)/i,
        /check\s+stock/i,
        /inventory\s+check/i
    ],
    get_statistics: [
        /thống\s+kê\s+(?:hệ\s+thống|tổng\s+quan)/i,
        /(?:tổng\s+số|có\s+bao\s+nhiêu)\s+(?:sản\s+phẩm|đơn\s+hàng|người\s+dùng|kho)/i,
        /(?:statistics|stats|report)\s+(?:system|overview)/i,
        /(?:báo\s+cáo|report)\s+(?:hệ\s+thống|tổng\s+quan)/i,
        /(?:dashboard|overview|summary)/i
    ],
    list_products: [
        /(?:danh\s+sách|hiển\s+thị|xem|list|show)\s+(?:tất\s+cả\s+)?sản\s+phẩm/i,
        /(?:all|list|show)\s+products/i,
        /sản\s+phẩm\s+(?:có|trong\s+hệ\s+thống)/i
    ],
    list_orders: [
        /(?:danh\s+sách|hiển\s+thị|xem|list|show)\s+(?:tất\s+cả\s+)?đơn\s+hàng/i,
        /(?:all|list|show)\s+orders/i,
        /đơn\s+hàng\s+(?:có|trong\s+hệ\s+thống)/i
    ]
};

// Question patterns - các câu hỏi thông thường
const QUESTION_PATTERNS = {
    how_many: [
        /(?:có\s+bao\s+nhiêu|tổng\s+số|số\s+lượng)\s+(?:sản\s+phẩm|đơn\s+hàng|người\s+dùng|kho|nhà\s+cung\s+cấp)/i,
        /(?:how\s+many|total|count)\s+(?:products|orders|users|warehouses|suppliers)/i,
        /(?:bao\s+nhiêu)\s+(?:sản\s+phẩm|đơn\s+hàng|người\s+dùng|kho)/i
    ],
    what_is: [
        /(?:là\s+gì|gì\s+là|what\s+is|what's)\s+(?:sản\s+phẩm|đơn\s+hàng|kho)/i,
        /(?:sản\s+phẩm|đơn\s+hàng|kho)\s+(?:là\s+gì|gì)/i
    ],
    where_is: [
        /(?:ở\s+đâu|where\s+is|where)\s+(?:sản\s+phẩm|đơn\s+hàng|kho)/i,
        /(?:sản\s+phẩm|đơn\s+hàng|kho)\s+(?:ở\s+đâu)/i
    ],
    when: [
        /(?:khi\s+nào|when)\s+(?:tạo|tạo\s+đơn|đặt\s+hàng)/i,
        /(?:đơn\s+hàng|order)\s+(?:tạo|đặt)\s+(?:khi\s+nào|when)/i
    ]
};

/**
 * Normalize Vietnamese text - remove diacritics for better matching
 */
function normalizeVietnamese(text) {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Fuzzy keyword matching - check if message contains any keyword variations
 */
function fuzzyKeywordMatch(message, keywords) {
    const normalizedMsg = normalizeVietnamese(message);
    for (const keyword of keywords) {
        const normalizedKeyword = normalizeVietnamese(keyword);
        // Exact match
        if (normalizedMsg.includes(normalizedKeyword)) {
            return true;
        }
        // Partial match (for multi-word keywords)
        const keywordParts = normalizedKeyword.split(/\s+/);
        if (keywordParts.length > 1) {
            const allPartsMatch = keywordParts.every(part => 
                part.length > 2 && normalizedMsg.includes(part)
            );
            if (allPartsMatch) return true;
        }
    }
    return false;
}

/**
 * Detect intent từ user message - Enhanced version
 */
function detectIntent(message) {
    if (!message || typeof message !== 'string') {
        return { intent: 'query', confidence: 0, params: {} };
    }

    const lowerMessage = message.toLowerCase().trim();
    const normalizedMessage = normalizeVietnamese(lowerMessage);
    let bestMatch = { intent: 'query', confidence: 0, params: {} };

    // First, check action patterns for high confidence matches
    for (const [intent, patterns] of Object.entries(ACTION_PATTERNS)) {
        for (const pattern of patterns) {
            const match = lowerMessage.match(pattern);
            if (match) {
                return {
                    intent,
                    confidence: 0.95,
                    params: extractParamsFromPattern(intent, match)
                };
            }
        }
    }

    // Check question patterns
    for (const [questionType, patterns] of Object.entries(QUESTION_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerMessage.match(pattern)) {
                // Map question types to intents
                if (questionType === 'how_many') {
                    return { intent: 'get_statistics', confidence: 0.9, params: {} };
                }
            }
        }
    }

    // Then check keywords with fuzzy matching
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        let matchCount = 0;
        let totalWeight = 0;
        
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeVietnamese(keyword);
            const weight = keyword.length > 5 ? 2 : 1; // Longer keywords have more weight
            
            if (fuzzyKeywordMatch(lowerMessage, [keyword])) {
                matchCount += weight;
                totalWeight += weight;
            } else {
                totalWeight += weight;
            }
        }

        // Calculate confidence based on keyword matches
        const confidence = matchCount / Math.max(totalWeight, 1);
        if (confidence > bestMatch.confidence) {
            bestMatch = {
                intent,
                confidence,
                params: {}
            };
        }
    }

    // Special handling for common queries
    if (lowerMessage.includes('bao nhiêu') || lowerMessage.includes('how many') || lowerMessage.includes('tổng số')) {
        if (bestMatch.confidence < 0.5) {
            return { intent: 'get_statistics', confidence: 0.8, params: {} };
        }
    }

    // If confidence is too low, default to query
    if (bestMatch.confidence < 0.2) {
        return { intent: 'query', confidence: 0, params: {} };
    }

    return bestMatch;
}

/**
 * Extract parameters from pattern match - Enhanced
 */
function extractParamsFromPattern(intent, match) {
    const params = {};

    switch (intent) {
        case 'search_products':
            if (match[1]) {
                // Clean up the query - remove common words
                let query = match[1].trim();
                query = query.replace(/\b(nào|có|gì|ở đâu)\b/gi, '').trim();
                if (query) {
                    params.query = query;
                }
            }
            break;
        case 'create_order':
            if (match[1]) {
                let customerName = match[1].trim();
                // Remove common prefixes
                customerName = customerName.replace(/^(cho|với|tên|khách hàng)\s+/i, '').trim();
                if (customerName) {
                    params.customerName = customerName;
                }
            }
            break;
        case 'get_order_status':
            if (match[1]) {
                params.orderId = match[1].trim().toUpperCase();
            }
            break;
    }

    return params;
}

/**
 * Extract entities từ message - Enhanced version
 */
function extractEntities(message, intent) {
    const entities = {
        productId: null,
        productName: null,
        orderId: null,
        customerName: null,
        quantity: null,
        warehouseId: null,
        query: null
    };

    const lowerMessage = message.toLowerCase();

    // Extract order ID (ORD001, ORD123, ORD-001, etc.)
    const orderIdMatch = message.match(/\b(ORD[-_]?\d+)\b/i);
    if (orderIdMatch) {
        entities.orderId = orderIdMatch[1].toUpperCase().replace(/[-_]/g, '');
    }

    // Extract product ID (P001, PROD123, P-001, etc.)
    const productIdMatch = message.match(/\b(P[-_]?\d+|PROD[-_]?\d+)\b/i);
    if (productIdMatch) {
        entities.productId = productIdMatch[1].toUpperCase().replace(/[-_]/g, '');
    }

    // Extract quantity - many variations
    const quantityPatterns = [
        /(\d+)\s*(?:sản\s+phẩm|items?|units?|cái|chiếc)/i,
        /(?:số\s+lượng|quantity|số)\s+(\d+)/i,
        /(\d+)\s*(?:cái|chiếc|bộ)/i
    ];
    for (const pattern of quantityPatterns) {
        const match = message.match(pattern);
        if (match) {
            entities.quantity = parseInt(match[1], 10);
            break;
        }
    }

    // Extract warehouse ID
    const warehouseMatch = message.match(/\b(W[-_]?\d+|WAREHOUSE[-_]?\d+)\b/i);
    if (warehouseMatch) {
        entities.warehouseId = warehouseMatch[1].toUpperCase().replace(/[-_]/g, '');
    }

    // For search intent, extract query - improved
    if (intent === 'search_products' || intent === 'query') {
        // Try to extract product name/query from various patterns
        const searchPatterns = [
            /(?:tìm|kiếm|search|find|bán|mua|có)\s+(?:sản\s+phẩm|hàng|hàng hóa|mặt hàng|product|item)?\s*(.+?)(?:\s+(?:nào|có|ở đâu|gì))?$/i,
            /(.+?)\s+(?:sản\s+phẩm|hàng|product)/i,
            /(?:sản\s+phẩm|hàng)\s+(.+)/i
        ];
        
        for (const pattern of searchPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                let query = match[1].trim();
                // Remove common stop words
                query = query.replace(/\b(nào|có|gì|ở đâu|tìm|kiếm|sản phẩm|hàng)\b/gi, '').trim();
                if (query && query.length > 1) {
                    entities.query = query;
                    break;
                }
            }
        }
        
        // If no pattern matched, try to extract any meaningful word
        if (!entities.query) {
            const words = message.split(/\s+/).filter(word => 
                word.length > 2 && 
                !['tìm', 'kiếm', 'sản', 'phẩm', 'hàng', 'có', 'gì', 'nào'].includes(word.toLowerCase())
            );
            if (words.length > 0) {
                entities.query = words.join(' ');
            }
        }
    }

    // Extract customer name for create_order - improved
    if (intent === 'create_order') {
        const customerPatterns = [
            /(?:cho|với|for|tên)\s+(?:khách\s+hàng\s+)?([A-Za-zÀ-ỹ\s]{2,})/i,
            /(?:khách\s+hàng|customer)\s+([A-Za-zÀ-ỹ\s]{2,})/i,
            /tạo\s+đơn\s+(?:cho|với)?\s*([A-Za-zÀ-ỹ\s]{2,})/i
        ];
        
        for (const pattern of customerPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                entities.customerName = match[1].trim();
                break;
            }
        }
    }

    return entities;
}

/**
 * Parse action và parameters từ message - Enhanced
 */
function parseAction(message) {
    const { intent, params: intentParams } = detectIntent(message);
    const entities = extractEntities(message, intent);

    // Merge intent params with extracted entities
    const allParams = { ...intentParams, ...entities };

    // Clean up params (remove null/undefined/empty values)
    const cleanedParams = {};
    for (const [key, value] of Object.entries(allParams)) {
        if (value !== null && value !== undefined && value !== '' && value !== 0) {
            cleanedParams[key] = value;
        }
    }

    return {
        action: intent,
        params: cleanedParams
    };
}

/**
 * Check if message is asking for help - Enhanced
 */
function isHelpRequest(message) {
    const helpKeywords = [
        'giúp', 'help', 'hướng dẫn', 'guide', 'làm sao', 'cách', 'how',
        'giúp tôi', 'help me', 'hướng dẫn sử dụng', 'user guide',
        'làm thế nào', 'như thế nào', 'cách dùng', 'cách sử dụng',
        'tutorial', 'manual', 'instructions', '?', '???', 'help!'
    ];
    const lowerMessage = message.toLowerCase();
    return helpKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get help message with available actions - Enhanced
 */
function getHelpMessage() {
    return `Tôi có thể giúp bạn với các tác vụ sau:

📦 **Sản phẩm:**
• Tìm sản phẩm: "Tìm sản phẩm laptop" / "Có sản phẩm điện thoại không?"
• Chi tiết sản phẩm: "Thông tin sản phẩm P001" / "Giá sản phẩm P001"
• Danh sách sản phẩm: "Hiển thị tất cả sản phẩm" / "Danh sách sản phẩm"

📋 **Đơn hàng:**
• Tạo đơn hàng: "Tạo đơn hàng cho khách hàng ABC" / "Đặt hàng cho XYZ"
• Trạng thái đơn hàng: "Trạng thái đơn hàng ORD001" / "Đơn hàng ORD001 như thế nào?"
• Danh sách đơn hàng: "Hiển thị đơn hàng" / "Xem đơn hàng"

📊 **Thống kê:**
• Thống kê tổng quan: "Thống kê hệ thống" / "Tổng số sản phẩm là bao nhiêu?"
• Doanh thu: "Doanh thu tháng này" / "Doanh thu hôm nay"
• Sản phẩm bán chạy: "Sản phẩm bán chạy nhất" / "Top 5 sản phẩm"

📦 **Kho hàng:**
• Kiểm tra tồn kho: "Sản phẩm nào sắp hết hàng?" / "Kiểm tra tồn kho"
• Danh sách kho: "Hiển thị kho hàng" / "Xem kho"

💡 **Tips:**
• Bạn có thể hỏi bằng tiếng Việt hoặc tiếng Anh
• Có thể hỏi tự nhiên như: "Có bao nhiêu sản phẩm?" / "Hàng nào sắp hết?"
• Hãy thử các cách diễn đạt khác nhau!

Hãy thử một trong các câu lệnh trên!`;
}

module.exports = {
    detectIntent,
    extractEntities,
    parseAction,
    isHelpRequest,
    getHelpMessage,
    normalizeVietnamese,
    fuzzyKeywordMatch
};
