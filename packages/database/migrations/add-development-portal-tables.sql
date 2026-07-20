-- Development Portal Migration
-- Adds project, sprint, task and daily report tables for development tenants.
-- Generated: 2026-07-20

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE dev_project_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dev_sprint_status AS ENUM ('planned', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dev_task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dev_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status dev_project_status NOT NULL DEFAULT 'active',
  start_date DATE,
  target_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE dev_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY dev_projects_tenant_isolation ON dev_projects
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE INDEX IF NOT EXISTS dev_projects_tenant_idx ON dev_projects(tenant_id);
CREATE INDEX IF NOT EXISTS dev_projects_status_idx ON dev_projects(status);
CREATE INDEX IF NOT EXISTS dev_projects_tenant_status_idx ON dev_projects(tenant_id, status);

-- ============================================================================
-- SPRINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dev_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  goal TEXT,
  status dev_sprint_status NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE dev_sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY dev_sprints_tenant_isolation ON dev_sprints
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE INDEX IF NOT EXISTS dev_sprints_tenant_idx ON dev_sprints(tenant_id);
CREATE INDEX IF NOT EXISTS dev_sprints_project_idx ON dev_sprints(project_id);
CREATE INDEX IF NOT EXISTS dev_sprints_status_idx ON dev_sprints(status);
CREATE INDEX IF NOT EXISTS dev_sprints_tenant_status_idx ON dev_sprints(tenant_id, status);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dev_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES dev_sprints(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status dev_task_status NOT NULL DEFAULT 'backlog',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assignee_name VARCHAR(100),
  completed_at TIMESTAMP,
  due_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE dev_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY dev_tasks_tenant_isolation ON dev_tasks
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE INDEX IF NOT EXISTS dev_tasks_tenant_idx ON dev_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS dev_tasks_project_idx ON dev_tasks(project_id);
CREATE INDEX IF NOT EXISTS dev_tasks_sprint_idx ON dev_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS dev_tasks_status_idx ON dev_tasks(status);
CREATE INDEX IF NOT EXISTS dev_tasks_tenant_status_idx ON dev_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS dev_tasks_completed_at_idx ON dev_tasks(completed_at);

-- ============================================================================
-- DAILY REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dev_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES dev_sprints(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  summary TEXT NOT NULL,
  completed_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  blockers TEXT[] DEFAULT ARRAY[]::TEXT[],
  generated_by VARCHAR(50) NOT NULL DEFAULT 'system',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, project_id, report_date)
);

ALTER TABLE dev_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY dev_daily_reports_tenant_isolation ON dev_daily_reports
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE INDEX IF NOT EXISTS dev_daily_reports_tenant_idx ON dev_daily_reports(tenant_id);
CREATE INDEX IF NOT EXISTS dev_daily_reports_project_idx ON dev_daily_reports(project_id);
CREATE INDEX IF NOT EXISTS dev_daily_reports_sprint_idx ON dev_daily_reports(sprint_id);
CREATE INDEX IF NOT EXISTS dev_daily_reports_date_idx ON dev_daily_reports(report_date);
CREATE UNIQUE INDEX IF NOT EXISTS dev_daily_reports_tenant_project_date_idx
  ON dev_daily_reports(tenant_id, project_id, report_date);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON dev_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_sprints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_daily_reports TO authenticated;
