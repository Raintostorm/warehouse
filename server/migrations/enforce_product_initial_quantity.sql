-- Ensure products.number defaults to 0
ALTER TABLE products
ALTER COLUMN number SET DEFAULT 0;

-- Update existing products with NULL number to 0
UPDATE products
SET number = 0
WHERE number IS NULL;

-- Make number NOT NULL
ALTER TABLE products
ALTER COLUMN number SET NOT NULL;

-- Note: We cannot prevent direct updates via database constraint
-- This will be enforced at the application level in services

