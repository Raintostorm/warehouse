# 🗄️ Hướng Dẫn Khởi Tạo Database Tự Động

Script tự động khởi tạo database giống như Java JPA auto-create tables.

## 🚀 Cách Sử Dụng

### 1. Khởi tạo Database từ đầu (Tạo tables + Seed data)

```bash
cd server
npm run init
```

Hoặc:
```bash
npm run init:db
```

**Script này sẽ:**
- ✅ Tạo tất cả tables nếu chưa tồn tại (CREATE TABLE IF NOT EXISTS)
- ✅ Seed data mẫu (users, roles, products, suppliers, warehouses, orders)
- ✅ Không xóa data hiện có (safe)

### 2. Chỉ Seed Data (không tạo lại tables)

```bash
npm run seed
```

Hoặc:
```bash
npm run seed:data
```

**Script này sẽ:**
- ✅ Chỉ thêm data mẫu
- ✅ Bỏ qua nếu data đã tồn tại (ON CONFLICT DO NOTHING)

### 3. Tự động khởi tạo khi start server (Giống Java Spring Boot)

Thêm vào file `.env`:
```env
AUTO_INIT_DB=true
```

Khi start server, nó sẽ tự động:
- ✅ Check và tạo tables nếu chưa có
- ✅ Seed data mẫu nếu chưa có

**Lưu ý:** Chỉ nên dùng trong development. Production nên tắt.

### 4. Xóa hết data và tables để tạo lại từ đầu (⚠️ Nguy hiểm!)

Thêm vào file `.env`:
```env
CLEAN_DB=true
AUTO_INIT_DB=true
```

**⚠️ CẢNH BÁO:** 
- `CLEAN_DB=true` sẽ **XÓA TẤT CẢ TABLES VÀ DATA** trong database!
- Chỉ dùng khi muốn reset hoàn toàn database
- **SAU KHI DỮ LIỆU ỔN ĐỊNH, NHỚ TẮT CLEAN_DB=false!**

**Sau khi dữ liệu ổn định:**
```env
CLEAN_DB=false
AUTO_INIT_DB=true
```

## 📋 Data Mẫu Được Tạo

### Users:
- **Admin**: `admin@example.com` / `admin123`
- **Manager**: `manager@example.com` / `manager123`

### Roles:
- Admin (R001)
- Manager (R002)
- Staff (R003)

### Suppliers (Nhà cung cấp vật liệu xây dựng):
- Công ty Xi Măng Hà Tiên
- Công ty Gạch Đồng Tâm
- Công ty Sắt Thép Hòa Phát
- Công ty Gỗ An Cường
- Công ty Ống Nước Bình Minh

### Products (Vật liệu xây dựng):
- Xi Măng PCB40, Xi Măng Trắng
- Gạch Ống 4 Lỗ, Gạch Men 60x60
- Thép Phi 6, Thép Phi 8
- Gỗ Thông
- Ống PVC D21
- Cát Xây Dựng, Đá 1x2

### Warehouses (Vật liệu xây dựng):
- Kho Xi Măng
- Kho Gạch
- Kho Sắt Thép
- Kho Gỗ
- Kho Ống Nước
- Kho Cát Đá

**Lưu ý:** Mỗi kho có hình ảnh (image URL) để hiển thị.

### Orders:
- 2 đơn hàng mẫu với order details

## 🔧 Cấu Trúc Scripts

```
server/
├── scripts/
│   ├── initDatabase.js      # Script chính: Tạo tables + Seed data
│   └── seedData.js          # Script riêng: Chỉ seed data
```

## ⚙️ Tùy Chỉnh

### Thêm data mẫu mới:

Sửa file `server/scripts/seedData.js` và thêm data vào các arrays tương ứng.

### Thêm table mới:

1. Thêm vào `TABLES` object trong `initDatabase.js`
2. Thêm vào `tableOrder` array theo thứ tự dependency

## 🛡️ An Toàn

- ✅ **Không xóa data**: Chỉ tạo tables nếu chưa có (khi CLEAN_DB=false)
- ✅ **Không ghi đè data**: ON CONFLICT DO NOTHING
- ✅ **Foreign keys**: Đảm bảo thứ tự tạo tables đúng
- ✅ **Idempotent**: Chạy nhiều lần an toàn
- ⚠️ **CLEAN_DB**: Chỉ bật khi muốn reset hoàn toàn database

## 📝 Ví Dụ

### Lần đầu setup:
```bash
cd server
npm run init
```

### Thêm data mẫu mới:
```bash
npm run seed
```

### Development với auto-init:
```env
# .env
AUTO_INIT_DB=true
```

```bash
npm start  # Tự động init nếu cần
```

---

**Status:** ✅ Sẵn sàng sử dụng!

