import { useEffect, useRef, useState } from "react";
import Helix from "./Helix";
import { APP_URL } from "./lib/api";
import { loadWizard } from "./lib/persist";

// ─────────────────────────────────────────────────────────
// LANDING — the front door. One bold move (the live helix),
// type-led everything else. Copy describes what the product
// actually does today; no vapor.
// ─────────────────────────────────────────────────────────

const css = `
  .lp { position: relative; overflow-x: hidden; }

  .lp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1080px;
    margin: 0 auto;
    padding: 22px 32px;
  }

  .lp-wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--ink);
    text-decoration: none;
  }

  .lp-nav-links { display: flex; align-items: center; gap: 8px; }

  /* ── hero ── */
  .lp-hero {
    max-width: 1080px;
    margin: 0 auto;
    padding: 72px 32px 96px;
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
    gap: 48px;
    align-items: center;
  }

  .lp-eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--iris);
    margin-bottom: 20px;
  }

  .lp-h1 {
    font-size: clamp(38px, 5.2vw, 58px);
    font-weight: 600;
    line-height: 1.06;
    letter-spacing: -0.03em;
    color: var(--ink);
    text-wrap: balance;
    margin-bottom: 22px;
  }

  .lp-sub {
    font-size: 17px;
    line-height: 1.65;
    color: var(--ink-muted);
    max-width: 52ch;
    margin-bottom: 32px;
  }

  .lp-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; }

  .lp-hero-note {
    margin-top: 18px;
    font-size: 12.5px;
    color: var(--ink-subtle);
  }

  .lp-hero-viz {
    display: flex;
    justify-content: center;
    min-width: 0;
  }

  /* staggered hero entrance */
  .lp-rise {
    opacity: 0;
    transform: translateY(18px);
    animation: lp-rise 0.7s var(--ease-out) forwards;
  }
  @keyframes lp-rise {
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── sections ── */
  .lp-section {
    border-top: 1px solid var(--line);
    max-width: 1080px;
    margin: 0 auto;
    padding: 80px 32px;
  }

  .lp-kicker {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--ink-subtle);
    margin-bottom: 14px;
  }

  .lp-h2 {
    font-size: clamp(26px, 3.2vw, 34px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--ink);
    text-wrap: balance;
    margin-bottom: 12px;
  }

  .lp-section-sub {
    font-size: 15px;
    color: var(--ink-muted);
    max-width: 60ch;
    margin-bottom: 44px;
  }

  /* scroll reveal */
  .lp-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
  }
  .lp-reveal.on { opacity: 1; transform: none; }

  /* ── how it works ── */
  .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

  .lp-step {
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--canvas-1);
    padding: 26px 24px;
  }

  .lp-step-num {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--iris);
    margin-bottom: 14px;
  }

  .lp-step-title { font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .lp-step-body { font-size: 13.5px; line-height: 1.65; color: var(--ink-muted); }

  /* ── features ── */
  .lp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

  .lp-feature {
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--canvas-1);
    padding: 24px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .lp-feature:hover { border-color: var(--line-strong); transform: translateY(-2px); }

  .lp-feature-icon {
    width: 34px;
    height: 34px;
    border-radius: var(--r-sm);
    background: var(--iris-soft);
    color: var(--iris);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .lp-feature-title { font-size: 14.5px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .lp-feature-body { font-size: 13px; line-height: 1.6; color: var(--ink-muted); }

  /* ── trust strip ── */
  .lp-trust {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .lp-trust-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-muted);
  }

  .lp-trust-item svg { flex-shrink: 0; margin-top: 2px; color: var(--iris); }

  /* ── CTA band ── */
  .lp-cta-band { text-align: center; }
  .lp-cta-band .lp-h2 { margin-bottom: 10px; }
  .lp-cta-band p { color: var(--ink-muted); font-size: 15px; margin-bottom: 28px; }

  /* ── footer ── */
  .lp-footer {
    border-top: 1px solid var(--line);
    max-width: 1080px;
    margin: 0 auto;
    padding: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12.5px;
    color: var(--ink-subtle);
  }

  .lp-footer a { color: var(--ink-muted); text-decoration: none; }
  .lp-footer a:hover { color: var(--ink); }

  @media (max-width: 900px) {
    .lp-hero { grid-template-columns: 1fr; padding-top: 48px; padding-bottom: 64px; }
    .lp-hero-viz { order: -1; }
    .lp-steps, .lp-grid { grid-template-columns: 1fr; }
    .lp-trust { grid-template-columns: 1fr 1fr; }
    .lp-section { padding: 56px 24px; }
  }
`;

// tiny inline icon set — stroke style matches the product's lucide icons
function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  inbox: "M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  check: "M20 6 9 17l-5-5",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, className: `lp-reveal ${on ? "on" : ""}` };
}

