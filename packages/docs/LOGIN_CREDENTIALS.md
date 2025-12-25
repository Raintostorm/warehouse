# Login Credentials

## Default Login Credentials

### 👤 Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** Admin
- **ID:** U001

### 👤 Manager Account
- **Email:** `manager@example.com`
- **Password:** `manager123`
- **Role:** Manager
- **ID:** U002

### 👤 Staff Accounts (3 users)
- **Email:** `staff1@example.com`, `staff2@example.com`, `staff3@example.com`
- **Password:** `staff123` (cho tất cả)
- **Role:** Staff
- **IDs:** U003, U004, U005

## Reset Rate Limit

Nếu bạn gặp lỗi **429 Too Many Requests**, có 2 cách để reset:

### Option 1: Restart Server (Nhanh nhất)
```bash
# Dừng server (Ctrl+C)
# Sau đó start lại
cd server
npm start
```

### Option 2: Đợi tự động reset
- Trong **development mode**: Đợi **5 phút**
- Trong **production mode**: Đợi **15 phút**

## Rate Limit Configuration

### Development Mode
- **Limit:** 20 requests
- **Window:** 5 phút
- **Skip successful requests:** Có (chỉ đếm failed logins)

### Production Mode
- **Limit:** 5 requests
- **Window:** 15 phút
- **Skip successful requests:** Có (chỉ đếm failed logins)

## Notes

- Rate limit được lưu trong **memory** (không dùng Redis trong development)
- **Successful logins không bị đếm** vào rate limit
- Chỉ **failed logins** mới bị đếm
- Restart server sẽ **clear tất cả rate limits** ngay lập tức

## Testing

Để test login, chạy:
```bash
cd server
node scripts/testLogin.js
```

Script này sẽ:
- Kiểm tra user có tồn tại không
- Test password có đúng không
- Báo kết quả
