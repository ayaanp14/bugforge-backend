import { finish, link, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * Concurrency Control in DBMS: the note's figures
 * (content/notes/dbms/concurrency-control.md places each with
 * "@figure <name>").
 *
 * Each figure runs the protocol it shows. The precedence graphs come from
 * scanning a schedule for conflicting pairs (different transactions, same
 * item, at least one write) and testing the graph for a cycle, with the
 * serial order from a topological sort; the anomalies run their
 * interleavings against a one-table database; two-phase locking counts the
 * locks a transaction holds after each operation and checks the two-phase
 * rule; the deadlock runs a lock manager with the S/X compatibility matrix
 * and finds the cycle in its wait-for graph. Each generator throws if what
 * it computed disagrees with the note's text.
 *
 *  - precedence-graph: S1's conflicts found pair by pair, then its serial order;
 *  - lost-update: S2's two edges forming a cycle, with the balances that lose a write;
 *  - anomalies: a dirty read, a non-repeatable read and a phantom, step by step;
 *  - two-phase-locking: locks held over time under basic and strict 2PL;
 *  - deadlock: two shared locks, two upgrades, a wait-for cycle and a victim.
 */

type Op = { t: number; kind: "R" | "W"; item: string };
const opText = (o: Op) => `${o.kind}${o.t}(${o.item})`;
const parse = (s: string): Op[] => s.split(/,\s*/).map((x) => {
  const m = /^([RW])(\d)\((\w)\)$/.exec(x.trim());
  if (!m) throw new Error(`bad op ${x}`);
  return { kind: m[1] as "R" | "W", t: Number(m[2]), item: m[3] };
});

/** Every conflicting pair (i before j), in the order a scan meets the later operation. */
function conflicts(s: readonly Op[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let j = 0; j < s.length; j++) for (let i = 0; i < j; i++) {
    const a = s[i];
    const b = s[j];
    if (a.t !== b.t && a.item === b.item && (a.kind === "W" || b.kind === "W")) out.push([i, j]);
  }
  return out;
}

/** All topological orders of a small graph (empty when it has a cycle). */
function topoOrders(nodes: readonly number[], edges: ReadonlySet<string>): number[][] {
  const out: number[][] = [];
  const walk = (done: number[]) => {
    if (done.length === nodes.length) return void out.push(done);
    for (const n of nodes) if (!done.includes(n) && nodes.every((m) => done.includes(m) || m === n || !edges.has(`${m}>${n}`))) walk([...done, n]);
  };
  walk([]);
  return out;
}

/** A schedule drawn as rows of steps and a column per transaction. */
function scheduleGrid(p: string, s: readonly Op[], nT: number, o: { x?: number; y?: number; w?: number; gap?: number; tone?: (i: number) => Tone; text?: (i: number) => string } = {}) {
  const { x = 0, y = 0, w = 66, gap = 8 } = o;
  const H = 24;
  const colX = (t: number) => x + 26 + (t - 1) * (w + gap);
  const rowY = (i: number) => y + 24 + i * (H + 6);
  const items: Item[] = [];
  for (let t = 1; t <= nT; t++) items.push(label(`${p}h${t}`, `T${t}`, colX(t) + w / 2, y + 6, { tone: "soft", size: 11.5, weight: 600 }));
  s.forEach((op, i) => {
    items.push(label(`${p}n${i}`, String(i + 1), x + 8, rowY(i) + H / 2, { tone: "faint", size: 10.5, mono: true }));
    items.push(box(`${p}${i}`, colX(op.t), rowY(i), o.text ? o.text(i) : opText(op), { w, h: H, size: 12, tone: o.tone?.(i) ?? "plain" }));
  });
  return { items, colX, rowY, w, H, right: colX(nT) + w, bottom: rowY(s.length) - 6 };
}

/* ── S1: building the precedence graph ────────────────────────────── */

function precedenceGraph(): Walkthrough {
  const S1 = parse("R1(A), R2(B), W1(A), R3(A), W2(B), R1(B), W3(B)");
  const pairs = conflicts(S1);
  const edges = new Set(pairs.map(([i, j]) => `${S1[i].t}>${S1[j].t}`));
  const orders = topoOrders([1, 2, 3], edges);
  if (pairs.length !== 5 || [...edges].sort().join() !== "1>3,2>1,2>3") throw new Error(`precedence-graph: ${pairs.length} pairs, edges ${[...edges]}`);
  if (orders.length !== 1 || orders[0].join() !== "2,1,3") throw new Error(`precedence-graph: serial orders ${JSON.stringify(orders)}, the note says only T2, T1, T3`);

  const GRID = { w: 60, gap: 30 };
  const g = scheduleGrid("s", S1, 3, GRID);
  const GX = g.right + 56;
  const pos: Record<number, { x: number; y: number }> = { 2: { x: GX, y: 60 }, 1: { x: GX + 110, y: 60 }, 3: { x: GX + 55, y: 165 } };
  const R = 19;
  const frames: Frame[] = [];
  const draw = (k: number | null, final = false): Item[] => {
    const [ci, cj] = k === null ? [-1, -1] : pairs[k];
    const items = scheduleGrid("s", S1, 3, { ...GRID, tone: (i) => (i === ci || i === cj ? "accent" : "plain") }).items;
    if (k !== null) {
      const a = S1[ci];
      const b = S1[cj];
      const right = a.t < b.t;
      items.push(arrow("pa", { x: g.colX(a.t) + (right ? g.w + 2 : -2), y: g.rowY(ci) + g.H / 2 }, { x: g.colX(b.t) + (right ? -3 : g.w + 3), y: g.rowY(cj) + g.H / 2 }, { tone: "accent" }));
    }
    const seen = new Set(pairs.slice(0, k === null ? (final ? pairs.length : 0) : k + 1).map(([i, j]) => `${S1[i].t}>${S1[j].t}`));
    const now = k === null ? "" : `${S1[ci].t}>${S1[cj].t}`;
    for (const e of seen) {
      const [a, b] = e.split(">").map(Number);
      items.push(link(`g${a}${b}`, pos[a], pos[b], R, { arrow: true, tone: e === now ? "accent" : final ? "ink" : "line" }));
    }
    const order = orders[0];
    [1, 2, 3].forEach((t) => items.push({ k: "node", id: `n${t}`, x: pos[t].x, y: pos[t].y, r: R, text: `T${t}`, tone: final ? "strong" : k !== null && (t === S1[ci].t || t === S1[cj].t) ? "accent" : "plain" }));
    if (final) {
      order.forEach((t, i) => items.push(label(`o${i}`, String(i + 1), pos[t].x + R + 4, pos[t].y - R + 2, { anchor: "start", tone: "accent", size: 11, mono: true, weight: 700 })));
      items.push(label("ord", `serial order: ${order.map((t) => `T${t}`).join(", ")}`, GX + 55, 216, { tone: "ink", size: 12.5, weight: 600, mono: true }));
    }
    return items;
  };
  frames.push({
    caption: "Scan the schedule for conflicts: two operations of different transactions on the same item, at least one a write. Each conflict adds an edge from the earlier operation's transaction to the later one's.",
    items: draw(null),
  });
  const added = new Set<string>();
  pairs.forEach(([i, j], k) => {
    const a = S1[i];
    const b = S1[j];
    const e = `T${a.t} → T${b.t}`;
    const dup = added.has(e);
    added.add(e);
    const why = a.kind === "W" && b.kind === "W" ? "both write" : a.kind === "W" ? "a write then a read" : "a read then a write";
    frames.push({
      caption: `${opText(a)} at step ${i + 1} and ${opText(b)} at step ${j + 1}: same item ${a.item}, ${why}. ${dup ? `The edge ${e} is already there; a second conflict adds nothing.` : `Edge ${e}.`}`,
      items: draw(k),
    });
  });
  frames.push({
    caption: `The graph has ${edges.size} edges and no cycle, so S1 is conflict serializable. T2 has no incoming edge and goes first, then T1, then T3: the only topological order, and the equivalent serial schedule.`,
    items: draw(null, true),
  });
  return finish({ title: "Building the precedence graph of S1", input: `S1 = ${S1.map(opText).join(", ")}`, frames });
}

/* ── S2: the lost update as a cycle ───────────────────────────────── */

function lostUpdate(): Walkthrough {
  const S2 = parse("R1(A), R2(A), W1(A), W2(A)");
  const START = 5000;
  const delta: Record<number, number> = { 1: -1000, 2: 500 };
  // Run the interleaving: each transaction writes back what it read plus its own change.
  let A = START;
  const local: Record<number, number> = {};
  const shown = S2.map((o) => {
    if (o.kind === "R") local[o.t] = A;
    else A = local[o.t] + delta[o.t];
    return `${opText(o)} = ${o.kind === "R" ? local[o.t] : A}`;
  });
  const serial = START + delta[1] + delta[2];
  const pairs = conflicts(S2);
  const edges = new Set(pairs.map(([i, j]) => `${S2[i].t}>${S2[j].t}`));
  if (!(edges.has("1>2") && edges.has("2>1")) || topoOrders([1, 2], edges).length !== 0) throw new Error("lost-update: S2 should have a cycle");
  if (A !== 5500 || serial !== 4500) throw new Error(`lost-update: final ${A}, serial ${serial} disagree with the note`);

  const g = scheduleGrid("s", S2, 2, { w: 112, text: (i) => shown[i], tone: (i) => (S2[i].kind === "W" && S2[i].t === 1 ? "error" : "plain") });
  const GX = g.right + 66;
  const pos: Record<number, { x: number; y: number }> = { 1: { x: GX, y: 70 }, 2: { x: GX + 132, y: 70 } };
  const R = 19;
  const items: Item[] = [...g.items];
  const why: Record<string, string> = {};
  for (const [i, j] of pairs) {
    const e = `${S2[i].t}>${S2[j].t}`;
    why[e] ??= `${opText(S2[i])} before ${opText(S2[j])}`;
  }
  items.push(link("g12", pos[1], pos[2], R, { arrow: true, tone: "error", bow: -36 }));
  items.push(link("g21", pos[2], pos[1], R, { arrow: true, tone: "error", bow: -36 }));
  [1, 2].forEach((t) => items.push({ k: "node", id: `n${t}`, x: pos[t].x, y: pos[t].y, r: R, text: `T${t}`, tone: "error" }));
  items.push(label("w12", why["1>2"], (pos[1].x + pos[2].x) / 2, pos[1].y - 48, { tone: "soft", size: 11, mono: true }));
  items.push(label("w21", why["2>1"], (pos[1].x + pos[2].x) / 2, pos[1].y + 48, { tone: "soft", size: 11, mono: true }));
  items.push(label("fin", `final A = ${A}; either serial order gives ${serial}`, 0, g.bottom + 24, { anchor: "start", tone: "error", size: 12, mono: true, weight: 600 }));
  return finish({
    title: "S2 has a cycle: the lost update",
    input: `S2 = ${S2.map(opText).join(", ")}; T1 debits 1000, T2 credits 500, A = ${START}`,
    frames: [
      {
        caption: `R1(A) comes before W2(A), giving T1 → T2, and R2(A) comes before W1(A), giving T2 → T1: a cycle, so S2 is not conflict serializable. Both read ${START}, and T2's write of ${A} wipes out T1's debit.`,
        items,
      },
    ],
  });
}

/* ── The anomalies, step by step ──────────────────────────────────── */

type Line = { t: 1 | 2; text: string; db: string };

function anomalies(): Walkthrough {
  // A dirty read: T2 reads a value T1 later rolls back.
  const dirty = (() => {
    let A = 5000;
    const out: Line[] = [];
    const before = A;
    A -= 1000;
    out.push({ t: 1, text: `write(A) = ${A}`, db: `A = ${A}` });
    const seen = A;
    out.push({ t: 2, text: `read(A) = ${seen}`, db: `A = ${A}` });
    A = before;
    out.push({ t: 1, text: "rollback", db: `A = ${A}` });
    return { out, seen, final: A };
  })();
  // A non-repeatable read: the same row read twice gives two committed values.
  const nonRepeatable = (() => {
    let A = 5000;
    const out: Line[] = [];
    const first = A;
    out.push({ t: 1, text: `read(A) = ${first}`, db: `A = ${A}` });
    A = 4000;
    out.push({ t: 2, text: `write(A) = ${A}`, db: `A = ${A}` });
    out.push({ t: 2, text: "commit", db: `A = ${A}` });
    const second = A;
    out.push({ t: 1, text: `read(A) = ${second}`, db: `A = ${A}` });
    return { out, first, second };
  })();
  // A phantom: the same query returns a new row.
  const phantom = (() => {
    const rows: Record<string, number> = { A: 5000, B: 3000 };
    const count = () => Object.values(rows).filter((v) => v > 1000).length;
    const names = () => Object.keys(rows).join(", ");
    const out: Line[] = [];
    const first = count();
    out.push({ t: 1, text: `count > 1000: ${first}`, db: names() });
    rows.C = 2000;
    out.push({ t: 2, text: "insert C = 2000", db: names() });
    out.push({ t: 2, text: "commit", db: names() });
    const second = count();
    out.push({ t: 1, text: `count > 1000: ${second}`, db: names() });
    return { out, first, second };
  })();
  if (dirty.seen !== 4000 || dirty.final !== 5000 || nonRepeatable.second !== 4000 || phantom.first !== 2 || phantom.second !== 3) throw new Error("anomalies: values disagree with the note");

  const CW = 134;
  const RH = 26;
  const XD = CW + 22;
  const DW = 96;
  const X2 = XD + DW + 22;
  const rowY = (i: number) => 26 + i * (RH + 6);
  const draw = (lines: readonly Line[], bad: number[], dbTitle: string): Item[] => {
    const items: Item[] = [
      label("h1", "T1", CW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
      label("hd", dbTitle, XD + DW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
      label("h2", "T2", X2 + CW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
    ];
    lines.forEach((l, i) => {
      items.push(box(`c${i}`, l.t === 1 ? 0 : X2, rowY(i), l.text, { w: CW, h: RH, size: 11.5, tone: bad.includes(i) ? "error" : l.text === "commit" || l.text === "rollback" ? "muted" : "plain" }));
      items.push(label(`d${i}`, l.db, XD + DW / 2, rowY(i) + RH / 2, { tone: "faint", size: 11.5, mono: true }));
    });
    return items;
  };
  return finish({
    title: "Three anomalies of weak isolation, step by step",
    input: "account A holds ₹5,000",
    frames: [
      {
        caption: `Dirty read: T2 reads ${dirty.seen}, written by T1 but not committed, and then T1 rolls back to ${dirty.final}. T2 has acted on a value that never existed. READ COMMITTED and above prevent it.`,
        items: draw(dirty.out, [1], "A in the table"),
      },
      {
        caption: `Non-repeatable read: T1 reads A twice and gets ${nonRepeatable.first}, then ${nonRepeatable.second}, because T2 updated A and committed in between. Both values are committed; REPEATABLE READ prevents it.`,
        items: draw(nonRepeatable.out, [3], "A in the table"),
      },
      {
        caption: `Phantom read: T1 runs the same count twice and gets ${phantom.first}, then ${phantom.second}, because T2 inserted a matching row and committed. No row T1 read changed; only SERIALIZABLE prevents it in the standard.`,
        items: draw(phantom.out, [3], "rows in table"),
      },
    ],
  });
}

/* ── Two-phase locking ────────────────────────────────────────────── */

function twoPhaseLocking(): Walkthrough {
  // T1's transfer under 2PL: X locks before each write, released after (basic) or at commit (strict).
  const basic = ["X(A)", "r(A)", "w(A)", "X(B)", "r(B)", "w(B)", "U(A)", "U(B)", "commit"];
  const strict = ["X(A)", "r(A)", "w(A)", "X(B)", "r(B)", "w(B)", "commit", "U(A)", "U(B)"];
  const run = (ops: readonly string[]) => {
    let held = 0;
    let firstUnlock = -1;
    let lockPoint = -1;
    const after = ops.map((o, i) => {
      if (o.startsWith("X(") || o.startsWith("S(")) {
        if (firstUnlock >= 0) throw new Error(`two-phase-locking: ${o} after an unlock breaks 2PL`);
        held++;
        lockPoint = i;
      } else if (o.startsWith("U(")) {
        held--;
        if (firstUnlock < 0) firstUnlock = i;
      }
      return held;
    });
    return { after, lockPoint, firstUnlock, commit: ops.indexOf("commit") };
  };
  const b = run(basic);
  const s = run(strict);
  if (!(s.firstUnlock > s.commit) || !(b.firstUnlock < b.commit)) throw new Error("two-phase-locking: strict 2PL must release after commit");

  const W = 46;
  const G = 4;
  const UNIT = 34;
  const BASE = 110;
  const sx = (i: number) => i * (W + G);
  const draw = (ops: readonly string[], r: ReturnType<typeof run>, strictMode: boolean): Item[] => {
    const items: Item[] = [];
    items.push({ k: "path", id: "ax", pts: [[-6, BASE - 2 * UNIT - 18], [-6, BASE], [sx(ops.length) - G + 4, BASE]], tone: "ink", width: 1.2 });
    [0, 1, 2].forEach((n) => items.push(label(`yt${n}`, String(n), -12, BASE - n * UNIT, { anchor: "end", tone: "faint", size: 10.5, mono: true })));
    items.push(label("yl", "locks held", -6, BASE - 2 * UNIT - 30, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    // The count as a step line: each operation's slot at the height held after it.
    const pts: Array<[number, number]> = [[sx(0), BASE]];
    r.after.forEach((h, i) => {
      pts.push([sx(i), BASE - h * UNIT]);
      pts.push([sx(i) + W + G, BASE - h * UNIT]);
    });
    items.push({ k: "path", id: "line", pts, tone: "accent", width: 2.2 });
    ops.forEach((o, i) => items.push(box(`op${o}`, sx(i), BASE + 10, o, { w: W, h: 24, size: 11, tone: o === "commit" ? "strong" : o.startsWith("X") ? "accent" : o.startsWith("U") ? "muted" : "plain" })));
    const lp = sx(r.lockPoint) + W + G / 2;
    items.push({ k: "edge", id: "lp", x1: lp, y1: BASE - 2 * UNIT - 14, x2: lp, y2: BASE + 6, tone: "ink", dashed: true });
    items.push(label("lpt", "lock point", lp, BASE - 2 * UNIT - 22, { tone: "ink", size: 11, weight: 600 }));
    items.push({ k: "span", id: "gr", x1: sx(0) + 2, x2: lp - 3, y: BASE + 46, label: "growing: only acquire", tone: "accent", down: true });
    items.push({ k: "span", id: "sh", x1: sx(r.firstUnlock) + 2, x2: sx(ops.length - 1) + W - 2, y: BASE + 46, label: strictMode ? "release at commit" : "shrinking: only release", tone: "ink", down: true });
    return items;
  };
  return finish({
    title: "Two-phase locking: a growing phase, then a shrinking phase",
    input: "T1 transfers from A to B; X(·) locks, U(·) unlocks",
    frames: [
      {
        caption: `Basic 2PL: T1 takes X(A) and X(B) as it needs them, and its lock point is X(B), its last acquisition. After the first unlock it may never lock again, which is what makes every 2PL schedule conflict serializable.`,
        items: draw(basic, b, false),
      },
      {
        caption: "Strict 2PL holds its exclusive locks until commit, so no other transaction can read or overwrite T1's uncommitted writes. An abort then never forces anyone else to roll back.",
        items: draw(strict, s, true),
      },
    ],
  });
}

/* ── Deadlock: two lock upgrades ──────────────────────────────────── */

function deadlock(): Walkthrough {
  type Mode = "S" | "X";
  const holders = new Map<number, Mode>();
  const waits = new Map<number, Mode>();
  const compatible = (a: Mode, b: Mode) => a === "S" && b === "S";
  /** A request: granted if every other holder's mode is compatible, else the transaction waits for each of them. */
  const request = (t: number, m: Mode): { granted: boolean; waitsFor: number[] } => {
    const others = [...holders].filter(([h]) => h !== t);
    const blockers = others.filter(([, hm]) => !compatible(hm, m)).map(([h]) => h);
    if (blockers.length === 0) {
      holders.set(t, m);
      waits.delete(t);
      return { granted: true, waitsFor: [] };
    }
    waits.set(t, m);
    return { granted: false, waitsFor: blockers };
  };
  const waitFor = new Set<string>();
  const cycle = () => [...waitFor].some((e) => {
    const [a, b] = e.split(">");
    return waitFor.has(`${b}>${a}`);
  });

  const steps: Array<{ t: number; m: Mode }> = [
    { t: 1, m: "S" },
    { t: 2, m: "S" },
    { t: 1, m: "X" },
    { t: 2, m: "X" },
  ];
  const log: Array<{ t: number; text: string; tone: Tone }> = [];
  const frames: Frame[] = [];
  const CW = 140;
  const RH = 26;
  const rowY = (i: number) => 26 + i * (RH + 6);
  const X2 = CW + 16;
  const LX = X2 + CW + 40;
  const pos: Record<number, { x: number; y: number }> = { 1: { x: LX + 20, y: 150 }, 2: { x: LX + 130, y: 150 } };
  const R = 19;
  const draw = (o: { dead?: boolean; victim?: number } = {}): Item[] => {
    const items: Item[] = [label("h1", "T1", CW / 2, 8, { tone: "soft", size: 11.5, weight: 600 }), label("h2", "T2", X2 + CW / 2, 8, { tone: "soft", size: 11.5, weight: 600 })];
    log.forEach((l, i) => items.push(box(`c${i}`, l.t === 1 ? 0 : X2, rowY(i), l.text, { w: CW, h: RH, size: 11.5, tone: l.tone })));
    items.push(label("lt", "lock on A", LX, 8, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
    items.push(label("lh", "held:", LX, 32, { anchor: "start", tone: "faint", size: 11 }));
    [...holders].sort(([a], [b]) => a - b).forEach(([t, m], k) => items.push(box(`hd${t}`, LX + 40 + k * 58, 20, `${m} T${t}`, { w: 52, h: 24, size: 11.5, tone: "accent" })));
    items.push(label("lw", "waits:", LX, 64, { anchor: "start", tone: "faint", size: 11 }));
    [...waits].sort(([a], [b]) => a - b).forEach(([t, m], k) => items.push(box(`wt${t}`, LX + 40 + k * 58, 52, `${m} T${t}`, { w: 52, h: 24, size: 11.5, tone: o.dead ? "error" : "plain" })));
    items.push(label("gt", "wait-for graph", LX, 112, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
    for (const e of waitFor) {
      const [a, b] = e.split(">").map(Number);
      items.push(link(`g${a}${b}`, pos[a], pos[b], R, { arrow: true, tone: o.dead ? "error" : "accent", bow: waitFor.size > 1 ? -20 : 0 }));
    }
    [1, 2].forEach((t) => items.push({ k: "node", id: `n${t}`, x: pos[t].x, y: pos[t].y, r: R, text: `T${t}`, tone: t === o.victim ? "muted" : o.dead ? "error" : "plain" }));
    return items;
  };

  const captions: string[] = [];
  steps.forEach((st, i) => {
    const r = request(st.t, st.m);
    const other = st.t === 1 ? 2 : 1;
    if (r.granted) {
      log.push({ t: st.t, text: `${st.m}(A) granted`, tone: "plain" });
      captions.push(i === 0 ? `T1 wants to read the balance, so it asks for a shared lock on A. Nobody holds A: granted.` : `T2 asks for S(A) too. Shared locks are compatible with each other, so both transactions now hold S(A) and both read the same balance.`);
    } else {
      for (const w of r.waitsFor) waitFor.add(`${st.t}>${w}`);
      log.push({ t: st.t, text: `${st.m}(A): waits`, tone: "accent" });
      captions.push(cycle()
        ? `T2 asks to upgrade to X(A) as well, and must wait for T1's shared lock. T2 waits for T1 and T1 waits for T2: a cycle in the wait-for graph, which is a deadlock. Neither can ever proceed.`
        : `T1 asks to upgrade to X(A) to write the new balance. X conflicts with T${other}'s S, so T1 waits, and the wait-for graph gets the edge T1 → T${other}.`);
    }
    frames.push({ caption: captions[i], items: draw({ dead: cycle() }) });
  });
  if (!cycle()) throw new Error("deadlock: the two upgrades should deadlock");
  // Detection picks a victim and rolls it back; its locks go, and the other's upgrade is granted.
  const victim = 2;
  holders.delete(victim);
  waits.delete(victim);
  for (const e of [...waitFor]) if (e.includes(String(victim))) waitFor.delete(e);
  const r = request(1, "X");
  if (!r.granted) throw new Error("deadlock: T1's upgrade should be granted once T2 is gone");
  log.push({ t: victim, text: "rolled back", tone: "error" });
  log.push({ t: 1, text: "X(A) granted", tone: "strong" });
  frames.push({
    caption: "The DBMS finds the cycle and rolls back one victim, here T2. Its shared lock is released, T1's upgrade to X(A) is granted, and T2 restarts later. Taking X(A) at the first read, as SELECT … FOR UPDATE does, avoids this deadlock.",
    items: draw({ victim }),
  });
  return finish({ title: "A deadlock from two lock upgrades, and how it is broken", input: "T1 and T2 each read A, then try to write it", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "precedence-graph": precedenceGraph,
  "lost-update": lostUpdate,
  anomalies,
  "two-phase-locking": twoPhaseLocking,
  deadlock,
};
