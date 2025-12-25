const request = require('supertest');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, testRoles } = require('../helpers/testData');
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

describe('Stock Transfers API', () => {
    let adminUser;
    let adminToken;
    let testProduct;
    let testWarehouse1;
    let testWarehouse2;

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

        // Create test warehouses
        testWarehouse1 = await WarehousesM.create({
            id: 'WH001',
            name: 'Warehouse 1',
            address: 'Address 1',
            size: 1000,
            type: 'Storage'
        });

        testWarehouse2 = await WarehousesM.create({
            id: 'WH002',
            name: 'Warehouse 2',
            address: 'Address 2',
            size: 1000,
            type: 'Storage'
        });

        // Create product details
        await ProductDetailsM.create({
            pid: testProduct.id,
            wid: testWarehouse1.id,
            number: 50
        });

        await ProductDetailsM.create({
            pid: testProduct.id,
            wid: testWarehouse2.id,
            number: 30
        });
    });

    test('GET /api/stock-transfers - should get all transfers', async () => {
        const response = await request(app)
            .get('/api/stock-transfers')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/stock-transfers - should create transfer (admin only)', async () => {
        const response = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                productId: testProduct.id,
                fromWarehouseId: testWarehouse1.id,
                toWarehouseId: testWarehouse2.id,
                quantity: 10,
                notes: 'Test transfer'
            })
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.product_id).toBe(testProduct.id);
        expect(response.body.data.status).toBe('pending');
    });

    test('POST /api/stock-transfers/:id/approve - should approve transfer (admin only)', async () => {
        // First create a transfer
        const createResponse = await request(app)
            .post('/api/stock-transfers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                productId: testProduct.id,
                fromWarehouseId: testWarehouse1.id,
                toWarehouseId: testWarehouse2.id,
                quantity: 10,
                notes: 'Test transfer'
            });

        const transferId = createResponse.body.data.id;

        // Approve the transfer
        const response = await request(app)
            .post(`/api/stock-transfers/${transferId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('completed');
    });
});

