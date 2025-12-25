import axios from 'axios';

// Get API URL from environment variable with fallback
const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
        // Remove trailing slash if present
        return envUrl.replace(/\/$/, '');
    }
    // Fallback to localhost for development
    return 'http://localhost:3000/api';
};

// Validate API URL format
const apiUrl = getApiUrl();
if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    console.warn('Invalid API URL format. Using default localhost URL.');
}

// Tạo instance axios với base URL
const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000, // 30 seconds timeout
});

// API cho Users
export const userAPI = {
    // Lấy tất cả users
    getAllUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    // Lấy user theo ID
    getUserById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    // Tạo user mới
    createUser: async (userData) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    // Cập nhật user
    updateUser: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    // Xóa user
    deleteUser: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    // Xóa nhiều users
    bulkDeleteUsers: async (ids) => {
        const response = await api.delete('/users/bulk', { data: { ids } });
        return response.data;
    },

    // Update profile (user's own profile)
    updateProfile: async (profileData) => {
        const response = await api.put('/users/profile/update', profileData);
        return response.data;
    },

    // Change password
    changePassword: async (oldPassword, newPassword) => {
        const response = await api.put('/users/profile/change-password', {
            oldPassword,
            newPassword
        });
        return response.data;
    }
};

// API cho Roles (chỉ READ)
export const roleAPI = {
    // Lấy tất cả roles
    getAllRoles: async () => {
        const response = await api.get('/roles');
        return response.data;
    },

    // Lấy role theo ID
    getRoleById: async (id) => {
        const response = await api.get(`/roles/${id}`);
        return response.data;
    }
};

// API cho UserRoles (CREATE, READ, DELETE)
export const userRoleAPI = {
    // Lấy tất cả user-role assignments
    getAllUserRoles: async () => {
        const response = await api.get('/user-roles');
        return response.data;
    },

    // Lấy roles của một user
    getUserRoles: async (userId) => {
        const response = await api.get(`/user-roles/user/${userId}`);
        return response.data;
    },

    // Lấy users có một role cụ thể
    getRoleUsers: async (roleId) => {
        const response = await api.get(`/user-roles/role/${roleId}`);
        return response.data;
    },

    // CREATE: Gán role cho user
    assignRoleToUser: async (userId, roleId) => {
        const response = await api.post('/user-roles/assign', {
            userId,
            roleId
        });
        return response.data;
    },

    // DELETE: Xóa role của user
    removeRoleFromUser: async (userId, roleId) => {
        const response = await api.post('/user-roles/remove', {
            userId,
            roleId
        });
        return response.data;
    }
};

// API cho Authentication
export const authAPI = {
    // Fix admin role - gán role Admin cho user hiện tại
    fixAdminRole: async () => {
        const token = localStorage.getItem('token');
        const response = await api.post('/auth/fix-admin-role', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    },
    // Đăng nhập
    login: async (email, password) => {
        const response = await api.post('/auth/login', {
            email,
            password
        });
        return response;
    },

    // Yêu cầu quên mật khẩu
    forgotPassword: async (email) => {
        const baseResetUrl = window.location.origin + '/reset-password';
        const response = await api.post('/auth/forgot-password', {
            email,
            baseResetUrl
        });
        return response.data;
    },

    // Đặt lại mật khẩu với token
    resetPassword: async (token, password) => {
        const response = await api.post('/auth/reset-password', {
            token,
            password
        });
        return response.data;
    },

    // Verify token
    verify: async () => {
        const token = localStorage.getItem('token');
        const response = await api.get('/auth/verify', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    },

    // Google OAuth login
    googleLogin: async (googleToken) => {
        const response = await api.post('/auth/google', {
            token: googleToken
        });
        return response;
    },

    // Google OAuth register
    googleRegister: async (googleToken, additionalData = {}) => {
        const response = await api.post('/auth/google/register', {
            token: googleToken,
            ...additionalData
        });
        return response;
    }
};

// API cho Warehouses
export const warehouseAPI = {
    getAllWarehouses: async () => {
        const response = await api.get('/warehouses');
        return response.data;
    },
    getWarehouseById: async (id) => {
        const response = await api.get(`/warehouses/${id}`);
        return response.data;
    },
    createWarehouse: async (warehouseData) => {
        const response = await api.post('/warehouses', warehouseData);
        return response.data;
    },
    updateWarehouse: async (id, warehouseData) => {
        const response = await api.put(`/warehouses/${id}`, warehouseData);
        return response.data;
    },
    deleteWarehouse: async (id) => {
        const response = await api.delete(`/warehouses/${id}`);
        return response.data;
    }
};

// API cho Orders
export const orderAPI = {
    getAllOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },
    getOrderById: async (id) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },
    createOrder: async (orderData) => {
        const response = await api.post('/orders', orderData);
        return response.data;
    },
    updateOrder: async (id, orderData) => {
        const response = await api.put(`/orders/${id}`, orderData);
        return response.data;
    },
    deleteOrder: async (id) => {
        const response = await api.delete(`/orders/${id}`);
        return response.data;
    },
    generateBill: async (orderIds, productIds = null) => {
        // Support both single orderId (string) and multiple orderIds (array)
        const orderIdArray = Array.isArray(orderIds) ? orderIds : [orderIds];
        const firstOrderId = orderIdArray[0];

        const response = await api.post(`/orders/${firstOrderId}/generate-bill`,
            { orderIds: orderIdArray, productIds },
            { responseType: 'blob' }
        );
        return response;
    }
};

