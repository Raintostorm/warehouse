# Rate Limiting Guide

## Vấn đề: Lỗi 429 (Too Many Requests)

Khi bạn thấy lỗi `429 Too Many Requests` khi login, điều này có nghĩa là bạn đã vượt quá giới hạn số lần đăng nhập trong một khoảng thời gian.

## Cấu hình Rate Limiting

### Development Mode
- **Limit**: 20 requests
- **Window**: 5 phút
- **Skip successful requests**: Có (chỉ đếm failed logins)

### Production Mode
- **Limit**: 5 requests
- **Window**: 15 phút
- **Skip successful requests**: Có (chỉ đếm failed logins)

## Cách Fix

### Option 1: Đợi tự động reset
- Rate limit sẽ tự động reset sau khi window hết hạn (5 phút trong dev, 15 phút trong production)
- Bạn có thể xem `retryAfter` trong error message để biết còn bao lâu

### Option 2: Restart server (Development only)
```bash
# Dừng server (Ctrl+C)
# Sau đó start lại
cd server
npm start
```

### Option 3: Clear Redis (nếu dùng Redis)
```bash
# Nếu bạn dùng Redis cho rate limiting
redis-cli FLUSHDB
```

### Option 4: Đợi và thử lại
- Trong development, successful logins không bị đếm
- Chỉ failed logins mới bị đếm
- Nếu bạn login thành công, rate limit sẽ không tăng

## Kiểm tra Rate Limit Status

Response headers sẽ chứa thông tin về rate limit:
- `X-RateLimit-Limit`: Số requests tối đa
- `X-RateLimit-Remaining`: Số requests còn lại
- `X-RateLimit-Reset`: Thời gian reset (timestamp)

## Error Response

Khi bị rate limit, bạn sẽ nhận được response như sau:

```json
{
  "success": false,
  "message": "Quá nhiều lần đăng nhập. Vui lòng thử lại sau 5 phút",
  "error": "Too many requests",
  "retryAfter": 300,
  "retryAfterFormatted": "5 phút",
  "limit": 20,
  "remaining": 0,
  "windowMs": 300000
}
```

## Best Practices

1. **Không spam login**: Nếu login fail, đợi một chút trước khi thử lại
2. **Kiểm tra credentials**: Đảm bảo email/password đúng trước khi thử nhiều lần
3. **Development**: Rate limit cao hơn để dễ test, nhưng vẫn nên cẩn thận
4. **Production**: Rate limit thấp hơn để bảo vệ khỏi brute force attacks

## Troubleshooting

### Vẫn bị rate limit sau khi đợi?
- Kiểm tra xem có nhiều requests đang được gửi không (có thể do auto-retry)
- Kiểm tra Redis connection (nếu dùng Redis)
- Restart server trong development

### Rate limit quá thấp trong development?
- Cấu hình đã được tối ưu cho development (20 requests / 5 phút)
- Nếu cần, bạn có thể tăng trong `server/middlewares/rateLimiter.js`

### Muốn disable rate limiting trong development?
Không khuyến khích, nhưng bạn có thể comment out middleware trong `server/routes/auth.js`:

```javascript
// router.post('/login', loginLimiter, AuthC.login);
router.post('/login', AuthC.login); // Không có rate limiting
```

## Tham khảo

- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
