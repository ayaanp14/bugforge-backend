import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { lifelines, message } from "./kit.js";
import { database, packet, service, wire, type NodeBox } from "./sd-kit.js";

/**
 * Database Replication: the note's figures (content/notes/system-design/
 * database-replication.md). Every figure loops, and every value it draws is
 * computed by running a small model of replication:
 *
 *  - leader-follower: writes and reads from an app, as a pipeline; writes go
 *    to the leader and are shipped to both followers one step later, reads go
 *    round robin to the followers and return what that follower holds.
 *  - sync-vs-async: one write as a sequence diagram under both policies, the
 *    acknowledgement times summed from stated one-way delays, then the async
 *    leader crashing before it shipped the write.
 *  - stale-read: a write, a replication lag, and reads at stated times — the
 *    follower's value at each read is what the lag says it holds.
 *  - failover: the leader dies with followers at different log positions;
 *    the most up-to-date follower is promoted and the entries no follower has
 *    are counted as lost.
 */

/* ── Leader–follower ──────────────────────────────────────────────── */

function leaderFollower(): Walkthrough {
  type Req = { kind: "W"; value: number } | { kind: "R" };
  const reqs: Req[] = [{ kind: "W", value: 5 }, { kind: "R" }, { kind: "R" }, { kind: "W", value: 8 }, { kind: "R" }, { kind: "R" }];
  const names = ["Leader", "Follower 1", "Follower 2"];
  // Request j is at the app in frame j and at its node in frame j + 1; a write reaches the followers in frame j + 2.
  const leaderAt = (f: number) => reqs.reduce<number | null>((v, r, j) => (r.kind === "W" && j + 1 <= f ? r.value : v), null);
  const followerAt = (f: number) => reqs.reduce<number | null>((v, r, j) => (r.kind === "W" && j + 2 <= f ? r.value : v), null);
  const readTarget: number[] = [];
  let rr = 0;
  reqs.forEach((r, j) => (readTarget[j] = r.kind === "R" ? 1 + (rr++ % 2) : 0));
  const labelOf = (j: number) => `${reqs[j].kind}${reqs.slice(0, j + 1).filter((r) => r.kind === reqs[j].kind).length}`;
  const frames: Frame[] = [];
  let lastRead = "";
  for (let f = 0; f <= reqs.length + 1; f++) {
    const lv = leaderAt(f);
    const fv = followerAt(f);
    const app = service("app", 0, 110, "App", { w: 84, sub: lastRead || " ", subTone: "accent" });
    const nodes: NodeBox[] = names.map((n, i) =>
      database(`d${i}`, 200, i * 110, n, { w: 104, sub: `x = ${(i === 0 ? lv : fv) ?? "–"}`, tone: i === 0 ? "plain" : "plain" }),
    );
    const items: Item[] = [...app.items];
    const now = f - 1; // the request arriving at its node this frame
    nodes.forEach((n, i) => {
      const hot = now >= 0 && now < reqs.length && (reqs[now].kind === "W" ? i === 0 : readTarget[now] === i);
      items.push(wire(`a${i}`, app.right, n.left, { tone: hot ? "accent" : "line" }), ...n.items);
    });
    const shipping = f >= 2 && reqs[f - 2]?.kind === "W";
    nodes.slice(1).forEach((n, k) => items.push(wire(`rep${k}`, nodes[0].right, n.right, { tone: shipping ? "accent" : "faint", dashed: true, bow: -40 - 40 * k })));
    items.push(label("rep-t", "replication", nodes[0].right.x + 74, 160, { tone: "faint", size: 10 }));
    let lead = "";
    let ship = "";
    let readNo = 0;
    reqs.forEach((r, j) => {
      const at = f - j;
      if (at === 0) items.push(packet(`q${j}`, { x: app.mid.x, y: app.top.y - 16 }, { text: labelOf(j), r: 12 }));
      if (at === 1) {
        const node = nodes[r.kind === "W" ? 0 : readTarget[j]];
        items.push(packet(`q${j}`, { x: node.left.x + 16, y: node.top.y - 14 }, { text: labelOf(j), r: 12 }));
        if (r.kind === "W") lead = `${labelOf(j)} (x = ${r.value}) goes to the leader, the only node that accepts writes. It applies it and appends it to its log.`;
        else {
          const got = followerAt(f);
          if (got !== lv) throw new Error("leader-follower: this figure's reads should not be stale");
          readNo = reqs.slice(0, j + 1).filter((q) => q.kind === "R").length;
          lastRead = `${labelOf(j)} read x = ${got}`;
          lead =
            readNo === 1
              ? `${labelOf(j)} goes to ${names[readTarget[j]]}, chosen round robin, and reads x = ${got}. Reads never touch the leader.`
              : readNo === 2
                ? `${labelOf(j)} goes to ${names[readTarget[j]]} and reads x = ${got}. Each follower adds read capacity, which is why read-heavy systems replicate.`
                : `${labelOf(j)} reads x = ${got} from ${names[readTarget[j]]}; round robin keeps alternating between the two followers.`;
        }
      }
      if (r.kind === "W" && at === 2) {
        nodes.slice(1).forEach((n, k) => items.push(packet(`s${j}-${k}`, { x: n.right.x + 18, y: n.right.y - 18 }, { text: labelOf(j), r: 12, tone: "strong" })));
        ship = `The leader ships ${labelOf(j)} to both followers, which apply it in log order, so every node holds x = ${r.value}.`;
      }
    });
    let caption = [lead, ship].filter(Boolean).join(" ");
    if (f === 0) caption = "An app sends writes (W) and reads (R). One node is the leader; the followers keep copies of its data by replaying its log.";
    if (f === reqs.length + 1) caption = `All ${reqs.length} requests are done: ${reqs.filter((r) => r.kind === "W").length} writes went to the leader and ${reqs.filter((r) => r.kind === "R").length} reads were shared by the followers.`;
    // Keep the app's last-read line in step with the frame it happened in.
    items[1] = label("app-sub", lastRead || " ", app.mid.x, 110 + 38 + 13, { tone: "accent", size: 11 });
    frames.push({ caption, items });
  }
  return finish({ title: "Leader–follower: writes go to the leader, reads spread over followers", input: "", frames });
}

