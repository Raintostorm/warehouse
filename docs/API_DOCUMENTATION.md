# API Documentation

Tài liệu đầy đủ về các API endpoints trong hệ thống Warehouse Management.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Hầu hết các API endpoints đều yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

Token được lấy từ endpoint `/api/auth/login`.

---

## Authentication APIs

### POST /api/auth/login
Đăng nhập và nhận JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "U001",
    "email": "admin@example.com",
    "fullname": "Admin User",
    "roleNames": ["Admin"]
  }
}
```

### GET /api/auth/verify
Xác thực token hiện tại.

**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

### POST /api/auth/reset-password
Reset password qua email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

## Users APIs

### GET /api/users
Lấy danh sách tất cả users.

**Query Parameters:**
- `page` (optional): Số trang
- `limit` (optional): Số items mỗi trang
- `search` (optional): Tìm kiếm theo tên/email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "U001",
      "fullname": "John Doe",
      "email": "john@example.com",
      "number": "0123456789",
      "address": "123 Main St",
      "roleNames": ["Staff"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /api/users
Tạo user mới (Admin only).

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "number": "0123456789",
  "address": "123 Main St",
  "password": "password123"
}
```

**Note:** `id` sẽ được tự động generate nếu không cung cấp.

### GET /api/users/:id
Lấy thông tin user theo ID.

### PUT /api/users/:id
Cập nhật user (Admin only).

### DELETE /api/users/:id
Xóa user (Admin only).

---

## Products APIs

### GET /api/products
Lấy danh sách products.

**Query Parameters:**
- `page`, `limit`, `search` (optional)

### POST /api/products
Tạo product mới (Admin only).

**Request Body:**
```json
{
  "id": "P001",
  "name": "Product Name",
  "type": "Type",
  "unit": "kg",
  "number": 100,
  "price": 50000,
  "supplierId": "S001"
}
```

### GET /api/products/:id
Lấy product theo ID.

### PUT /api/products/:id
Cập nhật product (Admin only).

### DELETE /api/products/:id
Xóa product (Admin only).

---

## Warehouses APIs

### GET /api/warehouses
Lấy danh sách warehouses.

### POST /api/warehouses
Tạo warehouse mới (Admin only).

**Request Body:**
```json
{
  "id": "W001",
  "name": "Warehouse Name",
  "address": "123 Address St",
  "size": 1000.5,
  "type": "Storage",
  "startedDate": "2024-01-01",
  "endDate": "2025-12-31"
}
```

### GET /api/warehouses/:id
Lấy warehouse theo ID.

### PUT /api/warehouses/:id
Cập nhật warehouse (Admin only).

### DELETE /api/warehouses/:id
Xóa warehouse (Admin only).

---

## Orders APIs

### GET /api/orders
Lấy danh sách orders.

**Query Parameters:**
- `page`, `limit`, `search`
- `status` (optional): Lọc theo status
- `type` (optional): Lọc theo type (IN/OUT)

### POST /api/orders
Tạo order mới.

**Request Body:**
```json
{
  "id": "ORD001",
  "customerId": "C001",
  "warehouseId": "W001",
  "type": "OUT",
  "status": "pending",
  "totalAmount": 1000000
}
```

### GET /api/orders/:id
Lấy order theo ID.

### PUT /api/orders/:id
Cập nhật order.

### DELETE /api/orders/:id
Xóa order (Admin only).

### POST /api/orders/generate-bill
Tạo bill từ order (Admin only).

**Request Body:**
```json
{
  "orderId": "ORD001",
  "generatePDF": true
}
```

---

## Bills APIs

### GET /api/bills
Lấy tất cả bills.

**Query Parameters:**
- `page`, `limit`
- `orderId` (optional): Lọc theo order ID
- `status` (optional): Lọc theo status

### GET /api/bills/unpaid
Lấy danh sách bills chưa thanh toán.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "BILL001",
      "orderId": "ORD001",
      "totalAmount": 1000000,
      "paidAmount": 0,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/bills/:id
Lấy bill theo ID.

### GET /api/bills/order/:orderId
Lấy tất cả bills của một order.

### POST /api/bills
Tạo bill mới (Admin only).

**Request Body:**
```json
{
  "orderId": "ORD001",
  "totalAmount": 1000000
}
```

### PUT /api/bills/:id
Cập nhật bill (Admin only).

### DELETE /api/bills/:id
Xóa bill (Admin only).

---

## Payments APIs

### GET /api/payments
Lấy danh sách payments.

### POST /api/payments
Tạo payment mới.

