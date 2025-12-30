# Warehouse Management System

Hệ thống quản lý kho hàng với đầy đủ tính năng CRUD, Payment System (VNPay), và nhiều tính năng khác.

## 📁 Cấu Trúc Project

```
uh/
├── client/          # React Frontend Application
├── server/          # Node.js/Express Backend API
├── scripts/         # Deployment & Utility Scripts
├── .github/         # GitHub Actions CI/CD
├── docker-compose.yml
├── Dockerfile.client
├── Dockerfile.server
└── README.md
```

## ✨ Tính Năng

### Core Features
- ✅ **User Management** - CRUD đầy đủ với Authentication & Authorization
- ✅ **Warehouse Management** - Quản lý kho hàng
- ✅ **Product Management** - Quản lý sản phẩm với Product Details
- ✅ **Order Management** - Quản lý đơn hàng với Order Details
- ✅ **Payment System** - Tích hợp VNPay Sandbox
- ✅ **Supplier Management** - Quản lý nhà cung cấp

### Advanced Features
- ✅ **Dashboard** - Thống kê với charts và metrics
- ✅ **Audit Logs** - Theo dõi mọi thay đổi trong hệ thống
- ✅ **Reports** - Tạo báo cáo (Revenue, Inventory, Orders)
- ✅ **Notifications** - Hệ thống thông báo real-time
- ✅ **Video Call** - Tính năng gọi video
- ✅ **Export/Import** - Xuất/nhập dữ liệu Excel/CSV
- ✅ **Dark/Light Theme** - Chế độ sáng/tối
- ✅ **Responsive Design** - Tối ưu cho mọi thiết bị

### Inventory Management System
- ✅ **Stock History Tracking** - Theo dõi lịch sử thay đổi tồn kho (IN/OUT/ADJUSTMENT)
- ✅ **Stock Transfers** - Chuyển kho giữa các warehouse với workflow approval
- ✅ **Low Stock Alerts** - Cảnh báo khi tồn kho thấp với auto-resolve
- ✅ **Stock Adjustments** - Điều chỉnh tồn kho thủ công
- ✅ **Multi-Warehouse Support** - Quản lý tồn kho theo từng kho

### File Upload System
- ✅ **Image Upload** - Upload ảnh cho products, warehouses, users
- ✅ **Multiple File Upload** - Upload nhiều file cùng lúc
- ✅ **File Management** - Quản lý file (view, delete, set primary)
- ✅ **Storage Adapter** - Hỗ trợ local storage và cloud storage (extensible)
- ✅ **File Type Validation** - Kiểm tra loại file và kích thước

### Advanced Analytics
- ✅ **Sales Trends** - Phân tích xu hướng bán hàng theo thời gian
- ✅ **Product Performance** - Top sản phẩm theo doanh thu/số lượng
- ✅ **Warehouse Utilization** - Phân tích sử dụng kho
- ✅ **Revenue Analytics** - Doanh thu theo kỳ (ngày/tuần/tháng/năm)
- ✅ **Inventory Turnover** - Tỷ lệ luân chuyển kho
- ✅ **Customer Analytics** - Phân tích khách hàng (top customers, purchase patterns)
- ✅ **Supplier Analytics** - Phân tích nhà cung cấp

### Security & Quality
- ✅ **Role-Based Access Control (RBAC)**
- ✅ **JWT Authentication**
- ✅ **Password Reset** với email
- ✅ **Google OAuth** Integration
- ✅ **Rate Limiting**
- ✅ **Error Handling** toàn diện
- ✅ **Input Validation**
- ✅ **SQL Injection Protection**

## 🚀 Bắt Đầu

### Yêu Cầu
- Node.js >= 18.x
- PostgreSQL >= 12.x
- npm hoặc yarn

### Cài Đặt

1. **Clone repository:**
```bash
git clone <repository-url>
cd uh
```

2. **Cài đặt dependencies:**

Backend:
```bash
cd server
npm install
```

Frontend:
```bash
cd client
npm install
```

