const UserRolesS = require('../services/userRolesS');

const UserRolesC = {
    getAllUserRoles: async (req, res) => {
        try {
            const userRoles = await UserRolesS.findAll();
            res.json({
                success: true,
                message: 'User roles fetched successfully',
                data: userRoles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user roles',
                error: error.message
            });
        }
    },
    
    getUserRoles: async (req, res) => {
        try {
            const userRoles = await UserRolesS.findByUserId(req.params.userId);
            res.json({
                success: true,
                message: 'User roles fetched successfully',
                data: userRoles
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found' || error.message === 'User ID is required') {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to fetch user roles',
                error: error.message
            });
        }
    },
    
    getRoleUsers: async (req, res) => {
        try {
            const users = await UserRolesS.findByRoleId(req.params.roleId);
            res.json({
                success: true,
                message: 'Users with role fetched successfully',
                data: users
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Role not found' || error.message === 'Role ID is required') {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to fetch users with role',
                error: error.message
            });
        }
    },
    
    // CREATE: Gán role cho user
    assignRoleToUser: async (req, res) => {
        try {
            // Kiểm tra req.body có tồn tại không
            if (!req.body) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to assign role to user',
                    error: 'Request body is required'
                });
            }
            
            const { userId, roleId } = req.body;
            const userRole = await UserRolesS.assignRoleToUser(userId, roleId);
            res.status(201).json({
                success: true,
                message: 'Role assigned to user successfully',
                data: userRole
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('not found') || error.message.includes('required')) {
                statusCode = 400;
            } else if (error.message.includes('already assigned')) {
                statusCode = 409;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to assign role to user',
                error: error.message
            });
        }
    },
    
    // DELETE: Xóa role của user
    removeRoleFromUser: async (req, res) => {
        try {
            // Kiểm tra req.body có tồn tại không
            if (!req.body) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to remove role from user',
                    error: 'Request body is required'
                });
            }
            
            const { userId, roleId } = req.body;
            const userRole = await UserRolesS.removeRoleFromUser(userId, roleId);
            res.json({
                success: true,
                message: 'Role removed from user successfully',
                data: userRole
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('not found') || error.message.includes('required')) {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to remove role from user',
                error: error.message
            });
        }
    }
};

module.exports = UserRolesC;

