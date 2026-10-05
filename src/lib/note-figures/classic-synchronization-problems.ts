import { finish, link, ring, round, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, type Pt } from "../lesson-figures/kit.js";

/**
 * Classic Synchronization Problems: the note's figures
 * (content/notes/operating-systems/classic-synchronization-problems.md
 * places each with "@figure <name>").
 *
 * One small interpreter runs every figure: blocking semaphores (a value
 * and a FIFO queue; wait() blocks below zero, signal() wakes the first
 * waiter) and processes that execute the note's pseudocode op by op.
 *
 *  - bounded-buffer: the producer and consumer on a two-slot circular
 *    buffer, run until the producer blocks on a full buffer and is woken;
 *  - wrong-order: the same code with the producer's two waits swapped,
 *    run from a full buffer until both processes are blocked;
 *  - readers-writers: four readers and a writer on a clock, run through
 *    the first (readers-first) solution and the fair one with `queue`;
 *  - dining-philosophers: five philosophers who all reach at once, first
 *    left-then-right (a wait-for cycle), then lower-numbered first.
 */

/* ── The interpreter ──────────────────────────────────────────────── */

interface Sem {
  value: number;
  queue: string[];
}
type Sems = Record<string, Sem>;

type Op =
  | { wait: string }
  | { signal: string }
  | { insert: string }
  | { remove: true }
  | { work: number; what: string }
  /** read_count++ under mutex; the first reader then waits on `sem`. */
  | { firstIn: string }
  /** read_count−− under mutex; the last reader then signals `sem`. */
  | { lastOut: string };

interface Proc {
  name: string;
  ops: Op[];
  pc: number;
  blocked: boolean;
  /** Time units left in the current work op. */
  left: number;
  arrival: number;
  started: number;
  ended: number;
}

const proc = (name: string, ops: Op[], arrival = 0): Proc => ({ name, ops, pc: 0, blocked: false, left: 0, arrival, started: -1, ended: -1 });

class World {
  sems: Sems;
  buffer: Array<string | null>;
  inIx = 0;
  outIx = 0;
  readCount = 0;
  procs: Proc[];
  log: string[] = [];
  constructor(sems: Record<string, number>, procs: Proc[], slots = 0) {
    this.sems = Object.fromEntries(Object.entries(sems).map(([k, v]) => [k, { value: v, queue: [] }]));
    this.buffer = new Array<string | null>(slots).fill(null);
    this.procs = procs;
  }
  private wait(p: Proc, s: string): boolean {
    const sem = this.sems[s];
    sem.value--;
    if (sem.value < 0) {
      sem.queue.push(p.name);
      p.blocked = true;
      this.log.push(`${p.name} blocks on ${s}`);
      return false;
    }
    return true;
  }
  private signal(s: string) {
    const sem = this.sems[s];
    sem.value++;
    if (sem.value <= 0) {
      const name = sem.queue.shift();
      const q = this.procs.find((x) => x.name === name);
      if (!q) throw new Error(`signal(${s}): no process waiting`);
      q.blocked = false;
      this.log.push(`${q.name} wakes`);
    }
  }
  /** Execute p's instantaneous ops until it blocks, starts a work op, finishes, or `limit` ops have run. */
  run(p: Proc, t = 0, limit = Infinity): number {
    let n = 0;
    while (!p.blocked && p.left === 0 && p.pc < p.ops.length && n < limit) {
      const op = p.ops[p.pc++];
      n++;
      if ("wait" in op) this.wait(p, op.wait);
      else if ("signal" in op) this.signal(op.signal);
      else if ("insert" in op) {
        if (this.buffer[this.inIx] !== null) throw new Error("bounded buffer: insert into a full slot");
        this.buffer[this.inIx] = op.insert;
        this.inIx = (this.inIx + 1) % this.buffer.length;
      } else if ("remove" in op) {
        if (this.buffer[this.outIx] === null) throw new Error("bounded buffer: remove from an empty slot");
        this.buffer[this.outIx] = null;
        this.outIx = (this.outIx + 1) % this.buffer.length;
      } else if ("work" in op) {
        p.left = op.work;
        if (p.started < 0) p.started = t;
      } else if ("firstIn" in op) {
        this.readCount++;
        if (this.readCount === 1) this.wait(p, op.firstIn);
      } else if ("lastOut" in op) {
        this.readCount--;
        if (this.readCount === 0) this.signal(op.lastOut);
      }
    }
    if (p.pc >= p.ops.length && !p.blocked && p.left === 0 && p.ended < 0) p.ended = t;
    return n;
  }
}

