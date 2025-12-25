# Migration Guide

Hướng dẫn cập nhật database từ phiên bản cũ sang phiên bản mới với các tính năng mới.

## Tổng Quan

Các migration scripts được thiết kế để **idempotent** - có thể chạy nhiều lần mà không gây lỗi. Nếu một migration đã được chạy trước đó, nó sẽ được bỏ qua.

## Các Migration Có Sẵn

### 1. Bills Migration
Tạo bảng `bills` và thêm cột `bill_id` vào bảng `payments`.

**Chạy migration:**
```bash
cd server
npm run migrate:bills
```

**Hoặc chạy thủ công:**
```bash
cd server
node scripts/runBillsMigration.js
```

**Nội dung migration:**
- Tạo bảng `bills` với các cột:
  - `id` (PRIMARY KEY)
  - `order_id` (FOREIGN KEY to orders)
  - `total_amount` (DECIMAL)
  - `status` (VARCHAR)
  - `created_at`, `updated_at` (TIMESTAMP)
- Thêm cột `bill_id` vào bảng `payments` (nullable, FOREIGN KEY to bills)

### 2. Inventory Migration
Tạo các bảng inventory và thêm cột vào bảng `products`.

**Chạy migration:**
```bash
cd server
npm run migrate:inventory
```

**Hoặc chạy thủ công:**
```bash
cd server
node scripts/runInventoryMigration.js
```

**Nội dung migration:**
- Tạo bảng `stock_history`:
  - `id` (PRIMARY KEY)
  - `product_id` (FOREIGN KEY)
  - `warehouse_id` (FOREIGN KEY, nullable)
  - `type` (IN/OUT/ADJUSTMENT)
  - `quantity` (DECIMAL)
  - `previous_stock`, `new_stock` (DECIMAL)
  - `reason` (TEXT)
  - `actor` (TEXT)
  - `created_at` (TIMESTAMP)
- Tạo bảng `stock_transfers`:
  - `id` (PRIMARY KEY)
  - `product_id` (FOREIGN KEY)
  - `from_warehouse_id`, `to_warehouse_id` (FOREIGN KEY)
  - `quantity` (DECIMAL)
  - `status` (pending/approved/rejected/cancelled)
  - `reason` (TEXT)
  - `requested_by`, `approved_by` (TEXT)
  - `created_at`, `updated_at` (TIMESTAMP)
- Tạo bảng `low_stock_alerts`:
  - `id` (PRIMARY KEY)
  - `product_id` (FOREIGN KEY)
  - `warehouse_id` (FOREIGN KEY, nullable)
  - `current_stock` (DECIMAL)
  - `threshold` (DECIMAL)
  - `status` (active/resolved)
  - `actor` (TEXT)
  - `resolved_by` (TEXT)
  - `resolved_at` (TIMESTAMP)
  - `created_at` (TIMESTAMP)
- Thêm cột vào bảng `products`:
  - `low_stock_threshold` (DECIMAL, nullable)
  - `reorder_point` (DECIMAL, nullable)
  - `reorder_quantity` (DECIMAL, nullable)
- Tạo bảng `file_uploads`:
  - `id` (PRIMARY KEY)
  - `entity_type` (product/warehouse/user)
  - `entity_id` (TEXT)
  - `file_name` (TEXT)
  - `file_path` (TEXT)
  - `file_type` (TEXT)
  - `file_size` (BIGINT)
  - `is_primary` (BOOLEAN)
  - `upload_type` (TEXT, nullable)
  - `uploaded_by` (TEXT)
  - `created_at`, `updated_at` (TIMESTAMP)

## Cách Chạy Migration

### Option 1: Sử dụng npm scripts (Khuyến nghị)
```bash
cd server
npm run migrate:bills
npm run migrate:inventory
```

### Option 2: Chạy trực tiếp script
```bash
cd server
node scripts/runBillsMigration.js
node scripts/runInventoryMigration.js
```

### Option 3: Chạy SQL trực tiếp
Nếu bạn muốn kiểm soát nhiều hơn, có thể chạy SQL trực tiếp:

