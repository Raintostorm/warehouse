require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runInventoryMigration() {
    try {
        console.log('🔄 Running inventory migration...');

        // Step 1: Add columns to products table
        console.log('📋 Step 1: Adding inventory columns to products table...');
        const productsMigrationPath = path.join(__dirname, '../migrations/add_inventory_columns_to_products.sql');
        const productsMigrationSQL = fs.readFileSync(productsMigrationPath, 'utf8');
        await db.query(productsMigrationSQL);
        console.log('✅ Inventory columns added to products table!');

        // Step 2: Create inventory tables
        console.log('📋 Step 2: Creating inventory tables...');
        const inventoryMigrationPath = path.join(__dirname, '../migrations/create_inventory_tables.sql');
        const inventoryMigrationSQL = fs.readFileSync(inventoryMigrationPath, 'utf8');
        await db.query(inventoryMigrationSQL);
        console.log('✅ Inventory tables created successfully!');

        // Step 3: Create file_uploads table
        console.log('📋 Step 3: Creating file_uploads table...');
        const fileUploadsMigrationPath = path.join(__dirname, '../migrations/create_file_uploads_table.sql');
        const fileUploadsMigrationSQL = fs.readFileSync(fileUploadsMigrationPath, 'utf8');
        await db.query(fileUploadsMigrationSQL);
        console.log('✅ file_uploads table created successfully!');

        // Verify tables exist
        const tablesToCheck = [
            'stock_history',
            'stock_transfers',
            'low_stock_alerts',
            'file_uploads'
        ];

        for (const tableName of tablesToCheck) {
            const check = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [tableName]);

            if (check.rows[0].exists) {
                console.log(`✅ ${tableName} table verified!`);
            } else {
                console.log(`⚠️  ${tableName} table not found after migration`);
            }
        }

        // Verify columns in products table
        const columnsToCheck = ['low_stock_threshold', 'reorder_point', 'reorder_quantity'];
        for (const columnName of columnsToCheck) {
            const check = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'products'
                    AND column_name = $1
                );
            `, [columnName]);

            if (check.rows[0].exists) {
                console.log(`✅ ${columnName} column verified in products table!`);
            } else {
                console.log(`⚠️  ${columnName} column not found in products table`);
            }
        }

        console.log('✅ Inventory migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runInventoryMigration();

