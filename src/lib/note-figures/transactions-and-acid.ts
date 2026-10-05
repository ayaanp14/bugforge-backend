import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * Transactions and ACID Properties in DBMS: the note's figures
 * (content/notes/dbms/transactions-and-acid.md places each with
 * "@figure <name>").
 *
 * The note's one example is T1, moving ₹1,000 from A (₹5,000) to B
 * (₹3,000). Each figure runs it: a small interpreter executes T1's
 * read/write steps, a log-based recovery manager undoes and redoes from a
 * log cut at each crash point, a scheduler interleaves T1 with a reader
 * under three isolation regimes, and a shadow-paging commit switches a
 * page-table pointer. Every balance drawn comes from those runs, and each
 * generator throws if a result disagrees with the note's tables.
 *
 *  - states: the state diagram, the commit path then the failure path;
 *  - transfer: T1 step by step, with the database's A + B dipping to 7000;
 *  - isolation: a concurrent total, without isolation, with MVCC and with locks;
 *  - crash-recovery: the write-ahead log, and recovery after a crash at three points;
 *  - shadow-paging: copy-on-write pages, commit by one pointer switch, and a crash.
 */

const START = { A: 5000, B: 3000 } as const;
const AMOUNT = 1000;
type Item2 = "A" | "B";
type Db = Record<Item2, number>;
/** ₹ with thousands grouped by hand, so the text never depends on the runtime's locale data. */
const rupees = (n: number) => `₹${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

/* ── Transaction states ───────────────────────────────────────────── */

function states(): Walkthrough {
  // The states and transitions, as data; the figure draws them and the guard checks the shape.
  const S = {
    active: { name: "Active", x: 0, y: 0, w: 76 },
    partial: { name: "Partially committed", x: 140, y: 0, w: 160 },
    committed: { name: "Committed", x: 366, y: 0, w: 96 },
    failed: { name: "Failed", x: 182, y: 120, w: 76 },
    aborted: { name: "Aborted", x: 366, y: 120, w: 96 },
  } as const;
  type K = keyof typeof S;
  const T: Array<[K, K, string]> = [
    ["active", "partial", "last statement runs"],
    ["partial", "committed", "commit record on disk"],
    ["active", "failed", "error, deadlock, crash"],
    ["partial", "failed", "log write fails"],
    ["failed", "aborted", "rolled back"],
  ];
  const out = (k: K) => T.filter(([a]) => a === k);
  if (out("committed").length || out("aborted").length) throw new Error("states: committed and aborted are final");
  const reach = (k: K, seen = new Set<K>()): Set<K> => {
    seen.add(k);
    for (const [, b] of out(k)) if (!seen.has(b)) reach(b, seen);
    return seen;
  };
  for (const k of Object.keys(S) as K[]) if (![...reach(k)].some((r) => r === "committed" || r === "aborted")) throw new Error(`states: ${k} reaches no end`);

  const BH = 34;
  const commitPath: K[] = ["active", "partial", "committed"];
  const failPath: K[] = ["active", "partial", "failed", "aborted"];
  // The edges each frame is about: the one way to commit, and every way into failed and on to aborted.
  const hotEdges = (end: K) => new Set(T.filter(([a, b]) => (end === "committed" ? commitPath.indexOf(b) === commitPath.indexOf(a) + 1 && commitPath.includes(a) : b === "failed" || b === "aborted")).map(([a, b]) => `${a}>${b}`));
  const draw = (path: K[], end: K): Item[] => {
    const hot = hotEdges(end);
    const on = (a: K, b: K) => hot.has(`${a}>${b}`);
    const items: Item[] = [];
    const mid = (k: K) => ({ x: S[k].x + S[k].w / 2, y: S[k].y + BH / 2 });
    const edge = (a: K, b: K, text: string, n: number) => {
      const A = S[a];
      const B = S[b];
      let p1: { x: number; y: number };
      let p2: { x: number; y: number };
      let lx: number;
      let ly: number;
      let anchor: "start" | "middle" | "end" = "middle";
      if (A.y === B.y) {
        p1 = { x: A.x + A.w + 3, y: A.y + BH / 2 };
        p2 = { x: B.x - 3, y: B.y + BH / 2 };
        lx = (p1.x + p2.x) / 2;
        ly = A.y - 12;
      } else if (Math.abs(mid(a).x - mid(b).x) < 2) {
        p1 = { x: mid(a).x, y: A.y + BH + 3 };
        p2 = { x: mid(b).x, y: B.y - 3 };
        lx = p1.x + 8;
        ly = (p1.y + p2.y) / 2;
        anchor = "start";
      } else {
        p1 = { x: mid(a).x, y: A.y + BH + 3 };
        p2 = { x: B.x - 3, y: B.y + BH / 2 };
        // Beside the diagonal, on its lower-left side, in two short lines.
        lx = (p1.x + p2.x) / 2 - 12;
        ly = (p1.y + p2.y) / 2 + 12;
        anchor = "end";
      }
      const isHot = on(a, b);
      const tone = isHot ? (b === "failed" ? "error" : "accent") : "line";
      items.push(arrow(`t${n}`, p1, p2, { tone }));
      const parts = anchor === "end" ? text.split(/, (?=crash)/) : [text];
      parts.forEach((t, j) => items.push(label(`tl${n}${j ? "b" : ""}`, j < parts.length - 1 ? `${t},` : t, lx, ly + j * 14, { anchor, tone: isHot ? (b === "failed" ? "error" : "accent") : "faint", size: 11 })));
    };
    T.forEach(([a, b, text], n) => edge(a, b, text, n));
    (Object.keys(S) as K[]).forEach((k) => {
      const s = S[k];
      const tone: Tone = k === end ? "strong" : k === "failed" && path.includes(k) ? "error" : path.includes(k) && k !== "committed" ? "accent" : "plain";
      items.push(box(`s${k}`, s.x, s.y, s.name, { w: s.w, h: BH, size: 12, tone }));
    });
    items.push(label("nc", "changes permanent", S.committed.x + S.committed.w / 2, BH + 14, { tone: end === "committed" ? "accent" : "faint", size: 11 }));
    items.push(label("na", "then restart or kill", S.aborted.x + S.aborted.w / 2, S.aborted.y + BH + 14, { tone: end === "aborted" ? "accent" : "faint", size: 11 }));
    return items;
  };
  return finish({
    title: "The states of a transaction",
    input: "",
    frames: [
      {
        caption: "A transaction runs in the active state. When its last statement has run it is partially committed, its changes possibly still only in memory, and it is committed once its commit record reaches stable storage.",
        items: draw(commitPath, "committed"),
      },
      {
        caption: "Any error, deadlock or crash sends an active transaction to failed, and so can a failed log write after the last statement. Rolling back its changes makes it aborted; the system then restarts it or kills it.",
        items: draw(failPath, "aborted"),
      },
    ],
  });
}

/* ── T1 step by step ──────────────────────────────────────────────── */

type Step = { text: string; run: (db: Db, local: Partial<Db>) => void };

const T1: Step[] = [
  { text: "read(A)", run: (db, l) => void (l.A = db.A) },
  { text: `A := A − ${AMOUNT}`, run: (_, l) => void (l.A = (l.A as number) - AMOUNT) },
  { text: "write(A)", run: (db, l) => void (db.A = l.A as number) },
  { text: "read(B)", run: (db, l) => void (l.B = db.B) },
  { text: `B := B + ${AMOUNT}`, run: (_, l) => void (l.B = (l.B as number) + AMOUNT) },
  { text: "write(B)", run: (db, l) => void (db.B = l.B as number) },
  { text: "commit", run: () => undefined },
];

function transfer(): Walkthrough {
  const db: Db = { ...START };
  const local: Partial<Db> = {};
  const total0 = db.A + db.B;
  const LW = 132;
  const LH = 26;
  const rowY = (i: number) => 24 + i * (LH + 5);
  const PX = LW + 56;
  const CW = 92;
  const frames: Frame[] = [];
  const draw = (cur: number): Item[] => {
    const items: Item[] = [label("hp", "T1", LW / 2, 8, { tone: "soft", size: 11.5, weight: 600 })];
    T1.forEach((s, i) => items.push(box(`p${i}`, 0, rowY(i), s.text, { w: LW, h: LH, size: 12, tone: i === cur ? "accent" : i < cur ? "muted" : "plain" })));
    const total = db.A + db.B;
    const row = (id: string, title: string, y: number, vals: Array<[string, string, Tone]>) => {
      items.push(label(`${id}t`, title, PX, y - 12, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
      vals.forEach(([k, v, tone], j) => items.push(box(`${id}${k}`, PX + j * (CW + 8), y, v, { w: CW, h: LH + 2, size: 12, tone })));
    };
    const step = T1[cur];
    const touched = (k: Item2, where: "local" | "db") => step !== undefined && step.text.includes(k) && (where === "db" ? /read|write/.test(step.text) : true);
    row("l", "T1's variables", rowY(0) + 6, (["A", "B"] as const).map((k) => [k, `${k} = ${local[k] ?? "—"}`, touched(k, "local") && !step.text.startsWith("write") ? "accent" : "plain"]));
    row("d", "the database", rowY(2) + 18, (["A", "B"] as const).map((k) => [k, `${k} = ${db[k]}`, touched(k, "db") && step.text.startsWith("write") ? "accent" : "plain"]));
    row("s", "A + B in the database", rowY(4) + 30, [["v", String(total), total === total0 ? (cur === T1.length - 1 ? "strong" : "plain") : "error"]]);
    if (total !== total0) items.push(label("sw", `${rupees(total0 - total)} missing`, PX + CW + 10, rowY(4) + 30 + (LH + 2) / 2, { anchor: "start", tone: "error", size: 11.5, weight: 600 }));
    return items;
  };
  frames.push({ caption: `T1 moves ${rupees(AMOUNT)} from A (${rupees(START.A)}) to B (${rupees(START.B)}). read copies an item from the database into T1's own variable, and write copies the variable back.`, items: draw(-1) });
  const totals: number[] = [];
  T1.forEach((s, i) => {
    s.run(db, local);
    totals.push(db.A + db.B);
    const total = db.A + db.B;
    let caption: string;
    if (s.text === "commit") caption = `Commit: both writes are in, A = ${db.A} and B = ${db.B}, and the total is ${total} again. Every ACID property exists so that nobody acts on the state between write(A) and write(B).`;
    else if (s.text.startsWith("write") && total !== total0) caption = `write(A) puts ${db.A} into the database while B still holds ${db.B}: the database now shows a total of ${total}, ${rupees(total0 - total)} short, until write(B) runs.`;
    else if (s.text.startsWith("write")) caption = `write(B) stores ${db.B}. The database is consistent again, A + B = ${total}, but T1 has not committed yet, so a crash now would still roll it back.`;
    else if (s.text.startsWith("read")) caption = `${s.text} copies ${s.text[5]} = ${db[s.text[5] as Item2]} into T1's variable. Nothing in the database changes.`;
    else caption = `${s.text} changes only T1's own copy, now ${s.text[0]} = ${local[s.text[0] as Item2]}. The database still holds ${s.text[0]} = ${db[s.text[0] as Item2]}.`;
    frames.push({ caption, items: draw(i) });
  });
  if (db.A !== 4000 || db.B !== 4000 || totals[2] !== 7000 || totals[5] !== 8000) throw new Error("transfer: balances disagree with the note");
  return finish({ title: "T1 moves ₹1,000 from A to B, one step at a time", input: `A = ${START.A}, B = ${START.B}`, frames });
}

