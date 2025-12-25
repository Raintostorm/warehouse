# Hướng Dẫn Về Indexing & Docs Trong Cursor

## 📚 Indexing (Lập Chỉ Mục) Là Gì?

### Khái Niệm
**Indexing** là quá trình Cursor quét và phân tích toàn bộ codebase của bạn để:
- Tạo "bản đồ" code (map of your code)
- Hiểu cấu trúc project
- Tìm tất cả functions, classes, variables
- Tạo database nội bộ để tìm kiếm nhanh

### Indexing Hoạt Động Như Thế Nào?

```
Khi bạn mở project:
1. Cursor quét tất cả files
2. Phân tích cấu trúc code
3. Tạo index database
4. Lưu vào cache để dùng lại
```

### Indexing Dùng Để Làm Gì?

#### 1. **Tăng Tốc AI Suggestions** ⚡
- AI hiểu context nhanh hơn
- Gợi ý code chính xác hơn
- Biết được các functions/variables có sẵn trong project

**Ví dụ:**
```javascript
// Khi bạn gõ, AI biết bạn có function này trong project:
const result = calculateTotal( // AI gợi ý function calculateTotal()
```

#### 2. **Code Navigation** 🧭
- **Jump to Definition**: Nhảy đến nơi định nghĩa function/class
- **Find All References**: Tìm tất cả nơi sử dụng
- **Go to Symbol**: Tìm symbol trong project

**Ví dụ:**
- Click vào `calculateTotal()` → Nhảy đến file định nghĩa
- Right-click → "Find All References" → Tìm tất cả nơi dùng

#### 3. **Code Completion** ✨
- Autocomplete thông minh
- Gợi ý dựa trên codebase của bạn
- Import suggestions

**Ví dụ:**
```javascript
// Gõ "cal" → AI gợi ý calculateTotal() từ project của bạn
```

#### 4. **AI Context Awareness** 🤖
- AI hiểu toàn bộ codebase
- Có thể refactor code an toàn
- Biết dependencies và relationships

### Khi Nào Indexing Chạy?

1. **Lần đầu mở project** - Indexing toàn bộ
2. **Khi có file mới** - Indexing file đó
3. **Khi có thay đổi lớn** - Re-indexing
4. **Khi restart Cursor** - Có thể re-index nếu cache bị mất

### Indexing Có Làm Chậm Không?

**Có**, nhưng chỉ lúc đầu:
- ✅ **Lần đầu**: Chậm (5-10 phút cho project lớn)
- ✅ **Sau đó**: Nhanh (dùng cache)
- ✅ **Khi code**: Không ảnh hưởng (chạy background)

### Có Nên Tắt Indexing Không?

**KHÔNG nên tắt hoàn toàn**, nhưng có thể **tối ưu**:

#### ✅ Nên Làm:
- Dùng `.cursorignore` để bỏ qua files không cần
- Exclude `node_modules/`, `dist/`, `build/`
- Chỉ index folder cần thiết

#### ❌ Không Nên:
- Tắt indexing hoàn toàn
- Index toàn bộ `node_modules/`
- Index các file binary lớn

---

## 📖 Docs (Documentation) Là Gì?

### Khái Niệm
**Docs** trong Cursor bao gồm:
1. **Code Documentation** - Comments, README, API docs trong project
2. **Library Documentation** - Docs của các libraries bạn dùng
3. **AI Documentation Context** - AI đọc docs để hiểu cách code

### Docs Dùng Để Làm Gì?

#### 1. **AI Hiểu Libraries/Frameworks** 📚
AI đọc documentation của:
- React, Vue, Angular
- Node.js, Express
- Database libraries
- Và nhiều libraries khác

**Ví dụ:**
```javascript
// AI biết cách dùng Express từ docs
app.get('/api/users', (req, res) => {
  // AI gợi ý đúng theo Express documentation
});
```

#### 2. **Code Suggestions Tốt Hơn** 💡
- AI biết cách dùng API đúng
- Tránh deprecated methods
- Gợi ý best practices

**Ví dụ:**
```javascript
// AI biết fetch() API từ docs
fetch('/api/data')
  .then(response => response.json()) // AI gợi ý đúng
  .then(data => console.log(data));
```

