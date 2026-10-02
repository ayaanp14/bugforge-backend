import { finish, note, show, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "./kit.js";

/**
 * Binary Search on the Answer: the lesson's figures
 * (content/roadmap/binary-search-on-answer.md places each with "@figure
 * <name>"). The row of yes/no answers a feasibility check makes, the greedy
 * loading and why a bigger capacity never hurts (monotonicity), the search
 * itself narrowing the range of capacities, the two mirror-image templates,
 * and a maximise problem — each computed by running the check it shows.
 */

const WEIGHTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const DAYS = 5;

/** The greedy loading: fill each day until the next package would not fit. Returns the trips. */
function load(weights: readonly number[], capacity: number): number[][] {
  const trips: number[][] = [[]];
  let sum = 0;
  for (const w of weights) {
    if (sum + w > capacity) {
      trips.push([]);
      sum = 0;
    }
    trips[trips.length - 1].push(w);
    sum += w;
  }
  return trips;
}
const daysNeeded = (c: number) => load(WEIGHTS, c).length;

/** The row of answers: for each capacity, the days the greedy loading takes, and whether that is within 5. */
function answerRow(): Walkthrough {
  const lo = Math.max(...WEIGHTS);
  const hi = WEIGHTS.reduce((a, b) => a + b, 0);
  const caps = Array.from({ length: 10 }, (_, i) => lo + i);
  const first = caps.find((c) => daysNeeded(c) <= DAYS)!;
  const S = 31;
  const G = 4;
  const x = (i: number) => i * (S + G);
  const cols: Array<number | null> = [...caps, null, hi];
  const items: Item[] = [];
  const rowY = [0, 42, 84];
  const names = ["capacity", "days", `≤ ${DAYS} days?`];
  names.forEach((t, r) => items.push(label(`n${r}`, t, -10, rowY[r] + S / 2, { anchor: "end", size: 11.5, tone: r === 2 ? "ink" : "soft", weight: r === 2 ? 600 : 500 })));
  cols.forEach((c, i) => {
    if (c === null) {
      for (let r = 0; r < 3; r++) items.push(label(`gap${r}`, "…", x(i) + S / 2, rowY[r] + S / 2, { size: 13, tone: "faint" }));
      return;
    }
    const d = daysNeeded(c);
    const ok = d <= DAYS;
    const tone: Tone = c === first ? "strong" : ok ? "accent" : "muted";
    items.push(box(`c${i}`, x(i), rowY[0], c, { w: S, h: S, size: 12.5, tone: c === first ? "strong" : "plain" }));
    items.push(box(`d${i}`, x(i), rowY[1], d, { w: S, h: S, size: 12.5, tone: ok ? "plain" : "muted" }));
    items.push(box(`q${i}`, x(i), rowY[2], ok ? "yes" : "no", { w: S, h: S, size: 11.5, tone }));
  });
  items.push({ k: "ptr", id: "ans", x: x(caps.indexOf(first)) + S / 2, y: rowY[2] + S + 6, label: `first yes: ${first}`, tone: "accent", up: true });
  items.push(note("r", `lo = ${lo} (heaviest package), hi = ${hi} (total weight)`, 0, rowY[2] + S + 52, { size: 12, tone: "soft" }));
  return finish({
    title: "The answers to “does this capacity work?” form a sorted row",
    input: `weights = ${show(WEIGHTS)}, days = ${DAYS}`,
    frames: [
      {
        caption: `For each capacity, run the greedy loading and count the days. Below ${first} it takes more than ${DAYS}; from ${first} on it never does. No, no, …, yes, yes: the shape binary search is built for, and the answer is the first yes, ${first}.`,
        items,
      },
    ],
  });
}

/**
 * The feasibility check drawn as days of stacked packages under a capacity
 * line: 14 spills into a sixth day, 15 fits in five, and the plan that fits
 * 15 still fits under 16 — which is why the row of answers is monotone.
 */
function greedyDays(): Walkthrough {
  const U = 12;
  const W = 46;
  const G = 14;
  const maxCap = 16;
  const top = -maxCap * U;
  const frames: Frame[] = [];

  const draw = (trips: number[][], cap: number, o: { over?: boolean; old?: number } = {}): Item[] => {
    const items: Item[] = [];
    const dayX = (d: number) => d * (W + G);
    const nDays = 6;
    for (let d = 0; d < nDays; d++) items.push(label(`dl${d}`, `day ${d + 1}`, dayX(d) + W / 2, 14, { size: 11, tone: d >= DAYS ? "error" : "soft" }));
    trips.forEach((trip, d) => {
      let y = 0;
      for (const w of trip) {
        const h = w * U;
        y -= h;
        items.push(box(`p${w}`, dayX(d), y, w, { w: W, h: h - 1, size: h >= 20 ? 12 : 10.5, tone: d >= DAYS ? "error" : o.over === false ? "accent" : "plain" }));
      }
      items.push(label(`s${d}`, `= ${trip.reduce((a, b) => a + b, 0)}`, dayX(d) + W / 2, 30, { mono: true, size: 11.5, weight: 600, tone: d >= DAYS ? "error" : "ink" }));
    });
    const right = dayX(nDays - 1) + W + 6;
    if (o.old !== undefined) {
      items.push({ k: "path", id: "old", pts: [[-6, -o.old * U], [right, -o.old * U]], tone: "faint", dashed: true, width: 1.2 });
    }
    items.push({ k: "path", id: "cap", pts: [[-6, -cap * U], [right, -cap * U]], tone: "accent", dashed: true, width: 1.6 });
    items.push(label("cl", `capacity ${cap}`, -10, -cap * U, { anchor: "end", size: 11.5, weight: 600, tone: "accent" }));
    items.push({ k: "path", id: "base", pts: [[-6, 0], [right, 0]], tone: "ink", width: 1.2 });
    items.push({ k: "path", id: "top", pts: [[0, top - 4], [0, top - 4.5]], tone: "faint", width: 0.1 });
    return items;
  };

  const t14 = load(WEIGHTS, 14);
  const t15 = load(WEIGHTS, 15);
  frames.push({
    caption: `feasible(14): load each day until the next package would pass 14. ${t14[0].join(" + ")} fits, but ${t14[1][0]} more would make ${t14[0].reduce((a, b) => a + b, 0) + t14[1][0]}, so day 2 starts at ${t14[1][0]}. The loading spills into day ${t14.length}: capacity 14 fails.`,
    items: draw(t14, 14, { over: true }),
  });
  frames.push({
    caption: `feasible(15): now ${t15[0].join(" + ")} = 15 fits on day 1, and the rest follow in ${t15.length} days. Greedy filling is never worse than any other loading: it is always at least as far through the list after each day.`,
    items: draw(t15, 15, { over: false }),
  });
  frames.push({
    caption: `Why the answers are monotone: raise the capacity to 16 and the very same plan still fits, because every day was at most 15. So feasible(15) implies feasible(16), and every larger capacity — the row never switches back.`,
    items: draw(t15, 16, { over: false, old: 15 }),
  });
  return finish({ title: "The feasibility check, and why a bigger capacity never hurts", input: `weights = ${show(WEIGHTS)}, days = ${DAYS}`, frames });
}

/** The search over capacities 10..55, one row per check: the live range narrows around the first yes. */
function search(): Walkthrough {
  let lo = Math.max(...WEIGHTS);
  let hi = WEIGHTS.reduce((a, b) => a + b, 0);
  const L = lo;
  const H = hi;
  const SX = 8;
  const px = (v: number) => (v - L) * SX;
  const RH = 32;
  type Check = { lo: number; hi: number; mid: number; days: number; ok: boolean };
  const checks: Check[] = [];
  let ans = hi;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const days = daysNeeded(mid);
    const ok = days <= DAYS;
    checks.push({ lo, hi, mid, days, ok });
    if (ok) {
      ans = mid;
      hi = mid - 1;
    } else lo = mid + 1;
  }
  const frames: Frame[] = [];

  const draw = (k: number, done = false): Item[] => {
    const items: Item[] = [];
    items.push({ k: "path", id: "axis", pts: [[px(L) - 4, 0], [px(H) + 4, 0]], tone: "ink", width: 1.2 });
    for (let v = L; v <= H; v += 5) {
      items.push({ k: "path", id: `tk${v}`, pts: [[px(v), -4], [px(v), 4]], tone: "ink", width: 1 });
      items.push(label(`tl${v}`, String(v), px(v), -14, { mono: true, size: 10.5, tone: "faint" }));
    }
    items.push(label("ax", "capacity", -12, 0, { anchor: "end", size: 11, tone: "soft" }));
    checks.slice(0, k).forEach((c, i) => {
      const y = 22 + i * RH;
      const last = i === k - 1 && !done;
      items.push({ k: "band", id: `r${i}`, x: px(c.lo) - 4, y, w: px(c.hi) - px(c.lo) + 8, h: 24, tone: last ? "accent" : "plain" });
      items.push(label(`rl${i}`, `${c.lo}..${c.hi}`, -12, y + 12, { anchor: "end", size: 10.5, mono: true, tone: "faint" }));
      const tone: Tone = done && c.mid === ans ? "strong" : c.ok ? "accent" : "error";
      items.push(box(`m${i}`, px(c.mid) - 13, y + 1, c.mid, { w: 26, h: 22, size: 11.5, tone }));
      items.push(label(`ml${i}`, `${c.days} days: ${c.ok ? "yes" : "no"}`, px(H) + 14, y + 12, { anchor: "start", size: 11.5, tone: c.ok ? "accent" : "error", weight: last ? 600 : 500 }));
    });
    const y = 22 + Math.max(k, 1) * RH + 18;
    items.push(note("st", done ? `answer = ${ans}, after ${checks.length} checks of up to ${H - L + 1}` : k === 0 ? `lo = ${L}, hi = ${H}` : `next: lo = ${k < checks.length ? checks[k].lo : lo}, hi = ${k < checks.length ? checks[k].hi : hi}, ans = ${checks.slice(0, k).filter((c) => c.ok).map((c) => c.mid).pop() ?? "none yet"}`, 0, Math.max(y, 22 + checks.length * RH + 18), { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `The candidates are the capacities ${L} to ${H}: the heaviest package is the least that could work, and the total weight ships everything in one day. Each row below is one call of feasible, made at the middle of what is left.`,
    items: draw(0),
  });
  checks.forEach((c, i) => {
    const caption = c.ok
      ? `Check ${i + 1}: mid = ${c.mid} ships in ${c.days} days, within ${DAYS}. It works, so ans = ${c.mid} — and every capacity above it works too, so look only below: hi = ${c.mid - 1}.`
      : `Check ${i + 1}: mid = ${c.mid} needs ${c.days} days, more than ${DAYS}. It fails, and so does every smaller capacity, so look only above: lo = ${c.mid + 1}.`;
    frames.push({ caption, items: draw(i + 1) });
  });
  frames.push({
    caption: `The range is empty and ans = ${ans}: the least capacity that ships in ${DAYS} days. ${checks.length} simulations of O(n) each replaced up to ${H - L + 1}, so the cost is O(n log R) for a range of R answers.`,
    items: draw(checks.length, true),
  });
  return finish({ title: "Binary search over capacities: each check halves the range of answers", input: `weights = ${show(WEIGHTS)}, days = ${DAYS}`, frames });
}

/** The two templates side by side: minimise finds the first yes, maximise the last yes. */
function twoTemplates(): Walkthrough {
  const caps = Array.from({ length: 8 }, (_, i) => 12 + i);
  const shipOk = caps.map((c) => daysNeeded(c) <= DAYS);
  const firstYes = caps[shipOk.indexOf(true)];
  const n = 20;
  const xs = Array.from({ length: 8 }, (_, i) => i + 1);
  const sqOk = xs.map((v) => v * v <= n);
  const lastYes = xs[sqOk.lastIndexOf(true)];
  const S = 34;
  const G = 5;
  const x = (i: number) => i * (S + G);
  const items: Item[] = [];
  const block = (y: number, id: string, title: string, values: number[], ok: boolean[], pick: number, rule: string[]) => {
    items.push(label(`${id}t`, title, 0, y - 30, { anchor: "start", size: 12, weight: 600, tone: "ink" }));
    values.forEach((v, i) => {
      items.push(box(`${id}v${i}`, x(i), y, v, { w: S, h: 28, size: 12, tone: v === pick ? "strong" : "plain" }));
      items.push(box(`${id}q${i}`, x(i), y + 32, ok[i] ? "yes" : "no", { w: S, h: 26, size: 11.5, tone: v === pick ? "strong" : ok[i] ? "accent" : "muted" }));
    });
    rule.forEach((line, k) => items.push(label(`${id}r${k}`, line, 0, y + 74 + k * 17, { anchor: "start", size: 11.5, tone: k === 0 ? "accent" : "soft", weight: k === 0 ? 600 : 500 })));
  };
  block(30, "a", `Minimise: least capacity that ships in ${DAYS} days`, caps, shipOk, firstYes, [`answer: the first yes, ${firstYes}`, "on a yes: ans = mid, then hi = mid − 1 (try smaller)"]);
  block(196, "b", `Maximise: largest x with x × x ≤ ${n}`, xs, sqOk, lastYes, [`answer: the last yes, ${lastYes}`, "on a yes: ans = mid, then lo = mid + 1 (try larger)"]);
  return finish({
    title: "Minimise or maximise: the same loop, mirrored",
    input: "",
    frames: [
      {
        caption: `A minimise problem's row reads no … no, yes … yes, and the answer is the first yes. A maximise problem's row reads yes … yes, no … no, and the answer is the last yes. Only the update on a yes changes sides.`,
        items,
      },
    ],
  });
}

/**
 * Magnetic Force Between Two Balls (maximise the minimum gap): the search
 * tries a gap d, and the check places balls greedily from the left, each at
 * the first position at least d past the last one.
 */
function magnetic(): Walkthrough {
  const pos = [1, 2, 3, 4, 7];
  const m = 3;
  const SX = 44;
  const px = (v: number) => v * SX;
  const place = (d: number) => {
    const at = [pos[0]];
    for (const p of pos.slice(1)) if (p - at[at.length - 1] >= d) at.push(p);
    return at;
  };
  let lo = 1;
  let hi = pos[pos.length - 1] - pos[0];
  const L = lo;
  const H = hi;
  let ans = 0;
  type Check = { lo: number; hi: number; d: number; at: number[]; ok: boolean };
  const checks: Check[] = [];
  while (lo <= hi) {
    const d = lo + Math.floor((hi - lo) / 2);
    const at = place(d);
    const ok = at.length >= m;
    checks.push({ lo, hi, d, at, ok });
    if (ok) {
      ans = d;
      lo = d + 1;
    } else hi = d - 1;
  }
  const frames: Frame[] = [];

  const draw = (at: number[], o: { d?: number; ok?: boolean; final?: boolean; text: string }): Item[] => {
    const items: Item[] = [];
    items.push({ k: "path", id: "axis", pts: [[px(0) - 6, 0], [px(8) + 6, 0]], tone: "ink", width: 1.2 });
    for (let v = 0; v <= 8; v++) items.push(label(`t${v}`, String(v), px(v), 18, { mono: true, size: 10.5, tone: "faint" }));
    pos.forEach((p) => {
      const used = at.includes(p);
      items.push({ k: "node", id: `b${p}`, x: px(p), y: -18, r: 13, text: "", tone: used ? (o.final ? "strong" : o.ok === false ? "error" : "accent") : "ghost", size: 11 });
    });
    for (let i = 1; i < at.length; i++) {
      items.push({ k: "span", id: `g${i}`, x1: px(at[i - 1]), x2: px(at[i]), y: -42, label: `gap ${at[i] - at[i - 1]}`, tone: o.ok === false ? "error" : "accent" });
    }
    items.push(label("pl", "positions", -14, -18, { anchor: "end", size: 11, tone: "soft" }));
    items.push(note("r", o.text, 0, 50, { size: 12.5, weight: 600 }));
    items.push(note("r2", o.final ? `d = ${ans} works; d = ${ans + 1} does not` : o.d === undefined ? `m = ${m} balls; gaps to try: ${L}..${H}` : `balls placed: ${at.length} of ${m} → ${o.ok ? "yes" : "no"}`, 0, 72, { size: 12, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `Place ${m} balls on these positions so that the smallest gap between neighbours is as large as possible. The answer is a gap between ${L} and ${H}, and "can ${m} balls keep gap d?" is yes for small d and no for large d: maximise.`,
    items: draw([], { text: `positions = ${show(pos)}` }),
  });
  checks.forEach((c, i) => {
    frames.push({
      caption: c.ok
        ? `Try d = ${c.d}: place a ball at ${c.at[0]}, then at the first position at least ${c.d} further each time — ${c.at.join(", ")}. ${c.at.length} balls fit, so d = ${c.d} works; try larger: lo = ${c.d + 1}.`
        : `Try d = ${c.d}: the greedy placement gets only ${c.at.join(" and ")} — ${c.at.length} ball${c.at.length === 1 ? "" : "s"}, fewer than ${m}. d = ${c.d} fails, and so does anything larger: hi = ${c.d - 1}.${i === checks.length - 1 ? "" : ""}`,
      items: draw(c.at, { d: c.d, ok: c.ok, text: `check ${i + 1}: lo = ${c.lo}, hi = ${c.hi}, d = ${c.d}` }),
    });
  });
  frames.push({
    caption: `The range is empty and the last yes was d = ${ans}: the balls at ${place(ans).join(", ")} keep every gap at least ${ans}, and no placement does better. A smaller required gap is always easier, which is what made the search safe.`,
    items: draw(place(ans), { final: true, ok: true, text: `answer: largest minimum gap = ${ans}` }),
  });
  return finish({ title: "Maximise the minimum: Magnetic Force Between Two Balls", input: `position = ${show(pos)}, m = ${m}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "answer-row": answerRow,
  "greedy-days": greedyDays,
  search,
  "two-templates": twoTemplates,
  magnetic,
};
