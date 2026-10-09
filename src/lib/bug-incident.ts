import { SOURCE_RULES, type Difficulty } from "./skill-score.js";

/**
 * The production-incident format of a bug hunt (Phase 6 of ADAPTIVE_COACH.md,
 * §14), pure: the brief an on-call engineer would be paged with, the clock a
 * diagnosis is timed by, and the patch a fix made — all read from what a hunt
 * and its submissions already hold. Nothing here is authored per hunt:
 *
 *  - the ticket, priority and reporter come from the first line every bug
 *    report opens with ("**BUG-2107** · Priority: Critical · Reported by: …",
 *    311 of 311 reports on 2026-10-09), and a report without one falls back to
 *    the difficulty;
 *  - the time target is the skill scorer's par for a hunt (SOURCE_RULES.bug
 *    parSecs), so "within target" and the profile's pace are one rule;
 *  - the failing checks are what the shipped build really printed on the
 *    visible tests (BugChallenge.symptoms, written by services/bug-coach.ts);
 *  - the diagnosis time is the server's own clock — BugEngagement's start
 *    (incident or first open) to the first accepted fix — never the client's.
 *
 * The incident never shows "the deploy that broke it": that diff is the
 * answer reversed. The only diff is the hunter's own patch, after a submit.
 * Pinned by bug-incident.test.ts.
 */

export type Severity = "SEV-1" | "SEV-2" | "SEV-3";

export interface IncidentBrief {
  /** "BUG-2107", or null when the report has no ticket line. */
  ticket: string | null;
  /** The report's own word ("Critical (funds)"), or null. */
  priority: string | null;
  severity: Severity;
  /** Who raised it ("support (14 duplicate tickets)"), or null. */
  reportedBy: string | null;
  /** The time a fix is expected in, minutes — the scorer's par for this difficulty. */
  targetMins: number;
  /** How to work this incident, in order — the same steps for every visitor, worded for the layer. */
  playbook: string[];
}

export interface Symptom {
  name: string;
  passed: boolean;
  detail: string;
}

const TICKET_LINE = /^\s*\*\*([A-Z0-9][A-Z0-9._-]{1,40})\*\*\s*·\s*Priority:\s*([^·\n]{1,60}?)\s*(?:·\s*Reported by:\s*([^\n]{1,120}?))?\s*$/i;

/** The ticket header of a bug report, when its first line is one. */
export function ticketOf(bugReport: string): { ticket: string; priority: string; reportedBy: string | null } | null {
  const first = bugReport.replace(/\r\n?/g, "\n").split("\n").find((l) => l.trim()) ?? "";
  const m = TICKET_LINE.exec(first);
  if (!m) return null;
  return { ticket: m[1]!.toUpperCase(), priority: m[2]!.trim(), reportedBy: m[3]?.trim() || null };
}

/**
 * A report's priority as an incident severity. The reports use the words a
 * team would (Critical, High, P0, Blocker, "Recall-grade", "Existential");
 * anything the list does not know, or no ticket, reads from the difficulty —
 * a hard hunt is a SEV-2, never a SEV-1 by guess.
 */
export function severityOf(priority: string | null, difficulty: string): Severity {
  const p = (priority ?? "").toLowerCase();
  if (/\b(critical|existential|blocker|p0|sev-?1|recall|urgent|emergency)/.test(p)) return "SEV-1";
  if (/\b(high|p1|sev-?2|major)/.test(p)) return "SEV-2";
  if (/\b(medium|low|minor|p[2-4]|sev-?3)/.test(p)) return "SEV-3";
  return difficulty.toLowerCase() === "hard" ? "SEV-2" : "SEV-3";
}

export const toDifficulty = (d: string): Difficulty => (d.toLowerCase() === "hard" ? "hard" : d.toLowerCase() === "medium" ? "medium" : "easy");

/** The fix's time target, seconds: the scorer's par (lib/skill-score SOURCE_RULES.bug). */
export const targetSecsOf = (difficulty: string): number => SOURCE_RULES.bug.parSecs![toDifficulty(difficulty)];

const LAYER_STEP: Record<string, string> = {
  frontend: "Follow the value the screen shows back through the state and the pure helpers that compute it; the view is usually only the messenger.",
  backend: "Follow the request through the handler, the validation and the service it calls; find the first step whose output disagrees with the report.",
  database: "Follow the data through the query or the repository code; compare the rows it returns with the rows the report expects.",
};

/**
 * How to work an incident, in order. The same five steps on every hunt — the
 * method is the lesson — with the tracing step worded for the layer.
 */
