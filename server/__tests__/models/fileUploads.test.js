const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const FileUploadsM = require('../../models/fileUploadsM');
const ProductsM = require('../../models/productsM');

describe('FileUploads Model', () => {
    let testProduct;

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
    });

    afterAll(async () => {
        await cleanDatabase();
    });

    test('should create file upload record', async () => {
        const fileData = {
            id: 'FILE001',
            entityType: 'product',
            entityId: testProduct.id,
            fileName: 'test-image.jpg',
            originalName: 'original-image.jpg',
            filePath: '/uploads/products/test-image.jpg',
            fileUrl: '/uploads/products/test-image.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            isPrimary: false,
            uploadType: 'product_image'
        };

        const file = await FileUploadsM.create(fileData);

        expect(file).toBeDefined();
        expect(file.id).toBe('FILE001');
        expect(file.entity_type).toBe('product');
        expect(file.entity_id).toBe(testProduct.id);
        expect(file.file_name).toBe('test-image.jpg');
    });

    test('should find files by entity', async () => {
        await FileUploadsM.create({
            id: 'FILE002',
            entityType: 'product',
            entityId: testProduct.id,
            fileName: 'test-image.jpg',
            originalName: 'original-image.jpg',
            filePath: '/uploads/products/test-image.jpg',
            fileUrl: '/uploads/products/test-image.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 1024
        });

        const files = await FileUploadsM.findByEntity('product', testProduct.id);
        expect(files.length).toBeGreaterThan(0);
        expect(files[0].entity_type).toBe('product');
        expect(files[0].entity_id).toBe(testProduct.id);
    });

    test('should find primary file by entity', async () => {
        await FileUploadsM.create({
            id: 'FILE003',
            entityType: 'product',
            entityId: testProduct.id,
            fileName: 'primary-image.jpg',
            originalName: 'primary.jpg',
            filePath: '/uploads/products/primary-image.jpg',
            fileUrl: '/uploads/products/primary-image.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            isPrimary: true
        });

        const primary = await FileUploadsM.findPrimaryByEntity('product', testProduct.id);
        expect(primary).toBeDefined();
        expect(primary.is_primary).toBe(true);
    });

    test('should update file to primary', async () => {
        const created = await FileUploadsM.create({
            id: 'FILE004',
            entityType: 'product',
            entityId: testProduct.id,
            fileName: 'test-image.jpg',
            originalName: 'original.jpg',
            filePath: '/uploads/products/test-image.jpg',
            fileUrl: '/uploads/products/test-image.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 1024,
            isPrimary: false
        });

        const updated = await FileUploadsM.update('FILE004', { isPrimary: true });
        expect(updated.is_primary).toBe(true);
    });

    test('should count files by entity', async () => {
        await FileUploadsM.create({
            id: 'FILE005',
            entityType: 'product',
            entityId: testProduct.id,
            fileName: 'test-image.jpg',
            originalName: 'original.jpg',
            filePath: '/uploads/products/test-image.jpg',
            fileUrl: '/uploads/products/test-image.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 1024
        });

        const count = await FileUploadsM.count({ entityType: 'product', entityId: testProduct.id });
        expect(count).toBeGreaterThan(0);
    });
});