/* ── Synchronous vs asynchronous ──────────────────────────────────── */

function syncVsAsync(): Walkthrough {
  const CL = 1; // one-way delay client ↔ leader, ms (illustrative)
  const LF = 2; // one-way delay leader ↔ follower, ms (illustrative)
  const SHIP = 1; // an async leader ships its log in the background, a moment after it answers (illustrative)
  // Run both policies: each message is [from, to, sentAt, arrivesAt, text].
  type Msg = { from: number; to: number; at: number; arr: number; text: string };
  const sync: Msg[] = [];
  let t = 0;
  sync.push({ from: 0, to: 1, at: t, arr: (t += CL), text: "write" });
  sync.push({ from: 1, to: 2, at: t, arr: (t += LF), text: "replicate" });
  sync.push({ from: 2, to: 1, at: t, arr: (t += LF), text: "ack" });
  sync.push({ from: 1, to: 0, at: t, arr: (t += CL), text: "OK" });
  const syncOk = t;
  const async: Msg[] = [];
  t = 0;
  async.push({ from: 0, to: 1, at: t, arr: (t += CL), text: "write" });
  async.push({ from: 1, to: 0, at: t, arr: t + CL, text: "OK" });
  async.push({ from: 1, to: 2, at: t + SHIP, arr: t + SHIP + LF, text: "replicate" });
  const asyncOk = async[1].arr;
  if (asyncOk >= syncOk) throw new Error("sync-vs-async: async should acknowledge sooner");
  const MS = 28;
  const GAP = 92;
  const PANEL = 272;
  const LEN = syncOk * MS + 40;
  const frames: Frame[] = [];
  const draw = (upTo: { s: number; a: number }, caption: string, crashed = false) => {
    const items: Item[] = [];
    [sync, async].forEach((msgs, p) => {
      const x0 = p * PANEL;
      const ll = lifelines(`p${p}`, ["Client", "Leader", "Follower"], { x: x0 + 36, y: 20, gap: GAP, w: 64, h: 26, length: LEN, size: 11 });
      items.push(label(`t${p}`, p === 0 ? "Synchronous" : "Asynchronous", x0 + 36 + GAP, 6, { tone: "ink", size: 12, weight: 600 }));
      items.push(...ll.items);
      const y = (ms: number) => ll.top + 18 + ms * MS;
      msgs.forEach((m, k) => {
        if (k > (p === 0 ? upTo.s : upTo.a)) return;
        const lost = crashed && p === 1 && m.text === "replicate";
        const newest = k === (p === 0 ? upTo.s : upTo.a);
        {
          // The label sits on the clear side of the sloped arrow: above it, towards where the arrow is heading.
          const x1 = ll.xOf(m.from);
          const x2 = ll.xOf(m.to);
          const drop = (m.arr - m.at) * MS;
          const tone = lost ? "error" : newest && !crashed ? "accent" : "ink";
          const dir = Math.sign(x2 - x1);
          items.push(...message(`m${p}-${k}`, x1, x2, y(m.at), "", { drop, tone, dashed: m.text === "ack" || m.text === "OK" || lost }));
          items.push(label(`m${p}-${k}-t`, lost ? "never sent" : m.text, (x1 + x2) / 2 + dir * 4, y(m.at) + drop / 2 - 6, { anchor: dir > 0 ? "start" : "end", mono: true, size: 11, tone: tone === "ink" ? "ink" : tone }));
        }
        if (m.text === "OK") items.push(label(`ok${p}`, `OK at ${m.arr} ms`, ll.xOf(0) - 30, y(m.arr) + 14, { tone: "accent", size: 11, anchor: "start" }));
      });
      if (crashed && p === 1) {
        const cy = y(CL + SHIP / 2);
        const cx = ll.xOf(1);
        items.push({ k: "path", id: "x1", pts: [[cx - 7, cy - 7], [cx + 7, cy + 7]], tone: "error", width: 2.5 });
        items.push({ k: "path", id: "x2", pts: [[cx - 7, cy + 7], [cx + 7, cy - 7]], tone: "error", width: 2.5 });
        items.push(label("crash", "leader crashes", cx + 12, cy + 4, { tone: "error", size: 11, anchor: "start" }));
      }
    });
    frames.push({ caption, items });
  };
  draw({ s: 0, a: 0 }, `The same write under both policies. Delays here are illustrative: ${CL} ms each way between client and leader, ${LF} ms between leader and follower.`);
  draw({ s: 1, a: 1 }, `Synchronous: the leader sends the write to the follower and waits. Asynchronous: the leader answers OK at once, at ${asyncOk} ms.`);
  draw({ s: 2, a: 2 }, `The follower acknowledges the synchronous write. The asynchronous leader ships its write in the background, after the client was already told it succeeded.`);
  draw({ s: 3, a: 2 }, `The synchronous client hears OK at ${syncOk} ms, ${syncOk - asyncOk} ms later than the async one, but the write is now on two machines.`);
  draw({ s: 3, a: 2 }, `The risk: had the async leader crashed before shipping the write, the client holds an OK for data no follower has. A promoted follower would not have it.`, true);
  return finish({ title: "Synchronous vs asynchronous replication: when the client hears OK", input: "", frames });
}

