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
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import firstPostRaw from "../../content/blog/buildium-appliance-endpoints-410.md?raw";
import { render } from "../entry-server";
import { MENU, TOP_LINKS } from "../Site";
import { blogPostingJsonLd, headTags, llmsTxt, sitemapXml } from "../seo/head";
import { MARKETING_ROUTES, canonicalFor, routeFor } from "../seo/routes";
import { BLOG_CARD, BLOG_PATH, CARD_SIZE, POSTS, formatDate, parseFrontmatter, postFrom, renderMarkdown, sortPosts, type Post } from "./posts";

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

  it("marks a post as an article, with its dates and its own card", () => {
    const card = "https://occupella.com/blog/buildium-appliance-endpoints-410.png?v=2";
    expect(head).toContain('<meta property="og:type" content="article" />');
    expect(head).toContain(`<meta property="og:url" content="${canonicalFor(route)}" />`);
    expect(head).toContain(`<meta property="og:image" content="${card}" />`);
    expect(head).toContain(`<meta property="og:image:alt" content="${route.article!.headline}" />`);
    expect(head).toContain('<meta property="og:image:width" content="2400" />');
    expect(head).toContain('<meta property="og:image:height" content="1260" />');
    expect(head).toContain(`<meta property="article:published_time" content="${route.article!.datePublished}" />`);
    expect(head).toContain(`<meta property="article:modified_time" content="${route.article!.dateModified}" />`);
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain(`<meta name="twitter:image" content="${card}" />`);
  });

  it("shares a post under its own title; the browser tab keeps the site name", () => {
    const headline = "Buildium's appliance API endpoints stop working October 19, 2026";
    expect(head).toContain(`<meta property="og:title" content="${headline}" />`);
    expect(head).toContain(`<meta name="twitter:title" content="${headline}" />`);
    expect(head).toContain(`<title>${headline} | Occupella</title>`);
  });

  it("never shares the product screenshot from the blog", () => {
    // The site's default share image sells the product. A blog link pasted
    // into LinkedIn shows the article's card, or the blog's text-only card.
    const blog = MARKETING_ROUTES.filter((r) => r.path === BLOG_PATH || r.path.startsWith(`${BLOG_PATH}/`));
    expect(blog.length).toBe(POSTS.length + 1);
    for (const r of blog) {
      expect(headTags(r), r.path).not.toContain("social-preview.png");
      expect(r.image, r.path).toBeDefined();
    }
    expect(routeFor(BLOG_PATH)!.image).toEqual(BLOG_CARD);
    for (const p of POSTS) {
      const own = p.image ? { src: p.image, alt: p.title, ...(p.image.startsWith(`${BLOG_PATH}/`) ? CARD_SIZE : {}) } : null;
      expect(routeFor(p.path)!.image, p.path).toEqual(own ?? BLOG_CARD);
    }
  });

  it("names only share images that are real files in public/, each the size its tags declare", () => {
    // ?v=2 on a redrawn card makes LinkedIn fetch it again; the file is the same.
    const srcs = [BLOG_CARD.src, ...POSTS.flatMap((p) => (p.image?.startsWith("/") ? [p.image] : []))].map(
      (s) => s.replace(/[?#].*$/, ""),
    );
    expect(srcs.length).toBeGreaterThan(1);
    for (const src of srcs) {
      const file = join(__dirname, "../../public", src);
      expect(existsSync(file), `public${src} is missing; run scripts/blog-card.mjs`).toBe(true);
      // A PNG's width and height are bytes 16-23 of its IHDR header. A card
      // drawn at 1x was soft on LinkedIn; the head declares CARD_SIZE.
      const png = readFileSync(file);
      expect(png.subarray(1, 4).toString(), src).toBe("PNG");
      expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }, src).toEqual(CARD_SIZE);
    }
  });

  it("declares a size only for cards whose size it knows", () => {
    for (const r of MARKETING_ROUTES) {
      const h = headTags(r);
      const declared = h.includes('property="og:image:width"');
      expect(declared, r.path).toBe(Boolean(r.image?.width));
    }
    const external = { ...routeFor(POSTS[0].path)!, image: { src: "https://cdn.example.test/cover.png", alt: "Cover" } };
    expect(headTags(external)).not.toContain("og:image:width");
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

  it("puts the post's card in its structured data, and keeps an https image as given", () => {
    expect(blogPostingJsonLd(route)).toMatchObject({ image: ["https://occupella.com/blog/buildium-appliance-endpoints-410.png?v=2"] });
    const external = { ...route, image: { src: "https://cdn.example.test/cover.png", alt: "Cover" } };
    expect(headTags(external)).toContain('<meta property="og:image" content="https://cdn.example.test/cover.png" />');
    expect(blogPostingJsonLd(external)).toMatchObject({ image: ["https://cdn.example.test/cover.png"] });
  });

  it("leaves every other page's head as it was: website, no article tags, no BlogPosting", () => {
    for (const r of MARKETING_ROUTES.filter((x) => !x.article)) {
      const h = headTags(r);
      expect(h, r.path).toContain('<meta property="og:type" content="website" />');
      expect(h, r.path).not.toContain("article:published_time");
      expect(h, r.path).not.toContain('"@type":"BlogPosting"');
      if (!r.image) expect(h, r.path).toContain('<meta property="og:image" content="https://occupella.com/social-preview.png" />');
    }
    // Only the blog sets its own share image.
    expect(MARKETING_ROUTES.filter((x) => x.image).every((x) => x.path.startsWith(BLOG_PATH))).toBe(true);
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
