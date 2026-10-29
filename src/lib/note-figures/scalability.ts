import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, chart, label, region } from "../lesson-figures/kit.js";
import { database, packet, service, wire } from "./sd-kit.js";

/**
 * Scalability: the note's figures (content/notes/system-design/
 * scalability.md). Every figure loops (a points subject), and every number
 * drawn is computed by running the rule it shows:
 *
 *  - up-vs-out: traffic grows frame by frame; on the left the smallest
 *    machine tier that fits is chosen (until none does), on the right
 *    ceil(load / capacity) servers share it. Utilisation is load ÷ capacity.
 *  - stateful-vs-stateless: the same four events on two clusters — one keeps
 *    the session in a server's memory, one in a shared store — simulated; the
 *    crash's outcome is read off the simulation and checked.
 *  - latency-throughput: an M/M/1 queue (one server, 10 ms per request):
 *    throughput follows the offered load, latency = 1 / (μ − λ).
 *  - bottleneck: an app tier and a database under growing traffic; the
 *    bottleneck named in each frame is the tier over 100%.
 */

const commas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const pct = (u: number) => `${Math.round(u * 100)}%`;

/* ── Vertical vs horizontal ───────────────────────────────────────── */

/** A machine drawn as a tank that fills with load: the outline, the fill from the bottom, the % under it. */
function machine(id: string, x: number, base: number, w: number, h: number, util: number, sub: string): Item[] {
  const fill = Math.max(2, Math.round(Math.min(util, 1) * h));
  return [
    box(`${id}-box`, x, base - h, "", { w, h, tone: "plain" }),
    box(`${id}-fill`, x, base - fill, "", { w, h: fill, tone: util > 1 ? "error" : "accent" }),
    label(`${id}-pct`, pct(util), x + w / 2, base + 12, { size: 11, mono: true, tone: util > 1 ? "error" : "ink" }),
    label(`${id}-sub`, sub, x + w / 2, base + 27, { size: 10, tone: "faint" }),
  ];
}

function upVsOut(): Walkthrough {
  const loads = [300, 700, 1500, 2600, 3600]; // req/s arriving
  const TIERS = [500, 1000, 2000]; // req/s one machine of each size can serve; 2,000 is the biggest on offer here
  const PER = 1000; // req/s per scale-out server
  const BASE = 150;
  const H = 96;
  const frames: Frame[] = [];
  let lastV = { tier: 0, util: 0 };
  let lastH = { n: 0, util: 0 };
  loads.forEach((load, f) => {
    const tier = TIERS.find((c) => c >= load) ?? TIERS[TIERS.length - 1];
    const vUtil = load / tier;
    const n = Math.ceil(load / PER);
    const hUtil = load / (n * PER);
    const items: Item[] = [
      label("load", `traffic: ${commas(load)} req/s`, 250, 0, { size: 12, weight: 600, tone: "accent" }),
      label("t-up", "Scale up: one bigger machine", 70, 30, { size: 11, weight: 600 }),
      label("t-out", "Scale out: more machines", 380, 30, { size: 11, weight: 600 }),
    ];
    const vw = Math.round(36 + (tier / TIERS[TIERS.length - 1]) * 84);
    items.push(...machine("v", 70 - vw / 2, BASE, vw, H, vUtil, `max ${commas(tier)}/s`));
    for (let i = 0; i < n; i++) items.push(...machine(`h${i}`, 290 + i * 46, BASE, 38, H, hUtil, `${commas(PER)}/s`));
    const upMove = tier > lastV.tier ? (lastV.tier ? `the left upgrades to a ${commas(tier)}/s machine` : `the left runs one ${commas(tier)}/s machine`) : vUtil > 1 ? `the left has no bigger machine to buy and runs at ${pct(vUtil)} — overloaded` : `the left stays on its ${commas(tier)}/s machine`;
    const outMove = n > lastH.n ? (lastH.n ? `the right adds a server (${n} now, ${pct(hUtil)} each)` : `the right runs ${n} server${n === 1 ? "" : "s"} at ${pct(hUtil)}`) : `the right keeps ${n} server${n === 1 ? "" : "s"} at ${pct(hUtil)}`;
    const caption =
      f === loads.length - 1
        ? `At ${commas(load)} req/s scaling up has hit its ceiling (${pct(vUtil)} of the biggest machine), while ${n} small servers share the load at ${pct(hUtil)} each.`
        : `Traffic is ${commas(load)} req/s: ${upMove}; ${outMove}.`;
    lastV = { tier, util: vUtil };
    lastH = { n, util: hUtil };
    frames.push({ caption, items });
  });
  if (!(lastV.util > 1 && lastH.util <= 1)) throw new Error("up-vs-out: the last frame should overload the biggest machine but not the fleet");
  return finish({ title: "Vertical vs horizontal scaling as traffic grows", input: "", frames });
}

