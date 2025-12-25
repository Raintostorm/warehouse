const ProductsS = require('../services/productsS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const ProductsC = {
    getAllProducts: async (req, res) => {
        try {
            const products = await ProductsS.findAll();
            return sendSuccess(res, products, 'Products fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch products');
        }
    },

    getProductById: async (req, res) => {
        try {
            const product = await ProductsS.findById(req.params.id);
            return sendSuccess(res, product, 'Product fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch product');
        }
    },

    createProduct: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const productData = {
                ...req.body,
                actor: actorInfo
            };
            const product = await ProductsS.createProduct(productData);

            // Log audit
            await auditLogger({
                tableName: 'products',
                recordId: product.id || product.Id,
                action: 'CREATE',
                actor: actorInfo,
                newData: product,
                req
            });

            return sendSuccess(res, product, 'Product created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create product');
        }
    },

    updateProduct: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before update
            const oldProduct = await ProductsS.findById(req.params.id);

            const productData = {
                ...req.body,
                actor: actorInfo
            };
            const product = await ProductsS.updateProduct(req.params.id, productData);

            // Log audit
            await auditLogger({
                tableName: 'products',
                recordId: product.id || product.Id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldProduct,
                newData: product,
                req
            });

            // Record stock change in inventory history if number changed (non-blocking)
            if (productData.number !== undefined && oldProduct && oldProduct.number !== product.number) {
                try {
                    const InventoryS = require('../services/inventoryS');
                    const previousQuantity = oldProduct.number || 0;
                    const newQuantity = product.number || 0;
                    const quantityChange = newQuantity - previousQuantity;
                    
                    await InventoryS.recordStockChange({
                        productId: product.id || product.Id,
                        warehouseId: null, // Global product stock
                        transactionType: quantityChange > 0 ? 'IN' : 'ADJUSTMENT',
                        quantity: quantityChange,
                        previousQuantity,
                        newQuantity,
                        referenceType: 'product_update',
                        notes: 'Product stock updated'
                    });
                    
                    // Check for low stock
                    await InventoryS.checkLowStock(product.id || product.Id, null);
                } catch (invError) {
                    console.error('Failed to record inventory change for product:', invError);
                }
            }

            // Check low stock after update (non-blocking)
            try {
                const NotificationsS = require('../services/notificationsS');
                await NotificationsS.checkLowStock(10);
            } catch (notifError) {
                console.error('Failed to check low stock:', notifError);
            }

            return sendSuccess(res, product, 'Product updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update product');
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before delete
            const oldProduct = await ProductsS.findById(req.params.id);

            const product = await ProductsS.deleteProduct(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'products',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldProduct,
                req
            });

            return sendSuccess(res, product, 'Product deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete product');
        }
    }
};

module.exports = ProductsC;

