import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "./lib/supabase";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

type Step = "auth" | "workspace" | "integration" | "webhooks" | "team" | "finish";
type Role = "owner" | "manager" | "employee";

interface WorkspaceData {
  name: string;
  slug: string;
  id?: string;
  provider?: string;
}

interface IntegrationState {
  status: "idle" | "testing" | "connected" | "error" | "locked";
  keyHint?: string;
  lockedAt?: string;
  lastTested?: string;
  testMessage?: string;
  latencyMs?: number;
}

interface IntegrationCreds {
  apiKey: string;
  apiSecret: string;
  environment: "production" | "sandbox";
  subdomain?: string;
}

interface WebhookState {
  endpointUrl?: string;
  signingSecret?: string;
  secretConfirmed: boolean;
  secretViewed: boolean;
  health: "awaiting" | "healthy" | "stale";
  lastReceived?: string;
}

interface TeamMember {
  email: string;
  role: Role;
  status: "pending" | "sent";
}

// ─────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface-2: #18181f;
    --surface-3: #1e1e28;
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.13);
    --accent: #7c6af7;
    --accent-dim: rgba(124,106,247,0.15);
    --accent-glow: rgba(124,106,247,0.35);
    --green: #22c55e;
    --green-dim: rgba(34,197,94,0.12);
    --red: #ef4444;
    --red-dim: rgba(239,68,68,0.12);
    --yellow: #f59e0b;
    --yellow-dim: rgba(245,158,11,0.12);
    --text: #f0f0f8;
    --text-2: #9090a8;
    --text-3: #55556a;
    --radius: 10px;
    --radius-lg: 16px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
  }

  /* Background grid */
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(124,106,247,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,106,247,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* Ambient glow */
  .app::after {
    content: '';
    position: fixed;
    top: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(124,106,247,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 260px;
    flex-shrink: 0;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    border-right: 1px solid var(--border);
    position: relative;
    z-index: 1;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-mark {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #7c6af7, #a78bfa);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: white;
    letter-spacing: -1px;
  }

  .logo-text {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--text);
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius);
    cursor: default;
    transition: background 0.15s;
  }

  .step-item.active {
    background: var(--accent-dim);
  }

  .step-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid var(--border-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    flex-shrink: 0;
    font-family: 'DM Mono', monospace;
    transition: all 0.2s;
  }

  .step-item.active .step-dot {
    border-color: var(--accent);
    background: var(--accent);
    color: white;
  }

  .step-item.done .step-dot {
    border-color: var(--green);
    background: var(--green-dim);
    color: var(--green);
  }

  .step-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-3);
    transition: color 0.15s;
  }

  .step-item.active .step-label { color: var(--text); }
  .step-item.done .step-label { color: var(--text-2); }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }

  .sidebar-footer p {
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.5;
  }

  .sidebar-footer a {
    color: var(--accent);
    text-decoration: none;
  }

  /* ── MAIN ── */
  .main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    position: relative;
    z-index: 1;
    overflow-y: auto;
  }

  .panel {
    width: 100%;
    max-width: 520px;
    animation: fadeUp 0.3s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .panel-header { margin-bottom: 32px; }

  .panel-tag {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
    font-family: 'DM Mono', monospace;
  }

  .panel-title {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.5px;
    line-height: 1.25;
    color: var(--text);
    margin-bottom: 8px;
  }

  .panel-desc {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.6;
  }

  /* ── CARD ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2);
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── FORM ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .field:last-child { margin-bottom: 0; }

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-2);
    letter-spacing: 0.2px;
  }

  input, select {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    padding: 10px 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    -webkit-appearance: none;
  }

  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  input::placeholder { color: var(--text-3); }

  input.secret-input {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    letter-spacing: 1px;
  }

  select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239090a8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    padding-right: 36px;
  }

  /* ── BUTTONS ── */
  .btn {
    align-items: center;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    display: inline-flex;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    gap: 8px;
    justify-content: center;
    outline: none;
    padding: 10px 20px;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
    width: 100%;
    padding: 12px;
    font-size: 15px;
    font-weight: 600;
    margin-top: 8px;
  }

  .btn-primary:hover:not(:disabled) {
    background: #8b7af8;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px var(--accent-glow);
  }

  .btn-primary:active:not(:disabled) { transform: translateY(0); }

  .btn-secondary {
    background: var(--surface-3);
    border: 1px solid var(--border-bright);
    color: var(--text);
    flex: 1;
  }

  .btn-secondary:hover:not(:disabled) { background: var(--surface-2); border-color: var(--border-bright); }

  .btn-ghost {
    background: transparent;
    color: var(--text-2);
    padding: 8px 12px;
    font-size: 13px;
  }

  .btn-ghost:hover { color: var(--text); background: var(--surface-2); }

  .btn-danger {
    background: var(--red-dim);
    border: 1px solid rgba(239,68,68,0.2);
    color: var(--red);
    font-size: 13px;
    padding: 8px 14px;
  }

  .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

  .btn-row { display: flex; gap: 8px; }

  /* ── STATUS BADGES ── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .badge-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }
  .badge-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }
  .badge-yellow { background: var(--yellow-dim); color: var(--yellow); border: 1px solid rgba(245,158,11,0.2); }
  .badge-purple { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(124,106,247,0.2); }
  .badge-muted { background: var(--surface-3); color: var(--text-3); border: 1px solid var(--border); }

  .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .dot.pulse { animation: pulse 2s infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── LOCKED STATE ── */
  .locked-banner {
    background: var(--green-dim);
    border: 1px solid rgba(34,197,94,0.2);
    border-radius: var(--radius);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .locked-info { display: flex; align-items: center; gap: 10px; }

  .locked-icon {
    width: 32px;
    height: 32px;
    background: rgba(34,197,94,0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  /* ── COPY FIELD ── */
  .copy-field {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .copy-value {
    flex: 1;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: all;
  }

  .copy-btn {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s;
    white-space: nowrap;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }

  .copy-btn:hover { background: var(--accent-dim); }

  /* ── SECRET REVEAL ── */
  .secret-reveal {
    background: #0d0d15;
    border: 1px solid rgba(124,106,247,0.3);
    border-radius: var(--radius);
    padding: 16px;
    position: relative;
    overflow: hidden;
  }

  .secret-reveal::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(124,106,247,0.05), transparent);
    pointer-events: none;
  }

  .secret-reveal-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--accent);
    margin-bottom: 10px;
    font-family: 'DM Mono', monospace;
  }

  .secret-value {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text);
    word-break: break-all;
    line-height: 1.7;
    margin-bottom: 12px;
  }

  .secret-warning {
    font-size: 12px;
    color: var(--yellow);
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 8px 12px;
    background: var(--yellow-dim);
    border-radius: 6px;
    line-height: 1.5;
  }

  /* ── TEAM MEMBER LIST ── */
  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }

  .member-item:last-child { border-bottom: none; }

  .member-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .member-info { flex: 1; min-width: 0; }
  .member-email { font-size: 13px; font-weight: 500; color: var(--text); truncate: clip; }
  .member-status { font-size: 11px; color: var(--text-3); }

  /* ── DIVIDER ── */
  .divider {
    height: 1px;
    background: var(--border);
    margin: 20px 0;
  }

  /* ── TEST RESULT ── */
  .test-result {
    padding: 12px 14px;
    border-radius: var(--radius);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    animation: fadeUp 0.2s ease both;
  }

  .test-result.success {
    background: var(--green-dim);
    color: var(--green);
    border: 1px solid rgba(34,197,94,0.2);
  }

  .test-result.error {
    background: var(--red-dim);
    color: var(--red);
    border: 1px solid rgba(239,68,68,0.2);
  }

  /* ── FINISH SCREEN ── */
  .finish-hero {
    text-align: center;
    padding: 32px 0;
  }

  .finish-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--green-dim);
    border: 1px solid rgba(34,197,94,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 20px;
  }

  .checklist {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 24px 0;
  }

  .check-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .check-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--green-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--green);
    flex-shrink: 0;
  }

  .check-label { font-size: 13px; font-weight: 500; color: var(--text); }
  .check-sub { font-size: 11px; color: var(--text-3); }

  .extension-steps {
    display: flex;
    gap: 8px;
    margin: 20px 0;
  }

  .ext-step {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 12px;
    text-align: center;
  }

  .ext-num {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    font-family: 'DM Mono', monospace;
    margin-bottom: 4px;
  }

  .ext-label { font-size: 12px; color: var(--text-2); }

  /* ── TOGGLE ── */
  .toggle-row {
    display: flex;
    gap: 4px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px;
    width: fit-content;
  }

  .toggle-opt {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-3);
    transition: all 0.15s;
    border: none;
    background: none;
    font-family: 'DM Sans', sans-serif;
  }

  .toggle-opt.active {
    background: var(--surface-3);
    color: var(--text);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  /* ── OTP INPUT ── */
  .otp-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin: 20px 0;
  }

  .otp-box {
    width: 48px;
    height: 56px;
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    font-family: 'DM Mono', monospace;
    border-radius: var(--radius);
    background: var(--surface-2);
    border: 1.5px solid var(--border);
    color: var(--text);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .otp-box:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  /* ── SPINNER ── */
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  .spinner.accent {
    border: 2px solid var(--accent-dim);
    border-top-color: var(--accent);
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── HINT ── */
  .hint {
    font-size: 12px;
    color: var(--text-3);
    margin-top: 6px;
    line-height: 1.5;
  }

  /* ── PROVIDER CARD ── */
  .provider-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface-2);
    cursor: pointer;
    transition: all 0.15s;
  }

  .provider-card:hover { border-color: var(--accent); background: var(--accent-dim); }
  .provider-card.selected { border-color: var(--accent); background: var(--accent-dim); }

  .provider-logo {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    background: var(--surface-3);
    flex-shrink: 0;
  }

  .provider-label { font-size: 14px; font-weight: 600; color: var(--text); }
  .provider-sub { font-size: 12px; color: var(--text-3); }

  .provider-check {
    margin-left: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid var(--border-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.15s;
  }

  .provider-card.selected .provider-check {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  /* ── SOC2 NOTE ── */
  .soc2-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.5;
  }

  .soc2-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { padding: 24px 20px; }
  }
