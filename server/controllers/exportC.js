const ExportS = require('../services/exportS');
const logger = require('../utils/logger');

const ExportC = {
    exportToExcel: async (req, res) => {
        try {
            const { table } = req.params;
            const result = await ExportS.exportToExcel(table);

            if (result.success) {
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
                res.send(result.data);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            logger.error('Export controller error', { error: error.message, stack: error.stack, table: req.params.table, type: 'excel' });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    exportToCSV: async (req, res) => {
        try {
            const { table } = req.params;
            const result = await ExportS.exportToCSV(table);

            if (result.success) {
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.setHeader('Cache-Control', 'no-cache');
                res.send(result.data);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            logger.error('Export CSV controller error', { error: error.message, stack: error.stack, table: req.params.table, type: 'csv' });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = ExportC;

