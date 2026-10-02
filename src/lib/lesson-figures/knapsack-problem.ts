import { and, finish, note, row, rowLabel, show, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, grid, gridCell, label } from "./kit.js";

/**
 * 0/1 Knapsack: the lesson's figures (content/roadmap/knapsack-problem.md
 * places each with "@figure <name>"). Greedy against the best bag, the
 * take-or-skip table filled row by row and walked back, why the
 * transition is complete (every selection with or without the last item),
 * why the one-row loop runs downwards, subset sum for a partition, and the
 * loop order that decides combinations against sequences. Every value is
 * computed by running the method shown.
 */

type It = { name: string; wt: number; v: number };
const ITEMS: It[] = [
  { name: "A", wt: 1, v: 1 },
  { name: "B", wt: 3, v: 4 },
  { name: "C", wt: 4, v: 5 },
  { name: "D", wt: 5, v: 7 },
];
const CAP = 7;

/** dp[i][w] over the first i items, exactly as the lesson's first program fills it. */
function knapsack(items: readonly It[], W: number): number[][] {
  const dp = Array.from({ length: items.length + 1 }, () => Array.from({ length: W + 1 }, () => 0));
  for (let i = 1; i <= items.length; i++) {
    const { wt, v } = items[i - 1];
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      if (wt <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - wt] + v);
    }
  }
  return dp;
}

/** Every subset of items as a bit mask, with its weight and value. */
const subsets = (items: readonly It[]) =>
  Array.from({ length: 1 << items.length }, (_, m) => {
    const pick = items.filter((_, i) => m & (1 << i));
    return { m, pick, wt: pick.reduce((s, it) => s + it.wt, 0), v: pick.reduce((s, it) => s + it.v, 0) };
  });

const r2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);

