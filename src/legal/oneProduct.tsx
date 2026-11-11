/**
 * The one product's Terms of Service, Privacy Policy and Data Processing Agreement, rendered
 * from the drafts in docs/legal/ (their README says what they are: written in house, not
 * reviewed by a lawyer). They are pages only once src/legal/publish.ts says so.
 *
 * A draft reads as a page: its "# Title (draft)" without "(draft)", the "> Draft ..." note under
 * it left out, its "Effective ..." line as the page's date, and its plain-English paragraph in
 * the same box the live pages show. The Privacy Policy's "*(At publication: ...)*" line is the
 * shared subprocessor list (src/legal/subprocessors.tsx), so /privacy and /security still list
 * the same providers.
 */
import type { ReactElement } from "react";

import { renderMarkdown } from "../blog/posts";
import { Shell } from "../Legal";
import { SubprocessorList } from "./subprocessors";
import terms from "../../docs/legal/terms.md?raw";
import privacy from "../../docs/legal/privacy.md?raw";
import dpa from "../../docs/legal/dpa.md?raw";

export type LegalDoc = "terms" | "privacy" | "dpa";

export const DRAFTS: Record<LegalDoc, string> = { terms, privacy, dpa };

const PATHS: Record<LegalDoc, string> = { terms: "/terms", privacy: "/privacy", dpa: "/dpa" };

const SUBPROCESSORS_HERE = /^\*\(At publication:[^\n]*\)\*[ \t]*$/m;

export interface LegalPage {
  title: string;
  effective: string;
  /** The plain-English paragraph's HTML, shown in the note box. */
  note: string | null;
  /** The body as HTML, split where the subprocessor list goes (privacy only). */
  parts: string[];
}

/** A draft's text as published: the title line and the draft note left out. */
function published(raw: string): { title: string; body: string } {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const heading = lines.findIndex((line) => line.startsWith("# "));
  if (heading < 0) throw new Error("a legal draft needs a '# Title' line");
  const title = lines[heading].slice(2).replace(/\s*\(draft\)\s*$/i, "").trim();
  let rest = heading + 1;
  while (rest < lines.length && (lines[rest].startsWith(">") || lines[rest].trim() === "")) rest += 1;
  return { title, body: lines.slice(rest).join("\n") };
}

/** Each [[BLANK]] still in a draft's published text, as "file: [[BLANK]]". */
export function blanksLeft(drafts: Record<LegalDoc, string> = DRAFTS): string[] {
  return (Object.keys(drafts) as LegalDoc[]).flatMap((doc) =>
    [...published(drafts[doc]).body.matchAll(/\[\[[^\]]+\]\]/g)].map((m) => `${doc}.md: ${m[0]}`),
  );
}

export function legalPage(raw: string): LegalPage {
  const { title, body } = published(raw);
  const effective = /^Effective (.+)$/m.exec(body);
  if (!effective) throw new Error(`${title}: the draft needs an "Effective ..." line`);
  let text = body.replace(effective[0], "").trimStart();
  let note: string | null = null;
  const plain = /^(This is written in plain English[\s\S]*?)\n\n/.exec(text);
  if (plain) {
    note = renderMarkdown(plain[1]).replace(/^<p>([\s\S]*)<\/p>\s*$/, "$1");
    text = text.slice(plain[0].length);
  }
  return {
    title,
    effective: effective[1].trim(),
    note,
    parts: text.split(SUBPROCESSORS_HERE).map((part) => renderMarkdown(part)),
  };
}

export function DraftPage({ doc }: { doc: LegalDoc }): ReactElement {
  const page = legalPage(DRAFTS[doc]);
  return (
    <Shell title={page.title} updated={`Effective ${page.effective}`} note={false}>
      {page.note ? <div className="legal-note" dangerouslySetInnerHTML={{ __html: page.note }} /> : null}
      {page.parts.map((html, i) => (
        <div key={i}>
          {i > 0 ? <SubprocessorList /> : null}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ))}
    </Shell>
  );
}

/** The pages the drafts take over once published: /terms, /privacy and the new /dpa. */
export function legalPages(published: boolean): Record<string, () => ReactElement> {
  if (!published) return {};
  return Object.fromEntries(
    (Object.keys(PATHS) as LegalDoc[]).map((doc) => [PATHS[doc], () => <DraftPage doc={doc} />]),
  );
}
