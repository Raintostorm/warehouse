# 🐳 Quick Start với Docker

## Bước 1: Tạo file `.env`

Tạo file `.env` ở thư mục gốc với nội dung:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=uh_db
DB_PORT=5434

# Server
SERVER_PORT=3000
NODE_ENV=production

# Client
CLIENT_PORT=80

# JWT Secret (QUAN TRỌNG: Đổi trong production!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Auto Init Database
AUTO_INIT_DB=true
```

## Bước 2: Chạy Docker

```bash
docker-compose up -d --build
```

## Bước 3: Truy cập

- **Frontend**: http://localhost
- **Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Các lệnh hữu ích

```bash
# Xem logs
docker-compose logs -f

# Dừng
docker-compose stop

# Xóa (giữ data)
docker-compose down

# Xóa tất cả (bao gồm data)
docker-compose down -v
```

Xem chi tiết trong `DOCKER_SETUP.md`

