const NotificationsS = require('../services/notificationsS');

const NotificationsC = {
    // Get all notifications
    getAllNotifications: async (req, res) => {
        try {
            const { is_read, type, limit, offset } = req.query;
            const filters = {};
            
            if (is_read !== undefined) {
                filters.is_read = is_read === 'true';
            }
            if (type) {
                filters.type = type;
            }
            if (limit) {
                filters.limit = parseInt(limit);
            }
            if (offset) {
                filters.offset = parseInt(offset);
            }
            
            const notifications = await NotificationsS.getAllNotifications(filters);
            
            res.json({
                success: true,
                data: notifications,
                count: notifications.length
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications',
                error: error.message
            });
        }
    },

    // Get unread notifications
    getUnreadNotifications: async (req, res) => {
        try {
            const { limit } = req.query;
            const notifications = await NotificationsS.getUnreadNotifications(limit ? parseInt(limit) : 50);
            
            res.json({
                success: true,
                data: notifications,
                count: notifications.length
            });
        } catch (error) {
            console.error('Get unread notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread notifications',
                error: error.message
            });
        }
    },

    // Get unread count
    getUnreadCount: async (req, res) => {
        try {
            const count = await NotificationsS.getUnreadCount();
            
            res.json({
                success: true,
                count: count
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: error.message
            });
        }
    },

    // Mark as read
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await NotificationsS.markAsRead(id);
            
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Notification marked as read',
                data: notification
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    },

    // Mark all as read
    markAllAsRead: async (req, res) => {
        try {
            const notifications = await NotificationsS.markAllAsRead();
            
            res.json({
                success: true,
                message: 'All notifications marked as read',
                count: notifications.length
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: error.message
            });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await NotificationsS.deleteNotification(id);
            
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Notification deleted',
                data: notification
            });
        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }
    },

    // Check low stock (manual trigger)
    checkLowStock: async (req, res) => {
        try {
            const { threshold } = req.query;
            const notifications = await NotificationsS.checkLowStock(threshold ? parseInt(threshold) : 10);
            
            res.json({
                success: true,
                message: `Found ${notifications.length} low stock products`,
                data: notifications,
                count: notifications.length
            });
        } catch (error) {
            console.error('Check low stock error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check low stock',
                error: error.message
            });
        }
    }
};

module.exports = NotificationsC;