/** The items, greedy by value per kilogram, the best bag, and the fractional bag where greedy is right. */
function greedyBag(): Walkthrough {
  const items = ITEMS;
  const U = 32;
  const H = 30;
  const G = { w: 50, h: 26, gap: 4, x: 0, y: 0 };
  const table = items.map((it) => [it.wt, it.v, r2(it.v / it.wt)]);
  const byRatio = [...items].sort((a, b) => b.v / b.wt - a.v / a.wt);
  const greedy: It[] = [];
  let room = CAP;
  for (const it of byRatio)
    if (it.wt <= room) {
      greedy.push(it);
      room -= it.wt;
    }
  const best = subsets(items)
    .filter((s) => s.wt <= CAP)
    .reduce((a, b) => (b.v > a.v ? b : a));
  // Fractional: whole items by ratio while they fit, then the part of the next one that fills the bag.
  const frac: Array<{ it: It; part: number }> = [];
  let left = CAP;
  for (const it of byRatio) {
    if (left === 0) break;
    const part = Math.min(1, left / it.wt);
    frac.push({ it, part });
    left -= part * it.wt;
  }
  const fracValue = frac.reduce((s, f) => s + f.it.v * f.part, 0);
  const tableBottom = gridCell(items.length - 1, 0, G).y + G.h;
  const barY = (k: number) => tableBottom + 52 + k * 66;
  const frames: Frame[] = [];

  type Bar = { title: string; segs: Array<{ it: It; part?: number; tone: Tone }>; readout: string; tone?: "ink" | "error" };
  const draw = (o: { rowTone?: (i: number) => Tone; bars: Bar[] }): Item[] => {
    const items2: Item[] = grid("t", table, { ...G, tone: (r) => o.rowTone?.(r) ?? "plain", rowLabels: items.map((it) => it.name), colLabels: ["kg", "value", "per kg"], size: 12 });
    o.bars.forEach((bar, k) => {
      const y = barY(k);
      items2.push(label(`bt${k}`, bar.title, 0, y - 12, { anchor: "start", tone: "soft", weight: 600 }));
      const filled = bar.segs.reduce((s, sg) => s + sg.it.wt * (sg.part ?? 1), 0);
      // Ghost kilograms only where the bag is still empty, so a translucent item never shows the grid through it.
      for (let u = Math.ceil(filled - 1e-9); u < CAP; u++) items2.push({ k: "cell", id: `b${k}u${u}`, x: u * U, y, w: U, h: H, text: "", tone: "ghost" });
      let at = 0;
      bar.segs.forEach(({ it, part = 1, tone }) => {
        const w = it.wt * part;
        items2.push({ k: "cell", id: `b${k}s${it.name}`, x: at * U + 1, y: y + 1, w: w * U - 2, h: H - 2, text: part < 1 ? `${Math.round(part * it.wt)}/${it.wt} ${it.name}` : it.name, tone, size: 13 });
        at += w;
      });
      items2.push(note(`br${k}`, bar.readout, CAP * U + 12, y + H / 2, { size: 12, weight: 600, tone: bar.tone ?? "ink" }));
    });
    return items2;
  };

  const empty: Bar = { title: `the bag: ${CAP} kg`, segs: [], readout: "" };
  const gBar: Bar = { title: "greedy by value per kg", segs: greedy.map((it) => ({ it, tone: "accent" as Tone })), readout: `value ${greedy.reduce((s, it) => s + it.v, 0)}`, tone: "error" };
  const bBar: Bar = { title: "best", segs: best.pick.map((it) => ({ it, tone: "strong" as Tone })), readout: `value ${best.v}` };
  const fBar: Bar = { title: "fractional: items may be cut", segs: frac.map((f) => ({ it: f.it, part: f.part, tone: "accent" as Tone })), readout: `value ${r2(fracValue)}` };
  const skipped = byRatio.filter((it) => !greedy.includes(it));
  frames.push({
    caption: `Four items and a bag that holds ${CAP} kg. Each item goes in whole or stays out — 0 or 1, hence the name — and the goal is the most total value.`,
    items: draw({ bars: [{ ...empty, readout: "" }] }),
  });
  frames.push({
    caption: `Greedy by value per kilogram takes ${and(greedy.map((it) => it.name))} (${greedy.reduce((s, it) => s + it.wt, 0)} kg, value ${greedy.reduce((s, it) => s + it.v, 0)}); ${and(skipped.map((it) => it.name))} no longer fit. ${room} kg is left empty that nothing can fill.`,
    items: draw({ rowTone: (r) => (greedy.includes(items[r]) ? "accent" : "error"), bars: [gBar] }),
  });
  frames.push({
    caption: `The best bag is ${and(best.pick.map((it) => it.name))}: exactly ${best.wt} kg, value ${best.v}, found here by trying all ${1 << items.length} subsets. Taking D first was the mistake, and a rule that looks at one item at a time cannot see it.`,
    items: draw({ rowTone: (r) => (best.pick.includes(items[r]) ? "strong" : "plain"), bars: [{ ...gBar, segs: gBar.segs.map((s) => ({ ...s, tone: "muted" as Tone })) }, bBar] }),
  });
  frames.push({
    caption: `If items could be cut, greedy would be right: ${frac.map((f) => (f.part < 1 ? `${Math.round(f.part * f.it.wt)} kg of ${f.it.name}` : f.it.name)).join(", then ")} fills the bag for ${r2(fracValue)}. Whole items leave gaps, and that is what breaks the greedy rule.`,
    items: draw({ bars: [{ ...gBar, segs: gBar.segs.map((s) => ({ ...s, tone: "muted" as Tone })) }, bBar, fBar] }),
  });
  return finish({ title: "Greedy against the best bag", input: `capacity ${CAP}; ${items.map((it) => `${it.name}: ${it.wt} kg, ${it.v}`).join("; ")}`, frames });
}

