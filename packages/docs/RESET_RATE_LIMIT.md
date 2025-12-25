# Reset Rate Limit Guide

## Vấn đề: 429 Too Many Requests

Khi bạn gặp lỗi **429 Too Many Requests**, có nghĩa là bạn đã vượt quá giới hạn số lần đăng nhập trong một khoảng thời gian.

## Cách Reset Rate Limit

### ⚠️ Quan Trọng

Rate limit được lưu trong **memory** của server process. Cách duy nhất để reset ngay là **restart server**.

### Option 1: Restart Server (Khuyến nghị - Nhanh nhất)

```bash
# Trong terminal đang chạy server
# Nhấn Ctrl+C để dừng server
# Sau đó start lại:
cd server
npm start
```

### Option 2: Đợi tự động reset

- **Development mode**: Đợi **5 phút**
- **Production mode**: Đợi **15 phút**

## Rate Limit Configuration

### Development Mode
- **Limit:** 20 requests
- **Window:** 5 phút
- **Skip successful requests:** Có (chỉ đếm failed logins)

### Production Mode
- **Limit:** 5 requests
- **Window:** 15 phút
- **Skip successful requests:** Có (chỉ đếm failed logins)

## Quick Test

Sau khi restart server, test login:

1. **Restart server:**
   ```bash
   # Trong terminal đang chạy server
   # Nhấn Ctrl+C để dừng
   # Sau đó:
   cd server
   npm start
   ```

2. **Login ngay:**
   - Email: `admin@example.com`
   - Password: `admin123`

## Notes

- **Successful logins không bị đếm** vào rate limit
- Chỉ **failed logins** mới bị đếm
- Trong development, có thể clear rate limit bằng API
- Trong production, chỉ có thể restart server hoặc đợi

## Troubleshooting

### Vẫn bị 429 sau khi reset?

1. **Kiểm tra server đang chạy:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Kiểm tra rate limit status:**
   ```bash
   curl http://localhost:3000/api/auth/rate-limit-status
   ```

3. **Thử restart server:**
   - Đảm bảo server được restart hoàn toàn
   - Kiểm tra không có process cũ đang chạy

### Script Helper

Chạy script để xem hướng dẫn:
```bash
cd server
node scripts/clearRateLimit.js
```
