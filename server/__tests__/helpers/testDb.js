const db = require('../../db');

/**
 * Clean up test database
 */
async function cleanDatabase() {
    try {
        // Delete in reverse order of dependencies
        // Use DELETE instead of TRUNCATE to avoid locking issues
        const tables = [
            'stock_history',
            'stock_transfers',
            'low_stock_alerts',
            'file_uploads',
            'order_warehouses',
            'product_management',
            'warehouse_management',
            'product_details',
            'order_details',
            'payments',
            'bills',
            'orders',
            'products',
            'warehouses',
            'suppliers',
            'user_roles',
            'users',
            'roles',
            'audit_logs',
            'notifications',
            'password_resets'
        ];

        // Delete in batches to avoid deadlocks
        for (const table of tables) {
            try {
                await db.query(`DELETE FROM ${table}`);
            } catch (error) {
                // Ignore if table doesn't exist or relation errors
                if (!error.message.includes('does not exist') &&
                    !error.message.includes('relation') &&
                    !error.message.includes('deadlock')) {
                    // Only log non-critical errors
                    console.warn(`Warning: Could not clean table ${table}:`, error.message);
                }
            }
        }
    } catch (error) {
        // Ignore errors if tables don't exist or deadlock (will be cleaned in next test)
        if (!error.message.includes('does not exist') &&
            !error.message.includes('relation') &&
            !error.message.includes('deadlock')) {
            console.warn('Warning during database cleanup:', error.message);
        }
    }
}

/**
 * Close database connection
 */
async function closeDatabase() {
    try {
        // End all active connections gracefully
        await db.pool.end();
    } catch (error) {
        // Ignore errors when closing pool
        console.warn('Error closing database pool:', error.message);
    }
}

/**
 * Initialize test database (create tables if needed)
 */
async function initTestDatabase() {
    try {
        // Test connection
        await db.query('SELECT 1');

        // Run initDatabase to ensure all tables exist
        const { initDatabase } = require('../../scripts/initDatabase');
        try {
            await initDatabase();
        } catch (initError) {
            // If init fails, check if tables exist
            console.warn('Warning: initDatabase failed, checking if tables exist:', initError.message);
            try {
                await db.query('SELECT 1 FROM users LIMIT 1');
                await db.query('SELECT 1 FROM stock_history LIMIT 1');
                await db.query('SELECT 1 FROM file_uploads LIMIT 1');
            } catch (error) {
                if (error.message.includes('does not exist') || error.message.includes('relation')) {
                    console.warn('Warning: Test database tables may not exist. Run "npm run init:db" first.');
                    console.warn('Tests may fail if tables are not created.');
                }
            }
        }
    } catch (error) {
        const dbUrl = process.env.DATABASE_URL || 'not set';
        throw new Error(
            `Test database connection failed: ${error.message}\n` +
            `Database URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}\n` +
            `Please check your database configuration in .env file.`
        );
    }
}

module.exports = {
    cleanDatabase,
    closeDatabase,
    initTestDatabase
};
