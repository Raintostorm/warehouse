const ProductDetailsM = require('../models/productDetailsM');

const ProductDetailsS = {
    findAll: async () => {
        return await ProductDetailsM.findAll();
    },
    findByProductId: async (pid) => {
        return await ProductDetailsM.findByProductId(pid);
    },
    findByWarehouseId: async (wid) => {
        return await ProductDetailsM.findByWarehouseId(wid);
    },
    createProductDetail: async (productDetailData) => {
        if (!productDetailData.pid || !productDetailData.wid) {
            throw new Error('Missing required fields: pid, wid');
        }
        const existing = await ProductDetailsM.findByProductAndWarehouse(productDetailData.pid, productDetailData.wid);
        if (existing) {
            throw new Error('Product detail already exists for this product and warehouse');
        }
        return await ProductDetailsM.create(productDetailData);
    },
    updateProductDetail: async (pid, wid, productDetailData) => {
        const existing = await ProductDetailsM.findByProductAndWarehouse(pid, wid);
        if (!existing) {
            throw new Error('Product detail not found');
        }
        return await ProductDetailsM.update(pid, wid, productDetailData);
    },
    deleteProductDetail: async (pid, wid) => {
        const existing = await ProductDetailsM.findByProductAndWarehouse(pid, wid);
        if (!existing) {
            throw new Error('Product detail not found');
        }
        return await ProductDetailsM.delete(pid, wid);
    }
};

module.exports = ProductDetailsS;