/* ── Stale read ───────────────────────────────────────────────────── */

function staleRead(): Walkthrough {
  const OLD = "Ana";
  const NEW = "Anya";
  const WRITE_AT = 50;
  const LAG = 250; // ms (illustrative)
  const APPLY_AT = WRITE_AT + LAG;
  const leaderValue = (t: number) => (t >= WRITE_AT ? NEW : OLD);
  const followerValue = (t: number) => (t >= APPLY_AT ? NEW : OLD);
  const T_MAX = 500;
  const X0 = 80;
  const XW = 400;
  const tx = (t: number) => X0 + (t / T_MAX) * XW;
  const LANE = { leader: 30, follower: 110 };
  const frames: Frame[] = [];
  type Read = { t: number; node: "leader" | "follower" };
  const draw = (now: number, reads: Read[], caption: string, phase = 0) => {
    const items: Item[] = [];
    items.push(label("ll", "Leader", 0, LANE.leader + 13, { anchor: "start", size: 12, tone: "ink", weight: 600 }));
    items.push(label("fl", "Follower", 0, LANE.follower + 13, { anchor: "start", size: 12, tone: "ink", weight: 600 }));
    for (const lane of ["leader", "follower"] as const) {
      const change = lane === "leader" ? WRITE_AT : APPLY_AT;
      const value = lane === "leader" ? leaderValue : followerValue;
      const y = LANE[lane];
      const end1 = Math.min(now, change);
      items.push(box(`${lane}-old`, tx(0), y, OLD, { w: Math.max(2, tx(end1) - tx(0)), h: 26, size: 11, tone: "plain" }));
      if (now > change) items.push(box(`${lane}-new`, tx(change), y, NEW, { w: tx(now) - tx(change), h: 26, size: 11, tone: "strong" }));
      if (value(now) === NEW && now === change) items.push(box(`${lane}-new`, tx(change), y, "", { w: 2, h: 26, tone: "strong" }));
    }
    // The write and its replication.
    if (now >= WRITE_AT) items.push(label("wt", `write name = ${NEW}`, tx(WRITE_AT), LANE.leader - 10, { tone: "accent", size: 11, anchor: "start" }));
    if (now >= WRITE_AT) items.push(wire("rep", { x: tx(WRITE_AT), y: LANE.leader + 26 }, { x: tx(APPLY_AT), y: LANE.follower }, { tone: now >= APPLY_AT ? "faint" : "accent", dashed: true, label: `lag ${LAG} ms` }));
    reads.forEach((r, k) => {
      const v = r.node === "leader" ? leaderValue(r.t) : followerValue(r.t);
      const stale = v !== leaderValue(r.t);
      const y = LANE.follower;
      items.push(packet(`rd${k}`, { x: tx(r.t), y: y + 54 }, { text: "R", tone: stale ? "error" : "strong", r: 10 }));
      items.push(label(`rv${k}`, `from ${r.node}: ${v}`, tx(r.t) + 14, y + 58, { tone: stale ? "error" : "accent", size: 11, anchor: "start" }));
    });
    items.push({ k: "path", id: "axis", pts: [[tx(0), 190], [tx(T_MAX), 190]], tone: "ink", width: 1 });
    for (let t = 0; t <= T_MAX; t += 100) items.push(label(`tk${t}`, `${t} ms`, tx(t), 204, { tone: "faint", size: 10 }));
    items.push({ k: "edge", id: "now", x1: tx(now), y1: LANE.leader - 2, x2: tx(now), y2: LANE.follower + 32, tone: phase ? "faint" : "ink", dashed: true });
    frames.push({ caption, items });
  };
  const r1: Read = { t: 150, node: "follower" };
  const r2: Read = { t: 400, node: "follower" };
  const stale1 = followerValue(r1.t) !== leaderValue(r1.t);
  if (!stale1 || followerValue(r2.t) !== NEW || leaderValue(r1.t) !== NEW) throw new Error("stale-read: the example should give one stale read, then a fresh one");
  draw(30, [], `A user's profile says name = ${OLD} on the leader and on its follower. Reads are sent to the follower to keep load off the leader.`);
  draw(WRITE_AT, [], `At ${WRITE_AT} ms the user changes their name to ${NEW}. The leader commits it and replicates asynchronously; this follower is ${LAG} ms behind (illustrative).`);
  draw(r1.t, [r1], `At ${r1.t} ms the page reloads and reads from the follower, which still says ${followerValue(r1.t)}. The user's own change seems to have vanished: a stale read.`);
  draw(APPLY_AT, [r1], `At ${APPLY_AT} ms the follower applies the write. Replication lag is usually short, but it grows under load or after a network blip.`);
  draw(r2.t, [r1, r2], `At ${r2.t} ms a read from the follower returns ${followerValue(r2.t)}. The data converged: this is eventual consistency.`);
  draw(r2.t, [{ t: r1.t, node: "leader" }, r2], `Read-your-writes fix: for a short while after a user writes, send that user's reads to the leader. The read at ${r1.t} ms then returns ${leaderValue(r1.t)}.`, 1);
  return finish({ title: "Replication lag: a user reads their own write from a stale follower", input: "", frames });
}

