# How to add a blog post

A post is one Markdown file. Nothing else needs editing.

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

   Optional: `image: /blog/<slug>.png` (a file you add under `public/blog/`) or an `https://` URL. Without it, the preview card uses the site's default image, `public/social-preview.png`.

3. **Write the body in Markdown below it.** Don't repeat the title as a heading; the page prints the title and the byline ("Occupella Engineering · October 13, 2026"). Use `##` for sections. Tables, lists, links, inline code and code blocks all work, and a table scrolls sideways on a phone instead of widening the page.

4. **Run `npm run build`.** It fails on a missing field, an unknown field, a slug that doesn't match the file name, or a date that isn't `YYYY-MM-DD`. When it passes, the post is:
   - on `/blog`, newest first;
   - in `sitemap.xml` (its lastmod is the file's last commit date) and `llms.txt`;
   - prerendered with its own title, description, canonical, Open Graph and Twitter tags, and BlogPosting structured data.

5. **Dates.** Set both to the day the post goes live. When you change a published post, move `dateModified` only.

6. **After it deploys,** paste the live URL into LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) before sharing it, so LinkedIn fetches the current card.

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
| Tests | `src/blog/blog.test.tsx` |
