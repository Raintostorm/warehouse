/**
 * Helper to create test Express app with all routes and middleware
 * Similar to server.js but without starting HTTP server
 */

const express = require('express');

function createTestApp() {
    const app = express();

    // Trust proxy
    app.set('trust proxy', 1);

    // CORS (allow all in tests)
    const cors = require('cors');
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // JSON parsing error handler
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

    // Routes
    app.use('/api/auth', require('../../routes/auth'));
    app.use('/api/users', require('../../routes/users'));
    app.use('/api/products', require('../../routes/products'));
    app.use('/api/orders', require('../../routes/orders'));
    app.use('/api/suppliers', require('../../routes/suppliers'));
    app.use('/api/warehouses', require('../../routes/warehouses'));
    app.use('/api/roles', require('../../routes/roles'));
    app.use('/api/inventory', require('../../routes/inventory'));
    app.use('/api/stock-transfers', require('../../routes/stock-transfers'));
    app.use('/api/low-stock-alerts', require('../../routes/low-stock-alerts'));
    app.use('/api/files', require('../../routes/files'));
    app.use('/api/statistics', require('../../routes/statistics'));

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found',
            path: req.originalUrl
        });
    });

    // Error handler
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || err.status || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'test' && { stack: err.stack })
        });
    });

    return app;
}

module.exports = createTestApp;
