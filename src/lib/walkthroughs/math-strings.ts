import { CELL, GAP, and, bandOver, finish, note, over, row, rowLabel, show, slotMid, slotX, spanOver, textWidth, under, type Frame, type Item, type Tone, type Walkthrough } from "./core.js";

/**
 * Walkthroughs for the maths and string hubs: digit peeling, Euclid, the
 * sieve, Pascal's triangle, the monotone-chain hull, a subtraction game,
 * the bulb switcher, n & (n − 1), two-pointer palindromes, naive search,
 * KMP, Rabin–Karp and the suffix array. Same rule as reference.ts: each
 * generator runs the real algorithm on its example and records a frame at
 * every step it takes, so every number on screen and in a caption is one
 * the run produced.
 */

/* ── Small local helpers ──────────────────────────────────────────── */

const MINUS = "−";
/** A signed number as prose prints it, with a real minus sign. */
const signed = (v: number) => (v < 0 ? `${MINUS}${-v}` : String(v));
/** A small exponent as superscript digits: 2⁴, 10². */
const sup = (n: number) => [...String(n)].map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("");
/** A short list of alternatives: "3, 2 or 1". */
const or = (xs: readonly (string | number)[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}` : String(xs[0] ?? ""));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
/** A long arithmetic run as "4, 6, 8, …, 50". */
const run = (xs: readonly number[]) => (xs.length <= 6 ? xs.join(", ") : `${xs.slice(0, 3).join(", ")}, …, ${xs[xs.length - 1]}`);
const cell = (id: string, x: number, y: number, text: string, tone: Tone = "plain", size = CELL, font?: number): Item => ({ k: "cell", id, x, y, w: size, h: size, text, tone, size: font });
const lines = (prefix: string, xs: readonly string[], x: number, y: number, o: { gap?: number; tone?: (k: number) => "ink" | "soft" | "faint" | "accent" | "error"; size?: number } = {}): Item[] =>
  xs.map((l, k) => note(`${prefix}${k}`, l, x, y + k * (o.gap ?? 20), { tone: o.tone?.(k) ?? (k === 0 ? "ink" : "soft"), size: o.size ?? 12 }));

/* ── math: peel digits with % 10 and // 10 ────────────────────────── */

/** Palindrome number: peel digits off the end into rev until rev holds the right half reversed, then compare halves. */
function palindromeNumber(): Walkthrough {
  const n = 1234321;
  const digits = [...String(n)].map(Number);
  const D = digits.length;
  const XY = 0;
  const RY = 96;
  const VX = slotX(D) + 12;
  const frames: Frame[] = [];
  let x = n;
  let rev = 0;
  const inX = digits.map((_, p) => p);
  const inRev: number[] = [];

  const draw = (o: { fresh?: number; text: string[]; middle?: number; settle?: "check" | "answer" }): Item[] => {
    const items: Item[] = [rowLabel("lx", "x", -10, XY), rowLabel("lr", "rev", -10, RY)];
    const settled = o.settle !== undefined;
    inX.forEach((p, i) => items.push(cell(`d${p}`, slotX(i), XY, String(digits[p]), o.settle === "answer" ? "strong" : settled ? "accent" : "plain")));
    inRev.forEach((p, j) =>
      items.push(cell(`d${p}`, slotX(j), RY, String(digits[p]), p === o.middle ? "muted" : o.settle === "answer" ? "strong" : settled || p === o.fresh ? "accent" : "plain")),
    );
    if (!settled && x > rev) items.push(over("peek", inX.length - 1, "x % 10", { y: XY, tone: "ink" }));
    items.push(note("vx", `x = ${x}`, VX, XY + CELL / 2, { weight: 600 }));
    items.push(note("vr", `rev = ${rev}`, VX, RY + CELL / 2, { weight: 600 }));
    items.push(...lines("ln", o.text, 0, RY + CELL + 30));
    return items;
  };

  frames.push({
    caption: `Is ${n} a palindrome? Rather than make a string, peel digits off the end: x % 10 is the last digit and x // 10 drops it. Each peeled digit is appended to rev as rev × 10 + digit, so rev grows into the right half read backwards.`,
    items: draw({ text: ["digit = x % 10,  x = x // 10", "rev = rev × 10 + digit", `${x} > ${rev}: peel while x is the larger`] }),
  });

  while (x > rev) {
    const d = x % 10;
    const xOld = x;
    const revOld = rev;
    x = Math.floor(x / 10);
    rev = rev * 10 + d;
    const p = inX.pop()!;
    inRev.push(p);
    frames.push({
      caption: `The last digit of ${xOld} is ${xOld} % 10 = ${d}; it moves onto rev, which becomes ${revOld} × 10 + ${d} = ${rev}, and x becomes ${xOld} // 10 = ${x}. ${
        x > rev ? `x is still the larger, so the two halves have not met yet.` : `Now x (${x}) is no larger than rev (${rev}): rev holds the right half, so the peeling stops.`
      }`,
      items: draw({ fresh: p, text: [`${xOld} % 10 = ${d},  ${xOld} // 10 = ${x}`, `rev = ${revOld} × 10 + ${d} = ${rev}`, `${x} > ${rev}? ${x > rev ? "yes, keep peeling" : "no, stop"}`] }),
    });
  }

  const even = x === rev;
  const half = even ? rev : Math.floor(rev / 10);
  const mid = even ? undefined : inRev[inRev.length - 1];
  const ok = x === half;
  frames.push({
    caption: even
      ? `${D} digits is even, so rev took exactly half. x = ${x} and rev = ${rev} are ${ok ? "equal" : "different"}, so the left half ${ok ? "matches" : "does not match"} the right half read backwards.`
      : `${D} digits is odd, so rev also took the middle digit ${digits[mid!]}; rev // 10 = ${half} drops it. x = ${x} and rev // 10 = ${half} are ${ok ? "equal" : "different"}, so the left half ${ok ? "matches" : "does not match"} the right half read backwards.`,
    items: draw({ settle: "check", middle: mid, text: [even ? `x = ${x},  rev = ${rev}` : `rev // 10 = ${rev} // 10 = ${half}`, `${x} ${ok ? "=" : "≠"} ${half}`] }),
  });

  frames.push({
    caption: `${n} is ${ok ? "" : "not "}a palindrome. Only half its digits were peeled, so the test is O(log n) time and O(1) space, with no string and no full reverse to overflow; negative numbers and numbers ending in 0 are ruled out before the loop.`,
    items: draw({ settle: "answer", middle: mid, text: [`palindrome(${n}) = ${ok}`, `${Math.ceil(D / 2)} of ${D} digits peeled`] }),
  });

  return finish({ title: "Palindrome number without a string, by peeling digits with % 10 and // 10", input: `x = ${n}`, frames });
}

/* ── number-theory: Euclid's algorithm ────────────────────────────── */

/** gcd(252, 105) by Euclid, drawn as a rectangle cut into the largest squares that fit until a square tiles what is left. */
function euclid(): Walkthrough {
  const A = 252;
  const B = 105;
  const S = 2;
  const steps: Array<{ a: number; b: number; q: number; r: number }> = [];
  for (let a = A, b = B; b > 0; [a, b] = [b, a % b]) steps.push({ a, b, q: Math.floor(a / b), r: a % b });
  const g = steps[steps.length - 1].b;
  const frames: Frame[] = [];
  const squares: Array<{ id: string; x: number; y: number; s: number; step: number }> = [];
  let rect = { x: 0, y: 0, w: A, h: B };
  const eqs: string[] = [];
  const chain: string[] = [`gcd(${A}, ${B})`];
  const LY = B * S + 26;

  const draw = (o: { step: number; answer?: boolean }): Item[] => {
    const items: Item[] = [];
    for (const q of squares) {
      const tone: Tone = o.answer ? (q.step === steps.length - 1 ? "strong" : "muted") : q.step === o.step ? "accent" : "muted";
      items.push({ k: "cell", id: q.id, x: q.x * S, y: q.y * S, w: q.s * S, h: q.s * S, text: String(q.s), tone });
    }
    if (rect.w > 0 && rect.h > 0) {
      const label = `${rect.w} × ${rect.h}`;
      const fits = textWidth(label, 14) + 12 <= rect.w * S;
      items.push({ k: "cell", id: "rest", x: rect.x * S, y: rect.y * S, w: rect.w * S, h: rect.h * S, text: fits ? label : "", tone: "plain" });
    }
    if (o.answer) {
      // The gcd square as a dashed tiling over the whole rectangle: it fits every piece exactly.
      for (let i = 0; i < A / g; i++) for (let j = 0; j < B / g; j++) items.push({ k: "cell", id: `t${i}_${j}`, x: i * g * S, y: j * g * S, w: g * S, h: g * S, text: "", tone: "ghost" });
    }
    eqs.forEach((e, k) => items.push(note(`eq${k}`, e, 0, LY + k * 20, { tone: k === o.step ? "accent" : "soft", size: 12 })));
    items.push(note("chain", chain.join(" = ") + (o.answer ? ` = ${g}` : ""), 0, LY + steps.length * 20 + 8, { weight: 600, size: 12 }));
    return items;
  };

  frames.push({
    caption: `Euclid's rule is gcd(a, b) = gcd(b, a mod b): a number that divides both a and b also divides a − q × b. Picture ${A} and ${B} as the sides of a rectangle: their gcd is the side of the largest square that tiles it exactly.`,
    items: draw({ step: -1 }),
  });

  steps.forEach((st, si) => {
    for (let k = 1; k <= st.q; k++) {
      const before = `${rect.w} × ${rect.h}`;
      if (Math.min(rect.w, rect.h) !== st.b) throw new Error("euclid: the strip and the division disagree");
      squares.push({ id: `sq${squares.length}`, x: rect.x, y: rect.y, s: st.b, step: si });
      rect = rect.w >= rect.h ? { x: rect.x + st.b, y: rect.y, w: rect.w - st.b, h: rect.h } : { x: rect.x, y: rect.y + st.b, w: rect.w, h: rect.h - st.b };
      const after = `${rect.w} × ${rect.h}`;
      const left = st.a - k * st.b;
      let caption: string;
      if (k < st.q) {
        eqs[si] = `${st.a} ${MINUS} ${k} × ${st.b} = ${left}`;
        caption =
          si === 0
            ? `Cut a ${st.b} × ${st.b} square off the ${before} rectangle, leaving ${after}. Any number that divides ${st.a} and ${st.b} also divides ${st.a} − ${st.b} = ${left}, so the gcd has not changed.`
            : `The short side is now ${st.b}, so cut ${st.b} × ${st.b} squares from the ${before} strip: the first leaves ${after}. Same rule, smaller numbers: gcd(${st.a}, ${st.b}) = gcd(${left}, ${st.b}).`;
      } else {
        eqs[si] = `${st.a} = ${st.q} × ${st.b} + ${st.r}`;
        chain.push(`gcd(${st.b}, ${st.r})`);
        caption =
          st.r > 0
            ? `${k === 1 ? "That square" : `Square ${k}`} leaves ${after}, and ${st.r} < ${st.b}, so no more fit: ${st.a} = ${st.q} × ${st.b} + ${st.r}. ${st.q > 1 ? `A single mod does ${st.q === 2 ? "both subtractions" : `all ${st.q} subtractions`} at once, and the` : "The"} problem becomes gcd(${st.b}, ${st.r}).`
            : `${k === 1 ? "That square" : `Square ${k}`} uses up the strip exactly: ${st.a} = ${st.q} × ${st.b} + 0. The remainder is 0, so gcd(${st.a}, ${st.b}) = gcd(${st.b}, 0) = ${st.b} and the algorithm stops.`;
      }
      frames.push({ caption, items: draw({ step: si }) });
    }
  });

  frames.push({
    caption: `The ${g} × ${g} square tiles the whole ${A} × ${B} rectangle: ${A} = ${A / g} × ${g} and ${B} = ${B / g} × ${g}, and no bigger square does. gcd(${A}, ${B}) = ${g} after ${steps.length} divisions; the remainder at least halves every two steps, so Euclid is O(log min(a, b)).`,
    items: draw({ step: steps.length, answer: true }),
  });

  return finish({ title: "Greatest common divisor, with Euclid's algorithm", input: `a = ${A}, b = ${B}`, frames });
}