3. **Cấu hình Database:**

Tạo file `.env` trong thư mục `server/`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse_db
DB_USER=your_username
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

# VNPay Sandbox (Optional)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_RETURN_URL=http://localhost:5173/payment/success
VNPAY_IPN_URL=http://localhost:3000/api/payments/gateway/vnpay/ipn
```

4. **Khởi tạo Database (QUAN TRỌNG!):**
```bash
cd server
npm run init:db
```

**📋 Thông tin đăng nhập mặc định sau khi init:**
- **Admin:** `admin@example.com` / `admin123`
- **Manager:** `manager@example.com` / `manager123`
- **Staff:** `staff1@example.com` / `staff123`

Xem chi tiết: [Init Database Guide](./docs/INIT_DATABASE_GUIDE.md)

5. **Chạy Migrations (Nếu cần):**
```bash
cd server
npm run migrate:inventory      # Migration cho inventory tables
```

**Lưu ý**: Nếu bạn đã chạy `npm run init:db`, các migrations đã được tự động chạy. Chỉ cần chạy migrations riêng nếu bạn đang cập nhật database hiện có.

6. **Chạy ứng dụng:**

Backend (Terminal 1):
```bash
cd server
npm start
```

Frontend (Terminal 2):
```bash
cd client
npm run dev
```

7. **Truy cập ứng dụng:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## 📚 Tài Liệu

Tất cả tài liệu được tổ chức trong folder [`docs/`](./docs/):

- **[📖 Xem tất cả tài liệu](./docs/README.md)** - Danh sách đầy đủ các guides

### Quick Links
- [API Documentation](./docs/API_DOCUMENTATION.md) - Tài liệu đầy đủ về API endpoints
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Hướng dẫn cập nhật database
- [VNPay Sandbox Setup](./docs/VNPAY_SANDBOX_SETUP.md) - Tích hợp VNPay
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Deploy production
- [Docker Guide](./docs/README_DOCKER.md) - Sử dụng Docker

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **Vite** - Build Tool
- **Axios** - HTTP Client
- **React Context** - State Management
- **Custom Hooks** - Reusable Logic

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password Hashing
- **Crypto** - Payment Gateway Security

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container Setup
- **GitHub Actions** - CI/CD

## 📦 Scripts

### Backend (`server/`)
```bash
npm start              # Start server
npm run dev            # Start với nodemon (development)
npm run init:db        # Khởi tạo database
npm test               # Chạy tests
npm run migrate:inventory  # Migration cho inventory tables
npm run seed:products  # Thêm sản phẩm mẫu (92 products)
```

### Frontend (`client/`)
```bash
npm run dev        # Start dev server
npm run build      # Build production
npm run preview    # Preview production build
```

## 🔐 Default Credentials

Sau khi khởi tạo database, bạn có thể tạo user đầu tiên qua API hoặc database.

**Lưu ý:** Đảm bảo thay đổi password mặc định trong production!

## 🐳 Docker

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up -d
```

### Local Database Only
```bash
docker-compose -f docker-compose.local-db.yml up
```

## 📝 API Documentation

API endpoints được tổ chức theo RESTful conventions:

### Core APIs
- **Users**: `GET /api/users`, `POST /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- **Warehouses**: `GET /api/warehouses`, `POST /api/warehouses`, `GET /api/warehouses/:id`, `PUT /api/warehouses/:id`, `DELETE /api/warehouses/:id`
- **Products**: `GET /api/products`, `POST /api/products`, `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- **Orders**: `GET /api/orders`, `POST /api/orders`, `GET /api/orders/:id`, `PUT /api/orders/:id`, `DELETE /api/orders/:id`
- **Payments**: `GET /api/payments`, `POST /api/payments`, `GET /api/payments/:id`, `PUT /api/payments/:id`, `DELETE /api/payments/:id`
- **Suppliers**: `GET /api/suppliers`, `POST /api/suppliers`, `GET /api/suppliers/:id`, `PUT /api/suppliers/:id`, `DELETE /api/suppliers/:id`

