import { and, finish, note, rowLabel, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "./kit.js";

/**
 * Interval Problems: Merge, Insert and Sweep — the lesson's figures
 * (content/roadmap/intervals.md places each with "@figure <name>"; the
 * merge sweep itself is the hub's walkthrough). Every interval is a bar on
 * a number line, `U` units per 1, so overlap is something you see rather
 * than a pair of comparisons you read. Each generator runs the lesson's own
 * loop on its example and draws what it did.
 */

type Iv = readonly [number, number];
const fmt = (iv: Iv) => `[${iv[0]}, ${iv[1]}]`;

/** A bar from s to e on a line scaled `u` px per unit; its text is the interval, when it fits. */
function bar(id: string, iv: Iv, y: number, u: number, o: { tone?: Tone; h?: number; size?: number; text?: string } = {}): Item {
  const w = Math.max(3, (iv[1] - iv[0]) * u);
  const text = o.text ?? `${iv[0]}–${iv[1]}`;
  const size = o.size ?? 11;
  const fits = text.length * size * 0.6 + 4 <= w;
  return box(id, iv[0] * u, y, fits ? text : "", { tone: o.tone ?? "plain", w, h: o.h ?? 20, size });
}

/** A number line from `lo` to `hi` at height y, a tick and a number every `step`. */
function axis(prefix: string, lo: number, hi: number, y: number, u: number, step = 1): Item[] {
  const items: Item[] = [{ k: "edge", id: `${prefix}line`, x1: lo * u, y1: y, x2: hi * u, y2: y, tone: "line" }];
  for (let v = lo; v <= hi; v += step) {
    items.push({ k: "edge", id: `${prefix}t${v}`, x1: v * u, y1: y, x2: v * u, y2: y + 4, tone: "line" });
    items.push({ k: "text", id: `${prefix}n${v}`, x: v * u, y: y + 15, text: String(v), tone: "faint", anchor: "middle", size: 10.5 });
  }
  return items;
}

/** A dashed vertical marker at x = v·u from y1 to y2, its name above it. */
function marker(id: string, v: number, u: number, y1: number, y2: number, text: string, tone: "accent" | "error" = "accent"): Item[] {
  return [
    { k: "edge", id, x1: v * u, y1, x2: v * u, y2, tone, dashed: true },
    { k: "text", id: `${id}-t`, x: v * u, y: y1 - 9, text, tone, anchor: "middle", size: 11, mono: false, weight: 600 },
  ];
}

/* ── The overlap test ─────────────────────────────────────────────── */

/** Five arrangements of two intervals, each judged by the one test, with the common part shaded. */
function overlapTest(): Walkthrough {
  const cases: Array<[Iv, Iv]> = [
    [[1, 3], [5, 8]],
    [[1, 4], [4, 5]],
    [[1, 6], [4, 9]],
    [[2, 9], [3, 5]],
    [[7, 9], [1, 3]],
  ];
  const U = 20;
  const BH = 17;
  const ROW = 58;
  const TOP = 0;
  const items: Item[] = [
    label("h1", "closed  [a, b]: overlap ⇔ a.start ≤ b.end and b.start ≤ a.end", -58, -44, { anchor: "start", tone: "ink", size: 11, mono: true }),
    label("h2", "half-open [a, b): the same with < in both", -58, -24, { anchor: "start", tone: "soft", size: 11, mono: true }),
  ];
  cases.forEach(([a, b], k) => {
    const y = TOP + k * ROW;
    const closed = a[0] <= b[1] && b[0] <= a[1];
    const open = a[0] < b[1] && b[0] < a[1];
    const lo = Math.max(a[0], b[0]);
    const hi = Math.min(a[1], b[1]);
    if (closed && hi > lo) items.push({ k: "band", id: `c${k}`, x: lo * U, y: y - 5, w: (hi - lo) * U, h: BH * 2 + 14, tone: "strong" });
    if (closed) {
      items.push({ k: "edge", id: `cl${k}`, x1: lo * U, y1: y - 5, x2: lo * U, y2: y + BH * 2 + 9, tone: "accent", dashed: true });
      if (hi > lo) items.push({ k: "edge", id: `ch${k}`, x1: hi * U, y1: y - 5, x2: hi * U, y2: y + BH * 2 + 9, tone: "accent", dashed: true });
    }
    const tone: Tone = closed ? "accent" : "plain";
    items.push(bar(`a${k}`, a, y, U, { tone, h: BH, text: "" }));
    items.push(bar(`b${k}`, b, y + BH + 4, U, { tone, h: BH, text: "" }));
    items.push(label(`la${k}`, `a ${fmt(a)}`, -8, y + BH / 2, { anchor: "end", size: 11, mono: true, tone: "soft" }));
    items.push(label(`lb${k}`, `b ${fmt(b)}`, -8, y + BH * 1.5 + 4, { anchor: "end", size: 11, mono: true, tone: "soft" }));
    const verdict = !closed
      ? a[1] < b[0]
        ? "apart: a ends before b starts"
        : "apart: b ends before a starts"
      : !open
        ? `touch at ${lo}: closed yes, half-open no`
        : (b[0] >= a[0] && b[1] <= a[1]) || (a[0] >= b[0] && a[1] <= b[1])
          ? `one inside the other: common [${lo}, ${hi}]`
          : `overlap: common part [${lo}, ${hi}]`;
    items.push(label(`v${k}`, verdict, 10 * U + 12, y + BH + 2, { anchor: "start", size: 11, tone: closed ? "accent" : "soft", weight: closed ? 600 : 500 }));
  });
  items.push(...axis("ax", 0, 10, TOP + cases.length * ROW - 6, U));
  return finish({
    title: "One test for every way two intervals can sit",
    input: "",
    frames: [
      {
        caption: "Two intervals miss only when one ends before the other starts; the test is the negation of that, so it covers touching ends and one interval inside another with no special case. When they overlap, the shaded common part runs from the later start to the earlier end.",
        items,
      },
    ],
  });
}

/* ── Why one pass is enough ───────────────────────────────────────── */

/**
 * The merge sweep's promise: a block is closed the moment a start passes
 * its end, and nothing later can reach back — because later starts only
 * grow. Shown on the hub walkthrough's example, then broken by skipping the
 * sort.
 */
function onePass(): Walkthrough {
  const input: Iv[] = [[2, 6], [8, 10], [1, 3], [15, 18], [9, 12]];
  const order = input.map((_, i) => i).sort((a, b) => input[a][0] - input[b][0]);
  const U = 22;
  const LANE = 30;
  const BH = 22;
  const n = input.length;
  const OUT = n * LANE + 14;
  const AX = OUT + BH + 14;
  const RIGHT = 19;
  const frames: Frame[] = [];

  type State = { lanes: number[]; tone: (i: number) => Tone; out: Array<{ iv: Iv; tone: Tone }>; extra: Item[]; laneLabel: string };
  const draw = (s: State): Item[] => {
    const items: Item[] = [...s.extra];
    items.push(rowLabel("lane", s.laneLabel, -10, 0, BH));
    input.forEach((iv, i) => items.push(bar(`b${i}`, iv, s.lanes.indexOf(i) * LANE, U, { tone: s.tone(i), h: BH })));
    items.push(rowLabel("lo", "output", -10, OUT, BH));
    s.out.forEach((o, k) => items.push(bar(`o${k}`, o.iv, OUT, U, { tone: o.tone, h: BH })));
    items.push(...axis("ax", 0, RIGHT, AX, U));
    return items;
  };

  // Run the merge in sorted order, recording each moment a block closes.
  const merged: Array<[number, number]> = [];
  const owner: number[] = [];
  const closes: Array<{ block: [number, number]; members: number[]; next: number; at: number }> = [];
  order.forEach((i, step) => {
    const [s, e] = input[i];
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
      owner[i] = merged.length - 1;
    } else {
      if (last) closes.push({ block: [last[0], last[1]], members: order.slice(0, step).filter((j) => owner[j] === merged.length - 1), next: i, at: step });
      merged.push([s, e]);
      owner[i] = merged.length - 1;
    }
  });

  const sortedLanes = order;
  const staircase: Item[] = [
    { k: "path", id: "stair", pts: sortedLanes.map((i, k) => [input[i][0] * U - 9, k * LANE + BH / 2] as [number, number]), tone: "accent", width: 1.6, dashed: true },
    ...sortedLanes.map((i, k): Item => ({ k: "node", id: `dot${k}`, x: input[i][0] * U - 9, y: k * LANE + BH / 2, r: 3.5, text: "", tone: "strong" })),
  ];
  frames.push({
    caption: `Sorted by start, the left ends form a staircase that only goes right: ${and(sortedLanes.map((i) => String(input[i][0])))}. Whatever comes later in the list starts no earlier than whatever came before it.`,
    items: draw({ lanes: sortedLanes, tone: () => "plain", out: [], extra: staircase, laneLabel: "sorted" }),
  });

  closes.forEach((c, k) => {
    const rest = order.slice(c.at);
    const top = c.at * LANE - 6;
    const extra: Item[] = [
      { k: "band", id: "rest", x: input[c.next][0] * U, y: top, w: (RIGHT - input[c.next][0]) * U, h: (n - c.at) * LANE + 2, tone: "accent" },
      ...marker("end", c.block[1], U, -18, OUT + BH + 4, `end ${c.block[1]}`),
      { k: "text", id: "rest-t", x: RIGHT * U, y: AX + 34, text: `shaded: every later start ≥ ${input[c.next][0]} > ${c.block[1]}`, tone: "accent", anchor: "end", size: 11.5, weight: 600, mono: false },
    ];
    const done = order.slice(0, c.at).filter((i) => !c.members.includes(i));
    const out = merged.slice(0, k + 1).map((iv, j) => ({ iv: [iv[0], j === k ? c.block[1] : iv[1]] as Iv, tone: (j === k ? "strong" : "muted") as Tone }));
    frames.push({
      caption: `${fmt(input[c.next])} starts at ${input[c.next][0]}, past the block's end ${c.block[1]}. Every interval still to come (${rest.length} of them, shaded) starts at ${input[c.next][0]} or later, so none can reach back: ${fmt(c.block)} is final.`,
      items: draw({
        lanes: sortedLanes,
        tone: (i) => (i === c.next ? "accent" : c.members.includes(i) ? "strong" : done.includes(i) || order.indexOf(i) < c.at ? "muted" : "plain"),
        out,
        extra,
        laneLabel: "sorted",
      }),
    });
  });

  // The same loop on the unsorted input: find the first interval that belongs to a block already closed.
  const blocks: Array<[number, number]> = [];
  const placed: number[] = [];
  let broken = -1;
  let victim = -1;
  for (let i = 0; i < n && broken < 0; i++) {
    const [s, e] = input[i];
    const reachesBack = blocks.slice(0, -1).findIndex((b) => s <= b[1] && b[0] <= e);
    if (reachesBack >= 0) {
      broken = i;
      victim = reachesBack;
      break;
    }
    const last = blocks[blocks.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else blocks.push([s, e]);
    placed.push(i);
  }
  const unsorted = input.map((_, i) => i);
  frames.push({
    caption: `Skip the sort and the promise breaks. In the order given, ${fmt(blocks[victim])} is closed as soon as ${fmt(input[placed[placed.length - 1]])} arrives — then ${fmt(input[broken])} comes along and overlaps it, too late to join.`,
    items: draw({
      lanes: unsorted,
      tone: (i) => (i === broken ? "error" : placed.includes(i) ? (blocks.length - 1 === placed.indexOf(i) ? "accent" : "strong") : "plain"),
      out: blocks.map((b, j) => ({ iv: b as Iv, tone: (j === victim ? "strong" : "accent") as Tone })),
      extra: [...marker("end", blocks[victim][1], U, -18, OUT + BH + 4, `closed at ${blocks[victim][1]}`, "error")],
      laneLabel: "as given",
    }),
  });
  return finish({ title: "Why the sweep never has to look back", input: `intervals = [${input.map(fmt).join(", ")}]`, frames });
}

/* ── Insert interval ──────────────────────────────────────────────── */

/** Insert Interval's three phases on an already sorted, disjoint list: copy, absorb, copy. */
function insertPhases(): Walkthrough {
  const list: Iv[] = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]];
  const add: Iv = [4, 8];
  const U = 24;
  const BH = 22;
  const YL = 0;
  const YN = 52;
  const YR = 104;
  const AX = YR + BH + 14;
  const RIGHT = 17;
  const frames: Frame[] = [];
  const result: Array<{ iv: Iv; isNew: boolean }> = [];
  const cur: [number, number] = [add[0], add[1]];

  const draw = (at: number, phase: string, o: { absorbed?: Set<number>; placed?: boolean; done?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    if (!o.placed) {
      items.push(...marker("ns", cur[0], U, YL - 16, YN + BH + 4, `start ${cur[0]}`));
      items.push(...marker("ne", cur[1], U, YL - 16, YN + BH + 4, `end ${cur[1]}`));
    }
    items.push(rowLabel("ll", "list", -10, YL, BH));
    list.forEach((iv, i) => items.push(bar(`l${i}`, iv, YL, U, { h: BH, tone: i === at ? "accent" : i < at || o.done ? "muted" : "plain" })));
    items.push(rowLabel("ln", "new", -10, YN, BH));
    if (!o.placed) items.push(bar("new", cur, YN, U, { h: BH, tone: "accent" }));
    items.push(rowLabel("lr", "result", -10, YR, BH));
    result.forEach((r, k) => items.push(bar(r.isNew ? "new" : `r${k}`, r.iv, YR, U, { h: BH, tone: r.isNew || o.done ? "strong" : "plain" })));
    items.push(...axis("ax", 0, RIGHT, AX, U));
    items.push(note("phase", phase, 0, AX + 34, { size: 12, mono: false, weight: 600, tone: "accent" }));
    return items;
  };

  frames.push({
    caption: `The list is sorted and no two of its intervals overlap. The new interval ${fmt(add)} has to go in, merging with whatever it touches; its start and end are the two lines to compare against.`,
    items: draw(-1, "three phases: copy, absorb, copy"),
  });
  let i = 0;
  while (i < list.length && list[i][1] < cur[0]) {
    result.push({ iv: list[i], isNew: false });
    frames.push({
      caption: `${fmt(list[i])} ends at ${list[i][1]}, before the new start ${cur[0]}: it cannot touch the new interval, so it is copied to the result unchanged.`,
      items: draw(i, "phase 1: ends before the new start — copy"),
    });
    i++;
  }
  while (i < list.length && list[i][0] <= cur[1]) {
    const before: Iv = [cur[0], cur[1]];
    cur[0] = Math.min(cur[0], list[i][0]);
    cur[1] = Math.max(cur[1], list[i][1]);
    const grew = cur[0] !== before[0] || cur[1] !== before[1];
    frames.push({
      caption: grew
        ? `${fmt(list[i])} starts at ${list[i][0]}, not after the new end ${before[1]}: it overlaps, so it is absorbed and the new interval grows to ${fmt(cur)}.`
        : `${fmt(list[i])} lies inside ${fmt(cur)}: absorbed, and the new interval stays as it is.`,
      items: draw(i, "phase 2: starts by the new end — absorb"),
    });
    i++;
  }
  result.push({ iv: [cur[0], cur[1]], isNew: true });
  const afterNew = i;
  while (i < list.length) {
    result.push({ iv: list[i], isNew: false });
    i++;
  }
  frames.push({
    caption: `${afterNew < list.length ? `${fmt(list[afterNew])} starts at ${list[afterNew][0]}, after the new end ${cur[1]}. Sorted order means everything from here on does too, so ` : ""}${fmt(cur)} takes its place and the rest is copied as it is.`,
    items: draw(afterNew, "phase 3: starts after the new end — copy", { placed: true }),
  });
  frames.push({
    caption: `Result: ${result.map((r) => fmt(r.iv)).join(", ")}. One pass over a list that was already sorted: O(n), with no sort at all.`,
    items: draw(-1, "done in one pass", { placed: true, done: true }),
  });
  return finish({ title: "Insert an interval in three phases", input: `intervals = [${list.map(fmt).join(", ")}], new = ${fmt(add)}`, frames });
}

