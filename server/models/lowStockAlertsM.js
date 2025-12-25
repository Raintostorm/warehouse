const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const LowStockAlertsM = {
    findAll: async (filters = {}) => {
        let query = 'SELECT * FROM low_stock_alerts WHERE 1=1';
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
        if (filters.alertLevel) {
            query += ` AND alert_level = $${paramCount}`;
            values.push(filters.alertLevel);
            paramCount++;
        }
        if (filters.isResolved !== undefined) {
            query += ` AND is_resolved = $${paramCount}`;
            values.push(filters.isResolved);
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
            query.replace(/low_stock_alerts/g, '"LowStockAlerts"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM low_stock_alerts WHERE id = $1',
            'SELECT * FROM "LowStockAlerts" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },

    findActive: async () => {
        const result = await queryWithFallback(
            'SELECT * FROM low_stock_alerts WHERE is_resolved = false ORDER BY created_at DESC',
            'SELECT * FROM "LowStockAlerts" WHERE "IsResolved" = false ORDER BY "CreatedAt" DESC'
        );
        return result.rows;
    },

    findByProductId: async (productId, includeResolved = false) => {
        let query = 'SELECT * FROM low_stock_alerts WHERE product_id = $1';
        const values = [productId];
        
        if (!includeResolved) {
            query += ' AND is_resolved = false';
        }
        
        query += ' ORDER BY created_at DESC';

        const result = await queryWithFallback(
            query,
            query.replace(/low_stock_alerts/g, '"LowStockAlerts"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    findByWarehouseId: async (warehouseId, includeResolved = false) => {
        let query = 'SELECT * FROM low_stock_alerts WHERE warehouse_id = $1';
        const values = [warehouseId];
        
        if (!includeResolved) {
            query += ' AND is_resolved = false';
        }
        
        query += ' ORDER BY created_at DESC';

        const result = await queryWithFallback(
            query,
            query.replace(/low_stock_alerts/g, '"LowStockAlerts"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    create: async (alert) => {
        const result = await db.query(
            `INSERT INTO low_stock_alerts (
                product_id, warehouse_id, current_quantity, threshold, 
                alert_level, actor
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                alert.productId || alert.product_id,
                alert.warehouseId || alert.warehouse_id || null,
                alert.currentQuantity || alert.current_quantity,
                alert.threshold,
                alert.alertLevel || alert.alert_level || 'warning',
                alert.actor || null
            ]
        );
        return result.rows[0];
    },

    update: async (id, alert) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (alert.isResolved !== undefined) {
            updates.push(`is_resolved = $${paramCount}`);
            values.push(alert.isResolved);
            paramCount++;
            
            if (alert.isResolved) {
                updates.push(`resolved_at = CURRENT_TIMESTAMP`);
                if (alert.resolvedBy || alert.resolved_by) {
                    updates.push(`resolved_by = $${paramCount}`);
                    values.push(alert.resolvedBy || alert.resolved_by);
                    paramCount++;
                }
            }
        }
        if (alert.alertLevel !== undefined || alert.alert_level !== undefined) {
            updates.push(`alert_level = $${paramCount}`);
            values.push(alert.alertLevel || alert.alert_level);
            paramCount++;
        }
        if (alert.currentQuantity !== undefined || alert.current_quantity !== undefined) {
            updates.push(`current_quantity = $${paramCount}`);
            values.push(alert.currentQuantity || alert.current_quantity);
            paramCount++;
        }

        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(id);
        const result = await db.query(
            `UPDATE low_stock_alerts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM low_stock_alerts WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    count: async (filters = {}) => {
        let query = 'SELECT COUNT(*) as count FROM low_stock_alerts WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.productId) {
            query += ` AND product_id = $${paramCount}`;
            values.push(filters.productId);
            paramCount++;
        }
        if (filters.isResolved !== undefined) {
            query += ` AND is_resolved = $${paramCount}`;
            values.push(filters.isResolved);
            paramCount++;
        }

        const result = await queryWithFallback(
            query,
            query.replace(/low_stock_alerts/g, '"LowStockAlerts"').replace(/_/g, ''),
            values
        );
        return parseInt(result.rows[0].count);
    }
};

module.exports = LowStockAlertsM;

