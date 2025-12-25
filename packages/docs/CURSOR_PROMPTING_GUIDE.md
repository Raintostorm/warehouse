# 🎯 Hướng Dẫn Prompting Hiệu Quả Cho Cursor AI

Guide chi tiết về cách viết prompt để Cursor AI hiểu và làm việc chính xác nhất.

## 📚 Mục Lục

1. [Nguyên Tắc Cơ Bản](#nguyên-tắc-cơ-bản)
2. [Cấu Trúc Prompt Tốt](#cấu-trúc-prompt-tốt)
3. [Các Loại Prompt](#các-loại-prompt)
4. [Best Practices](#best-practices)
5. [Common Mistakes](#common-mistakes)
6. [Examples Thực Tế](#examples-thực-tế)
7. [Advanced Tips](#advanced-tips)

---

## 🎓 Nguyên Tắc Cơ Bản

### 1. **Be Specific (Cụ Thể)**
❌ **Bad:**
```
Sửa lỗi này
```

✅ **Good:**
```
Sửa lỗi validation trong form đăng ký: email không kiểm tra format đúng, 
password không yêu cầu ít nhất 8 ký tự. Thêm validation messages hiển thị 
bên dưới input fields.
```

### 2. **Provide Context (Cung Cấp Context)**
❌ **Bad:**
```
Thêm tính năng thanh toán
```

✅ **Good:**
```
Trong file server/routes/payments.js, thêm endpoint POST /api/payments/refund 
để hoàn tiền. Endpoint này cần:
- Validate paymentId và amount
- Kiểm tra payment status phải là 'completed'
- Tạo refund record trong database
- Cập nhật payment status thành 'refunded'
- Trả về refund transaction ID
```

### 3. **Show Examples (Đưa Ví Dụ)**
❌ **Bad:**
```
Tạo component button
```

✅ **Good:**
```
Tạo component ModernButton trong client/src/components/ModernButton.jsx với:
- Props: variant ('primary' | 'secondary' | 'danger'), size ('sm' | 'md' | 'lg'), disabled, onClick
- Style giống như các button hiện tại trong Dashboard.jsx (gradient background, hover effects)
- Support dark/light theme từ ThemeContext
- Export default
```

### 4. **Break Down Complex Tasks (Chia Nhỏ Task Phức Tạp)**
❌ **Bad:**
```
Xây dựng hệ thống quản lý inventory hoàn chỉnh
```

✅ **Good:**
```
Bước 1: Tạo model InventoryM trong server/models/inventoryM.js với các fields:
- id, product_id, warehouse_id, quantity, min_stock_level, max_stock_level, last_updated

Bước 2: Tạo service InventoryS trong server/services/inventoryS.js với methods:
- getInventoryByProduct(productId)
- updateStock(productId, warehouseId, quantity)
- checkLowStock(threshold)

Bước 3: Tạo controller InventoryC với CRUD endpoints
```

---

## 📐 Cấu Trúc Prompt Tốt

### Template Chuẩn:

```
[CONTEXT] - Mô tả tình huống/background
[GOAL] - Mục tiêu cần đạt được
[REQUIREMENTS] - Yêu cầu cụ thể
[CONSTRAINTS] - Ràng buộc/giới hạn
[EXAMPLES] - Ví dụ mong muốn (nếu có)
```

### Ví Dụ Áp Dụng:

```
[CONTEXT] 
Hiện tại trong client/components/Payments.jsx, form tạo payment chỉ có 
dropdown chọn orderId. User muốn có thể tạo payment cho nhiều orders cùng lúc.

[GOAL]
Thêm tính năng bulk payment creation - cho phép chọn nhiều orders và tạo 
nhiều payments cùng lúc.

[REQUIREMENTS]
- Thêm checkbox selection cho orders trong table
- Button "Create Bulk Payments" chỉ hiện khi có orders được chọn
- Modal mới để nhập amount và payment method cho tất cả selected orders
- API call tạo nhiều payments cùng lúc (batch request)
- Hiển thị success/error message cho từng payment

[CONSTRAINTS]
- Giữ nguyên UI/UX hiện tại
- Không thay đổi API structure hiện có
- Sử dụng existing paymentAPI service

[EXAMPLES]
Tương tự như bulk delete trong UserL.jsx component
```

---

## 🎨 Các Loại Prompt

### 1. **Code Generation (Tạo Code)**

**Pattern:**
```
Tạo [component/function/class] [tên] trong [file path] với:
- [Feature 1]
- [Feature 2]
- [Style/Pattern giống như...]
```

**Example:**
```
Tạo component ProductCard trong client/src/components/ProductCard.jsx với:
- Hiển thị product image, name, price, stock
- Button "Add to Cart" (disabled nếu stock = 0)
- Hover effect với shadow và scale
- Style giống ModernCard component
- Support dark/light theme
- Props: product (object), onAddToCart (function)
```

### 2. **Code Refactoring (Tối Ưu Code)**

**Pattern:**
```
Refactor [file/function] để:
- [Mục tiêu 1]
- [Mục tiêu 2]
- Giữ nguyên functionality
```

**Example:**
```
Refactor server/services/paymentsS.js để:
- Tách logic validation ra function riêng validatePaymentData()
- Extract database queries vào helper functions
- Thêm error handling tốt hơn với try-catch và logging
- Giữ nguyên API interface (không thay đổi return format)
- Thêm JSDoc comments cho tất cả functions
```

### 3. **Bug Fixing (Sửa Lỗi)**

**Pattern:**
```
Sửa lỗi [mô tả lỗi] trong [file]:
- [Symptom 1]
- [Expected behavior]
- [Current behavior]
```

**Example:**
```
Sửa lỗi payment không được tạo sau khi thanh toán VNPay thành công trong 
server/controllers/paymentsC.js:

- Symptom: Callback từ VNPay thành công nhưng payment record không xuất hiện trong database
- Expected: Payment được tạo với status 'completed' và transaction_id từ VNPay
- Current: Callback redirect về success page nhưng không có payment record
- Debug: Kiểm tra logs, có thể là lỗi trong PaymentsS.createPayment() hoặc database connection
```

### 4. **Feature Addition (Thêm Tính Năng)**

**Pattern:**
```
Thêm tính năng [tên] vào [component/page]:
- [Feature description]
- [User flow]
- [Technical requirements]
```

**Example:**
```
Thêm tính năng export payments ra Excel vào client/components/Payments.jsx:

- Feature: Button "Export to Excel" trong header, export tất cả payments 
  (hoặc filtered payments) ra file Excel
- User flow: Click button → Download file payments_YYYYMMDD.xlsx
- Technical: 
  - Sử dụng exportAPI.exportToExcel('payments') từ services/api.js
  - Hiển thị loading state khi export
  - Show success toast khi hoàn thành
  - Handle errors gracefully
```

### 5. **Code Review (Review Code)**

**Pattern:**
```
Review code trong [file] và:
- Tìm potential bugs
- Suggest improvements
- Check best practices
- Optimize performance
```

**Example:**
```
Review code trong client/components/Dashboard.jsx và:
- Tìm potential bugs (memory leaks, race conditions)
- Suggest improvements (code splitting, memoization)
- Check React best practices (hooks usage, component structure)
- Optimize performance (reduce re-renders, lazy loading)
- Check accessibility (ARIA labels, keyboard navigation)
```

---

## ✅ Best Practices

### 1. **Sử Dụng @ để Reference Files**

Cursor hỗ trợ `@filename` để reference files:

```
Trong file @server/models/paymentsM.js, thêm method getPaymentsByDateRange(startDate, endDate) 
để query payments trong khoảng thời gian. Sử dụng pattern tương tự như getTotalByOrderId().
```

### 2. **Sử Dụng Composer cho Complex Tasks**

Với tasks phức tạp, dùng **Composer** (Ctrl+I) thay vì Chat:

- Composer: Tốt cho multi-file changes, refactoring lớn
- Chat: Tốt cho questions, single file changes

### 3. **Provide File Paths**

Luôn chỉ rõ file path:

❌ **Bad:**
```
Thêm validation vào form
```

✅ **Good:**
```
Trong client/components/CUser.jsx, thêm validation vào form tạo user:
- Email phải đúng format
- Password tối thiểu 8 ký tự
- Full name không được để trống
```

### 4. **Specify Code Style**

Nếu có coding standards:

```
Tạo function calculateTotal() trong server/services/ordersS.js:
- Sử dụng async/await (không dùng .then())
- Follow existing code style trong file
- Thêm JSDoc comment
- Use camelCase cho variables
- Return object với { success, data, message } format
```

### 5. **Mention Dependencies**

Nếu cần sử dụng libraries/services:

```
Thêm email notification khi order được tạo trong server/controllers/ordersC.js:
- Sử dụng nodemailer (đã có trong package.json)
- Email template trong server/templates/order-created.html
- Config trong .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Send email trong createOrder() sau khi order được tạo thành công
```

### 6. **Iterative Approach (Tiếp Cận Từng Bước)**

Chia nhỏ và làm từng bước:

```
Bước 1: Tạo database migration file server/migrations/add_notification_preferences_to_users.sql
  - Thêm columns: email_notifications (boolean), sms_notifications (boolean)

Bước 2: Update UserM model để include các fields mới

Bước 3: Thêm UI trong client/components/UserProfile.jsx để user có thể toggle preferences

Bước 4: Update API endpoint PUT /api/users/profile/update để save preferences
```

---

## ❌ Common Mistakes

### 1. **Prompt Quá Mơ Hồ**

❌ **Bad:**
```
Làm cho nó tốt hơn
```

✅ **Good:**
```
Optimize component Dashboard.jsx:
- Memoize expensive calculations với useMemo
- Split large component thành smaller sub-components
- Lazy load charts chỉ khi tab được mở
```

### 2. **Không Cung Cấp Context**

❌ **Bad:**
```
Thêm button
```

✅ **Good:**
```
Trong client/components/Payments.jsx, thêm button "Export" bên cạnh button "New Payment" 
trong header. Button này export tất cả payments ra Excel file.
```

### 3. **Yêu Cầu Quá Nhiều Cùng Lúc**

❌ **Bad:**
```
Tạo toàn bộ authentication system với login, register, forgot password, 
reset password, email verification, 2FA, social login...
```

✅ **Good:**
```
Bước 1: Tạo forgot password feature
  - Frontend: Form trong client/components/ForgotPassword.jsx
  - Backend: Endpoint POST /api/auth/forgot-password
  - Email service: Send reset link

Sau khi hoàn thành, tiếp tục với reset password feature.
```

### 4. **Không Kiểm Tra Code Generated**

Luôn review code mà Cursor tạo:
- Có thể có bugs
- Có thể không đúng requirements
- Có thể không follow best practices

### 5. **Không Sử Dụng Existing Patterns**

Cursor tốt nhất khi follow existing patterns trong codebase:

```
Tạo component ProductForm tương tự như UserForm trong client/components/CUser.jsx:
- Same form structure và validation pattern
- Same error handling approach
- Same styling với ModernInput components
```

---

## 💡 Examples Thực Tế

### Example 1: Tạo API Endpoint

```
Tạo endpoint POST /api/orders/:orderId/cancel trong server/routes/orders.js:

Requirements:
- Validate orderId tồn tại
- Kiểm tra order status phải là 'pending' hoặc 'processing' (không thể cancel nếu 'completed' hoặc 'cancelled')
- Update order status thành 'cancelled'
- Tạo audit log entry
- Trả về cancelled order object

Follow pattern của các endpoints khác trong file:
- Use authMiddleware và roleMiddleware('admin')
- Use OrdersC controller
- Error handling với try-catch và sendError helper
- Return format: { success: true, data: order, message: 'Order cancelled' }
```

### Example 2: Refactor Component

```
Refactor client/components/Dashboard.jsx để tối ưu performance:

Current issues:
- Component re-renders mỗi khi bất kỳ state nào thay đổi
- Charts được render ngay cả khi tab chưa được mở
- Expensive calculations chạy lại mỗi render

Improvements needed:
- Split thành DashboardHeader, DashboardStats, DashboardCharts components
- Use React.memo cho child components
- Lazy load charts với React.lazy và Suspense
- Memoize calculations với useMemo
- Use useCallback cho event handlers
- Implement virtual scrolling cho data tables nếu có

Giữ nguyên functionality và UI/UX.
```

### Example 3: Fix Bug

```
Sửa lỗi: Khi tạo order mới, total amount không được tính đúng trong 
server/controllers/ordersC.js:

Symptoms:
- Order được tạo nhưng total = 0 hoặc null
- Order details có price nhưng order total không đúng

Expected:
- Total = sum của (price * quantity) từ tất cả order details
- Total được tính tự động khi tạo order

Debug steps:
1. Kiểm tra createOrder() function
2. Xem calculateTotal() có được gọi không
3. Kiểm tra orderDetails có được tạo đúng không
4. Verify database transaction có commit đúng không

Fix:
- Đảm bảo calculateTotal() được gọi sau khi order details được tạo
- Validate total > 0 trước khi save
- Add logging để debug
```

### Example 4: Add Feature

```
Thêm tính năng search và filter vào client/components/ProductL.jsx:

Requirements:
- Search bar ở header để search theo product name, SKU, description
- Filter dropdowns: Category, Supplier, Stock Status (In Stock/Out of Stock)
- Real-time search (debounce 300ms)
- Clear filters button
- Show active filters count

Implementation:
- Add state: searchTerm, selectedCategory, selectedSupplier, stockStatus
- Filter products array based on search và filters
- Use existing ModernInput component cho search
- Use existing filter UI pattern từ OrderL.jsx
- Update pagination để work với filtered results

Keep existing functionality intact.
```

---

## 🚀 Advanced Tips

### 1. **Sử Dụng Multi-Cursor Editing**

Khi cần sửa nhiều chỗ giống nhau:

```
Trong file @server/models/*.js, thêm method findByUserId(userId) vào tất cả models 
theo pattern của UserM.findByUserId(). Sử dụng multi-cursor để edit cùng lúc.
```

### 2. **Chain Prompts (Xâu Chuỗi Prompts)**

Làm từng bước và build lên:

```
Step 1: Tạo database table notifications với columns: id, user_id, title, message, 
        read, created_at

Step 2: Sau khi migration xong, tạo NotificationM model

Step 3: Sau khi model xong, tạo NotificationS service

Step 4: Sau khi service xong, tạo NotificationC controller và routes
```

### 3. **Use Codebase Search**

Trước khi prompt, search codebase để hiểu patterns:

```
Tìm tất cả nơi sử dụng auditLogger trong codebase, sau đó thêm audit logging 
vào createPayment() function theo cùng pattern.
```

### 4. **Specify Testing**

Nếu cần tests:

```
Tạo function calculateDiscount() trong server/services/pricingS.js và viết unit test 
trong server/__tests__/services/pricingS.test.js. Test cases:
- Normal discount (10% off)
- Maximum discount cap (không quá 50%)
- Invalid inputs (negative numbers, null)
- Edge cases (0%, 100%)
```

### 5. **Documentation Requests**

Yêu cầu documentation:

```
Tạo JSDoc comments cho tất cả functions trong server/services/paymentsS.js:
- Mô tả chức năng
- @param cho tất cả parameters
- @returns cho return value
- @throws cho errors
- @example cho usage examples
```

### 6. **Error Handling**

Luôn specify error handling:

```
Thêm error handling vào server/controllers/ordersC.js cho createOrder():
- Try-catch với specific error types
- Log errors với logger.error()
- Return user-friendly error messages
- Rollback database transaction nếu có lỗi
- Return proper HTTP status codes (400, 500, etc.)
```

---

## 📊 Prompt Quality Checklist

Trước khi gửi prompt, kiểm tra:

- [ ] **Specific**: Prompt có cụ thể không?
- [ ] **Context**: Đã cung cấp đủ context chưa?
- [ ] **File Paths**: Đã chỉ rõ file paths chưa?
- [ ] **Requirements**: Yêu cầu có rõ ràng không?
- [ ] **Examples**: Có ví dụ hoặc references không?
- [ ] **Constraints**: Có ràng buộc gì cần mention không?
- [ ] **Style**: Đã specify code style chưa?
- [ ] **Testing**: Có cần tests không?

---

## 🎯 Quick Reference

### Prompt Templates

**Tạo Component:**
```
Tạo component [Name] trong [path] với props [props] và features [features]. 
Style giống [reference component].
```

**Sửa Bug:**
```
Sửa lỗi [description] trong [file]. Expected: [behavior]. Current: [behavior]. 
Debug: [steps].
```

**Thêm Feature:**
```
Thêm tính năng [name] vào [component]: [description]. User flow: [flow]. 
Technical: [requirements].
```

**Refactor:**
```
Refactor [file/function] để [goals]. Giữ nguyên [what to keep].
```

---

## 💬 Tips Cuối Cùng

1. **Be Patient**: Cursor có thể cần vài lần để hiểu đúng
2. **Iterate**: Bắt đầu đơn giản, sau đó refine
3. **Review**: Luôn review code generated
4. **Learn**: Quan sát patterns Cursor sử dụng
5. **Experiment**: Thử các cách prompt khác nhau

---

**Happy Prompting! 🚀**

*Cập nhật: 2024*
