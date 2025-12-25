const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const StockHistoryM = require('../../models/stockHistoryM');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');

describe('StockHistory Model', () => {
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
    });

    afterAll(async () => {
        await cleanDatabase();
    });

    test('should create stock history record', async () => {
        const history = await StockHistoryM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'IN',
            quantity: 50,
            previousQuantity: 100,
            newQuantity: 150,
            notes: 'Test stock in'
        });

        expect(history).toBeDefined();
        expect(history.product_id).toBe(testProduct.id);
        expect(history.warehouse_id).toBe(testWarehouse.id);
        expect(history.transaction_type).toBe('IN');
        expect(history.quantity).toBe(50);
    });

    test('should find stock history by product ID', async () => {
        await StockHistoryM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'IN',
            quantity: 50,
            previousQuantity: 100,
            newQuantity: 150
        });

        const history = await StockHistoryM.findByProductId(testProduct.id);
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].product_id).toBe(testProduct.id);
    });

    test('should find stock history by warehouse ID', async () => {
        await StockHistoryM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'IN',
            quantity: 50,
            previousQuantity: 100,
            newQuantity: 150
        });

        const history = await StockHistoryM.findByWarehouseId(testWarehouse.id);
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].warehouse_id).toBe(testWarehouse.id);
    });

    test('should filter stock history by transaction type', async () => {
        await StockHistoryM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'IN',
            quantity: 50,
            previousQuantity: 100,
            newQuantity: 150
        });

        await StockHistoryM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'OUT',
            quantity: -20,
            previousQuantity: 150,
            newQuantity: 130
        });

        const inHistory = await StockHistoryM.findAll({ transactionType: 'IN' });
        expect(inHistory.length).toBeGreaterThan(0);
        expect(inHistory.every(h => h.transaction_type === 'IN')).toBe(true);
    });

    test('should count stock history records', async () => {
        await StockHistoryM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            transactionType: 'IN',
            quantity: 50,
            previousQuantity: 100,
            newQuantity: 150
        });

        const count = await StockHistoryM.count({ productId: testProduct.id });
        expect(count).toBeGreaterThan(0);
    });
});

