const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const BillsM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM bills ORDER BY created_at DESC',
            'SELECT * FROM "Bills" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM bills WHERE id = $1',
            'SELECT * FROM "Bills" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },

    findByOrderId: async (orderId) => {
        const result = await queryWithFallback(
            'SELECT * FROM bills WHERE order_id = $1 ORDER BY created_at DESC',
            'SELECT * FROM "Bills" WHERE "OrderId" = $1 ORDER BY "CreatedAt" DESC',
            [orderId]
        );
        return result.rows;
    },

    create: async (bill) => {
        const result = await db.query(
            `INSERT INTO bills (id, order_id, total_amount, status, actor) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                bill.id,
                bill.orderId || bill.order_id,
                bill.totalAmount || bill.total_amount,
                bill.status || 'pending',
                bill.actor || null
            ]
        );
        return result.rows[0];
    },

    update: async (id, bill) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (bill.totalAmount !== undefined || bill.total_amount !== undefined) {
            updates.push(`total_amount = $${paramCount}`);
            values.push(bill.totalAmount || bill.total_amount);
            paramCount++;
        }
        if (bill.status !== undefined) {
            updates.push(`status = $${paramCount}`);
            values.push(bill.status);
            paramCount++;
        }
        if (bill.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(bill.actor);
            paramCount++;
        }

        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(
            `UPDATE bills SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM bills WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = BillsM;

