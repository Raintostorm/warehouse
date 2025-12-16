require('dotenv').config();
const db = require('../db');

(async () => {
    try {
        console.log('🔍 Kiểm tra role của admin@example.com...\n');
        
        // Try snake_case first
        try {
            const result = await db.query(`
                SELECT 
                    u.id,
                    u.email,
                    u.fullname,
                    r.id as role_id,
                    r.name as role_name
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.u_id
                LEFT JOIN roles r ON ur.r_id = r.id
                WHERE u.email = 'admin@example.com'
            `);
            
            console.log('✅ Query thành công (snake_case):');
            console.log(JSON.stringify(result.rows, null, 2));
            
            if (result.rows.length === 0 || !result.rows[0].role_name) {
                console.log('\n❌ User không có role! Đang gán role Admin...');
                // Gán role Admin
                await db.query(`
                    INSERT INTO user_roles (u_id, r_id)
                    SELECT u.id, r.id
                    FROM users u, roles r
                    WHERE u.email = 'admin@example.com' AND r.name = 'Admin'
                    ON CONFLICT (u_id, r_id) DO NOTHING
                `);
                console.log('✅ Đã gán role Admin cho user!');
            }
        } catch (error) {
            // Try PascalCase
            console.log('⚠️  Snake_case failed, trying PascalCase...');
            try {
                const result = await db.query(`
                    SELECT 
                        u."Id" as id,
                        u."Email" as email,
                        u."Fullname" as fullname,
                        r."Id" as role_id,
                        r."Name" as role_name
                    FROM "Users" u
                    LEFT JOIN "UserRoles" ur ON u."Id" = ur."UId"
                    LEFT JOIN "Roles" r ON ur."RId" = r."Id"
                    WHERE u."Email" = 'admin@example.com'
                `);
                
                console.log('✅ Query thành công (PascalCase):');
                console.log(JSON.stringify(result.rows, null, 2));
                
                if (result.rows.length === 0 || !result.rows[0].role_name) {
                    console.log('\n❌ User không có role! Đang gán role Admin...');
                    // Gán role Admin
                    await db.query(`
                        INSERT INTO "UserRoles" ("UId", "RId")
                        SELECT u."Id", r."Id"
                        FROM "Users" u, "Roles" r
                        WHERE u."Email" = 'admin@example.com' AND r."Name" = 'Admin'
                        ON CONFLICT ("UId", "RId") DO NOTHING
                    `);
                    console.log('✅ Đã gán role Admin cho user!');
                }
            } catch (e2) {
                console.error('❌ Lỗi:', e2.message);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
})();

