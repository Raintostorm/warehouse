const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const StatisticsM = require('../models/statisticsM');
const OrdersM = require('../models/ordersM');
const ProductsM = require('../models/productsM');
const ProductDetailsM = require('../models/productDetailsM');
const WarehousesM = require('../models/warehousesM');
const db = require('../db');

const ReportS = {
    // Generate Revenue Report (PDF)
    generateRevenueReportPDF: async (startDate, endDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];
                
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve({
                        success: true,
                        data: pdfBuffer,
                        filename: `BaoCaoDoanhThu_${new Date().toISOString().split('T')[0]}.pdf`,
                        contentType: 'application/pdf'
                    });
                });
                doc.on('error', reject);

                // Get revenue data
                const revenueData = await StatisticsM.getRevenue();
                const revenueByDay = await StatisticsM.getRevenueByDay(30);
                const ordersByType = await StatisticsM.getOrdersByType();
                
                // Get orders in date range if provided
                let ordersQuery = 'SELECT * FROM orders WHERE (type = $1 OR type = $2)';
                const queryParams = ['Sale', 'Sell'];
                
                if (startDate && endDate) {
                    ordersQuery += ' AND date >= $3 AND date <= $4';
                    queryParams.push(startDate, endDate);
                }
                ordersQuery += ' ORDER BY date DESC LIMIT 100';
                
                const ordersResult = await db.query(ordersQuery, queryParams);
                const orders = ordersResult.rows;

                // Header
                doc.fontSize(20).text('BÁO CÁO DOANH THU', { align: 'center' });
                doc.moveDown();
                
                if (startDate && endDate) {
                    doc.fontSize(12).text(`Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')} - Đến ngày: ${new Date(endDate).toLocaleDateString('vi-VN')}`, { align: 'center' });
                } else {
                    doc.fontSize(12).text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
                }
                doc.moveDown(2);

                // Summary Statistics
                doc.fontSize(16).text('TỔNG QUAN', { underline: true });
                doc.moveDown();
                doc.fontSize(12);
                doc.text(`Tổng doanh thu: ${revenueData.total.toLocaleString('vi-VN')} VNĐ`);
                doc.text(`Doanh thu hôm nay: ${revenueData.today.toLocaleString('vi-VN')} VNĐ`);
                doc.text(`Doanh thu tháng này: ${revenueData.thisMonth.toLocaleString('vi-VN')} VNĐ`);
                doc.moveDown(2);

                // Orders by Type
                doc.fontSize(16).text('PHÂN BỔ ĐƠN HÀNG THEO LOẠI', { underline: true });
                doc.moveDown();
                doc.fontSize(12);
                ordersByType.forEach(type => {
                    doc.text(`${type.type}: ${type.count} đơn - ${type.totalRevenue.toLocaleString('vi-VN')} VNĐ`);
                });
                doc.moveDown(2);

                // Recent Orders
                if (orders.length > 0) {
                    doc.fontSize(16).text('ĐƠN HÀNG GẦN ĐÂY', { underline: true });
                    doc.moveDown();
                    doc.fontSize(10);
                    
                    // Table header
                    doc.text('ID', 50, doc.y);
                    doc.text('Loại', 120, doc.y);
                    doc.text('Ngày', 200, doc.y);
                    doc.text('Khách hàng', 280, doc.y);
                    doc.text('Tổng tiền', 400, doc.y, { width: 100, align: 'right' });
                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
                    doc.moveDown(0.5);

                    // Table rows
                    orders.forEach(order => {
                        if (doc.y > 700) {
                            doc.addPage();
                        }
                        doc.text(order.id || '', 50, doc.y);
                        doc.text(order.type || '', 120, doc.y);
                        doc.text(order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '', 200, doc.y);
                        doc.text(order.customer_name || '', 280, doc.y, { width: 100 });
                        doc.text((order.total || 0).toLocaleString('vi-VN') + ' VNĐ', 400, doc.y, { width: 100, align: 'right' });
                        doc.moveDown();
                    });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    },

    // Generate Revenue Report (Excel)
    generateRevenueReportExcel: async (startDate, endDate) => {
        try {
            const revenueData = await StatisticsM.getRevenue();
            const revenueByDay = await StatisticsM.getRevenueByDay(30);
            const ordersByType = await StatisticsM.getOrdersByType();
            
            // Get orders in date range if provided
            let ordersQuery = 'SELECT * FROM orders WHERE (type = $1 OR type = $2)';
            const queryParams = ['Sale', 'Sell'];
            
            if (startDate && endDate) {
                ordersQuery += ' AND date >= $3 AND date <= $4';
                queryParams.push(startDate, endDate);
            }
            ordersQuery += ' ORDER BY date DESC';
            
            const ordersResult = await db.query(ordersQuery, queryParams);
            const orders = ordersResult.rows;

            const workbook = XLSX.utils.book_new();

            // Summary Sheet
            const summaryData = [
                ['BÁO CÁO DOANH THU'],
                [''],
                startDate && endDate 
                    ? [`Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')} - Đến ngày: ${new Date(endDate).toLocaleDateString('vi-VN')}`]
                    : [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
                [''],
                ['TỔNG QUAN'],
                ['Tổng doanh thu', revenueData.total],
                ['Doanh thu hôm nay', revenueData.today],
                ['Doanh thu tháng này', revenueData.thisMonth],
                [''],
                ['PHÂN BỔ ĐƠN HÀNG THEO LOẠI'],
                ['Loại', 'Số lượng', 'Tổng tiền']
            ];
            
            ordersByType.forEach(type => {
                summaryData.push([type.type, type.count, type.totalRevenue]);
            });

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

            // Orders Sheet
            const ordersData = orders.map(order => ({
                'ID': order.id,
                'Loại': order.type,
                'Ngày': order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '',
                'Người dùng': order.user_id,
                'Tên khách hàng': order.customer_name,
                'Tổng tiền': order.total
            }));

            if (ordersData.length > 0) {
                const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
                XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Đơn hàng');
            }

            // Revenue by Day Sheet
            const revenueByDayData = revenueByDay.map(day => ({
                'Ngày': day.day ? new Date(day.day).toLocaleDateString('vi-VN') : '',
                'Doanh thu': day.revenue,
                'Số đơn hàng': day.orderCount
            }));

            if (revenueByDayData.length > 0) {
                const revenueSheet = XLSX.utils.json_to_sheet(revenueByDayData);
                XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Doanh thu theo ngày');
            }

            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return {
                success: true,
                data: excelBuffer,
                filename: `BaoCaoDoanhThu_${new Date().toISOString().split('T')[0]}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
        } catch (error) {
            console.error('Generate Revenue Report Excel error:', error);
            return {
                success: false,
                message: 'Failed to generate revenue report',
                error: error.message
            };
        }
    },

    // Generate Inventory Report (PDF)
    generateInventoryReportPDF: async () => {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];
                
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve({
                        success: true,
                        data: pdfBuffer,
                        filename: `BaoCaoTonKho_${new Date().toISOString().split('T')[0]}.pdf`,
                        contentType: 'application/pdf'
                    });
                });
                doc.on('error', reject);

                // Get inventory data
                const products = await ProductsM.findAll();
                const productDetails = await ProductDetailsM.findAll();
                const warehouses = await WarehousesM.findAll();

                // Header
                doc.fontSize(20).text('BÁO CÁO TỒN KHO', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
                doc.moveDown(2);

                // Summary
                doc.fontSize(16).text('TỔNG QUAN', { underline: true });
                doc.moveDown();
                doc.fontSize(12);
                doc.text(`Tổng số sản phẩm: ${products.length}`);
                doc.text(`Tổng số kho: ${warehouses.length}`);
                doc.moveDown(2);

                // Products by Warehouse
                doc.fontSize(16).text('CHI TIẾT TỒN KHO THEO KHO', { underline: true });
                doc.moveDown();

                const warehouseMap = {};
                warehouses.forEach(wh => {
                    warehouseMap[wh.id] = wh.name;
                });

                const productMap = {};
                products.forEach(p => {
                    productMap[p.id] = p;
                });

                const detailsByWarehouse = {};
                productDetails.forEach(detail => {
                    if (!detailsByWarehouse[detail.wid]) {
                        detailsByWarehouse[detail.wid] = [];
                    }
                    detailsByWarehouse[detail.wid].push(detail);
                });

                Object.keys(detailsByWarehouse).forEach(wid => {
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                    doc.fontSize(14).text(`Kho: ${warehouseMap[wid] || wid}`, { underline: true });
                    doc.moveDown();
                    doc.fontSize(10);
                    
                    doc.text('Sản phẩm', 50, doc.y);
                    doc.text('Số lượng', 300, doc.y, { width: 100, align: 'right' });
                    doc.text('Ghi chú', 400, doc.y);
                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
                    doc.moveDown(0.5);

                    detailsByWarehouse[wid].forEach(detail => {
                        const product = productMap[detail.pid];
                        if (product) {
                            doc.text(product.name || detail.pid, 50, doc.y);
                            doc.text((detail.number || 0).toString(), 300, doc.y, { width: 100, align: 'right' });
                            doc.text(detail.note || '', 400, doc.y, { width: 100 });
                            doc.moveDown();
                        }
                    });
                    doc.moveDown();
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    },

    // Generate Inventory Report (Excel)
    generateInventoryReportExcel: async () => {
        try {
            const products = await ProductsM.findAll();
            const productDetails = await ProductDetailsM.findAll();
            const warehouses = await WarehousesM.findAll();

            const workbook = XLSX.utils.book_new();

            // Summary Sheet
            const summaryData = [
                ['BÁO CÁO TỒN KHO'],
                [''],
                [`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`],
                [''],
                ['TỔNG QUAN'],
                ['Tổng số sản phẩm', products.length],
                ['Tổng số kho', warehouses.length]
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

            // Inventory Details Sheet
            const warehouseMap = {};
            warehouses.forEach(wh => {
                warehouseMap[wh.id] = wh.name;
            });

            const productMap = {};
            products.forEach(p => {
                productMap[p.id] = p;
            });

            const inventoryData = productDetails.map(detail => {
                const product = productMap[detail.pid];
                const warehouse = warehouseMap[detail.wid];
                return {
                    'Mã kho': detail.wid,
                    'Tên kho': warehouse || detail.wid,
                    'Mã sản phẩm': detail.pid,
                    'Tên sản phẩm': product ? product.name : detail.pid,
                    'Số lượng': detail.number || 0,
                    'Ghi chú': detail.note || '',
                    'Cập nhật lần cuối': detail.updated_at ? new Date(detail.updated_at).toLocaleDateString('vi-VN') : ''
                };
            });

            if (inventoryData.length > 0) {
                const inventorySheet = XLSX.utils.json_to_sheet(inventoryData);
                XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Chi tiết tồn kho');
            }

            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return {
                success: true,
                data: excelBuffer,
                filename: `BaoCaoTonKho_${new Date().toISOString().split('T')[0]}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
        } catch (error) {
            console.error('Generate Inventory Report Excel error:', error);
            return {
                success: false,
                message: 'Failed to generate inventory report',
                error: error.message
            };
        }
    },

    // Generate Orders Report (PDF)
    generateOrdersReportPDF: async (startDate, endDate, orderType) => {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];
                
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve({
                        success: true,
                        data: pdfBuffer,
                        filename: `BaoCaoDonHang_${new Date().toISOString().split('T')[0]}.pdf`,
                        contentType: 'application/pdf'
                    });
                });
                doc.on('error', reject);

                // Get orders data
                let ordersQuery = 'SELECT * FROM orders WHERE 1=1';
                const queryParams = [];
                let paramCount = 1;

                if (orderType) {
                    ordersQuery += ` AND type = $${paramCount}`;
                    queryParams.push(orderType);
                    paramCount++;
                }

                if (startDate && endDate) {
                    ordersQuery += ` AND date >= $${paramCount} AND date <= $${paramCount + 1}`;
                    queryParams.push(startDate, endDate);
                    paramCount += 2;
                }

                ordersQuery += ' ORDER BY date DESC';
                
                const ordersResult = await db.query(ordersQuery, queryParams);
                const orders = ordersResult.rows;

                // Header
                doc.fontSize(20).text('BÁO CÁO ĐƠN HÀNG', { align: 'center' });
                doc.moveDown();
                
                let filterText = '';
                if (startDate && endDate) {
                    filterText += `Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')} - Đến ngày: ${new Date(endDate).toLocaleDateString('vi-VN')}`;
                }
                if (orderType) {
                    if (filterText) filterText += ' | ';
                    filterText += `Loại: ${orderType}`;
                }
                if (!filterText) {
                    filterText = `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`;
                }
                
                doc.fontSize(12).text(filterText, { align: 'center' });
                doc.moveDown(2);

                // Summary
                doc.fontSize(16).text('TỔNG QUAN', { underline: true });
                doc.moveDown();
                doc.fontSize(12);
                const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
                doc.text(`Tổng số đơn hàng: ${orders.length}`);
                doc.text(`Tổng giá trị: ${totalAmount.toLocaleString('vi-VN')} VNĐ`);
                doc.moveDown(2);

                // Orders Table
                if (orders.length > 0) {
                    doc.fontSize(16).text('CHI TIẾT ĐƠN HÀNG', { underline: true });
                    doc.moveDown();
                    doc.fontSize(10);
                    
                    // Table header
                    doc.text('ID', 50, doc.y);
                    doc.text('Loại', 120, doc.y);
                    doc.text('Ngày', 200, doc.y);
                    doc.text('Người dùng', 280, doc.y);
                    doc.text('Khách hàng', 350, doc.y);
                    doc.text('Tổng tiền', 450, doc.y, { width: 50, align: 'right' });
                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
                    doc.moveDown(0.5);

                    // Table rows
                    orders.forEach(order => {
                        if (doc.y > 700) {
                            doc.addPage();
                        }
                        doc.text(order.id || '', 50, doc.y);
                        doc.text(order.type || '', 120, doc.y);
                        doc.text(order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '', 200, doc.y);
                        doc.text(order.user_id || '', 280, doc.y);
                        doc.text(order.customer_name || '', 350, doc.y, { width: 80 });
                        doc.text((order.total || 0).toLocaleString('vi-VN') + ' VNĐ', 450, doc.y, { width: 50, align: 'right' });
                        doc.moveDown();
                    });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    },

    // Generate Orders Report (Excel)
    generateOrdersReportExcel: async (startDate, endDate, orderType) => {
        try {
            // Get orders data
            let ordersQuery = 'SELECT * FROM orders WHERE 1=1';
            const queryParams = [];
            let paramCount = 1;

            if (orderType) {
                ordersQuery += ` AND type = $${paramCount}`;
                queryParams.push(orderType);
                paramCount++;
            }

            if (startDate && endDate) {
                ordersQuery += ` AND date >= $${paramCount} AND date <= $${paramCount + 1}`;
                queryParams.push(startDate, endDate);
                paramCount += 2;
            }

            ordersQuery += ' ORDER BY date DESC';
            
            const ordersResult = await db.query(ordersQuery, queryParams);
            const orders = ordersResult.rows;

            const workbook = XLSX.utils.book_new();

            // Summary Sheet
            const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
            
            let filterText = '';
            if (startDate && endDate) {
                filterText += `Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')} - Đến ngày: ${new Date(endDate).toLocaleDateString('vi-VN')}`;
            }
            if (orderType) {
                if (filterText) filterText += ' | ';
                filterText += `Loại: ${orderType}`;
            }
            if (!filterText) {
                filterText = `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`;
            }

            const summaryData = [
                ['BÁO CÁO ĐƠN HÀNG'],
                [''],
                [filterText],
                [''],
                ['TỔNG QUAN'],
                ['Tổng số đơn hàng', orders.length],
                ['Tổng giá trị', totalAmount]
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

            // Orders Sheet
            const ordersData = orders.map(order => ({
                'ID': order.id,
                'Loại': order.type,
                'Ngày': order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '',
                'Người dùng': order.user_id,
                'Tên khách hàng': order.customer_name,
                'Tổng tiền': order.total,
                'Ngày tạo': order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : ''
            }));

            if (ordersData.length > 0) {
                const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
                XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Đơn hàng');
            }

            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return {
                success: true,
                data: excelBuffer,
                filename: `BaoCaoDonHang_${new Date().toISOString().split('T')[0]}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
        } catch (error) {
            console.error('Generate Orders Report Excel error:', error);
            return {
                success: false,
                message: 'Failed to generate orders report',
                error: error.message
            };
        }
    }
};

module.exports = ReportS;

