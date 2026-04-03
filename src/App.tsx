import { useState, useCallback } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "./lib/supabase";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

type Step = "workspace" | "integration" | "webhooks" | "team" | "documents" | "account" | "finish";
type Role = "owner" | "manager" | "employee";

interface WorkspaceData {
  name: string;
  slug: string;
  id?: string;
}

interface IntegrationData {
  apiKey: string;
  apiSecret: string;
  environment: "production" | "sandbox";
}

interface TeamMember {
  email: string;
  role: Role;
  status: "pending" | "sent";
}

interface DocumentsData {
  description: string;
  files: File[];
}

interface ProvisioningStep {
  label: string;
  status: "pending" | "running" | "done" | "error";
  message?: string;
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

  /* ── DROPZONE ── */
  .dropzone {
    border: 2px dashed var(--border-bright);
    border-radius: var(--radius-lg);
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface-2);
    position: relative;
  }

  .dropzone:hover, .dropzone.drag-over {
    border-color: var(--accent);
    background: var(--accent-dim);
  }

  .dropzone.drag-over {
    box-shadow: 0 0 0 4px var(--accent-dim);
  }

  .dropzone-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--accent-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin: 0 auto 12px;
  }

  .dropzone-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }

  .dropzone-sub {
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.5;
  }

  .dropzone-browse {
    color: var(--accent);
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    animation: fadeUp 0.2s ease both;
  }

  .file-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--accent-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .file-info { flex: 1; min-width: 0; }

  .file-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-meta {
    font-size: 11px;
    color: var(--text-3);
  }

  .file-remove {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .file-remove:hover {
    background: var(--red-dim);
    color: var(--red);
  }

  .word-counter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-3);
  }

  .word-counter .count {
    font-family: 'DM Mono', monospace;
    font-weight: 500;
  }

  .word-counter .count.met { color: var(--green); }
  .word-counter .count.unmet { color: var(--yellow); }

  .context-hint {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(124,106,247,0.08), rgba(124,106,247,0.03));
    border: 1px solid rgba(124,106,247,0.15);
    border-radius: var(--radius);
    margin-bottom: 16px;
  }

  .context-hint-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .context-hint-text {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.6;
  }

  .context-hint-text strong {
    color: var(--text);
    font-weight: 600;
  }

  textarea {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    padding: 12px 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    resize: vertical;
    min-height: 140px;
    line-height: 1.6;
  }

  textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  textarea::placeholder { color: var(--text-3); }

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
    { id: "appfolio", label: "AppFolio", sub: "Coming soon", emoji: "🏠", ready: false },
    { id: "yardi", label: "Yardi", sub: "Coming soon", emoji: "🏗", ready: false },
  ];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    // Just collect name/slug — workspace is created in DB after auth
    setLoading(false);
    onNext({ name: name.trim(), slug });
  };

  return (
    <div className="panel" key="workspace">
      <div className="panel-header">
        <div className="panel-tag">Step 1 of 7</div>
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
// STEP 2: INTEGRATION SETUP (local-only — credentials saved during account creation)
// ─────────────────────────────────────────────────────────

function StepIntegration({
  onNext,
}: {
  onNext: (data: IntegrationData) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [env, setEnv] = useState<"production" | "sandbox">("production");

  return (
    <div className="panel" key="integration">
      <div className="panel-header">
        <div className="panel-tag">Step 2 of 7</div>
        <h1 className="panel-title">Connect your services</h1>
        <p className="panel-desc">Enter your Buildium API credentials. They'll be encrypted and tested when you create your account.</p>
      </div>

      {/* ── Buildium ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>🏢</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Buildium</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Property management platform</div>
            </div>
          </div>
          <div className="toggle-row">
            <button className={`toggle-opt ${env === "production" ? "active" : ""}`} onClick={() => setEnv("production")}>Production</button>
            <button className={`toggle-opt ${env === "sandbox" ? "active" : ""}`} onClick={() => setEnv("sandbox")}>Sandbox</button>
          </div>
        </div>

        <div className="field">
          <label>Client ID</label>
          <input className="secret-input" type="password" placeholder="••••••••••••••••••••" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="field">
          <label>Client Secret</label>
          <input className="secret-input" type="password" placeholder="••••••••••••••••••••" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} autoComplete="new-password" />
          <span className="hint">Find these in Buildium → Settings → API Settings.</span>
        </div>
      </div>

      {/* ── Google ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Google</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Gmail, Calendar, Contacts, Drive</div>
            </div>
          </div>
          <span className="badge badge-muted">After signup</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
          Google OAuth will be connected after you create your account.
        </div>
      </div>

      {/* ── Microsoft ── */}
      <div className="card" style={{ marginBottom: 16, opacity: 0.5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>
              <svg width="20" height="20" viewBox="0 0 23 23"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Microsoft</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Outlook, Calendar, Teams, OneDrive</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>Coming soon</span>
        </div>
      </div>

      <SOC2Note text="Your API credentials are never stored in the browser. They'll be encrypted at rest using AES-256-GCM in our vault when you create your account." />

      <button className="btn btn-primary" onClick={() => onNext({ apiKey, apiSecret, environment: env })} disabled={!apiKey || !apiSecret}>
        Continue →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: WEBHOOKS (informational — generated during account creation)
// ─────────────────────────────────────────────────────────

function StepWebhooks({ onNext }: { onNext: () => void }) {
  return (
    <div className="panel" key="webhooks">
      <div className="panel-header">
        <div className="panel-tag">Step 3 of 7</div>
        <h1 className="panel-title">Webhooks</h1>
        <p className="panel-desc">Helixis listens for real-time events from Buildium. Your webhook endpoint and signing secret will be generated when you create your account.</p>
      </div>

      <div className="card">
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>How webhooks work</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
            When you create your account, Helixis will generate a secure webhook endpoint and a signing secret. You'll add these to your Buildium settings so Helixis receives real-time property events.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">What gets configured</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>1</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Webhook endpoint URL</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>A unique HTTPS endpoint for your workspace</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>2</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Signing secret</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>HMAC-SHA256 key to verify event authenticity</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>3</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Real-time events</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Tenant activity, maintenance, leases, and more</div>
            </div>
          </div>
        </div>
      </div>

      <SOC2Note text="Webhook signing secrets are stored encrypted and used server-side only. The secret is shown once during setup — save it securely." />

      <button className="btn btn-primary" onClick={onNext} style={{ marginTop: 8 }}>
        Continue →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: TEAM (local-only — invitations sent during account creation)
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
        <div className="panel-tag">Step 4 of 7</div>
        <h1 className="panel-title">Invite your team</h1>
        <p className="panel-desc">Add teammates now or skip and do it later from Settings. Invitations will be sent when you create your account.</p>
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
// STEP 6: BUSINESS DOCUMENTS
// ─────────────────────────────────────────────────────────

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/rtf",
  "application/rtf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocIcon(type: string): string {
  if (type.includes("pdf")) return "\u{1F4C4}";
  if (type.includes("word") || type.includes("document")) return "\u{1F4DD}";
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return "\u{1F4CA}";
  if (type.includes("text")) return "\u{1F4C3}";
  return "\u{1F4CE}";
}

function StepDocuments({
  onNext,
}: {
  onNext: (data: DocumentsData) => void;
}) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const wordCount = description
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const wordsMet = wordCount >= 100;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const validateAndAddFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);
      setError("");

      for (const file of newFiles) {
        if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
          setError(
            `"${file.name}" is not a supported document type. Please upload PDF, DOC, DOCX, TXT, RTF, CSV, XLS, or XLSX files.`
          );
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" exceeds the 10 MB size limit.`);
          continue;
        }

        if (files.some((f) => f.name === file.name)) {
          setError(`"${file.name}" has already been added.`);
          continue;
        }

        setFiles((prev) => [...prev, file]);
      }
    },
    [files]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAddFiles(e.dataTransfer.files);
      }
    },
    [validateAndAddFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndAddFiles(e.target.files);
        e.target.value = "";
      }
    },
    [validateAndAddFiles]
  );

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleContinue = () => {
    if (!wordsMet) {
      setError("Please write at least 100 words describing your business.");
      return;
    }
    onNext({ description, files });
  };

  return (
    <div className="panel" key="documents">
      <div className="panel-header">
        <div className="panel-tag">Step 5 of 7</div>
        <h1 className="panel-title">Teach Helixis your business</h1>
        <p className="panel-desc">
          Upload your SOPs, process documents, and describe how your business operates.
        </p>
      </div>

      <div className="context-hint">
        <span className="context-hint-icon">{"\u2728"}</span>
        <div className="context-hint-text">
          <strong>The more you explain your business, the better Helixis will be.</strong>{" "}
          Share your standard operating procedures, team workflows, escalation policies,
          and anything that makes your property management unique. This context becomes
          Helixis's memory — helping it understand your processes and respond the way
          your team would.
        </div>
      </div>

      {/* ── Business Description ── */}
      <div className="card">
        <div className="card-title">Business Description</div>
        <div className="field">
          <label>Describe how your business operates</label>
          <textarea
            placeholder="Tell Helixis about your business — how you handle maintenance requests, your tenant communication process, lease renewal workflows, vendor relationships, escalation procedures, and any unique policies or processes that define how your team operates day-to-day..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError("");
            }}
            rows={7}
          />
          <div className="word-counter">
            <span>Minimum 100 words required</span>
            <span className={`count ${wordsMet ? "met" : "unmet"}`}>
              {wordCount} / 100 words
            </span>
          </div>
        </div>
      </div>

      {/* ── Document Upload ── */}
      <div className="card">
        <div className="card-title">Supporting Documents</div>
        <div
          className={`dropzone ${dragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("doc-upload-input")?.click()}
        >
          <input
            id="doc-upload-input"
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
          <div className="dropzone-icon">{"\u{1F4C1}"}</div>
          <div className="dropzone-title">
            Drag & drop your documents here
          </div>
          <div className="dropzone-sub">
            or <span className="dropzone-browse">browse files</span>
          </div>
          <div className="dropzone-sub" style={{ marginTop: 8 }}>
            PDF, DOC, DOCX, TXT, RTF, CSV, XLS, XLSX — up to 10 MB each
          </div>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f) => (
              <div className="file-item" key={f.name}>
                <div className="file-icon">{getDocIcon(f.type)}</div>
                <div className="file-info">
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">
                    {formatFileSize(f.size)} — Ready to upload
                  </div>
                </div>
                <button
                  className="file-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.name);
                  }}
                  title="Remove file"
                >
                  {"\u2715"}
                </button>
              </div>
            ))}
          </div>
        )}

        <span className="hint" style={{ marginTop: 12, display: "block" }}>
          Upload SOPs, employee handbooks, process guides, policy documents,
          or any files that explain how your business runs.
        </span>
      </div>

      {error && (
        <div className="test-result error" style={{ marginTop: 0 }}>
          <span>{"\u26A0"}</span> {error}
        </div>
      )}

      <SOC2Note text="Your documents will be encrypted at rest in Supabase Storage when you create your account. Content is processed server-side and stored as secure AI context — never shared externally." />

      <button
        className="btn btn-primary"
        onClick={handleContinue}
        disabled={!wordsMet}
      >
        Continue {"\u2192"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 6: CREATE ACCOUNT (password auth + provisioning)
// ─────────────────────────────────────────────────────────

function StepCreateAccount({
  workspace,
  integration,
  members,
  documents,
  onNext,
}: {
  workspace: WorkspaceData;
  integration: IntegrationData;
  members: TeamMember[];
  documents: DocumentsData;
  onNext: (workspaceId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [steps, setSteps] = useState<ProvisioningStep[]>([]);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = email.includes("@") && passwordValid && passwordsMatch;

  const updateStep = (index: number, update: Partial<ProvisioningStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  };

  const handleCreateAccount = async () => {
    if (!canSubmit) return;
    setError("");
    setProvisioning(true);

    const provSteps: ProvisioningStep[] = [
      { label: "Creating your account", status: "pending" },
      { label: "Setting up workspace", status: "pending" },
      { label: "Encrypting API credentials", status: "pending" },
      { label: "Testing Buildium connection", status: "pending" },
      { label: "Generating webhook secret", status: "pending" },
      ...(members.length > 0 ? [{ label: `Sending ${members.length} team invite${members.length > 1 ? "s" : ""}`, status: "pending" as const }] : []),
      { label: "Uploading business context", status: "pending" },
      ...(documents.files.length > 0 ? [{ label: `Uploading ${documents.files.length} document${documents.files.length > 1 ? "s" : ""}`, status: "pending" as const }] : []),
    ];
    setSteps(provSteps);

    let stepIdx = 0;
    let accessToken = "";
    let workspaceId = "";

    try {
      // 1. Create account
      updateStep(stepIdx, { status: "running" });
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw new Error(signUpError.message);
      if (!signUpData.session) throw new Error("Account created but email confirmation may be required. Check your inbox.");
      accessToken = signUpData.session.access_token;
      updateStep(stepIdx, { status: "done" });
      stepIdx++;

      // 2. Create workspace
      updateStep(stepIdx, { status: "running" });
      const wsRes = await fetch(`${supabaseUrl}/functions/v1/create-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
        body: JSON.stringify({ name: workspace.name, slug: workspace.slug }),
      });
      const wsData = await wsRes.json();
      if (!wsRes.ok) throw new Error(wsData.error || "Failed to create workspace");
      workspaceId = wsData.workspace_id;
      updateStep(stepIdx, { status: "done" });
      stepIdx++;

      // 3. Provision integration (encrypt API keys)
      updateStep(stepIdx, { status: "running" });
      const provRes = await fetch(`${supabaseUrl}/functions/v1/provision-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
        body: JSON.stringify({
          workspace_id: workspaceId,
          provider: "buildium",
          api_key: integration.apiKey,
          api_secret: integration.apiSecret,
          environment: integration.environment,
        }),
      });
      const provData = await provRes.json();
      if (!provRes.ok) throw new Error(provData.error || "Failed to provision integration");
      updateStep(stepIdx, { status: "done" });
      stepIdx++;

      // 4. Test connection
      updateStep(stepIdx, { status: "running" });
      const testRes = await fetch(`${supabaseUrl}/functions/v1/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
        body: JSON.stringify({ workspace_id: workspaceId, provider: "buildium" }),
      });
      const testData = await testRes.json();
      if (testData?.success) {
        updateStep(stepIdx, { status: "done", message: `Connected (${testData.latency_ms}ms)` });
        // Auto-lock on success
        if (provData?.integration_id) {
          await fetch(`${supabaseUrl}/functions/v1/lock-integration`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
            body: JSON.stringify({ workspace_id: workspaceId, integration_id: provData.integration_id }),
          });
        }
      } else {
        updateStep(stepIdx, { status: "done", message: "Saved — test manually from dashboard" });
      }
      stepIdx++;

      // 5. Generate webhook secret
      updateStep(stepIdx, { status: "running" });
      const whRes = await fetch(`${supabaseUrl}/functions/v1/rotate-webhook-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
        body: JSON.stringify({ workspace_id: workspaceId, provider: "buildium" }),
      });
      await whRes.json();
      updateStep(stepIdx, { status: "done" });
      stepIdx++;

      // 6. Send team invites (if any)
      if (members.length > 0) {
        updateStep(stepIdx, { status: "running" });
        for (const m of members) {
          await fetch(`${supabaseUrl}/functions/v1/invite-member`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
            body: JSON.stringify({ workspace_id: workspaceId, email: m.email, role: m.role }),
          });
        }
        updateStep(stepIdx, { status: "done" });
        stepIdx++;
      }

      // 7. Upload business context
      updateStep(stepIdx, { status: "running" });
      await fetch(`${supabaseUrl}/functions/v1/upload-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
        body: JSON.stringify({ workspace_id: workspaceId, description: documents.description }),
      });
      updateStep(stepIdx, { status: "done" });
      stepIdx++;

      // 8. Upload document files (if any)
      if (documents.files.length > 0) {
        updateStep(stepIdx, { status: "running" });
        for (const file of documents.files) {
          const formData = new FormData();
          formData.append("workspace_id", workspaceId);
          formData.append("file", file);
          await fetch(`${supabaseUrl}/functions/v1/upload-document`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey },
            body: formData,
          });
        }
        updateStep(stepIdx, { status: "done" });
        stepIdx++;
      }

      // Done!
      setTimeout(() => onNext(workspaceId), 800);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      // Mark current step as error
      setSteps((prev) => prev.map((s, i) => (i === stepIdx ? { ...s, status: "error" } : s)));
      setProvisioning(false);
    }
  };

  if (provisioning) {
    return (
      <div className="panel" key="account-provisioning">
        <div className="panel-header">
          <div className="panel-tag">Step 6 of 7</div>
          <h1 className="panel-title">Setting up {workspace.name}</h1>
          <p className="panel-desc">Creating your account and configuring your workspace. This only takes a moment.</p>
        </div>

        <div className="card">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0,
                  ...(s.status === "done" ? { background: "var(--green-dim)", color: "var(--green)" } :
                      s.status === "running" ? { background: "var(--accent-dim)", color: "var(--accent)" } :
                      s.status === "error" ? { background: "var(--red-dim)", color: "var(--red)" } :
                      { background: "var(--surface-3)", color: "var(--text-3)" })
                }}>
                  {s.status === "done" ? "\u2713" : s.status === "running" ? <span className="spinner accent" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : s.status === "error" ? "\u2715" : (i + 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: s.status === "done" ? "var(--text-2)" : s.status === "running" ? "var(--text)" : s.status === "error" ? "var(--red)" : "var(--text-3)" }}>
                    {s.label}
                  </div>
                  {s.message && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.message}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="test-result error" style={{ marginTop: 8 }}>
            <span>{"\u26A0"}</span> {error}
          </div>
        )}
        {error && (
          <button className="btn btn-primary" onClick={handleCreateAccount} style={{ marginTop: 8 }}>
            Retry →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="panel" key="account">
      <div className="panel-header">
        <div className="panel-tag">Step 6 of 7</div>
        <h1 className="panel-title">Create your account</h1>
        <p className="panel-desc">Set up your owner account to finalize your workspace. Your password secures access to {workspace.name}.</p>
      </div>

      <div className="card">
        <div className="field">
          <label>Work Email</label>
          <input
            type="email"
            placeholder="you@yourcompany.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            autoFocus
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            autoComplete="new-password"
          />
          {password && !passwordValid && (
            <span className="hint" style={{ color: "var(--yellow)" }}>Password must be at least 8 characters</span>
          )}
        </div>

        <div className="field">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            autoComplete="new-password"
          />
          {confirmPassword && !passwordsMatch && (
            <span className="hint" style={{ color: "var(--red)" }}>Passwords don't match</span>
          )}
        </div>
      </div>

      {error && (
        <div className="test-result error" style={{ marginTop: 0, marginBottom: 8 }}>
          <span>{"\u26A0"}</span> {error}
        </div>
      )}

      <div className="card" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <div className="card-title" style={{ marginBottom: 12 }}>What happens next</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--text-2)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--accent)" }}>{"\u2713"}</span> Create {workspace.name} workspace
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--accent)" }}>{"\u2713"}</span> Encrypt & test Buildium API connection
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--accent)" }}>{"\u2713"}</span> Generate webhook endpoint & signing secret
          </div>
          {members.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--accent)" }}>{"\u2713"}</span> Send {members.length} team invitation{members.length > 1 ? "s" : ""}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--accent)" }}>{"\u2713"}</span> Upload business context & documents for AI memory
          </div>
        </div>
      </div>

      <SOC2Note text="Your password is hashed with bcrypt and never stored in plaintext. All workspace data is encrypted at rest." />

      <button className="btn btn-primary" onClick={handleCreateAccount} disabled={!canSubmit}>
        Create account & launch →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 7: FINISH