// API cho Bills
export const billAPI = {
    getAllBills: async () => {
        const response = await api.get('/bills');
        return response.data;
    },
    getBillById: async (id) => {
        const response = await api.get(`/bills/${id}`);
        return response.data;
    },
    getBillsByOrderId: async (orderId) => {
        const response = await api.get(`/bills/order/${orderId}`);
        return response.data;
    },
    getUnpaidBills: async () => {
        const response = await api.get('/bills/unpaid');
        return response.data;
    },
    createBill: async (billData) => {
        const response = await api.post('/bills', billData);
        return response.data;
    },
    updateBill: async (id, billData) => {
        const response = await api.put(`/bills/${id}`, billData);
        return response.data;
    },
    deleteBill: async (id) => {
        const response = await api.delete(`/bills/${id}`);
        return response.data;
    }
};

// API cho Payments
export const paymentAPI = {
    getAllPayments: async () => {
        const response = await api.get('/payments');
        return response.data;
    },
    getPaymentById: async (id) => {
        const response = await api.get(`/payments/${id}`);
        return response.data;
    },
    getPaymentsByOrderId: async (orderId) => {
        const response = await api.get(`/payments/order/${orderId}`);
        return response.data;
    },
    getOrderPaymentSummary: async (orderId) => {
        const response = await api.get(`/payments/order/${orderId}/summary`);
        return response.data;
    },
    createPayment: async (paymentData) => {
        const response = await api.post('/payments', paymentData);
        return response.data;
    },
    updatePayment: async (id, paymentData) => {
        const response = await api.put(`/payments/${id}`, paymentData);
        return response.data;
    },
    deletePayment: async (id) => {
        const response = await api.delete(`/payments/${id}`);
        return response.data;
    },
    // Payment Gateway APIs
    initiateGatewayPayment: async (orderId, amount, gateway, orderInfo) => {
        const response = await api.post('/payments/gateway/initiate', {
            orderId,
            amount,
            gateway,
            orderInfo
        });
        return response.data;
    },
    getGatewayStatus: async () => {
        const response = await api.get('/payments/gateway/status');
        return response.data;
    }
};

// API cho Products
export const productAPI = {
    getAllProducts: async () => {
        const response = await api.get('/products');
        return response.data;
    },
    getProductById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
    createProduct: async (productData) => {
        const response = await api.post('/products', productData);
        return response.data;
    },
    updateProduct: async (id, productData) => {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    },
    deleteProduct: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    }
};