#### 3. **Context Awareness** 🎯
- AI hiểu conventions của project
- Đề xuất theo style của team
- Biết patterns đã dùng

**Ví dụ:**
```javascript
// AI thấy bạn dùng async/await pattern
// → Gợi ý theo pattern đó
async function fetchData() {
  const data = await api.get('/data');
  return data;
}
```

#### 4. **Documentation Generation** 📝
- AI có thể tạo JSDoc comments
- Tạo README files
- Document API endpoints

---

## ⚙️ Cách Tối Ưu Indexing & Docs

### 1. Tạo File `.cursorignore`

Tạo file `.cursorignore` ở root project:

```
# Dependencies - không cần index
node_modules/
package-lock.json
yarn.lock

# Build outputs
dist/
build/
out/

# Logs
*.log
logs/

# Database
*.db
*.sqlite

# Coverage
coverage/
.nyc_output/
```

### 2. Cấu Hình VS Code Settings

File `.vscode/settings.json` (đã tạo sẵn):

```json
{
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/node_modules": true
  }
}
```

### 3. Tối Ưu Trong Cursor Settings

1. Mở Settings: `Ctrl+,` (Windows) hoặc `Cmd+,` (Mac)
2. Tìm "Files: Exclude" → Thêm patterns
3. Tìm "Search: Exclude" → Thêm patterns
4. Tìm "AI: Max Context Size" → Giảm nếu không cần context lớn

### 4. Kiểm Tra Indexing Status

- Xem ở status bar (góc dưới bên phải)
- Nếu thấy "Indexing..." → Đang chạy
- Nếu không thấy → Đã xong

---

## 🚀 Best Practices

### ✅ Nên Làm:

1. **Exclude files không cần:**
   - `node_modules/`
   - `dist/`, `build/`
   - `*.log`, `*.db`

2. **Chỉ index code quan trọng:**
   - Source code (`src/`, `server/`, `client/`)
   - Config files quan trọng
   - Documentation files

3. **Giữ docs trong project:**
   - README.md
   - API documentation
   - Code comments

### ❌ Không Nên:

1. **Index toàn bộ `node_modules/`:**
   - Quá nhiều files
   - Làm chậm indexing
   - Không cần thiết

2. **Index binary files:**
   - Images, videos
   - Compiled files
   - Database files

3. **Tắt indexing hoàn toàn:**
   - Mất tính năng AI
   - Code navigation chậm
   - Autocomplete kém

---

## 🔍 Troubleshooting

### Indexing Quá Chậm?

**Giải pháp:**
1. Kiểm tra `.cursorignore` đã đúng chưa
2. Exclude `node_modules/` và `dist/`
3. Restart Cursor
4. Kiểm tra disk space (cần ít nhất 10GB trống)

### Indexing Không Hoạt Động?

**Giải pháp:**
1. Kiểm tra Cursor Settings → "Indexing" enabled
2. Clear cache và restart
3. Kiểm tra logs: `Ctrl+Shift+P` → "Developer: Show Logs"

### AI Không Hiểu Code?

**Giải pháp:**
1. Đảm bảo indexing đã hoàn thành
2. Thêm comments/documentation
3. Kiểm tra AI context size
4. Restart Cursor

---

## 📊 So Sánh

| Tính Năng | Không Indexing | Có Indexing |
|-----------|----------------|-------------|
| AI Suggestions | ⚠️ Chậm, không chính xác | ✅ Nhanh, chính xác |
| Code Navigation | ⚠️ Không hoạt động tốt | ✅ Hoạt động tốt |
| Autocomplete | ⚠️ Cơ bản | ✅ Thông minh |
| Find References | ⚠️ Chậm | ✅ Nhanh |
| Refactoring | ⚠️ Khó | ✅ Dễ |

---

## 💡 Kết Luận

- **Indexing**: Cần thiết cho AI và code navigation
- **Docs**: Giúp AI hiểu libraries và best practices
- **Tối ưu**: Exclude files không cần, chỉ index code quan trọng
- **Kết quả**: Cursor nhanh hơn, AI thông minh hơn

**Lời khuyên:** Luôn để indexing chạy, nhưng tối ưu bằng cách exclude files không cần thiết!
