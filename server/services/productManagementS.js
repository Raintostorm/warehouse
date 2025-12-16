const ProductManagementM = require('../models/productManagementM');

const ProductManagementS = {
    findAll: async () => {
        return await ProductManagementM.findAll();
    },
    findByProductId: async (pid) => {
        return await ProductManagementM.findByProductId(pid);
    },
    findByUserId: async (uid) => {
        return await ProductManagementM.findByUserId(uid);
    },
    createProductManagement: async (productManagementData) => {
        if (!productManagementData.pid || !productManagementData.uid) {
            throw new Error('Missing required fields: pid, uid');
        }
        const existing = await ProductManagementM.findByProductAndUser(productManagementData.pid, productManagementData.uid);
        if (existing) {
            throw new Error('Product management already exists for this product and user');
        }
        return await ProductManagementM.create(productManagementData);
    },
    updateProductManagement: async (pid, uid, productManagementData) => {
        const existing = await ProductManagementM.findByProductAndUser(pid, uid);
        if (!existing) {
            throw new Error('Product management not found');
        }
        return await ProductManagementM.update(pid, uid, productManagementData);
    },
    deleteProductManagement: async (pid, uid) => {
        const existing = await ProductManagementM.findByProductAndUser(pid, uid);
        if (!existing) {
            throw new Error('Product management not found');
        }
        return await ProductManagementM.delete(pid, uid);
    }
};

module.exports = ProductManagementS;

