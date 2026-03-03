# Helixis Onboarding — Architecture & Setup Guide

## Stack Overview

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + TypeScript | Type-safe, component-based |
| Backend | Supabase (Postgres + Edge Functions) | SOC 2 certified infra, RLS, Vault |
| Secret storage | Supabase Vault (pg_sodium/AES-256-GCM) | Encrypted at rest, opaque to clients |
| Auth | Supabase Auth (magic link) | No password storage, audit logged |
| Email | Custom SMTP via SendGrid | `@helixis.com` domain, no Supabase branding |

---

## Project Structure

```
helixis-onboarding/
├── src/
│   └── App.tsx              # Full onboarding wizard (6 steps)
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full schema + RLS
│   └── functions/
│       ├── provision-integration/   # Stores encrypted API keys
│       ├── test-connection/         # Tests Buildium API
│       ├── lock-integration/        # Locks integration (immutable)
│       ├── rotate-webhook-secret/   # Generates webhook signing secret
│       └── invite-member/           # Sends workspace invitations
└── README.md
```

---

## Supabase Setup

### 1. Create Project
```bash
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Enable Vault
In Supabase Dashboard → Database → Extensions, enable:
- `pg_crypto`  
- `supabase_vault` (click Enable)

### 3. Add Vault Helper Function
Run in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION vault_create_secret(p_secret TEXT, p_name TEXT, p_description TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO vault.secrets (secret, name, description) VALUES (p_secret, p_name, p_description)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION vault_get_secret(p_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = p_id);
END;
$$;
```

### 4. Run Migrations
```bash
npx supabase db push
```

### 5. Deploy Edge Functions
```bash
npx supabase functions deploy provision-integration
npx supabase functions deploy test-connection
npx supabase functions deploy lock-integration
npx supabase functions deploy rotate-webhook-secret
npx supabase functions deploy invite-member
```

### 6. Configure Secrets (Edge Function env vars)
```bash
npx supabase secrets set SITE_URL=https://onboarding.helixis.com
```

### 7. Configure Custom SMTP (removes Supabase branding)
Dashboard → Authentication → Settings → SMTP Settings:
- Host: smtp.sendgrid.net
- Port: 587
- Username: apikey
- Password: YOUR_SENDGRID_KEY
- Sender email: noreply@helixis.com

---

## Frontend Setup

```bash
# Install dependencies
npm install @supabase/supabase-js react react-dom typescript

# Replace mock supabase client in App.tsx with:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
)
```

### Environment Variables
```env
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...  # Public anon key (safe to expose)
REACT_APP_SITE_URL=https://onboarding.helixis.com
```

---

## Security Architecture

### Encryption Flow (API Keys)
```
UI → Edge Function → pg_sodium (vault.secrets) → vault.decrypted_secrets (RLS-blocked)
         ↑                   ↑
   service_role key    AES-256-GCM via pg_sodium
   never in client     root key managed by Supabase
```

### What clients can/cannot read
| Table | Owner | Manager | Employee |
|-------|-------|---------|----------|
| workspaces | ✓ | ✓ | ✓ |
| workspace_members | ✓ | ✓ | ✓ |
| integrations (status only) | ✓ | ✓ | ✗ |
| integration_secrets | ✗ | ✗ | ✗ |
| webhooks | ✓ | ✓ | ✗ |
| audit_log | ✓ | ✓ | ✗ |
| vault.secrets | ✗ | ✗ | ✗ |

### Write-Only Secret Pattern
The UI fields for API keys are `type="password"` with `autocomplete="new-password"`. Once submitted to the Edge Function, the values are:
1. Immediately passed to `vault.create_secret()` — never persisted in application code
2. Never logged (Edge Functions explicitly avoid logging values)
3. Never returned to the client — only a `key_hint` (last 4 chars) is stored in `integration_secrets`
4. Inaccessible via any client-facing query (RLS blocks all access to `integration_secrets`)

---

## SOC 2 Compliance Checklist

### ✅ Already built
- [x] Encryption at rest (Vault/AES-256-GCM)
- [x] Encryption in transit (TLS — Supabase default)
- [x] Access control (RLS + role-based)
- [x] Audit logging (`audit_log` table, append-only via RLS)
- [x] Write-only secrets (no read-back from UI)
- [x] Immutable integration locking
- [x] Change request workflow (no direct edit after lock)

### 🔧 You need to add
- [ ] **2FA enforcement** for Owner role
  ```sql
  -- Add to sign-in hook: require TOTP for owners
  -- Dashboard → Auth → MFA Settings
  ```
- [ ] **Custom SMTP** (see setup above) — emails must come from `@helixis.com`
- [ ] **Data retention policy** — define in Privacy Policy; audit_log auto-prune after 1 year:
  ```sql
  CREATE POLICY "delete_old_logs" ON audit_log AS PERMISSIVE
    FOR DELETE USING (created_at < NOW() - INTERVAL '1 year');
  ```
- [ ] **Incident response runbook** — document in Notion/Confluence (not a code concern)
- [ ] **Access review process** — quarterly review of workspace_members roles (process, not code)
- [ ] **Penetration test** — required before Type I audit; use services like Cobalt/HackerOne

### Supabase's SOC 2 Coverage
Supabase is SOC 2 Type II certified. Request their Security Report via:
`https://security.supabase.com` (available under NDA for Enterprise)

This covers: physical security, network security, availability, and infrastructure controls.
Your application-layer controls (this codebase) layer on top.

### Timeline to Type I Audit
- Month 1-2: Implement remaining checklist items above + start policy docs
- Month 3: Internal evidence collection
- Month 4: Type I audit (point-in-time snapshot)
- Month 5-10: Observation period for Type II

---

## Buildium API Details

Buildium uses HTTP Basic Auth (not OAuth) with Client Credentials:
- **Client ID** → Basic auth username
- **Client Secret** → Basic auth password
- **Base URL (prod)**: `https://api.buildium.com/v1`
- **Base URL (sandbox)**: Not officially documented; confirm with Buildium support

The test in `test-connection/index.ts` hits `/v1/properties?pagesize=1` — a lightweight read.

---

## Future Integrations

The schema uses an `integration_provider` enum. To add AppFolio:
1. Add `'appfolio'` to the enum
2. Add a test function in `test-connection/index.ts`
3. Update the provider cards in the UI

---

## Webhook Receiver (separate service)

The webhook endpoint (`https://hooks.helixis.com/{workspace_id}/{provider}`) needs a separate webhook receiver service (not included here). Architecture:

```
Buildium → hooks.helixis.com/{ws}/{provider}
             ↓
        Webhook Receiver (Edge Function or standalone service)
             ↓ HMAC-SHA256 verify against vault signing secret
             ↓ Insert to events table
             ↓ Trigger Helixis AI processing
```

This is a Phase 2 implementation item.
