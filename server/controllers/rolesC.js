const RolesS = require('../services/rolesS');

const RolesC = {
    // Roles chỉ có READ (GET) - không có CREATE, UPDATE, DELETE
    getAllRoles: async (req, res) => {
        try {
            const roles = await RolesS.findAll();
            res.json({
                success: true,
                message: 'Roles fetched successfully',
                data: roles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch roles',
                error: error.message
            });
        }
    },
    
    getRoleById: async (req, res) => {
        try {
            const role = await RolesS.findById(req.params.id);
            res.json({
                success: true,
                message: 'Role fetched successfully',
                data: role
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'Role not found') {
                statusCode = 404;
            } else if (error.message === 'ID is required') {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to fetch role',
                error: error.message
            });
        }
    }
};

module.exports = RolesC;

