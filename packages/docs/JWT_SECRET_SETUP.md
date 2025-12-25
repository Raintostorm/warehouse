# JWT_SECRET Setup Guide

## Lỗi: "secretOrPrivateKey must have a value"

Lỗi này xảy ra khi `JWT_SECRET` không được set trong file `.env` của server.

## Cách Fix

### Bước 1: Tạo/Update file `.env` trong `server/`

Tạo hoặc mở file `server/.env` và thêm:

```env
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
```

**Lưu ý quan trọng:**
- JWT_SECRET nên có ít nhất 32 ký tự
- Sử dụng một chuỗi ngẫu nhiên, an toàn
- Không commit file `.env` vào git (đã có trong `.gitignore`)

### Bước 2: Generate một JWT_SECRET an toàn

Bạn có thể generate một secret key bằng cách:

**Option 1: Sử dụng Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Sử dụng OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Sử dụng online generator**
- https://randomkeygen.com/
- Chọn "CodeIgniter Encryption Keys" hoặc "Fort Knox Password"

### Bước 3: Thêm vào `.env`

Sau khi có secret key, thêm vào `server/.env`:

```env
JWT_SECRET=your-generated-secret-key-here-min-32-chars-long
```

### Bước 4: Restart Server

Sau khi thêm JWT_SECRET, **bắt buộc phải restart server**:

```bash
# Dừng server (Ctrl+C)
# Sau đó start lại
cd server
npm start
```

## Development Mode

Nếu bạn không set JWT_SECRET trong development, hệ thống sẽ tự động sử dụng một default value:

```
dev-secret-key-change-in-production-do-not-use-in-production
```

**⚠️ Cảnh báo:** Default value này chỉ dùng cho development. **KHÔNG** dùng trong production!

## Production Mode

Trong production, JWT_SECRET **BẮT BUỘC** phải được set. Nếu không, server sẽ không start và throw error:

```
Error: JWT_SECRET must be set in production environment
```

## Kiểm tra

Sau khi set JWT_SECRET và restart server, bạn sẽ thấy:

- ✅ Không còn warning về JWT_SECRET
- ✅ Login hoạt động bình thường
- ✅ JWT tokens được tạo thành công

## Troubleshooting

### Vẫn thấy lỗi sau khi set JWT_SECRET?

1. **Kiểm tra file `.env` có đúng vị trí không:**
   - File phải ở `server/.env` (cùng thư mục với `server.js`)

2. **Kiểm tra format:**
   ```env
   # ✅ Đúng
   JWT_SECRET=your-secret-key-here
   
   # ❌ Sai (có dấu cách)
   JWT_SECRET = your-secret-key-here
   
   # ❌ Sai (có quotes)
   JWT_SECRET="your-secret-key-here"
   ```

3. **Kiểm tra JWT_SECRET không rỗng:**
   - Đảm bảo JWT_SECRET có ít nhất 1 ký tự
   - Không có khoảng trắng thừa

4. **Restart server:**
   - Sau khi thay đổi `.env`, **bắt buộc** phải restart server
   - Chỉ reload code không đủ, cần restart hoàn toàn

5. **Kiểm tra NODE_ENV:**
   - Nếu `NODE_ENV=production`, JWT_SECRET là bắt buộc
   - Nếu không set NODE_ENV hoặc `NODE_ENV=development`, có thể dùng default

## Best Practices

1. **Sử dụng secret key khác nhau cho mỗi environment:**
   - Development: `dev-secret-key-...`
   - Staging: `staging-secret-key-...`
   - Production: `production-secret-key-...` (phải rất mạnh và ngẫu nhiên)

2. **Không commit `.env` vào git:**
   - File `.env` đã có trong `.gitignore`
   - Sử dụng `.env.example` để document các biến cần thiết

3. **Rotate JWT_SECRET định kỳ:**
   - Trong production, nên rotate JWT_SECRET định kỳ (mỗi 6-12 tháng)
   - Khi rotate, tất cả tokens cũ sẽ invalid (users cần login lại)

## Tham khảo

- [JWT.io](https://jwt.io/) - JWT documentation
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken) - JWT library documentation
