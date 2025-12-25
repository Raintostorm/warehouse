# Hướng Dẫn Debug VNPay "Sai chữ ký" (Code 70)

## Tình Trạng Hiện Tại

Code đã được cập nhật để match 100% với VNPay demo chính thức:
- ✅ Dùng package `qs` (không phải `querystring` built-in)
- ✅ Hàm `sortObject` giống hệt VNPay demo
- ✅ Dùng `qs.stringify` với `{ encode: false }`
- ✅ Dùng `Buffer.from` (tương đương `new Buffer`)

**Nhưng vẫn bị lỗi "Sai chữ ký" (Code 70).**

## Các Nguyên Nhân Có Thể

### 1. **Secret Key Không Đúng** ⚠️ QUAN TRỌNG NHẤT

**Kiểm tra:**
- Mở file `server/.env`
- Xác nhận `VNPAY_SECRET_KEY` đúng 100% (không có space, không có ký tự lạ)
- Copy trực tiếp từ VNPay dashboard (không tự gõ)

**Cách verify:**
```bash
cd server
node -e "console.log(require('dotenv').config().parsed.VNPAY_SECRET_KEY)"
```

### 2. **TMN Code Không Đúng**

- Xác nhận `VNPAY_TMN_CODE` trong `.env` đúng với VNPay dashboard
- Không có space, không có ký tự lạ

### 3. **Timezone Khác Biệt**

VNPay demo dùng:
```javascript
process.env.TZ = 'Asia/Ho_Chi_Minh';
let createDate = moment(date).format('YYYYMMDDHHmmss');
```

Code hiện tại dùng `toISOString()` (UTC). Có thể cần cài `moment` và dùng timezone `Asia/Ho_Chi_Minh`.

### 4. **IP Address Format**

Trong logs, tôi thấy: `vnp_IpAddr=%3A%3A1` (đã encode `::1`)

VNPay có thể không chấp nhận IPv6 localhost. Thử dùng `127.0.0.1` thay vì `::1`.

### 5. **Return URL Format**

Kiểm tra `VNPAY_RETURN_URL` trong `.env`:
- Phải là URL đầy đủ: `http://localhost:5173/payment/success`
- Không có trailing slash
- Không có space

## Cách Debug Từng Bước

### Bước 1: So Sánh Với VNPay Demo

1. Chạy VNPay demo:
```bash
cd vnpay_nodejs/vnpay_nodejs
npm install
# Cập nhật config/default.json với TMN Code và Secret Key của bạn
npm start
```

2. Tạo payment từ demo và xem logs
3. So sánh `signData` từ demo với `signData` từ code của bạn

### Bước 2: Test Với Postman/curl

Tạo script test đơn giản để so sánh signature:

```javascript
// test-vnpay-signature.js
const crypto = require('crypto');
const qs = require('qs');

// Copy từ VNPay demo
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// Test params (copy từ logs của bạn)
const params = {
    vnp_Amount: "857500000",
    vnp_Command: "pay",
    vnp_CreateDate: "20251222055212",
    vnp_CurrCode: "VND",
    vnp_IpAddr: "::1",
    vnp_Locale: "vn",
    vnp_OrderInfo: "Thanh toan don hang ORD014",
    vnp_OrderType: "other",
    vnp_ReturnUrl: "http://localhost:5173/payment/success",
    vnp_TmnCode: "RPNQZJRD",
    vnp_TxnRef: "VNPAY1766382732980_ORD014",
    vnp_Version: "2.1.0"
};

const secretKey = "XUKHQQOC4QJXCM27KEXR6SGIO8XL8IPG"; // Từ .env của bạn

const sorted = sortObject(params);
const signData = qs.stringify(sorted, { encode: false });
const hmac = crypto.createHmac("sha512", secretKey);
const hash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("Sign Data:", signData);
console.log("Hash:", hash);
```

### Bước 3: Kiểm Tra VNPay Dashboard

1. Đăng nhập VNPay sandbox dashboard
2. Kiểm tra lại:
   - TMN Code
   - Secret Key (Hash Secret)
   - IPN URL đã cấu hình đúng chưa
   - Return URL đã cấu hình đúng chưa

### Bước 4: Liên Hệ VNPay Support

Nếu đã thử tất cả:
- Email: `hotrovnpay@vnpay.vn`
- Cung cấp:
  - TMN Code
  - Transaction ID (từ logs)
  - Sign Data (từ logs)
  - Hash generated (từ logs)
  - Screenshot lỗi

## Checklist Trước Khi Test Lại

- [ ] `VNPAY_TMN_CODE` trong `.env` đúng 100% (copy từ dashboard)
- [ ] `VNPAY_SECRET_KEY` trong `.env` đúng 100% (copy từ dashboard)
- [ ] Không có space/whitespace trong credentials
- [ ] Đã restart server sau khi sửa `.env`
- [ ] `VNPAY_RETURN_URL` đúng format (không có trailing slash)
- [ ] IP address là `127.0.0.1` (không phải `::1`)
- [ ] Đã test với VNPay demo để verify credentials

## Tài Liệu Tham Khảo

- VNPay API Documentation: https://sandbox.vnpayment.vn/apis/
- VNPay Demo Code: `vnpay_nodejs/vnpay_nodejs/routes/order.js`
- VNPay Support: `hotrovnpay@vnpay.vn`

## Lưu Ý Quan Trọng

**Nếu vẫn không được sau khi đã thử tất cả:**
1. Có thể VNPay sandbox có bug hoặc thay đổi API
2. Có thể credentials của bạn chưa được kích hoạt đúng
3. Có thể cần liên hệ VNPay support để verify account

**Tạm thời, bạn có thể:**
- Sử dụng Cash payment (đã hoạt động)
- Chờ VNPay support phản hồi
- Test với credentials khác (nếu có)
