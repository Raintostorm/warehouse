const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const StatisticsM = {
    // Tổng số lượng
    getCounts: async () => {
        const usersCount = await queryWithFallback(
            'SELECT COUNT(*) as count FROM users',
            'SELECT COUNT(*) as count FROM "Users"'
        );
        const productsCount = await queryWithFallback(
            'SELECT COUNT(*) as count FROM products',
            'SELECT COUNT(*) as count FROM "Products"'
        );
        const ordersCount = await queryWithFallback(
            'SELECT COUNT(*) as count FROM orders',
            'SELECT COUNT(*) as count FROM "Orders"'
        );
        const warehousesCount = await queryWithFallback(
            'SELECT COUNT(*) as count FROM warehouses',
            'SELECT COUNT(*) as count FROM "Warehouses"'
        );
        const suppliersCount = await queryWithFallback(
            'SELECT COUNT(*) as count FROM suppliers',
            'SELECT COUNT(*) as count FROM "Suppliers"'
        );

        return {
            users: parseInt(usersCount.rows[0].count),
            products: parseInt(productsCount.rows[0].count),
            orders: parseInt(ordersCount.rows[0].count),
            warehouses: parseInt(warehousesCount.rows[0].count),
            suppliers: parseInt(suppliersCount.rows[0].count)
        };
    },

    // Doanh thu
    getRevenue: async () => {
        // Tổng doanh thu
        const totalRevenue = await queryWithFallback(
            `SELECT COALESCE(SUM(total), 0) as total 
            FROM orders 
            WHERE type = 'Sale' OR type = 'Sell'`,
            `SELECT COALESCE(SUM("Total"), 0) as total 
            FROM "Orders" 
            WHERE "Type" = 'Sale' OR "Type" = 'Sell'`
        );

        // Doanh thu hôm nay
        const todayRevenue = await queryWithFallback(
            `SELECT COALESCE(SUM(total), 0) as total 
            FROM orders 
            WHERE (type = 'Sale' OR type = 'Sell') 
            AND DATE(date) = CURRENT_DATE`,
            `SELECT COALESCE(SUM("Total"), 0) as total 
            FROM "Orders" 
            WHERE ("Type" = 'Sale' OR "Type" = 'Sell') 
            AND DATE("Date") = CURRENT_DATE`
        );

        // Doanh thu tháng này
        const monthRevenue = await queryWithFallback(
            `SELECT COALESCE(SUM(total), 0) as total 
            FROM orders 
            WHERE (type = 'Sale' OR type = 'Sell') 
            AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
            `SELECT COALESCE(SUM("Total"), 0) as total 
            FROM "Orders" 
            WHERE ("Type" = 'Sale' OR "Type" = 'Sell') 
            AND EXTRACT(MONTH FROM "Date") = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM "Date") = EXTRACT(YEAR FROM CURRENT_DATE)`
        );

        // Doanh thu theo tháng (12 tháng gần nhất)
        const revenueByMonth = await queryWithFallback(
            `SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE (type = 'Sale' OR type = 'Sell')
            AND date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(date, 'YYYY-MM')
            ORDER BY month ASC`,
            `SELECT 
                TO_CHAR("Date", 'YYYY-MM') as month,
                COALESCE(SUM("Total"), 0) as revenue
            FROM "Orders"
            WHERE ("Type" = 'Sale' OR "Type" = 'Sell')
            AND "Date" >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR("Date", 'YYYY-MM')
            ORDER BY month ASC`
        );

        return {
            total: parseFloat(totalRevenue.rows[0].total) || 0,
            today: parseFloat(todayRevenue.rows[0].total) || 0,
            thisMonth: parseFloat(monthRevenue.rows[0].total) || 0,
            byMonth: revenueByMonth.rows.map(row => ({
                month: row.month,
                revenue: parseFloat(row.revenue) || 0
            }))
        };
    },

    // Đơn hàng hôm nay
    getTodayOrders: async () => {
        const result = await queryWithFallback(
            `SELECT COUNT(*) as count 
            FROM orders 
            WHERE DATE(date) = CURRENT_DATE`,
            `SELECT COUNT(*) as count 
            FROM "Orders" 
            WHERE DATE("Date") = CURRENT_DATE`
        );
        return parseInt(result.rows[0].count);
    },

    // Sản phẩm tồn kho thấp (dưới 10)
    getLowStockProducts: async () => {
        const result = await queryWithFallback(
            `SELECT id, name, number, unit, price
            FROM products
            WHERE number < 10
            ORDER BY number ASC
            LIMIT 10`,
            `SELECT "Id" as id, "Name" as name, "Number" as number, "Unit" as unit, "Price" as price
            FROM "Products"
            WHERE "Number" < 10
            ORDER BY "Number" ASC
            LIMIT 10`
        );
        return result.rows;
    },

    // Top sản phẩm bán chạy (theo order_details)
    getTopProducts: async (limit = 5) => {
        const result = await queryWithFallback(
            `SELECT 
                p.id,
                p.name,
                p.type,
                COALESCE(SUM(od.number), 0) as total_sold
            FROM products p
            LEFT JOIN order_details od ON p.id = od.product_id
            GROUP BY p.id, p.name, p.type
            ORDER BY total_sold DESC
            LIMIT $1`,
            `SELECT 
                p."Id" as id,
                p."Name" as name,
                p."Type" as type,
                COALESCE(SUM(od."Number"), 0) as total_sold
            FROM "Products" p
            LEFT JOIN "OrderDetails" od ON p."Id" = od."Pid"
            GROUP BY p."Id", p."Name", p."Type"
            ORDER BY total_sold DESC
            LIMIT $1`,
            [limit]
        );
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            totalSold: parseInt(row.total_sold) || 0
        }));
    },

    // Đơn hàng gần đây
    getRecentOrders: async (limit = 5) => {
        const result = await queryWithFallback(
            `SELECT 
                id,
                type,
                date,
                customer_name,
                total,
                created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT $1`,
            `SELECT 
                "Id" as id,
                "Type" as type,
                "Date" as date,
                "CustomerName" as customer_name,
                "Total" as total,
                "CreatedAt" as created_at
            FROM "Orders"
            ORDER BY "CreatedAt" DESC
            LIMIT $1`,
            [limit]
        );
        return result.rows;
    },

    // Doanh thu theo ngày (7 ngày gần nhất)
    getRevenueByDay: async (days = 7) => {
        const result = await queryWithFallback(
            `SELECT 
                DATE(date) as day,
                COALESCE(SUM(total), 0) as revenue,
                COUNT(*) as order_count
            FROM orders
            WHERE (type = 'Sale' OR type = 'Sell')
            AND date >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
            GROUP BY DATE(date)
            ORDER BY day ASC`,
            `SELECT 
                DATE("Date") as day,
                COALESCE(SUM("Total"), 0) as revenue,
                COUNT(*) as order_count
            FROM "Orders"
            WHERE ("Type" = 'Sale' OR "Type" = 'Sell')
            AND "Date" >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
            GROUP BY DATE("Date")
            ORDER BY day ASC`,
            [days]
        );
        return result.rows.map(row => ({
            day: row.day,
            revenue: parseFloat(row.revenue) || 0,
            orderCount: parseInt(row.order_count) || 0
        }));
    },

    // Phân bổ đơn hàng theo loại
    getOrdersByType: async () => {
        const result = await queryWithFallback(
            `SELECT 
                type,
                COUNT(*) as count,
                COALESCE(SUM(total), 0) as total_revenue
            FROM orders
            GROUP BY type
            ORDER BY count DESC`,
            `SELECT 
                "Type" as type,
                COUNT(*) as count,
                COALESCE(SUM("Total"), 0) as total_revenue
            FROM "Orders"
            GROUP BY "Type"
            ORDER BY count DESC`
        );
        return result.rows.map(row => ({
            type: row.type,
            count: parseInt(row.count) || 0,
            totalRevenue: parseFloat(row.total_revenue) || 0
        }));
    },

    // Đơn hàng theo ngày (7 ngày gần nhất)
    getOrdersByDay: async (days = 7) => {
        const result = await queryWithFallback(
            `SELECT 
                DATE(date) as day,
                COUNT(*) as count
            FROM orders
            WHERE date >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
            GROUP BY DATE(date)
            ORDER BY day ASC`,
            `SELECT 
                DATE("Date") as day,
                COUNT(*) as count
            FROM "Orders"
            WHERE "Date" >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
            GROUP BY DATE("Date")
            ORDER BY day ASC`,
            [days]
        );
        return result.rows.map(row => ({
            day: row.day,
            count: parseInt(row.count) || 0
        }));
    }
};

module.exports = StatisticsM;

