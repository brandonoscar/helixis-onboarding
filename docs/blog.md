# How to add a blog post

A post is one Markdown file and its share card. Nothing else needs editing.

1. **Add `content/blog/<slug>.md`.** The slug becomes the URL, `occupella.com/blog/<slug>`. Use lowercase words joined by hyphens, matching the file name.

2. **Start the file with this frontmatter:**

   ```
   ---
   title: "The headline"
   description: "What the post says, for search results and the LinkedIn card. 155 characters or fewer."
   slug: the-file-name-without-md
   author: Occupella Engineering
   datePublished: 2026-10-13
   dateModified: 2026-10-13
   ---
   ```

   `image:` is optional; step 4 adds it.

3. **Write the body in Markdown below it.** Don't repeat the title as a heading; the page prints the title and the byline ("Occupella Engineering · October 13, 2026"). Use `##` for sections. Tables, lists, links, inline code and code blocks all work, and a table scrolls sideways on a phone instead of widening the page.

4. **Draw the share card.** Run `node scripts/blog-card.mjs <slug>`. It writes `public/blog/<slug>.png`, the image LinkedIn shows when the link is pasted: the post's title, "Occupella Engineering", the date and `occupella.com/blog`, with no product screenshot. Add the line it prints, `image: /blog/<slug>.png`, to the frontmatter. It needs Playwright with Chromium; a Claude Code cloud session has it. A post with no `image` shows the blog's own text-only card (`public/blog/card.png`), never the product screenshot the other pages share.

5. **Run `npm run build`.** It fails on a missing field, an unknown field, a slug that doesn't match the file name, or a date that isn't `YYYY-MM-DD`. When it passes, the post is:
   - on `/blog`, newest first;
   - in `sitemap.xml` (its lastmod is the file's last commit date) and `llms.txt`;
   - prerendered with its own title, description, canonical, Open Graph and Twitter tags, and BlogPosting structured data. The share title is the post's title alone; the browser tab adds " | Occupella".

6. **Dates.** Set both to the day the post goes live. When you change a published post, move `dateModified` only.

7. **After it deploys,** paste the live URL into LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) before sharing it, so LinkedIn fetches the current card.

## Rules

- No sales pitch, banner or call to action inside a post. Blog pages have the normal site header and footer and nothing else.
- Post bodies are rendered to HTML as written, with no sanitizing. Only commit Markdown you wrote.

## Where the code is

| What | File |
|---|---|
| Reading and checking the Markdown files | `src/blog/posts.ts` |
| The `/blog` index and the post page | `src/blog/Blog.tsx` |
| The routes, and so the sitemap and llms.txt | `src/seo/routes.ts` (`BLOG_ROUTES`) |
| Article tags and BlogPosting data | `src/seo/head.ts` (`blogPostingJsonLd`) |
| The share card | `scripts/blog-card.mjs` |
| Tests | `src/blog/blog.test.tsx` |
