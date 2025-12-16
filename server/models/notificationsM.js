const db = require('../db');

const NotificationsM = {
    // Create notification
    create: async (notification) => {
        const result = await db.query(
            `INSERT INTO notifications (type, title, message, data, is_read, created_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
            [
                notification.type,
                notification.title,
                notification.message,
                notification.data ? JSON.stringify(notification.data) : null,
                notification.is_read || false
            ]
        );
        return result.rows[0];
    },

    // Find all notifications
    findAll: async (filters = {}) => {
        const { is_read, type, limit = 100, offset = 0 } = filters;

        let query = 'SELECT * FROM notifications WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (is_read !== undefined) {
            query += ` AND is_read = $${paramCount}`;
            values.push(is_read);
            paramCount++;
        }

        if (type) {
            query += ` AND type = $${paramCount}`;
            values.push(type);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);
        return result.rows.map(row => ({
            ...row,
            data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null
        }));
    },

    // Find by ID
    findById: async (id) => {
        const result = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            ...row,
            data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null
        };
    },

    // Mark as read
    markAsRead: async (id) => {
        // Try without read_at first (safer approach)
        try {
            const result = await db.query(
                'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) return null;
            const row = result.rows[0];
            return {
                ...row,
                data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null
            };
        } catch (error) {
            throw error;
        }
    },

    // Mark all as read
    markAllAsRead: async () => {
        // Simply update is_read without read_at (read_at is optional)
        const result = await db.query(
            'UPDATE notifications SET is_read = true WHERE is_read = false RETURNING *'
        );
        return result.rows.map(row => ({
            ...row,
            data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null
        }));
    },

    // Delete notification
    delete: async (id) => {
        const result = await db.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            ...row,
            data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null
        };
    },

    // Delete all read notifications
    deleteAllRead: async () => {
        const result = await db.query('DELETE FROM notifications WHERE is_read = true RETURNING *');
        return result.rows;
    },

    // Get unread count
    getUnreadCount: async () => {
        const result = await db.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = false');
        return parseInt(result.rows[0].count) || 0;
    }
};

module.exports = NotificationsM;