/** dp[i][w] filled one row (one item) at a time, a spotlight on one cell's choice per row, then the walk back. */
function table(): Walkthrough {
  const items = ITEMS;
  const dp = knapsack(items, CAP);
  const G = { w: 34, h: 28, gap: 4, x: 0, y: 0 };
  const ROWGAP = 22;
  const cell = (r: number, c: number) => {
    const g = gridCell(0, c, G);
    const y = r * (G.h + ROWGAP);
    return { x: g.x, y, w: G.w, h: G.h, mid: { x: g.mid.x, y: y + G.h / 2 } };
  };
  const rowName = (r: number) => (r === 0 ? "no items" : `+${items[r - 1].name} (${items[r - 1].wt} kg, ${items[r - 1].v})`);
  const frames: Frame[] = [];

  type Spot = { r: number; c: number };
  const draw = (o: { filled: number; spot?: Spot; path?: Spot[]; taken?: number[]; readout: string }): Item[] => {
    const out: Item[] = [];
    for (let c = 0; c <= CAP; c++) out.push({ k: "text", id: `ch${c}`, x: cell(0, c).mid.x, y: -12, text: String(c), tone: "faint", anchor: "middle", size: 11 });
    out.push({ k: "text", id: "cap", x: cell(0, CAP).x + G.w, y: -30, text: "capacity w →", tone: "soft", anchor: "end", size: 11, mono: false });
    const sp = o.spot;
    const it = sp ? items[sp.r - 1] : undefined;
    const reads = sp && it ? [{ r: sp.r - 1, c: sp.c }, ...(it.wt <= sp.c ? [{ r: sp.r - 1, c: sp.c - it.wt }] : [])] : [];
    for (let r = 0; r <= items.length; r++) {
      out.push({ k: "text", id: `rl${r}`, x: -10, y: cell(r, 0).mid.y, text: rowName(r), tone: o.taken?.includes(r) ? "accent" : "soft", anchor: "end", size: 11, mono: false });
      for (let c = 0; c <= CAP; c++) {
        const b = cell(r, c);
        const onPath = o.path?.some((p) => p.r === r && p.c === c);
        let tone: Tone = r > o.filled ? "ghost" : "plain";
        if (o.path) tone = onPath ? "strong" : "plain";
        else if (sp && r === sp.r && c === sp.c) tone = "strong";
        else if (reads.some((p) => p.r === r && p.c === c)) tone = "accent";
        else if (r === o.filled && sp) tone = "plain";
        out.push({ k: "cell", id: `d${r}-${c}`, x: b.x, y: b.y, w: G.w, h: G.h, text: r > o.filled ? "" : String(dp[r][c]), tone, size: 13 });
      }
    }
    if (sp && it) {
      const skip = dp[sp.r - 1][sp.c];
      const take = it.wt <= sp.c ? dp[sp.r - 1][sp.c - it.wt] + it.v : -1;
      const takeWins = take > skip;
      const to = cell(sp.r, sp.c);
      out.push(arrow("sk", { x: to.mid.x + 6, y: cell(sp.r - 1, sp.c).y + G.h + 2 }, { x: to.mid.x + 6, y: to.y - 2 }, { tone: takeWins ? "line" : "accent" }));
      if (take >= 0) out.push(arrow("tk", { x: cell(sp.r - 1, sp.c - it.wt).mid.x, y: cell(sp.r - 1, 0).y + G.h + 2 }, { x: to.mid.x - 6, y: to.y - 2 }, { tone: takeWins ? "accent" : "line", label: `+${it.v}` }));
    }
    // The walk back: straight up where the item was skipped, across to w − wt where it was taken.
    o.path?.slice(1).forEach((p, k) => {
      const from = o.path![k];
      const a = cell(from.r, from.c);
      const b = cell(p.r, p.c);
      out.push(arrow(`w${k}`, { x: a.mid.x + (p.c === from.c ? 6 : -6), y: a.y - 2 }, { x: b.mid.x + (p.c === from.c ? 6 : 0), y: b.y + G.h + 2 }, { tone: "accent" }));
    });
    out.push(note("rd", o.readout, cell(0, 0).x - 80, cell(items.length, 0).y + G.h + 30, { size: 12, weight: 600 }));
    return out;
  };

  frames.push({
    caption: `dp[i][w] is the best value using only the first i items with at most w kg. With no items every cell is 0, so row 0 is the base case; each later row decides one more item.`,
    items: draw({ filled: 0, readout: "row 0: no items, value 0" }),
  });
  const spotCol = CAP;
  for (let r = 1; r <= items.length; r++) {
    const it = items[r - 1];
    const skip = dp[r - 1][spotCol];
    const take = it.wt <= spotCol ? dp[r - 1][spotCol - it.wt] + it.v : -1;
    const best = dp[r][spotCol];
    const lead =
      r === 1
        ? `Row ${it.name}: every cell either skips ${it.name}, copying the cell above, or takes it, adding ${it.v} to the cell ${it.wt} kg to the left in the row above. `
        : "";
    const left = spotCol - it.wt;
    const verdict =
      r === 1
        ? ""
        : take > skip
          ? ` Taking ${it.name} wins: ${it.name} plus the best of the earlier items in the ${left} kg it leaves beats leaving ${it.name} out.`
          : take === skip
            ? " A tie: either choice gives the same value."
            : ` Skipping ${it.name} wins: ${it.name} would leave only ${left} kg, worth ${dp[r - 1][left]}. This is the trap greedy fell into.`;
    frames.push({
      caption: `${lead}dp[${r}][${spotCol}] = max(skip ${skip}, take ${dp[r - 1][left]} + ${it.v} = ${take}) = ${best}.${verdict}`,
      items: draw({ filled: r, spot: { r, c: spotCol }, readout: `dp[${r}][${spotCol}] = max(${skip}, ${dp[r - 1][spotCol - it.wt]} + ${it.v}) = ${best}` }),
    });
  }
  // Walk back from the answer cell.
  const path: Spot[] = [{ r: items.length, c: CAP }];
  const taken: number[] = [];
  let w = CAP;
  for (let r = items.length; r >= 1; r--) {
    if (dp[r][w] !== dp[r - 1][w]) {
      taken.unshift(r);
      w -= items[r - 1].wt;
    }
    path.push({ r: r - 1, c: w });
  }
  const names = taken.map((r) => items[r - 1].name);
  const wsum = taken.reduce((s, r) => s + items[r - 1].wt, 0);
  frames.push({
    caption: `The answer is the bottom-right cell, ${dp[items.length][CAP]}. Walk back: where a cell equals the one above, the item was skipped; otherwise it was taken, and w drops by its weight. The bag holds ${and(names)}: ${wsum} kg, value ${dp[items.length][CAP]}.`,
    items: draw({ filled: items.length, path, taken, readout: `take ${and(names)}: ${wsum} kg, value ${dp[items.length][CAP]}` }),
  });
  return finish({ title: "The knapsack table, one item per row", input: `capacity ${CAP}; ${items.map((it) => `${it.name}: ${it.wt} kg, ${it.v}`).join("; ")}`, frames });
}

