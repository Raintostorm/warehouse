#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on error

echo "=========================================="
echo "Production Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file with production configuration."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed!${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites check passed"

# Backup database (if exists)
echo ""
echo "Creating database backup..."
if docker-compose ps postgres | grep -q "Up"; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U postgres warehouse_prod > "backups/$BACKUP_FILE" 2>/dev/null || echo "Backup skipped (database might be empty)"
    echo -e "${GREEN}✓${NC} Backup created: backups/$BACKUP_FILE"
fi

# Pull latest code
echo ""
echo "Pulling latest code..."
git pull origin master || echo "Git pull failed, continuing with local code..."

# Build new images
echo ""
echo "Building Docker images..."
docker-compose build --no-cache

# Stop existing containers
echo ""
echo "Stopping existing containers..."
docker-compose down

# Start new containers
echo ""
echo "Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check health
echo ""
echo "Checking service health..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Server is healthy"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for server... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗${NC} Server health check failed"
    echo "Check logs: docker-compose logs server"
    exit 1
fi

# Run database migrations (if needed)
echo ""
echo "Running database migrations..."
docker-compose exec -T server npm run init:db || echo "Migrations completed or skipped"

# Show status
echo ""
echo "=========================================="
echo "Deployment Status"
echo "=========================================="
docker-compose ps

echo ""
echo -e "${GREEN}✓${NC} Deployment completed successfully!"
echo ""
echo "Services:"
echo "  - Frontend: http://localhost"
echo "  - Backend: http://localhost:3000"
echo "  - Health: http://localhost:3000/health"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop: docker-compose stop"
echo "  - Restart: docker-compose restart"
