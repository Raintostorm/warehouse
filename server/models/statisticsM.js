const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');
const logger = require('../utils/logger');

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
        // Tổng doanh thu - chỉ tính các order sale đã thanh toán (có bill status = 'paid')
        // Support cả bills.order_id và bill_orders junction table
        const totalRevenue = await queryWithFallback(
            `SELECT COALESCE(SUM(o.total), 0) as total 
            FROM orders o
            WHERE (o.type = 'Sale' OR o.type = 'Sell')
            AND EXISTS (
                SELECT 1 FROM bills b 
                WHERE (b.order_id = o.id OR EXISTS (
                    SELECT 1 FROM bill_orders bo 
                    WHERE bo.bill_id = b.id AND bo.order_id = o.id
                ))
                AND b.status = 'paid'
            )`,
            `SELECT COALESCE(SUM(o."Total"), 0) as total 
            FROM "Orders" o
            WHERE (o."Type" = 'Sale' OR o."Type" = 'Sell')
            AND EXISTS (
                SELECT 1 FROM "Bills" b 
                WHERE (b."OrderId" = o."Id" OR EXISTS (
                    SELECT 1 FROM "BillOrders" bo 
                    WHERE bo."BillId" = b."Id" AND bo."OrderId" = o."Id"
                ))
                AND b."Status" = 'paid'
            )`
        );

        // Doanh thu hôm nay - chỉ tính các order sale đã thanh toán
        // Thử query đơn giản trước với bills.order_id
        let todayRevenue;
        try {
            todayRevenue = await queryWithFallback(
                `SELECT COALESCE(SUM(o.total), 0) as total 
                FROM orders o
                INNER JOIN bills b ON o.id = b.order_id
                WHERE (LOWER(o.type) = 'sale' OR LOWER(o.type) = 'sell') 
                AND DATE(o.date) = CURRENT_DATE
                AND LOWER(b.status) = 'paid'`,
                `SELECT COALESCE(SUM(o."Total"), 0) as total 
                FROM "Orders" o
                INNER JOIN "Bills" b ON o."Id" = b."OrderId"
                WHERE (LOWER(o."Type") = 'sale' OR LOWER(o."Type") = 'sell') 
                AND DATE(o."Date") = CURRENT_DATE
                AND LOWER(b."Status") = 'paid'`
            );
            const todayAmount = parseFloat(todayRevenue.rows[0]?.total || 0);
            logger.info('Today revenue query result', { 
                total: todayAmount, 
                rowCount: todayRevenue.rows.length,
                currentDate: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            logger.error('Error calculating today revenue', { error: error.message, stack: error.stack });
            todayRevenue = { rows: [{ total: 0 }] };
        }

        // Doanh thu tháng này - chỉ tính các order sale đã thanh toán
        const monthRevenue = await queryWithFallback(
            `SELECT COALESCE(SUM(o.total), 0) as total 
            FROM orders o
            WHERE (o.type = 'Sale' OR o.type = 'Sell') 
            AND EXTRACT(MONTH FROM o.date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM o.date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXISTS (
                SELECT 1 FROM bills b 
                WHERE (b.order_id = o.id OR EXISTS (
                    SELECT 1 FROM bill_orders bo 
                    WHERE bo.bill_id = b.id AND bo.order_id = o.id
                ))
                AND b.status = 'paid'
            )`,
            `SELECT COALESCE(SUM(o."Total"), 0) as total 
            FROM "Orders" o
            WHERE (o."Type" = 'Sale' OR o."Type" = 'Sell') 
            AND EXTRACT(MONTH FROM o."Date") = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM o."Date") = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXISTS (
                SELECT 1 FROM "Bills" b 
                WHERE (b."OrderId" = o."Id" OR EXISTS (
                    SELECT 1 FROM "BillOrders" bo 
                    WHERE bo."BillId" = b."Id" AND bo."OrderId" = o."Id"
                ))
                AND b."Status" = 'paid'
            )`
        );

        // Doanh thu theo tháng (12 tháng gần nhất) - chỉ tính các order sale đã thanh toán
        const revenueByMonth = await queryWithFallback(
            `SELECT 
                TO_CHAR(o.date, 'YYYY-MM') as month,
                COALESCE(SUM(o.total), 0) as revenue
            FROM orders o
            WHERE (o.type = 'Sale' OR o.type = 'Sell')
            AND o.date >= CURRENT_DATE - INTERVAL '12 months'
            AND EXISTS (
                SELECT 1 FROM bills b 
                WHERE (b.order_id = o.id OR EXISTS (
                    SELECT 1 FROM bill_orders bo 
                    WHERE bo.bill_id = b.id AND bo.order_id = o.id
                ))
                AND b.status = 'paid'
            )
            GROUP BY TO_CHAR(o.date, 'YYYY-MM')
            ORDER BY month ASC`,
            `SELECT 
                TO_CHAR(o."Date", 'YYYY-MM') as month,
                COALESCE(SUM(o."Total"), 0) as revenue
            FROM "Orders" o
            WHERE (o."Type" = 'Sale' OR o."Type" = 'Sell')
            AND o."Date" >= CURRENT_DATE - INTERVAL '12 months'
            AND EXISTS (
                SELECT 1 FROM "Bills" b 
                WHERE (b."OrderId" = o."Id" OR EXISTS (
                    SELECT 1 FROM "BillOrders" bo 
                    WHERE bo."BillId" = b."Id" AND bo."OrderId" = o."Id"
                ))
                AND b."Status" = 'paid'
            )
            GROUP BY TO_CHAR(o."Date", 'YYYY-MM')
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

    // Sản phẩm tồn kho thấp (dưới 10, bao gồm cả tồn kho = 0)
    getLowStockProducts: async (threshold = 10) => {
        const result = await queryWithFallback(
            `SELECT 
                p.id,
                p.name,
                p.unit,
                p.price,
                COALESCE(SUM(COALESCE(pd.number, 0)), 0) as total_stock
            FROM products p
            LEFT JOIN product_details pd ON p.id = pd.pid
            GROUP BY p.id, p.name, p.unit, p.price
            HAVING COALESCE(SUM(COALESCE(pd.number, 0)), 0) <= $1
            ORDER BY total_stock ASC
            LIMIT 20`,
            `SELECT 
                p."Id" as id,
                p."Name" as name,
                p."Unit" as unit,
                p."Price" as price,
                COALESCE(SUM(COALESCE(pd."Number", 0)), 0) as total_stock
            FROM "Products" p
            LEFT JOIN "ProductDetails" pd ON p."Id" = pd."Pid"
            GROUP BY p."Id", p."Name", p."Unit", p."Price"
            HAVING COALESCE(SUM(COALESCE(pd."Number", 0)), 0) <= $1
            ORDER BY total_stock ASC
            LIMIT 20`,
            [threshold]
        );
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            number: parseInt(row.total_stock) || 0,
            unit: row.unit,
            price: row.price
        }));
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

    // Doanh thu theo ngày (7 ngày gần nhất) - chỉ tính các order sale đã thanh toán
    getRevenueByDay: async (days = 7) => {
        const result = await queryWithFallback(
            `SELECT 
                DATE(o.date) as day,
                COALESCE(SUM(o.total), 0) as revenue,
                COUNT(*) as order_count
            FROM orders o
            WHERE (o.type = 'Sale' OR o.type = 'Sell')
            AND o.date >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
            AND EXISTS (
                SELECT 1 FROM bills b 
                WHERE (b.order_id = o.id OR EXISTS (
                    SELECT 1 FROM bill_orders bo 
                    WHERE bo.bill_id = b.id AND bo.order_id = o.id
                ))
                AND b.status = 'paid'
            )
            GROUP BY DATE(o.date)
            ORDER BY day ASC`,
            `SELECT 
                DATE(o."Date") as day,
                COALESCE(SUM(o."Total"), 0) as revenue,
                COUNT(*) as order_count
            FROM "Orders" o
            WHERE (o."Type" = 'Sale' OR o."Type" = 'Sell')
            AND o."Date" >= CURRENT_DATE - MAKE_INTERVAL(days => $1)
            AND EXISTS (
                SELECT 1 FROM "Bills" b 
                WHERE (b."OrderId" = o."Id" OR EXISTS (
                    SELECT 1 FROM "BillOrders" bo 
                    WHERE bo."BillId" = b."Id" AND bo."OrderId" = o."Id"
                ))
                AND b."Status" = 'paid'
            )
            GROUP BY DATE(o."Date")
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

