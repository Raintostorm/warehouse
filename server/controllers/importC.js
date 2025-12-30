const ImportS = require('../services/importS');
const getActor = require('../utils/getActor');
const multer = require('multer');
const logger = require('../utils/logger');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
        }
    }
});

const ImportC = {
    upload: upload.single('file'),

    importData: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const { table } = req.params;
            const actor = getActor(req);
            const fileBuffer = req.file.buffer;
            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

            let result;
            if (fileExtension === 'csv') {
                result = await ImportS.importFromCSV(fileBuffer, table, actor);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                result = await ImportS.importFromExcel(fileBuffer, table, actor);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported file format. Please use Excel (.xlsx, .xls) or CSV (.csv) files.'
                });
            }

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: `Successfully imported ${result.imported} out of ${result.total} records`,
                    imported: result.imported,
                    total: result.total,
                    errors: result.errors
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            logger.error('Import controller error', { error: error.message, stack: error.stack, table: req.params.table, filename: req.file?.originalname });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = ImportC;

