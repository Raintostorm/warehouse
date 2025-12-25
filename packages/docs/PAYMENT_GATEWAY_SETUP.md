# Payment Gateway Setup Guide - Sandbox Mode

Hệ thống thanh toán đã được tích hợp với các payment gateway phổ biến ở Việt Nam ở chế độ **SANDBOX** (chỉ để test).

## Các Payment Gateway Được Hỗ Trợ

1. **VNPay** - https://sandbox.vnpayment.vn/
2. **MoMo** - https://developers.momo.vn/
3. **ZaloPay** - https://developers.zalopay.vn/

## Cấu Hình

### 1. Thêm Biến Môi Trường

Thêm các biến sau vào file `.env` trong thư mục `server/`:

```env
# VNPay Sandbox Configuration
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_SECRET_KEY=YOUR_SECRET_KEY
VNPAY_RETURN_URL=http://localhost:5173/payment/success
VNPAY_IPN_URL=http://localhost:3000/api/payments/gateway/vnpay/ipn

# MoMo Sandbox Configuration
MOMO_PARTNER_CODE=MOMO_PARTNER_CODE
MOMO_ACCESS_KEY=MOMO_ACCESS_KEY
MOMO_SECRET_KEY=MOMO_SECRET_KEY
MOMO_RETURN_URL=http://localhost:5173/payment/success
MOMO_NOTIFY_URL=http://localhost:3000/api/payments/gateway/momo/ipn

# ZaloPay Sandbox Configuration
ZALOPAY_APP_ID=YOUR_APP_ID
ZALOPAY_KEY1=YOUR_KEY1
ZALOPAY_KEY2=YOUR_KEY2
ZALOPAY_RETURN_URL=http://localhost:5173/payment/success
ZALOPAY_CALLBACK_URL=http://localhost:3000/api/payments/gateway/zalopay/ipn

# Frontend URL (for redirects after payment)
FRONTEND_URL=http://localhost:5173
```

### 2. Lấy Sandbox Credentials

#### VNPay Sandbox
1. Đăng ký tài khoản tại: https://sandbox.vnpayment.vn/
2. Tạo merchant account
3. Lấy `TMN Code` và `Secret Key` từ dashboard

#### MoMo Sandbox
1. Đăng ký tại: https://developers.momo.vn/
2. Tạo app và lấy credentials từ sandbox environment
3. Lấy `Partner Code`, `Access Key`, và `Secret Key`

#### ZaloPay Sandbox
1. Đăng ký tại: https://developers.zalopay.vn/
2. Tạo app và lấy credentials
3. Lấy `App ID`, `Key1`, và `Key2`

### 3. Cập Nhật URLs Cho Production

Khi deploy lên production, cập nhật các URL sau:

- `VNPAY_RETURN_URL`: URL frontend để redirect sau khi thanh toán thành công
- `VNPAY_IPN_URL`: URL backend để nhận IPN từ VNPay
- `MOMO_RETURN_URL`: URL frontend để redirect sau khi thanh toán thành công
- `MOMO_NOTIFY_URL`: URL backend để nhận notification từ MoMo
- `ZALOPAY_RETURN_URL`: URL frontend để redirect sau khi thanh toán thành công
- `ZALOPAY_CALLBACK_URL`: URL backend để nhận callback từ ZaloPay
- `FRONTEND_URL`: URL frontend của ứng dụng

## Cách Sử Dụng

### 1. Tạo Payment Qua Gateway

1. Vào trang **Payments**
2. Click **New Payment**
3. Chọn **Order ID** và nhập **Amount**
4. Chọn phương thức thanh toán: **VNPay**, **MoMo**, hoặc **ZaloPay**
5. Click **Pay with [GATEWAY]**
6. Bạn sẽ được redirect đến trang thanh toán của gateway (sandbox)
7. Sau khi hoàn tất, bạn sẽ được redirect về trang kết quả

### 2. Kiểm Tra Trạng Thái Gateway

Trong form tạo payment, khi chọn một gateway, bạn sẽ thấy:
- ✓ Xanh: Gateway đã được cấu hình và sẵn sàng
- ✗ Đỏ: Gateway chưa được cấu hình

### 3. Callback URLs

Hệ thống tự động xử lý:
- **Return URL**: Redirect người dùng về sau khi thanh toán
- **IPN/Callback URL**: Gateway gọi để cập nhật trạng thái thanh toán

## Lưu Ý Quan Trọng

⚠️ **SANDBOX MODE ONLY**: Hệ thống hiện tại chỉ hỗ trợ sandbox mode. Tất cả các giao dịch đều là test và không có tiền thật được chuyển.

⚠️ **Không Chuyển Sang Production**: Để chuyển sang production mode, bạn cần:
1. Đăng ký tài khoản production với các gateway
2. Cập nhật credentials trong `.env`
3. Cập nhật URLs cho production
4. Có thể cần điều chỉnh code để hỗ trợ production APIs

## API Endpoints

### Initiate Gateway Payment
```
POST /api/payments/gateway/initiate
Body: {
  orderId: string,
  amount: number,
  gateway: 'vnpay' | 'momo' | 'zalopay',
  orderInfo?: string
}
```

### Get Gateway Status
```
GET /api/payments/gateway/status
```

### Callback URLs (Called by Gateways)
- `GET /api/payments/gateway/vnpay/callback`
- `GET /api/payments/gateway/vnpay/ipn`
- `GET /api/payments/gateway/momo/callback`
- `POST /api/payments/gateway/momo/ipn`
- `GET /api/payments/gateway/zalopay/callback`
- `POST /api/payments/gateway/zalopay/ipn`

## Troubleshooting

### Gateway không hoạt động
1. Kiểm tra credentials trong `.env` đã đúng chưa
2. Kiểm tra URLs có đúng format không
3. Xem logs trong server console

### Callback không hoạt động
1. Đảm bảo callback URLs có thể truy cập được từ internet (sử dụng ngrok cho local dev)
2. Kiểm tra CORS settings
3. Xem logs trong server console

### Payment không được tạo sau callback
1. Kiểm tra database connection
2. Xem logs để tìm lỗi
3. Kiểm tra order ID có tồn tại không

## Files Liên Quan

- `server/services/paymentGatewayS.js` - Service xử lý payment gateway
- `server/controllers/paymentsC.js` - Controller xử lý payment requests
- `server/routes/payments.js` - Routes cho payment API
- `client/components/Payments.jsx` - UI component cho payments
- `client/components/PaymentCallback.jsx` - Component hiển thị kết quả thanh toán
- `client/services/api.js` - API client methods