export function playbookOf(category: string, hasLogs: boolean): string[] {
  return [
    "Read the report: write down the expected behaviour and the actual one in a sentence each.",
    "Reproduce it: run the visible tests and find the failing check that matches the report.",
    hasLogs
      ? "Read the logs and the failing checks for the first value that is wrong — the earliest wrong value is nearer the cause than the loudest error."
      : "Read the failing checks for the first value that is wrong — the earliest wrong value is nearer the cause than the loudest error.",
    LAYER_STEP[category.toLowerCase()] ?? LAYER_STEP["backend"]!,
    "Fix the cause rather than the symptom, run the visible tests again, and submit against the hidden ones — then write the root cause down.",
  ];
}

export function incidentOf(hunt: { bugReport: string; difficulty: string; category: string; logs: string | null }): IncidentBrief {
  const t = ticketOf(hunt.bugReport);
  return {
    ticket: t?.ticket ?? null,
    priority: t?.priority ?? null,
    severity: severityOf(t?.priority ?? null, hunt.difficulty),
    reportedBy: t?.reportedBy ?? null,
    targetMins: Math.round(targetSecsOf(hunt.difficulty) / 60),
    playbook: playbookOf(hunt.category, Boolean(hunt.logs && hunt.logs.trim())),
  };
}

/** A symptom list as stored (BugChallenge.symptoms), made safe; null when there is none yet. */
export function symptomsOf(raw: unknown): Symptom[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Symptom[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o["name"] !== "string") continue;
    out.push({ name: o["name"], passed: o["passed"] === true, detail: typeof o["detail"] === "string" ? o["detail"] : "" });
  }
  return out;
}

export const SYMPTOM_DETAIL_CHARS = 300;

// ── The clock ─────────────────────────────────────────────────────

/** Past this, a start-to-fix span is a hunt left open, not a diagnosis — the same 3 h the problem workbench uses. */
export const DIAGNOSIS_WINDOW_SECS = 3 * 3600;

export interface Diagnosis {
  /** What the clock ran from: an incident started by hand, or the first open. */
  from: "incident" | "opened";
  startedAt: Date;
  /** The first accepted fix, or null while it is still open. */
  fixedAt: Date | null;
  /** Start → fix, seconds; null while open or when the span is longer than the window. */
  secs: number | null;
  targetSecs: number;
  /** Fixed inside the target. Null while open or untimed. */
  withinTarget: boolean | null;
  /** Submissions after the start up to and including the fix. */
  attempts: number;
}

/**
 * The diagnosis of one hunt for one account. The incident clock wins when it
 * was started before the first fix; otherwise the first open. Null with no
 * engagement row (the hunt was worked before engagements existed).
 */
export function diagnosisOf(
  engagement: { openedAt: Date; incidentAt: Date | null } | null,
  submissions: ReadonlyArray<{ verdict: string; submittedAt: Date }>,
  difficulty: string,
): Diagnosis | null {
  if (!engagement) return null;
  const ordered = [...submissions].sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  const fix = ordered.find((s) => s.verdict === "ACCEPTED") ?? null;
  const incident = engagement.incidentAt && (!fix || engagement.incidentAt.getTime() <= fix.submittedAt.getTime()) ? engagement.incidentAt : null;
  const startedAt = incident ?? engagement.openedAt;
  const targetSecs = targetSecsOf(difficulty);
  if (fix && fix.submittedAt.getTime() < startedAt.getTime()) {
    // Fixed before this browser's first recorded open (a fix from before engagements): untimed.
    return { from: "opened", startedAt, fixedAt: fix.submittedAt, secs: null, targetSecs, withinTarget: null, attempts: 0 };
  }
  const attempts = ordered.filter((s) => s.submittedAt.getTime() >= startedAt.getTime() && (!fix || s.submittedAt.getTime() <= fix.submittedAt.getTime())).length;
  if (!fix) return { from: incident ? "incident" : "opened", startedAt, fixedAt: null, secs: null, targetSecs, withinTarget: null, attempts };
  const span = Math.max(1, Math.round((fix.submittedAt.getTime() - startedAt.getTime()) / 1000));
  const secs = span <= DIAGNOSIS_WINDOW_SECS ? span : null;
  return { from: incident ? "incident" : "opened", startedAt, fixedAt: fix.submittedAt, secs, targetSecs, withinTarget: secs == null ? null : secs <= targetSecs, attempts };
}

// ── The patch ─────────────────────────────────────────────────────

export interface PatchLine {
  op: " " | "-" | "+";
  text: string;
}

