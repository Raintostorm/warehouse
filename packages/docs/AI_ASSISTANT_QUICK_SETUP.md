# AI Assistant Quick Setup - 5 Phút

## Bước 1: Lấy Google Gemini API Key (2 phút)

1. **Truy cập:** https://makersuite.google.com/app/apikey
2. **Đăng nhập** với Google account của bạn
3. **Click "Create API Key"** (hoặc "Get API Key")
4. **Copy API key** (dạng: `AIzaSy...`)

> 💡 **Lưu ý:** API key này là **MIỄN PHÍ** với quota hợp lý cho development/testing

## Bước 2: Thêm vào server/.env (1 phút)

Mở file `server/.env` và thêm dòng này:

```env
GEMINI_API_KEY=AIzaSy...your_api_key_here
```

**Ví dụ:**
```env
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

> ⚠️ **QUAN TRỌNG:** 
> - Không có space trước/sau dấu `=`
> - Không có quotes (`"` hoặc `'`)
> - Copy chính xác API key

## Bước 3: Restart Server (1 phút)

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
cd server
npm start
```

## Bước 4: Kiểm Tra (1 phút)

1. **Mở lại ứng dụng** trong browser
2. **Click nút 💬** ở góc dưới bên phải
3. **Kiểm tra:**
   - ✅ Nếu thấy **"Đang hoạt động"** → Setup thành công!
   - ❌ Nếu vẫn thấy **"Không khả dụng"** → Xem Troubleshooting bên dưới

## ✅ Test AI

Thử hỏi AI:
- "Tổng số sản phẩm là bao nhiêu?"
- "Doanh thu tháng này là bao nhiêu?"
- "Sản phẩm nào sắp hết hàng?"

## 🐛 Troubleshooting

### Vẫn thấy "Không khả dụng"

**Kiểm tra:**
1. ✅ File `server/.env` có dòng `GEMINI_API_KEY=...` không?
2. ✅ API key có đúng format không? (bắt đầu bằng `AIzaSy`)
3. ✅ Đã restart server sau khi thêm API key chưa?
4. ✅ Kiểm tra server logs có lỗi gì không?

**Kiểm tra server logs:**
```bash
cd server
npm start
```

Tìm dòng:
- ✅ `✅ Gemini AI initialized successfully` → OK
- ❌ `⚠️ GEMINI_API_KEY not set` → Chưa thêm vào .env
- ❌ `❌ Failed to initialize Gemini AI` → API key sai

### Lỗi "Invalid API Key"

**Nguyên nhân:**
- API key không đúng
- API key đã bị revoke
- Copy thiếu ký tự

**Giải pháp:**
1. Vào lại https://makersuite.google.com/app/apikey
2. Tạo API key mới
3. Copy lại chính xác vào `.env`
4. Restart server

### Lỗi "Quota exceeded"

**Nguyên nhân:**
- Đã dùng hết free quota

**Giải pháp:**
- Đợi reset quota (thường là theo ngày/tháng)
- Hoặc upgrade lên paid plan

## 📞 Cần Giúp?

Xem tài liệu đầy đủ: [`docs/AI_ASSISTANT_SETUP.md`](./AI_ASSISTANT_SETUP.md)