// API cho Suppliers
export const supplierAPI = {
    getAllSuppliers: async () => {
        const response = await api.get('/suppliers');
        return response.data;
    },
    getSupplierById: async (id) => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data;
    },
    createSupplier: async (supplierData) => {
        const response = await api.post('/suppliers', supplierData);
        return response.data;
    },
    updateSupplier: async (id, supplierData) => {
        const response = await api.put(`/suppliers/${id}`, supplierData);
        return response.data;
    },
    deleteSupplier: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    }
};

// API cho ProductDetails
export const productDetailAPI = {
    getAllProductDetails: async () => {
        const response = await api.get('/product-details');
        return response.data;
    },
    getProductDetailsByProductId: async (pid) => {
        const response = await api.get(`/product-details/product/${pid}`);
        return response.data;
    },
    getProductDetailsByWarehouseId: async (wid) => {
        const response = await api.get(`/product-details/warehouse/${wid}`);
        return response.data;
    },
    createProductDetail: async (productDetailData) => {
        const response = await api.post('/product-details', productDetailData);
        return response.data;
    },
    updateProductDetail: async (pid, wid, productDetailData) => {
        const response = await api.put(`/product-details/${pid}/${wid}`, productDetailData);
        return response.data;
    },
    deleteProductDetail: async (pid, wid) => {
        const response = await api.delete(`/product-details/${pid}/${wid}`);
        return response.data;
    }
};

// API cho OrderDetails
export const orderDetailAPI = {
    getAllOrderDetails: async () => {
        const response = await api.get('/order-details');
        return response.data;
    },
    getOrderDetailsByOrderId: async (oid) => {
        const response = await api.get(`/order-details/order/${oid}`);
        return response.data;
    },
    getOrderDetailsByProductId: async (pid) => {
        const response = await api.get(`/order-details/product/${pid}`);
        return response.data;
    },
    createOrderDetail: async (orderDetailData) => {
        const response = await api.post('/order-details', orderDetailData);
        return response.data;
    },
    updateOrderDetail: async (oid, pid, orderDetailData) => {
        const response = await api.put(`/order-details/${oid}/${pid}`, orderDetailData);
        return response.data;
    },
    deleteOrderDetail: async (oid, pid) => {
        const response = await api.delete(`/order-details/${oid}/${pid}`);
        return response.data;
    }
};

// API cho WarehouseManagement
export const warehouseManagementAPI = {
    getAllWarehouseManagements: async () => {
        const response = await api.get('/warehouse-management');
        return response.data;
    },
    getWarehouseManagementsByWarehouseId: async (wid) => {
        const response = await api.get(`/warehouse-management/warehouse/${wid}`);
        return response.data;
    },
    getWarehouseManagementsByUserId: async (uid) => {
        const response = await api.get(`/warehouse-management/user/${uid}`);
        return response.data;
    },
    createWarehouseManagement: async (warehouseManagementData) => {
        const response = await api.post('/warehouse-management', warehouseManagementData);
        return response.data;
    },
    updateWarehouseManagement: async (wid, uid, warehouseManagementData) => {
        const response = await api.put(`/warehouse-management/${wid}/${uid}`, warehouseManagementData);
        return response.data;
    },
    deleteWarehouseManagement: async (wid, uid) => {
        const response = await api.delete(`/warehouse-management/${wid}/${uid}`);
        return response.data;
    }
};

// API cho ProductManagement
export const productManagementAPI = {
    getAllProductManagements: async () => {
        const response = await api.get('/product-management');
        return response.data;
    },
    getProductManagementsByProductId: async (pid) => {
        const response = await api.get(`/product-management/product/${pid}`);
        return response.data;
    },
    getProductManagementsByUserId: async (uid) => {
        const response = await api.get(`/product-management/user/${uid}`);
        return response.data;
    },
    createProductManagement: async (productManagementData) => {
        const response = await api.post('/product-management', productManagementData);
        return response.data;
    },
    updateProductManagement: async (pid, uid, productManagementData) => {
        const response = await api.put(`/product-management/${pid}/${uid}`, productManagementData);
        return response.data;
    },
    deleteProductManagement: async (pid, uid) => {
        const response = await api.delete(`/product-management/${pid}/${uid}`);
        return response.data;
    }
};

