# Hướng Dẫn Fix Lỗi Encoding Tiếng Việt Trong Bill

## 🔴 Vấn Đề

Bill (hóa đơn) bị lỗi encoding tiếng Việt, các ký tự như "Đ", "ơ", "ế" bị hiển thị thành "&&", "&¿t", "&£n", v.v.

**Nguyên nhân:** Font `Helvetica` mặc định của PDFKit không hỗ trợ tiếng Việt.

## ✅ Giải Pháp

Đã update code để sử dụng font **Noto Sans** (hỗ trợ tiếng Việt tốt) thay vì Helvetica.

### Cách 1: Tự Động Tải Font (Khuyến Nghị)

Chạy script để tải font tự động:

```bash
cd server
node scripts/downloadFontSimple.js
```

### Cách 2: Tải Font Thủ Công

Nếu script không hoạt động (bị chặn CDN), tải font thủ công:

1. **Truy cập:** https://fonts.google.com/noto/specimen/Noto+Sans
2. **Click:** "Download family" (nút ở góc trên bên phải)
3. **Giải nén** file ZIP vừa tải
4. **Copy 2 files** vào thư mục `server/fonts/`:
   - `NotoSans-Regular.ttf`
   - `NotoSans-Bold.ttf`

**Đường dẫn đầy đủ:**
- `server/fonts/NotoSans-Regular.ttf`
- `server/fonts/NotoSans-Bold.ttf`

### Cách 3: Sử Dụng Font Có Sẵn Trong Hệ Thống

Nếu bạn có font hỗ trợ tiếng Việt trong hệ thống (như Arial, Times New Roman), có thể copy vào thư mục `server/fonts/` và đổi tên thành:
- `NotoSans-Regular.ttf` (cho font regular)
- `NotoSans-Bold.ttf` (cho font bold)

## 🧪 Test

Sau khi có font:

1. **Restart server** (nếu đang chạy)
2. **Generate bill** từ một order
3. **Kiểm tra:** Tất cả ký tự tiếng Việt phải hiển thị đúng

## 📝 Lưu Ý

- Code đã được update để tự động detect font
- Nếu không có font Noto Sans, sẽ fallback về Helvetica (có thể vẫn bị lỗi encoding)
- Font files sẽ được lưu trong `server/fonts/` (đã được thêm vào `.gitignore`)

## 🔍 Kiểm Tra Font Đã Tải

```bash
# Windows
dir server\fonts

# Linux/Mac
ls server/fonts
```

Phải thấy 2 files:
- `NotoSans-Regular.ttf`
- `NotoSans-Bold.ttf`

## ✅ Sau Khi Fix

Bill sẽ hiển thị đúng:
- ✅ "HÓA ĐƠN BÁN HÀNG" (thay vì "HÓA && N BÁN HÀNG")
- ✅ "Chi tiết sản phẩm" (thay vì "Chi ti&¿t s&£n ph&©m")
- ✅ "Tổng cộng" (thay vì "T&Õng c&ùng")
- ✅ "Cảm ơn quý khách đã sử dụng dịch vụ!" (thay vì "C&£m &&&&_O&Z&6...")
