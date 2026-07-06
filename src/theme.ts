// Shared design tokens + primitives for every helixis-onboarding surface
// (landing page + setup wizard). Mirrors the product design system in
// AgenticHelixis/DESIGN.md: Geist type, iris #8676c6 accent used sparingly,
// violet-biased neutrals, 1px hairline borders instead of shadows/glows,
// graduated radius, muted semantic colors. Values here should track
// frontend/src/styles/globals.css in the authority repo.

export const tokensCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* canvas ramp — near-black with a faint violet bias (chosen, not slate) */
    --canvas:    #0a0910;
    --canvas-1:  #100e17;
    --canvas-2:  #16141f;
    --canvas-3:  #1c1a27;

    /* ink */
    --ink:        #ecebf4;
    --ink-muted:  #9a97ad;
    --ink-subtle: #5d5a70;

    /* hairlines */
    --line:        rgba(236, 235, 244, 0.07);
    --line-strong: rgba(236, 235, 244, 0.14);

    /* accent — desaturated iris in the hue of the brand mark #4C3B8F */
    --iris:       #8676c6;
    --iris-hover: #958ad2;
    --iris-press: #776ab3;
    --iris-soft:  rgba(134, 118, 198, 0.13);
    --iris-ring:  rgba(134, 118, 198, 0.35);
    --brand-deep: #4c3b8f;

    /* semantic — muted, only for real state */
    --positive:      #6fbf8f;
    --positive-soft: rgba(111, 191, 143, 0.11);
    --caution:       #c9a35f;
    --caution-soft:  rgba(201, 163, 95, 0.11);
    --danger:        #c96f6f;
    --danger-soft:   rgba(201, 111, 111, 0.11);

    /* radius — graduated */
    --r-xs: 4px;
    --r-sm: 6px;
    --r-md: 8px;
    --r-lg: 12px;
    --r-pill: 9999px;

    --font-sans: 'Geist Variable', 'Geist', Inter, system-ui, sans-serif;
    --font-mono: 'Geist Mono Variable', 'Geist Mono', 'JetBrains Mono', monospace;

    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--canvas);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    font-variant-numeric: tabular-nums;
  }

  ::selection { background: var(--iris-ring); }

  /* ── buttons ── */
  .btn {
    align-items: center;
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    display: inline-flex;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    gap: 8px;
    justify-content: center;
    outline: none;
    padding: 10px 20px;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }

  .btn:focus-visible { box-shadow: 0 0 0 3px var(--iris-ring); }

  .btn-primary { background: var(--iris); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--iris-hover); }
  .btn-primary:active:not(:disabled) { background: var(--iris-press); }

  .btn-secondary {
    background: var(--canvas-2);
    border-color: var(--line-strong);
    color: var(--ink);
  }
  .btn-secondary:hover:not(:disabled) { background: var(--canvas-3); }

  .btn-ghost { background: transparent; color: var(--ink-muted); padding: 8px 12px; font-size: 13px; }
  .btn-ghost:hover { color: var(--ink); background: var(--canvas-2); }

  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-row { display: flex; gap: 8px; }

  /* ── form ── */
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .field:last-child { margin-bottom: 0; }

  label {
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-muted);
    letter-spacing: 0.2px;
  }

  input, select {
    background: var(--canvas-2);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 14px;
    outline: none;
    padding: 10px 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    -webkit-appearance: none;
  }

  input:focus, select:focus {
    border-color: var(--iris);
    box-shadow: 0 0 0 3px var(--iris-soft);
  }

  input::placeholder { color: var(--ink-subtle); }

  input.secret-input { font-family: var(--font-mono); font-size: 13px; letter-spacing: 1px; }

  select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239a97ad' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    padding-right: 36px;
  }

  /* ── card ── */
  .card {
    background: var(--canvas-1);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    padding: 24px;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-muted);
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-family: var(--font-mono);
  }

  /* ── badge ── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--r-pill);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3px;
    border: 1px solid var(--line);
  }

  .badge-positive { background: var(--positive-soft); color: var(--positive); }
  .badge-danger   { background: var(--danger-soft);   color: var(--danger); }
  .badge-caution  { background: var(--caution-soft);  color: var(--caution); }
  .badge-iris     { background: var(--iris-soft);     color: var(--iris); }
  .badge-muted    { background: var(--canvas-2);      color: var(--ink-subtle); }

  .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .dot.pulse { animation: hx-pulse 2s infinite; }

  @keyframes hx-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── spinner ── */
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: hx-spin 0.6s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  .spinner.accent { border-color: var(--iris-soft); border-top-color: var(--iris); }

  @keyframes hx-spin { to { transform: rotate(360deg); } }

  /* ── misc ── */
  .hint { font-size: 12px; color: var(--ink-subtle); margin-top: 6px; line-height: 1.5; }
  .divider { height: 1px; background: var(--line); margin: 20px 0; }

  .mono { font-family: var(--font-mono); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    html { scroll-behavior: auto; }
  }
`;