// API cho OrderWarehouses
export const orderWarehouseAPI = {
    getAllOrderWarehouses: async () => {
        const response = await api.get('/order-warehouses');
        return response.data;
    },
    getOrderWarehousesByOrderId: async (oid) => {
        const response = await api.get(`/order-warehouses/order/${oid}`);
        return response.data;
    },
    getOrderWarehousesByWarehouseId: async (wid) => {
        const response = await api.get(`/order-warehouses/warehouse/${wid}`);
        return response.data;
    },
    createOrderWarehouse: async (orderWarehouseData) => {
        const response = await api.post('/order-warehouses', orderWarehouseData);
        return response.data;
    },
    updateOrderWarehouse: async (wid, oid, orderWarehouseData) => {
        const response = await api.put(`/order-warehouses/${wid}/${oid}`, orderWarehouseData);
        return response.data;
    },
    deleteOrderWarehouse: async (wid, oid) => {
        const response = await api.delete(`/order-warehouses/${wid}/${oid}`);
        return response.data;
    }
};

// API cho Statistics & Analytics
export const statisticsAPI = {
    getDashboardStats: async () => {
        const response = await api.get('/statistics/dashboard');
        return response.data;
    },
    getSalesTrends: async (period = 'month', days = 30) => {
        const response = await api.get('/statistics/sales-trends', {
            params: { period, days }
        });
        return response.data;
    },
    getProductPerformance: async (limit = 10, sortBy = 'revenue') => {
        const response = await api.get('/statistics/product-performance', {
            params: { limit, sortBy }
        });
        return response.data;
    },
    getWarehouseUtilization: async () => {
        const response = await api.get('/statistics/warehouse-utilization');
        return response.data;
    },
    getRevenueByPeriod: async (period = 'month', startDate = null, endDate = null) => {
        const response = await api.get('/statistics/revenue-by-period', {
            params: { period, startDate, endDate }
        });
        return response.data;
    },
    getInventoryTurnover: async (days = 30) => {
        const response = await api.get('/statistics/inventory-turnover', {
            params: { days }
        });
        return response.data;
    },
    getCustomerAnalytics: async (days = 30) => {
        const response = await api.get('/statistics/customer-analytics', {
            params: { days }
        });
        return response.data;
    },
    getSupplierAnalytics: async () => {
        const response = await api.get('/statistics/supplier-analytics');
        return response.data;
    }
};

// API cho Export/Import
export const exportAPI = {
    exportToExcel: async (table) => {
        const response = await api.get(`/export/excel/${table}`, {
            responseType: 'blob'
        });
        return response;
    },
    exportToCSV: async (table) => {
        const response = await api.get(`/export/csv/${table}`, {
            responseType: 'blob'
        });
        return response;
    }
};

export const importAPI = {
    importData: async (table, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/import/${table}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

// API cho Audit Logs
export const auditLogAPI = {
    getAuditLogs: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });
        const response = await api.get(`/audit-logs?${params.toString()}`);
        return response.data;
    },
    getRecordHistory: async (tableName, recordId) => {
        const response = await api.get(`/audit-logs/record/${tableName}/${recordId}`);
        return response.data;
    },
    getActorLogs: async (actor, limit = 100) => {
        const response = await api.get(`/audit-logs/actor/${actor}?limit=${limit}`);
        return response.data;
    }
};

