import { finish, link, treeLayout, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region, type Pt } from "../lesson-figures/kit.js";
import { boxRim } from "./kit.js";

/**
 * Processes and Threads: the note's figures
 * (content/notes/operating-systems/processes-and-threads.md places each
 * with "@figure <name>").
 *
 *  - address-space: a small C program run statement by statement against
 *    a model of its memory — the stack grows a frame per call and shrinks
 *    on return, malloc() grows the heap, and a block nothing points to is
 *    left behind when its frame pops;
 *  - states: the five-state diagram, then one process's life applied to
 *    it event by event (an event with no legal transition throws);
 *  - context-switch: a CPU and two PCBs; the kernel saves the running
 *    process's registers and restores the next one's, each value keeping
 *    its id so it glides between CPU and PCB, checked after the switch;
 *  - fork-tree: fork(); fork(); fork(); — every process alive runs each
 *    fork, and the tree is drawn from who created whom;
 *  - threads: what the threads of one process share and what each owns;
 *  - threading-models: user threads mapped onto kernel threads, three ways.
 */

/* ── The address space, as a program runs ─────────────────────────── */

function addressSpace(): Walkthrough {
  const W = 168;
  const FH = 32;
  const TOP = 0;
  const HEAP_BASE = 222;
  const BH = 24;
  type Frame_ = { fn: string; vars: Record<string, number | string> };
  const stack: Frame_[] = [];
  const heap: Array<{ size: number; owner: string | null }> = [];
  const globals = { count: 5 };
  const frames: Frame[] = [];
  const draw = (o: { hotFrame?: number; hotBlock?: number }): Item[] => {
    const items: Item[] = [];
    const stackBottom = TOP + stack.length * (FH + 2);
    const heapTop = HEAP_BASE - heap.length * (BH + 2);
    items.push(label("hi", "high addresses", 0, TOP - 12, { anchor: "start", tone: "faint", size: 10.5 }));
    items.push(label("lo", "low addresses", 0, HEAP_BASE + 76, { anchor: "start", tone: "faint", size: 10.5 }));
    stack.forEach((f, k) => {
      const vars = Object.entries(f.vars).map(([n, v]) => `${n} = ${v}`).join(", ");
      items.push(box(`f${f.fn}`, 0, TOP + k * (FH + 2), `${f.fn}(): ${vars}`, { w: W, h: FH, size: 11, tone: k === o.hotFrame ? "accent" : "plain" }));
    });
    if (heapTop - stackBottom > 6) {
      items.push({ k: "band", id: "free", x: 0, y: stackBottom + 2, w: W, h: heapTop - stackBottom - 4, tone: "ghost" });
      items.push(label("freet", "free", W / 2, (stackBottom + heapTop) / 2, { tone: "faint", size: 11 }));
    }
    heap.forEach((b, k) => items.push(box(`h${k}`, 0, HEAP_BASE - (k + 1) * (BH + 2) + 2, `${b.size} bytes`, { w: W, h: BH, size: 11, tone: k === o.hotBlock ? "accent" : b.owner ? "plain" : "error" })));
    items.push(box("data", 0, HEAP_BASE + 4, `data: count = ${globals.count}`, { w: W, h: 28, size: 11, tone: "muted" }));
    items.push(box("text", 0, HEAP_BASE + 34, "text: main, f, g", { w: W, h: 28, size: 11, tone: "muted" }));
    // Region names at the right; the growth arrows show which way each end moves.
    items.push(label("ls", "stack", -22, TOP + 14, { anchor: "end", tone: "ink", size: 11.5, weight: 600 }));
    items.push(arrow("gs", { x: -12, y: TOP + 4 }, { x: -12, y: TOP + 26 }, { tone: "accent" }));
    items.push(label("lh", "heap", -22, HEAP_BASE - 12, { anchor: "end", tone: "ink", size: 11.5, weight: 600 }));
    items.push(arrow("gh", { x: -12, y: HEAP_BASE - 2 }, { x: -12, y: HEAP_BASE - 24 }, { tone: "accent" }));
    // Pointers from stack variables to their heap blocks.
    stack.forEach((f, k) =>
      Object.entries(f.vars).forEach(([n, v]) => {
        if (typeof v !== "string" || !v.startsWith("block ")) return;
        const b = Number(v.slice(6));
        const by = HEAP_BASE - (b + 1) * (BH + 2) + 2 + BH / 2;
        items.push(arrow(`p${n}`, { x: W + 2, y: TOP + k * (FH + 2) + FH / 2 }, { x: W + 2, y: by }, { tone: "accent", bow: -40 - 10 * b }));
      }),
    );
    return items;
  };
  const say = (caption: string, o: Parameters<typeof draw>[0] = {}) => frames.push({ caption, items: draw(o) });
  const malloc = (owner: string, size: number) => {
    heap.push({ size, owner });
    return `block ${heap.length - 1}`;
  };

  stack.push({ fn: "main", vars: { p: "–" } });
  say(`The program is loaded: its code in text, the global count = ${globals.count} in data, and one stack frame for main(). The heap is empty, and the free space between heap and stack is where both will grow.`, { hotFrame: 0 });
  stack[0].vars.p = malloc("p", 16);
  say("main() calls malloc(16). The heap grows upward by one block, and the pointer p, a local variable on the stack, holds its address.", { hotBlock: 0 });
  stack.push({ fn: "f", vars: { x: 3, q: "–" } });
  say("main() calls f(3). The stack grows downward: f gets a new frame with its argument x = 3 and its own local q.", { hotFrame: 1 });
  stack[1].vars.q = malloc("q", 16);
  say("f() calls malloc(16) too, and a second block sits above the first: the heap grows up while the stack grows down.", { hotBlock: 1 });
  const y = (stack[1].vars.x as number) + globals.count;
  stack.push({ fn: "g", vars: { y } });
  say(`f() calls g(x + count), so g's frame holds y = 3 + 5 = ${y}. Each call adds a frame; deep recursion keeps adding them until the stack overflows.`, { hotFrame: 2 });
  const result = y * 2;
  stack.pop();
  stack.pop();
  // q died with f's frame, so nothing points to its block any more.
  heap[1].owner = null;
  if (stack.length !== 1 || heap.length !== 2) throw new Error("address-space: frames should pop, blocks should stay");
  say(`g returns ${result} and f returns: their frames are gone the moment they return. The heap blocks stay until free() — and q's block is now unreachable, a memory leak.`);
  return finish({ title: "A process's address space while a program runs", input: "int count = 5; main() mallocs p and calls f(3), which mallocs q and calls g(x + count)", frames });
}

