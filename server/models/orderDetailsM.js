const db = require('../db');

const OrderDetailsM = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM order_details ORDER BY order_id');
        return result.rows;
    },
    findByOrderId: async (oid) => {
        const result = await db.query('SELECT * FROM order_details WHERE order_id = $1', [oid]);
        return result.rows;
    },
    findByProductId: async (pid) => {
        const result = await db.query('SELECT * FROM order_details WHERE product_id = $1', [pid]);
        return result.rows;
    },
    findByOrderAndProduct: async (oid, pid, wid = null) => {
        if (wid) {
            const result = await db.query('SELECT * FROM order_details WHERE order_id = $1 AND product_id = $2 AND warehouse_id = $3', [oid, pid, wid]);
            return result.rows[0];
        }
        // For backward compatibility, return first match if warehouse not specified
        const result = await db.query('SELECT * FROM order_details WHERE order_id = $1 AND product_id = $2 LIMIT 1', [oid, pid]);
        return result.rows[0];
    },
    create: async (orderDetail) => {
        // Handle both oid/order_id and pid/product_id for compatibility
        const orderId = orderDetail.oid || orderDetail.order_id;
        const productId = orderDetail.pid || orderDetail.product_id;
        const warehouseId = orderDetail.wid || orderDetail.warehouse_id || orderDetail.warehouseId;
        
        if (!warehouseId) {
            throw new Error('warehouse_id is required for order_details');
        }
        
        const result = await db.query(
            'INSERT INTO order_details (order_id, product_id, warehouse_id, number, note, actor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [orderId, productId, warehouseId, orderDetail.number, orderDetail.note, orderDetail.actor || null]
        );
        return result.rows[0];
    },
    update: async (oid, pid, wid, orderDetail) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (orderDetail.number !== undefined) {
            updates.push(`number = $${paramCount}`);
            values.push(orderDetail.number);
            paramCount++;
        }
        if (orderDetail.note !== undefined) {
            updates.push(`note = $${paramCount}`);
            values.push(orderDetail.note);
            paramCount++;
        }
        if (orderDetail.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(orderDetail.actor);
            paramCount++;
        }
        if (orderDetail.warehouseId !== undefined || orderDetail.warehouse_id !== undefined || orderDetail.wid !== undefined) {
            updates.push(`warehouse_id = $${paramCount}`);
            values.push(orderDetail.warehouseId || orderDetail.warehouse_id || orderDetail.wid);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        // Use warehouse_id in WHERE clause if provided, otherwise use the one from parameters
        const warehouseId = wid || orderDetail.warehouseId || orderDetail.warehouse_id || orderDetail.wid;
        if (!warehouseId) {
            throw new Error('warehouse_id is required for update');
        }

        values.push(oid, pid, warehouseId);
        const result = await db.query(
            `UPDATE order_details SET ${updates.join(', ')} WHERE order_id = $${paramCount} AND product_id = $${paramCount + 1} AND warehouse_id = $${paramCount + 2} RETURNING *`,
            values
        );
        return result.rows[0];
    },
    delete: async (oid, pid, wid = null) => {
        if (wid) {
            const result = await db.query('DELETE FROM order_details WHERE order_id = $1 AND product_id = $2 AND warehouse_id = $3 RETURNING *', [oid, pid, wid]);
            return result.rows[0];
        }
        // For backward compatibility, delete first match if warehouse not specified
        const result = await db.query('DELETE FROM order_details WHERE order_id = $1 AND product_id = $2 RETURNING *', [oid, pid]);
        return result.rows[0];
    }
};

module.exports = OrderDetailsM;

