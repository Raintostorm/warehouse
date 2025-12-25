const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const PaymentsM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM payments ORDER BY created_at DESC',
            'SELECT * FROM "Payments" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM payments WHERE id = $1',
            'SELECT * FROM "Payments" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },

    findByOrderId: async (orderId) => {
        const result = await queryWithFallback(
            'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
            'SELECT * FROM "Payments" WHERE "OrderId" = $1 ORDER BY "CreatedAt" DESC',
            [orderId]
        );
        return result.rows;
    },

    findByBillId: async (billId) => {
        const result = await queryWithFallback(
            'SELECT * FROM payments WHERE bill_id = $1 ORDER BY created_at DESC',
            'SELECT * FROM "Payments" WHERE "BillId" = $1 ORDER BY "CreatedAt" DESC',
            [billId]
        );
        return result.rows;
    },

    create: async (payment) => {
        const result = await db.query(
            `INSERT INTO payments (id, bill_id, order_id, amount, payment_method, payment_status, transaction_id, payment_date, notes, actor) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                payment.id,
                payment.billId || payment.bill_id || null,
                payment.orderId || payment.order_id,
                payment.amount,
                payment.paymentMethod || payment.payment_method,
                payment.paymentStatus || payment.payment_status || 'pending',
                payment.transactionId || payment.transaction_id || null,
                payment.paymentDate || payment.payment_date || null,
                payment.notes || null,
                payment.actor || null
            ]
        );
        return result.rows[0];
    },

    update: async (id, payment) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (payment.amount !== undefined) {
            updates.push(`amount = $${paramCount}`);
            values.push(payment.amount);
            paramCount++;
        }
        if (payment.paymentMethod !== undefined || payment.payment_method !== undefined) {
            updates.push(`payment_method = $${paramCount}`);
            values.push(payment.paymentMethod || payment.payment_method);
            paramCount++;
        }
        if (payment.paymentStatus !== undefined || payment.payment_status !== undefined) {
            updates.push(`payment_status = $${paramCount}`);
            values.push(payment.paymentStatus || payment.payment_status);
            paramCount++;
        }
        if (payment.transactionId !== undefined || payment.transaction_id !== undefined) {
            updates.push(`transaction_id = $${paramCount}`);
            values.push(payment.transactionId || payment.transaction_id);
            paramCount++;
        }
        if (payment.paymentDate !== undefined || payment.payment_date !== undefined) {
            updates.push(`payment_date = $${paramCount}`);
            values.push(payment.paymentDate || payment.payment_date);
            paramCount++;
        }
        if (payment.notes !== undefined) {
            updates.push(`notes = $${paramCount}`);
            values.push(payment.notes);
            paramCount++;
        }
        if (payment.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(payment.actor);
            paramCount++;
        }

        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(
            `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    getTotalByOrderId: async (orderId) => {
        const result = await db.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE order_id = $1 AND payment_status = $2',
            [orderId, 'completed']
        );
        return parseFloat(result.rows[0].total || 0);
    }
};

module.exports = PaymentsM;
