const db = require('../db');

const AuditLogM = {
    // Create audit log entry
    create: async (logData) => {
        const {
            tableName,
            recordId,
            action,
            actor,
            oldData,
            newData,
            changedFields,
            ipAddress,
            userAgent
        } = logData;

        const result = await db.query(`
            INSERT INTO audit_logs (
                table_name, record_id, action, actor, 
                old_data, new_data, changed_fields, 
                ip_address, user_agent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            tableName,
            recordId,
            action,
            actor,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            changedFields || [],
            ipAddress,
            userAgent
        ]);

        return result.rows[0];
    },

    // Find with filters
    findWithFilters: async (filters = {}) => {
        const {
            tableName,
            recordId,
            action,
            actor,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = filters;

        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (tableName) {
            query += ` AND table_name = $${paramCount}`;
            values.push(tableName);
            paramCount++;
        }

        if (recordId) {
            query += ` AND record_id = $${paramCount}`;
            values.push(recordId);
            paramCount++;
        }

        if (action) {
            query += ` AND action = $${paramCount}`;
            values.push(action);
            paramCount++;
        }

        if (actor) {
            query += ` AND actor = $${paramCount}`;
            values.push(actor);
            paramCount++;
        }

        if (startDate) {
            query += ` AND created_at >= $${paramCount}`;
            values.push(startDate);
            paramCount++;
        }

        if (endDate) {
            query += ` AND created_at <= $${paramCount}`;
            values.push(endDate);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);
        return result.rows.map(row => ({
            ...row,
            old_data: row.old_data ? (typeof row.old_data === 'string' ? JSON.parse(row.old_data) : row.old_data) : null,
            new_data: row.new_data ? (typeof row.new_data === 'string' ? JSON.parse(row.new_data) : row.new_data) : null
        }));
    },

    // Find by table and record
    findByTableAndRecord: async (tableName, recordId) => {
        const result = await db.query(`
            SELECT * FROM audit_logs
            WHERE table_name = $1 AND record_id = $2
            ORDER BY created_at DESC
        `, [tableName, recordId]);

        return result.rows.map(row => ({
            ...row,
            old_data: row.old_data ? (typeof row.old_data === 'string' ? JSON.parse(row.old_data) : row.old_data) : null,
            new_data: row.new_data ? (typeof row.new_data === 'string' ? JSON.parse(row.new_data) : row.new_data) : null
        }));
    },

    // Find by actor
    findByActor: async (actor, limit = 100) => {
        const result = await db.query(`
            SELECT * FROM audit_logs
            WHERE actor = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [actor, limit]);

        return result.rows.map(row => ({
            ...row,
            old_data: row.old_data ? (typeof row.old_data === 'string' ? JSON.parse(row.old_data) : row.old_data) : null,
            new_data: row.new_data ? (typeof row.new_data === 'string' ? JSON.parse(row.new_data) : row.new_data) : null
        }));
    },

    // Get count
    getCount: async (filters = {}) => {
        const {
            tableName,
            recordId,
            action,
            actor,
            startDate,
            endDate
        } = filters;

        let query = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (tableName) {
            query += ` AND table_name = $${paramCount}`;
            values.push(tableName);
            paramCount++;
        }

        if (recordId) {
            query += ` AND record_id = $${paramCount}`;
            values.push(recordId);
            paramCount++;
        }

        if (action) {
            query += ` AND action = $${paramCount}`;
            values.push(action);
            paramCount++;
        }

        if (actor) {
            query += ` AND actor = $${paramCount}`;
            values.push(actor);
            paramCount++;
        }

        if (startDate) {
            query += ` AND created_at >= $${paramCount}`;
            values.push(startDate);
            paramCount++;
        }

        if (endDate) {
            query += ` AND created_at <= $${paramCount}`;
            values.push(endDate);
            paramCount++;
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }
};

module.exports = AuditLogM;

