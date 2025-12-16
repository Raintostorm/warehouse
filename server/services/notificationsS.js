const NotificationsM = require('../models/notificationsM');
const ProductsM = require('../models/productsM');
const ProductDetailsM = require('../models/productDetailsM');
const { sendLowStockAlertEmail, sendNewOrderEmail } = require('../utils/emailService');
const { getAdminEmails } = require('../utils/getAdminEmails');

const NotificationsS = {
    // Create notification
    createNotification: async (type, title, message, data = null) => {
        return await NotificationsM.create({
            type,
            title,
            message,
            data,
            is_read: false
        });
    },

    // Notify new order
    notifyNewOrder: async (order) => {
        const notification = await NotificationsM.create({
            type: 'new_order',
            title: 'Đơn hàng mới',
            message: `Đơn hàng ${order.id} đã được tạo - ${order.customer_name || 'Khách hàng'}`,
            data: {
                orderId: order.id,
                orderType: order.type,
                customerName: order.customer_name,
                total: order.total
            },
            is_read: false
        });

        // Send email to admins (async, don't wait)
        getAdminEmails()
            .then(adminEmails => {
                if (adminEmails.length > 0) {
                    return sendNewOrderEmail(adminEmails, {
                        orderId: order.id,
                        orderType: order.type,
                        customerName: order.customer_name,
                        total: order.total
                    });
                }
            })
            .catch(error => {
                console.error('Failed to send new order email:', error);
            });

        return notification;
    },

    // Check and notify low stock products
    checkLowStock: async (threshold = 10) => {
        try {
            // Get all products
            const products = await ProductsM.findAll();
            const productDetails = await ProductDetailsM.findAll();

            const lowStockProducts = [];

            // Check each product
            for (const product of products) {
                // Calculate total stock from product_details
                const details = productDetails.filter(d => d.pid === product.id);
                const totalStock = details.reduce((sum, d) => sum + (parseInt(d.number) || 0), 0);

                // Also check product.number if it exists
                const productStock = parseInt(product.number) || 0;
                const total = totalStock + productStock;

                if (total <= threshold && total > 0) {
                    lowStockProducts.push({
                        productId: product.id,
                        productName: product.name,
                        currentStock: total,
                        threshold: threshold
                    });
                }
            }

            // Create notifications for low stock products
            const notifications = [];
            for (const product of lowStockProducts) {
                // Check if notification already exists for this product
                const existing = await NotificationsM.findAll({
                    type: 'low_stock',
                    limit: 1
                });

                const alreadyNotified = existing.some(n =>
                    n.data && n.data.productId === product.productId && !n.is_read
                );

                if (!alreadyNotified) {
                    const notification = await NotificationsM.create({
                        type: 'low_stock',
                        title: 'Cảnh báo: Sản phẩm sắp hết hàng',
                        message: `${product.productName} chỉ còn ${product.currentStock} ${product.productId}`,
                        data: {
                            productId: product.productId,
                            productName: product.productName,
                            currentStock: product.currentStock,
                            threshold: product.threshold
                        },
                        is_read: false
                    });
                    notifications.push(notification);

                    // Send email to admins (async, don't wait)
                    getAdminEmails()
                        .then(adminEmails => {
                            if (adminEmails.length > 0) {
                                return sendLowStockAlertEmail(adminEmails, {
                                    productId: product.productId,
                                    productName: product.productName,
                                    currentStock: product.currentStock,
                                    threshold: product.threshold
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Failed to send low stock email:', error);
                        });
                }
            }

            return notifications;
        } catch (error) {
            console.error('Check low stock error:', error);
            return [];
        }
    },

    // Get all notifications
    getAllNotifications: async (filters = {}) => {
        return await NotificationsM.findAll(filters);
    },

    // Get unread notifications
    getUnreadNotifications: async (limit = 50) => {
        return await NotificationsM.findAll({ is_read: false, limit });
    },

    // Mark as read
    markAsRead: async (id) => {
        return await NotificationsM.markAsRead(id);
    },

    // Mark all as read
    markAllAsRead: async () => {
        return await NotificationsM.markAllAsRead();
    },

    // Delete notification
    deleteNotification: async (id) => {
        return await NotificationsM.delete(id);
    },

    // Get unread count
    getUnreadCount: async () => {
        return await NotificationsM.getUnreadCount();
    }
};

module.exports = NotificationsS;

