import { finish, round, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { lifelines, message } from "./kit.js";

/**
 * Inter-Process Communication: the note's figures
 * (content/notes/operating-systems/inter-process-communication.md places
 * each with "@figure <name>").
 *
 * Each figure runs a small model of the kernel object it draws. The two
 * models count the system calls and copies a few messages cost each way.
 * The pipe animation runs a bounded byte buffer between a writer and a
 * reader, so blocking, partial transfer and end of file fall out of the
 * run. The shell pipeline replays pipe/fork/dup2/close on per-process
 * descriptor tables that hand out the lowest free number, as Unix does.
 * The boundaries figure feeds the same writes to a byte stream and to a
 * message queue, then to a queue ordered by priority. The socket sequence
 * numbers its descriptors by the same lowest-free rule. Each generator
 * throws when its run disagrees with what the note says.
 */

/* ── Lean items ───────────────────────────────────────────────────── */

function cell(id: string, x: number, y: number, w: number, h: number, text: string | number, tone: Tone = "plain", size?: number): Item {
  const it: Item = { k: "cell", id, x, y, w, h, text: String(text) };
  if (tone !== "plain") it.tone = tone;
  if (size) it.size = size;
  return it;
}

function txt(id: string, x: number, y: number, text: string, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  const it: Item = { k: "text", id, x, y, text, anchor: o.anchor ?? "middle", size: o.size ?? 12 };
  if (o.tone && o.tone !== "ink") it.tone = o.tone;
  if (o.mono === false) it.mono = false;
  if (o.weight) it.weight = o.weight;
  return it;
}

function line(id: string, x1: number, y1: number, x2: number, y2: number, tone: LineTone = "ink", o: { head?: boolean; dashed?: boolean; label?: string; bow?: number } = {}): Item {
  const it: Item = { k: "edge", id, x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2), tone };
  if (o.head !== false) it.arrow = true;
  if (o.dashed) it.dashed = true;
  if (o.label) it.label = o.label;
  if (o.bow) it.bow = o.bow;
  return it;
}

/* ── Shared memory and message passing ────────────────────────────── */

