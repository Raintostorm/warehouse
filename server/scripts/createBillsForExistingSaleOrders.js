const db = require('../db');
const OrdersM = require('../models/ordersM');
const BillsM = require('../models/billsM');
const BillsS = require('../services/billsS');

async function createBillsForExistingSaleOrders() {
    try {
        console.log('🔍 Finding all orders with type "sale" or "sell"...\n');

        // Get all orders with type sale or sell (check both lowercase and case variations)
        const result = await db.query(`
            SELECT * FROM orders 
            WHERE LOWER(type) = 'sale' OR LOWER(type) = 'sell'
            ORDER BY created_at DESC
        `);
        
        // If no results, try with different column name (Type vs type)
        if (result.rows.length === 0) {
            const result2 = await db.query(`
                SELECT * FROM orders 
                WHERE LOWER("Type") = 'sale' OR LOWER("Type") = 'sell'
                ORDER BY "CreatedAt" DESC
            `);
            if (result2.rows.length > 0) {
                result.rows = result2.rows;
            }
        }

        const orders = result.rows;
        console.log(`Found ${orders.length} sale orders\n`);

        if (orders.length === 0) {
            console.log('No sale orders found. Exiting.');
            process.exit(0);
        }

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const order of orders) {
            const orderId = order.id || order.Id || order.ID;
            const orderType = order.type || order.Type || order.TYPE;
            const orderTotal = parseFloat(order.total || order.Total || order.TOTAL || 0) || 0;
            
            console.log(`\n📦 Processing order: ${orderId} (Type: ${orderType}, Total: ${orderTotal})`);

            try {
                // Check if bill already exists
                let existingBills = [];
                try {
                    existingBills = await BillsM.getBillsByOrderIdFromJunction(orderId);
                } catch (err) {
                    // Fallback to old method
                    existingBills = await BillsM.findByOrderId(orderId);
                }

                if (existingBills.length > 0) {
                    console.log(`⏭️  Order ${orderId} already has bill: ${existingBills[0].id}`);
                    skipped++;
                    continue;
                }

                if (orderTotal <= 0) {
                    console.log(`⚠️  Order ${orderId} has total = 0, skipping`);
                    skipped++;
                    continue;
                }

                // Create bill
                const bill = await BillsS.createBill({
                    orderIds: [orderId],
                    totalAmount: orderTotal,
                    status: 'pending',
                    actor: order.actor || 'system'
                });

                console.log(`✅ Created bill ${bill.id} for order ${orderId} (Total: ${orderTotal.toLocaleString('vi-VN')} ₫)`);
                created++;
            } catch (error) {
                console.error(`❌ Error creating bill for order ${orderId}:`, error.message);
                errors++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Created: ${created}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`\n✅ Done!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

createBillsForExistingSaleOrders();

