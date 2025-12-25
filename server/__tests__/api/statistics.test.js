const request = require('supertest');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, testRoles } = require('../helpers/testData');
const UsersM = require('../../models/usersM');
const RolesM = require('../../models/rolesM');
const UserRolesS = require('../../services/userRolesS');
const ProductsM = require('../../models/productsM');
const OrdersM = require('../../models/ordersM');
const OrderDetailsM = require('../../models/orderDetailsM');
const bcrypt = require('bcrypt');
const AuthS = require('../../services/authS');
const createTestApp = require('../helpers/testApp');

const app = createTestApp();

describe('Statistics/Analytics API', () => {
    let adminUser;
    let adminToken;

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
    });

    test('GET /api/statistics/dashboard - should get dashboard stats', async () => {
        const response = await request(app)
            .get('/api/statistics/dashboard')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
    });

    test('GET /api/statistics/sales-trends - should get sales trends', async () => {
        const response = await request(app)
            .get('/api/statistics/sales-trends')
            .query({ period: 'month', days: 30 })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/statistics/product-performance - should get product performance', async () => {
        const response = await request(app)
            .get('/api/statistics/product-performance')
            .query({ limit: 10, sortBy: 'revenue' })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/statistics/warehouse-utilization - should get warehouse utilization', async () => {
        const response = await request(app)
            .get('/api/statistics/warehouse-utilization')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/statistics/revenue-by-period - should get revenue by period', async () => {
        const response = await request(app)
            .get('/api/statistics/revenue-by-period')
            .query({ period: 'month' })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/statistics/inventory-turnover - should get inventory turnover', async () => {
        const response = await request(app)
            .get('/api/statistics/inventory-turnover')
            .query({ days: 30 })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/statistics/customer-analytics - should get customer analytics', async () => {
        const response = await request(app)
            .get('/api/statistics/customer-analytics')
            .query({ days: 30 })
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/statistics/supplier-analytics - should get supplier analytics', async () => {
        const response = await request(app)
            .get('/api/statistics/supplier-analytics')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
});

