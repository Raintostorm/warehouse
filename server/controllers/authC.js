const AuthS = require('../services/authS');
const logger = require('../utils/logger');

const AuthC = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            logger.info('Login attempt', { email, ip: req.ip });

            const result = await AuthS.login(email, password);

            logger.info('Login successful', {
                email,
                userId: result.user?.id || result.user?.Id,
                hasToken: !!result.token,
                tokenLength: result.token?.length,
                hasUser: !!result.user,
                roleNames: result.roleNames || []
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found' || error.message === 'Invalid email or password') {
                statusCode = 401;
            } else if (error.message === 'Email and password are required') {
                statusCode = 400;
            } else if (error.message.includes('JWT_SECRET')) {
                statusCode = 500;
            }

            // Log error for debugging
            logger.error('Login failed', {
                email: req.body.email,
                error: error.message,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                stack: error.stack
            });

            res.status(statusCode).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    },

    // Request password reset
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Base URL for reset page (frontend)
            const baseResetUrl = req.body.baseResetUrl || `${req.protocol}://${req.get('host')}/reset-password`;

            await AuthS.requestPasswordReset(email, baseResetUrl);

            res.json({
                success: true,
                message: 'If an account with that email exists, a reset link has been sent.'
            });
        } catch (error) {
            logger.error('Forgot password error', {
                email: req.body.email,
                error: error.message,
                ip: req.ip,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                message: 'Failed to process forgot password request',
                error: error.message
            });
        }
    },

    // Reset password with token
    resetPassword: async (req, res) => {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }

            await AuthS.resetPassword(token, password);

            res.json({
                success: true,
                message: 'Password has been reset successfully'
            });
        } catch (error) {
            let statusCode = 500;
            const errorMessage = error.message || '';

            if (errorMessage.includes('Invalid or expired reset token') ||
                errorMessage.includes('Token and new password are required')) {
                statusCode = 400;
            }

            logger.error('Reset password error', {
                error: error.message,
                ip: req.ip,
                stack: error.stack
            });

            res.status(statusCode).json({
                success: false,
                message: 'Failed to reset password',
                error: error.message
            });
        }
    },

    verify: async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            logger.debug('Token verification request', {
                tokenLength: token.length,
                tokenPrefix: token.substring(0, 20) + '...'
            });

            const decoded = AuthS.verifyToken(token);

            logger.debug('Token verified successfully', {
                userId: decoded.id,
                email: decoded.email
            });

            // Lấy user data và roles từ database
            const UserS = require('../services/userS');
            const UserRolesS = require('../services/userRolesS');

            const userId = decoded.id;
            const user = await UserS.findById(userId);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get user roles
            let roleNames = [];
            try {
                const userRoles = await UserRolesS.findByUserId(userId);
                roleNames = userRoles
                    .map(ur => ur.role_name || ur.name)
                    .filter(name => name);
            } catch (error) {
            }

            // Remove password from user object
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            delete userWithoutPassword.Password;

            res.json({
                success: true,
                message: 'Token is valid',
                data: {
                    user: userWithoutPassword,
                    token: token, // Return same token
                    roleNames: roleNames || decoded.roleNames || []
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token verification failed',
                error: error.message
            });
        }
    },

    googleLogin: async (req, res) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Google token is required'
                });
            }

            const result = await AuthS.googleLogin(token);

            res.json({
                success: true,
                message: 'Google login successful',
                data: result
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('not found') || error.message.includes('Invalid Google token')) {
                statusCode = 401;
            } else if (error.message.includes('required')) {
                statusCode = 400;
            }

            logger.error('Google login error', {
                error: error.message,
                ip: req.ip,
                stack: error.stack
            });

            res.status(statusCode).json({
                success: false,
                message: 'Google login failed',
                error: error.message
            });
        }
    },

    googleRegister: async (req, res) => {
        try {
            const { token, ...additionalData } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Google token is required'
                });
            }

            const result = await AuthS.googleRegister(token, additionalData);

            res.json({
                success: true,
                message: 'Google registration successful',
                data: result
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('already exists') || error.message.includes('Invalid Google token')) {
                statusCode = 409;
            } else if (error.message.includes('required')) {
                statusCode = 400;
            }

            logger.error('Google register error', {
                error: error.message,
                ip: req.ip,
                stack: error.stack
            });

            res.status(statusCode).json({
                success: false,
                message: 'Google registration failed',
                error: error.message
            });
        }
    },

    // Fix admin role - gán role Admin cho user hiện tại nếu chưa có
    fixAdminRole: async (req, res) => {
        try {
            const userId = req.user.id || req.user.Id;
            const UserRolesS = require('../services/userRolesS');
            const RolesM = require('../models/rolesM');
            const { queryWithFallback } = require('../utils/dbHelper');

            // Tìm role Admin (hỗ trợ cả snake_case và PascalCase)
            let adminRole;
            try {
                const result = await queryWithFallback(
                    'SELECT * FROM roles WHERE name = $1',
                    'SELECT * FROM "Roles" WHERE "Name" = $1',
                    ['Admin']
                );
                adminRole = result.rows[0];
            } catch (e) {
                // Fallback: tìm trong tất cả roles
                const roles = await RolesM.findAll();
                adminRole = roles.find(r => {
                    const roleName = (r.name || r.Name || '').toLowerCase();
                    return roleName === 'admin';
                });
            }

            if (!adminRole) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin role not found in database'
                });
            }

            const roleId = adminRole.id || adminRole.Id;

            // Kiểm tra xem user đã có role Admin chưa
            try {
                const existingRoles = await UserRolesS.findByUserId(userId);
                const hasAdminRole = existingRoles.some(r => {
                    const roleName = (r.role_name || r.name || '').toLowerCase();
                    return roleName === 'admin';
                });

                if (hasAdminRole) {
                    return res.json({
                        success: true,
                        message: 'User already has Admin role',
                        roles: existingRoles.map(r => r.role_name || r.name)
                    });
                }
            } catch (e) {
                // User chưa có role nào, tiếp tục gán
            }

            // Gán role Admin (bỏ qua lỗi nếu đã có)
            try {
                await UserRolesS.assignRoleToUser(userId, roleId);
            } catch (error) {
                if (error.message.includes('already assigned')) {
                    // Đã có rồi, không sao
                } else {
                    throw error;
                }
            }

            res.json({
                success: true,
                message: 'Admin role assigned successfully',
                role: 'Admin'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to assign admin role',
                error: error.message
            });
        }
    }
};

module.exports = AuthC;

