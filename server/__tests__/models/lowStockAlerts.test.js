const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const LowStockAlertsM = require('../../models/lowStockAlertsM');
const ProductsM = require('../../models/productsM');
const WarehousesM = require('../../models/warehousesM');

describe('LowStockAlerts Model', () => {
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
            number: 5, // Low stock
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

    test('should create low stock alert', async () => {
        const alert = await LowStockAlertsM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            currentQuantity: 5,
            threshold: 10,
            alertLevel: 'warning'
        });

        expect(alert).toBeDefined();
        expect(alert.product_id).toBe(testProduct.id);
        expect(alert.warehouse_id).toBe(testWarehouse.id);
        expect(alert.current_quantity).toBe(5);
        expect(alert.threshold).toBe(10);
        expect(alert.alert_level).toBe('warning');
        expect(alert.is_resolved).toBe(false);
    });

    test('should find active alerts', async () => {
        await LowStockAlertsM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            currentQuantity: 5,
            threshold: 10,
            alertLevel: 'warning'
        });

        const active = await LowStockAlertsM.findActive();
        expect(active.length).toBeGreaterThan(0);
        expect(active.every(a => !a.is_resolved)).toBe(true);
    });

    test('should find alerts by product ID', async () => {
        await LowStockAlertsM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            currentQuantity: 5,
            threshold: 10,
            alertLevel: 'warning'
        });

        const alerts = await LowStockAlertsM.findByProductId(testProduct.id);
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0].product_id).toBe(testProduct.id);
    });

    test('should update alert to resolved', async () => {
        const created = await LowStockAlertsM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            currentQuantity: 5,
            threshold: 10,
            alertLevel: 'warning'
        });

        const updated = await LowStockAlertsM.update(created.id, {
            isResolved: true,
            resolvedBy: 'test_user'
        });

        expect(updated.is_resolved).toBe(true);
        expect(updated.resolved_by).toBe('test_user');
        expect(updated.resolved_at).toBeDefined();
    });

    test('should count alerts', async () => {
        await LowStockAlertsM.create({
            productId: testProduct.id,
            warehouseId: testWarehouse.id,
            currentQuantity: 5,
            threshold: 10,
            alertLevel: 'warning'
        });

        const count = await LowStockAlertsM.count({ productId: testProduct.id, isResolved: false });
        expect(count).toBeGreaterThan(0);
    });
});

