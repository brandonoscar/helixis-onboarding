// @vitest-environment node
/**
 * What every marketing page downloads.
 *
 * ⚠ UNTIL 2026-09-29 EVERY PAGE SHIPPED THE SIGNUP WIZARD, THE SUPABASE CLIENT
 * AND POSTHOG in one 1 MB script, because main.tsx imported App.tsx, Site.tsx
 * imported APP_URL from lib/api.ts (which imports Supabase) and analytics.ts
 * imported posthog-js at the top. Each is now loaded where it is used. These
 * read the import declarations with the TypeScript parser (not a text search,
 * CLAUDE.md rule 17): one static import of any of them from the page side
 * puts the weight back on the home page.
 */
import { describe, expect, it } from "vitest";
import ts from "typescript";

const sources = import.meta.glob(["./**/*.ts", "./**/*.tsx", "!./**/*.test.*"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** The static, value-level imports of one file (type-only imports erase). */
function staticImports(file: string): string[] {
  const sf = ts.createSourceFile(file, sources[file], ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || st.importClause?.isTypeOnly) continue;
    out.push((st.moduleSpecifier as ts.StringLiteral).text);
  }
  return out;
}

/** Every file main.tsx reaches through static imports, walked by path. */
function reachableFromMain(): Set<string> {
  const seen = new Set<string>();
  const walk = (file: string) => {
    if (seen.has(file) || !(file in sources)) return;
    seen.add(file);
    for (const spec of staticImports(file)) {
      if (!spec.startsWith(".")) continue;
      const base = new URL(spec, `file:///x/${file.slice(2)}`).pathname.replace("/x/", "./");
      for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) walk(base + ext);
    }
  };
  walk("./main.tsx");
  return seen;
}

describe("the marketing bundle", () => {
  const reach = reachableFromMain();

  it("reaches the pages at all", () => {
    expect(reach.has("./main.tsx")).toBe(true);
    expect(reach.has("./Landing.tsx")).toBe(true);
    expect(reach.size).toBeGreaterThan(20);
  });

  it("never statically imports the wizard, Supabase or PostHog", () => {
    const heavy: string[] = [];
    for (const file of reach) {
      for (const spec of staticImports(file)) {
        if (spec === "./App" || spec === "posthog-js" || spec.startsWith("@supabase/") || /\/supabase$/.test(spec)) {
          heavy.push(`${file} imports ${spec}`);
        }
      }
    }
    expect(heavy).toEqual([]);
    expect(reach.has("./App.tsx")).toBe(false);
    expect(reach.has("./lib/api.ts")).toBe(false);
  });
});
