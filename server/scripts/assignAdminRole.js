require('dotenv').config();
const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

(async () => {
    try {
        console.log('\n🔍 Đang gán role Admin cho admin@example.com...\n');
        
        // Tìm user
        let user;
        try {
            const userResult = await queryWithFallback(
                'SELECT id, email, fullname FROM users WHERE email = $1',
                'SELECT "Id" as id, "Email" as email, "Fullname" as fullname FROM "Users" WHERE "Email" = $1',
                ['admin@example.com']
            );
            user = userResult.rows[0];
        } catch (e) {
            console.error('❌ Không tìm thấy user:', e.message);
            process.exit(1);
        }
        
        if (!user) {
            console.error('❌ User admin@example.com không tồn tại!');
            process.exit(1);
        }
        
        console.log('✅ Tìm thấy user:', user.email, '| ID:', user.id);
        
        // Tìm role Admin
        let adminRole;
        try {
            const roleResult = await queryWithFallback(
                'SELECT id, name FROM roles WHERE name = $1',
                'SELECT "Id" as id, "Name" as name FROM "Roles" WHERE "Name" = $1',
                ['Admin']
            );
            adminRole = roleResult.rows[0];
        } catch (e) {
            console.error('❌ Không tìm thấy role Admin:', e.message);
            process.exit(1);
        }
        
        if (!adminRole) {
            console.error('❌ Role Admin không tồn tại!');
            process.exit(1);
        }
        
        console.log('✅ Tìm thấy role Admin:', adminRole.name, '| ID:', adminRole.id);
        
        // Kiểm tra xem đã có role chưa
        try {
            const checkResult = await queryWithFallback(
                'SELECT * FROM user_roles WHERE u_id = $1 AND r_id = $2',
                'SELECT * FROM "UserRoles" WHERE "UId" = $1 AND "RId" = $2',
                [user.id, adminRole.id]
            );
            
            if (checkResult.rows.length > 0) {
                console.log('✅ User đã có role Admin rồi!');
                process.exit(0);
            }
        } catch (e) {
            // Chưa có, tiếp tục gán
        }
        
        // Gán role Admin
        try {
            await queryWithFallback(
                'INSERT INTO user_roles (u_id, r_id) VALUES ($1, $2) ON CONFLICT (u_id, r_id) DO NOTHING',
                'INSERT INTO "UserRoles" ("UId", "RId") VALUES ($1, $2) ON CONFLICT ("UId", "RId") DO NOTHING',
                [user.id, adminRole.id]
            );
            console.log('✅ Đã gán role Admin thành công!');
        } catch (e) {
            console.error('❌ Lỗi khi gán role:', e.message);
            process.exit(1);
        }
        
        // Verify lại
        try {
            const verifyResult = await queryWithFallback(
                'SELECT ur.*, r.name as role_name FROM user_roles ur JOIN roles r ON ur.r_id = r.id WHERE ur.u_id = $1',
                'SELECT ur.*, r."Name" as role_name FROM "UserRoles" ur JOIN "Roles" r ON ur."RId" = r."Id" WHERE ur."UId" = $1',
                [user.id]
            );
            console.log('\n✅ Verify - User roles:');
            verifyResult.rows.forEach(row => {
                console.log('   -', row.role_name);
            });
        } catch (e) {
            console.log('⚠️  Không thể verify:', e.message);
        }
        
        console.log('\n✅ Hoàn thành!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();

