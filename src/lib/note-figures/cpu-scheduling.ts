import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { gantt, type GanttSlot } from "./kit.js";

/**
 * CPU Scheduling Algorithms: the note's figures
 * (content/notes/operating-systems/cpu-scheduling.md places each with
 * "@figure <name>").
 *
 * Every figure is the note's one example — four processes, arrivals 0, 2,
 * 4, 5 and bursts 7, 4, 1, 4 — run through a real scheduler below
 * (non-preemptive pick-at-completion, unit-step preemptive, and Round Robin
 * with its ready queue), and every chart is drawn from what the scheduler
 * did: the Gantt bar on top, and under it one lane per process showing
 * when it ran and when it sat in the ready queue, so a waiting time is a
 * length you can see. Each run is checked two ways before it is drawn:
 * every process runs exactly its burst, and the ready-queue time counted
 * unit by unit equals turnaround − burst.
 */

interface Proc {
  name: string;
  arrival: number;
  burst: number;
  priority: number;
}

/** The note's example; a smaller priority number is a higher priority, ties go to the earlier arrival. */
const PROCS: readonly Proc[] = [
  { name: "P1", arrival: 0, burst: 7, priority: 3 },
  { name: "P2", arrival: 2, burst: 4, priority: 1 },
  { name: "P3", arrival: 4, burst: 1, priority: 4 },
  { name: "P4", arrival: 5, burst: 4, priority: 2 },
];
const IDX = PROCS.map((_, i) => i);
const byName = (who: string) => PROCS.findIndex((p) => p.name === who);

/* ── The schedulers ───────────────────────────────────────────────── */

/** Pick at completion: whenever the CPU is free, the ready process with the lowest rank runs its whole burst. */
function nonPreemptive(rank: (i: number) => number): GanttSlot[] {
  const done = PROCS.map(() => false);
  const slots: GanttSlot[] = [];
  let t = 0;
  while (done.includes(false)) {
    const ready = IDX.filter((i) => !done[i] && PROCS[i].arrival <= t);
    if (!ready.length) {
      const next = Math.min(...IDX.filter((i) => !done[i]).map((i) => PROCS[i].arrival));
      slots.push({ who: "idle", from: t, to: next });
      t = next;
      continue;
    }
    ready.sort((a, b) => rank(a) - rank(b) || PROCS[a].arrival - PROCS[b].arrival || a - b);
    const i = ready[0];
    slots.push({ who: PROCS[i].name, from: t, to: t + PROCS[i].burst });
    t += PROCS[i].burst;
    done[i] = true;
  }
  return slots;
}

/** One time unit at a time: the lowest rank runs, and the running process keeps the CPU on a tie. */
function preemptive(rank: (i: number, left: readonly number[]) => number): GanttSlot[] {
  const left = PROCS.map((p) => p.burst);
  const slots: GanttSlot[] = [];
  let t = 0;
  let cur = -1;
  while (left.some((l) => l > 0)) {
    const ready = IDX.filter((i) => left[i] > 0 && PROCS[i].arrival <= t);
    if (!ready.length) {
      const last = slots[slots.length - 1];
      if (last?.who === "idle") last.to++;
      else slots.push({ who: "idle", from: t, to: t + 1 });
      t++;
      continue;
    }
    ready.sort((a, b) => rank(a, left) - rank(b, left) || PROCS[a].arrival - PROCS[b].arrival || a - b);
    let pick = ready[0];
    if (cur >= 0 && left[cur] > 0 && rank(cur, left) === rank(pick, left)) pick = cur;
    const last = slots[slots.length - 1];
    if (last && last.who === PROCS[pick].name && last.to === t) last.to++;
    else slots.push({ who: PROCS[pick].name, from: t, to: t + 1 });
    left[pick]--;
    t++;
    cur = pick;
  }
  return slots;
}

interface RrSlice {
  slot: GanttSlot;
  /** The ready queue just after the slice: arrivals during it first, then the preempted process. */
  queue: string[];
  arrived: string[];
  done: boolean;
}

