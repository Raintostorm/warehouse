const StatisticsS = require('../statisticsS');
const StatisticsM = require('../../models/statisticsM');
const logger = require('../../utils/logger');

const StatisticsActions = {
    /**
     * Get system statistics
     */
    getStatistics: async (params) => {
        try {
            const { type = 'overview' } = params;
            
            const stats = await StatisticsS.getDashboardStats();
            
            if (!stats.success) {
                return {
                    success: false,
                    message: 'Lỗi khi lấy thống kê',
                    error: stats.error
                };
            }

            const { counts, revenue, lowStockProducts, topProducts } = stats.data;

            let message = 'Thống kê hệ thống:\n\n';
            message += `📊 Tổng quan:\n`;
            message += `- Người dùng: ${counts.users}\n`;
            message += `- Sản phẩm: ${counts.products}\n`;
            message += `- Đơn hàng: ${counts.orders}\n`;
            message += `- Kho hàng: ${counts.warehouses}\n`;
            message += `- Nhà cung cấp: ${counts.suppliers}\n\n`;
            message += `💰 Doanh thu:\n`;
            message += `- Tổng: ${(revenue.total || 0).toLocaleString('vi-VN')} VNĐ\n`;
            message += `- Hôm nay: ${(revenue.today || 0).toLocaleString('vi-VN')} VNĐ\n`;
            message += `- Tháng này: ${(revenue.thisMonth || 0).toLocaleString('vi-VN')} VNĐ\n`;

            if (type === 'detailed') {
                message += `\n📦 Sản phẩm sắp hết hàng: ${lowStockProducts.length}\n`;
                message += `🏆 Top sản phẩm bán chạy: ${topProducts.length}`;
            }

            return {
                success: true,
                message: message,
                data: {
                    counts,
                    revenue,
                    lowStockProducts: lowStockProducts.slice(0, 5),
                    topProducts: topProducts.slice(0, 5)
                }
            };
        } catch (error) {
            logger.error('Error getting statistics', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy thống kê',
                error: error.message
            };
        }
    },

    /**
     * Get revenue statistics
     */
    getRevenue: async (params) => {
        try {
            const revenue = await StatisticsM.getRevenue();
            
            return {
                success: true,
                message: `Doanh thu:\n- Tổng: ${(revenue.total || 0).toLocaleString('vi-VN')} VNĐ\n- Hôm nay: ${(revenue.today || 0).toLocaleString('vi-VN')} VNĐ\n- Tháng này: ${(revenue.thisMonth || 0).toLocaleString('vi-VN')} VNĐ`,
                data: revenue
            };
        } catch (error) {
            logger.error('Error getting revenue', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy doanh thu',
                error: error.message
            };
        }
    },

    /**
     * Get top products
     */
    getTopProducts: async (params) => {
        try {
            const { limit = 5 } = params;
            const topProducts = await StatisticsM.getTopProducts(parseInt(limit, 10));
            
            let message = `Top ${topProducts.length} sản phẩm bán chạy:\n\n`;
            topProducts.forEach((product, index) => {
                message += `${index + 1}. ${product.name || 'N/A'}: ${product.total_sold || 0} sản phẩm\n`;
            });

            return {
                success: true,
                message: message,
                data: topProducts,
                count: topProducts.length
            };
        } catch (error) {
            logger.error('Error getting top products', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy sản phẩm bán chạy',
                error: error.message
            };
        }
    }
};

module.exports = StatisticsActions;