```bash
psql -U your_username -d your_database -f migrations/create_bills_table.sql
psql -U your_username -d your_database -f migrations/add_bill_id_to_payments.sql
psql -U your_username -d your_database -f migrations/create_inventory_tables.sql
psql -U your_username -d your_database -f migrations/add_inventory_columns_to_products.sql
psql -U your_username -d your_database -f migrations/create_file_uploads_table.sql
```

## Kiểm Tra Migration

Sau khi chạy migration, bạn có thể kiểm tra bằng cách:

### 1. Kiểm tra bảng đã được tạo
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bills', 'stock_history', 'stock_transfers', 'low_stock_alerts', 'file_uploads');
```

### 2. Kiểm tra cột đã được thêm
```sql
-- Kiểm tra cột bill_id trong payments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name = 'bill_id';

-- Kiểm tra cột trong products
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('low_stock_threshold', 'reorder_point', 'reorder_quantity');
```

### 3. Kiểm tra bằng API
```bash
# Kiểm tra bills API
curl http://localhost:3000/api/bills

# Kiểm tra inventory API
curl http://localhost:3000/api/inventory/history

# Kiểm tra file upload API
curl http://localhost:3000/api/files/entity/product/P001
```

## Rollback Migration

**Lưu ý:** Các migration scripts hiện tại không có rollback tự động. Nếu cần rollback, bạn phải thực hiện thủ công:

### Rollback Bills Migration
```sql
-- Xóa cột bill_id từ payments
ALTER TABLE payments DROP COLUMN IF EXISTS bill_id;

-- Xóa bảng bills (CẨN THẬN: Sẽ mất dữ liệu!)
DROP TABLE IF EXISTS bills;
```

### Rollback Inventory Migration
```sql
-- Xóa các bảng
DROP TABLE IF EXISTS file_uploads;
DROP TABLE IF EXISTS low_stock_alerts;
DROP TABLE IF EXISTS stock_transfers;
DROP TABLE IF EXISTS stock_history;

-- Xóa cột từ products
ALTER TABLE products DROP COLUMN IF EXISTS reorder_quantity;
ALTER TABLE products DROP COLUMN IF EXISTS reorder_point;
ALTER TABLE products DROP COLUMN IF EXISTS low_stock_threshold;
```

## Troubleshooting

### Lỗi: "relation already exists"
Nếu bạn gặp lỗi này, có nghĩa là migration đã được chạy trước đó. Các migration scripts được thiết kế để idempotent, nhưng nếu vẫn gặp lỗi, bạn có thể:

1. Kiểm tra xem bảng/cột đã tồn tại chưa
2. Bỏ qua lỗi nếu bảng/cột đã tồn tại
3. Hoặc xóa bảng/cột và chạy lại migration

### Lỗi: "column does not exist"
Nếu bạn gặp lỗi này khi chạy ứng dụng, có nghĩa là migration chưa được chạy. Hãy chạy migration trước khi khởi động server.

### Lỗi: "foreign key constraint"
Nếu bạn gặp lỗi foreign key constraint, hãy đảm bảo:
1. Các bảng tham chiếu (products, warehouses, orders) đã tồn tại
2. Dữ liệu trong các bảng tham chiếu là hợp lệ

## Tự Động Migration

Nếu bạn sử dụng `AUTO_INIT_DB=true` trong `.env`, server sẽ tự động chạy migrations khi khởi động. Tuy nhiên, điều này chỉ hoạt động với database mới hoặc khi chạy `npm run init:db`.

## Best Practices

1. **Backup database trước khi migration:**
   ```bash
   pg_dump -U your_username -d your_database > backup_before_migration.sql
   ```

2. **Chạy migration trong môi trường test trước:**
   - Test migration trên database test
   - Kiểm tra ứng dụng hoạt động đúng
   - Sau đó mới chạy trên production

3. **Kiểm tra logs:**
   - Xem logs của migration script
   - Kiểm tra server logs sau khi migration

4. **Document changes:**
   - Ghi lại các thay đổi đã thực hiện
   - Lưu lại backup database

## Liên Kết

- [API Documentation](./API_DOCUMENTATION.md)
- [Init Database Guide](./INIT_DATABASE_GUIDE.md)
- [README](../README.md)

