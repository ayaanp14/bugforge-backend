import { finish, link, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, type Pt } from "../lesson-figures/kit.js";
import { boxRim, lines } from "./kit.js";

/**
 * Deadlocks in Operating Systems: the note's figures
 * (content/notes/operating-systems/deadlocks.md places each with
 * "@figure <name>").
 *
 *  - rag-cycle: a resource-allocation graph whose cycle is found by a DFS,
 *    then collapsed into the wait-for graph derived from its edges;
 *  - rag-multi: the multi-instance graph with a cycle, reduced by the
 *    detection algorithm (Allocation and Request read off the edges) until
 *    every process has finished — a cycle, and still no deadlock;
 *  - lock-order: two threads stepped through their lock calls, first in
 *    opposite orders (they block on each other: a wait-for cycle), then in
 *    one global order (one waits holding nothing, and both finish);
 *  - bankers: the safety algorithm run on the note's Allocation/Max/
 *    Available, one process chosen per frame;
 *  - bankers-requests: the resource-request algorithm on the note's two
 *    requests — pretend to grant, rerun the safety check, grant or deny.
 */

/* ── Resource-allocation graphs ───────────────────────────────────── */

const PR = 20;
const DOT = 4.5;
const RW = 64;
const RH = 30;

interface Rag {
  procs: Record<string, Pt>;
  /** Each resource: its centre and one entry per instance — the process holding it, or null. */
  res: Record<string, { at: Pt; held: Array<string | null>; above: boolean }>;
  /** Request edges: process → resource. */
  wants: Array<[string, string]>;
}

const dotAt = (r: { at: Pt; held: unknown[] }, k: number): Pt => ({ x: r.at.x + (k - (r.held.length - 1) / 2) * 20, y: r.at.y });

/** Wait-for edges: P waits for Q when P requests a resource Q holds. */
function waitFor(g: Rag): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [p, r] of g.wants) for (const q of g.res[r].held) if (q && q !== p && !out.some(([a, b]) => a === p && b === q)) out.push([p, q]);
  return out;
}