function Reveal({ children }: { children: React.ReactNode }) {
  const { ref, className } = useReveal();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const STEPS = [
  {
    num: "01",
    title: "Connect Buildium",
    body: "Paste your API keys once. Helixis mirrors your properties, leases, tenants, work orders, and bills — then stays current on every webhook, in real time.",
  },
  {
    num: "02",
    title: "Triage from one inbox",
    body: "New events arrive with what Helixis noticed across your other records — balances, promises, open work orders — and a drafted action. You approve; nothing sends itself.",
  },
  {
    num: "03",
    title: "Ask anything",
    body: "One chat that answers across Buildium, Gmail, and Calendar. Every write to your systems is confirmed by you first, every time.",
  },
];

const FEATURES = [
  {
    icon: ICONS.inbox,
    title: "An inbox that drafts the work",
    body: "Webhooks and important tenant emails become cards with a suggested reply or task — edit, approve, done.",
  },
  {
    icon: ICONS.eye,
    title: "“Helixis noticed”",
    body: "Cross-record context on every event: an outstanding balance, a lease ending, a repeat maintenance issue — surfaced before you ask.",
  },
  {
    icon: ICONS.chat,
    title: "Chat across your systems",
    body: "Buildium, Gmail, Calendar, Drive, documents, and the public web — one conversation, routed to the right specialist.",
  },
  {
    icon: ICONS.bell,
    title: "Rent reminders with judgment",
    body: "Knows who already promised to pay, who you already emailed, and who actually needs the nudge.",
  },
  {
    icon: ICONS.users,
    title: "Leasing CRM built in",
    body: "Calls, texts, and emails become leads. Pipeline stages sync automatically when an applicant appears in Buildium.",
  },
  {
    icon: ICONS.key,
    title: "Turnovers & renewals",
    body: "Move-out notices open a tracked turnover checklist; upcoming lease ends surface with renewal context.",
  },
];

const TRUST = [
  { icon: ICONS.lock, text: "Credentials encrypted at rest — keys are stored once and never shown again" },
  { icon: ICONS.check, text: "Every write to Buildium or Gmail is confirm-gated — you approve each action" },
  { icon: ICONS.shield, text: "Company-scoped isolation across data, memory, and files" },
  { icon: ICONS.bell, text: "Helixis never auto-sends email — drafts wait for you" },
];

export default function Landing() {
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    try {
      const w = loadWizard();
      setHasProgress(Boolean(w.completed && (w.completed as string[]).length > 0));
    } catch {
      /* fresh visitor */
    }
  }, []);

  const start = hasProgress ? "Resume setup" : "Start setup";

  return (
    <div className="lp">
      <style>{css}</style>

      <nav className="lp-nav">
        <a className="lp-wordmark" href="/">
          <Helix width={22} height={30} dots={10} speed={0.5} />
          Helixis
        </a>
        <div className="lp-nav-links">
          <a className="btn btn-ghost" href={APP_URL}>
            Sign in
          </a>
          <a className="btn btn-primary" href="/start" style={{ padding: "8px 16px", fontSize: 13 }}>
            {start}
          </a>
        </div>
      </nav>

      <header className="lp-hero">
        <div>
          <div className="lp-eyebrow lp-rise" style={{ animationDelay: "0.05s" }}>
            AI operations for property management
          </div>
          <h1 className="lp-h1 lp-rise" style={{ animationDelay: "0.15s" }}>
            Your Buildium, thinking for itself.
          </h1>
          <p className="lp-sub lp-rise" style={{ animationDelay: "0.25s" }}>
            Helixis mirrors your portfolio in real time, triages what matters into one
            inbox with the reply already drafted, and answers anything — leases,
            balances, work orders — in plain English.
          </p>
          <div className="lp-hero-ctas lp-rise" style={{ animationDelay: "0.35s" }}>
            <a className="btn btn-primary" href="/start" style={{ padding: "12px 26px", fontSize: 15 }}>
              {start} →
            </a>
            <a className="btn btn-secondary" href={APP_URL} style={{ padding: "12px 22px", fontSize: 15 }}>
              Open Helixis
            </a>
          </div>
          <div className="lp-hero-note lp-rise" style={{ animationDelay: "0.45s" }}>
            Connects to your Buildium account in about ten minutes.
          </div>
        </div>
        <div className="lp-hero-viz lp-rise" style={{ animationDelay: "0.3s" }}>
          <Helix width={280} height={400} />
        </div>
      </header>

      <section className="lp-section">
        <Reveal>
          <div className="lp-kicker">How it works</div>
          <h2 className="lp-h2">From webhook to done, without the busywork.</h2>
          <p className="lp-section-sub">
            Helixis rides your existing Buildium data — no migration, no second system
            of record. Buildium stays the source of truth; Helixis does the thinking.
          </p>
        </Reveal>
        <Reveal>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div className="lp-step" key={s.num}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="lp-section">
        <Reveal>
          <div className="lp-kicker">What you get</div>
          <h2 className="lp-h2">A teammate, not another tab.</h2>
          <p className="lp-section-sub">
            Everything below ships today and works off your live Buildium account.
          </p>
        </Reveal>
        <Reveal>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature" key={f.title}>
                <div className="lp-feature-icon">
                  <Icon d={f.icon} />
                </div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-body">{f.body}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="lp-section">
        <Reveal>
          <div className="lp-kicker">Trust</div>
          <h2 className="lp-h2">Careful by construction.</h2>
          <p className="lp-section-sub">
            Helixis acts on your systems, so the defaults are conservative.
          </p>
        </Reveal>
        <Reveal>
          <div className="lp-trust">
            {TRUST.map((t) => (
              <div className="lp-trust-item" key={t.text}>
                <Icon d={t.icon} size={15} />
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="lp-section lp-cta-band">
        <Reveal>
          <h2 className="lp-h2">Set up in about ten minutes.</h2>
          <p>Workspace, Buildium keys, webhooks, team — the wizard walks you through all of it.</p>
          <a className="btn btn-primary" href="/start" style={{ padding: "13px 30px", fontSize: 15 }}>
            {start} →
          </a>
        </Reveal>
      </section>

      <footer className="lp-footer">
        <span>© 2026 Helixis</span>
        <a href="mailto:hello@helixis.com">hello@helixis.com</a>
      </footer>
    </div>
  );
}