/* ── sieve-of-eratosthenes ────────────────────────────────────────── */

/** Primes up to 50: each prime crosses out its multiples from p × p, and the sieve stops once p × p passes n. */
function sieve(): Walkthrough {
  const N = 50;
  const COLS = 10;
  const SZ = 36;
  const P = SZ + 6;
  const at = (v: number) => ({ x: ((v - 1) % COLS) * P, y: Math.floor((v - 1) / COLS) * P });
  const LY = Math.ceil(N / COLS) * P + 16;
  const crossed = new Set<number>();
  const primes: number[] = [];
  const frames: Frame[] = [];

  const draw = (o: { p?: number; fresh?: number[]; next?: number; done?: boolean; text: string[] }): Item[] => {
    const items: Item[] = [];
    // A halo behind the prime whose multiples this step crosses out.
    const cur = o.p ?? o.next;
    if (cur !== undefined) items.push({ k: "band", id: "cur", x: at(cur).x - 4, y: at(cur).y - 4, w: SZ + 8, h: SZ + 8, tone: "accent" });
    for (let v = 1; v <= N; v++) {
      const { x, y } = at(v);
      const fresh = o.fresh?.includes(v) ?? false;
      const tone: Tone = v === 1 ? "muted" : crossed.has(v) ? (fresh ? "accent" : "muted") : v === o.next ? "accent" : primes.includes(v) || o.done ? "strong" : "plain";
      items.push(cell(`n${v}`, x, y, String(v), tone, SZ, 13));
      if (crossed.has(v)) items.push({ k: "edge", id: `x${v}`, x1: x + 8, y1: y + SZ - 8, x2: x + SZ - 8, y2: y + 8, tone: fresh ? "accent" : "line" });
    }
    items.push(...lines("ln", o.text, 0, LY));
    return items;
  };

  frames.push({
    caption: `Write out 1 to ${N} and treat every number from 2 up as possibly prime; 1 is neither prime nor composite. Instead of testing each number for divisors, the sieve crosses out the multiples of each prime it finds.`,
    items: draw({ text: [`n = ${N}`, "nothing crossed out yet"] }),
  });

  let p = 2;
  while (p * p <= N) {
    const multiples: number[] = [];
    for (let v = p * p; v <= N; v += p) multiples.push(v);
    const fresh = multiples.filter((v) => !crossed.has(v));
    const already = multiples.length - fresh.length;
    primes.push(p);
    fresh.forEach((v) => crossed.add(v));
    frames.push({
      caption: `${p} is not crossed out, so it is prime. Cross out its multiples from ${p} × ${p} = ${p * p} in steps of ${p}: ${fresh.length} new${already ? `, ${already} already gone` : ""}. ${
        p === 2
          ? `Every even number above 2 has 2 as a factor, so none of them is prime.`
          : `Starting at ${p * p} is safe: a smaller multiple k × ${p} with k < ${p} already fell to a prime factor of k, as ${2 * p} fell to 2.`
      }`,
      items: draw({ p, fresh, text: [`p = ${p}: cross ${run(multiples)}`, `${fresh.length} new, ${already} already crossed;  primes so far: ${primes.join(", ")}`] }),
    });
    do p++;
    while (crossed.has(p));
  }

  const all: number[] = [];
  for (let v = 2; v <= N; v++) if (!crossed.has(v)) all.push(v);
  frames.push({
    caption: `The next uncrossed number is ${p}, and ${p} × ${p} = ${p * p} > ${N}, so the sieve stops. Every composite up to ${N} has a prime factor no bigger than √${N} ≈ ${Math.sqrt(N).toFixed(1)}, so it has already been crossed out.`,
    items: draw({ next: p, text: [`p = ${p}: ${p} × ${p} = ${p * p} > ${N}, stop`, `primes used: ${primes.join(", ")}`] }),
  });
  frames.push({
    caption: `The ${all.length} numbers left uncrossed are the primes up to ${N}: ${all.join(", ")}. Each prime p crosses about n / p numbers, which adds up to O(n log log n) time, with O(n) memory for the marks.`,
    items: draw({ done: true, text: [`${all.length} primes ≤ ${N}`, `${crossed.size} composites crossed out`] }),
  });

  return finish({ title: "All primes up to 50, with the sieve of Eratosthenes", input: `n = ${N}`, frames });
}

/* ── combinatorics: Pascal's triangle ─────────────────────────────── */

