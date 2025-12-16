const UserS = require('../services/userS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');

const UserC = {
    getAllUsers: async (req, res) => {
        try {
            const users = await UserS.findAll();
            res.json({
                success: true,
                message: 'Users fetched successfully',
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error.message
            });
        }
    },
    getUserById: async (req, res) => {
        try {
            const user = await UserS.findById(req.params.id);
            res.json({
                success: true,
                message: 'User fetched successfully',
                data: user
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found') {
                statusCode = 404;
            } else if (error.message === 'ID is required') {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to fetch user',
                error: error.message
            });
        }
    },
    createUser: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const userData = {
                ...req.body,
                actor: actorInfo
            };
            const user = await UserS.createUser(userData);

            // Log audit
            await auditLogger({
                tableName: 'users',
                recordId: user.id,
                action: 'CREATE',
                actor: actorInfo,
                newData: user,
                req
            });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message.includes('already exists')) {
                statusCode = 409;
            } else if (error.message.includes('Missing required fields')) {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to create user',
                error: error.message,
            });
        }
    },
    updateUser: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before update
            const oldUser = await UserS.findById(req.params.id);

            const userData = {
                ...req.body,
                actor: actorInfo
            };
            const user = await UserS.updateUser(req.params.id, userData);

            // Log audit
            await auditLogger({
                tableName: 'users',
                recordId: user.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldUser,
                newData: user,
                req
            });

            res.json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found') {
                statusCode = 404;
            } else if (error.message.includes('already exists')) {
                statusCode = 409;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update user',
                error: error.message,
            });
        }
    },
    deleteUser: async (req, res) => {
        try {
            const actorInfo = getActor(req);

            // Get old data before delete
            const oldUser = await UserS.findById(req.params.id);

            const user = await UserS.deleteUser(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'users',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldUser,
                req
            });

            res.json({
                success: true,
                message: 'User deleted successfully',
                data: user
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found') {
                statusCode = 404;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message
            });
        }
    },
    bulkDeleteUsers: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No user IDs provided'
                });
            }

            // Get old data before delete for audit (only for valid users)
            const oldUsers = [];
            const validIds = [];
            for (const id of ids) {
                try {
                    const user = await UserS.findById(id);
                    if (user) {
                        oldUsers.push(user);
                        validIds.push(id);
                    }
                } catch (err) {
                    // User not found, skip
                }
            }

            if (validIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No valid users found to delete'
                });
            }

            const deletedUsers = await UserS.bulkDeleteUsers(validIds);

            // Log audit for each deleted user
            for (const oldUser of oldUsers) {
                await auditLogger({
                    tableName: 'users',
                    recordId: oldUser.id,
                    action: 'DELETE',
                    actor: actorInfo,
                    oldData: oldUser,
                    req
                });
            }

            const skippedCount = ids.length - deletedUsers.length;
            const message = skippedCount > 0
                ? `Successfully deleted ${deletedUsers.length} user(s). ${skippedCount} user(s) not found.`
                : `Successfully deleted ${deletedUsers.length} user(s)`;

            res.json({
                success: true,
                message: message,
                data: deletedUsers,
                count: deletedUsers.length,
                skipped: skippedCount
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete users',
                error: error.message
            });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const userId = req.user.id; // Get from JWT token

            // Get old data before update
            const oldUser = await UserS.findById(userId);

            const profileData = req.body;
            const user = await UserS.updateProfile(userId, profileData);

            // Log audit
            await auditLogger({
                tableName: 'users',
                recordId: user.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldUser,
                newData: user,
                req
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: user
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found') {
                statusCode = 404;
            } else if (error.message.includes('already exists')) {
                statusCode = 409;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    },
    changePassword: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const userId = req.user.id; // Get from JWT token
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Old password and new password are required'
                });
            }

            await UserS.changePassword(userId, oldPassword, newPassword);

            // Log audit (don't log password)
            await auditLogger({
                tableName: 'users',
                recordId: userId,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: { id: userId, action: 'password_change' },
                newData: { id: userId, action: 'password_change' },
                req
            });

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            let statusCode = 500;
            if (error.message === 'User not found') {
                statusCode = 404;
            } else if (error.message.includes('incorrect') || error.message.includes('required')) {
                statusCode = 400;
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to change password',
                error: error.message
            });
        }
    }
};

module.exports = UserC;
