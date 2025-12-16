const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const UsersM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM users ORDER BY created_at DESC',
            'SELECT * FROM "Users" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },
    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM users WHERE id = $1',
            'SELECT * FROM "Users" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },
    create: async (user) => {
        const result = await db.query('INSERT INTO users (id, fullname, number, address, email, password, actor) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [user.id, user.fullname, user.number, user.address, user.email, user.password, user.actor]);
        return result.rows[0];
    },
    update: async (id, user) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (user.fullname !== undefined) {
            updates.push(`fullname = $${paramCount}`);
            values.push(user.fullname);
            paramCount++;
        }
        if (user.number !== undefined) {
            updates.push(`number = $${paramCount}`);
            values.push(user.number);
            paramCount++;
        }
        if (user.address !== undefined) {
            updates.push(`address = $${paramCount}`);
            values.push(user.address);
            paramCount++;
        }
        if (user.email !== undefined) {
            updates.push(`email = $${paramCount}`);
            values.push(user.email);
            paramCount++;
        }
        if (user.password !== undefined) {
            updates.push(`password = $${paramCount}`);
            values.push(user.password);
            paramCount++;
        }
        if (user.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(user.actor);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },
    bulkDelete: async (ids) => {
        if (!ids || ids.length === 0) {
            throw new Error('No IDs provided for bulk delete');
        }
        // Use IN clause for bulk delete
        const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
        const query = `DELETE FROM users WHERE id IN (${placeholders}) RETURNING *`;
        const result = await db.query(query, ids);
        return result.rows;
    },
    findByEmail: async (email) => {
        const result = await queryWithFallback(
            'SELECT * FROM users WHERE email = $1',
            'SELECT * FROM "Users" WHERE "Email" = $1',
            [email]
        );
        return result.rows[0];
    },
    findByNumber: async (number) => {
        const result = await queryWithFallback(
            'SELECT * FROM users WHERE number = $1',
            'SELECT * FROM "Users" WHERE "Number" = $1',
            [number]
        );
        return result.rows[0];
    }
}

module.exports = UsersM;

