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
    },

    // Advanced Analytics Methods
    getSalesTrends: async (period = 'month', days = 30) => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');
            
            let dateFormat, interval;
            if (period === 'day') {
                dateFormat = 'YYYY-MM-DD';
                interval = '1 day';
            } else if (period === 'week') {
                dateFormat = 'YYYY-"W"WW';
                interval = '1 week';
            } else {
                dateFormat = 'YYYY-MM';
                interval = '1 month';
            }

            const result = await queryWithFallback(
                `SELECT 
                    TO_CHAR(date, $1) as period,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total), 0) as revenue,
                    COALESCE(AVG(total), 0) as avg_order_value
                FROM orders
                WHERE (type = 'Sale' OR type = 'Sell')
                AND date >= CURRENT_DATE - MAKE_INTERVAL(days => $2)
                GROUP BY TO_CHAR(date, $1)
                ORDER BY period ASC`,
                `SELECT 
                    TO_CHAR("Date", $1) as period,
                    COUNT(*) as order_count,
                    COALESCE(SUM("Total"), 0) as revenue,
                    COALESCE(AVG("Total"), 0) as avg_order_value
                FROM "Orders"
                WHERE ("Type" = 'Sale' OR "Type" = 'Sell')
                AND "Date" >= CURRENT_DATE - MAKE_INTERVAL(days => $2)
                GROUP BY TO_CHAR("Date", $1)
                ORDER BY period ASC`,
                [dateFormat, days]
            );

            return result.rows.map(row => ({
                period: row.period,
                orderCount: parseInt(row.order_count) || 0,
                revenue: parseFloat(row.revenue) || 0,
                avgOrderValue: parseFloat(row.avg_order_value) || 0
            }));
        } catch (error) {
            logger.error('Error getting sales trends', { error: error.message, period, days });
            throw error;
        }
    },

    getProductPerformance: async (limit = 10, sortBy = 'revenue') => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');
            
            let orderBy;
            if (sortBy === 'quantity') {
                orderBy = 'total_sold DESC';
            } else if (sortBy === 'orders') {
                orderBy = 'order_count DESC';
            } else {
                orderBy = 'total_revenue DESC';
            }

            const result = await queryWithFallback(
                `SELECT 
                    p.id,
                    p.name,
                    p.type,
                    p.price,
                    COALESCE(SUM(od.number), 0) as total_sold,
                    COALESCE(SUM(od.number * p.price), 0) as total_revenue,
                    COUNT(DISTINCT od.order_id) as order_count,
                    COALESCE(AVG(p.price), 0) as avg_price
                FROM products p
                LEFT JOIN order_details od ON p.id = od.product_id
                LEFT JOIN orders o ON od.order_id = o.id
                WHERE o.type = 'Sale' OR o.type = 'Sell' OR o.id IS NULL
                GROUP BY p.id, p.name, p.type, p.price
                ORDER BY ${orderBy}
                LIMIT $1`,
                `SELECT 
                    p."Id" as id,
                    p."Name" as name,
                    p."Type" as type,
                    p."Price" as price,
                    COALESCE(SUM(od."Number"), 0) as total_sold,
                    COALESCE(SUM(od."Number" * p."Price"), 0) as total_revenue,
                    COUNT(DISTINCT od."OrderId") as order_count,
                    COALESCE(AVG(p."Price"), 0) as avg_price
                FROM "Products" p
                LEFT JOIN "OrderDetails" od ON p."Id" = od."Pid"
                LEFT JOIN "Orders" o ON od."OrderId" = o."Id"
                WHERE o."Type" = 'Sale' OR o."Type" = 'Sell' OR o."Id" IS NULL
                GROUP BY p."Id", p."Name", p."Type", p."Price"
                ORDER BY ${orderBy}
                LIMIT $1`,
                [limit]
            );

            return result.rows.map(row => ({
                productId: row.id,
                productName: row.name,
                productType: row.type,
                price: parseFloat(row.price) || 0,
                totalSold: parseInt(row.total_sold) || 0,
                totalRevenue: parseFloat(row.total_revenue) || 0,
                orderCount: parseInt(row.order_count) || 0,
                avgPrice: parseFloat(row.avg_price) || 0
            }));
        } catch (error) {
            logger.error('Error getting product performance', { error: error.message, limit, sortBy });
            throw error;
        }
    },

    getWarehouseUtilization: async () => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');

            const result = await queryWithFallback(
                `SELECT 
                    w.id,
                    w.name,
                    w.type,
                    w.size,
                    COUNT(DISTINCT pd.pid) as product_count,
                    COALESCE(SUM(pd.number), 0) as total_stock,
                    COALESCE(SUM(pd.number * p.price), 0) as total_value
                FROM warehouses w
                LEFT JOIN product_details pd ON w.id = pd.wid
                LEFT JOIN products p ON pd.pid = p.id
                GROUP BY w.id, w.name, w.type, w.size
                ORDER BY total_value DESC`,
                `SELECT 
                    w."Id" as id,
                    w."Name" as name,
                    w."Type" as type,
                    w."Size" as size,
                    COUNT(DISTINCT pd."Pid") as product_count,
                    COALESCE(SUM(pd."Number"), 0) as total_stock,
                    COALESCE(SUM(pd."Number" * p."Price"), 0) as total_value
                FROM "Warehouses" w
                LEFT JOIN "ProductDetails" pd ON w."Id" = pd."Wid"
                LEFT JOIN "Products" p ON pd."Pid" = p."Id"
                GROUP BY w."Id", w."Name", w."Type", w."Size"
                ORDER BY total_value DESC`
            );

            return result.rows.map(row => ({
                warehouseId: row.id,
                warehouseName: row.name,
                warehouseType: row.type,
                size: parseFloat(row.size) || 0,
                productCount: parseInt(row.product_count) || 0,
                totalStock: parseInt(row.total_stock) || 0,
                totalValue: parseFloat(row.total_value) || 0
            }));
        } catch (error) {
            logger.error('Error getting warehouse utilization', { error: error.message });
            throw error;
        }
    },

    getRevenueByPeriod: async (period = 'month', startDate = null, endDate = null) => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');
            
            let dateFormat;
            if (period === 'day') {
                dateFormat = 'YYYY-MM-DD';
            } else if (period === 'week') {
                dateFormat = 'YYYY-"W"WW';
            } else if (period === 'year') {
                dateFormat = 'YYYY';
            } else {
                dateFormat = 'YYYY-MM';
            }

            let dateFilter = '';
            const params = [dateFormat];
            
            if (startDate && endDate) {
                dateFilter = 'AND date >= $2 AND date <= $3';
                params.push(startDate, endDate);
            } else if (startDate) {
                dateFilter = 'AND date >= $2';
                params.push(startDate);
            } else if (endDate) {
                dateFilter = 'AND date <= $2';
                params.push(endDate);
            }

            const result = await queryWithFallback(
                `SELECT 
                    TO_CHAR(date, $1) as period,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total), 0) as revenue
                FROM orders
                WHERE (type = 'Sale' OR type = 'Sell')
                ${dateFilter}
                GROUP BY TO_CHAR(date, $1)
                ORDER BY period ASC`,
                `SELECT 
                    TO_CHAR("Date", $1) as period,
                    COUNT(*) as order_count,
                    COALESCE(SUM("Total"), 0) as revenue
                FROM "Orders"
                WHERE ("Type" = 'Sale' OR "Type" = 'Sell')
                ${dateFilter.replace(/date/g, '"Date"')}
                GROUP BY TO_CHAR("Date", $1)
                ORDER BY period ASC`,
                params
            );

            return result.rows.map(row => ({
                period: row.period,
                orderCount: parseInt(row.order_count) || 0,
                revenue: parseFloat(row.revenue) || 0
            }));
        } catch (error) {
            logger.error('Error getting revenue by period', { error: error.message, period, startDate, endDate });
            throw error;
        }
    },

    getInventoryTurnover: async (days = 30) => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');

            const result = await queryWithFallback(
                `SELECT 
                    p.id,
                    p.name,
                    p.number as current_stock,
                    COALESCE(SUM(od.number), 0) as sold_quantity,
                    COALESCE(SUM(od.number * p.price), 0) as sold_value,
                    CASE 
                        WHEN p.number > 0 THEN COALESCE(SUM(od.number), 0)::NUMERIC / p.number
                        ELSE 0
                    END as turnover_rate
                FROM products p
                LEFT JOIN order_details od ON p.id = od.product_id
                LEFT JOIN orders o ON od.order_id = o.id
                WHERE (o.type = 'Sale' OR o.type = 'Sell' OR o.id IS NULL)
                AND (o.date >= CURRENT_DATE - MAKE_INTERVAL(days => $1) OR o.id IS NULL)
                GROUP BY p.id, p.name, p.number
                HAVING COALESCE(SUM(od.number), 0) > 0 OR p.number > 0
                ORDER BY turnover_rate DESC
                LIMIT 20`,
                `SELECT 
                    p."Id" as id,
                    p."Name" as name,
                    p."Number" as current_stock,
                    COALESCE(SUM(od."Number"), 0) as sold_quantity,
                    COALESCE(SUM(od."Number" * p."Price"), 0) as sold_value,
                    CASE 
                        WHEN p."Number" > 0 THEN COALESCE(SUM(od."Number"), 0)::NUMERIC / p."Number"
                        ELSE 0
                    END as turnover_rate
                FROM "Products" p
                LEFT JOIN "OrderDetails" od ON p."Id" = od."Pid"
                LEFT JOIN "Orders" o ON od."OrderId" = o."Id"
                WHERE (o."Type" = 'Sale' OR o."Type" = 'Sell' OR o."Id" IS NULL)
                AND (o."Date" >= CURRENT_DATE - MAKE_INTERVAL(days => $1) OR o."Id" IS NULL)
                GROUP BY p."Id", p."Name", p."Number"
                HAVING COALESCE(SUM(od."Number"), 0) > 0 OR p."Number" > 0
                ORDER BY turnover_rate DESC
                LIMIT 20`,
                [days]
            );

            return result.rows.map(row => ({
                productId: row.id,
                productName: row.name,
                currentStock: parseInt(row.current_stock) || 0,
                soldQuantity: parseInt(row.sold_quantity) || 0,
                soldValue: parseFloat(row.sold_value) || 0,
                turnoverRate: parseFloat(row.turnover_rate) || 0
            }));
        } catch (error) {
            logger.error('Error getting inventory turnover', { error: error.message, days });
            throw error;
        }
    },

    getCustomerAnalytics: async (days = 30) => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');

            const result = await queryWithFallback(
                `SELECT 
                    customer_name,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total), 0) as total_spent,
                    COALESCE(AVG(total), 0) as avg_order_value,
                    MIN(date) as first_order_date,
                    MAX(date) as last_order_date
                FROM orders
                WHERE (type = 'Sale' OR type = 'Sell')
                AND customer_name IS NOT NULL
                AND customer_name != ''
                AND date >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
                GROUP BY customer_name
                ORDER BY total_spent DESC
                LIMIT 20`,
                `SELECT 
                    "CustomerName" as customer_name,
                    COUNT(*) as order_count,
                    COALESCE(SUM("Total"), 0) as total_spent,
                    COALESCE(AVG("Total"), 0) as avg_order_value,
                    MIN("Date") as first_order_date,
                    MAX("Date") as last_order_date
                FROM "Orders"
                WHERE ("Type" = 'Sale' OR "Type" = 'Sell')
                AND "CustomerName" IS NOT NULL
                AND "CustomerName" != ''
                AND "Date" >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
                GROUP BY "CustomerName"
                ORDER BY total_spent DESC
                LIMIT 20`,
                [days]
            );

            return result.rows.map(row => ({
                customerName: row.customer_name,
                orderCount: parseInt(row.order_count) || 0,
                totalSpent: parseFloat(row.total_spent) || 0,
                avgOrderValue: parseFloat(row.avg_order_value) || 0,
                firstOrderDate: row.first_order_date,
                lastOrderDate: row.last_order_date
            }));
        } catch (error) {
            logger.error('Error getting customer analytics', { error: error.message, days });
            throw error;
        }
    },

    getSupplierAnalytics: async () => {
        try {
            const db = require('../db');
            const { queryWithFallback } = require('../utils/dbHelper');

            const result = await queryWithFallback(
                `SELECT 
                    s.id,
                    s.name,
                    s.address,
                    s.phone,
                    COUNT(DISTINCT p.id) as product_count,
                    COALESCE(SUM(p.number), 0) as total_stock,
                    COALESCE(SUM(p.number * p.price), 0) as total_value
                FROM suppliers s
                LEFT JOIN products p ON s.id = p.supplier_id
                GROUP BY s.id, s.name, s.address, s.phone
                ORDER BY product_count DESC, total_value DESC`,
                `SELECT 
                    s."Id" as id,
                    s."Name" as name,
                    s."Address" as address,
                    s."Phone" as phone,
                    COUNT(DISTINCT p."Id") as product_count,
                    COALESCE(SUM(p."Number"), 0) as total_stock,
                    COALESCE(SUM(p."Number" * p."Price"), 0) as total_value
                FROM "Suppliers" s
                LEFT JOIN "Products" p ON s."Id" = p."SupplierId"
                GROUP BY s."Id", s."Name", s."Address", s."Phone"
                ORDER BY product_count DESC, total_value DESC`
            );

            return result.rows.map(row => ({
                supplierId: row.id,
                supplierName: row.name,
                address: row.address,
                phone: row.phone,
                productCount: parseInt(row.product_count) || 0,
                totalStock: parseInt(row.total_stock) || 0,
                totalValue: parseFloat(row.total_value) || 0
            }));
        } catch (error) {
            logger.error('Error getting supplier analytics', { error: error.message });
            throw error;
        }
    }
};

module.exports = StatisticsS;

