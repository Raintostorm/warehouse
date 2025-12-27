const db = require('../db');

async function fixAllSchema() {
    try {
        console.log('🔧 Fixing database schema issues...\n');

        // 1. Fix audit_logs.changed_fields
        try {
            await db.query(`
                ALTER TABLE audit_logs 
                ADD COLUMN IF NOT EXISTS changed_fields TEXT[]
            `);
            console.log('✅ Fixed audit_logs.changed_fields');
        } catch (err) {
            console.error('❌ Error fixing audit_logs:', err.message);
        }

        // 2. Fix notifications.data
        try {
            await db.query(`
                ALTER TABLE notifications 
                ADD COLUMN IF NOT EXISTS data JSONB
            `);
            console.log('✅ Fixed notifications.data');
        } catch (err) {
            console.error('❌ Error fixing notifications:', err.message);
        }

        // 3. Ensure bill_orders table exists
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS bill_orders (
                    bill_id VARCHAR(20) NOT NULL,
                    order_id VARCHAR(15) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (bill_id, order_id),
                    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
                )
            `);
            
            // Create indexes
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_bill_orders_bill_id ON bill_orders(bill_id)
            `);
            await db.query(`
                CREATE INDEX IF NOT EXISTS idx_bill_orders_order_id ON bill_orders(order_id)
            `);
            
            console.log('✅ Ensured bill_orders table exists');
        } catch (err) {
            console.error('❌ Error creating bill_orders:', err.message);
        }

        console.log('\n✅ All schema fixes completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

fixAllSchema();

