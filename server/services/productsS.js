const ProductsM = require('../models/productsM');
const SuppliersM = require('../models/suppliersM');
const CacheService = require('../utils/cacheService');
const logger = require('../utils/logger');

// Helper function để validate và sanitize product data
const validateAndSanitizeProduct = async (productData, isUpdate = false) => {
    // Sanitize: trim whitespace
    if (productData.name) {
        productData.name = productData.name.trim();
        if (productData.name.length === 0) {
            throw new Error('Product name cannot be empty');
        }
        if (productData.name.length > 255) {
            throw new Error('Product name is too long (max 255 characters)');
        }
    }
    
    if (productData.type) {
        productData.type = productData.type.trim();
    }
    
    if (productData.unit) {
        productData.unit = productData.unit.trim();
    }

    // Price validation: nếu có price thì phải >= 0 (cho phép 0 cho free products)
    if (productData.price !== undefined && productData.price !== null) {
        const price = parseFloat(productData.price);
        if (isNaN(price)) {
            throw new Error('Price must be a valid number');
        }
        if (price < 0) {
            throw new Error('Price cannot be negative');
        }
        productData.price = price;
    }

    // Supplier existence check: nếu có supplierId thì phải tồn tại
    const supplierId = productData.supplierId || productData.supplier_id;
    if (supplierId && supplierId.trim() !== '') {
        try {
            const supplier = await SuppliersM.findById(supplierId.trim());
            if (!supplier) {
                throw new Error(`Supplier with ID "${supplierId}" does not exist`);
            }
            productData.supplierId = supplierId.trim();
            productData.supplier_id = supplierId.trim();
        } catch (error) {
            // Nếu lỗi không phải "not found", throw lại
            if (error.message.includes('does not exist')) {
                throw error;
            }
            logger.warn('Error checking supplier existence', { supplierId, error: error.message });
            // Nếu lỗi khác (như DB error), cho phép tiếp tục để không block flow
        }
    }

    return productData;
};

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

        // Validate và sanitize
        const sanitizedData = await validateAndSanitizeProduct(productData, false);

        // Check duplicate ID
        const existingProduct = await ProductsM.findById(sanitizedData.id);
        if (existingProduct) {
            throw new Error('Product ID already exists');
        }

        // Check duplicate name (optional - chỉ warning, không block)
        try {
            const allProducts = await ProductsM.findAll();
            const duplicateName = allProducts.find(p => 
                p.name && sanitizedData.name && 
                p.name.toLowerCase().trim() === sanitizedData.name.toLowerCase().trim() &&
                p.id !== sanitizedData.id
            );
            if (duplicateName) {
                logger.warn('Product with similar name already exists', { 
                    newName: sanitizedData.name, 
                    existingId: duplicateName.id 
                });
                // Không throw error - chỉ log warning để không block flow
            }
        } catch (error) {
            // Ignore duplicate name check errors
            logger.warn('Error checking duplicate product name', { error: error.message });
        }

        const product = await ProductsM.create(sanitizedData);

        // Xóa cache khi tạo mới
        await CacheService.invalidate('products:*');

        return product;
    },
    updateProduct: async (id, productData) => {
        const existingProduct = await ProductsM.findById(id);
        if (!existingProduct) {
            throw new Error('Product not found');
        }

        // Validate và sanitize
        const sanitizedData = await validateAndSanitizeProduct(productData, true);

        // Check duplicate name (optional - chỉ warning, không block)
        if (sanitizedData.name) {
            try {
                const allProducts = await ProductsM.findAll();
                const duplicateName = allProducts.find(p => 
                    p.name && sanitizedData.name && 
                    p.name.toLowerCase().trim() === sanitizedData.name.toLowerCase().trim() &&
                    p.id !== id
                );
                if (duplicateName) {
                    logger.warn('Product with similar name already exists', { 
                        newName: sanitizedData.name, 
                        existingId: duplicateName.id,
                        updatingId: id
                    });
                    // Không throw error - chỉ log warning để không block flow
                }
            } catch (error) {
                // Ignore duplicate name check errors
                logger.warn('Error checking duplicate product name', { error: error.message });
            }
        }

        const product = await ProductsM.update(id, sanitizedData);

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

