const OrdersS = require('../ordersS');
const OrdersM = require('../../models/ordersM');
const NotificationsS = require('../notificationsS');
const logger = require('../../utils/logger');

const OrderActions = {
    /**
     * Create a new order
     */
    createOrder: async (params, user) => {
        try {
            const { customerName, type = 'sell', date } = params;
            
            if (!customerName) {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp tên khách hàng'
                };
            }

            const orderData = {
                type,
                date: date || new Date().toISOString().split('T')[0],
                customerName,
                total: 0,
                uId: user?.id || user?.Id,
                actor: user?.id || user?.Id || 'system'
            };

            const order = await OrdersS.createOrder(orderData);

            // Create notification for new order (non-blocking)
            try {
                await NotificationsS.notifyNewOrder(order);
            } catch (notifError) {
                logger.warn('Failed to create notification for chatbot order', {
                    error: notifError.message
                });
            }

            return {
                success: true,
                message: `Đã tạo đơn hàng thành công: ${order.id || order.Id}`,
                data: order
            };
        } catch (error) {
            logger.error('Error creating order', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi tạo đơn hàng',
                error: error.message
            };
        }
    },

    /**
     * Get order status/details
     */
    getOrderStatus: async (params) => {
        try {
            const { orderId } = params;
            if (!orderId) {
                return {
                    success: false,
                    message: 'Vui lòng cung cấp ID đơn hàng'
                };
            }

            const order = await OrdersS.findById(orderId);
            if (!order) {
                return {
                    success: false,
                    message: `Không tìm thấy đơn hàng với ID: ${orderId}`
                };
            }

            const status = order.status || 'pending';
            const statusText = {
                'pending': 'Đang chờ xử lý',
                'processing': 'Đang xử lý',
                'completed': 'Hoàn thành',
                'cancelled': 'Đã hủy'
            }[status] || status;

            return {
                success: true,
                message: `Trạng thái đơn hàng ${orderId}: ${statusText}`,
                data: order,
                status: status,
                statusText: statusText
            };
        } catch (error) {
            logger.error('Error getting order status', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy trạng thái đơn hàng',
                error: error.message
            };
        }
    },

    /**
     * List all orders
     */
    listOrders: async (params) => {
        try {
            const { limit = 20, status } = params;
            let orders = await OrdersS.findAll();

            // Filter by status if provided
            if (status) {
                orders = orders.filter(order => 
                    (order.status || '').toLowerCase() === status.toLowerCase()
                );
            }

            const limited = orders.slice(0, parseInt(limit, 10));

            return {
                success: true,
                message: `Danh sách ${limited.length} đơn hàng:`,
                data: limited,
                total: orders.length,
                count: limited.length
            };
        } catch (error) {
            logger.error('Error listing orders', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách đơn hàng',
                error: error.message
            };
        }
    }
};

module.exports = OrderActions;