/** Round Robin with quantum q; a process arriving as a quantum expires queues ahead of the preempted one. */
function roundRobin(q: number): RrSlice[] {
  const left = PROCS.map((p) => p.burst);
  const ready: number[] = [];
  const out: RrSlice[] = [];
  let next = 0;
  let t = 0;
  while (next < PROCS.length || ready.length) {
    if (!ready.length) t = Math.max(t, PROCS[next].arrival);
    while (next < PROCS.length && PROCS[next].arrival <= t) ready.push(next++);
    const i = ready.shift()!;
    const run = Math.min(q, left[i]);
    const from = t;
    t += run;
    left[i] -= run;
    const arrived: string[] = [];
    while (next < PROCS.length && PROCS[next].arrival <= t) {
      arrived.push(PROCS[next].name);
      ready.push(next++);
    }
    if (left[i] > 0) ready.push(i);
    out.push({ slot: { who: PROCS[i].name, from, to: t }, queue: ready.map((k) => PROCS[k].name), arrived, done: left[i] === 0 });
  }
  return out;
}

/* ── What a schedule measures ─────────────────────────────────────── */

interface Measures {
  completion: number[];
  turnaround: number[];
  waiting: number[];
  response: number[];
  end: number;
}

function measure(slots: readonly GanttSlot[], what: string): Measures {
  const runs = (i: number) => slots.filter((s) => s.who === PROCS[i].name);
  const completion = IDX.map((i) => Math.max(...runs(i).map((s) => s.to)));
  const first = IDX.map((i) => Math.min(...runs(i).map((s) => s.from)));
  const turnaround = IDX.map((i) => completion[i] - PROCS[i].arrival);
  const waiting = IDX.map((i) => turnaround[i] - PROCS[i].burst);
  const response = IDX.map((i) => first[i] - PROCS[i].arrival);
  const end = Math.max(...slots.map((s) => s.to));
  for (const i of IDX) {
    const ran = runs(i).reduce((a, s) => a + s.to - s.from, 0);
    if (ran !== PROCS[i].burst) throw new Error(`${what}: ${PROCS[i].name} ran ${ran}, its burst is ${PROCS[i].burst}`);
    // Ready-queue time, counted unit by unit, must be what turnaround − burst says.
    let queued = 0;
    for (let t = PROCS[i].arrival; t < completion[i]; t++) if (!runs(i).some((s) => s.from <= t && t < s.to)) queued++;
    if (queued !== waiting[i]) throw new Error(`${what}: ${PROCS[i].name} queued ${queued}, but TAT − burst = ${waiting[i]}`);
  }
  return { completion, turnaround, waiting, response, end };
}

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
const num = (x: number) => String(Math.round(x * 100) / 100);
const avg = (xs: readonly number[]) => num(sum(xs) / xs.length);
/** "19/4 = 4.75" */
const avgOf = (xs: readonly number[]) => `${sum(xs)}/${xs.length} = ${avg(xs)}`;

/* ── Drawing ──────────────────────────────────────────────────────── */

const UNIT = 24;
const BAR_H = 30;
const LANE_Y = 64;
const LANE_PITCH = 22;
const LANE_H = 14;
const at = (t: number) => t * UNIT;

/** The intervals of [arrival, completion) in which process i was not running: its time in the ready queue. */
function waits(slots: readonly GanttSlot[], i: number, upTo: number): Array<[number, number]> {
  const runs = slots.filter((s) => s.who === PROCS[i].name);
  const end = Math.min(upTo, Math.max(...runs.map((s) => s.to)));
  const out: Array<[number, number]> = [];
  let from: number | null = null;
  for (let t = PROCS[i].arrival; t <= end; t++) {
    const idle = t < end && !runs.some((s) => s.from <= t && t < s.to);
    if (idle && from === null) from = t;
    if (!idle && from !== null) {
      out.push([from, t]);
      from = null;
    }
  }
  return out;
}

/**
 * The CPU's Gantt bar up to `upTo`, the arrivals as carets over it, and one
 * lane per process: its runs as boxes, its time in the ready queue as a
 * tinted bar, and `right(i)` written after the lane.
 */