// API cho Reports
export const reportAPI = {
    generateRevenueReport: async (format, startDate, endDate) => {
        const params = new URLSearchParams();
        params.append('format', format);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await api.get(`/reports/revenue?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    },
    generateInventoryReport: async (format) => {
        const params = new URLSearchParams();
        params.append('format', format);
        const response = await api.get(`/reports/inventory?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    },
    generateOrdersReport: async (format, startDate, endDate, orderType) => {
        const params = new URLSearchParams();
        params.append('format', format);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (orderType) params.append('orderType', orderType);
        const response = await api.get(`/reports/orders?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

// API cho Notifications
export const notificationAPI = {
    getAllNotifications: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });
        const response = await api.get(`/notifications?${params.toString()}`);
        return response.data;
    },
    getUnreadNotifications: async (limit = 50) => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        const response = await api.get(`/notifications/unread?${params.toString()}`);
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread/count');
        return response.data;
    },
    markAsRead: async (id) => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.put('/notifications/read/all');
        return response.data;
    },
    deleteNotification: async (id) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },
    checkLowStock: async (threshold = 10) => {
        const params = new URLSearchParams();
        if (threshold) params.append('threshold', threshold);
        const response = await api.post(`/notifications/check-low-stock?${params.toString()}`);
        return response.data;
    }
};

// API cho Admin Notifications
export const adminNotificationAPI = {
    sendToStaff: async (data) => {
        const response = await api.post('/admin-notifications/send-to-staff', data);
        return response.data;
    },
    sendToUsers: async (data) => {
        const response = await api.post('/admin-notifications/send-to-users', data);
        return response.data;
    },
    getUsers: async () => {
        const response = await api.get('/admin-notifications/users');
        return response.data;
    }
};

// Interceptor để thêm token vào mọi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor để handle errors centrally
api.interceptors.response.use(
    (response) => {
        // Return successful responses as-is
        return response;
    },
    (error) => {
        // Handle network errors
        if (!error.response) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                error.userMessage = 'Request timeout. Please check your connection and try again.';
            } else if (error.message === 'Network Error') {
                error.userMessage = 'Network error. Please check your internet connection.';
            } else {
                error.userMessage = 'Unable to connect to server. Please try again later.';
            }
            return Promise.reject(error);
        }

        const { status, data } = error.response;

        // Handle specific HTTP status codes
        switch (status) {
            case 401:
                // Unauthorized - token expired or invalid
                error.userMessage = 'Your session has expired. Please login again.';
                // Clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('roles');
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('login') && !window.location.pathname.includes('reset-password')) {
                    window.location.href = '/';
                }
                break;
            case 403:
                error.userMessage = data?.error || data?.message || 'You do not have permission to perform this action.';
                break;
            case 404:
                error.userMessage = data?.error || data?.message || 'Resource not found.';
                break;
            case 409:
                error.userMessage = data?.error || data?.message || 'This resource already exists.';
                break;
            case 422:
                error.userMessage = data?.error || data?.message || 'Validation error. Please check your input.';
                break;
            case 429:
                error.userMessage = 'Too many requests. Please wait a moment and try again.';
                break;
            case 500:
                error.userMessage = data?.error || data?.message || 'Server error. Please try again later.';
                break;
            case 503:
                error.userMessage = 'Service temporarily unavailable. Please try again later.';
                break;
            default:
                // Use server error message if available, otherwise generic message
                error.userMessage = data?.error || data?.message || `An error occurred (${status}). Please try again.`;
        }

        // Log error for debugging (only in development)
        if (import.meta.env.DEV) {
            console.error('API Error:', {
                status,
                message: error.userMessage,
                data: data,
                url: error.config?.url
            });
        }

        return Promise.reject(error);
    }
);

// API cho AI Assistant
export const aiAPI = {
    // Kiểm tra trạng thái AI
    getStatus: async () => {
        const response = await api.get('/ai/status');
        return response.data;
    },

    // Chat với AI
    chat: async (message, conversationHistory = []) => {
        const response = await api.post('/ai/chat', {
            message,
            conversationHistory
        });
        return response.data;
    },

    // Phân tích dữ liệu
    analyze: async (dataType = 'overview') => {
        const response = await api.post('/ai/analyze', {
            dataType
        });
        return response.data;
    }
};

// API cho Custom Chatbot
export const chatbotAPI = {
    // Kiểm tra trạng thái chatbot
    getStatus: async () => {
        const response = await api.get('/chatbot/status');
        return response.data;
    },

    // Chat với custom chatbot
    chat: async (message, conversationHistory = []) => {
        const response = await api.post('/chatbot/chat', {
            message,
            conversationHistory
        });
        return response.data;
    },

    // Lấy danh sách actions có thể thực hiện
    getActions: async () => {
        const response = await api.get('/chatbot/actions');
        return response.data;
    }
};

// API cho Inventory Management
export const inventoryAPI = {
    getStockSummary: async (productId) => {
        const response = await api.get(`/inventory/summary/${productId}`);
        return response.data;
    },
    getCurrentStock: async (productId, warehouseId = null) => {
        const params = warehouseId ? { warehouseId } : {};
        const response = await api.get(`/inventory/stock/${productId}`, { params });
        return response.data;
    },
    getStockHistory: async (filters = {}) => {
        const response = await api.get('/inventory/history', { params: filters });
        return response.data;
    },
    checkLowStock: async (productId, warehouseId = null) => {
        const params = warehouseId ? { warehouseId } : {};
        const response = await api.get(`/inventory/low-stock/${productId}`, { params });
        return response.data;
    },
    adjustStock: async (productId, adjustmentData) => {
        const response = await api.post(`/inventory/adjust/${productId}`, adjustmentData);
        return response.data;
    },
    transferStock: async (transferData) => {
        const response = await api.post('/inventory/transfer', transferData);
        return response.data;
    }
};

// API cho Stock Transfers
export const stockTransferAPI = {
    getAllTransfers: async (filters = {}) => {
        const response = await api.get('/stock-transfers', { params: filters });
        return response.data;
    },
    getTransferById: async (id) => {
        const response = await api.get(`/stock-transfers/${id}`);
        return response.data;
    },
    createTransfer: async (transferData) => {
        const response = await api.post('/stock-transfers', transferData);
        return response.data;
    },
    updateTransfer: async (id, updateData) => {
        const response = await api.put(`/stock-transfers/${id}`, updateData);
        return response.data;
    },
    approveTransfer: async (id) => {
        const response = await api.post(`/stock-transfers/${id}/approve`);
        return response.data;
    },
    cancelTransfer: async (id) => {
        const response = await api.post(`/stock-transfers/${id}/cancel`);
        return response.data;
    }
};

// API cho Low Stock Alerts
export const lowStockAlertAPI = {
    getAllAlerts: async (filters = {}) => {
        const response = await api.get('/low-stock-alerts', { params: filters });
        return response.data;
    },
    getActiveAlerts: async () => {
        const response = await api.get('/low-stock-alerts/active');
        return response.data;
    },
    getAlertHistory: async (filters = {}) => {
        const response = await api.get('/low-stock-alerts/history', { params: filters });
        return response.data;
    },
    getAlertById: async (id) => {
        const response = await api.get(`/low-stock-alerts/${id}`);
        return response.data;
    },
    checkAndCreateAlerts: async (productId = null, warehouseId = null) => {
        const params = {};
        if (productId) params.productId = productId;
        if (warehouseId) params.warehouseId = warehouseId;
        const response = await api.post('/low-stock-alerts/check', null, { params });
        return response.data;
    },
    resolveAlert: async (id, resolvedBy = null) => {
        const response = await api.post(`/low-stock-alerts/${id}/resolve`, { resolvedBy });
        return response.data;
    }
};

// API cho File Uploads
export const fileUploadAPI = {
    uploadImage: async (file, entityType, entityId, uploadType = null) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        if (uploadType) formData.append('uploadType', uploadType);
        
        const response = await api.post('/files/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    uploadMultipleImages: async (files, entityType, entityId, uploadType = null) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        if (uploadType) formData.append('uploadType', uploadType);
        
        const response = await api.post('/files/upload/images', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    uploadFile: async (file, entityType, entityId, uploadType = null) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        if (uploadType) formData.append('uploadType', uploadType);
        
        const response = await api.post('/files/upload/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    getFilesByEntity: async (entityType, entityId) => {
        const response = await api.get(`/files/entity/${entityType}/${entityId}`);
        return response.data;
    },
    getPrimaryFile: async (entityType, entityId) => {
        const response = await api.get(`/files/entity/${entityType}/${entityId}/primary`);
        return response.data;
    },
    getFileById: async (id) => {
        const response = await api.get(`/files/${id}`);
        return response.data;
    },
    setPrimaryFile: async (id, entityType, entityId) => {
        const response = await api.put(`/files/${id}/primary`, { entityType, entityId });
        return response.data;
    },
    deleteFile: async (id) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    }
};

export default api;