/* ── Interval list intersections ─────────────────────────────────── */

/** Two sorted, disjoint lists walked with one pointer each: output the common part, drop whichever ends first. */
function intersections(): Walkthrough {
  const A: Iv[] = [[1, 4], [6, 9], [13, 16]];
  const B: Iv[] = [[2, 7], [8, 11], [12, 15]];
  const U = 26;
  const BH = 22;
  const YA = 0;
  const YB = 56;
  const YO = 118;
  const AX = YO + BH + 14;
  const RIGHT = 17;
  const frames: Frame[] = [];
  const out: Iv[] = [];

  const draw = (i: number, j: number, o: { lo?: number; hi?: number; done?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    if (o.lo !== undefined && o.hi !== undefined) {
      const hit = o.lo <= o.hi;
      const x1 = Math.min(o.lo, o.hi) * U;
      const x2 = Math.max(o.lo, o.hi) * U;
      items.push({ k: "band", id: "common", x: x1, y: YA - 7, w: Math.max(3, x2 - x1), h: YB + BH + 14, tone: hit ? "strong" : "error" });
      const tone = hit ? "accent" : "error";
      items.push({ k: "text", id: "lo-t", x: o.lo * U, y: YA - 17, text: `lo ${o.lo}`, tone, anchor: "middle", size: 11, mono: false, weight: 600 });
      items.push({ k: "text", id: "hi-t", x: o.hi * U, y: YB + BH + 17, text: `hi ${o.hi}`, tone, anchor: "middle", size: 11, mono: false, weight: 600 });
    }
    items.push(rowLabel("la", "A", -10, YA, BH));
    A.forEach((iv, k) => items.push(bar(`a${k}`, iv, YA, U, { h: BH, tone: k === i && !o.done ? "accent" : k < i || o.done ? "muted" : "plain" })));
    items.push(rowLabel("lb", "B", -10, YB, BH));
    B.forEach((iv, k) => items.push(bar(`b${k}`, iv, YB, U, { h: BH, tone: k === j && !o.done ? "accent" : k < j || o.done ? "muted" : "plain" })));
    items.push(rowLabel("lo-r", "both", -10, YO, BH));
    out.forEach((iv, k) => items.push(bar(`o${k}`, iv, YO, U, { h: BH, tone: "strong" })));
    items.push(...axis("ax", 0, RIGHT, AX, U));
    return items;
  };

  frames.push({
    caption: "Each list is sorted and its own intervals never overlap. One pointer walks A, one walks B; at each step the common part of the two current intervals runs from the later start to the earlier end.",
    items: draw(0, 0),
  });
  let i = 0;
  let j = 0;
  while (i < A.length && j < B.length) {
    const lo = Math.max(A[i][0], B[j][0]);
    const hi = Math.min(A[i][1], B[j][1]);
    const hit = lo <= hi;
    if (hit) out.push([lo, hi]);
    const dropA = A[i][1] < B[j][1];
    const gone = dropA ? A[i] : B[j];
    const other = dropA ? B[j] : A[i];
    frames.push({
      caption: `${fmt(A[i])} and ${fmt(B[j])}: lo = ${lo}, hi = ${hi}${hit ? `, so ${fmt([lo, hi])} is covered by both` : ` — lo is past hi, nothing in common`}. ${fmt(gone)} ends first and can meet nothing else in the other list, so its pointer moves on; ${fmt(other)} stays.`,
      items: draw(i, j, { lo, hi }),
    });
    if (dropA) i++;
    else j++;
  }
  frames.push({
    caption: `${i === A.length ? "A" : "B"} is used up, so nothing more can overlap. ${out.length} common stretches: ${out.map(fmt).join(", ")}. Each step moves one pointer, so the walk is O(n + m).`,
    items: draw(i, j, { done: true }),
  });
  return finish({ title: "Intersect two sorted interval lists with two pointers", input: `A = [${A.map(fmt).join(", ")}], B = [${B.map(fmt).join(", ")}]`, frames });
}

/* ── Meeting rooms: the sweep line ───────────────────────────────── */

/**
 * Meeting Rooms II with sorted starts and sorted ends walked like a merge:
 * +1 at a start, −1 at an end, the peak is the answer. The count is drawn
 * as a step line under the meetings so the peak is a height you can see.
 */
function sweepLine(): Walkthrough {
  const meetings: Iv[] = [[0, 30], [5, 10], [10, 20], [15, 25], [20, 35]];
  const n = meetings.length;
  const U = 12;
  const LANE = 25;
  const BH = 19;
  const CB = n * LANE + 92; // the count chart's baseline
  const CU = 17; // px per meeting in use
  const AX = CB + 4;
  const RIGHT = 35;
  const frames: Frame[] = [];

  const run = (closed: boolean) => {
    const starts = meetings.map((m, i) => ({ t: m[0], i })).sort((a, b) => a.t - b.t);
    const ends = meetings.map((m, i) => ({ t: m[1], i })).sort((a, b) => a.t - b.t);
    const events: Array<{ t: number; i: number; start: boolean; inUse: number; peak: number }> = [];
    let i = 0;
    let j = 0;
    let inUse = 0;
    let peak = 0;
    while (i < n) {
      const startFirst = closed ? starts[i].t <= ends[j].t : starts[i].t < ends[j].t;
      if (startFirst) {
        inUse++;
        peak = Math.max(peak, inUse);
        events.push({ t: starts[i].t, i: starts[i].i, start: true, inUse, peak });
        i++;
      } else {
        inUse--;
        events.push({ t: ends[j].t, i: ends[j].i, start: false, inUse, peak });
        j++;
      }
    }
    return events;
  };

  const steps = (events: ReturnType<typeof run>, upto: number): Array<[number, number]> => {
    const pts: Array<[number, number]> = [[0, CB]];
    let c = 0;
    for (let k = 0; k <= upto; k++) {
      const e = events[k];
      pts.push([e.t * U, CB - c * CU]);
      c = e.inUse;
      pts.push([e.t * U, CB - c * CU]);
    }
    return pts;
  };

  const draw = (events: ReturnType<typeof run>, upto: number, o: { peakAt?: number; highlight?: Set<number> } = {}): Item[] => {
    const items: Item[] = [];
    const started = new Set<number>();
    const ended = new Set<number>();
    for (let k = 0; k <= upto; k++) (events[k].start ? started : ended).add(events[k].i);
    const now = upto >= 0 ? events[upto] : null;
    if (now) {
      items.push({ k: "edge", id: "sweep", x1: now.t * U, y1: -16, x2: now.t * U, y2: CB, tone: "accent", dashed: true });
      items.push({ k: "text", id: "sweep-t", x: now.t * U, y: -26, text: `t = ${now.t}`, tone: "accent", anchor: "middle", size: 11, weight: 600 });
    }
    meetings.forEach((m, i) => {
      const tone: Tone = o.highlight ? (o.highlight.has(i) ? "strong" : "muted") : ended.has(i) ? "muted" : started.has(i) ? (now && now.i === i ? "accent" : "strong") : now && now.i === i ? "accent" : "plain";
      items.push(bar(`m${i}`, m, i * LANE, U, { h: BH, tone }));
    });
    // The count chart: rooms in use over time, drawn up to the sweep line.
    for (let c = 0; c <= 4; c++) items.push({ k: "text", id: `cy${c}`, x: -8, y: CB - c * CU, text: String(c), tone: "faint", anchor: "end", size: 10.5 });
    items.push({ k: "text", id: "cyl", x: RIGHT * U, y: CB - 4 * CU - 14, text: "rooms in use", tone: "soft", anchor: "end", size: 11, weight: 600, mono: false });
    items.push({ k: "edge", id: "cgrid", x1: 0, y1: CB - (now ? now.peak : 0) * CU, x2: RIGHT * U, y2: CB - (now ? now.peak : 0) * CU, tone: "faint", dashed: true });
    if (now) items.push({ k: "path", id: `count${o.highlight ? "c" : ""}`, pts: steps(events, upto), tone: "accent", width: 2 });
    if (o.peakAt !== undefined && now) items.push({ k: "text", id: "peak", x: o.peakAt * U + 6, y: CB - now.peak * CU - 10, text: `peak ${now.peak}`, tone: "accent", anchor: "start", size: 11.5, weight: 600, mono: false });
    items.push(...axis("ax", 0, RIGHT, AX, U, 5));
    return items;
  };

  const open = run(false);
  frames.push({
    caption: `Five half-open meetings. Only the times matter, so the starts (${meetings.map((m) => m[0]).sort((a, b) => a - b).join(", ")}) and the ends (${meetings.map((m) => m[1]).sort((a, b) => a - b).join(", ")}) are sorted as two separate lists and walked like a merge.`,
    items: draw(open, -1),
  });
  open.forEach((e, k) => {
    const prev = k > 0 ? open[k - 1] : null;
    const tie = prev !== null && !e.start && open[k + 1] && open[k + 1].t === e.t && open[k + 1].start;
    const caption = e.start
      ? `A start at ${e.t}: ${fmt(meetings[e.i])} begins and the count rises to ${e.inUse}.${e.peak > (prev ? prev.peak : 0) ? ` New peak: ${e.peak}.` : ""}`
      : `An end at ${e.t}${tie ? ", tied with a start" : ""}: ${fmt(meetings[e.i])} is over and frees its room, so the count drops to ${e.inUse}.${tie ? " Half-open meetings let the end go first." : ""}`;
    frames.push({ caption, items: draw(open, k, { peakAt: e.inUse === e.peak && e.start ? e.t : undefined }) });
  });
  const last = open[open.length - 1];
  const first = last.inUse === last.peak ? last : open.find((e) => e.inUse === last.peak)!;
  const busy = new Set(meetings.map((m, i) => (m[0] <= first.t && first.t < m[1] ? i : -1)).filter((i) => i >= 0));
  frames.push({
    caption: `Every start has been seen, so the count can only fall and the loop stops. The peak, ${last.peak}, is the answer: at time ${first.t} these ${busy.size} meetings run at once, and no moment has more.`,
    items: draw(open, open.length - 1, { peakAt: first.t, highlight: busy }),
  });
  const shut = run(true);
  const top = shut.reduce((b, e, k) => (e.inUse > shut[b].inUse ? k : b), 0);
  const at = shut[top].t;
  const running = new Set(meetings.map((m, i) => (m[0] <= at && at <= m[1] ? i : -1)).filter((i) => i >= 0));
  frames.push({
    caption: `Treat the same meetings as closed — a train arriving as another leaves still needs a platform — and a tie goes to the start. At time ${at}, ${running.size} intervals contain the point ${at}, so the answer becomes ${shut[shut.length - 1].peak}.`,
    items: draw(shut, shut.length - 1, { peakAt: at, highlight: running }),
  });
  return finish({ title: "Meeting rooms: a sweep line counts what is running", input: `meetings = [${meetings.map(fmt).join(", ")}]`, frames });
}

/* ── Removing overlaps: the earliest end ─────────────────────────── */

/** Keep the most non-overlapping intervals: sorting by start fails, sorting by end is safe — and why. */
function earliestEnd(): Walkthrough {
  const ivs: Iv[] = [[1, 10], [2, 3], [4, 5], [6, 7]];
  const n = ivs.length;
  const U = 30;
  const LANE = 30;
  const BH = 22;
  const AX = n * LANE + 8;
  const RIGHT = 11;
  const frames: Frame[] = [];
  const byStart = ivs.map((_, i) => i).sort((a, b) => ivs[a][0] - ivs[b][0]);
  const byEnd = ivs.map((_, i) => i).sort((a, b) => ivs[a][1] - ivs[b][1]);

  const greedy = (order: number[]) => {
    const steps: Array<{ i: number; keep: boolean; keptEnd: number }> = [];
    let keptEnd = -Infinity;
    for (const i of order) {
      const keep = ivs[i][0] >= keptEnd;
      if (keep) keptEnd = ivs[i][1];
      steps.push({ i, keep, keptEnd });
    }
    return steps;
  };

  const draw = (order: number[], tone: (i: number) => Tone, extra: Item[] = [], tag = "by start"): Item[] => {
    const items: Item[] = [...extra, rowLabel("lane", tag, -10, 0, BH)];
    ivs.forEach((iv, i) => items.push(bar(`b${i}`, iv, order.indexOf(i) * LANE, U, { h: BH, tone: tone(i) })));
    items.push(...axis("ax", 0, RIGHT, AX, U));
    return items;
  };

  const s = greedy(byStart);
  const sKept = s.filter((x) => x.keep).map((x) => x.i);
  frames.push({
    caption: `Keep as many intervals as possible with no two overlapping. Sorted by start and kept greedily, ${fmt(ivs[sKept[0]])} goes first — and it blocks everything else: ${sKept.length} kept, ${n - sKept.length} removed.`,
    items: draw(byStart, (i) => (sKept.includes(i) ? "strong" : "error")),
  });

  const e = byEnd[0];
  const rival = byStart[0];
  frames.push({
    caption: `Sort by end instead. Why is the earliest end, ${fmt(ivs[e])}, a safe first pick? Any first pick ends no earlier — ${fmt(ivs[rival])} ends at ${ivs[rival][1]} — so swapping in ${fmt(ivs[e])} frees more room after it and breaks nothing.`,
    items: draw(
      byEnd,
      (i) => (i === e ? "accent" : i === rival ? "muted" : "plain"),
      [
        { k: "band", id: "room", x: ivs[e][1] * U, y: -6, w: (RIGHT - ivs[e][1]) * U, h: n * LANE, tone: "accent" },
        ...marker("ke", ivs[e][1], U, -22, AX, `free after ${ivs[e][1]}`),
        ...marker("re", ivs[rival][1], U, -22, AX, `vs ${ivs[rival][1]}`, "error"),
      ],
      "by end",
    ),
  });

  const g = greedy(byEnd);
  g.forEach((st, k) => {
    const decided = new Map(g.slice(0, k + 1).map((x) => [x.i, x.keep] as const));
    frames.push({
      caption: st.keep
        ? k === 0
          ? `Nothing is kept yet, so ${fmt(ivs[st.i])}, the earliest end, is kept. The kept end becomes ${st.keptEnd}: the next interval must start there or later.`
          : `${fmt(ivs[st.i])} starts at ${ivs[st.i][0]}, at or after the kept end ${g[k - 1].keptEnd}: keep it. The kept end becomes ${st.keptEnd}.`
        : `${fmt(ivs[st.i])} starts at ${ivs[st.i][0]}, before the kept end ${st.keptEnd}: it clashes, so it is the one removed.`,
      items: draw(
        byEnd,
        (i) => (decided.has(i) ? (decided.get(i) ? "strong" : "error") : "plain"),
        Number.isFinite(st.keptEnd) ? marker("kept", st.keptEnd, U, -22, AX, `kept end ${st.keptEnd}`) : [],
        "by end",
      ),
    });
  });
  const kept = g.filter((x) => x.keep).length;
  frames.push({
    caption: `${kept} kept, ${n - kept} removed — against ${sKept.length} kept when sorted by start. The same loop, with a strict comparison for closed ends, counts the arrows in the balloon problem.`,
    items: draw(byEnd, (i) => (g.find((x) => x.i === i)!.keep ? "strong" : "muted"), [], "by end"),
  });
  return finish({ title: "Fewest removals: keep the interval that ends first", input: `intervals = [${ivs.map(fmt).join(", ")}]`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "overlap-test": overlapTest,
  "one-pass": onePass,
  insert: insertPhases,
  intersections,
  "sweep-line": sweepLine,
  "earliest-end": earliestEnd,
};
