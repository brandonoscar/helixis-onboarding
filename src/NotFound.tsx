import { SitePageShell } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// The 404.
//
// ⚠ Before this existed, `route()` ended in `return <Landing />` — so every
// unknown path served the marketing home page at HTTP 200. That is a "soft
// 404", and it fails in two directions at once:
//
//   · A person who followed a stale or mistyped link lands on the front door
//     with no indication anything went wrong, and concludes the page they
//     wanted is gone rather than that they took a wrong turn.
//   · A crawler sees an unbounded number of distinct URLs all serving
//     identical content, which is the duplicate-content shape search engines
//     penalise. robots.txt and sitemap.xml (added the same day) tell a crawler
//     what SHOULD exist; this tells it what does not.
//
// ⚠ It cannot return a real 404 STATUS CODE. This is an SPA behind a Vercel
// rewrite that serves index.html for every path, so the status is 200 no
// matter what renders. Saying so here rather than leaving the next reader to
// discover it: fixing the status means a Vercel routing rule or a prerendered
// 404.html, not a change in this file.
//
// The page's job is therefore to be USEFUL, not apologetic: name what
// happened in one line and put the four places somebody was probably heading
// directly under it.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .nf-links {
    display: grid; gap: 10px; margin-top: 4px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 620px) { .nf-links { grid-template-columns: 1fr 1fr; } }
  .nf-link {
    display: block; padding: 18px 20px; border-radius: var(--r-md);
    border: 1px solid var(--line); background: var(--card);
    text-decoration: none; transition: border-color var(--dur-state) var(--ease-std);
  }
  .nf-link:hover { border-color: var(--line-strong); }
  .nf-link b { display: block; font-size: 15px; font-weight: 550; color: var(--ink); }
  .nf-link span { display: block; font-size: 13.5px; color: var(--muted); margin-top: 3px; }
`;

export default function NotFound() {
  return (
    <SitePageShell
      // No nav item is current — this page is not one of them, and marking
      // one would tell the visitor they are somewhere they are not.
      active={"home"}
      eyebrow="404"
      title="That page isn't here"
      lede={
        <>
          The link is either out of date or slightly off. Nothing is broken — here is
          everything this site has.
        </>
      }
      css={css}
      close={{
        title: "Still stuck?",
        body: "Email team@occupella.com and say what you were looking for.",
      }}
    >
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="nf-links">
            <a className="nf-link" href="/">
              <b>Home</b>
              <span>What Occupella does, in about a minute.</span>
            </a>
            <a className="nf-link" href="/features">
              <b>Features</b>
              <span>The full list, with the product tour.</span>
            </a>
            <a className="nf-link" href="/pricing">
              <b>Pricing</b>
              <span>Four plans and what separates them.</span>
            </a>
            <a className="nf-link" href="/start">
              <b>Start setup</b>
              <span>Connect Buildium and be running today.</span>
            </a>
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
