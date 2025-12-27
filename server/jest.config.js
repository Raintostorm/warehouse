module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/__tests__/**',
        '!**/scripts/**',
        '!jest.config.js',
        '!server.js'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 30000, // Increased timeout for database operations
    maxWorkers: 1, // Run tests serially to avoid database deadlocks
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    forceExit: true, // Force Jest to exit after tests complete
    detectOpenHandles: true // Detect open handles to help debug
};
