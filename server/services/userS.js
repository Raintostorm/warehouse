const UsersM = require('../models/usersM');
const UserRolesM = require('../models/userRolesM');
const db = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { sendWelcomeEmail } = require('../utils/emailService');

// Helper function để generate user ID tự động
async function generateUserId() {
    try {
        // Lấy user ID lớn nhất hiện tại (format: U001, U002, ...)
        // Support both snake_case and PascalCase schemas
        const { queryWithFallback } = require('../utils/dbHelper');
        const result = await queryWithFallback(
            `SELECT id FROM users WHERE id LIKE 'U%' AND LENGTH(id) <= 10 ORDER BY CAST(SUBSTRING(id FROM 2) AS INTEGER) DESC LIMIT 1`,
            `SELECT "Id" as id FROM "Users" WHERE "Id" LIKE 'U%' AND LENGTH("Id") <= 10 ORDER BY CAST(SUBSTRING("Id" FROM 2) AS INTEGER) DESC LIMIT 1`
        );

        if (result.rows.length === 0) {
            // Chưa có user nào, bắt đầu từ U001
            return 'U001';
        }

        const lastId = result.rows[0].id || result.rows[0].Id;
        // Extract number từ UXXX
        const match = lastId.match(/^U(\d+)$/);
        if (match) {
            const nextNumber = parseInt(match[1], 10) + 1;
            // Format với 3 digits (001, 002, ...) nhưng đảm bảo không quá 10 ký tự
            const paddedNumber = nextNumber.toString().padStart(3, '0');
            const newId = `U${paddedNumber}`;
            // Nếu quá 10 ký tự, dùng format ngắn hơn
            if (newId.length > 10) {
                return `U${nextNumber}`;
            }
            return newId;
        }

        // Fallback nếu format không đúng
        return `U${Date.now().toString().slice(-6)}`;
    } catch (error) {
        console.error('Error generating user ID:', error);
        // Fallback to timestamp-based ID
        return `U${Date.now().toString().slice(-6)}`;
    }
}

const UserS = {
    findAll: async () => {
        const users = await UsersM.findAll();
        // Remove password from response
        return users.map(user => {
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            delete userWithoutPassword.Password;
            return userWithoutPassword;
        });
    },
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        const user = await UsersM.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        // Remove password from response
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
    },
    findByEmail: async (email) => {
        const user = await UsersM.findByEmail(email);
        if (!user) {
            return null; // Return null instead of throwing for existence checks
        }
        // Remove password from response
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
    },
    findByNumber: async (number) => {
        const user = await UsersM.findByNumber(number);
        if (!user) {
            return null; // Return null instead of throwing for existence checks
        }
        // Remove password from response
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
    },
    createUser: async (userData) => {
        if (!userData.fullname || !userData.email) {
            throw new Error('Missing required fields: fullname, email');
        }
        
        // Auto-generate user ID if not provided
        if (!userData.id) {
            userData.id = await generateUserId();
        }
        
        // Check if generated ID already exists (retry if needed)
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const existingUserById = await UsersM.findById(userData.id);
            if (!existingUserById) {
                break; // ID is available
            }
            // ID exists, generate new one
            userData.id = await generateUserId();
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique user ID after multiple attempts');
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
                    // Silently ignore email errors in tests
                    if (process.env.NODE_ENV !== 'test') {
                        console.error('Failed to send welcome email:', error);
                    }
                    // Don't throw - user creation should succeed even if email fails
                });
        }

        // Remove password from response
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
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
        const updatedUser = await UsersM.update(id, userData);
        // Remove password from response
        const userWithoutPassword = { ...updatedUser };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
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
        const deletedUser = await UsersM.delete(id);
        // Remove password from response
        const userWithoutPassword = { ...deletedUser };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
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

        const updatedUser = await UsersM.update(id, updateData);
        // Remove password from response
        const userWithoutPassword = { ...updatedUser };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;
        return userWithoutPassword;
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