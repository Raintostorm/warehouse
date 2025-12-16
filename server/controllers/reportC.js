const ReportS = require('../services/reportS');

const ReportC = {
    // Generate Revenue Report
    generateRevenueReport: async (req, res) => {
        try {
            const { format, startDate, endDate } = req.query;
            
            if (format === 'pdf') {
                const result = await ReportS.generateRevenueReportPDF(startDate, endDate);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.message || 'Failed to generate revenue report',
                        error: result.error
                    });
                }
                
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.send(result.data);
            } else if (format === 'excel') {
                const result = await ReportS.generateRevenueReportExcel(startDate, endDate);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.message || 'Failed to generate revenue report',
                        error: result.error
                    });
                }
                
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.send(result.data);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid format. Use "pdf" or "excel"'
                });
            }
        } catch (error) {
            console.error('Generate Revenue Report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate revenue report',
                error: error.message
            });
        }
    },

    // Generate Inventory Report
    generateInventoryReport: async (req, res) => {
        try {
            const { format } = req.query;
            
            if (format === 'pdf') {
                const result = await ReportS.generateInventoryReportPDF();
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.message || 'Failed to generate inventory report',
                        error: result.error
                    });
                }
                
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.send(result.data);
            } else if (format === 'excel') {
                const result = await ReportS.generateInventoryReportExcel();
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.message || 'Failed to generate inventory report',
                        error: result.error
                    });
                }
                
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.send(result.data);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid format. Use "pdf" or "excel"'
                });
            }
        } catch (error) {
            console.error('Generate Inventory Report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate inventory report',
                error: error.message
            });
        }
    },

    // Generate Orders Report
    generateOrdersReport: async (req, res) => {
        try {
            const { format, startDate, endDate, orderType } = req.query;
            
            if (format === 'pdf') {
                const result = await ReportS.generateOrdersReportPDF(startDate, endDate, orderType);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.message || 'Failed to generate orders report',
                        error: result.error
                    });
                }
                
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.send(result.data);
            } else if (format === 'excel') {
                const result = await ReportS.generateOrdersReportExcel(startDate, endDate, orderType);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.message || 'Failed to generate orders report',
                        error: result.error
                    });
                }
                
                res.setHeader('Content-Type', result.contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
                res.send(result.data);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid format. Use "pdf" or "excel"'
                });
            }
        } catch (error) {
            console.error('Generate Orders Report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate orders report',
                error: error.message
            });
        }
    }
};

module.exports = ReportC;