function timeline(slots: readonly GanttSlot[], upTo: number, o: { right: (i: number) => string; hotSlot?: number; hotLane?: number; laneY?: number } = { right: () => "" }): Item[] {
  const laneY = o.laneY ?? LANE_Y;
  const shown = slots.filter((s) => s.from < upTo).map((s, k) => ({ ...s, to: Math.min(s.to, upTo), tone: k === o.hotSlot ? ("accent" as const) : s.tone }));
  const items: Item[] = [label("cpu", "CPU", -10, BAR_H / 2, { anchor: "end", tone: "soft", size: 11.5, weight: 600 })];
  items.push(...gantt("g", shown, { unit: UNIT, h: BAR_H }).items);
  for (const p of PROCS) if (p.arrival <= upTo) items.push({ k: "ptr", id: `arr${p.name}`, x: at(p.arrival), y: -3, label: p.name, tone: "ink", up: false });
  IDX.forEach((i) => {
    const y = laneY + i * LANE_PITCH;
    const arrived = PROCS[i].arrival <= upTo;
    items.push(label(`ln${i}`, PROCS[i].name, -10, y + LANE_H / 2, { anchor: "end", tone: arrived ? (o.hotLane === i ? "accent" : "ink") : "faint", size: 11.5, mono: true, weight: 600 }));
    waits(slots, i, upTo).forEach(([a, b], k) => items.push({ k: "cell", id: `w${i}-${k}`, x: at(a), y, w: at(b) - at(a), h: LANE_H, text: "", tone: "accent" }));
    slots
      .filter((s) => s.who === PROCS[i].name && s.from < upTo)
      .forEach((s, k) => items.push({ k: "cell", id: `r${i}-${k}`, x: at(s.from), y, w: at(Math.min(s.to, upTo)) - at(s.from), h: LANE_H, text: "", tone: "plain" }));
    const r = o.right(i);
    if (r) items.push(label(`rt${i}`, r, at(16) + 10, y + LANE_H / 2, { anchor: "start", tone: o.hotLane === i ? "accent" : "soft", size: 11.5, mono: true }));
  });
  return items;
}

/** The key under the lanes: what the two kinds of bar mean. */
function key(y: number): Item[] {
  return [
    { k: "cell", id: "kw", x: 0, y, w: 22, h: 12, text: "", tone: "accent" },
    label("kwt", "in the ready queue", 28, y + 6, { anchor: "start", size: 11 }),
    { k: "cell", id: "kr", x: 150, y, w: 22, h: 12, text: "", tone: "plain" },
    label("krt", "on the CPU", 178, y + 6, { anchor: "start", size: 11 }),
  ];
}
const KEY_Y = LANE_Y + PROCS.length * LANE_PITCH + 6;

const waitsText = (m: Measures) => (i: number) => `waits ${m.waiting[i]}`;
const INPUT = "P1 (arrives 0, burst 7), P2 (2, 4), P3 (4, 1), P4 (5, 4)";
const INPUT_PRIORITY = "P1 (arrives 0, burst 7, priority 3), P2 (2, 4, 1), P3 (4, 1, 4), P4 (5, 4, 2)";

/* ── FCFS ─────────────────────────────────────────────────────────── */

function fcfs(): Walkthrough {
  const slots = nonPreemptive((i) => PROCS[i].arrival);
  const m = measure(slots, "fcfs");
  const p3 = byName("P3");
  const before = slots.filter((s) => s.to <= slots.find((x) => x.who === "P3")!.from).map((s) => s.who);
  return finish({
    title: "FCFS: each process runs to completion in arrival order",
    input: INPUT,
    frames: [
      {
        caption: `The bar is the CPU; each lane is one process, tinted while it sits in the ready queue. P3 needs ${PROCS[p3].burst} ms but waits ${m.waiting[p3]} behind ${before.join(" and ")} — the convoy effect. Average waiting time ${avgOf(m.waiting)} ms.`,
        items: [...timeline(slots, m.end, { right: waitsText(m), hotLane: p3 }), ...key(KEY_Y)],
      },
    ],
  });
}

/* ── SJF ──────────────────────────────────────────────────────────── */

