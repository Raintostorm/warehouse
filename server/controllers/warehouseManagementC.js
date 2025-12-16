const WarehouseManagementS = require('../services/warehouseManagementS');

const WarehouseManagementC = {
    getAllWarehouseManagements: async (req, res) => {
        try {
            const warehouseManagements = await WarehouseManagementS.findAll();
            res.json({
                success: true,
                message: 'Warehouse managements fetched successfully',
                data: warehouseManagements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch warehouse managements',
                error: error.message
            });
        }
    },
    getWarehouseManagementsByWarehouseId: async (req, res) => {
        try {
            const warehouseManagements = await WarehouseManagementS.findByWarehouseId(req.params.wid);
            res.json({
                success: true,
                message: 'Warehouse managements fetched successfully',
                data: warehouseManagements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch warehouse managements',
                error: error.message
            });
        }
    },
    getWarehouseManagementsByUserId: async (req, res) => {
        try {
            const warehouseManagements = await WarehouseManagementS.findByUserId(req.params.uid);
            res.json({
                success: true,
                message: 'Warehouse managements fetched successfully',
                data: warehouseManagements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch warehouse managements',
                error: error.message
            });
        }
    },
    createWarehouseManagement: async (req, res) => {
        try {
            const warehouseManagement = await WarehouseManagementS.createWarehouseManagement(req.body);
            res.status(201).json({
                success: true,
                message: 'Warehouse management created successfully',
                data: warehouseManagement
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('already exists')) {
                statusCode = 409;
            } else if (error.message.includes('Missing required fields')) {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to create warehouse management',
                error: error.message
            });
        }
    },
    updateWarehouseManagement: async (req, res) => {
        try {
            const { wid, uid } = req.params;
            const warehouseManagement = await WarehouseManagementS.updateWarehouseManagement(wid, uid, req.body);
            res.json({
                success: true,
                message: 'Warehouse management updated successfully',
                data: warehouseManagement
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Warehouse management not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update warehouse management',
                error: error.message
            });
        }
    },
    deleteWarehouseManagement: async (req, res) => {
        try {
            const { wid, uid } = req.params;
            const warehouseManagement = await WarehouseManagementS.deleteWarehouseManagement(wid, uid);
            res.json({
                success: true,
                message: 'Warehouse management deleted successfully',
                data: warehouseManagement
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Warehouse management not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to delete warehouse management',
                error: error.message
            });
        }
    }
};

module.exports = WarehouseManagementC;

