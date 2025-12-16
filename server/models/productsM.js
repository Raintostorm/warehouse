const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const ProductsM = {
    findAll: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM products ORDER BY created_at DESC',
            'SELECT * FROM "Products" ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },
    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM products WHERE id = $1',
            'SELECT * FROM "Products" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },
    create: async (product) => {
        const result = await db.query(
            'INSERT INTO products (id, name, type, unit, number, price, supplier_id, actor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [product.id, product.name, product.type, product.unit, product.number, product.price, product.supplierId || product.supplier_id, product.actor]
        );
        return result.rows[0];
    },
    update: async (id, product) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (product.name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(product.name);
            paramCount++;
        }
        if (product.type !== undefined) {
            updates.push(`type = $${paramCount}`);
            values.push(product.type);
            paramCount++;
        }
        if (product.unit !== undefined) {
            updates.push(`unit = $${paramCount}`);
            values.push(product.unit);
            paramCount++;
        }
        if (product.number !== undefined) {
            updates.push(`number = $${paramCount}`);
            values.push(product.number);
            paramCount++;
        }
        if (product.price !== undefined) {
            updates.push(`price = $${paramCount}`);
            values.push(product.price);
            paramCount++;
        }
        if (product.supplierId !== undefined || product.supplier_id !== undefined) {
            updates.push(`supplier_id = $${paramCount}`);
            values.push(product.supplierId || product.supplier_id);
            paramCount++;
        }
        if (product.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(product.actor);
            paramCount++;
        }
        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = ProductsM;