/* ── Stateful vs stateless ────────────────────────────────────────── */

type Ev = { kind: "start" | "login" | "request" | "crash"; server?: number };

interface Cluster {
  shared: boolean;
  up: boolean[];
  memory: boolean[]; // does server i hold Alice's session in memory?
  store: boolean; // does the shared store hold it?
  sticky: number; // stateful: the server Alice is pinned to
  rr: number; // stateless: round-robin pointer
}

/** Run one event; returns which server took it and whether Alice was recognised. */
function step(c: Cluster, ev: Ev): { server: number | null; ok: boolean | null } {
  const upList = c.up.map((u, i) => (u ? i : -1)).filter((i) => i >= 0);
  const route = () => {
    if (!c.shared) return c.up[c.sticky] ? c.sticky : upList[0];
    const s = upList[c.rr % upList.length];
    c.rr += 1;
    return s;
  };
  if (ev.kind === "start") return { server: null, ok: null };
  if (ev.kind === "crash") {
    c.up[ev.server!] = false;
    c.memory[ev.server!] = false; // memory dies with the process
    return { server: null, ok: null };
  }
  const s = route();
  if (ev.kind === "login") {
    if (c.shared) c.store = true;
    else {
      c.memory[s] = true;
      c.sticky = s;
    }
    return { server: s, ok: true };
  }
  return { server: s, ok: c.shared ? c.store : c.memory[s] };
}

