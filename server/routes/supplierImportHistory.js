const express = require('express');
const router = express.Router();
const SupplierImportHistoryM = require('../models/supplierImportHistoryM');
const authMiddleware = require('../middlewares/authMiddleware');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

// All routes require authentication
router.use(authMiddleware);

// Get import history by supplier
router.get('/supplier/:supplierId', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { startDate, endDate, limit, offset } = req.query;
        
        const filters = {
            supplierId,
            startDate: startDate || null,
            endDate: endDate || null,
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : null
        };

        const history = await SupplierImportHistoryM.findBySupplierId(supplierId, filters);
        return sendSuccess(res, history, 'Supplier import history fetched successfully');
    } catch (error) {
        return sendError(res, error, 'Failed to fetch supplier import history');
    }
});

// Get import history by product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { startDate, endDate, limit, offset } = req.query;
        
        const filters = {
            productId,
            startDate: startDate || null,
            endDate: endDate || null,
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : null
        };

        const history = await SupplierImportHistoryM.findByProductId(productId, filters);
        return sendSuccess(res, history, 'Product import history fetched successfully');
    } catch (error) {
        return sendError(res, error, 'Failed to fetch product import history');
    }
});

// Get import history by warehouse
router.get('/warehouse/:warehouseId', async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const { startDate, endDate, limit, offset } = req.query;
        
        const filters = {
            warehouseId,
            startDate: startDate || null,
            endDate: endDate || null,
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : null
        };

        const history = await SupplierImportHistoryM.findByWarehouseId(warehouseId, filters);
        return sendSuccess(res, history, 'Warehouse import history fetched successfully');
    } catch (error) {
        return sendError(res, error, 'Failed to fetch warehouse import history');
    }
});

// Get all import history with filters
router.get('/', async (req, res) => {
    try {
        const { supplierId, productId, warehouseId, orderId, startDate, endDate, limit, offset } = req.query;
        
        const filters = {
            supplierId: supplierId || null,
            productId: productId || null,
            warehouseId: warehouseId || null,
            orderId: orderId || null,
            startDate: startDate || null,
            endDate: endDate || null,
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : null
        };

        const history = await SupplierImportHistoryM.findAll(filters);
        return sendSuccess(res, history, 'Import history fetched successfully');
    } catch (error) {
        return sendError(res, error, 'Failed to fetch import history');
    }
});

module.exports = router;

