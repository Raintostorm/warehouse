require('dotenv').config();
const db = require('../db');

(async () => {
    try {
        console.log('\n🔍 Đang đảm bảo admin@example.com có role Admin...\n');
        
        // Try both schemas
        const attempts = [
            async () => {
                // Snake_case
                const check = await db.query(`
                    SELECT ur.u_id, ur.r_id 
                    FROM user_roles ur
                    JOIN users u ON ur.u_id = u.id
                    JOIN roles r ON ur.r_id = r.id
                    WHERE u.email = 'admin@example.com' AND r.name = 'Admin'
                `);
                if (check.rows.length === 0) {
                    await db.query(`
                        INSERT INTO user_roles (u_id, r_id)
                        SELECT u.id, r.id
                        FROM users u, roles r
                        WHERE u.email = 'admin@example.com' AND r.name = 'Admin'
                        ON CONFLICT (u_id, r_id) DO NOTHING
                    `);
                    console.log('✅ Đã gán role Admin (snake_case)');
                } else {
                    console.log('✅ User đã có role Admin (snake_case)');
                }
            },
            async () => {
                // PascalCase
                const check = await db.query(`
                    SELECT ur."UId", ur."RId"
                    FROM "UserRoles" ur
                    JOIN "Users" u ON ur."UId" = u."Id"
                    JOIN "Roles" r ON ur."RId" = r."Id"
                    WHERE u."Email" = 'admin@example.com' AND r."Name" = 'Admin'
                `);
                if (check.rows.length === 0) {
                    await db.query(`
                        INSERT INTO "UserRoles" ("UId", "RId")
                        SELECT u."Id", r."Id"
                        FROM "Users" u, "Roles" r
                        WHERE u."Email" = 'admin@example.com' AND r."Name" = 'Admin'
                        ON CONFLICT ("UId", "RId") DO NOTHING
                    `);
                    console.log('✅ Đã gán role Admin (PascalCase)');
                } else {
                    console.log('✅ User đã có role Admin (PascalCase)');
                }
            }
        ];
        
        let success = false;
        for (const attempt of attempts) {
            try {
                await attempt();
                success = true;
                break;
            } catch (e) {
                // Try next
            }
        }
        
        if (!success) {
            console.error('❌ Không thể gán role');
            process.exit(1);
        }
        
        console.log('\n✅ Hoàn thành!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
})();

