-- Add bill_id column to payments table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'bill_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN bill_id VARCHAR(20);
    END IF;
END $$;

-- Add foreign key constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payments_bill_id'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT fk_payments_bill_id 
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);

