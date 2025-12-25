const ProductsS = require('../productsS');
const ProductsM = require('../../models/productsM');
const logger = require('../../utils/logger');

const ProductActions = {
    /**
     * Search products by name/query - Enhanced
     */
    searchProducts: async (params) => {
        try {
            const { query, productId } = params;
            
            // If productId is provided, get product details instead
            if (productId) {
                return await ProductActions.getProductDetails({ productId });
            }

            // If no query, list all products
            if (!query || query.trim().length === 0) {
                return await ProductActions.listProducts({ limit: 20 });
            }

            const allProducts = await ProductsS.findAll();
            const searchTerm = query.toLowerCase().trim();
            
            // Enhanced search - check multiple fields and use fuzzy matching
            const results = allProducts.filter(product => {
                const name = (product.name || '').toLowerCase();
                const type = (product.type || '').toLowerCase();
                const id = (product.id || product.Id || '').toLowerCase();
                const description = (product.description || '').toLowerCase();
                
                // Exact match
                if (name.includes(searchTerm) || 
                    type.includes(searchTerm) || 
                    id.includes(searchTerm) ||
                    description.includes(searchTerm)) {
                    return true;
                }
                
                // Fuzzy match - check if search term words are in product name
                const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 2);
                if (searchWords.length > 0) {
                    const allWordsMatch = searchWords.every(word => 
                        name.includes(word) || type.includes(word)
                    );
                    if (allWordsMatch) return true;
                }
                
                return false;
            }).slice(0, 10); // Limit to 10 results

            if (results.length === 0) {
                return {
                    success: true,
                    message: `Không tìm thấy sản phẩm nào với từ khóa "${query}".\n\n💡 Gợi ý:\n• Thử từ khóa khác\n• Xem danh sách tất cả sản phẩm: "Danh sách sản phẩm"\n• Kiểm tra chính tả`,
                    data: [],
                    count: 0
                };
            }

            return {
                success: true,
                message: results.length > 0 
                    ? `Tìm thấy ${results.length} sản phẩm với từ khóa "${query}":`
                    : 'Không tìm thấy sản phẩm nào',
                data: results,
                count: results.length
            };
        } catch (error) {
            logger.error('Error searching products', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại.',
                error: error.message
            };
        }
    },

    /**
     * Get product details by ID
     */
    getProductDetails: async (params) => {
        try {
            const { productId } = params;
            if (!productId) {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp ID sản phẩm'
                };
            }

            const product = await ProductsS.findById(productId);
            if (!product) {
                return {
                    success: false,
                    message: `Không tìm thấy sản phẩm với ID: ${productId}`
                };
            }

            return {
                success: true,
                message: 'Thông tin sản phẩm:',
                data: product
            };
        } catch (error) {
            logger.error('Error getting product details', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy thông tin sản phẩm',
                error: error.message
            };
        }
    },

    /**
     * List all products
     */
    listProducts: async (params) => {
        try {
            const { limit = 20 } = params;
            const products = await ProductsS.findAll();
            const limited = products.slice(0, parseInt(limit, 10));

            return {
                success: true,
                message: `Danh sách ${limited.length} sản phẩm:`,
                data: limited,
                total: products.length,
                count: limited.length
            };
        } catch (error) {
            logger.error('Error listing products', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách sản phẩm',
                error: error.message
            };
        }
    }
};

module.exports = ProductActions;

