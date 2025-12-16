require('dotenv').config();
const db = require('../db');

(async () => {
    try {
        console.log('\n🔍 Đang kiểm tra cấu trúc database...\n');
        
        // Kiểm tra tất cả tables
        const tablesResult = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('📋 Tables trong database:');
        tablesResult.rows.forEach(row => {
            console.log('   -', row.table_name);
        });
        
        // Kiểm tra columns của các table liên quan
        const tableNames = ['users', 'Users', 'user_roles', 'UserRoles', 'roles', 'Roles'];
        
        for (const tableName of tableNames) {
            try {
                const columnsResult = await db.query(`
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);
                
                if (columnsResult.rows.length > 0) {
                    console.log(`\n📊 Columns của table "${tableName}":`);
                    columnsResult.rows.forEach(row => {
                        console.log(`   - ${row.column_name} (${row.data_type})`);
                    });
                }
            } catch (e) {
                // Table không tồn tại, bỏ qua
            }
        }
        
        // Kiểm tra user_roles data
        console.log('\n🔍 Kiểm tra user_roles data...');
        const queries = [
            'SELECT * FROM user_roles LIMIT 5',
            'SELECT * FROM "UserRoles" LIMIT 5',
            'SELECT * FROM userroles LIMIT 5',
            'SELECT * FROM "user_roles" LIMIT 5'
        ];
        
        for (const query of queries) {
            try {
                const result = await db.query(query);
                if (result.rows.length > 0) {
                    console.log(`\n✅ Query thành công: ${query}`);
                    console.log('   Sample data:', JSON.stringify(result.rows[0], null, 2));
                    break;
                }
            } catch (e) {
                // Query failed, try next
            }
        }
        
        // Kiểm tra user U001 có role không
        console.log('\n🔍 Kiểm tra user U001...');
        const userQueries = [
            `SELECT u.*, ur.*, r.* FROM users u LEFT JOIN user_roles ur ON u.id = ur.u_id LEFT JOIN roles r ON ur.r_id = r.id WHERE u.id = 'U001'`,
            `SELECT u.*, ur.*, r.* FROM "Users" u LEFT JOIN "UserRoles" ur ON u."Id" = ur."UId" LEFT JOIN "Roles" r ON ur."RId" = r."Id" WHERE u."Id" = 'U001'`
        ];
        
        for (const query of userQueries) {
            try {
                const result = await db.query(query);
                if (result.rows.length > 0) {
                    console.log(`\n✅ User query thành công!`);
                    console.log('   User data:', JSON.stringify(result.rows[0], null, 2));
                    break;
                }
            } catch (e) {
                console.log(`   Query failed: ${e.message}`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();

