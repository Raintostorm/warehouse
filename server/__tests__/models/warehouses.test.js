const WarehousesM = require('../../models/warehousesM');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testWarehouses, generateId } = require('../helpers/testData');

describe('Warehouses Model CRUD Operations', () => {
    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('CREATE', () => {
        test('should create a new warehouse', async () => {
            const warehouseData = testWarehouses.create();
            const warehouse = await WarehousesM.create(warehouseData);

            expect(warehouse).toBeDefined();
            expect(warehouse.id).toBe(warehouseData.id);
            expect(warehouse.name).toBe(warehouseData.name);
        });
    });

    describe('READ', () => {
        test('should find all warehouses', async () => {
            const warehouse1 = testWarehouses.create();
            const warehouse2 = testWarehouses.create();
            await WarehousesM.create(warehouse1);
            await WarehousesM.create(warehouse2);

            const warehouses = await WarehousesM.findAll();

            expect(Array.isArray(warehouses)).toBe(true);
            expect(warehouses.length).toBeGreaterThanOrEqual(2);
        });

        test('should find warehouse by id', async () => {
            const warehouseData = testWarehouses.create();
            const createdWarehouse = await WarehousesM.create(warehouseData);

            const foundWarehouse = await WarehousesM.findById(createdWarehouse.id);

            expect(foundWarehouse).toBeDefined();
            expect(foundWarehouse.id).toBe(createdWarehouse.id);
        });
    });

    describe('UPDATE', () => {
        test('should update warehouse', async () => {
            const warehouseData = testWarehouses.create();
            const createdWarehouse = await WarehousesM.create(warehouseData);

            const updateData = testWarehouses.update();
            const updatedWarehouse = await WarehousesM.update(createdWarehouse.id, updateData);

            expect(updatedWarehouse).toBeDefined();
            expect(updatedWarehouse.name).toBe(updateData.name);
        });
    });

    describe('DELETE', () => {
        test('should delete warehouse', async () => {
            const warehouseData = testWarehouses.create();
            const createdWarehouse = await WarehousesM.create(warehouseData);

            const deletedWarehouse = await WarehousesM.delete(createdWarehouse.id);

            expect(deletedWarehouse).toBeDefined();
            expect(deletedWarehouse.id).toBe(createdWarehouse.id);
        });
    });
});