/** C(6, 2) from Pascal's triangle: each row is built from the one above, every inner entry the sum of its two parents. */
function pascal(): Walkthrough {
  const N = 6;
  const K = 2;
  const SZ = 34;
  const PX = 44;
  const PY = 50;
  const cx = (r: number, k: number) => (k - r / 2) * PX;
  const LX = cx(N, 0) - SZ / 2 - 12;
  const LY = -30; // the readout sits over the apex, near the rows the early frames draw
  const tri: number[][] = [];
  const frames: Frame[] = [];
  const C = (r: number, k: number) => (r >= 0 && k >= 0 && k <= r ? tri[r][k] : 0);

  const draw = (upTo: number, hi: { r: number; k: number } | null, o: { answer?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    if (!o.answer) items.push({ k: "band", id: "row", x: cx(upTo, 0) - SZ / 2 - 5, y: upTo * PY - 5, w: upTo * PX + SZ + 10, h: SZ + 10, tone: "accent" });
    for (let r = 0; r <= upTo; r++) {
      items.push(note(`rl${r}`, `n = ${r}`, LX, r * PY + SZ / 2, { anchor: "end", tone: "soft", size: 11 }));
      for (let k = 0; k <= r; k++) {
        const isHi = hi !== null && r === hi.r && k === hi.k;
        const isParent = hi !== null && r === hi.r - 1 && (k === hi.k - 1 || k === hi.k);
        items.push(cell(`c${r}_${k}`, cx(r, k) - SZ / 2, r * PY, String(tri[r][k]), isHi ? (o.answer ? "strong" : "accent") : isParent ? "accent" : "plain", SZ, 13));
      }
    }
    if (hi) {
      for (const pk of [hi.k - 1, hi.k]) {
        if (pk < 0 || pk > hi.r - 1) continue;
        items.push({ k: "edge", id: pk === hi.k - 1 ? "pa" : "pb", x1: cx(hi.r - 1, pk), y1: (hi.r - 1) * PY + SZ + 1, x2: cx(hi.r, hi.k) + (pk === hi.k - 1 ? -6 : 6), y2: hi.r * PY - 1, tone: "accent", arrow: true });
      }
    }
    items.push(note("sum", o.text, 0, LY, { anchor: "middle", weight: 600, size: 13 }));
    return items;
  };

  const ruleText = (r: number, k: number) => {
    const a = C(r - 1, k - 1);
    const b = C(r - 1, k);
    const left = k - 1 >= 0 ? `C(${r - 1}, ${k - 1})` : "0";
    const right = k <= r - 1 ? `C(${r - 1}, ${k})` : "0";
    return `C(${r}, ${k}) = ${left} + ${right} = ${a} + ${b} = ${a + b}`;
  };

  tri.push([1]);
  frames.push({
    caption: `C(n, k) counts the ways to choose k items from n. Pascal's rule C(n, k) = C(n − 1, k − 1) + C(n − 1, k) builds each row from the one above — the last item is either taken or left out. Row 0 is just C(0, 0) = 1.`,
    items: draw(0, null, { text: "C(n, k) = C(n − 1, k − 1) + C(n − 1, k)" }),
  });

  for (let r = 1; r <= N; r++) {
    tri.push(Array.from({ length: r + 1 }, (_, k) => C(r - 1, k - 1) + C(r - 1, k)));
    const k = r === 1 ? 1 : Math.min(K, r - 1);
    const a = C(r - 1, k - 1);
    const b = C(r - 1, k);
    const rowText = tri[r].join(", ");
    const sum = tri[r].reduce((s, v) => s + v, 0);
    const why: Record<number, string> = {
      1: `An entry at the edge has only one parent above it — the missing one counts as 0 — so every row starts and ends with 1.`,
      2: `C(${r}, ${k}) = ${a} + ${b} = ${a + b}: item ${r} is either taken (C(${r - 1}, ${k - 1}) = ${a} way to pick the rest) or left out (C(${r - 1}, ${k}) = ${b} way).`,
      3: `C(${r}, ${k}) = ${a} + ${b} = ${a + b}, and the row is symmetric: choosing ${k} items to take is choosing ${r - k} to leave, so C(${r}, ${k}) = C(${r}, ${r - k}).`,
      4: `C(${r}, ${k}) = ${a} + ${b} = ${a + b}. The row adds up to ${sum} = 2${sup(r)}: every subset of ${r} items is counted once, by its size.`,
      5: `C(${r}, ${k}) = ${a} + ${b} = ${a + b}. Each entry costs one addition and stays a small integer, with no factorials to overflow.`,
      6: `C(${r}, ${k}) = ${a} + ${b} = ${a + b}. Only the previous row is ever read, so one array of length n + 1, updated right to left, is enough.`,
    };
    frames.push({ caption: `Row ${r} is ${rowText}. ${why[r]}`, items: draw(r, { r, k }, { text: ruleText(r, k) }) });
  }

  const ans = C(N, K);
  frames.push({
    caption: `C(${N}, ${K}) = ${ans}: there are ${ans} ways to choose ${K} items from ${N}. Building rows 0 to n costs O(n²) additions — O(n × k) if only columns 0 to k are kept — and uses no division, so it works under any modulus.`,
    items: draw(N, { r: N, k: K }, { answer: true, text: `C(${N}, ${K}) = ${ans}` }),
  });

  return finish({ title: "Binomial coefficients C(n, k), with Pascal's triangle", input: `n = ${N}, k = ${K}`, frames });
}

/* ── geometry: Andrew's monotone chain ────────────────────────────── */

/** Convex hull of 7 points: sort by x, then build the lower and upper chains, popping any point that makes a clockwise turn. */
function convexHull(): Walkthrough {
  const raw: Array<[number, number]> = [[3, 0], [0, 2], [5, 3], [2, 4], [6, 1], [1, 0], [4, 3]];
  const pts = [...raw].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const nm = pts.map((_, i) => String.fromCharCode(65 + i));
  const U = 56;
  const R = 13;
  const maxY = Math.max(...pts.map((p) => p[1]));
  const pos = pts.map(([x, y]) => ({ x: x * U, y: (maxY - y) * U }));
  const cross = (o: number, a: number, b: number) => (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0]);
  const pair = (a: number, b: number) => (a < b ? `${nm[a]}${nm[b]}` : `${nm[b]}${nm[a]}`);
  const TY = maxY * U + R + 24;
  const SY = TY + 3 * 17 + 6;
  const SZ = 30;
  const UX = 4 * (SZ + GAP) + 76;
  const frames: Frame[] = [];

  type Test = { o: number; a: number; p: number; v: number };
  let lower: number[] = [];
  let upper: number[] = [];
  let phase: "lower" | "upper" | "done" = "lower";

  const draw = (o: { popped?: number[]; tests?: Test[]; text?: string[] }): Item[] => {
    const items: Item[] = [];
    const chain = phase === "lower" ? lower : phase === "upper" ? upper : [];
    const segs = (xs: number[]) => xs.slice(1).map((b, i) => [xs[i], b] as const);
    if (phase !== "lower") for (const [a, b] of segs(lower)) items.push({ ...edge(`l${pair(a, b)}`, a, b), tone: phase === "done" ? "accent" : "ink" });
    else for (const [a, b] of segs(lower)) items.push({ ...edge(`l${pair(a, b)}`, a, b), tone: "accent" });
    if (phase === "upper" || phase === "done") for (const [a, b] of segs(upper)) items.push({ ...edge(`u${pair(a, b)}`, a, b), tone: "accent" });
    for (const t of o.tests ?? []) {
      if (t.v > 0) continue;
      items.push({ ...edge(`r${pair(t.o, t.a)}`, t.o, t.a), tone: "error", dashed: true });
      items.push({ ...edge(`r${pair(t.a, t.p)}`, t.a, t.p), tone: "error", dashed: true });
    }
    const hull = new Set([...lower, ...upper]);
    pts.forEach((_, i) => {
      const tone: Tone =
        phase === "done"
          ? hull.has(i) ? "strong" : "muted"
          : o.popped?.includes(i) ? "error"
            : chain.includes(i) ? "accent"
              : phase === "upper" && lower.includes(i) ? "strong"
                : "plain";
      items.push({ k: "node", id: `p${i}`, x: pos[i].x, y: pos[i].y, r: R, text: nm[i], tone, size: 12 });
    });
    (o.text ?? []).forEach((l, k) => {
      const t = o.tests?.[k];
      items.push(note(`t${k}`, l, 0, TY + k * 17, { tone: t ? (t.v > 0 ? "accent" : "error") : k === 0 ? "ink" : "soft", size: 12 }));
    });
    items.push(rowLabel("ll", "lower", -10, SY, SZ));
    items.push(rowLabel("lu", "upper", UX - 10, SY, SZ));
    lower.forEach((p, i) => items.push(cell(`lo${p}`, slotX(i, 0, SZ), SY, nm[p], phase === "lower" ? "accent" : "strong", SZ, 13)));
    upper.forEach((p, i) => items.push(cell(`up${p}`, slotX(i, UX, SZ), SY, nm[p], phase === "done" ? "strong" : "accent", SZ, 13)));
    return items;
  };
  const edge = (id: string, a: number, b: number): Extract<Item, { k: "edge" }> => {
    const dx = pos[b].x - pos[a].x;
    const dy = pos[b].y - pos[a].y;
    const len = Math.hypot(dx, dy) || 1;
    return { k: "edge", id, x1: pos[a].x + (dx / len) * R, y1: pos[a].y + (dy / len) * R, x2: pos[b].x - (dx / len) * R, y2: pos[b].y - (dy / len) * R };
  };

  const turn = (t: Test) => `${nm[t.o]} → ${nm[t.a]} → ${nm[t.p]} turns ${t.v > 0 ? "counter-clockwise" : "clockwise"} (cross = ${signed(t.v)})`;
  const testLine = (t: Test) => `cross(${nm[t.o]}, ${nm[t.a]}, ${nm[t.p]}) = ${signed(t.v)}: ${t.v > 0 ? `left turn, keep ${nm[t.a]}` : `right turn, pop ${nm[t.a]}`}`;
  let explainedPop = false;
  let explainedKeep = false;

  const add = (chain: number[], p: number, prefix: string) => {
    const tests: Test[] = [];
    const popped: number[] = [];
    while (chain.length >= 2) {
      const t = { o: chain[chain.length - 2], a: chain[chain.length - 1], p, v: cross(chain[chain.length - 2], chain[chain.length - 1], p) };
      tests.push(t);
      if (t.v > 0) break;
      popped.push(chain.pop()!);
    }
    chain.push(p);
    const parts = tests.map((t) => (t.v > 0 ? `${turn(t)}, so ${nm[t.a]} stays and ${nm[p]} joins` : `${turn(t)}, so ${nm[t.a]} is popped`));
    if (tests.length === 0 || tests[tests.length - 1].v <= 0) parts.push(`with one point left, ${nm[p]} joins`);
    let why = "";
    if (popped.length && !explainedPop) {
      const t = tests[0];
      why = ` A clockwise turn means ${nm[t.a]} lies on the inner side of the segment ${nm[t.o]}${nm[t.p]}, so it cannot be a corner of the hull.`;
      explainedPop = true;
    } else if (!popped.length && !explainedKeep) {
      why = ` A counter-clockwise turn keeps the chain bending one way, which is what convex means.`;
      explainedKeep = true;
    }
    frames.push({ caption: `${prefix}Adding ${nm[p]}: ${parts.join("; ")}.${why}`, items: draw({ popped, tests, text: tests.map(testLine) }) });
  };

  lower = [0, 1];
  frames.push({
    caption: `Sort the points by x and name them A to G in that order. Andrew's monotone chain builds the lower hull left to right and the upper hull right to left, keeping only left turns; the sign of a cross product tells which way a turn goes.`,
    items: draw({ text: ["cross(o, a, b) = (a − o) × (b − o)", "> 0: left turn, keep  ·  ≤ 0: right turn, pop"] }),
  });
  for (let p = 2; p < pts.length; p++) add(lower, p, "");
  phase = "upper";
  upper = [pts.length - 1, pts.length - 2];
  const lowerText = lower.map((i) => nm[i]).join(" → ");
  for (let p = pts.length - 3; p >= 0; p--) add(upper, p, p === pts.length - 3 ? `The lower hull ${lowerText} is done; the upper pass restarts from ${nm[upper[0]]} and ${nm[upper[1]]}. ` : "");
  phase = "done";
  const hull = [...lower, ...upper.slice(1, -1)];
  const inside = pts.map((_, i) => i).filter((i) => !hull.includes(i));
  frames.push({
    caption: `The hull is ${hull.map((i) => nm[i]).join(" → ")}: the lower chain plus the upper one, which share the end points. ${and(inside.map((i) => nm[i]))} ${inside.length > 1 ? "lie" : "lies"} inside. Sorting costs O(n log n); each point is pushed and popped at most once per chain, so the scan itself is O(n).`,
    items: draw({ text: [`hull: ${hull.map((i) => nm[i]).join(" ")}`, `O(n log n) for the sort, O(n) for the chains`] }),
  });

  return finish({
    title: "Convex hull of a point set, with Andrew's monotone chain",
    input: `points = ${raw.map(([x, y]) => `(${x}, ${y})`).join(", ")}`,
    frames,
  });
}

/* ── game-theory: a subtraction game ──────────────────────────────── */

