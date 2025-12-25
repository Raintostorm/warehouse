-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(15) NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    actor TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_order_id ON bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);