/** Why take-or-skip is complete: every selection of A, B, C either leaves C out or puts it in, and each half is a smaller cell. */
function whySubsets(): Walkthrough {
  const items = ITEMS.slice(0, 3);
  const last = items[items.length - 1];
  const all = subsets(items);
  const dp = knapsack(items, CAP);
  const n = items.length;
  const CH = 24;
  const PITCH = 30;
  const COL = 200;
  const frames: Frame[] = [];

  type Place = { x: number; y: number };
  const chips = (s: (typeof all)[number], at: Place, o: { over: boolean; best?: boolean; strip?: boolean; cap: number }): Item[] => {
    const out: Item[] = [];
    items.forEach((it, i) => {
      const inIt = (s.m & (1 << i)) !== 0;
      const stripped = o.strip && it === last;
      const tone: Tone = !inIt ? "ghost" : stripped ? "muted" : o.over ? "error" : o.best ? "strong" : "accent";
      out.push({ k: "cell", id: `s${s.m}c${i}`, x: at.x + i * (CH + 3), y: at.y, w: CH, h: CH, text: inIt ? it.name : "", tone, size: 12 });
    });
    const wt = o.strip ? s.wt - last.wt : s.wt;
    const v = o.strip ? s.v - last.v : s.v;
    out.push({ k: "text", id: `s${s.m}t`, x: at.x + n * (CH + 3) + 6, y: at.y + CH / 2, text: o.over ? `${wt} kg > ${o.cap}` : `${wt} kg, ${v}`, tone: o.over ? "error" : o.best ? "accent" : "soft", anchor: "start", size: 11.5 });
    return out;
  };
  const without = all.filter((s) => !(s.m & (1 << (n - 1))));
  const withIt = all.filter((s) => s.m & (1 << (n - 1)));
  const bestOf = (xs: typeof all, cap: number, strip = false) =>
    xs.filter((s) => s.wt - (strip ? last.wt : 0) <= cap).reduce((a, b) => ((b.v > a.v ? b : a)));
  const bWithout = bestOf(without, CAP);
  const bWith = bestOf(withIt, CAP);

  // Frame 1: every selection in one column.
  const f1: Item[] = [label("h0", `every selection of ${and(items.map((it) => it.name))}, bag ${CAP} kg`, 0, -18, { anchor: "start", tone: "soft", weight: 600 })];
  all.forEach((s, k) => f1.push(...chips(s, { x: 0, y: k * PITCH }, { over: s.wt > CAP, cap: CAP })));
  frames.push({
    caption: `With three items there are ${all.length} selections. ${and(all.filter((s) => s.wt > CAP).map((s) => s.pick.map((it) => it.name).join("")))} is too heavy; the best of the rest is what dp[${n}][${CAP}] must equal.`,
    items: f1,
  });

  const grouped = (strip: boolean): Item[] => {
    const out: Item[] = [
      label("h0", `without ${last.name}`, 0, -18, { anchor: "start", tone: "accent", weight: 600 }),
      label("h1", strip ? `with ${last.name}: ${last.name} set aside` : `with ${last.name}`, COL, -18, { anchor: "start", tone: "accent", weight: 600 }),
    ];
    without.forEach((s, k) => out.push(...chips(s, { x: 0, y: k * PITCH }, { over: s.wt > CAP, best: s === bWithout, cap: CAP })));
    const capWith = strip ? CAP - last.wt : CAP;
    withIt.forEach((s, k) => {
      const wt = strip ? s.wt - last.wt : s.wt;
      out.push(...chips(s, { x: COL, y: k * PITCH }, { over: wt > capWith, best: s === bWith, strip, cap: capWith }));
    });
    const y = Math.max(without.length, withIt.length) * PITCH + 14;
    out.push(note("r0", `best ${bWithout.v} = dp[${n - 1}][${CAP}]`, 0, y, { size: 12, weight: 600 }));
    out.push(note("r1", strip ? `best ${bWith.v - last.v} = dp[${n - 1}][${CAP - last.wt}], + ${last.v}` : `best ${bWith.v}`, COL, y, { size: 12, weight: 600 }));
    if (strip) out.push(note("r2", `dp[${n}][${CAP}] = max(${bWithout.v}, ${bWith.v - last.v} + ${last.v}) = ${dp[n][CAP]}`, 0, y + 24, { size: 12, weight: 600, tone: "accent" }));
    return out;
  };
  frames.push({
    caption: `Split them by item ${last.name}. Every selection is in exactly one group, so the best overall is the better of the two groups' bests. The left group is just the selections of ${and(items.slice(0, -1).map((it) => it.name))} within ${CAP} kg: dp[${n - 1}][${CAP}] = ${dp[n - 1][CAP]}, the skip option.`,
    items: grouped(false),
  });
  frames.push({
    caption: `Set ${last.name} aside in the right group: what is left is every selection of ${and(items.slice(0, -1).map((it) => it.name))} within ${CAP} − ${last.wt} = ${CAP - last.wt} kg, whose best is dp[${n - 1}][${CAP - last.wt}] = ${dp[n - 1][CAP - last.wt]}. Adding ${last.name}'s value is the take option, and nothing is missed.`,
    items: grouped(true),
  });
  return finish({ title: "Why take-or-skip misses nothing", input: `capacity ${CAP}; ${items.map((it) => `${it.name}: ${it.wt} kg, ${it.v}`).join("; ")}`, frames });
}