/** Take 1–3 stones, last stone wins: label positions W or L from 0 upwards and the multiples of 4 stand out. */
function subtractionGame(): Walkthrough {
  const N = 12;
  const MOVES = [1, 2, 3];
  const SZ = 32;
  const o = { size: SZ, gap: GAP };
  const win: Array<boolean | undefined> = Array(N + 1).fill(undefined);
  const LY = SZ + 44;
  const frames: Frame[] = [];

  const draw = (cur: number[], arcsFrom: number | null, text: string[], answer = false): Item[] => {
    const items: Item[] = [rowLabel("lbl", "stones", -10, 0, SZ)];
    items.push(
      ...row("s", Array.from({ length: N + 1 }, (_, i) => i), {
        ...o,
        tone: (i) => (cur.includes(i) ? "accent" : win[i] === false ? "strong" : "plain"),
      }),
    );
    win.forEach((w, i) => {
      if (w === undefined) return;
      items.push(note(`w${i}`, w ? "W" : "L", slotMid(i, 0, SZ), SZ + 14, { anchor: "middle", tone: w ? "soft" : "accent", size: 12, weight: 700 }));
    });
    if (arcsFrom !== null) {
      for (const k of MOVES) {
        const to = arcsFrom - k;
        if (to < 0) continue;
        items.push({ k: "edge", id: `m${k}`, x1: slotMid(arcsFrom, 0, SZ) - 3, y1: -3, x2: slotMid(to, 0, SZ) + 3, y2: -3, bow: 14 + 12 * k, arrow: true, tone: win[to] === false && !answer ? "accent" : "line" });
      }
    }
    items.push(...lines("ln", text, 0, LY));
    return items;
  };

  win[0] = false;
  frames.push({
    caption: `Take 1, 2 or 3 stones; whoever takes the last stone wins. With 0 stones the player to move has already lost, so 0 is a losing position (L). Work upwards: a position is winning (W) if some move leaves an L, and losing if every move leaves a W.`,
    items: draw([0], null, ["0: no move left, L"]),
  });

  const reach = (n: number) => MOVES.map((k) => n - k).filter((t) => t >= 0);
  const label = (n: number) => {
    win[n] = reach(n).some((t) => win[t] === false);
    return win[n];
  };
  const movesText = (n: number) => reach(n).map((t) => `${t} ${win[t] ? "W" : "L"}`).join(", ");

  for (let n = 1; n <= 8; n++) {
    const w = label(n)!;
    const targets = reach(n);
    const lose = targets.find((t) => win[t] === false);
    const Ls = win.flatMap((v, i) => (v === false ? [i] : []));
    let caption: string;
    if (w) {
      caption =
        targets.length === 1
          ? `From ${n} the only move leaves ${targets[0]}, which is L for the opponent, so ${n} is W: take the last stone.`
          : `From ${n} you can leave ${or(targets)}. Leaving ${lose} hands the opponent a losing position, so taking ${n - lose!} ${n - lose! === 1 ? "stone" : "stones"} wins: ${n} is W.`;
    } else {
      const gaps = Ls.slice(1).map((v, i) => v - Ls[i]);
      caption = `From ${n} every move — leaving ${or(targets)} — hands the opponent a winning position, so ${n} is L.${
        Ls.length > 2 && gaps.every((d) => d === gaps[0]) ? ` The losing positions so far, ${and(Ls.map(String))}, are ${gaps[0]} apart.` : ` Whoever faces ${n} stones loses against best play.`
      }`;
    }
    frames.push({ caption, items: draw([n], n, [`${n}: ${movesText(n)}  →  ${w ? "W" : "L"}`]) });
  }

  const rest = Array.from({ length: N - 8 }, (_, i) => 9 + i);
  rest.forEach(label);
  const ws = rest.filter((n) => win[n]);
  const ls = rest.filter((n) => !win[n]);
  const into = [...new Set(ws.flatMap((n) => reach(n).filter((t) => win[t] === false)))];
  frames.push({
    caption: `The same check runs on: ${and(ws.map(String))} can each leave ${or(into)}, an L, so they are W; ${and(ls.map(String))} can only leave W positions, so ${ls.length > 1 ? "they are" : "it is"} L.`,
    items: draw(rest, ls[ls.length - 1] ?? null, [`${ws.join(", ")}: each can leave ${or(into)} (L)  →  W`, ...ls.map((n) => `${n}: ${movesText(n)}  →  L`)]),
  });

  const L = win.flatMap((v, i) => (v === false ? [i] : []));
  const period = L[1] - L[0];
  frames.push({
    caption: `The L positions are ${and(L.map(String))}, the multiples of ${period}: from a multiple of ${period}, any take of 1 to 3 leaves a non-multiple, and the opponent takes ${period} minus that to restore one. The table costs O(n) with 3 moves per position; the pattern answers in O(1): the first player wins exactly when n % ${period} ≠ 0.`,
    items: draw([], null, [`L = {${L.join(", ")}}: n % ${period} == 0`, `first player wins when n % ${period} != 0`], true),
  });

  return finish({ title: "Who wins the take-1-to-3 stone game, with winning and losing positions", input: `take 1, 2 or 3 stones; last stone wins; n = 0..${N}`, frames });
}

/* ── brainteaser: bulb switcher ───────────────────────────────────── */

/** n = 10 bulbs, round i toggles every i-th one: only the perfect squares, with an odd number of divisors, end on. */
function bulbSwitcher(): Walkthrough {
  const N = 10;
  const R = 17;
  const PITCH = 46;
  const on = Array<boolean>(N + 1).fill(false);
  const divs: number[][] = Array.from({ length: N + 1 }, () => []);
  const bx = (k: number) => (k - 1) * PITCH;
  const TY = R + 14;
  const BY = TY + 4 * 14 + 14;
  const frames: Frame[] = [];

  const draw = (round: number, text: string, answer = false): Item[] => {
    const items: Item[] = [note("hd", text, -R, -R - 18, { tone: "soft", size: 12 })];
    for (let k = 1; k <= N; k++) {
      const final = k <= round;
      const tone: Tone = answer ? (on[k] ? "strong" : "muted") : final ? (on[k] ? "strong" : "muted") : on[k] ? "accent" : "plain";
      items.push({ k: "node", id: `b${k}`, x: bx(k), y: 0, r: R, text: String(k), tone, size: 13 });
      divs[k].forEach((d, j) => items.push(note(`t${k}_${d}`, String(d), bx(k), TY + j * 14, { anchor: "middle", size: 11, tone: d === round && !answer ? "accent" : "faint" })));
    }
    const lit = on.flatMap((v, k) => (v ? [k] : []));
    items.push(note("on", `on: ${lit.length ? lit.join(", ") : "none"}  (${lit.length})`, -R, BY, { weight: 600, size: 12 }));
    return items;
  };

  frames.push({
    caption: `Ten bulbs start off. In round i every i-th bulb is toggled, so bulb k is toggled once for each divisor of k; the numbers under each bulb will list the rounds that touched it.`,
    items: draw(0, "before round 1: all off"),
  });

  for (let i = 1; i <= N; i++) {
    const flipped: number[] = [];
    for (let k = i; k <= N; k += i) {
      on[k] = !on[k];
      divs[k].push(i);
      flipped.push(k);
    }
    const nowOn = flipped.filter((k) => on[k]).map(String);
    const nowOff = flipped.filter((k) => !on[k]).map(String);
    let head: string;
    if (i === 1) head = `Round 1 toggles every bulb, so all ${N} are on.`;
    else if (flipped.length === 1) head = `Round ${i} toggles only bulb ${i}, since 2 × ${i} > ${N}; it goes ${on[i] ? "on" : "off"}.`;
    else if (!nowOn.length || !nowOff.length) head = `Round ${i} toggles ${and(flipped.map(String))}, switching them all ${nowOn.length ? "on" : "off"}.`;
    else head = `Round ${i} toggles ${and(flipped.map(String))}: ${and(nowOn)} ${nowOn.length > 1 ? "come" : "comes"} on and ${and(nowOff)} ${nowOff.length > 1 ? "go" : "goes"} off.`;
    const c = divs[i].length;
    const tail = `No later round divides ${i}, so bulb ${i} is now final: ${plural(c, "toggle")} (${divs[i].join(", ")}), ${c % 2 ? "odd, so it stays on" : "even, so it stays off"}.`;
    frames.push({ caption: `${head} ${tail}`, items: draw(i, `round ${i}: toggle every ${i === 1 ? "" : `${ordinal(i)} `}bulb: ${flipped.join(", ")}`) });
  }

  const lit = on.flatMap((v, k) => (v ? [k] : []));
  frames.push({
    caption: `Only bulbs ${and(lit.map(String))} are on — the perfect squares. Divisors pair up as d and k / d, and only a square has one divisor without a partner (its root), so only squares are toggled an odd number of times. The answer is ⌊√${N}⌋ = ${lit.length}, in O(1) instead of an O(n log n) simulation.`,
    items: draw(N, `after ${N} rounds: on = perfect squares ≤ ${N}`, true),
  });

  return finish({ title: "Bulb switcher: which bulbs stay on, with divisor counting", input: `n = ${N} bulbs; round i toggles every i-th bulb`, frames });
}

/* ── bit-manipulation: n & (n − 1) ────────────────────────────────── */

