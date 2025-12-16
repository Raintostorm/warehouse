const db = require('../db');

const WarehouseManagementM = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM warehouse_management ORDER BY date DESC');
        return result.rows;
    },
    findByWarehouseId: async (wid) => {
        const result = await db.query('SELECT * FROM warehouse_management WHERE wid = $1', [wid]);
        return result.rows;
    },
    findByUserId: async (uid) => {
        const result = await db.query('SELECT * FROM warehouse_management WHERE uid = $1', [uid]);
        return result.rows;
    },
    findByWarehouseAndUser: async (wid, uid) => {
        const result = await db.query('SELECT * FROM warehouse_management WHERE wid = $1 AND uid = $2', [wid, uid]);
        return result.rows[0];
    },
    create: async (warehouseManagement) => {
        const result = await db.query(
            'INSERT INTO warehouse_management (wid, uid, action, date, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [warehouseManagement.wid, warehouseManagement.uid, warehouseManagement.action, warehouseManagement.date, warehouseManagement.note]
        );
        return result.rows[0];
    },
    update: async (wid, uid, warehouseManagement) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (warehouseManagement.action !== undefined) {
            updates.push(`action = $${paramCount}`);
            values.push(warehouseManagement.action);
            paramCount++;
        }
        if (warehouseManagement.date !== undefined) {
            updates.push(`date = $${paramCount}`);
            values.push(warehouseManagement.date);
            paramCount++;
        }
        if (warehouseManagement.note !== undefined) {
            updates.push(`note = $${paramCount}`);
            values.push(warehouseManagement.note);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(wid, uid);
        const result = await db.query(
            `UPDATE warehouse_management SET ${updates.join(', ')} WHERE wid = $${paramCount} AND uid = $${paramCount + 1} RETURNING *`,
            values
        );
        return result.rows[0];
    },
    delete: async (wid, uid) => {
        const result = await db.query('DELETE FROM warehouse_management WHERE wid = $1 AND uid = $2 RETURNING *', [wid, uid]);
        return result.rows[0];
    }
};

module.exports = WarehouseManagementM;

