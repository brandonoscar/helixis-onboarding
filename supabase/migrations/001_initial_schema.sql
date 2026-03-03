-- ============================================================
-- HELIXIS DATABASE SCHEMA
-- SOC 2 compliant: encrypted secrets, audit log, RLS
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Note: vault extension enabled via Supabase dashboard (pg_sodium)

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'employee');
CREATE TYPE integration_provider AS ENUM ('buildium', 'appfolio', 'propertyware', 'yardi', 'rentmanager');
CREATE TYPE integration_status AS ENUM ('pending', 'connected', 'error', 'locked', 'change_requested');
CREATE TYPE audit_action AS ENUM (
  'workspace_created',
  'integration_provisioned',
  'integration_locked',
  'integration_tested',
  'integration_change_requested',
  'webhook_secret_generated',
  'webhook_received',
  'member_invited',
  'member_role_changed',
  'member_removed',
  'owner_login',
  'onboarding_completed'
);

-- ============================================================
-- WORKSPACES
-- ============================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- ============================================================
-- INTEGRATIONS (status only — NO secrets here)
-- ============================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  status integration_status NOT NULL DEFAULT 'pending',
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'sandbox')),
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  last_tested_at TIMESTAMPTZ,
  last_test_result JSONB, -- { success: bool, latency_ms: int, message: string }
  change_requested_at TIMESTAMPTZ,
  change_request_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

CREATE INDEX idx_integrations_workspace ON integrations(workspace_id);

-- ============================================================
-- INTEGRATION SECRETS
-- Secrets stored as vault references ONLY
-- This table stores vault secret IDs, never plaintext
-- RLS: NO client can read this table. Only service_role (Edge Functions).
-- ============================================================

CREATE TABLE integration_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  -- Vault secret IDs (references to vault.secrets) — NOT the actual keys
  vault_api_key_id UUID,       -- references vault.secrets.id
  vault_api_secret_id UUID,    -- references vault.secrets.id
  -- Metadata only
  key_hint TEXT,               -- last 4 chars of key for display (e.g., "...x7f2")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  UNIQUE(integration_id)
);

-- ============================================================
-- WEBHOOKS
-- ============================================================

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  endpoint_path TEXT NOT NULL, -- e.g., /{workspace_id}/buildium
  -- Signing secret stored in vault
  vault_signing_secret_id UUID, -- references vault.secrets.id
  secret_viewed_at TIMESTAMPTZ, -- null = never shown; set on first view
  last_received_at TIMESTAMPTZ,
  last_event_type TEXT,
  health_status TEXT NOT NULL DEFAULT 'awaiting_first_event' CHECK (
    health_status IN ('awaiting_first_event', 'healthy', 'stale', 'error')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

CREATE INDEX idx_webhooks_workspace ON webhooks(workspace_id);

-- ============================================================
-- INVITATIONS (pending invites before user signs up)
-- ============================================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (SOC 2 requirement)
-- Immutable append-only log — no UPDATE/DELETE allowed via RLS
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  actor_user_id UUID REFERENCES auth.users(id),
  action audit_action NOT NULL,
  resource_type TEXT,           -- e.g., 'integration', 'webhook', 'member'
  resource_id UUID,
  metadata JSONB DEFAULT '{}',  -- non-sensitive context (e.g., provider name, role)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_workspace ON audit_log(workspace_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's role in a workspace
CREATE OR REPLACE FUNCTION get_user_workspace_role(p_workspace_id UUID, p_user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- WORKSPACES: members can read their workspace
CREATE POLICY "members_read_own_workspace" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- WORKSPACE MEMBERS: members can see their workspace's members
CREATE POLICY "members_read_workspace_members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INTEGRATIONS: members can read status (NOT secrets)
CREATE POLICY "members_read_integration_status" ON integrations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INTEGRATION SECRETS: NO client access ever. Service role only.
CREATE POLICY "no_client_access_secrets" ON integration_secrets
  FOR ALL USING (false); -- blocks all; service_role bypasses RLS

-- WEBHOOKS: owners and managers can read webhook metadata
CREATE POLICY "owners_managers_read_webhooks" ON webhooks
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- INVITATIONS: owners can manage invitations
CREATE POLICY "owners_read_invitations" ON invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- AUDIT LOG: owners and managers can read audit log for their workspace
CREATE POLICY "owners_managers_read_audit_log" ON audit_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- Prevent ANY client from writing to audit_log (service_role only)
CREATE POLICY "no_client_write_audit_log" ON audit_log
  FOR INSERT WITH CHECK (false);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