**Request Body:**
```json
{
  "billId": "BILL001",
  "orderId": "ORD001",
  "amount": 500000,
  "method": "cash",
  "status": "pending"
}
```

### GET /api/payments/:id
Lấy payment theo ID.

### PUT /api/payments/:id
Cập nhật payment.

### DELETE /api/payments/:id
Xóa payment (Admin only).

### POST /api/payments/gateway/vnpay/create
Tạo VNPay payment URL.

**Request Body:**
```json
{
  "orderId": "ORD001",
  "amount": 1000000
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

---

## Inventory APIs

### GET /api/inventory/history
Lấy lịch sử thay đổi tồn kho.

**Query Parameters:**
- `productId` (optional): Lọc theo product ID
- `warehouseId` (optional): Lọc theo warehouse ID
- `type` (optional): Lọc theo type (IN/OUT/ADJUSTMENT)
- `startDate` (optional): Ngày bắt đầu
- `endDate` (optional): Ngày kết thúc
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "SH001",
      "productId": "P001",
      "warehouseId": "W001",
      "type": "IN",
      "quantity": 100,
      "previousStock": 0,
      "newStock": 100,
      "reason": "Purchase",
      "actor": "U001",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/inventory/stock/:productId
Lấy tồn kho hiện tại của sản phẩm.

**Query Parameters:**
- `warehouseId` (optional): Lọc theo warehouse ID

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "P001",
    "warehouseId": "W001",
    "currentStock": 100,
    "warehouseName": "Warehouse 1"
  }
}
```

### GET /api/inventory/summary/:productId
Lấy tổng quan tồn kho của sản phẩm.

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "P001",
    "totalStock": 500,
    "warehouses": [
      {
        "warehouseId": "W001",
        "warehouseName": "Warehouse 1",
        "stock": 300
      },
      {
        "warehouseId": "W002",
        "warehouseName": "Warehouse 2",
        "stock": 200
      }
    ]
  }
}
```

### GET /api/inventory/low-stock/:productId
Kiểm tra tồn kho thấp.

**Query Parameters:**
- `warehouseId` (optional)

### POST /api/inventory/adjust/:productId
Điều chỉnh tồn kho (Admin only).

**Request Body:**
```json
{
  "warehouseId": "W001",
  "quantity": 50,
  "reason": "Stock adjustment",
  "type": "ADJUSTMENT"
}
```

### POST /api/inventory/transfer
Chuyển kho (Admin only).

**Request Body:**
```json
{
  "productId": "P001",
  "fromWarehouseId": "W001",
  "toWarehouseId": "W002",
  "quantity": 50,
  "reason": "Transfer stock"
}
```

---

## Stock Transfers APIs

### GET /api/stock-transfers
Lấy tất cả transfers.

**Query Parameters:**
- `status` (optional): Lọc theo status (pending/approved/rejected/cancelled)
- `productId` (optional): Lọc theo product ID
- `fromWarehouseId` (optional)
- `toWarehouseId` (optional)
- `page`, `limit`

### GET /api/stock-transfers/:id
Lấy transfer theo ID.

### POST /api/stock-transfers
Tạo transfer mới (Admin only).

**Request Body:**
```json
{
  "productId": "P001",
  "fromWarehouseId": "W001",
  "toWarehouseId": "W002",
  "quantity": 50,
  "reason": "Transfer stock"
}
```

### PUT /api/stock-transfers/:id
Cập nhật transfer (Admin only).

### POST /api/stock-transfers/:id/approve
Duyệt transfer (Admin only).

### POST /api/stock-transfers/:id/cancel
Hủy transfer (Admin only).

### DELETE /api/stock-transfers/:id
Xóa transfer (Admin only).

---

## Low Stock Alerts APIs

### GET /api/low-stock-alerts
Lấy tất cả alerts.

**Query Parameters:**
- `status` (optional): active/resolved
- `productId` (optional)
- `warehouseId` (optional)
- `page`, `limit`

### GET /api/low-stock-alerts/active
Lấy alerts đang active.

### GET /api/low-stock-alerts/:id
Lấy alert theo ID.

### GET /api/low-stock-alerts/product/:productId
Lấy alerts theo product ID.

### GET /api/low-stock-alerts/warehouse/:warehouseId
Lấy alerts theo warehouse ID.

### POST /api/low-stock-alerts/check
Kiểm tra và tạo alerts (Admin only).

**Request Body:**
```json
{
  "productId": "P001",
  "warehouseId": "W001"
}
```

### POST /api/low-stock-alerts/auto-resolve
Tự động resolve alerts (Admin only).

### POST /api/low-stock-alerts/:id/resolve
Resolve alert (Admin only).

**Request Body:**
```json
{
  "resolvedBy": "U001"
}
```

### DELETE /api/low-stock-alerts/:id
Xóa alert (Admin only).

---

## File Upload APIs

### POST /api/files/upload/image
Upload ảnh đơn (Admin/Staff only).

**Request:** `multipart/form-data`
- `file`: File ảnh
- `entityType`: product/warehouse/user
- `entityId`: ID của entity
- `uploadType` (optional): primary/gallery
- `isPrimary` (optional): true/false

### POST /api/files/upload/images
Upload nhiều ảnh (Admin/Staff only).

**Request:** `multipart/form-data`
- `files`: Array of files
- `entityType`: product/warehouse/user
- `entityId`: ID của entity
- `uploadType` (optional)

### POST /api/files/upload/file
Upload file đơn (Admin/Staff only).

### POST /api/files/upload/files
Upload nhiều file (Admin/Staff only).

### GET /api/files/entity/:entityType/:entityId
Lấy tất cả files của một entity.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "FILE001",
      "entityType": "product",
      "entityId": "P001",
      "fileName": "product-image.jpg",
      "filePath": "/uploads/products/P001/product-image.jpg",
      "fileType": "image/jpeg",
      "fileSize": 102400,
      "isPrimary": true,
      "uploadType": "primary",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/files/entity/:entityType/:entityId/primary
Lấy primary file của entity.

### GET /api/files/:id
Lấy file theo ID.

### PUT /api/files/:id/primary
Set primary file (Admin/Staff only).

### DELETE /api/files/:id
Xóa file (Admin/Staff only).

---

## Statistics & Analytics APIs

### GET /api/statistics/dashboard
Lấy thống kê dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 10000000,
    "totalOrders": 100,
    "totalProducts": 50,
    "totalCustomers": 30,
    "recentOrders": [...],
    "topProducts": [...]
  }
}
```

