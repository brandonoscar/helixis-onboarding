import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { apiFetch, apiJson, APP_URL, BUILDIUM_WEBHOOK_URL } from "./lib/api";
import { loadWizard, saveWizard } from "./lib/persist";
import Helix from "./Helix";

// ─────────────────────────────────────────────────────────
// SETUP WIZARD — 4 steps + launch (2026-07 research rebuild):
//   1 identify  — secure account: email OTP + company + doors/goal,
//                 saved BEFORE any credential is asked for
//   2 buildium  — the one high-friction required connection, with an
//                 admin preflight + handoff and a value reveal on test
//   3 live      — webhooks, reframed as "live Buildium updates", skippable
//   4 channels  — Google OAuth, optional
//   finish      — launch: what Occupella is scanning now, not a summary
// Team invites moved to the in-app Getting Started checklist.
// ─────────────────────────────────────────────────────────

type Step = "identify" | "buildium" | "live" | "channels" | "finish";

interface WorkspaceData {
  name: string;
  slug: string;
  id?: string;
}

interface IntegrationState {
  status: "idle" | "testing" | "connected" | "error" | "locked";
  keyHint?: string;
  lockedAt?: string;
  lastTested?: string;
  testMessage?: string;
  count?: number | null;
}

const DOORS_OPTIONS = ["1–50", "50–200", "200–500", "500–2,000", "2,000+"];
const GOAL_OPTIONS = [
  { id: "maintenance", label: "Maintenance & work orders" },
  { id: "owners", label: "Owner updates & reporting" },
  { id: "rent", label: "Rent collection & follow-up" },
  { id: "leasing", label: "Leasing & lead follow-up" },
  { id: "everything", label: "All of it" },
];

// ─────────────────────────────────────────────────────────
// WIZARD-SPECIFIC STYLES (tokens + primitives live in theme.ts)
// ─────────────────────────────────────────────────────────

