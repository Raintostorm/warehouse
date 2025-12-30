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

        console.log('\n✅ All schema fixes completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

fixAllSchema();

