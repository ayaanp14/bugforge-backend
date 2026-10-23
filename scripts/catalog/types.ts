/**
 * Shared types for the hand-authored problem catalog (scripts/catalog/*).
 * Each entry is a real, distinct problem with: professional description
 * (examples computed from the generator), hints, typed signature, a
 * deterministic hidden-case generator with a TS reference implementation,
 * and validated Python + JavaScript solutions.
 */

import type { Language, Signature } from "../../src/lib/driver-codegen.js";

/**
 * Reference solutions keyed by language. Python and JavaScript are required —
 * python doubles as the problem's referenceSolution — and any of the other 11
 * may be filled in as they are authored. `--validate` runs every language
 * present here against every seeded case, so a key existing means it passes.
 */
export type Solutions = Partial<Record<Language, string>> & { python: string; javascript: string };

export interface Case { input: string; expectedOutput: string }
export type Rng = () => number;

export interface CatalogProblem {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  signature: Signature;
  /** Full markdown description including Examples and Constraints. */
  description: string;
  hints: string[];
  /**
   * Markdown walkthrough for the Editorial tab: the idea, why it works, and
   * the complexity — prose only. The seeder appends the reference solutions
   * (see renderSolutions), so this must not repeat them. Optional: problems
   * without one keep the "Coming Soon" empty state rather than filler.
   */
  editorial?: string;
  /** Visible cases (shown as Examples in the description). */
  examples: Case[];
  /** One deterministic hidden case per call. */
  gen: (rng: Rng) => Case;
  /**
   * Caps the seeder's `--count` for this problem. For the few classics whose
   * input space is a handful of values (N-Queens II has nine) or whose honest
   * solution is a search: the judge gives a whole suite at most 15 CPU
   * seconds, and 5,000 backtracking runs in Python or Ruby do not fit, while
   * 5,000 copies of nine inputs prove nothing more than a few hundred do.
   * Leave it unset everywhere else.
   */
  hiddenCount?: number;
  /** Validated solutions; python doubles as the referenceSolution. */
  solutions: Solutions;
}

// ── Deterministic RNG (mulberry32 over the slug) ───────────────────
export function makeRng(seedStr: string): Rng {
  let a = [...seedStr].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const ri = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = <T,>(rng: Rng, arr: T[]) => arr[ri(rng, 0, arr.length - 1)];
export const shuffle = <T,>(rng: Rng, arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const fmtIntArr = (a: number[]) => `[${a.join(",")}]`;
export const fmtStrArr = (a: string[]) => `[${a.map((s) => `"${s}"`).join(",")}]`;
export const bool = (b: boolean) => (b ? "true" : "false");

const LOWER = "abcdefghijklmnopqrstuvwxyz";
export const randLower = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

/** Renders "Input: … Output: …" example blocks + constraints section. */
export function describe(intro: string, examples: Array<{ in: string; out: string; note?: string }>, constraints: string[], followUp?: string): string {
  const ex = examples
    .map((e, i) => `### Example ${i + 1}\n\n\`\`\`\nInput: ${e.in}\nOutput: ${e.out}${e.note ? `\nExplanation: ${e.note}` : ""}\n\`\`\``)
    .join("\n\n");
  const tail = followUp ? `\n\n**Follow-up:** ${followUp}` : "";
  return `${intro}\n\n${ex}\n\n### Constraints\n\n${constraints.map((c) => `- \`${c}\``).join("\n")}${tail}`;
}

/**
 * Renders an editorial: the insight that unlocks the problem, the algorithm,
 * why it is correct, what it costs, and the reference implementation. Mirrors
 * describe() so every editorial in the catalog reads the same way.
 */
export function explain(o: {
  /** The idea the problem turns on, in a sentence or two. */
  idea: string;
  /** The algorithm, one numbered step at a time. */
  steps: string[];
  /** Why the algorithm is correct — the part hints deliberately withhold. */
  why?: string;
  time: string;
  space: string;
  /** Traps worth calling out; skipped entirely when there are none. */
  pitfalls?: string[];
}): string {
  const parts = [
    o.idea,
    "## Approach",
    o.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
  ];
  if (o.why) parts.push("## Why it works", o.why);
  parts.push("## Complexity", `- **Time** — \`${o.time}\`\n- **Space** — \`${o.space}\``);
  if (o.pitfalls?.length) parts.push("## Pitfalls", o.pitfalls.map((p) => `- ${p}`).join("\n"));
  return parts.join("\n\n");
}

/**
 * The solutions map as the API stores it. Kept as structured data rather than
 * markdown so the Editorial tab can offer a language picker over exactly the
 * languages that were authored and validated for this problem.
 */
export function solutionsJson(s: Solutions): Record<string, string> {
  return Object.fromEntries(Object.entries(s).filter(([, code]) => typeof code === "string" && code.length > 0));
}

