import { useEffect, useRef, useState } from "react";
import { APP_URL } from "./lib/api";
import { loadWizard } from "./lib/persist";

// ─────────────────────────────────────────────────────────────────────
// SITE CHROME — the nav, the footer, and everything more than one page
// needs.
//
// This exists because Occupella stopped being a landing page. /features and
// /pricing are real pages now, and a visitor who lands on one of them must
// get the same header, the same footer and the same way back as a visitor who
// arrived at /. The alternative — each page carrying its own copy of the nav —
// is how the wordmark ends up in two places with two paddings and the
// "Start setup" button says something different on one of them.
//
// ⚠ THE DESIGN SPEC LIVES IN Landing.tsx's header comment AND IT GOVERNS THIS
// FILE TOO. Weight ceiling 600, negative tracking scaled to size, one
// chromatic accent (--iris) and nothing else, 1px hairlines instead of
// shadows, hover changes background or hairline but never scale. New pages
// that quietly relax any of those are how a considered page becomes a
// templated one.
//
// ⚠ WHAT BELONGS HERE vs IN A PAGE. Shared chrome and the primitives every
// page uses (Reveal, Icon, the section rhythm, the card grids). NOT the
// landing hero, the rotating word, the tilting product panel or the
// alternating bands — those are the front door's and moving them here would
// invite a second page to borrow them, which is exactly how every page ends
// up looking like the homepage.
//
// ⚠ Legal.tsx keeps its OWN shell, deliberately. Those are long-form
// documents that carriers and procurement read, they render at a narrower
// measure, and they were working before this refactor. Unifying them is a
// real improvement and a real risk; it is not worth taking the night before a
// launch. If you do it later, the thing to preserve is the reading measure —
// 720px, not 1120px.
// ─────────────────────────────────────────────────────────────────────

