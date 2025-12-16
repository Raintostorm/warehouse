const XLSX = require('xlsx');
const UsersM = require('../models/usersM');
const ProductsM = require('../models/productsM');
const OrdersM = require('../models/ordersM');
const WarehousesM = require('../models/warehousesM');
const SuppliersM = require('../models/suppliersM');

const ExportS = {
    // Export data to Excel
    exportToExcel: async (tableName) => {
        try {
            let data = [];
            let headers = [];

            // Get data based on table name
            switch (tableName) {
                case 'users':
                    data = await UsersM.findAll();
                    headers = ['ID', 'Họ tên', 'Số điện thoại', 'Địa chỉ', 'Email', 'Ngày tạo', 'Người thực hiện'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Họ tên': row.fullname,
                        'Số điện thoại': row.number,
                        'Địa chỉ': row.address,
                        'Email': row.email,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '',
                        'Người thực hiện': row.actor || ''
                    }));
                    break;
                case 'products':
                    data = await ProductsM.findAll();
                    headers = ['ID', 'Tên sản phẩm', 'Loại', 'Đơn vị', 'Số lượng', 'Giá', 'Nhà cung cấp', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Tên sản phẩm': row.name,
                        'Loại': row.type,
                        'Đơn vị': row.unit,
                        'Số lượng': row.number,
                        'Giá': row.price,
                        'Nhà cung cấp': row.supplier_id,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                case 'orders':
                    data = await OrdersM.findAll();
                    headers = ['ID', 'Loại', 'Ngày', 'Người dùng', 'Tên khách hàng', 'Tổng tiền', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Loại': row.type,
                        'Ngày': row.date,
                        'Người dùng': row.user_id,
                        'Tên khách hàng': row.customer_name,
                        'Tổng tiền': row.total,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                case 'warehouses':
                    data = await WarehousesM.findAll();
                    headers = ['ID', 'Tên kho', 'Địa chỉ', 'Kích thước', 'Loại', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Tên kho': row.name,
                        'Địa chỉ': row.address,
                        'Kích thước': row.size,
                        'Loại': row.type,
                        'Ngày bắt đầu': row.started_date,
                        'Ngày kết thúc': row.end_date,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                case 'suppliers':
                    data = await SuppliersM.findAll();
                    headers = ['ID', 'Tên nhà cung cấp', 'Địa chỉ', 'Số điện thoại', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Tên nhà cung cấp': row.name,
                        'Địa chỉ': row.address,
                        'Số điện thoại': row.phone,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                default:
                    throw new Error(`Table ${tableName} not supported for export`);
            }

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

            // Generate Excel buffer
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return {
                success: true,
                data: excelBuffer,
                filename: `${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
        } catch (error) {
            console.error('Export error:', error);
            return {
                success: false,
                message: 'Failed to export data',
                error: error.message
            };
        }
    },

    // Export data to CSV
    exportToCSV: async (tableName) => {
        try {
            let data = [];
            let headers = [];

            // Get data (same logic as Excel)
            switch (tableName) {
                case 'users':
                    data = await UsersM.findAll();
                    headers = ['ID', 'Họ tên', 'Số điện thoại', 'Địa chỉ', 'Email', 'Ngày tạo', 'Người thực hiện'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Họ tên': row.fullname,
                        'Số điện thoại': row.number,
                        'Địa chỉ': row.address,
                        'Email': row.email,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '',
                        'Người thực hiện': row.actor || ''
                    }));
                    break;
                case 'products':
                    data = await ProductsM.findAll();
                    headers = ['ID', 'Tên sản phẩm', 'Loại', 'Đơn vị', 'Số lượng', 'Giá', 'Nhà cung cấp', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Tên sản phẩm': row.name,
                        'Loại': row.type,
                        'Đơn vị': row.unit,
                        'Số lượng': row.number,
                        'Giá': row.price,
                        'Nhà cung cấp': row.supplier_id,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                case 'orders':
                    data = await OrdersM.findAll();
                    headers = ['ID', 'Loại', 'Ngày', 'Người dùng', 'Tên khách hàng', 'Tổng tiền', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Loại': row.type,
                        'Ngày': row.date,
                        'Người dùng': row.user_id,
                        'Tên khách hàng': row.customer_name,
                        'Tổng tiền': row.total,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                case 'warehouses':
                    data = await WarehousesM.findAll();
                    headers = ['ID', 'Tên kho', 'Địa chỉ', 'Kích thước', 'Loại', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Tên kho': row.name,
                        'Địa chỉ': row.address,
                        'Kích thước': row.size,
                        'Loại': row.type,
                        'Ngày bắt đầu': row.started_date,
                        'Ngày kết thúc': row.end_date,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                case 'suppliers':
                    data = await SuppliersM.findAll();
                    headers = ['ID', 'Tên nhà cung cấp', 'Địa chỉ', 'Số điện thoại', 'Ngày tạo'];
                    data = data.map(row => ({
                        'ID': row.id,
                        'Tên nhà cung cấp': row.name,
                        'Địa chỉ': row.address,
                        'Số điện thoại': row.phone,
                        'Ngày tạo': row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : ''
                    }));
                    break;
                default:
                    throw new Error(`Table ${tableName} not supported for export`);
            }

            // Convert to CSV
            const csvRows = [];
            csvRows.push(headers.join(','));
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvRows.push(values.join(','));
            });

            const csvContent = csvRows.join('\n');
            // Add UTF-8 BOM for Excel compatibility with Vietnamese characters
            const BOM = '\uFEFF';
            const csvBuffer = Buffer.from(BOM + csvContent, 'utf-8');

            return {
                success: true,
                data: csvBuffer,
                filename: `${tableName}_${new Date().toISOString().split('T')[0]}.csv`,
                contentType: 'text/csv; charset=utf-8'
            };
        } catch (error) {
            console.error('Export CSV error:', error);
            return {
                success: false,
                message: 'Failed to export data to CSV',
                error: error.message
            };
        }
    }
};

module.exports = ExportS;

