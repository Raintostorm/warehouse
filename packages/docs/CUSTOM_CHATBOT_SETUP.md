# Custom Chatbot Setup Guide - Hybrid AI Approach

Hệ thống đã được tích hợp với **Custom Chatbot** - một chatbot AI thông minh sử dụng **Hybrid Approach** (AI + Rule-based) với khả năng thực hiện actions trực tiếp trong hệ thống quản lý kho hàng.

## ✨ Tính Năng

### Custom Chatbot Features - Hybrid AI Approach
- 🤖 **AI-Powered** - Sử dụng Google Gemini AI để hiểu ngôn ngữ tự nhiên
- ⚙️ **Rule-Based Fallback** - Tự động chuyển sang rule-based nếu AI không available
- 💬 **Chat trực tiếp** - Hiểu ngôn ngữ tự nhiên, không cần cú pháp chính xác
- 🎯 **Thực hiện Actions** - Tạo đơn hàng, tìm sản phẩm, kiểm tra kho, v.v.
- 📊 **Truy vấn dữ liệu** - Xem thống kê, doanh thu, tồn kho
- 🔄 **Bulk Operations** - Hỗ trợ thao tác hàng loạt (có thể phát triển thêm)
- 🎨 **Giao diện riêng biệt** - Purple/Indigo theme, khác với AI Gemini
- 🔔 **Notifications** - Tự động tạo thông báo khi thực hiện actions
- 🚀 **Smart Intent Detection** - Kết hợp AI + Rule-based cho độ chính xác cao nhất

### Hybrid Approach - Cách hoạt động

Chatbot sử dụng **2 lớp xử lý**:

1. **AI Layer (Gemini)** - Phân tích intent và extract entities từ ngôn ngữ tự nhiên
2. **Rule-Based Layer** - Fallback và xử lý các patterns đã biết

**Flow xử lý:**
```
User Message
    ↓
[AI Intent Analysis] (nếu GEMINI_API_KEY có)
    ↓ (confidence > 0.6)
[Merge với Rule-based entities]
    ↓
[Execute Action]
    ↓
[AI Response Generation] (cho queries)
    ↓
Response
```

**Ưu điểm:**
- ✅ Hiểu ngôn ngữ tự nhiên tốt hơn (nhờ AI)
- ✅ Luôn hoạt động (fallback về rule-based)
- ✅ Nhanh (rule-based cho actions đã biết)
- ✅ Chính xác (AI cho các câu hỏi phức tạp)

### So sánh với AI Gemini

| Tính năng | Custom Chatbot (Hybrid) | AI Gemini |
|-----------|------------------------|-----------|
| Trả lời câu hỏi | ✅ (AI + Rule) | ✅ (AI only) |
| Thực hiện Actions | ✅ | ❌ |
| Tích hợp Notifications | ✅ | ❌ |
| Hiểu ngôn ngữ tự nhiên | ✅ (AI) | ✅ (AI) |
| Fallback mechanism | ✅ (Rule-based) | ❌ |
| Giao diện | Purple/Indigo | Blue |
| Vị trí | Top-right (above AIChat) | Bottom-right |

## 🚀 Setup

### Bước 1: Cấu hình AI (Tùy chọn nhưng khuyến nghị)

Để bật AI mode, thêm vào `server/.env`:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Lấy API Key:**
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập với Google account
3. Click "Create API Key"
4. Copy API key vào `.env`

**Lưu ý:**
- Nếu không có API key, chatbot vẫn hoạt động ở **Rule-based mode**
- AI mode sẽ tự động bật khi có API key
- Không cần restart server (hot reload)

### Bước 2: Restart Server (nếu cần)

```bash
cd server
npm start
```

### Bước 3: Kiểm tra

1. Mở ứng dụng và đăng nhập
2. Click nút **🤖** (phía trên nút AI Gemini)
3. Kiểm tra status:
   - **🤖 AI Mode (Hybrid)** - AI đã bật
   - **⚙️ Rule-based Mode** - Chỉ dùng rule-based

## 💬 Sử Dụng

### Mở Custom Chatbot
- Click nút **🤖** ở góc dưới bên phải (phía trên nút AI Gemini)
- Hoặc chatbot sẽ tự động hiển thị khi đăng nhập

### Chat với Chatbot
1. Nhập lệnh hoặc câu hỏi vào ô input
2. Click **"Gửi"** hoặc nhấn **Enter**
3. Chatbot sẽ xử lý và trả về kết quả

### Xóa Lịch Sử Chat
- Click nút **"Xóa"** ở header của chat window
- Xác nhận để xóa toàn bộ lịch sử

## 📋 Danh Sách Actions

### Sản Phẩm

#### Tìm kiếm sản phẩm
```
Tìm sản phẩm laptop
Tìm kiếm sản phẩm điện thoại
Search product laptop
```

#### Xem chi tiết sản phẩm
```
Thông tin sản phẩm P001
Chi tiết sản phẩm P001
Details product P001
```

