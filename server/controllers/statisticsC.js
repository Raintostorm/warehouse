const StatisticsS = require('../services/statisticsS');
const CacheService = require('../utils/cacheService');
const { sendSuccess, sendError } = require('../utils/controllerHelper');
const logger = require('../utils/logger');

const StatisticsC = {
    getDashboardStats: async (req, res) => {
        try {
            // Check if refresh parameter is provided to bypass cache
            const refresh = req.query.refresh === 'true';
            if (refresh) {
                await CacheService.delete('stats:dashboard');
            }
            
            const result = await StatisticsS.getDashboardStats();
            
            if (result.success) {
                return sendSuccess(res, result.data, result.message || 'Dashboard stats fetched successfully');
            } else {
                return sendError(res, new Error(result.error || 'Failed to fetch dashboard stats'), result.message || 'Failed to fetch dashboard stats');
            }
        } catch (error) {
            logger.error('Statistics controller error', { error: error.message, stack: error.stack });
            return sendError(res, error, 'Failed to fetch dashboard stats');
        }
    },

    getSalesTrends: async (req, res) => {
        try {
            const { period = 'month', days = 30 } = req.query;
            const trends = await StatisticsS.getSalesTrends(period, parseInt(days));
            return sendSuccess(res, trends, 'Sales trends fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch sales trends');
        }
    },

    getProductPerformance: async (req, res) => {
        try {
            const { limit = 10, sortBy = 'revenue' } = req.query;
            const performance = await StatisticsS.getProductPerformance(parseInt(limit), sortBy);
            return sendSuccess(res, performance, 'Product performance fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch product performance');
        }
    },

    getWarehouseUtilization: async (req, res) => {
        try {
            const utilization = await StatisticsS.getWarehouseUtilization();
            return sendSuccess(res, utilization, 'Warehouse utilization fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch warehouse utilization');
        }
    },

    getRevenueByPeriod: async (req, res) => {
        try {
            const { period = 'month', startDate, endDate } = req.query;
            const revenue = await StatisticsS.getRevenueByPeriod(period, startDate, endDate);
            return sendSuccess(res, revenue, 'Revenue by period fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch revenue by period');
        }
    },

    getInventoryTurnover: async (req, res) => {
        try {
            const { days = 30 } = req.query;
            const turnover = await StatisticsS.getInventoryTurnover(parseInt(days));
            return sendSuccess(res, turnover, 'Inventory turnover fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch inventory turnover');
        }
    },

    getCustomerAnalytics: async (req, res) => {
        try {
            const { days = 30 } = req.query;
            const analytics = await StatisticsS.getCustomerAnalytics(parseInt(days));
            return sendSuccess(res, analytics, 'Customer analytics fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch customer analytics');
        }
    },

    getSupplierAnalytics: async (req, res) => {
        try {
            const analytics = await StatisticsS.getSupplierAnalytics();
            return sendSuccess(res, analytics, 'Supplier analytics fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch supplier analytics');
        }
    }
};

module.exports = StatisticsC;