const signed = (v: number) => (v < 0 ? `−${-v}` : String(v));

/* ── Bounded buffer ───────────────────────────────────────────────── */

const producerOps = (items: string[], swapped = false): Op[] =>
  items.flatMap((x): Op[] => [...(swapped ? [{ wait: "mutex" }, { wait: "empty" }] : [{ wait: "empty" }, { wait: "mutex" }]), { insert: x }, { signal: "mutex" }, { signal: "full" }]);
const consumerOps = (n: number): Op[] => Array.from({ length: n }, (): Op[] => [{ wait: "full" }, { wait: "mutex" }, { remove: true }, { signal: "mutex" }, { signal: "empty" }]).flat();

function drawBuffer(w: World, o: { hot?: string; dead?: boolean; pending?: Record<string, string> } = {}): Item[] {
  const items: Item[] = [];
  const S = 46;
  // The buffer: two slots with the in and out indices.
  items.push(label("bl", "buffer", -10, S / 2, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }));
  w.buffer.forEach((x, k) => {
    items.push(box(`b${k}`, k * (S + 6), 0, x ?? "", { w: S, h: S, size: 15, tone: x ? "plain" : "muted" }));
    items.push(label(`bi${k}`, String(k), k * (S + 6) + S / 2, S + 10, { tone: "faint", size: 10, mono: true }));
  });
  const ptrs: Array<[string, number]> = [
    ["in", w.inIx],
    ["out", w.outIx],
  ];
  ptrs.forEach(([n, ix]) => items.push({ k: "ptr", id: `ptr${n}`, x: ix * (S + 6) + S / 2 + (n === "in" ? -10 : 10), y: -4, label: n, tone: n === "in" ? "accent" : "ink", up: false }));
  // The semaphores.
  ["empty", "full", "mutex"].forEach((n, k) => {
    const sem = w.sems[n];
    const x = 150 + k * 92;
    items.push(label(`sl${n}`, n, x + 26, -12, { tone: "soft", size: 11.5, mono: true, weight: 600 }));
    items.push(box(`s${n}`, x, 0, signed(sem.value), { w: 52, h: S, size: 16, tone: sem.queue.length ? (o.dead ? "error" : "accent") : "plain" }));
    sem.queue.forEach((q, j) => items.push(label(`sq${n}${j}`, `${q} waits`, x + 26, S + 12 + j * 14, { tone: o.dead ? "error" : "accent", size: 10.5, weight: 600 })));
  });
  // The two processes and what they are doing.
  w.procs.forEach((p, k) => {
    const x = k * 236;
    const y = 100;
    const tone: Tone = p.blocked ? (o.dead ? "error" : "accent") : p.name === o.hot ? "accent" : "plain";
    items.push(box(`p${k}`, x, y, p.name, { w: 84, h: 28, size: 12, tone }));
    const st = o.pending?.[p.name] ?? (p.blocked ? "blocked" : "");
    if (st) items.push(label(`ps${k}`, st, x, y + 42, { anchor: "start", tone: p.blocked ? (o.dead ? "error" : "accent") : "soft", size: 11 }));
  });
  return items;
}

