const request = require('supertest');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, testRoles, generateId } = require('../helpers/testData');
const UsersM = require('../../models/usersM');
const RolesM = require('../../models/rolesM');
const UserRolesS = require('../../services/userRolesS');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');
const ProductDetailsM = require('../../models/productDetailsM');
const bcrypt = require('bcrypt');
const AuthS = require('../../services/authS');
const createTestApp = require('../helpers/testApp');

const app = createTestApp();

describe('Inventory API', () => {
    let adminUser;
    let adminToken;
    let testProduct;
    let testWarehouse;

    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();

        // Create admin role
        const roleData = testRoles.create();
        roleData.name = 'Admin';
        const adminRole = await RolesM.create(roleData);

        // Create admin user
        const adminData = testUsers.create();
        adminData.password = await bcrypt.hash('AdminPass123', 10);
        adminUser = await UsersM.create(adminData);
        await UserRolesS.assignRoleToUser(adminUser.id, adminRole.id);

        // Get admin token
        const loginResult = await AuthS.login(adminData.email, 'AdminPass123');
        adminToken = loginResult.token;

        // Create test product
        testProduct = await ProductsM.create({
            id: 'PROD001',
            name: 'Test Product',
            type: 'Test',
            unit: 'pcs',
            number: 100,
            price: 10.00
        });

        // Create test warehouse
        testWarehouse = await WarehousesM.create({
            id: 'WH001',
            name: 'Test Warehouse',
            address: 'Test Address',
            size: 1000,
            type: 'Storage'
        });

        // Create product detail
        await ProductDetailsM.create({
            pid: testProduct.id,
            wid: testWarehouse.id,
            number: 50
        });
    });

    test('GET /api/inventory/stock/:productId - should get current stock', async () => {
        const response = await request(app)
            .get(`/api/inventory/stock/${testProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.productId).toBe(testProduct.id);
    });

    test('GET /api/inventory/summary/:productId - should get stock summary', async () => {
        const response = await request(app)
            .get(`/api/inventory/summary/${testProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.productId).toBe(testProduct.id);
    });

    test('GET /api/inventory/history - should get stock history', async () => {
        const response = await request(app)
            .get('/api/inventory/history')
            .query({ productId: testProduct.id })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/inventory/adjust/:productId - should adjust stock (admin only)', async () => {
        const response = await request(app)
            .post(`/api/inventory/adjust/${testProduct.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                warehouseId: testWarehouse.id,
                newQuantity: 75,
                notes: 'Test adjustment'
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.newQuantity).toBe(75);
    });

    test('POST /api/inventory/transfer - should transfer stock (admin only)', async () => {
        // Create second warehouse
        const warehouse2 = await WarehousesM.create({
            id: 'WH002',
            name: 'Warehouse 2',
            address: 'Address 2',
            size: 1000,
            type: 'Storage'
        });

        await ProductDetailsM.create({
            pid: testProduct.id,
            wid: warehouse2.id,
            number: 30
        });

        const response = await request(app)
            .post('/api/inventory/transfer')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                productId: testProduct.id,
                fromWarehouseId: testWarehouse.id,
                toWarehouseId: warehouse2.id,
                quantity: 10,
                notes: 'Test transfer'
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
    });
});

