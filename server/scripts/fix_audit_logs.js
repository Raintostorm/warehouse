const db = require('../db');

async function fixAuditLogs() {
    try {
        await db.query(`
            ALTER TABLE audit_logs 
            ADD COLUMN IF NOT EXISTS changed_fields TEXT[]
        `);
        console.log('✅ Added changed_fields column to audit_logs');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAuditLogs();

