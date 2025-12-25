const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const StockTransfersM = {
    findAll: async (filters = {}) => {
        let query = 'SELECT * FROM stock_transfers WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.productId) {
            query += ` AND product_id = $${paramCount}`;
            values.push(filters.productId);
            paramCount++;
        }
        if (filters.fromWarehouseId) {
            query += ` AND from_warehouse_id = $${paramCount}`;
            values.push(filters.fromWarehouseId);
            paramCount++;
        }
        if (filters.toWarehouseId) {
            query += ` AND to_warehouse_id = $${paramCount}`;
            values.push(filters.toWarehouseId);
            paramCount++;
        }
        if (filters.status) {
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        query += ' ORDER BY created_at DESC';
        
        if (filters.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
            paramCount++;
        }
        if (filters.offset) {
            query += ` OFFSET $${paramCount}`;
            values.push(filters.offset);
        }

        const result = await queryWithFallback(
            query,
            query.replace(/stock_transfers/g, '"StockTransfers"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM stock_transfers WHERE id = $1',
            'SELECT * FROM "StockTransfers" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },

    findByProductId: async (productId) => {
        const result = await queryWithFallback(
            'SELECT * FROM stock_transfers WHERE product_id = $1 ORDER BY created_at DESC',
            'SELECT * FROM "StockTransfers" WHERE "ProductId" = $1 ORDER BY "CreatedAt" DESC',
            [productId]
        );
        return result.rows;
    },

    findByStatus: async (status) => {
        const result = await queryWithFallback(
            'SELECT * FROM stock_transfers WHERE status = $1 ORDER BY created_at DESC',
            'SELECT * FROM "StockTransfers" WHERE "Status" = $1 ORDER BY "CreatedAt" DESC',
            [status]
        );
        return result.rows;
    },

    create: async (transfer) => {
        const result = await db.query(
            `INSERT INTO stock_transfers (
                id, product_id, from_warehouse_id, to_warehouse_id, 
                quantity, status, notes, actor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                transfer.id,
                transfer.productId || transfer.product_id,
                transfer.fromWarehouseId || transfer.from_warehouse_id,
                transfer.toWarehouseId || transfer.to_warehouse_id,
                transfer.quantity,
                transfer.status || 'pending',
                transfer.notes || null,
                transfer.actor || null
            ]
        );
        return result.rows[0];
    },

    update: async (id, transfer) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (transfer.status !== undefined) {
            updates.push(`status = $${paramCount}`);
            values.push(transfer.status);
            paramCount++;
        }
        if (transfer.notes !== undefined) {
            updates.push(`notes = $${paramCount}`);
            values.push(transfer.notes);
            paramCount++;
        }
        if (transfer.actor !== undefined) {
            updates.push(`actor = $${paramCount}`);
            values.push(transfer.actor);
            paramCount++;
        }
        if (transfer.status === 'completed' && !transfer.completedAt && !transfer.completed_at) {
            updates.push(`completed_at = CURRENT_TIMESTAMP`);
        }

        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(id);
        const result = await db.query(
            `UPDATE stock_transfers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM stock_transfers WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    count: async (filters = {}) => {
        let query = 'SELECT COUNT(*) as count FROM stock_transfers WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.productId) {
            query += ` AND product_id = $${paramCount}`;
            values.push(filters.productId);
            paramCount++;
        }
        if (filters.status) {
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        const result = await queryWithFallback(
            query,
            query.replace(/stock_transfers/g, '"StockTransfers"').replace(/_/g, ''),
            values
        );
        return parseInt(result.rows[0].count);
    }
};

module.exports = StockTransfersM;

