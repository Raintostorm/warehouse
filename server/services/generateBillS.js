const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const OrdersM = require('../models/ordersM');
const OrderDetailsM = require('../models/orderDetailsM');
const ProductsM = require('../models/productsM');
const BillsS = require('./billsS');
const getActor = require('../utils/getActor');

// Đường dẫn đến font files
const fontsDir = path.join(__dirname, '..', 'fonts');
const fontRegular = path.join(fontsDir, 'NotoSans-Regular.ttf');
const fontBold = path.join(fontsDir, 'NotoSans-Bold.ttf');

// Helper function để register font nếu có
function registerFonts(doc) {
    try {
        // Register font Noto Sans nếu có
        if (fs.existsSync(fontRegular)) {
            doc.registerFont('NotoSans', fontRegular);
        }
        if (fs.existsSync(fontBold)) {
            doc.registerFont('NotoSans-Bold', fontBold);
        }

        // Return font names để sử dụng
        const hasNotoSans = fs.existsSync(fontRegular);
        const hasNotoSansBold = fs.existsSync(fontBold);

        return {
            regular: hasNotoSans ? 'NotoSans' : 'Helvetica',
            bold: hasNotoSansBold ? 'NotoSans-Bold' : 'Helvetica-Bold'
        };
    } catch (error) {
        console.warn('⚠️  Warning: Could not register fonts, using default Helvetica:', error.message);
        return {
            regular: 'Helvetica',
            bold: 'Helvetica-Bold'
        };
    }
}

