import { z } from "zod";
import { fenced, numbered, stripCode, LIMITS } from "./submission-review.js";

/**
 * "Roast my code" — the Code Review tab's playful twin of the review
 * (2026-11-27, the owner's ask: a fun, Gen Z feature that still teaches).
 * Pure: the call is services/submission-analysis.ts `roastFor` through lib/ai.
 *
 * It is the same failed submission read by the same model, asked for two or
 * three sentences in internet slang — English, or Hinglish for the Indian
 * students most of the members are — plus one fix in words. It roasts the
 * code, never the person: the prompt says so, and `guardRoast` masks the
 * words no prompt can be trusted to keep out. Like the review it hands over
 * no solution (`stripCode`), sees no hidden test, and never runs in ranked
 * play (the analysis row's reason says contest/duel; the service refuses).
 *
 * The "cooked meter" is not the model's: it is computed from the judge's
 * counts here, so the number a student screenshots is the judge's truth.
 */

export const ROAST_STYLES = ["english", "hinglish"] as const;
export type RoastStyle = (typeof ROAST_STYLES)[number];

export const isRoastStyle = (v: unknown): v is RoastStyle => typeof v === "string" && (ROAST_STYLES as readonly string[]).includes(v);

export interface RoastContext {
  title: string;
  statement: string;
  code: string;
  language: string;
  verdict: string;
  passedCases: number;
  totalCases: number;
  /** The judge-derived headline (lib/failure-analysis), and the review's summary when it is written. */
  headline: string | null;
  /** `cookedLevel` — handed to the model so the joke's heat matches the meter printed above it. */
  cooked: number;
  reviewSummary: string | null;
}

/**
 * How cooked, 1–10, from the judge alone. Nothing compiled or ran is 10; a
 * wrong answer scales with the share of cases failed; a time limit with most
 * cases through is "the logic ate, the speed didn't" — the middle of the dial.
 */
export function cookedLevel(verdict: string, passed: number, total: number): number {
  const v = verdict.toUpperCase();
  if (v === "COMPILE_ERROR" || v === "COMPILATION_ERROR" || v === "SYNTAX_ERROR") return 10;
  const share = total > 0 ? Math.max(0, Math.min(1, passed / total)) : 0;
  let level = Math.round(10 - share * 9); // 0 passed → 10, all but one → ~1–2
  if (v.includes("TIME_LIMIT")) level = Math.min(level, 7);
  if (v.includes("RUNTIME")) level = Math.max(level, 5);
  return Math.max(1, Math.min(10, level));
}

export function buildRoastMessages(ctx: RoastContext, system: string, style: RoastStyle): Array<{ role: "system" | "user"; content: string }> {
  const judge = [
    `Verdict: ${ctx.verdict}`,
    `Hidden test cases passed: ${ctx.passedCases} of ${ctx.totalCases}`,
    `Language: ${ctx.language}`,
    `Cooked meter (from the judge's counts): ${ctx.cooked}/10`,
    ctx.headline ? `What the judge's report says: ${ctx.headline}` : null,
    ctx.reviewSummary ? `What the code review found: ${ctx.reviewSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n… (cut)` : s);
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        fenced("PROBLEM", `# ${ctx.title}\n\n${clip(ctx.statement, LIMITS.statement)}`),
        fenced("CODE", numbered(clip(ctx.code, LIMITS.code))),
        fenced("JUDGE", judge),
        `Style: ${style === "hinglish" ? "Hinglish (Hindi and English mixed, written in Roman letters)" : "English internet slang"}.`,
        "Roast this submission now. Reply with the JSON object only.",
      ].join("\n\n"),
    },
  ];
}

export const RoastSchema = z.object({ roast: z.string(), fix: z.string() });
export type RawRoast = z.infer<typeof RoastSchema>;

export function coerceRoast(raw: unknown): unknown {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  return { roast: s(o["roast"] ?? o["text"]), fix: s(o["fix"] ?? o["tip"] ?? o["nextStep"]) };
}

export interface Roast {
  style: RoastStyle;
  text: string;
  fix: string;
  cooked: number;
  promptVersion: number;
  createdAt: string;
}

/**
 * Words a roast never carries, whatever the model wrote: English and Hindi
 * abuse a student would not want screenshotted beside their name. Masked,
 * not refused — the rest of the roast is usually fine — and the prompt is
 * the first line of defence; this is the backstop.
 */
const ABUSE = /\b(f+u+c+k\w*|sh[i1]t\w*|b[i1]tch\w*|bastard\w*|asshole\w*|dumbass|retard\w*|idiot\w*|stupid|moron\w*|loser\w*|ugly|chutiy\w*|madarchod\w*|bhenchod\w*|behenchod\w*|bc|mc|gandu\w*|randi\w*|harami\w*|kutt[ae]\w*|kamine?\w*|saala|saali|bewakoof\w*|ullu)\b/gi;

export const maskAbuse = (text: string): string => text.replace(ABUSE, "🤐");

const MAX_ROAST = 480;
const MAX_FIX = 240;

const tidy = (text: string, max: number): string => {
  const s = maskAbuse(stripCode(text)).replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

/** Hold the model's answer to the rules; null when nothing usable came back. */
export function guardRoast(raw: RawRoast, meta: { style: RoastStyle; cooked: number; promptVersion: number; now?: Date }): Roast | null {
  const text = tidy(raw.roast, MAX_ROAST);
  if (text.length < 12) return null;
  return {
    style: meta.style,
    text,
    fix: tidy(raw.fix, MAX_FIX),
    cooked: meta.cooked,
    promptVersion: meta.promptVersion,
    createdAt: (meta.now ?? new Date()).toISOString(),
  };
}

/** The stored roasts on an analysis row: one per style, written on demand. */
export type RoastSet = Partial<Record<RoastStyle, Roast>>;

export function roastSetOf(raw: unknown): RoastSet {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: RoastSet = {};
  for (const style of ROAST_STYLES) {
    const r = (raw as Record<string, unknown>)[style] as Roast | undefined;
    if (r && typeof r.text === "string") out[style] = r;
  }
  return out;
}
