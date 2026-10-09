import { z } from "zod";
import type { Finding } from "./failure-analysis.js";
import { BUG_CATEGORIES, type BugCategory, type BugDeterministic } from "./bug-failure.js";
import { fenced, numbered, stripCode } from "./submission-review.js";

/**
 * The model's half of "Why it failed" on a bug hunt (Phase 6): what it is
 * given, the shape it answers in, and what is done to the answer. Pure — the
 * call is services/bug-coach.ts through lib/ai. lib/submission-review.ts's
 * rules, applied to a project:
 *
 *  - in: the briefing, the report and the logs, every file as the hunter
 *    submitted it (editable ones numbered, locked ones as context), the
 *    patch, the checks as the workspace showed them (a hidden check by name
 *    only — `detail` is the route's "Hidden test failed") and the facts the
 *    deterministic layer established. No test's source, so no hidden input
 *    or expected value can reach the model: the builder has no parameter
 *    that could carry one (bug-review.test.ts pins it).
 *  - out: a finding is kept with its file and line only when that editable
 *    file has that line; code longer than a line is cut; a model "fact"
 *    becomes an inference; at most four findings.
 */

export interface BugReviewContext {
  title: string;
  description: string;
  bugReport: string;
  logs: string | null;
  language: string;
  /** The project as submitted: editable files with the hunter's content, locked ones as shipped. */
  files: Array<{ filePath: string; content: string; isEditable: boolean }>;
  patchText: string;
  verdict: string;
  known: BugDeterministic;
}

export const BUG_REVIEW_LIMITS = { prose: 4_000, logs: 2_000, editable: 9_000, locked: 3_000, lockedTotal: 8_000, patch: 5_000, detail: 300 } as const;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n… (cut at ${n} characters)` : s);

/** The project as the model reads it: editable files numbered (findings cite them), locked ones as plain context, within a budget. */
export function projectText(files: BugReviewContext["files"]): string {
  const editable = files
    .filter((f) => f.isEditable)
    .map((f) => fenced(`EDITABLE FILE ${f.filePath}, lines numbered`, numbered(clip(f.content, BUG_REVIEW_LIMITS.editable))));
  let budget = BUG_REVIEW_LIMITS.lockedTotal;
  const locked: string[] = [];
  for (const f of files.filter((x) => !x.isEditable)) {
    if (budget <= 0) {
      locked.push(`(locked file ${f.filePath} left out for length)`);
      continue;
    }
    const body = clip(f.content, Math.min(BUG_REVIEW_LIMITS.locked, budget));
    budget -= body.length;
    locked.push(fenced(`LOCKED FILE ${f.filePath} (read-only context, not the bug)`, body));
  }
  return [...editable, ...locked].join("\n\n");
}

export function buildBugReviewMessages(ctx: BugReviewContext, system: string): Array<{ role: "system" | "user"; content: string }> {
  const checks = ctx.known.checks
    .map((c) => `- ${c.passed ? "PASS" : "FAIL"}${c.hidden ? " (hidden)" : ""} ${c.name}${!c.passed && !c.hidden && c.detail ? ` — ${clip(c.detail, BUG_REVIEW_LIMITS.detail)}` : ""}`)
    .join("\n");
  const known = ctx.known.findings.map((f) => `- (${f.kind}) ${f.text}`).join("\n");
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        fenced("INCIDENT", `# ${ctx.title}\n\n${clip(ctx.description, BUG_REVIEW_LIMITS.prose)}\n\n## Bug report\n\n${clip(ctx.bugReport, BUG_REVIEW_LIMITS.prose)}`),
        ctx.logs ? fenced("LOGS", clip(ctx.logs, BUG_REVIEW_LIMITS.logs)) : "LOGS: none",
        projectText(ctx.files),
        fenced("PATCH", ctx.patchText || "(no change from the shipped code)"),
        fenced("JUDGE", `Verdict: ${ctx.verdict}\nLanguage: ${ctx.language}\nChecks:\n${checks}`),
        fenced("KNOWN", known || "nothing beyond the verdict"),
        "Review this fix attempt now. Reply with the JSON object only.",
      ].join("\n\n"),
    },
  ];
}

// ── The answer ────────────────────────────────────────────────────

export const BugReviewSchema = z.object({
  summary: z.string(),
  category: z.string(),
  findings: z.array(z.object({ kind: z.string(), text: z.string(), file: z.string().nullable().optional(), line: z.number().nullable().optional() })),
  nextStep: z.string(),
  confidence: z.string(),
});
export type RawBugReview = z.infer<typeof BugReviewSchema>;

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

export function coerceBugReview(raw: unknown): unknown {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const findings = Array.isArray(o["findings"]) ? o["findings"] : [];
  return {
    summary: str(o["summary"]),
    category: str(o["category"]),
    findings: findings.map((f) => {
      if (typeof f === "string") return { kind: "inference", text: f, file: null, line: null };
      const r = (f ?? {}) as Record<string, unknown>;
      const line = typeof r["line"] === "number" ? r["line"] : typeof r["line"] === "string" && /^\d+$/.test(r["line"]) ? Number(r["line"]) : null;
      return { kind: str(r["kind"]), text: str(r["text"]), file: typeof r["file"] === "string" ? r["file"] : null, line };
    }),
    nextStep: str(o["nextStep"] ?? o["next_step"]),
    confidence: str(o["confidence"]),
  };
}

export interface BugFinding extends Finding {
  file?: string | null;
}

export interface BugAiReview {
  summary: string;
  category: BugCategory;
  findings: BugFinding[];
  nextStep: string;
  confidence: "low" | "medium" | "high";
}

const tidy = (text: string, max = 420): string => {
  const s = stripCode(text).replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

/**
 * Hold the model's answer to the rules. A file is kept only when it is one
 * of the editable files (the bug is never in a locked one), a line only when
 * that file has it; the category from the known list, else the verdict's own.
 */
export function guardBugReview(raw: RawBugReview, ctx: Pick<BugReviewContext, "files" | "known">): BugAiReview | null {
  const lengths = new Map(ctx.files.filter((f) => f.isEditable).map((f) => [f.filePath, f.content.replace(/\r\n?/g, "\n").split("\n").length]));
  const cat = raw.category.trim().toUpperCase();
  const category = (BUG_CATEGORIES as readonly string[]).includes(cat) ? (cat as BugCategory) : ctx.known.category;
  const findings: BugFinding[] = raw.findings
    .map((f) => {
      const file = f.file && lengths.has(f.file.trim()) ? f.file.trim() : null;
      const max = file ? lengths.get(file)! : 0;
      const line = file && f.line != null && Number.isInteger(f.line) && f.line >= 1 && f.line <= max ? f.line : null;
      return { kind: (f.kind.trim().toLowerCase() === "suggestion" ? "suggestion" : "inference") as Finding["kind"], text: tidy(f.text), file, line };
    })
    .filter((f) => f.text.length > 0)
    .slice(0, 4);
  const summary = tidy(raw.summary, 360);
  if (!summary && findings.length === 0) return null;
  return {
    summary,
    category,
    findings,
    nextStep: tidy(raw.nextStep, 280),
    confidence: (["low", "medium", "high"] as const).find((c) => c === raw.confidence.trim().toLowerCase()) ?? "low",
  };
}
