import type { ReactElement } from "react";
import Landing from "./Landing";
import Features from "./Features";
import Pricing from "./Pricing";
import NotFound from "./NotFound";
import { Privacy, Sms, Terms } from "./Legal";
import Leasing from "./solutions/Leasing";
import Maintenance from "./solutions/Maintenance";
import Delinquency from "./solutions/Delinquency";
import Screenshots from "./Screenshots";
import OwnerReporting from "./solutions/OwnerReporting";
import { normalizePath } from "./seo/routes";

/**
 * Path -> marketing page. Used by the browser (main.tsx) and by the build,
 * which prerenders each page to static HTML (src/entry-server.tsx), so both
 * render the same thing for the same path.
 *
 * Exact matches, not prefixes: `/features/anything` is a 404, as it is on the
 * static host. Every path here must also be in src/seo/routes.ts
 * (seo.test.ts checks).
 */
export const PAGES: Record<string, () => ReactElement> = {
  "/": () => <Landing />,
  "/features": () => <Features />,
  "/pricing": () => <Pricing />,
  "/screenshots": () => <Screenshots />,
  "/solutions/owner-reporting": () => <OwnerReporting />,
  "/solutions/delinquency": () => <Delinquency />,
  "/solutions/maintenance": () => <Maintenance />,
  "/solutions/leasing": () => <Leasing />,
  "/sms": () => <Sms />,
  "/terms": () => <Terms />,
  "/privacy": () => <Privacy />,
};

export function pageFor(path: string): ReactElement {
  const page = PAGES[normalizePath(path)];
  return page ? page() : <NotFound />;
}