/** The one-row array: the same item, capacity looped downwards against upwards. */
function oneRow(): Walkthrough {
  const it = { wt: 3, v: 4 };
  const W = 6;
  const S = 36;
  const G = 8;
  const Y2 = 150;
  const mid = (i: number) => slotMid(i, 0, S, G);
  type Step = { w: number; read: number; readVal: number; val: number; stale: boolean };
  const run = (down: boolean) => {
    const dp = Array.from({ length: W + 1 }, () => 0);
    const touched = new Set<number>();
    const steps: Step[] = [];
    const order = down ? Array.from({ length: W - it.wt + 1 }, (_, k) => W - k) : Array.from({ length: W - it.wt + 1 }, (_, k) => it.wt + k);
    const snaps: number[][] = [dp.slice()];
    for (const w of order) {
      const read = w - it.wt;
      const readVal = dp[read];
      dp[w] = Math.max(dp[w], readVal + it.v);
      steps.push({ w, read, readVal, val: dp[w], stale: touched.has(read) });
      touched.add(w);
      snaps.push(dp.slice());
    }
    return { steps, snaps };
  };
  const dn = run(true);
  const up = run(false);
  const frames: Frame[] = [];

  const lane = (prefix: string, y: number, snap: number[], step: Step | undefined, done: number[]): Item[] => {
    const out: Item[] = [rowLabel(`${prefix}l`, "dp", -12, y, S)];
    out.push(
      ...row(prefix, snap, {
        y,
        size: S,
        gap: G,
        index: true,
        tone: (k) => (step && k === step.w ? "strong" : step && k === step.read ? (step.stale ? "error" : "accent") : done.includes(k) ? "plain" : "plain"),
      }),
    );
    if (step) out.push(arrow(`${prefix}a`, { x: mid(step.read), y: y - 4 }, { x: mid(step.w), y: y - 4 }, { tone: step.stale ? "error" : "accent", bow: -(12 + (step.w - step.read) * 9), label: `+${it.v}` }));
    return out;
  };
  const heads = (): Item[] => [
    label("h1", `w from ${W} down to ${it.wt}`, 0, -52, { anchor: "start", tone: "soft", weight: 600 }),
    label("h2", `w from ${it.wt} up to ${W}`, 0, Y2 - 52, { anchor: "start", tone: "soft", weight: 600 }),
  ];
  frames.push({
    caption: `One item, ${it.wt} kg worth ${it.v}, and a single array dp[w] for capacities 0 to ${W}. Each update reads dp[w − ${it.wt}] and adds ${it.v}. Only the direction of the loop over w differs between the two rows.`,
    items: [...heads(), ...lane("p", 0, dn.snaps[0], undefined, []), ...lane("q", Y2, up.snaps[0], undefined, [])],
  });
  const firstStale = up.steps.findIndex((s) => s.stale);
  dn.steps.forEach((a, k) => {
    const b = up.steps[k];
    let caption: string;
    if (b.stale)
      caption = `Downwards, dp[${a.w}] reads dp[${a.read}] = ${a.readVal}: ${a.val}. Upwards, dp[${b.w}] reads dp[${b.read}], which this pass already updated — it holds the item — so the item goes in a second time: ${b.val}.`;
    else if (k === 0)
      caption = `Downwards, dp[${a.w}] reads dp[${a.read}] = ${a.readVal}, a cell this pass has not touched yet: ${a.val}. Upwards, dp[${b.w}] reads dp[${b.read}] = ${b.readVal}: ${b.val}. So far the two agree.`;
    else if (k === firstStale - 1)
      caption = `dp[${a.w}] reads dp[${a.read}] downwards and dp[${b.w}] reads dp[${b.read}] upwards: ${a.val} each. The upward loop's next read, dp[${up.steps[k + 1].read}], is a cell it has already written.`;
    else
      caption = `Downwards, dp[${a.w}] reads dp[${a.read}]: ${a.val}. Upwards, dp[${b.w}] reads dp[${b.read}]: ${b.val}. Every cell the downward loop reads is to its left, still holding the values from before this item.`;
    frames.push({
      caption,
      items: [...heads(), ...lane("p", 0, dn.snaps[k + 1], a, dn.steps.slice(0, k).map((s) => s.w)), ...lane("q", Y2, up.snaps[k + 1], b, up.steps.slice(0, k).map((s) => s.w))],
    });
  });
  const dLast = dn.snaps[dn.snaps.length - 1];
  const uLast = up.snaps[up.snaps.length - 1];
  frames.push({
    caption: `Downwards ends with dp[${W}] = ${dLast[W]}: the item once, the 0/1 knapsack. Upwards ends with ${uLast[W]}: the item twice, which is exactly the unbounded knapsack, where reuse is allowed.`,
    items: [
      ...heads(),
      ...lane("p", 0, dLast, undefined, []),
      ...lane("q", Y2, uLast, undefined, []),
      label("v1", `0/1: dp[${W}] = ${dLast[W]}`, slotX(W + 1, 0, S, G) + 4, S / 2, { anchor: "start", tone: "accent", weight: 600 }),
      label("v2", `unbounded: ${uLast[W]}`, slotX(W + 1, 0, S, G) + 4, Y2 + S / 2, { anchor: "start", tone: "error", weight: 600 }),
    ],
  });
  return finish({ title: "One row: why the capacity loop runs downwards", input: `one item of ${it.wt} kg worth ${it.v}, capacity ${W}`, frames });
}

