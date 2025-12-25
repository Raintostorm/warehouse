# AI Assistant Setup Guide - Google Gemini Integration

Hệ thống đã được tích hợp với **Google Gemini AI** để cung cấp AI Assistant thông minh cho Warehouse Management System.

## ✨ Tính Năng

### AI Assistant Chatbot
- 💬 **Chat trực tiếp** với AI về hệ thống quản lý kho hàng
- 📊 **Phân tích dữ liệu** và đưa ra insights tự động
- 🎯 **Context-aware** - Hiểu ngữ cảnh và vai trò người dùng
- 📈 **Real-time data** - Truy cập dữ liệu thực tế từ database
- 🌐 **Tiếng Việt** - Hỗ trợ đầy đủ tiếng Việt

### Use Cases
- Trả lời câu hỏi về hệ thống
- Hướng dẫn sử dụng các tính năng
- Phân tích tình trạng tồn kho
- Phân tích doanh số và xu hướng
- Gợi ý các hành động cần thiết
- Tìm kiếm sản phẩm bằng ngôn ngữ tự nhiên

## 🚀 Setup

### Bước 1: Lấy Google Gemini API Key

1. Truy cập: **https://makersuite.google.com/app/apikey**
2. Đăng nhập với Google account
3. Click **"Create API Key"**
4. Copy API key (dạng: `AIzaSy...`)

### Bước 2: Cấu Hình Backend

Thêm vào file `server/.env`:

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Thay thế:**
- `YOUR_GEMINI_API_KEY_HERE` → API key từ Google Gemini

### Bước 3: Restart Server

```bash
cd server
npm start
```

### Bước 4: Kiểm Tra

1. Mở ứng dụng và đăng nhập
2. Bạn sẽ thấy nút **💬** ở góc dưới bên phải
3. Click để mở AI Chat
4. Nếu thấy "Đang hoạt động" → Setup thành công! ✅
5. Nếu thấy "Không khả dụng" → Kiểm tra lại API key

## 📖 Sử Dụng

### Mở AI Chat
- Click nút **💬** ở góc dưới bên phải màn hình
- Hoặc click vào icon chat trong sidebar (nếu có)

### Chat với AI
1. Nhập câu hỏi vào ô input
2. Click **"Gửi"** hoặc nhấn **Enter**
3. AI sẽ trả lời dựa trên dữ liệu thực tế của hệ thống

### Ví Dụ Câu Hỏi

**Về hệ thống:**
- "Tổng số sản phẩm trong hệ thống là bao nhiêu?"
- "Có bao nhiêu đơn hàng đang chờ xử lý?"
- "Doanh thu tháng này là bao nhiêu?"

**Phân tích:**
- "Phân tích tình trạng tồn kho"
- "Sản phẩm nào sắp hết hàng?"
- "Sản phẩm nào bán chạy nhất?"

**Hướng dẫn:**
- "Làm thế nào để tạo đơn hàng mới?"
- "Cách quản lý sản phẩm như thế nào?"

### Xóa Lịch Sử Chat
- Click nút **"Xóa"** ở header của chat window
- Xác nhận để xóa toàn bộ lịch sử

## 🔧 API Endpoints

### GET `/api/ai/status`
Kiểm tra trạng thái AI service

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "AI Assistant is ready"
  }
}
```

### POST `/api/ai/chat`
Chat với AI

**Request:**
```json
{
  "message": "Tổng số sản phẩm là bao nhiêu?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Xin chào"
    },
    {
      "role": "assistant",
      "content": "Xin chào! Tôi có thể giúp gì cho bạn?"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tổng số sản phẩm trong hệ thống là 150 sản phẩm...",
    "context": {
      "stats": {
        "products": 150,
        "orders": 45,
        "warehouses": 3
      },
      "revenue": {
        "total": 50000000,
        "today": 2000000
      }
    }
  }
}
```

### POST `/api/ai/analyze`
Phân tích dữ liệu

**Request:**
```json
{
  "dataType": "inventory" // hoặc "sales", "overview"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Phân tích chi tiết...",
    "context": { ... }
  }
}
```

## 🎨 UI Components

### AIChat Component
- **Location:** `client/src/components/AIChat.jsx`
- **Type:** Floating chat widget
- **Features:**
  - Floating button khi đóng
  - Chat window khi mở
  - Conversation history
  - Auto-scroll
  - Dark/Light theme support
  - Loading states

### Integration
- Tự động hiển thị khi user đã đăng nhập
- Không cần cấu hình thêm ở frontend
- Responsive design

## 🔒 Security

- ✅ **Authentication Required** - Tất cả API endpoints yêu cầu authentication
- ✅ **Role-based Context** - AI nhận biết vai trò người dùng
- ✅ **Rate Limiting** - Áp dụng rate limiting chung của API
- ✅ **Input Validation** - Validate tất cả inputs

## 📊 Context Data

AI có thể truy cập:
- **Statistics:** Tổng số users, products, orders, warehouses, suppliers
- **Revenue:** Doanh thu tổng, hôm nay, tháng này
- **Low Stock Products:** Sản phẩm sắp hết hàng
- **Top Products:** Sản phẩm bán chạy nhất
- **User Role:** Vai trò của người dùng hiện tại

## 🐛 Troubleshooting

### AI không hoạt động

**Nguyên nhân:**
- Chưa set `GEMINI_API_KEY` trong `.env`
- API key không đúng
- Server chưa restart sau khi thêm API key

**Giải pháp:**
1. Kiểm tra `server/.env` có `GEMINI_API_KEY` không
2. Verify API key tại https://makersuite.google.com/app/apikey
3. Restart server
4. Kiểm tra server logs để xem lỗi chi tiết

### Lỗi "Failed to process chat message"

**Nguyên nhân:**
- API key không hợp lệ
- Quota API đã hết
- Network issues

**Giải pháp:**
1. Kiểm tra API key còn hợp lệ không
2. Kiểm tra quota tại Google Cloud Console
3. Kiểm tra network connection

### AI trả lời không chính xác

**Nguyên nhân:**
- Context data không đầy đủ
- Câu hỏi không rõ ràng

**Giải pháp:**
1. Đảm bảo database đã có dữ liệu
2. Đặt câu hỏi cụ thể hơn
3. Cung cấp thêm context trong câu hỏi

## 💰 Pricing

Google Gemini API có **free tier** với quota hợp lý:
- **Free Tier:** 60 requests/minute
- **Paid Tier:** Tùy theo usage

Xem chi tiết: https://ai.google.dev/pricing

## 📚 Tài Liệu Tham Khảo

- **Google Gemini API:** https://ai.google.dev/
- **API Documentation:** https://ai.google.dev/api
- **Pricing:** https://ai.google.dev/pricing
- **Get API Key:** https://makersuite.google.com/app/apikey

## 🎯 Best Practices

1. **API Key Security:**
   - Không commit API key vào git
   - Sử dụng environment variables
   - Rotate API key định kỳ

2. **Usage Optimization:**
   - Cache responses khi có thể
   - Giới hạn conversation history (đã implement: 10 messages)
   - Sử dụng rate limiting

3. **User Experience:**
   - Hiển thị loading states
   - Error handling rõ ràng
   - Clear instructions cho users

## 🚀 Future Enhancements

- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Custom AI models training
- [ ] Advanced analytics với AI
- [ ] Predictive inventory management
- [ ] Automated report generation

## 📝 Notes

- AI Assistant chỉ hoạt động khi user đã đăng nhập
- Conversation history được lưu trong memory (không persist)
- AI có thể truy cập real-time data từ database
- Context được cập nhật mỗi lần chat
