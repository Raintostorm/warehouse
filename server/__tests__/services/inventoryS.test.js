const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const InventoryS = require('../../services/inventoryS');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');
const ProductDetailsM = require('../../models/productDetailsM');

describe('Inventory Service', () => {
    let testProduct;
    let testWarehouse;

    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();

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

    afterAll(async () => {
        await cleanDatabase();
    });

    test('should get current stock', async () => {
        const stock = await InventoryS.getCurrentStock(testProduct.id, testWarehouse.id);
        expect(stock).toBe(50);
    });

    test('should get stock summary', async () => {
        const summary = await InventoryS.getStockSummary(testProduct.id);
        expect(summary).toBeDefined();
        expect(summary.productId).toBe(testProduct.id);
        expect(summary.totalStock).toBeGreaterThanOrEqual(0);
    });
});