### Inventory Management
- `GET /api/inventory/history` - Lấy lịch sử thay đổi tồn kho
- `GET /api/inventory/stock/:productId` - Lấy tồn kho hiện tại của sản phẩm
- `GET /api/inventory/summary/:productId` - Lấy tổng quan tồn kho của sản phẩm
- `GET /api/inventory/low-stock/:productId` - Kiểm tra tồn kho thấp
- `POST /api/inventory/adjust/:productId` - Điều chỉnh tồn kho (admin only)
- `POST /api/inventory/transfer` - Chuyển kho (admin only)

### Stock Transfers
- `GET /api/stock-transfers` - Lấy tất cả transfers
- `GET /api/stock-transfers/:id` - Lấy transfer theo ID
- `POST /api/stock-transfers` - Tạo transfer mới (admin only)
- `PUT /api/stock-transfers/:id` - Cập nhật transfer (admin only)
- `POST /api/stock-transfers/:id/approve` - Duyệt transfer (admin only)
- `POST /api/stock-transfers/:id/cancel` - Hủy transfer (admin only)
- `DELETE /api/stock-transfers/:id` - Xóa transfer (admin only)

### Low Stock Alerts
- `GET /api/low-stock-alerts` - Lấy tất cả alerts (có filters)
- `GET /api/low-stock-alerts/active` - Lấy alerts đang active
- `GET /api/low-stock-alerts/:id` - Lấy alert theo ID
- `GET /api/low-stock-alerts/product/:productId` - Lấy alerts theo product ID
- `GET /api/low-stock-alerts/warehouse/:warehouseId` - Lấy alerts theo warehouse ID
- `POST /api/low-stock-alerts/check` - Kiểm tra và tạo alerts (admin only)
- `POST /api/low-stock-alerts/auto-resolve` - Tự động resolve alerts (admin only)
- `POST /api/low-stock-alerts/:id/resolve` - Resolve alert (admin only)
- `DELETE /api/low-stock-alerts/:id` - Xóa alert (admin only)

### File Upload
- `POST /api/files/upload/image` - Upload ảnh đơn (admin/staff)
- `POST /api/files/upload/images` - Upload nhiều ảnh (admin/staff)
- `POST /api/files/upload/file` - Upload file đơn (admin/staff)
- `POST /api/files/upload/files` - Upload nhiều file (admin/staff)
- `GET /api/files/entity/:entityType/:entityId` - Lấy files theo entity
- `GET /api/files/entity/:entityType/:entityId/primary` - Lấy primary file
- `GET /api/files/:id` - Lấy file theo ID
- `PUT /api/files/:id/primary` - Set primary file (admin/staff)
- `DELETE /api/files/:id` - Xóa file (admin/staff)

### Advanced Analytics
- `GET /api/statistics/dashboard` - Thống kê dashboard
- `GET /api/statistics/sales-trends` - Xu hướng bán hàng (query: startDate, endDate, interval)
- `GET /api/statistics/product-performance` - Hiệu suất sản phẩm (query: limit, sortBy)
- `GET /api/statistics/warehouse-utilization` - Sử dụng kho
- `GET /api/statistics/revenue-by-period` - Doanh thu theo kỳ (query: period, startDate, endDate)
- `GET /api/statistics/inventory-turnover` - Tỷ lệ luân chuyển kho (query: days)
- `GET /api/statistics/customer-analytics` - Phân tích khách hàng (query: limit)
- `GET /api/statistics/supplier-analytics` - Phân tích nhà cung cấp (query: limit)

### Authentication & Authorization
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/verify` - Xác thực token
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/google` - Google OAuth login

**Lưu ý**: Tất cả API endpoints (trừ `/api/auth/login` và `/api/auth/google`) đều yêu cầu JWT token trong header: `Authorization: Bearer <token>`

## 🧪 Testing

```bash
cd server
npm test
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- VNPay for payment gateway integration
- React & Express communities
- All contributors

---

**Happy Coding! 🎉**
