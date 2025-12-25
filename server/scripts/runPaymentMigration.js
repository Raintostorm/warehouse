require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runPaymentMigration() {
    try {
        console.log('🔄 Running payments table migration...');

        const migrationPath = path.join(__dirname, '../migrations/create_payments_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        await db.query(migrationSQL);

        console.log('✅ Payments table migration completed successfully!');

        // Verify table exists
        const result = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'payments'
            );
        `);

        if (result.rows[0].exists) {
            console.log('✅ Payments table verified!');
        } else {
            console.log('⚠️  Payments table not found after migration');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runPaymentMigration();
