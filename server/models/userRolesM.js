const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

const UserRolesM = {
    // Lấy tất cả user roles (join với users và roles)
    findAll: async () => {
        const result = await db.query(`
            SELECT 
                ur.u_id as user_id,
                ur.r_id as role_id,
                u.fullname as user_name,
                r.name as role_name
            FROM user_roles ur
            INNER JOIN users u ON ur.u_id = u.id
            INNER JOIN roles r ON ur.r_id = r.id
            ORDER BY u.fullname, r.name
        `);
        return result.rows;
    },
    
    // Lấy roles của một user
    findByUserId: async (userId) => {
        // Database dùng snake_case lowercase: user_roles, u_id, r_id
        try {
            const result = await db.query(`
                SELECT 
                    ur.u_id as user_id,
                    ur.r_id as role_id,
                    r.id,
                    r.name as role_name
                FROM user_roles ur
                INNER JOIN roles r ON ur.r_id = r.id
                WHERE ur.u_id = $1
            `, [userId]);
            return result.rows;
        } catch (error) {
            return [];
        }
    },
    
    // Lấy users có một role cụ thể
    findByRoleId: async (roleId) => {
        const result = await db.query(`
            SELECT 
                ur.u_id as user_id,
                ur.r_id as role_id,
                u.id,
                u.fullname,
                u.email
            FROM user_roles ur
            INNER JOIN users u ON ur.u_id = u.id
            WHERE ur.r_id = $1
        `, [roleId]);
        return result.rows;
    },
    
    // Kiểm tra user có role này không
    findByUserAndRole: async (userId, roleId) => {
        const result = await queryWithFallback(
            'SELECT * FROM user_roles WHERE u_id = $1 AND r_id = $2',
            'SELECT * FROM "UserRoles" WHERE "UId" = $1 AND "RId" = $2',
            [userId, roleId]
        );
        return result.rows[0];
    },
    
    // Thêm role cho user (CREATE)
    create: async (userId, roleId) => {
        const result = await queryWithFallback(
            'INSERT INTO user_roles (u_id, r_id) VALUES ($1, $2) RETURNING *',
            'INSERT INTO "UserRoles" ("UId", "RId") VALUES ($1, $2) RETURNING *',
            [userId, roleId]
        );
        return result.rows[0];
    },
    
    // Xóa role của user (DELETE)
    delete: async (userId, roleId) => {
        const result = await queryWithFallback(
            'DELETE FROM user_roles WHERE u_id = $1 AND r_id = $2 RETURNING *',
            'DELETE FROM "UserRoles" WHERE "UId" = $1 AND "RId" = $2 RETURNING *',
            [userId, roleId]
        );
        return result.rows[0];
    },
    
    // Xóa tất cả roles của một user
    deleteByUserId: async (userId) => {
        const result = await queryWithFallback(
            'DELETE FROM user_roles WHERE u_id = $1 RETURNING *',
            'DELETE FROM "UserRoles" WHERE "UId" = $1 RETURNING *',
            [userId]
        );
        return result.rows;
    },
    
    // Xóa tất cả roles của nhiều users (bulk)
    bulkDeleteByUserIds: async (userIds) => {
        if (!userIds || userIds.length === 0) {
            return [];
        }
        const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
        // Try snake_case first, fallback to PascalCase
        try {
            const query = `DELETE FROM user_roles WHERE u_id IN (${placeholders}) RETURNING *`;
            const result = await db.query(query, userIds);
            return result.rows;
        } catch (error) {
            // Fallback to PascalCase
            const query = `DELETE FROM "UserRoles" WHERE "UId" IN (${placeholders}) RETURNING *`;
        const result = await db.query(query, userIds);
        return result.rows;
        }
    }
};

module.exports = UserRolesM;

