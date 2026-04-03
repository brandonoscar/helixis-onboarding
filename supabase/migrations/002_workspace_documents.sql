-- ============================================================
-- WORKSPACE DOCUMENTS & AI MEMORY
-- Stores uploaded SOPs, business context documents, and
-- extracted text content that serves as AI memory/context.
-- ============================================================

-- Document processing status
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'ready', 'error');

-- ============================================================
-- WORKSPACE DOCUMENTS
-- Stores both uploaded files and text descriptions.
-- content_text holds extracted text that becomes AI memory.
-- ============================================================

CREATE TABLE workspace_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- File metadata (null for text-only entries)
  file_name TEXT,
  file_path TEXT,                    -- path in Supabase Storage bucket
  file_type TEXT,                    -- MIME type (e.g., application/pdf)
  file_size BIGINT,                  -- bytes
  -- AI memory content
  content_text TEXT,                 -- extracted/provided text content
  word_count INTEGER NOT NULL DEFAULT 0,
  -- Processing
  status document_status NOT NULL DEFAULT 'pending',
  processing_error TEXT,
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspace_documents_workspace ON workspace_documents(workspace_id);
CREATE INDEX idx_workspace_documents_status ON workspace_documents(status);

-- ============================================================
-- WORKSPACE MEMORY
-- Aggregated AI-ready context derived from documents.
-- One row per workspace — updated as documents are processed.
-- ============================================================

CREATE TABLE workspace_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Combined context text from all documents + descriptions
  context_text TEXT NOT NULL DEFAULT '',
  total_word_count INTEGER NOT NULL DEFAULT 0,
  document_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspace_memory_workspace ON workspace_memory(workspace_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memory ENABLE ROW LEVEL SECURITY;

-- Members can read their workspace's documents
CREATE POLICY "members_read_workspace_documents" ON workspace_documents
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Members can read their workspace's memory
CREATE POLICY "members_read_workspace_memory" ON workspace_memory
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- No client writes — service_role only (via Edge Functions)
CREATE POLICY "no_client_write_documents" ON workspace_documents
  FOR INSERT WITH CHECK (false);

CREATE POLICY "no_client_write_memory" ON workspace_memory
  FOR INSERT WITH CHECK (false);

-- Updated_at trigger
CREATE TRIGGER workspace_documents_updated_at BEFORE UPDATE ON workspace_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ADD audit_action for document uploads
-- ============================================================

ALTER TYPE audit_action ADD VALUE 'document_uploaded';
ALTER TYPE audit_action ADD VALUE 'business_context_saved';