/** Counting set bits of 44: n & (n − 1) clears the lowest 1 bit, so the loop runs once per set bit. */
function popcount(): Walkthrough {
  const n0 = 44;
  const BITS = 6;
  const bitsOf = (v: number) => Array.from({ length: BITS }, (_, i) => (v >> (BITS - 1 - i)) & 1);
  const bin = (v: number) => bitsOf(v).join("");
  const NY = 0;
  const MY = 62;
  const RY = 124;
  const CY = RY + CELL + 30;
  const VX = slotX(BITS) + 10;
  const frames: Frame[] = [];
  const history: number[] = [n0];
  let count = 0;

  /** Bit columns (0 = leftmost) from the lowest set bit of v down to the 1s place: what n − 1 flips. */
  const flipRegion = (v: number) => {
    const low = Math.log2(v & -v);
    return { low, cols: Array.from({ length: low + 1 }, (_, k) => BITS - 1 - k) };
  };

  const draw = (g: number, v: number, o: { minus?: boolean; result?: boolean; answer?: boolean }): Item[] => {
    const items: Item[] = [];
    bitsOf(1 << (BITS - 1)).forEach((_, i) => items.push(note(`pw${i}`, String(2 ** (BITS - 1 - i)), slotMid(i), NY - 12, { anchor: "middle", tone: "faint", size: 10 })));
    items.push(rowLabel("ln", "n", -10, NY));
    const region = v ? flipRegion(v).cols : [];
    const bits = bitsOf(v);
    bits.forEach((b, i) => items.push(cell(`v${g}_${i}`, slotX(i), NY, String(b), o.answer ? "muted" : region.includes(i) && (o.minus || o.result) ? "accent" : "plain")));
    items.push(note("dn", `= ${v}`, VX, NY + CELL / 2, { weight: 600 }));
    if (o.minus || o.result) {
      items.push(rowLabel("lm", "n − 1", -10, MY));
      bitsOf(v - 1).forEach((b, i) => items.push(cell(`m${g}_${i}`, slotX(i), MY, String(b), region.includes(i) ? "accent" : "plain")));
      items.push(note("dm", `= ${v - 1}`, VX, MY + CELL / 2, { weight: 600 }));
    }
    if (o.result) {
      const r = v & (v - 1);
      items.push(rowLabel("lr", "n & (n − 1)", -10, RY));
      bitsOf(r).forEach((b, i) => items.push(cell(`v${g + 1}_${i}`, slotX(i), RY, String(b), region.includes(i) ? "muted" : "plain")));
      items.push(note("dr", `= ${r}`, VX, RY + CELL / 2, { weight: 600 }));
    }
    items.push(rowLabel("lc", "count", -10, CY));
    items.push(cell("cnt", 0, CY, String(count), o.answer ? "strong" : o.result ? "accent" : "plain"));
    items.push(note("hist", history.join(" → "), CELL + 16, CY + CELL / 2, { tone: "soft", size: 12 }));
    return items;
  };

  frames.push({
    caption: `Count the 1 bits of ${n0} = ${bin(n0)}. Checking every position takes a step per bit; instead, n & (n − 1) deletes the lowest 1 bit in a single operation, so the loop runs once per 1 bit until n reaches 0.`,
    items: draw(0, n0, {}),
  });

  let v = n0;
  let g = 0;
  while (v) {
    const { low } = flipRegion(v);
    const place = 2 ** low;
    const top = low === BITS - 1 || v >> (low + 1) === 0;
    const flips = low + 1;
    frames.push({
      caption:
        g === 0
          ? `${v} − 1 = ${v - 1}: subtracting 1 borrows from the lowest 1 bit (the ${place}s place), which becomes 0 while every 0 below it becomes 1. ${top ? `There are no 1 bits above it, so nothing else survives.` : `The bits above it are untouched.`}`
          : `Now n = ${v} = ${bin(v)}, whose lowest 1 bit is the ${place}s place, so ${v} − 1 = ${v - 1} flips the ${flips} bits from there down. ${top ? `No 1 bit sits above it any more.` : `The bits above it are still untouched.`}`,
      items: draw(g, v, { minus: true }),
    });
    const r = v & (v - 1);
    count++;
    history.push(r);
    frames.push({
      caption:
        g === 0
          ? `AND keeps a bit only where both rows have a 1: the higher bits survive and the flipped region is all 0s. ${v} & ${v - 1} = ${r} = ${bin(r)} — exactly one 1 bit is gone, so count = ${count}.`
          : `The AND wipes the ${flips} flipped bits again: ${v} & ${v - 1} = ${r} = ${bin(r)}, one fewer 1 bit, so count = ${count}.${r === 0 ? " Nothing is left, so the loop ends." : ""}`,
      items: draw(g, v, { result: true }),
    });
    v = r;
    g++;
  }

  frames.push({
    caption: `n reached 0 after ${count} rounds, so ${n0} has ${count} set bits. The loop runs once per 1 bit — O(k) for k set bits instead of O(log n) for every bit — and the same trick tests for a power of two: n & (n − 1) == 0.`,
    items: draw(g, 0, { answer: true }),
  });

  return finish({ title: "Counting set bits, with n & (n − 1) clearing the lowest one", input: `n = ${n0} (${bin(n0)} in binary)`, frames });
}

/* ── strings: valid palindrome with two pointers ──────────────────── */

/** "Don't nod." is a palindrome once non-alphanumerics are skipped and case is ignored: two pointers walk inward. */
function validPalindrome(): Walkthrough {
  const s = "Don't nod.";
  const chars = [...s];
  const alnum = (c: string) => /[a-z0-9]/i.test(c);
  const name: Record<string, string> = { " ": "a space", "'": "an apostrophe", ".": "a full stop", ",": "a comma", "!": "an exclamation mark", "?": "a question mark" };
  const said = (c: string) => name[c] ?? `'${c}'`;
  const shown = (c: string) => (c === " " ? "␣" : c);
  const skipped = new Set<number>();
  const matched = new Set<number>();
  const frames: Frame[] = [];
  let L = 0;
  let R = chars.length - 1;
  let bad: [number, number] | null = null;

  const draw = (text: string[], answer = false): Item[] => {
    const items: Item[] = [rowLabel("lbl", "s", -10, 0)];
    items.push(
      ...row("c", chars.map(shown), {
        index: true,
        tone: (i) => (bad && bad.includes(i) ? "error" : skipped.has(i) ? "muted" : answer ? "strong" : matched.has(i) ? "accent" : "plain"),
      }),
    );
    items.push(under("L", L, "left", { indexed: true }));
    items.push(over("R", R, "right", { tone: "ink" }));
    items.push(...lines("ln", text, 0, CELL + 60));
    return items;
  };

  frames.push({
    caption: `Two pointers start at the two ends of "${s}" and walk inward. Anything that is not a letter or digit is skipped, and letters are compared in lower case, so spaces, punctuation and capitals cannot spoil the check.`,
    items: draw([`left = ${L}, right = ${R}`, "skip non-alphanumerics, compare lower-cased"]),
  });

  let pairs = 0;
  while (L < R) {
    if (!alnum(chars[L])) {
      const c = chars[L];
      skipped.add(L);
      L++;
      frames.push({
        caption: `The left pointer is on ${said(c)}, which is not a letter or digit, so it steps right to index ${L} without comparing anything${L >= R ? `, which meets the right pointer` : ""}.`,
        items: draw([`skip ${said(c).replace(/^an? /, "")}`, `left = ${L}, right = ${R}`]),
      });
      continue;
    }
    if (!alnum(chars[R])) {
      const c = chars[R];
      skipped.add(R);
      R--;
      frames.push({
        caption:
          L >= R
            ? `The right pointer skips ${said(c)} and lands on index ${R}, where the left pointer already is. The pointers have met, so every pair of letters has been checked.`
            : `The right pointer is on ${said(c)}, which is not a letter or digit, so it steps left to index ${R} without comparing anything.`,
        items: draw([`skip ${said(c).replace(/^an? /, "")}`, `left = ${L}, right = ${R}`]),
      });
      continue;
    }
    const a = chars[L];
    const b = chars[R];
    const same = a.toLowerCase() === b.toLowerCase();
    if (!same) {
      bad = [L, R];
      frames.push({ caption: `'${a}' and '${b}' differ even in lower case, so the string is not a palindrome and the check stops here.`, items: draw([`'${a}' ≠ '${b}'`]) });
      break;
    }
    matched.add(L);
    matched.add(R);
    pairs++;
    const lo = a.toLowerCase();
    frames.push({
      caption: `'${a}' and '${b}' ${a === b ? "are the same letter" : `match once both are lower-cased to '${lo}'`}, so this pair is fine${pairs === 1 ? " — a single differing pair would end the check with false" : ""}. ${pairs === 1 ? `Both pointers move inward, to ${L + 1} and ${R - 1}.` : `That makes ${pairs} matching pairs; the pointers close in to ${L + 1} and ${R - 1}.`}`,
      items: draw([`'${a}' vs '${b}' → '${lo}' = '${lo}'`, `pairs matched: ${pairs}`]),
    });
    L++;
    R--;
  }

  const letters = chars.filter(alnum).map((c) => c.toLowerCase());
  frames.push({
    caption: bad
      ? `"${s}" is not a palindrome. Each index was visited at most once, so the check is O(n) time and O(1) space.`
      : `"${s}" is a valid palindrome: its letters read ${letters.join("-")} both ways. Each index is visited at most once by one pointer, so the check is O(n) time and O(1) space, with no cleaned copy of the string.`,
    items: draw([`palindrome: ${!bad}`, `${pairs} pairs compared, ${skipped.size} characters skipped`], !bad),
  });

  return finish({ title: "Valid palindrome ignoring case and punctuation, with two pointers", input: `s = "${s}"`, frames });
}

/* ── string-matching: naive search ────────────────────────────────── */

/** Naive pattern search: try the pattern at every shift, comparing left to right until a mismatch or a full match. */
function naiveSearch(): Walkthrough {
  const t = "ababcabcab";
  const p = "abc";
  const n = t.length;
  const m = p.length;
  const PY = 70;
  const frames: Frame[] = [];
  const found: number[] = [];
  let comparisons = 0;
  let quick = 0;

  const draw = (s: number, upto: number, ok: boolean, text: string[], answer = false): Item[] => {
    const items: Item[] = [];
    if (!answer) items.push(bandOver("win", s, s + m - 1, { y: 0 }));
    items.push(rowLabel("lt", "text", -10, 0));
    if (!answer) items.push(rowLabel("lp", "pattern", -10, PY));
    found.forEach((f) => items.push(spanOver(`f${f}`, f, f + m - 1, `match at ${f}`, { y: 0, lift: answer ? 10 : 10 })));
    items.push(
      ...row("t", [...t], {
        index: true,
        tone: (i) => {
          const j = i - s;
          if (!answer && j >= 0 && j < m && j < upto) return "accent";
          if (!answer && j === upto && !ok) return "error";
          if (found.some((f) => i >= f && i < f + m)) return "strong";
          return "plain";
        },
      }),
    );
    if (!answer) items.push(...row("p", [...p], { x: slotX(s), y: PY, tone: (j) => (j < upto ? "accent" : j === upto && !ok ? "error" : "plain") }));
    items.push(...lines("ln", text, 0, PY + CELL + 28));
    return items;
  };

  frames.push({
    caption: `Naive search tries the pattern "${p}" at every starting position s of the text, comparing left to right and giving up at the first mismatch. A text of ${n} and a pattern of ${m} leave ${n} − ${m} + 1 = ${n - m + 1} positions to try.`,
    items: draw(0, 0, true, [`positions to try: 0..${n - m}`, "found: none yet"]),
  });

  for (let s = 0; s + m <= n; s++) {
    let j = 0;
    while (j < m) {
      comparisons++;
      if (t[s + j] !== p[j]) break;
      j++;
    }
    const ok = j === m;
    if (ok) found.push(s);
    let caption: string;
    if (ok) caption = `At s = ${s} all ${m} characters agree: "${p}" occurs at index ${s}.${found.length === 1 ? " The search keeps going, to find every occurrence." : ""}`;
    else if (j === 0) {
      quick++;
      caption =
        quick === 1
          ? `At s = ${s} the very first comparison fails: '${t[s]}' is not '${p[0]}', so the pattern moves on after one look.`
          : quick === 2
            ? `At s = ${s}, '${t[s]}' is not '${p[0]}' either: one comparison and the pattern shifts again. A mismatch on the first character is the cheap case.`
            : `At s = ${s}, text[${s}] = '${t[s]}' fails against '${p[0]}' straight away — ${comparisons} comparisons so far.`;
    }
    else
      caption = `At s = ${s}, "${p.slice(0, j)}" matches but text[${s + j}] = '${t[s + j]}' is not '${p[j]}'. The ${plural(j, "matched character")} ${j > 1 ? "are" : "is"} thrown away and the pattern shifts by just one place, so ${j > 1 ? "they" : "it"} will be read again.`;
    frames.push({
      caption,
      items: draw(s, j, ok, [`s = ${s}: ${ok ? `${m} of ${m} match` : `mismatch at j = ${j}`}`, `found: ${found.length ? found.join(", ") : "none yet"};  comparisons: ${comparisons}`]),
    });
  }

  frames.push({
    caption: `"${p}" occurs at ${and(found.map(String))}. All ${n - m + 1} positions were tried with ${comparisons} character comparisons; in the worst case each costs m, so naive search is O(n × m) — and it re-reads text it has already matched.`,
    items: draw(0, 0, true, [`matches at ${found.join(", ")}`, `${comparisons} comparisons; worst case O(n × m)`], true),
  });

  return finish({ title: "Finding a pattern in a text, with naive string matching", input: `text = "${t}", pattern = "${p}"`, frames });
}

