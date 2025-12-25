const WarehousesS = require('../warehousesS');
const StatisticsM = require('../../models/statisticsM');
const logger = require('../../utils/logger');

const WarehouseActions = {
    /**
     * Check inventory / low stock products
     */
    checkInventory: async (params) => {
        try {
            const { lowStock = true, threshold = 10 } = params;
            
            if (lowStock) {
                const lowStockProducts = await StatisticsM.getLowStockProducts(threshold);
                
                return {
                    success: true,
                    message: lowStockProducts.length > 0
                        ? `Có ${lowStockProducts.length} sản phẩm sắp hết hàng (dưới ${threshold}):`
                        : 'Không có sản phẩm nào sắp hết hàng',
                    data: lowStockProducts,
                    count: lowStockProducts.length,
                    threshold: threshold
                };
            } else {
                // Get all warehouses
                const warehouses = await WarehousesS.findAll();
                return {
                    success: true,
                    message: `Danh sách ${warehouses.length} kho hàng:`,
                    data: warehouses,
                    count: warehouses.length
                };
            }
        } catch (error) {
            logger.error('Error checking inventory', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi kiểm tra tồn kho',
                error: error.message
            };
        }
    },

    /**
     * List all warehouses
     */
    listWarehouses: async (params) => {
        try {
            const warehouses = await WarehousesS.findAll();
            
            return {
                success: true,
                message: `Danh sách ${warehouses.length} kho hàng:`,
                data: warehouses,
                count: warehouses.length
            };
        } catch (error) {
            logger.error('Error listing warehouses', { error: error.message });
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách kho hàng',
                error: error.message
            };
        }
    }
};

module.exports = WarehouseActions;

