/**
 * The Socratic tutor's rules (Phase 4 of ADAPTIVE_COACH.md), pure: the
 * ladder of help, what each rung lets the tutor say and read, the messages
 * the model is handed, and the gate that holds code back while the answer
 * streams. services/tutor.ts does the I/O around it.
 *
 * The ladder is the whole design. A student asks; the tutor answers at the
 * rung they are on and never above it. Climbing is the student's act — the
 * "More help" button — and one rung at a time, because the point is to find
 * how little help gets them moving. A rung, once reached, stays: what was
 * shown cannot be unseen, and the skill profile counts it (`help`).
 *
 * What the model may *read* grows with the rung too: the problem's own hints
 * only from Hint, the editorial only from Pseudocode, a reference solution
 * only from Structure. A model told "don't reveal the trick" while holding
 * the trick leaks it; one that has not been given it cannot.
 */

export type TutorHelp = "none" | "hints" | "solution";

/** What a rung lets through the code gate: nothing, plain-text steps, or code. */
export type CodePolicy = "none" | "pseudocode" | "code";

export interface Rung {
  key: string;
  label: string;
  /** How the skill profile counts reaching it (lib/skill-score's assist levels). */
  help: TutorHelp;
  code: CodePolicy;
  /** What the model is given to read at this rung. */
  material: { hints: boolean; editorial: boolean; solution: boolean };
  /** What the tutor may do — said to the model. */
  may: string;
  /** What it must not — said to the model, twice (see buildTutorMessages). */
  mayNot: string;
  /** The student's line when they climb to it without writing anything. */
  ask: string;
}

const NONE = { hints: false, editorial: false, solution: false };

export const RUNGS: readonly Rung[] = [
  {
    key: "questions",
    label: "Questions",
    help: "none",
    code: "none",
    material: NONE,
    may: "Ask one or two short guiding questions that let the student find the next step themselves — what the input and output mean, what a small example gives, what their code does on it — and reflect their own reasoning back to them.",
    // "(Hint: think about what number would pair with the current one)" came
    // back at this rung on Two Sum (2026-10-07): the answer the rung withholds,
    // dropped in an aside. Asides are named, and so is the word.
    mayNot: "name a technique, algorithm or data structure the problem needs; describe an approach; state a complexity target; drop a hint in passing, in brackets or under the word \"Hint\"; write code",
    ask: "I'm stuck. Can you help me think it through?",
  },
  {
    key: "approach",
    label: "Approach",
    help: "hints",
    code: "none",
    material: NONE,
    may: "Help the student reach a correct approach, slow is fine — the brute force: what to try for every candidate and why that is correct. A question first where a question will do.",
    mayNot: "give the efficient idea or name the technique behind it, even in passing or in brackets; write code",
    ask: "Can you help me find an approach that works, even a slow one?",
  },
  {
    key: "complexity",
    label: "Complexity",
    help: "hints",
    code: "none",
    material: NONE,
    may: "Work out with the student the time complexity of their current (or brute-force) approach, what the constraints allow — about 10^8 simple steps in a second — and which part of the work is repeated.",
    mayNot: "name the technique or data structure that removes the repeated work, even in passing or in brackets; write code",
    ask: "Is my approach fast enough? What do the constraints need?",
  },
  {
    key: "hint",
    label: "Hint",
    help: "hints",
    code: "none",
    material: { hints: true, editorial: false, solution: false },
    may: "Give one hint: the key observation, or the technique or data structure that fits, and why it fits this problem. The problem's own hints are in the reference below — build on them rather than past them.",
    mayNot: "lay the algorithm out step by step; write code",
    ask: "Can I have a hint?",
  },
  {
    key: "pseudocode",
    label: "Pseudocode",
    help: "solution",
    code: "pseudocode",
    material: { hints: true, editorial: true, solution: false },
    may: "Lay the algorithm out as numbered steps in plain words or pseudocode, inside a ```text block, saying what each step keeps track of.",
    mayNot: "write code in a real programming language",
    ask: "Can you walk me through the steps in pseudocode?",
  },
  {
    key: "structure",
    label: "Structure",
    help: "solution",
    code: "code",
    material: { hints: true, editorial: true, solution: true },
    may: "Give a code skeleton in the student's language: the function, the data structures and the loops, with the key lines left as TODO comments that say what each must do.",
    mayNot: "fill in the TODO lines or write the complete solution",
    ask: "Can you show me how the code should be structured?",
  },
  {
    key: "solution",
    label: "Solution",
    help: "solution",
    code: "code",
    material: { hints: true, editorial: true, solution: true },
    may: "Explain the full solution and show it in the student's language, then what to take away: the idea to remember and how to recognise the pattern next time.",
    mayNot: "pretend the reference is the only correct answer — the student's own working variant is fine",
    ask: "Please show me the full solution and explain it.",
  },
];

