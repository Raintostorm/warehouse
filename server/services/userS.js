const UsersM = require('../models/usersM');
const UserRolesM = require('../models/userRolesM');
const db = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { sendWelcomeEmail } = require('../utils/emailService');

const UserS = {
    findAll: async () => {
        return await UsersM.findAll();
    },
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const user = await UsersM.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    },
    findByEmail: async (email) => {
        const user = await UsersM.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    },
    findByNumber: async (number) => {
        const user = await UsersM.findByNumber(number);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    },
    createUser: async (userData) => {
        if (!userData.id || !userData.fullname || !userData.email) {
            throw new Error('Missing required fields: id, fullname, email');
        }
        const existingUserById = await UsersM.findById(userData.id);
        if (existingUserById) {
            throw new Error('User ID already exists');
        }
        const existingUserByEmail = await UsersM.findByEmail(userData.email);
        if (existingUserByEmail) {
            throw new Error('Email already exists');
        }
        if (userData.number) {
            const existingUserByNumber = await UsersM.findByNumber(userData.number);
            if (existingUserByNumber) {
                throw new Error('Number already exists');
            }
        }
        if (userData.password) {
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            userData.password = hashedPassword;
        }

        const newUser = await UsersM.create(userData);

        // Send welcome email (async, don't wait)
        if (newUser.email && newUser.fullname) {
            sendWelcomeEmail(newUser.email, newUser.fullname)
                .catch(error => {
                    console.error('Failed to send welcome email:', error);
                    // Don't throw - user creation should succeed even if email fails
                });
        }

        return newUser;
    },
    updateUser: async (id, userData) => {
        // Check user exists
        const existingUser = await UsersM.findById(id);
        if (!existingUser) {
            throw new Error('User not found');
        }

        if (userData.email && userData.email !== existingUser.email) {
            const emailExists = await UsersM.findByEmail(userData.email);
            if (emailExists) {
                throw new Error('Email already exists');
            }
        }
        if (userData.password) {
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            userData.password = hashedPassword;
        }

        // Update user (không cần validation tất cả fields)
        return await UsersM.update(id, userData);
    },
    deleteUser: async (id) => {
        const existingUser = await UsersM.findById(id);
        if (!existingUser) {
            throw new Error('User not found');
        }

        // Try to delete user_roles first (if it fails, CASCADE will handle it)
        try {
            await UserRolesM.deleteByUserId(id);
        } catch (error) {
            // If deletion fails due to column name issue, let CASCADE handle it
            // This is safe because foreign key has ON DELETE CASCADE
            if (error.message.includes('does not exist') || error.message.includes('column')) {
            } else {
                throw error;
            }
        }

        // Delete user - CASCADE will automatically delete related records
        return await UsersM.delete(id);
    },
    bulkDeleteUsers: async (ids) => {
        if (!ids || ids.length === 0) {
            throw new Error('No user IDs provided');
        }
        // Filter out non-existent users before deleting
        const validIds = [];
        for (const id of ids) {
            try {
                const user = await UsersM.findById(id);
                if (user) {
                    validIds.push(id);
                }
            } catch (err) {
                // User not found, skip
            }
        }
        if (validIds.length === 0) {
            throw new Error('No valid users found to delete');
        }

        // Delete user_roles first to avoid foreign key constraint violation
        await UserRolesM.bulkDeleteByUserIds(validIds);

        // Then delete users
        return await UsersM.bulkDelete(validIds);
    },
    updateProfile: async (id, profileData) => {
        // Check user exists
        const existingUser = await UsersM.findById(id);
        if (!existingUser) {
            throw new Error('User not found');
        }

        // Only allow updating: fullname, number, address
        // Don't allow updating: id, email (these require admin)
        const allowedFields = ['fullname', 'number', 'address'];
        const updateData = {};

        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                updateData[field] = profileData[field];
            }
        }

        // Check if number is being changed and if it conflicts
        if (updateData.number && updateData.number !== existingUser.number) {
            const numberExists = await UsersM.findByNumber(updateData.number);
            if (numberExists && numberExists.id !== id) {
                throw new Error('Phone number already exists');
            }
        }

        return await UsersM.update(id, updateData);
    },
    changePassword: async (id, oldPassword, newPassword) => {
        if (!oldPassword || !newPassword) {
            throw new Error('Old password and new password are required');
        }

        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
        }

        // Check user exists
        const existingUser = await UsersM.findById(id);
        if (!existingUser) {
            throw new Error('User not found');
        }

        // Verify old password
        const userPassword = existingUser.password || existingUser.Password;
        if (!userPassword) {
            throw new Error('User does not have a password set');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, userPassword);
        if (!isOldPasswordValid) {
            throw new Error('Old password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        return await UsersM.update(id, { password: hashedPassword });
    }
}

module.exports = UserS;