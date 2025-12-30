const ProductDetailsS = require('../services/productDetailsS');
const logger = require('../utils/logger');

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
            
            // Get old data before update
            const ProductDetailsM = require('../models/productDetailsM');
            const oldProductDetail = await ProductDetailsM.findByProductAndWarehouse(pid, wid);
            
            const productDetail = await ProductDetailsS.updateProductDetail(pid, wid, req.body);
            
            // Record stock change in inventory history if number changed (non-blocking)
            if (req.body.number !== undefined && oldProductDetail && oldProductDetail.number !== req.body.number) {
                try {
                    const InventoryS = require('../services/inventoryS');
                    const previousQuantity = oldProductDetail.number || 0;
                    const newQuantity = req.body.number || 0;
                    const quantityChange = newQuantity - previousQuantity;
                    
                    await InventoryS.recordStockChange({
                        productId: pid,
                        warehouseId: wid,
                        transactionType: quantityChange > 0 ? 'IN' : 'ADJUSTMENT',
                        quantity: quantityChange,
                        previousQuantity,
                        newQuantity,
                        referenceType: 'product_detail_update',
                        notes: `Product detail updated in warehouse ${wid}`
                    });
                    
                    // Check for low stock
                    await InventoryS.checkLowStock(pid, wid);
                } catch (invError) {
                    logger.error('Failed to record inventory change for product detail', { error: invError.message, stack: invError.stack, productId: pid, warehouseId: wid });
                }
            }
            
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

