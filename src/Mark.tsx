import { useEffect, useState } from "react";

/**
 * The Occupella mark — a facade of units, a few of them lit.
 *
 * Replaces the retired Helixis mark (two winding strands of dots, a pun on
 * "helix"). The name is about OCCUPANCY, so the mark is the thing a property
 * manager actually looks at: a building's face at night, where the lit
 * windows are the units that are occupied — or the ones that need you.
 *
 * The motion is the whole point and is deliberately slow: one unit changes
 * state every couple of seconds, chosen at random, with a soft cross-fade.
 * A fixed loop would read as a CSS animation; a randomized one reads as a
 * system doing something. Honors prefers-reduced-motion with a static frame.
 */

const COLS = 4;
const ROWS = 5;
const CELLS = COLS * ROWS;

// The resting pattern — which units start lit. Hand-picked (not random) so
// the mark is stable across reloads and reads as a considered logotype.
const SEED = new Set([1, 4, 6, 11, 13, 18]);

export default function Mark({
  size = 22,
  className,
  animate = true,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const [lit, setLit] = useState<Set<number>>(() => new Set(SEED));

  useEffect(() => {
    if (!animate) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // static frame — the seed pattern
    }
    let timer: number;
    const tick = () => {
      setLit((prev) => {
        const next = new Set(prev);
        const i = Math.floor(Math.random() * CELLS);
        // Keep the lit count in a narrow band so the mark never goes dark
        // or fully lit — it should always read as "partly occupied".
        if (next.has(i) && next.size > 4) next.delete(i);
        else if (!next.has(i) && next.size < 9) next.add(i);
        return next;
      });
      // Randomized interval: a system, not a metronome.
      timer = window.setTimeout(tick, 1800 + Math.random() * 2200);
    };
    timer = window.setTimeout(tick, 2400);
    return () => window.clearTimeout(timer);
  }, [animate]);

  // Geometry: a 4×5 grid inside a 24×30 box, 1px gutters.
  const w = 24;
  const h = 30;
  const cell = 4.6;
  const gapX = (w - COLS * cell) / (COLS + 1);
  const gapY = (h - ROWS * cell) / (ROWS + 1);

  return (
    <svg
      width={size}
      height={(size * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: CELLS }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const on = lit.has(i);
        return (
          <rect
            key={i}
            x={gapX + col * (cell + gapX)}
            y={gapY + row * (cell + gapY)}
            width={cell}
            height={cell}
            rx={1.1}
            fill={on ? "var(--iris)" : "currentColor"}
            opacity={on ? 1 : 0.22}
            style={{ transition: "fill 600ms var(--ease-out), opacity 600ms var(--ease-out)" }}
          />
        );
      })}
    </svg>
  );
}
