const ProductsM = require('../models/productsM');
const CacheService = require('../utils/cacheService');

const ProductsS = {
    findAll: async () => {
        return await CacheService.getOrSet(
            'products:all',
            async () => await ProductsM.findAll(),
            60 // Cache 60 giây (1 phút)
        );
    },
    findById: async (id) => {
        if (!id) {
            throw new Error('ID is required');
        }
        return await CacheService.getOrSet(
            `product:${id}`,
            async () => {
                const product = await ProductsM.findById(id);
                if (!product) {
                    throw new Error('Product not found');
                }
                return product;
            },
            300 // Cache 5 phút
        );
    },
    createProduct: async (productData) => {
        if (!productData.id || !productData.name) {
            throw new Error('Missing required fields: id, name');
        }
        const existingProduct = await ProductsM.findById(productData.id);
        if (existingProduct) {
            throw new Error('Product ID already exists');
        }
        const product = await ProductsM.create(productData);

        // Xóa cache khi tạo mới
        await CacheService.invalidate('products:*');

        return product;
    },
    updateProduct: async (id, productData) => {
        const existingProduct = await ProductsM.findById(id);
        if (!existingProduct) {
            throw new Error('Product not found');
        }
        const product = await ProductsM.update(id, productData);

        // Xóa cache khi update
        await CacheService.delete(`product:${id}`);
        await CacheService.invalidate('products:*');

        return product;
    },
    deleteProduct: async (id) => {
        const existingProduct = await ProductsM.findById(id);
        if (!existingProduct) {
            throw new Error('Product not found');
        }
        await ProductsM.delete(id);

        // Xóa cache khi delete
        await CacheService.delete(`product:${id}`);
        await CacheService.invalidate('products:*');
    }
};

module.exports = ProductsS;