/* ── kmp: Knuth–Morris–Pratt ──────────────────────────────────────── */

/** KMP: build the lps (failure) table for "ababc", then search with it so the text pointer never moves back. */
function kmp(): Walkthrough {
  const t = "ababacababc";
  const p = "ababc";
  const n = t.length;
  const m = p.length;
  const SZ = 36;
  const G = 6;
  const o = { size: SZ, gap: G };
  const TY = 0;
  const PY = 94;
  const LY = PY + SZ + 8;
  const XY = LY + SZ + 28;
  const lps: Array<number | undefined> = Array(m).fill(undefined);
  const frames: Frame[] = [];

  const draw = (v: { shift: number; text?: (i: number) => Tone; pat?: (j: number) => Tone; lpsTone?: (j: number) => Tone | undefined; ptrs: Item[]; lines: string[] }): Item[] => {
    const items: Item[] = [rowLabel("lt", "text", -10, TY, SZ), rowLabel("lp", "pattern", -10, PY, SZ), rowLabel("ll", "lps", -10, LY, SZ)];
    items.push(...row("t", [...t], { y: TY, ...o, index: true, tone: v.text ?? (() => "plain") }));
    const x = slotX(v.shift, 0, SZ, G);
    items.push(...row("p", [...p], { x, y: PY, ...o, tone: v.pat ?? (() => "plain") }));
    for (let j = 0; j < m; j++) {
      const val = lps[j];
      items.push(cell(`l${j}`, slotX(j, x, SZ, G), LY, val === undefined ? "" : String(val), val === undefined ? "ghost" : (v.lpsTone?.(j) ?? "plain"), SZ));
    }
    items.push(...v.ptrs);
    items.push(...lines("ln", v.lines, 0, XY));
    return items;
  };

  lps[0] = 0;
  frames.push({
    caption: `KMP first studies the pattern "${p}" on its own: lps[i] is the length of the longest proper prefix of p[0..i] that is also a suffix of it. lps[0] = 0. On a mismatch, this table says how much of the match so far can be kept.`,
    items: draw({ shift: 0, text: () => "muted", lpsTone: (j) => (j === 0 ? "accent" : undefined), ptrs: [], lines: ["lps[i] = longest border of p[0..i]", "lps[0] = 0"] }),
  });

  // Build the table, one frame per i (the fallbacks inside an i stay in its frame).
  let len = 0;
  for (let i = 1; i < m; i++) {
    const tried: Array<{ len: number; eq: boolean }> = [];
    for (;;) {
      const eq = p[i] === p[len];
      tried.push({ len, eq });
      if (eq) {
        len++;
        break;
      }
      if (len === 0) break;
      len = lps[len - 1]!;
    }
    lps[i] = len;
    const last = tried[tried.length - 1];
    let caption: string;
    if (tried.length === 1 && last.eq)
      caption = `p[${i}] = '${p[i]}' equals p[${last.len}], so the border grows to "${p.slice(0, len)}", which is both a prefix and a suffix of "${p.slice(0, i + 1)}": lps[${i}] = ${len}.`;
    else if (tried.length === 1)
      caption = `p[${i}] = '${p[i]}' differs from p[0] = '${p[0]}', so no prefix of "${p.slice(0, i + 1)}" is also a suffix of it: lps[${i}] = 0.`;
    else {
      const steps = tried.slice(0, -1).map((tr, q) => `${q === 0 ? `p[${i}] = '${p[i]}'` : `'${p[i]}'`} ≠ p[${tr.len}] = '${p[tr.len]}', so len falls back to lps[${tr.len - 1}] = ${lps[tr.len - 1]}`);
      caption = `${steps.join("; ")}; ${last.eq ? `then '${p[i]}' = p[${last.len}], so lps[${i}] = ${len}` : `'${p[i]}' ≠ p[0] = '${p[0]}' too, so lps[${i}] = 0`}. Falling back through the table is the same move the search will make.`;
    }
    const lensTried = tried.map((tr) => tr.len);
    frames.push({
      caption,
      items: draw({
        shift: 0,
        text: () => "muted",
        pat: (j) => (j === i ? (last.eq ? "accent" : "error") : lensTried.includes(j) ? (j === last.len && last.eq ? "accent" : "error") : "plain"),
        lpsTone: (j) => (j === i ? "accent" : undefined),
        ptrs: [over("pi", i, "i", { y: PY, size: SZ, gap: G }), over("pl", last.len, "len", { y: PY, size: SZ, gap: G, tone: "ink" })],
        lines: [`p[${i}] = '${p[i]}' vs ${tried.map((tr) => `p[${tr.len}] = '${p[tr.len]}'`).join(", then ")}`, `lps = ${show(lps.map((x) => (x === undefined ? "·" : x)))}`],
      }),
    });
  }

  // Search, recording every comparison and fallback, then grouping them into frames.
  type Ev = { k: "match" | "mis" | "found"; i: number; j: number } | { k: "fall"; i: number; from: number; to: number };
  const ev: Ev[] = [];
  {
    let i = 0;
    let j = 0;
    while (i < n) {
      if (t[i] === p[j]) {
        ev.push({ k: "match", i, j });
        i++;
        j++;
        if (j === m) {
          ev.push({ k: "found", i: i - m, j: m });
          break;
        }
      } else if (j > 0) {
        ev.push({ k: "mis", i, j });
        const to = lps[j - 1]!;
        ev.push({ k: "fall", i, from: j, to });
        j = to;
      } else {
        ev.push({ k: "mis", i, j: 0 });
        i++;
      }
    }
  }
  const comparisons = ev.filter((e) => e.k === "match" || e.k === "mis").length;
  let naive = 0;
  for (let s = 0; s + m <= n; s++) {
    let j = 0;
    while (j < m) {
      naive++;
      if (t[s + j] !== p[j]) break;
      j++;
    }
    if (j === m) break;
  }

  const solid = new Set<number>();
  let explainedNaive = false;
  let k = 0;
  while (k < ev.length) {
    const e = ev[k];
    if (e.k === "match" || e.k === "mis") {
      const group: Ev[] = [];
      while (k < ev.length && ev[k].k === "match") group.push(ev[k++]);
      if (k < ev.length && (ev[k].k === "mis" || ev[k].k === "found")) group.push(ev[k++]);
      const first = group[0] as { i: number; j: number };
      const shift = first.i - first.j;
      const end = group[group.length - 1];
      const matches = group.filter((g) => g.k === "match") as Array<{ i: number; j: number }>;
      const pre = first.j;
      if (end.k === "found") {
        for (let i = shift; i < shift + m; i++) solid.add(i);
        frames.push({
          caption: `${pre ? `With "${p.slice(0, pre)}" already matched, comparing resumes at t[${first.i}]` : `From i = ${first.i}`}: ${matches.length === m - pre ? `every character agrees` : "the characters agree"} and j reaches ${m}, the pattern's length. "${p}" occurs at index ${shift}.`,
          items: draw({
            shift,
            text: (i) => (i >= shift && i < shift + m ? "accent" : "plain"),
            pat: () => "accent",
            ptrs: [over("ti", shift + m - 1, "i", { y: TY, size: SZ, gap: G }), over("pj", m - 1, "j", { x: slotX(shift, 0, SZ, G), y: PY, size: SZ, gap: G, tone: "ink" })],
            lines: [`t[${shift}..${shift + m - 1}] = "${t.slice(shift, shift + m)}" = p`, `match at ${shift}`],
          }),
        });
        continue;
      }
      const mis = end as { i: number; j: number };
      const read = matches.map((g) => t[g.i]).join("");
      let caption = pre
        ? `With "${p.slice(0, pre)}" already matched, comparing resumes at t[${first.i}] against p[${pre}]: ${read ? `"${read}" matches, then ` : ""}t[${mis.i}] = '${t[mis.i]}' is not p[${mis.j}] = '${p[mis.j]}'.`
        : `${read ? `i and j advance together while the characters agree: "${read}" matches, but` : "At once,"} t[${mis.i}] = '${t[mis.i]}' is not p[${mis.j}] = '${p[mis.j]}'.`;
      if (read.length > 0 && !explainedNaive) {
        caption += ` Naive search would restart at index ${shift + 1} and re-read the text; KMP keeps i at ${mis.i}.`;
        explainedNaive = true;
      }
      frames.push({
        caption,
        items: draw({
          shift,
          text: (i) => (i === mis.i ? "error" : i >= shift && i < mis.i ? "accent" : "plain"),
          pat: (j) => (j === mis.j ? "error" : j < mis.j ? "accent" : "plain"),
          ptrs: [over("ti", mis.i, "i", { y: TY, size: SZ, gap: G }), over("pj", mis.j, "j", { x: slotX(shift, 0, SZ, G), y: PY, size: SZ, gap: G, tone: "ink" })],
          lines: [`t[${mis.i}] = '${t[mis.i]}' ≠ p[${mis.j}] = '${p[mis.j]}'`, `i = ${mis.i}, j = ${mis.j}`],
        }),
      });
    } else {
      // A fallback, and any further mismatches and fallbacks at the same i.
      const group: Ev[] = [];
      while (k < ev.length && (ev[k].k === "fall" || ev[k].k === "mis")) {
        const g = ev[k++];
        group.push(g);
        if (g.k === "mis" && g.j === 0) break;
      }
      const falls = group.filter((g) => g.k === "fall") as Array<{ i: number; from: number; to: number }>;
      const i = falls[0].i;
      const last = group[group.length - 1];
      const deadEnd = last.k === "mis";
      const j = deadEnd ? 0 : falls[falls.length - 1].to;
      const shift = i - j;
      const used = falls.map((f) => f.from - 1);
      let caption: string;
      if (group.length === 1) {
        const f = falls[0];
        caption = `On a mismatch j falls back to lps[${f.from - 1}] = ${f.to}: "${p.slice(0, f.from)}" ends with "${p.slice(0, f.to)}", the pattern's own start, so the pattern slides ${f.from - f.to} places and those ${f.to} characters count as matched without being read again. i stays at ${i}.`;
      } else {
        const parts: string[] = [];
        group.forEach((g, gi) => {
          if (g.k !== "fall") return;
          const next = group[gi + 1];
          const miss = next && next.k === "mis" ? `'${t[next.i]}' is not p[${next.j}] = '${p[next.j]}'` : "";
          parts.push(
            parts.length === 0
              ? `j falls back to lps[${g.from - 1}] = ${g.to}${miss ? `, but ${miss} either` : ""}`
              : `then to lps[${g.from - 1}] = ${g.to}${miss ? `, and ${miss}` : ""}`,
          );
        });
        caption = `Still at i = ${i}: ${parts.join("; ")}.${deadEnd ? ` No prefix of the pattern can end at index ${i}, so i moves on to ${i + 1} — forward, never back.` : ""}`;
      }
      frames.push({
        caption,
        items: draw({
          shift,
          text: (x) => (deadEnd && x === i ? "error" : x >= shift && x < i ? "accent" : "plain"),
          pat: (y) => (deadEnd && y === 0 ? "error" : y < j ? "accent" : "plain"),
          lpsTone: (y) => (used.includes(y) ? "accent" : undefined),
          ptrs: [over("ti", i, "i", { y: TY, size: SZ, gap: G }), over("pj", j, "j", { x: slotX(shift, 0, SZ, G), y: PY, size: SZ, gap: G, tone: "ink" })],
          lines: [falls.map((f) => `j = lps[${f.from - 1}] = ${f.to}`).join(", then "), deadEnd ? `'${t[i]}' ≠ p[0]: i = ${i + 1}` : `i stays ${i}, j = ${j}`],
        }),
      });
    }
  }

  const at = (ev.find((e) => e.k === "found") as { i: number } | undefined)?.i ?? -1;
  frames.push({
    caption: `KMP finds "${p}" at index ${at} with ${comparisons} character comparisons, where naive search makes ${naive}. i never moves backwards and each fallback undoes an earlier step of j, so the search is O(n) after an O(m) table: O(n + m) in all.`,
    items: draw({
      shift: at,
      text: (i) => (i >= at && i < at + m ? "strong" : "plain"),
      pat: () => "strong",
      ptrs: [],
      lines: [`match at ${at}`, `${comparisons} comparisons (naive: ${naive}); O(n + m)`],
    }),
  });

  return finish({ title: "Pattern search without backtracking, with the Knuth–Morris–Pratt algorithm", input: `text = "${t}", pattern = "${p}"`, frames });
}

