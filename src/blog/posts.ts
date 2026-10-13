import { Marked } from "marked";

// ─────────────────────────────────────────────────────────────────────
// The blog's posts: every Markdown file in content/blog/, read at build
// time and in the browser from the same glob.
//
// ADDING A POST IS ADDING ONE FILE: content/blog/<slug>.md with the
// frontmatter below. The route table (src/seo/routes.ts), the pages
// (src/pages.tsx), the sitemap, llms.txt and the /blog index all read
// POSTS, so nothing else changes. docs/blog.md is the how-to.
//
// ⚠ A BAD FILE FAILS THE BUILD, ON PURPOSE. A missing field, a slug that
// isn't the file name or a date that isn't a date throws here, which fails
// the tests and the prerender, and in this repo a failed build keeps the
// live site on its previous deploy (gotcha 131). That beats publishing a post
// with no date in its structured data.
//
// ⚠ Post bodies are trusted repo content: the Markdown renders to HTML as is,
// with no sanitizing. Never feed this anything a visitor typed.
// ─────────────────────────────────────────────────────────────────────

export const BLOG_PATH = "/blog";

/** The /blog index's own words, read by its route and its page. */
export const BLOG_INDEX = {
  title: "Blog | Occupella",
  heading: "Blog",
  description:
    "Notes from Occupella Engineering on property-management APIs: what changed, who it affects and what to do about it.",
} as const;

export interface Post {
  slug: string;
  title: string;
  description: string;
  author: string;
  /** YYYY-MM-DD */
  datePublished: string;
  /** YYYY-MM-DD, never before datePublished */
  dateModified: string;
  /** A path under public/ or an https URL. Absent: the site's default image. */
  image?: string;
  /** /blog/<slug> */
  path: string;
  /** The file, relative to the repo root (the sitemap reads its commit date). */
  source: string;
  /** The body, rendered. */
  html: string;
}

const REQUIRED = ["title", "description", "slug", "datePublished", "dateModified", "author"] as const;
const OPTIONAL = ["image"] as const;
const KNOWN: readonly string[] = [...REQUIRED, ...OPTIONAL];

/** One `key: value` per line. Values may be "double-quoted", 'single-quoted' or bare. */
export function parseFrontmatter(raw: string, file: string): { data: Record<string, string>; body: string } {
  const text = raw.replace(/\r\n?/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${file}: must start with a --- frontmatter block closed by ---`);
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim()) continue;
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${file}: frontmatter line is not "key: value": ${line}`);
    const [, key, rawValue] = kv;
    if (!KNOWN.includes(key)) throw new Error(`${file}: unknown frontmatter key "${key}" (known: ${KNOWN.join(", ")})`);
    if (key in data) throw new Error(`${file}: frontmatter key "${key}" appears twice`);
    data[key] = unquote(rawValue.trim(), file);
  }
  return { data, body: m[2] };
}

function unquote(v: string, file: string): string {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    try {
      return JSON.parse(v) as string;
    } catch {
      throw new Error(`${file}: bad double-quoted value ${v}`);
    }
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

function isDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

const markdown = new Marked({ gfm: true, async: false });

/**
 * The body as HTML. Two changes to marked's output, both for a phone:
 * every table sits in a box that scrolls sideways (the page itself never
 * does), and a code span inside a table may wrap after a "/", so an endpoint
 * path breaks between its segments instead of in the middle of one. <wbr> is
 * not a character: copying the path still copies it whole.
 */
export function renderMarkdown(body: string): string {
  const html = markdown.parse(body, { async: false }) as string;
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (_whole, inner: string) => {
    const breakable = inner.replace(/<code>([^<]*)<\/code>/g, (_c, code: string) => `<code>${code.replace(/\//g, "/<wbr>")}</code>`);
    return `<div class="bl-table" role="region" aria-label="Table, scrolls sideways" tabindex="0"><table>${breakable}</table></div>`;
  });
}

/** One file, checked and rendered. Throws with the file's name on any problem. */
export function postFrom(file: string, raw: string): Post {
  const { data, body } = parseFrontmatter(raw, file);
  for (const key of REQUIRED) {
    if (!data[key]) throw new Error(`${file}: frontmatter is missing "${key}"`);
  }
  const stem = file.split("/").pop()!.replace(/\.md$/, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error(`${file}: slug "${data.slug}" must be lowercase words joined by hyphens`);
  if (data.slug !== stem) throw new Error(`${file}: slug "${data.slug}" must match the file name "${stem}"`);
  for (const key of ["datePublished", "dateModified"] as const) {
    if (!isDate(data[key])) throw new Error(`${file}: ${key} "${data[key]}" is not a YYYY-MM-DD date`);
  }
  if (data.dateModified < data.datePublished) throw new Error(`${file}: dateModified is before datePublished`);
  if (data.image !== undefined && !/^(\/[^\s]+|https:\/\/[^\s]+)$/.test(data.image)) {
    throw new Error(`${file}: image must be a path under public/ ("/blog/x.png") or an https URL`);
  }
  if (!body.trim()) throw new Error(`${file}: the post has no body`);
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    author: data.author,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    ...(data.image ? { image: data.image } : {}),
    path: `${BLOG_PATH}/${data.slug}`,
    source: `content/blog/${stem}.md`,
    html: renderMarkdown(body),
  };
}

/** Newest first; a tie goes to the slug, so the order never depends on the file system. */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) =>
    a.datePublished === b.datePublished ? a.slug.localeCompare(b.slug) : a.datePublished < b.datePublished ? 1 : -1,
  );
}

const FILES = import.meta.glob("../../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const POSTS: readonly Post[] = sortPosts(
  Object.entries(FILES).map(([file, raw]) => postFrom(file.replace(/^(\.\.\/)+/, ""), raw)),
);

/** "2026-10-13" -> "October 13, 2026", the same in the build and in any browser's time zone. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
