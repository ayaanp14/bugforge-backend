import { RUNGS, TUTOR_LIMITS, fence, type ChatMessage, type Rung, type TutorTurnText } from "./tutor.js";
import { projectText } from "./bug-review.js";

/**
 * The tutor on a bug hunt (Phase 6 of ADAPTIVE_COACH.md, §14): the problem
 * tutor's ladder (lib/tutor.ts) with debugging's own rungs. Pure;
 * bug-tutor.test.ts.
 *
 * The rungs line up index for index with the problem ladder's — the same
 * help each counts as (none / hints / solution) and the same code policy —
 * so `rungFor`, `rungOf` and `codeGate(rung)` serve both unchanged, and the
 * skill profile reads a hunt's tutor help exactly as a problem's. What
 * changes is the method: a debugger reproduces, traces and locates before it
 * fixes.
 *
 * What the model reads grows with the rung, as on problems: the project's
 * files, the report, the logs and the shipped build's failing checks are
 * always there (the hunter sees all of them); the visible tests' sources
 * only from Locate. There is no stored fix — a hunt keeps its reference fix
 * in the seed scripts, never in the database — so from Fix plan up the model
 * works the fix out from the code, and says when it is unsure. A hidden
 * test is never read.
 */

type BugRung = Omit<Rung, "material"> & { material: { tests: boolean } };

const SAME = (i: number) => ({ help: RUNGS[i]!.help, code: RUNGS[i]!.code });

export const BUG_RUNGS: readonly BugRung[] = [
  {
    key: "questions",
    label: "Questions",
    ...SAME(0),
    material: { tests: false },
    may: "Ask one or two short questions that make the hunter state the symptom precisely — what the report expects, what actually happens, which check or log line shows it — and reflect their reasoning back.",
    mayNot: "name the file, function or line where the bug is; say what the bug is; drop a hint in passing, in brackets or under the word \"Hint\"; write code",
    ask: "I'm stuck on this incident. Can you help me think it through?",
  },
  {
    key: "reproduce",
    label: "Reproduce",
    ...SAME(1),
    material: { tests: false },
    may: "Help the hunter reproduce the bug: which failing check or log line matches the report, and the smallest input that shows it, worked through by hand.",
    mayNot: "name the faulty line or say what is wrong with it; write code",
    ask: "How do I reproduce this bug reliably?",
  },
  {
    key: "trace",
    label: "Trace",
    ...SAME(2),
    material: { tests: false },
    may: "Help the hunter trace the wrong value back through the files: which functions it passes through, and at which step to check whether it is still right.",
    mayNot: "name the faulty line or the fix; write code",
    ask: "Where should I look? Help me trace the wrong value back.",
  },
  {
    key: "locate",
    label: "Locate",
    ...SAME(3),
    material: { tests: true },
    may: "Point to where the bug lives — the file and the function, and what is wrong there in one sentence (the assumption or condition that fails) — and why it produces the reported symptom.",
    mayNot: "say how to fix it step by step; write code",
    ask: "Where exactly is the bug?",
  },
  {
    key: "plan",
    label: "Fix plan",
    ...SAME(4),
    material: { tests: true },
    may: "Lay the fix out as numbered steps in plain words or pseudocode, inside a ```text block: what to change, and what must stay as it is so nothing else breaks.",
    mayNot: "write code in a real programming language",
    ask: "Can you walk me through the fix in plain steps?",
  },
  {
    key: "outline",
    label: "Patch outline",
    ...SAME(5),
    material: { tests: true },
    may: "Show the function that needs changing in the project's language with the lines to change marked by TODO comments that say what each must do.",
    mayNot: "fill in the TODO lines or write the whole fix",
    ask: "Can you show me the shape of the patch?",
  },
  {
    key: "fix",
    label: "Fix",
    ...SAME(6),
    material: { tests: true },
    may: "Show the fix in the project's language and explain it, then the lesson: how to recognise this kind of bug next time, and a test that would have caught it.",
    mayNot: "rewrite files that do not need to change",
    ask: "Please show me the fix and explain it.",
  },
];

export const BUG_TOP_RUNG = BUG_RUNGS.length - 1;

