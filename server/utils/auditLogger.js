const AuditLogS = require('../services/auditLogS');
const logger = require('./logger');

/**
 * Helper function to log audit events
 * @param {Object} options - Audit log options
 * @param {string} options.tableName - Table name
 * @param {string} options.recordId - Record ID
 * @param {string} options.action - Action (CREATE, UPDATE, DELETE)
 * @param {string} options.actor - Actor (user email or ID)
 * @param {Object} options.oldData - Old data (for UPDATE/DELETE)
 * @param {Object} options.newData - New data (for CREATE/UPDATE)
 * @param {Object} options.req - Express request object (optional, for IP and user agent)
 */
const auditLogger = async (options) => {
    try {
        const {
            tableName,
            recordId,
            action,
            actor,
            oldData,
            newData,
            req
        } = options;

        // Determine changed fields for UPDATE
        let changedFields = [];
        if (action === 'UPDATE' && oldData && newData) {
            changedFields = Object.keys(newData).filter(key => {
                const oldValue = oldData[key];
                const newValue = newData[key];
                return oldValue !== newValue;
            });
        }

        // Get IP and user agent from request if available
        const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.headers?.['x-forwarded-for']?.split(',')[0] || null;
        const userAgent = req?.headers?.['user-agent'] || null;

        await AuditLogS.logAction({
            tableName,
            recordId,
            action,
            actor,
            oldData: oldData || null,
            newData: newData || null,
            changedFields,
            ipAddress,
            userAgent
        });
    } catch (error) {
        // Don't throw - audit logging should not break main operations
        logger.error('Audit logging error (non-critical):', error);
    }
};

module.exports = auditLogger;

