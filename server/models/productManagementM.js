const db = require('../db');

const ProductManagementM = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM product_management ORDER BY date DESC');
        return result.rows;
    },
    findByProductId: async (pid) => {
        const result = await db.query('SELECT * FROM product_management WHERE pid = $1', [pid]);
        return result.rows;
    },
    findByUserId: async (uid) => {
        const result = await db.query('SELECT * FROM product_management WHERE uid = $1', [uid]);
        return result.rows;
    },
    findByProductAndUser: async (pid, uid) => {
        const result = await db.query('SELECT * FROM product_management WHERE pid = $1 AND uid = $2', [pid, uid]);
        return result.rows[0];
    },
    create: async (productManagement) => {
        const result = await db.query(
            'INSERT INTO product_management (pid, uid, action, number, date, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [productManagement.pid, productManagement.uid, productManagement.action, productManagement.number, productManagement.date, productManagement.note]
        );
        return result.rows[0];
    },
    update: async (pid, uid, productManagement) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (productManagement.action !== undefined) {
            updates.push(`action = $${paramCount}`);
            values.push(productManagement.action);
            paramCount++;
        }
        if (productManagement.number !== undefined) {
            updates.push(`number = $${paramCount}`);
            values.push(productManagement.number);
            paramCount++;
        }
        if (productManagement.date !== undefined) {
            updates.push(`date = $${paramCount}`);
            values.push(productManagement.date);
            paramCount++;
        }
        if (productManagement.note !== undefined) {
            updates.push(`note = $${paramCount}`);
            values.push(productManagement.note);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(pid, uid);
        const result = await db.query(
            `UPDATE product_management SET ${updates.join(', ')} WHERE pid = $${paramCount} AND uid = $${paramCount + 1} RETURNING *`,
            values
        );
        return result.rows[0];
    },
    delete: async (pid, uid) => {
        const result = await db.query('DELETE FROM product_management WHERE pid = $1 AND uid = $2 RETURNING *', [pid, uid]);
        return result.rows[0];
    }
};

module.exports = ProductManagementM;