/* ── rolling-hash: Rabin–Karp ─────────────────────────────────────── */

/** Rabin–Karp on digits, base 10 mod 13: the window's hash is updated in O(1) per slide, and only equal hashes are checked digit by digit. */
function rabinKarp(): Walkthrough {
  const t = "31415926535";
  const p = "653";
  const B = 10;
  const Q = 13;
  const n = t.length;
  const m = p.length;
  const SZ = 36;
  const G = 6;
  const o = { size: SZ, gap: G };
  const TY = 0;
  const PY = 66;
  const HY = PY + SZ + 22;
  const XY = HY + SZ + 26;
  let pow = 1;
  for (let k = 1; k < m; k++) pow = (pow * B) % Q;
  const hashOf = (s: string) => [...s].reduce((h, c) => (h * B + Number(c)) % Q, 0);
  const ph = hashOf(p);
  const hashes: number[] = [];
  const kind: Array<"miss" | "spurious" | "match"> = [];
  const frames: Frame[] = [];

  const draw = (w: number, v: { upto?: number; ok?: boolean; answer?: boolean; text: string[] }): Item[] => {
    const items: Item[] = [];
    const real = kind.flatMap((x, i) => (x === "match" ? [i] : []));
    if (!v.answer) items.push({ k: "band", id: "win", x: slotX(w, 0, SZ, G) - 4, y: TY - 4, w: m * (SZ + G) - G + 8, h: PY + SZ - TY + 8, tone: "accent" });
    items.push(rowLabel("lt", "text", -10, TY, SZ), rowLabel("lp", "pattern", -10, PY, SZ), rowLabel("lh", "hash", -10, HY, SZ));
    items.push(
      ...row("t", [...t], {
        y: TY,
        ...o,
        index: true,
        tone: (i) => {
          const j = i - w;
          if (v.answer) return real.some((r) => i >= r && i < r + m) ? "strong" : "plain";
          if (v.upto !== undefined && j === v.upto && !v.ok) return "error";
          if (j >= 0 && j < m) return v.upto !== undefined && j < v.upto ? "accent" : "plain";
          return "plain";
        },
      }),
    );
    items.push(...row("p", [...p], { x: slotX(v.answer ? real[0] ?? w : w, 0, SZ, G), y: PY, ...o, tone: (j) => (v.answer ? "strong" : v.upto === undefined ? "plain" : j < v.upto ? "accent" : j === v.upto && !v.ok ? "error" : "plain") }));
    hashes.forEach((h, k) => {
      const cur = k === w && !v.answer;
      const tone: Tone = kind[k] === "match" ? "strong" : kind[k] === "spurious" ? "error" : cur ? "accent" : "plain";
      items.push(cell(`h${k}`, slotX(k, 0, SZ, G), HY, String(h), tone, SZ, 13));
    });
    items.push(...lines("ln", v.text, 0, XY));
    return items;
  };

  hashes.push(hashOf(t.slice(0, m)));
  const verify = (w: number) => {
    let j = 0;
    while (j < m && t[w + j] === p[j]) j++;
    kind[w] = hashes[w] !== ph ? "miss" : j === m ? "match" : "spurious";
    return j;
  };
  const verdict = (w: number, j: number) => (kind[w] === "miss" ? `${hashes[w]} ≠ ${ph}: skip` : kind[w] === "match" ? `${ph} = ${ph}: digits agree, match at ${w}` : `${ph} = ${ph}: ${t[w + j]} ≠ ${p[j]}, spurious hit`);
  const j0 = verify(0);
  frames.push({
    caption: `Rabin–Karp compares hashes before characters. Reading digits as a base-${B} number mod ${Q}, the pattern ${p} hashes to ${p} mod ${Q} = ${ph}, and the first window ${t.slice(0, m)} to ${hashes[0]}. Different hashes prove a window cannot match; only equal ones need a digit check.`,
    items: draw(0, { text: [`pattern: ${p} mod ${Q} = ${ph};  ${B}${sup(m - 1)} mod ${Q} = ${pow}`, `window ${t.slice(0, m)}: ${t.slice(0, m)} mod ${Q} = ${hashes[0]}`, verdict(0, j0)] }),
  });

  let misses = 0;
  for (let w = 1; w + m <= n; w++) {
    const out = Number(t[w - 1]);
    const inn = Number(t[w + m - 1]);
    const h = hashes[w - 1];
    const h2 = ((((h - out * pow) * B + inn) % Q) + Q) % Q;
    hashes.push(h2);
    if (h2 !== hashOf(t.slice(w, w + m))) throw new Error("rabinKarp: rolling hash drifted");
    const j = verify(w);
    const win = t.slice(w, w + m);
    const formula = `((${h} − ${out} × ${pow}) × ${B} + ${inn}) mod ${Q} = ${h2}`;
    let caption: string;
    if (kind[w] === "miss") {
      misses++;
      caption =
        misses === 1
          ? `Slide to ${win}: ${out} leaves and ${inn} enters, so the hash updates in O(1) as ${formula} (${pow} is the leaving digit's place value, ${B}${sup(m - 1)} mod ${Q}). That is not ${ph}, so the window is skipped without reading a digit.`
          : `Slide to ${win}: drop ${out}, add ${inn}, and the hash becomes ${formula}. That is not ${ph} either, so again no digit is read.`;
    } else if (kind[w] === "match") {
      caption = `Slide to ${win}: the update ${formula} equals the pattern's hash, and all ${m} digits agree, so ${p} really occurs at index ${w}.`;
    } else {
      caption = `Slide to ${win}: the update ${formula} equals the pattern's hash, so the digits are checked: ${t[w + j]} ≠ ${p[j]} at once — a spurious hit, since ${win} and ${p} merely share a remainder mod ${Q}.`;
    }
    frames.push({
      caption,
      items: draw(w, {
        upto: kind[w] === "miss" ? undefined : j,
        ok: kind[w] === "match",
        text: [`pattern: ${p} mod ${Q} = ${ph}`, `window ${win}: ((${h} − ${out} × ${pow}) × ${B} + ${inn}) mod ${Q} = ${h2}`, verdict(w, j)],
      }),
    });
  }

  const real = kind.flatMap((x, i) => (x === "match" ? [i] : []));
  const spur = kind.flatMap((x, i) => (x === "spurious" ? [i] : []));
  frames.push({
    caption: `${p} occurs at index ${and(real.map(String))}; the windows at ${and(spur.map(String))} were spurious hits, caught by the digit check. Each slide is O(1), so the scan is O(n + m) expected; a modulus that collides often degrades it towards O(n × m), so real code uses a large prime.`,
    items: draw(n - m, { answer: true, text: [`pattern: ${p} mod ${Q} = ${ph}`, `matches: ${real.join(", ")};  spurious hits: ${spur.join(", ")}`, `${n - m + 1} windows, ${spur.length + real.length} digit checks`] }),
  });

  return finish({ title: "Pattern search with a rolling hash, the Rabin–Karp algorithm", input: `text = "${t}", pattern = "${p}", hash = base ${B} mod ${Q}`, frames });
}