#### Danh sách sản phẩm
```
Hiển thị tất cả sản phẩm
Danh sách sản phẩm
List products
```

### Đơn Hàng

#### Tạo đơn hàng
```
Tạo đơn hàng cho khách hàng ABC
Tạo đơn hàng với khách hàng XYZ
Create order for customer ABC
```

#### Kiểm tra trạng thái đơn hàng
```
Trạng thái đơn hàng ORD001
Status order ORD001
Đơn hàng ORD001 có trạng thái gì?
```

#### Danh sách đơn hàng
```
Hiển thị đơn hàng
Danh sách đơn hàng
List orders
```

### Kho Hàng

#### Kiểm tra tồn kho
```
Sản phẩm nào sắp hết hàng?
Kiểm tra tồn kho
Check inventory
Sản phẩm nào hết hàng?
```

#### Danh sách kho
```
Hiển thị kho hàng
Danh sách kho
List warehouses
```

### Thống Kê

#### Thống kê hệ thống
```
Thống kê hệ thống
Statistics
Tổng số sản phẩm là bao nhiêu?
Có bao nhiêu đơn hàng?
```

#### Doanh thu
```
Doanh thu tháng này
Revenue
Doanh thu hôm nay
```

#### Sản phẩm bán chạy
```
Sản phẩm bán chạy nhất
Top products
Top 5 sản phẩm bán chạy
```

### Hỗ Trợ

#### Xem hướng dẫn
```
Giúp tôi
Help
Hướng dẫn
Làm sao để sử dụng?
```

## 🔧 API Endpoints

### GET `/api/chatbot/status`
Kiểm tra trạng thái chatbot

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "aiEnabled": true,
    "message": "AI Chatbot is ready (AI + Rule-based hybrid mode)",
    "mode": "hybrid"
  }
}
```

### POST `/api/chatbot/chat`
Chat với chatbot

**Request:**
```json
{
  "message": "Tìm sản phẩm laptop",
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
    "message": "Tìm thấy 3 sản phẩm:",
    "type": "action",
    "action": "search_products",
    "data": [
      {
        "id": "P001",
        "name": "Laptop Dell",
        "price": 15000000
      }
    ],
    "count": 3,
    "method": "AI",
    "confidence": 0.95
  }
}
```

### GET `/api/chatbot/actions`
Lấy danh sách actions có thể thực hiện

**Response:**
```json
{
  "success": true,
  "actions": [
    {
      "name": "search_products",
      "description": "Tìm kiếm sản phẩm",
      "example": "Tìm sản phẩm laptop"
    }
  ]
}
```

## 🎨 UI Components

### CustomChatbot Component
- **Location:** `client/src/components/CustomChatbot.jsx`
- **Type:** Floating chat widget
- **Theme:** Purple/Indigo (khác với AIChat's blue)
- **Features:**
  - Floating button khi đóng
  - Chat window khi mở
  - Conversation history (memory-based, không persist)
  - Action results display
  - Auto-scroll
  - Dark/Light theme support
  - Loading states
  - Error handling

### Integration
- Tự động hiển thị khi user đã đăng nhập
- Vị trí: Bottom-right, phía trên AIChat
- Responsive design

## 🔒 Security

- ✅ **Authentication Required** - Tất cả API endpoints yêu cầu authentication
- ✅ **User Context** - Chatbot nhận biết user hiện tại
- ✅ **Input Validation** - Validate tất cả inputs
- ✅ **Error Handling** - Xử lý lỗi an toàn

## 📊 Action Results

Khi chatbot thực hiện action thành công, kết quả sẽ được hiển thị:

1. **Message** - Thông báo kết quả
2. **Data** - Dữ liệu trả về (nếu có)
3. **Count** - Số lượng kết quả
4. **Type** - Loại response (query/action)

### Ví dụ Action Results

**Tìm sản phẩm:**
```
Tìm thấy 3 sản phẩm:

