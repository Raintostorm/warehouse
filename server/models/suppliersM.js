const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const SuppliersM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM suppliers ORDER BY created_at DESC',
            'SELECT * FROM "Suppliers" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },
    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM suppliers WHERE id = $1',
            'SELECT * FROM "Suppliers" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },
    create: async (supplier) => {
        const result = await db.query(
            'INSERT INTO suppliers (id, name, address, phone, actor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [supplier.id, supplier.name, supplier.address, supplier.phone, supplier.actor]
        );
        return result.rows[0];
    },
    update: async (id, supplier) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (supplier.name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(supplier.name);
            paramCount++;
        }
        if (supplier.address !== undefined) {
            updates.push(`address = $${paramCount}`);
            values.push(supplier.address);
            paramCount++;
        }
        if (supplier.phone !== undefined) {
            updates.push(`phone = $${paramCount}`);
            values.push(supplier.phone);
            paramCount++;
        }
        if (supplier.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(supplier.actor);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = SuppliersM;

