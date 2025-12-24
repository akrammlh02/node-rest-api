-- Add required_tier column to learning_paths table if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'learning_paths';
SET @columnname = 'required_tier';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(10) DEFAULT ''Free'' COMMENT ''Required membership tier: Free, Pro, or VIP''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing paths to Free tier if NULL
UPDATE learning_paths SET required_tier = 'Free' WHERE required_tier IS NULL OR required_tier = '';
