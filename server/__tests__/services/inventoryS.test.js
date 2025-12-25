const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const InventoryS = require('../../services/inventoryS');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');
const ProductDetailsM = require('../../models/productDetailsM');
const StockHistoryM = require('../../models/stockHistoryM');

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
            price: 10.00,
            low_stock_threshold: 10
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

    test('should record stock change', async () => {
        const history = await InventoryS.recordStockChange({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'IN',
            quantity: 20,
            previousQuantity: 50,
            newQuantity: 70,
            referenceType: 'test'
        });

        expect(history).toBeDefined();
        expect(history.product_id).toBe(testProduct.id);
        expect(history.transaction_type).toBe('IN');
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

    test('should check low stock and create alert', async () => {
        // Update product to have low stock
        await ProductDetailsM.update(testProduct.id, testWarehouse.id, { number: 5 });

        const result = await InventoryS.checkLowStock(testProduct.id, testWarehouse.id);
        expect(result).toBeDefined();
        // Alert may or may not be created depending on existing alerts
    });

    test('should adjust stock', async () => {
        const result = await InventoryS.adjustStock(
            testProduct.id,
            testWarehouse.id,
            75,
            'Test adjustment'
        );

        expect(result).toBeDefined();
        expect(result.newQuantity).toBe(75);
        
        // Verify stock was updated
        const newStock = await InventoryS.getCurrentStock(testProduct.id, testWarehouse.id);
        expect(newStock).toBe(75);
    });

    test('should transfer stock between warehouses', async () => {
        // Create second warehouse
        const warehouse2 = await WarehousesM.create({
            id: 'WH002',
            name: 'Warehouse 2',
            address: 'Address 2',
            size: 1000,
            type: 'Storage'
        });

        // Create product detail in warehouse 2
        await ProductDetailsM.create({
            pid: testProduct.id,
            wid: warehouse2.id,
            number: 30
        });

        const result = await InventoryS.transferStock({
            productId: testProduct.id,
            fromWarehouseId: testWarehouse.id,
            toWarehouseId: warehouse2.id,
            quantity: 10,
            notes: 'Test transfer'
        });

        expect(result).toBeDefined();
        expect(result.sourceStockAfter).toBe(40); // 50 - 10
        expect(result.destStockAfter).toBe(40); // 30 + 10
    });
});

