const OrdersM = require('../../models/ordersM');
const UsersM = require('../../models/usersM');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testOrders, testUsers, generateId } = require('../helpers/testData');

describe('Orders Model CRUD Operations', () => {
    let testUser;

    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();
        // Create a user for orders
        const userData = testUsers.create();
        testUser = await UsersM.create(userData);
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('CREATE', () => {
        test('should create a new order', async () => {
            const orderData = testOrders.create(testUser.id);
            const order = await OrdersM.create(orderData);

            expect(order).toBeDefined();
            expect(order.id).toBe(orderData.id);
            expect(order.customer_name || order.customerName).toBe(orderData.customerName);
            expect(parseFloat(order.total)).toBe(orderData.total);
        });

        test('should create order with minimal fields (database allows NULL)', async () => {
            // Database schema allows NULL for most fields, so this will succeed
            const minimalOrder = {
                id: generateId('O', 15),
                type: 'Import',
                actor: 'test'
            };

            const order = await OrdersM.create(minimalOrder);
            expect(order).toBeDefined();
            expect(order.id).toBe(minimalOrder.id);
            expect(order.type).toBe(minimalOrder.type);
        });
    });

    describe('READ', () => {
        test('should find all orders', async () => {
            const order1 = testOrders.create(testUser.id);
            const order2 = testOrders.create(testUser.id);
            await OrdersM.create(order1);
            await OrdersM.create(order2);

            const orders = await OrdersM.findAll();

            expect(Array.isArray(orders)).toBe(true);
            expect(orders.length).toBeGreaterThanOrEqual(2);
        });

        test('should find order by id', async () => {
            const orderData = testOrders.create(testUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const foundOrder = await OrdersM.findById(createdOrder.id);

            expect(foundOrder).toBeDefined();
            expect(foundOrder.id).toBe(createdOrder.id);
        });

        test('should return undefined for non-existent order', async () => {
            const foundOrder = await OrdersM.findById('NON_EXISTENT_ID');
            expect(foundOrder).toBeUndefined();
        });
    });

    describe('UPDATE', () => {
        test('should update order', async () => {
            const orderData = testOrders.create(testUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const updateData = testOrders.update();
            const updatedOrder = await OrdersM.update(createdOrder.id, updateData);

            expect(updatedOrder).toBeDefined();
            expect(updatedOrder.customer_name || updatedOrder.customerName).toBe(updateData.customerName);
            expect(parseFloat(updatedOrder.total)).toBe(updateData.total);
        });

        test('should throw error if no updates provided', async () => {
            const orderData = testOrders.create(testUser.id);
            const createdOrder = await OrdersM.create(orderData);

            await expect(OrdersM.update(createdOrder.id, {})).rejects.toThrow('No updates provided');
        });
    });

    describe('DELETE', () => {
        test('should delete order', async () => {
            const orderData = testOrders.create(testUser.id);
            const createdOrder = await OrdersM.create(orderData);

            const deletedOrder = await OrdersM.delete(createdOrder.id);

            expect(deletedOrder).toBeDefined();
            expect(deletedOrder.id).toBe(createdOrder.id);

            // Verify order is deleted
            const foundOrder = await OrdersM.findById(createdOrder.id);
            expect(foundOrder).toBeUndefined();
        });
    });
});
