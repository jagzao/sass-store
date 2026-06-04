-- Migration: class sessions, enrollments, attendance (sports tenants)
-- STRY-023 — sesiones deportivas

CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  location VARCHAR(255),
  social_export JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_sessions_status_check CHECK (
    status IN ('scheduled', 'cancelled', 'completed')
  )
);

CREATE INDEX IF NOT EXISTS class_sessions_tenant_starts_idx
  ON class_sessions(tenant_id, starts_at);

CREATE TABLE IF NOT EXISTS session_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT session_enrollments_status_check CHECK (
    status IN ('active', 'cancelled')
  ),
  CONSTRAINT session_enrollments_session_customer_unique UNIQUE (session_id, customer_id)
);

CREATE INDEX IF NOT EXISTS session_enrollments_session_idx
  ON session_enrollments(session_id, status);

CREATE INDEX IF NOT EXISTS session_enrollments_customer_idx
  ON session_enrollments(customer_id);

CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL UNIQUE REFERENCES session_enrollments(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT FALSE,
  marked_at TIMESTAMPTZ,
  marked_by UUID
);

ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'class_sessions' AND policyname = 'tenant_isolation_class_sessions'
  ) THEN
    CREATE POLICY tenant_isolation_class_sessions ON class_sessions
      FOR ALL TO authenticated
      USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID))
      WITH CHECK (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_enrollments' AND policyname = 'tenant_isolation_session_enrollments'
  ) THEN
    CREATE POLICY tenant_isolation_session_enrollments ON session_enrollments
      FOR ALL TO authenticated
      USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID))
      WITH CHECK (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID));
  END IF;
END
$$;
