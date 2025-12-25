# Fonts Directory

Thư mục này chứa các font files để hỗ trợ tiếng Việt trong PDF generation.

## Fonts Cần Có

- `NotoSans-Regular.ttf` - Font regular cho text thường
- `NotoSans-Bold.ttf` - Font bold cho text đậm

## Cách Tải Font

### Tự Động (Khuyến Nghị)

```bash
cd server
node scripts/downloadFontSimple.js
```

### Thủ Công

1. Truy cập: https://fonts.google.com/noto/specimen/Noto+Sans
2. Click "Download family"
3. Giải nén ZIP file
4. Copy 2 files vào thư mục này:
   - `NotoSans-Regular.ttf`
   - `NotoSans-Bold.ttf`

## Lưu Ý

- Font files không được commit vào git (đã thêm vào `.gitignore`)
- Nếu không có font, code sẽ fallback về Helvetica (có thể bị lỗi encoding tiếng Việt)
