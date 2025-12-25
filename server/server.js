require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

// Auto-init database if enabled (like Java JPA auto-create)
// Only run if database is empty
if (process.env.AUTO_INIT_DB === 'true') {
    const { initDatabase } = require('./scripts/initDatabase');
    // Run async, don't block server start
    initDatabase()
        .then(() => {
            logger.info('✅ Database initialization check completed');
        })
        .catch(err => {
            logger.error('❌ Auto-init database failed', {
                error: err.message,
                stack: err.stack
            });
            // Don't exit, let server start anyway
        });
}

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server for Socket.io
const http = require('http');
const httpServer = http.createServer(app);

// Trust proxy để lấy đúng IP address (cần cho rate limiting)
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:80'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format',
            error: 'Please send valid JSON in request body'
        });
    }
    next(err);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/user-roles', require('./routes/userRoles'));
app.use('/api/product-details', require('./routes/productDetails'));
app.use('/api/order-details', require('./routes/orderDetails'));
app.use('/api/warehouse-management', require('./routes/warehouseManagement'));
app.use('/api/product-management', require('./routes/productManagement'));
app.use('/api/order-warehouses', require('./routes/orderWarehouses'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/export', require('./routes/export'));
app.use('/api/import', require('./routes/import'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin-notifications', require('./routes/adminNotifications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/stock-transfers', require('./routes/stock-transfers'));
app.use('/api/low-stock-alerts', require('./routes/low-stock-alerts'));
app.use('/api/files', require('./routes/files'));

// Serve uploaded files statically
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// Initialize Socket.io
const { initSocketIO } = require('./socket');
const io = initSocketIO(httpServer);
global.io = io; // Make io available globally

app.get('/health', (req, res) => {

    res.json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the API',
        version: '1.0.0',
        endpoint: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            suppliers: '/api/suppliers',
            warehouses: '/api/warehouses',
            roles: '/api/roles',
            userRoles: '/api/user-roles',
            productDetails: '/api/product-details',
            orderDetails: '/api/order-details',
            warehouseManagement: '/api/warehouse-management',
            productManagement: '/api/product-management',
            orderWarehouses: '/api/order-warehouses',
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});

app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

httpServer.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    logger.info(`health check: http://localhost:${port}/health`);
    logger.info(`api base URL: http://localhost:${port}/api`);
    logger.info(`Socket.io initialized`);
}); 