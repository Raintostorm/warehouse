-- Add inventory-related columns to products table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'reorder_point'
    ) THEN
        ALTER TABLE products ADD COLUMN reorder_point INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'reorder_quantity'
    ) THEN
        ALTER TABLE products ADD COLUMN reorder_quantity INTEGER;
    END IF;
END $$;

