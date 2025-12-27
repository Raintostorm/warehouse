const db = require('../db');

const SupplierImportHistoryM = {
    findAll: async (filters = {}) => {
        let query = 'SELECT sih.*, s.name as supplier_name, p.name as product_name, w.name as warehouse_name FROM supplier_import_history sih';
        query += ' LEFT JOIN suppliers s ON sih.supplier_id = s.id';
        query += ' LEFT JOIN products p ON sih.product_id = p.id';
        query += ' LEFT JOIN warehouses w ON sih.warehouse_id = w.id';
        query += ' WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.supplierId) {
            query += ` AND sih.supplier_id = $${paramCount}`;
            values.push(filters.supplierId);
            paramCount++;
        }
        if (filters.productId) {
            query += ` AND sih.product_id = $${paramCount}`;
            values.push(filters.productId);
            paramCount++;
        }
        if (filters.warehouseId) {
            query += ` AND sih.warehouse_id = $${paramCount}`;
            values.push(filters.warehouseId);
            paramCount++;
        }
        if (filters.orderId) {
            query += ` AND sih.order_id = $${paramCount}`;
            values.push(filters.orderId);
            paramCount++;
        }
        if (filters.startDate) {
            query += ` AND sih.import_date >= $${paramCount}`;
            values.push(filters.startDate);
            paramCount++;
        }
        if (filters.endDate) {
            query += ` AND sih.import_date <= $${paramCount}`;
            values.push(filters.endDate);
            paramCount++;
        }

        query += ' ORDER BY sih.import_date DESC, sih.created_at DESC';

        if (filters.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
            paramCount++;
        }
        if (filters.offset) {
            query += ` OFFSET $${paramCount}`;
            values.push(filters.offset);
        }

        const result = await db.query(query, values);
        return result.rows;
    },

    findById: async (id) => {
        const result = await db.query(
            'SELECT sih.*, s.name as supplier_name, p.name as product_name, w.name as warehouse_name FROM supplier_import_history sih LEFT JOIN suppliers s ON sih.supplier_id = s.id LEFT JOIN products p ON sih.product_id = p.id LEFT JOIN warehouses w ON sih.warehouse_id = w.id WHERE sih.id = $1',
            [id]
        );
        return result.rows[0];
    },

    findBySupplierId: async (supplierId, filters = {}) => {
        return await SupplierImportHistoryM.findAll({ ...filters, supplierId });
    },

    findByProductId: async (productId, filters = {}) => {
        return await SupplierImportHistoryM.findAll({ ...filters, productId });
    },

    findByWarehouseId: async (warehouseId, filters = {}) => {
        return await SupplierImportHistoryM.findAll({ ...filters, warehouseId });
    },

    create: async (historyData) => {
        const result = await db.query(
            'INSERT INTO supplier_import_history (supplier_id, product_id, warehouse_id, order_id, quantity, import_date, notes, actor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [
                historyData.supplierId || historyData.supplier_id,
                historyData.productId || historyData.product_id,
                historyData.warehouseId || historyData.warehouse_id,
                historyData.orderId || historyData.order_id,
                historyData.quantity,
                historyData.importDate || historyData.import_date || new Date().toISOString().split('T')[0],
                historyData.notes || null,
                historyData.actor || null
            ]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM supplier_import_history WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = SupplierImportHistoryM;

