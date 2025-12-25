# Hướng Dẫn Setup VNPay Sandbox

Tài liệu chi tiết về cách tích hợp và sử dụng VNPay Sandbox trong hệ thống.

## Mục Lục

1. [Đăng Ký Tài Khoản VNPay Sandbox](#đăng-ký-tài-khoản-vnpay-sandbox)
2. [Cấu Hình Backend](#cấu-hình-backend)
3. [Cấu Hình Frontend](#cấu-hình-frontend)
4. [Kiểm Tra Tích Hợp](#kiểm-tra-tích-hợp)
5. [Test Thanh Toán](#test-thanh-toán)
6. [Troubleshooting](#troubleshooting)

## Đăng Ký Tài Khoản VNPay Sandbox

### Bước 1: Đăng Ký Tài Khoản

1. Truy cập: https://sandbox.vnpayment.vn/
2. Đăng ký tài khoản mới hoặc đăng nhập nếu đã có
3. Xác thực email nếu cần

### Bước 2: Tạo Merchant Account

1. Sau khi đăng nhập, vào **Quản lý Merchant**
2. Tạo merchant mới hoặc sử dụng merchant có sẵn
3. Lưu lại các thông tin sau:
   - **TMN Code** (Terminal Code)
   - **Secret Key** (Hash Secret)

### Bước 3: Cấu Hình IPN URL

1. Vào **Cấu hình** → **IPN URL**
2. Thêm IPN URL: `http://your-domain.com/api/payments/gateway/vnpay/ipn`
   - **Lưu ý**: Với local development, bạn cần sử dụng ngrok hoặc công cụ tương tự để expose local server ra internet
   - Ví dụ với ngrok: `https://abc123.ngrok.io/api/payments/gateway/vnpay/ipn`

## Cấu Hình Backend

### Bước 1: Thêm Biến Môi Trường

Thêm các biến sau vào file `.env` trong thư mục `server/`:

```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=YOUR_TMN_CODE_HERE
VNPAY_SECRET_KEY=YOUR_SECRET_KEY_HERE
VNPAY_RETURN_URL=http://localhost:5173/payment/success
VNPAY_IPN_URL=http://localhost:3000/api/payments/gateway/vnpay/ipn

# Frontend URL (for redirects after payment)
FRONTEND_URL=http://localhost:5173
```

**Lưu ý quan trọng:**

- Thay `YOUR_TMN_CODE_HERE` bằng TMN Code từ VNPay dashboard
- Thay `YOUR_SECRET_KEY_HERE` bằng Secret Key từ VNPay dashboard
- `VNPAY_RETURN_URL`: URL frontend để redirect sau khi thanh toán thành công
- `VNPAY_IPN_URL`: URL backend để nhận IPN từ VNPay (phải accessible từ internet)

### Bước 2: Cấu Hình IPN URL Cho Local Development

Nếu bạn đang develop local và cần test IPN:

1. **Sử dụng ngrok:**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   ```

2. Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)

3. Cập nhật `.env`:
   ```env
   VNPAY_IPN_URL=https://abc123.ngrok.io/api/payments/gateway/vnpay/ipn
   ```

4. Cập nhật IPN URL trong VNPay dashboard

### Bước 3: Kiểm Tra Cấu Hình

Khởi động server và kiểm tra:

```bash
cd server
npm start
```

Kiểm tra gateway status:
```bash
curl http://localhost:3000/api/payments/gateway/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response sẽ cho biết VNPay đã được cấu hình hay chưa:
```json
{
  "success": true,
  "data": {
    "vnpay": {
      "enabled": true,
      "sandbox": true,
      "config": {
        "url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        "tmnCode": "YOUR_TMN_CODE",
        "returnUrl": "http://localhost:5173/payment/success",
        "ipnUrl": "http://localhost:3000/api/payments/gateway/vnpay/ipn"
      }
    }
  }
}
```

## Cấu Hình Frontend

Frontend đã được cấu hình sẵn. Chỉ cần đảm bảo:

1. **API URL đúng:** Kiểm tra `VITE_API_URL` trong `.env` của client
2. **Routing:** Frontend tự động xử lý routing cho `/payment/success` và `/payment/failed`

## Kiểm Tra Tích Hợp

### 1. Kiểm Tra Gateway Status

Vào trang **Payments** → Click **New Payment** → Chọn **VNPay** trong dropdown Payment Method

Bạn sẽ thấy:
- ✅ **Xanh**: VNPay đã được cấu hình và sẵn sàng
- ❌ **Đỏ**: VNPay chưa được cấu hình

### 2. Test Payment Flow

1. Vào trang **Payments**
2. Click **New Payment**
3. Chọn **Order ID** và nhập **Amount**
4. Chọn **VNPay** trong Payment Method
5. Click **Pay with VNPay**
6. Bạn sẽ được redirect đến trang thanh toán VNPay Sandbox

## Test Thanh Toán

### Thông Tin Thẻ Test

VNPay Sandbox cung cấp các thẻ test sau:

**Ngân hàng NCB:**
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày hết hạn**: `07/15`
- **OTP**: `123456`

**Ngân hàng khác:**
- Xem thêm tại: https://sandbox.vnpayment.vn/apis/docs/gioi-thieu/

### Quy Trình Test

1. **Tạo Payment:**
   - Chọn order và amount
   - Chọn VNPay
   - Click "Pay with VNPay"

2. **Thanh Toán:**
   - Bạn sẽ được redirect đến trang VNPay Sandbox
   - Nhập thông tin thẻ test
   - Nhập OTP: `123456`
   - Click "Thanh toán"

3. **Kết Quả:**
   - **Thành công**: Redirect về `/payment/success` với payment details
   - **Thất bại**: Redirect về `/payment/failed` với error message

### Kiểm Tra Payment Record

Sau khi thanh toán thành công:

1. Vào trang **Payments**
2. Tìm payment record mới được tạo
3. Kiểm tra:
   - Payment Status: `completed`
   - Payment Method: `vnpay`
   - Transaction ID: Có giá trị từ VNPay
   - Amount: Đúng với số tiền đã thanh toán

## Troubleshooting

### Vấn Đề: Gateway không được enable

**Nguyên nhân:**
- TMN Code hoặc Secret Key chưa được cấu hình đúng
- Giá trị trong `.env` vẫn là placeholder

**Giải pháp:**
1. Kiểm tra file `.env` trong `server/`
2. Đảm bảo `VNPAY_TMN_CODE` và `VNPAY_SECRET_KEY` đã được thay thế
3. Restart server sau khi cập nhật `.env`

### Vấn Đề: Payment URL không được tạo

**Nguyên nhân:**
- TMN Code hoặc Secret Key không hợp lệ
- IP address không được lấy đúng

**Giải pháp:**
1. Kiểm tra logs trong server console
2. Kiểm tra TMN Code và Secret Key trong VNPay dashboard
3. Đảm bảo server có `trust proxy` enabled (đã có trong `server.js`)

### Vấn Đề: Callback không hoạt động

**Nguyên nhân:**
- Return URL không đúng
- Frontend routing không khớp

**Giải pháp:**
1. Kiểm tra `VNPAY_RETURN_URL` trong `.env`
2. Đảm bảo frontend có route cho `/payment/success` và `/payment/failed`
3. Kiểm tra logs trong server console

### Vấn Đề: IPN không được nhận

**Nguyên nhân:**
- IPN URL không accessible từ internet
- IPN URL chưa được cấu hình trong VNPay dashboard

**Giải pháp:**
1. Sử dụng ngrok hoặc công cụ tương tự để expose local server
2. Cập nhật IPN URL trong VNPay dashboard
3. Cập nhật `VNPAY_IPN_URL` trong `.env`
4. Kiểm tra logs trong server console

### Vấn Đề: Payment không được tạo sau callback

**Nguyên nhân:**
- Order ID không tồn tại
- Database connection issue
- Error trong payment creation logic

**Giải pháp:**
1. Kiểm tra Order ID có tồn tại không
2. Kiểm tra database connection
3. Xem logs trong server console để tìm lỗi cụ thể
4. Kiểm tra payment model và service

### Vấn Đề: Hash verification failed

**Nguyên nhân:**
- Secret Key không đúng
- Format của parameters không đúng

**Giải pháp:**
1. Kiểm tra Secret Key trong `.env` và VNPay dashboard
2. Đảm bảo Secret Key không có khoảng trắng thừa
3. Kiểm tra logs để xem hash được tạo như thế nào

## API Endpoints

### Initiate Payment

```http
POST /api/payments/gateway/initiate
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "ORDER123",
  "amount": 100000,
  "gateway": "vnpay",
  "orderInfo": "Thanh toan don hang ORDER123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "txnRef": "VNPAY1234567890_ORDER123",
    "gateway": "vnpay",
    "sandbox": true
  }
}
```

### Get Gateway Status

```http
GET /api/payments/gateway/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vnpay": {
      "enabled": true,
      "sandbox": true,
      "config": {
        "url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        "tmnCode": "YOUR_TMN_CODE",
        "returnUrl": "http://localhost:5173/payment/success",
        "ipnUrl": "http://localhost:3000/api/payments/gateway/vnpay/ipn"
      }
    }
  }
}
```

### Callback URLs (Called by VNPay)

- **Return URL**: `GET /api/payments/gateway/vnpay/callback`
- **IPN URL**: `GET /api/payments/gateway/vnpay/ipn`

## Lưu Ý Quan Trọng

⚠️ **SANDBOX MODE ONLY**: Hệ thống hiện tại chỉ hỗ trợ sandbox mode. Tất cả các giao dịch đều là test và không có tiền thật được chuyển.

⚠️ **Không Chuyển Sang Production**: Để chuyển sang production mode, bạn cần:
1. Đăng ký tài khoản production với VNPay
2. Cập nhật credentials trong `.env`
3. Cập nhật URLs cho production
4. Có thể cần điều chỉnh code để hỗ trợ production APIs

⚠️ **IPN URL**: IPN URL phải accessible từ internet. Với local development, sử dụng ngrok hoặc công cụ tương tự.

⚠️ **Security**: Không commit file `.env` lên git. File này đã được thêm vào `.gitignore`.

## Tài Liệu Tham Khảo

- VNPay Sandbox: https://sandbox.vnpayment.vn/
- VNPay API Documentation: https://sandbox.vnpayment.vn/apis/
- VNPay Node.js Library: https://www.npmjs.com/package/vnpay

## Files Liên Quan

- `server/services/paymentGatewayS.js` - Service xử lý VNPay integration
- `server/controllers/paymentsC.js` - Controller xử lý payment requests
- `server/routes/payments.js` - Routes cho payment API
- `client/components/Payments.jsx` - UI component cho payments
- `client/components/PaymentCallback.jsx` - Component hiển thị kết quả thanh toán
- `client/services/api.js` - API client methods
