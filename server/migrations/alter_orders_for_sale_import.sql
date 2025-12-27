-- Add supplier_id column to orders table for import orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(10);

-- Add foreign key constraint for supplier_id
ALTER TABLE orders
ADD CONSTRAINT fk_orders_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add check constraint to ensure order type requirements
-- Sale orders must have customer_name, Import orders must have supplier_id
ALTER TABLE orders
ADD CONSTRAINT chk_order_type_requirements 
CHECK (
    (type = 'sale' AND customer_name IS NOT NULL AND supplier_id IS NULL) OR
    (type = 'import' AND supplier_id IS NOT NULL) OR
    (type NOT IN ('sale', 'import'))
);

-- Create index for supplier_id
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);