function statefulVsStateless(): Walkthrough {
  const events: Ev[] = [{ kind: "start" }, { kind: "login" }, { kind: "request" }, { kind: "crash", server: 0 }, { kind: "request" }];
  const clusters: Cluster[] = [false, true].map((shared) => ({ shared, up: [true, true], memory: [false, false], store: false, sticky: 0, rr: 0 }));
  const OX = [0, 270];
  const frames: Frame[] = [];
  const outcomes: Array<Array<{ server: number | null; ok: boolean | null }>> = [[], []];
  events.forEach((ev, f) => {
    const items: Item[] = [];
    const res = clusters.map((c) => step(c, ev));
    res.forEach((r, k) => outcomes[k].push(r));
    clusters.forEach((c, k) => {
      const ox = OX[k];
      const r = res[k];
      items.push(label(`t${k}`, c.shared ? "Stateless: session in Redis" : "Stateful: session in memory", ox + 118, 0, { size: 11, weight: 600 }));
      const client = service(`c${k}`, ox + 68, 16, "Alice", { w: 100, tone: "plain" });
      items.push(...client.items);
      const servers = [0, 1].map((i) => {
        const down = !c.up[i];
        const tone: Tone = down ? "muted" : r.server === i ? (r.ok ? "accent" : "error") : "plain";
        const sub = down ? "crashed" : c.shared ? "no session kept" : c.memory[i] ? "has Alice's session" : "no session";
        return service(`s${k}${i}`, ox + 24 + i * 132, 96, `S${i + 1}`, { w: 84, tone, sub, subTone: !down && !c.shared && c.memory[i] ? "accent" : "soft" });
      });
      servers.forEach((s, i) => items.push(wire(`w${k}${i}`, client.bottom, s.top, { tone: r.server === i ? (r.ok ? "accent" : "error") : c.up[i] ? "line" : "faint" }), ...s.items));
      if (c.shared) {
        const store = database(`db${k}`, ox + 70, 200, "Redis", { w: 96, sub: c.store ? "has Alice's session" : "empty", subTone: c.store ? "accent" : "soft" });
        // The store's wires start under the servers' status line, so they never cross its words.
        servers.forEach((s, i) => items.push(wire(`d${k}${i}`, { x: s.bottom.x, y: s.bottom.y + 22 }, store.top, { tone: r.server === i ? "accent" : c.up[i] ? "line" : "faint", head: false })));
        items.push(...store.items);
      }
      // Alice's request: beside the server that took it, or back at her box between requests.
      const p = r.server === null ? { x: client.right.x + 16, y: client.mid.y } : r.server === 0 ? { x: servers[0].left.x - 14, y: servers[0].mid.y } : { x: servers[1].right.x + 14, y: servers[1].mid.y };
      items.push(packet(`p${k}`, p, { text: ev.kind === "login" ? "L" : ev.kind === "request" ? "R" : "", tone: r.ok === false ? "error" : r.ok ? "strong" : "accent" }));
    });
    const [a, b] = res;
    const caption =
      ev.kind === "start"
        ? "Two clusters of two servers. On the left a session lives in the memory of the server that created it; on the right every server reads it from a shared Redis."
        : ev.kind === "login"
          ? `Alice logs in (L). The left stores her session in S${a.server! + 1}'s memory and pins her there; the right writes it to Redis.`
          : ev.kind === "crash"
            ? "S1 crashes. On the left Alice's session dies with S1's memory; on the right nothing was lost — the session is in Redis."
            : f === events.length - 1
              ? `Her next request (R) goes to S${a.server! + 1} on the left, which has never seen her: ${a.ok ? "recognised" : "logged out"}. The right sends it to S${b.server! + 1}, which reads Redis: ${b.ok ? "recognised" : "logged out"}.`
              : `Alice's next request (R): the left sends her back to S${a.server! + 1} where her session is; the right's round robin picks S${b.server! + 1}, which reads Redis. Both recognise her.`;
    frames.push({ caption, items });
  });
  const lastA = outcomes[0][outcomes[0].length - 1];
  const lastB = outcomes[1][outcomes[1].length - 1];
  if (lastA.ok !== false || lastB.ok !== true) throw new Error("stateful-vs-stateless: the crash should log Alice out only on the stateful side");
  return finish({ title: "Stateful vs stateless servers: what a crash costs", input: "", frames });
}

/* ── Latency vs throughput ────────────────────────────────────────── */

