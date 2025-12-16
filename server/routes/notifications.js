const express = require('express');
const router = express.Router();

const NotificationsC = require('../controllers/notificationsC');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Get all notifications
router.get('/', NotificationsC.getAllNotifications);

// Get unread notifications
router.get('/unread', NotificationsC.getUnreadNotifications);

// Get unread count
router.get('/unread/count', NotificationsC.getUnreadCount);

// Mark as read
router.put('/:id/read', NotificationsC.markAsRead);

// Mark all as read
router.put('/read/all', NotificationsC.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationsC.deleteNotification);

// Check low stock (manual trigger)
router.post('/check-low-stock', NotificationsC.checkLowStock);

module.exports = router;

