const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const OrdersM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM orders ORDER BY created_at DESC',
            'SELECT * FROM "Orders" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },
    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM orders WHERE id = $1',
            'SELECT * FROM "Orders" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },
    create: async (order) => {
        // Handle both PascalCase and snake_case column names
        // Database has user_id column (not uid or u_id)
        const result = await db.query(
            'INSERT INTO orders (id, type, date, user_id, customer_name, total, actor) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [order.id, order.type, order.date, order.uId || order.u_id || order.uid || order.user_id, order.customerName || order.customer_name, order.total, order.actor]
        );
        return result.rows[0];
    },
    update: async (id, order) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (order.type !== undefined) {
            updates.push(`type = $${paramCount}`);
            values.push(order.type);
            paramCount++;
        }
        if (order.date !== undefined) {
            updates.push(`date = $${paramCount}`);
            values.push(order.date);
            paramCount++;
        }
        if (order.uId !== undefined || order.uid !== undefined || order.user_id !== undefined) {
            updates.push(`user_id = $${paramCount}`);
            values.push(order.uId || order.uid || order.user_id);
            paramCount++;
        }
        if (order.customerName !== undefined) {
            updates.push(`customer_name = $${paramCount}`);
            values.push(order.customerName);
            paramCount++;
        }
        if (order.total !== undefined) {
            updates.push(`total = $${paramCount}`);
            values.push(order.total);
            paramCount++;
        }
        if (order.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(order.actor);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = OrdersM;