function latencyThroughput(): Walkthrough {
  const SERVICE_MS = 10;
  const MU = 1000 / SERVICE_MS; // requests per second one server completes
  const loads = [20, 50, 80, 90, 95]; // offered load, req/s
  const latency = (lam: number) => 1000 / (MU - lam); // M/M/1 mean time in system, ms
  const A = chart("a", { x: 0, y: 20, w: 190, h: 120, xMax: 100, yMax: 110, xLabel: "load (req/s)", yLabel: "throughput (req/s)", xTicks: [0, 50, 100], yTicks: [0, 50, 100] });
  const B = chart("b", { x: 270, y: 20, w: 190, h: 120, xMax: 100, yMax: 220, xLabel: "load (req/s)", yLabel: "latency (ms)", xTicks: [0, 50, 100], yTicks: [0, 100, 200] });
  const frames: Frame[] = loads.map((lam, f) => {
    const w = latency(lam);
    const util = lam / MU;
    const last = f === loads.length - 1;
    const items: Item[] = [
      ...A.items,
      ...B.items,
      { k: "path", id: "cap", pts: [[A.px(0), A.py(MU)], [A.px(100), A.py(MU)]], tone: "faint", dashed: true, width: 1 },
      label("capt", "capacity", A.px(0) + 6, A.py(MU) - 8, { anchor: "start", size: 10, tone: "faint" }),
      A.curve("thru", (x) => Math.min(x, MU), { tone: "line", width: 1.5 }),
      B.curve("lat", latency, { tone: "line", width: 1.5, to: 96, steps: 48 }),
      { k: "node", id: "da", x: A.px(lam), y: A.py(lam), r: 5, text: "", tone: last ? "strong" : "accent" },
      { k: "node", id: "db", x: B.px(lam), y: B.py(w), r: 5, text: "", tone: last ? "strong" : "accent" },
      // Values ride beside their dots: right of them at low load (clear of the axes), left of them near capacity (clear of the edge).
      lam < 40
        ? label("va", `${lam}/s`, A.px(lam) + 9, A.py(lam) + 10, { anchor: "start", size: 11, mono: true, tone: "accent" })
        : label("va", `${lam}/s`, A.px(lam) - 8, A.py(lam) - 4, { anchor: "end", size: 11, mono: true, tone: "accent" }),
      lam < 40
        ? label("vb", `${Math.round(w * 10) / 10} ms`, B.px(lam) + 8, B.py(w) - 12, { anchor: "start", size: 11, mono: true, tone: "accent" })
        : label("vb", `${Math.round(w * 10) / 10} ms`, B.px(lam) - 9, B.py(w) - 2, { anchor: "end", size: 11, mono: true, tone: "accent" }),
    ];
    const caption =
      f === 0
        ? `One server takes ${SERVICE_MS} ms per request, so it can finish ${MU} a second. At ${lam} req/s (${pct(util)} busy) a request takes ${Math.round(w * 10) / 10} ms — barely more than the work itself.`
        : last
          ? `At ${pct(util)} busy, latency is ${Math.round(w)} ms — ${Math.round(w / SERVICE_MS)}× the work — for only ${lam - loads[f - 1]} more req/s. Past ${MU} req/s the queue grows without limit. Run with headroom.`
          : `At ${lam} req/s (${pct(util)} busy) throughput still rises with load, but requests now queue: each takes ${Math.round(w * 10) / 10} ms, up from ${Math.round(latency(loads[f - 1]) * 10) / 10}.`;
    return { caption, items };
  });
  if (latency(loads[loads.length - 1]) < 10 * latency(loads[0])) throw new Error("latency-throughput: the curve should climb steeply near capacity");
  return finish({ title: "Latency vs throughput: one server's queue as load nears capacity", input: "", frames });
}

/* ── A bottleneck that moves ──────────────────────────────────────── */

