# Script để xóa cache của Cursor trên Windows
# Chạy với quyền Administrator: powershell -ExecutionPolicy Bypass -File clean-cursor-cache.ps1

Write-Host "Cleaning Cursor cache..." -ForegroundColor Yellow

$cursorAppData = "$env:APPDATA\Cursor"
$cachePaths = @(
    "$cursorAppData\Cache",
    "$cursorAppData\CachedData",
    "$cursorAppData\GPUCache",
    "$cursorAppData\Code Cache"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Write-Host "Removing: $path" -ForegroundColor Cyan
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Cache cleaned successfully!" -ForegroundColor Green
Write-Host "Please restart Cursor for changes to take effect." -ForegroundColor Yellow
