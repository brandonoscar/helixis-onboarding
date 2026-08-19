// Shared design tokens + primitives for every Occupella surface (landing
// page + setup wizard). Mirrors the product's LIVE palette in
// AgenticHelixis/frontend/src/styles/globals.css — white canvas, blue
// accent #1E73BC, ink #0E1620, hairline borders, graduated radius,
// muted semantic color.
//
// 2026-08-19: these were the retired Helixis dark/violet tokens (#0a0910
// canvas, #8676c6 iris). The product moved to a light system; the marketing
// surface now matches it, so the screenshots on the landing page sit in the
// same world as the page around them. Track globals.css when it changes.

export const tokensCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* canvas ramp — pure white content, faint cool-blue raised surfaces */
    --canvas:    #FFFFFF;
    --canvas-1:  #F7FAFD;
    --canvas-2:  #F0F5FB;
    --canvas-3:  #E6EEF8;

    /* deep surface — the one dark band (matches the app's chrome ink) */
    --deep:      #101E31;
    --deep-1:    #17293F;
    --deep-ink:  #EAF1F9;
    --deep-muted:#9FB3CA;
    --deep-line: rgba(255, 255, 255, 0.10);

    /* ink */
    --ink:        #0E1620;
    --ink-muted:  #55606E;
    --ink-subtle: #6B7481;
    --ink-faint:  #98A1AE;

    /* hairlines — depth is carried by these, not by shadows */
    --line:        rgba(14, 22, 32, 0.10);
    --line-strong: rgba(14, 22, 32, 0.18);
    --card-edge:   rgba(14, 22, 32, 0.14);

    /* accent — the product's blue, the ONE chromatic accent on the page */
    --iris:       #1E73BC;
    --iris-hover: #2A80CC;
    --iris-press: #0B4F78;
    --iris-soft:  rgba(30, 115, 188, 0.10);
    --iris-ring:  rgba(30, 115, 188, 0.32);

    /* semantic — muted, only for real state */
    --positive:      #1D7A4C;
    --positive-soft: #E7F4EC;
    --caution:       #A8631A;
    --caution-soft:  #FAF0E1;
    --danger:        #B3261E;
    --danger-soft:   #F9E9E7;

    /* radius — graduated vocabulary: chips / controls / cards / panels */
    --r-xs: 4px;
    --r-sm: 6px;
    --r-md: 8px;
    --r-lg: 12px;
    --r-panel: 16px;
    --r-pill: 9999px;

    --font-sans: 'Geist Variable', 'Geist', Inter, system-ui, sans-serif;
    --font-mono: 'Geist Mono Variable', 'Geist Mono', 'JetBrains Mono', monospace;

    /* motion — expo-out for entrances/reveals, standard for state */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-std: cubic-bezier(0.2, 0, 0, 1);
    --dur-state: 150ms;
    --dur-reveal: 500ms;
    --dur-entrance: 900ms;
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
    background: var(--canvas);
    border-color: var(--card-edge);
    color: var(--ink);
  }
  .btn-secondary:hover:not(:disabled) { background: var(--canvas-2); }

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
    background: var(--canvas);
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
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2355606E' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
    padding-right: 36px;
  }

  /* ── card ── */
  .card {
    background: var(--canvas);
    border: 1px solid var(--card-edge);
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
  .badge-muted    { background: var(--canvas-2);      color: var(--ink-muted); }

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
    /* Reveals start at opacity:0 and are made visible BY their animation —
       suppressing the animation without this leaves the page blank. */
    .rise, .reveal { opacity: 1 !important; transform: none !important; }
  }
`;
