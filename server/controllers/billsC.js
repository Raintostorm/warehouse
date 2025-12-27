const BillsS = require('../services/billsS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');

const BillsC = {
    getAllBills: async (req, res) => {
        try {
            const bills = await BillsS.findAll();
            return sendSuccess(res, bills, 'Bills fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch bills');
        }
    },

    getBillById: async (req, res) => {
        try {
            const bill = await BillsS.findById(req.params.id);
            return sendSuccess(res, bill, 'Bill fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch bill');
        }
    },

    getBillsByOrderId: async (req, res) => {
        try {
            const bills = await BillsS.findByOrderId(req.params.orderId);
            return sendSuccess(res, bills, 'Bills fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch bills');
        }
    },

    getOrdersByBillId: async (req, res) => {
        try {
            const orders = await BillsS.getOrdersByBillId(req.params.id);
            return sendSuccess(res, orders, 'Orders fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch orders');
        }
    },

    getOrdersInBills: async (req, res) => {
        try {
            // Get all order IDs that are in any bill (from bill_orders or order_id)
            const allBills = await BillsS.findAll();
            const orderIdsInBills = new Set();
            
            for (const bill of allBills) {
                // Add order_id if exists (old way)
                if (bill.order_id) {
                    orderIdsInBills.add(bill.order_id);
                }
                // Get orders from bill_orders junction table (new way)
                try {
                    const orders = await BillsS.getOrdersByBillId(bill.id);
                    orders.forEach(order => {
                        orderIdsInBills.add(order.id || order.Id);
                    });
                } catch (err) {
                    // If bill_orders table doesn't exist, just continue
                }
            }
            
            return sendSuccess(res, Array.from(orderIdsInBills), 'Order IDs in bills fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch orders in bills');
        }
    },

    getUnpaidBills: async (req, res) => {
        try {
            const bills = await BillsS.getUnpaidBills();
            return sendSuccess(res, bills, 'Unpaid bills fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch unpaid bills');
        }
    },

    createBill: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const billData = {
                ...req.body,
                actor: actorInfo
            };
            const bill = await BillsS.createBill(billData);

            // Log audit
            await auditLogger({
                tableName: 'bills',
                recordId: bill.id,
                action: 'CREATE',
                actor: actorInfo,
                newData: bill,
                req
            });

            return sendSuccess(res, bill, 'Bill created successfully', 201);
        } catch (error) {
            return sendError(res, error, 'Failed to create bill');
        }
    },

    updateBill: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldBill = await BillsS.findById(req.params.id);
            const bill = await BillsS.updateBill(req.params.id, req.body);

            // Log audit
            await auditLogger({
                tableName: 'bills',
                recordId: bill.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldBill,
                newData: bill,
                req
            });

            return sendSuccess(res, bill, 'Bill updated successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to update bill');
        }
    },

    deleteBill: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldBill = await BillsS.findById(req.params.id);
            const bill = await BillsS.deleteBill(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'bills',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldBill,
                req
            });

            return sendSuccess(res, bill, 'Bill deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete bill');
        }
    }
};

module.exports = BillsC;