function sjf(): Walkthrough {
  const slots = nonPreemptive((i) => PROCS[i].burst);
  const m = measure(slots, "sjf");
  const fc = measure(nonPreemptive((i) => PROCS[i].arrival), "fcfs");
  const first = slots[0];
  const atFree = first.to;
  const ready = IDX.filter((i) => PROCS[i].arrival <= atFree && PROCS[i].name !== first.who);
  const order = slots.slice(1).map((s) => s.who);
  return finish({
    title: "SJF: when the CPU is free, the shortest burst goes next",
    input: INPUT,
    frames: [
      {
        caption: `Only ${first.who} has arrived at 0, so it runs to ${atFree}. Then ${ready.map((i) => `${PROCS[i].name} (${PROCS[i].burst})`).join(", ")} are ready and run shortest first: ${order.join(", ")}, the tie at ${PROCS[byName(order[1])].burst} going to the earlier arrival. Average waiting ${avgOf(m.waiting)} ms, down from ${avg(fc.waiting)} under FCFS.`,
        items: [...timeline(slots, m.end, { right: waitsText(m) }), ...key(KEY_Y)],
      },
    ],
  });
}

/* ── SRTF, decision by decision ───────────────────────────────────── */

function srtf(): Walkthrough {
  const slots = preemptive((i, left) => left[i]);
  const m = measure(slots, "srtf");
  // The last caption calls this the lowest average on the example: check it against every other schedule in the note.
  const rivals = [nonPreemptive((i) => PROCS[i].arrival), nonPreemptive((i) => PROCS[i].burst), nonPreemptive((i) => PROCS[i].priority), preemptive((i) => PROCS[i].priority), ...[1, 2, 3, 4, 5, 6, 7, 8].map((q) => roundRobin(q).map((r) => r.slot))];
  if (rivals.some((r, k) => sum(measure(r, `rival ${k}`).waiting) < sum(m.waiting))) throw new Error("srtf: another schedule waits less");
  const left = PROCS.map((p) => p.burst);
  const frames: Frame[] = [];
  slots.forEach((s, k) => {
    const i = byName(s.who);
    const ready = IDX.filter((j) => left[j] > 0 && PROCS[j].arrival <= s.from);
    const arrivedNow = IDX.filter((j) => PROCS[j].arrival === s.from && s.from > 0);
    const prev = k > 0 ? byName(slots[k - 1].who) : -1;
    const others = ready.filter((j) => j !== i);
    // The decision at s.from, from the remaining times the scheduler compared.
    for (const j of others) if (left[j] < left[i]) throw new Error(`srtf: ${s.who} chosen with ${left[i]} left over ${PROCS[j].name} with ${left[j]}`);
    let why: string;
    const preempts = prev >= 0 && prev !== i && left[prev] > 0 ? `preempts ${PROCS[prev].name} and runs` : "runs";
    if (!others.length) why = `${IDX.some((j) => PROCS[j].arrival > s.from) ? `Only ${s.who} has arrived` : `At ${s.from} only ${s.who} is left`}, so it runs`;
    else {
      const list = others.map((j) => `${PROCS[j].name} ${left[j]}`).join(", ");
      const news = arrivedNow.map((j) => PROCS[j].name).join(" and ");
      why = `${news ? `At ${s.from}, ${news} arrives. ` : `At ${s.from}, `}${s.who} has the least time left, ${left[i]} (others: ${list}), so it ${preempts}`;
    }
    left[i] -= s.to - s.from;
    const stopArrivals = IDX.filter((j) => PROCS[j].arrival === s.to).map((j) => PROCS[j].name);
    const stop = left[i] === 0 ? `it finishes at ${s.to}` : `${stopArrivals.join(" and ")} arrives at ${s.to} and the times are compared again`;
    const last = k === slots.length - 1;
    const snapshot = [...left];
    frames.push({
      caption: `${why} until ${stop}.${last ? ` Average waiting ${avgOf(m.waiting)} ms, the lowest of any algorithm on this example.` : ""}`,
      items: [
        ...timeline(slots, s.to, {
          hotSlot: k,
          hotLane: i,
          right: (j) => (PROCS[j].arrival > s.to ? "" : snapshot[j] === 0 ? (last ? `waits ${m.waiting[j]}` : "done") : `left ${snapshot[j]}`),
        }),
        ...key(KEY_Y),
      ],
    });
  });
  return finish({ title: "SRTF: every arrival is compared with the remaining time", input: INPUT, frames });
}

