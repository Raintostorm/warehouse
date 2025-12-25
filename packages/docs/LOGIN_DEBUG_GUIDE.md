# Login Debug Guide

## Vấn đề: Login thành công nhưng không redirect hoặc vẫn ở trang login

## Cách Debug

### Bước 1: Mở Browser Console (F12)

Sau khi login, bạn sẽ thấy các logs sau (theo thứ tự):

1. `[LoginForm] Starting login process` - Form submit
2. `[AuthContext] Login attempt` - API call bắt đầu
3. `[AuthContext] Login API response` - Response từ server
4. `[AuthContext] Calling handleLoginResponse` - Bắt đầu xử lý response
5. `[AuthContext] handleLoginResponse called` - Xử lý login data
6. `[AuthContext] Setting state and localStorage` - Lưu vào state và localStorage
7. `[AuthContext] localStorage set, verifying...` - Verify localStorage
8. `[AuthContext] Login state saved successfully` - Hoàn thành
9. `[LoginForm] Login result` - Kết quả trả về cho form
10. `[LoginForm] Login successful, waiting for localStorage...` - Đợi localStorage
11. `[LoginForm] Checking localStorage` - Kiểm tra localStorage
12. `[LoginForm] Redirecting to home...` - Redirect
13. `[App] Authentication check` - App.jsx check authentication

### Bước 2: Kiểm tra từng bước

#### Nếu không thấy log nào:
- Có thể form không submit được
- Kiểm tra browser console có error không

#### Nếu dừng ở bước 2-3:
- Server không trả về response đúng
- Kiểm tra Network tab → tìm `/api/auth/login` → xem response

#### Nếu dừng ở bước 4-7:
- Có lỗi trong `handleLoginResponse`
- Kiểm tra error trong console

#### Nếu dừng ở bước 8-9:
- `handleLoginResponse` không return `{ success: true }`
- Kiểm tra error trong console

#### Nếu dừng ở bước 10-11:
- localStorage không được set
- Kiểm tra Application tab → Local Storage

#### Nếu dừng ở bước 12:
- Redirect không hoạt động
- Thử dùng `window.location.reload()` thay vì `window.location.href = '/'`

#### Nếu dừng ở bước 13:
- App.jsx không detect authentication
- Kiểm tra `[App] Authentication check` log để xem giá trị

## Common Issues

### Issue 1: localStorage không được set

**Triệu chứng:** Log `[LoginForm] Checking localStorage` shows `hasToken: false`

**Nguyên nhân:**
- `handleLoginResponse` throw error trước khi set localStorage
- Browser block localStorage (private mode, security settings)

**Fix:**
- Kiểm tra error trong console
- Thử dùng browser khác
- Kiểm tra browser settings

### Issue 2: Redirect không hoạt động

**Triệu chứng:** Log `[LoginForm] Redirecting to home...` nhưng vẫn ở trang login

**Nguyên nhân:**
- `window.location.href = '/'` bị block
- Có error sau redirect

**Fix:**
- Thử `window.location.reload()` thay vì `window.location.href = '/'`
- Hoặc dùng `window.location.replace('/')`

### Issue 3: App.jsx không detect authentication

**Triệu chứng:** Log `[App] Authentication check` shows `isUserAuthenticated: false` dù có token

**Nguyên nhân:**
- `isAuthenticated()` function không check localStorage đúng
- State chưa update

**Fix:**
- Kiểm tra `[App] Authentication check` log
- Nếu `tokenInStorage: true` nhưng `isUserAuthenticated: false`, có vấn đề với logic check

## Quick Fixes

### Fix 1: Force reload sau login

Thay đổi trong `LoginForm.jsx`:

```javascript
if (token && user) {
    // Force full page reload
    window.location.reload();
}
```

### Fix 2: Check localStorage trực tiếp trong App.jsx

Đã được implement - App.jsx sẽ check localStorage trực tiếp nếu state chưa update.

### Fix 3: Thêm delay trước redirect

Tăng delay trong `LoginForm.jsx`:

```javascript
await new Promise(resolve => setTimeout(resolve, 1000)); // Tăng từ 500ms lên 1000ms
```

## Testing Steps

1. **Clear browser cache và localStorage:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Login với credentials:**
   - Email: `admin@example.com`
   - Password: `admin123`

3. **Xem logs trong console:**
   - Copy tất cả logs từ `[LoginForm]` đến `[App]`
   - Gửi cho developer để debug

4. **Kiểm tra Network tab:**
   - Tìm request `/api/auth/login`
   - Xem Response tab → có `success: true` và `data` không?

5. **Kiểm tra Application tab:**
   - Local Storage → có `token` và `user` không?
   - Giá trị có đúng không?

## Expected Flow

```
1. User submits form
2. LoginForm calls AuthContext.login()
3. AuthContext calls API
4. Server returns { success: true, data: { user, token, roles } }
5. AuthContext.handleLoginResponse() saves to state and localStorage
6. LoginForm checks localStorage
7. LoginForm redirects to '/'
8. App.jsx checks authentication
9. App.jsx shows dashboard (not login)
```

Nếu flow bị break ở bước nào, logs sẽ chỉ ra chính xác vấn đề.
