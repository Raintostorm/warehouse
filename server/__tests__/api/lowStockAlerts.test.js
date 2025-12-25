const request = require('supertest');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, testRoles } = require('../helpers/testData');
const UsersM = require('../../models/usersM');
const RolesM = require('../../models/rolesM');
const UserRolesS = require('../../services/userRolesS');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');
const bcrypt = require('bcrypt');
const AuthS = require('../../services/authS');
const createTestApp = require('../helpers/testApp');

const app = createTestApp();

describe('Low Stock Alerts API', () => {
    let adminUser;
    let adminToken;
    let testProduct;

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

        // Create test product with low stock
        testProduct = await ProductsM.create({
            id: 'PROD001',
            name: 'Test Product',
            type: 'Test',
            unit: 'pcs',
            number: 5, // Low stock
            price: 10.00,
            low_stock_threshold: 10
        });

        // Create warehouse and product detail
        const testWarehouse = await WarehousesM.create({
            id: 'WH001',
            name: 'Test Warehouse',
            address: 'Test Address',
            size: 1000,
            type: 'Storage'
        });

        const ProductDetailsM = require('../../models/productDetailsM');
        await ProductDetailsM.create({
            pid: testProduct.id,
            wid: testWarehouse.id,
            number: 5 // Low stock
        });
    });

    test('GET /api/low-stock-alerts - should get all alerts', async () => {
        const response = await request(app)
            .get('/api/low-stock-alerts')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/low-stock-alerts/active - should get active alerts', async () => {
        const response = await request(app)
            .get('/api/low-stock-alerts/active')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/low-stock-alerts/check - should check and create alerts (admin only)', async () => {
        const response = await request(app)
            .post('/api/low-stock-alerts/check')
            .query({ productId: testProduct.id })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
    });

    test('POST /api/low-stock-alerts/:id/resolve - should resolve alert (admin only)', async () => {
        // First create an alert
        const LowStockAlertsM = require('../../models/lowStockAlertsM');
        const alert = await LowStockAlertsM.create({
            productId: testProduct.id,
            currentQuantity: 5,
            threshold: 10,
            alertLevel: 'warning'
        });

        // Resolve the alert
        const response = await request(app)
            .post(`/api/low-stock-alerts/${alert.id}/resolve`)
            .set('Authorization', `Bearer ${adminToken}`);

        if (response.status !== 200) {
            console.log('Response status:', response.status);
            console.log('Response body:', JSON.stringify(response.body, null, 2));
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.is_resolved).toBe(true);
    });
});