/** A cycle in a directed graph given as edges, by DFS; the nodes in order, or null. */
function findCycle(nodes: readonly string[], edges: ReadonlyArray<readonly [string, string]>): string[] | null {
  const state = new Map<string, number>();
  const stack: string[] = [];
  const visit = (n: string): string[] | null => {
    state.set(n, 1);
    stack.push(n);
    for (const [a, b] of edges) {
      if (a !== n) continue;
      if (state.get(b) === 1) return stack.slice(stack.indexOf(b));
      if (!state.get(b)) {
        const c = visit(b);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(n, 2);
    return null;
  };
  for (const n of nodes) if (!state.get(n)) {
    const c = visit(n);
    if (c) return c;
  }
  return null;
}

/** The graph as items: resources as boxes with one dot per instance, processes as circles, request and assignment edges. */
function drawRag(g: Rag, o: { hotEdges?: Set<string>; doneProcs?: Set<string>; hotProcs?: Set<string> } = {}): Item[] {
  const items: Item[] = [];
  const hot = o.hotEdges ?? new Set<string>();
  const done = o.doneProcs ?? new Set<string>();
  for (const [name, r] of Object.entries(g.res)) {
    items.push({ k: "cell", id: `r${name}`, x: r.at.x - RW / 2, y: r.at.y - RH / 2, w: RW, h: RH, text: "", tone: "plain" });
    items.push(label(`r${name}-t`, name, r.at.x, r.at.y + (r.above ? -RH / 2 - 11 : RH / 2 + 11), { tone: "ink", size: 12, weight: 600, mono: true }));
  }
  for (const [p, r] of g.wants) {
    const c = g.res[r].at;
    const end = boxRim(c, RW, RH, g.procs[p]);
    const id = `q${p}-${r}`;
    items.push(link(id, g.procs[p], end, PR, { arrow: true, tone: hot.has(id) ? "accent" : "ink", rb: 0 }));
  }
  for (const [name, r] of Object.entries(g.res)) {
    r.held.forEach((p, k) => {
      if (!p) return;
      const id = `a${name}${k}-${p}`;
      items.push(link(id, dotAt(r, k), g.procs[p], DOT, { arrow: true, tone: hot.has(id) ? "accent" : "ink", rb: PR }));
    });
  }
  for (const [name, r] of Object.entries(g.res)) r.held.forEach((p, k) => items.push({ k: "node", id: `d${name}${k}`, ...dotAt(r, k), r: DOT, text: "", tone: p ? "strong" : "plain" }));
  for (const [p, at] of Object.entries(g.procs)) items.push({ k: "node", id: `p${p}`, x: at.x, y: at.y, r: PR, text: p, tone: done.has(p) ? "muted" : o.hotProcs?.has(p) ? "accent" : "plain", size: 12 });
  return items;
}

/** A process cycle written with the resources between: P1 → R1 → P3 → R2 → P1. */
function cycleText(g: Rag, cycle: readonly string[]): string {
  const parts = cycle.map((p, k) => {
    const q = cycle[(k + 1) % cycle.length];
    return `${p} → ${g.wants.find(([a, r]) => a === p && g.res[r].held.includes(q))![1]}`;
  });
  return `${parts.join(" → ")} → ${cycle[0]}`;
}

/** The edge ids along a process cycle P → R → Q → … in a graph. */
function cycleEdges(g: Rag, cycle: readonly string[]): Set<string> {
  const ids = new Set<string>();
  cycle.forEach((p, k) => {
    const q = cycle[(k + 1) % cycle.length];
    const [, r] = g.wants.find(([a, r2]) => a === p && g.res[r2].held.includes(q))!;
    ids.add(`q${p}-${r}`);
    ids.add(`a${r}${g.res[r].held.indexOf(q)}-${q}`);
  });
  return ids;
}

const ragKey = (y: number): Item[] => [
  label("k1", "P → R: P waits for R", 0, y, { anchor: "start", size: 11, mono: true }),
  label("k2", "R → P: R is held by P", 190, y, { anchor: "start", size: 11, mono: true }),
];

function ragCycle(): Walkthrough {
  const g: Rag = {
    procs: { P1: { x: 0, y: 0 }, P2: { x: 200, y: 130 } },
    res: { R1: { at: { x: 200, y: 0 }, held: ["P2"], above: true }, R2: { at: { x: 0, y: 130 }, held: ["P1"], above: false } },
    wants: [
      ["P1", "R1"],
      ["P2", "R2"],
    ],
  };
  const wf = waitFor(g);
  const cycle = findCycle(Object.keys(g.procs), wf);
  if (!cycle) throw new Error("rag-cycle: expected a cycle");
  const singles = Object.values(g.res).every((r) => r.held.length === 1);
  if (!singles) throw new Error("rag-cycle: every resource should have one instance");
  const ring = [...cycle, cycle[0]].join(" → ");
  // The wait-for graph: the same processes where they stood, the resource boxes gone, an edge for each wait.
  const wfItems: Item[] = wf.map(([a, b]) => link(`w${a}-${b}`, g.procs[a], g.procs[b], PR, { arrow: true, tone: "error", bow: 30 }));
  for (const [p, at] of Object.entries(g.procs)) wfItems.push({ k: "node", id: `p${p}`, x: at.x, y: at.y, r: PR, text: p, tone: "error", size: 12 });
  wfItems.push(label("wft", "wait-for graph", 150, 30, { tone: "soft", size: 11.5, weight: 600 }));
  return finish({
    title: "A cycle of single-instance resources is a deadlock",
    input: "",
    frames: [
      {
        caption: `P1 holds R2 and waits for R1; P2 holds R1 and waits for R2. Following the edges gives the cycle ${cycleText(g, cycle)}, and each resource has one instance, so both processes wait for ever.`,
        items: [...drawRag(g, { hotEdges: cycleEdges(g, cycle), hotProcs: new Set(cycle) }), ...ragKey(200)],
      },
      {
        caption: `With single instances, drop the resource boxes: P waits for Q whenever P requests something Q holds. The wait-for graph has the cycle ${ring}, and a cycle there means deadlock, no more and no less.`,
        items: [...wfItems, label("k3", "P → Q: P waits for a resource Q holds", 0, 200, { anchor: "start", size: 11, mono: true })],
      },
    ],
  });
}

/** The detection algorithm on a graph: Allocation and Request per process, read off the edges. */
function ragMulti(): Walkthrough {
  const g: Rag = {
    procs: { P1: { x: 0, y: 110 }, P2: { x: -10, y: 0 }, P3: { x: 300, y: 110 }, P4: { x: 310, y: 220 } },
    res: { R1: { at: { x: 150, y: 10 }, held: ["P2", "P3"], above: true }, R2: { at: { x: 150, y: 210 }, held: ["P1", "P4"], above: false } },
    wants: [
      ["P1", "R1"],
      ["P3", "R2"],
    ],
  };
  const RES = Object.keys(g.res);
  const PROCS = Object.keys(g.procs);
  const alloc = (p: string) => RES.map((r) => g.res[r].held.filter((q) => q === p).length);
  const request = (p: string) => RES.map((r) => g.wants.filter(([a, b]) => a === p && b === r).length);
  const cycle = findCycle(PROCS, waitFor(g));
  if (!cycle) throw new Error("rag-multi: expected a cycle");
  const hot = cycleEdges(g, cycle);
  const work = RES.map((r) => g.res[r].held.filter((q) => !q).length);
  const done = new Set<string>();
  const frames: Frame[] = [];
  const show = (v: readonly number[]) => RES.map((r, j) => `${r} ${v[j]}`).join(", ");
  const avail = (y: number) => label("av", `free: ${show(work)}`, 150, y, { tone: "accent", size: 12, mono: true, weight: 600 });
  frames.push({
    caption: `The cycle ${cycleText(g, cycle)} is there, but R1 and R2 have two instances each, and P2 and P4 hold the others while waiting for nothing. No instance is free, so the detection algorithm looks for a process whose request can be met.`,
    items: [...drawRag(g, { hotEdges: hot }), avail(272), ...ragKey(296)],
  });
  while (done.size < PROCS.length) {
    const p = PROCS.find((q) => !done.has(q) && request(q).every((x, j) => x <= work[j]));
    if (!p) throw new Error("rag-multi: the graph should reduce completely");
    const asked = request(p);
    const freed = alloc(p);
    freed.forEach((x, j) => (work[j] += x));
    done.add(p);
    // The finished process's edges go; the instances it held become free dots.
    for (const r of RES) g.res[r].held = g.res[r].held.map((q) => (q === p ? null : q));
    g.wants = g.wants.filter(([a]) => a !== p);
    const got = asked.some((x) => x) ? `its request for ${RES.filter((_, j) => asked[j]).join(" and ")} can be met, so it` : "it requests nothing, so it";
    const last = done.size === PROCS.length;
    frames.push({
      caption: `${p}: ${got} can run to the end and release ${RES.filter((_, j) => freed[j]).map((r) => `its ${r}`).join(" and ")}.${last ? ` Every process finished, so there is no deadlock: with several instances a cycle is necessary but not sufficient.` : ""}`,
      items: [...drawRag(g, { doneProcs: done, hotProcs: new Set([p]) }), avail(272), ...ragKey(296)],
    });
  }
  return finish({ title: "A cycle without a deadlock: resources with two instances", input: "", frames });
}

/* ── Lock ordering ────────────────────────────────────────────────── */

type Op = string;
interface Th {
  name: string;
  ops: Op[];
  pc: number;
  /** It asked for a lock another thread holds, and is waiting for it. */
  blocked?: boolean;
}

/** Runs one step of thread t: a lock is taken if free, else the thread blocks there; returns what happened. */
function step(t: Th, owner: Map<string, string | null>): "took" | "blocked" | "released" | "worked" | "done" {
  const op = t.ops[t.pc];
  if (op === undefined) return "done";
  const m = /^(lock|unlock)\((\w)\)$/.exec(op);
  if (m && m[1] === "lock") {
    t.blocked = Boolean(owner.get(m[2]));
    if (t.blocked) return "blocked";
    owner.set(m[2], t.name);
    t.pc++;
    return "took";
  }
  if (m && m[1] === "unlock") {
    if (owner.get(m[2]) !== t.name) throw new Error(`lock-order: ${t.name} unlocks ${m[2]} it does not hold`);
    owner.set(m[2], null);
    t.pc++;
    return "released";
  }
  t.pc++;
  return "worked";
}

function lockOrder(): Walkthrough {
  const LX = 300;
  const frames: Frame[] = [];
  const draw = (ths: Th[], owner: Map<string, string | null>, o: { heading: string; dead?: boolean }): Item[] => {
    const items: Item[] = [label("h", o.heading, LX / 2 + 50, -34, { tone: "accent", size: 12, weight: 600 })];
    const waits: Item[] = [];
    ths.forEach((t, k) => {
      const x = k ? LX : 0;
      items.push(box(`t${k}`, x, 0, t.name, { w: 100, h: 28, size: 12, tone: o.dead ? "error" : t.pc >= t.ops.length ? "muted" : "plain" }));
      items.push(...lines(`c${k}-`, t.ops, x + 18, 50, { size: 12, gap: 20, tone: (i) => (i < t.pc ? "faint" : i === t.pc ? "accent" : "ink") }));
      if (t.pc < t.ops.length) items.push({ k: "text", id: `pc${k}`, x: x + 4, y: 50 + t.pc * 20, text: "▸", tone: o.dead ? "error" : "accent", size: 12, mono: true });
      const op = t.ops[t.pc];
      const m = op ? /^lock\((\w)\)$/.exec(op) : null;
      if (m && t.blocked) waits.push(arrow(`wt${k}`, { x: x + (k ? -6 : 106), y: 50 + t.pc * 20 }, { x: LX / 2 + 50 + (k ? 26 : -26), y: m[1] === "A" ? 64 : 112 }, { tone: o.dead ? "error" : "accent", dashed: true }));
    });
    ["A", "B"].forEach((l, j) => {
      const who = owner.get(l);
      items.push(box(`l${l}`, LX / 2 + 24, 50 + j * 48, `lock ${l}`, { w: 52, h: 28, size: 11.5, tone: who ? "accent" : "plain" }));
      items.push(label(`lo${l}`, who ? `held by ${who}` : "free", LX / 2 + 50, 50 + j * 48 + 38, { tone: who ? "accent" : "faint", size: 10.5 }));
    });
    return [...items, ...waits];
  };
  const run = (orders: [Op[], Op[]], schedule: number[]) => {
    const ths: Th[] = [
      { name: "Thread 1", ops: orders[0], pc: 0 },
      { name: "Thread 2", ops: orders[1], pc: 0 },
    ];
    const owner = new Map<string, string | null>([
      ["A", null],
      ["B", null],
    ]);
    const log: string[] = [];
    for (const k of schedule) log.push(step(ths[k], owner));
    return { ths, owner, log };
  };
  const BODY = ["work()", "unlock(B)", "unlock(A)"];
  const opposite: [Op[], Op[]] = [["lock(A)", "lock(B)", ...BODY], ["lock(B)", "lock(A)", "work()", "unlock(A)", "unlock(B)"]];
  const ordered: [Op[], Op[]] = [["lock(A)", "lock(B)", ...BODY], ["lock(A)", "lock(B)", ...BODY]];
  // Opposite orders: each takes its first lock, then each asks for the other's.
  const a = run(opposite, [0, 1]);
  frames.push({ caption: "Thread 1 locks A and thread 2 locks B, each the first lock its code asks for. Nothing has gone wrong yet: both locks were free.", items: draw(a.ths, a.owner, { heading: "opposite orders" }) });
  const b = run(opposite, [0, 1, 0, 1]);
  const blocked = b.log.slice(2).every((x) => x === "blocked");
  const dead = findCycle(["Thread 1", "Thread 2"], b.ths.map((t) => [t.name, b.owner.get(/\((\w)\)/.exec(t.ops[t.pc])![1])!] as [string, string]));
  if (!blocked || !dead) throw new Error("lock-order: opposite orders should deadlock");
  frames.push({ caption: "Thread 1 now asks for B, held by thread 2, and thread 2 asks for A, held by thread 1. Each waits for the other: a cycle of two, and neither can ever continue.", items: draw(b.ths, b.owner, { heading: "opposite orders", dead: true }) });
  // One global order: A before B for everyone.
  const c = run(ordered, [0, 1]);
  if (c.log[1] !== "blocked") throw new Error("lock-order: thread 2 should wait for A");
  frames.push({ caption: "Now both lock A before B. Thread 1 gets A; thread 2 asks for A and waits — but it holds nothing, so no one can be waiting for it and no cycle can close.", items: draw(c.ths, c.owner, { heading: "one order: A, then B" }) });
  const d = run(ordered, [0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
  if (!d.ths.every((t) => t.pc === t.ops.length)) throw new Error("lock-order: both threads should finish");
  frames.push({ caption: "Thread 1 takes B, works and unlocks both; thread 2 then gets A and B in turn and finishes too. Locking in one global order removes circular wait, so this pair can never deadlock.", items: draw(d.ths, d.owner, { heading: "one order: A, then B" }) });
  return finish({ title: "Two threads, two locks: opposite orders against one order", input: "", frames });
}

/* ── Banker's algorithm ───────────────────────────────────────────── */

const MAX = [
  [4, 3, 2],
  [3, 2, 2],
  [3, 4, 3],
  [1, 3, 4],
  [5, 2, 3],
];
const ALLOCATION = [
  [1, 1, 0],
  [2, 0, 1],
  [1, 2, 1],
  [0, 1, 2],
  [2, 0, 0],
];
const TOTAL = [8, 6, 7];
const N = MAX.length;
const M = TOTAL.length;
const ABC = ["A", "B", "C"];
const vec = (v: readonly number[]) => v.join(" ");
const fits = (a: readonly number[], b: readonly number[]) => a.every((x, j) => x <= b[j]);
const needOf = (alloc: number[][]) => alloc.map((row, i) => row.map((x, j) => MAX[i][j] - x));
const availableOf = (alloc: number[][]) => TOTAL.map((t, j) => t - alloc.reduce((s, row) => s + row[j], 0));

interface SafetyStep {
  work: number[];
  /** Processes tried and rejected before the pick, lowest-numbered first. */
  rejected: number[];
  pick: number;
  after: number[];
}

/** The safety algorithm, picking the lowest-numbered unfinished process whose Need fits in Work; null steps end in an unsafe state. */
function safety(alloc: number[][], avail: number[]): { steps: SafetyStep[]; safe: boolean; stuck: number[] } {
  const need = needOf(alloc);
  const work = [...avail];
  const fin = new Array<boolean>(N).fill(false);
  const steps: SafetyStep[] = [];
  for (;;) {
    const rejected: number[] = [];
    let pick = -1;
    for (let i = 0; i < N && pick < 0; i++) {
      if (fin[i]) continue;
      if (fits(need[i], work)) pick = i;
      else rejected.push(i);
    }
    if (pick < 0) return { steps, safe: fin.every(Boolean), stuck: rejected };
    const before = [...work];
    for (let j = 0; j < M; j++) work[j] += alloc[pick][j];
    fin[pick] = true;
    steps.push({ work: before, rejected, pick, after: [...work] });
  }
}

const CW = 28;
const CH = 24;
const CG = 3;
const GROUP = 3 * (CW + CG) + 18;

/** The Allocation and Need columns, a row per process, with each process's state at the right. */
function matrix(alloc: number[][], o: { tone?: (i: number, group: "a" | "n", j: number) => Tone | undefined; right?: (i: number) => string; rightTone?: (i: number) => "accent" | "soft" | "faint" | "error" | "ink"; y?: number }): Item[] {
  const y0 = o.y ?? 0;
  const need = needOf(alloc);
  const items: Item[] = [];
  const head = (id: string, t: string, x: number) => items.push(label(id, t, x, y0 - 30, { tone: "soft", size: 11, weight: 600 }));
  head("ha", "Allocation", 1.5 * (CW + CG) - CG / 2);
  head("hn", "Need", GROUP + 1.5 * (CW + CG) - CG / 2);
  ABC.forEach((r, j) => {
    items.push(label(`ca${j}`, r, j * (CW + CG) + CW / 2, y0 - 12, { tone: "faint", size: 10.5, mono: true }));
    items.push(label(`cn${j}`, r, GROUP + j * (CW + CG) + CW / 2, y0 - 12, { tone: "faint", size: 10.5, mono: true }));
  });
  for (let i = 0; i < N; i++) {
    const y = y0 + i * (CH + CG);
    items.push(label(`pl${i}`, `P${i}`, -10, y + CH / 2, { anchor: "end", tone: "ink", size: 12, mono: true, weight: 600 }));
    for (let j = 0; j < M; j++) {
      items.push(box(`a${i}-${j}`, j * (CW + CG), y, alloc[i][j], { w: CW, h: CH, size: 12, tone: o.tone?.(i, "a", j) ?? "plain" }));
      items.push(box(`n${i}-${j}`, GROUP + j * (CW + CG), y, need[i][j], { w: CW, h: CH, size: 12, tone: o.tone?.(i, "n", j) ?? "plain" }));
    }
    const r = o.right?.(i);
    if (r) items.push(label(`st${i}`, r, 2 * GROUP - 4, y + CH / 2, { anchor: "start", tone: o.rightTone?.(i) ?? "soft", size: 11.5 }));
  }
  return items;
}

/** A labelled vector: Work, Available. */
function vector(id: string, name: string, v: readonly number[], y: number, tone: Tone = "accent"): Item[] {
  return [label(`${id}l`, name, -10, y + CH / 2, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }), ...v.map((x, j) => box(`${id}${j}`, GROUP + j * (CW + CG), y, x, { w: CW, h: CH, size: 12, tone }))];
}

const VEC_Y = N * (CH + CG) + 16;
const SEQ_Y = VEC_Y + CH + 30;

function sequenceRow(order: readonly number[], o: { strong?: boolean } = {}): Item[] {
  const items: Item[] = [label("sql", "order", -10, SEQ_Y + 13, { anchor: "end", tone: "soft", size: 11.5, weight: 600 })];
  order.forEach((p, k) => items.push(box(`sq${p}`, k * 44, SEQ_Y, `P${p}`, { w: 38, h: 26, size: 12, tone: o.strong ? "strong" : "plain" })));
  if (!order.length) items.push(label("sqe", "none yet", 0, SEQ_Y + 13, { anchor: "start", tone: "faint", size: 11.5 }));
  return items;
}

function bankers(): Walkthrough {
  const avail = availableOf(ALLOCATION);
  const run = safety(ALLOCATION, avail);
  if (!run.safe) throw new Error("bankers: the note's state should be safe");
  const order = run.steps.map((s) => s.pick);
  const last = run.steps[run.steps.length - 1].after;
  if (vec(last) !== vec(TOTAL)) throw new Error(`bankers: final Work ${vec(last)} should equal the total ${vec(TOTAL)}`);
  const need = needOf(ALLOCATION);
  const frames: Frame[] = [];
  const doneBefore = (k: number) => new Set(order.slice(0, k));
  frames.push({
    caption: `Need = Max − Allocation, row by row, and Work starts as Available = total (${vec(TOTAL)}) − allocated = (${vec(avail)}). The algorithm repeatedly looks for an unfinished process whose whole Need fits in Work.`,
    items: [...matrix(ALLOCATION, {}), ...vector("w", "Work", avail, VEC_Y), ...sequenceRow([])],
  });
  run.steps.forEach((s, k) => {
    const done = doneBefore(k);
    const rej = new Set(s.rejected);
    const why = s.rejected.map((i) => {
      const j = need[i].findIndex((x, jj) => x > s.work[jj]);
      return `P${i} needs ${need[i][j]} of ${ABC[j]} but Work has ${s.work[j]}`;
    });
    const final = k === run.steps.length - 1;
    frames.push({
      caption: `${why.length ? `${why.join("; ")}. ` : ""}P${s.pick}'s Need (${vec(need[s.pick])}) fits in Work (${vec(s.work)}): it can finish and release its Allocation, so Work becomes (${vec(s.after)}).${final ? ` Every process finished: the state is safe, and Work is back to the total.` : ""}`,
      items: [
        ...matrix(ALLOCATION, {
          tone: (i, g, j) => (done.has(i) ? "muted" : i === s.pick ? (g === "n" ? "accent" : "strong") : rej.has(i) && g === "n" && need[i][j] > s.work[j] ? "error" : undefined),
          right: (i) => (done.has(i) ? "done" : i === s.pick ? "fits" : rej.has(i) ? "too big" : ""),
          rightTone: (i) => (i === s.pick ? "accent" : rej.has(i) ? "error" : "faint"),
        }),
        ...vector("w", "Work", s.after, VEC_Y),
        ...sequenceRow(order.slice(0, k + 1), { strong: final }),
      ],
    });
  });
  return finish({ title: "Banker's algorithm: finding a safe sequence", input: `Available = (${vec(avail)}), total = (${vec(TOTAL)})`, frames });
}

function bankersRequests(): Walkthrough {
  const avail0 = availableOf(ALLOCATION);
  const frames: Frame[] = [];
  const tryRequest = (p: number, req: number[]) => {
    const need0 = needOf(ALLOCATION);
    if (!fits(req, need0[p])) throw new Error("bankers-requests: request above Need");
    if (!fits(req, avail0)) throw new Error("bankers-requests: request above Available");
    const alloc = ALLOCATION.map((row, i) => (i === p ? row.map((x, j) => x + req[j]) : [...row]));
    const avail = avail0.map((x, j) => x - req[j]);
    return { alloc, avail, ...safety(alloc, avail) };
  };
  const g = tryRequest(4, [1, 0, 1]);
  if (!g.safe) throw new Error("bankers-requests: P4's request should be granted");
  const d = tryRequest(0, [1, 2, 0]);
  if (d.safe || d.steps.length) throw new Error("bankers-requests: P0's request should leave no process able to finish");
  const gNeed = needOf(g.alloc);
  frames.push({
    caption: `P4 asks for (1 0 1): within its Need and within Available. Pretend to grant it — Available becomes (${vec(g.avail)}), P4's Need (${vec(gNeed[4])}) — and rerun the safety check: ${g.steps.map((s) => `P${s.pick}`).join(", ")} all finish, so the request is granted.`,
    items: [
      label("rq", "P4 requests (1 0 1)", GROUP / 2 + 60, -56, { tone: "accent", size: 12, weight: 600 }),
      ...matrix(g.alloc, { tone: (i) => (i === 4 ? "accent" : undefined), right: (i) => `${g.steps.findIndex((s) => s.pick === i) + 1}${["st", "nd", "rd"][g.steps.findIndex((s) => s.pick === i)] ?? "th"}`, rightTone: () => "accent" }),
      ...vector("w", "Available", g.avail, VEC_Y),
      ...sequenceRow(g.steps.map((s) => s.pick), { strong: true }),
    ],
  });
  const dNeed = needOf(d.alloc);
  const blocker = (i: number) => dNeed[i].findIndex((x, j) => x > d.avail[j]);
  frames.push({
    caption: `P0 asks for (1 2 0), also within its Need and Available. Pretend to grant it: Available becomes (${vec(d.avail)}). Now no Need fits — P0 wants ${dNeed[0][blocker(0)]} of ${ABC[blocker(0)]} with ${d.avail[blocker(0)]} free, and every other process wants B, which has none — so the state would be unsafe and P0 must wait.`,
    items: [
      label("rq", "P0 requests (1 2 0)", GROUP / 2 + 60, -56, { tone: "error", size: 12, weight: 600 }),
      ...matrix(d.alloc, { tone: (i, gr, j) => (gr === "n" && dNeed[i][j] > d.avail[j] ? "error" : i === 0 ? "accent" : undefined), right: () => "too big", rightTone: () => "error" }),
      ...vector("w", "Available", d.avail, VEC_Y),
      ...sequenceRow([]),
    ],
  });
  for (let i = 1; i < N; i++) if (!(dNeed[i][1] > d.avail[1])) throw new Error("bankers-requests: the caption says every other process is short of B");
  return finish({ title: "Banker's algorithm: two requests, one granted and one refused", input: `Available = (${vec(avail0)}) before either request`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "rag-cycle": ragCycle,
  "rag-multi": ragMulti,
  "lock-order": lockOrder,
  bankers,
  "bankers-requests": bankersRequests,
};
