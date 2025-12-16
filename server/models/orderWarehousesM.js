const db = require('../db');

const OrderWarehousesM = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM order_warehouses ORDER BY oid');
        return result.rows;
    },
    findByOrderId: async (oid) => {
        const result = await db.query('SELECT * FROM order_warehouses WHERE oid = $1', [oid]);
        return result.rows;
    },
    findByWarehouseId: async (wid) => {
        const result = await db.query('SELECT * FROM order_warehouses WHERE wid = $1', [wid]);
        return result.rows;
    },
    findByOrderAndWarehouse: async (oid, wid) => {
        const result = await db.query('SELECT * FROM order_warehouses WHERE oid = $1 AND wid = $2', [oid, wid]);
        return result.rows[0];
    },
    create: async (orderWarehouse) => {
        const result = await db.query(
            'INSERT INTO order_warehouses (wid, oid, note) VALUES ($1, $2, $3) RETURNING *',
            [orderWarehouse.wid, orderWarehouse.oid, orderWarehouse.note]
        );
        return result.rows[0];
    },
    update: async (wid, oid, orderWarehouse) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (orderWarehouse.note !== undefined) {
            updates.push(`note = $${paramCount}`);
            values.push(orderWarehouse.note);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(wid, oid);
        const result = await db.query(
            `UPDATE order_warehouses SET ${updates.join(', ')} WHERE wid = $${paramCount} AND oid = $${paramCount + 1} RETURNING *`,
            values
        );
        return result.rows[0];
    },
    delete: async (wid, oid) => {
        const result = await db.query('DELETE FROM order_warehouses WHERE wid = $1 AND oid = $2 RETURNING *', [wid, oid]);
        return result.rows[0];
    }
};

module.exports = OrderWarehousesM;

