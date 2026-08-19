/**
 * Desktop-app download resolution.
 *
 * The landing page's download button links DIRECTLY at an installer file, so
 * one click starts the download — the visitor never lands on a release page
 * to hunt for an asset (founder direction, 2026-08-19).
 *
 * Where the file comes from: the Electron shell's release workflow builds
 * .dmg / .exe / .AppImage on a version-tag push and publishes them as release
 * assets, and ``electron-updater`` inside the shipped app polls that same feed
 * for updates (see helixiselectron/electron-builder.yml). Pointing the button
 * at those asset URLs keeps ONE artifact source: the file a new visitor
 * downloads is byte-identical to the one an installed app updates itself to.
 *
 * Availability is resolved at runtime rather than hard-coded: the page asks
 * for the latest release once, and renders a real download button only when a
 * matching installer actually exists. Until the first tag is pushed the button
 * shows an honest early-access state instead of a link that 404s — and the
 * moment a release lands, the button goes live with no code change.
 */

export type OS = "macOS" | "Windows" | "Linux";

export interface DesktopBuild {
  os: OS;
  /** Direct link to the installer file — clicking it downloads. */
  url: string;
  version: string;
  /** Bytes, for the "· 94 MB" hint next to the button. */
  size: number;
}

const RELEASE_API =
  "https://api.github.com/repos/brandonoscar/helixiselectron/releases/latest";

/** Which installer belongs to which OS, by file extension. */
const EXT: Record<OS, RegExp> = {
  macOS: /\.dmg$/i,
  Windows: /\.exe$/i,
  Linux: /\.AppImage$/i,
};

/**
 * The visitor's OS. ``navigator.userAgentData`` is Chromium-only, so the UA
 * regex is a required fallback, not a nicety (``navigator.platform`` is
 * deprecated and deliberately unused). Returns null when unrecognized — the
 * caller then offers every platform rather than guessing wrong.
 */
export function detectOS(): OS | null {
  if (typeof navigator === "undefined") return null;
  const uaPlatform = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData?.platform;
  if (uaPlatform) {
    if (/mac/i.test(uaPlatform)) return "macOS";
    if (/win/i.test(uaPlatform)) return "Windows";
    if (/linux|cros/i.test(uaPlatform)) return "Linux";
  }
  const ua = navigator.userAgent;
  if (/Mac|iPhone|iPad/i.test(ua)) return "macOS";
  if (/Win/i.test(ua)) return "Windows";
  if (/Linux|X11|CrOS/i.test(ua)) return "Linux";
  return null;
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

/**
 * Every installer in the latest release, keyed by OS. Resolves to an empty
 * object when no release exists yet, the network is unavailable, or the
 * response is unexpected — the download UI treats "nothing to offer" as its
 * normal early state, so a failure here is quiet, never an error banner.
 */
export async function fetchDesktopBuilds(): Promise<Partial<Record<OS, DesktopBuild>>> {
  try {
    const res = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      tag_name?: string;
      draft?: boolean;
      prerelease?: boolean;
      assets?: ReleaseAsset[];
    };
    // ``releases/latest`` already excludes drafts and prereleases, but a
    // hand-made release could still be flagged — never offer one.
    if (data.draft || data.prerelease) return {};
    const version = (data.tag_name || "").replace(/^v/, "");
    const out: Partial<Record<OS, DesktopBuild>> = {};
    for (const asset of data.assets || []) {
      for (const os of Object.keys(EXT) as OS[]) {
        if (!out[os] && EXT[os].test(asset.name)) {
          out[os] = {
            os,
            url: asset.browser_download_url,
            version,
            size: asset.size,
          };
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / 1_000_000;
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}
