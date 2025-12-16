const SuppliersM = require('../models/suppliersM');

const SuppliersS = {
    findAll: async () => {
        return await SuppliersM.findAll();
    },
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const supplier = await SuppliersM.findById(id);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    },
    createSupplier: async (supplierData) => {
        if (!supplierData.id || !supplierData.name) {
            throw new Error('Missing required fields: id, name');
        }
        const existingSupplier = await SuppliersM.findById(supplierData.id);
        if (existingSupplier) {
            throw new Error('Supplier ID already exists');
        }
        return await SuppliersM.create(supplierData);
    },
    updateSupplier: async (id, supplierData) => {
        const existingSupplier = await SuppliersM.findById(id);
        if (!existingSupplier) {
            throw new Error('Supplier not found');
        }
        return await SuppliersM.update(id, supplierData);
    },
    deleteSupplier: async (id) => {
        const existingSupplier = await SuppliersM.findById(id);
        if (!existingSupplier) {
            throw new Error('Supplier not found');
        }
        return await SuppliersM.delete(id);
    }
};

module.exports = SuppliersS;

