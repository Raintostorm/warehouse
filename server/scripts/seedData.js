require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcrypt');

/**
 * Script seed data mẫu
 * Chạy riêng để thêm data mà không tạo lại tables
 */

async function checkHasData() {
    try {
        const userCount = await db.query('SELECT COUNT(*) as count FROM users');
        const productCount = await db.query('SELECT COUNT(*) as count FROM products');
        const orderCount = await db.query('SELECT COUNT(*) as count FROM orders');
        
        return {
            hasUsers: parseInt(userCount.rows[0].count) > 0,
            hasProducts: parseInt(productCount.rows[0].count) > 0,
            hasOrders: parseInt(orderCount.rows[0].count) > 0,
            hasAnyData: parseInt(userCount.rows[0].count) > 0 || 
                       parseInt(productCount.rows[0].count) > 0 || 
                       parseInt(orderCount.rows[0].count) > 0
        };
    } catch (error) {
        return {
            hasUsers: false,
            hasProducts: false,
            hasOrders: false,
            hasAnyData: false
        };
    }
}

async function seedData() {
    console.log('🌱 Đang kiểm tra data hiện có...\n');

    // Check if database already has data
    const dataCheck = await checkHasData();
    
    if (dataCheck.hasAnyData) {
        console.log('ℹ️  Database đã có data:');
        if (dataCheck.hasUsers) {
            const userCount = await db.query('SELECT COUNT(*) as count FROM users');
            console.log(`   - Users: ${userCount.rows[0].count} records`);
        }
        if (dataCheck.hasProducts) {
            const productCount = await db.query('SELECT COUNT(*) as count FROM products');
            console.log(`   - Products: ${productCount.rows[0].count} records`);
        }
        if (dataCheck.hasOrders) {
            const orderCount = await db.query('SELECT COUNT(*) as count FROM orders');
            console.log(`   - Orders: ${orderCount.rows[0].count} records`);
        }
        console.log('\n✅ Giữ nguyên data hiện có. Bỏ qua seed data.\n');
        return;
    }

    console.log('📝 Database trống, bắt đầu seed data mẫu...\n');

    try {
        // 1. Seed Roles
        const roles = [
            { id: 'R001', name: 'Admin' },
            { id: 'R002', name: 'Manager' },
            { id: 'R003', name: 'Staff' }
        ];

        for (const role of roles) {
            try {
                await db.query(
                    'INSERT INTO roles (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
                    [role.id, role.name]
                );
                console.log(`✅ Đã seed role: ${role.name}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed role ${role.name}:`, error.message);
                }
            }
        }

        // 2. Seed Users
        const users = [
            {
                id: 'U001',
                fullname: 'Nguyễn Văn Admin',
                email: 'admin@example.com',
                password: await bcrypt.hash('admin123', 10),
                number: '0912345678',
                address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
                actor: 'system'
            },
            {
                id: 'U002',
                fullname: 'Trần Thị Manager',
                email: 'manager@example.com',
                password: await bcrypt.hash('manager123', 10),
                number: '0923456789',
                address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
                actor: 'system'
            },
            {
                id: 'U003',
                fullname: 'Lê Văn Nhân Viên',
                email: 'staff1@example.com',
                password: await bcrypt.hash('staff123', 10),
                number: '0934567890',
                address: '789 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
                actor: 'system'
            },
            {
                id: 'U004',
                fullname: 'Phạm Thị Hoa',
                email: 'staff2@example.com',
                password: await bcrypt.hash('staff123', 10),
                number: '0945678901',
                address: '321 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
                actor: 'system'
            },
            {
                id: 'U005',
                fullname: 'Hoàng Văn Đức',
                email: 'staff3@example.com',
                password: await bcrypt.hash('staff123', 10),
                number: '0956789012',
                address: '654 Đường Lý Thường Kiệt, Quận 11, TP.HCM',
                actor: 'system'
            }
        ];

        for (const user of users) {
            try {
                await db.query(
                    `INSERT INTO users (id, fullname, email, password, number, address, actor) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) 
                     ON CONFLICT (id) DO NOTHING`,
                    [user.id, user.fullname, user.email, user.password, user.number, user.address, user.actor]
                );
                console.log(`✅ Đã seed user: ${user.email}`);

                // Assign roles
                if (user.id === 'U001') {
                    await db.query(
                        'INSERT INTO user_roles (u_id, r_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [user.id, 'R001']
                    );
                } else if (user.id === 'U002') {
                    await db.query(
                        'INSERT INTO user_roles (u_id, r_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [user.id, 'R002']
                    );
                } else {
                    // Staff users
                    await db.query(
                        'INSERT INTO user_roles (u_id, r_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [user.id, 'R003']
                    );
                }
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed user:`, error.message);
                }
            }
        }

        // 3. Seed Suppliers - Nhà cung cấp vật liệu xây dựng
        const suppliers = [
            { id: 'S001', name: 'Công ty Xi Măng Hà Tiên', address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM', phone: '02812345678' },
            { id: 'S002', name: 'Công ty Gạch Đồng Tâm', address: '456 Đường Lê Văn Việt, Quận 9, TP.HCM', phone: '02823456789' },
            { id: 'S003', name: 'Công ty Sắt Thép Hòa Phát', address: '789 Đường Võ Văn Tần, Quận 3, TP.HCM', phone: '02834567890' },
            { id: 'S004', name: 'Công ty Gỗ An Cường', address: '321 Đường Trường Chinh, Quận 12, TP.HCM', phone: '02845678901' },
            { id: 'S005', name: 'Công ty Ống Nước Bình Minh', address: '654 Đường Cộng Hòa, Quận Tân Bình, TP.HCM', phone: '02856789012' }
        ];

        for (const supplier of suppliers) {
            try {
                await db.query(
                    'INSERT INTO suppliers (id, name, address, phone) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                    [supplier.id, supplier.name, supplier.address, supplier.phone]
                );
                console.log(`✅ Đã seed supplier: ${supplier.name}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed supplier:`, error.message);
                }
            }
        }

        // 4. Seed Products - Vật liệu xây dựng
        const products = [
            { id: 'P001', name: 'Xi Măng PCB40', type: 'Xi Măng', unit: 'Bao', number: 500, price: 85000, supplier_id: 'S001' },
            { id: 'P002', name: 'Gạch Ống 4 Lỗ', type: 'Gạch', unit: 'Viên', number: 10000, price: 1200, supplier_id: 'S002' },
            { id: 'P003', name: 'Thép Phi 6', type: 'Sắt Thép', unit: 'Kg', number: 2000, price: 18000, supplier_id: 'S003' },
            { id: 'P004', name: 'Thép Phi 8', type: 'Sắt Thép', unit: 'Kg', number: 1500, price: 19000, supplier_id: 'S003' },
            { id: 'P005', name: 'Gỗ Thông', type: 'Gỗ', unit: 'm³', number: 100, price: 12000000, supplier_id: 'S004' },
            { id: 'P006', name: 'Ống PVC D21', type: 'Ống Nước', unit: 'Cây', number: 300, price: 45000, supplier_id: 'S005' },
            { id: 'P007', name: 'Cát Xây Dựng', type: 'Cát Đá', unit: 'm³', number: 200, price: 350000, supplier_id: 'S001' },
            { id: 'P008', name: 'Đá 1x2', type: 'Cát Đá', unit: 'm³', number: 150, price: 420000, supplier_id: 'S001' },
            { id: 'P009', name: 'Gạch Men 60x60', type: 'Gạch', unit: 'Thùng', number: 500, price: 850000, supplier_id: 'S002' },
            { id: 'P010', name: 'Xi Măng Trắng', type: 'Xi Măng', unit: 'Bao', number: 200, price: 120000, supplier_id: 'S001' },
            { id: 'P011', name: 'Thép Phi 10', type: 'Sắt Thép', unit: 'Kg', number: 1200, price: 20000, supplier_id: 'S003' },
            { id: 'P012', name: 'Thép Phi 12', type: 'Sắt Thép', unit: 'Kg', number: 1000, price: 21000, supplier_id: 'S003' },
            { id: 'P013', name: 'Gạch Ống 6 Lỗ', type: 'Gạch', unit: 'Viên', number: 8000, price: 1500, supplier_id: 'S002' },
            { id: 'P014', name: 'Gạch Men 80x80', type: 'Gạch', unit: 'Thùng', number: 400, price: 1200000, supplier_id: 'S002' },
            { id: 'P015', name: 'Ống PVC D27', type: 'Ống Nước', unit: 'Cây', number: 250, price: 55000, supplier_id: 'S005' },
            { id: 'P016', name: 'Ống PVC D34', type: 'Ống Nước', unit: 'Cây', number: 200, price: 65000, supplier_id: 'S005' },
            { id: 'P017', name: 'Gỗ Sồi', type: 'Gỗ', unit: 'm³', number: 80, price: 15000000, supplier_id: 'S004' },
            { id: 'P018', name: 'Đá 0x4', type: 'Cát Đá', unit: 'm³', number: 180, price: 380000, supplier_id: 'S001' },
            { id: 'P019', name: 'Cát San Lấp', type: 'Cát Đá', unit: 'm³', number: 250, price: 320000, supplier_id: 'S001' },
            { id: 'P020', name: 'Xi Măng Đa Dụng', type: 'Xi Măng', unit: 'Bao', number: 400, price: 95000, supplier_id: 'S001' }
        ];

        for (const product of products) {
            try {
                await db.query(
                    `INSERT INTO products (id, name, type, unit, number, price, supplier_id) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
                    [product.id, product.name, product.type, product.unit, product.number, product.price, product.supplier_id]
                );
                console.log(`✅ Đã seed product: ${product.name}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed product:`, error.message);
                }
            }
        }

        // 5. Seed Warehouses - Vật liệu xây dựng
        const warehouses = [
            { 
                id: 'W001', 
                name: 'Kho Xi Măng', 
                address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM', 
                size: 1500, 
                type: 'Kho Xi Măng', 
                image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
                started_date: '2024-01-01' 
            },
            { 
                id: 'W002', 
                name: 'Kho Gạch', 
                address: '456 Đường Lê Văn Việt, Quận 9, TP.HCM', 
                size: 2000, 
                type: 'Kho Gạch', 
                image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
                started_date: '2024-01-01' 
            },
            { 
                id: 'W003', 
                name: 'Kho Sắt Thép', 
                address: '789 Đường Võ Văn Tần, Quận 3, TP.HCM', 
                size: 1800, 
                type: 'Kho Sắt Thép', 
                image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
                started_date: '2024-01-01' 
            },
            { 
                id: 'W004', 
                name: 'Kho Gỗ', 
                address: '321 Đường Trường Chinh, Quận 12, TP.HCM', 
                size: 1200, 
                type: 'Kho Gỗ', 
                image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
                started_date: '2024-01-01' 
            },
            { 
                id: 'W005', 
                name: 'Kho Ống Nước', 
                address: '654 Đường Cộng Hòa, Quận Tân Bình, TP.HCM', 
                size: 1000, 
                type: 'Kho Ống Nước', 
                image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
                started_date: '2024-01-01' 
            },
            { 
                id: 'W006', 
                name: 'Kho Cát Đá', 
                address: '987 Đường Hà Huy Giáp, Quận 12, TP.HCM', 
                size: 3000, 
                type: 'Kho Cát Đá', 
                image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
                started_date: '2024-01-01' 
            }
        ];

        for (const warehouse of warehouses) {
            try {
                await db.query(
                    `INSERT INTO warehouses (id, name, address, size, type, image, started_date) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
                    [warehouse.id, warehouse.name, warehouse.address, warehouse.size, warehouse.type, warehouse.image, warehouse.started_date]
                );
                console.log(`✅ Đã seed warehouse: ${warehouse.name} (${warehouse.type})`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed warehouse:`, error.message);
                }
            }
        }

        // 6. Seed Sample Orders
        const today = new Date();
        const orders = [
            {
                id: 'ORD001',
                type: 'Sale',
                date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U001',
                customer_name: 'Công ty Xây Dựng ABC',
                total: 4250000
            },
            {
                id: 'ORD002',
                type: 'Import',
                date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U002',
                customer_name: 'Công ty Xi Măng Hà Tiên',
                total: 8500000
            },
            {
                id: 'ORD003',
                type: 'Sale',
                date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U003',
                customer_name: 'Công ty Xây Dựng XYZ',
                total: 12000000
            },
            {
                id: 'ORD004',
                type: 'Sale',
                date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U001',
                customer_name: 'Nhà thầu DEF',
                total: 6800000
            },
            {
                id: 'ORD005',
                type: 'Import',
                date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U002',
                customer_name: 'Công ty Sắt Thép Hòa Phát',
                total: 15000000
            },
            {
                id: 'ORD006',
                type: 'Sale',
                date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U004',
                customer_name: 'Công ty Xây Dựng GHI',
                total: 9500000
            },
            {
                id: 'ORD007',
                type: 'Sale',
                date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U001',
                customer_name: 'Nhà thầu JKL',
                total: 5500000
            },
            {
                id: 'ORD008',
                type: 'Sale',
                date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                user_id: 'U005',
                customer_name: 'Công ty Xây Dựng MNO',
                total: 7800000
            },
            {
                id: 'ORD009',
                type: 'Import',
                date: today.toISOString().split('T')[0],
                user_id: 'U002',
                customer_name: 'Công ty Gạch Đồng Tâm',
                total: 12000000
            },
            {
                id: 'ORD010',
                type: 'Sale',
                date: today.toISOString().split('T')[0],
                user_id: 'U003',
                customer_name: 'Công ty Xây Dựng PQR',
                total: 11000000
            }
        ];

        for (const order of orders) {
            try {
                await db.query(
                    `INSERT INTO orders (id, type, date, user_id, customer_name, total) 
                     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
                    [order.id, order.type, order.date, order.user_id, order.customer_name, order.total]
                );
                console.log(`✅ Đã seed order: ${order.id}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed order:`, error.message);
                }
            }
        }

        // 7. Seed Order Details
        const orderDetails = [
            { order_id: 'ORD001', product_id: 'P001', number: 50, note: 'Đơn hàng lớn' },
            { order_id: 'ORD001', product_id: 'P002', number: 300, note: '' },
            { order_id: 'ORD001', product_id: 'P007', number: 10, note: '' },
            { order_id: 'ORD002', product_id: 'P001', number: 100, note: 'Nhập kho' },
            { order_id: 'ORD002', product_id: 'P010', number: 50, note: '' },
            { order_id: 'ORD003', product_id: 'P003', number: 500, note: '' },
            { order_id: 'ORD003', product_id: 'P004', number: 300, note: '' },
            { order_id: 'ORD003', product_id: 'P011', number: 200, note: '' },
            { order_id: 'ORD004', product_id: 'P005', number: 5, note: 'Gỗ chất lượng cao' },
            { order_id: 'ORD004', product_id: 'P017', number: 3, note: '' },
            { order_id: 'ORD005', product_id: 'P003', number: 800, note: 'Nhập kho sắt thép' },
            { order_id: 'ORD005', product_id: 'P004', number: 600, note: '' },
            { order_id: 'ORD005', product_id: 'P012', number: 400, note: '' },
            { order_id: 'ORD006', product_id: 'P009', number: 10, note: '' },
            { order_id: 'ORD006', product_id: 'P014', number: 8, note: 'Gạch men cao cấp' },
            { order_id: 'ORD007', product_id: 'P006', number: 50, note: '' },
            { order_id: 'ORD007', product_id: 'P015', number: 30, note: '' },
            { order_id: 'ORD007', product_id: 'P016', number: 20, note: '' },
            { order_id: 'ORD008', product_id: 'P007', number: 20, note: '' },
            { order_id: 'ORD008', product_id: 'P008', number: 15, note: '' },
            { order_id: 'ORD008', product_id: 'P018', number: 12, note: '' },
            { order_id: 'ORD009', product_id: 'P002', number: 5000, note: 'Nhập kho gạch' },
            { order_id: 'ORD009', product_id: 'P013', number: 3000, note: '' },
            { order_id: 'ORD010', product_id: 'P001', number: 80, note: '' },
            { order_id: 'ORD010', product_id: 'P003', number: 400, note: '' },
            { order_id: 'ORD010', product_id: 'P007', number: 15, note: '' }
        ];

        for (const od of orderDetails) {
            try {
                await db.query(
                    `INSERT INTO order_details (order_id, product_id, number, note) 
                     VALUES ($1, $2, $3, $4) ON CONFLICT (order_id, product_id) DO NOTHING`,
                    [od.order_id, od.product_id, od.number, od.note]
                );
                console.log(`✅ Đã seed order detail: ${od.order_id} - ${od.product_id}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed order detail:`, error.message);
                }
            }
        }

        // 8. Seed Product Details (Phân bổ sản phẩm vào kho)
        const productDetails = [
            { pid: 'P001', wid: 'W001', number: 300, note: 'Kho chính' },
            { pid: 'P001', wid: 'W006', number: 200, note: 'Kho dự trữ' },
            { pid: 'P002', wid: 'W002', number: 6000, note: '' },
            { pid: 'P002', wid: 'W006', number: 4000, note: '' },
            { pid: 'P003', wid: 'W003', number: 1200, note: '' },
            { pid: 'P003', wid: 'W006', number: 800, note: '' },
            { pid: 'P004', wid: 'W003', number: 900, note: '' },
            { pid: 'P004', wid: 'W006', number: 600, note: '' },
            { pid: 'P005', wid: 'W004', number: 60, note: '' },
            { pid: 'P005', wid: 'W006', number: 40, note: '' },
            { pid: 'P006', wid: 'W005', number: 200, note: '' },
            { pid: 'P006', wid: 'W006', number: 100, note: '' },
            { pid: 'P007', wid: 'W006', number: 150, note: '' },
            { pid: 'P007', wid: 'W001', number: 50, note: '' },
            { pid: 'P008', wid: 'W006', number: 100, note: '' },
            { pid: 'P008', wid: 'W001', number: 50, note: '' },
            { pid: 'P009', wid: 'W002', number: 300, note: '' },
            { pid: 'P009', wid: 'W006', number: 200, note: '' },
            { pid: 'P010', wid: 'W001', number: 150, note: '' },
            { pid: 'P010', wid: 'W006', number: 50, note: '' }
        ];

        for (const pd of productDetails) {
            try {
                await db.query(
                    `INSERT INTO product_details (pid, wid, number, note, updated_at) 
                     VALUES ($1, $2, $3, $4, CURRENT_DATE) ON CONFLICT (pid, wid) DO NOTHING`,
                    [pd.pid, pd.wid, pd.number, pd.note]
                );
                console.log(`✅ Đã seed product detail: ${pd.pid} - ${pd.wid}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed product detail:`, error.message);
                }
            }
        }

        // 9. Seed Warehouse Management
        const warehouseManagement = [
            { wid: 'W001', uid: 'U001', action: 'Nhập kho', date: '2024-01-15', note: 'Kiểm kê định kỳ' },
            { wid: 'W002', uid: 'U002', action: 'Xuất kho', date: '2024-01-16', note: 'Xuất cho đơn hàng' },
            { wid: 'W003', uid: 'U003', action: 'Kiểm kê', date: '2024-01-17', note: 'Kiểm tra tồn kho' },
            { wid: 'W004', uid: 'U001', action: 'Nhập kho', date: '2024-01-18', note: 'Nhập gỗ mới' },
            { wid: 'W005', uid: 'U004', action: 'Xuất kho', date: '2024-01-19', note: '' },
            { wid: 'W006', uid: 'U002', action: 'Kiểm kê', date: '2024-01-20', note: 'Kiểm tra toàn bộ' }
        ];

        for (const wm of warehouseManagement) {
            try {
                await db.query(
                    `INSERT INTO warehouse_management (wid, uid, action, date, note) 
                     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (wid, uid) DO NOTHING`,
                    [wm.wid, wm.uid, wm.action, wm.date, wm.note]
                );
                console.log(`✅ Đã seed warehouse management: ${wm.wid} - ${wm.uid}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed warehouse management:`, error.message);
                }
            }
        }

        // 10. Seed Product Management
        const productManagement = [
            { pid: 'P001', uid: 'U001', action: 'Nhập', number: 100, date: '2024-01-15', note: 'Nhập mới' },
            { pid: 'P002', uid: 'U002', action: 'Xuất', number: 500, date: '2024-01-16', note: 'Xuất bán' },
            { pid: 'P003', uid: 'U003', action: 'Kiểm kê', number: 0, date: '2024-01-17', note: 'Đếm lại' },
            { pid: 'P004', uid: 'U001', action: 'Nhập', number: 200, date: '2024-01-18', note: '' },
            { pid: 'P005', uid: 'U004', action: 'Xuất', number: 5, date: '2024-01-19', note: 'Xuất cho khách' },
            { pid: 'P006', uid: 'U002', action: 'Nhập', number: 50, date: '2024-01-20', note: '' }
        ];

        for (const pm of productManagement) {
            try {
                await db.query(
                    `INSERT INTO product_management (pid, uid, action, number, date, note) 
                     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (pid, uid) DO NOTHING`,
                    [pm.pid, pm.uid, pm.action, pm.number, pm.date, pm.note]
                );
                console.log(`✅ Đã seed product management: ${pm.pid} - ${pm.uid}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed product management:`, error.message);
                }
            }
        }

        // 11. Seed Order Warehouses
        const orderWarehouses = [
            { wid: 'W001', oid: 'ORD001', note: 'Xuất từ kho xi măng' },
            { wid: 'W002', oid: 'ORD001', note: 'Xuất từ kho gạch' },
            { wid: 'W003', oid: 'ORD003', note: 'Xuất từ kho sắt thép' },
            { wid: 'W004', oid: 'ORD004', note: 'Xuất từ kho gỗ' },
            { wid: 'W005', oid: 'ORD007', note: 'Xuất từ kho ống nước' },
            { wid: 'W006', oid: 'ORD008', note: 'Xuất từ kho cát đá' },
            { wid: 'W001', oid: 'ORD002', note: 'Nhập vào kho xi măng' },
            { wid: 'W003', oid: 'ORD005', note: 'Nhập vào kho sắt thép' },
            { wid: 'W002', oid: 'ORD009', note: 'Nhập vào kho gạch' }
        ];

        for (const ow of orderWarehouses) {
            try {
                await db.query(
                    `INSERT INTO order_warehouses (wid, oid, note) 
                     VALUES ($1, $2, $3) ON CONFLICT (wid, oid) DO NOTHING`,
                    [ow.wid, ow.oid, ow.note]
                );
                console.log(`✅ Đã seed order warehouse: ${ow.wid} - ${ow.oid}`);
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    console.error(`❌ Lỗi seed order warehouse:`, error.message);
                }
            }
        }

        console.log('\n✅ Đã hoàn thành seed data!');
        console.log('\n📋 Thông tin đăng nhập mặc định:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   👤 Admin:');
        console.log('     Email: admin@example.com');
        console.log('     Password: admin123');
        console.log('   👤 Manager:');
        console.log('     Email: manager@example.com');
        console.log('     Password: manager123');
        console.log('   👤 Staff (3 users):');
        console.log('     Email: staff1@example.com, staff2@example.com, staff3@example.com');
        console.log('     Password: staff123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Lỗi khi seed data:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedData()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { seedData };

