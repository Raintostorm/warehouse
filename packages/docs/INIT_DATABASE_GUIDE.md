# 🗄️ Hướng Dẫn Khởi Tạo Database

Guide chi tiết về cách khởi tạo database và seed data cho hệ thống.

## 🚀 Quick Start

### Chạy Script Init Database

```bash
cd server
npm run init:db
```

Script này sẽ:
1. ✅ Tạo tất cả tables nếu chưa tồn tại
2. ✅ Seed roles (Admin, Manager, Staff)
3. ✅ Seed users mẫu với roles
4. ✅ Seed products, suppliers, warehouses, orders (nếu database trống)

## 📋 Thông Tin Đăng Nhập Mặc Định

Sau khi chạy `npm run init:db`, bạn có thể đăng nhập với:

### 👤 Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** Admin (full access)

### 👤 Manager Account
- **Email:** `manager@example.com`
- **Password:** `manager123`
- **Role:** Manager

### 👤 Staff Accounts (3 users)
- **Email:** `staff1@example.com`, `staff2@example.com`, `staff3@example.com`
- **Password:** `staff123`
- **Role:** Staff

## 🔧 Cấu Hình Database

### 1. Tạo File `.env`

Trong thư mục `server/`, tạo file `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse_db
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2. Tạo Database

```sql
CREATE DATABASE warehouse_db;
```

### 3. Chạy Init Script

```bash
cd server
npm run init:db
```

## 📊 Cấu Trúc Tables

Script sẽ tạo các tables sau:

1. **users** - Thông tin người dùng
2. **roles** - Vai trò (Admin, Manager, Staff)
3. **user_roles** - Liên kết users và roles
4. **suppliers** - Nhà cung cấp
5. **products** - Sản phẩm
6. **warehouses** - Kho hàng
7. **orders** - Đơn hàng
8. **order_details** - Chi tiết đơn hàng
9. **payments** - Thanh toán
10. **product_details** - Chi tiết sản phẩm trong kho
11. **warehouse_management** - Quản lý kho
12. **product_management** - Quản lý sản phẩm
13. **order_warehouses** - Liên kết đơn hàng và kho
14. **audit_logs** - Nhật ký thay đổi
15. **notifications** - Thông báo
16. **password_resets** - Reset mật khẩu

## 🔄 Logic Seed Data

Script sử dụng logic thông minh:

- **Roles:** Luôn được seed nếu thiếu (critical cho authentication)
- **Users:** Chỉ seed nếu database trống
- **Other data:** Chỉ seed nếu database trống

### Khi Nào Script Skip Seed?

Script sẽ **bỏ qua seed** nếu:
- ✅ Đã có users VÀ products VÀ orders
- ✅ Roles đã có đầy đủ

Script sẽ **vẫn seed** nếu:
- ⚠️ Roles table trống (critical)
- ⚠️ Database trống hoàn toàn
- ⚠️ Thiếu một trong: users, products, orders

## 🛠️ Troubleshooting

### Lỗi: "Cannot connect to database"

**Nguyên nhân:**
- Database chưa được tạo
- Thông tin kết nối trong `.env` sai
- PostgreSQL service chưa chạy

**Giải pháp:**
1. Kiểm tra PostgreSQL đang chạy:
   ```bash
   # Windows
   services.msc → Tìm PostgreSQL service
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Kiểm tra `.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=warehouse_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

3. Tạo database nếu chưa có:
   ```sql
   CREATE DATABASE warehouse_db;
   ```

### Lỗi: "Table already exists"

**Nguyên nhân:**
- Tables đã được tạo trước đó

**Giải pháp:**
- Không cần lo lắng, script sử dụng `CREATE TABLE IF NOT EXISTS`
- Script sẽ bỏ qua nếu table đã tồn tại

### Lỗi: "Cannot login - no users found"

**Nguyên nhân:**
- Script chưa được chạy
- Seed data bị skip do logic check

**Giải pháp:**
1. Kiểm tra xem có users trong database:
   ```sql
   SELECT COUNT(*) FROM users;
   ```

2. Nếu = 0, chạy lại script:
   ```bash
   npm run init:db
   ```

3. Nếu vẫn không có, force seed bằng cách xóa data:
   ```bash
   # Set CLEAN_DB=true trong .env
   CLEAN_DB=true
   
   # Chạy lại script
   npm run init:db
   ```

### Lỗi: "User has no roles"

**Nguyên nhân:**
- Roles chưa được seed
- User chưa được gán role

**Giải pháp:**
1. Kiểm tra roles:
   ```sql
   SELECT * FROM roles;
   ```

2. Nếu trống, chạy lại script:
   ```bash
   npm run init:db
   ```

3. Kiểm tra user_roles:
   ```sql
   SELECT u.email, r.name 
   FROM users u
   JOIN user_roles ur ON u.id = ur.u_id
   JOIN roles r ON ur.r_id = r.id;
   ```

### Lỗi: "Syntax error" trong initDatabase.js

**Nguyên nhân:**
- Có lỗi syntax trong file

**Giải pháp:**
- Đã được fix trong version mới
- Kiểm tra dòng 123 không có dấu phẩy thừa

## 🔐 Reset Database

### Xóa Tất Cả Data và Tạo Lại

```bash
# Thêm vào .env
CLEAN_DB=true

# Chạy script
npm run init:db
```

**⚠️ CẢNH BÁO:** `CLEAN_DB=true` sẽ **XÓA TẤT CẢ** tables và data!

### Chỉ Xóa Data, Giữ Tables

```sql
-- Xóa data từng table
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;
-- ... (các tables khác)

-- Sau đó chạy lại script
npm run init:db
```

## 📝 Manual Seed

Nếu muốn seed thủ công:

```sql
-- 1. Seed Roles
INSERT INTO roles (id, name) VALUES 
('R001', 'Admin'),
('R002', 'Manager'),
('R003', 'Staff')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed User (password: admin123)
INSERT INTO users (id, fullname, email, password, number, address, actor)
VALUES (
  'U001',
  'Nguyễn Văn Admin',
  'admin@example.com',
  '$2b$10$...', -- bcrypt hash của 'admin123'
  '0912345678',
  '123 Đường Lê Lợi, Quận 1, TP.HCM',
  'system'
) ON CONFLICT (id) DO NOTHING;

-- 3. Assign Admin Role
INSERT INTO user_roles (u_id, r_id) VALUES ('U001', 'R001')
ON CONFLICT DO NOTHING;
```

## ✅ Verification

Sau khi chạy script, verify:

```sql
-- Check users
SELECT id, email, fullname FROM users;

-- Check roles
SELECT * FROM roles;

-- Check user roles
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.u_id
JOIN roles r ON ur.r_id = r.id;
```

## 🎯 Best Practices

1. **Luôn chạy script sau khi clone project:**
   ```bash
   npm run init:db
   ```

2. **Không commit `.env` file:**
   - File đã có trong `.gitignore`
   - Mỗi developer tạo `.env` riêng

3. **Backup database trước khi CLEAN_DB:**
   ```bash
   pg_dump warehouse_db > backup.sql
   ```

4. **Test login sau khi init:**
   - Đăng nhập với `admin@example.com` / `admin123`
   - Verify có thể truy cập dashboard

---

**Lưu ý:** Script tự động chạy khi server start nếu `AUTO_INIT_DB=true` trong `.env`.
