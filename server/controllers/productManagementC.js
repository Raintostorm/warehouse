const ProductManagementS = require('../services/productManagementS');

const ProductManagementC = {
    getAllProductManagements: async (req, res) => {
        try {
            const productManagements = await ProductManagementS.findAll();
            res.json({
                success: true,
                message: 'Product managements fetched successfully',
                data: productManagements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product managements',
                error: error.message
            });
        }
    },
    getProductManagementsByProductId: async (req, res) => {
        try {
            const productManagements = await ProductManagementS.findByProductId(req.params.pid);
            res.json({
                success: true,
                message: 'Product managements fetched successfully',
                data: productManagements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product managements',
                error: error.message
            });
        }
    },
    getProductManagementsByUserId: async (req, res) => {
        try {
            const productManagements = await ProductManagementS.findByUserId(req.params.uid);
            res.json({
                success: true,
                message: 'Product managements fetched successfully',
                data: productManagements
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product managements',
                error: error.message
            });
        }
    },
    createProductManagement: async (req, res) => {
        try {
            const productManagement = await ProductManagementS.createProductManagement(req.body);
            res.status(201).json({
                success: true,
                message: 'Product management created successfully',
                data: productManagement
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
                message: 'Failed to create product management',
                error: error.message
            });
        }
    },
    updateProductManagement: async (req, res) => {
        try {
            const { pid, uid } = req.params;
            const productManagement = await ProductManagementS.updateProductManagement(pid, uid, req.body);
            res.json({
                success: true,
                message: 'Product management updated successfully',
                data: productManagement
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Product management not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update product management',
                error: error.message
            });
        }
    },
    deleteProductManagement: async (req, res) => {
        try {
            const { pid, uid } = req.params;
            const productManagement = await ProductManagementS.deleteProductManagement(pid, uid);
            res.json({
                success: true,
                message: 'Product management deleted successfully',
                data: productManagement
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Product management not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to delete product management',
                error: error.message
            });
        }
    }
};

module.exports = ProductManagementC;

