-- ========================================================================
-- CUSTOMER MANAGEMENT TABLES - CLEAN VERSION
-- ========================================================================

-- Create customer status enum
DO $$ BEGIN
  CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create visit status enum
DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('pending', 'scheduled', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  general_notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status customer_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customers table
CREATE INDEX IF NOT EXISTS customers_tenant_idx ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_tenant_phone_idx ON customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);

-- Customer Visits table
CREATE TABLE IF NOT EXISTS customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  visit_number INTEGER NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  next_visit_from DATE,
  next_visit_to DATE,
  status visit_status NOT NULL DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customer_visits table
CREATE INDEX IF NOT EXISTS customer_visits_tenant_idx ON customer_visits(tenant_id);
CREATE INDEX IF NOT EXISTS customer_visits_customer_idx ON customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS customer_visits_date_idx ON customer_visits(visit_date);
CREATE INDEX IF NOT EXISTS customer_visits_status_idx ON customer_visits(status);
CREATE INDEX IF NOT EXISTS customer_visits_tenant_customer_idx ON customer_visits(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS customer_visits_appointment_idx ON customer_visits(appointment_id);

-- Customer Visit Services table
CREATE TABLE IF NOT EXISTS customer_visit_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES customer_visits(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  description TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity NUMERIC(5, 2) NOT NULL DEFAULT 1,
  subtotal NUMERIC(10, 2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customer_visit_services table
CREATE INDEX IF NOT EXISTS customer_visit_services_visit_idx ON customer_visit_services(visit_id);
CREATE INDEX IF NOT EXISTS customer_visit_services_service_idx ON customer_visit_services(service_id);