export const TOP_RUNG = RUNGS.length - 1;

/** A stored or requested rung, made safe. */
export const rungOf = (n: unknown): number => (typeof n === "number" && Number.isInteger(n) ? Math.min(Math.max(n, 0), TOP_RUNG) : 0);

/**
 * The rung a message is answered at: the one reached, or the next when the
 * student climbs. Anything else — skipping ahead, or a lower rung (what was
 * shown stays shown) — is refused by the caller.
 */
export function rungFor(reached: number, requested: number | null | undefined): { rung: number; climbed: boolean } | null {
  if (requested == null || requested === reached) return { rung: reached, climbed: false };
  if (requested === reached + 1 && requested <= TOP_RUNG) return { rung: requested, climbed: true };
  return null;
}

export const TUTOR_LIMITS = {
  message: 2_000,
  code: 12_000,
  statement: 6_000,
  example: 600,
  examples: 3,
  history: 12,
  /** An earlier answer, as it is handed back: enough to stay consistent, not the whole thing again. */
  answerInHistory: 900,
  hint: 500,
  editorial: 6_000,
  solution: 8_000,
} as const;

// ── The messages ─────────────────────────────────────────────────────

export interface TutorTurnText {
  role: "student" | "tutor";
  content: string;
}

export interface TutorContext {
  title: string;
  statement: string;
  /** Visible examples only. The hidden cases are never read by the service. */
  examples: Array<{ input: string; output: string }>;
  rung: number;
  hints: string[];
  editorial: string | null;
  /** A reference solution in the student's language (or the nearest there is). */
  solution: { language: string; code: string } | null;
  code: string | null;
  language: string | null;
  lastSubmission: { verdict: string; passed: number; total: number; headline: string | null; review: string | null } | null;
  history: TutorTurnText[];
  message: string;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n… (cut at ${n} characters)` : s);

/**
 * Data, fenced and labelled — the submission review's rule (lib/submission-review
 * fenced): words for markers, only the block's own end marker neutralised.
 */
export function fence(label: string, text: string): string {
  const end = `=== END ${label} ===`;
  return `=== BEGIN ${label} ===\n${text.split(end).join(`=== END ${label} (quoted) ===`)}\n${end}`;
}

const numberedLines = (code: string): string => {
  const lines = code.replace(/\r\n?/g, "\n").split("\n");
  const width = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(width)}| ${l}`).join("\n");
};

/**
 * Stable first, fresh last — the prefix a cache upstream can reuse is the
 * system prompt and the problem, which do not change between turns; the
 * rung's block changes only on a climb. The student's code goes after the
 * history because it changes every turn, and the rung's limits are said once
 * more right before the message: with reasoning off the model weighs what it
 * read last (the assistant's SCOPE_REMINDER, measured).
 */
