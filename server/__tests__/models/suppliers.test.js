const SuppliersM = require('../../models/suppliersM');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testSuppliers, generateId } = require('../helpers/testData');

describe('Suppliers Model CRUD Operations', () => {
    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('CREATE', () => {
        test('should create a new supplier', async () => {
            const supplierData = testSuppliers.create();
            const supplier = await SuppliersM.create(supplierData);

            expect(supplier).toBeDefined();
            expect(supplier.id).toBe(supplierData.id);
            expect(supplier.name).toBe(supplierData.name);
        });
    });

    describe('READ', () => {
        test('should find all suppliers', async () => {
            const supplier1 = testSuppliers.create();
            const supplier2 = testSuppliers.create();
            await SuppliersM.create(supplier1);
            await SuppliersM.create(supplier2);

            const suppliers = await SuppliersM.findAll();

            expect(Array.isArray(suppliers)).toBe(true);
            expect(suppliers.length).toBeGreaterThanOrEqual(2);
        });

        test('should find supplier by id', async () => {
            const supplierData = testSuppliers.create();
            const createdSupplier = await SuppliersM.create(supplierData);

            const foundSupplier = await SuppliersM.findById(createdSupplier.id);

            expect(foundSupplier).toBeDefined();
            expect(foundSupplier.id).toBe(createdSupplier.id);
        });
    });

    describe('UPDATE', () => {
        test('should update supplier', async () => {
            const supplierData = testSuppliers.create();
            const createdSupplier = await SuppliersM.create(supplierData);

            const updateData = testSuppliers.update();
            const updatedSupplier = await SuppliersM.update(createdSupplier.id, updateData);

            expect(updatedSupplier).toBeDefined();
            expect(updatedSupplier.name).toBe(updateData.name);
        });
    });

    describe('DELETE', () => {
        test('should delete supplier', async () => {
            const supplierData = testSuppliers.create();
            const createdSupplier = await SuppliersM.create(supplierData);

            const deletedSupplier = await SuppliersM.delete(createdSupplier.id);

            expect(deletedSupplier).toBeDefined();
            expect(deletedSupplier.id).toBe(createdSupplier.id);
        });
    });
});