/* ── Isolation: a concurrent total ────────────────────────────────── */

type Op = { t: 1 | 2; text: string; item?: Item2; kind: "read" | "write" | "commit" | "sum" };

function isolation(): Walkthrough {
  const t1: Op[] = [
    { t: 1, text: "read(A)", item: "A", kind: "read" },
    { t: 1, text: "write(A)", item: "A", kind: "write" },
    { t: 1, text: "read(B)", item: "B", kind: "read" },
    { t: 1, text: "write(B)", item: "B", kind: "write" },
    { t: 1, text: "commit", kind: "commit" },
  ];
  const t2: Op[] = [
    { t: 2, text: "read(A)", item: "A", kind: "read" },
    { t: 2, text: "read(B)", item: "B", kind: "read" },
    { t: 2, text: "A + B", kind: "sum" },
  ];
  // The interleaving the note describes: T2 runs between T1's write(A) and write(B).
  const order: Op[] = [t1[0], t1[1], t2[0], t2[1], t2[2], t1[2], t1[3], t1[4]];
  type Mode = "none" | "mvcc" | "locks";
  const run = (mode: Mode) => {
    const db: Db = { ...START };
    const committed: Db = { ...START };
    const snapshot: Db = { ...committed };
    const l1: Partial<Db> = {};
    const seen: Partial<Db> = {};
    const trace: Array<{ op: Op; shown: string; db: Db; waited?: boolean }> = [];
    let pending = mode === "locks" ? [] as Op[] : null;
    let lockedByT1 = new Set<Item2>();
    const exec = (op: Op) => {
      let shown = op.text;
      if (op.t === 1) {
        if (op.kind === "read") l1[op.item!] = db[op.item!];
        if (op.kind === "write") {
          db[op.item!] = (l1[op.item!] as number) + (op.item === "A" ? -AMOUNT : AMOUNT);
          lockedByT1.add(op.item!);
          shown = `write(${op.item}) = ${db[op.item!]}`;
        }
        if (op.kind === "commit") {
          Object.assign(committed, db);
          lockedByT1 = new Set();
        }
      } else if (op.kind === "read") {
        seen[op.item!] = mode === "mvcc" ? snapshot[op.item!] : db[op.item!];
        shown = `read(${op.item}) = ${seen[op.item!]}`;
      } else shown = `A + B = ${(seen.A as number) + (seen.B as number)}`;
      trace.push({ op, shown, db: { ...db } });
    };
    for (const op of order) {
      if (pending && op.t === 2 && (pending.length > 0 || (op.item && lockedByT1.has(op.item)))) {
        if (pending.length === 0) trace.push({ op: { ...op, text: "wait" }, shown: `${op.text}: waits`, db: { ...db }, waited: true });
        pending.push(op);
        continue;
      }
      exec(op);
      if (pending && op.kind === "commit") {
        for (const p of pending) exec(p);
        pending = [];
      }
    }
    return { trace, sum: (seen.A as number) + (seen.B as number) };
  };
  const none = run("none");
  const mvcc = run("mvcc");
  const locks = run("locks");
  const total0 = START.A + START.B;
  if (none.sum !== 7000 || mvcc.sum !== total0 || locks.sum !== total0) throw new Error(`isolation: sums ${none.sum}/${mvcc.sum}/${locks.sum} disagree with the note`);

  const CW = 128;
  const RH = 26;
  const X1 = 0;
  const XD = CW + 26;
  const DW = 120;
  const X2 = XD + DW + 26;
  const rowY = (i: number) => 26 + i * (RH + 6);
  const draw = (r: ReturnType<typeof run>, verdict: "error" | "strong"): Item[] => {
    const items: Item[] = [
      label("h1", "T1 (transfer)", X1 + CW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
      label("hd", "database A, B", XD + DW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
      label("h2", "T2 (total)", X2 + CW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
    ];
    const occ = new Map<string, number>();
    r.trace.forEach((e, i) => {
      const key = `${e.op.t}${e.op.text}`;
      const n = occ.get(key) ?? 0;
      occ.set(key, n + 1);
      const id = `o${key}${n}`.replace(/[^\w]/g, "");
      const isSum = e.op.kind === "sum";
      const tone: Tone = isSum ? verdict : e.waited ? "accent" : e.op.t === 2 ? "accent" : "plain";
      items.push(box(id, e.op.t === 1 ? X1 : X2, rowY(i), e.shown, { w: CW, h: RH, size: 11.5, tone }));
      items.push(label(`v${i}`, `${e.db.A}, ${e.db.B}`, XD + DW / 2, rowY(i) + RH / 2, { tone: "faint", size: 11.5, mono: true }));
    });
    return items;
  };
  return finish({
    title: "Isolation: a total computed while T1 is half done",
    input: `T2 reads A and B between T1's write(A) and write(B); A = ${START.A}, B = ${START.B}`,
    frames: [
      {
        caption: `With no isolation, T2 reads A after T1's write(A) but B before write(B): ${none.sum}, a total that never existed in any committed state. This is what isolation forbids.`,
        items: draw(none, "error"),
      },
      {
        caption: `With multi-version concurrency control, T2 reads the committed versions as of its own start, A = ${START.A} and B = ${START.B}, even though T1 has already written a newer A. The total is ${mvcc.sum}, and nobody waited.`,
        items: draw(mvcc, "strong"),
      },
      {
        caption: `With locking, T1 holds an exclusive lock on A from write(A) until it commits, so T2's read(A) waits and T2 runs after the commit. It sees ${locks.trace.find((e) => e.op.t === 2 && e.op.kind === "sum")!.shown.split("= ")[1]}, the state after the transfer, at the cost of waiting.`,
        items: draw(locks, "strong"),
      },
    ],
  });
}

/* ── Write-ahead log and recovery ─────────────────────────────────── */

type Rec = { kind: "start" | "update" | "commit"; item?: Item2; old?: number; now?: number };
const LOG: Rec[] = [
  { kind: "start" },
  { kind: "update", item: "A", old: START.A, now: START.A - AMOUNT },
  { kind: "update", item: "B", old: START.B, now: START.B + AMOUNT },
  { kind: "commit" },
];
const recText = (r: Rec) => (r.kind === "update" ? `<T1, ${r.item}, ${r.old}, ${r.now}>` : `<T1 ${r.kind}>`);

/** Recovery from a log prefix: redo committed transactions forwards, undo uncommitted ones backwards. */
function recover(log: readonly Rec[], disk: Db): { disk: Db; actions: string[] } {
  const d = { ...disk };
  const actions: string[] = [];
  const committed = log.some((r) => r.kind === "commit");
  if (committed) {
    for (const r of log) if (r.kind === "update") {
      d[r.item!] = r.now!;
      actions.push(`redo: ${r.item} := ${r.now}`);
    }
  } else {
    for (const r of [...log].reverse()) if (r.kind === "update") {
      d[r.item!] = r.old!;
      actions.push(`undo: ${r.item} := ${r.old}`);
    }
  }
  return { disk: d, actions };
}

function crashRecovery(): Walkthrough {
  // What reached the data pages before each crash: real systems steal (uncommitted pages may be written) and do not force (committed pages may not be).
  const cases: Array<{ upTo: number; disk: Db; why: string }> = [
    { upTo: 2, disk: { A: START.A - AMOUNT, B: START.B }, why: "steal" },
    { upTo: 3, disk: { A: START.A - AMOUNT, B: START.B + AMOUNT }, why: "steal" },
    { upTo: 4, disk: { ...START }, why: "no-force" },
  ];
  const expected: Db[] = [{ ...START }, { ...START }, { A: 4000, B: 4000 }];
  const results = cases.map((c) => recover(LOG.slice(0, c.upTo), c.disk));
  results.forEach((r, i) => {
    if (r.disk.A !== expected[i].A || r.disk.B !== expected[i].B) throw new Error(`crash-recovery: case ${i + 1} recovers to ${JSON.stringify(r.disk)}`);
  });

  const LW = 176;
  const LH = 26;
  const rowY = (i: number) => 26 + i * (LH + 6);
  const PX = LW + 60;
  const CW = 84;
  const draw = (k: number | null): Item[] => {
    const items: Item[] = [label("hl", "the log on stable storage", LW / 2, 8, { tone: "soft", size: 11.5, weight: 600 })];
    const upTo = k === null ? LOG.length : cases[k].upTo;
    LOG.forEach((r, i) => items.push(box(`r${i}`, 0, rowY(i), recText(r), { w: LW, h: LH, size: 11.5, tone: i < upTo ? (r.kind === "commit" ? "strong" : "plain") : "ghost" })));
    if (k === null) {
      items.push(label("f1", "transaction, item,", PX, rowY(1) + LH / 2 - 8, { anchor: "start", tone: "soft", size: 11 }));
      items.push(label("f2", "old value, new value", PX, rowY(1) + LH / 2 + 8, { anchor: "start", tone: "soft", size: 11 }));
      items.push(arrow("fa", { x: PX - 6, y: rowY(1) + LH / 2 }, { x: LW + 6, y: rowY(1) + LH / 2 }, { tone: "faint" }));
      return items;
    }
    const c = cases[k];
    const r = results[k];
    const cy = rowY(upTo) - 3;
    items.push({ k: "edge", id: "crash", x1: -6, y1: cy, x2: LW + 6, y2: cy, tone: "error", dashed: true });
    items.push(label("ct", "crash", LW + 10, cy, { anchor: "start", tone: "error", size: 11.5, weight: 700 }));
    const vals = (id: string, title: string, y: number, d: Db, tone: (key: Item2) => Tone) => {
      items.push(label(`${id}t`, title, PX, y - 12, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
      (["A", "B"] as const).forEach((key, j) => items.push(box(`${id}${key}`, PX + j * (CW + 8), y, `${key} = ${d[key]}`, { w: CW, h: LH, size: 12, tone: tone(key) })));
    };
    vals("d", `data pages at the crash (${c.why})`, rowY(0) + 4, c.disk, () => "plain");
    r.actions.forEach((a, j) => items.push(label(`a${j}`, a, PX, rowY(1) + 22 + j * 18, { anchor: "start", tone: "accent", size: 12, mono: true, weight: 600 })));
    vals("o", "after recovery", rowY(3) + 20, r.disk, (key) => (r.disk[key] !== c.disk[key] ? "strong" : "plain"));
    return items;
  };
  const verb = (i: number) => (results[i].actions[0].startsWith("undo") ? "undo" : "redo");
  return finish({
    title: "Write-ahead logging: recovering T1 after a crash",
    input: "",
    frames: [
      {
        caption: "T1's log: a start record, one record per write holding the item's old and new value, and a commit record. Write-ahead logging puts each record on stable storage before the data page it describes.",
        items: draw(null),
      },
      {
        caption: `Crash after the A record. The page holding A = ${cases[0].disk.A} had already reached disk, but there is no commit record, so recovery must ${verb(0)} T1, putting the old value ${START.A} back from the log.`,
        items: draw(0),
      },
      {
        caption: `Crash after the B record: both new values may be on disk, and still no commit record. Recovery undoes in reverse log order, B first and then A, restoring A = ${results[1].disk.A} and B = ${results[1].disk.B}.`,
        items: draw(1),
      },
      {
        caption: `Crash after the commit record, before either data page was written. T1 committed, so recovery must ${verb(2)} it from the log's new values: A = ${results[2].disk.A}, B = ${results[2].disk.B}. That is durability.`,
        items: draw(2),
      },
    ],
  });
}

/* ── Shadow paging ────────────────────────────────────────────────── */

function shadowPaging(): Walkthrough {
  const PAGES = 4;
  const WRITES = [1, 3]; // T writes pages 2 and 4 (0-based 1 and 3).
  // Copy on write: each written page goes to a new location; only the current table points at it.
  const shadowTable = Array.from({ length: PAGES }, (_, i) => `P${i + 1}`);
  const currentTable = shadowTable.map((p, i) => (WRITES.includes(i) ? `${p}'` : p));
  if (currentTable.filter((p, i) => p !== shadowTable[i]).length !== WRITES.length) throw new Error("shadow-paging: copies disagree with the write set");

  const H = 28;
  const TW = 40;
  const PW = 60;
  const rowY = (i: number) => 60 + i * (H + 10);
  const XS = 0;
  const XO = 110;
  const XN = 200;
  const XC = 330;
  const ROOT = { x: 140, y: 0, w: 110 };
  type Stage = "running" | "commit" | "crash";
  const draw = (stage: Stage): Item[] => {
    const items: Item[] = [
      label("hs", "shadow table", XS + TW / 2, rowY(0) - 16, { tone: "soft", size: 11, weight: 600 }),
      label("hc", "current table", XC + TW / 2, rowY(0) - 16, { tone: "soft", size: 11, weight: 600 }),
      label("ho", "pages on disk", XO + PW / 2, rowY(PAGES) + 4, { tone: "soft", size: 11, weight: 600 }),
      label("hn", "new copies", XN + PW / 2, rowY(PAGES) + 4, { tone: "soft", size: 11, weight: 600 }),
    ];
    const live = stage === "commit" ? "current" : "shadow";
    const dead = (i: number) => (stage === "commit" ? WRITES.includes(i) : false);
    shadowTable.forEach((_, i) => {
      items.push(box(`st${i}`, XS, rowY(i), i + 1, { w: TW, h: H, size: 12, tone: live === "shadow" ? "accent" : "muted" }));
      items.push(box(`ct${i}`, XC, rowY(i), i + 1, { w: TW, h: H, size: 12, tone: stage === "crash" ? "muted" : live === "current" ? "accent" : "plain" }));
      items.push(box(`po${i}`, XO, rowY(i), shadowTable[i], { w: PW, h: H, size: 12, tone: dead(i) ? "muted" : "plain" }));
      items.push(arrow(`es${i}`, { x: XS + TW + 3, y: rowY(i) + H / 2 }, { x: XO - 4, y: rowY(i) + H / 2 }, { tone: live === "shadow" ? "accent" : "faint" }));
    });
    WRITES.forEach((i) => items.push(box(`pn${i}`, XN, rowY(i), currentTable[i], { w: PW, h: H, size: 12, tone: stage === "crash" ? "muted" : stage === "commit" ? "strong" : "accent" })));
    currentTable.forEach((p, i) => {
      const toNew = p !== shadowTable[i];
      const target = toNew ? { x: XN + PW + 4, y: rowY(i) + H / 2 } : { x: XO + PW + 4, y: rowY(i) + H / 2 };
      // A pointer from the current table back to an old page passes over the empty slot in the new column.
      items.push(arrow(`ec${i}`, { x: XC - 3, y: rowY(i) + H / 2 }, target, { tone: stage === "crash" ? "faint" : live === "current" ? "accent" : "line" }));
    });
    items.push(box("root", ROOT.x, ROOT.y, "db root", { w: ROOT.w, h: H, size: 12, tone: "strong" }));
    const to = live === "shadow" ? { x: XS + TW / 2, y: rowY(0) - 26 } : { x: XC + TW / 2, y: rowY(0) - 26 };
    items.push(arrow("rp", { x: live === "shadow" ? ROOT.x - 2 : ROOT.x + ROOT.w + 2, y: ROOT.y + H / 2 }, to, { tone: "accent", bow: live === "shadow" ? 14 : -14 }));
    return items;
  };
  const names = WRITES.map((i) => shadowTable[i]);
  return finish({
    title: "Shadow paging: copy the pages, then switch one pointer",
    input: `T writes pages ${WRITES.map((i) => i + 1).join(" and ")} of ${PAGES}`,
    frames: [
      {
        caption: `While T runs, each page it writes is copied to a new place (${currentTable.filter((p, i) => p !== shadowTable[i]).join(", ")}) and only the current table points at the copies. The db root still names the shadow table, which is never modified.`,
        items: draw("running"),
      },
      {
        caption: `Commit: flush the new pages and the current table, then switch the db root to the current table in one atomic write. The old ${names.join(" and ")} are now garbage to collect.`,
        items: draw("commit"),
      },
      {
        caption: "A crash or abort before the switch: the db root still names the shadow table, which describes the old, consistent database. The copies are simply discarded; nothing needs undoing or redoing.",
        items: draw("crash"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  states,
  transfer,
  isolation,
  "crash-recovery": crashRecovery,
  "shadow-paging": shadowPaging,
};
