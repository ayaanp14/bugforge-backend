import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { gantt, type GanttSlot } from "./kit.js";

/**
 * Introduction to Operating Systems: the note's figures
 * (content/notes/operating-systems/introduction-to-operating-systems.md
 * places each with "@figure <name>").
 *
 *  - layers: the stack from hardware to applications, with the mode line;
 *  - system-call: write(1, "hello\n", 6) run on a tiny machine — a mode
 *    bit, four registers, the x86-64 Linux system call table — from the
 *    library wrapper through the trap, the table lookup and the handler
 *    (which checks the buffer lies in user memory) back to user mode;
 *  - mode-switches: one process's run, its user and kernel time drawn
 *    from a list of events, one of each way into the kernel;
 *  - os-types: two jobs (CPU, I/O, CPU) run by a batch monitor, a
 *    multiprogramming scheduler and a time-sharing one, with the CPU's
 *    busy time and the second job's first run counted from each schedule;
 *  - kernel-designs: the same services placed in a monolithic kernel and
 *    in a microkernel, and the hops of one read() with every crossing of
 *    the user/kernel line counted.
 */

/* ── The layers ───────────────────────────────────────────────────── */

function layers(): Walkthrough {
  const W = 384;
  const H = 34;
  const G = 8;
  const rows: Array<{ name: string; parts: string[]; kernel: boolean; tone?: Tone }> = [
    { name: "applications", parts: ["browser", "editor", "shell"], kernel: false },
    { name: "system libraries", parts: ["libc: printf, fopen, malloc"], kernel: false },
    { name: "kernel", parts: ["scheduler", "memory", "file systems", "drivers"], kernel: true, tone: "accent" },
    { name: "hardware", parts: ["CPU", "RAM", "disk", "network card"], kernel: true, tone: "muted" },
  ];
  const items: Item[] = [];
  const top = (r: number) => r * (H + G) + (r >= 2 ? 44 : 0);
  rows.forEach((row, r) => {
    const n = row.parts.length;
    const w = (W - (n - 1) * 6) / n;
    items.push(label(`rn${r}`, row.name, -12, top(r) + H / 2, { anchor: "end", tone: "soft", size: 11.5, weight: 600 }));
    row.parts.forEach((p, k) => items.push(box(`b${r}-${k}`, k * (w + 6), top(r), p, { w, h: H, size: 11, tone: row.tone ?? "plain" })));
  });
  // The system call interface: the only door between the two halves.
  const lineY = top(2) - 22;
  items.push({ k: "edge", id: "mode", x1: -96, y1: lineY, x2: W, y2: lineY, tone: "ink", dashed: true });
  items.push(label("mu", "user mode", -96, lineY - 10, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
  items.push(label("mk", "kernel mode", -96, lineY + 10, { anchor: "start", tone: "accent", size: 11, weight: 600 }));
  items.push(label("sc", "system calls", W / 2, lineY, { tone: "ink", size: 11.5, weight: 700 }));
  items.push({ k: "band", id: "scb", x: W / 2 - 46, y: lineY - 9, w: 92, h: 18, tone: "plain" });
  // Draw the band under its text.
  const sc = items.pop()!;
  items.splice(items.length - 1, 0, sc);
  if (rows.filter((r) => !r.kernel).some((_, r) => top(r) > lineY)) throw new Error("layers: a user layer drawn below the mode line");
  return finish({
    title: "The layers of a computer system",
    input: "",
    frames: [
      {
        caption: "Programs run in user mode above the line and reach the hardware only through system calls; the kernel runs in kernel mode below it, with full control of the CPU, memory and devices. Libraries such as libc turn an ordinary call like printf into those system calls.",
        items,
      },
    ],
  });
}

/* ── A system call, step by step ──────────────────────────────────── */

/** The first entries of Linux's x86-64 system call table: the number is the index. */
const TABLE = ["read", "write", "open", "close"];
const USER_MEMORY: [number, number] = [0x400000, 0x7fffffff];
const hex = (n: number) => `0x${n.toString(16)}`;

function systemCall(): Walkthrough {
  const MSG = "hello\n";
  const MSG_AT = 0x402010;
  const cpu = { mode: "user", rax: null as number | null, rdi: null as number | null, rsi: null as number | null, rdx: null as number | null };
  const stdout: string[] = [];
  const memory = new Map<number, string>([[MSG_AT, MSG]]);
  const handlers: Record<string, (a: number, b: number, c: number) => number> = {
    write: (fd, buf, n) => {
      if (buf < USER_MEMORY[0] || buf + n > USER_MEMORY[1]) return -14; // -EFAULT
      if (fd !== 1) return -9; // -EBADF in this tiny machine
      stdout.push(memory.get(buf)!.slice(0, n));
      return n;
    },
  };
  const KX = 0;
  const RX = 340;
  const draw = (o: { hot: string[]; arrows: Item[]; row?: number; out?: boolean }): Item[] => {
    const hot = new Set(o.hot);
    const t = (id: string): Tone => (hot.has(id) ? "accent" : "plain");
    const items: Item[] = [
      ...region("ub", KX - 8, 18, 300, 56, "user mode"),
      ...region("kb", KX - 8, 110, 300, 132, "kernel mode", { labelTone: "accent" }),
      box("main", KX, 30, "main()", { w: 100, h: 32, size: 12, tone: t("main") }),
      box("libc", KX + 160, 30, "write() in libc", { w: 124, h: 32, size: 11.5, tone: t("libc") }),
      box("entry", KX, 124, "kernel entry", { w: 100, h: 32, size: 11.5, tone: t("entry") }),
      box("hand", KX, 196, "sys_write()", { w: 100, h: 32, size: 11.5, tone: t("hand") }),
      label("tl", "system call table", KX + 222, 122, { tone: "soft", size: 11, weight: 600 }),
    ];
    TABLE.forEach((name, k) => items.push(box(`tb${k}`, KX + 160, 132 + k * 26, `${k}  ${name}`, { w: 124, h: 24, size: 11.5, tone: o.row === k ? "accent" : "plain" })));
    // The CPU: its mode bit and the registers the call travels in.
    items.push(label("cpl", "CPU", RX + 50, 4, { tone: "soft", size: 11.5, weight: 600 }));
    items.push(box("mode", RX, 18, `mode: ${cpu.mode}`, { w: 104, h: 30, size: 12, tone: cpu.mode === "kernel" ? "strong" : "plain" }));
    const regs: Array<[string, number | null, string]> = [
      ["rax", cpu.rax, "number / result"],
      ["rdi", cpu.rdi, "fd"],
      ["rsi", cpu.rsi, "buf"],
      ["rdx", cpu.rdx, "count"],
    ];
    regs.forEach(([n, v, what], k) => {
      const y = 62 + k * 40;
      items.push(label(`rl${k}`, n, RX, y + 13, { anchor: "start", tone: "ink", size: 11.5, mono: true, weight: 600 }));
      items.push(box(`r${k}`, RX + 32, y, v === null ? "–" : n === "rsi" ? hex(v) : v, { w: 72, h: 26, size: 11.5, tone: hot.has(n) ? "accent" : "plain" }));
      items.push(label(`rw${k}`, what, RX + 32, y + 33, { anchor: "start", tone: "faint", size: 10 }));
    });
    if (o.out) items.push(box("out", RX, 226, `stdout: ${stdout.join("").trim()}`, { w: 104, h: 28, size: 11.5, tone: "strong" }));
    return [...items, ...o.arrows];
  };
  const frames: Frame[] = [];
  frames.push({
    caption: `main() calls write(1, msg, ${MSG.length}) to print "hello" and a newline. That is an ordinary function call into the C library: the CPU is still in user mode.`,
    items: draw({ hot: ["main", "libc"], arrows: [arrow("a1", { x: KX + 101, y: 46 }, { x: KX + 158, y: 46 }, { tone: "accent" })] }),
  });
  const number = TABLE.indexOf("write");
  cpu.rax = number;
  cpu.rdi = 1;
  cpu.rsi = MSG_AT;
  cpu.rdx = MSG.length;
  frames.push({
    caption: `The wrapper puts write's system call number, ${number}, in rax and the three arguments in rdi, rsi and rdx, then executes the syscall instruction — the trap.`,
    items: draw({ hot: ["libc", "rax", "rdi", "rsi", "rdx"], arrows: [arrow("a2", { x: KX + 222, y: 63 }, { x: KX + 60, y: 122 }, { tone: "accent", bow: -20 })] }),
  });
  cpu.mode = "kernel";
  const name = TABLE[cpu.rax];
  if (name !== "write") throw new Error("system-call: the table lookup should find write");
  frames.push({
    caption: `The CPU switches to kernel mode and jumps to the kernel's one fixed entry point, which uses rax as an index into the system call table: entry ${cpu.rax} is ${name}.`,
    items: draw({ hot: ["entry", "rax"], row: cpu.rax, arrows: [arrow("a3", { x: KX + 101, y: 140 }, { x: KX + 158, y: 132 + cpu.rax * 26 + 12 }, { tone: "accent" })] }),
  });
  const result = handlers[name](cpu.rdi, cpu.rsi, cpu.rdx);
  if (result !== MSG.length) throw new Error(`system-call: write returned ${result}`);
  frames.push({
    caption: `sys_write first checks the arguments — the buffer at ${hex(MSG_AT)} must lie in the caller's own memory — then writes ${result} bytes to file descriptor 1, the terminal.`,
    items: draw({ hot: ["hand"], row: number, out: true, arrows: [arrow("a4", { x: KX + 158, y: 132 + number * 26 + 12 }, { x: KX + 101, y: 210 }, { tone: "accent", bow: 14 })] }),
  });
  cpu.rax = result;
  cpu.mode = "user";
  frames.push({
    caption: `The result, ${result} bytes written, goes back in rax; the return instruction switches the CPU to user mode, and the wrapper returns ${result} to main(). On failure it would return −1 and set errno.`,
    items: draw({ hot: ["main", "rax"], out: true, arrows: [arrow("a5", { x: KX + 158, y: 52 }, { x: KX + 101, y: 52 }, { tone: "accent" })] }),
  });
  return finish({ title: "One system call, from the library to the kernel and back", input: `write(1, "hello\\n", 6) on x86-64 Linux`, frames });
}

/* ── Entering the kernel ──────────────────────────────────────────── */

function modeSwitches(): Walkthrough {
  // One process's run: the user-mode stretches between the events that enter the kernel.
  const events = [
    { at: 2, len: 1, kind: "system call", why: "read()" },
    { at: 5, len: 1, kind: "interrupt", why: "disk done" },
    { at: 8, len: 1, kind: "exception", why: "page fault" },
    { at: 11, len: 1, kind: "timer", why: "slice over" },
  ];
  const END = 13;
  const U = 32;
  const UY = 30;
  const KY = 110;
  const pts: Array<[number, number]> = [[0, UY]];
  for (const e of events) {
    if (e.at * U < pts[pts.length - 1][0]) throw new Error("mode-switches: events overlap");
    pts.push([e.at * U, UY], [e.at * U, KY], [(e.at + e.len) * U, KY], [(e.at + e.len) * U, UY]);
  }
  pts.push([END * U, UY]);
  const items: Item[] = [
    label("lu", "user mode", -10, UY, { anchor: "end", tone: "ink", size: 11.5, weight: 600 }),
    label("lk", "kernel mode", -10, KY, { anchor: "end", tone: "accent", size: 11.5, weight: 600 }),
    { k: "edge", id: "gu", x1: 0, y1: UY, x2: END * U, y2: UY, tone: "faint", dashed: true },
    { k: "edge", id: "gk", x1: 0, y1: KY, x2: END * U, y2: KY, tone: "faint", dashed: true },
    { k: "path", id: "run", pts, tone: "accent", width: 2.4 },
  ];
  events.forEach((e, k) => {
    items.push(label(`ek${k}`, e.kind, (e.at + e.len / 2) * U, KY + 18, { tone: "ink", size: 11, weight: 600 }));
    items.push(label(`ew${k}`, e.why, (e.at + e.len / 2) * U, KY + 33, { tone: "faint", size: 10.5 }));
    items.push({ k: "edge", id: `ea${k}`, x1: e.at * U - 6, y1: UY + 14, x2: e.at * U - 6, y2: KY - 14, tone: "ink", arrow: true });
  });
  items.push(label("tm", "time →", END * U, UY - 18, { anchor: "end", tone: "faint", size: 10.5 }));
  return finish({
    title: "How a running program enters the kernel",
    input: "",
    frames: [
      {
        caption: `The process runs in user mode and drops into kernel mode ${events.length} times, once for each way in: a system call it makes, an interrupt from a device, an exception its own instruction causes, and the timer — which is how the kernel takes the CPU back from any program.`,
        items,
      },
    ],
  });
}

/* ── Batch, multiprogramming, time-sharing ────────────────────────── */

interface Job {
  name: string;
  /** CPU, I/O, CPU, … in time units. */
  bursts: number[];
}

/**
 * Two jobs on one CPU; each job's I/O runs on its own device, beside the
 * CPU. `batch` never switches; `multi` switches when the running job
 * starts I/O; `quantum` also preempts after that many units.
 */
function runJobs(jobs: readonly Job[], policy: "batch" | "multi" | "share", quantum = 2) {
  const st = jobs.map((j) => ({ phase: 0, left: j.bursts[0], state: "ready" as "ready" | "running" | "io" | "done", first: -1 }));
  const queue: number[] = jobs.map((_, i) => i);
  const slots: GanttSlot[] = [];
  let cur = -1;
  let used = 0;
  let t = 0;
  const push = (who: string) => {
    const last = slots[slots.length - 1];
    if (last && last.who === who && last.to === t) last.to++;
    else slots.push({ who, from: t, to: t + 1 });
  };
  const nextPhase = (i: number) => {
    st[i].phase++;
    if (st[i].phase >= jobs[i].bursts.length) st[i].state = "done";
    else {
      st[i].left = jobs[i].bursts[st[i].phase];
      st[i].state = st[i].phase % 2 ? "io" : "ready";
      if (st[i].state === "ready") queue.push(i);
    }
  };
  while (st.some((s) => s.state !== "done") && t < 100) {
    // A batch monitor keeps the machine for the current job, even through its I/O.
    if (cur < 0 || st[cur].state !== "running") {
      if (policy === "batch" && cur >= 0 && st[cur].state !== "done") {
        // waiting on its own I/O: the CPU idles
      } else {
        cur = -1;
        if (policy === "batch") {
          const i = st.findIndex((s) => s.state !== "done");
          if (i >= 0 && st[i].state === "ready") {
            queue.splice(queue.indexOf(i), 1);
            cur = i;
          }
        } else if (queue.length) cur = queue.shift()!;
        if (cur >= 0) {
          st[cur].state = "running";
          used = 0;
        }
      }
    }
    const running = cur >= 0 && st[cur].state === "running" ? cur : -1;
    if (running >= 0) {
      push(jobs[running].name);
      if (st[running].first < 0) st[running].first = t;
      st[running].left--;
      used++;
    } else push("idle");
    for (let i = 0; i < jobs.length; i++) if (st[i].state === "io") {
      st[i].left--;
      if (st[i].left === 0) {
        nextPhase(i);
        if (policy === "batch" && st[i].state === "ready") queue.splice(queue.indexOf(i), 1, i);
      }
    }
    t++;
    if (running >= 0) {
      if (st[running].left === 0) {
        nextPhase(running);
        if (policy !== "batch") cur = -1;
      } else if (policy === "share" && used >= quantum && queue.length) {
        st[running].state = "ready";
        queue.push(running);
        cur = -1;
      }
    }
    if (policy === "batch" && cur >= 0 && st[cur].state === "ready") {
      queue.splice(queue.indexOf(cur), 1);
      st[cur].state = "running";
      used = 0;
    }
    if (policy === "batch" && cur >= 0 && st[cur].state === "done") cur = -1;
  }
  const end = t;
  const busy = slots.filter((s) => s.who !== "idle").reduce((a, s) => a + s.to - s.from, 0);
  const needed = jobs.reduce((a, j) => a + j.bursts.filter((_, k) => k % 2 === 0).reduce((x, y) => x + y, 0), 0);
  if (busy !== needed) throw new Error(`os-types ${policy}: the CPU was busy ${busy}, the jobs need ${needed}`);
  return { slots, end, busy, first: st.map((s) => s.first) };
}

function osTypes(): Walkthrough {
  const jobs: Job[] = [
    { name: "A", bursts: [3, 3, 2] },
    { name: "B", bursts: [2, 2, 3] },
  ];
  const U = 24;
  const runs = [
    { name: "batch", r: runJobs(jobs, "batch") },
    { name: "multiprogramming", r: runJobs(jobs, "multi") },
    { name: "time-sharing, q = 2", r: runJobs(jobs, "share", 2) },
  ];
  const items: Item[] = [];
  runs.forEach(({ name, r }, k) => {
    const y = k * 66;
    items.push(label(`n${k}`, name, 0, y - 12, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }));
    items.push(...gantt(`g${k}-`, r.slots.map((s) => ({ ...s, tone: s.who === "idle" ? ("muted" as const) : s.who === "B" ? ("accent" as const) : undefined })), { unit: U, h: 26, y }).items);
    items.push(label(`u${k}`, `busy ${r.busy}/${r.end}`, 16 * U, y + 13, { anchor: "start", tone: "soft", size: 11, mono: true }));
  });
  const [b, m, s] = runs.map((x) => x.r);
  const pct = (r: typeof b) => Math.round((100 * r.busy) / r.end);
  if (!(pct(m) > pct(b) && s.first[1] < m.first[1])) throw new Error("os-types: multiprogramming should raise utilisation, time-sharing should start B sooner");
  return finish({
    title: "The same two jobs under batch, multiprogramming and time-sharing",
    input: "A: CPU 3, I/O 3, CPU 2.  B: CPU 2, I/O 2, CPU 3",
    frames: [
      {
        caption: `Batch leaves the CPU idle whenever the running job waits for I/O: busy ${pct(b)}% of the time. Multiprogramming gives the CPU to B while A waits: ${pct(m)}%. Time-sharing also preempts every 2 units, so B first runs at ${s.first[1]} instead of ${m.first[1]} — a quicker response.`,
        items,
      },
    ],
  });
}

/* ── Monolithic kernel against microkernel ────────────────────────── */

function kernelDesigns(): Walkthrough {
  const SW = 100;
  const SG = 10;
  const slotX = (k: number) => k * (SW + SG);
  const UY = 24;
  const K1 = 106;
  const K2 = 142;
  const SERVICES = ["file system", "disk driver", "network"];
  const CORE = ["scheduler", "memory", "IPC"];
  /** One design: where each service lives, and the hops of read() through it. */
  const design = (micro: boolean) => {
    const at = new Map<string, { x: number; y: number; user: boolean }>();
    at.set("app", { x: slotX(0), y: UY, user: true });
    SERVICES.forEach((s, k) => at.set(s, { x: slotX(k + 1), y: micro ? UY : K1, user: micro }));
    CORE.forEach((s, k) => at.set(s, { x: slotX(k + 1), y: K2, user: false }));
    // read(): the app asks the file system, which asks the disk driver; in a microkernel every request and reply is a message through the kernel's IPC.
    const calls = ["app", "file system", "disk driver", "file system", "app"];
    const hops: string[] = [calls[0]];
    for (let k = 1; k < calls.length; k++) {
      if (micro) hops.push("IPC");
      hops.push(calls[k]);
    }
    const userOf = (h: string) => (h === "IPC" ? false : at.get(h)!.user);
    let crossings = 0;
    for (let k = 1; k < hops.length; k++) if (userOf(hops[k]) !== userOf(hops[k - 1])) crossings++;
    return { at, hops, crossings, userOf };
  };
  const draw = (micro: boolean): Item[] => {
    const d = design(micro);
    const items: Item[] = [
      ...region("ub", -8, UY - 12, 4 * (SW + SG) + 6, 54, "user mode"),
      ...region("kb", -8, K1 - 12, 4 * (SW + SG) + 6, K2 - K1 + 54, micro ? "kernel mode: a microkernel" : "kernel mode: one monolithic kernel", { labelTone: "accent" }),
    ];
    for (const [name, p] of d.at) items.push(box(`s${name}`, p.x, p.y, name, { w: SW, h: 30, size: 11.5, tone: name === "app" ? "plain" : p.user ? "plain" : "accent" }));
    // The hops of one read(), left to right, coloured by the mode each runs in.
    const HY = K2 + 74;
    items.push(label("hl", "one read():", -8, HY - 12, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    const TW = 40;
    const short: Record<string, string> = { app: "app", "file system": "FS", "disk driver": "drv", IPC: "IPC" };
    d.hops.forEach((h, k) => {
      items.push(box(`h${k}`, k * (TW + 8), HY, short[h], { w: TW, h: 24, size: 11, tone: d.userOf(h) ? "plain" : "accent" }));
      if (k) items.push(arrow(`ha${k}`, { x: k * (TW + 8) - 7, y: HY + 12 }, { x: k * (TW + 8) - 1, y: HY + 12 }, { tone: "ink" }));
    });
    items.push(label("hc", `${d.crossings} mode switches`, 4 * (SW + SG) - 4, HY - 12, { anchor: "end", tone: "accent", size: 12, weight: 700, mono: true }));
    return items;
  };
  const mono = design(false);
  const micro = design(true);
  if (mono.crossings !== 2) throw new Error(`kernel-designs: a monolithic read() should cross twice, got ${mono.crossings}`);
  return finish({
    title: "Monolithic kernel and microkernel: where the services run",
    input: "",
    frames: [
      {
        caption: `A monolithic kernel runs the file system and drivers in kernel mode beside the scheduler. A read() is one system call: in, then out — ${mono.crossings} mode switches — and inside the kernel the file system calls the driver as an ordinary function.`,
        items: draw(false),
      },
      {
        caption: `A microkernel moves the file system, drivers and network stack out into user-mode servers and keeps only scheduling, memory and IPC. The same read() becomes messages through the kernel: ${micro.crossings} mode switches, the price paid for a driver crash that no longer brings the system down.`,
        items: draw(true),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  layers,
  "system-call": systemCall,
  "mode-switches": modeSwitches,
  "os-types": osTypes,
  "kernel-designs": kernelDesigns,
};
