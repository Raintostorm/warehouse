# 📚 Documentation

Tất cả tài liệu hướng dẫn và guides được tập trung tại đây.

## 📖 Danh Sách Tài Liệu

### Setup & Configuration
- **[🗄️ Init Database Guide](./INIT_DATABASE_GUIDE.md)** - **Khởi tạo database và seed data (QUAN TRỌNG!)**
- **[VNPay Sandbox Setup](./VNPAY_SANDBOX_SETUP.md)** - Hướng dẫn chi tiết tích hợp VNPay Sandbox
- **[Payment Gateway Setup](./PAYMENT_GATEWAY_SETUP.md)** - Tổng quan về payment gateways (VNPay, MoMo, ZaloPay)
- **[Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)** - Fix lỗi 403 Google Sign-In
- **[Docker Guide](./README_DOCKER.md)** - Hướng dẫn sử dụng Docker

### Deployment & Production
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Hướng dẫn deploy lên production
- **[Production Ready](./PRODUCTION_READY.md)** - Checklist và best practices cho production

### Development Tools
- **[Cursor Indexing Guide](./CURSOR_INDEXING_GUIDE.md)** - Tối ưu Cursor IDE, hiểu về Indexing & Docs
- **[🎯 Cursor Prompting Guide](./CURSOR_PROMPTING_GUIDE.md)** - **Học cách prompt hiệu quả để Cursor làm việc chính xác**

## 🚀 Quick Links

### Bắt Đầu Nhanh
1. **Khởi tạo database:** [Init Database Guide](./INIT_DATABASE_GUIDE.md) - **BẮT BUỘC trước khi chạy app!**
2. Xem [README.md](../README.md) ở root để bắt đầu
3. Setup VNPay: [VNPay Sandbox Setup](./VNPAY_SANDBOX_SETUP.md)
4. Deploy: [Deployment Guide](./DEPLOYMENT_GUIDE.md)

### Troubleshooting
- **Không đăng nhập được:** [Init Database Guide](./INIT_DATABASE_GUIDE.md#troubleshooting) - Kiểm tra users và roles
- **Login thành công nhưng không redirect:** [Login Debug Guide](./LOGIN_DEBUG_GUIDE.md) - Debug chi tiết login flow
- **429 Too Many Requests:** [Reset Rate Limit Guide](./RESET_RATE_LIMIT.md) - **Cách reset rate limit nhanh nhất**
- **Database errors:** [Init Database Guide](./INIT_DATABASE_GUIDE.md#troubleshooting)
- **500 Error - JWT_SECRET:** [JWT_SECRET Setup](./JWT_SECRET_SETUP.md) - Fix lỗi "secretOrPrivateKey must have a value"
- **Rate Limiting Details:** [Rate Limiting Guide](./RATE_LIMITING_GUIDE.md) - Chi tiết về rate limiting
- **Google Sign-In 403:** [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md) - Fix lỗi "origin not allowed"
- VNPay issues: [VNPay Sandbox Setup](./VNPAY_SANDBOX_SETUP.md#troubleshooting)
- Cursor performance: [Cursor Indexing Guide](./CURSOR_INDEXING_GUIDE.md#troubleshooting)
- Cursor không hiểu prompt: [Cursor Prompting Guide](./CURSOR_PROMPTING_GUIDE.md#common-mistakes)
- Deployment issues: [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Lưu ý:** Tất cả tài liệu được tổ chức trong folder `docs/` để giữ project root gọn gàng.
