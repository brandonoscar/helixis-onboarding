/**
 * The hero stage: a walkthrough video, then four things Occupella can do that
 * a property manager cannot get from Buildium alone.
 *
 * ⚠ **Every slide declares its own aspect ratio, and that is load-bearing.**
 * The walkthrough is 1850x1080 (1.71) and the capability screenshots are
 * 1600x1510 (1.06) — nearly square, because each one photographs a whole chat
 * exchange rather than a window. One shared ratio would either letterbox the
 * video into a strip or pillarbox four screenshots down to two-thirds width.
 * So the viewport takes the ACTIVE slide's ratio, which also means the browser
 * reserves the right box before anything loads: no layout shift on first
 * paint, and no jump when an image finishes decoding.
 *
 * ⚠ **The video does not autoplay.** It is 9.5 MB and 66 seconds; starting it
 * unasked spends a minute of someone's data to say something the headline
 * already said. `preload="metadata"` fetches the first few KB so the duration
 * and first frame are there, and the visitor decides.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  /** Stable id, used for the tab/panel aria wiring. */
  id: string;
  /** The tab label. Short — it sits in a row of five. */
  label: string;
  /** One line under the panel saying what is being looked at. */
  caption: string;
  /** Intrinsic size. Drives both the aspect box and the img attributes. */
  width: number;
  height: number;
} & ({ kind: "video"; src: string } | { kind: "image"; src: string; alt: string });

/**
 * ⚠ The four screenshots are produced by `scripts/feature_shots.py` in the
 * AgenticHelixis repo and are all 1600x1510 by construction — that script lays
 * every capture on one shared canvas so the set reads as a set. If a shot is
 * ever replaced at a different size, change the numbers HERE too: they are
 * what stops the page reflowing while the image loads.
 */
export const SLIDES: Slide[] = [
  {
    id: "walkthrough",
    kind: "video",
    label: "Walkthrough",
    caption: "A minute of Occupella working a real Buildium account.",
    src: "/demo/walkthrough.mp4",
    width: 1850,
    height: 1080,
  },
  {
    id: "jurisdiction",
    kind: "image",
    label: "Deposit law",
    caption:
      "Asked when a deposit is legally due in Colorado — it answers with the deadline and the cap, not a link to go read.",
    src: "/demo/02-jurisdiction-lookup.png",
    alt: "Occupella answering when a Colorado security deposit must be returned after a move-out, with the statutory deadline and the cap on deductions",
    width: 1600,
    height: 1510,
  },
  {
    id: "fair-housing",
    kind: "image",
    label: "Fair housing",
    caption:
      "Asked about the families in a neighbourhood — it declines, names familial status, and does not offer a proxy instead.",
    src: "/demo/03-fair-housing-gate.png",
    alt: "Occupella declining a question about the family makeup around a property, naming familial status as a protected class",
    width: 1600,
    height: 1510,
  },
  {
    id: "hazards",
    kind: "image",
    label: "Flood & FMR",
    caption:
      "One question, two public datasets: the flood zone for the address and how the rent sits against HUD fair market rent.",
    src: "/demo/04-geocoding-hazards.png",
    alt: "Occupella reporting a property's flood zone alongside how its rent compares with the HUD fair market rent for the area",
    width: 1600,
    height: 1510,
  },
  {
    id: "radius",
    kind: "image",
    label: "Radius search",
    caption: "Which of your properties fall inside a radius — measured, not eyeballed off a list.",
    src: "/demo/05-radius-search.png",
    alt: "Occupella listing the properties within 150 miles of a Boston address, with each distance",
    width: 1600,
    height: 1510,
  },
];

