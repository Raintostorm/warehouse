const AuditLogS = require('../services/auditLogS');
const logger = require('../utils/logger');

const AuditLogC = {
    // Get all audit logs with filters
    getAuditLogs: async (req, res) => {
        try {
            const {
                tableName,
                recordId,
                action,
                actor,
                startDate,
                endDate,
                limit = 100,
                offset = 0
            } = req.query;

            const filters = {
                tableName,
                recordId,
                action,
                actor,
                startDate,
                endDate: endDate,
                limit: parseInt(limit),
                offset: parseInt(offset)
            };

            // Remove undefined filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === undefined || filters[key] === '') {
                    delete filters[key];
                }
            });

            const result = await AuditLogS.getAuditLogs(filters);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    count: result.data.length
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            logger.error('Audit log controller error', { error: error.message, stack: error.stack, method: 'getAuditLogs', filters: req.query });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get audit logs for a specific record
    getRecordHistory: async (req, res) => {
        try {
            const { tableName, recordId } = req.params;
            const result = await AuditLogS.getRecordHistory(tableName, recordId);

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            logger.error('Audit log controller error', { error: error.message, stack: error.stack, method: 'getAuditLogs', filters: req.query });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get audit logs by actor
    getActorLogs: async (req, res) => {
        try {
            const { actor } = req.params;
            const { limit = 100 } = req.query;
            const result = await AuditLogS.getActorLogs(actor, parseInt(limit));

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            logger.error('Audit log controller error', { error: error.message, stack: error.stack, method: 'getAuditLogs', filters: req.query });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = AuditLogC;

