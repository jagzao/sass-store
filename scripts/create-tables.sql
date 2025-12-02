-- Create customers table with address field
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  email varchar(255),
  phone varchar(20),
  status varchar(20) DEFAULT 'active' NOT NULL,
  address text,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL,
  status varchar(20) DEFAULT 'active' NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  tenant_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  duration integer NOT NULL,
  before_image text,
  after_image text,
  status varchar(20) DEFAULT 'active' NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Add constraints
ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE no action ON UPDATE no action;
ALTER TABLE services ADD CONSTRAINT services_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE no action ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS customers_tenant_idx ON customers USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers USING btree (phone);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers USING btree (email);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers USING btree (status);
CREATE INDEX IF NOT EXISTS service_tenant_idx ON services USING btree (tenant_id);

-- Insert sample tenant
INSERT INTO tenants (id, name, slug, status) VALUES 
('00000000-0000-0000-0000-000000000001', 'Wonder Nails', 'wondernails', 'active')
ON CONFLICT (slug) DO NOTHING;