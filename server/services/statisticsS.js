const StatisticsM = require('../models/statisticsM');
const CacheService = require('../utils/cacheService');
const logger = require('../utils/logger');

const StatisticsS = {
    getDashboardStats: async () => {
        // Cache dashboard stats 5 phút (vì tính toán phức tạp)
        return await CacheService.getOrSet(
            'stats:dashboard',
            async () => {
                try {
                    // Try to get all stats, but handle errors gracefully
                    const results = await Promise.allSettled([
                        StatisticsM.getCounts(),
                        StatisticsM.getRevenue(),
                        StatisticsM.getTodayOrders(),
                        StatisticsM.getLowStockProducts(),
                        StatisticsM.getTopProducts(5),
                        StatisticsM.getRecentOrders(5),
                        StatisticsM.getRevenueByDay(7),
                        StatisticsM.getOrdersByType(),
                        StatisticsM.getOrdersByDay(7)
                    ]);

                    // Extract values, use defaults if failed
                    const counts = results[0].status === 'fulfilled' ? results[0].value : { users: 0, products: 0, orders: 0, warehouses: 0, suppliers: 0 };
                    const revenue = results[1].status === 'fulfilled' ? results[1].value : { total: 0, today: 0, thisMonth: 0, byMonth: [] };
                    const todayOrders = results[2].status === 'fulfilled' ? results[2].value : 0;
                    const lowStockProducts = results[3].status === 'fulfilled' ? results[3].value : [];
                    const topProducts = results[4].status === 'fulfilled' ? results[4].value : [];
                    const recentOrders = results[5].status === 'fulfilled' ? results[5].value : [];
                    const revenueByDay = results[6].status === 'fulfilled' ? results[6].value : [];
                    const ordersByType = results[7].status === 'fulfilled' ? results[7].value : [];
                    const ordersByDay = results[8].status === 'fulfilled' ? results[8].value : [];

                    // Log any failures for debugging
                    results.forEach((result, index) => {
                        if (result.status === 'rejected') {
                            logger.error('Statistics query failed', {
                                queryIndex: index,
                                error: result.reason.message,
                                stack: result.reason.stack
                            });
                        }
                    });

                    return {
                        success: true,
                        data: {
                            counts,
                            revenue,
                            todayOrders,
                            lowStockProducts,
                            topProducts,
                            recentOrders,
                            revenueByDay,
                            ordersByType,
                            ordersByDay
                        }
                    };
                } catch (error) {
                    logger.error('Error getting dashboard stats', {
                        error: error.message,
                        stack: error.stack
                    });
                    return {
                        success: false,
                        message: 'Failed to get dashboard statistics',
                        error: error.message
                    };
                }
            },
            300 // Cache 5 phút
        );
    }
};

module.exports = StatisticsS;

