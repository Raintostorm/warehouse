# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Create `.env` file with production values
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Set CORS_ORIGINS to production domain
- [ ] Configure email service (Gmail OAuth or SMTP)
- [ ] Set NODE_ENV=production

### 2. Security
- [ ] Review `.gitignore` (ensure .env is ignored)
- [ ] Remove any hardcoded secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (only open 80, 443, 22)
- [ ] Setup database user with limited permissions

### 3. Database
- [ ] Create production database
- [ ] Run migrations: `npm run init:db`
- [ ] Create admin user
- [ ] Setup regular backups

### 4. Testing
- [ ] Run all tests: `npm test`
- [ ] Verify CRUD operations work
- [ ] Test authentication flow
- [ ] Test API endpoints

---

## 🐳 Option 1: Docker Compose Deployment (Recommended)

### Prerequisites
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```

### Quick Deploy
```bash
# 1. Clone repository
git clone https://github.com/Raintostorm/warehouse.git
cd warehouse

# 2. Create .env file
cp .env.example .env
nano .env  # Edit with production values

# 3. Deploy
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh

# Or on Windows PowerShell:
.\scripts\deploy-production.ps1
```

### Manual Steps
```bash
# Build and start
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f

# Health check
curl http://localhost:3000/health
```

---

## ⚙️ Option 2: PM2 Deployment (Without Docker)

### Prerequisites
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install PM2
npm install -g pm2
```

### Setup
```bash
# 1. Clone repository
git clone https://github.com/Raintostorm/warehouse.git
cd warehouse/server

# 2. Install dependencies
npm install --production

# 3. Configure .env
cp .env.example .env
nano .env

# 4. Initialize database
npm run init:db

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow instructions
```

---

## 🌐 Option 3: Cloud Platform Deployment

### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create warehouse-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
# ... set other vars

# Deploy
git push heroku master

# Run migrations
heroku run npm run init:db
```

### Railway / Render / DigitalOcean
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Configure build: `cd server && npm install`
4. Configure start: `cd server && npm start`
5. Add PostgreSQL database
6. Deploy

---

## 🔒 Security Hardening

### 1. Environment Variables (.env)
```env
# CRITICAL: Change these!
DB_PASSWORD=STRONG_RANDOM_PASSWORD_HERE
JWT_SECRET=$(openssl rand -base64 32)
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Production settings
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info
```

### 2. Database Security
```sql
-- Create application user (not superuser)
CREATE USER warehouse_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT CONNECT ON DATABASE warehouse_prod TO warehouse_app;
GRANT USAGE ON SCHEMA public TO warehouse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO warehouse_app;
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/warehouse
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. SSL Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl http://localhost:3000/health

# Database connection
docker-compose exec postgres pg_isready -U postgres

# Redis connection
docker-compose exec redis redis-cli ping
```

### Logs
```bash
# Docker logs
docker-compose logs -f server
docker-compose logs -f client

# PM2 logs
pm2 logs uh-server
pm2 monit
```

### Database Backups
```bash
# Manual backup
docker-compose exec postgres pg_dump -U postgres warehouse_prod > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U postgres warehouse_prod < backup_20231216.sql
```

### Updates
```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or with PM2
pm2 reload ecosystem.config.js --update-env
```

---

## 🧪 Post-Deployment Verification

### 1. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Get users (with token)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Frontend
- Open browser: http://yourdomain.com
- Test login
- Test CRUD operations
- Check console for errors

### 3. Monitor Logs
```bash
# Watch logs in real-time
docker-compose logs -f

# Check for errors
docker-compose logs server | grep -i error
```

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
docker-compose logs server

# Check database connection
docker-compose exec server npm run test:connections

# Verify environment variables
docker-compose exec server printenv | grep DB_
```

### Database connection errors
```bash
# Test PostgreSQL
docker-compose exec postgres psql -U postgres -d warehouse_prod -c "SELECT 1"

# Check database exists
docker-compose exec postgres psql -U postgres -l
```

### High memory usage
```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart all

# Or Docker
docker-compose restart server
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## 📈 Performance Optimization

### 1. Database Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_orders_date ON orders(date);
```

### 2. PM2 Cluster Mode
```javascript
// ecosystem.config.js
instances: 'max', // Use all CPU cores
exec_mode: 'cluster'
```

### 3. Redis Caching
- Already configured for rate limiting
- Can be extended for query caching

### 4. Nginx Caching
```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## ✅ Production Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database initialized and migrated
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## 📞 Support

- **GitHub**: https://github.com/Raintostorm/warehouse
- **Health Check**: http://yourdomain.com/health
- **API Docs**: http://yourdomain.com/api