/** Subset sum for Partition Equal Subset Sum: the reachable sums after each number, looped downwards. */
function subsetSum(): Walkthrough {
  const nums = [1, 5, 11, 5];
  const total = nums.reduce((a, b) => a + b, 0);
  const target = total / 2;
  const S = 30;
  const G = 5;
  const mid = (i: number) => slotMid(i, 0, S, G);
  const reach = Array.from({ length: target + 1 }, (_, s) => s === 0);
  const via: Array<number | null> = Array.from({ length: target + 1 }, () => null); // index of the number that first reached s
  const frames: Frame[] = [];

  const draw = (o: { k?: number; fresh?: Array<{ s: number; from: number }>; split?: number[]; readout: string }): Item[] => {
    const out: Item[] = [rowLabel("nl", "nums", -12, -84, S)];
    out.push(...row("n", nums, { y: -84, size: S, gap: G, tone: (i) => (o.split ? (o.split.includes(i) ? "strong" : "plain") : i === o.k ? "accent" : o.k !== undefined && i < o.k ? "muted" : "plain") }));
    out.push(rowLabel("rl", "sum", -12, 0, S));
    out.push(
      ...row("r", reach.map((_, s) => s), {
        size: S,
        gap: G,
        tone: (s) => (o.fresh?.some((f) => f.s === s) ? "accent" : reach[s] ? (s === target && o.split ? "strong" : "strong") : "muted"),
      }),
    );
    o.fresh?.forEach((f, j) => out.push(arrow(`f${j}`, { x: mid(f.from) + 2, y: -4 }, { x: mid(f.s) - 2, y: -4 }, { tone: "accent", bow: -(10 + (f.s - f.from) * 4.2), label: j === 0 ? `+${nums[o.k as number]}` : undefined })));
    out.push(note("rd", o.readout, 0, S + 26, { size: 12, weight: 600 }));
    return out;
  };

  frames.push({
    caption: `[${nums.join(", ")}] adds up to ${total}, so two equal halves would each be ${target}. Find one subset that sums to ${target}; the rest is the other half. Only the empty subset exists so far, so only sum 0 is reachable.`,
    items: draw({ readout: "reachable: 0" }),
  });
  nums.forEach((x, k) => {
    const fresh: Array<{ s: number; from: number }> = [];
    const old: number[] = [];
    for (let s = target; s >= x; s--) {
      if (!reach[s - x]) continue;
      if (reach[s]) old.push(s);
      else {
        reach[s] = true;
        via[s] = k;
        fresh.push({ s, from: s - x });
      }
    }
    const list = reach.map((r, s) => (r ? s : -1)).filter((s) => s >= 0);
    const gained = and(fresh.map((f) => `${f.s} (from ${f.from})`).reverse());
    const already = old.length ? ` ${and(old.map(String).reverse())} already ${old.length === 1 ? "was" : "were"}.` : "";
    const caption = !fresh.length
      ? `Number ${x} adds nothing new below ${target + 1}.`
      : k === 0
        ? `Number ${x}: a sum s becomes reachable when s − ${x} was reachable before ${x} arrived. That gives ${gained}. The loop over s runs downwards, so each number is used at most once.`
        : fresh.some((f) => f.s === target)
          ? `Number ${x}: ${gained}.${already} The target ${target} is reachable now; the rest of the pass only fills in smaller sums.`
          : `Number ${x}: sums ${gained} become reachable.${already}`;
    frames.push({ caption, items: draw({ k, fresh: fresh.slice().reverse(), readout: `reachable: ${list.join(", ")}` }) });
  });
  // One subset that reaches the target, from the number that first reached each sum.
  const half: number[] = [];
  for (let s = target; s > 0; ) {
    const k = via[s] as number;
    half.push(k);
    s -= nums[k];
  }
  const other = nums.map((_, i) => i).filter((i) => !half.includes(i));
  frames.push({
    caption: `${target} is reachable, so the array splits: ${show(half.map((i) => nums[i]))} and ${show(other.map((i) => nums[i]))}, both summing to ${target}. Each number touched each sum once: O(n × target) time, O(target) space.`,
    items: draw({ split: half, readout: `${show(half.map((i) => nums[i]))} and ${show(other.map((i) => nums[i]))}` }),
  });
  return finish({ title: "Subset sum: which totals can a subset reach?", input: `nums = ${show(nums)}, target = ${target}`, frames });
}