Kết quả (3):
- P001: Laptop Dell
- P002: Laptop HP
- P003: Laptop Asus
```

**Tạo đơn hàng:**
```
Đã tạo đơn hàng thành công: ORD001
[Notification sẽ được tạo tự động]
```

## 🔔 Notifications Integration

Khi chatbot thực hiện một số actions, hệ thống sẽ tự động tạo notifications:

- **create_order** - Tạo notification "Đơn hàng mới"
- Có thể mở rộng thêm cho các actions khác

## 🐛 Troubleshooting

### Chatbot không hoạt động

**Nguyên nhân:**
- Server chưa start
- API endpoint không đúng
- Authentication token hết hạn

**Giải pháp:**
1. Kiểm tra server đang chạy: `cd server && npm start`
2. Kiểm tra browser console có lỗi không
3. Đăng nhập lại để refresh token

### Actions không thực hiện được

**Nguyên nhân:**
- Thiếu thông tin bắt buộc (ví dụ: customerName cho create_order)
- Dữ liệu không tồn tại (ví dụ: productId không tìm thấy)

**Giải pháp:**
1. Kiểm tra message có đầy đủ thông tin không
2. Xem error message trong response
3. Thử lại với thông tin đầy đủ hơn

### Không hiểu lệnh

**Nguyên nhân:**
- Lệnh không đúng format
- Từ khóa không được nhận diện

**Giải pháp:**
1. Sử dụng các lệnh mẫu trong danh sách actions
2. Gõ "Giúp tôi" để xem danh sách đầy đủ
3. Sử dụng từ khóa tiếng Việt hoặc tiếng Anh

## 💡 Best Practices

1. **Sử dụng lệnh rõ ràng:**
   - ✅ "Tìm sản phẩm laptop"
   - ❌ "laptop"

2. **Cung cấp đủ thông tin:**
   - ✅ "Tạo đơn hàng cho khách hàng ABC"
   - ❌ "Tạo đơn hàng"

3. **Kiểm tra kết quả:**
   - Xem message response
   - Kiểm tra data array nếu có
   - Xem notifications nếu action tạo notification

## 🚀 Future Enhancements

- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Advanced NLP với ML models
- [ ] Action suggestions based on context
- [ ] Learning từ user interactions
- [ ] Bulk operations nâng cao
- [ ] Integration với external APIs
- [ ] Custom action definitions
- [ ] Action history và undo

## 🤖 Hybrid AI Approach - Chi Tiết

### Cách Hoạt Động

1. **AI Intent Analysis (Bước 1)**
   - Nếu có `GEMINI_API_KEY`, chatbot sẽ gửi message đến Gemini AI
   - AI phân tích và trả về intent + entities với confidence score
   - Nếu confidence > 0.6, sử dụng kết quả từ AI
   - Timeout: 5 giây (nếu AI quá chậm, fallback về rule-based)

2. **Rule-Based Fallback (Bước 2)**
   - Nếu AI không available hoặc confidence thấp
   - Sử dụng rule-based NLP với keywords và patterns
   - Vẫn đảm bảo chatbot hoạt động

3. **Entity Merging (Bước 3)**
   - Merge entities từ AI và rule-based
   - Đảm bảo không bỏ sót thông tin

4. **Action Execution (Bước 4)**
   - Thực hiện action dựa trên intent đã detect
   - Actions được xử lý bởi các handlers chuyên biệt

5. **Response Generation (Bước 5)**
   - Cho queries: Có thể dùng AI để generate response tự nhiên
   - Cho actions: Sử dụng template response từ action handlers

### Khi Nào Dùng AI vs Rule-Based?

**AI được dùng khi:**
- ✅ Có `GEMINI_API_KEY`
- ✅ AI response có confidence > 0.6
- ✅ AI response trong 5 giây

**Rule-Based được dùng khi:**
- ❌ Không có `GEMINI_API_KEY`
- ❌ AI confidence < 0.6
- ❌ AI timeout hoặc error
- ✅ Actions đã biết (nhanh hơn)

### Performance

- **AI Mode:** ~1-3 giây (tùy vào Gemini API)
- **Rule-Based Mode:** < 100ms (rất nhanh)
- **Hybrid:** Tự động chọn method tốt nhất

## 📝 Notes

- Chatbot chỉ hoạt động khi user đã đăng nhập
- Conversation history được lưu trong memory (không persist)
- Actions được thực hiện với quyền của user hiện tại
- Notifications được tạo tự động cho một số actions
- Chatbot có thể truy cập real-time data từ database
- **AI mode tự động bật khi có GEMINI_API_KEY** (không cần config thêm)
- **Rule-based mode luôn available** (fallback an toàn)

## 📚 Tài Liệu Tham Khảo

- **AI Intent Analyzer:** `server/utils/aiIntentAnalyzer.js` - AI-powered intent detection với Gemini
- **NLP Helper:** `server/utils/nlpHelper.js` - Rule-based NLP với 50+ keywords
- **Chatbot Service:** `server/services/chatbotS.js` - Main service với hybrid approach
- **Action Handlers:** `server/services/chatbotActions/` - Xử lý các actions
- **Frontend Component:** `client/src/components/CustomChatbot.jsx` - UI component

## 💾 Dung Lượng & Performance

### Dung Lượng

**Với Hybrid Approach (API-based):**
- Node.js code: ~10MB
- Dependencies: ~50MB
- **Tổng: ~60-100MB** ✅
- Không cần model local - Sử dụng Gemini API

**So sánh với Python + Local Model:**
- Python: ~100MB
- spaCy model (vi): ~500MB
- transformers model: 1-5GB+
- **Tổng: 1-6GB+** ❌

**Kết luận:** Hybrid approach chỉ cần ~100MB, nhẹ hơn rất nhiều!

### Performance

- **AI Mode:** ~1-3 giây (tùy vào Gemini API response time)
- **Rule-Based Mode:** < 100ms (rất nhanh)
- **Hybrid:** Tự động chọn method tốt nhất
- **Timeout:** 5 giây cho AI analysis (tự động fallback)

---

**Happy Chatting! 🤖**