function boundedBuffer(): Walkthrough {
  const N = 2;
  const prod = proc("producer", producerOps(["A", "B", "C"]));
  const cons = proc("consumer", consumerOps(1));
  const w = new World({ mutex: 1, empty: N, full: 0 }, [prod, cons], N);
  const OPS = 5;
  const frames: Frame[] = [];
  const check = () => {
    const filled = w.buffer.filter((x) => x !== null).length;
    // Between whole iterations, empty + full = n, and full counts the filled slots (a blocked waiter makes empty negative).
    if (Math.max(0, w.sems.full.value) !== filled) throw new Error(`bounded-buffer: full=${w.sems.full.value} but ${filled} slots filled`);
  };
  frames.push({ caption: `A ${N === 2 ? "two" : N}-slot buffer with nothing in it: empty = ${N} free slots, full = 0 filled slots, mutex = 1. The producer will make A, B and C; the consumer will take one item.`, items: drawBuffer(w) });
  for (const x of ["A", "B"]) {
    w.run(prod, 0, OPS);
    check();
    frames.push({ caption: `The producer waits on empty (now ${w.sems.empty.value}), takes the mutex, puts ${x} in slot ${(w.inIx + N - 1) % N}, releases the mutex and signals full (now ${w.sems.full.value}).`, items: drawBuffer(w, { hot: "producer" }) });
  }
  w.run(prod, 0, 1);
  if (!prod.blocked) throw new Error("bounded-buffer: the producer should block on a full buffer");
  frames.push({ caption: `For C the producer calls wait(empty): the value goes to ${signed(w.sems.empty.value)}, so it blocks in empty's queue. It holds nothing else — it has not touched the mutex.`, items: drawBuffer(w, { pending: { producer: "blocked on empty" } }) });
  w.run(cons, 0, OPS);
  if (prod.blocked) throw new Error("bounded-buffer: the consumer's signal should wake the producer");
  frames.push({ caption: `The consumer waits on full (${w.sems.full.value} left), removes A from slot 0, and its signal(empty) raises empty to ${w.sems.empty.value} — not above zero, so it wakes the producer, handing it the freed slot.`, items: drawBuffer(w, { hot: "consumer", pending: { producer: "woken" } }) });
  w.run(prod, 0, OPS - 1);
  check();
  frames.push({ caption: `The producer, already past wait(empty), takes the mutex, puts C in slot ${(w.inIx + N - 1) % N} — the buffer wraps round — and signals full. Now empty = ${w.sems.empty.value}, full = ${w.sems.full.value}: the buffer is full again with B and C.`, items: drawBuffer(w, { hot: "producer" }) });
  return finish({ title: "Producer and consumer on a two-slot buffer", input: "n = 2; the producer makes A, B, C; the consumer takes one", frames });
}

function wrongOrder(): Walkthrough {
  const N = 2;
  const prod = proc("producer", producerOps(["C"], true));
  const cons = proc("consumer", consumerOps(1));
  const w = new World({ mutex: 1, empty: 0, full: N }, [prod, cons], N);
  w.buffer = ["A", "B"];
  const frames: Frame[] = [];
  frames.push({ caption: "The buffer is full: empty = 0, full = 2. This producer has its two waits the wrong way round — wait(mutex) first, then wait(empty).", items: drawBuffer(w, { pending: { producer: "wait(mutex) first" } }) });
  w.run(prod, 0, 1);
  frames.push({ caption: `The producer takes the mutex (now ${w.sems.mutex.value}), then calls wait(empty).`, items: drawBuffer(w, { hot: "producer", pending: { producer: "holds the mutex" } }) });
  w.run(prod, 0, 1);
  frames.push({ caption: `empty drops to ${signed(w.sems.empty.value)}: no free slot, so the producer blocks — while still holding the mutex.`, items: drawBuffer(w, { pending: { producer: "holds mutex, waits on empty" } }) });
  w.run(cons, 0, 2);
  if (!prod.blocked || !cons.blocked) throw new Error("wrong-order: both should be blocked");
  frames.push({ caption: `The consumer could free a slot: it passes wait(full), then calls wait(mutex) — held by the producer — and blocks too. Each waits for the other, for ever: a deadlock from swapping two lines.`, items: drawBuffer(w, { dead: true, pending: { producer: "holds mutex, waits on empty", consumer: "waits on mutex" } }) });
  return finish({ title: "Swap the producer's two waits and it deadlocks", input: "n = 2, buffer full; producer: wait(mutex) then wait(empty)", frames });
}