export function FeatureSlideshow({ panelIn }: { panelIn: boolean }) {
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const go = useCallback((next: number) => {
    setActive((prev) => {
      const n = (next + SLIDES.length) % SLIDES.length;
      return n === prev ? prev : n;
    });
  }, []);

  // ⚠ Leaving the video slide PAUSES it. A visitor who clicks to the next
  // capability and then hears a voice still talking has no obvious way to stop
  // it — the control that would do it is off screen.
  useEffect(() => {
    const v = videoRef.current;
    if (v && SLIDES[active].kind !== "video" && !v.paused) v.pause();
  }, [active]);

  const onTabKey = (e: React.KeyboardEvent) => {
    // Arrow keys move between tabs — the pattern a tablist is expected to
    // follow, and the one a screen-reader user will try first.
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + SLIDES.length) % SLIDES.length;
    setActive(next);
    const el = tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next];
    el?.focus();
  };

  const slide = SLIDES[active];

  return (
    <div className="lp-show">
      <div className="lp-panel" data-in={panelIn}>
        <div className="lp-panel-bar">
          <span className="lp-panel-dot" />
          <span className="lp-panel-dot" />
          <span className="lp-panel-dot" />
          <span className="lp-panel-url">occupella.com</span>
        </div>

        <div
          className="lp-show-view"
          style={{ aspectRatio: `${slide.width} / ${slide.height}` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className="lp-show-slide"
              role="tabpanel"
              id={`slide-${s.id}`}
              aria-labelledby={`tab-${s.id}`}
              // ⚠ `hidden` rather than unmounting: the video element has to
              // survive a trip to another slide, or coming back restarts it
              // from zero and any buffering is thrown away.
              hidden={i !== active}
            >
              {s.kind === "video" ? (
                <video
                  ref={videoRef}
                  src={s.src}
                  controls
                  playsInline
                  preload="metadata"
                  width={s.width}
                  height={s.height}
                />
              ) : (
                <img
                  src={s.src}
                  alt={s.alt}
                  width={s.width}
                  height={s.height}
                  // The first slide is the video, so every image here is
                  // below-the-first-paint by definition.
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          ))}

          <button
            type="button"
            className="lp-show-arrow lp-show-prev"
            onClick={() => go(active - 1)}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            className="lp-show-arrow lp-show-next"
            onClick={() => go(active + 1)}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>

      <div
        className="lp-show-tabs"
        role="tablist"
        aria-label="What Occupella does"
        ref={tabsRef}
        onKeyDown={onTabKey}
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`tab-${s.id}`}
            aria-controls={`slide-${s.id}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className="lp-show-tab"
            onClick={() => setActive(i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="lp-caption">{slide.caption}</div>
    </div>
  );
}

export const slideshowCss = `
  .lp-show-view {
    position: relative;
    width: 100%;
    background: var(--canvas-1);
  }
  .lp-show-slide { position: absolute; inset: 0; }
  .lp-show-slide[hidden] { display: none; }
  /* ⚠ contain, not cover. A screenshot cropped to fill loses the top of the
     question or the bottom of the answer, which is the one thing a capability
     shot must not do. */
  .lp-show-slide img,
  .lp-show-slide video {
    display: block; width: 100%; height: 100%;
    object-fit: contain; background: var(--canvas-1);
  }

  .lp-show-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 38px; height: 38px; border-radius: 50%;
    display: grid; place-items: center;
    font-size: 22px; line-height: 1; color: var(--ink);
    border: 1px solid var(--line); background: var(--canvas);
    box-shadow: 0 1px 2px rgba(14,22,32,0.06), 0 8px 20px -12px rgba(14,22,32,0.3);
    cursor: pointer; opacity: 0; transition: opacity 160ms var(--ease-out);
  }
  /* ⚠ The arrows appear on hover or on keyboard focus. Focus is not optional:
     an arrow that only exists under a pointer is unreachable by keyboard, and
     the tabs below are then the only way through. */
  .lp-show:hover .lp-show-arrow,
  .lp-show-arrow:focus-visible { opacity: 1; }
  .lp-show-prev { left: 14px; }
  .lp-show-next { right: 14px; }

  .lp-show-tabs {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 6px;
    margin-top: 18px;
  }
  .lp-show-tab {
    padding: 7px 14px; border-radius: 999px;
    font-size: 13px; font-weight: 500; color: var(--ink-subtle);
    border: 1px solid transparent; background: transparent;
    cursor: pointer; transition: color 140ms var(--ease-out), background 140ms var(--ease-out);
  }
  .lp-show-tab:hover { color: var(--ink); }
  .lp-show-tab[aria-selected="true"] {
    color: var(--ink); background: var(--canvas-1); border-color: var(--line);
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-show-arrow { transition: none; opacity: 1; }
  }
`;
