require('dotenv').config();
const db = require('../db');

/**
 * Script để thêm nhiều sản phẩm đa dạng vào database
 * Chạy: node server/scripts/seedMoreProducts.js
 */

async function seedMoreProducts() {
    console.log('\n🌱 Đang thêm sản phẩm vào database...\n');

    // Lấy danh sách suppliers hiện có
    const suppliersResult = await db.query('SELECT id FROM suppliers ORDER BY id');
    const supplierIds = suppliersResult.rows.map(s => s.id);
    
    if (supplierIds.length === 0) {
        console.error('❌ Không tìm thấy suppliers. Vui lòng chạy initDatabase.js trước.');
        process.exit(1);
    }

    // Phân bổ suppliers cho các loại sản phẩm
    const S001 = supplierIds[0] || 'S001'; // Xi Măng Hà Tiên
    const S002 = supplierIds[1] || 'S002'; // Gạch Đồng Tâm
    const S003 = supplierIds[2] || 'S003'; // Sắt Thép Hòa Phát
    const S004 = supplierIds[3] || 'S004'; // Gỗ An Cường
    const S005 = supplierIds[4] || 'S005'; // Ống Nước Bình Minh

    const products = [
        // XI MĂNG - Thêm nhiều loại hơn
        { id: 'P021', name: 'Xi Măng PCB30', type: 'Xi Măng', unit: 'Bao', number: 600, price: 75000, supplier_id: S001 },
        { id: 'P022', name: 'Xi Măng PCB50', type: 'Xi Măng', unit: 'Bao', number: 350, price: 105000, supplier_id: S001 },
        { id: 'P023', name: 'Xi Măng Pooc Lăng', type: 'Xi Măng', unit: 'Bao', number: 450, price: 88000, supplier_id: S001 },
        { id: 'P024', name: 'Xi Măng Nghi Sơn', type: 'Xi Măng', unit: 'Bao', number: 550, price: 82000, supplier_id: S001 },
        { id: 'P025', name: 'Xi Măng Holcim', type: 'Xi Măng', unit: 'Bao', number: 400, price: 90000, supplier_id: S001 },

        // GẠCH - Nhiều loại và kích thước
        { id: 'P026', name: 'Gạch Ống 2 Lỗ', type: 'Gạch', unit: 'Viên', number: 12000, price: 1000, supplier_id: S002 },
        { id: 'P027', name: 'Gạch Ống 8 Lỗ', type: 'Gạch', unit: 'Viên', number: 7000, price: 1800, supplier_id: S002 },
        { id: 'P028', name: 'Gạch Men 30x30', type: 'Gạch', unit: 'Thùng', number: 600, price: 450000, supplier_id: S002 },
        { id: 'P029', name: 'Gạch Men 40x40', type: 'Gạch', unit: 'Thùng', number: 550, price: 550000, supplier_id: S002 },
        { id: 'P030', name: 'Gạch Men 50x50', type: 'Gạch', unit: 'Thùng', number: 500, price: 650000, supplier_id: S002 },
        { id: 'P031', name: 'Gạch Men 100x100', type: 'Gạch', unit: 'Thùng', number: 300, price: 1500000, supplier_id: S002 },
        { id: 'P032', name: 'Gạch Lát Nền', type: 'Gạch', unit: 'm²', number: 2000, price: 120000, supplier_id: S002 },
        { id: 'P033', name: 'Gạch Ốp Tường', type: 'Gạch', unit: 'm²', number: 1800, price: 150000, supplier_id: S002 },

        // SẮT THÉP - Nhiều kích thước và loại
        { id: 'P034', name: 'Thép Phi 14', type: 'Sắt Thép', unit: 'Kg', number: 900, price: 22000, supplier_id: S003 },
        { id: 'P035', name: 'Thép Phi 16', type: 'Sắt Thép', unit: 'Kg', number: 800, price: 23000, supplier_id: S003 },
        { id: 'P036', name: 'Thép Phi 18', type: 'Sắt Thép', unit: 'Kg', number: 700, price: 24000, supplier_id: S003 },
        { id: 'P037', name: 'Thép Phi 20', type: 'Sắt Thép', unit: 'Kg', number: 600, price: 25000, supplier_id: S003 },
        { id: 'P038', name: 'Thép Phi 22', type: 'Sắt Thép', unit: 'Kg', number: 500, price: 26000, supplier_id: S003 },
        { id: 'P039', name: 'Thép Phi 25', type: 'Sắt Thép', unit: 'Kg', number: 400, price: 28000, supplier_id: S003 },
        { id: 'P040', name: 'Thép Tấm 3mm', type: 'Sắt Thép', unit: 'Tấm', number: 150, price: 850000, supplier_id: S003 },
        { id: 'P041', name: 'Thép Tấm 5mm', type: 'Sắt Thép', unit: 'Tấm', number: 120, price: 1200000, supplier_id: S003 },
        { id: 'P042', name: 'Thép Hộp 20x40', type: 'Sắt Thép', unit: 'Cây', number: 200, price: 180000, supplier_id: S003 },
        { id: 'P043', name: 'Thép Hộp 30x60', type: 'Sắt Thép', unit: 'Cây', number: 150, price: 280000, supplier_id: S003 },

        // GỖ - Nhiều loại gỗ
        { id: 'P044', name: 'Gỗ Thông Xanh', type: 'Gỗ', unit: 'm³', number: 90, price: 11000000, supplier_id: S004 },
        { id: 'P045', name: 'Gỗ Keo', type: 'Gỗ', unit: 'm³', number: 100, price: 8000000, supplier_id: S004 },
        { id: 'P046', name: 'Gỗ Xoan', type: 'Gỗ', unit: 'm³', number: 70, price: 13000000, supplier_id: S004 },
        { id: 'P047', name: 'Gỗ Lim', type: 'Gỗ', unit: 'm³', number: 50, price: 25000000, supplier_id: S004 },
        { id: 'P048', name: 'Gỗ Căm Xe', type: 'Gỗ', unit: 'm³', number: 60, price: 20000000, supplier_id: S004 },
        { id: 'P049', name: 'Ván Ép 18mm', type: 'Gỗ', unit: 'Tấm', number: 500, price: 450000, supplier_id: S004 },
        { id: 'P050', name: 'Ván Ép 20mm', type: 'Gỗ', unit: 'Tấm', number: 450, price: 520000, supplier_id: S004 },

        // ỐNG NƯỚC - Nhiều kích thước và loại
        { id: 'P051', name: 'Ống PVC D42', type: 'Ống Nước', unit: 'Cây', number: 180, price: 75000, supplier_id: S005 },
        { id: 'P052', name: 'Ống PVC D49', type: 'Ống Nước', unit: 'Cây', number: 150, price: 85000, supplier_id: S005 },
        { id: 'P053', name: 'Ống PVC D60', type: 'Ống Nước', unit: 'Cây', number: 120, price: 120000, supplier_id: S005 },
        { id: 'P054', name: 'Ống PPR D20', type: 'Ống Nước', unit: 'Cây', number: 200, price: 95000, supplier_id: S005 },
        { id: 'P055', name: 'Ống PPR D25', type: 'Ống Nước', unit: 'Cây', number: 180, price: 110000, supplier_id: S005 },
        { id: 'P056', name: 'Ống PPR D32', type: 'Ống Nước', unit: 'Cây', number: 150, price: 140000, supplier_id: S005 },
        { id: 'P057', name: 'Ống HDPE D90', type: 'Ống Nước', unit: 'Cây', number: 100, price: 280000, supplier_id: S005 },
        { id: 'P058', name: 'Co PVC 90 độ', type: 'Ống Nước', unit: 'Cái', number: 500, price: 15000, supplier_id: S005 },
        { id: 'P059', name: 'Tê PVC', type: 'Ống Nước', unit: 'Cái', number: 450, price: 18000, supplier_id: S005 },

        // CÁT ĐÁ - Nhiều loại
        { id: 'P060', name: 'Đá 1x2', type: 'Cát Đá', unit: 'm³', number: 200, price: 420000, supplier_id: S001 },
        { id: 'P061', name: 'Đá 2x4', type: 'Cát Đá', unit: 'm³', number: 180, price: 450000, supplier_id: S001 },
        { id: 'P062', name: 'Đá 4x6', type: 'Cát Đá', unit: 'm³', number: 150, price: 480000, supplier_id: S001 },
        { id: 'P063', name: 'Đá Mi Sàng', type: 'Cát Đá', unit: 'm³', number: 220, price: 400000, supplier_id: S001 },
        { id: 'P064', name: 'Cát Bê Tông', type: 'Cát Đá', unit: 'm³', number: 300, price: 380000, supplier_id: S001 },
        { id: 'P065', name: 'Cát Vàng', type: 'Cát Đá', unit: 'm³', number: 250, price: 360000, supplier_id: S001 },
        { id: 'P066', name: 'Cát Đen', type: 'Cát Đá', unit: 'm³', number: 280, price: 320000, supplier_id: S001 },
        { id: 'P067', name: 'Sỏi Trang Trí', type: 'Cát Đá', unit: 'm³', number: 100, price: 550000, supplier_id: S001 },

        // SƠN - Loại mới
        { id: 'P068', name: 'Sơn Nước Ngoại Thất', type: 'Sơn', unit: 'Thùng', number: 300, price: 850000, supplier_id: S002 },
        { id: 'P069', name: 'Sơn Nước Nội Thất', type: 'Sơn', unit: 'Thùng', number: 400, price: 750000, supplier_id: S002 },
        { id: 'P070', name: 'Sơn Dầu', type: 'Sơn', unit: 'Thùng', number: 250, price: 950000, supplier_id: S002 },
        { id: 'P071', name: 'Sơn Chống Thấm', type: 'Sơn', unit: 'Thùng', number: 200, price: 1200000, supplier_id: S002 },
        { id: 'P072', name: 'Sơn Chống Rỉ', type: 'Sơn', unit: 'Thùng', number: 180, price: 1100000, supplier_id: S002 },
        { id: 'P073', name: 'Sơn Bóng', type: 'Sơn', unit: 'Thùng', number: 220, price: 680000, supplier_id: S002 },
        { id: 'P074', name: 'Sơn Màu Gỗ', type: 'Sơn', unit: 'Thùng', number: 150, price: 880000, supplier_id: S002 },

        // THIẾT BỊ ĐIỆN - Loại mới
        { id: 'P075', name: 'Dây Điện 2.5mm²', type: 'Thiết Bị Điện', unit: 'Cuộn', number: 100, price: 450000, supplier_id: S003 },
        { id: 'P076', name: 'Dây Điện 4mm²', type: 'Thiết Bị Điện', unit: 'Cuộn', number: 80, price: 650000, supplier_id: S003 },
        { id: 'P077', name: 'Dây Điện 6mm²', type: 'Thiết Bị Điện', unit: 'Cuộn', number: 60, price: 950000, supplier_id: S003 },
        { id: 'P078', name: 'Ổ Cắm Điện', type: 'Thiết Bị Điện', unit: 'Cái', number: 500, price: 45000, supplier_id: S003 },
        { id: 'P079', name: 'Công Tắc Điện', type: 'Thiết Bị Điện', unit: 'Cái', number: 500, price: 35000, supplier_id: S003 },
        { id: 'P080', name: 'Bóng Đèn LED 12W', type: 'Thiết Bị Điện', unit: 'Cái', number: 1000, price: 85000, supplier_id: S003 },
        { id: 'P081', name: 'Bóng Đèn LED 18W', type: 'Thiết Bị Điện', unit: 'Cái', number: 800, price: 120000, supplier_id: S003 },
        { id: 'P082', name: 'Quạt Trần', type: 'Thiết Bị Điện', unit: 'Cái', number: 150, price: 850000, supplier_id: S003 },
        { id: 'P083', name: 'Máy Nước Nóng', type: 'Thiết Bị Điện', unit: 'Cái', number: 100, price: 2500000, supplier_id: S003 },

        // VẬT LIỆU CÁCH NHIỆT - Loại mới
        { id: 'P084', name: 'Xốp Cách Nhiệt 2cm', type: 'Vật Liệu Cách Nhiệt', unit: 'm²', number: 500, price: 120000, supplier_id: S004 },
        { id: 'P085', name: 'Xốp Cách Nhiệt 5cm', type: 'Vật Liệu Cách Nhiệt', unit: 'm²', number: 400, price: 250000, supplier_id: S004 },
        { id: 'P086', name: 'Bông Thủy Tinh', type: 'Vật Liệu Cách Nhiệt', unit: 'm²', number: 350, price: 180000, supplier_id: S004 },
        { id: 'P087', name: 'Tấm Cách Nhiệt', type: 'Vật Liệu Cách Nhiệt', unit: 'Tấm', number: 200, price: 450000, supplier_id: S004 },
        { id: 'P088', name: 'Màng Chống Thấm', type: 'Vật Liệu Cách Nhiệt', unit: 'm²', number: 600, price: 85000, supplier_id: S004 },

        // PHỤ KIỆN XÂY DỰNG - Loại mới
        { id: 'P089', name: 'Đinh 3cm', type: 'Phụ Kiện Xây Dựng', unit: 'Kg', number: 500, price: 25000, supplier_id: S005 },
        { id: 'P090', name: 'Đinh 5cm', type: 'Phụ Kiện Xây Dựng', unit: 'Kg', number: 450, price: 28000, supplier_id: S005 },
        { id: 'P091', name: 'Vít Gỗ', type: 'Phụ Kiện Xây Dựng', unit: 'Hộp', number: 300, price: 120000, supplier_id: S005 },
        { id: 'P092', name: 'Vít Tường', type: 'Phụ Kiện Xây Dựng', unit: 'Hộp', number: 300, price: 95000, supplier_id: S005 },
        { id: 'P093', name: 'Keo Dán Gạch', type: 'Phụ Kiện Xây Dựng', unit: 'Bao', number: 400, price: 180000, supplier_id: S005 },
        { id: 'P094', name: 'Keo Silicon', type: 'Phụ Kiện Xây Dựng', unit: 'Tuýp', number: 500, price: 45000, supplier_id: S005 },
        { id: 'P095', name: 'Băng Keo Dán', type: 'Phụ Kiện Xây Dựng', unit: 'Cuộn', number: 600, price: 35000, supplier_id: S005 },
        { id: 'P096', name: 'Lưới Thép', type: 'Phụ Kiện Xây Dựng', unit: 'm²', number: 400, price: 85000, supplier_id: S005 },
        { id: 'P097', name: 'Lưới Nhựa', type: 'Phụ Kiện Xây Dựng', unit: 'm²', number: 500, price: 65000, supplier_id: S005 },

        // VẬT LIỆU HOÀN THIỆN - Loại mới
        { id: 'P098', name: 'Gạch Ốp Lát', type: 'Vật Liệu Hoàn Thiện', unit: 'm²', number: 1500, price: 180000, supplier_id: S002 },
        { id: 'P099', name: 'Đá Granite', type: 'Vật Liệu Hoàn Thiện', unit: 'm²', number: 200, price: 850000, supplier_id: S002 },
        { id: 'P100', name: 'Đá Marble', type: 'Vật Liệu Hoàn Thiện', unit: 'm²', number: 150, price: 1200000, supplier_id: S002 },
        { id: 'P101', name: 'Gỗ Laminat', type: 'Vật Liệu Hoàn Thiện', unit: 'm²', number: 800, price: 350000, supplier_id: S004 },
        { id: 'P102', name: 'Gỗ Công Nghiệp', type: 'Vật Liệu Hoàn Thiện', unit: 'm²', number: 700, price: 420000, supplier_id: S004 },
        { id: 'P103', name: 'Trần Thạch Cao', type: 'Vật Liệu Hoàn Thiện', unit: 'm²', number: 600, price: 180000, supplier_id: S002 },
        { id: 'P104', name: 'Tấm Thạch Cao', type: 'Vật Liệu Hoàn Thiện', unit: 'Tấm', number: 500, price: 250000, supplier_id: S002 },

        // THIẾT BỊ VỆ SINH - Loại mới
        { id: 'P105', name: 'Bồn Cầu', type: 'Thiết Bị Vệ Sinh', unit: 'Cái', number: 100, price: 2500000, supplier_id: S005 },
        { id: 'P106', name: 'Lavabo', type: 'Thiết Bị Vệ Sinh', unit: 'Cái', number: 120, price: 1800000, supplier_id: S005 },
        { id: 'P107', name: 'Vòi Sen', type: 'Thiết Bị Vệ Sinh', unit: 'Bộ', number: 150, price: 850000, supplier_id: S005 },
        { id: 'P108', name: 'Vòi Nước', type: 'Thiết Bị Vệ Sinh', unit: 'Cái', number: 200, price: 450000, supplier_id: S005 },
        { id: 'P109', name: 'Gương Phòng Tắm', type: 'Thiết Bị Vệ Sinh', unit: 'Cái', number: 80, price: 650000, supplier_id: S005 },

        // VẬT LIỆU CHỐNG THẤM - Loại mới
        { id: 'P110', name: 'Sika Chống Thấm', type: 'Vật Liệu Chống Thấm', unit: 'Thùng', number: 150, price: 1500000, supplier_id: S001 },
        { id: 'P111', name: 'Bitum Chống Thấm', type: 'Vật Liệu Chống Thấm', unit: 'Cuộn', number: 100, price: 850000, supplier_id: S001 },
        { id: 'P112', name: 'Màng PE Chống Thấm', type: 'Vật Liệu Chống Thấm', unit: 'm²', number: 500, price: 120000, supplier_id: S001 },
    ];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const product of products) {
        try {
            const result = await db.query(
                `INSERT INTO products(id, name, type, unit, number, price, supplier_id, actor)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8) 
                 ON CONFLICT(id) DO NOTHING
                 RETURNING *`,
                [product.id, product.name, product.type, product.unit, product.number, product.price, product.supplier_id, 'system']
            );
            
            if (result.rows.length > 0) {
                console.log(`✅ Đã thêm: ${product.name} (${product.id})`);
                successCount++;
            } else {
                console.log(`⏭️  Đã tồn tại: ${product.name} (${product.id})`);
                skipCount++;
            }
        } catch (error) {
            console.error(`❌ Lỗi thêm ${product.name} (${product.id}):`, error.message);
            errorCount++;
        }
    }

    console.log('\n📊 Tổng kết:');
    console.log(`   ✅ Thêm thành công: ${successCount} sản phẩm`);
    console.log(`   ⏭️  Đã tồn tại: ${skipCount} sản phẩm`);
    console.log(`   ❌ Lỗi: ${errorCount} sản phẩm`);
    console.log(`   📦 Tổng cộng: ${products.length} sản phẩm\n`);

    // Đóng pool connection
    if (db.pool) {
        await db.pool.end();
    }
    process.exit(0);
}

// Chạy script
seedMoreProducts().catch(error => {
    console.error('❌ Lỗi khi chạy script:', error);
    process.exit(1);
});