export interface PatchHunk {
  /** 1-based first line of the hunk in the original and in the edit. */
  oldStart: number;
  newStart: number;
  lines: PatchLine[];
}

export interface FilePatch {
  file: string;
  hunks: PatchHunk[];
  added: number;
  removed: number;
  /** The file was too long to compare line by line; counts only. */
  tooLarge?: boolean;
}

export interface Patch {
  files: FilePatch[];
  added: number;
  removed: number;
}

/** Longest file compared line by line (LCS is m × n). The hunts' editable files run to ~200 lines. */
export const PATCH_MAX_LINES = 1_500;
const CONTEXT = 2;

const linesOf = (s: string) => s.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");

/** One file's line diff: the classic LCS table walked into hunks with two lines of context. */
export function diffLines(file: string, before: string, after: string): FilePatch | null {
  if (before === after) return null;
  const a = linesOf(before);
  const b = linesOf(after);
  if (a.length > PATCH_MAX_LINES || b.length > PATCH_MAX_LINES) {
    const setA = new Set(a);
    const setB = new Set(b);
    return { file, hunks: [], added: b.filter((l) => !setA.has(l)).length, removed: a.filter((l) => !setB.has(l)).length, tooLarge: true };
  }
  const n = a.length;
  const m = b.length;
  // lcs[i][j] = LCS length of a[i..] and b[j..], as one flat array.
  const w = m + 1;
  const lcs = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * w + j] = a[i] === b[j] ? lcs[(i + 1) * w + j + 1]! + 1 : Math.max(lcs[(i + 1) * w + j]!, lcs[i * w + j + 1]!);
    }
  }
  const ops: Array<PatchLine & { ai: number; bi: number }> = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) ops.push({ op: " ", text: a[i]!, ai: i++, bi: j++ });
    // On a tie the removal goes first, as `diff -u` writes a changed line: − then +.
    else if (i < n && (j >= m || lcs[(i + 1) * w + j]! >= lcs[i * w + j + 1]!)) ops.push({ op: "-", text: a[i]!, ai: i++, bi: j });
    else ops.push({ op: "+", text: b[j]!, ai: i, bi: j++ });
  }
  const hunks: PatchHunk[] = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k]!.op === " ") {
      k++;
      continue;
    }
    const start = Math.max(0, k - CONTEXT);
    let end = k;
    // Extend over changes and over context runs short enough to join two changes.
    while (end < ops.length) {
      if (ops[end]!.op !== " ") {
        end++;
        continue;
      }
      let run = end;
      while (run < ops.length && ops[run]!.op === " ") run++;
      if (run < ops.length && run - end <= CONTEXT * 2) end = run;
      else {
        end = Math.min(ops.length, end + CONTEXT);
        break;
      }
    }
    const slice = ops.slice(start, end);
    hunks.push({ oldStart: slice[0]!.ai + 1, newStart: slice[0]!.bi + 1, lines: slice.map(({ op, text }) => ({ op, text })) });
    k = end;
  }
  return {
    file,
    hunks,
    added: ops.filter((o) => o.op === "+").length,
    removed: ops.filter((o) => o.op === "-").length,
  };
}

/**
 * The hunter's patch: every editable file's change from the shipped content.
 * A locked file is never part of it — the judge reads those from the database.
 */
export function patchOf(original: ReadonlyArray<{ filePath: string; content: string; isEditable: boolean }>, edited: Record<string, unknown> | null | undefined): Patch {
  const files: FilePatch[] = [];
  for (const f of original) {
    if (!f.isEditable) continue;
    const next = edited && typeof edited[f.filePath] === "string" ? (edited[f.filePath] as string) : f.content;
    const d = diffLines(f.filePath, f.content, next);
    if (d) files.push(d);
  }
  return { files, added: files.reduce((n, f) => n + f.added, 0), removed: files.reduce((n, f) => n + f.removed, 0) };
}

/** A patch as unified-diff text, for a model to read; cut at `max` characters. */
export function patchText(patch: Patch, max = 6_000): string {
  const out: string[] = [];
  for (const f of patch.files) {
    out.push(`--- a/${f.file}`, `+++ b/${f.file}`);
    if (f.tooLarge) out.push(`(file too long to compare line by line: +${f.added} −${f.removed})`);
    for (const h of f.hunks) {
      out.push(`@@ -${h.oldStart} +${h.newStart} @@`);
      for (const l of h.lines) out.push(`${l.op}${l.text}`);
    }
  }
  const s = out.join("\n");
  return s.length > max ? `${s.slice(0, max)}\n… (cut at ${max} characters)` : s;
}
