const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const StockHistoryM = {
    findAll: async (filters = {}) => {
        let query = 'SELECT * FROM stock_history WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.productId) {
            query += ` AND product_id = $${paramCount}`;
            values.push(filters.productId);
            paramCount++;
        }
        if (filters.warehouseId) {
            query += ` AND warehouse_id = $${paramCount}`;
            values.push(filters.warehouseId);
            paramCount++;
        }
        if (filters.transactionType) {
            query += ` AND transaction_type = $${paramCount}`;
            values.push(filters.transactionType);
            paramCount++;
        }
        if (filters.startDate) {
            query += ` AND created_at >= $${paramCount}`;
            values.push(filters.startDate);
            paramCount++;
        }
        if (filters.endDate) {
            query += ` AND created_at <= $${paramCount}`;
            values.push(filters.endDate);
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
            query.replace(/stock_history/g, '"StockHistory"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM stock_history WHERE id = $1',
            'SELECT * FROM "StockHistory" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },

    findByProductId: async (productId, limit = null) => {
        let query = 'SELECT * FROM stock_history WHERE product_id = $1 ORDER BY created_at DESC';
        const values = [productId];
        
        if (limit) {
            query += ' LIMIT $2';
            values.push(limit);
        }

        const result = await queryWithFallback(
            query,
            query.replace(/stock_history/g, '"StockHistory"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    findByWarehouseId: async (warehouseId, limit = null) => {
        let query = 'SELECT * FROM stock_history WHERE warehouse_id = $1 ORDER BY created_at DESC';
        const values = [warehouseId];
        
        if (limit) {
            query += ' LIMIT $2';
            values.push(limit);
        }

        const result = await queryWithFallback(
            query,
            query.replace(/stock_history/g, '"StockHistory"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    create: async (history) => {
        const result = await db.query(
            `INSERT INTO stock_history (
                product_id, warehouse_id, transaction_type, quantity, 
                previous_quantity, new_quantity, reference_id, reference_type, 
                notes, actor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                history.productId || history.product_id,
                history.warehouseId || history.warehouse_id || null,
                history.transactionType || history.transaction_type,
                history.quantity,
                history.previousQuantity || history.previous_quantity || null,
                history.newQuantity || history.new_quantity,
                history.referenceId || history.reference_id || null,
                history.referenceType || history.reference_type || null,
                history.notes || null,
                history.actor || null
            ]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM stock_history WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    count: async (filters = {}) => {
        let query = 'SELECT COUNT(*) as count FROM stock_history WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.productId) {
            query += ` AND product_id = $${paramCount}`;
            values.push(filters.productId);
            paramCount++;
        }
        if (filters.warehouseId) {
            query += ` AND warehouse_id = $${paramCount}`;
            values.push(filters.warehouseId);
            paramCount++;
        }
        if (filters.transactionType) {
            query += ` AND transaction_type = $${paramCount}`;
            values.push(filters.transactionType);
            paramCount++;
        }

        const result = await queryWithFallback(
            query,
            query.replace(/stock_history/g, '"StockHistory"').replace(/_/g, ''),
            values
        );
        return parseInt(result.rows[0].count);
    }
};

module.exports = StockHistoryM;

