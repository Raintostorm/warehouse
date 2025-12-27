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
        // Ensure total_amount is a number
        const totalAmount = parseFloat(bill.totalAmount || bill.total_amount || 0);
        if (isNaN(totalAmount)) {
            throw new Error('Invalid total_amount: must be a number');
        }
        
        const result = await db.query(
            `INSERT INTO bills (id, order_id, total_amount, status, actor) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                bill.id,
                bill.orderId || bill.order_id,
                totalAmount,
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
    },

    // Get orders for a bill (from bill_orders junction table)
    getOrdersByBillId: async (billId) => {
        try {
            const result = await db.query(
                'SELECT o.* FROM orders o INNER JOIN bill_orders bo ON o.id = bo.order_id WHERE bo.bill_id = $1 ORDER BY o.created_at',
                [billId]
            );
            return result.rows;
        } catch (error) {
            // If bill_orders table doesn't exist yet, fallback to order_id
            const bill = await BillsM.findById(billId);
            if (bill && bill.order_id) {
                const result = await db.query('SELECT * FROM orders WHERE id = $1', [bill.order_id]);
                return result.rows;
            }
            return [];
        }
    },

    // Add order to bill (bill_orders junction table)
    addOrderToBill: async (billId, orderId) => {
        try {
            const result = await db.query(
                'INSERT INTO bill_orders (bill_id, order_id) VALUES ($1, $2) ON CONFLICT (bill_id, order_id) DO NOTHING RETURNING *',
                [billId, orderId]
            );
            return result.rows[0];
        } catch (error) {
            // If bill_orders table doesn't exist, just return
            return null;
        }
    },

    // Remove order from bill
    removeOrderFromBill: async (billId, orderId) => {
        try {
            const result = await db.query(
                'DELETE FROM bill_orders WHERE bill_id = $1 AND order_id = $2 RETURNING *',
                [billId, orderId]
            );
            return result.rows[0];
        } catch (error) {
            return null;
        }
    },

    // Get bills that contain an order
    getBillsByOrderIdFromJunction: async (orderId) => {
        try {
            const result = await db.query(
                'SELECT b.* FROM bills b INNER JOIN bill_orders bo ON b.id = bo.bill_id WHERE bo.order_id = $1 ORDER BY b.created_at DESC',
                [orderId]
            );
            return result.rows;
        } catch (error) {
            // Fallback to old method
            return await BillsM.findByOrderId(orderId);
        }
    }
};

module.exports = BillsM;

