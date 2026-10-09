import { readError, type Finding } from "./failure-analysis.js";
import type { Patch, Symptom } from "./bug-incident.js";

/**
 * "Why it failed" for a bug hunt, the part that needs no model (Phase 6 of
 * ADAPTIVE_COACH.md, §14) — lib/failure-analysis.ts's twin for a project
 * judged by its tests rather than by cases. Pure; bug-failure.test.ts.
 *
 * It reads three things the server already holds: the judge's per-test
 * result (the visible tests' failure text, which the workspace prints too;
 * a hidden test only by name — the route never sends more), the patch the
 * hunter made (lib/bug-incident patchOf), and what the *shipped* build did on
 * the visible tests (BugChallenge.symptoms). The last makes one thing a fact
 * that no other layer can see: a check that passed before the patch and fails
 * after it is a regression the patch caused.
 *
 * Every sentence is a fact the judge reported, or an inference labelled as
 * one. Never a hidden test's input, expected value or code.
 */

export const BUG_CATEGORIES = [
  "UNCHANGED",
  "SYNTAX",
  "REGRESSION",
  "IMPLEMENTATION",
  "INCOMPLETE_FIX",
  "EDGE_CASE",
  "SYMPTOM_PATCH",
  "WRONG_LOCATION",
  "MISREAD_REPORT",
  "CONCEPTUAL",
] as const;
export type BugCategory = (typeof BUG_CATEGORIES)[number];

export interface BugCheck {
  name: string;
  passed: boolean;
  /** The judge's failure text — "Hidden test failed" for a hidden one, as the route sends it. */
  detail: string;
  hidden: boolean;
}

export interface BugFailureInput {
  verdict: string;
  checks: BugCheck[];
  patch: Patch;
  /** The shipped build's visible results, or null when not recorded yet. */
  symptoms: Symptom[] | null;
}

export interface BugDeterministic {
  category: BugCategory;
  headline: string;
  findings: Finding[];
  checks: BugCheck[];
  patch: { files: string[]; added: number; removed: number };
  /** Visible checks the shipped build passed and the patch broke. */
  regressions: string[];
  /** Visible checks the shipped build failed and the patch fixed. */
  fixed: string[];
}

const HEADLINE: Record<BugCategory, string> = {
  UNCHANGED: "Nothing was changed: this is the code as shipped",
  SYNTAX: "The project did not compile or load",
  REGRESSION: "The patch broke a check that used to pass",
  IMPLEMENTATION: "The patched code crashes",
  INCOMPLETE_FIX: "Part of the bug is fixed, part is still there",
  EDGE_CASE: "The visible checks pass; a hidden one does not",
  SYMPTOM_PATCH: "The patch hides the symptom rather than fixing the cause",
  WRONG_LOCATION: "The change is not where the bug is",
  MISREAD_REPORT: "The fix answers a different problem than the report",
  CONCEPTUAL: "The checks that matter still fail",
};

export const headlineOf = (c: BugCategory) => HEADLINE[c];

const quote = (s: string, n = 200) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** "expected 69.12 but got -1.28" — the assertion helpers' own wording in all three languages. */
const WRONG_VALUE = /expected (.{1,80}?) but got (.{1,80})$/i;

export function analyzeBugFailure(input: BugFailureInput): BugDeterministic {
  const failing = input.checks.filter((c) => !c.passed);
  const visibleFailing = failing.filter((c) => !c.hidden);
  const hiddenFailing = failing.filter((c) => c.hidden);
  const before = new Map((input.symptoms ?? []).map((s) => [s.name, s.passed]));
  const regressions = input.checks.filter((c) => !c.hidden && !c.passed && before.get(c.name) === true).map((c) => c.name);
  const fixed = input.checks.filter((c) => !c.hidden && c.passed && before.get(c.name) === false).map((c) => c.name);
  const crashes = visibleFailing.map((c) => ({ c, read: readError(c.detail) })).filter((x) => x.read.kind && !WRONG_VALUE.test(x.c.detail));
  const unchanged = input.patch.files.length === 0;

  const category: BugCategory = unchanged
    ? "UNCHANGED"
    : input.verdict === "ERROR"
      ? "SYNTAX"
      : regressions.length > 0
        ? "REGRESSION"
        : crashes.length > 0
          ? "IMPLEMENTATION"
          : visibleFailing.length === 0 && hiddenFailing.length > 0
            ? "EDGE_CASE"
            : fixed.length > 0
              ? "INCOMPLETE_FIX"
              : "CONCEPTUAL";

  const findings: Finding[] = [];
  const total = input.checks.length;
  const passed = total - failing.length;
  findings.push({ kind: "fact", text: `${passed} of ${total} checks pass${hiddenFailing.length ? `, and ${hiddenFailing.length} hidden ${hiddenFailing.length === 1 ? "check fails" : "checks fail"}` : ""}.` });
  if (unchanged) {
    findings.push({ kind: "fact", text: "No editable file differs from the shipped code, so the judge ran the bug as reported." });
    findings.push({ kind: "suggestion", text: "Run the visible tests first and start from the check that matches the bug report." });
  } else {
    findings.push({
      kind: "fact",
      text: `The patch changes ${input.patch.files.length === 1 ? "one file" : `${input.patch.files.length} files`} (+${input.patch.added} −${input.patch.removed} lines).`,
    });
  }
  for (const name of regressions.slice(0, 2)) {
    findings.push({ kind: "fact", text: `"${quote(name, 80)}" passed on the shipped build and fails with this patch.` });
  }
  if (fixed.length && !unchanged) findings.push({ kind: "fact", text: `The patch fixed ${fixed.length === 1 ? `"${quote(fixed[0]!, 80)}"` : `${fixed.length} checks that failed before`}.` });
  for (const c of visibleFailing.slice(0, 3)) {
    if (regressions.includes(c.name)) continue;
    findings.push({ kind: "fact", text: `"${quote(c.name, 80)}" fails: ${quote(c.detail || "no detail")}` });
  }
  if (category === "SYNTAX") {
    const first = failing.find((c) => c.detail)?.detail ?? "";
    findings.push({ kind: "inference", text: `The files must load before any check can run; the first error says: ${quote(first || "no output")}.` });
  } else if (crashes.length) {
    const r = crashes[0]!.read;
    findings.push({ kind: "inference", text: `${r.kind}: ${r.hint ?? "the patched code throws before the check can compare a value."}` });
  } else if (visibleFailing.some((c) => WRONG_VALUE.test(c.detail))) {
    findings.push({ kind: "inference", text: "A check got a value but the wrong one: follow that value back to where it is first computed." });
  }
  if (category === "EDGE_CASE") {
    findings.push({ kind: "suggestion", text: "The reported case works now. Look for the same mistake on the inputs the visible checks do not try — empty, zero, negative, repeated or boundary values." });
  }
  if (category === "REGRESSION") {
    findings.push({ kind: "suggestion", text: "Undo the part of the patch that the broken check depends on, and make the fix narrower: change the faulty step, not the behaviour around it." });
  }

  return {
    category,
    headline: HEADLINE[category],
    findings: findings.slice(0, 7),
    checks: input.checks.map((c) => ({ ...c, detail: quote(c.detail, 300) })),
    patch: { files: input.patch.files.map((f) => f.file), added: input.patch.added, removed: input.patch.removed },
    regressions,
    fixed,
  };
}
