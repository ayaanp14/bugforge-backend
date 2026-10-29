import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { grid, label } from "../lesson-figures/kit.js";
import { packet, service, wire, along, type NodeBox } from "./sd-kit.js";

/**
 * CAP Theorem: the note's figures (content/notes/system-design/
 * cap-theorem.md). Three replicas of one value x, and a small simulator
 * that applies each operation the way the mode says — the figures draw what
 * it returned:
 *
 *  - cp-partition / ap-partition: the same six operations (a write, a
 *    partition that cuts C off, a write on the majority side, a read and a
 *    write on C, a read on A) in a CP system that needs a majority (2 of 3)
 *    and an AP system that answers from whatever replica it reaches.
 *  - heal: the AP run's two histories meeting again — the replicas swap
 *    versions and last-write-wins settles every replica on one value.
 *  - quorum: every (R, W) pair for N = 3 against R + W > N, then a W = 1 /
 *    R = 1 read missing the write and a W = 2 write that every 2-replica
 *    read overlaps.
 */

type Mode = "CP" | "AP";
const NAMES = ["A", "B", "C"];
const MAJORITY = Math.floor(NAMES.length / 2) + 1;

interface Replica {
  value: number;
  /** The logical time of the write it holds: higher is newer. */
  stamp: number;
}

type Op = { kind: "write"; at: number; value: number } | { kind: "read"; at: number } | { kind: "partition"; cut: number } | { kind: "heal" };

interface Outcome {
  ok: boolean;
  /** For a read: the value returned. */
  value?: number;
  /** For a read: the newest value any replica holds, to say whether the answer was stale. */
  newest?: number;
}

/** A tiny replicated register: writes go to every replica the receiver can reach, under the mode's rule. */
class Cluster {
  replicas: Replica[] = NAMES.map(() => ({ value: 0, stamp: 0 }));
  /** The replica cut off by the partition, or -1 when the network is whole. */
  cut = -1;
  clock = 0;
  constructor(readonly mode: Mode) {}
  /** The replicas `i` can reach, itself included. */
  side(i: number): number[] {
    if (this.cut < 0) return NAMES.map((_, j) => j);
    return NAMES.map((_, j) => j).filter((j) => (j === this.cut) === (i === this.cut));
  }
  apply(op: Op): Outcome {
    this.clock += 1;
    if (op.kind === "partition") {
      this.cut = op.cut;
      return { ok: true };
    }
    if (op.kind === "heal") {
      this.cut = -1;
      return { ok: true };
    }
    const side = this.side(op.at);
    // CP: refuse anything that cannot reach a majority, so no two sides can both accept writes.
    if (this.mode === "CP" && side.length < MAJORITY) return { ok: false };
    if (op.kind === "write") {
      for (const j of side) this.replicas[j] = { value: op.value, stamp: this.clock };
      return { ok: true };
    }
    const newest = this.replicas.reduce((a, b) => (b.stamp > a.stamp ? b : a)).value;
    return { ok: true, value: this.replicas[op.at].value, newest };
  }
  /** Anti-entropy after a heal: every replica takes the newest stamp (last write wins). */
  converge(): void {
    const best = this.replicas.reduce((a, b) => (b.stamp > a.stamp ? b : a));
    this.replicas = this.replicas.map(() => ({ ...best }));
  }
}

const OPS: Op[] = [
  { kind: "write", at: 0, value: 1 },
  { kind: "partition", cut: 2 },
  { kind: "write", at: 0, value: 2 },
  { kind: "read", at: 2 },
  { kind: "write", at: 2, value: 3 },
  { kind: "read", at: 0 },
];

/* ── Drawing the three replicas ───────────────────────────────────── */

const POS = [
  { x: 0, y: 0 },
  { x: 0, y: 128 },
  { x: 270, y: 64 },
];
const W = 104;
const PX = 187; // where the partition line runs

function boxes(c: Cluster, tone: (i: number) => Tone, sub?: (i: number) => string): NodeBox[] {
  return NAMES.map((n, i) => service(`r${i}`, POS[i].x, POS[i].y, `Replica ${n}`, { w: W, tone: tone(i), sub: sub ? sub(i) : `x = ${c.replicas[i].value}` }));
}

/** The links between replicas; a link across the partition is drawn cut. */
function links(b: NodeBox[], cut: number): Item[] {
  const pairs: Array<[number, number, { x: number; y: number }, { x: number; y: number }]> = [
    // A–B runs down the boxes' left side, clear of the value written under A.
    [0, 1, { x: b[0].left.x + 14, y: b[0].bottom.y }, { x: b[1].left.x + 14, y: b[1].top.y }],
    [0, 2, b[0].right, b[2].left],
    [1, 2, b[1].right, b[2].left],
  ];
  return pairs.map(([i, j, p, q]) => {
    const broken = cut >= 0 && (i === cut) !== (j === cut);
    return wire(`l${i}${j}`, p, q, { head: false, tone: broken ? "error" : "line", dashed: broken });
  });
}

