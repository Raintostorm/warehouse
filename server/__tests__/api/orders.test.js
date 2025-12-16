const request = require('supertest');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testUsers, testOrders, testProducts, testSuppliers, generateId } = require('../helpers/testData');
const UsersM = require('../../models/usersM');
const OrdersM = require('../../models/ordersM');
const ProductsM = require('../../models/productsM');
const SuppliersM = require('../../models/suppliersM');
const bcrypt = require('bcrypt');
const AuthS = require('../../services/authS');
const createTestApp = require('../helpers/testApp');

// Create test app
const app = createTestApp();

describe('Orders API', () => {
    let adminUser;
    let regularUser;
    let adminToken;
    let regularToken;
    let testSupplier;
    let testProduct;
    let adminRole;

    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();

        // Create supplier and product
        testSupplier = await SuppliersM.create(testSuppliers.create());
        testProduct = await ProductsM.create(testProducts.create(testSupplier.id));

        // Create admin role
        const RolesM = require('../../models/rolesM');
        const UserRolesS = require('../../services/userRolesS');
        adminRole = await RolesM.create({ id: generateId('R', 10), name: 'Admin' });

        // Create users
        const adminData = testUsers.create();
        adminData.password = await bcrypt.hash('AdminPass123', 10);
        adminUser = await UsersM.create(adminData);
        await UserRolesS.assignRoleToUser(adminUser.id, adminRole.id);

        const regularData = testUsers.create();
        regularData.password = await bcrypt.hash('UserPass123', 10);
        regularUser = await UsersM.create(regularData);

        // Verify users exist and get tokens
        // Retry mechanism for database commit
        let verifyAdminUser, verifyRegularUser;
        let retries = 0;
        const maxRetries = 5;

        while (retries < maxRetries) {
            verifyAdminUser = await UsersM.findById(adminUser.id);
            verifyRegularUser = await UsersM.findById(regularUser.id);

            if (verifyAdminUser && verifyRegularUser) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (!verifyAdminUser) {
            verifyAdminUser = await UsersM.findByEmail(adminData.email);
        }
        if (!verifyRegularUser) {
            verifyRegularUser = await UsersM.findByEmail(regularData.email);
        }

        // Use email from database
        const adminEmail = verifyAdminUser?.email || verifyAdminUser?.Email || adminData.email;
        const regularEmail = verifyRegularUser?.email || verifyRegularUser?.Email || regularData.email;

        // Get tokens
        const adminLogin = await AuthS.login(adminEmail, 'AdminPass123');
        adminToken = adminLogin.token;

        const regularLogin = await AuthS.login(regularEmail, 'UserPass123');
        regularToken = regularLogin.token;
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/orders', () => {
        test('should require authentication', async () => {
            const res = await request(app)
                .get('/api/orders')
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        test('should return orders list', async () => {
            const order1 = testOrders.create(regularUser.id);
            const order2 = testOrders.create(regularUser.id);
            await OrdersM.create(order1);
            await OrdersM.create(order2);

            const res = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('GET /api/orders/:id', () => {
        test('should return order by id', async () => {
            const orderData = testOrders.create(regularUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const res = await request(app)
                .get(`/api/orders/${createdOrder.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(createdOrder.id);
        });

        test('should return 404 for non-existent order', async () => {
            const res = await request(app)
                .get('/api/orders/NON_EXISTENT')
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(404);

            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/orders', () => {
        test('should require authentication', async () => {
            const orderData = testOrders.create(regularUser.id);

            const res = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        test('should require admin role to create order', async () => {
            const orderData = testOrders.create(regularUser.id);

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${regularToken}`)
                .send(orderData)
                .expect(403);

            expect(res.body.success).toBe(false);
        });

        test('should create order with admin role', async () => {
            const orderData = testOrders.create(regularUser.id);

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(orderData)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(orderData.id);
        });
    });

    describe('PUT /api/orders/:id', () => {
        test('should require admin role to update order', async () => {
            const orderData = testOrders.create(regularUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const updateData = {
                customerName: 'Updated Customer',
                total: 2000.00
            };

            const res = await request(app)
                .put(`/api/orders/${createdOrder.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send(updateData)
                .expect(403);

            expect(res.body.success).toBe(false);
        });

        test('should update order with admin role', async () => {
            const orderData = testOrders.create(regularUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const updateData = {
                customerName: 'Updated Customer',
                total: 2000.00
            };

            const res = await request(app)
                .put(`/api/orders/${createdOrder.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });

    describe('DELETE /api/orders/:id', () => {
        test('should require admin role to delete order', async () => {
            const orderData = testOrders.create(regularUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const res = await request(app)
                .delete(`/api/orders/${createdOrder.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(403);

            expect(res.body.success).toBe(false);
        });

        test('should delete order with admin role', async () => {
            const orderData = testOrders.create(regularUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const res = await request(app)
                .delete(`/api/orders/${createdOrder.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });
});
