import type { IncidentBrief, Symptom } from "../bug-incident.js";
import { markdownToHtml } from "../markdown-html.js";
import { codeMapSvg } from "./bug-code-map.js";

/**
 * The first screen of a bug hunt page — /bug-hunts/the-checkout-meltdown —
 * as data, for the static-first view the Worker draws from it (frontend
 * lib/seo/views/api/bug-hunt.ts; the registry and the reasons are in
 * lib/seo-views/index.ts): what BugWorkspace shows a visitor before they
 * touch anything — the header (title, difficulty, layer, the neighbours),
 * the Briefing tab (IncidentBrief, "Inspired by", the description) and, from
 * 860 px, the Code tab with the file tabs and the first editable file in
 * the editor's plain preview.
 *
 * Built in services/seo.ts bugHuntHead from the row it has already loaded
 * (and the cached catalogue order for prev/next, the same read the page's
 * own /neighbours makes): no query of its own.
 */
export interface BugHuntView {
  kind: "bug-hunt";
  title: string;
  /** easy | medium | hard, as stored. */
  difficulty: string;
  /** The layer as the header writes it ("· Frontend"). */
  category: string;
  /** The neighbours' public addresses, as the header links them; null = the disabled arrow. */
  prev: string | null;
  next: string | null;
  incident: Pick<IncidentBrief, "severity" | "ticket" | "priority" | "reportedBy" | "targetMins" | "playbook">;
  /** The visible checks the shipped build fails (IncidentBrief draws only those). */
  failing: Array<{ name: string; detail: string }>;
  origin: string | null;
  /** The briefing's markdown as safe HTML (backend markdownToHtml). */
  description: string;
  /** Every file's tab, in the order the page's payload lists them. */
  files: Array<{ name: string; editable: boolean }>;
  /** The tab the editor opens on: the first editable file (BugWorkspace's activeFile). */
  active: number;
  /** That file's first lines — the editor's preview shows ~40 at 1920 × 1080; the rest is below the fold. */
  code: string;
  /**
   * The briefing's code map (HuntCodeMap) as its finished `<svg>`, or null
   * where the SPA draws none: its top is inside the first viewport at
   * 768 × 1024 and 1920 × 1080 (bug-code-map.ts says why it is a port).
   */
  map: string | null;
}

/** Lines of the open file carried: more than the tallest first viewport shows. */
const CODE_LINES = 80;

export function bugHuntView(
  b: {
    title: string;
    difficulty: string;
    category: string;
    origin: string | null;
    description: string;
    files: Array<{ filePath: string; content: string; isEditable: boolean; language: string | null }>;
  },
  tests: { visible: string[]; hidden: number },
  incident: IncidentBrief,
  symptoms: Symptom[] | null,
  neighbours: { prev: string | null; next: string | null },
): BugHuntView {
  const firstEditable = b.files.findIndex((f) => f.isEditable);
  const active = firstEditable === -1 ? 0 : firstEditable;
  const open = b.files[active]?.content ?? "";
  return {
    kind: "bug-hunt",
    title: b.title,
    difficulty: b.difficulty.toLowerCase(),
    category: b.category ? b.category.charAt(0).toUpperCase() + b.category.slice(1).toLowerCase() : "",
    prev: neighbours.prev,
    next: neighbours.next,
    incident: { severity: incident.severity, ticket: incident.ticket, priority: incident.priority, reportedBy: incident.reportedBy, targetMins: incident.targetMins, playbook: incident.playbook },
    failing: (symptoms ?? []).filter((s) => !s.passed).map((s) => ({ name: s.name, detail: s.detail })),
    origin: b.origin,
    description: markdownToHtml(b.description, 8_000, { under: 1 }),
    files: b.files.map((f) => ({ name: f.filePath.split("/").pop() ?? f.filePath, editable: f.isEditable })),
    active,
    code: open.split("\n").slice(0, CODE_LINES).join("\n"),
    map: codeMapSvg(b.files.map((f) => ({ filePath: f.filePath, content: f.content, isEditable: f.isEditable, language: f.language ?? "" })), tests.visible, tests.hidden)?.svg ?? null,
  };
}
