require('dotenv').config();
const { Pool } = require('pg');
const logger = require('./utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX) || 20, // Max connections
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000, // 30 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 2000, // 2 seconds
});

// Handle pool errors
pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', { 
        error: err.message, 
        stack: err.stack,
        code: err.code 
    });
    // Don't exit the process, just log the error
});

// Handle pool connection events
pool.on('connect', () => {
    // Connection established
});

pool.on('remove', () => {
    // Connection removed from pool
});

/**
 * Execute a callback within a database transaction
 * @param {Function} callback - Async function that receives a client and performs operations
 * @returns {Promise} Result of the callback
 */
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    withTransaction,
};