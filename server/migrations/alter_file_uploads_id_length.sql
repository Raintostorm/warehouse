-- Alter file_uploads table to increase id column length
-- This allows for longer file IDs to ensure uniqueness

ALTER TABLE file_uploads 
ALTER COLUMN id TYPE VARCHAR(50);