export function buildTutorMessages(ctx: TutorContext, system: string): ChatMessage[] {
  const rung = RUNGS[rungOf(ctx.rung)]!;
  const examples = ctx.examples
    .slice(0, TUTOR_LIMITS.examples)
    .map((e, i) => `Example ${i + 1}\nInput: ${clip(e.input, TUTOR_LIMITS.example)}\nExpected output: ${clip(e.output, TUTOR_LIMITS.example)}`)
    .join("\n\n");
  const problem = [
    `Problem: ${ctx.title}`,
    fence("STATEMENT", clip(ctx.statement, TUTOR_LIMITS.statement)),
    examples ? fence("VISIBLE EXAMPLES", examples) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const material: string[] = [];
  if (rung.material.hints && ctx.hints.length) {
    material.push(fence("THE PROBLEM'S HINTS", ctx.hints.map((h, i) => `${i + 1}. ${clip(h, TUTOR_LIMITS.hint)}`).join("\n")));
  }
  if (rung.material.editorial && ctx.editorial) material.push(fence("EDITORIAL", clip(ctx.editorial, TUTOR_LIMITS.editorial)));
  if (rung.material.solution && ctx.solution) {
    material.push(fence(`REFERENCE SOLUTION (${ctx.solution.language})`, clip(ctx.solution.code, TUTOR_LIMITS.solution)));
  }
  const rungBlock = [
    `Current rung: ${rungOf(ctx.rung)} of ${TOP_RUNG} — ${rung.label}.`,
    `At this rung you may: ${rung.may}`,
    `At this rung you must not: ${rung.mayNot}.`,
    material.length ? `Reference material for this rung (for you; quote it only as far as the rung allows):\n\n${material.join("\n\n")}` : "You have no reference material at this rung: the statement, the examples and the student's own work are all you need.",
  ].join("\n");

  const history: ChatMessage[] = ctx.history.slice(-TUTOR_LIMITS.history).map((t) =>
    t.role === "student"
      ? { role: "user", content: clip(t.content, TUTOR_LIMITS.message) }
      : { role: "assistant", content: t.content.length > TUTOR_LIMITS.answerInHistory ? `${t.content.slice(0, TUTOR_LIMITS.answerInHistory)} …` : t.content },
  );

  const work: string[] = [];
  if (ctx.code && ctx.code.trim()) {
    work.push(fence(`STUDENT'S CODE${ctx.language ? ` (${ctx.language})` : ""}, lines numbered`, numberedLines(clip(ctx.code, TUTOR_LIMITS.code))));
  } else {
    work.push("The student has not shared code with this message.");
  }
  if (ctx.lastSubmission) {
    const s = ctx.lastSubmission;
    const lines = [`Last submission: ${s.verdict.replace(/_/g, " ").toLowerCase()}, ${s.passed} of ${s.total} cases passed.`];
    if (s.headline) lines.push(`The judge's reading: ${s.headline}`);
    if (s.review) lines.push(`The code review said: ${clip(s.review, 600)}`);
    work.push(fence("LAST SUBMISSION", lines.join("\n")));
  }

  return [
    { role: "system", content: system },
    { role: "system", content: problem },
    { role: "system", content: rungBlock },
    ...history,
    { role: "system", content: work.join("\n\n") },
    { role: "system", content: `Reminder — rung ${rungOf(ctx.rung)}, ${rung.label}: you must not ${rung.mayNot}. Answer the student's message below at this rung.` },
    { role: "user", content: clip(ctx.message, TUTOR_LIMITS.message) },
  ];
}

// ── The code gate ────────────────────────────────────────────────────

/** Said in place of a fenced block a rung does not allow. */
export const HELD_BACK = "*(Code held back at this rung. Ask for more help to see the structure.)*";

/** Fence info strings that read as steps, not code — the only ones Pseudocode lets through. */
const PLAIN_FENCES = new Set(["text", "pseudo", "pseudocode", "plaintext", "txt"]);

/**
 * A streaming filter over the tutor's Markdown: fenced blocks a rung does not
 * allow are replaced by one line saying so, as the answer arrives — the
 * prompt asks for no code below Pseudocode, and this makes it so. Text
 * outside a fence streams through at once; only the start of a line is held
 * back, and only while it could still be a fence (` ``` ` after up to three
 * spaces), so a paragraph never waits for its own end.
 *
 * Code at the Structure and Solution rungs passes untouched. Pseudocode lets
 * through only blocks tagged as plain text (`text`, `pseudocode` …): a Python
 * block there is code whatever the model called it.
 */
export function codeGate(rung: number): { push(text: string): string; end(): string } {
  const policy = RUNGS[rungOf(rung)]!.code;
  if (policy === "code") return { push: (t) => t, end: () => "" };

  let lineStart: string | null = ""; // the current line while it could still open a fence
  let fence: "none" | "shown" | "held" = "none";
  let fenceLine = ""; // the current line inside a fence, to find its close

  const couldOpen = (s: string) => /^ {0,3}`{0,3}$/.test(s);
  const opens = (s: string) => /^ {0,3}```/.test(s);

  const push = (text: string): string => {
    let out = "";
    for (const ch of text) {
      if (fence !== "none") {
        if (ch === "\n") {
          const closing = /^ {0,3}```\s*$/.test(fenceLine);
          if (fence === "shown") out += "\n";
          if (closing) {
            fence = "none";
            lineStart = "";
          }
          fenceLine = "";
        } else {
          fenceLine += ch;
          if (fence === "shown") out += ch;
        }
        continue;
      }
      if (lineStart !== null) {
        lineStart += ch;
        if (opens(lineStart)) {
          if (ch !== "\n") continue; // read the info string to the end of the line
          const info = lineStart.trim().slice(3).trim().toLowerCase().split(/\s+/)[0] ?? "";
          const allowed = policy === "pseudocode" && PLAIN_FENCES.has(info);
          if (allowed) {
            out += lineStart;
            fence = "shown";
          } else {
            out += `${HELD_BACK}\n`;
            fence = "held";
          }
          lineStart = null;
          fenceLine = "";
          continue;
        }
        if (ch === "\n") {
          out += lineStart;
          lineStart = "";
          continue;
        }
        if (!couldOpen(lineStart)) {
          out += lineStart;
          lineStart = null;
        }
        continue;
      }
      out += ch;
      if (ch === "\n") lineStart = "";
    }
    return out;
  };

  const end = (): string => {
    // An unclosed fence the rung holds back stays held; a half-read line that
    // turned out not to be a fence is just text.
    if (fence === "none" && lineStart) {
      const rest = opens(lineStart) ? HELD_BACK : lineStart;
      lineStart = "";
      return rest;
    }
    return "";
  };

  return { push, end };
}