/* ── suffix-array: prefix doubling on "banana" ────────────────────── */

/** The suffix array of "banana" by prefix doubling: rank by 1, 2, then 4 characters until every suffix has its own rank; then LCP and a search. */
function suffixArray(): Walkthrough {
  const s = "banana";
  const n = s.length;
  const SZ = 32;
  const G = 4;
  const P = SZ + G;
  const RP = 40;
  const SX = -SZ - 18;
  const KX = n * P + 16;
  const BY = n * RP + 14;
  const frames: Frame[] = [];

  const draw = (order: number[], v: { head: [string, string]; hi?: (i: number, c: number) => Tone | undefined; keys?: (i: number) => string; ties?: Array<[number, number]>; sa?: Tone; text?: string[] }): Item[] => {
    const items: Item[] = [];
    (v.ties ?? []).forEach(([a, b], g) => items.push({ k: "band", id: `tie${g}`, x: SX - 4, y: a * RP - 4, w: n * P - G - SX + 8, h: (b - a) * RP + SZ + 8, tone: "accent" }));
    items.push(note("h0", v.head[0], SX + SZ / 2, -14, { anchor: "middle", tone: "soft", size: 11 }));
    items.push(note("h1", "suffix", 0, -14, { tone: "soft", size: 11 }));
    if (v.head[1]) items.push(note("h2", v.head[1], KX, -14, { tone: "soft", size: 11 }));
    order.forEach((i, r) => {
      const y = r * RP;
      items.push(cell(`sa${i}`, SX, y, String(i), v.sa ?? "plain", SZ, 13));
      for (let c = 0; c < n - i; c++) items.push(cell(`c${i}_${c}`, c * P, y, s[i + c], v.hi?.(i, c) ?? "plain", SZ, 13));
      const key = v.keys?.(i);
      if (key) items.push(note(`k${i}`, key, KX, y + SZ / 2, { tone: "soft", size: 12 }));
    });
    items.push(...lines("ln", v.text ?? [], SX, BY));
    return items;
  };
  /** Runs of equal ranks in the current order, as row ranges [from, to]. */
  const tieRuns = (order: number[], rank: number[]) => {
    const out: Array<[number, number]> = [];
    let a = 0;
    for (let r = 1; r <= order.length; r++) {
      if (r === order.length || rank[order[r]] !== rank[order[a]]) {
        if (r - a > 1) out.push([a, r - 1]);
        a = r;
      }
    }
    return out;
  };
  const dense = (order: number[], key: (i: number) => readonly number[]) => {
    const rank = Array<number>(n).fill(0);
    order.forEach((i, r) => {
      const prev = r > 0 ? key(order[r - 1]) : null;
      rank[i] = r === 0 ? 0 : rank[order[r - 1]] + (prev!.some((x, q) => x !== key(i)[q]) ? 1 : 0);
    });
    return rank;
  };
  const byKey = (key: (i: number) => readonly number[]) => (a: number, b: number) => {
    const ka = key(a);
    const kb = key(b);
    for (let q = 0; q < ka.length; q++) if (ka[q] !== kb[q]) return ka[q] - kb[q];
    return a - b;
  };

  const idx = Array.from({ length: n }, (_, i) => i);
  frames.push({
    caption: `A suffix array lists where each suffix of a string starts, in sorted order. "${s}" has ${n} suffixes; comparing whole suffixes costs up to O(n) per comparison, so instead they are ranked by prefixes of 1, 2, 4, … characters.`,
    items: draw(idx, { head: ["i", ""], text: [`suffix i = s[i..]`] }),
  });

  // Round 1: rank by the first character.
  const charKey = (i: number) => [s.charCodeAt(i)] as const;
  let order = [...idx].sort(byKey(charKey));
  let rank = dense(order, charKey);
  let rounds = 1;
  const lengths = [1];
  const letters = [...new Set(order.map((i) => s[i]))];
  const tieText = (runs: Array<[number, number]>, len: number) => runs.map(([a, b]) => `"${s.slice(order[a], order[a] + len)}" (suffixes ${and(order.slice(a, b + 1).map(String))})`);
  let runs = tieRuns(order, rank);
  frames.push({
    caption: `Rank by the first character alone: ${and(letters.map((c) => `'${c}' gets ${rank[s.indexOf(c)]}`))}. Ties remain within ${and(tieText(runs, 1))}, so they need a longer look.`,
    items: draw(order, { head: ["i", "rank"], hi: (_, c) => (c < 1 ? "accent" : undefined), keys: (i) => `rank ${rank[i]}`, ties: runs }),
  });

  for (let k = 1; Math.max(...rank) < n - 1; k *= 2) {
    const prev = rank;
    const key = (i: number) => [prev[i], i + k < n ? prev[i + k] : -1] as const;
    order = [...idx].sort(byKey(key));
    rank = dense(order, key);
    rounds++;
    lengths.push(2 * k);
    runs = tieRuns(order, rank);
    const done = runs.length === 0;
    const len = 2 * k;
    frames.push({
      caption: done
        ? `Double again to ${len} characters with the pair (rank of i, rank of i + ${k}). Now all ${n} ranks differ, so the order is final: the suffix array is ${show(order)}.`
        : `Double to ${len} characters without reading them: suffix i's key is (rank of i, rank of i + ${k}), two ranks already known, with − for past the end. ${runs.length ? `The pairs break some ties, but ${and(tieText(runs, len))} still need a longer look.` : ""}`,
      items: draw(order, {
        head: [done ? "SA" : "i", "key → rank"],
        hi: (_, c) => (c < len ? "accent" : undefined),
        keys: (i) => `(${key(i)[0]}, ${key(i)[1] < 0 ? "−" : key(i)[1]}) → ${rank[i]}`,
        ties: runs,
        text: done ? [`SA = ${show(order)}`] : [],
      }),
    });
  }
  const sa = order;

  const lcpOf = (a: number, b: number) => {
    let l = 0;
    while (a + l < n && b + l < n && s[a + l] === s[b + l]) l++;
    return l;
  };
  const lcp = sa.map((i, r) => (r === 0 ? 0 : lcpOf(sa[r - 1], i)));
  const lcpOfRow = new Map(sa.map((i, r) => [i, lcp[r]] as const));
  const sum = lcp.reduce((a, b) => a + b, 0);
  const total = (n * (n + 1)) / 2;
  frames.push({
    caption: `Neighbours in sorted order share prefixes: the LCP array ${show(lcp.map((l, r) => (r === 0 ? "−" : l)))} is each suffix's common prefix with the one above. Since every repeated substring is such a shared prefix, "${s}" has ${total} − ${sum} = ${total - sum} distinct substrings.`,
    items: draw(sa, {
      head: ["SA", "lcp"],
      hi: (i, c) => (c < (lcpOfRow.get(i) ?? 0) ? "accent" : undefined),
      keys: (i) => (sa[0] === i ? "lcp −" : `lcp ${lcpOfRow.get(i)}`),
      text: [`SA = ${show(sa)}`, `LCP = ${show(lcp.map((l, r) => (r === 0 ? "−" : l)))}`],
    }),
  });

  const pat = "ana";
  const suf = (r: number) => s.slice(sa[r]);
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (suf(mid) < pat) lo = mid + 1;
    else hi = mid;
  }
  const first = lo;
  hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (suf(mid).slice(0, pat.length) <= pat) lo = mid + 1;
    else hi = mid;
  }
  const block = sa.slice(first, lo);
  frames.push({
    caption: `Every suffix that starts with "${pat}" sits in one block of the sorted order, so two binary searches find its edges: the block holds suffixes ${and(block.map(String))}. "${pat}" occurs at ${and([...block].sort((a, b) => a - b).map(String))}, found in O(m log n).`,
    items: draw(sa, {
      head: ["SA", ""],
      hi: (i, c) => (block.includes(i) ? (c < pat.length ? "accent" : "plain") : "muted"),
      keys: (i) => (block.includes(i) ? `starts with "${pat}"` : ""),
      ties: [[first, lo - 1]],
      text: [`search "${pat}": rows ${first}..${lo - 1} → positions ${[...block].sort((a, b) => a - b).join(", ")}`],
    }),
  });

  frames.push({
    caption: `The suffix array of "${s}" is ${show(sa)}. Prefix doubling needed ${rounds} sorting rounds, one per doubling of the compared length (${lengths.join(", ")}), so it costs O(n log² n) with a comparison sort or O(n log n) with radix sort; the LCP array follows in O(n).`,
    items: draw(sa, { head: ["SA", ""], sa: "strong", text: [`SA = ${show(sa)}`, `${rounds} sorting rounds; LCP in O(n)`] }),
  });

  return finish({ title: "Building the suffix array of a string, with prefix doubling", input: `s = "${s}"`, frames });
}

/** The math and string hubs' walkthroughs, by hub slug. */
export const WALKTHROUGHS: Record<string, () => Walkthrough> = {
  math: palindromeNumber,
  "number-theory": euclid,
  "sieve-of-eratosthenes": sieve,
  combinatorics: pascal,
  geometry: convexHull,
  "game-theory": subtractionGame,
  brainteaser: bulbSwitcher,
  "bit-manipulation": popcount,
  strings: validPalindrome,
  "string-matching": naiveSearch,
  kmp,
  "rolling-hash": rabinKarp,
  "suffix-array": suffixArray,
};
