const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
    try {
        const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log(`Running migration: ${migrationFile}`);
        await db.query(sql);
        console.log(`✅ Migration completed: ${migrationFile}`);
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Migration may have already been applied: ${migrationFile}`);
        } else {
            console.error(`❌ Migration failed: ${migrationFile}`, error.message);
            throw error;
        }
    }
}

async function main() {
    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error('Usage: node runMigration.js <migration_file.sql>');
        process.exit(1);
    }
    
    try {
        await runMigration(migrationFile);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

main();