const css = `
  .app {
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 264px;
    flex-shrink: 0;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 36px;
    border-right: 1px solid var(--line);
    position: relative;
    z-index: 1;
    background: var(--canvas-1);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
    text-decoration: none;
  }

  .logo-text { font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }

  .steps { display: flex; flex-direction: column; position: relative; }

  .step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 10px;
    border-radius: var(--r-sm);
    position: relative;
  }

  .step-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 32px;
    bottom: -10px;
    width: 1.5px;
    background: var(--line);
  }

  .step-item.done:not(:last-child)::before { background: var(--iris); opacity: 0.5; }
  .step-item.active { background: var(--iris-soft); }

  .step-dot {
    width: 21px;
    height: 21px;
    border-radius: 50%;
    border: 1.5px solid var(--line-strong);
    background: var(--canvas-1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 500;
    color: var(--ink-subtle);
    flex-shrink: 0;
    font-family: var(--font-mono);
    transition: border-color 0.2s, background 0.2s, color 0.2s;
    position: relative;
    z-index: 1;
  }

  .step-item.active .step-dot { border-color: var(--iris); background: var(--iris); color: #fff; }
  .step-item.done .step-dot { border-color: var(--iris); background: var(--iris-soft); color: var(--iris); }

  .step-label { font-size: 13px; font-weight: 500; color: var(--ink-subtle); transition: color 0.15s; }
  .step-item.active .step-label { color: var(--ink); }
  .step-item.done .step-label { color: var(--ink-muted); }

  .step-tag { margin-left: auto; font-size: 10px; color: var(--ink-subtle); font-family: var(--font-mono); }

  .sidebar-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--line); }
  .sidebar-footer p { font-size: 11px; color: var(--ink-subtle); line-height: 1.5; }
  .sidebar-footer a { color: var(--iris); text-decoration: none; }

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
    max-width: 540px;
    animation: fadeUp 0.35s var(--ease-out) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .panel-header { margin-bottom: 28px; }

  .panel-tag {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--iris);
    margin-bottom: 10px;
    font-family: var(--font-mono);
  }

  .panel-title {
    font-size: 25px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.25;
    color: var(--ink);
    margin-bottom: 8px;
    text-wrap: balance;
  }

  .panel-desc { font-size: 14px; color: var(--ink-muted); line-height: 1.6; }

  .btn-primary.wide { width: 100%; padding: 12px; font-size: 15px; font-weight: 500; margin-top: 8px; }

  .trust-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: var(--canvas-1);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    font-size: 11.5px;
    color: var(--ink-subtle);
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .trust-line svg { flex-shrink: 0; margin-top: 1px; color: var(--ink-subtle); }

  /* ── PREFLIGHT (admin check) ── */
  .preflight { display: flex; gap: 8px; margin-bottom: 16px; }

  .preflight-opt {
    flex: 1;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--canvas-2);
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-muted);
    cursor: pointer;
    font-family: var(--font-sans);
    text-align: left;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }

  .preflight-opt:hover { border-color: var(--line-strong); }
  .preflight-opt.selected { border-color: var(--iris); background: var(--iris-soft); color: var(--ink); }

  /* ── ADMIN HANDOFF ── */
  .handoff {
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--canvas-2);
    padding: 16px;
    margin-bottom: 16px;
  }

  .handoff-title { font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .handoff-body { font-size: 12.5px; color: var(--ink-muted); line-height: 1.6; margin-bottom: 12px; }

  /* ── SAMPLE PREVIEW ── */
  .sample-toggle {
    background: none;
    border: none;
    color: var(--iris);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-sans);
    padding: 0;
    margin-bottom: 12px;
  }

  .sample {
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-sm);
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .sample-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--ink-subtle);
    margin-bottom: 10px;
  }

  .sample ul { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }

  .sample li {
    font-size: 12.5px;
    color: var(--ink-muted);
    padding-left: 14px;
    position: relative;
  }

  .sample li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 7px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--iris);
    opacity: 0.7;
  }

  .sample-cta { font-size: 12px; color: var(--ink-subtle); }

  /* ── LOCKED / SUCCESS ── */
  .locked-banner {
    background: var(--positive-soft);
    border: 1px solid rgba(111, 191, 143, 0.2);
    border-radius: var(--r-sm);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .locked-info { display: flex; align-items: center; gap: 10px; }

  .locked-icon {
    width: 30px;
    height: 30px;
    background: rgba(111, 191, 143, 0.14);
    color: var(--positive);
    border-radius: var(--r-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  /* ── COPY FIELD ── */
  .copy-field {
    background: var(--canvas-2);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .copy-value {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--ink-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: all;
  }

  .copy-btn {
    font-size: 11px;
    font-weight: 500;
    color: var(--iris);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--r-xs);
    transition: background 0.15s;
    white-space: nowrap;
    background: none;
    border: none;
    font-family: var(--font-sans);
  }

  .copy-btn:hover { background: var(--iris-soft); }

  /* ── TEST RESULT ── */
  .test-result {
    padding: 12px 14px;
    border-radius: var(--r-sm);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    animation: fadeUp 0.2s var(--ease-out) both;
  }

  .test-result.success {
    background: var(--positive-soft);
    color: var(--positive);
    border: 1px solid rgba(111, 191, 143, 0.2);
  }

  .test-result.error {
    background: var(--danger-soft);
    color: var(--danger);
    border: 1px solid rgba(201, 111, 111, 0.2);
  }

  /* ── FINISH / LAUNCH ── */
  .finish-hero { text-align: center; padding: 20px 0 28px; }
  .finish-viz { display: flex; justify-content: center; margin-bottom: 8px; }

  .scan-cards { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }

  .scan-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    background: var(--canvas-1);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
  }

  .scan-num {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 500;
    color: var(--iris);
    min-width: 44px;
    text-align: center;
  }

  .scan-label { font-size: 13px; font-weight: 500; color: var(--ink); }
  .scan-sub { font-size: 11px; color: var(--ink-subtle); }

  /* ── OTP INPUT ── */
  .otp-row { display: flex; gap: 8px; justify-content: center; margin: 20px 0; }

  .otp-box {
    width: 48px;
    height: 56px;
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    font-family: var(--font-mono);
    border-radius: var(--r-sm);
    background: var(--canvas-2);
    border: 1.5px solid var(--line);
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .otp-box:focus { border-color: var(--iris); box-shadow: 0 0 0 3px var(--iris-soft); }

  /* ── TOGGLE ── */
  .toggle-row {
    display: flex;
    gap: 4px;
    background: var(--canvas-2);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    padding: 3px;
    width: fit-content;
  }

  .toggle-opt {
    padding: 6px 14px;
    border-radius: var(--r-xs);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    color: var(--ink-subtle);
    transition: background 0.15s, color 0.15s;
    border: none;
    background: none;
    font-family: var(--font-sans);
  }

  .toggle-opt.active { background: var(--canvas-3); color: var(--ink); }

  .field-row { display: flex; gap: 12px; }
  .field-row .field { flex: 1; }

  .waitlist-note { font-size: 11.5px; color: var(--ink-subtle); margin-top: 10px; }
  .waitlist-note a { color: var(--iris); text-decoration: none; }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { padding: 24px 20px; }
    .field-row { flex-direction: column; gap: 0; }
  }
`;

// ─────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TrustLine({ text }: { text: string }) {
  return (
    <div className="trust-line">
      <LockIcon />
      <span>{text}</span>
    </div>
  );
}

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