function bottleneck(): Walkthrough {
  const APP_CAP = 1000; // req/s per app server
  const DB_CAP = 3000; // queries/s the one database serves; each request makes one query
  const HIT = 0.6; // share of reads a cache answers, in the last frame
  const stages = [
    { traffic: 1500, apps: 2, cache: false },
    { traffic: 2500, apps: 2, cache: false },
    { traffic: 2500, apps: 3, cache: false },
    { traffic: 4000, apps: 4, cache: false },
    { traffic: 4000, apps: 4, cache: true },
  ];
  const frames: Frame[] = [];
  const necks: Array<string | null> = [];
  stages.forEach((s, f) => {
    const appU = s.traffic / (s.apps * APP_CAP);
    const dbQps = s.traffic * (s.cache ? 1 - HIT : 1);
    const dbU = dbQps / DB_CAP;
    const neck = appU > 1 && appU >= dbU ? "app" : dbU > 1 ? "db" : null;
    necks.push(neck);
    const items: Item[] = [label("load", `traffic: ${commas(s.traffic)} req/s`, 0, 0, { anchor: "start", size: 12, weight: 600, tone: "accent" })];
    const lb = service("lb", 0, 86, "Load balancer", { w: 108 });
    items.push(...lb.items);
    const top = 105 - (s.apps * 36 - 6) / 2;
    items.push(...region("tier", 150, top - 8, 104, s.apps * 36 + 10, "App tier"));
    for (let i = 0; i < s.apps; i++) items.push(...service(`a${i}`, 160, top + i * 36 - 3, `App ${i + 1}`, { w: 84, h: 30, tone: neck === "app" ? "error" : "plain" }).items);
    const tierRight = { x: 254, y: 105 };
    items.push(wire("lb-tier", lb.right, { x: 150, y: 105 }, { tone: neck === "app" ? "error" : "line" }));
    const db = database("db", 310, 112, "Database", { w: 100, tone: neck === "db" ? "error" : "plain" });
    items.push(wire("tier-db", tierRight, db.left, { tone: neck === "db" ? "error" : "line" }), ...db.items);
    if (s.cache) {
      const cache = service("cache", 310, 30, "Cache", { w: 100, tone: "strong", sub: `answers ${pct(HIT)} of reads` });
      items.push(wire("tier-cache", tierRight, cache.left, { tone: "accent" }), ...cache.items);
    }
    // Utilisation bars: 0–150% across 210 px, a dashed mark at 100%.
    const BX = 90;
    const BW = 210;
    const at = (u: number) => Math.round(BX + (Math.min(u, 1.5) / 1.5) * BW);
    [["App tier", appU, neck === "app"], ["Database", dbU, neck === "db"]].forEach(([name, u, bad], i) => {
      const y = 196 + i * 30;
      items.push(label(`bn${i}`, name as string, BX - 10, y + 10, { anchor: "end", size: 11.5, tone: "ink" }));
      items.push(box(`bo${i}`, BX, y, "", { w: BW, h: 20, tone: "plain" }));
      items.push(box(`bf${i}`, BX, y, "", { w: Math.max(2, at(u as number) - BX), h: 20, tone: bad ? "error" : "accent" }));
      items.push(label(`bp${i}`, pct(u as number), BX + BW + 10, y + 10, { anchor: "start", size: 11, mono: true, tone: bad ? "error" : "ink" }));
    });
    items.push({ k: "path", id: "full", pts: [[at(1), 190], [at(1), 252]], tone: "ink", dashed: true, width: 1 });
    items.push(label("full-t", "100%", at(1), 264, { size: 10, tone: "faint" }));
    const caption =
      f === 0
        ? `${commas(s.traffic)} req/s across ${s.apps} app servers is ${pct(appU)} of the tier; every request makes one query, so the database is at ${pct(dbU)}. No bottleneck yet.`
        : neck === "app"
          ? `Traffic grows to ${commas(s.traffic)} req/s. ${s.apps} app servers would need to run at ${pct(appU)}: the app tier is the bottleneck.`
          : neck === "db"
            ? `Traffic reaches ${commas(s.traffic)} req/s and the tier scales to ${s.apps} servers (${pct(appU)}), but the single database would need ${pct(dbU)}. The bottleneck has moved to the data tier.`
            : s.cache
              ? `A cache answers ${pct(HIT)} of reads, so the database sees ${commas(dbQps)} queries/s (${pct(dbU)}). Replicas and shards are the other ways to relieve it.`
              : `Stateless app servers scale out easily: a third brings the tier to ${pct(appU)}. The database, still one machine, is now at ${pct(dbU)}.`;
    frames.push({ caption, items });
  });
  if (necks[1] !== "app" || necks[3] !== "db" || necks[4] !== null) throw new Error(`bottleneck: expected app → db → none, got ${necks.join(",")}`);
  return finish({ title: "A bottleneck that moves: scale the app tier and the database is next", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "up-vs-out": upVsOut,
  "stateful-vs-stateless": statefulVsStateless,
  "latency-throughput": latencyThroughput,
  bottleneck,
};
