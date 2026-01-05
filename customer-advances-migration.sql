-- Migration for Customer Advances and Balance Management
-- This migration adds support for tracking customer prepayments and applying them to services

-- Add balance_favor column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance_favor DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Add payment-related columns to customer_visits table
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS advance_applied DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- Create customer_advances table
CREATE TABLE IF NOT EXISTS customer_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    original_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    valid_until TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create advance_applications table
CREATE TABLE IF NOT EXISTS advance_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    advance_id UUID NOT NULL REFERENCES customer_advances(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    visit_id UUID REFERENCES customer_visits(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount_applied DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for customer_advances table
CREATE INDEX IF NOT EXISTS customer_advances_tenant_idx ON customer_advances(tenant_id);
CREATE INDEX IF NOT EXISTS customer_advances_customer_idx ON customer_advances(customer_id);
CREATE INDEX IF NOT EXISTS customer_advances_status_idx ON customer_advances(status);
CREATE INDEX IF NOT EXISTS customer_advances_tenant_customer_idx ON customer_advances(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS customer_advances_valid_until_idx ON customer_advances(valid_until);

-- Create indexes for advance_applications table
CREATE INDEX IF NOT EXISTS advance_applications_tenant_idx ON advance_applications(tenant_id);
CREATE INDEX IF NOT EXISTS advance_applications_advance_idx ON advance_applications(advance_id);
CREATE INDEX IF NOT EXISTS advance_applications_customer_idx ON advance_applications(customer_id);
CREATE INDEX IF NOT EXISTS advance_applications_visit_idx ON advance_applications(visit_id);
CREATE INDEX IF NOT EXISTS advance_applications_booking_idx ON advance_applications(booking_id);
CREATE INDEX IF NOT EXISTS advance_applications_tenant_advance_idx ON advance_applications(tenant_id, advance_id);

-- Add RLS policies for customer_advances
ALTER TABLE customer_advances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view advances from their own tenant
CREATE POLICY tenant_isolation_customer_advances ON customer_advances
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid() AND role = 'Admin'));

-- Policy: Users can only view advances from their own tenant
CREATE POLICY tenant_isolation_advance_applications ON advance_applications
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid() AND role = 'Admin'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_advances_updated_at BEFORE UPDATE ON customer_advances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advance_applications_updated_at BEFORE UPDATE ON advance_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate customer balance favor
CREATE OR REPLACE FUNCTION calculate_customer_balance_favor(customer_id_param UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    total_advances DECIMAL(10, 2);
    total_applications DECIMAL(10, 2);
    balance DECIMAL(10, 2);
BEGIN
    -- Sum all active advances for the customer
    SELECT COALESCE(SUM(amount), 0) INTO total_advances
    FROM customer_advances
    WHERE customer_id = customer_id_param AND status = 'active';
    
    -- Sum all applications of those advances
    SELECT COALESCE(SUM(amount_applied), 0) INTO total_applications
    FROM advance_applications
    WHERE customer_id = customer_id_param;
    
    -- Calculate remaining balance
    balance := total_advances - total_applications;
    
    -- Update the customer's balance_favor column
    UPDATE customers
    SET balance_favor = balance
    WHERE id = customer_id_param;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update visit payment status
CREATE OR REPLACE FUNCTION update_visit_payment_status(visit_id_param UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    total_amount DECIMAL(10, 2);
    advance_applied DECIMAL(10, 2);
    remaining_amount DECIMAL(10, 2);
    payment_status VARCHAR(20);
BEGIN
    -- Get visit total and advance applied
    SELECT total_amount, advance_applied INTO total_amount, advance_applied
    FROM customer_visits
    WHERE id = visit_id_param;
    
    -- Calculate remaining amount
    remaining_amount := total_amount - advance_applied;
    
    -- Determine payment status
    IF advance_applied = 0 THEN
        payment_status := 'pending';
    ELSIF advance_applied < total_amount THEN
        payment_status := 'partially_paid';
    ELSIF advance_applied = total_amount THEN
        payment_status := 'fully_paid';
    ELSE
        payment_status := 'overpaid';
    END IF;
    
    -- Update the visit
    UPDATE customer_visits
    SET 
        remaining_amount = remaining_amount,
        payment_status = payment_status
    WHERE id = visit_id_param;
    
    RETURN payment_status;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update advance status
CREATE OR REPLACE FUNCTION update_advance_status(advance_id_param UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    original_amount DECIMAL(10, 2);
    total_applied DECIMAL(10, 2);
    remaining_amount DECIMAL(10, 2);
    status VARCHAR(20);
BEGIN
    -- Get advance original amount
    SELECT original_amount INTO original_amount
    FROM customer_advances
    WHERE id = advance_id_param;
    
    -- Sum all applications of this advance
    SELECT COALESCE(SUM(amount_applied), 0) INTO total_applied
    FROM advance_applications
    WHERE advance_id = advance_id_param;
    
    -- Calculate remaining amount
    remaining_amount := original_amount - total_applied;
    
    -- Determine status
    IF total_applied = 0 THEN
        status := 'active';
    ELSIF total_applied < original_amount THEN
        status := 'partially_used';
    ELSE
        status := 'fully_used';
    END IF;
    
    -- Update the advance
    UPDATE customer_advances
    SET 
        amount = remaining_amount,
        status = status
    WHERE id = advance_id_param;
    
    RETURN status;
END;
$$ LANGUAGE plpgsql;