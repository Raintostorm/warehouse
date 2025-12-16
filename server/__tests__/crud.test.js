/**
 * Comprehensive CRUD Test Suite
 * Tests all CRUD operations for main entities
 */

const UsersM = require('../models/usersM');
const ProductsM = require('../models/productsM');
const OrdersM = require('../models/ordersM');
const SuppliersM = require('../models/suppliersM');
const WarehousesM = require('../models/warehousesM');
const RolesM = require('../models/rolesM');

const { cleanDatabase, initTestDatabase, closeDatabase } = require('./helpers/testDb');
const {
    testUsers,
    testProducts,
    testOrders,
    testSuppliers,
    testWarehouses,
    testRoles,
    generateId
} = require('./helpers/testData');

describe('Comprehensive CRUD Test Suite', () => {
    beforeAll(async () => {
        await initTestDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await closeDatabase();
    });

    describe('Users CRUD', () => {
        test('Complete CRUD cycle for Users', async () => {
            // CREATE
            const userData = testUsers.create();
            const createdUser = await UsersM.create(userData);
            expect(createdUser.id).toBe(userData.id);

            // READ
            const foundUser = await UsersM.findById(createdUser.id);
            expect(foundUser).toBeDefined();
            expect(foundUser.email).toBe(userData.email);

            // UPDATE
            const updateData = { fullname: 'Updated Name' };
            const updatedUser = await UsersM.update(createdUser.id, updateData);
            // Handle both snake_case and PascalCase
            const fullname = updatedUser?.fullname || updatedUser?.Fullname;
            expect(fullname).toBe('Updated Name');

            // DELETE
            const deletedUser = await UsersM.delete(createdUser.id);
            expect(deletedUser.id).toBe(createdUser.id);

            // Verify deletion
            const deletedCheck = await UsersM.findById(createdUser.id);
            expect(deletedCheck).toBeUndefined();
        });
    });

    describe('Suppliers CRUD', () => {
        test('Complete CRUD cycle for Suppliers', async () => {
            // CREATE
            const supplierData = testSuppliers.create();
            const createdSupplier = await SuppliersM.create(supplierData);
            expect(createdSupplier.id).toBe(supplierData.id);

            // READ
            const foundSupplier = await SuppliersM.findById(createdSupplier.id);
            expect(foundSupplier).toBeDefined();

            // UPDATE
            const updateData = { name: 'Updated Supplier' };
            const updatedSupplier = await SuppliersM.update(createdSupplier.id, updateData);
            expect(updatedSupplier.name).toBe('Updated Supplier');

            // DELETE
            const deletedSupplier = await SuppliersM.delete(createdSupplier.id);
            expect(deletedSupplier.id).toBe(createdSupplier.id);
        });
    });

    describe('Products CRUD', () => {
        test('Complete CRUD cycle for Products', async () => {
            // Setup: Create supplier first
            const supplierData = testSuppliers.create();
            const supplier = await SuppliersM.create(supplierData);

            // CREATE
            const productData = testProducts.create(supplier.id);
            const createdProduct = await ProductsM.create(productData);
            expect(createdProduct.id).toBe(productData.id);

            // READ
            const foundProduct = await ProductsM.findById(createdProduct.id);
            expect(foundProduct).toBeDefined();

            // UPDATE
            const updateData = { name: 'Updated Product', price: 99.99 };
            const updatedProduct = await ProductsM.update(createdProduct.id, updateData);
            // Handle both snake_case and PascalCase
            const productName = updatedProduct?.name || updatedProduct?.Name;
            expect(productName).toBe('Updated Product');

            // DELETE
            const deletedProduct = await ProductsM.delete(createdProduct.id);
            expect(deletedProduct.id).toBe(createdProduct.id);
        });
    });

    describe('Warehouses CRUD', () => {
        test('Complete CRUD cycle for Warehouses', async () => {
            // CREATE
            const warehouseData = testWarehouses.create();
            const createdWarehouse = await WarehousesM.create(warehouseData);
            expect(createdWarehouse.id).toBe(warehouseData.id);

            // READ
            const foundWarehouse = await WarehousesM.findById(createdWarehouse.id);
            expect(foundWarehouse).toBeDefined();

            // UPDATE
            const updateData = { name: 'Updated Warehouse' };
            const updatedWarehouse = await WarehousesM.update(createdWarehouse.id, updateData);
            expect(updatedWarehouse.name).toBe('Updated Warehouse');

            // DELETE
            const deletedWarehouse = await WarehousesM.delete(createdWarehouse.id);
            expect(deletedWarehouse.id).toBe(createdWarehouse.id);
        });
    });

    describe('Orders CRUD', () => {
        test('Complete CRUD cycle for Orders', async () => {
            // Setup: Create user first
            const userData = testUsers.create();
            const user = await UsersM.create(userData);

            // CREATE
            const orderData = testOrders.create(user.id);
            const createdOrder = await OrdersM.create(orderData);
            expect(createdOrder.id).toBe(orderData.id);

            // READ
            const foundOrder = await OrdersM.findById(createdOrder.id);
            expect(foundOrder).toBeDefined();

            // UPDATE
            const updateData = { customerName: 'Updated Customer', total: 2000.00 };
            const updatedOrder = await OrdersM.update(createdOrder.id, updateData);
            expect(updatedOrder.customer_name || updatedOrder.customerName).toBe('Updated Customer');

            // DELETE
            const deletedOrder = await OrdersM.delete(createdOrder.id);
            expect(deletedOrder.id).toBe(createdOrder.id);
        });
    });

    describe('Roles CRUD', () => {
        test('Complete CRUD cycle for Roles', async () => {
            // CREATE
            const roleData = testRoles.create();
            const createdRole = await RolesM.create(roleData);
            expect(createdRole.id).toBe(roleData.id);

            // READ
            const foundRole = await RolesM.findById(createdRole.id);
            expect(foundRole).toBeDefined();

            // UPDATE
            const updateData = { name: 'Updated Role' };
            const updatedRole = await RolesM.update(createdRole.id, updateData);
            expect(updatedRole.name).toBe('Updated Role');

            // DELETE
            const deletedRole = await RolesM.delete(createdRole.id);
            expect(deletedRole.id).toBe(createdRole.id);
        });
    });

    describe('Integration Tests', () => {
        test('Create order with product and user dependencies', async () => {
            // Create dependencies
            const user = await UsersM.create(testUsers.create());
            const supplier = await SuppliersM.create(testSuppliers.create());
            const product = await ProductsM.create(testProducts.create(supplier.id));
            const warehouse = await WarehousesM.create(testWarehouses.create());

            // Create order
            const order = await OrdersM.create(testOrders.create(user.id));
            expect(order).toBeDefined();
            // Check all possible field name variations (snake_case, camelCase, PascalCase)
            // Database schema uses PascalCase (UId) but model may return snake_case (user_id)
            const userId = order.user_id || order.userId || order.UId || order.u_id || order.uid || order['UId'];
            expect(userId).toBe(user.id);

            // Verify all entities exist
            const foundUser = await UsersM.findById(user.id);
            const foundProduct = await ProductsM.findById(product.id);
            const foundOrder = await OrdersM.findById(order.id);

            expect(foundUser).toBeDefined();
            expect(foundProduct).toBeDefined();
            expect(foundOrder).toBeDefined();
        });

        test('Bulk operations work correctly', async () => {
            // Create multiple users
            const users = [];
            for (let i = 0; i < 5; i++) {
                const user = await UsersM.create(testUsers.create());
                users.push(user);
            }

            // Verify all created
            const allUsers = await UsersM.findAll();
            expect(allUsers.length).toBeGreaterThanOrEqual(5);

            // Bulk delete
            const idsToDelete = users.slice(0, 3).map(u => u.id);
            const deleted = await UsersM.bulkDelete(idsToDelete);
            expect(deleted.length).toBe(3);

            // Verify remaining users
            const remainingUsers = await UsersM.findAll();
            expect(remainingUsers.length).toBeGreaterThanOrEqual(2);
        });
    });
});
