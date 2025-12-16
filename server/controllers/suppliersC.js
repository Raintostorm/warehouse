const SuppliersS = require('../services/suppliersS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const SuppliersC = {
    getAllSuppliers: async (req, res) => {
        try {
            const suppliers = await SuppliersS.findAll();
            return sendSuccess(res, suppliers, 'Suppliers fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch suppliers');
        }
    },

    getSupplierById: async (req, res) => {
        try {
            const supplier = await SuppliersS.findById(req.params.id);
            return sendSuccess(res, supplier, 'Supplier fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch supplier');
        }
    },

    createSupplier: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const supplierData = {
                ...req.body,
                actor: actorInfo
            };
            const supplier = await SuppliersS.createSupplier(supplierData);

            // Log audit
            await auditLogger({
                tableName: 'suppliers',
                recordId: supplier.id || supplier.Id,
                action: 'CREATE',
                actor: actorInfo,
                newData: supplier,
                req
            });

            return sendSuccess(res, supplier, 'Supplier created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create supplier');
        }
    },

    updateSupplier: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before update
            const oldSupplier = await SuppliersS.findById(req.params.id);

            const supplierData = {
                ...req.body,
                actor: actorInfo
            };
            const supplier = await SuppliersS.updateSupplier(req.params.id, supplierData);

            // Log audit
            await auditLogger({
                tableName: 'suppliers',
                recordId: supplier.id || supplier.Id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldSupplier,
                newData: supplier,
                req
            });

            return sendSuccess(res, supplier, 'Supplier updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update supplier');
        }
    },

    deleteSupplier: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before delete
            const oldSupplier = await SuppliersS.findById(req.params.id);

            const supplier = await SuppliersS.deleteSupplier(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'suppliers',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldSupplier,
                req
            });

            return sendSuccess(res, supplier, 'Supplier deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete supplier');
        }
    }
};

module.exports = SuppliersC;

