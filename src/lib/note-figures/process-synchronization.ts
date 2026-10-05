import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { gantt, lines, type GanttSlot } from "./kit.js";

/**
 * Process Synchronization: the note's figures
 * (content/notes/operating-systems/process-synchronization.md places each
 * with "@figure <name>").
 *
 *  - race: counter++ and counter-- split into load/add/store and run in the
 *    note's interleaving on a tiny register machine; the last frame counts
 *    the outcomes of all 20 interleavings of the six instructions;
 *  - critical-section: the entry/critical/exit/remainder structure for two
 *    processes, one inside and one held at its entry section;
 *  - peterson: Peterson's algorithm stepped line by line under one
 *    schedule, with mutual exclusion checked at every step;
 *  - semaphore: a blocking counting semaphore (value + queue) for two
 *    printers, run through the note's wait/signal sequence;
 *  - priority-inversion: a preemptive priority scheduler with one mutex,
 *    run without and with priority inheritance on the same three tasks.
 */

/* ── Race condition ───────────────────────────────────────────────── */

type Instr = { text: string; run: (s: Machine, me: 0 | 1) => void };
interface Machine {
  counter: number;
  reg: [number | null, number | null];
}
const prog = (me: 0 | 1, delta: number): Instr[] => {
  const r = `r${me + 1}`;
  return [
    { text: `${r} = counter`, run: (s) => (s.reg[me] = s.counter) },
    { text: `${r} = ${r} ${delta > 0 ? "+" : "-"} 1`, run: (s) => (s.reg[me] = s.reg[me]! + delta) },
    { text: `counter = ${r}`, run: (s) => (s.counter = s.reg[me]!) },
  ];
};

/** Every way to interleave two three-step threads, as schedules of 0s and 1s. */
function interleavings(a: number, b: number): number[][] {
  if (!a) return [new Array<number>(b).fill(1)];
  if (!b) return [new Array<number>(a).fill(0)];
  return [...interleavings(a - 1, b).map((s) => [0, ...s]), ...interleavings(a, b - 1).map((s) => [1, ...s])];
}