/* ── The process state diagram ────────────────────────────────────── */

type State = "new" | "ready" | "running" | "waiting" | "terminated";
const SW = 92;
const SH = 30;
const POS: Record<State, Pt> = {
  new: { x: 0, y: 0 },
  ready: { x: 70, y: 96 },
  running: { x: 290, y: 96 },
  terminated: { x: 360, y: 0 },
  waiting: { x: 180, y: 196 },
};
const EDGES: Array<{ from: State; to: State; event: string; label: string; bow?: number }> = [
  { from: "new", to: "ready", event: "admit", label: "admitted" },
  { from: "ready", to: "running", event: "dispatch", label: "dispatch", bow: -26 },
  { from: "running", to: "ready", event: "interrupt", label: "interrupt", bow: -26 },
  { from: "running", to: "waiting", event: "wait", label: "I/O wait" },
  { from: "waiting", to: "ready", event: "done", label: "I/O done" },
  { from: "running", to: "terminated", event: "exit", label: "exit" },
];

function states(): Walkthrough {
  const centre = (s: State): Pt => ({ x: POS[s].x + SW / 2, y: POS[s].y + SH / 2 });
  const draw = (cur: State | null, edge: number): Item[] => {
    const items: Item[] = [];
    EDGES.forEach((e, k) => {
      const a = boxRim(centre(e.from), SW + 4, SH + 4, centre(e.to));
      const b = boxRim(centre(e.to), SW + 6, SH + 6, centre(e.from));
      items.push({ k: "edge", id: `e${k}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, tone: k === edge ? "accent" : "line", arrow: true, bow: e.bow, label: e.label });
    });
    (Object.keys(POS) as State[]).forEach((s) => items.push(box(`s${s}`, POS[s].x, POS[s].y, s, { w: SW, h: SH, size: 12, tone: s === cur ? "strong" : "plain" })));
    return items;
  };
  const life = ["admit", "dispatch", "wait", "done", "dispatch", "interrupt", "dispatch", "exit"];
  const why: Record<string, string> = {
    admit: "The OS finishes creating the process and admits it: it is in memory and only needs a CPU.",
    dispatch: "The scheduler dispatches it: its registers are loaded and it runs.",
    wait: "It asks to read a file. It cannot continue until the disk answers, so it waits and gives up the CPU.",
    done: "The disk's interrupt reports the read is complete. The process becomes ready — not running: it must queue for the CPU like everyone else.",
    interrupt: "The timer fires at the end of its time slice and the scheduler preempts it, back to ready.",
    exit: "It calls exit(). The kernel frees its memory and files; its PCB remains until the parent collects the exit status.",
  };
  const frames: Frame[] = [{ caption: "The five states and the only legal moves between them, each arrow labelled with what causes it. The steps that follow trace one process from creation to exit.", items: draw(null, -1) }];
  let cur = "new" as State;
  life.forEach((ev, k) => {
    const e = EDGES.findIndex((x) => x.from === cur && x.event === ev);
    if (e < 0) throw new Error(`states: no transition "${ev}" from ${cur}`);
    cur = EDGES[e].to;
    let caption = `${why[ev]}`;
    if (ev === "dispatch" && k > 1) caption = k === life.length - 2 ? "Dispatched again, it runs to its end." : "Dispatched again, it continues where it left off: its saved program counter was in its PCB.";
    frames.push({ caption, items: draw(cur, e) });
  });
  if (cur !== "terminated") throw new Error("states: the life should end terminated");
  return finish({ title: "Process states, and one process's life through them", input: "", frames });
}

/* ── A context switch ─────────────────────────────────────────────── */

function contextSwitch(): Walkthrough {
  const FIELDS = ["pc", "sp", "r1", "ptbr"] as const;
  type Regs = Record<(typeof FIELDS)[number], string>;
  const NAMES: Record<(typeof FIELDS)[number], string> = { pc: "PC", sp: "SP", r1: "R1", ptbr: "page table" };
  const cpu: Partial<Record<(typeof FIELDS)[number], { owner: string; v: string }>> = {};
  const p1: Regs = { pc: "0x401a", sp: "0x7ff0", r1: "42", ptbr: "0x1000" };
  const p2: Regs = { pc: "0x52c4", sp: "0x7f80", r1: "7", ptbr: "0x2000" };
  const pcb: Record<string, { state: string; saved: Partial<Regs> }> = { P1: { state: "running", saved: {} }, P2: { state: "ready", saved: { ...p2 } } };
  for (const f of FIELDS) cpu[f] = { owner: "P1", v: p1[f] };
  const CW = 74;
  const RH = 26;
  const CX = 130;
  const PY = 170;
  const draw = (o: { mode: string; hotPcb?: string; hot?: Set<string> }): Item[] => {
    const items: Item[] = [...region("cpu", CX - 52, 6, 176, 4 * (RH + 4) + 12, `CPU — ${o.mode}`, { labelTone: o.mode.startsWith("kernel") ? "accent" : "soft" })];
    FIELDS.forEach((f, k) => {
      const y = 12 + k * (RH + 4);
      items.push(label(`cl${f}`, NAMES[f], CX - 8, y + RH / 2, { anchor: "end", tone: "soft", size: 11 }));
      const c = cpu[f];
      items.push(c ? box(`${c.owner}-${f}`, CX, y, c.v, { w: CW, h: RH, size: 11.5, tone: o.hot?.has(`${c.owner}-${f}`) ? "accent" : "plain" }) : box(`cpu-${f}-x`, CX, y, "", { w: CW, h: RH, tone: "muted" }));
    });
    (["P1", "P2"] as const).forEach((p, j) => {
      const x = j ? 220 : -40;
      const b = pcb[p];
      items.push(...region(`pcb${p}`, x - 6, PY - 4, 162, 5 * (RH + 4) + 6, `PCB of ${p}`, { tone: o.hotPcb === p ? "accent" : "ghost", labelTone: o.hotPcb === p ? "accent" : "soft" }));
      items.push(label(`st${p}l`, "state", x + 68, PY + RH / 2, { anchor: "end", tone: "soft", size: 11 }));
      items.push(box(`st${p}`, x + 76, PY, b.state, { w: CW, h: RH, size: 11, tone: b.state === "running" ? "strong" : "plain" }));
      FIELDS.forEach((f, k) => {
        const y = PY + (k + 1) * (RH + 4);
        items.push(label(`${p}l${f}`, NAMES[f], x + 68, y + RH / 2, { anchor: "end", tone: "soft", size: 11 }));
        const v = b.saved[f];
        items.push(v ? box(`${p}-${f}`, x + 76, y, v, { w: CW, h: RH, size: 11.5, tone: o.hot?.has(`${p}-${f}`) ? "accent" : "plain" }) : box(`${p}-${f}-x`, x + 76, y, "", { w: CW, h: RH, tone: "muted" }));
      });
    });
    return items;
  };
  const frames: Frame[] = [];
  frames.push({ caption: `P1 is running: its program counter, stack pointer, registers and page-table base are live in the CPU. P2 is ready, and its PCB holds the values it had when it last stopped.`, items: draw({ mode: "user mode, P1" }) });
  // 1. Save P1.
  const saved = new Set<string>();
  for (const f of FIELDS) {
    pcb.P1.saved[f] = cpu[f]!.v;
    saved.add(`P1-${f}`);
    delete cpu[f];
  }
  pcb.P1.state = "ready";
  frames.push({ caption: "The timer interrupt enters the kernel. It saves P1's CPU state into P1's PCB and marks P1 ready — exactly what it needs to resume P1 later.", items: draw({ mode: "kernel mode", hotPcb: "P1", hot: saved }) });
  // 2. Pick P2.
  frames.push({ caption: "The scheduler picks the next process from the ready queue: P2. Nothing useful has run for either process since the interrupt; the switch is pure overhead.", items: draw({ mode: "kernel mode", hotPcb: "P2" }) });
  // 3. Switch the address space.
  cpu.ptbr = { owner: "P2", v: pcb.P2.saved.ptbr! };
  delete pcb.P2.saved.ptbr;
  frames.push({ caption: `The kernel loads P2's page-table base (${cpu.ptbr.v}) into the CPU: from now on addresses mean P2's memory, and the TLB's cached translations for P1 are useless. A switch between two threads of one process skips this step.`, items: draw({ mode: "kernel mode", hotPcb: "P2", hot: new Set(["P2-ptbr"]) }) });
  // 4. Restore P2's registers.
  for (const f of FIELDS) if (f !== "ptbr") {
    cpu[f] = { owner: "P2", v: pcb.P2.saved[f]! };
    delete pcb.P2.saved[f];
  }
  pcb.P2.state = "running";
  for (const f of FIELDS) if (cpu[f]!.v !== p2[f] || pcb.P1.saved[f] !== p1[f]) throw new Error(`context-switch: ${f} did not round-trip`);
  frames.push({ caption: `Finally it restores P2's registers and returns to user mode: P2 continues at ${p2.pc}, exactly where it stopped, unaware it was ever off the CPU.`, items: draw({ mode: "user mode, P2", hot: new Set(FIELDS.map((f) => `P2-${f}`)) }) });
  return finish({ title: "A context switch from P1 to P2", input: "", frames });
}

/* ── Counting fork() ──────────────────────────────────────────────── */

function forkTree(): Walkthrough {
  const FORKS = 3;
  const procs: Array<{ id: number; parent: number; born: number }> = [{ id: 0, parent: -1, born: 0 }];
  const frames: Frame[] = [];
  const draw = (upTo: number): Item[] => {
    const alive = procs.filter((p) => p.born <= upTo);
    const kids = (i: number) => alive.filter((p) => p.parent === i).map((p) => p.id);
    const at = treeLayout<number>(0, kids, { dx: 62, dy: 64 });
    const items: Item[] = [];
    for (const p of alive) if (p.parent >= 0) items.push(link(`e${p.id}`, at.get(p.parent)!, at.get(p.id)!, 18, { tone: p.born === upTo ? "accent" : "line" }));
    for (const p of alive) items.push({ k: "node", id: `n${p.id}`, x: at.get(p.id)!.x, y: at.get(p.id)!.y, r: 18, text: `P${p.id}`, tone: upTo > 0 && p.born === upTo ? "accent" : upTo === FORKS ? "strong" : "plain", size: 11.5 });
    items.push(label("cnt", `${alive.length} process${alive.length > 1 ? "es" : ""}`, 0, -34, { anchor: "start", tone: "accent", size: 12, weight: 600 }));
    return items;
  };
  frames.push({ caption: "One process, P0, is about to run fork(); fork(); fork(); and then a printf.", items: draw(0) });
  for (let k = 1; k <= FORKS; k++) {
    // Every process alive before this fork runs it, and each creates one child that continues after the same line.
    const before = procs.filter((p) => p.born < k);
    for (const p of before) procs.push({ id: procs.length, parent: p.id, born: k });
    const n = procs.filter((p) => p.born <= k).length;
    frames.push({
      caption: `Fork ${k}: ${before.length === 1 ? `P0 runs it and gets a child, P${n - 1}, so there are ${n}` : `each of the ${before.length} processes alive runs it and gets a child, doubling the count to ${n}`}.${k === FORKS ? ` The printf after them runs ${n} times: 2³ = ${2 ** FORKS} processes, ${n - 1} of them new.` : ""}`,
      items: draw(k),
    });
  }
  if (procs.length !== 2 ** FORKS) throw new Error("fork-tree: three forks should make eight processes");
  return finish({ title: "How many processes do three fork() calls make?", input: "fork(); fork(); fork(); printf(\"hi\\n\");", frames });
}

/* ── Threads of one process ───────────────────────────────────────── */

function threads(): Walkthrough {
  const SHARED = ["code", "global data", "heap", "open files", "signal handlers"];
  const T = 3;
  const CW = 108;
  const G = 10;
  const items: Item[] = [...region("proc", -10, -10, 3 * CW + 2 * G + 20, 246, "one process")];
  items.push(label("sh", "shared by all threads", 0, 12, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
  SHARED.forEach((s, k) => items.push(box(`s${k}`, (k % 3) * (CW + G), 24 + Math.floor(k / 3) * 32, s, { w: CW, h: 28, size: 11, tone: "accent" })));
  items.push(label("pr", "private to each thread", 0, 100, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }));
  for (let t = 0; t < T; t++) {
    const x = t * (CW + G);
    items.push(label(`tn${t}`, `thread ${t + 1}`, x + CW / 2, 120, { tone: "ink", size: 11.5, weight: 600, mono: true }));
    items.push(box(`tr${t}`, x, 130, "PC, registers", { w: CW, h: 26, size: 10.5 }));
    items.push(box(`ts${t}`, x, 160, "stack", { w: CW, h: 46, size: 11 }));
  }
  items.push(label("x1", "each also has its own thread ID and thread-local storage", 0, 222, { anchor: "start", tone: "soft", size: 10.5 }));
  return finish({
    title: "What threads share, and what each one owns",
    input: "",
    frames: [
      {
        caption: "Every thread of a process runs the same code against the same globals, heap and open files, so they share data without any IPC — and can corrupt it without synchronization. Each thread has its own program counter, registers and stack, which is all a thread switch must change.",
        items,
      },
    ],
  });
}

/* ── Multithreading models ────────────────────────────────────────── */

function threadingModels(): Walkthrough {
  const models: Array<{ name: string; kernel: number; map: number[]; note: string }> = [
    { name: "many-to-one", kernel: 1, map: [0, 0, 0, 0], note: "one blocks, all block" },
    { name: "one-to-one", kernel: 4, map: [0, 1, 2, 3], note: "Linux, Windows" },
    { name: "many-to-many", kernel: 2, map: [0, 1, 0, 1], note: "Go, virtual threads" },
  ];
  const PW = 144;
  const items: Item[] = [];
  items.push({ k: "node", id: "ku", x: 6, y: 168, r: 6, text: "", tone: "plain" });
  items.push(label("kut", "user thread", 18, 168, { anchor: "start", tone: "soft", size: 11 }));
  items.push(box("kk", 112, 160, "K", { w: 16, h: 16, size: 9.5, tone: "accent" }));
  items.push(label("kkt", "kernel thread", 134, 168, { anchor: "start", tone: "soft", size: 11 }));
  models.forEach((m, j) => {
    const x0 = j * PW;
    const ux = (i: number) => x0 + 16 + i * 30;
    const kx = (i: number) => x0 + 16 + ((m.map.length - 1) * 30) / 2 + (i - (m.kernel - 1) / 2) * (m.kernel === 4 ? 30 : 46);
    items.push(label(`mn${j}`, m.name, x0 + 61, -4, { tone: "ink", size: 12, weight: 700 }));
    m.map.forEach((k, i) => items.push(link(`m${j}-${i}`, { x: ux(i), y: 30 }, { x: kx(k), y: 110 }, 11, { tone: "line", rb: 14 })));
    m.map.forEach((_, i) => items.push({ k: "node", id: `u${j}-${i}`, x: ux(i), y: 30, r: 11, text: "", tone: "plain" }));
    for (let k = 0; k < m.kernel; k++) items.push(box(`k${j}-${k}`, kx(k) - 13, 97, "K", { w: 26, h: 26, size: 11, tone: "accent" }));
    items.push(label(`nt${j}`, m.note, x0 + 61, 136, { tone: "faint", size: 10.5 }));
  });
  for (const m of models) if (m.map.some((k) => k >= m.kernel)) throw new Error(`threading-models: ${m.name} maps to a missing kernel thread`);
  return finish({
    title: "Mapping user threads onto kernel threads",
    input: "",
    frames: [
      {
        caption: "Many-to-one runs all of a process's user threads on one kernel thread, one-to-one gives each user thread a kernel thread of its own, and many-to-many multiplexes many user threads onto fewer kernel threads, remapping them as threads block.",
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "address-space": addressSpace,
  states,
  "context-switch": contextSwitch,
  "fork-tree": forkTree,
  threads,
  "threading-models": threadingModels,
};