function partitionLine(on: boolean): Item[] {
  if (!on) return [];
  return [
    { k: "path", id: "cutline", pts: [[PX, -28], [PX, 186]], tone: "error", dashed: true, width: 2 },
    label("cutlabel", "network partition", PX, -38, { tone: "error", size: 11, weight: 600 }),
  ];
}

/** Where an operation's request floats beside its replica: left of A and B, right of C. */
function opSpot(b: NodeBox, i: number): { x: number; y: number } {
  return i === 2 ? { x: b.right.x + 22, y: b.mid.y } : { x: b.left.x - 22, y: b.mid.y };
}

function opText(op: Op): string {
  if (op.kind === "write") return `write x = ${op.value} at ${NAMES[op.at]}`;
  if (op.kind === "read") return `read x at ${NAMES[op.at]}`;
  if (op.kind === "partition") return `the link to ${NAMES[op.cut]} is cut`;
  return "the network heals";
}

function partitionRun(mode: Mode): Walkthrough {
  const c = new Cluster(mode);
  const frames: Frame[] = [];
  const results: Outcome[] = [];
  OPS.forEach((op, k) => {
    const out = c.apply(op);
    results.push(out);
    const target = op.kind === "write" || op.kind === "read" ? op.at : -1;
    const written = op.kind === "write" && out.ok ? c.side(op.at) : [];
    const b = boxes(c, (i) => (i === target && !out.ok ? "error" : written.includes(i) ? "accent" : i === target ? "accent" : "plain"));
    const items: Item[] = [...partitionLine(c.cut >= 0), ...links(b, c.cut)];
    b.forEach((x) => items.push(...x.items));
    items.push(label("step", `${k + 1}. ${opText(op)}`, 150, 222, { tone: "ink", size: 12, weight: 600 }));
    if (target >= 0) {
      const spot = opSpot(b[target], target);
      items.push(packet("op", spot, { text: op.kind === "write" ? "W" : "R", tone: out.ok ? "accent" : "error" }));
      const reply = !out.ok ? "refused" : op.kind === "read" ? (out.value === out.newest ? `x = ${out.value}` : `x = ${out.value} (stale)`) : "OK";
      const tone = !out.ok ? "error" : op.kind === "read" && out.value !== out.newest ? "error" : "accent";
      items.push(label("res", reply, spot.x, spot.y + 24, { tone, size: 11, weight: 600 }));
    }
    const side = c.side(0).map((i) => NAMES[i]).join(" and ");
    let caption: string;
    if (op.kind === "partition") caption = `The network splits: ${NAMES[op.cut]} can no longer reach ${side}. Partitions are not a design choice; on a real network they happen, and the system must decide what to do.`;
    else if (k === 0) caption = `Before any failure, a write of x = ${(op as { value: number }).value} reaches all three replicas, so every replica agrees. This system is ${mode === "CP" ? "CP: it needs a majority (2 of 3) for every request" : "AP: any reachable replica answers"}.`;
    else if (op.kind === "write" && out.ok) caption = `${NAMES[op.at]} can reach ${c.side(op.at).length} of 3 replicas${mode === "CP" ? ", a majority, so the write is accepted" : ", and an AP system accepts the write anyway"}: ${c.side(op.at).map((i) => NAMES[i]).join(" and ")} now ${c.side(op.at).length === 1 ? "holds" : "hold"} x = ${op.value}.`;
    else if (op.kind === "write") caption = `${NAMES[op.at]} alone is not a majority, so the write of x = ${op.value} is refused. The client gets an error, but no replica can ever disagree with the majority side.`;
    else if (op.kind === "heal") throw new Error("cap-theorem: the partition run has no heal");
    else if (!out.ok) caption = `A read at ${NAMES[op.at]} is refused: ${NAMES[op.at]} cannot reach a majority, so it cannot prove its x = ${c.replicas[op.at].value} is the latest. Consistent, but unavailable on this side.`;
    else if (mode === "AP" && op.at !== c.cut) caption = `A read at ${NAMES[op.at]} returns x = ${out.value}, while ${NAMES[c.cut]} holds x = ${c.replicas[c.cut].value}. Both sides kept accepting writes, and their copies have diverged.`;
    else if (out.value !== out.newest) caption = `The read at ${NAMES[op.at]} answers x = ${out.value} straight away, though x = ${out.newest} was written on the other side. Available, but the answer is stale.`;
    else if (mode === "CP") caption = `A read at A, on the majority side, returns x = ${out.value}, the latest write. The CP system stayed correct and lost only the cut-off side.`;
    else caption = `A read at ${NAMES[op.at]} returns x = ${out.value}.`;
    frames.push({ caption, items });
  });
  // The claims the note makes about the two runs.
  const cRead = results[3];
  if (mode === "CP" && (cRead.ok || results[4].ok)) throw new Error("cap-theorem: CP must refuse the cut-off side");
  if (mode === "AP" && (!cRead.ok || cRead.value === cRead.newest)) throw new Error("cap-theorem: AP's read on the cut-off side should be stale");
  return finish({
    title: mode === "CP" ? "A CP system during a partition: the cut-off side refuses" : "An AP system during a partition: every side answers, maybe stale",
    input: "",
    frames,
  });
}

