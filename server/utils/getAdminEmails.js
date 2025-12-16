const UserRolesM = require('../models/userRolesM');
const db = require('../db');
const { queryWithFallback } = require('../utils/dbHelper');

/**
 * Get all admin user emails
 * @returns {Promise<string[]>} Array of admin email addresses
 */
async function getAdminEmails() {
    try {
        // Find Admin role ID
        let adminRole;
        try {
            const roleResult = await queryWithFallback(
                'SELECT id FROM roles WHERE name = $1',
                'SELECT "Id" as id FROM "Roles" WHERE "Name" = $1',
                ['Admin']
            );
            adminRole = roleResult.rows[0];
        } catch (e) {
            // Fallback: find by lowercase
            const rolesResult = await db.query('SELECT id, name FROM roles');
            adminRole = rolesResult.rows.find(r => {
                const name = (r.name || r.Name || '').toLowerCase();
                return name === 'admin';
            });
        }

        if (!adminRole) {
            console.warn('Admin role not found, returning empty array');
            return [];
        }

        const roleId = adminRole.id || adminRole.Id;

        // Get all users with Admin role
        const adminUsers = await UserRolesM.findByRoleId(roleId);

        // Extract emails
        const emails = adminUsers
            .map(user => user.email || user.Email)
            .filter(email => email && email.includes('@')); // Only valid emails

        return emails;
    } catch (error) {
        console.error('Error getting admin emails:', error);
        return [];
    }
}

module.exports = { getAdminEmails };
