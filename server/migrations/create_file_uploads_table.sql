-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id VARCHAR(20) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'warehouse', 'user', 'order'
    entity_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50), -- 'image', 'document', etc.
    mime_type VARCHAR(100),
    file_size BIGINT, -- bytes
    is_primary BOOLEAN DEFAULT false,
    upload_type VARCHAR(50), -- 'product_image', 'warehouse_image', 'avatar', etc.
    metadata JSONB, -- Additional metadata (dimensions, etc.)
    actor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create indexes for file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(upload_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_primary ON file_uploads(entity_type, entity_id, is_primary);

