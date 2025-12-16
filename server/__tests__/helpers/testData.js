/**
 * Test data generators
 * IDs must match database schema:
 * - Most entities: VARCHAR(10)
 * - Orders: VARCHAR(15)
 */

let idCounter = 0;

const generateId = (prefix = 'T', maxLength = 10) => {
    // Format: Prefix (1 char) + digits (maxLength - 1 chars)
    // Use counter + random to ensure uniqueness
    idCounter++;
    const random = Math.floor(Math.random() * 1000000);
    const unique = (idCounter * 1000000 + random) % Math.pow(10, maxLength - 1);
    const digits = unique.toString().padStart(maxLength - 1, '0');
    const id = `${prefix}${digits}`.substring(0, maxLength);
    return id;
};

const testUsers = {
    create: () => {
        // Generate unique email with timestamp + random to avoid duplicates
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return {
            id: generateId('U', 10),
            fullname: 'Test User',
            email: `test_${timestamp}_${random}@example.com`,
            number: `0123456789`,
            address: '123 Test Street',
            password: 'hashed_password_here', // In real test, hash this
            actor: 'test'
        };
    },
    update: () => ({
        fullname: 'Updated Test User',
        address: '456 Updated Street'
    })
};

const testRoles = {
    create: () => ({
        id: generateId('R', 10),
        name: 'TestRole'
    })
};

const testSuppliers = {
    create: () => ({
        id: generateId('S', 10),
        name: 'Test Supplier',
        address: '123 Supplier Street',
        number: '0987654321',
        actor: 'test'
    }),
    update: () => ({
        name: 'Updated Supplier',
        address: '456 Updated Supplier Street'
    })
};

const testProducts = {
    create: (supplierId) => ({
        id: generateId('P', 10),
        name: 'Test Product',
        type: 'Type A',
        unit: 'kg',
        number: 100,
        price: 50.00,
        supplierId: supplierId || generateId('S', 10),
        actor: 'test'
    }),
    update: () => ({
        name: 'Updated Product',
        price: 75.00,
        number: 150
    })
};

const testWarehouses = {
    create: () => ({
        id: generateId('W', 10),
        name: 'Test Warehouse',
        address: '123 Warehouse Street',
        type: 'Storage',
        actor: 'test'
    }),
    update: () => ({
        name: 'Updated Warehouse',
        address: '456 Updated Warehouse Street'
    })
};

const testOrders = {
    create: (userId) => ({
        id: generateId('O', 15), // Orders can be up to 15 chars
        type: 'Import',
        date: new Date().toISOString().split('T')[0],
        userId: userId || generateId('U', 10), // Will be mapped to user_id or UId in model
        user_id: userId || generateId('U', 10), // Also provide snake_case version
        customerName: 'Test Customer',
        total: 1000.00,
        actor: 'test'
    }),
    update: () => ({
        customerName: 'Updated Customer',
        total: 1500.00
    })
};

module.exports = {
    generateId,
    testUsers,
    testRoles,
    testSuppliers,
    testProducts,
    testWarehouses,
    testOrders
};