/* ── Readers-writers ──────────────────────────────────────────────── */

interface Arrival {
  name: string;
  at: number;
  writer: boolean;
  dur: number;
}

function readersWritersRun(people: readonly Arrival[], fair: boolean) {
  const q = (ops: Op[]): Op[] => (fair ? ops : ops.filter((o) => !("wait" in o && o.wait === "queue") && !("signal" in o && o.signal === "queue")));
  const procs = people.map((p) =>
    proc(
      p.name,
      p.writer
        ? q([{ wait: "queue" }, { wait: "rw" }, { signal: "queue" }, { work: p.dur, what: "write" }, { signal: "rw" }])
        : q([{ wait: "queue" }, { wait: "mutex" }, { firstIn: "rw" }, { signal: "mutex" }, { signal: "queue" }, { work: p.dur, what: "read" }, { wait: "mutex" }, { lastOut: "rw" }, { signal: "mutex" }]),
      p.at,
    ),
  );
  const w = new World({ rw: 1, mutex: 1, queue: 1 }, procs);
  // Who is reading or writing in each unit, to check the rule as it runs.
  for (let t = 0; t < 60 && procs.some((p) => p.ended < 0); t++) {
    for (;;) {
      let moved = 0;
      for (const p of procs) if (p.arrival <= t && p.ended < 0) moved += w.run(p, t);
      if (!moved) break;
    }
    const busy = procs.filter((p) => p.left > 0);
    const writers = busy.filter((p) => people.find((x) => x.name === p.name)!.writer);
    if (writers.length > 1 || (writers.length && busy.length > 1)) throw new Error(`readers-writers: a writer shared the data at ${t}`);
    for (const p of busy) {
      p.left--;
      if (p.left === 0) p.pc = p.pc; // the work op is done; exit ops run at the next tick
    }
  }
  if (procs.some((p) => p.ended < 0)) throw new Error("readers-writers: someone never finished");
  return procs;
}

function readersWriters(): Walkthrough {
  const people: Arrival[] = [
    { name: "R1", at: 0, writer: false, dur: 4 },
    { name: "R2", at: 2, writer: false, dur: 4 },
    { name: "W", at: 3, writer: true, dur: 3 },
    { name: "R3", at: 5, writer: false, dur: 4 },
    { name: "R4", at: 8, writer: false, dur: 4 },
  ];
  const UNIT = 24;
  const PITCH = 24;
  const draw = (procs: Proc[], heading: string, end: number): Item[] => {
    const items: Item[] = [label("hd", heading, 0, -34, { anchor: "start", tone: "accent", size: 12, weight: 600 })];
    for (let t = 0; t <= end; t += 3) items.push(label(`t${t}`, String(t), t * UNIT, -14, { tone: "faint", size: 10, mono: true }));
    procs.forEach((p, i) => {
      const y = i * PITCH;
      const isW = people[i].writer;
      items.push(label(`n${i}`, p.name, -10, y + 8, { anchor: "end", tone: isW ? "accent" : "ink", size: 11.5, mono: true, weight: 600 }));
      if (p.started > p.arrival) items.push({ k: "cell", id: `w${i}`, x: p.arrival * UNIT, y, w: (p.started - p.arrival) * UNIT, h: 16, text: "", tone: "accent" });
      items.push({ k: "cell", id: `r${i}`, x: p.started * UNIT, y, w: people[i].dur * UNIT, h: 16, text: isW ? "write" : "read", size: 10.5, tone: isW ? "strong" : "plain" });
      if (isW) items.push(label(`wt${i}`, `waits ${p.started - p.arrival}`, (p.started + people[i].dur) * UNIT + 8, y + 8, { anchor: "start", tone: "accent", size: 11, mono: true, weight: 600 }));
    });
    return items;
  };
  const first = readersWritersRun(people, false);
  const fair = readersWritersRun(people, true);
  const wIx = people.findIndex((p) => p.writer);
  const end = Math.max(...[...first, ...fair].map((p) => p.ended));
  const wf = first[wIx];
  const wq = fair[wIx];
  const lastReader = Math.max(...first.filter((_, i) => !people[i].writer && people[i].at < wf.started).map((p) => p.ended));
  if (wf.started !== lastReader) throw new Error("readers-writers: the writer should start as the last reader leaves");
  if (!(wf.started - wf.arrival > wq.started - wq.arrival)) throw new Error("readers-writers: the fair solution should serve the writer sooner");
  const late = people.filter((p) => !p.writer && p.at > people[wIx].at).map((p) => p.name);
  return finish({
    title: "Readers-writers: the first solution against the fair one",
    input: people.map((p) => `${p.name} at ${p.at}`).join(", "),
    frames: [
      {
        caption: `Readers first: W arrives at ${wf.arrival}, but ${late.join(" and ")} arrive while others are still reading, so read_count never falls to zero. W waits ${wf.started - wf.arrival} units, until the last reader leaves at ${wf.started}.`,
        items: draw(first, "first solution: readers have priority", end),
      },
      {
        caption: `Fair: everyone passes the queue semaphore first. W takes it at ${wq.arrival} and holds it until it gets rw_mutex at ${wq.started}, so ${late.join(" and ")} queue behind W. W waits only ${wq.started - wq.arrival}.`,
        items: draw(fair, "fair solution: one queue in arrival order", end),
      },
    ],
  });
}

