import { useEffect, useRef } from "react";

/**
 * The Helixis brand mark, rendered live: two strands of dots winding around
 * a vertical axis, rotating slowly. Depth (the z of each dot) drives size,
 * brightness, and hue — near dots read iris, far dots sink toward the deep
 * brand violet — so the rotation reads as genuinely three-dimensional.
 *
 * This is the ONE bold visual move on these surfaces; everything around it
 * stays quiet. Honors prefers-reduced-motion by drawing a single static frame.
 */
export default function Helix({
  width = 320,
  height = 420,
  dots = 26,
  speed = 0.35,
  className,
}: {
  width?: number;
  height?: number;
  dots?: number;
  speed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const amp = width * 0.3; // strand radius
    const turns = 2.2; // full twists over the visible height
    const pad = height * 0.06;
    const span = height - pad * 2;

    // near/far endpoints of the depth ramp
    const near = { r: 176, g: 162, b: 226 }; // lightened iris
    const far = { r: 60, g: 47, b: 110 }; // sunk toward #4C3B8F

    const drawFrame = (phase: number) => {
      ctx.clearRect(0, 0, width, height);

      type Dot = { x: number; y: number; z: number };
      const strandA: Dot[] = [];
      const strandB: Dot[] = [];

      for (let i = 0; i < dots; i++) {
        const t = i / (dots - 1);
        const y = pad + t * span;
        const angle = phase + t * turns * Math.PI * 2;
        strandA.push({ x: cx + Math.sin(angle) * amp, y, z: Math.cos(angle) });
        strandB.push({ x: cx + Math.sin(angle + Math.PI) * amp, y, z: Math.cos(angle + Math.PI) });
      }

      // rungs between the strands — every third pair, faint, behind the dots
      for (let i = 0; i < dots; i += 3) {
        const a = strandA[i];
        const b = strandB[i];
        const depth = (a.z + 1) / 2; // 0 far → 1 near (use A's depth for the pair)
        ctx.strokeStyle = `rgba(134, 118, 198, ${0.05 + depth * 0.12})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // far dots first so near dots paint over them
      const all = [...strandA, ...strandB].sort((p, q) => p.z - q.z);
      for (const d of all) {
        const depth = (d.z + 1) / 2;
        const r = Math.round(far.r + (near.r - far.r) * depth);
        const g = Math.round(far.g + (near.g - far.g) * depth);
        const b = Math.round(far.b + (near.b - far.b) * depth);
        const radius = 1.6 + depth * 2.6;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + depth * 0.65})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      drawFrame(0.8); // one considered still
      return;
    }

    let raf = 0;
    let last = performance.now();
    let phase = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      phase += dt * speed;
      drawFrame(phase);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [width, height, dots, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height, display: "block" }}
      aria-hidden="true"
    />
  );
}
