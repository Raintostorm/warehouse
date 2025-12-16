const ProductDetailsS = require('../services/productDetailsS');

const ProductDetailsC = {
    getAllProductDetails: async (req, res) => {
        try {
            const productDetails = await ProductDetailsS.findAll();
            res.json({
                success: true,
                message: 'Product details fetched successfully',
                data: productDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product details',
                error: error.message
            });
        }
    },
    getProductDetailsByProductId: async (req, res) => {
        try {
            const productDetails = await ProductDetailsS.findByProductId(req.params.pid);
            res.json({
                success: true,
                message: 'Product details fetched successfully',
                data: productDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product details',
                error: error.message
            });
        }
    },
    getProductDetailsByWarehouseId: async (req, res) => {
        try {
            const productDetails = await ProductDetailsS.findByWarehouseId(req.params.wid);
            res.json({
                success: true,
                message: 'Product details fetched successfully',
                data: productDetails
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product details',
                error: error.message
            });
        }
    },
    createProductDetail: async (req, res) => {
        try {
            const productDetail = await ProductDetailsS.createProductDetail(req.body);
            res.status(201).json({
                success: true,
                message: 'Product detail created successfully',
                data: productDetail
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
                message: 'Failed to create product detail',
                error: error.message
            });
        }
    },
    updateProductDetail: async (req, res) => {
        try {
            const { pid, wid } = req.params;
            const productDetail = await ProductDetailsS.updateProductDetail(pid, wid, req.body);
            res.json({
                success: true,
                message: 'Product detail updated successfully',
                data: productDetail
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Product detail not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update product detail',
                error: error.message
            });
        }
    },
    deleteProductDetail: async (req, res) => {
        try {
            const { pid, wid } = req.params;
            const productDetail = await ProductDetailsS.deleteProductDetail(pid, wid);
            res.json({
                success: true,
                message: 'Product detail deleted successfully',
                data: productDetail
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Product detail not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to delete product detail',
                error: error.message
            });
        }
    }
};

module.exports = ProductDetailsC;

