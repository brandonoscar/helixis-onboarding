/**
 * Build-time rendering. `vite build --ssr` bundles this file, and
 * scripts/prerender.mjs calls it once per marketing route to write static
 * HTML, so a crawler that runs no JavaScript still reads each page's copy.
 *
 * The tree matches main.tsx's, minus the consent bar and the wizard: the bar
 * renders nothing until it has read the visitor's stored choice in the
 * browser, and the wizard is never prerendered.
 */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { pageFor } from "./pages";
import { tokensCss } from "./theme";

export { MARKETING_ROUTES, CLIENT_ONLY_PREFIXES } from "./seo/routes";
export { appShellHead, headTags, notFoundHead, sitemapXml, HEAD_START, HEAD_END } from "./seo/head";

/** The marker the 404 page renders from; no real path matches it. */
export const NOT_FOUND_PATH = "/__not-found__";

export function render(path: string): string {
  return renderToString(
    <StrictMode>
      <style>{tokensCss}</style>
      {pageFor(path)}
    </StrictMode>,
  );
}