/* ── Priority, both ways ──────────────────────────────────────────── */

function priority(): Walkthrough {
  const np = nonPreemptive((i) => PROCS[i].priority);
  const pp = preemptive((i) => PROCS[i].priority);
  const mn = measure(np, "priority np");
  const mp = measure(pp, "priority p");
  const low = IDX.reduce((a, i) => (PROCS[i].priority > PROCS[a].priority ? i : a), 0);
  const ranked = [...IDX].sort((a, b) => PROCS[a].priority - PROCS[b].priority).map((i) => `${PROCS[i].name} (${PROCS[i].priority})`);
  if (mn.waiting[low] !== Math.max(...mn.waiting) || mp.waiting[low] !== Math.max(...mp.waiting)) throw new Error("priority: the lowest priority should wait longest");
  const right = (m: Measures) => (i: number) => `waits ${m.waiting[i]}`;
  return finish({
    title: "Priority scheduling, non-preemptive and preemptive",
    input: INPUT_PRIORITY,
    frames: [
      {
        caption: `Non-preemptive: P1 is alone at 0 and keeps the CPU to ${np[0].to}; then the ready processes go by priority, ${ranked.filter((r) => !r.startsWith(np[0].who)).join(", ")}. Average waiting ${avgOf(mn.waiting)} ms.`,
        items: [label("mode", "non-preemptive", at(16), -28, { anchor: "end", tone: "accent", size: 11.5, weight: 600 }), ...timeline(np, mn.end, { right: right(mn), hotLane: low }), ...key(KEY_Y)],
      },
      {
        caption: `Preemptive: ${pp[1].who} (priority ${PROCS[byName(pp[1].who)].priority}) takes the CPU from P1 the moment it arrives at ${pp[1].from}. Average waiting ${avgOf(mp.waiting)} ms. In both, ${PROCS[low].name}, the lowest priority, waits ${mp.waiting[low]} — with more high-priority work arriving it could wait for ever, which aging prevents.`,
        items: [label("mode", "preemptive", at(16), -28, { anchor: "end", tone: "accent", size: 11.5, weight: 600 }), ...timeline(pp, mp.end, { right: right(mp), hotLane: low }), ...key(KEY_Y)],
      },
    ],
  });
}

/* ── Round Robin with its ready queue ─────────────────────────────── */

function rr(): Walkthrough {
  const Q = 2;
  const run = roundRobin(Q);
  const slots = run.map((r) => r.slot);
  const m = measure(slots, "rr");
  const QY = 62;
  const laneY = QY + 56;
  const frames: Frame[] = [];
  const finished = new Set<string>();
  run.forEach((r, k) => {
    const s = r.slot;
    if (r.done) finished.add(s.who);
    const items = timeline(slots, s.to, { hotSlot: k, hotLane: byName(s.who), laneY, right: (i) => (finished.has(PROCS[i].name) ? `waits ${m.waiting[i]}` : "") });
    items.push(label("ql", "queue", -10, QY + 14, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }));
    r.queue.forEach((name, j) => items.push(box(`q${name}`, j * 46, QY, name, { w: 40, h: 28, size: 12, tone: name === s.who ? "accent" : "plain" })));
    if (!r.queue.length) items.push(label("qe", "empty", 0, QY + 14, { anchor: "start", tone: "faint", size: 11.5 }));
    if (r.queue.length) items.push(label("qf", "front", 20, QY + 40, { anchor: "middle", tone: "faint", size: 10 }));
    let caption: string;
    const span = `${s.from}–${s.to}`;
    if (r.done) caption = `${span}: ${s.who} runs ${s.to - s.from === Q ? "its last quantum" : `its last ${s.to - s.from} ms`} and finishes, so it leaves the queue for good.`;
    else {
      const came = r.arrived.map((n) => (PROCS[byName(n)].arrival === s.to ? `${n}, which arrived at ${s.to} as the quantum expired` : `${n}, which arrived at ${PROCS[byName(n)].arrival} during the slice`));
      caption = `${span}: ${s.who} runs one quantum of ${Q} and goes to the back of the queue${came.length ? `, behind ${came.join(" and ")}` : ""}.`;
    }
    if (k === 0) caption = `Each process runs at most ${Q} ms, then rejoins the queue. ${caption}`;
    if (k === run.length - 1) caption += ` Average waiting ${avgOf(m.waiting)} ms; no process ever waited more than ${(PROCS.length - 1) * Q} ms for its next turn.`;
    frames.push({ caption, items: [...items, ...key(laneY + PROCS.length * LANE_PITCH + 6)] });
  });
  // The (n − 1)·q bound the last caption claims, checked on the run.
  for (const i of IDX) {
    const mine = slots.filter((s) => s.who === PROCS[i].name);
    let ready = PROCS[i].arrival;
    for (const s of mine) {
      if (s.from - ready > (PROCS.length - 1) * Q) throw new Error(`rr: ${PROCS[i].name} waited ${s.from - ready} for a turn`);
      ready = s.to;
    }
  }
  return finish({ title: `Round Robin with a quantum of ${Q}: the queue turns`, input: `${INPUT}, q = ${Q}`, frames });
}

