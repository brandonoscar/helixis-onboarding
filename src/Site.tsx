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
     (/start) and the OAuth popup keep the app's own fonts and tokens untouched.
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
  .lp-nav-right .btn-primary { height: 36px; padding: 0 16px; font-size: 14px; margin-left: 8px; }

  /* ── the menu: dropdowns at desktop ── */
  .lp-menu { display: flex; align-items: center; gap: 2px; list-style: none; margin: 0 auto 0 32px; padding: 0; }
  .lp-menu-item { position: relative; }
  .lp .lp-menu-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 40px; padding: 0 12px; border: 0; background: none; cursor: pointer;
    font: inherit; font-size: 15px; font-weight: 500; color: var(--ink-muted); text-decoration: none;
    border-radius: 6px;
  }
  .lp .lp-menu-btn:hover, .lp-menu-item[data-open="true"] > .lp-menu-btn { color: var(--ink); }
  .lp .lp-menu-btn[aria-current="page"] { color: var(--ink); font-weight: 600; }
  .lp .lp-menu-btn:focus-visible { outline: 2px solid var(--iris); outline-offset: 2px; }
  .lp-menu-btn svg { transition: transform var(--dur-state) var(--ease-std); }
  .lp-menu-item[data-open="true"] .lp-menu-btn svg { transform: rotate(180deg); }
  .lp-menu-panel {
    position: absolute; top: 100%; left: -8px; padding-top: 8px; z-index: 30;
    visibility: hidden; opacity: 0; transform: translateY(-4px);
    transition: opacity 120ms var(--ease-std), transform 120ms var(--ease-std), visibility 0s linear 120ms;
  }
  .lp-menu-item[data-open="true"] > .lp-menu-panel {
    visibility: visible; opacity: 1; transform: none;
    transition: opacity 120ms var(--ease-std), transform 120ms var(--ease-std);
  }
  .lp-menu-panel ul {
    list-style: none; margin: 0; padding: 8px; min-width: 300px;
    background: var(--canvas); border: 1px solid var(--line); border-radius: 8px;
    box-shadow: 0 18px 40px -18px rgba(14, 22, 32, 0.28);
  }
  .lp .lp-menu-panel a { display: block; padding: 10px 12px; border-radius: 6px; text-decoration: none; }
  .lp .lp-menu-panel a:hover, .lp .lp-menu-panel a:focus-visible { background: var(--band); outline: none; }
  .lp-menu-l { display: block; font-size: 15px; font-weight: 600; color: var(--ink); }
  .lp-menu-n { display: block; margin-top: 2px; font-size: 14px; color: var(--ink-muted); }

  /* ── the drawer: every link, full screen, below 960px ── */
  .lp .lp-menu-toggle {
    display: none; height: 36px; padding: 0 12px; margin-left: 8px;
    border: 1px solid var(--line-strong); border-radius: 6px; background: var(--canvas);
    font: inherit; font-size: 14px; font-weight: 600; color: var(--ink); cursor: pointer;
  }
  .lp-drawer {
    position: fixed; inset: 0; z-index: 50; background: var(--canvas);
    display: none; flex-direction: column; overflow-y: auto;
  }
  .lp-drawer[data-open="true"] { display: flex; }
  .lp-drawer-top { height: 64px; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid var(--line); }
  .lp-drawer .lp-menu-toggle { display: inline-flex; align-items: center; }
  .lp-drawer-body { padding: 8px 20px 32px; display: flex; flex-direction: column; }
  .lp-drawer-group { display: flex; flex-direction: column; padding: 16px 0; border-bottom: 1px solid var(--line); }
  .lp-drawer-h { font-size: 14px; font-weight: 600; color: var(--ink-muted); margin-bottom: 4px; }
  .lp .lp-drawer-group a { padding: 10px 0; font-size: 18px; font-weight: 500; color: var(--ink); text-decoration: none; }
  .lp .lp-drawer-cta { margin-top: 24px; height: 48px; font-size: 16px; }

  @media (max-width: 959px) {
    .lp-menu { display: none; }
    .lp .lp-menu-toggle { display: inline-flex; align-items: center; }
  }
  @media (max-width: 640px) {
    .lp-nav-inner { padding: 0 20px; }
    .lp-nav-signin { display: none; }
    .lp-nav-right .btn-primary { margin-left: 0; }
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

  /* ── video: a plain container. The recordings carry their own window
     chrome, so the page adds none: no fake browser bar, no tilt, no glow.
     width/height on the <video> plus aspect-ratio reserve the box before a
     byte arrives, so nothing jumps when the poster lands. */
  .lp-video { margin: 0; }
  .lp-video-box {
    border: 1px solid var(--line); border-radius: 8px; overflow: hidden;
    background: var(--canvas-1);
    box-shadow: 0 18px 44px -24px rgba(14, 22, 32, 0.30);
  }
  .lp-video video { display: block; width: 100%; height: auto; }
  .lp-caption { margin-top: 14px; font-size: 15px; color: var(--ink-muted); }

  .rise { opacity: 0; transform: translateY(-10px); animation: rise var(--dur-entrance) var(--ease-out) var(--d, 0ms) forwards; }
  @keyframes rise { to { opacity: 1; transform: none; } }

  /* ── scroll reveals: headers + cards only, 12px, once ── */
  .reveal { opacity: 0; transform: translateY(12px); transition: opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out); }
  .reveal[data-in="true"] { opacity: 1; transform: none; }

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
  @media (min-width: 760px) { .lp-footer-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1100px) { .lp-footer-cols { grid-template-columns: 1.4fr repeat(5, minmax(0, 1fr)); } }
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
 * A product video: muted, looping, with a poster and a caption.
 *
 * ⚠ ONE definition, used by the landing hero and by /features. Two copies of
 * an autoplay path drift, and the ways this one fails are all silent:
 *
 * 1. React does NOT render a `muted` ATTRIBUTE. It assigns `muted` as a DOM
 *    property, in prop order, so the browser can evaluate `autoplay` against
 *    an element that is not yet muted, apply its block-audible-autoplay rule,
 *    and refuse, with no error, no log, just a still frame. `start()` sets
 *    both the property and the attribute from a ref.
 * 2. `play()` returns a promise that REJECTS when the browser declines.
 *    Unhandled, that is a console error on a marketing page.
 * 3. Safari will not autoplay an element that is off screen, and on /features
 *    this one is below the fold. So it is started again the moment it
 *    intersects; play() on something already playing is a no-op.
 *
 * `preload="metadata"` with a poster: the first thing a visitor sees is the
 * poster, and the bytes of a video below the fold are not spent until it is
 * near. `width`/`height` are the video's INTRINSIC size.
 */
