-- Create stock_history table
CREATE TABLE IF NOT EXISTS stock_history (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10),
    transaction_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER,
    new_quantity INTEGER NOT NULL,
    reference_id VARCHAR(50), -- order_id, transfer_id, etc.
    reference_type VARCHAR(50), -- 'order', 'transfer', 'adjustment', etc.
    notes TEXT,
    actor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
);

-- Create indexes for stock_history
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_warehouse ON stock_history(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_type ON stock_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_history_created ON stock_history(created_at DESC);

-- Create stock_transfers table
CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    from_warehouse_id VARCHAR(10) NOT NULL,
    to_warehouse_id VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_transit', 'completed', 'cancelled'
    notes TEXT,
    actor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- Create indexes for stock_transfers
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from ON stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to ON stock_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);

-- Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10),
    current_quantity INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    alert_level VARCHAR(20) DEFAULT 'warning', -- 'warning', 'critical', 'out_of_stock'
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by TEXT,
    actor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
);

-- Create indexes for low_stock_alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved ON low_stock_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_level ON low_stock_alerts(alert_level);

