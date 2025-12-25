const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const StockTransfersM = require('../../models/stockTransfersM');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');

describe('StockTransfers Model', () => {
    let testProduct;
    let testWarehouse1;
    let testWarehouse2;

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

        // Create test warehouses
        testWarehouse1 = await WarehousesM.create({
            id: 'WH001',
            name: 'Warehouse 1',
            address: 'Address 1',
            size: 1000,
            type: 'Storage'
        });

        testWarehouse2 = await WarehousesM.create({
            id: 'WH002',
            name: 'Warehouse 2',
            address: 'Address 2',
            size: 1000,
            type: 'Storage'
        });
    });

    afterAll(async () => {
        await cleanDatabase();
    });

    test('should create stock transfer', async () => {
        const transfer = await StockTransfersM.create({
            id: 'TRF001',
            productId: testProduct.id,
            fromWarehouseId: testWarehouse1.id,
            toWarehouseId: testWarehouse2.id,
            quantity: 20,
            status: 'pending',
            notes: 'Test transfer'
        });

        expect(transfer).toBeDefined();
        expect(transfer.id).toBe('TRF001');
        expect(transfer.product_id).toBe(testProduct.id);
        expect(transfer.from_warehouse_id).toBe(testWarehouse1.id);
        expect(transfer.to_warehouse_id).toBe(testWarehouse2.id);
        expect(transfer.quantity).toBe(20);
        expect(transfer.status).toBe('pending');
    });

    test('should find transfer by ID', async () => {
        const created = await StockTransfersM.create({
            id: 'TRF002',
            productId: testProduct.id,
            fromWarehouseId: testWarehouse1.id,
            toWarehouseId: testWarehouse2.id,
            quantity: 20,
            status: 'pending'
        });

        const transfer = await StockTransfersM.findById('TRF002');
        expect(transfer).toBeDefined();
        expect(transfer.id).toBe('TRF002');
    });

    test('should find transfers by product ID', async () => {
        await StockTransfersM.create({
            id: 'TRF003',
            productId: testProduct.id,
            fromWarehouseId: testWarehouse1.id,
            toWarehouseId: testWarehouse2.id,
            quantity: 20,
            status: 'pending'
        });

        const transfers = await StockTransfersM.findByProductId(testProduct.id);
        expect(transfers.length).toBeGreaterThan(0);
        expect(transfers[0].product_id).toBe(testProduct.id);
    });

    test('should find transfers by status', async () => {
        await StockTransfersM.create({
            id: 'TRF004',
            productId: testProduct.id,
            fromWarehouseId: testWarehouse1.id,
            toWarehouseId: testWarehouse2.id,
            quantity: 20,
            status: 'pending'
        });

        const pending = await StockTransfersM.findByStatus('pending');
        expect(pending.length).toBeGreaterThan(0);
        expect(pending.every(t => t.status === 'pending')).toBe(true);
    });

    test('should update transfer status', async () => {
        const created = await StockTransfersM.create({
            id: 'TRF005',
            productId: testProduct.id,
            fromWarehouseId: testWarehouse1.id,
            toWarehouseId: testWarehouse2.id,
            quantity: 20,
            status: 'pending'
        });

        const updated = await StockTransfersM.update('TRF005', {
            status: 'completed'
        });

        expect(updated.status).toBe('completed');
    });

    test('should count transfers', async () => {
        await StockTransfersM.create({
            id: 'TRF006',
            productId: testProduct.id,
            fromWarehouseId: testWarehouse1.id,
            toWarehouseId: testWarehouse2.id,
            quantity: 20,
            status: 'pending'
        });

        const count = await StockTransfersM.count({ productId: testProduct.id });
        expect(count).toBeGreaterThan(0);
    });
});

