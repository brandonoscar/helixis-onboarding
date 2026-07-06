import { useEffect, useRef, useState } from "react";
import Helix from "./Helix";
import { APP_URL } from "./lib/api";
import { loadWizard } from "./lib/persist";

// ─────────────────────────────────────────────────────────
// LANDING — the front door. Show the product, not paragraphs:
// real demo-mode screenshots carry the page; copy is one line
// per idea. Everything shown ships today; no vapor.
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
    padding: 64px 32px 40px;
    text-align: center;
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
    font-size: clamp(36px, 4.8vw, 56px);
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--ink);
    text-wrap: balance;
    max-width: 20ch;
    margin: 0 auto 18px;
  }

  .lp-sub {
    font-size: 17px;
    line-height: 1.6;
    color: var(--ink-muted);
    max-width: 56ch;
    margin: 0 auto 28px;
    text-wrap: balance;
  }

  .lp-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

  .lp-hero-note {
    margin-top: 16px;
    font-size: 12.5px;
    color: var(--ink-subtle);
  }

  /* staggered hero entrance */
  .lp-rise {
    opacity: 0;
    transform: translateY(18px);
    animation: lp-rise 0.7s var(--ease-out) forwards;
  }
  @keyframes lp-rise {
    to { opacity: 1; transform: none; }
  }

  /* ── framed product screenshot ── */
  .shot {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 32px;
  }

  .shot-frame {
    border: 1px solid var(--line-strong);
    border-radius: var(--r-lg);
    overflow: hidden;
    background: var(--canvas-1);
  }

  .shot-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-bottom: 1px solid var(--line);
    background: var(--canvas-2);
  }

  .shot-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--canvas-3); }

  .shot-url {
    margin-left: 10px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--ink-subtle);
    background: var(--canvas-1);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    padding: 2px 12px;
  }

  .shot-frame img { width: 100%; display: block; }

  .shot-caption {
    text-align: center;
    font-size: 13.5px;
    color: var(--ink-muted);
    margin-top: 14px;
  }

  .shot-caption strong { color: var(--ink); font-weight: 600; }

  /* ── sections ── */
  .lp-section {
    border-top: 1px solid var(--line);
    max-width: 1080px;
    margin: 0 auto;
    padding: 72px 32px;
  }

  .lp-hero-section { border-top: none; padding-top: 32px; }

  .lp-kicker {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--ink-subtle);
    margin-bottom: 14px;
  }

  .lp-h2 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--ink);
    text-wrap: balance;
    margin-bottom: 10px;
  }

  .lp-section-sub {
    font-size: 15px;
    color: var(--ink-muted);
    max-width: 60ch;
    margin-bottom: 36px;
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
    padding: 22px 22px;
  }

  .lp-step-num {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--iris);
    margin-bottom: 12px;
  }

  .lp-step-title { font-size: 15.5px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .lp-step-body { font-size: 13.5px; line-height: 1.6; color: var(--ink-muted); }

  /* ── features ── */
  .lp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

  .lp-feature {
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--canvas-1);
    padding: 22px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .lp-feature:hover { border-color: var(--line-strong); transform: translateY(-2px); }

  .lp-feature-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
  }

  .lp-feature-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--r-sm);
    background: var(--iris-soft);
    color: var(--iris);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* competitor-alternative tag — positioning, not decoration */
  .lp-alt {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--ink-muted);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-pill);
    padding: 3px 9px;
    white-space: nowrap;
  }

  .lp-feature-title { font-size: 14.5px; font-weight: 600; color: var(--ink); margin-bottom: 5px; }
  .lp-feature-body { font-size: 13px; line-height: 1.55; color: var(--ink-muted); }

  /* ── FAQ ── */
  .lp-faq { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .lp-faq-item {
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--canvas-1);
    padding: 18px 20px;
  }

  .lp-faq-q { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .lp-faq-a { font-size: 13px; line-height: 1.6; color: var(--ink-muted); }

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
  .lp-cta-band p { color: var(--ink-muted); font-size: 14.5px; margin-bottom: 26px; }

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
    .lp-hero { padding-top: 40px; }
    .lp-steps, .lp-grid, .lp-faq { grid-template-columns: 1fr; }
    .lp-trust { grid-template-columns: 1fr 1fr; }
    .lp-section { padding: 52px 24px; }
    .shot { padding: 0 16px; }
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

// Framed, real screenshot of the product (captured from the live demo build).
function Shot({
  src,
  alt,
  caption,
  eager,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  eager?: boolean;
}) {
  return (
    <div className="shot">
      <div className="shot-frame">
        <div className="shot-bar">
          <span className="shot-dot" />
          <span className="shot-dot" />
          <span className="shot-dot" />
          <span className="shot-url">app.helixis.com</span>
        </div>
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} />
      </div>
      {caption && <div className="shot-caption">{caption}</div>}
    </div>
  );
}

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
    body: "Paste your API keys once — Helixis mirrors your portfolio and stays current on every webhook.",
  },
  {
    num: "02",
    title: "Helixis runs the follow-up",
    body: "Events arrive triaged, with the reply or task already drafted. You approve; nothing sends itself.",
  },
  {
    num: "03",
    title: "Ask anything",
    body: "One chat across Buildium, Gmail, and Calendar. Every write is confirmed by you first.",
  },
];

