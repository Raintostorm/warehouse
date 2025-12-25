const StockTransferS = require('../services/stockTransferS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const StockTransfersC = {
    getAllTransfers: async (req, res) => {
        try {
            const filters = {
                productId: req.query.productId,
                fromWarehouseId: req.query.fromWarehouseId,
                toWarehouseId: req.query.toWarehouseId,
                status: req.query.status,
                limit: req.query.limit ? parseInt(req.query.limit) : null,
                offset: req.query.offset ? parseInt(req.query.offset) : null
            };

            const transfers = await StockTransferS.getTransfers(filters);
            return sendSuccess(res, transfers, 'Stock transfers fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch stock transfers');
        }
    },

    getTransferById: async (req, res) => {
        try {
            const transfer = await StockTransferS.getTransferById(req.params.id);
            return sendSuccess(res, transfer, 'Stock transfer fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch stock transfer');
        }
    },

    createTransfer: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const transferData = {
                ...req.body,
                actor: actorInfo
            };

            const transfer = await StockTransferS.createTransfer(transferData);

            // Log audit
            await auditLogger({
                tableName: 'stock_transfers',
                recordId: transfer.id,
                action: 'CREATE',
                actor: actorInfo,
                newData: transfer,
                req
            });

            return sendSuccess(res, transfer, 'Stock transfer created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create stock transfer');
        }
    },

    updateTransfer: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldTransfer = await StockTransferS.getTransferById(req.params.id);
            const transfer = await StockTransferS.updateTransfer(req.params.id, req.body);

            // Log audit
            await auditLogger({
                tableName: 'stock_transfers',
                recordId: transfer.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldTransfer,
                newData: transfer,
                req
            });

            return sendSuccess(res, transfer, 'Stock transfer updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update stock transfer');
        }
    },

    approveTransfer: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldTransfer = await StockTransferS.getTransferById(req.params.id);
            const transfer = await StockTransferS.approveTransfer(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'stock_transfers',
                recordId: transfer.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldTransfer,
                newData: transfer,
                req
            });

            return sendSuccess(res, transfer, 'Stock transfer approved and executed successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to approve stock transfer');
        }
    },

    cancelTransfer: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldTransfer = await StockTransferS.getTransferById(req.params.id);
            const transfer = await StockTransferS.cancelTransfer(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'stock_transfers',
                recordId: transfer.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldTransfer,
                newData: transfer,
                req
            });

            return sendSuccess(res, transfer, 'Stock transfer cancelled successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to cancel stock transfer');
        }
    },

    deleteTransfer: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldTransfer = await StockTransferS.getTransferById(req.params.id);
            const transfer = await StockTransferS.deleteTransfer(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'stock_transfers',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldTransfer,
                req
            });

            return sendSuccess(res, transfer, 'Stock transfer deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete stock transfer');
        }
    }
};

module.exports = StockTransfersC;

