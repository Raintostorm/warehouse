const AuditLogM = require('../models/auditLogM');

const AuditLogS = {
    // Log an action
    logAction: async (logData) => {
        try {
            const log = await AuditLogM.create(logData);
            return {
                success: true,
                data: log
            };
        } catch (error) {
            console.error('Error logging action:', error);
            // Don't throw error - audit logging should not break the main operation
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get audit logs with filters
    getAuditLogs: async (filters = {}) => {
        try {
            const logs = await AuditLogM.findWithFilters(filters);
            return {
                success: true,
                data: logs
            };
        } catch (error) {
            console.error('Error getting audit logs:', error);
            return {
                success: false,
                message: 'Failed to get audit logs',
                error: error.message
            };
        }
    },

    // Get audit logs for a specific record
    getRecordHistory: async (tableName, recordId) => {
        try {
            const logs = await AuditLogM.findByTableAndRecord(tableName, recordId);
            return {
                success: true,
                data: logs
            };
        } catch (error) {
            console.error('Error getting record history:', error);
            return {
                success: false,
                message: 'Failed to get record history',
                error: error.message
            };
        }
    },

    // Get audit logs by actor
    getActorLogs: async (actor, limit = 100) => {
        try {
            const logs = await AuditLogM.findByActor(actor, limit);
            return {
                success: true,
                data: logs
            };
        } catch (error) {
            console.error('Error getting actor logs:', error);
            return {
                success: false,
                message: 'Failed to get actor logs',
                error: error.message
            };
        }
    }
};

module.exports = AuditLogS;