/* ── Healing an AP partition ──────────────────────────────────────── */

function heal(): Walkthrough {
  const c = new Cluster("AP");
  OPS.forEach((op) => c.apply(op));
  const before = c.replicas.map((r) => ({ ...r }));
  const values = [...new Set(before.map((r) => r.value))];
  if (values.length < 2) throw new Error("cap-theorem: the AP run should leave the replicas disagreeing");
  const frames: Frame[] = [];
  const sub = (rs: Replica[]) => (i: number) => `x = ${rs[i].value} · t${rs[i].stamp}`;
  const draw = (rs: Replica[], cut: number, tone: (i: number) => Tone, extra: Item[], caption: string) => {
    const b = boxes(c, tone, sub(rs));
    const items: Item[] = [...partitionLine(cut >= 0), ...links(b, cut)];
    b.forEach((x) => items.push(...x.items));
    items.push(...extra);
    frames.push({ caption, items });
  };
  const b0 = boxes(c, () => "plain");
  draw(before, 2, () => "plain", [], `After the AP run the replicas disagree: A and B hold x = ${before[0].value} (written at t${before[0].stamp}), C holds x = ${before[2].value} (t${before[2].stamp}). Each write carries the time it was made.`);
  c.apply({ kind: "heal" });
  const readB = c.apply({ kind: "read", at: 1 });
  draw(before, -1, (i) => (i === 1 ? "accent" : "plain"), [packet("rd", opSpot(b0[1], 1), { text: "R" }), label("rdv", `x = ${readB.value} (stale)`, opSpot(b0[1], 1).x, opSpot(b0[1], 1).y + 24, { tone: "error", size: 11, weight: 600 })], `The network heals, but nothing has synced yet: a read at B still answers x = ${readB.value}. Right after a partition, replicas can disagree for a while.`);
  const newest = before.reduce((a, b) => (b.stamp > a.stamp ? b : a));
  const owner = before.indexOf(newest);
  const swap: Item[] = [
    packet("v-new", along(b0[owner].left, b0[0].right, 0.3), { text: `t${newest.stamp}` }),
    packet("v-new2", along(b0[owner].left, b0[1].right, 0.3), { text: `t${newest.stamp}` }),
    packet("v-old", along(b0[0].right, b0[owner].left, 0.25), { text: `t${before[0].stamp}`, tone: "muted" }),
  ];
  draw(before, -1, (i) => (i === owner ? "accent" : "plain"), swap, `Anti-entropy: the replicas exchange what they hold and compare the timestamps. C's write (t${newest.stamp}) is newer than A's and B's (t${before[0].stamp}).`);
  c.converge();
  const after = c.replicas;
  if (new Set(after.map((r) => r.value)).size !== 1) throw new Error("cap-theorem: the replicas should agree after converging");
  draw(after, -1, (i) => (before[i].value !== after[i].value ? "accent" : "plain"), [], `Last write wins: A and B take x = ${after[0].value}. The write of x = ${before[0].value} is silently discarded, a known cost of this rule; vector clocks or CRDTs keep both instead.`);
  draw(after, -1, () => "strong", [], `Every replica now holds x = ${after[0].value}: the system has converged. That is eventual consistency: if writes stop, all replicas end up agreeing.`);
  return finish({ title: "After the partition heals: replicas swap versions and converge", input: "", frames });
}

/* ── Quorums ──────────────────────────────────────────────────────── */

