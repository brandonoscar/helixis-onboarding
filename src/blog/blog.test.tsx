// @vitest-environment node
/**
 * The blog: posts read from content/blog/*.md, prerendered like every other
 * marketing page, with the head tags a search engine and LinkedIn read.
 *
 * ⚠ THE FIRST POST'S WORDS ARE THE FOUNDER'S, published as written. The
 * "prints every line of its source" test reads the Markdown file and checks
 * each line's words reach the server HTML, so a rendering change that drops
 * or rewords a sentence fails here instead of shipping.
 */
import { describe, expect, it } from "vitest";

import firstPostRaw from "../../content/blog/buildium-appliance-endpoints-410.md?raw";
import { render } from "../entry-server";
import { MENU, TOP_LINKS } from "../Site";
import { blogPostingJsonLd, headTags, llmsTxt, sitemapXml } from "../seo/head";
import { MARKETING_ROUTES, canonicalFor, routeFor } from "../seo/routes";
import { BLOG_PATH, POSTS, formatDate, parseFrontmatter, postFrom, renderMarkdown, sortPosts, type Post } from "./posts";

const FIRST = "/blog/buildium-appliance-endpoints-410";

/** What a reader sees: tags (and <wbr>) gone, entities decoded, spaces collapsed. */
const text = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    // Inline tags join their neighbours ("<code>410 Gone</code>." reads "410 Gone.");
    // every other tag is a break between words.
    .replace(/<!--[\s\S]*?-->|<\/?(?:wbr|code|a|strong|em|b|i|span|time)\b[^>]*>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const between = (html: string, open: string, close: string) => html.slice(html.indexOf(open), html.indexOf(close) + close.length);

const VALID = `---
title: "A post"
description: "What it says."
slug: a-post
author: Occupella Engineering
datePublished: 2026-10-13
dateModified: 2026-10-13
---

Body.
`;

describe("posts", () => {
  it("found the first post", () => {
    expect(POSTS.length).toBeGreaterThan(0);
    expect(POSTS.map((p) => p.path)).toContain(FIRST);
  });

  it("reads the first post's frontmatter as written", () => {
    const p = POSTS.find((x) => x.path === FIRST)!;
    expect(p.title).toBe("Buildium's appliance API endpoints stop working October 19, 2026");
    expect(p.description).toBe(
      "Buildium is retiring its rentals and associations appliance endpoints. Starting October 19, 2026, they return 410 Gone. Here's the full old-to-new endpoint list.",
    );
    expect(p.slug).toBe("buildium-appliance-endpoints-410");
    expect(p.author).toBe("Occupella Engineering");
    expect(p.source).toBe("content/blog/buildium-appliance-endpoints-410.md");
    expect(p.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.dateModified >= p.datePublished).toBe(true);
  });

  it("lists newest first, a tie broken by slug", () => {
    const mk = (slug: string, d: string) => ({ slug, datePublished: d }) as Post;
    const sorted = sortPosts([mk("b", "2026-01-01"), mk("c", "2026-03-01"), mk("a", "2026-01-01")]);
    expect(sorted.map((p) => p.slug)).toEqual(["c", "a", "b"]);
    expect(POSTS).toEqual(sortPosts([...POSTS]));
  });

  it("accepts a well-formed file", () => {
    const p = postFrom("content/blog/a-post.md", VALID);
    expect(p.path).toBe("/blog/a-post");
    expect(p.image).toBeUndefined();
    expect(parseFrontmatter(VALID.replace(/\n/g, "\r\n"), "x.md").data.title).toBe("A post");
  });

  it("refuses a file that would publish wrong", () => {
    const bad: [string, string, RegExp][] = [
      ["no frontmatter", "Body only.", /frontmatter block/],
      ["missing author", VALID.replace("author: Occupella Engineering\n", ""), /missing "author"/],
      ["slug not the file name", VALID.replace("slug: a-post", "slug: another-post"), /must match the file name/],
      ["slug with capitals", VALID.replace("slug: a-post", "slug: A-Post"), /lowercase/],
      ["not a date", VALID.replace("datePublished: 2026-10-13", "datePublished: Oct 13"), /not a YYYY-MM-DD/],
      ["impossible date", VALID.replace("dateModified: 2026-10-13", "dateModified: 2026-02-30"), /not a YYYY-MM-DD/],
      ["modified before published", VALID.replace("dateModified: 2026-10-13", "dateModified: 2026-10-01"), /before datePublished/],
      ["unknown key", VALID.replace("slug: a-post", "slug: a-post\ntags: api"), /unknown frontmatter key "tags"/],
      ["key twice", VALID.replace("slug: a-post", "slug: a-post\nslug: a-post"), /appears twice/],
      ["image not a path or https", VALID.replace("slug: a-post", "slug: a-post\nimage: http://x.test/a.png"), /image must be/],
      ["no body", VALID.replace("\nBody.\n", "\n"), /no body/],
    ];
    for (const [why, raw, msg] of bad) {
      expect(() => postFrom("content/blog/a-post.md", raw), why).toThrow(msg);
    }
  });

  it("formats a date the same in any time zone", () => {
    expect(formatDate("2026-10-13")).toBe("October 13, 2026");
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("rendering Markdown", () => {
  it("puts every table in a box that scrolls sideways", () => {
    const html = renderMarkdown("| A | B |\n|---|---|\n| `GET /v1/x/{id}` | b |\n");
    expect(html).toMatch(/^<div class="bl-table" role="region" aria-label="[^"]+" tabindex="0"><table>/);
    expect(html.trim().endsWith("</table></div>")).toBe(true);
    // The path may wrap after each "/", and reads whole once the breaks are gone.
    expect(html).toContain("<code>GET /<wbr>v1/<wbr>x/<wbr>{id}</code>");
    expect(text(html)).toContain("GET /v1/x/{id}");
  });

  it("leaves code outside a table alone", () => {
    expect(renderMarkdown("Search for `/rentals/appliances`.")).toContain("<code>/rentals/appliances</code>");
  });
});

describe("the first post's page", () => {
  const html = render(FIRST);
  const article = between(html, "<article>", "</article>");
  const words = text(article);

  it("prints every line of its source", () => {
    const { body } = parseFrontmatter(firstPostRaw, "first post");
    const lines = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^\|?[-| ]+\|?$/.test(l));
    expect(lines.length).toBeGreaterThan(15);
    for (const line of lines) {
      const cells = line.startsWith("|") ? line.split("|").map((c) => c.trim()).filter(Boolean) : [line];
      for (const cell of cells) {
        const plain = cell
          .replace(/^#+\s+/, "")
          .replace(/^\d+\.\s+/, "")
          .replace(/`/g, "")
          .replace(/<(https:[^>]+)>/g, "$1");
        expect(words, plain).toContain(plain);
      }
    }
  });

  it("has the table rows in the HTML, each a row", () => {
    expect(article.match(/<tr>/g)?.length).toBe(9); // header + 8 endpoints
    expect(words).toContain(
      "GET /v1/rentals/appliances/{applianceId}/servicehistory/{serviceHistoryId} GET /v1/assetservicehistory/{inventoryAssetId}/{assetServiceHistoryId}",
    );
  });

  it("opens with the title and the byline", () => {
    const p = POSTS.find((x) => x.path === FIRST)!;
    expect(text(between(html, "<h1", "</h1>")).trim()).toBe(p.title);
    expect(words).toContain(`${p.title} Occupella Engineering · ${formatDate(p.datePublished)}`);
    expect(article).toContain(`<time dateTime="${p.datePublished}">`);
  });

  it("carries no pitch: no closing band and no signup link in the article", () => {
    expect(html).not.toContain('class="lp-close"');
    expect(article).not.toContain('href="/start"');
    // The normal site header and footer are there.
    expect(html).toContain('<nav class="lp-nav"');
    expect(html).toContain('<footer class="lp-footer"');
  });
});

describe("the blog index", () => {
  const html = render(BLOG_PATH);

  it("lists every post newest first, with its title, date and description", () => {
    const listed = [...html.matchAll(/<li class="bl-item"><h2><a href="([^"]+)">/g)].map((m) => m[1]);
    expect(listed).toEqual(POSTS.map((p) => p.path));
    for (const p of POSTS) {
      const words = text(html);
      expect(words).toContain(`${p.title} ${formatDate(p.datePublished)} ${p.description}`);
    }
  });

  it("carries no closing band", () => {
    expect(html).not.toContain('class="lp-close"');
  });
});

describe("what a search engine and LinkedIn read", () => {
  const route = routeFor(FIRST)!;
  const head = headTags(route);

  it("gives each post a route, a self-canonical and the sitemap", () => {
    const sitemap = sitemapXml(() => undefined);
    for (const p of [BLOG_PATH, ...POSTS.map((x) => x.path)]) {
      const r = routeFor(p)!;
      expect(r, p).toBeDefined();
      expect(headTags(r)).toContain(`<link rel="canonical" href="https://occupella.com${p}" />`);
      expect(sitemap).toContain(`<loc>https://occupella.com${p}</loc>`);
      expect(llmsTxt()).toContain(`(https://occupella.com${p})`);
    }
  });

  it("marks a post as an article, with its dates and the default image", () => {
    expect(head).toContain('<meta property="og:type" content="article" />');
    expect(head).toContain(
      `<meta property="og:title" content="Buildium's appliance API endpoints stop working October 19, 2026 | Occupella" />`,
    );
    expect(head).toContain(`<meta property="og:url" content="${canonicalFor(route)}" />`);
    expect(head).toContain('<meta property="og:image" content="https://occupella.com/social-preview.png" />');
    expect(head).toContain(`<meta property="article:published_time" content="${route.article!.datePublished}" />`);
    expect(head).toContain(`<meta property="article:modified_time" content="${route.article!.dateModified}" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain('<meta name="twitter:image" content="https://occupella.com/social-preview.png" />');
  });

  it("describes the post as a BlogPosting by Occupella Engineering, published by Occupella", () => {
    const scripts = [...head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const posting = scripts.find((s) => s["@type"] === "BlogPosting");
    expect(posting).toEqual(blogPostingJsonLd(route));
    expect(posting).toMatchObject({
      "@context": "https://schema.org",
      headline: "Buildium's appliance API endpoints stop working October 19, 2026",
      datePublished: route.article!.datePublished,
      dateModified: route.article!.dateModified,
      author: { "@type": "Organization", name: "Occupella Engineering" },
      publisher: { "@type": "Organization", name: "Occupella", logo: { "@type": "ImageObject", url: "https://occupella.com/icon-512.png" } },
      url: canonicalFor(route),
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalFor(route) },
    });
    // Home > Blog > the post.
    const crumbs = scripts.find((s) => s["@type"] === "BreadcrumbList");
    expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Blog", route.article!.headline]);
  });

  it("uses a post's own image when it names one", () => {
    const withImage = { ...route, article: { ...route.article!, image: "/blog/cover.png" } };
    expect(headTags(withImage)).toContain('<meta property="og:image" content="https://occupella.com/blog/cover.png" />');
    expect(blogPostingJsonLd(withImage)).toMatchObject({ image: ["https://occupella.com/blog/cover.png"] });
  });

  it("leaves every other page's head as it was: website, no article tags, no BlogPosting", () => {
    for (const r of MARKETING_ROUTES.filter((x) => !x.article)) {
      const h = headTags(r);
      expect(h, r.path).toContain('<meta property="og:type" content="website" />');
      expect(h, r.path).not.toContain("article:published_time");
      expect(h, r.path).not.toContain('"@type":"BlogPosting"');
    }
    expect(MARKETING_ROUTES.filter((x) => x.article).map((x) => x.path)).toEqual(POSTS.map((p) => p.path));
  });
});

describe("where the blog is linked", () => {
  it("sits in the Resources menu, right after Landlord rules by state", () => {
    const items = MENU.find((g) => g.key === "resources")!.items.map((i) => i.href);
    expect(items[items.indexOf("/state-laws") + 1]).toBe(BLOG_PATH);
  });

  it("is in the footer's Resources column and not in the top nav", () => {
    const footer = between(render("/"), '<footer class="lp-footer"', "</footer>");
    expect(footer).toContain('href="/blog"');
    expect(TOP_LINKS.map((l) => l.href)).not.toContain(BLOG_PATH);
  });
});
