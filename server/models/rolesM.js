const db = require('../db');

const RolesM = {
    findAll: async () => {
        const result = await db.query('SELECT * FROM roles ORDER BY name');
        return result.rows;
    },
    
    findById: async (id) => {
        const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
        return result.rows[0];
    },
    
    create: async (role) => {
        const result = await db.query(
            'INSERT INTO roles (id, name) VALUES ($1, $2) RETURNING *',
            [role.id, role.name]
        );
        return result.rows[0];
    },
    
    update: async (id, role) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (role.name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(role.name);
            paramCount++;
        }

        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(id);
        const result = await db.query(
            `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },
    
    delete: async (id) => {
        const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },
    
    findByName: async (name) => {
        const result = await db.query('SELECT * FROM roles WHERE name = $1', [name]);
        return result.rows[0];
    }
};

module.exports = RolesM;

