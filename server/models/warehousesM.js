const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const WarehousesM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM warehouses ORDER BY created_at DESC',
            'SELECT * FROM "Warehouses" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },
    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM warehouses WHERE id = $1',
            'SELECT * FROM "Warehouses" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },
    create: async (warehouse) => {
        // Handle both PascalCase and snake_case column names
        const result = await db.query(
            'INSERT INTO warehouses (id, name, address, size, type, image, started_date, end_date, actor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [warehouse.id, warehouse.name, warehouse.address, warehouse.size, warehouse.type, warehouse.image || null, warehouse.startedDate || warehouse.started_date, warehouse.endDate || warehouse.end_date, warehouse.actor]
        );
        return result.rows[0];
    },
    update: async (id, warehouse) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (warehouse.name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(warehouse.name);
            paramCount++;
        }
        if (warehouse.address !== undefined) {
            updates.push(`address = $${paramCount}`);
            values.push(warehouse.address);
            paramCount++;
        }
        if (warehouse.size !== undefined) {
            updates.push(`size = $${paramCount}`);
            values.push(warehouse.size);
            paramCount++;
        }
        if (warehouse.type !== undefined) {
            updates.push(`type = $${paramCount}`);
            values.push(warehouse.type);
            paramCount++;
        }
        if (warehouse.image !== undefined) {
            updates.push(`image = $${paramCount}`);
            values.push(warehouse.image);
            paramCount++;
        }
        if (warehouse.startedDate !== undefined) {
            updates.push(`started_date = $${paramCount}`);
            values.push(warehouse.startedDate);
            paramCount++;
        }
        if (warehouse.endDate !== undefined) {
            updates.push(`end_date = $${paramCount}`);
            values.push(warehouse.endDate);
            paramCount++;
        }
        if (warehouse.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(warehouse.actor);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(`UPDATE warehouses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = WarehousesM;