export function DemoPanel({
  src,
  poster,
  caption,
  width,
  height,
  controls = false,
}: {
  src: string;
  poster: string;
  caption: string;
  width: number;
  height: number;
  /**
   * ⚠ Per video, and it turns on AUDIO REACH, not playback control. Default
   * OFF: a silent screen capture on a marketing page is a moving picture.
   * A video with a NARRATION TRACK has to set it true. Without controls there
   * is no unmute button, and muted autoplay is the only kind a browser allows,
   * so a narrated video with controls off is one nobody can ever hear.
   */
  controls?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const start = () => {
      const v = video.current;
      if (!v) return;
      v.muted = true;
      v.setAttribute("muted", "");
      void v.play().catch(() => {
        /* Declined by policy. The poster stays up, which is the point of
           having one. */
      });
    };
    start();

    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
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
    <figure className="lp-video">
      <div className="lp-video-box" ref={box} style={{ aspectRatio: `${width} / ${height}` }}>
        <video
          ref={video}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          controls={controls}
          preload="metadata"
          width={width}
          height={height}
        />
      </div>
      <figcaption className="lp-caption">{caption}</figcaption>
    </figure>
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

export type SitePage = "home" | "features" | "pricing" | "solutions" | "resources";

type MenuItem = { href: string; label: string; note?: string };
type MenuGroup = { key: string; label: string; page: SitePage; items: MenuItem[] };

/**
 * The site menu, and (with FOOTER_EXTRA) everything the footer links to.
 *
 * ⚠ EVERY HREF HERE MUST RESOLVE. nav.test.tsx checks each one against
 * MARKETING_ROUTES, and each #anchor against an id the page renders, so a
 * renamed section or a page that is not built yet fails the build instead
 * of sending a visitor to the 404 page. A page that is planned and not built
 * is left out until it exists.
 *
 * ⚠ The Product anchors are the /features section ids. The labels are those
 * sections' headings, so a click lands where the menu said it would.
 */
export const MENU: MenuGroup[] = [
  {
    key: "product",
    label: "Product",
    page: "features",
    items: [
      { href: "/features#the-loop", label: "How an event is handled" },
      { href: "/features#ask-it-anything", label: "Reports from your Buildium data" },
      { href: "/features#writing-back", label: "Changes it can make in Buildium" },
      { href: "/features#fair-housing", label: "Fair housing guardrails" },
      { href: "/features", label: "All features" },
    ],
  },
  {
    key: "solutions",
    label: "Solutions",
    page: "solutions",
    items: [
      { href: "/solutions/maintenance", label: "Maintenance", note: "From the report to the work order" },
      { href: "/solutions/delinquency", label: "Late rent", note: "Who owes what, and the follow-up" },
      { href: "/solutions/owner-reporting", label: "Owner reporting", note: "The numbers an owner asks for" },
      { href: "/solutions/leasing", label: "Leasing", note: "Every lead, from first message to lease" },
    ],
  },
  {
    key: "resources",
    label: "Resources",
    page: "resources",
    items: [
      { href: "/integrations", label: "Integrations", note: "What Occupella connects to" },
      { href: "/docs/buildium-api-setup", label: "Buildium setup guide", note: "Create the API key in two minutes" },
      { href: "/state-laws", label: "Landlord rules by state", note: "Deposits, late fees and notices" },
      { href: "/tools/deposit-deadline", label: "Deposit deadline calculator", note: "The day a deposit is due back" },
      { href: "/screenshots", label: "Screenshots", note: "What the app looks like" },
      { href: "/changelog", label: "Changelog", note: "What changed, newest first" },
    ],
  },
];

export const TOP_LINKS: { href: string; label: string; page: SitePage }[] = [
  { href: "/pricing", label: "Pricing", page: "pricing" },
];

/**
 * Desktop: dropdowns that open on hover and on click, close on Escape, on a
 * click outside and when focus leaves. Below 960px: one Menu button that
 * opens a full-screen drawer with every link.
 *
 * ⚠ The panels are ALWAYS in the HTML and only hidden by CSS. The prerendered
 * page is what a crawler reads, and a menu that only exists after a click is
 * a menu of links no search engine follows.
 */
export function SiteNav({ active }: { active?: SitePage }) {
  const start = useStartLabel();
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drawer) {
        setDrawer(false);
        menuBtnRef.current?.focus();
      } else if (open) {
        const btn = navRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${open}"]`);
        setOpen(null);
        btn?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, drawer]);

  // The drawer is modal: the page behind it does not scroll, focus starts on
  // its first link and Tab stays inside it until it closes.
  useEffect(() => {
    if (!drawer) return;
    const el = drawerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>("a[href], button") ?? []);
    focusables()[0]?.focus();
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onTab);
    };
  }, [drawer]);

  return (
    <nav className="lp-nav" ref={navRef} aria-label="Main">
      <div className="lp-nav-inner">
        <Wordmark />
        <ul className="lp-menu">
          {MENU.map((g) => (
            <li
              key={g.key}
              className="lp-menu-item"
              data-open={open === g.key}
              onMouseEnter={() => setOpen(g.key)}
              onMouseLeave={() => setOpen((o) => (o === g.key ? null : o))}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen((o) => (o === g.key ? null : o));
              }}
            >
              <button
                type="button"
                className="lp-menu-btn"
                data-menu={g.key}
                aria-expanded={open === g.key}
                aria-controls={`menu-${g.key}`}
                aria-current={active === g.page ? "page" : undefined}
                // A mouse click always opens: the pointer got here by hovering,
                // which already opened the panel, and toggling would shut it
                // under the click. Enter and Space (detail 0) toggle.
                onClick={(e) => setOpen((o) => (e.detail === 0 && o === g.key ? null : g.key))}
              >
                {g.label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="lp-menu-panel" id={`menu-${g.key}`}>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.href}>
                      <a href={it.href} onClick={() => setOpen(null)}>
                        <span className="lp-menu-l">{it.label}</span>
                        {it.note ? <span className="lp-menu-n">{it.note}</span> : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
          {TOP_LINKS.map((l) => (
            <li key={l.href} className="lp-menu-item">
              <a className="lp-menu-btn" href={l.href} aria-current={active === l.page ? "page" : undefined}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="lp-nav-right">
          <a className="btn btn-ghost lp-nav-signin" href={APP_URL}>
            Sign in
          </a>
          {/* TODO(brandon): "Book a demo" (secondary button) goes here once
              there is a calendar link to point it at. */}
          <a className="btn btn-primary" href="/start">
            {start}
          </a>
          <button
            type="button"
            className="lp-menu-toggle"
            ref={menuBtnRef}
            aria-expanded={drawer}
            aria-controls="site-drawer"
            onClick={() => setDrawer(true)}
          >
            Menu
          </button>
        </div>
      </div>

      <div
        className="lp-drawer"
        id="site-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        data-open={drawer}
      >
        <div className="lp-drawer-top">
          <Wordmark />
          <button
            type="button"
            className="lp-menu-toggle"
            onClick={() => {
              setDrawer(false);
              menuBtnRef.current?.focus();
            }}
          >
            Close
          </button>
        </div>
        <div className="lp-drawer-body">
          {MENU.map((g) => (
            <div className="lp-drawer-group" key={g.key}>
              <div className="lp-drawer-h">{g.label}</div>
              {g.items.map((it) => (
                <a key={it.href} href={it.href} onClick={() => setDrawer(false)}>
                  {it.label}
                </a>
              ))}
            </div>
          ))}
          <div className="lp-drawer-group">
            {TOP_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setDrawer(false)}>
                {l.label}
              </a>
            ))}
            <a href={APP_URL}>Sign in</a>
          </div>
          <a className="btn btn-primary lp-drawer-cta" href="/start">
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

function FooterCol({ title, links }: { title: string; links: MenuItem[] }) {
  return (
    <div>
      <div className="lp-footer-h">{title}</div>
      <div className="lp-footer-col">
        {links.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/** Every link the footer carries, for nav.test.tsx. */
export const FOOTER_EXTRA: string[] = [
  "/",
  "/features",
  "/pricing",
  "/terms",
  "/privacy",
  "/sms",
  "/contact",
  "/security",
  "/security#subprocessors",
  "/integrations/buildium",
];

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

          {/* ⚠ Home is here because the menu has no Home item: on a phone
              this column and the wordmark are the way back. */}
          <FooterCol
            title="Product"
            links={[
              { href: "/", label: "Home" },
              { href: "/features", label: "Features" },
              { href: "/pricing", label: "Pricing" },
              { href: "/integrations/buildium", label: "Occupella for Buildium" },
              { href: "/start", label: "Start free trial" },
              { href: APP_URL, label: "Sign in" },
            ]}
          />
          <FooterCol title="Solutions" links={MENU.find((g) => g.key === "solutions")!.items} />
          <FooterCol title="Resources" links={MENU.find((g) => g.key === "resources")!.items} />
          <FooterCol
            title="Company"
            links={[
              { href: "/contact", label: "Contact" },
              { href: "/security", label: "Security" },
              { href: "mailto:team@occupella.com", label: "team@occupella.com" },
            ]}
          />

          <div>
            <div className="lp-footer-h">Legal</div>
            <div className="lp-footer-col">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/sms">SMS program</a>
              <a href="/security#subprocessors">Subprocessors</a>
              <TrackingOptOut />
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