export interface BugTutorContext {
  title: string;
  description: string;
  bugReport: string;
  logs: string | null;
  language: string;
  /** The project as shipped. */
  files: Array<{ filePath: string; content: string; isEditable: boolean }>;
  /** The shipped build's visible checks. */
  symptoms: Array<{ name: string; passed: boolean; detail: string }> | null;
  /** Visible tests' sources — read only from Locate up. Never a hidden one. */
  visibleTests: Array<{ name: string; source: string }>;
  rung: number;
  /** The hunter's edited files, when shared, as one text with file headers. */
  code: string | null;
  lastSubmission: { verdict: string; passed: number; total: number; headline: string | null; review: string | null } | null;
  history: TutorTurnText[];
  message: string;
  climbed?: boolean;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n… (cut at ${n} characters)` : s);
const rungAt = (n: number) => BUG_RUNGS[Math.min(Math.max(Math.trunc(n) || 0, 0), BUG_TOP_RUNG)]!;

/** The problem tutor's message order (stable first, fresh last), over a hunt. */
export function buildBugTutorMessages(ctx: BugTutorContext, system: string): ChatMessage[] {
  const rung = rungAt(ctx.rung);
  const index = BUG_RUNGS.indexOf(rung);
  const symptoms = (ctx.symptoms ?? []).map((s) => `- ${s.passed ? "PASS" : "FAIL"} ${s.name}${!s.passed && s.detail ? ` — ${clip(s.detail, 300)}` : ""}`).join("\n");
  const incident = [
    `Bug hunt: ${ctx.title} (${ctx.language})`,
    fence("BRIEFING", clip(ctx.description, TUTOR_LIMITS.statement)),
    fence("BUG REPORT", clip(ctx.bugReport, TUTOR_LIMITS.statement)),
    ctx.logs ? fence("LOGS", clip(ctx.logs, 2_000)) : "",
    symptoms ? fence("THE SHIPPED BUILD ON THE VISIBLE CHECKS", symptoms) : "",
    projectText(ctx.files),
  ]
    .filter(Boolean)
    .join("\n\n");

  const material = rung.material.tests && ctx.visibleTests.length
    ? fence("VISIBLE TESTS' SOURCE", ctx.visibleTests.map((t) => `// ${t.name}\n${clip(t.source, 1_500)}`).join("\n\n"))
    : "";
  const rungBlock = [
    `Current rung: ${index} of ${BUG_TOP_RUNG} — ${rung.label}.`,
    `At this rung you may: ${rung.may}`,
    `At this rung you must not: ${rung.mayNot}.`,
    material ? `Reference material for this rung (for you; quote it only as far as the rung allows):\n\n${material}` : "You have no reference material beyond the project at this rung.",
  ].join("\n");

  const history: ChatMessage[] = ctx.history.slice(-TUTOR_LIMITS.history).map((t) =>
    t.role === "student"
      ? { role: "user", content: clip(t.content, TUTOR_LIMITS.message) }
      : { role: "assistant", content: t.content.length > TUTOR_LIMITS.answerInHistory ? `${t.content.slice(0, TUTOR_LIMITS.answerInHistory)} …` : t.content },
  );

  const work: string[] = [];
  work.push(ctx.code && ctx.code.trim() ? fence("THEIR CURRENT EDITS (editable files, as shared with this message)", clip(ctx.code, TUTOR_LIMITS.code)) : "No edits were shared with this message; the files above are as shipped.");
  if (ctx.lastSubmission) {
    const s = ctx.lastSubmission;
    const lines = [`Last submission: ${s.verdict.toLowerCase()}, ${s.passed} of ${s.total} checks passed.`];
    if (s.headline) lines.push(`The judge's reading: ${s.headline}`);
    if (s.review) lines.push(`The review said: ${clip(s.review, 600)}`);
    work.push(fence("LAST SUBMISSION", lines.join("\n")));
  }

  return [
    { role: "system", content: system },
    { role: "system", content: incident },
    { role: "system", content: rungBlock },
    ...history,
    { role: "system", content: work.join("\n\n") },
    {
      role: "system",
      content:
        `Reminder — rung ${index}, ${rung.label}: you must not ${rung.mayNot}. Answer the hunter's message below at this rung.` +
        (ctx.climbed ? ` The hunter has just pressed "More help" to reach this rung: give this rung's help now — ${rung.may} — and only then hand the turn back.` : ""),
    },
    { role: "user", content: clip(ctx.message, TUTOR_LIMITS.message) },
  ];
}