/* ── Dining philosophers ──────────────────────────────────────────── */

function dining(): Walkthrough {
  const N = 5;
  const R = 92;
  const at = ring(N, 0, 0, R);
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const polar = (a: number, r: number): Pt => ({ x: round(r * Math.cos(a)), y: round(r * Math.sin(a)) });
  /** Chopstick j lies on the table between philosophers j − 1 and j, so philosopher i's are i and i + 1. */
  const tableAt = (j: number) => angle(j) - Math.PI / N;
  const left = (i: number) => i;
  const right = (i: number) => (i + 1) % N;

  const draw = (holder: Array<number | null>, state: string[], o: { waits?: Array<[number, number]>; dead?: boolean; heading: string }): Item[] => {
    const items: Item[] = [label("hd", o.heading, 0, -R - 64, { tone: "accent", size: 12, weight: 600 })];
    for (let j = 0; j < N; j++) {
      const h = holder[j];
      // On the table: a short radial stick between two plates; held: beside its philosopher.
      const a = h === null ? tableAt(j) : angle(h) + (j === left(h) ? -1 : 1) * 0.3;
      const r1 = h === null ? 46 : 50;
      const r2 = h === null ? 72 : 72;
      const p = polar(a, r1);
      const q = polar(a, r2);
      items.push({ k: "edge", id: `c${j}`, x1: p.x, y1: p.y, x2: q.x, y2: q.y, tone: h === null ? "ink" : o.dead ? "error" : "accent" });
      const lp = polar(a, r1 - 11);
      items.push(label(`cl${j}`, `c${j}`, lp.x, lp.y, { tone: "faint", size: 10.5, mono: true }));
    }
    for (const [a, b] of o.waits ?? []) items.push(link(`w${a}`, at[a], at[b], 21, { arrow: true, tone: o.dead ? "error" : "accent", bow: -22 }));
    for (let i = 0; i < N; i++) {
      const tone: Tone = state[i] === "eating" ? "strong" : state[i] === "waiting" ? (o.dead ? "error" : "accent") : state[i] === "done" ? "muted" : "plain";
      items.push({ k: "node", id: `p${i}`, x: at[i].x, y: at[i].y, r: 20, text: `P${i}`, tone, size: 12 });
      const lp = polar(angle(i), R + 30);
      const side = Math.abs(lp.x) < 30 ? "middle" : lp.x > 0 ? "start" : "end";
      items.push(label(`st${i}`, state[i], side === "middle" ? lp.x : lp.x + (side === "start" ? -8 : 8), lp.y + (side === "middle" ? (lp.y < 0 ? -4 : 4) : 0), { anchor: side, tone: state[i] === "waiting" ? (o.dead ? "error" : "accent") : "soft", size: 10.5 }));
    }
    return items;
  };

  /** Everyone reaches at once: each takes its first chopstick, then each tries its second. */
  const reach = (first: (i: number) => number, second: (i: number) => number) => {
    const holder: Array<number | null> = new Array<number | null>(N).fill(null);
    const state = new Array<string>(N).fill("thinking");
    const want = new Array<number>(N).fill(-1);
    for (let i = 0; i < N; i++) {
      if (holder[first(i)] === null) holder[first(i)] = i;
      else want[i] = first(i);
    }
    const afterFirst = [...holder];
    for (let i = 0; i < N; i++) {
      if (want[i] >= 0) continue;
      if (holder[second(i)] === null) holder[second(i)] = i;
      else want[i] = second(i);
    }
    for (let i = 0; i < N; i++) state[i] = want[i] >= 0 ? "waiting" : "eating";
    const waits: Array<[number, number]> = [];
    for (let i = 0; i < N; i++) if (want[i] >= 0) waits.push([i, holder[want[i]]!]);
    // Deadlock: every philosopher waits, and the waits close a cycle.
    const dead = waits.length === N;
    return { afterFirst, holder, state, waits, dead, want };
  };

  const naive = reach(left, right);
  if (!naive.dead) throw new Error("dining: left-then-right should deadlock");
  const lower = (i: number) => Math.min(left(i), right(i));
  const higher = (i: number) => Math.max(left(i), right(i));
  const fixed = reach(lower, higher);
  if (fixed.dead) throw new Error("dining: lower-first should not deadlock");
  const eaters = fixed.state.flatMap((s, i) => (s === "eating" ? [i] : []));
  const empty = new Array<number | null>(N).fill(null);
  const thinking = new Array<string>(N).fill("thinking");
  const odd = [...Array(N).keys()].find((i) => lower(i) !== left(i))!;
  const frames: Frame[] = [
    { caption: `Five philosophers, five chopsticks c0–c4: philosopher i needs chopstick i on one side and chopstick (i + 1) mod 5 on the other. Here everyone gets hungry at the same moment.`, items: draw(empty, thinking, { heading: "left, then right" }) },
    {
      caption: "Each philosopher picks up the left chopstick, wait(chopstick[i]). All five succeed, and the table is now empty.",
      items: draw(naive.afterFirst, naive.afterFirst.map(() => "hungry"), { heading: "left, then right" }),
    },
    {
      caption: `Each now calls wait on the right chopstick, which the neighbour holds. ${naive.waits.slice(0, 2).map(([a, b], k) => (k ? `P${a} for P${b}` : `P${a} waits for P${b}`)).join(", ")}, and round to P${naive.waits[N - 1][0]} waiting for P${naive.waits[N - 1][1]}: a circular wait, and nobody ever eats.`,
      items: draw(naive.holder, naive.state, { waits: naive.waits, dead: true, heading: "left, then right" }),
    },
    {
      caption: `The fix by ordering: everyone picks up the lower-numbered chopstick first. For P0–P3 that is still the left one, but P${odd} needs c${lower(odd)} and c${higher(odd)}, so it reaches for c${lower(odd)} first — and finds P${fixed.afterFirst[lower(odd)]} holding it.`,
      items: draw(fixed.afterFirst, fixed.afterFirst.map((_, i) => (fixed.want[i] >= 0 && fixed.afterFirst.indexOf(i) < 0 ? "waiting" : "hungry")), { waits: [[odd, fixed.afterFirst[lower(odd)]!]], heading: "lower-numbered first" }),
    },
    {
      caption: `P${odd} waits holding nothing, so c${higher(odd)} stays free and P${eaters.join(", P")} picks it up and eats. No cycle can close; when P${eaters[0]} puts its chopsticks down, the others eat in turn.`,
      items: draw(fixed.holder, fixed.state, { waits: fixed.waits, heading: "lower-numbered first" }),
    },
  ];
  return finish({ title: "Dining philosophers: the deadlock, and ordering the chopsticks", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "bounded-buffer": boundedBuffer,
  "wrong-order": wrongOrder,
  "readers-writers": readersWriters,
  "dining-philosophers": dining,
};
