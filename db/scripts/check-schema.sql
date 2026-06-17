-- Check services table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Check products table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
