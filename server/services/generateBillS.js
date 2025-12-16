const PDFDocument = require('pdfkit');
const OrdersM = require('../models/ordersM');
const OrderDetailsM = require('../models/orderDetailsM');
const ProductsM = require('../models/productsM');

const generateBillS = {
    generateBill: async (orderId, selectedProductIds = null) => {
        // Lấy thông tin order
        const order = await OrdersM.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Lấy tất cả order details
        let orderDetails = await OrderDetailsM.findByOrderId(orderId);
        
        // Nếu có chọn sản phẩm cụ thể, filter lại
        // Handle both pid/product_id for compatibility
        if (selectedProductIds && selectedProductIds.length > 0) {
            orderDetails = orderDetails.filter(od => {
                const productId = od.pid || od.product_id;
                return selectedProductIds.includes(productId);
            });
        }

        if (orderDetails.length === 0) {
            throw new Error('No products found in this order');
        }

        // Lấy thông tin sản phẩm cho mỗi order detail
        const billItems = await Promise.all(
            orderDetails.map(async (od) => {
                // Handle both pid/product_id for compatibility
                const productId = od.pid || od.product_id;
                const product = await ProductsM.findById(productId);
                return {
                    productId: productId,
                    productName: product ? product.name : 'Unknown Product',
                    quantity: od.number || 0,
                    unitPrice: product ? (product.price || 0) : 0,
                    note: od.note || '',
                    subtotal: (od.number || 0) * (product ? (product.price || 0) : 0)
                };
            })
        );

        // Tính tổng tiền
        const total = billItems.reduce((sum, item) => sum + item.subtotal, 0);

        // Tạo PDF
        const doc = new PDFDocument({ 
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('HÓA ĐƠN BÁN HÀNG', { align: 'center' })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Mã đơn hàng: ${order.id}`, { align: 'center' })
           .text(`Ngày: ${order.date ? new Date(order.date).toLocaleDateString('vi-VN') : 'N/A'}`, { align: 'center' })
           .moveDown(1);

        // Thông tin khách hàng
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Thông tin khách hàng:', { continued: false })
           .font('Helvetica')
           .fontSize(12)
           .text(`Tên: ${order.customer_name || 'N/A'}`, { indent: 20 })
           .text(`User ID: ${order.user_id || 'N/A'}`, { indent: 20 })
           .moveDown(1);

        // Bảng sản phẩm
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Chi tiết sản phẩm:', { continued: false })
           .moveDown(0.5);

        // Header của bảng
        const tableTop = doc.y;
        const itemHeight = 30;
        const pageWidth = 595.28 - 100; // A4 width - margins
        const colWidths = {
            stt: 40,
            name: 200,
            quantity: 80,
            unitPrice: 100,
            subtotal: 100
        };

        let y = tableTop;
        
        // Vẽ header
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .rect(50, y, pageWidth, itemHeight)
           .stroke()
           .text('STT', 50 + 10, y + 8, { width: colWidths.stt - 20, align: 'center' })
           .text('Tên sản phẩm', 50 + colWidths.stt, y + 8, { width: colWidths.name - 10 })
           .text('SL', 50 + colWidths.stt + colWidths.name, y + 8, { width: colWidths.quantity - 10, align: 'center' })
           .text('Đơn giá', 50 + colWidths.stt + colWidths.name + colWidths.quantity, y + 8, { width: colWidths.unitPrice - 10, align: 'right' })
           .text('Thành tiền', 50 + colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice, y + 8, { width: colWidths.subtotal - 10, align: 'right' });

        y += itemHeight;

        // Vẽ các dòng sản phẩm
        doc.font('Helvetica')
           .fontSize(10);
        
        billItems.forEach((item, index) => {
            // Kiểm tra nếu cần sang trang mới
            if (y + itemHeight > 750) {
                doc.addPage();
                y = 50;
                
                // Vẽ lại header
                doc.font('Helvetica-Bold')
                   .rect(50, y, pageWidth, itemHeight)
                   .stroke()
                   .text('STT', 50 + 10, y + 8, { width: colWidths.stt - 20, align: 'center' })
                   .text('Tên sản phẩm', 50 + colWidths.stt, y + 8, { width: colWidths.name - 10 })
                   .text('SL', 50 + colWidths.stt + colWidths.name, y + 8, { width: colWidths.quantity - 10, align: 'center' })
                   .text('Đơn giá', 50 + colWidths.stt + colWidths.name + colWidths.quantity, y + 8, { width: colWidths.unitPrice - 10, align: 'right' })
                   .text('Thành tiền', 50 + colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice, y + 8, { width: colWidths.subtotal - 10, align: 'right' });
                y += itemHeight;
                doc.font('Helvetica');
            }

            // Vẽ dòng sản phẩm
            doc.rect(50, y, pageWidth, itemHeight)
               .stroke()
               .text((index + 1).toString(), 50 + 10, y + 8, { width: colWidths.stt - 20, align: 'center' })
               .text(item.productName, 50 + colWidths.stt, y + 8, { width: colWidths.name - 10 })
               .text(item.quantity.toString(), 50 + colWidths.stt + colWidths.name, y + 8, { width: colWidths.quantity - 10, align: 'center' })
               .text(new Intl.NumberFormat('vi-VN').format(item.unitPrice) + ' đ', 50 + colWidths.stt + colWidths.name + colWidths.quantity, y + 8, { width: colWidths.unitPrice - 10, align: 'right' })
               .text(new Intl.NumberFormat('vi-VN').format(item.subtotal) + ' đ', 50 + colWidths.stt + colWidths.name + colWidths.quantity + colWidths.unitPrice, y + 8, { width: colWidths.subtotal - 10, align: 'right' });
            
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
           .font('Helvetica-Bold')
           .text(`Tổng cộng: ${new Intl.NumberFormat('vi-VN').format(total)} đ`, 50, y, { align: 'right', width: pageWidth })
           .moveDown(2);

        // Footer - vẽ ở cuối trang hiện tại
        const currentPageBottom = doc.page.height - 50;
        doc.fontSize(10)
           .font('Helvetica')
           .text('Cảm ơn quý khách đã sử dụng dịch vụ!', { align: 'center', y: currentPageBottom });

        return doc;
    }
};

module.exports = generateBillS;

