-- Create bill_orders junction table for many-to-many relationship
-- One bill can have multiple orders, one order can belong to one bill
CREATE TABLE IF NOT EXISTS bill_orders (
    bill_id VARCHAR(20) NOT NULL,
    order_id VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bill_id, order_id),
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bill_orders_bill_id ON bill_orders(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_orders_order_id ON bill_orders(order_id);

