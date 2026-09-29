import { useEffect, useRef, useState } from "react";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/ibm-plex-sans";
import { TrackingOptOut } from "./ConsentBar";
import { APP_URL } from "./lib/api";

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
  /* ── marketing tokens ────────────────────────────────────────────────
     Scoped to .lp, the root of every marketing page, so the setup wizard
     (/start) and the OAuth popup keep Geist and the app's tokens untouched.
     Redefining the shared names (--iris, --line, --font-sans) here rather
     than inventing new ones is what lets theme.ts's .btn and every page's
     existing rules pick the marketing values up without a second copy.

     One chromatic colour, #1957A0, for primary buttons, links, the typed
     word in the hero and the closing band. The app's #1E73BC/#2A80CC read
     light next to the Fraunces headings. */
  .lp {
    --iris: #1957A0;
    --iris-hover: #144A8A;
    --iris-press: #0F3B70;
    --iris-soft: rgba(25, 87, 160, 0.10);
    --iris-ring: rgba(25, 87, 160, 0.35);
    --band: #E3EDF9;
    --line: #DCE3EC;
    --line-strong: #C5D0DD;
    --card-edge: #DCE3EC;
    --foot: #F6F8FB;
    --font-display: 'Fraunces Variable', Georgia, 'Times New Roman', serif;
    --font-sans: 'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --dur-reveal: 200ms;
    --dur-entrance: 200ms;

    position: relative; overflow-x: clip;
    background: var(--canvas);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 17px;
    line-height: 1.6;
    font-variant-numeric: normal;
  }
  .lp-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
  @media (max-width: 640px) { .lp-wrap { padding: 0 20px; } }

  .lp a { color: var(--iris); }
  .lp a:hover { color: var(--iris-hover); }

  /* ── buttons: primary, secondary, text link. 6px radius, no shadow ── */
  .lp .btn { font-family: var(--font-sans); font-weight: 600; border-radius: 6px; box-shadow: none; }
  .lp .btn:focus-visible { box-shadow: 0 0 0 3px var(--iris-ring); }
  .lp .btn-primary, .lp .btn-primary:hover { color: #fff; }
  .lp .btn-secondary { background: var(--canvas); border-color: var(--line-strong); color: var(--ink); }
  .lp .btn-secondary:hover:not(:disabled) { background: var(--canvas); border-color: var(--ink-subtle); color: var(--ink); }
  .lp .btn-ghost { color: var(--ink-muted); font-weight: 500; }
  .lp .btn-ghost:hover { color: var(--ink); background: transparent; }

  /* ── type scale: Fraunces for H1 and H2, IBM Plex Sans for the rest ── */
  .lp-h1-page, .lp-h2 {
    font-family: var(--font-display);
    font-optical-sizing: auto;
    font-weight: 560;
    color: var(--ink);
    text-wrap: balance;
  }
  .lp-h1-page {
    font-size: clamp(40px, 5.6vw, 64px);
    line-height: 1.04;
    letter-spacing: -0.02em;
    max-width: 16ch;
  }
  .lp-h2 {
    font-size: clamp(30px, 3.6vw, 44px);
    line-height: 1.1;
    letter-spacing: -0.015em;
    max-width: 22ch;
  }

  /* Kept only while Landing.tsx and Features.tsx still render it; both
     lose their labels in this redesign, and then this rule goes. */
  .lp-eyebrow {
    font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; color: var(--ink-subtle);
  }

  .lp-lede {
    font-size: 19px;
    line-height: 1.55;
    color: var(--ink-muted);
    max-width: 58ch;
  }

  .lp-body { font-size: 17px; line-height: 1.6; color: var(--ink-muted); max-width: 62ch; }

  .lp-sr {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* ── header: solid white, one hairline, fixed height ────────────────
     It used to be a translucent blue tint with a backdrop blur, and the
     copy scrolling under it showed through. */
  .lp-nav {
    position: sticky; top: 0; z-index: 20;
    height: 64px;
    display: flex; align-items: center;
    background: var(--canvas);
    border-bottom: 1px solid var(--line);
  }
  .lp-nav-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 32px; width: 100%;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .lp .lp-wordmark {
    font-family: var(--font-display);
    font-optical-sizing: auto;
    font-size: 25px; font-weight: 600; letter-spacing: -0.015em; line-height: 1;
    color: var(--ink); text-decoration: none;
  }
  .lp .lp-wordmark:hover { color: var(--ink); }
  .lp-nav-right { display: flex; align-items: center; gap: 4px; }
  .lp-nav-right .btn-ghost { font-size: 15px; padding: 8px 12px; }
  .lp-nav-right .btn-ghost[aria-current="page"] { color: var(--ink); font-weight: 600; }
  .lp-nav-right .btn-primary { height: 36px; padding: 0 16px; font-size: 14px; margin-left: 8px; }

  /* Below ~640px the section links go and the nav keeps the two things a
     visitor on a phone needs: sign in, and start. /features and /pricing are
     in the footer of every page. */
  @media (max-width: 640px) {
    .lp-nav-inner { padding: 0 20px; }
    .lp-nav-sec { display: none; }
    .lp-nav-right .btn-ghost { padding: 8px 8px; }
  }

  /* ── sections: more space between them than inside them ── */
  .lp-section { padding: clamp(80px, 10vw, 128px) 0 0; }
  .lp-section-head { display: flex; flex-direction: column; gap: 16px; }

  /* A secondary page's opening. Shorter than the landing hero on purpose:
     somebody who clicked "Pricing" has already been sold the idea and wants
     the number, not another pitch. */
  .lp-pagehead { padding: clamp(56px, 7vw, 96px) 0 0; }
  .lp-pagehead .lp-lede { margin-top: 22px; }

  .lp .lp-textlink {
    font-size: 16px; font-weight: 600; color: var(--iris);
    text-decoration: none; transition: color var(--dur-state) var(--ease-std);
  }
  .lp .lp-textlink:hover { color: var(--iris-hover); }
  .lp-note { font-size: 15px; color: var(--ink-muted); }

  /* ── the entrance: elements settle DOWN into place ── */
  /* ── product panel ──────────────────────────────────────────────
     Moved out of Landing.tsx when /features gained a video: DemoPanel
     is shared, so its styles have to be too. A second copy would drift,
     and the drift is invisible until somebody opens the other page. */
  .lp-stage { position: relative; perspective: 2000px; margin-top: clamp(40px, 6vw, 72px); }
  .lp-stage::before {
    content: ""; position: absolute; inset: 12% 8% 28%;
    background: radial-gradient(ellipse at 50% 40%, var(--iris) 0%, transparent 68%);
    filter: blur(120px); opacity: 0; z-index: 0;
    animation: glow 4100ms 600ms ease-out forwards;
  }
  @keyframes glow {
    0%   { opacity: 0; animation-timing-function: cubic-bezier(0.74, 0.25, 0.76, 1); }
    10%  { opacity: 0.5; animation-timing-function: cubic-bezier(0.12, 0.01, 0.08, 0.99); }
    100% { opacity: 0.16; }
  }
  .lp-panel {
    position: relative; z-index: 1;
    border-radius: var(--r-panel);
    border: 1px solid var(--card-edge);
    background: var(--canvas);
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(14,22,32,0.04), 0 24px 64px -28px rgba(14,22,32,0.28);
    transform: rotateX(22deg);
  }
  .lp-panel[data-in="true"] { animation: tilt 1400ms var(--ease-out) forwards; }
  /* Hold at the tilt, dip, then land flat — the hold is what makes it read
     mechanical rather than floaty. */
  @keyframes tilt {
    0%   { transform: rotateX(22deg); }
    25%  { transform: rotateX(22deg) scale(0.94); }
    60%  { transform: none; }
    100% { transform: none; }
  }
  .lp-panel img { display: block; width: 100%; height: auto; }
  .lp-panel-bar {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 14px; border-bottom: 1px solid var(--line); background: var(--canvas-1);
  }
  .lp-panel-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line-strong); }
  .lp-panel-url {
    margin-left: 8px; font-family: var(--font-mono); font-size: 11.5px; color: var(--ink-faint);
  }
  .lp-caption { margin-top: 14px; font-size: 13px; color: var(--ink-subtle); text-align: center; }

  .lp-panel video { display: block; width: 100%; height: auto; background: var(--canvas-1); }

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

  /* ── closing band: the page's one full-width brand colour ── */
  .lp-close { margin-top: clamp(96px, 12vw, 144px); background: var(--iris); }
  .lp-close-inner {
    max-width: 1200px; margin: 0 auto; padding: clamp(64px, 8vw, 96px) 32px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 20px;
  }
  .lp-close h2 {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: clamp(30px, 3.6vw, 44px); font-weight: 560; line-height: 1.1;
    letter-spacing: -0.015em; color: #fff; max-width: 20ch; text-wrap: balance;
  }
  .lp-close p { font-size: 18px; line-height: 1.55; color: #DCE7F4; max-width: 52ch; }
  .lp .lp-close .btn-primary { background: #fff; color: var(--iris); height: 48px; padding: 0 24px; font-size: 16px; }
  .lp .lp-close .btn-primary:hover { background: var(--band); color: var(--iris-press); }
  .lp .lp-close .btn:focus-visible { box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.6); }

  /* ── footer: light, a top border, headings in normal case ───────────
     It is also the mobile navigation: the nav drops its section links
     under 640px, so these columns are how somebody on a phone reaches
     /features and /pricing. */
  .lp-footer { background: var(--foot); border-top: 1px solid var(--line); }
  .lp-footer-inner {
    max-width: 1200px; margin: 0 auto; padding: clamp(48px, 6vw, 72px) 32px 40px;
  }
  .lp-footer-cols {
    display: grid; gap: 32px 24px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 760px) { .lp-footer-cols { grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)); } }
  .lp-footer-brand { display: flex; flex-direction: column; gap: 12px; }
  .lp-footer-blurb { font-size: 15px; line-height: 1.55; color: var(--ink-muted); max-width: 30ch; }
  .lp-footer-h { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 12px; }
  .lp-footer-col { display: flex; flex-direction: column; gap: 10px; }
  .lp .lp-footer-col a { font-size: 15px; color: var(--ink-muted); text-decoration: none; }
  .lp .lp-footer-col a:hover { color: var(--ink); }
  /* The tracking opt-out sits in the Legal column and has to read as one of
     its links, but it is a button: it changes a stored preference rather
     than navigating, and an <a> with no href is not reachable by keyboard. */
  .lp-optout {
    font: inherit; font-size: 15px; text-align: left;
    background: none; border: 0; padding: 0; cursor: pointer;
    color: var(--ink-muted);
  }
  .lp-optout:hover { color: var(--ink); }
  .lp-optout:focus-visible { outline: 2px solid var(--iris); outline-offset: 2px; border-radius: 2px; }
  .lp-optout-done { font-size: 15px; color: var(--ink-muted); }
  .lp-footer-legal {
    margin-top: clamp(36px, 5vw, 52px); padding-top: 20px;
    border-top: 1px solid var(--line);
    display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: center;
    font-size: 14px; color: var(--ink-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-panel { transform: none !important; animation: none !important; }
    .lp-stage::before { opacity: 0.16 !important; animation: none !important; }
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

/**
 * A video in the product panel — browser chrome, the tilt, a caption under it.
 *
 * ⚠ ONE definition, used by the landing hero and by /features. Two copies of
 * an autoplay path drift, and the ways this one fails are all silent:
 *
 * 1. React does NOT render a `muted` ATTRIBUTE. It assigns `muted` as a DOM
 *    property, in prop order, so the browser can evaluate `autoplay` against
 *    an element that is not yet muted, apply its block-audible-autoplay rule,
 *    and refuse — with no error, no log, just a still frame. `start()` sets
 *    both the property and the attribute from a ref.
 * 2. `play()` returns a promise that REJECTS when the browser declines.
 *    Unhandled, that is a console error on a marketing page.
 * 3. Safari will not autoplay an element that is off screen, and on /features
 *    this one is below the fold by construction. So it is started again the
 *    moment it intersects; play() on something already playing is a no-op.
 *
 * ⚠ MUTED is the price of autoplay, not a style choice. `controls` is
 * therefore the only way a viewer can ever hear a narration track, which is
 * why it is a per-video prop rather than a constant — see the prop's note.
 *
 * `width`/`height` are the video's INTRINSIC size. They reserve the right box
 * before a byte arrives, so the page does not jump when the poster frame
 * lands.
 */
export function DemoPanel({
  src,
  caption,
  width,
  height,
  url = "app.occupella.com",
  controls = false,
}: {
  src: string;
  caption: string;
  width: number;
  height: number;
  url?: string;
  /**
   * ⚠ Per video, and it turns on AUDIO REACH, not playback control. Default
   * OFF: a silent screen capture on a marketing page is a moving picture, and
   * a scrub bar under it invites somebody to pause the thing that is selling
   * them the product.
   *
   * A video with a NARRATION TRACK has to set it true. Without controls there
   * is no unmute button, and muted autoplay is the only kind a browser allows
   * — so a narrated video with controls off is one nobody can ever hear.
   */
  controls?: boolean;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [tilted, setTilted] = useState(false);

  useEffect(() => {
    const start = () => {
      const v = video.current;
      if (!v) return;
      v.muted = true;
      v.setAttribute("muted", "");
      void v.play().catch(() => {
        /* Declined by policy. Nothing to do about it — and with controls
           off there is not even a play button, which is the trade this
           default accepts: a still frame beats a scrub bar. */
      });
    };
    start();

    const el = stage.current;
    if (!el || typeof IntersectionObserver === "undefined") return setTilted(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTilted(true);
          start();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp-stage" ref={stage}>
      <div className="lp-panel" data-in={tilted}>
        <div className="lp-panel-bar">
          <span className="lp-panel-dot" />
          <span className="lp-panel-dot" />
          <span className="lp-panel-dot" />
          <span className="lp-panel-url">{url}</span>
        </div>
        <video
          ref={video}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          controls={controls}
          preload="auto"
          width={width}
          height={height}
        />
      </div>
      <div className="lp-caption">{caption}</div>
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
 * Always "Start free trial", on marketing pages only. The wizard's own
 * buttons keep their labels.
 *
 * ⚠ **"Resume setup" was removed, not broken** (founder call, 2026-09-09).
 * It read the wizard's persisted `completed` set and promised a saved draft;
 * what the click actually produced depended on the live Supabase session
 * underneath, so a visitor offered "Resume setup" could land in the app
 * instead of in the wizard. Two different states behind one label is worse
 * than no label — and setup is five minutes long, so there is little to
 * resume. Progress is no longer persisted at all (see `lib/persist.ts`).
 *
 * Kept as a hook rather than inlining the string: three pages render this
 * button, and a shared source is what stopped them disagreeing in the first
 * place. Someone re-introducing a two-state label has one place to do it.
 */
export function useStartLabel(): string {
  return "Start free trial";
}

/**
 * The name, in one place: the header and the footer both render this.
 *
 * TODO(brandon): provide the lowercase Fraunces "occupella" SVG. Until then
 * this is live text set in Fraunces; swapping the SVG in is this one element.
 */
export function Wordmark() {
  return (
    <a className="lp-wordmark" href="/" aria-label="Occupella home">
      occupella
    </a>
  );
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
  const start = useStartLabel();
  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <Wordmark />
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
          <a className="btn btn-primary" href="/start">
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
          <a className="btn btn-primary" href="/start">
            {start}
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
            <Wordmark />
            {/* TODO(brandon): confirm autonomous notes flag is off. The old
                blurb ended "waiting for your approval", which is the approval
                claim; it comes back when the flag is confirmed off. */}
            <p className="lp-footer-blurb">
              An AI assistant for property managers who use Buildium.
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
              <a href="/start">Start free trial</a>
              <a href={APP_URL}>Sign in</a>
            </div>
          </div>

          <div>
            <div className="lp-footer-h">Legal</div>
            <div className="lp-footer-col">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/sms">SMS program</a>
              <TrackingOptOut />
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
  title,
  lede,
  css,
  children,
  close,
}: {
  active?: SitePage;
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
          <h1 className="lp-h1-page rise" style={{ "--d": "0ms" } as React.CSSProperties}>
            {title}
          </h1>
          <p className="lp-lede rise" style={{ "--d": "80ms" } as React.CSSProperties}>
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
