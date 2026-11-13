import { CELL, finish, note, row, rowLabel, show, slotX, spanOver, under, type Frame, type Item, type Walkthrough } from "../../walkthroughs/core.js";

/**
 * Prefix sums and difference arrays: the lesson's figures
 * (scripts/study-plans/competitive-programming/02-prefix-sums). Arrays are
 * 1-indexed as the lesson's code is, with the extra slot 0 of the prefix
 * array (and n + 1 of the difference array) drawn too.
 *
 *  - fill: p[i] = p[i − 1] + a[i] filling left to right, then one range
 *    query answered as p[r] − p[l − 1] (checked against the slice's sum).
 *  - difference: three range-add updates, two writes each, then one prefix
 *    sum over d turning it into the final array (checked against applying
 *    each update element by element).
 */

const A = [3, 1, 4, 1, 5, 9, 2];
const minus = (v: number) => (v < 0 ? `−${-v}` : String(v));
const signed = (v: number) => (v < 0 ? `−${-v}` : `+${v}`);

/** Slot k of a row that starts at index 0; `a` is drawn from index 1 so it lines up under p. */
const S = CELL;

function fill(): Walkthrough {
  const n = A.length;
  const p = [0];
  for (let i = 1; i <= n; i++) p.push(p[i - 1]! + A[i - 1]!);
  const [l, r] = [3, 6];
  const ans = p[r]! - p[l - 1]!;
  if (ans !== A.slice(l - 1, r).reduce((x, y) => x + y, 0)) throw new Error("fill: the query disagrees with the slice");
  const AY = 0;
  const PY = 92;
  const frames: Frame[] = [];

  const draw = (upTo: number, q?: boolean): Item[] => {
    const items: Item[] = [rowLabel("la", "a", -12, AY), rowLabel("lp", "p", -12, PY)];
    // a[1..n] sits over p[1..n]; slot 0 of the a row is empty.
    A.forEach((v, k) => {
      const i = k + 1;
      const tone = q ? (i >= l && i <= r ? "accent" : "muted") : i === upTo ? "accent" : i < upTo ? "plain" : "plain";
      items.push({ k: "cell", id: `a${i}`, x: slotX(i), y: AY, w: S, h: S, text: String(v), tone });
      items.push({ k: "text", id: `ai${i}`, x: slotX(i) + S / 2, y: AY + S + 11, text: String(i), tone: "faint", size: 10 });
    });
    items.push(
      ...row(
        "p",
        p.map((v, i) => (i <= upTo ? String(v) : "")),
        { y: PY, index: true, tone: (i) => (q ? (i === r || i === l - 1 ? "strong" : "plain") : i > upTo ? "ghost" : i === upTo && upTo > 0 ? "accent" : "plain") },
      ),
    );
    if (!q && upTo > 0) items.push(under("ptr", upTo, "i", { y: PY, indexed: true }));
    if (q) {
      items.push(spanOver("q", l, r, `sum a[${l}..${r}]`, { y: AY, lift: 10 }));
      items.push(note("qa", `p[${r}] − p[${l - 1}] = ${p[r]} − ${p[l - 1]} = ${ans}`, 0, PY + S + 60, { weight: 600 }));
    } else if (upTo > 0) items.push(note("qa", `p[${upTo}] = p[${upTo - 1}] + a[${upTo}] = ${p[upTo - 1]} + ${A[upTo - 1]} = ${p[upTo]}`, 0, PY + S + 60));
    else items.push(note("qa", "p[0] = 0: the sum of no elements", 0, PY + S + 60));
    return items;
  };

  frames.push({ caption: `p[i] will hold a[1] + … + a[i]. Start with p[0] = 0, the sum of nothing — it is what lets a range starting at 1 need no special case.`, items: draw(0) });
  for (const i of [1, 2, 3]) frames.push({ caption: `p[${i}] = p[${i - 1}] + a[${i}] = ${p[i - 1]} + ${A[i - 1]} = ${p[i]}. One addition per slot: the previous total plus the new element.`, items: draw(i) });
  frames.push({ caption: `The loop runs to the end the same way, so the whole prefix array costs O(n): p = ${show(p)}.`, items: draw(n) });
  frames.push({
    caption: `Now any range is two lookups. a[${l}..${r}] is everything up to ${r} minus everything up to ${l - 1}: p[${r}] − p[${l - 1}] = ${p[r]} − ${p[l - 1]} = ${ans}, which is ${A.slice(l - 1, r).join(" + ")}. O(1) per query.`,
    items: draw(n, true),
  });
  return finish({ title: "Build the prefix array once, answer every range in O(1)", input: `a = ${show(A)}, query a[${l}..${r}]`, frames });
}

