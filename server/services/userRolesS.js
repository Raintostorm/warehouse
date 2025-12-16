const UserRolesM = require('../models/userRolesM');
const UsersM = require('../models/usersM');
const RolesM = require('../models/rolesM');

const UserRolesS = {
    findAll: async () => {
        return await UserRolesM.findAll();
    },
    
    findByUserId: async (userId) => {
        if (!userId) {
            throw new Error('User ID is required');
        }
        // Verify user exists
        const user = await UsersM.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return await UserRolesM.findByUserId(userId);
    },
    
    findByRoleId: async (roleId) => {
        if (!roleId) {
            throw new Error('Role ID is required');
        }
        // Verify role exists
        const role = await RolesM.findById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }
        return await UserRolesM.findByRoleId(roleId);
    },
    
    // CREATE: Gán role cho user
    assignRoleToUser: async (userId, roleId) => {
        // Validation
        if (!userId || !roleId) {
            throw new Error('User ID and Role ID are required');
        }
        
        // Check user exists
        const user = await UsersM.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Check role exists
        const role = await RolesM.findById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }
        
        // Check if already assigned
        const existing = await UserRolesM.findByUserAndRole(userId, roleId);
        if (existing) {
            throw new Error('Role already assigned to this user');
        }
        
        return await UserRolesM.create(userId, roleId);
    },
    
    // DELETE: Xóa role của user
    removeRoleFromUser: async (userId, roleId) => {
        if (!userId || !roleId) {
            throw new Error('User ID and Role ID are required');
        }
        
        // Check if exists
        const existing = await UserRolesM.findByUserAndRole(userId, roleId);
        if (!existing) {
            throw new Error('Role assignment not found');
        }
        
        return await UserRolesM.delete(userId, roleId);
    }
};

module.exports = UserRolesS;