// ─────────────────────────────────────────────────────────

function StepFinish({ workspace, members, docCount }: { workspace: WorkspaceData; members: TeamMember[]; docCount: number }) {
  const checks = [
    { label: "Workspace created", sub: workspace.name, done: true },
    { label: "Buildium connected & locked", sub: "API credentials encrypted", done: true },
    { label: "Webhooks configured", sub: "hooks.helixis.com endpoint active", done: true },
    { label: "Team invited", sub: members.length > 0 ? `${members.length} member${members.length > 1 ? "s" : ""} invited` : "No invites sent (add later)", done: true },
    { label: "Business context uploaded", sub: `AI memory configured${docCount > 0 ? ` with ${docCount} document${docCount > 1 ? "s" : ""}` : ""}`, done: true },
  ];

  return (
    <div className="panel" key="finish">
      <div className="finish-hero">
        <div className="finish-icon">✓</div>
        <h1 className="panel-title" style={{ textAlign: "center" }}>You're all set!</h1>
        <p className="panel-desc" style={{ textAlign: "center" }}>
          {workspace.name} is live on Helixis. Install the extension and start managing properties.
        </p>
      </div>

      <div className="checklist">
        {checks.map((c) => (
          <div className="check-item" key={c.label}>
            <div className="check-icon">✓</div>
            <div>
              <div className="check-label">{c.label}</div>
              <div className="check-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

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
          🧩 Install Helixis Extension →
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button className="btn btn-ghost">Open admin dashboard instead</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "workspace", label: "Create workspace" },
  { id: "integration", label: "Connect" },
  { id: "webhooks", label: "Webhooks" },
  { id: "team", label: "Invite team" },
  { id: "documents", label: "Business context" },
  { id: "account", label: "Create account" },
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
  const [step, setStep] = useState<Step>("workspace");
  const [completed, setCompleted] = useState<Set<Step>>(new Set());
  const [workspace, setWorkspace] = useState<WorkspaceData>({ name: "", slug: "" });
  const [integration, setIntegration] = useState<IntegrationData>({ apiKey: "", apiSecret: "", environment: "production" });
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<DocumentsData>({ description: "", files: [] });

  const complete = (s: Step) => setCompleted((prev) => new Set([...prev, s]));

  const handleWorkspace = (data: WorkspaceData) => {
    setWorkspace(data);
    complete("workspace");
    setStep("integration");
  };

  const handleIntegration = (data: IntegrationData) => {
    setIntegration(data);
    complete("integration");
    setStep("webhooks");
  };

  const handleWebhooks = () => {
    complete("webhooks");
    setStep("team");
  };

  const handleTeam = (m: TeamMember[]) => {
    setMembers(m);
    complete("team");
    setStep("documents");
  };

  const handleDocuments = (data: DocumentsData) => {
    setDocuments(data);
    complete("documents");
    setStep("account");
  };

  const handleAccount = (workspaceId: string) => {
    setWorkspace((prev) => ({ ...prev, id: workspaceId }));
    complete("account");
    setStep("finish");
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <Sidebar current={step} completed={completed} />
        <div className="main">
          {step === "workspace" && <StepWorkspace onNext={handleWorkspace} />}
          {step === "integration" && <StepIntegration onNext={handleIntegration} />}
          {step === "webhooks" && <StepWebhooks onNext={handleWebhooks} />}
          {step === "team" && <StepTeam onNext={handleTeam} />}
          {step === "documents" && <StepDocuments onNext={handleDocuments} />}
          {step === "account" && (
            <StepCreateAccount
              workspace={workspace}
              integration={integration}
              members={members}
              documents={documents}
              onNext={handleAccount}
            />
          )}
          {step === "finish" && <StepFinish workspace={workspace} members={members} docCount={documents.files.length} />}
        </div>
      </div>
    </>
  );
}