function quorum(): Walkthrough {
  const N = 3;
  const rows = [1, 2, 3].map((r) => [1, 2, 3].map((w) => r + w));
  const G = { x: 0, y: 30, w: 46, h: 32, gap: 4 };
  const ok = (r: number, w: number) => r + w > N;
  const good = rows.flatMap((row, r) => row.map((_, w) => [r + 1, w + 1] as const)).filter(([r, w]) => ok(r, w));
  // Three replicas, each holding a value and a version.
  let reps = Array.from({ length: N }, () => ({ value: 4, ver: 1 }));
  const NX = 230;
  const NY = (i: number) => 12 + i * 62;
  const frames: Frame[] = [];
  const draw = (o: { cells: "plain" | "graded"; pick?: [number, number]; pickTone?: Tone; write?: number[]; read?: number[]; got?: number; mark?: number; caption: string }) => {
    const items: Item[] = grid("g", rows, {
      ...G,
      rowLabels: ["R = 1", "R = 2", "R = 3"],
      colLabels: ["W = 1", "W = 2", "W = 3"],
      text: (r, w) => `${rows[r][w]}`,
      tone: (r, w) => (o.pick && o.pick[0] === r + 1 && o.pick[1] === w + 1 ? (o.pickTone ?? "accent") : o.cells === "plain" ? "plain" : ok(r + 1, w + 1) ? "strong" : "muted"),
    });
    items.push(label("gt", "R + W", G.x + (3 * (G.w + G.gap)) / 2, G.y - 30, { size: 11, tone: "soft", weight: 600 }));
    items.push(label("gn", `N = ${N}: strong when R + W > ${N}`, G.x + (3 * (G.w + G.gap)) / 2 - 10, G.y + 3 * (G.h + G.gap) + 14, { size: 11 }));
    reps.forEach((rep, i) => {
      const tone: Tone = o.mark === i ? "strong" : o.read?.includes(i) && o.got !== undefined && rep.value !== o.got ? "error" : o.read?.includes(i) || o.write?.includes(i) ? "accent" : "plain";
      const b = service(`n${i}`, NX, NY(i), `Replica ${i + 1}`, { w: 96, tone, sub: `x = ${rep.value} · v${rep.ver}` });
      items.push(...b.items);
      const tag = [o.write?.includes(i) ? "written" : "", o.read?.includes(i) ? "read" : ""].filter(Boolean).join(" + ");
      if (tag) items.push(label(`tag${i}`, tag, NX + 104, NY(i) + 19, { anchor: "start", size: 11, tone: "accent" }));
    });
    frames.push({ caption: o.caption, items });
  };
  draw({ cells: "plain", caption: `With N = ${N} replicas, a write waits for W of them to confirm and a read asks R of them. The table lists R + W for every choice of R and W.` });
  draw({ cells: "graded", caption: `When R + W > N, any R replicas and any W replicas must share at least one, so a read always reaches the latest write. ${good.length} of the 9 pairs qualify, such as R = 2, W = 2.` });
  // A pair that fails the rule: W = 1, R = 1.
  reps = reps.map((r, i) => (i === 0 ? { value: 5, ver: 2 } : r));
  draw({ cells: "graded", pick: [1, 1], pickTone: "error", write: [0], caption: `Take W = 1: a write of x = 5 is confirmed as soon as Replica 1 has it (v2). Replicas 2 and 3 have not seen it yet.` });
  const stale = reps[2];
  if (stale.ver === 2) throw new Error("cap-theorem: the R = 1 read should miss the write");
  draw({ cells: "graded", pick: [1, 1], pickTone: "error", read: [2], got: Math.max(...reps.map((r) => r.value)), caption: `With R = 1 a read may ask only Replica 3 and get x = ${stale.value} (v${stale.ver}): 1 + 1 is not greater than 3, so the read set can miss the write set.` });
  // The quorum pair: W = 2, R = 2.
  const writeSet = [0, 1];
  reps = reps.map((r, i) => (writeSet.includes(i) ? { value: 6, ver: 3 } : r));
  draw({ cells: "graded", pick: [2, 2], write: writeSet, caption: `Now W = 2: a write of x = 6 waits for Replicas 1 and 2 to confirm (v3). Replica 3 is still behind.` });
  const readSets = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  readSets.forEach((rs, k) => {
    const overlap = rs.filter((i) => writeSet.includes(i));
    if (overlap.length === 0) throw new Error("cap-theorem: a 2-replica read must overlap the 2-replica write");
    const best = rs.reduce((a, b) => (reps[b].ver > reps[a].ver ? b : a));
    if (reps[best].value !== 6) throw new Error("cap-theorem: the quorum read should return the latest write");
    const names = rs.map((i) => `Replica ${i + 1}`).join(" and ");
    const caption =
      k === 0
        ? `A read with R = 2 that asks ${names} sees v3 on both and returns x = ${reps[best].value}.`
        : k === 1
          ? `Asking ${names} gets v3 and v1; the reader keeps the higher version, x = ${reps[best].value}. Replica ${best + 1} is in both the read and the write set.`
          : `Even ${names}, which includes the stale replica, overlaps the write at Replica ${best + 1}. Every 2-replica read meets the 2-replica write, so R + W > N holds.`;
    draw({ cells: "graded", pick: [2, 2], read: rs, mark: best, caption });
  });
  return finish({ title: "Quorums: with N = 3, R + W > N makes every read meet the last write", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "cp-partition": () => partitionRun("CP"),
  "ap-partition": () => partitionRun("AP"),
  heal,
  quorum,
};

