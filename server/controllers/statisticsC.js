const StatisticsS = require('../services/statisticsS');

const StatisticsC = {
    getDashboardStats: async (req, res) => {
        try {
            const result = await StatisticsS.getDashboardStats();
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Statistics controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    getSalesTrends: async (req, res) => {
        try {
            const { period = 'month', days = 30 } = req.query;
            const trends = await StatisticsS.getSalesTrends(period, parseInt(days));
            return res.status(200).json({
                success: true,
                data: trends,
                message: 'Sales trends fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch sales trends',
                error: error.message
            });
        }
    },

    getProductPerformance: async (req, res) => {
        try {
            const { limit = 10, sortBy = 'revenue' } = req.query;
            const performance = await StatisticsS.getProductPerformance(parseInt(limit), sortBy);
            return res.status(200).json({
                success: true,
                data: performance,
                message: 'Product performance fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch product performance',
                error: error.message
            });
        }
    },

    getWarehouseUtilization: async (req, res) => {
        try {
            const utilization = await StatisticsS.getWarehouseUtilization();
            return res.status(200).json({
                success: true,
                data: utilization,
                message: 'Warehouse utilization fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch warehouse utilization',
                error: error.message
            });
        }
    },

    getRevenueByPeriod: async (req, res) => {
        try {
            const { period = 'month', startDate, endDate } = req.query;
            const revenue = await StatisticsS.getRevenueByPeriod(period, startDate, endDate);
            return res.status(200).json({
                success: true,
                data: revenue,
                message: 'Revenue by period fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch revenue by period',
                error: error.message
            });
        }
    },

    getInventoryTurnover: async (req, res) => {
        try {
            const { days = 30 } = req.query;
            const turnover = await StatisticsS.getInventoryTurnover(parseInt(days));
            return res.status(200).json({
                success: true,
                data: turnover,
                message: 'Inventory turnover fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch inventory turnover',
                error: error.message
            });
        }
    },

    getCustomerAnalytics: async (req, res) => {
        try {
            const { days = 30 } = req.query;
            const analytics = await StatisticsS.getCustomerAnalytics(parseInt(days));
            return res.status(200).json({
                success: true,
                data: analytics,
                message: 'Customer analytics fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch customer analytics',
                error: error.message
            });
        }
    },

    getSupplierAnalytics: async (req, res) => {
        try {
            const analytics = await StatisticsS.getSupplierAnalytics();
            return res.status(200).json({
                success: true,
                data: analytics,
                message: 'Supplier analytics fetched successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch supplier analytics',
                error: error.message
            });
        }
    }
};

module.exports = StatisticsC;

