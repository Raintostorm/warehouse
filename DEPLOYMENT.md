# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests passing: `npm test`
- [ ] No linter errors
- [ ] Code reviewed
- [ ] Secrets removed from code
- [ ] `.env` file configured

### ✅ Security
- [ ] All default passwords changed
- [ ] Strong JWT_SECRET generated (32+ chars)
- [ ] Database user with limited permissions
- [ ] CORS_ORIGINS set to production domain
- [ ] HTTPS/SSL configured
- [ ] Firewall rules configured

### ✅ Database
- [ ] Production database created
- [ ] Migrations run: `npm run init:db`
- [ ] Admin user created
- [ ] Backup strategy in place

---

## 🐳 Deployment Option 1: Docker Compose (Recommended)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Raintostorm/warehouse.git
cd warehouse

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 3. Deploy
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh

# Windows PowerShell:
.\scripts\deploy-production.ps1
```

### Manual Steps

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f

# Health check
curl http://localhost:3000/health
```

### Production .env Template

```env
# Database
DB_USER=warehouse_app
DB_PASSWORD=STRONG_RANDOM_PASSWORD
DB_NAME=warehouse_prod
DB_PORT=5432

# Server
SERVER_PORT=3000
NODE_ENV=production

# Client
CLIENT_PORT=80

# JWT (CRITICAL: Generate random!)
JWT_SECRET=$(openssl rand -base64 32)

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_USER=your-email@gmail.com

# CORS (Production domains only!)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
USE_OAUTH2=true

# Auto Init (only first time)
AUTO_INIT_DB=true
```

---

## ⚙️ Deployment Option 2: PM2 (Without Docker)

### Setup

```bash
# 1. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PostgreSQL & Redis
sudo apt install postgresql postgresql-contrib redis-server -y

# 3. Setup database
sudo -u postgres psql
CREATE DATABASE warehouse_prod;
CREATE USER warehouse_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE warehouse_prod TO warehouse_app;
\q

# 4. Clone and setup
git clone https://github.com/Raintostorm/warehouse.git
cd warehouse/server
npm install --production

# 5. Configure
cp .env.example .env
nano .env  # Edit with production values

# 6. Initialize database
npm run init:db

# 7. Install PM2
npm install -g pm2

# 8. Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow instructions
```

---

## 🌐 Deployment Option 3: Cloud Platforms

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create warehouse-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set DATABASE_URL=$(heroku config:get DATABASE_URL)

# Deploy
git push heroku master

# Run migrations
heroku run npm run init:db
```

### Railway / Render / DigitalOcean

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Build command: `cd server && npm install`
4. Start command: `cd server && npm start`
5. Add PostgreSQL database
6. Deploy

---

## 🔒 Security Hardening

### 1. Generate Strong Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 16
```

### 2. Database User Setup

```sql
-- Create application user (not superuser)
CREATE USER warehouse_app WITH PASSWORD 'STRONG_PASSWORD';

-- Grant permissions
GRANT CONNECT ON DATABASE warehouse_prod TO warehouse_app;
GRANT USAGE ON SCHEMA public TO warehouse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO warehouse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO warehouse_app;
```

### 3. Nginx + SSL Setup

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Configure Nginx (see PRODUCTION.md for full config)
sudo nano /etc/nginx/sites-available/warehouse
sudo ln -s /etc/nginx/sites-available/warehouse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📊 Post-Deployment Verification

### 1. Health Checks

```bash
# Application health
curl https://yourdomain.com/health

# API health
curl https://yourdomain.com/api

# Database connection
docker-compose exec postgres pg_isready -U postgres

# Redis connection
docker-compose exec redis redis-cli ping
```

### 2. Test API Endpoints

```bash
# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Get users (with token)
curl https://yourdomain.com/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Monitor Logs

```bash
# Docker logs
docker-compose logs -f server

# PM2 logs
pm2 logs uh-server
pm2 monit
```

---

## 🔄 Update/Deploy New Version

### Docker Compose

```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check health
docker-compose ps
docker-compose logs -f server
```

### PM2

```bash
# Pull latest code
git pull origin master

# Install dependencies
npm install --production

# Reload application (zero downtime)
pm2 reload ecosystem.config.js --update-env

# Or restart
pm2 restart ecosystem.config.js
```

---

## 📈 Monitoring & Maintenance

### Daily Tasks
- Check application logs
- Monitor error rates
- Check server resources (CPU, Memory, Disk)

### Weekly Tasks
- Review security logs
- Check database size
- Review performance metrics
- Verify backups

### Monthly Tasks
- Update dependencies: `npm audit fix`
- Review and optimize database queries
- Security audit
- Performance optimization

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
docker-compose logs server
# or
pm2 logs uh-server

# Check database connection
npm run test:connections

# Verify environment variables
printenv | grep DB_
```

### High memory usage
```bash
# PM2
pm2 monit
pm2 restart all

# Docker
docker stats
docker-compose restart server
```

### Database connection errors
```bash
# Test PostgreSQL
docker-compose exec postgres psql -U postgres -d warehouse_prod -c "SELECT 1"

# Check database exists
docker-compose exec postgres psql -U postgres -l
```

---

## 📞 Support & Resources

- **GitHub**: https://github.com/Raintostorm/warehouse
- **Health Check**: http://yourdomain.com/health
- **API Docs**: http://yourdomain.com/api
- **Test Coverage**: Run `npm run test:coverage`
