-- Skip if user already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE USER postgres WITH PASSWORD 'postgres';
    END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE sass_store'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sass_store')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sass_store TO postgres;