/* ── Average waiting time against the quantum ────────────────────── */

function quantum(): Walkthrough {
  const qs = [1, 2, 3, 4, 5, 6, 7, 8];
  const vals = qs.map((q) => sum(measure(roundRobin(q).map((r) => r.slot), `rr q=${q}`).waiting) / PROCS.length);
  const fc = sum(measure(nonPreemptive((i) => PROCS[i].arrival), "fcfs").waiting) / PROCS.length;
  const maxBurst = Math.max(...PROCS.map((p) => p.burst));
  // From q = the longest burst on, every process finishes in its first turn: Round Robin is FCFS.
  for (let k = 0; k < qs.length; k++) if (qs[k] >= maxBurst && vals[k] !== fc) throw new Error(`quantum: q=${qs[k]} should equal FCFS`);
  const U = 26;
  const W = 34;
  const G = 14;
  const base = 8 * U;
  const best = vals.indexOf(Math.min(...vals));
  const items: Item[] = [];
  vals.forEach((v, k) => {
    const h = v * U;
    const x = k * (W + G);
    items.push({ k: "cell", id: `b${k}`, x, y: base - h, w: W, h, text: num(v), size: 11.5, tone: k === best ? "strong" : qs[k] >= maxBurst ? "muted" : "plain" });
    items.push(label(`q${k}`, String(qs[k]), x + W / 2, base + 12, { tone: "soft", size: 11, mono: true }));
  });
  const right = qs.length * (W + G) - G;
  items.push({ k: "path", id: "ax", pts: [[-6, base], [right + 6, base]], tone: "ink", width: 1.2 });
  items.push({ k: "edge", id: "fc", x1: -6, y1: base - fc * U, x2: right + 6, y2: base - fc * U, tone: "accent", dashed: true });
  items.push(label("fct", `FCFS ${num(fc)}`, right + 10, base - fc * U, { anchor: "start", tone: "accent", size: 11, mono: true }));
  items.push(label("xl", "quantum q (ms)", right / 2, base + 30, { tone: "soft", size: 11, weight: 600 }));
  items.push(label("yl", "average waiting time (ms)", 0, base - 8 * U - 4, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
  const qv = (q: number) => num(vals[qs.indexOf(q)]);
  return finish({
    title: "Round Robin's average waiting time for each quantum",
    input: INPUT,
    frames: [
      {
        caption: `The same four processes under Round Robin with q from 1 to 8. The average does not move smoothly — ${qv(2)} at q = 2, ${qv(3)} at q = 3, ${qv(4)} at q = 4 — and from q = ${maxBurst}, the longest burst, every process finishes in one turn and Round Robin is exactly FCFS.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  fcfs,
  sjf,
  srtf,
  priority,
  "round-robin": rr,
  quantum,
};
