const db = require('../db');

const ProductDetailsM = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM product_details ORDER BY updated_at DESC');
        return result.rows;
    },
    findByProductId: async (pid) => {
        const result = await db.query('SELECT * FROM product_details WHERE pid = $1', [pid]);
        return result.rows;
    },
    findByWarehouseId: async (wid) => {
        const result = await db.query('SELECT * FROM product_details WHERE wid = $1', [wid]);
        return result.rows;
    },
    findByProductAndWarehouse: async (pid, wid) => {
        const result = await db.query('SELECT * FROM product_details WHERE pid = $1 AND wid = $2', [pid, wid]);
        return result.rows[0];
    },
    create: async (productDetail) => {
        const result = await db.query(
            'INSERT INTO product_details (pid, wid, updated_at, number, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [productDetail.pid, productDetail.wid, productDetail.updatedAt || productDetail.updated_at, productDetail.number, productDetail.note]
        );
        return result.rows[0];
    },
    update: async (pid, wid, productDetail) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (productDetail.number !== undefined) {
            updates.push(`number = $${paramCount}`);
            values.push(productDetail.number);
            paramCount++;
        }
        if (productDetail.note !== undefined) {
            updates.push(`note = $${paramCount}`);
            values.push(productDetail.note);
            paramCount++;
        }
        if (productDetail.updatedAt !== undefined || productDetail.updated_at !== undefined) {
            updates.push(`updated_at = $${paramCount}`);
            values.push(productDetail.updatedAt || productDetail.updated_at);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(pid, wid);
        const result = await db.query(
            `UPDATE product_details SET ${updates.join(', ')} WHERE pid = $${paramCount} AND wid = $${paramCount + 1} RETURNING *`,
            values
        );
        return result.rows[0];
    },
    delete: async (pid, wid) => {
        const result = await db.query('DELETE FROM product_details WHERE pid = $1 AND wid = $2 RETURNING *', [pid, wid]);
        return result.rows[0];
    }
};

module.exports = ProductDetailsM;

