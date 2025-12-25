# Hướng Dẫn Nhanh Setup VNPay Sandbox

## Bước 1: Đăng Ký VNPay Sandbox

1. Truy cập: **https://sandbox.vnpayment.vn/**
2. Điền form đăng ký merchant test environment:
   - **Tên website**: Tên website/app của bạn (ví dụ: "My Payment System")
   - **Địa chỉ URL**: ⚠️ **QUAN TRỌNG**: VNPay không chấp nhận `localhost`!
     - **Cách 1 (Khuyến nghị)**: Sử dụng ngrok để tạo public URL:
       ```bash
       # Cài đặt ngrok: https://ngrok.com/download
       ngrok http 5173
       ```
       Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`) và dùng URL này
     - **Cách 2**: Dùng domain test giả (chỉ để đăng ký):
       - Ví dụ: `https://my-payment-system.test` hoặc `https://test-payment.com`
       - Lưu ý: URL này chỉ dùng để đăng ký, không cần phải hoạt động thật
   - **Email**: Email của bạn (đã có sẵn trong form)
   - **Mật khẩu**: Tạo mật khẩu mạnh
   - **Nhập lại mật khẩu**: Nhập lại mật khẩu
   - **Mã xác nhận**: Nhập mã captcha hiển thị (ví dụ: "XLENTY")
3. Click nút **"Đăng ký"** (màu xanh)
4. Kiểm tra email để xác thực tài khoản (nếu cần)
5. Đăng nhập vào dashboard

## Bước 2: Lấy Credentials

Sau khi đăng nhập:

1. Vào **Quản lý Merchant** hoặc **Cấu hình**
2. Tìm các thông tin sau:
   - **TMN Code** (Terminal Code) - Ví dụ: `2QXUI4J4`
   - **Secret Key** (Hash Secret) - Ví dụ: `RAOCTKRKRSSJQZJZVJZBGNRTQNNQZJZP`

## Bước 3: Cấu Hình .env

Mở file `.env` trong thư mục `server/` và thêm:

```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=YOUR_TMN_CODE_HERE
VNPAY_SECRET_KEY=YOUR_SECRET_KEY_HERE
VNPAY_RETURN_URL=http://localhost:5173/payment/success
VNPAY_IPN_URL=http://localhost:3000/api/payments/gateway/vnpay/ipn

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Thay thế:**
- `YOUR_TMN_CODE_HERE` → TMN Code từ VNPay dashboard
- `YOUR_SECRET_KEY_HERE` → Secret Key từ VNPay dashboard

## Bước 4: Restart Server

Sau khi cập nhật `.env`, restart server:

```bash
cd server
npm start
```

## Bước 5: Kiểm Tra

1. Mở Payment page trong app
2. Chọn "VNPay (Sandbox)" trong payment method
3. Bạn sẽ thấy: **"✓ VNPAY Sandbox Mode - Ready"** (màu xanh)
4. Nếu vẫn thấy "✗ VNPAY Sandbox Mode - Not Configured" → Kiểm tra lại `.env` và restart server

## Lưu Ý Quan Trọng

### IPN URL cho Local Development

Nếu bạn cần test IPN (Instant Payment Notification) từ VNPay:

1. **Sử dụng ngrok** để expose local server:
   ```bash
   ngrok http 3000
   ```

2. Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)

3. Cập nhật `.env`:
   ```env
   VNPAY_IPN_URL=https://abc123.ngrok.io/api/payments/gateway/vnpay/ipn
   ```

4. Cập nhật IPN URL trong VNPay dashboard

### Test Payment

- VNPay sandbox cho phép test với thẻ test
- Không cần thẻ thật
- Tất cả giao dịch đều là test, không tính phí

## Troubleshooting

### Lỗi: "Không đúng định dạng Url" khi đăng ký

**Nguyên nhân:**
- VNPay Sandbox không chấp nhận `localhost` hoặc `127.0.0.1` trong form đăng ký
- URL phải có format hợp lệ với domain thật hoặc public URL

**Giải pháp:**

**Cách 1: Sử dụng ngrok (Khuyến nghị cho development)**
```bash
# Cài đặt ngrok: https://ngrok.com/download
# Chạy ngrok để expose frontend
ngrok http 5173
```
- Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)
- Dùng URL này trong form đăng ký
- Sau khi đăng ký xong, bạn vẫn có thể dùng `localhost` trong `.env` cho development

**Cách 2: Dùng domain test giả**
- Dùng một URL test bất kỳ có format hợp lệ
- Ví dụ: `https://my-payment-system.test` hoặc `https://test-payment.com`
- URL này chỉ cần để đăng ký, không cần hoạt động thật
- Sau khi đăng ký xong, bạn vẫn dùng `localhost` trong code

**Lưu ý:** URL trong form đăng ký chỉ để VNPay lưu thông tin merchant. Bạn vẫn có thể dùng `localhost` trong `.env` và code của mình.

### Lỗi: "Gateway vnpay is not configured"

**Nguyên nhân:**
- Chưa thêm credentials vào `.env`
- Credentials sai format
- Chưa restart server sau khi cập nhật `.env`

**Giải pháp:**
1. Kiểm tra file `.env` trong `server/` có đúng format không
2. Đảm bảo không có khoảng trắng thừa
3. Restart server
4. Kiểm tra gateway status: `GET /api/payments/gateway/status`

### Lỗi: "VNPay TMN Code is not configured"

- Kiểm tra `VNPAY_TMN_CODE` trong `.env`
- Đảm bảo giá trị không phải là `YOUR_TMN_CODE` hoặc rỗng

### Lỗi: "VNPay Secret Key is not configured"

- Kiểm tra `VNPAY_SECRET_KEY` trong `.env`
- Đảm bảo giá trị không phải là `YOUR_SECRET_KEY` hoặc rỗng

### Lỗi: "Sai chữ ký" (Code 70) từ VNPay

**Nguyên nhân:**
- Secret Key không đúng hoặc không được load đúng từ `.env`
- Cách tạo signature không đúng format VNPay
- Parameters bị thiếu hoặc sai thứ tự

**Giải pháp:**

1. **Kiểm tra Secret Key trong `.env`:**
   ```env
   VNPAY_SECRET_KEY=XUKHQQOC4QJXCM27KEXR6SGIO8XL8IPG
   ```
   - Đảm bảo không có khoảng trắng thừa
   - Đảm bảo Secret Key đúng từ email VNPay
   - Restart server sau khi cập nhật

2. **Kiểm tra TMN Code:**
   ```env
   VNPAY_TMN_CODE=RPNQZJRD
   ```
   - Đảm bảo TMN Code đúng từ email VNPay

3. **Kiểm tra server logs:**
   - Xem log khi tạo payment URL
   - Kiểm tra xem Secret Key có được load đúng không
   - Kiểm tra signature creation process

4. **Verify credentials:**
   - Đăng nhập vào VNPay Sandbox dashboard: https://sandbox.vnpayment.vn/merchantv2/
   - Kiểm tra lại TMN Code và Secret Key trong dashboard
   - Đảm bảo credentials trong `.env` khớp với dashboard

5. **Common issues:**
   - Secret Key có khoảng trắng ở đầu/cuối → Xóa khoảng trắng
   - Copy/paste Secret Key bị sai → Copy lại từ email
   - Server chưa restart sau khi cập nhật `.env` → Restart server

## Liên Hệ

Nếu gặp vấn đề, tham khảo:
- Tài liệu đầy đủ: `docs/VNPAY_SANDBOX_SETUP.md`
- VNPay Sandbox: https://sandbox.vnpayment.vn/
