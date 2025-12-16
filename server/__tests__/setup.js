// Load environment variables
// Try .env.test first, then fallback to .env
require('dotenv').config({ path: '.env.test' });
require('dotenv').config(); // This will override with .env if .env.test doesn't exist

// Setup test database connection
process.env.NODE_ENV = 'test';

// Use test database URL if provided, otherwise use main database URL
// Format: postgresql://user:password@host:port/database
const getTestDatabaseUrl = () => {
    if (process.env.TEST_DATABASE_URL) {
        return process.env.TEST_DATABASE_URL;
    }

    // If DATABASE_URL exists, use it (tests will use same database)
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    // Default fallback
    return 'postgresql://postgres:postgres@localhost:5432/uh_db';
};

process.env.DATABASE_URL = getTestDatabaseUrl();

// Set JWT_SECRET for tests (required for auth tests)
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

// Set JWT_EXPIRES_IN for tests
if (!process.env.JWT_EXPIRES_IN) {
    process.env.JWT_EXPIRES_IN = '24h';
}

// Increase database pool size for tests to avoid connection exhaustion
if (!process.env.DB_POOL_MAX) {
    process.env.DB_POOL_MAX = '50'; // Increase pool size for tests
}
if (!process.env.DB_POOL_IDLE_TIMEOUT) {
    process.env.DB_POOL_IDLE_TIMEOUT = '10000'; // 10 seconds for tests
}
if (!process.env.DB_POOL_CONNECTION_TIMEOUT) {
    process.env.DB_POOL_CONNECTION_TIMEOUT = '5000'; // 5 seconds for tests
}

// Mock Redis để tránh cần Redis khi test
// Rate limiter sẽ tự động fallback về memory store khi Redis không available
jest.mock('../utils/redis', () => {
    // Return undefined/null để rateLimiter fallback về memory store
    // Hoặc return mock object nhưng không có ping function để trigger fallback
    return null; // This will cause rateLimiter to use memory store
});

// Mock audit logger để tránh audit_logs table errors
jest.mock('../utils/auditLogger', () => {
    return jest.fn().mockResolvedValue(undefined);
});

// Suppress console logs during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}
