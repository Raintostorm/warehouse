# Production Deployment Script for Windows
# Usage: .\scripts\deploy-production.ps1

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Production Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with production configuration."
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "Error: Docker is not running!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Prerequisites check passed" -ForegroundColor Green

# Backup database (if exists)
Write-Host ""
Write-Host "Creating database backup..."
if (docker-compose ps postgres 2>$null | Select-String -Pattern "Up") {
    $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    New-Item -ItemType Directory -Force -Path "backups" | Out-Null
    docker-compose exec -T postgres pg_dump -U postgres warehouse_prod > "backups\$backupFile" 2>$null
    Write-Host "✓ Backup created: backups\$backupFile" -ForegroundColor Green
}

# Pull latest code
Write-Host ""
Write-Host "Pulling latest code..."
try {
    git pull origin master
} catch {
    Write-Host "Git pull failed, continuing with local code..." -ForegroundColor Yellow
}

# Build new images
Write-Host ""
Write-Host "Building Docker images..."
docker-compose build --no-cache

# Stop existing containers
Write-Host ""
Write-Host "Stopping existing containers..."
docker-compose down

# Start new containers
Write-Host ""
Write-Host "Starting containers..."
docker-compose up -d

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Check health
Write-Host ""
Write-Host "Checking service health..."
$maxRetries = 30
$retryCount = 0
$healthy = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Server is healthy" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        # Continue retrying
    }
    
    $retryCount++
    Write-Host "Waiting for server... ($retryCount/$maxRetries)"
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "✗ Server health check failed" -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs server"
    exit 1
}

# Run database migrations (if needed)
Write-Host ""
Write-Host "Running database migrations..."
docker-compose exec -T server npm run init:db 2>$null

# Show status
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deployment Status" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:"
Write-Host "  - Frontend: http://localhost"
Write-Host "  - Backend: http://localhost:3000"
Write-Host "  - Health: http://localhost:3000/health"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  - View logs: docker-compose logs -f"
Write-Host "  - Stop: docker-compose stop"
Write-Host "  - Restart: docker-compose restart"
