-- Create supplier_import_history table
CREATE TABLE IF NOT EXISTS supplier_import_history (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL,
    order_id VARCHAR(15) NOT NULL,
    quantity INTEGER NOT NULL,
    import_date DATE NOT NULL,
    notes TEXT,
    actor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes for supplier_import_history
CREATE INDEX IF NOT EXISTS idx_supplier_import_history_supplier ON supplier_import_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_import_history_product ON supplier_import_history(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_import_history_warehouse ON supplier_import_history(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_supplier_import_history_order ON supplier_import_history(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_import_history_date ON supplier_import_history(import_date DESC);