function difference(): Walkthrough {
  const n = 6;
  const updates: Array<[number, number, number]> = [
    [1, 3, 3],
    [2, 5, 2],
    [4, 6, 1],
  ];
  const d = new Array<number>(n + 2).fill(0); // d[1..n+1]
  const truth = new Array<number>(n + 1).fill(0);
  for (const [l, r, v] of updates) for (let i = l; i <= r; i++) truth[i]! += v;
  const DY = 0;
  const AY = 104;
  const frames: Frame[] = [];

  const draw = (o: { touched?: number[]; upd?: [number, number, number]; arr?: number[]; at?: number; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("ld", "d", -12 + slotX(1), DY), rowLabel("lr", "a", -12 + slotX(1), AY)];
    for (let i = 1; i <= n + 1; i++) {
      const tone = o.touched?.includes(i) ? "accent" : o.at !== undefined && i === o.at ? "accent" : o.at !== undefined && i < o.at ? "muted" : i === n + 1 ? "ghost" : "plain";
      items.push({ k: "cell", id: `d${i}`, x: slotX(i), y: DY, w: S, h: S, text: minus(d[i]!), tone });
      items.push({ k: "text", id: `di${i}`, x: slotX(i) + S / 2, y: DY + S + 11, text: String(i), tone: "faint", size: 10 });
    }
    const arr = o.arr ?? [];
    for (let i = 1; i <= n; i++) {
      const has = i <= arr.length;
      items.push({ k: "cell", id: `r${i}`, x: slotX(i), y: AY, w: S, h: S, text: has ? minus(arr[i - 1]!) : "", tone: !has ? "ghost" : o.done ? "strong" : i === arr.length ? "accent" : "plain" });
    }
    if (o.upd) {
      const [l, r, v] = o.upd;
      items.push(spanOver("u", l, r, `${signed(v)} on ${l}..${r}`, { y: AY, lift: 12, tone: "ink" }));
    }
    if (o.at !== undefined && !o.done) items.push(under("run", o.at, "i", { y: AY }));
    return items;
  };

  frames.push({ caption: `Add v to every element of [l, r] by writing d[l] += v and d[r + 1] −= v. d has a slot n + 1 = ${n + 1}, so an update that ends at n still has somewhere to stop.`, items: draw({}) });
  for (const [l, r, v] of updates) {
    d[l]! += v;
    d[r + 1]! -= v;
    frames.push({
      caption: `Update ${signed(v)} on ${l}..${r}: d[${l}] += ${v} and d[${r + 1}] −= ${v}. Two writes whatever the length of the range — d is now ${show(d.slice(1).map(minus))}.`,
      items: draw({ touched: [l, r + 1], upd: [l, r, v] }),
    });
  }
  const arr: number[] = [];
  let run = 0;
  for (let i = 1; i <= n; i++) {
    run += d[i]!;
    arr.push(run);
    if (i === 1 || i === 2 || i === 4 || i === n) {
      const caption =
        i === 1
          ? `Then one prefix sum over d gives the array: a[1] = d[1] = ${run}. The +3 that starts at 1 is carried along by the running sum.`
          : i === n
            ? `a[${n}] = ${run}. Each element is the sum of every change that started at or before it, minus every one that already stopped.`
            : `a[${i}] = a[${i - 1}] ${d[i]! < 0 ? "−" : "+"} ${Math.abs(d[i]!)} = ${run}. d[${i}] nets every change here: ${updates
                .flatMap(([l, r, v]) => [...(l === i ? [`${signed(v)} starts`] : []), ...(r + 1 === i ? [`${signed(v)} stops`] : [])])
                .join(", ") || "nothing starts or stops, so the value carries over"}.`;
      frames.push({ caption, items: draw({ arr: [...arr], at: i }) });
    }
  }
  if (arr.join() !== truth.slice(1).join()) throw new Error(`difference: ${arr} disagrees with the updates applied one by one (${truth.slice(1)})`);
  frames.push({
    caption: `a = ${show(arr)}, the same as applying each update element by element. ${updates.length} updates cost ${updates.length * 2} writes plus one O(n) pass: O(n + q) instead of O(n · q).`,
    items: draw({ arr, done: true }),
  });
  return finish({ title: "Many range updates, then one prefix sum: the difference array", input: `n = ${n}; ${updates.map(([l, r, v]) => `${signed(v)} on ${l}..${r}`).join(", ")}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  fill,
  difference,
};
