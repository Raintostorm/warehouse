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
        // Use junction table if available, fallback to old method
        return await BillsM.getBillsByOrderIdFromJunction(orderId);
    },

    getOrdersByBillId: async (billId) => {
        return await BillsM.getOrdersByBillId(billId);
    },

    createBill: async (billData) => {
        // Support multiple orders: billData.orderIds (array) or billData.orderId (single)
        const orderIds = billData.orderIds || (billData.orderId ? [billData.orderId] : [billData.order_id]).filter(Boolean);
        
        if (orderIds.length === 0) {
            throw new Error('At least one order is required');
        }

        // Validate all orders exist and check if they already have bills
        const orders = [];
        
        for (const orderId of orderIds) {
            const order = await OrdersM.findById(orderId);
            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            // Check if order already has a bill (using bill_orders junction table)
            let existingBills = [];
            try {
                existingBills = await BillsM.getBillsByOrderIdFromJunction(orderId);
            } catch (err) {
                // If junction table query fails, try old method
                logger.warn('Junction table query failed, trying old method', { orderId, error: err.message });
                try {
                    existingBills = await BillsM.findByOrderId(orderId);
                } catch (err2) {
                    logger.error('Failed to check existing bills', { orderId, error: err2.message });
                    // Continue anyway - better to create duplicate than fail completely
                }
            }
            
            if (existingBills.length > 0) {
                throw new Error(`Order ${orderId} already has a bill (${existingBills[0].id})`);
            }

            orders.push(order);
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

        // Calculate total_amount from all orders if not provided
        if (!billData.totalAmount && !billData.total_amount) {
            billData.totalAmount = orders.reduce((sum, order) => {
                const orderTotal = parseFloat(order.total || order.Total || 0) || 0;
                return sum + orderTotal;
            }, 0);
        } else if (billData.totalAmount) {
            // Ensure totalAmount is a number, not a string
            billData.totalAmount = parseFloat(billData.totalAmount) || 0;
        } else if (billData.total_amount) {
            billData.totalAmount = parseFloat(billData.total_amount) || 0;
        }

        // Use first order_id for backward compatibility (bills table still has order_id column)
        const primaryOrderId = orderIds[0];

        // Create bill with primary order_id
        const bill = await BillsM.create({
            ...billData,
            orderId: primaryOrderId
        });

        // Add all orders to bill_orders junction table
        for (const orderId of orderIds) {
            try {
                const result = await BillsM.addOrderToBill(bill.id, orderId);
                if (!result) {
                    logger.warn('Failed to add order to bill_orders junction table', { billId: bill.id, orderId });
                }
            } catch (err) {
                logger.error('Error adding order to bill_orders', { 
                    billId: bill.id, 
                    orderId, 
                    error: err.message 
                });
                // Don't fail - bill is already created, just log the error
            }
        }

        logger.info('Bill created successfully', { 
            billId: bill.id, 
            orderIds, 
            totalAmount: bill.total_amount || bill.totalAmount 
        });

        return bill;
    },

    updateBill: async (id, billData) => {
        const existingBill = await BillsM.findById(id);
        if (!existingBill) {
            throw new Error('Bill not found');
        }

        // Prevent editing paid bills completely
        if (existingBill.status === 'paid') {
            throw new Error('Cannot edit a paid bill. Bill status is "paid".');
        }

        // Also check if bill is actually paid (by checking payments)
        const isPaid = await BillsS.isBillPaid(id);
        if (isPaid) {
            throw new Error('Cannot edit a paid bill. Bill has been fully paid.');
        }

        // Prevent updating bill status from 'paid' to 'pending' if there are completed payments
        if (billData.status === 'pending' && existingBill.status === 'paid') {
            throw new Error('Cannot change bill status from paid to pending. Bill has completed payments.');
        }

        // Validate total_amount if being updated
        if (billData.totalAmount !== undefined || billData.total_amount !== undefined) {
            const newTotal = parseFloat(billData.totalAmount || billData.total_amount || 0);
            if (newTotal < 0) {
                throw new Error('Bill total amount cannot be negative');
            }

            // Check if new total is less than already paid amount
            // Check payments by bill_id
            let payments = [];
            try {
                payments = await PaymentsM.findByBillId(id);
            } catch (err) {
                // Ignore error
            }

            // Also check payments by order_id
            if (existingBill.order_id) {
                try {
                    const paymentsByOrder = await PaymentsM.findByOrderId(existingBill.order_id);
                    const paymentIds = new Set(payments.map(p => p.id));
                    paymentsByOrder.forEach(p => {
                        if (!paymentIds.has(p.id)) {
                            payments.push(p);
                            paymentIds.add(p.id);
                        }
                    });
                } catch (err) {
                    // Ignore error
                }
            }

            const totalPaid = payments
                .filter(p => {
                    const status = p.payment_status || p.paymentStatus;
                    return status === 'completed';
                })
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            
            if (newTotal < totalPaid) {
                throw new Error(`Cannot set bill total to ${newTotal}. Already paid: ${totalPaid}`);
            }
        }

        return await BillsM.update(id, billData);
    },

    deleteBill: async (id) => {
        const existingBill = await BillsM.findById(id);
        if (!existingBill) {
            throw new Error('Bill not found');
        }

        // Prevent deleting paid bills - check status first
        if (existingBill.status === 'paid') {
            throw new Error('Cannot delete a paid bill. Bill status is "paid".');
        }

        // Check if bill is actually paid (by checking payments)
        const isPaid = await BillsS.isBillPaid(id);
        if (isPaid) {
            throw new Error('Cannot delete a paid bill. Bill has been fully paid. Please cancel payments first.');
        }

        // Check if bill has any completed payments (by bill_id)
        let payments = [];
        try {
            payments = await PaymentsM.findByBillId(id);
        } catch (err) {
            logger.warn('Could not check payments by bill_id', { billId: id, error: err.message });
        }

        // Also check payments by order_id (in case payments are linked to orders)
        if (existingBill.order_id) {
            try {
                const paymentsByOrder = await PaymentsM.findByOrderId(existingBill.order_id);
                payments = [...payments, ...paymentsByOrder];
            } catch (err) {
                logger.warn('Could not check payments by order_id', { orderId: existingBill.order_id, error: err.message });
            }
        }

        // Check if any payments are completed
        if (payments.length > 0) {
            const hasCompletedPayments = payments.some(p => {
                const status = p.payment_status || p.paymentStatus;
                return status === 'completed';
            });
            
            if (hasCompletedPayments) {
                const completedCount = payments.filter(p => {
                    const status = p.payment_status || p.paymentStatus;
                    return status === 'completed';
                }).length;
                throw new Error(`Cannot delete bill with ${completedCount} completed payment(s). Please delete or cancel payments first.`);
            }
        }

        return await BillsM.delete(id);
    },

    // Check if bill is fully paid
    isBillPaid: async (billId) => {
        try {
            const bill = await BillsM.findById(billId);
            if (!bill) return false;
            
            const billTotal = parseFloat(bill.total_amount || bill.totalAmount || 0);
            if (billTotal <= 0) return false;

            // Check payments by bill_id
            let payments = [];
            try {
                payments = await PaymentsM.findByBillId(billId);
            } catch (err) {
                // If bill_id column doesn't exist, continue with order_id check
            }

            // Also check payments by order_id (in case payments are linked to orders)
            if (bill.order_id) {
                try {
                    const paymentsByOrder = await PaymentsM.findByOrderId(bill.order_id);
                    // Merge and deduplicate by payment id
                    const paymentIds = new Set(payments.map(p => p.id));
                    paymentsByOrder.forEach(p => {
                        if (!paymentIds.has(p.id)) {
                            payments.push(p);
                            paymentIds.add(p.id);
                        }
                    });
                } catch (err) {
                    // Ignore error
                }
            }

            // Also check payments from bill_orders junction table
            try {
                const orders = await BillsM.getOrdersByBillId(billId);
                for (const order of orders) {
                    const orderId = order.id || order.Id;
                    if (orderId) {
                        try {
                            const paymentsByOrder = await PaymentsM.findByOrderId(orderId);
                            const paymentIds = new Set(payments.map(p => p.id));
                            paymentsByOrder.forEach(p => {
                                if (!paymentIds.has(p.id)) {
                                    payments.push(p);
                                    paymentIds.add(p.id);
                                }
                            });
                        } catch (err) {
                            // Ignore error
                        }
                    }
                }
            } catch (err) {
                // Ignore error if junction table doesn't exist
            }

            const totalPaid = payments
                .filter(p => {
                    const status = p.payment_status || p.paymentStatus;
                    return status === 'completed';
                })
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            
            return totalPaid >= billTotal;
        } catch (error) {
            // If error, return false
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