/** Format an int matrix in expectedOutput style: [[1,2],[3,4]] (no spaces). */
export const fmtIntMat = (m: number[][]) => JSON.stringify(m);

/**
 * Tag for a solution written as an indented multi-line block:
 *
 *   python: code`
 *     def f(x):
 *         return x
 *   `,
 *
 * The text is taken raw (String.raw), so a backslash in the solution stays a
 * backslash — `'\n'` in C is written as is, not as `'\\n'` the way the
 * single-line `\n`-joined literals of waves 1–5 had to spell it, which is where
 * hand-escaping went wrong. The first and last lines (the ones beside the
 * backticks) are dropped and the common indentation removed, so Python keeps
 * its significant whitespace. The block cannot hold a backtick or `${` — no
 * solution needs one (wave 6 onwards).
 */
export function code(strings: TemplateStringsArray, ...values: unknown[]): string {
  if (values.length) throw new Error("code`…` blocks take no ${} substitutions");
  const lines = String.raw(strings).replace(/\r\n/g, "\n").split("\n");
  if (lines.length && lines[0].trim() === "") lines.shift();
  if (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim() !== "").map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0).replace(/\s+$/, "")).join("\n");
}

// ── Trees, linked lists and design problems (wave 7, 2026-10-22) ────
// Signatures may now use `TreeNode`, `ListNode` and `ListNode[]`, or describe
// a design class (`methods`, see src/lib/driver-structures.ts). These are the
// reference-side shapes for `ref` / `gen`; the wire format is LeetCode's.

export interface TNode { val: number; left: TNode | null; right: TNode | null }
export interface LNode { val: number; next: LNode | null }

/** `[3,9,20,null,null,15,7]` → nodes (level order, nulls for missing children). */
export function treeFrom(a: Array<number | null>): TNode | null {
  if (a.length === 0 || a[0] === null) return null;
  const root: TNode = { val: a[0], left: null, right: null };
  const q: TNode[] = [root];
  let h = 0, i = 1;
  while (i < a.length && h < q.length) {
    const n = q[h++];
    const l = a[i++];
    if (l !== null && l !== undefined) { n.left = { val: l, left: null, right: null }; q.push(n.left); }
    const r = i < a.length ? a[i++] : null;
    if (r !== null && r !== undefined) { n.right = { val: r, left: null, right: null }; q.push(n.right); }
  }
  return root;
}

/** Nodes → level order with nulls, trailing nulls dropped — exactly what every driver prints. */
export function treeArr(root: TNode | null): Array<number | null> {
  const out: Array<number | null> = [];
  const q: Array<TNode | null> = [root];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    if (!n) { out.push(null); continue; }
    out.push(n.val);
    q.push(n.left, n.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}
export const fmtTree = (root: TNode | null) => JSON.stringify(treeArr(root));

/** A random tree of `n` nodes (any shape) with values in [lo, hi]. */
export function randTree(rng: Rng, n: number, lo: number, hi: number): TNode | null {
  if (n <= 0) return null;
  const root: TNode = { val: ri(rng, lo, hi), left: null, right: null };
  const nodes = [root];
  while (nodes.length < n) {
    const p = nodes[ri(rng, 0, nodes.length - 1)];
    const side = rng() < 0.5 ? "left" : "right";
    if (!p[side]) { const c: TNode = { val: ri(rng, lo, hi), left: null, right: null }; p[side] = c; nodes.push(c); }
  }
  return root;
}

/** A random binary search tree of `n` distinct values from [lo, hi] (hi - lo + 1 >= n). */
export function randBST(rng: Rng, n: number, lo: number, hi: number): TNode | null {
  const vals = new Set<number>();
  while (vals.size < n) vals.add(ri(rng, lo, hi));
  let root: TNode | null = null;
  for (const v of shuffle(rng, [...vals])) {
    const node: TNode = { val: v, left: null, right: null };
    if (!root) { root = node; continue; }
    let cur = root;
    for (;;) {
      const side = v < cur.val ? "left" : "right";
      const next = cur[side];
      if (!next) { cur[side] = node; break; }
      cur = next;
    }
  }
  return root;
}

export function listFrom(a: number[]): LNode | null {
  let head: LNode | null = null;
  for (let i = a.length - 1; i >= 0; i--) head = { val: a[i], next: head };
  return head;
}
export function listArr(h: LNode | null): number[] {
  const out: number[] = [];
  for (; h; h = h.next) out.push(h.val);
  return out;
}

/**
 * A design problem's input: the operations, then each one's arguments (the
 * constructor's first). Its expected output is `JSON.stringify` of the results,
 * with null for the constructor and every void method.
 */
export const designInput = (ops: string[], args: unknown[][]) => `${JSON.stringify(ops)}\n${JSON.stringify(args)}`;