/** Coins 1, 2, 3 and amount 4: the coin loop outside counts combinations, the amount loop outside counts ordered sequences. */
function loopOrder(): Walkthrough {
  const coins = [1, 2, 3];
  const amount = 4;
  const S = 32;
  const G = 6;
  // Coins outside: one snapshot of ways[] after each coin.
  const ways = Array.from({ length: amount + 1 }, (_, a) => (a === 0 ? 1 : 0));
  const snaps: number[][] = [ways.slice()];
  for (const c of coins) {
    for (let a = c; a <= amount; a++) ways[a] += ways[a - c];
    snaps.push(ways.slice());
  }
  // Amounts outside.
  const seq = Array.from({ length: amount + 1 }, (_, a) => (a === 0 ? 1 : 0));
  for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a) seq[a] += seq[a - c];
  // The lists themselves, by enumeration.
  const all: number[][] = [];
  const grow = (left: number, acc: number[]) => {
    if (left === 0) all.push(acc);
    for (const c of coins) if (c <= left) grow(left - c, [...acc, c]);
  };
  grow(amount, []);
  const combos = all.filter((s) => s.every((c, i) => i === 0 || s[i - 1] <= c));
  if (combos.length !== ways[amount] || all.length !== seq[amount]) throw new Error("loop-order: tables disagree with the enumeration");
  const LX = (amount + 1) * (S + G) + 40;
  const chip = (s: number[], k: number, tone: Tone): Item => {
    const t = s.join("+");
    return { k: "cell", id: `c${t}`, x: LX, y: k * 26, w: t.length * 8 + 14, h: 22, text: t, tone, size: 12 };
  };
  const heads = (): Item[] => [];
  void heads;
  const frames: Frame[] = [];

  const f1: Item[] = [label("t1", "coin loop outside", 0, -40, { anchor: "start", tone: "soft", weight: 600 })];
  for (let a = 0; a <= amount; a++) f1.push({ k: "text", id: `ah${a}`, x: slotMid(a, 0, S, G), y: -14, text: String(a), tone: "faint", anchor: "middle", size: 11 });
  snaps.forEach((snap, r) => {
    const y = r * (S + G);
    f1.push(rowLabel(`gl${r}`, r === 0 ? "start" : `+ coin ${coins[r - 1]}`, -12, y, S));
    f1.push(...row(`g${r}-`, snap, { y, size: S, gap: G, tone: (a) => (r === snaps.length - 1 && a === amount ? "strong" : "plain") }));
  });
  combos.forEach((s, k) => f1.push(chip(s, k, "accent")));
  f1.push(label("l1", `${combos.length} combinations`, LX, -14, { anchor: "start", tone: "accent", weight: 600 }));
  frames.push({
    caption: `Coins outside, amounts inside: all the 1s are placed before any 2 is considered, and all the 2s before any 3, so each combination is built in one fixed order and counted once: ${combos.length} ways. This is Coin Change II.`,
    items: f1,
  });

  const f2: Item[] = [label("t1", "amount loop outside", 0, -40, { anchor: "start", tone: "soft", weight: 600 })];
  for (let a = 0; a <= amount; a++) f2.push({ k: "text", id: `ai${a}`, x: slotMid(a, 0, S, G), y: S + 12, text: String(a), tone: "faint", anchor: "middle", size: 11 });
  f2.push(rowLabel("sl", "ways", -12, 0, S));
  f2.push(...row("s", seq, { size: S, gap: G, tone: (a) => (a === amount ? "strong" : a >= amount - coins.length ? "accent" : "plain") }));
  f2.push(note("sr", `ways[${amount}] = ${coins.map((c) => seq[amount - c]).join(" + ")} = ${seq[amount]}`, 0, S + 40, { size: 12, weight: 600 }));
  f2.push(note("sr2", coins.map((c) => `ways[${amount - c}]`).join(" + "), 0, S + 62, { size: 11, tone: "soft" }));
  all.forEach((s, k) => f2.push(chip(s, k, combos.some((c) => c.join() === s.join()) ? "plain" : "accent")));
  f2.push(label("l1", `${all.length} ordered sequences`, LX, -14, { anchor: "start", tone: "accent", weight: 600 }));
  frames.push({
    caption: `Amounts outside, coins inside: every amount may end with any coin, so 1+3 and 3+1 count separately; the highlighted orders never appear in the first table. ways[${amount}] = ${coins.map((c) => `ways[${amount - c}]`).join(" + ")} = ${seq[amount]} ordered sequences. This is Combination Sum IV.`,
    items: f2,
  });
  return finish({ title: "Counting the ways: the loop order decides what is counted", input: `coins = ${show(coins)}, amount = ${amount}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "greedy-bag": greedyBag,
  table,
  "why-subsets": whySubsets,
  "one-row": oneRow,
  "subset-sum": subsetSum,
  "loop-order": loopOrder,
};
