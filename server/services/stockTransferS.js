const StockTransfersM = require('../models/stockTransfersM');
const InventoryS = require('./inventoryS');
const logger = require('../utils/logger');

// Helper to get actor (works with or without req)
const getActor = (reqOrActor) => {
    if (!reqOrActor) return 'System';
    if (typeof reqOrActor === 'string') return reqOrActor;
    if (reqOrActor.user) {
        return reqOrActor.user.email || reqOrActor.user.id || 'System';
    }
    return 'System';
};

async function generateTransferId() {
    const timestamp = Date.now();
    return `TRF${timestamp}`;
}

const StockTransferS = {
    /**
     * Create a new stock transfer request
     */
    createTransfer: async (transferData) => {
        try {
            // Validate required fields
            if (!transferData.productId && !transferData.product_id) {
                throw new Error('Product ID is required');
            }
            if (!transferData.fromWarehouseId && !transferData.from_warehouse_id) {
                throw new Error('From warehouse ID is required');
            }
            if (!transferData.toWarehouseId && !transferData.to_warehouse_id) {
                throw new Error('To warehouse ID is required');
            }
            if (!transferData.quantity || transferData.quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            // Check if from and to warehouses are different
            const fromWarehouseId = transferData.fromWarehouseId || transferData.from_warehouse_id;
            const toWarehouseId = transferData.toWarehouseId || transferData.to_warehouse_id;
            
            if (fromWarehouseId === toWarehouseId) {
                throw new Error('From and to warehouses must be different');
            }

            // Check if source warehouse has enough stock
            const sourceStock = await InventoryS.getCurrentStock(
                transferData.productId || transferData.product_id,
                fromWarehouseId
            );
            
            if (sourceStock < transferData.quantity) {
                throw new Error(`Insufficient stock. Available: ${sourceStock}, Requested: ${transferData.quantity}`);
            }

            // Generate transfer ID if not provided
            if (!transferData.id) {
                transferData.id = await generateTransferId();
            } else {
                // Check if ID already exists
                const existing = await StockTransfersM.findById(transferData.id);
                if (existing) {
                    throw new Error('Transfer ID already exists');
                }
            }

            const transfer = {
                id: transferData.id,
                productId: transferData.productId || transferData.product_id,
                fromWarehouseId: fromWarehouseId,
                toWarehouseId: toWarehouseId,
                quantity: transferData.quantity,
                status: 'pending',
                notes: transferData.notes || null,
                actor: transferData.actor || getActor()
            };

            return await StockTransfersM.create(transfer);
        } catch (error) {
            logger.error('Error creating stock transfer', { error: error.message, transferData });
            throw error;
        }
    },

    /**
     * Approve and execute a stock transfer
     */
    approveTransfer: async (transferId) => {
        try {
            const transfer = await StockTransfersM.findById(transferId);
            if (!transfer) {
                throw new Error('Transfer not found');
            }

            if (transfer.status !== 'pending') {
                throw new Error(`Transfer cannot be approved. Current status: ${transfer.status}`);
            }

            // Execute the transfer
            await InventoryS.transferStock({
                productId: transfer.product_id,
                fromWarehouseId: transfer.from_warehouse_id,
                toWarehouseId: transfer.to_warehouse_id,
                quantity: transfer.quantity,
                transferId: transfer.id,
                notes: transfer.notes
            });

            // Update transfer status
            const updated = await StockTransfersM.update(transferId, {
                status: 'completed',
                actor: getActor()
            });

            return updated;
        } catch (error) {
            logger.error('Error approving stock transfer', { error: error.message, transferId });
            throw error;
        }
    },

    /**
     * Cancel a pending transfer
     */
    cancelTransfer: async (transferId) => {
        try {
            const transfer = await StockTransfersM.findById(transferId);
            if (!transfer) {
                throw new Error('Transfer not found');
            }

            if (transfer.status === 'completed') {
                throw new Error('Cannot cancel a completed transfer');
            }

            if (transfer.status === 'cancelled') {
                throw new Error('Transfer is already cancelled');
            }

            return await StockTransfersM.update(transferId, {
                status: 'cancelled',
                actor: getActor()
            });
        } catch (error) {
            logger.error('Error cancelling stock transfer', { error: error.message, transferId });
            throw error;
        }
    },

    /**
     * Get all transfers with optional filters
     */
    getTransfers: async (filters = {}) => {
        try {
            return await StockTransfersM.findAll(filters);
        } catch (error) {
            logger.error('Error getting transfers', { error: error.message, filters });
            throw error;
        }
    },

    /**
     * Get transfer by ID
     */
    getTransferById: async (transferId) => {
        try {
            const transfer = await StockTransfersM.findById(transferId);
            if (!transfer) {
                throw new Error('Transfer not found');
            }
            return transfer;
        } catch (error) {
            logger.error('Error getting transfer by ID', { error: error.message, transferId });
            throw error;
        }
    },

    /**
     * Update transfer (only notes and status can be updated)
     */
    updateTransfer: async (transferId, updateData) => {
        try {
            const transfer = await StockTransfersM.findById(transferId);
            if (!transfer) {
                throw new Error('Transfer not found');
            }

            // Only allow updating notes and status (if not completed)
            const allowedUpdates = {};
            if (updateData.notes !== undefined) {
                allowedUpdates.notes = updateData.notes;
            }
            if (updateData.status !== undefined && transfer.status !== 'completed') {
                allowedUpdates.status = updateData.status;
            }

            if (Object.keys(allowedUpdates).length === 0) {
                throw new Error('No valid updates provided');
            }

            allowedUpdates.actor = getActor();
            return await StockTransfersM.update(transferId, allowedUpdates);
        } catch (error) {
            logger.error('Error updating transfer', { error: error.message, transferId, updateData });
            throw error;
        }
    },

    /**
     * Delete a transfer (only if pending or cancelled)
     */
    deleteTransfer: async (transferId) => {
        try {
            const transfer = await StockTransfersM.findById(transferId);
            if (!transfer) {
                throw new Error('Transfer not found');
            }

            if (transfer.status === 'completed') {
                throw new Error('Cannot delete a completed transfer');
            }

            return await StockTransfersM.delete(transferId);
        } catch (error) {
            logger.error('Error deleting transfer', { error: error.message, transferId });
            throw error;
        }
    }
};

module.exports = StockTransferS;