/* ── Failover ─────────────────────────────────────────────────────── */

function failover(): Walkthrough {
  const names = ["Node A", "Node B", "Node C"];
  // Log positions when the leader dies: the leader has 6, the followers lag (asynchronous replication).
  let logs = [5, 6, 4];
  let leader = 1; // Node B, drawn in the middle
  let down = -1;
  const MAXLOG = 6;
  const NX = (i: number) => i * 180;
  const NY = 100;
  const frames: Frame[] = [];
  const draw = (caption: string, o: { hot?: number[]; lost?: number; follows?: number; cand?: boolean } = {}) => {
    const items: Item[] = [];
    const client = service("client", NX(1) + 4, 0, "App", { w: 96 });
    items.push(...client.items);
    const dbs = names.map((n, i) => database(`d${i}`, NX(i), NY, n, { w: 104, tone: i === down ? "error" : i === leader ? "strong" : o.hot?.includes(i) ? "accent" : "plain" }));
    // The leader's replication links.
    dbs.forEach((d, i) => {
      if (i === leader || i === down) return;
      const bow = Math.abs(i - leader) > 1 ? 46 : 0;
      const from = bow ? dbs[leader].bottom : i < leader ? dbs[leader].left : dbs[leader].right;
      const to = bow ? d.bottom : i < leader ? d.right : d.left;
      items.push(wire(`rep${i}`, { x: from.x, y: bow ? from.y + 54 : from.y }, { x: to.x, y: bow ? to.y + 54 : to.y }, { tone: o.follows === i ? "accent" : "faint", dashed: true, bow: bow ? (i > leader ? 16 : -16) : undefined }));
    });
    if (leader !== down) items.push(wire("cw", client.bottom, dbs[leader].top, { tone: "accent" }));
    dbs.forEach((d, i) => {
      items.push(...d.items);
      for (let e = 1; e <= MAXLOG; e++) {
        const have = e <= logs[i];
        const isLost = o.lost !== undefined && e > o.lost && have;
        items.push(box(`l${i}-${e}`, NX(i) + (e - 1) * 17 + 2, NY + 46, have ? e : "", { w: 15, h: 18, size: 9, tone: isLost ? "error" : have ? (i === down ? "muted" : "plain") : "ghost" }));
      }
      const role = i === down ? "down" : i === leader ? "leader" : o.lost !== undefined && logs[i] > o.lost ? "rejoins" : "follower";
      items.push(label(`role${i}`, `${role} · log ${logs[i]}`, NX(i) + 52, NY + 80, { tone: i === down ? "error" : i === leader ? "accent" : "soft", size: 11 }));
    });
    frames.push({ caption, items });
  };
  draw(`${names[leader]} leads and has log entries up to ${logs[leader]}. Its followers replay the log asynchronously and trail it: ${logs.map((l, i) => (i === leader ? "" : `${names[i]} is at ${l}`)).filter(Boolean).join(", ")}.`);
  down = leader;
  const lostFrom = Math.max(...logs.filter((_, i) => i !== down));
  draw(`${names[down]} crashes. Its entry ${logs[down]} was acknowledged to a client, but no follower has received it yet.`);
  const cands = logs.map((l, i) => ({ l, i })).filter((c) => c.i !== down);
  const best = cands.reduce((a, b) => (b.l > a.l ? b : a));
  draw(`The followers stop hearing heartbeats. After a timeout they compare log positions, ${cands.map((c) => `${names[c.i]} ${c.l}`).join(" and ")}, and pick the most up to date.`, { hot: [best.i] });
  leader = best.i;
  const other = cands.find((c) => c.i !== best.i)!.i;
  logs = logs.map((l, i) => (i === other ? best.l : l));
  draw(`${names[leader]} is promoted to leader and the app's writes go to it. ${names[other]} now follows ${names[leader]} and catches up to entry ${best.l}.`, { follows: other });
  const lost = logs[down] - lostFrom;
  if (lost < 1) throw new Error("failover: the example should lose the old leader's unshipped entry");
  const old = down;
  down = -1;
  draw(`${names[old]} returns as a follower of ${names[leader]} and must discard entry ${logs[old]}, which nobody else has: ${lost} acknowledged write lost. Synchronous replication to one follower prevents that.`, { lost: lostFrom, follows: old });
  return finish({ title: "Failover: the most up-to-date follower is promoted", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "leader-follower": leaderFollower,
  "sync-vs-async": syncVsAsync,
  "stale-read": staleRead,
  failover,
};
