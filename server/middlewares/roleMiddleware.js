/**
 * Middleware để kiểm tra role của user
 * @param {string|string[]} allowedRoles - Role hoặc mảng roles được phép
 * @returns {Function} Express middleware function
 */
const logger = require('../utils/logger');

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Kiểm tra xem user đã được authenticate chưa
            if (!req.user) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. User not authenticated.'
                });
            }

            // Chuyển allowedRoles thành array nếu là string
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Lấy role names của user từ token (đã được lưu trong token khi login)
            const userRoleNames = req.user.roleNames || [];

            // Kiểm tra xem user có role nào trong danh sách allowedRoles không (case-insensitive)
            const normalizedUserRoles = new Set(userRoleNames.map(r => r?.toLowerCase()));
            const hasPermission = rolesArray.some(role => 
                normalizedUserRoles.has(role?.toLowerCase())
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role(s): ${rolesArray.join(', ')}. Your roles: ${userRoleNames.join(', ') || 'none'}`
                });
            }

            // User có quyền, tiếp tục
            next();
        } catch (error) {
            logger.error('Role middleware error', { 
                error: error.message, 
                stack: error.stack,
                allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
            });
            return res.status(500).json({
                success: false,
                message: 'Error checking user permissions',
                error: error.message
            });
        }
    };
};

module.exports = roleMiddleware;

