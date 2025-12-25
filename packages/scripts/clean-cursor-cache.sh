#!/bin/bash
# Script để xóa cache của Cursor trên Linux/Mac
# Chạy: chmod +x clean-cursor-cache.sh && ./clean-cursor-cache.sh

echo "Cleaning Cursor cache..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CURSOR_DIR="$HOME/Library/Application Support/Cursor"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CURSOR_DIR="$HOME/.config/Cursor"
else
    echo "Unsupported OS"
    exit 1
fi

CACHE_PATHS=(
    "$CURSOR_DIR/Cache"
    "$CURSOR_DIR/CachedData"
    "$CURSOR_DIR/GPUCache"
    "$CURSOR_DIR/Code Cache"
)

for path in "${CACHE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "Removing: $path"
        rm -rf "$path"
    fi
done

echo "Cache cleaned successfully!"
echo "Please restart Cursor for changes to take effect."