// "Preview with sample Buildium data" — a preview, never an alternate
// activation path: it always points back at the real connection.
function SamplePreview() {
  return (
    <div className="sample">
      <div className="sample-label">Sample data — what your first scan looks like</div>
      <ul>
        <li>4 work orders open more than 7 days — 2 with no vendor assigned</li>
        <li>3 owner updates ready to draft from this week's activity</li>
        <li>2 tenants promised payment — follow-up drafted for Thursday</li>
        <li>1 lease ending in 30 days with no renewal started</li>
      </ul>
      <div className="sample-cta">Connect Buildium to run this on your portfolio.</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 1: SECURE ACCOUNT (email + OTP + company + segmentation)
// ─────────────────────────────────────────────────────────

interface Profile {
  email: string;
  name: string;
  doors: string;
  goal: string;
}

function StepIdentify({
  initial,
  onProfile,
  onVerified,
}: {
  initial: Profile;
  onProfile: (p: Profile) => void;
  onVerified: (email: string, accessToken: string) => void;
}) {
  const [email, setEmail] = useState(initial.email);
  const [name, setName] = useState(initial.name);
  const [doors, setDoors] = useState(initial.doors);
  const [goal, setGoal] = useState(initial.goal);
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Resend: Supabase rate-limits OTP sends (~60s), so gate resends behind a
  // cooldown countdown to avoid a rejected-for-spamming error.
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const ready = email.includes("@") && name.trim().length > 0;

  const sendCode = async () => {
    if (!ready) return;
    // Persist the profile BEFORE the OTP round-trip so a magic-link
    // redirect (full SPA reload) resumes with the company name intact.
    onProfile({ email, name: name.trim(), doors, goal });
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/start" },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setSent(true);
    setResendCooldown(45);
  };

  const resendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setResendMsg("");
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/start" },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setResendMsg("New code sent — check your inbox (and spam).");
    setResendCooldown(45);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    const { data, error: e } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setLoading(false);
    if (e || !data.session) { setError("Invalid code. Please try again."); return; }
    onVerified(email, data.session.access_token);
  };

  return (
    <div className="panel" key="identify">
      <div className="panel-header">
        <div className="panel-tag">Step 1 of 4</div>
        <h1 className="panel-title">{sent ? "Check your email" : "Create your secure setup link"}</h1>
        <p className="panel-desc">
          {sent
            ? `We sent a 6-digit code to ${email}. Enter it below to continue.`
            : "Tell us where to point Occupella. Your progress is saved before we ask for any Buildium credentials."}
        </p>
      </div>

      {!sent ? (
        <>
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
              <label>Company Name</label>
              <input
                type="text"
                placeholder="Acme Property Management"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Doors under management</label>
                <select value={doors} onChange={(e) => setDoors(e.target.value)}>
                  <option value="">Select…</option>
                  {DOORS_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Where should Occupella help first?</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option value="">Select…</option>
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="waitlist-note">
              Runs on <strong>Buildium</strong>. On AppFolio or Yardi?{" "}
              <a href="mailto:hello@helixis.com?subject=AppFolio%2FYardi%20waitlist">Join the waitlist</a>.
            </div>
            {error && (
              <div className="test-result error"><span>⚠</span> {error}</div>
            )}
          </div>

          <TrustLine text="Passwordless login — we'll send a one-time code. Your setup is saved to your work email so you can come back later, or with your Buildium admin." />

          <button className="btn btn-primary wide" onClick={sendCode} disabled={!ready || loading}>
            {loading ? <><span className="spinner" /> Sending…</> : "Send secure code →"}
          </button>
        </>
      ) : (
        <>
          <div className="card">
            <div className="otp-row">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  className="otp-box"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !d && i > 0) {
                      document.getElementById(`otp-${i - 1}`)?.focus();
                    }
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && (
              <div className="test-result error" style={{ marginTop: 0, marginBottom: 12 }}>
                <span>⚠</span> {error}
              </div>
            )}
          </div>
          <button className="btn btn-primary wide" onClick={verifyOtp} disabled={otp.join("").length !== 6 || loading}>
            {loading ? <><span className="spinner" /> Verifying…</> : "Verify & continue →"}
          </button>
          {resendMsg && !error && (
            <div className="test-result" style={{ marginTop: 8, marginBottom: 0 }}>
              <span>✓</span> {resendMsg}
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 8 }}
            onClick={resendCode}
            disabled={resendCooldown > 0 || loading}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get it? Resend code"}
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => { setSent(false); setResendMsg(""); }}>
            ← Use different email
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2: CONNECT BUILDIUM (preflight → credentials/handoff → test → reveal)
// ─────────────────────────────────────────────────────────

function StepBuildium({
  userEmail,
  workspaceName,
  onNext,
  onSkip,
}: {
  userEmail: string;
  workspaceName: string;
  onNext: (count: number | null) => void;
  onSkip: () => void;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [env, setEnv] = useState<"production" | "sandbox">("production");
  const [integration, setIntegration] = useState<IntegrationState>({ status: "idle" });
  const [locking, setLocking] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [copied, setCopied] = useState(false);

  const handoffInstructions =
    `Hi —\n\n` +
    `We're connecting ${workspaceName || "our company"} to Occupella (an AI operations layer that runs on top of Buildium). ` +
    `It needs a Buildium API key to read our portfolio.\n\n` +
    `Steps (about 2 minutes):\n` +
    `1. In Buildium, open Settings → API Settings\n` +
    `2. Create an API key and copy the Client ID and Client Secret\n` +
    `3. Send them to me securely, or finish the setup here: ${window.location.origin}/start\n\n` +
    `Security: credentials are encrypted at rest, never displayed again after setup, ` +
    `and access can be revoked from Buildium at any time. Every write Occupella makes is approved by a person first.\n\n` +
    `Requested by ${userEmail}`;

  const mailtoHref =
    `mailto:?subject=${encodeURIComponent("Occupella needs a Buildium API key")}` +
    `&body=${encodeURIComponent(handoffInstructions)}`;

  const copyInstructions = async () => {
    await navigator.clipboard.writeText(handoffInstructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnection = async () => {
    if (!apiKey || !apiSecret) return;
    setIntegration((s) => ({ ...s, status: "testing" }));

    try {
      // Fernet-encrypt + upsert into company_buildium_credentials.
      const savedRes = await apiFetch("/api/v1/buildium/credentials", {
        method: "PUT",
        body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, environment: env }),
      });
      const saved = (await savedRes.json()) as { client_id_last4?: string };

      // Live test against Buildium. Side effect: backfills account_id,
      // which is what routes inbound webhooks back to this company —
      // this step is load-bearing, not cosmetic.
      const testData = await apiJson<{
        ok: boolean;
        account_name?: string | null;
        properties_count?: number | null;
        error?: string | null;
      }>("/api/v1/buildium/test", { method: "POST" });

      if (testData.ok) {
        const n = testData.properties_count;
        setIntegration({
          status: "connected",
          keyHint: saved.client_id_last4 ? `...${saved.client_id_last4}` : undefined,
          lastTested: new Date().toLocaleTimeString(),
          count: n ?? null,
          // Deliberately no count here — /buildium/test's properties_count
          // is a shallow probe that can undercount, and a wrong number at
          // the moment of connection reads as a broken product.
          testMessage: "Connected. Ready to scan your portfolio.",
        });
      } else {
        setIntegration({ status: "error", testMessage: testData.error || "Connection failed" });
      }
    } catch (e: any) {
      setIntegration({ status: "error", testMessage: e.message || "Connection failed" });
    }
  };

  const lockAndContinue = async () => {
    // Credentials are already encrypted server-side; this acknowledges and
    // advances. A backend lock/immutability endpoint doesn't exist yet —
    // when it does, call it here.
    setLocking(true);
    setIntegration((s) => ({ ...s, status: "locked", lockedAt: new Date().toLocaleString() }));
    setLocking(false);
    onNext(integration.count ?? null);
  };

  return (
    <div className="panel" key="buildium">
      <div className="panel-header">
        <div className="panel-tag">Step 2 of 4</div>
        <h1 className="panel-title">Connect Buildium so Occupella can scan your operations</h1>
        <p className="panel-desc">
          We test read access first and show you exactly what Occupella can see before anything launches.
        </p>
      </div>

      {/* preflight: do you have API permission? */}
      <div className="preflight">
        <button
          className={`preflight-opt ${isAdmin === true ? "selected" : ""}`}
          onClick={() => setIsAdmin(true)}
        >
          I can generate Buildium API keys
        </button>
        <button
          className={`preflight-opt ${isAdmin === false ? "selected" : ""}`}
          onClick={() => setIsAdmin(false)}
        >
          I need my admin or partner
        </button>
      </div>

      {isAdmin === false && (
        <div className="handoff">
          <div className="handoff-title">Send setup instructions to your Buildium admin</div>
          <div className="handoff-body">
            A short email that says why Occupella needs access, exactly where the API settings live, what
            gets stored, and a link back here. Your progress is saved — come back anytime with the keys.
          </div>
          <div className="btn-row">
            <a className="btn btn-secondary" href={mailtoHref} style={{ flex: 1 }}>
              Email my admin
            </a>
            <button className="btn btn-secondary" onClick={copyInstructions} style={{ flex: 1 }}>
              {copied ? "✓ Copied" : "Copy instructions"}
            </button>
          </div>
        </div>
      )}

      {(isAdmin === true || isAdmin === null) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Buildium API credentials</div>
            <div className="toggle-row">
              <button className={`toggle-opt ${env === "production" ? "active" : ""}`} onClick={() => setEnv("production")}>Production</button>
              <button className={`toggle-opt ${env === "sandbox" ? "active" : ""}`} onClick={() => setEnv("sandbox")}>Sandbox</button>
            </div>
          </div>

          <div className="field">
            <label>Buildium Client ID</label>
            <input className="secret-input" type="password" placeholder="••••••••••••••••••••" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="field">
            <label>Buildium Client Secret</label>
            <input className="secret-input" type="password" placeholder="••••••••••••••••••••" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} autoComplete="new-password" />
            <span className="hint">Find these in Buildium → Settings → API Settings → Create API key.</span>
          </div>

          {integration.status === "testing" && (
            <div className="test-result" style={{ background: "var(--canvas-2)", border: "1px solid var(--line)", color: "var(--ink-muted)" }}>
              <span className="spinner accent" /> Testing read access to your Buildium account…
            </div>
          )}
          {integration.status === "connected" && (
            <div className="test-result success">
              <span>✓</span>
              <span>{integration.testMessage}</span>
            </div>
          )}
          {integration.status === "error" && (
            <div className="test-result error">
              <span>⚠</span> {integration.testMessage}
            </div>
          )}

          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={testConnection} disabled={!apiKey || !apiSecret || integration.status === "testing"} style={{ flex: 1 }}>
              {integration.status === "testing" ? <><span className="spinner accent" /> Testing…</> : "Test Buildium connection"}
            </button>
            <button className="btn btn-primary" style={{ flex: 1, margin: 0 }} onClick={lockAndContinue} disabled={integration.status !== "connected" || locking}>
              {locking ? <><span className="spinner" /> Saving…</> : "Save & scan my portfolio →"}
            </button>
          </div>
        </div>
      )}

      <TrustLine text="Credentials are encrypted at rest, masked in the browser, and never displayed again. You can revoke access from Buildium at any time. Every write Occupella makes needs your approval." />

      <button className="sample-toggle" onClick={() => setShowSample((s) => !s)}>
        {showSample ? "Hide sample preview" : "Not ready with API keys? Preview the first scan with sample data →"}
      </button>
      {showSample && <SamplePreview />}

      <button
        className="btn btn-ghost"
        style={{ width: "100%", marginTop: 8 }}
        onClick={onSkip}
        disabled={integration.status === "testing" || locking}
      >
        Skip for now — connect Buildium later from Settings →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: LIVE BUILDIUM UPDATES (webhooks, reframed + skippable)
// ─────────────────────────────────────────────────────────

function StepLive({ onNext }: { onNext: (saved: boolean) => void }) {
  // Buildium generates the signing secret when the user creates the
  // webhook subscription on their side — Occupella cannot generate it.
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const saveSecret = async () => {
    if (secret.trim().length < 8) {
      setError("That doesn't look like a Buildium signing secret (too short).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/v1/buildium/webhook-secret", {
        method: "PUT",
        body: JSON.stringify({ secret: secret.trim() }),
      });
      setSecret("");
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Failed to save the signing secret");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel" key="live">
      <div className="panel-header">
        <div className="panel-tag">Step 3 of 4 · Recommended</div>
        <h1 className="panel-title">Turn on live Buildium updates</h1>
        <p className="panel-desc">
          Let Occupella react the moment a work order, resident message, lease event, or payment
          changes in Buildium — instead of waiting for the next sync.
        </p>
      </div>

      <div className="card">
        <div className="card-title">1 · Add this endpoint in Buildium</div>
        <CopyField label="Buildium → Settings → Webhooks" value={BUILDIUM_WEBHOOK_URL} />
        <div className="hint">One endpoint for all events — Occupella routes them to your account automatically.</div>
      </div>

      <div className="card">
        <div className="card-title">2 · Paste the signing secret Buildium gives you</div>
        {saved ? (
          <div className="locked-banner">
            <div className="locked-info">
              <div className="locked-icon">✓</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--positive)" }}>Live updates on</div>
                <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>Buildium events now reach Occupella in real time.</div>
              </div>
            </div>
            <span className="badge badge-positive">Secured</span>
          </div>
        ) : (
          <>
            <div className="field">
              <label>Signing secret</label>
              <input
                className="secret-input"
                type="password"
                placeholder="••••••••••••••••••••"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoComplete="new-password"
              />
              <span className="hint">Buildium shows this once when you create the webhook subscription.</span>
            </div>
            {error && (
              <div className="test-result error"><span>⚠</span> {error}</div>
            )}
            <button className="btn btn-secondary" onClick={saveSecret} disabled={saving || !secret.trim()} style={{ marginTop: 8 }}>
              {saving ? <><span className="spinner accent" /> Saving…</> : "Save signing secret"}
            </button>
          </>
        )}
      </div>

      <TrustLine text="The signing secret is encrypted server-side and used only to verify that events really came from Buildium. It never comes back to the browser." />

      <button className="btn btn-primary wide" onClick={() => onNext(saved)}>
        {saved ? "Continue →" : "Skip for now — run my first scan without live updates →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 4: COMMUNICATION CHANNELS (Google OAuth, optional)
// ─────────────────────────────────────────────────────────

function StepChannels({ onNext }: { onNext: (connected: boolean) => void }) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);

  const refreshGoogleState = useCallback(async () => {
    try {
      const connectors = await apiJson<{ id: string; isConnected: boolean }[]>("/api/v1/connectors/");
      return connectors.some(
        (c) => ["gmail", "google_calendar", "google_drive"].includes(c.id) && c.isConnected,
      );
    } catch {
      return false;
    }
  }, []);

  const connectGoogle = async () => {
    setGoogleConnecting(true);
    try {
      // Composio-managed OAuth — the same connection the agent's Gmail /
      // Calendar / Drive specialists use at tool time. callbackUrl sends the
      // popup back to our own /oauth/callback (which auto-closes) instead of
      // parking on Composio's hosted "Successfully connected" page.
      const data = await apiJson<{ redirectUrl: string }>("/api/v1/connectors/gmail/connect", {
        method: "POST",
        body: JSON.stringify({ callbackUrl: `${window.location.origin}/oauth/callback` }),
      });
      window.open(data.redirectUrl, "_blank", "noopener");

      // Poll until Composio reports the connection (max ~2 min).
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        if (await refreshGoogleState()) {
          setGoogleConnected(true);
          break;
        }
      }
    } catch (e: any) {
      alert(e.message || "Could not start Google sign-in");
    } finally {
      setGoogleConnecting(false);
    }
  };

  useEffect(() => {
    refreshGoogleState().then((connected) => {
      if (connected) setGoogleConnected(true);
    });
  }, [refreshGoogleState]);

  return (
    <div className="panel" key="channels">
      <div className="panel-header">
        <div className="panel-tag">Step 4 of 4 · Optional</div>
        <h1 className="panel-title">Add Gmail &amp; Calendar context</h1>
        <p className="panel-desc">
          Occupella drafts cleaner owner updates and catches resident follow-ups when it can see the
          communication trail around a Buildium issue.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Google Workspace</div>
              <div style={{ fontSize: 11, color: "var(--ink-subtle)" }}>Gmail, Calendar, Drive</div>
            </div>
          </div>
          {googleConnected ? (
            <span className="badge badge-positive"><span className="dot pulse" /> Connected</span>
          ) : (
            <button className="btn btn-secondary" style={{ margin: 0, padding: "6px 16px", fontSize: 12 }} onClick={connectGoogle} disabled={googleConnecting}>
              {googleConnecting ? <><span className="spinner accent" /> Connecting…</> : "Connect"}
            </button>
          )}
        </div>
        {googleConnected && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-subtle)" }}>
            Access to Gmail, Google Calendar, and Drive is authorized.
          </div>
        )}
      </div>

      <TrustLine text="Occupella requests the minimum Google scopes needed. OAuth tokens are encrypted at rest and can be revoked from your Google account at any time. Occupella never auto-sends email." />

      <button className="btn btn-primary wide" onClick={() => onNext(googleConnected)}>
        {googleConnected ? "Continue →" : "Skip — start with Buildium only →"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LAUNCH: FIRST OPERATIONS SCAN
// ─────────────────────────────────────────────────────────

interface ScanData {
  synced: boolean;
  properties: number;
  units: number;
  tenants: number;
  active_leases: number;
  open_work_orders: number;
  stalled_work_orders: number;
  expiring_leases: number;
  expiring_window_days: number;
  delinquent_leases: number;
  delinquent_total: number;
  pending_promises: number;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function StepFinish({
  workspace,
  buildiumCount,
  buildiumConnected,
  liveUpdates,
  googleConnected,
}: {
  workspace: WorkspaceData;
  buildiumCount: number | null;
  buildiumConnected: boolean;
  liveUpdates: boolean;
  googleConnected: boolean;
}) {
  // The real day-one scan (GET /reports/first-scan): deterministic mirror
  // counts. Poll while the initial backfill fills the mirror (synced=false);
  // any error falls back to the static setup-status cards so an older
  // backend deploy can never break the launch screen.
  const [scan, setScan] = useState<ScanData | null>(null);
  const [scanning, setScanning] = useState(true);
  const [appHref, setAppHref] = useState(APP_URL);

  useEffect(() => {
    let active = true;
    let attempts = 0;

    // No Buildium yet → nothing to scan; go straight to the setup cards.
    if (!buildiumConnected) {
      setScanning(false);
      return;
    }

    const poll = async () => {
      try {
        const data = await apiJson<ScanData>("/api/v1/reports/first-scan");
        if (!active) return;
        setScan(data);
        if (data.synced || attempts >= 11) {
          setScanning(false);
          return;
        }
      } catch {
        if (!active) return;
        setScanning(false); // endpoint missing/unreachable → static fallback
        return;
      }
      attempts += 1;
      setTimeout(poll, 5000);
    };

    poll();
    return () => {
      active = false;
    };
  }, []);

  // Setup is done — hand the user to the app SIGNED IN, not at its login
  // form. The app is a different origin, so its Supabase client can't see
  // the wizard's session; it is, however, created with
  // ``detectSessionInUrl: true``, so an implicit-grant-shaped URL fragment
  // signs the user straight in (the exact mechanism its own Google OAuth
  // return uses) and supabase-js scrubs the tokens from the URL on load.
  // Fragments never reach any server. Short delay so the launch screen
  // registers; the primary button remains for anyone who clicks first.
  useEffect(() => {
    let cancelled = false;
    let t: number | undefined;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      let url = APP_URL;
      if (session?.access_token && session.refresh_token) {
        const frag = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: String(session.expires_in ?? 3600),
          token_type: session.token_type || "bearer",
        });
        if (session.expires_at) frag.set("expires_at", String(session.expires_at));
        url = `${APP_URL}/#${frag.toString()}`;
      }
      setAppHref(url);
      t = window.setTimeout(() => window.location.assign(url), 6000);
    });
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, []);

  const statusLine = [
    liveUpdates ? "Live updates: on" : "Live updates: off — enable later in Settings",
    googleConnected ? "Gmail & Calendar: connected" : "Gmail & Calendar: skipped",
  ].join(" · ");

  const findings =
    scan && scan.synced
      ? [
          {
            num: String(scan.open_work_orders),
            label: `open work order${scan.open_work_orders === 1 ? "" : "s"}`,
            sub:
              scan.stalled_work_orders > 0
                ? `${scan.stalled_work_orders} look stalled — no update in over 7 days.`
                : "None look stalled right now.",
          },
          {
            num: String(scan.expiring_leases),
            label: `lease${scan.expiring_leases === 1 ? "" : "s"} ending in the next ${scan.expiring_window_days} days`,
            sub: "Renewal windows Occupella will track for you.",
          },
          {
            num: usd.format(scan.delinquent_total),
            label: `owed across ${scan.delinquent_leases} lease${scan.delinquent_leases === 1 ? "" : "s"}`,
            sub:
              scan.pending_promises > 0
                ? `${scan.pending_promises} tenant${scan.pending_promises === 1 ? " has" : "s have"} promised payment — Occupella is watching the dates.`
                : "Rent reminders will chase these with judgment.",
          },
        ]
      : null;

  const fallbackCards = [
    buildiumConnected
      ? {
          // No count — the shallow test probe undercounts (see StepBuildium);
          // real numbers come from the mirror-backed scan `findings` above.
          num: "✓",
          label: "Buildium connected",
          sub: "Occupella is mirroring your properties, leases, tenants, work orders, and bills now.",
        }
      : {
          num: "off",
          label: "Buildium",
          sub: "Skipped — connect from Settings → Connectors to run your first scan.",
        },
    liveUpdates
      ? { num: "on", label: "Live updates", sub: "New Buildium events land in your Inbox in real time." }
      : { num: "off", label: "Live updates", sub: "Skipped — turn on later from Settings for real-time events." },
    googleConnected
      ? { num: "on", label: "Gmail & Calendar context", sub: "Important tenant emails will surface in your Inbox." }
      : { num: "off", label: "Gmail & Calendar context", sub: "Skipped — connect later from Settings → Connectors." },
  ];

  return (
    <div className="panel" key="finish">
      <div className="finish-hero">
        <div className="finish-viz">
          <Helix width={80} height={110} dots={14} speed={0.5} />
        </div>
        <h1 className="panel-title" style={{ textAlign: "center" }}>
          {findings
            ? `Here's what Occupella found in ${workspace.name || "your portfolio"}`
            : buildiumConnected
              ? `${workspace.name || "Your workspace"} is live — first scan running`
              : `${workspace.name || "Your workspace"} is live`}
        </h1>
        <p className="panel-desc" style={{ textAlign: "center" }}>
          {findings ? (
            <>
              {scan!.properties} propert{scan!.properties === 1 ? "y" : "ies"} · {scan!.units} unit
              {scan!.units === 1 ? "" : "s"} · {scan!.tenants} tenant{scan!.tenants === 1 ? "" : "s"} mirrored.
              Every number below is read straight from your Buildium data.
            </>
          ) : buildiumConnected ? (
            "Occupella is reading your portfolio now. Open the app to watch your Inbox fill in and ask your first question."
          ) : (
            "Open the app and connect Buildium whenever you're ready — your first scan runs the moment it's linked."
          )}
        </p>
      </div>

      {scanning && !findings && (
        <div className="scan-card" style={{ justifyContent: "center", gap: 10 }}>
          <span className="spinner accent" />
          <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            Scanning your portfolio — properties, leases, work orders, balances…
          </span>
        </div>
      )}

      <div className="scan-cards">
        {(findings ?? fallbackCards).map((c) => (
          <div className="scan-card" key={c.label}>
            <div className="scan-num">{c.num}</div>
            <div>
              <div className="scan-label">{c.label}</div>
              <div className="scan-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {findings && (
        <div className="hint" style={{ textAlign: "center", marginBottom: 4 }}>{statusLine}</div>
      )}

      <a className="btn btn-primary wide" href={appHref} style={{ marginTop: 4 }}>
        Open Occupella → review your Inbox
      </a>
      <div className="hint" style={{ textAlign: "center", marginTop: 8 }}>
        Taking you to Occupella automatically…
      </div>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <a className="btn btn-ghost" href={appHref} style={{ flex: 1, textAlign: "center" }}>
          Invite my team (in-app)
        </a>
        <a
          className="btn btn-ghost"
          href="mailto:hello@helixis.com?subject=15-minute%20setup%20help"
          style={{ flex: 1, textAlign: "center" }}
        >
          Book 15-minute setup help
        </a>
      </div>
      <div className="hint" style={{ textAlign: "center", marginTop: 12 }}>
        The Getting Started checklist inside Occupella walks you through the rest — first question,
        Gmail, team invites.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; tag?: string }[] = [
  { id: "identify", label: "Secure account" },
  { id: "buildium", label: "Connect Buildium" },
  { id: "live", label: "Live updates", tag: "rec" },
  { id: "channels", label: "Gmail & Calendar", tag: "opt" },
  { id: "finish", label: "Launch scan" },
];

function Sidebar({ current, completed }: { current: Step; completed: Set<Step> }) {
  return (
    <div className="sidebar">
      <a className="logo" href="/">
        <Helix width={22} height={30} dots={10} speed={0.5} />
        <div className="logo-text">Occupella</div>
      </a>

      <div className="steps">
        {STEPS.map((s, i) => {
          const isDone = completed.has(s.id);
          const isActive = s.id === current;
          return (
            <div key={s.id} className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <div className="step-dot">{isDone ? "✓" : i + 1}</div>
              <div className="step-label">{s.label}</div>
              {s.tag && <div className="step-tag">{s.tag}</div>}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <p>Need help? <a href="https://docs.helixis.com" target="_blank" rel="noopener noreferrer">docs.helixis.com</a></p>
        <p style={{ marginTop: 6 }}>Onboarding support: <a href="mailto:hello@helixis.com">hello@helixis.com</a></p>
        {/* Legal-entity attribution (A2P/Twilio verification crawls). */}
        <p style={{ marginTop: 6 }}>Occupella is operated by Oscar Ventures LLC.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────

export default function App() {
  // Hydrate once from localStorage so a refresh / magic-link redirect resumes
  // where the user was instead of dropping them back at step 1.
  const [persisted] = useState(loadWizard);
  const [step, setStep] = useState<Step>((persisted.step as Step) || "identify");
  const [completed, setCompleted] = useState<Set<Step>>(
    new Set((persisted.completed as Step[]) || []),
  );
  const [workspace, setWorkspace] = useState<WorkspaceData>(
    persisted.workspace || { name: "", slug: "" },
  );
  const [userEmail, setUserEmail] = useState(persisted.userEmail || "");
  const [doors, setDoors] = useState(persisted.doors || "");
  const [goal, setGoal] = useState(persisted.goal || "");
  const [buildiumCount, setBuildiumCount] = useState<number | null>(
    persisted.buildiumCount ?? null,
  );
  const [buildiumConnected, setBuildiumConnected] = useState(
    persisted.buildiumConnected || false,
  );
  const [liveUpdates, setLiveUpdates] = useState(persisted.webhooksConfigured || false);
  const [googleConnected, setGoogleConnected] = useState(persisted.googleConnected || false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const didResume = useRef(false);

  const complete = (s: Step) => setCompleted((prev) => new Set([...prev, s]));

  // Persist progress on every meaningful change (no secrets — see persist.ts).
  useEffect(() => {
    saveWizard({
      step,
      completed: [...completed],
      workspace,
      webhooksConfigured: liveUpdates,
      userEmail,
      doors,
      goal,
      buildiumCount,
      buildiumConnected,
      googleConnected,
    });
  }, [step, completed, workspace, liveUpdates, userEmail, doors, goal, buildiumCount, buildiumConnected, googleConnected]);

  // Idempotently create the company + apply the workspace name. Shared by the
  // inline-OTP path (explicit token) and the magic-link resume path
  // (persisted session, no token needed). /auth/bootstrap is idempotent.
  const bootstrapWorkspace = useCallback(
    async (token: string | undefined, name: string): Promise<string> => {
      const data = await apiJson<{ company_id: string }>("/api/v1/auth/bootstrap", {
        method: "POST",
        ...(token ? { token } : {}),
      });
      if (name.trim()) {
        await apiFetch("/api/v1/company", {
          method: "PATCH",
          ...(token ? { token } : {}),
          body: JSON.stringify({ name: name.trim() }),
        });
      }
      return data.company_id;
    },
    [],
  );

  // Recover an existing session on load (e.g. after a magic-link redirect,
  // which reloads the SPA). The inline-OTP path runs handleVerified itself
  // and marks 'identify' done; only resume-bootstrap when we're authenticated
  // but 'identify' hasn't completed yet — i.e. we got here via the email link.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active || !session?.user) return;
      setUserEmail(session.user.email || "");
      if (didResume.current || completed.has("identify")) return;
      didResume.current = true;
      setCreatingWorkspace(true);
      try {
        const companyId = await bootstrapWorkspace(undefined, workspace.name);
        complete("identify");
        setWorkspace((prev) => ({ ...prev, id: companyId }));
        setStep((prev) => (prev === "identify" ? "buildium" : prev));
      } catch (e: any) {
        alert(e.message || "Failed to restore your workspace session");
      } finally {
        setCreatingWorkspace(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUserEmail(session.user.email || "");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // Reads the hydrated mount snapshot intentionally; resume is a one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfile = (p: { email: string; name: string; doors: string; goal: string }) => {
    setUserEmail(p.email);
    setDoors(p.doors);
    setGoal(p.goal);
    setWorkspace((prev) => ({
      ...prev,
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleVerified = async (email: string, accessToken: string) => {
    setUserEmail(email);
    // Token passed explicitly — right after verifyOtp the persisted session
    // may not be readable yet.
    setCreatingWorkspace(true);
    try {
      const companyId = await bootstrapWorkspace(accessToken, workspace.name);
      complete("identify");
      setWorkspace((prev) => ({ ...prev, id: companyId }));
      setStep("buildium");
    } catch (e: any) {
      alert(e.message || "Failed to set up your workspace");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleBuildium = (count: number | null) => {
    setBuildiumCount(count);
    setBuildiumConnected(true);
    complete("buildium");
    setStep("live");
  };

  // Skipping Buildium also bypasses live updates (webhooks are meaningless
  // without credentials); Gmail & Calendar still stand on their own.
  const handleBuildiumSkip = () => {
    complete("buildium");
    complete("live");
    setStep("channels");
  };

  const handleLive = (saved: boolean) => {
    setLiveUpdates(saved);
    complete("live");
    setStep("channels");
  };

  const handleChannels = (connected: boolean) => {
    setGoogleConnected(connected);
    complete("channels");
    complete("finish");
    setStep("finish");
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <Sidebar current={step} completed={completed} />
        <div className="main">
          {step === "identify" && !creatingWorkspace && (
            <StepIdentify
              initial={{ email: userEmail, name: workspace.name, doors, goal }}
              onProfile={handleProfile}
              onVerified={handleVerified}
            />
          )}
          {creatingWorkspace && (
            <div className="panel">
              <div className="panel-header">
                <h1 className="panel-title"><span className="spinner" /> Setting up your workspace…</h1>
                <p className="panel-desc">Creating {workspace.name || "your workspace"} and configuring access controls.</p>
              </div>
            </div>
          )}
          {step === "buildium" && (
            <StepBuildium userEmail={userEmail} workspaceName={workspace.name} onNext={handleBuildium} onSkip={handleBuildiumSkip} />
          )}
          {step === "live" && <StepLive onNext={handleLive} />}
          {step === "channels" && <StepChannels onNext={handleChannels} />}
          {step === "finish" && (
            <StepFinish
              workspace={workspace}
              buildiumCount={buildiumCount}
              buildiumConnected={buildiumConnected}
              liveUpdates={liveUpdates}
              googleConnected={googleConnected}
            />
          )}
        </div>
      </div>
    </>
  );
}
