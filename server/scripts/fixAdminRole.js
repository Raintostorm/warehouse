require('dotenv').config();
const db = require('../db');

(async () => {
    try {
        console.log('🔍 Đang kiểm tra và sửa role cho admin@example.com...\n');
        
        // Check và gán role Admin
        const queries = [
            // Snake_case
            {
                check: `SELECT u.id, r.id as role_id FROM users u, roles r WHERE u.email = 'admin@example.com' AND r.name = 'Admin'`,
                insert: `INSERT INTO user_roles (u_id, r_id) SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'admin@example.com' AND r.name = 'Admin' ON CONFLICT (u_id, r_id) DO NOTHING`,
                verify: `SELECT u.email, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.u_id JOIN roles r ON ur.r_id = r.id WHERE u.email = 'admin@example.com'`
            },
            // PascalCase
            {
                check: `SELECT u."Id", r."Id" as role_id FROM "Users" u, "Roles" r WHERE u."Email" = 'admin@example.com' AND r."Name" = 'Admin'`,
                insert: `INSERT INTO "UserRoles" ("UId", "RId") SELECT u."Id", r."Id" FROM "Users" u, "Roles" r WHERE u."Email" = 'admin@example.com' AND r."Name" = 'Admin' ON CONFLICT ("UId", "RId") DO NOTHING`,
                verify: `SELECT u."Email" as email, r."Name" as role FROM "Users" u JOIN "UserRoles" ur ON u."Id" = ur."UId" JOIN "Roles" r ON ur."RId" = r."Id" WHERE u."Email" = 'admin@example.com'`
            }
        ];
        
        for (const querySet of queries) {
            try {
                // Check xem đã có role chưa
                const checkResult = await db.query(querySet.verify);
                if (checkResult.rows.length > 0 && checkResult.rows[0].role) {
                    console.log('✅ User đã có role:', checkResult.rows[0].role);
                    process.exit(0);
                }
                
                // Nếu chưa có, gán role
                console.log('⚠️  User chưa có role, đang gán role Admin...');
                await db.query(querySet.insert);
                
                // Verify lại
                const verifyResult = await db.query(querySet.verify);
                if (verifyResult.rows.length > 0 && verifyResult.rows[0].role) {
                    console.log('✅ Đã gán role Admin thành công!');
                    console.log('User:', verifyResult.rows[0].email);
                    console.log('Role:', verifyResult.rows[0].role);
                    process.exit(0);
                }
            } catch (error) {
                // Try next query set
                continue;
            }
        }
        
        console.log('❌ Không thể gán role. Vui lòng kiểm tra database.');
        process.exit(1);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
})();

