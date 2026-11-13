import { and, bandOver, finish, row, rowLabel, slotMid, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * DP optimisations (competitive-programming track, module 11).
 *
 *  - prefix-sums: the sweets DP of the lesson's first exercise (caps
 *    [1, 2, 3], K = 4). Each row is built from the prefix sums P of the row
 *    above; one cell's window is shown as P[k + 1] − P[max(0, k − c)], then
 *    the whole row fills. The last cell is the exercise's sample answer, 5.
 *  - deque: the jumping DP dp[i] = a[i] + max(dp[i − k .. i − 1]) on the
 *    lesson's array with k = 2, run with the real monotonic deque: what
 *    expires from the front, what the front gives, what is popped from the
 *    back before i is pushed.
 */

const S = 40;
const G = 6;

/* ── Prefix sums ──────────────────────────────────────────── */

function prefixSums(): Walkthrough {
  const CAPS = [1, 2, 3];
  const K = 4;
  const rows: number[][] = [[1, ...new Array<number>(K).fill(0)]];
  const pres: number[][] = [];
  for (const c of CAPS) {
    const prev = rows[rows.length - 1]!;
    const P = [0];
    prev.forEach((v) => P.push(P[P.length - 1]! + v));
    pres.push(P);
    rows.push(prev.map((_, k) => P[k + 1]! - P[Math.max(0, k - c)]!));
  }
  if (rows[CAPS.length]![K] !== 5) throw new Error(`prefix-sums: answer ${rows[CAPS.length]![K]} != 5`);

  const RY = (r: number) => r * (S + 12);
  const PY = RY(CAPS.length + 1) + 18;
  /** The cell each child's frame works through — the last one is the answer. */
  const SHOW = [1, 3, 4];

  const draw = (filled: number, focus: { child: number } | null, readout: string): Item[] => {
    const SHOW_K = focus ? SHOW[focus.child - 1]! : -1;
    const items: Item[] = [];
    for (let k = 0; k <= K; k++) items.push(label(`h${k}`, `k=${k}`, slotMid(k), -12, { tone: "faint", size: 11, mono: true }));
    rows.forEach((vals, r) => {
      const on = r <= filled;
      const shown = (k: number) => on || (focus !== null && r === focus.child && k === SHOW_K);
      items.push(rowLabel(`l${r}`, r === 0 ? "dp0" : `dp${r} c=${CAPS[r - 1]}`, -10, RY(r)));
      if (focus && r === focus.child - 1) {
        const c = CAPS[focus.child - 1]!;
        items.unshift(bandOver("win", Math.max(0, SHOW_K - c), SHOW_K, { y: RY(r) }));
      }
      items.push(
        ...row(`r${r}-`, vals, {
          y: RY(r),
          text: (k) => (shown(k) ? String(vals[k]) : ""),
          tone: (k) => (!shown(k) ? "ghost" : focus && r === focus.child && k === SHOW_K ? "accent" : r === filled && !focus ? "strong" : "plain"),
        }),
      );
    });
    if (focus) {
      const P = pres[focus.child - 1]!;
      const c = CAPS[focus.child - 1]!;
      items.push(rowLabel("pl", "P", -10, PY));
      items.push(
        ...row("p", P, { y: PY, tone: (j) => (j === SHOW_K + 1 || j === Math.max(0, SHOW_K - c) ? "accent" : "plain") }),
      );
      for (let j = 0; j < P.length; j++) items.push(label(`pi${j}`, `P${j}`, slotMid(j), PY + S + 11, { tone: "faint", size: 10, mono: true }));
    }
    items.push({ k: "text", id: "readout", x: -10 - 70, y: PY + S + 34, text: readout, tone: "accent", anchor: "start", size: 13, mono: true, weight: 600 });
    return items;
  };

  const frames = [
    {
      caption: `dp[i][k] counts the ways to give k sweets to the first i children. With no children there is one way to give 0 sweets and none to give more: row 0 is ${rows[0]!.join(", ")}.`,
      items: draw(0, null, "dp0[0] = 1"),
    },
  ];
  CAPS.forEach((c, i) => {
    const child = i + 1;
    const P = pres[i]!;
    const SHOW_K = SHOW[i]!;
    const lo = Math.max(0, SHOW_K - c);
    frames.push({
      caption: `Child ${child} takes 0..${c}, so dp${child}[k] sums dp${child - 1}[k−${c}..k]. Build prefix sums P of row ${child - 1} once; then dp${child}[${SHOW_K}] = P${SHOW_K + 1} − P${lo} = ${P[SHOW_K + 1]} − ${P[lo]} = ${rows[child]![SHOW_K]}, one subtraction instead of ${SHOW_K - lo + 1} additions.`,
      items: draw(child - 1, { child }, `dp${child}[${SHOW_K}] = P${SHOW_K + 1} - P${lo} = ${rows[child]![SHOW_K]}`),
    });
    frames.push({
      caption:
        child < CAPS.length
          ? `Every cell of row ${child} is one such subtraction: ${rows[child]!.join(", ")}. The row costs O(K), not O(K · c).`
          : `Row ${child} is ${rows[child]!.join(", ")}: there are ${rows[child]![K]} ways to share ${K} sweets with caps ${CAPS.join(", ")}. The table cost O(n · K) in all.`,
      items: draw(child, null, child < CAPS.length ? `row ${child}: O(K) subtractions` : `answer dp${child}[${K}] = ${rows[child]![K]}`),
    });
  });
  return finish({ title: "Prefix sums make each DP cell one subtraction", input: `caps = [${CAPS.join(", ")}], K = ${K}`, frames });
}