const generateBillS = {
    // Support multiple orders
    generateBill: async (orderIds, selectedProductIds = null, req = null) => {
        // Convert single orderId to array for backward compatibility
        const orderIdArray = Array.isArray(orderIds) ? orderIds : [orderIds];

        if (orderIdArray.length === 0) {
            throw new Error('No orders provided');
        }

        // Lấy thông tin tất cả orders
        const orders = await Promise.all(
            orderIdArray.map(async (orderId) => {
                const order = await OrdersM.findById(orderId);
                if (!order) {
                    throw new Error(`Order ${orderId} not found`);
                }
                return order;
            })
        );

        // Lấy tất cả order details từ tất cả orders
        let allOrderDetails = [];
        for (const order of orders) {
            const orderDetails = await OrderDetailsM.findByOrderId(order.id || order.Id);
            // Add order info to each detail
            const detailsWithOrder = orderDetails.map(od => ({
                ...od,
                orderId: order.id || order.Id,
                orderInfo: order
            }));
            allOrderDetails.push(...detailsWithOrder);
        }

        // Nếu có chọn sản phẩm cụ thể, filter lại (backward compatibility)
        if (selectedProductIds && selectedProductIds.length > 0) {
            allOrderDetails = allOrderDetails.filter(od => {
                const productId = od.pid || od.product_id;
                return selectedProductIds.includes(productId);
            });
        }

        if (allOrderDetails.length === 0) {
            throw new Error('No products found in selected orders');
        }

        // Lấy thông tin sản phẩm cho mỗi order detail
        const billItems = await Promise.all(
            allOrderDetails.map(async (od) => {
                // Handle both pid/product_id for compatibility
                const productId = od.pid || od.product_id;
                const product = await ProductsM.findById(productId);
                return {
                    productId: productId,
                    productName: product ? product.name : 'Unknown Product',
                    quantity: od.number || 0,
                    unitPrice: product ? (product.price || 0) : 0,
                    note: od.note || '',
                    subtotal: (od.number || 0) * (product ? (product.price || 0) : 0),
                    orderId: od.orderId, // Keep order ID for grouping
                    orderInfo: od.orderInfo
                };
            })
        );

        // Tính tổng tiền
        const total = billItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Use first order for header info (or combine if needed)
        const primaryOrder = orders[0];

        // Create bill record in database (use first order_id for single bill)
        // If multiple orders, we'll use the first order_id
        let billRecord = null;
        try {
            const actorInfo = req ? getActor(req) : 'system';
            billRecord = await BillsS.createBill({
                orderId: primaryOrder.id || primaryOrder.Id,
                totalAmount: total,
                status: 'pending',
                actor: actorInfo
            });
        } catch (billError) {
            // If bill already exists, try to find it
            if (billError.message.includes('already exists')) {
                const existingBills = await BillsS.findByOrderId(primaryOrder.id || primaryOrder.Id);
                if (existingBills.length > 0) {
                    billRecord = existingBills[0];
                }
            }
            // If error creating bill, log but continue with PDF generation
            console.warn('Failed to create bill record:', billError.message);
        }

        // Tạo PDF
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Register fonts và lấy font names
        const fonts = registerFonts(doc);

        // Header
        doc.fontSize(24)
            .font(fonts.bold)
            .text('HÓA ĐƠN BÁN HÀNG', { align: 'center' })
            .moveDown(0.5);

        // Hiển thị order IDs
        if (orders.length === 1) {
            doc.fontSize(12)
                .font(fonts.regular)
                .text(`Mã đơn hàng: ${primaryOrder.id || primaryOrder.Id}`, { align: 'center' })
                .text(`Ngày: ${primaryOrder.date ? new Date(primaryOrder.date).toLocaleDateString('vi-VN') : 'N/A'}`, { align: 'center' })
                .moveDown(1);
        } else {
            // Multiple orders
            const orderIdsText = orders.map(o => o.id || o.Id).join(', ');
            doc.fontSize(12)
                .font(fonts.regular)
                .text(`Mã đơn hàng: ${orderIdsText}`, { align: 'center' })
                .text(`Số lượng đơn: ${orders.length}`, { align: 'center' })
                .text(`Ngày: ${primaryOrder.date ? new Date(primaryOrder.date).toLocaleDateString('vi-VN') : 'N/A'}`, { align: 'center' })
                .moveDown(1);
        }

        // Thông tin khách hàng (lấy từ order đầu tiên)
        doc.fontSize(14)
            .font(fonts.bold)
            .text('Thông tin khách hàng:', { continued: false })
            .font(fonts.regular)
            .fontSize(12)
            .text(`Tên: ${primaryOrder.customer_name || primaryOrder.customerName || 'N/A'}`, { indent: 20 })
            .text(`User ID: ${primaryOrder.user_id || primaryOrder.userId || 'N/A'}`, { indent: 20 })
            .moveDown(1);

        // Bảng sản phẩm
        doc.fontSize(14)
            .font(fonts.bold)
            .text('Chi tiết sản phẩm:', { continued: false })
            .moveDown(0.5);

        // Header của bảng
        const tableTop = doc.y;
        const itemHeight = 30;
        const pageWidth = 595.28 - 100; // A4 width - margins (50 left + 50 right)
        // Điều chỉnh column widths để fit trong page
        const colWidths = {
            stt: 35,        // STT column - giảm từ 40
            name: 250,      // Tên sản phẩm - tăng từ 200
            quantity: 60,   // SL - giảm từ 80
            unitPrice: 110, // Đơn giá - tăng từ 100
            subtotal: 120   // Thành tiền - tăng từ 100
        };

        // Verify total width fits
        const totalWidth = colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice + colWidths.subtotal;
        if (totalWidth > pageWidth) {
            // Scale down proportionally if needed
            const scale = pageWidth / totalWidth;
            Object.keys(colWidths).forEach(key => {
                colWidths[key] = Math.floor(colWidths[key] * scale);
            });
        }

        let y = tableTop;

        // Vẽ header với padding tốt hơn
        doc.fontSize(10)
            .font(fonts.bold)
            .rect(50, y, pageWidth, itemHeight)
            .stroke()
            .text('STT', 50 + 5, y + 8, { width: colWidths.stt - 10, align: 'center' })
            .text('Tên sản phẩm', 50 + colWidths.stt + 5, y + 8, { width: colWidths.name - 10 })
            .text('SL', 50 + colWidths.stt + colWidths.name + 5, y + 8, { width: colWidths.quantity - 10, align: 'center' })
            .text('Đơn giá', 50 + colWidths.stt + colWidths.name + colWidths.quantity + 5, y + 8, { width: colWidths.unitPrice - 10, align: 'right' })
            .text('Thành tiền', 50 + colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice + 5, y + 8, { width: colWidths.subtotal - 10, align: 'right' });

        y += itemHeight;

        // Vẽ các dòng sản phẩm
        doc.font(fonts.regular)
            .fontSize(10);

        let itemIndex = 0;
        billItems.forEach((item, index) => {
            // Kiểm tra nếu cần sang trang mới
            if (y + itemHeight > 750) {
                doc.addPage();
                y = 50;

                // Vẽ lại header với padding tốt hơn
                doc.font(fonts.bold)
                    .rect(50, y, pageWidth, itemHeight)
                    .stroke()
                    .text('STT', 50 + 5, y + 8, { width: colWidths.stt - 10, align: 'center' })
                    .text('Tên sản phẩm', 50 + colWidths.stt + 5, y + 8, { width: colWidths.name - 10 })
                    .text('SL', 50 + colWidths.stt + colWidths.name + 5, y + 8, { width: colWidths.quantity - 10, align: 'center' })
                    .text('Đơn giá', 50 + colWidths.stt + colWidths.name + colWidths.quantity + 5, y + 8, { width: colWidths.unitPrice - 10, align: 'right' })
                    .text('Thành tiền', 50 + colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice + 5, y + 8, { width: colWidths.subtotal - 10, align: 'right' });
                y += itemHeight;
                doc.font(fonts.regular);
            }

            // Vẽ dòng sản phẩm với padding tốt hơn
            itemIndex++;
            doc.rect(50, y, pageWidth, itemHeight)
                .stroke()
                .text(itemIndex.toString(), 50 + 5, y + 8, { width: colWidths.stt - 10, align: 'center' })
                .text(item.productName, 50 + colWidths.stt + 5, y + 8, { width: colWidths.name - 10 })
                .text(item.quantity.toString(), 50 + colWidths.stt + colWidths.name + 5, y + 8, { width: colWidths.quantity - 10, align: 'center' })
                .text(new Intl.NumberFormat('vi-VN').format(item.unitPrice) + ' đ', 50 + colWidths.stt + colWidths.name + colWidths.quantity + 5, y + 8, { width: colWidths.unitPrice - 10, align: 'right' })
                .text(new Intl.NumberFormat('vi-VN').format(item.subtotal) + ' đ', 50 + colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice + 5, y + 8, { width: colWidths.subtotal - 10, align: 'right' });

            y += itemHeight;
        });

        // Tổng tiền
        y += 10;
        // Đảm bảo tổng tiền không bị tràn trang
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        doc.fontSize(14)
            .font(fonts.bold)
            .text(`Tổng cộng: ${new Intl.NumberFormat('vi-VN').format(total)} đ`, 50, y, { align: 'right', width: pageWidth })
            .moveDown(2);

        // Footer - vẽ ở cuối trang hiện tại
        const currentPageBottom = doc.page.height - 50;
        doc.fontSize(10)
            .font(fonts.regular)
            .text('Cảm ơn quý khách đã sử dụng dịch vụ!', { align: 'center', y: currentPageBottom });

        return doc;
    }
};

module.exports = generateBillS;