const FEATURES: {
  icon: string;
  title: string;
  body: string;
  alt?: string;
}[] = [
  {
    icon: ICONS.key,
    title: "Maintenance execution",
    alt: "Vendoroo alternative",
    body: "Triage, drafted updates, and closeout chasing on every work order.",
  },
  {
    icon: ICONS.inbox,
    title: "An inbox that drafts the work",
    body: "Buildium events and tenant emails become cards with the action attached.",
  },
  {
    icon: ICONS.eye,
    title: "“Helixis noticed”",
    body: "Balances, lease ends, repeat issues — surfaced before you ask.",
  },
  {
    icon: ICONS.chat,
    title: "Chat across your systems",
    body: "Buildium, Gmail, Calendar, Drive, documents, and the web in one thread.",
  },
  {
    icon: ICONS.bell,
    title: "Rent reminders with judgment",
    body: "Skips who already promised to pay and who you already emailed.",
  },
  {
    icon: ICONS.users,
    title: "Leasing, turnovers & renewals",
    alt: "LeadSimple alternative",
    body: "Leads from calls and emails, applicant sync, turnover checklists, renewal windows.",
  },
];

const FAQ = [
  {
    q: "What data does Helixis access?",
    a: "Only what you connect: your Buildium records (properties, leases, tenants, work orders, bills) and — if you authorize them — Gmail and Calendar with minimum scopes. Credentials are encrypted and never shown again.",
  },
  {
    q: "Can I revoke access?",
    a: "Yes, anytime. Rotate or remove your Buildium keys, disconnect Google, and email us to erase your workspace entirely.",
  },
  {
    q: "What happens if I cancel?",
    a: "Nothing is trapped — Buildium is always your system of record. On request we delete the mirror, stored memory, and credentials.",
  },
  {
    q: "What does it cost?",
    a: "Free during early access. Design-partner pricing will be announced before billing turns on — no surprise charges.",
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
        <div className="lp-eyebrow lp-rise" style={{ animationDelay: "0.05s" }}>
          The execution layer for Buildium teams
        </div>
        <h1 className="lp-h1 lp-rise" style={{ animationDelay: "0.15s" }}>
          Turn Buildium maintenance chaos into completed work orders.
        </h1>
        <p className="lp-sub lp-rise" style={{ animationDelay: "0.25s" }}>
          Faster fixes, cleaner owner updates, fewer resident follow-ups — without
          hiring another coordinator.
        </p>
        <div className="lp-hero-ctas lp-rise" style={{ animationDelay: "0.35s" }}>
          <a className="btn btn-primary" href="/start" style={{ padding: "12px 26px", fontSize: 15 }}>
            {start} →
          </a>
          <a className="btn btn-secondary" href="#how" style={{ padding: "12px 22px", fontSize: 15 }}>
            See how it works
          </a>
        </div>
        <div className="lp-hero-note lp-rise" style={{ animationDelay: "0.45s" }}>
          For teams already on Buildium — no migration, no new platform.
        </div>
      </header>

      <div className="lp-rise" style={{ animationDelay: "0.4s" }}>
        <Shot
          src="/shots/inbox.png"
          alt="The Helixis inbox: an AC work order triaged with what Helixis noticed across records and a drafted reply ready to approve"
          eager
          caption={
            <>
              A real work order in Helixis — context surfaced, reply drafted, waiting on your approve.{" "}
              <strong>Buildium stays your system of record; Helixis is the system of action.</strong>
            </>
          }
        />
      </div>

      <section className="lp-section lp-hero-section" id="how">
        <Reveal>
          <div className="lp-kicker">How it works</div>
          <h2 className="lp-h2">From webhook to done, without the busywork.</h2>
        </Reveal>
        <Reveal>
          <div className="lp-steps" style={{ marginTop: 28 }}>
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
          <div className="lp-kicker">Chat</div>
          <h2 className="lp-h2">Ask anything. Approve before anything sends.</h2>
          <p className="lp-section-sub">
            "Who's behind on rent?" — answered from your live Buildium data, with the
            follow-up ready behind a confirm gate.
          </p>
        </Reveal>
        <Reveal>
          <Shot
            src="/shots/chat.png"
            alt="Helixis chat answering who is behind on rent with a tenant table and a confirm gate before sending reminders"
          />
        </Reveal>
      </section>

      <section className="lp-section">
        <Reveal>
          <div className="lp-kicker">Team activity</div>
          <h2 className="lp-h2">Every action logged — human or AI.</h2>
          <p className="lp-section-sub">
            One feed of who did what, across your team, the assistant, and Buildium.
          </p>
        </Reveal>
        <Reveal>
          <Shot
            src="/shots/activity.png"
            alt="Helixis team activity feed showing assistant and Buildium actions logged with timestamps"
          />
        </Reveal>
      </section>

      <section className="lp-section">
        <Reveal>
          <div className="lp-kicker">What Helixis executes</div>
          <h2 className="lp-h2">A teammate, not another tab.</h2>
          <p className="lp-section-sub">Everything here ships today and works off your live Buildium account.</p>
        </Reveal>
        <Reveal>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature" key={f.title}>
                <div className="lp-feature-head">
                  <div className="lp-feature-icon">
                    <Icon d={f.icon} />
                  </div>
                  {f.alt && <span className="lp-alt">{f.alt}</span>}
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
          <p className="lp-section-sub">Helixis acts on your systems, so the defaults are conservative.</p>
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

      <section className="lp-section">
        <Reveal>
          <div className="lp-kicker">Questions</div>
          <h2 className="lp-h2">The things you should ask before handing over keys.</h2>
        </Reveal>
        <Reveal>
          <div className="lp-faq" style={{ marginTop: 28 }}>
            {FAQ.map((f) => (
              <div className="lp-faq-item" key={f.q}>
                <div className="lp-faq-q">{f.q}</div>
                <div className="lp-faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="lp-section lp-cta-band">
        <Reveal>
          <h2 className="lp-h2">Set up in about ten minutes.</h2>
          <p>Free during early access; design-partner pricing when billing launches.</p>
          <a className="btn btn-primary" href="/start" style={{ padding: "13px 30px", fontSize: 15 }}>
            {start} →
          </a>
        </Reveal>
      </section>

      <footer className="lp-footer">
        <span>© 2026 Helixis</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="mailto:hello@helixis.com">hello@helixis.com</a>
        </div>
      </footer>
    </div>
  );
}
