-- Add warehouse_id column to order_details table
ALTER TABLE order_details 
ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(10);

-- For existing records, set a default warehouse (you may need to update this)
-- This is a temporary fix - you should manually update existing records
UPDATE order_details 
SET warehouse_id = (SELECT id FROM warehouses LIMIT 1)
WHERE warehouse_id IS NULL;

-- Make warehouse_id NOT NULL after setting defaults
ALTER TABLE order_details
ALTER COLUMN warehouse_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE order_details
ADD CONSTRAINT fk_order_details_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;

-- Update primary key to include warehouse_id
-- First, drop existing primary key
ALTER TABLE order_details
DROP CONSTRAINT IF EXISTS order_details_pkey;

-- Add new composite primary key
ALTER TABLE order_details
ADD PRIMARY KEY (order_id, product_id, warehouse_id);

-- Create index for warehouse_id
CREATE INDEX IF NOT EXISTS idx_order_details_warehouse_id ON order_details(warehouse_id);