`;

// ─────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="copy-field">
        <span className="copy-value">{value}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function SOC2Note({ text }: { text: string }) {
  return (
    <div className="soc2-note">
      <span className="soc2-icon">🔒</span>
      <span>{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 1: WORKSPACE SETUP
// ─────────────────────────────────────────────────────────

function StepWorkspace({ onNext }: { onNext: (data: WorkspaceData) => void }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("buildium");
  const [loading, setLoading] = useState(false);

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const providers = [
    { id: "buildium", label: "Buildium", sub: "Full API integration available", emoji: "🏢", ready: true },
    { id: "appfolio", label: "AppFolio", sub: "Full API integration available", emoji: "🏠", ready: true },
    { id: "yardi", label: "Yardi", sub: "Coming soon", emoji: "🏗", ready: false },
  ];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    // Just collect name/slug — workspace is created in DB after auth
    setLoading(false);
    onNext({ name: name.trim(), slug, provider });
  };

  return (
    <div className="panel" key="workspace">
      <div className="panel-header">
        <div className="panel-tag">Step 2 of 6</div>
        <h1 className="panel-title">Create your Helixis workspace</h1>
        <p className="panel-desc">Your workspace is the central hub for your property management operations.</p>
      </div>

      <div className="card">
        <div className="field">
          <label>Company Name</label>
          <input
            type="text"
            placeholder="Acme Property Management"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {slug && <span className="hint">Workspace ID: <code style={{ fontFamily: "DM Mono", color: "var(--accent)" }}>{slug}</code></span>}
        </div>

        <div className="divider" />

        <div className="card-title">Primary Software</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {providers.map((p) => (
            <div
              key={p.id}
              className={`provider-card ${provider === p.id ? "selected" : ""} ${!p.ready ? "disabled" : ""}`}
              onClick={() => p.ready && setProvider(p.id)}
              style={!p.ready ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
            >
              <div className="provider-logo">{p.emoji}</div>
              <div>
                <div className="provider-label">{p.label}</div>
                <div className="provider-sub">{p.sub}</div>
              </div>
              <div className="provider-check">{provider === p.id ? "✓" : ""}</div>
            </div>
          ))}
        </div>
      </div>

      <SOC2Note text="Your workspace data is encrypted at rest and access-controlled. Helixis is working toward SOC 2 Type II compliance." />

      <button className="btn btn-primary" onClick={handleSubmit} disabled={!name.trim() || loading}>
        {loading ? <><span className="spinner" /> Creating workspace…</> : "Continue →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2: AUTH (Magic Link)
// ─────────────────────────────────────────────────────────

function StepAuth({ onNext }: { onNext: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string; avatar: string } | null>(null);

  // Check for existing session (e.g., after OAuth redirect)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || "",
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || "",
        });
        setConnecting(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const connectGoogle = async () => {
    setConnecting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        scopes: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/contacts.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setConnecting(false);
      alert(error.message);
    }
  };

  return (
    <div className="panel" key="auth">
      <div className="panel-header">
        <div className="panel-tag">Step 1 of 6</div>
        <h1 className="panel-title">Sign in to Helixis</h1>
        <p className="panel-desc">
          Connect your Google account to get started. You'll be the workspace Owner with full administrative access.
        </p>
      </div>

      <div className="card">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            {user.avatar && <img src={user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: "50%" }} />}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>{user.email}</div>
            </div>
            <span className="badge badge-green" style={{ marginLeft: "auto" }}><span className="dot pulse" /> Connected</span>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <button
              className="btn btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 24px", fontSize: 14 }}
              onClick={connectGoogle}
              disabled={connecting}
            >
              {connecting ? (
                <><span className="spinner accent" /> Connecting…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continue with Google
                </>
              )}
            </button>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12 }}>
              Grants access to Gmail, Google Calendar, and Contacts (read-only).
            </div>
          </div>
        )}
      </div>

      <SOC2Note text="OAuth tokens are encrypted at rest. Helixis requests only the minimum scopes needed. You can revoke access anytime from your Google account settings." />

      <button className="btn btn-primary" onClick={onNext} disabled={!user}>
        Continue →
      </button>
    </div>
  );
}
// ─────────────────────────────────────────────────────────
// STEP 3: INTEGRATION SETUP
// ─────────────────────────────────────────────────────────

function StepIntegration({
  provider: selectedProvider,
  onNext,
}: {
  provider: string;
  onNext: (creds: IntegrationCreds) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [env, setEnv] = useState<"production" | "sandbox">("production");

  const isAppFolio = selectedProvider === "appfolio";
  const canContinue = apiKey.length > 0 && apiSecret.length > 0 && (!isAppFolio || subdomain.length > 0);

  const handleContinue = () => {
    onNext({
      apiKey,
      apiSecret,
      environment: env,
      ...(isAppFolio ? { subdomain } : {}),
    });
  };

  return (
    <div className="panel" key="integration">
      <div className="panel-header">
        <div className="panel-tag">Step 3 of 6</div>
        <h1 className="panel-title">Connect {isAppFolio ? "AppFolio" : "Buildium"}</h1>
        <p className="panel-desc">Enter your API credentials. We'll verify the connection when your account is created in the final step.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>{isAppFolio ? "🏠" : "🏢"}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{isAppFolio ? "AppFolio" : "Buildium"}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Property management platform</div>
            </div>
          </div>
          {!isAppFolio && (
            <div className="toggle-row">
              <button className={`toggle-opt ${env === "production" ? "active" : ""}`} onClick={() => setEnv("production")}>Production</button>
              <button className={`toggle-opt ${env === "sandbox" ? "active" : ""}`} onClick={() => setEnv("sandbox")}>Sandbox</button>
            </div>
          )}
        </div>

        {isAppFolio && (
          <div className="field">
            <label>AppFolio Subdomain</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="text"
                placeholder="yourcompany"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>.appfolio.com</span>
            </div>
            <span className="hint">Your AppFolio account subdomain (e.g., if your URL is mycompany.appfolio.com, enter "mycompany").</span>
          </div>
        )}
        <div className="field">
          <label>Client ID</label>
          <input className="secret-input" type="password" placeholder="••••••••••••••••••••" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="field">
          <label>Client Secret</label>
          <input className="secret-input" type="password" placeholder="••••••••••••••••••••" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} autoComplete="new-password" />
          <span className="hint">
            {isAppFolio
              ? "Find these in AppFolio → Account → General Settings → Manage API Settings, or via the Developer Space at developer.appfolio.com."
              : "Find these in Buildium → Settings → API Settings."}
          </span>
        </div>

        {isAppFolio && (
          <div style={{ fontSize: 11, color: "var(--text-3)", background: "var(--surface-2)", borderRadius: "var(--radius)", padding: "10px 12px", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--text-2)" }}>Plan requirements:</strong> AppFolio Plus plan required for read-only API access. Max plan required for full read/write + webhooks. <a href="https://developer.appfolio.com" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>Learn more</a>
          </div>
        )}
      </div>

      <SOC2Note text="Your API credentials will be encrypted at rest using AES-256-GCM and stored in Supabase Vault. They are never exposed to the client after initial entry." />

      <button className="btn btn-primary" onClick={handleContinue} disabled={!canContinue}>
        Continue →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: WEBHOOKS
// ─────────────────────────────────────────────────────────

function StepWebhooks({ provider: selectedProvider, onNext }: { provider: string; onNext: (secret: string) => void }) {
  const [signingSecret, setSigningSecret] = useState("");
  const isAppFolio = selectedProvider === "appfolio";
  const providerLabel = isAppFolio ? "AppFolio" : "Buildium";

  return (
    <div className="panel" key="webhooks">
      <div className="panel-header">
        <div className="panel-tag">Step 4 of 6</div>
        <h1 className="panel-title">Webhooks</h1>
        <p className="panel-desc">Helixis uses webhooks to receive real-time events from {providerLabel}.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">How it works</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          <div style={{ marginBottom: 8 }}>1. We generate a unique webhook endpoint for your workspace</div>
          <div style={{ marginBottom: 8 }}>2. You add the endpoint URL {isAppFolio ? "in AppFolio → Admin Settings → Webhook Card" : "in Buildium → Settings → Webhooks"}</div>
          <div style={{ marginBottom: 8 }}>3. {providerLabel} sends events (new leads, work orders, etc.) to Helixis in real-time</div>
          <div>4. Helixis verifies every event {isAppFolio ? "using JWS (PS256) cryptographic signatures" : "using HMAC-SHA256 signature verification"}</div>
        </div>
      </div>

      {!isAppFolio && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Buildium Webhook Signing Secret</div>
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 12 }}>
            When you configure a webhook in Buildium, it generates a signing secret. Copy that secret and paste it below so Helixis can verify incoming events.
          </div>
          <div className="field">
            <label>Signing Secret</label>
            <input
              className="secret-input"
              type="password"
              placeholder="Paste your Buildium webhook signing secret"
              value={signingSecret}
              onChange={(e) => setSigningSecret(e.target.value)}
              autoComplete="new-password"
            />
            <span className="hint">Find this in Buildium → Settings → Webhooks → Signing Secret. It usually starts with "whsec_".</span>
          </div>
        </div>
      )}

      {isAppFolio && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">AppFolio webhook requirements</div>
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}><strong style={{ color: "var(--yellow)" }}>Max plan required</strong> — Webhooks are only available on the AppFolio Max plan.</div>
            <div style={{ marginBottom: 6 }}><strong>Manual enablement</strong> — You must request webhook activation through developer.appfolio.com → "Request Help".</div>
            <div style={{ marginBottom: 6 }}><strong>No shared secret needed</strong> — AppFolio signs webhooks using JWS (PS256). Helixis verifies signatures against AppFolio's public keys automatically.</div>
            <div>Supported topics: <code style={{ fontSize: 11, color: "var(--accent)" }}>leads</code>, <code style={{ fontSize: 11, color: "var(--accent)" }}>work_order_updates</code></div>
          </div>
        </div>
      )}

      <SOC2Note text={isAppFolio
        ? "AppFolio webhooks are verified server-side using JWS (PS256) signature validation against AppFolio's public keys. No shared secret is required."
        : "Your Buildium signing secret is stored encrypted in Supabase Vault (AES-256-GCM) and used server-side only to verify event authenticity via HMAC-SHA256."
      } />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={() => onNext("")} style={{ flex: 1 }}>
          Skip for now
        </button>
        <button className="btn btn-primary" onClick={() => onNext(signingSecret)} style={{ flex: 2, margin: 0 }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 5: TEAM
// ─────────────────────────────────────────────────────────

function StepTeam({ onNext }: { onNext: (members: TeamMember[]) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [members, setMembers] = useState<TeamMember[]>([]);

  const addMember = () => {
    if (!email.includes("@") || members.find((m) => m.email === email)) return;
    setMembers((m) => [...m, { email, role, status: "pending" }]);
    setEmail("");
  };

  const roleDesc: Record<Role, string> = {
    owner: "Full access — billing, integrations, team",
    manager: "Operations access — no billing",
    employee: "Helixis workspace only — no admin",
  };

  return (
    <div className="panel" key="team">
      <div className="panel-header">
        <div className="panel-tag">Step 5 of 6</div>
        <h1 className="panel-title">Invite your team</h1>
        <p className="panel-desc">Add teammates now or skip and invite later from Settings. Invites will be sent after account creation.</p>
      </div>

      <div className="card">
        <div className="field">
          <label>Email address</label>
          <input
            type="email"
            placeholder="colleague@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
          />
        </div>

        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          <span className="hint">{roleDesc[role]}</span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={addMember}
          disabled={!email.includes("@")}
          style={{ width: "100%" }}
        >
          + Add team member
        </button>
      </div>

      {members.length > 0 && (
        <div className="card">
          <div className="card-title">Invited ({members.length})</div>
          {members.map((m) => (
            <div className="member-item" key={m.email}>
              <div className="member-avatar">{m.email[0]}</div>
              <div className="member-info">
                <div className="member-email">{m.email}</div>
                <div className="member-status">Will be invited</div>
              </div>
              <span className={`badge ${m.role === "owner" ? "badge-purple" : m.role === "manager" ? "badge-yellow" : "badge-muted"}`}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={() => onNext(members)} style={{ flex: 1 }}>
          Skip for now
        </button>
        <button className="btn btn-primary" onClick={() => onNext(members)} style={{ flex: 2, margin: 0 }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 6: FINISH
// ─────────────────────────────────────────────────────────

function StepFinish({
  workspace,
  integrationCreds,
  webhookSecret,
  members,
}: {
  workspace: WorkspaceData;
  integrationCreds: IntegrationCreds | null;
  webhookSecret: string;
  members: TeamMember[];
}) {
  const [phase, setPhase] = useState<"confirm" | "creating" | "done" | "error">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<Array<{ label: string; status: "pending" | "running" | "done" | "error"; detail?: string }>>([]);

  const provider = workspace.provider || "buildium";
  const providerLabel = provider === "appfolio" ? "AppFolio" : "Buildium";

  const updateStep = (idx: number, status: "running" | "done" | "error", detail?: string) => {
    setProgress((prev) => prev.map((s, i) => i === idx ? { ...s, status, detail: detail ?? s.detail } : s));
  };

  const launchWorkspace = async () => {
    setLoading(true);
    setError("");

    // Get existing session from Google OAuth (step 1)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const accessToken = session.access_token;

    // Build progress steps
    const steps = [
      { label: "Creating workspace", status: "pending" as const },
      ...(integrationCreds ? [
        { label: `Storing ${providerLabel} credentials`, status: "pending" as const },
        { label: `Testing ${providerLabel} connection`, status: "pending" as const },
        { label: "Locking integration", status: "pending" as const },
      ] : []),
      { label: "Setting up webhooks", status: "pending" as const },
      ...(members.length > 0 ? [{ label: `Inviting ${members.length} team member${members.length > 1 ? "s" : ""}`, status: "pending" as const }] : []),
    ];
    setProgress(steps);
    setPhase("creating");

    let stepIdx = 0;

    try {
      // ── Create workspace ──
      updateStep(stepIdx, "running");
      const wsRes = await fetch(`${supabaseUrl}/functions/v1/create-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
        body: JSON.stringify({ name: workspace.name, slug: workspace.slug }),
      });
      const wsData = await wsRes.json();
      if (!wsRes.ok || !wsData.workspace_id) throw new Error(wsData.error || "Failed to create workspace");
      const workspaceId = wsData.workspace_id;
      updateStep(stepIdx, "done", workspace.name);
      stepIdx++;

      // ── Provision integration ──
      if (integrationCreds) {
        updateStep(stepIdx, "running");
        const provisionBody: Record<string, unknown> = {
          workspace_id: workspaceId,
          provider,
          api_key: integrationCreds.apiKey,
          api_secret: integrationCreds.apiSecret,
          environment: integrationCreds.environment,
        };
        if (integrationCreds.subdomain) provisionBody.metadata = { subdomain: integrationCreds.subdomain };

        const { data: saveData } = await supabase.functions.invoke("provision-integration", { body: provisionBody });
        if (!saveData?.integration_id) throw new Error("Failed to store credentials");
        const integrationId = saveData.integration_id;
        updateStep(stepIdx, "done", `Key: ${saveData.key_hint}`);
        stepIdx++;

        // ── Test connection ──
        updateStep(stepIdx, "running");
        const { data: testData } = await supabase.functions.invoke("test-connection", {
          body: { workspace_id: workspaceId, provider },
        });
        if (testData?.success) {
          updateStep(stepIdx, "done", `${testData.message} (${testData.latency_ms}ms)`);
        } else {
          updateStep(stepIdx, "error", testData?.message || "Connection failed");
        }
        stepIdx++;

        // ── Lock integration ──
        updateStep(stepIdx, "running");
        await supabase.functions.invoke("lock-integration", {
          body: { workspace_id: workspaceId, integration_id: integrationId },
        });
        updateStep(stepIdx, "done", "Credentials encrypted & locked");
        stepIdx++;
      }

      // ── Setup webhooks ──
      updateStep(stepIdx, "running");
      const webhookBody: Record<string, unknown> = { workspace_id: workspaceId, provider };
      // For Buildium, pass the user-provided signing secret from their dashboard
      if (provider === "buildium" && webhookSecret) {
        webhookBody.signing_secret = webhookSecret;
      }
      const { data: whData } = await supabase.functions.invoke("rotate-webhook-secret", {
        body: webhookBody,
      });
      updateStep(stepIdx, "done", whData?.endpoint_url ? "Endpoint ready" : "Configured");
      stepIdx++;

      // ── Invite team ──
      if (members.length > 0) {
        updateStep(stepIdx, "running");
        for (const m of members) {
          await supabase.functions.invoke("invite-member", {
            body: { workspace_id: workspaceId, email: m.email, role: m.role },
          });
        }
        updateStep(stepIdx, "done", `${members.length} invite${members.length > 1 ? "s" : ""} sent`);
        stepIdx++;
      }

      setPhase("done");
    } catch (err: any) {
      if (stepIdx < steps.length) {
        updateStep(stepIdx, "error", err.message || "Failed");
      }
      setError(err.message || "Setup failed. You can retry from your dashboard.");
      setPhase("error");
    }

    setLoading(false);
  };

  // ── CONFIRM PHASE ──
  if (phase === "confirm") {
    return (
      <div className="panel" key="finish">
        <div className="panel-header">
          <div className="panel-tag">Step 6 of 6</div>
          <h1 className="panel-title">Launch your workspace</h1>
          <p className="panel-desc">
            Everything looks good. Click below to create your workspace and connect {providerLabel}.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
            <strong style={{ color: "var(--text)" }}>Summary</strong>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.8 }}>
            <div>Workspace: <strong style={{ color: "var(--text)" }}>{workspace.name}</strong></div>
            <div>Provider: <strong style={{ color: "var(--text)" }}>{providerLabel}</strong></div>
            {integrationCreds && <div>API key: <strong style={{ color: "var(--text)" }}>...{integrationCreds.apiKey.slice(-4)}</strong></div>}
            {members.length > 0 && <div>Team: <strong style={{ color: "var(--text)" }}>{members.length} member{members.length > 1 ? "s" : ""}</strong></div>}
          </div>

          {error && (
            <div className="test-result error" style={{ marginTop: 12, marginBottom: 12 }}>
              <span>⚠</span> {error}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={launchWorkspace} disabled={loading}>
            {loading ? <><span className="spinner" /> Launching…</> : "Launch workspace →"}
          </button>
        </div>

        <SOC2Note text="All workspace creation events are logged for audit. Your credentials are encrypted with AES-256-GCM via Supabase Vault." />
      </div>
    );
  }

  // ── CREATING / DONE / ERROR PHASE ──
  return (
    <div className="panel" key="finish">
      {phase === "done" ? (
        <div className="finish-hero">
          <div className="finish-icon">✓</div>
          <h1 className="panel-title" style={{ textAlign: "center" }}>You're all set!</h1>
          <p className="panel-desc" style={{ textAlign: "center" }}>
            {workspace.name} is live on Helixis. Install the extension and start managing properties.
          </p>
        </div>
      ) : phase === "error" ? (
        <div className="panel-header">
          <h1 className="panel-title">Setup encountered an issue</h1>
          <p className="panel-desc">Some steps completed successfully. You can fix remaining items from your dashboard.</p>
        </div>
      ) : (
        <div className="panel-header">
          <h1 className="panel-title"><span className="spinner" /> Setting up {workspace.name}…</h1>
          <p className="panel-desc">Creating your workspace, connecting {providerLabel}, and configuring webhooks.</p>
        </div>
      )}

      <div className="checklist">
        {progress.map((s) => (
          <div className="check-item" key={s.label}>
            <div className="check-icon" style={{ color: s.status === "done" ? "var(--green)" : s.status === "error" ? "var(--red)" : s.status === "running" ? "var(--accent)" : "var(--text-3)" }}>
              {s.status === "done" ? "✓" : s.status === "error" ? "✗" : s.status === "running" ? "◌" : "·"}
            </div>
            <div>
              <div className="check-label">{s.label}</div>
              {s.detail && <div className="check-sub">{s.detail}</div>}
            </div>
          </div>
        ))}
      </div>

      {phase === "done" && (
        <>
          <div className="card">
            <div className="card-title">Install the Helixis Extension</div>
            <div className="extension-steps">
              {["Install extension", "Sign in", "You're connected"].map((label, i) => (
                <div className="ext-step" key={label}>
                  <div className="ext-num">0{i + 1}</div>
                  <div className="ext-label">{label}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 4 }}>
              Install Helixis Extension →
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button className="btn btn-ghost">Open admin dashboard instead</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "auth", label: "Sign in" },
  { id: "workspace", label: "Create workspace" },
  { id: "integration", label: "Connect" },
  { id: "webhooks", label: "Webhooks" },
  { id: "team", label: "Invite team" },
  { id: "finish", label: "Launch" },
];

function Sidebar({ current, completed }: { current: Step; completed: Set<Step> }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-mark">H</div>
        <div className="logo-text">Helixis</div>
      </div>

      <div className="steps">
        {STEPS.map((s, i) => {
          const isDone = completed.has(s.id);
          const isActive = s.id === current;
          return (
            <div key={s.id} className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <div className="step-dot">{isDone ? "✓" : i + 1}</div>
              <div className="step-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <p>Need help? <a href="#">docs.helixis.com</a></p>
        <p style={{ marginTop: 6 }}>Onboarding support: <a href="#">hello@helixis.com</a></p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState<Step>("auth");
  const [completed, setCompleted] = useState<Set<Step>>(new Set());
  const [workspace, setWorkspace] = useState<WorkspaceData>({ name: "", slug: "" });
  const [integrationCreds, setIntegrationCreds] = useState<IntegrationCreds | null>(null);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);

  const complete = (s: Step) => setCompleted((prev) => new Set([...prev, s]));

  // Auto-advance past auth if already signed in (e.g., returning from OAuth redirect)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        complete("auth");
        setStep((prev) => (prev === "auth" ? "workspace" : prev));
      }
    });
  }, []);

  const handleAuth = () => {
    complete("auth");
    setStep("workspace");
  };

  const handleWorkspace = (data: WorkspaceData) => {
    setWorkspace(data);
    complete("workspace");
    setStep("integration");
  };

  const handleIntegration = (creds: IntegrationCreds) => {
    setIntegrationCreds(creds);
    complete("integration");
    setStep("webhooks");
  };

  const handleWebhooks = (secret: string) => {
    setWebhookSecret(secret);
    complete("webhooks");
    setStep("team");
  };

  const handleTeam = (m: TeamMember[]) => {
    setMembers(m);
    complete("team");
    setStep("finish");
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <Sidebar current={step} completed={completed} />
        <div className="main">
          {step === "auth" && <StepAuth onNext={handleAuth} />}
          {step === "workspace" && <StepWorkspace onNext={handleWorkspace} />}
          {step === "integration" && <StepIntegration provider={workspace.provider || "buildium"} onNext={handleIntegration} />}
          {step === "webhooks" && <StepWebhooks provider={workspace.provider || "buildium"} onNext={handleWebhooks} />}
          {step === "team" && <StepTeam onNext={handleTeam} />}
          {step === "finish" && <StepFinish workspace={workspace} integrationCreds={integrationCreds} webhookSecret={webhookSecret} members={members} />}
        </div>
      </div>
    </>
  );
}