/* ── Monotonic deque ──────────────────────────────────────── */

function deque(): Walkthrough {
  const A = [1, -1, -2, 4, -7, 3];
  const K = 2;
  const n = A.length;
  const dp = new Array<number>(n).fill(0);
  dp[0] = A[0]!;
  let dq = [0];
  const steps: Array<{ i: number; expired: number[]; front: number; popped: number[]; after: number[] }> = [];
  for (let i = 1; i < n; i++) {
    const expired: number[] = [];
    while (dq[0]! < i - K) expired.push(dq.shift()!);
    const front = dq[0]!;
    dp[i] = A[i]! + dp[front]!;
    const popped: number[] = [];
    while (dq.length && dp[dq[dq.length - 1]!]! <= dp[i]!) popped.push(dq.pop()!);
    dq.push(i);
    steps.push({ i, expired, front, popped, after: dq.slice() });
    dq = dq.slice();
  }
  // Check against the O(n·k) definition.
  const slow = [A[0]!];
  for (let i = 1; i < n; i++) slow.push(A[i]! + Math.max(...slow.slice(Math.max(0, i - K), i)));
  if (slow.join() !== dp.join()) throw new Error(`deque: ${dp.join()} != ${slow.join()}`);

  const DPY = 72;
  const QY = DPY + 96;
  const QW = 56;
  const draw = (upto: number, window: [number, number] | null, front: number | null, q: number[], readout: string): Item[] => {
    const items: Item[] = [];
    if (window) items.push(bandOver("win", window[0], window[1], { y: DPY }));
    items.push(rowLabel("la", "a", -10, 0), ...row("a", A, { index: true }));
    items.push(rowLabel("ld", "dp", -10, DPY));
    items.push(
      ...row("d", dp, {
        y: DPY,
        text: (i) => (i <= upto ? String(dp[i]) : ""),
        tone: (i) => (i > upto ? "ghost" : i === upto ? "strong" : i === front ? "accent" : "plain"),
      }),
    );
    items.push(rowLabel("lq", "deque", -10, QY));
    items.push(label("qf", "front", QW / 2, QY - 10, { tone: "faint", size: 10 }));
    q.forEach((idx, j) => items.push(box(`q${idx}`, j * (QW + G), QY, `${idx}: ${dp[idx]}`, { w: QW, tone: j === 0 ? "accent" : "plain", size: 12 })));
    items.push({ k: "text", id: "readout", x: -60, y: QY + S + 24, text: readout, tone: "accent", anchor: "start", size: 13, mono: true, weight: 600 });
    return items;
  };

  const frames = [
    {
      caption: `dp[i] is the best score standing on cell i, moving 1 to ${K} cells at a time: dp[i] = a[i] + the maximum of the last ${K} dp values. Start with dp[0] = ${dp[0]} and index 0 in the deque.`,
      items: draw(0, null, null, [0], `dp[0] = a[0] = ${dp[0]}`),
    },
    ...steps.map((s) => {
      const parts: string[] = [];
      if (s.expired.length) parts.push(`index ${and(s.expired.map(String))} left the window and was dropped from the front`);
      parts.push(`the front, index ${s.front}, gives the window's best ${dp[s.front]}, so dp[${s.i}] = ${A[s.i]} + ${dp[s.front]} = ${dp[s.i]}`);
      const tail = s.popped.length
        ? s.popped.length > 1
          ? ` Indexes ${and(s.popped.map(String))} are no better than ${dp[s.i]} and older, so they are popped from the back before ${s.i} is pushed.`
          : ` Index ${s.popped[0]} is no better than ${dp[s.i]} and older, so it is popped from the back before ${s.i} is pushed.`
        : ` Nothing at the back is beaten, so ${s.i} joins behind.`;
      const cap = `i = ${s.i}: ${parts.join("; ")}.${tail}`;
      return {
        caption: s.i === n - 1 ? `${cap} The answer is dp[${n - 1}] = ${dp[n - 1]}.` : cap,
        items: draw(s.i, [Math.max(0, s.i - K), s.i - 1], s.front, s.after, `dp[${s.i}] = ${A[s.i]} + ${dp[s.front]} = ${dp[s.i]}`),
      };
    }),
  ];
  return finish({ title: "A monotonic deque keeps the window's maximum at its front", input: `a = [${A.join(", ")}], k = ${K}`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "prefix-sums": prefixSums,
  deque,
};