export const siteCss = `
  .lp { position: relative; overflow-x: clip; }
  .lp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 32px; }

  /* ── type scale ── */
  .lp-h2 {
    font-size: clamp(28px, 3.4vw, 40px);
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.026em;
    color: var(--ink);
    text-wrap: balance;
    max-width: 20ch;
  }

  /* A secondary page's title. Deliberately NOT .lp-h1: that one paints a
     luminance gradient through background-clip, which is the front door's
     one flourish. Repeating it on every page would spend the effect. */
  .lp-h1-page {
    font-size: clamp(34px, 4.6vw, 54px);
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--ink);
    text-wrap: balance;
    max-width: 18ch;
  }

  .lp-eyebrow {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .lp-lede {
    font-size: 18px;
    line-height: 1.55;
    letter-spacing: -0.006em;
    color: var(--ink-muted);
    max-width: 54ch;
  }

  .lp-body { font-size: 15.5px; line-height: 1.6; color: var(--ink-muted); max-width: 58ch; }

  .lp-sr {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* ── nav ── */
  .lp-nav {
    position: sticky; top: 0; z-index: 20;
    height: 56px;
    display: flex; align-items: center; justify-content: space-between;
    /* --chrome, the same rail tint the app's sidebar uses. A visitor sees
       this page and then the product within ten minutes, and the top bar is
       the one surface both have. Held at 0.86 so the page still shows
       through as it scrolls under. The solid declaration above it is the
       fallback: without one, a browser that does not know color-mix drops
       the property entirely and the nav goes transparent over the copy
       scrolling beneath it. */
    background: var(--chrome);
    background: color-mix(in srgb, var(--chrome) 86%, transparent);
    backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid transparent;
    transition: border-color var(--dur-state) var(--ease-std);
  }
  .lp-nav[data-stuck="true"] { border-bottom-color: var(--chrome-line); }
  .lp-nav-inner {
    max-width: 1120px; margin: 0 auto; padding: 0 32px; width: 100%;
    display: flex; align-items: center; justify-content: space-between;
  }
  .lp-wordmark {
    display: inline-flex; align-items: center; gap: 9px;
    font-size: 15px; font-weight: 600; letter-spacing: -0.02em;
    color: var(--ink); text-decoration: none;
  }
  .lp-nav-right { display: flex; align-items: center; gap: 4px; }

  /* The current page, marked with weight and ink rather than a rule or a
     pill — the nav is 56px tall and an underline in it reads as a mistake. */
  .lp-nav-right .btn-ghost[aria-current="page"] { color: var(--ink); font-weight: 600; }

  /* Below ~640px the section links go and the nav keeps the two things a
     visitor on a phone actually needs: sign in, and start. The links are not
     duplicated into a burger — /features and /pricing are one tap away from
     the footer of every page, and a menu nobody opens is worse than a link
     they scroll to. */
  @media (max-width: 640px) {
    .lp-nav-inner { padding: 0 20px; }
    .lp-nav-sec { display: none; }
  }

  /* ── sections ── */
  .lp-section { padding: clamp(64px, 9vw, 96px) 0 0; }
  .lp-section-head { display: flex; flex-direction: column; gap: 14px; }

  /* A secondary page's opening. Shorter than the landing hero on purpose:
     somebody who clicked "Pricing" has already been sold the idea and wants
     the number, not another pitch. */
  .lp-pagehead { padding: clamp(44px, 6vw, 76px) 0 0; }
  .lp-pagehead .lp-lede { margin-top: 18px; }
  .lp-pagehead .lp-h1-page { margin-top: 16px; }

  .lp-textlink {
    font-size: 14.5px; font-weight: 500; color: var(--ink-muted);
    text-decoration: none; transition: color var(--dur-state) var(--ease-std);
  }
  .lp-textlink:hover { color: var(--ink); }
  .lp-note { font-size: 13px; color: var(--ink-subtle); }

  /* ── the entrance: elements settle DOWN into place ── */
  .rise { opacity: 0; transform: translateY(-10px); animation: rise var(--dur-entrance) var(--ease-out) var(--d, 0ms) forwards; }
  @keyframes rise { to { opacity: 1; transform: none; } }

  /* ── scroll reveals: headers + cards only, 12px, once ── */
  .reveal { opacity: 0; transform: translateY(12px); transition: opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out); }
  .reveal[data-in="true"] { opacity: 1; transform: none; }

  /* ── the 1px-gap card grid ──────────────────────────────────────────
     One grid, used by the trust list, the pricing cards and the feature
     cards. The cells sit on a --line background with a 1px gap, so the
     dividers ARE the background showing through and there is never a double
     hairline where two borders meet. */
  .lp-grid { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
  .lp-grid > * { background: var(--canvas); }

  /* ── trust ── */
  .lp-trust { margin-top: 32px; }
  @media (min-width: 760px) { .lp-trust { grid-template-columns: 1fr 1fr; } }
  .lp-trust-item { padding: 18px 20px; display: flex; gap: 12px; align-items: flex-start; font-size: 14px; line-height: 1.5; color: var(--ink-secondary, var(--ink-muted)); }
  .lp-trust-item svg { flex: none; margin-top: 2px; color: var(--iris); }

  /* ── closing band — the one polarity flip on a page ── */
  .lp-close { margin-top: clamp(72px, 10vw, 120px); background: var(--deep); }
  .lp-close-inner {
    max-width: 1120px; margin: 0 auto; padding: clamp(64px, 8vw, 96px) 32px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 18px;
  }
  .lp-close h2 { font-size: clamp(28px, 3.6vw, 42px); font-weight: 600; line-height: 1.1; letter-spacing: -0.03em; color: var(--deep-ink); max-width: 18ch; }
  .lp-close p { font-size: 16px; line-height: 1.55; color: var(--deep-muted); max-width: 52ch; }
  .lp-close .btn-primary { background: var(--canvas); color: var(--deep); }
  .lp-close .btn-primary:hover { background: #E8F0F9; }

  /* ── footer ──────────────────────────────────────────────────────────
     A real site footer rather than the single row this had as a one-page
     site. It is also the mobile navigation: the nav drops its section links
     under 640px, so these columns are how somebody on a phone reaches
     /features and /pricing. */
  .lp-footer { background: var(--deep); border-top: 1px solid var(--deep-line); }
  .lp-footer-inner {
    max-width: 1120px; margin: 0 auto; padding: clamp(44px, 6vw, 64px) 32px 40px;
  }
  .lp-footer-cols {
    display: grid; gap: 32px 24px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 760px) { .lp-footer-cols { grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)); } }
  .lp-footer-brand { display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-brand .lp-wordmark { color: var(--deep-ink); }
  .lp-footer-blurb { font-size: 13px; line-height: 1.55; color: var(--deep-muted); max-width: 30ch; }
  .lp-footer-h {
    font-family: var(--font-mono); font-size: 11px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase; color: var(--deep-muted);
    opacity: 0.75; margin-bottom: 12px;
  }
  .lp-footer-col { display: flex; flex-direction: column; gap: 9px; }
  .lp-footer-col a { font-size: 13.5px; color: var(--deep-muted); text-decoration: none; transition: color var(--dur-state) var(--ease-std); }
  .lp-footer-col a:hover { color: var(--deep-ink); }
  .lp-footer-legal {
    margin-top: clamp(36px, 5vw, 52px); padding-top: 20px;
    border-top: 1px solid var(--deep-line);
    display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center;
    font-size: 12.5px; color: var(--deep-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal { transition: none; }
  }
`;

