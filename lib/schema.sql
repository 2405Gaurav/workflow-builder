-- NextFlow Neon DB Schema
-- Run this once in the Neon SQL editor

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Workflow',
  description text DEFAULT '',
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  scope text NOT NULL DEFAULT 'full',
  duration_ms integer,
  node_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
