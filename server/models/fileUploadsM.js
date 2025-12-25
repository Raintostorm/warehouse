const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const FileUploadsM = {
    findAll: async (filters = {}) => {
        let query = 'SELECT * FROM file_uploads WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.entityType) {
            query += ` AND entity_type = $${paramCount}`;
            values.push(filters.entityType);
            paramCount++;
        }
        if (filters.entityId) {
            query += ` AND entity_id = $${paramCount}`;
            values.push(filters.entityId);
            paramCount++;
        }
        if (filters.uploadType) {
            query += ` AND upload_type = $${paramCount}`;
            values.push(filters.uploadType);
            paramCount++;
        }
        if (filters.isPrimary !== undefined) {
            query += ` AND is_primary = $${paramCount}`;
            values.push(filters.isPrimary);
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
            query.replace(/file_uploads/g, '"FileUploads"').replace(/_/g, ''),
            values
        );
        return result.rows;
    },

    findById: async (id) => {
        const result = await queryWithFallback(
            'SELECT * FROM file_uploads WHERE id = $1',
            'SELECT * FROM "FileUploads" WHERE "Id" = $1',
            [id]
        );
        return result.rows[0];
    },

    findByEntity: async (entityType, entityId) => {
        const result = await queryWithFallback(
            'SELECT * FROM file_uploads WHERE entity_type = $1 AND entity_id = $2 ORDER BY is_primary DESC, created_at DESC',
            'SELECT * FROM "FileUploads" WHERE "EntityType" = $1 AND "EntityId" = $2 ORDER BY "IsPrimary" DESC, "CreatedAt" DESC',
            [entityType, entityId]
        );
        return result.rows;
    },

    findPrimaryByEntity: async (entityType, entityId) => {
        const result = await queryWithFallback(
            'SELECT * FROM file_uploads WHERE entity_type = $1 AND entity_id = $2 AND is_primary = true LIMIT 1',
            'SELECT * FROM "FileUploads" WHERE "EntityType" = $1 AND "EntityId" = $2 AND "IsPrimary" = true LIMIT 1',
            [entityType, entityId]
        );
        return result.rows[0];
    },

    create: async (fileData) => {
        const result = await db.query(
            `INSERT INTO file_uploads (
                id, entity_type, entity_id, file_name, original_name, 
                file_path, file_url, file_type, mime_type, file_size, 
                is_primary, upload_type, metadata, actor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                fileData.id,
                fileData.entityType || fileData.entity_type,
                fileData.entityId || fileData.entity_id,
                fileData.fileName || fileData.file_name,
                fileData.originalName || fileData.original_name,
                fileData.filePath || fileData.file_path,
                fileData.fileUrl || fileData.file_url || null,
                fileData.fileType || fileData.file_type || null,
                fileData.mimeType || fileData.mime_type || null,
                fileData.fileSize || fileData.file_size || null,
                fileData.isPrimary || fileData.is_primary || false,
                fileData.uploadType || fileData.upload_type || null,
                fileData.metadata ? JSON.stringify(fileData.metadata) : null,
                fileData.actor || null
            ]
        );
        return result.rows[0];
    },

    update: async (id, fileData) => {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (fileData.isPrimary !== undefined) {
            updates.push(`is_primary = $${paramCount}`);
            values.push(fileData.isPrimary);
            paramCount++;
        }
        if (fileData.fileUrl !== undefined || fileData.file_url !== undefined) {
            updates.push(`file_url = $${paramCount}`);
            values.push(fileData.fileUrl || fileData.file_url);
            paramCount++;
        }
        if (fileData.metadata !== undefined) {
            updates.push(`metadata = $${paramCount}`);
            values.push(typeof fileData.metadata === 'string' ? fileData.metadata : JSON.stringify(fileData.metadata));
            paramCount++;
        }

        if (updates.length === 0) {
            throw new Error('No updates provided');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await db.query(
            `UPDATE file_uploads SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await db.query('DELETE FROM file_uploads WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    count: async (filters = {}) => {
        let query = 'SELECT COUNT(*) as count FROM file_uploads WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.entityType) {
            query += ` AND entity_type = $${paramCount}`;
            values.push(filters.entityType);
            paramCount++;
        }
        if (filters.entityId) {
            query += ` AND entity_id = $${paramCount}`;
            values.push(filters.entityId);
            paramCount++;
        }

        const result = await queryWithFallback(
            query,
            query.replace(/file_uploads/g, '"FileUploads"').replace(/_/g, ''),
            values
        );
        return parseInt(result.rows[0].count);
    }
};

module.exports = FileUploadsM;