// ── primitives ───────────────────────────────────────────────────────

/**
 * Scroll reveal — threshold 0.25 + once: it fires when you have committed to
 * looking at the element and never re-fires. Applied to section heads and
 * cards, never to body copy.
 */
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className="reveal" data-in={seen} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const CHECK = "M20 6L9 17l-5-5";
export const LOCK =
  "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4";
export const SHIELD = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
export const BELL = "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0";
export const MINUS = "M5 12h14";

/**
 * "Start setup" or "Resume setup", from the wizard's saved progress.
 *
 * ⚠ Shared so every page agrees. It lived in Landing and read localStorage
 * there; a second page reading it separately is how a visitor gets offered
 * "Start setup" on /pricing after being offered "Resume setup" on /.
 */
export function useStartLabel(): string {
  const [hasProgress, setHasProgress] = useState(false);
  useEffect(() => {
    try {
      const w = loadWizard();
      setHasProgress(Boolean(w.completed && (w.completed as string[]).length > 0));
    } catch {
      /* fresh visitor */
    }
  }, []);
  return hasProgress ? "Resume setup" : "Start setup";
}

/** The nav's hairline appears only once the page has moved. */
function useStuck(): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return stuck;
}

export type SitePage = "home" | "features" | "pricing";

// ⚠ Home is here as well as on the wordmark, deliberately (founder call,
// 2026-09-04). The wordmark IS a link to "/" and always has been, but on a
// secondary page nothing says so — a visitor two pages deep has no visible
// way back that reads as one. The redundancy is the point: the wordmark is
// branding that happens to be clickable, this is a labelled control.
const NAV_LINKS: { href: string; label: string; page: SitePage }[] = [
  { href: "/", label: "Home", page: "home" },
  { href: "/features", label: "Features", page: "features" },
  { href: "/pricing", label: "Pricing", page: "pricing" },
];

export function SiteNav({ active }: { active?: SitePage }) {
  const stuck = useStuck();
  const start = useStartLabel();
  return (
    <nav className="lp-nav" data-stuck={stuck}>
      <div className="lp-nav-inner">
        <a className="lp-wordmark" href="/">
          Occupella
        </a>
        <div className="lp-nav-right">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              className="btn btn-ghost lp-nav-sec"
              href={l.href}
              // The page you are on, announced rather than only shaded —
              // aria-current is what a screen reader uses to say "here".
              aria-current={active === l.page ? "page" : undefined}
            >
              {l.label}
            </a>
          ))}
          <a className="btn btn-ghost" href={APP_URL}>
            Sign in
          </a>
          <a
            className="btn btn-primary"
            href="/start"
            style={{ padding: "8px 16px", fontSize: 13.5 }}
          >
            {start}
          </a>
        </div>
      </div>
    </nav>
  );
}

