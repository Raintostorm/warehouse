-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(15) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'bank_transfer', 'credit_card', 'momo', 'vnpay', etc.
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    actor TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