function race(): Walkthrough {
  const START = 5;
  const progs = [prog(0, +1), prog(1, -1)];
  const runSchedule = (sched: readonly number[]) => {
    const s: Machine = { counter: START, reg: [null, null] };
    const pc = [0, 0];
    for (const t of sched) progs[t][pc[t]++].run(s, t as 0 | 1);
    return s.counter;
  };
  const SCHED = [0, 0, 1, 1, 0, 1];
  const all = interleavings(3, 3);
  const outcome = new Map<number, number>();
  for (const s of all) outcome.set(runSchedule(s), (outcome.get(runSchedule(s)) ?? 0) + 1);
  const serialOk = runSchedule([0, 0, 0, 1, 1, 1]) === START && runSchedule([1, 1, 1, 0, 0, 0]) === START;
  if (!serialOk) throw new Error("race: a serial run should leave the counter unchanged");

  const CX = 330;
  const frames: Frame[] = [];
  const s: Machine = { counter: START, reg: [null, null] };
  const pc = [0, 0];
  const draw = (k: number, o: { final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    [0, 1].forEach((t) => {
      const x = t ? CX : 0;
      items.push(label(`th${t}`, t ? "T2: counter--" : "T1: counter++", x, 0, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
      items.push(...lines(`c${t}-`, progs[t].map((p) => p.text), x + 14, 26, { size: 12, gap: 20, tone: (i) => (k >= 0 && SCHED[k] === t && pc[t] - 1 === i ? "accent" : i < pc[t] ? "faint" : "ink") }));
      items.push(label(`rl${t}`, `r${t + 1}`, x + 14, 104, { anchor: "start", tone: "soft", size: 11.5, mono: true }));
      items.push(box(`r${t}`, x + 40, 90, s.reg[t] ?? "–", { w: 44, h: 28, size: 13, tone: k >= 0 && SCHED[k] === t && pc[t] - 1 < 2 ? "accent" : "plain" }));
    });
    const wrote = k >= 0 && progs[SCHED[k]][pc[SCHED[k]] - 1].text.startsWith("counter =");
    items.push(label("cl", "counter (shared)", CX / 2 + 20, 70, { tone: "soft", size: 11.5, weight: 600 }));
    items.push(box("ctr", CX / 2 - 6, 82, s.counter, { w: 52, h: 36, size: 15, tone: o.final ? "error" : wrote ? "accent" : "plain" }));
    // The schedule: which thread ran each step.
    items.push(label("sl", "step", -4, 160, { anchor: "end", tone: "soft", size: 11 }));
    SCHED.forEach((t, j) => items.push(box(`s${j}`, 4 + j * 40, 146, `T${t + 1}`, { w: 34, h: 26, size: 11.5, tone: j === k ? "accent" : j < k ? "muted" : "plain" })));
    if (k >= 0 && !o.final) {
      const t = SCHED[k];
      const line = pc[t] - 1;
      if (line === 0) items.push(arrow("mv", { x: CX / 2 + 20, y: 82 }, { x: t ? CX + 60 : 60, y: 90 }, { tone: "accent", bow: t ? -18 : 18 }));
      if (line === 2) items.push(arrow("mv", { x: t ? CX + 60 : 60, y: 90 }, { x: CX / 2 + 20, y: 82 }, { tone: "accent", bow: t ? 18 : -18 }));
    }
    return items;
  };
  frames.push({ caption: `Each one-line statement is three instructions: load counter into a register, change the register, store it back. counter starts at ${START}, and the two threads run interleaved in the order on the bottom row.`, items: draw(-1) });
  SCHED.forEach((t, k) => {
    const instr = progs[t][pc[t]];
    const before = s.counter;
    instr.run(s, t as 0 | 1);
    pc[t]++;
    const what =
      pc[t] === 1
        ? `T${t + 1} loads counter (${before}) into r${t + 1}.`
        : pc[t] === 2
          ? `T${t + 1} changes only its own register: r${t + 1} = ${s.reg[t]}. counter in memory is still ${s.counter}.`
          : `T${t + 1} stores r${t + 1}: counter = ${s.counter}${k === SCHED.length - 1 ? `, overwriting the ${before} that T${2 - t} stored a moment ago.` : "."}`;
    const extra = k === 2 ? ` T1 has not stored yet, so T2 reads the old value — this is where the update gets lost.` : "";
    frames.push({ caption: `Step ${k + 1}: ${what}${extra}`, items: draw(k) });
  });
  const final = s.counter;
  if (final === START) throw new Error("race: the note's interleaving should lose an update");
  const n = (v: number) => outcome.get(v) ?? 0;
  frames.push({
    caption: `One increment and one decrement should leave ${START}, but this run ends at ${final}. Of all ${all.length} interleavings of the six instructions, ${n(START)} give ${START}, ${n(START - 1)} give ${START - 1} and ${n(START + 1)} give ${START + 1}: the answer depends on timing.`,
    items: draw(SCHED.length - 1, { final: true }),
  });
  return finish({ title: "A race condition: counter++ and counter-- interleaved", input: `counter = ${START}`, frames });
}

/* ── The critical-section structure ───────────────────────────────── */

function criticalSection(): Walkthrough {
  const PARTS = ["entry section", "critical section", "exit section", "remainder section"];
  const W = 140;
  const H = 30;
  const PITCH = 46;
  const GAPX = 270;
  // P0 is inside; P1 asked to enter while P0 was there, so its entry section holds it.
  const where = [1, 0];
  if (where.filter((w) => w === 1).length > 1) throw new Error("critical-section: two processes inside");
  const items: Item[] = [];
  [0, 1].forEach((p) => {
    const x = p * GAPX;
    items.push(label(`h${p}`, `P${p}`, x + W / 2, -18, { tone: "ink", size: 12.5, weight: 700, mono: true }));
    PARTS.forEach((name, i) => {
      const here = where[p] === i;
      items.push(box(`b${p}-${i}`, x, i * PITCH, name, { w: W, h: H, size: 12, tone: here ? (i === 1 ? "strong" : "accent") : i === 1 ? "plain" : "plain" }));
      if (i < PARTS.length - 1) items.push(arrow(`a${p}-${i}`, { x: x + W / 2, y: i * PITCH + H + 1 }, { x: x + W / 2, y: (i + 1) * PITCH - 2 }, { tone: "ink" }));
    });
    // The loop back from remainder to entry, on the outer side.
    const side = p ? x + W + 18 : x - 18;
    const edge = p ? x + W : x;
    items.push({ k: "path", id: `lp${p}`, pts: [[edge, 3 * PITCH + H / 2], [side, 3 * PITCH + H / 2], [side, H / 2]], tone: "ink", width: 1.4 });
    items.push(arrow(`la${p}`, { x: side, y: H / 2 }, { x: edge + (p ? 2 : -2), y: H / 2 }, { tone: "ink" }));
  });
  items.push(label("w1", "P1 waits here", GAPX - 8, H / 2, { anchor: "end", tone: "accent", size: 11, weight: 600 }));
  items.push(box("sh", W + 18, PITCH - 2, "shared data", { w: GAPX - W - 36, h: H + 4, size: 11.5, tone: "accent" }));
  items.push(arrow("u0", { x: W + 1, y: PITCH + H / 2 }, { x: W + 17, y: PITCH + H / 2 }, { tone: "accent", head: false }));
  items.push(arrow("u1", { x: GAPX - 1, y: PITCH + H / 2 }, { x: GAPX - 17, y: PITCH + H / 2 }, { tone: "faint", dashed: true, head: false }));
  return finish({
    title: "The critical-section structure, for two processes",
    input: "",
    frames: [
      {
        caption: "Each process loops through four sections. Only the critical section touches the shared data. P0 is inside it, so P1's entry section holds P1 back until P0's exit section announces it has left.",
        items,
      },
    ],
  });
}

/* ── Peterson's solution ──────────────────────────────────────────── */

function peterson(): Walkthrough {
  const code = (i: number) => {
    const j = 1 - i;
    return [`flag[${i}] = 1`, `turn = ${j}`, `while (flag[${j}] && turn == ${j});`, "critical section", `flag[${i}] = 0`];
  };
  const flag = [0, 0];
  let turn = 0;
  const pc = [0, 0];
  const spun = [false, false];
  /** One line of process i; returns what it did. */
  const step = (i: number): string => {
    const j = 1 - i;
    spun[i] = false;
    switch (pc[i]) {
      case 0:
        flag[i] = 1;
        pc[i]++;
        return `P${i} sets flag[${i}] = 1: it wants to enter.`;
      case 1:
        turn = j;
        pc[i]++;
        return `P${i} sets turn = ${j}, offering to let P${j} go first.`;
      case 2:
        if (flag[j] && turn === j) {
          spun[i] = true;
          return `P${i} tests: flag[${j}] is 1 and turn is ${j}, so it spins in the while loop.`;
        }
        pc[i]++;
        return `P${i} tests: ${!flag[j] ? `flag[${j}] is 0` : `turn is ${turn}, not ${j}`}, so it leaves the loop and enters its critical section.`;
      case 3:
        pc[i]++;
        flag[i] = 0;
        return `P${i} leaves its critical section and sets flag[${i}] = 0.`;
      default:
        return "";
    }
  };
  const SCHED = [0, 1, 0, 1, 0, 1, 0, 1];
  const X1 = 230;
  const draw = (k: number, who: number): Item[] => {
    const items: Item[] = [];
    [0, 1].forEach((i) => {
      const x = i ? X1 : 0;
      const inside = pc[i] === 3;
      items.push(box(`p${i}`, x, 70, `P${i}`, { w: 50, h: 26, size: 12, tone: inside ? "strong" : spun[i] ? "accent" : "plain" }));
      if (inside) items.push(label(`in${i}`, "inside", x + 58, 83, { anchor: "start", tone: "accent", size: 11, weight: 600 }));
      if (spun[i]) items.push(label(`sp${i}`, "spinning", x + 58, 83, { anchor: "start", tone: "accent", size: 11, weight: 600 }));
      const cur = who === i ? (spun[i] ? 2 : pc[i] - 1) : -1;
      items.push(...lines(`c${i}-`, code(i), x + 12, 116, { size: 11.5, gap: 20, tone: (l) => (l === cur ? "accent" : l === 3 ? "soft" : "ink") }));
      const at = pc[i] < 5 ? pc[i] : -1;
      if (at >= 0 && k >= 0) items.push({ k: "text", id: `pc${i}`, x: x, y: 116 + at * 20, text: "▸", tone: "soft", size: 11, mono: true });
    });
    // The shared variables across the top.
    const vars: Array<[string, number]> = [
      ["flag[0]", flag[0]],
      ["flag[1]", flag[1]],
      ["turn", turn],
    ];
    vars.forEach(([n, v], m) => {
      const x = 70 + m * 100;
      items.push(label(`vl${m}`, n, x + 22, 0, { tone: "soft", size: 11, mono: true }));
      items.push(box(`v${m}`, x, 12, v, { w: 44, h: 30, size: 14, tone: "plain" }));
    });
    return items;
  };
  const frames: Frame[] = [];
  SCHED.forEach((i, k) => {
    const said = step(i);
    if (pc[0] === 3 && pc[1] === 3) throw new Error("peterson: both processes inside");
    let caption = said;
    if (k === 3) caption += ` Both want in, and turn holds whichever value was written last — so exactly one of them will wait.`;
    if (k === SCHED.length - 1) caption += ` Each entered once and they were never inside together: whoever wrote turn last waited.`;
    frames.push({ caption, items: draw(k, i) });
  });
  return finish({ title: "Peterson's solution, line by line, with both processes competing", input: "flag = [0, 0]; P0 and P1 take turns running one line", frames });
}

/* ── A counting semaphore ─────────────────────────────────────────── */

const signed = (v: number) => (v < 0 ? `−${-v}` : String(v));
const WORDS = ["no", "one", "two", "three", "four"];

function semaphore(): Walkthrough {
  const PRINTERS = 2;
  const sem = { value: PRINTERS, queue: [] as string[] };
  const printer: Array<string | null> = new Array<string | null>(PRINTERS).fill(null);
  const state = new Map<string, "idle" | "printing" | "blocked" | "done">(["A", "B", "C", "D"].map((p) => [p, "idle"]));
  const take = (p: string) => {
    const k = printer.indexOf(null);
    if (k < 0) throw new Error("semaphore: a process passed wait() with no printer free");
    printer[k] = p;
    state.set(p, "printing");
  };
  const wait = (p: string): string => {
    sem.value--;
    if (sem.value < 0) {
      sem.queue.push(p);
      state.set(p, "blocked");
      return `${p} calls wait(): the value drops to ${signed(sem.value)}, below zero, so ${p} joins the queue and blocks. ${signed(sem.value)} means ${WORDS[-sem.value]} ${-sem.value === 1 ? "process is" : "processes are"} waiting.`;
    }
    take(p);
    return `${p} calls wait(): the value drops to ${signed(sem.value)}, not below zero, so ${p} goes ahead and takes a printer.`;
  };
  const signal = (p: string): string => {
    const k = printer.indexOf(p);
    printer[k] = null;
    state.set(p, "done");
    sem.value++;
    if (sem.value <= 0) {
      const q = sem.queue.shift()!;
      take(q);
      return `${p} calls signal(): the value rises to ${signed(sem.value)}, still not positive, so the first waiter, ${q}, wakes and takes the printer ${p} freed.`;
    }
    return `${p} calls signal(): the value rises to ${signed(sem.value)} and nobody is waiting.`;
  };
  const draw = (hot: string | null): Item[] => {
    const items: Item[] = [label("sv", "S.value", 0, 0, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }), box("val", 0, 12, signed(sem.value), { w: 56, h: 40, size: 18, tone: sem.value < 0 ? "accent" : "plain" })];
    items.push(label("ql", "S.queue", 100, 0, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
    sem.queue.forEach((p, k) => items.push(box(`q${p}`, 100 + k * 44, 18, p, { w: 38, h: 28, size: 12.5, tone: "accent" })));
    if (!sem.queue.length) items.push(label("qe", "empty", 100, 32, { anchor: "start", tone: "faint", size: 11.5 }));
    printer.forEach((p, k) => {
      items.push(label(`pl${k}`, `printer ${k + 1}`, 250 + k * 90, 0, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
      items.push(box(`pr${k}`, 250 + k * 90, 12, p ?? "free", { w: 76, h: 40, size: 12.5, tone: p ? "strong" : "plain" }));
    });
    [...state.keys()].forEach((p, k) => {
      const st = state.get(p)!;
      const tone: Tone = st === "done" ? "muted" : st === "blocked" ? "accent" : "plain";
      items.push(box(`p${p}`, k * 106, 90, p, { w: 36, h: 28, size: 12.5, tone: p === hot ? "accent" : tone }));
      items.push(label(`ps${p}`, st, k * 106 + 42, 104, { anchor: "start", tone: p === hot ? "accent" : st === "done" ? "faint" : "soft", size: 11 }));
    });
    return items;
  };
  const frames: Frame[] = [{ caption: `Two printers, so the semaphore starts at ${PRINTERS}. Four processes will each call wait() before printing and signal() when they finish.`, items: draw(null) }];
  for (const p of ["A", "B", "C", "D"]) frames.push({ caption: wait(p), items: draw(p) });
  for (const p of ["A", "B"]) frames.push({ caption: signal(p), items: draw(p) });
  if (sem.value !== 0 || sem.queue.length) throw new Error("semaphore: the trace should end at 0 with nobody waiting");
  const last = frames[frames.length - 1];
  last.caption += ` The value is back to ${sem.value}: both printers busy, nobody waiting.`;
  return finish({ title: "A counting semaphore guarding two printers", input: "S = 2; A, B, C, D call wait(); then A and B call signal()", frames });
}

/* ── Priority inversion ───────────────────────────────────────────── */

type Op = { run: number } | { lock: true } | { unlock: true };
interface Task {
  name: string;
  prio: number;
  arrival: number;
  ops: Op[];
}

/** Unit-step preemptive priority scheduling with one mutex; returns the CPU's slots and each task's blocked span. */
function schedule(tasks: readonly Task[], inherit: boolean) {
  const st = tasks.map((t) => ({ ...t, ops: t.ops.map((o) => ({ ...o })), pc: 0, blocked: false, done: -1, blockedFrom: -1, blockedTo: -1 }));
  let holder = -1;
  const eff = (i: number) => (inherit && i === holder && st.some((s) => s.blocked) ? Math.min(st[i].prio, ...st.filter((s) => s.blocked).map((s) => s.prio)) : st[i].prio);
  const slots: GanttSlot[] = [];
  /** Who held the mutex during each time unit (−1: nobody). */
  const holderAt: number[] = [];
  for (let t = 0; t < 100 && st.some((s) => s.done < 0); t++) {
    let ran = -1;
    for (;;) {
      const ready = st.map((_, i) => i).filter((i) => st[i].arrival <= t && st[i].done < 0 && !st[i].blocked);
      if (!ready.length) break;
      const i = ready.sort((a, b) => eff(a) - eff(b))[0];
      const op = st[i].ops[st[i].pc];
      if ("lock" in op) {
        if (holder >= 0) {
          st[i].blocked = true;
          st[i].blockedFrom = t;
          continue;
        }
        holder = i;
        st[i].pc++;
        continue;
      }
      if ("unlock" in op) {
        holder = -1;
        st[i].pc++;
        for (const s of st) if (s.blocked) {
          s.blocked = false;
          s.blockedTo = t;
        }
        if (st[i].pc === st[i].ops.length) st[i].done = t;
        continue;
      }
      op.run--;
      if (op.run === 0) st[i].pc++;
      ran = i;
      break;
    }
    holderAt.push(holder);
    if (ran >= 0) {
      const last = slots[slots.length - 1];
      if (last && last.who === st[ran].name && last.to === t) last.to++;
      else slots.push({ who: st[ran].name, from: t, to: t + 1 });
      if (st[ran].pc === st[ran].ops.length) st[ran].done = t + 1;
    }
  }
  return { slots, st, holderAt };
}

function priorityInversion(): Walkthrough {
  const tasks: Task[] = [
    { name: "H", prio: 1, arrival: 2, ops: [{ lock: true }, { run: 2 }, { unlock: true }] },
    { name: "M", prio: 2, arrival: 3, ops: [{ run: 4 }] },
    { name: "L", prio: 3, arrival: 0, ops: [{ run: 1 }, { lock: true }, { run: 3 }, { unlock: true }, { run: 1 }] },
  ];
  const plain = schedule(tasks, false);
  const inh = schedule(tasks, true);
  const hDone = (r: ReturnType<typeof schedule>) => r.st[0].done;
  if (!(hDone(plain) > hDone(inh))) throw new Error("priority-inversion: inheritance should finish H sooner");
  const UNIT = 30;
  const draw = (r: ReturnType<typeof schedule>, heading: string): Item[] => {
    const items: Item[] = [label("hd", heading, 0, -40, { anchor: "start", tone: "accent", size: 12, weight: 600 })];
    const h = r.st[0];
    const mDuringBlock = r.slots.filter((s) => s.who === "M" && s.from < h.blockedTo && s.to > h.blockedFrom);
    items.push(label("cpu", "CPU", -10, 15, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }));
    items.push(...gantt("g", r.slots.map((s) => ({ ...s, tone: mDuringBlock.includes(s) ? ("error" as const) : s.who === "H" ? ("strong" as const) : undefined })), { unit: UNIT, h: 30 }).items);
    for (const t of tasks) items.push({ k: "ptr", id: `ar${t.name}`, x: t.arrival * UNIT, y: -3, label: t.name, tone: "ink", up: false });
    const ly = 88;
    // The mutex's lane: who held it, unit by unit, merged into spans.
    items.push(label("lk", "lock held by", -10, 71, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }));
    const spans: Array<{ who: number; from: number; to: number }> = [];
    r.holderAt.forEach((w, t) => {
      const last = spans[spans.length - 1];
      if (last && last.who === w && last.to === t) last.to++;
      else spans.push({ who: w, from: t, to: t + 1 });
    });
    spans.filter((sp) => sp.who >= 0).forEach((sp, k) => items.push({ k: "cell", id: `lk${k}`, x: sp.from * UNIT, y: 60, w: (sp.to - sp.from) * UNIT, h: 22, text: r.st[sp.who].name, size: 11, tone: "plain" }));
    items.push(label("lh", "H", -10, ly + 11, { anchor: "end", tone: "ink", size: 11.5, weight: 600, mono: true }));
    items.push({ k: "cell", id: "hb", x: h.blockedFrom * UNIT, y: ly, w: (h.blockedTo - h.blockedFrom) * UNIT, h: 22, text: "blocked", size: 10.5, tone: "accent" });
    items.push(label("hdn", `H done at ${h.done}`, h.done * UNIT + 8, ly + 11, { anchor: "start", tone: "accent", size: 11.5, weight: 600, mono: true }));
    return items;
  };
  const p = plain.st[0];
  const mRan = plain.slots.filter((s) => s.who === "M" && s.from < p.blockedTo && s.to > p.blockedFrom).reduce((a, s) => a + Math.min(s.to, p.blockedTo) - Math.max(s.from, p.blockedFrom), 0);
  return finish({
    title: "Priority inversion, and priority inheritance fixing it",
    input: "L (low) holds a lock; H (high) needs it; M (medium) needs only the CPU",
    frames: [
      {
        caption: `L takes the lock at ${plain.holderAt.indexOf(2)}. H arrives at ${p.arrival}, needs the lock and blocks. M arrives at ${tasks[1].arrival} and, outranking L, runs for ${mRan} units while L still holds the lock — so H, the most urgent task, waits on M and finishes only at ${hDone(plain)}.`,
        items: draw(plain, "without inheritance"),
      },
      {
        caption: `With priority inheritance, L runs at H's priority while H waits for its lock, so M cannot preempt it. L finishes its critical section at ${inh.st[0].blockedTo}, H takes the lock and finishes at ${hDone(inh)}, and M runs after.`,
        items: draw(inh, "with priority inheritance"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  race,
  "critical-section": criticalSection,
  peterson,
  semaphore,
  "priority-inversion": priorityInversion,
};
