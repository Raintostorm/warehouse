const ProductsM = require('../../models/productsM');
const SuppliersM = require('../../models/suppliersM');
const { cleanDatabase, initTestDatabase } = require('../helpers/testDb');
const { testProducts, testSuppliers, generateId } = require('../helpers/testData');

describe('Products Model CRUD Operations', () => {
    let testSupplier;

    beforeAll(async () => {
        await initTestDatabase();
        await cleanDatabase();
    });

    beforeEach(async () => {
        await cleanDatabase();
        // Create a supplier for products
        const supplierData = testSuppliers.create();
        testSupplier = await SuppliersM.create(supplierData);
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    describe('CREATE', () => {
        test('should create a new product', async () => {
            const productData = testProducts.create(testSupplier.id);
            const product = await ProductsM.create(productData);

            expect(product).toBeDefined();
            expect(product.id).toBe(productData.id);
            expect(product.name).toBe(productData.name);
            // Database returns price as string with decimals, compare numeric values
            expect(parseFloat(product.price || product.Price)).toBe(productData.price);
        });

        test('should create product with minimal fields (database allows NULL)', async () => {
            // Database schema allows NULL for most fields, so this will succeed
            const minimalProduct = {
                id: generateId('P', 10),
                name: 'Test Product',
                actor: 'test'
            };

            const product = await ProductsM.create(minimalProduct);
            expect(product).toBeDefined();
            expect(product.id).toBe(minimalProduct.id);
            expect(product.name).toBe(minimalProduct.name);
        });
    });

    describe('READ', () => {
        test('should find all products', async () => {
            const product1 = testProducts.create(testSupplier.id);
            const product2 = testProducts.create(testSupplier.id);
            await ProductsM.create(product1);
            await ProductsM.create(product2);

            const products = await ProductsM.findAll();

            expect(Array.isArray(products)).toBe(true);
            expect(products.length).toBeGreaterThanOrEqual(2);
        });

        test('should find product by id', async () => {
            const productData = testProducts.create(testSupplier.id);
            const createdProduct = await ProductsM.create(productData);

            const foundProduct = await ProductsM.findById(createdProduct.id);

            expect(foundProduct).toBeDefined();
            expect(foundProduct.id).toBe(createdProduct.id);
            expect(foundProduct.name).toBe(createdProduct.name);
        });

        test('should return undefined for non-existent product', async () => {
            const foundProduct = await ProductsM.findById('NON_EXISTENT_ID');
            expect(foundProduct).toBeUndefined();
        });
    });

    describe('UPDATE', () => {
        test('should update product', async () => {
            const productData = testProducts.create(testSupplier.id);
            const createdProduct = await ProductsM.create(productData);

            const updateData = testProducts.update();
            const updatedProduct = await ProductsM.update(createdProduct.id, updateData);

            expect(updatedProduct).toBeDefined();
            expect(updatedProduct.name).toBe(updateData.name);
            expect(parseFloat(updatedProduct.price)).toBe(updateData.price);
        });

        test('should throw error if no updates provided', async () => {
            const productData = testProducts.create(testSupplier.id);
            const createdProduct = await ProductsM.create(productData);

            await expect(ProductsM.update(createdProduct.id, {})).rejects.toThrow('No updates provided');
        });
    });

    describe('DELETE', () => {
        test('should delete product', async () => {
            const productData = testProducts.create(testSupplier.id);
            const createdProduct = await ProductsM.create(productData);

            const deletedProduct = await ProductsM.delete(createdProduct.id);

            expect(deletedProduct).toBeDefined();
            expect(deletedProduct.id).toBe(createdProduct.id);

            // Verify product is deleted
            const foundProduct = await ProductsM.findById(createdProduct.id);
            expect(foundProduct).toBeUndefined();
        });
    });
});
