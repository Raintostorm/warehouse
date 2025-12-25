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

5. **Chạy ứng dụng:**

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

6. **Truy cập ứng dụng:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## 📚 Tài Liệu

Tất cả tài liệu được tổ chức trong folder [`docs/`](./docs/):

- **[📖 Xem tất cả tài liệu](./docs/README.md)** - Danh sách đầy đủ các guides

### Quick Links
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
npm start          # Start server
npm run dev        # Start với nodemon (development)
npm run init:db    # Khởi tạo database
npm test           # Chạy tests
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

- `GET /api/users` - Lấy danh sách users
- `POST /api/users` - Tạo user mới
- `GET /api/users/:id` - Lấy user theo ID
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

Tương tự cho: `warehouses`, `products`, `orders`, `payments`, `suppliers`, etc.

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
