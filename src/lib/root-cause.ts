import { z } from "zod";
import { fenced, numbered } from "./submission-review.js";

/**
 * The postmortem of a fixed hunt (Phase 6 of ADAPTIVE_COACH.md, §14): the
 * hunter writes the root cause in their own words after an accepted fix, and
 * the model scores it against one fixed rubric. Pure — the call is
 * services/bug-coach.ts through lib/ai; root-cause.test.ts pins it.
 *
 * The ground truth is the hunter's own accepted patch: it passed every
 * hidden test, so it marks where the bug was. The model reads the shipped
 * files, that patch, the report and the logs, and the write-up — fenced and
 * flagged when it reads like instructions — and gives each criterion a
 * score the guard clamps to the criterion's points. The total is out of 100.
 *
 * The score teaches; it pays nothing. A hunt's PASS can be forged (CLAUDE.md,
 * Scoring integrity) and so can a write-up, so no XP, rating or badge reads it.
 */

export interface Criterion {
  key: "cause" | "mechanism" | "fix" | "prevention";
  label: string;
  max: number;
  /** What earns the points — said to the model, and shown beside the score. */
  asks: string;
}

export const RUBRIC: readonly Criterion[] = [
  { key: "cause", label: "Root cause", max: 4, asks: "Names the faulty step itself — the line, condition or assumption that is wrong — not the symptom it produced." },
  { key: "mechanism", label: "How it caused the symptoms", max: 3, asks: "Explains how that fault produced what the report and the logs show, for the reported input." },
  { key: "fix", label: "Why the fix works", max: 2, asks: "Says what the fix changes and why that removes the cause rather than hiding it." },
  { key: "prevention", label: "Prevention", max: 1, asks: "Names a test, check or practice that would have caught it or will stop it returning." },
];

export const RUBRIC_POINTS = RUBRIC.reduce((n, c) => n + c.max, 0);

export const ROOT_CAUSE_LIMITS = { min: 60, max: 2_000, prose: 3_000, logs: 1_500, file: 6_000, patch: 5_000 } as const;

/** The write-up as stored, or why it cannot be: too short to score, too long to read. */
export function validateRootCause(text: unknown): { text: string } | { error: string } {
  if (typeof text !== "string") return { error: "Write the root cause first." };
  const t = text.replace(/\r\n?/g, "\n").trim();
  if (t.length < ROOT_CAUSE_LIMITS.min) return { error: `Write at least ${ROOT_CAUSE_LIMITS.min} characters: what was wrong, how it caused the bug, and why your fix works.` };
  if (t.length > ROOT_CAUSE_LIMITS.max) return { error: `Keep it under ${ROOT_CAUSE_LIMITS.max.toLocaleString("en-US")} characters.` };
  return { text: t };
}

export interface RootCauseContext {
  title: string;
  bugReport: string;
  logs: string | null;
  /** The editable files as shipped (the bug is in these). */
  files: Array<{ filePath: string; content: string }>;
  /** The accepted patch as unified diff text. */
  patchText: string;
  writeUp: string;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n… (cut at ${n} characters)` : s);

export function buildRootCauseMessages(ctx: RootCauseContext, system: string): Array<{ role: "system" | "user"; content: string }> {
  const rubric = RUBRIC.map((c) => `- ${c.key} (0–${c.max}): ${c.asks}`).join("\n");
  return [
    { role: "system", content: `${system}\n\nThe rubric:\n${rubric}` },
    {
      role: "user",
      content: [
        fenced("INCIDENT", `# ${ctx.title}\n\n${clip(ctx.bugReport, ROOT_CAUSE_LIMITS.prose)}`),
        ctx.logs ? fenced("LOGS", clip(ctx.logs, ROOT_CAUSE_LIMITS.logs)) : "LOGS: none",
        ...ctx.files.map((f) => fenced(`SHIPPED FILE ${f.filePath}, lines numbered`, numbered(clip(f.content, ROOT_CAUSE_LIMITS.file)))),
        fenced("ACCEPTED PATCH (passes every hidden test)", clip(ctx.patchText || "(empty)", ROOT_CAUSE_LIMITS.patch)),
        fenced("WRITE-UP", ctx.writeUp),
        "Score the write-up now. Reply with the JSON object only.",
      ].join("\n\n"),
    },
  ];
}

// ── The answer ────────────────────────────────────────────────────

export const RootCauseSchema = z.object({
  criteria: z.array(z.object({ key: z.string(), score: z.number(), note: z.string() })),
  summary: z.string(),
  missed: z.array(z.string()),
  confidence: z.string(),
});
export type RawRootCause = z.infer<typeof RootCauseSchema>;

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

export function coerceRootCause(raw: unknown): unknown {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const criteria = Array.isArray(o["criteria"]) ? o["criteria"] : [];
  return {
    criteria: criteria.map((c) => {
      const r = (c ?? {}) as Record<string, unknown>;
      const score = typeof r["score"] === "number" ? r["score"] : typeof r["score"] === "string" && /^-?\d+(\.\d+)?$/.test(r["score"]) ? Number(r["score"]) : 0;
      return { key: str(r["key"]), score, note: str(r["note"]) };
    }),
    summary: str(o["summary"]),
    missed: (Array.isArray(o["missed"]) ? o["missed"] : []).map(str),
    confidence: str(o["confidence"]),
  };
}

export interface RootCauseReview {
  criteria: Array<{ key: Criterion["key"]; label: string; score: number; max: number; note: string }>;
  summary: string;
  missed: string[];
  confidence: "low" | "medium" | "high";
  /** 0–100. */
  score: number;
}

const tidy = (text: string, max: number): string => {
  const s = text.replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

/**
 * Every criterion, in the rubric's order, its score a whole number within
 * its points — a criterion the model skipped scores 0 ("Not addressed."),
 * one it invented is dropped. Null when nothing was scored.
 */
export function guardRootCause(raw: RawRootCause): RootCauseReview | null {
  const given = new Map(raw.criteria.map((c) => [c.key.trim().toLowerCase(), c]));
  if (!RUBRIC.some((c) => given.has(c.key))) return null;
  const criteria = RUBRIC.map((c) => {
    const r = given.get(c.key);
    const score = r && Number.isFinite(r.score) ? Math.min(c.max, Math.max(0, Math.round(r.score))) : 0;
    return { key: c.key, label: c.label, score, max: c.max, note: r ? tidy(r.note, 240) || (score ? "" : "Not addressed.") : "Not addressed." };
  });
  const points = criteria.reduce((n, c) => n + c.score, 0);
  return {
    criteria,
    summary: tidy(raw.summary, 360),
    missed: raw.missed.map((m) => tidy(m, 200)).filter(Boolean).slice(0, 3),
    confidence: (["low", "medium", "high"] as const).find((c) => c === raw.confidence.trim().toLowerCase()) ?? "low",
    score: Math.round((points / RUBRIC_POINTS) * 100),
  };
}
