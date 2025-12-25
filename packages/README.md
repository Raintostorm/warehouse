# Packages Directory

Thư mục này chứa các file và công cụ bên ngoài được sử dụng trong dự án.

## Cấu trúc

### 📁 `ngrok/`
- **Mục đích**: Chứa ngrok executable và recovery codes
- **Nội dung**:
  - `ngrok-v3-stable-windows-amd64/ngrok.exe` - Ngrok executable
  - `ngrok_recovery_codes.txt` - Recovery codes cho ngrok account
- **Sử dụng**: Để tạo tunnel cho local development (expose local server ra internet)

### 📁 `fonts/`
- **Mục đích**: Chứa font files cho PDF generation
- **Nội dung**:
  - `Noto_Sans/` - Font Noto Sans hỗ trợ tiếng Việt
- **Lưu ý**: Fonts chính được sử dụng nằm trong `server/fonts/`, thư mục này là backup hoặc source files

### 📁 `vnpay/`
- **Mục đích**: Chứa VNPay Node.js SDK và examples
- **Nội dung**:
  - `vnpay_nodejs/` - VNPay SDK và sample code
- **Sử dụng**: Tham khảo implementation của VNPay payment gateway

### 📁 `credentials/`
- **Mục đích**: Chứa các file credentials và secrets
- **Nội dung**:
  - `client_secret_*.json` - Google OAuth2 credentials
- **⚠️ Lưu ý**: 
  - **KHÔNG commit** các file này vào git
  - Đã được thêm vào `.gitignore`
  - Chỉ dùng cho local development

### 📁 `docs/`
- **Mục đích**: Tài liệu hướng dẫn và setup guides
- **Nội dung**: Các file markdown hướng dẫn setup, deployment, troubleshooting

### 📁 `scripts/`
- **Mục đích**: Các script tiện ích
- **Nội dung**:
  - `clean-cursor-cache.*` - Scripts để clean Cursor cache
  - `deploy-production.*` - Scripts để deploy lên production

### 📁 `run test/`
- **Mục đích**: Test server và utilities
- **Nội dung**: Test files và configurations

## Lưu ý

- Tất cả các file trong `packages/` là **optional** và không ảnh hưởng đến core functionality
- Các file credentials nên được giữ bí mật và không commit vào git
- Nếu thiếu bất kỳ package nào, dự án vẫn có thể chạy được (trừ khi feature cụ thể yêu cầu)

