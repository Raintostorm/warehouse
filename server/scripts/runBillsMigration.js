require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runBillsMigration() {
    try {
        console.log('🔄 Running bills migration...');

        // Step 1: Create bills table
        console.log('📋 Step 1: Creating bills table...');
        const billsMigrationPath = path.join(__dirname, '../migrations/create_bills_table.sql');
        const billsMigrationSQL = fs.readFileSync(billsMigrationPath, 'utf8');
        await db.query(billsMigrationSQL);
        console.log('✅ Bills table created successfully!');

        // Step 2: Add bill_id to payments table
        console.log('📋 Step 2: Adding bill_id column to payments table...');
        const paymentsMigrationPath = path.join(__dirname, '../migrations/add_bill_id_to_payments.sql');
        const paymentsMigrationSQL = fs.readFileSync(paymentsMigrationPath, 'utf8');
        await db.query(paymentsMigrationSQL);
        console.log('✅ bill_id column added to payments table!');

        // Verify bills table exists
        const billsCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'bills'
            );
        `);

        if (billsCheck.rows[0].exists) {
            console.log('✅ Bills table verified!');
        } else {
            console.log('⚠️  Bills table not found after migration');
        }

        // Verify bill_id column exists in payments
        const paymentsCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'payments'
                AND column_name = 'bill_id'
            );
        `);

        if (paymentsCheck.rows[0].exists) {
            console.log('✅ bill_id column verified in payments table!');
        } else {
            console.log('⚠️  bill_id column not found in payments table');
        }

        console.log('✅ Bills migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runBillsMigration();

