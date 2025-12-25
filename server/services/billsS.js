const BillsM = require('../models/billsM');
const OrdersM = require('../models/ordersM');
const PaymentsM = require('../models/paymentsM');
const logger = require('../utils/logger');

async function generateBillId() {
    const timestamp = Date.now();
    return `BILL${timestamp}`;
}

const BillsS = {
    findAll: async () => {
        return await BillsM.findAll();
    },

    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const bill = await BillsM.findById(id);
        if (!bill) {
            throw new Error('Bill not found');
        }
        return bill;
    },

    findByOrderId: async (orderId) => {
        return await BillsM.findByOrderId(orderId);
    },

    createBill: async (billData) => {
        // Validate order exists
        const order = await OrdersM.findById(billData.orderId || billData.order_id);
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if bill already exists for this order
        const existingBills = await BillsM.findByOrderId(billData.orderId || billData.order_id);
        if (existingBills.length > 0) {
            throw new Error('Bill already exists for this order');
        }

        // Auto-generate bill ID if not provided
        if (!billData.id) {
            billData.id = await generateBillId();
        } else {
            // Check if ID already exists
            const existingBill = await BillsM.findById(billData.id);
            if (existingBill) {
                throw new Error('Bill ID already exists');
            }
        }

        // Set total_amount from order if not provided
        if (!billData.totalAmount && !billData.total_amount) {
            billData.totalAmount = parseFloat(order.total || 0);
        }

        return await BillsM.create(billData);
    },

    updateBill: async (id, billData) => {
        const existingBill = await BillsM.findById(id);
        if (!existingBill) {
            throw new Error('Bill not found');
        }
        return await BillsM.update(id, billData);
    },

    deleteBill: async (id) => {
        const existingBill = await BillsM.findById(id);
        if (!existingBill) {
            throw new Error('Bill not found');
        }
        return await BillsM.delete(id);
    },

    // Check if bill is fully paid
    isBillPaid: async (billId) => {
        try {
            const payments = await PaymentsM.findByBillId(billId);
            const totalPaid = payments
                .filter(p => p.payment_status === 'completed')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            
            const bill = await BillsM.findById(billId);
            if (!bill) return false;
            
            const billTotal = parseFloat(bill.total_amount || 0);
            return totalPaid >= billTotal;
        } catch (error) {
            // If error (e.g., bill_id column doesn't exist yet), return false
            logger.warn('Error checking if bill is paid', { billId, error: error.message });
            return false;
        }
    },

    // Get bills that are not fully paid (for payment creation)
    getUnpaidBills: async () => {
        try {
            const allBills = await BillsM.findAll();
            const unpaidBills = [];

            for (const bill of allBills) {
                // Check if bill is paid directly without recursion
                try {
                    const payments = await PaymentsM.findByBillId(bill.id);
                    const totalPaid = payments
                        .filter(p => p.payment_status === 'completed')
                        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                    
                    const billTotal = parseFloat(bill.total_amount || 0);
                    const isPaid = totalPaid >= billTotal;
                    
                    if (!isPaid && bill.status !== 'cancelled') {
                        unpaidBills.push(bill);
                    }
                } catch (error) {
                    // If error checking payments (e.g., bill_id column doesn't exist), include bill
                    logger.warn('Error checking payments for bill', { billId: bill.id, error: error.message });
                    if (bill.status !== 'cancelled') {
                        unpaidBills.push(bill);
                    }
                }
            }

            return unpaidBills;
        } catch (error) {
            logger.error('Error getting unpaid bills', { error: error.message, stack: error.stack });
            throw error;
        }
    }
};

module.exports = BillsS;