### GET /api/statistics/sales-trends
Xu hướng bán hàng.

**Query Parameters:**
- `startDate` (required): YYYY-MM-DD
- `endDate` (required): YYYY-MM-DD
- `interval` (optional): day/week/month/year (default: day)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "revenue": 1000000,
      "orders": 10,
      "quantity": 50
    }
  ]
}
```

### GET /api/statistics/product-performance
Hiệu suất sản phẩm.

**Query Parameters:**
- `limit` (optional): Số lượng (default: 10)
- `sortBy` (optional): revenue/quantity/orders (default: revenue)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "P001",
      "productName": "Product 1",
      "revenue": 5000000,
      "quantity": 100,
      "orders": 20
    }
  ]
}
```

### GET /api/statistics/warehouse-utilization
Sử dụng kho.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "warehouseId": "W001",
      "warehouseName": "Warehouse 1",
      "totalCapacity": 1000,
      "usedCapacity": 500,
      "utilizationRate": 50
    }
  ]
}
```

### GET /api/statistics/revenue-by-period
Doanh thu theo kỳ.

**Query Parameters:**
- `period` (optional): day/week/month/year (default: month)
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

### GET /api/statistics/inventory-turnover
Tỷ lệ luân chuyển kho.

**Query Parameters:**
- `days` (optional): Số ngày (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "P001",
      "productName": "Product 1",
      "turnoverRate": 2.5,
      "averageStock": 100,
      "salesQuantity": 250
    }
  ]
}
```

### GET /api/statistics/customer-analytics
Phân tích khách hàng.

**Query Parameters:**
- `limit` (optional): Số lượng (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerId": "C001",
      "customerName": "Customer 1",
      "totalOrders": 10,
      "totalRevenue": 5000000,
      "averageOrderValue": 500000
    }
  ]
}
```

### GET /api/statistics/supplier-analytics
Phân tích nhà cung cấp.

**Query Parameters:**
- `limit` (optional): Số lượng (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "supplierId": "S001",
      "supplierName": "Supplier 1",
      "totalProducts": 20,
      "totalOrders": 50,
      "totalRevenue": 10000000
    }
  ]
}
```

---

## Error Responses

Tất cả API endpoints trả về error theo format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Một số endpoints có rate limiting:
- `/api/auth/login`: 5 requests per 15 minutes per IP

---

## Notes

- Tất cả timestamps đều ở format ISO 8601 (UTC)
- Tất cả số tiền đều tính bằng VND
- Pagination mặc định: `page=1`, `limit=10`
- Tất cả endpoints (trừ auth) đều yêu cầu authentication

