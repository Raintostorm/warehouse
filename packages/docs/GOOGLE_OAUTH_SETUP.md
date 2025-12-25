# Google OAuth Setup Guide

## Lỗi 403: "The given origin is not allowed for the given client ID"

Lỗi này xảy ra khi origin của ứng dụng (ví dụ: `http://localhost:5173`) chưa được thêm vào Google Cloud Console.

## Cách Fix

### Bước 1: Mở Google Cloud Console

1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Chọn project của bạn (hoặc tạo project mới)
3. Tìm OAuth 2.0 Client ID của bạn (Client ID: `586869650679-aq36mi8vkeu09tkcv1o3v1gn8lu9b1th.apps.googleusercontent.com`)

### Bước 2: Thêm Authorized JavaScript origins

1. Click vào OAuth 2.0 Client ID của bạn
2. Trong phần **"Authorized JavaScript origins"**, click **"+ ADD URI"**
3. Thêm các origins sau:
   - `http://localhost:5173` (cho development)
   - `http://localhost:3000` (nếu cần)
   - `http://localhost:80` (nếu cần)
   - URL production của bạn (khi deploy)

### Bước 3: Thêm Authorized redirect URIs (nếu cần)

1. Trong phần **"Authorized redirect URIs"**, thêm:
   - `http://localhost:5173` (cho development)
   - URL production của bạn (khi deploy)

### Bước 4: Lưu và đợi

1. Click **"SAVE"**
2. Đợi **5-10 phút** để Google cập nhật cấu hình
3. Refresh trang web của bạn

## Kiểm tra

Sau khi cấu hình xong, lỗi 403 sẽ biến mất và Google Sign-In button sẽ hoạt động bình thường.

## Troubleshooting

### Vẫn thấy lỗi 403 sau khi cấu hình?

1. **Kiểm tra lại Client ID**: Đảm bảo Client ID trong `.env` khớp với Client ID trong Google Console
2. **Kiểm tra origin**: Đảm bảo origin bạn thêm vào Google Console khớp chính xác với URL hiện tại (bao gồm cả `http://` hoặc `https://`)
3. **Đợi lâu hơn**: Đôi khi Google cần đến 15 phút để cập nhật
4. **Clear cache**: Thử clear browser cache và hard refresh (Ctrl+Shift+R)

### Không muốn dùng Google Sign-In?

Nếu bạn không muốn dùng Google Sign-In, bạn có thể:
- Bỏ qua lỗi 403 (nó không ảnh hưởng đến login bằng email/password)
- Hoặc comment out Google Sign-In button trong code

## Environment Variables

Đảm bảo bạn có các biến môi trường sau:

**Client (`.env` trong `client/`):**
```env
VITE_GOOGLE_CLIENT_ID=586869650679-aq36mi8vkeu09tkcv1o3v1gn8lu9b1th.apps.googleusercontent.com
```

**Server (`.env` trong `server/`):**
```env
GOOGLE_CLIENT_ID=586869650679-aq36mi8vkeu09tkcv1o3v1gn8lu9b1th.apps.googleusercontent.com
```

## Tham khảo

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
