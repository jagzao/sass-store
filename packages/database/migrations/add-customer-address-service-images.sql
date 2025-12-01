-- ========================================================================
-- ADD CUSTOMER ADDRESS AND SERVICE IMAGES
-- Migration: Add address field to customers and before/after images to services
-- ========================================================================

-- Add address field to customers table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
    
    -- Add comment for documentation
    COMMENT ON COLUMN customers.address IS 'Dirección de la clienta';
  END IF;
END $$;

-- Add before_image and after_image fields to services table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    ALTER TABLE services ADD COLUMN IF NOT EXISTS before_image TEXT;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS after_image TEXT;
    
    -- Add comments for documentation
    COMMENT ON COLUMN services.before_image IS 'URL de la imagen "antes" del servicio';
    COMMENT ON COLUMN services.after_image IS 'URL de la imagen "después" del servicio';
  END IF;
END $$;

-- Update RLS policies if needed (adjust based on your security requirements)
-- These are example policies - modify based on your security requirements
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'tenant_isolation') THEN
--     -- No changes needed for existing policies
--   END IF;
--   
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'tenant_isolation') THEN
--     -- No changes needed for existing policies
--   END IF;
-- END $$;