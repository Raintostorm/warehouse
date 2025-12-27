-- Add changed_fields column to audit_logs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'changed_fields'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN changed_fields TEXT[];
    END IF;
END $$;

