const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const UsersM = require('../models/usersM');
const ProductsM = require('../models/productsM');
const OrdersM = require('../models/ordersM');
const WarehousesM = require('../models/warehousesM');
const SuppliersM = require('../models/suppliersM');

const ImportS = {
    // Import from Excel
    importFromExcel: async (buffer, tableName, actor) => {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return {
                    success: false,
                    message: 'File is empty'
                };
            }

            let imported = 0;
            let errors = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    switch (tableName) {
                        case 'users':
                            if (!row['ID'] || !row['Email']) {
                                errors.push(`Row ${i + 2}: Missing required fields (ID, Email)`);
                                continue;
                            }
                            await UsersM.create({
                                id: row['ID'],
                                fullname: row['Họ tên'] || '',
                                number: row['Số điện thoại'] || '',
                                address: row['Địa chỉ'] || '',
                                email: row['Email'],
                                password: row['Password'] || 'default123', // Should hash in production
                                actor: actor
                            });
                            imported++;
                            break;
                        case 'products':
                            if (!row['ID'] || !row['Tên sản phẩm']) {
                                errors.push(`Row ${i + 2}: Missing required fields (ID, Tên sản phẩm)`);
                                continue;
                            }
                            await ProductsM.create({
                                id: row['ID'],
                                name: row['Tên sản phẩm'],
                                type: row['Loại'] || '',
                                unit: row['Đơn vị'] || '',
                                number: parseInt(row['Số lượng']) || 0,
                                price: parseFloat(row['Giá']) || 0,
                                supplierID: row['Nhà cung cấp'] || null,
                                actor: actor
                            });
                            imported++;
                            break;
                        case 'orders':
                            if (!row['ID'] || !row['Loại']) {
                                errors.push(`Row ${i + 2}: Missing required fields (ID, Loại)`);
                                continue;
                            }
                            const orderType = (row['Loại'] || '').toLowerCase();
                            
                            // Validate order type requirements
                            if (orderType === 'sale' || orderType === 'sell') {
                                if (!row['Tên khách hàng'] && !row['Customer Name']) {
                                    errors.push(`Row ${i + 2}: Sale orders require customer name (Tên khách hàng)`);
                                    continue;
                                }
                            } else if (orderType === 'import') {
                                // For import orders, supplier_id is required
                                // Can be provided in Excel as "Nhà cung cấp", "Supplier ID", or "Supplier_ID"
                                const supplierId = row['Nhà cung cấp'] || row['Supplier ID'] || row['Supplier_ID'] || row['SupplierId'];
                                if (!supplierId) {
                                    errors.push(`Row ${i + 2}: Import orders require supplier_id (Nhà cung cấp/Supplier ID)`);
                                    continue;
                                }
                                
                                // Verify supplier exists
                                try {
                                    const supplier = await SuppliersM.findById(supplierId);
                                    if (!supplier) {
                                        errors.push(`Row ${i + 2}: Supplier ID "${supplierId}" not found`);
                                        continue;
                                    }
                                } catch (err) {
                                    errors.push(`Row ${i + 2}: Error validating supplier: ${err.message}`);
                                    continue;
                                }
                                
                                await OrdersM.create({
                                    id: row['ID'],
                                    type: row['Loại'],
                                    date: row['Ngày'] || new Date().toISOString().split('T')[0],
                                    uId: row['Người dùng'] || null,
                                    supplierId: supplierId,
                                    total: parseFloat(row['Tổng tiền']) || 0,
                                    actor: actor
                                });
                            } else {
                                // Other order types (export, etc.)
                                await OrdersM.create({
                                    id: row['ID'],
                                    type: row['Loại'],
                                    date: row['Ngày'] || new Date().toISOString().split('T')[0],
                                    uId: row['Người dùng'] || null,
                                    customerName: row['Tên khách hàng'] || '',
                                    total: parseFloat(row['Tổng tiền']) || 0,
                                    actor: actor
                                });
                            }
                            imported++;
                            break;
                        case 'warehouses':
                            if (!row['ID'] || !row['Tên kho']) {
                                errors.push(`Row ${i + 2}: Missing required fields (ID, Tên kho)`);
                                continue;
                            }
                            await WarehousesM.create({
                                id: row['ID'],
                                name: row['Tên kho'],
                                address: row['Địa chỉ'] || '',
                                size: parseFloat(row['Kích thước']) || null,
                                type: row['Loại'] || '',
                                startedDate: row['Ngày bắt đầu'] || null,
                                endDate: row['Ngày kết thúc'] || null,
                                actor: actor
                            });
                            imported++;
                            break;
                        case 'suppliers':
                            if (!row['ID'] || !row['Tên nhà cung cấp']) {
                                errors.push(`Row ${i + 2}: Missing required fields (ID, Tên nhà cung cấp)`);
                                continue;
                            }
                            await SuppliersM.create({
                                id: row['ID'],
                                name: row['Tên nhà cung cấp'],
                                address: row['Địa chỉ'] || '',
                                phone: row['Số điện thoại'] || '',
                                actor: actor
                            });
                            imported++;
                            break;
                        default:
                            throw new Error(`Table ${tableName} not supported for import`);
                    }
                } catch (error) {
                    errors.push(`Row ${i + 2}: ${error.message}`);
                }
            }

            return {
                success: true,
                imported,
                total: data.length,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                message: 'Failed to import data',
                error: error.message
            };
        }
    },

    // Import from CSV
    importFromCSV: async (buffer, tableName, actor) => {
        return new Promise((resolve, reject) => {
            const data = [];
            const stream = Readable.from(buffer);
            
            stream
                .pipe(csv())
                .on('data', (row) => data.push(row))
                .on('end', async () => {
                    if (data.length === 0) {
                        return resolve({
                            success: false,
                            message: 'File is empty'
                        });
                    }

                    let imported = 0;
                    let errors = [];

                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        try {
                            switch (tableName) {
                                case 'users':
                                    if (!row['ID'] || !row['Email']) {
                                        errors.push(`Row ${i + 2}: Missing required fields (ID, Email)`);
                                        continue;
                                    }
                                    await UsersM.create({
                                        id: row['ID'],
                                        fullname: row['Họ tên'] || '',
                                        number: row['Số điện thoại'] || '',
                                        address: row['Địa chỉ'] || '',
                                        email: row['Email'],
                                        password: row['Password'] || 'default123',
                                        actor: actor
                                    });
                                    imported++;
                                    break;
                                case 'products':
                                    if (!row['ID'] || !row['Tên sản phẩm']) {
                                        errors.push(`Row ${i + 2}: Missing required fields (ID, Tên sản phẩm)`);
                                        continue;
                                    }
                                    await ProductsM.create({
                                        id: row['ID'],
                                        name: row['Tên sản phẩm'],
                                        type: row['Loại'] || '',
                                        unit: row['Đơn vị'] || '',
                                        number: parseInt(row['Số lượng']) || 0,
                                        price: parseFloat(row['Giá']) || 0,
                                        supplierID: row['Nhà cung cấp'] || null,
                                        actor: actor
                                    });
                                    imported++;
                                    break;
                                case 'orders':
                                    if (!row['ID'] || !row['Loại']) {
                                        errors.push(`Row ${i + 2}: Missing required fields (ID, Loại)`);
                                        continue;
                                    }
                                    await OrdersM.create({
                                        id: row['ID'],
                                        type: row['Loại'],
                                        date: row['Ngày'] || new Date().toISOString().split('T')[0],
                                        uId: row['Người dùng'] || null,
                                        customerName: row['Tên khách hàng'] || '',
                                        total: parseFloat(row['Tổng tiền']) || 0,
                                        actor: actor
                                    });
                                    imported++;
                                    break;
                                case 'warehouses':
                                    if (!row['ID'] || !row['Tên kho']) {
                                        errors.push(`Row ${i + 2}: Missing required fields (ID, Tên kho)`);
                                        continue;
                                    }
                                    await WarehousesM.create({
                                        id: row['ID'],
                                        name: row['Tên kho'],
                                        address: row['Địa chỉ'] || '',
                                        size: parseFloat(row['Kích thước']) || null,
                                        type: row['Loại'] || '',
                                        startedDate: row['Ngày bắt đầu'] || null,
                                        endDate: row['Ngày kết thúc'] || null,
                                        actor: actor
                                    });
                                    imported++;
                                    break;
                                case 'suppliers':
                                    if (!row['ID'] || !row['Tên nhà cung cấp']) {
                                        errors.push(`Row ${i + 2}: Missing required fields (ID, Tên nhà cung cấp)`);
                                        continue;
                                    }
                                    await SuppliersM.create({
                                        id: row['ID'],
                                        name: row['Tên nhà cung cấp'],
                                        address: row['Địa chỉ'] || '',
                                        phone: row['Số điện thoại'] || '',
                                        actor: actor
                                    });
                                    imported++;
                                    break;
                                default:
                                    throw new Error(`Table ${tableName} not supported for import`);
                            }
                        } catch (error) {
                            errors.push(`Row ${i + 2}: ${error.message}`);
                        }
                    }

                    resolve({
                        success: true,
                        imported,
                        total: data.length,
                        errors: errors.length > 0 ? errors : undefined
                    });
                })
                .on('error', (error) => {
                    reject({
                        success: false,
                        message: 'Failed to parse CSV',
                        error: error.message
                    });
                });
        });
    }
};

module.exports = ImportS;