/**
 * The closing call to action. Every page ends on one, and they end on the
 * SAME one — a visitor who reads the pricing table to the bottom and a
 * visitor who reads the features page to the bottom both arrive at the same
 * door, which is the only thing either page is for.
 */
export function CloseBand({
  title = "Set up in about ten minutes.",
  body = "Connect Buildium, watch it triage your first real work order, and decide from there.",
}: {
  title?: string;
  body?: string;
}) {
  const start = useStartLabel();
  return (
    <section className="lp-close">
      <div className="lp-close-inner">
        <Reveal>
          <h2>{title}</h2>
        </Reveal>
        <Reveal delay={60}>
          <p>{body}</p>
        </Reveal>
        <Reveal delay={120}>
          <a className="btn btn-primary" href="/start" style={{ padding: "13px 28px", fontSize: 15 }}>
            {start} →
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-cols">
          <div className="lp-footer-brand">
            <a className="lp-wordmark" href="/">
              Occupella
            </a>
            <p className="lp-footer-blurb">
              The work between a Buildium event and the reply — drafted, and waiting for your
              approval.
            </p>
          </div>

          <div>
            <div className="lp-footer-h">Product</div>
            {/* ⚠ Home is repeated here because the nav's section links are
                hidden under 640px — on a phone this column IS the navigation,
                so dropping it would leave the wordmark as the only way back. */}
            <div className="lp-footer-col">
              <a href="/">Home</a>
              <a href="/features">Features</a>
              <a href="/pricing">Pricing</a>
              <a href="/start">Start setup</a>
              <a href={APP_URL}>Sign in</a>
            </div>
          </div>

          <div>
            <div className="lp-footer-h">Legal</div>
            <div className="lp-footer-col">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/sms">SMS program</a>
            </div>
          </div>

          <div>
            <div className="lp-footer-h">Contact</div>
            <div className="lp-footer-col">
              <a href="mailto:team@occupella.com">team@occupella.com</a>
            </div>
          </div>
        </div>

        <div className="lp-footer-legal">
          <span>© 2026 Oscar Ventures LLC</span>
          <span>Occupella is not affiliated with Buildium.</span>
        </div>
      </div>
    </footer>
  );
}

/**
 * A secondary page: nav, an opening, the page, the closing band, the footer.
 *
 * ⚠ The landing page does NOT use this — it composes `SiteNav` and
 * `SiteFooter` itself, because its hero is a different shape (rotating word,
 * tilting panel, proof strip) and forcing it through a shared shell would
 * mean parameterising the shell until it fits one caller.
 */
export function SitePageShell({
  active,
  eyebrow,
  title,
  lede,
  css,
  children,
  close,
}: {
  active: SitePage;
  eyebrow: string;
  title: string;
  lede: React.ReactNode;
  css?: string;
  children: React.ReactNode;
  close?: { title?: string; body?: string };
}) {
  return (
    <div className="lp">
      <style>{siteCss}</style>
      {css ? <style>{css}</style> : null}
      <SiteNav active={active} />
      <header className="lp-pagehead">
        <div className="lp-wrap">
          <div className="lp-eyebrow rise" style={{ "--d": "0ms" } as React.CSSProperties}>
            {eyebrow}
          </div>
          <h1 className="lp-h1-page rise" style={{ "--d": "120ms" } as React.CSSProperties}>
            {title}
          </h1>
          <p className="lp-lede rise" style={{ "--d": "240ms" } as React.CSSProperties}>
            {lede}
          </p>
        </div>
      </header>
      {children}
      <CloseBand title={close?.title} body={close?.body} />
      <SiteFooter />
    </div>
  );
}