function twoModels(): Walkthrough {
  const MESSAGES = ["m1", "m2", "m3"];
  // After setup, a shared-memory transfer is a store and a load; a message is a send and a receive, each a system call that copies.
  const cost = (model: "shared" | "message") => {
    let calls = 0;
    let copies = 0;
    for (const _ of MESSAGES) {
      if (model === "message") {
        calls += 2;
        copies += 2;
      }
    }
    return { calls, copies };
  };
  const shm = cost("shared");
  const msg = cost("message");
  if (shm.calls !== 0 || msg.calls !== 2 * MESSAGES.length || msg.copies !== 2 * MESSAGES.length) throw new Error("two-models: the per-message costs disagree with the note");

  const PW = 120;
  const AX = 0;
  const BX = 280;
  const KY = 170;
  const W = BX + PW;
  const draw = (model: "shared" | "message"): Item[] => {
    const items: Item[] = [];
    // The two processes, each with its own address space drawn as a column.
    [
      ["A", AX, "writer"],
      ["B", BX, "reader"],
    ].forEach(([name, x, role]) => {
      const px = x as number;
      items.push(txt(`h${name}`, px + PW / 2, -12, `process ${name} (${role})`, { tone: "soft", size: 11, mono: false, weight: 600 }));
      items.push(cell(`as${name}`, px, 0, PW, 110, "", "plain"));
      items.push(cell(`code${name}`, px + 10, 8, PW - 20, 22, "code, data", "muted", 11));
      items.push(cell(`stk${name}`, px + 10, 78, PW - 20, 22, "stack", "muted", 11));
      items.push(cell(`reg${name}`, px + 10, 43, PW - 20, 24, model === "shared" ? "shared region" : "buffer", model === "shared" ? "accent" : "plain", 11));
    });
    // The kernel underneath both.
    items.push(cell("kernel", AX, KY, W - AX, 46, "", "muted"));
    items.push(txt("kl", AX + 8, KY + 12, "kernel", { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
    if (model === "shared") {
      // One physical region, mapped into both address spaces.
      items.push(cell("phys", W / 2 - 56, 43, 112, 24, "physical page", "strong", 11));
      items.push(line("mA", AX + PW - 8, 55, W / 2 - 59, 55, "accent"));
      items.push(line("mB", W / 2 + 59, 55, BX + 8, 55, "accent"));
      items.push(txt("mAt", (AX + PW + W / 2 - 56) / 2, 80, "store", { tone: "accent", size: 11, weight: 600 }));
      items.push(txt("mBt", (W / 2 + 56 + BX) / 2, 80, "load", { tone: "accent", size: 11, weight: 600 }));
      items.push(line("setup", W / 2, KY - 2, W / 2, 70, "line", { dashed: true }));
      items.push(txt("st", W / 2 + 6, 120, "mapped once at setup", { anchor: "start", tone: "faint", size: 11, mono: false }));
      items.push(txt("sum", W / 2, KY + 30, `${MESSAGES.length} messages: ${shm.calls} system calls, ${shm.copies} copies by the kernel`, { size: 11.5, weight: 600, tone: "accent" }));
    } else {
      // A queue inside the kernel; send copies in, receive copies out.
      MESSAGES.forEach((m, i) => items.push(cell(`q${i}`, W / 2 - 54 + i * 38, KY + 8, 34, 30, m, "accent", 11.5)));
      items.push(line("send", AX + PW / 2, 112, W / 2 - 58, KY + 22, "accent", { label: "send(): copy in" }));
      items.push(line("recv", W / 2 + 62, KY + 22, BX + PW / 2, 112, "accent", { label: "receive(): copy out" }));
      items.push(txt("sum", W / 2, KY + 64, `${MESSAGES.length} messages: ${msg.calls} system calls, ${msg.copies} copies by the kernel`, { size: 11.5, weight: 600, tone: "accent" }));
    }
    return items;
  };
  return finish({
    title: "Shared memory and message passing between two processes",
    input: `process A sends ${MESSAGES.length} messages to process B`,
    frames: [
      { caption: `Shared memory: the kernel maps one physical page into both address spaces once, and afterwards A stores and B loads with ordinary instructions. ${MESSAGES.length} messages cost no system calls and no copies, and nothing stops A and B colliding.`, items: draw("shared") },
      { caption: `Message passing: every send is a system call that copies the message into a kernel queue, and every receive a second one that copies it out. ${MESSAGES.length} messages cost ${msg.calls} system calls and ${msg.copies} copies, but the kernel orders and synchronizes them.`, items: draw("message") },
    ],
  });
}

/* ── A pipe as a bounded buffer ───────────────────────────────────── */

function pipe(): Walkthrough {
  const CAP = 8;
  const DATA = "hello world";
  const buf: string[] = [];
  let writeOpen = true;
  let pending = DATA.split("");
  const steps: Array<{ buf: string[]; writer: string; reader: string; hot: "w" | "r" | "c"; caption: string }> = [];
  const write = () => {
    let n = 0;
    while (pending.length && buf.length < CAP) {
      buf.push(pending.shift()!);
      n++;
    }
    return n;
  };
  const read = (max: number): string | 0 => {
    if (!buf.length) return writeOpen ? "" : 0;
    return buf.splice(0, max).join("");
  };
  const show = (s: string) => s.replace(/ /g, "␣");
  steps.push({ buf: [...buf], writer: "holds fd[1], the write end", reader: "holds fd[0], the read end", hot: "c", caption: `pipe(fd) made a kernel buffer with a read end and a write end, and fork() gave the child both. Each process closed the end it does not use: the parent writes, the child reads. The buffer holds ${CAP} bytes here, 64 KB on Linux.` });
  const first = write();
  if (first !== CAP || pending.length !== DATA.length - CAP) throw new Error("pipe: the first write should fill the buffer");
  steps.push({ buf: [...buf], writer: `write(fd[1], "${DATA}", ${DATA.length}): blocked`, reader: "", hot: "w", caption: `The parent writes ${DATA.length} bytes. ${first} fit and the buffer is full, so the write blocks with ${pending.length} bytes still to go: a pipe is a bounded buffer and the kernel makes the writer wait.` });
  const r1 = read(5);
  if (r1 !== "hello") throw new Error("pipe: the first read should return hello");
  steps.push({ buf: [...buf], writer: `write(…): still blocked`, reader: `read(fd[0], buf, 5) = 5: "${r1}"`, hot: "r", caption: `The child reads 5 bytes and gets "${r1}", the oldest bytes first. That frees 5 bytes of space.` });
  const second = write();
  if (pending.length) throw new Error("pipe: the rest should fit now");
  steps.push({ buf: [...buf], writer: `write(…) = ${DATA.length}, the last ${second} went in`, reader: "", hot: "w", caption: `The writer wakes, puts its last ${second} bytes in and the call returns ${DATA.length}. The child never sees where one write ended and the next began; a pipe carries only bytes.` });
  writeOpen = false;
  steps.push({ buf: [...buf], writer: "close(fd[1])", reader: "", hot: "w", caption: "The parent closes the write end. No process holds it now, which the reader will notice only once the buffer is empty." });
  const r2 = read(16);
  if (r2 !== " world") throw new Error("pipe: the second read should return the rest");
  steps.push({ buf: [...buf], writer: "", reader: `read(fd[0], buf, 16) = ${String(r2).length}: "${show(String(r2))}"`, hot: "r", caption: `The child asks for 16 bytes and gets the ${String(r2).length} that are there: a read returns what is available rather than waiting to fill its buffer.` });
  const r3 = read(16);
  if (r3 !== 0) throw new Error("pipe: the last read should be end of file");
  steps.push({ buf: [...buf], writer: "", reader: "read(fd[0], buf, 16) = 0: end of file", hot: "r", caption: "The buffer is empty and every write end is closed, so read returns 0, end of file. Had the child kept its own copy of fd[1] open, this read would block for ever." });

  const CW = 30;
  const BX0 = 60;
  const BY = 86;
  const frames: Frame[] = steps.map((st) => {
    const items: Item[] = [];
    // Parent above on the right (it feeds the tail), child below on the left (it takes from the head).
    const bw = CAP * (CW + 4) - 4;
    items.push(cell("par", BX0 + bw - 180, 0, 180, 30, "parent (writer)", st.hot === "w" ? "accent" : "plain", 12));
    items.push(txt("pw", BX0 + bw - 30, 46, st.writer, { anchor: "end", size: 11, tone: st.writer.includes("blocked") ? "error" : "ink" }));
    items.push(txt("kl", BX0 - 8, BY - 12, "kernel buffer", { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
    for (let i = 0; i < CAP; i++) {
      const ch = st.buf[i];
      items.push(cell(`b${i}`, BX0 + i * (CW + 4), BY, CW, 30, ch === undefined ? "" : show(ch), ch === undefined ? "ghost" : "accent", 13));
    }
    items.push(txt("full", BX0 + bw + 8, BY + 15, `${st.buf.length}/${CAP}`, { anchor: "start", size: 11, tone: st.buf.length === CAP ? "error" : "soft" }));
    // Bytes go in at the tail (the right) and come out at the head (the left).
    items.push(line("in", BX0 + bw - 15, 32, BX0 + bw - 15, BY - 3, st.hot === "w" && st.writer.includes("write") ? "accent" : "line"));
    items.push(line("out", BX0 + 15, BY + 33, BX0 + 30, BY + 80, st.hot === "r" ? "accent" : "line"));
    items.push(cell("chi", BX0 - 40, BY + 84, 180, 30, "child (reader)", st.hot === "r" ? "accent" : "plain", 12));
    items.push(txt("cr", BX0 - 40, BY + 128, st.reader, { anchor: "start", size: 11, tone: st.reader.includes("end of file") ? "accent" : "ink", weight: st.reader.includes("end of file") ? 700 : undefined }));
    return { caption: st.caption, items };
  });
  return finish({ title: "A pipe: a one-way byte stream through a bounded kernel buffer", input: `the parent writes "${DATA}"; the buffer holds ${CAP} bytes`, frames });
}

/* ── ls | wc -l ───────────────────────────────────────────────────── */

function shellPipeline(): Walkthrough {
  type Target = "terminal" | "pipe read end" | "pipe write end";
  type Table = Map<number, Target>;
  const terminal = (): Table => new Map<number, Target>([[0, "terminal"], [1, "terminal"], [2, "terminal"]]);
  const lowestFree = (t: Table) => {
    let fd = 0;
    while (t.has(fd)) fd++;
    return fd;
  };
  // The shell's calls, replayed.
  const shell = terminal();
  const rfd = lowestFree(shell);
  shell.set(rfd, "pipe read end");
  const wfd = lowestFree(shell);
  shell.set(wfd, "pipe write end");
  if (rfd !== 3 || wfd !== 4) throw new Error(`shell: pipe() gave ${rfd}, ${wfd}`);
  const afterPipe = new Map(shell);
  const ls = new Map(shell); // fork
  const wc = new Map(shell); // fork
  const afterFork = { ls: new Map(ls), wc: new Map(wc) };
  const dup2 = (t: Table, from: number, to: number) => t.set(to, t.get(from)!);
  dup2(ls, wfd, 1);
  ls.delete(rfd);
  ls.delete(wfd);
  dup2(wc, rfd, 0);
  wc.delete(rfd);
  wc.delete(wfd);
  shell.delete(rfd);
  shell.delete(wfd);
  // Who still holds each end: the reader gets end of file only when no write end is left but ls's.
  const holders = (end: Target) => [ls, wc, shell].filter((t) => [...t.values()].includes(end)).length;
  if (ls.get(1) !== "pipe write end" || wc.get(0) !== "pipe read end" || holders("pipe write end") !== 1 || holders("pipe read end") !== 1) throw new Error("shell: the pipeline is wired wrong");

  const TW = 150;
  const RH = 22;
  const table = (prefix: string, title: string, t: Table, x: number, y: number, hot: Set<number>): Item[] => {
    const items: Item[] = [txt(`${prefix}h`, x + TW / 2, y - 12, title, { tone: "soft", size: 11, mono: false, weight: 600 })];
    const fds = [0, 1, 2, 3, 4];
    fds.forEach((fd, i) => {
      const target = t.get(fd);
      items.push(cell(`${prefix}f${fd}`, x, y + i * RH, 24, RH - 3, fd, "muted", 11));
      items.push(cell(`${prefix}t${fd}`, x + 26, y + i * RH, TW - 26, RH - 3, target ?? "closed", target === undefined ? "ghost" : target === "terminal" ? "plain" : hot.has(fd) ? "strong" : "accent", 11));
    });
    return items;
  };
  const PX = 175;
  const PY = 136;
  const pipeBox = (live: boolean): Item[] => [cell("pipe", PX, PY, 150, 30, "pipe buffer", live ? "accent" : "plain", 12)];
  const frames: Frame[] = [
    {
      caption: `The shell calls pipe(): descriptors are handed out lowest free first, and 0, 1 and 2 are taken, so the read end is ${rfd} and the write end ${wfd}.`,
      items: [...table("s", "shell", afterPipe, PX, 0, new Set()), ...pipeBox(true)],
    },
    {
      caption: `It forks twice. Each child starts with a copy of the shell's table, so both hold ${rfd} and ${wfd} as well as the terminal on 0, 1 and 2.`,
      items: [...table("a", "child 1, to run ls", afterFork.ls, 0, 0, new Set()), ...table("b", "child 2, to run wc -l", afterFork.wc, 350, 0, new Set()), ...pipeBox(true)],
    },
    {
      caption: `Child 1 calls dup2(${wfd}, 1), child 2 dup2(${rfd}, 0); both close ${rfd} and ${wfd} and exec, and the shell closes its copies too. Now ls writes its standard output into the pipe and wc reads its standard input from it, and only ls holds a write end.`,
      items: [
        ...table("a", "ls", ls, 0, 0, new Set([1])),
        ...table("b", "wc -l", wc, 350, 0, new Set([0])),
        ...pipeBox(true),
        line("w", TW + 3, 1 * RH + 9, PX - 3, PY + 15, "accent", { label: "stdout" }),
        line("r", PX + 153, PY + 15, 350 - 3, 0 * RH + 9, "accent", { label: "stdin" }),
      ],
    },
  ];
  return finish({ title: "How a shell wires ls | wc -l with a pipe", input: "ls | wc -l", frames });
}

/* ── Message boundaries and priorities ────────────────────────────── */

function boundaries(): Walkthrough {
  const WRITES = ["ab", "cd"];
  // A byte stream concatenates; a queue keeps each message whole.
  const stream = WRITES.join("");
  const pipeRead = stream.slice(0, 16);
  const queue = [...WRITES];
  const queueReads = [queue.shift()!, queue.shift()!];
  if (pipeRead !== "abcd" || queueReads.join("|") !== "ab|cd") throw new Error("boundaries: the stream or the queue misbehaves");
  // POSIX message queues: highest priority first, oldest first within a priority.
  const SENT = [
    { text: "log", prio: 1 },
    { text: "stop", prio: 5 },
    { text: "log2", prio: 1 },
  ];
  const order = SENT.map((m, i) => ({ ...m, i })).sort((a, b) => b.prio - a.prio || a.i - b.i);
  if (order.map((m) => m.text).join() !== "stop,log,log2") throw new Error("boundaries: priority order is wrong");

  const CW = 26;
  const rowStream = (y: number): Item[] => {
    const items: Item[] = [txt("ph", 0, y - 14, "pipe: a byte stream", { anchor: "start", size: 12, mono: false, weight: 600 })];
    items.push(txt("pw", 0, y + 14, `write "${WRITES[0]}", write "${WRITES[1]}"`, { anchor: "start", size: 11 }));
    stream.split("").forEach((c, i) => items.push(cell(`ps${i}`, 190 + i * (CW + 2), y, CW, 28, c, "accent", 12)));
    items.push(txt("pr", 310, y + 14, `read(16) = "${pipeRead}"`, { anchor: "start", size: 11, weight: 700 }));
    return items;
  };
  const rowQueue = (y: number): Item[] => {
    const items: Item[] = [txt("qh", 0, y - 14, "message queue: whole messages", { anchor: "start", size: 12, mono: false, weight: 600 })];
    items.push(txt("qw", 0, y + 14, `send "${WRITES[0]}", send "${WRITES[1]}"`, { anchor: "start", size: 11 }));
    WRITES.forEach((m, i) => items.push(cell(`qm${i}`, 190 + i * 58, y, 54, 28, m, "accent", 12)));
    items.push(txt("qr", 310, y + 4, `receive = "${queueReads[0]}"`, { anchor: "start", size: 11, weight: 700, tone: "accent" }));
    items.push(txt("qr2", 310, y + 24, `receive = "${queueReads[1]}"`, { anchor: "start", size: 11, weight: 700, tone: "accent" }));
    return items;
  };
  const prio = (): Item[] => {
    const items: Item[] = [txt("oh", 0, -14, "POSIX queue: highest priority first", { anchor: "start", size: 12, mono: false, weight: 600 })];
    SENT.forEach((m, i) => items.push(txt(`os${i}`, 0, 14 + i * 34, `send "${m.text}", priority ${m.prio}`, { anchor: "start", size: 11 })));
    order.forEach((m, k) => {
      items.push(cell(`om${k}`, 230, k * 34, 64, 28, m.text, k === 0 ? "strong" : "accent", 12));
      items.push(txt(`op${k}`, 300, k * 34 + 14, `p${m.prio}`, { anchor: "start", size: 11, tone: "soft" }));
      items.push(txt(`or${k}`, 340, k * 34 + 14, `receive ${k + 1}`, { anchor: "start", size: 11, weight: 600, tone: k === 0 ? "accent" : "ink" }));
    });
    items.push(txt("ol", 262, -14, "queue, head first", { tone: "soft", size: 11, mono: false }));
    return items;
  };
  return finish({
    title: "Message boundaries: a pipe's byte stream against a message queue",
    input: `two writes, "${WRITES[0]}" and "${WRITES[1]}"`,
    frames: [
      { caption: `The same two writes go into a pipe and a message queue. The pipe keeps only bytes, so one read can return "${pipeRead}" with the seam gone; the queue keeps each message whole, and each receive returns exactly one.`, items: [...rowStream(0), ...rowQueue(84)] },
      { caption: `A POSIX queue also orders by priority: "${order[0].text}" was sent second but has priority ${order[0].prio}, so it is received first, and the two priority-${order[1].prio} messages follow in the order they were sent.`, items: prio() },
    ],
  });
}

/* ── A client and a server over sockets ───────────────────────────── */

function socketCalls(): Walkthrough {
  // Both processes start with 0, 1 and 2 open; each call that makes a descriptor takes the lowest free number.
  const fds = { client: new Set([0, 1, 2]), server: new Set([0, 1, 2]) };
  const open = (who: "client" | "server") => {
    let fd = 0;
    while (fds[who].has(fd)) fd++;
    fds[who].add(fd);
    return fd;
  };
  const ls = open("server");
  const cs = open("client");
  const conn = open("server"); // accept() returns a new descriptor for the connection
  if (ls !== 3 || cs !== 3 || conn !== 4) throw new Error("socket: descriptor numbers disagree");
  const ADDR = "192.168.1.10:8080";

  const CX = 150;
  const SX = 340;
  const ROW = 21;
  type Row = { side: "client" | "server" | "msg"; text: string; dir?: 1 | -1; phase: number; tone?: LineTone };
  const rows: Row[] = [
    { side: "server", text: `socket() = ${ls}`, phase: 0 },
    { side: "server", text: `bind(${ls}, :8080)`, phase: 0 },
    { side: "server", text: `listen(${ls})`, phase: 0 },
    { side: "server", text: `accept(${ls}) … waits`, phase: 0 },
    { side: "client", text: `socket() = ${cs}`, phase: 1 },
    { side: "client", text: `connect(${cs}, server)`, phase: 1 },
    { side: "msg", text: "SYN", dir: 1, phase: 1 },
    { side: "msg", text: "SYN-ACK", dir: -1, phase: 1 },
    { side: "msg", text: "ACK", dir: 1, phase: 1 },
    { side: "server", text: `accept returns ${conn}`, phase: 1 },
    { side: "client", text: `send(${cs}, "GET /")`, phase: 2 },
    { side: "msg", text: `"GET /"`, dir: 1, phase: 2, tone: "accent" },
    { side: "server", text: `recv(${conn}) = "GET /"`, phase: 2 },
    { side: "server", text: `send(${conn}, "200 OK")`, phase: 2 },
    { side: "msg", text: `"200 OK"`, dir: -1, phase: 2, tone: "accent" },
    { side: "client", text: `recv(${cs}) = "200 OK"`, phase: 2 },
  ];
  const TOP = 40;
  const ll = lifelines("ll", ["client", "server"], { x: CX, y: 0, gap: SX - CX, w: 100, h: 30, length: TOP + rows.length * ROW - 20 });
  const draw = (phase: number): Item[] => {
    const items: Item[] = [...ll.items];
    items.push(txt("ca", CX, -12, "any port", { tone: "faint", size: 11 }));
    items.push(txt("sa", SX, -12, ADDR, { tone: "faint", size: 11 }));
    rows.forEach((r, i) => {
      if (r.phase > phase) return;
      const y = TOP + i * ROW;
      const now = r.phase === phase;
      if (r.side === "msg") {
        const [a, b] = r.dir === 1 ? [CX, SX] : [SX, CX];
        items.push(...message(`m${i}`, a, b, y + 6, r.text, { tone: r.tone ?? (now ? "ink" : "line"), size: 11 }));
      } else {
        const x = r.side === "client" ? CX - 8 : SX + 8;
        items.push(txt(`c${i}`, x, y, r.text, { anchor: r.side === "client" ? "end" : "start", size: 11, tone: now ? "ink" : "soft", weight: now ? 600 : undefined }));
        items.push({ k: "node", id: `d${i}`, x: r.side === "client" ? CX : SX, y, r: 3, text: "", tone: now ? "strong" : "muted" });
      }
    });
    return items;
  };
  return finish({
    title: "A client and a server talking through sockets",
    input: `server at ${ADDR}; each process already has descriptors 0, 1 and 2`,
    frames: [
      { caption: `The server makes a socket, descriptor ${ls}, binds it to port 8080, marks it listening and calls accept(), which waits for a client.`, items: draw(0) },
      { caption: `The client makes its own socket and calls connect(). The kernels exchange the TCP handshake, and accept() returns a new descriptor, ${conn}, for this one connection; ${ls} goes on listening for others.`, items: draw(1) },
      { caption: `Both sides now send and recv on their connected descriptors, ${cs} and ${conn}: a reliable two-way byte stream that works the same whether the two processes share a machine or not.`, items: draw(2) },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "two-models": twoModels,
  pipe,
  "shell-pipeline": shellPipeline,
  boundaries,
  socket: socketCalls,
};
