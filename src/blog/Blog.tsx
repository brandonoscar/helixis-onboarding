import { SiteFooter, SiteNav, siteCss } from "../Site";
import { BLOG_INDEX, POSTS, formatDate, type Post } from "./posts";

// ─────────────────────────────────────────────────────────────────────
// /blog and /blog/<slug>.
//
// ⚠ NO CLOSING BAND. These pages compose SiteNav and SiteFooter themselves
// rather than using SitePageShell, because the shell always ends on the
// "Start free trial" band, and a post carries no pitch: the site's header,
// the article, the site's footer. Keep it that way when adding to it.
//
// The reading column is 720px, the same measure Legal.tsx uses for long
// documents.
// ─────────────────────────────────────────────────────────────────────

export const blogCss = `
  .bl-main { padding: clamp(48px, 6vw, 88px) 0 clamp(72px, 9vw, 120px); }
  .bl-col { max-width: 720px; }
  .bl-title {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: clamp(32px, 4.4vw, 48px); font-weight: 560; line-height: 1.1;
    letter-spacing: -0.015em; color: var(--ink); text-wrap: balance;
  }
  .bl-byline { margin-top: 16px; font-size: 15px; color: var(--ink-muted); }
  .bl-lede { margin-top: 18px; font-size: 19px; line-height: 1.55; color: var(--ink-muted); }

  .bl-list { margin-top: 40px; list-style: none; border-top: 1px solid var(--line); }
  .bl-item { padding: 24px 0; border-bottom: 1px solid var(--line); }
  .bl-item h2 {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: clamp(22px, 2.6vw, 26px); font-weight: 560; line-height: 1.25; letter-spacing: -0.01em;
  }
  .lp .bl-item h2 a { color: var(--ink); text-decoration: none; }
  .lp .bl-item h2 a:hover { color: var(--iris); }
  .bl-item time { display: block; margin-top: 6px; font-size: 15px; color: var(--ink-muted); }
  .bl-item p { margin-top: 10px; font-size: 17px; line-height: 1.6; color: var(--ink-muted); }

  /* ── the article body, rendered from Markdown ── */
  .bl-body { margin-top: 40px; font-size: 17px; line-height: 1.7; color: var(--ink); }
  .bl-body > * + * { margin-top: 20px; }
  .bl-body h2 {
    margin-top: 48px;
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: clamp(24px, 3vw, 30px); font-weight: 560; line-height: 1.2; letter-spacing: -0.01em;
  }
  .bl-body h3 { margin-top: 36px; font-size: 19px; font-weight: 600; line-height: 1.35; }
  .bl-body h2 + *, .bl-body h3 + * { margin-top: 14px; }
  .bl-body ul, .bl-body ol { padding-left: 26px; }
  .bl-body li + li { margin-top: 8px; }
  .bl-body li > ul, .bl-body li > ol { margin-top: 8px; }
  .lp .bl-body a { text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; }
  .bl-body strong { font-weight: 600; }
  .bl-body blockquote { padding-left: 16px; border-left: 3px solid var(--line-strong); color: var(--ink-muted); }
  .bl-body hr { border: 0; border-top: 1px solid var(--line); }
  .bl-body img { max-width: 100%; height: auto; border-radius: 8px; }
  .bl-body code {
    font-family: var(--font-mono); font-size: 0.86em;
    padding: 1px 5px; border: 1px solid var(--line); border-radius: 4px; background: var(--foot);
    overflow-wrap: anywhere;
    /* A span that wraps keeps a whole box on each line. */
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }
  .bl-body pre {
    overflow-x: auto; padding: 14px 16px; border: 1px solid var(--line); border-radius: 8px;
    background: var(--foot); font-size: 14px; line-height: 1.55;
  }
  .bl-body pre code { padding: 0; border: 0; background: none; font-size: inherit; overflow-wrap: normal; }

  /* A table scrolls inside its own box; the page never scrolls sideways.
     Code in a cell breaks only where posts.ts put a <wbr> (after a "/"). */
  .bl-table {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    border: 1px solid var(--line); border-radius: 8px;
  }
  .bl-table:focus-visible { outline: 2px solid var(--iris); outline-offset: 2px; }
  .bl-table table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 15px; line-height: 1.5; }
  .bl-table th, .bl-table td { text-align: left; vertical-align: top; padding: 10px 14px; border-bottom: 1px solid var(--line); }
  .bl-table thead th { background: var(--foot); font-weight: 600; }
  .bl-table tbody tr:last-child td { border-bottom: 0; }
  .bl-table td code { overflow-wrap: normal; }
`;

function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp">
      <style>{siteCss}</style>
      <style>{blogCss}</style>
      <SiteNav active="resources" />
      <main className="bl-main">
        <div className="lp-wrap">
          <div className="bl-col">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function BlogIndex() {
  return (
    <BlogShell>
      <h1 className="bl-title">{BLOG_INDEX.heading}</h1>
      <p className="bl-lede">{BLOG_INDEX.description}</p>
      <ol className="bl-list">
        {POSTS.map((p) => (
          <li className="bl-item" key={p.slug}>
            <h2>
              <a href={p.path}>{p.title}</a>
            </h2>
            <time dateTime={p.datePublished}>{formatDate(p.datePublished)}</time>
            <p>{p.description}</p>
          </li>
        ))}
      </ol>
    </BlogShell>
  );
}

export function BlogPost({ post }: { post: Post }) {
  return (
    <BlogShell>
      <article>
        <header>
          <h1 className="bl-title">{post.title}</h1>
          <p className="bl-byline">
            {post.author} · <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
          </p>
        </header>
        <div className="bl-body" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </BlogShell>
  );
}
