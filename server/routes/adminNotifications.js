const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');
const UserRolesM = require('../models/userRolesM');
const UsersM = require('../models/usersM');
const { queryWithFallback } = require('../utils/dbHelper');
const { getAdminEmails } = require('../utils/getAdminEmails');
const logger = require('../utils/logger');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * Get all staff/employee emails
 */
async function getStaffEmails() {
    try {
        // Find Staff role ID
        let staffRole;
        try {
            const roleResult = await queryWithFallback(
                'SELECT id FROM roles WHERE name = $1',
                'SELECT "Id" as id FROM "Roles" WHERE "Name" = $1',
                ['Staff']
            );
            staffRole = roleResult.rows[0];
        } catch (e) {
            const rolesResult = await queryWithFallback(
                'SELECT id, name FROM roles',
                'SELECT "Id" as id, "Name" as name FROM "Roles"'
            );
            staffRole = rolesResult.rows.find(r => {
                const name = (r.name || r.Name || '').toLowerCase();
                return name === 'staff';
            });
        }

        if (!staffRole) {
            return [];
        }

        const roleId = staffRole.id || staffRole.Id;
        const staffUsers = await UserRolesM.findByRoleId(roleId);

        const emails = staffUsers
            .map(user => user.email || user.Email)
            .filter(email => email && email.includes('@'));

        return emails;
    } catch (error) {
        logger.error('Error getting staff emails:', error);
        return [];
    }
}

/**
 * Get all user emails (for admin to send to specific users)
 */
async function getAllUserEmails() {
    try {
        const users = await UsersM.findAll();
        return users
            .map(user => ({
                id: user.id || user.Id,
                email: user.email || user.Email,
                fullname: user.fullname || user.Fullname
            }))
            .filter(user => user.email && user.email.includes('@'));
    } catch (error) {
        logger.error('Error getting user emails:', error);
        return [];
    }
}

/**
 * Send notification email to staff
 * POST /api/admin-notifications/send-to-staff
 */
router.post('/send-to-staff', async (req, res) => {
    try {
        const { subject, message, html } = req.body;
        const adminUser = req.user;

        // Check if user is admin
        if (adminUser.role !== 'Admin' && adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can send notifications to staff'
            });
        }

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Subject and message are required'
            });
        }

        // Get all staff emails
        const staffEmails = await getStaffEmails();

        if (staffEmails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No staff emails found'
            });
        }

        // Create HTML email
        const emailHtml = html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">${subject}</h2>
                <p>Xin chào,</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <p>Trân trọng,<br/><strong>${adminUser.fullname || adminUser.Fullname || 'Admin'}</strong><br/>MyWarehouse</p>
            </div>
        `;

        // Send email to all staff
        await sendEmail(staffEmails, subject, emailHtml, message);

        logger.info('Admin notification sent to staff', {
            adminId: adminUser.id || adminUser.Id,
            staffCount: staffEmails.length,
            subject
        });

        res.json({
            success: true,
            message: `Notification sent to ${staffEmails.length} staff member(s)`,
            recipients: staffEmails.length
        });
    } catch (error) {
        logger.error('Error sending notification to staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

/**
 * Send notification email to specific users
 * POST /api/admin-notifications/send-to-users
 */
router.post('/send-to-users', async (req, res) => {
    try {
        const { userIds, subject, message, html } = req.body;
        const adminUser = req.user;

        // Check if user is admin
        if (adminUser.role !== 'Admin' && adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can send notifications'
            });
        }

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Subject and message are required'
            });
        }

        // Get user emails
        const allUsers = await getAllUserEmails();
        const targetUsers = allUsers.filter(user => userIds.includes(user.id));
        const targetEmails = targetUsers.map(user => user.email);

        if (targetEmails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid user emails found'
            });
        }

        // Create HTML email
        const emailHtml = html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">${subject}</h2>
                <p>Xin chào,</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <p>Trân trọng,<br/><strong>${adminUser.fullname || adminUser.Fullname || 'Admin'}</strong><br/>MyWarehouse</p>
            </div>
        `;

        // Send email
        await sendEmail(targetEmails, subject, emailHtml, message);

        logger.info('Admin notification sent to users', {
            adminId: adminUser.id || adminUser.Id,
            userCount: targetEmails.length,
            subject
        });

        res.json({
            success: true,
            message: `Notification sent to ${targetEmails.length} user(s)`,
            recipients: targetEmails.length
        });
    } catch (error) {
        logger.error('Error sending notification to users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

/**
 * Get list of all users (for admin to select recipients)
 * GET /api/admin-notifications/users
 */
router.get('/users', async (req, res) => {
    try {
        const adminUser = req.user;

        // Check if user is admin
        if (adminUser.role !== 'Admin' && adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can access this endpoint'
            });
        }

        const users = await getAllUserEmails();

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        logger.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
});

module.exports = router;
