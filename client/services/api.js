import axios from 'axios';

// Tạo instance axios với base URL
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
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
    generateBill: async (orderId, productIds = null) => {
        const response = await api.post(`/orders/${orderId}/generate-bill`,
            { productIds },
            { responseType: 'blob' }
        );
        return response;
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

// API cho Statistics
export const statisticsAPI = {
    getDashboardStats: async () => {
        const response = await api.get('/statistics/dashboard');
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

export default api;

