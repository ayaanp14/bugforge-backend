import { and, finish, link, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, graph, label } from "../lesson-figures/kit.js";

/**
 * Routing and Routing Protocols: the note's figures
 * (content/notes/computer-networks/routing-algorithms.md places each with
 * "@figure <name>"). Every one runs the thing it shows:
 *
 *  - longest-prefix: the note's four-entry routing table, each packet's
 *    destination masked against every prefix, the longest match chosen;
 *  - distance-vector: synchronous Bellman-Ford rounds over the note's
 *    four routers until no vector changes (A's row checked against the
 *    note's worked table);
 *  - count-to-infinity: the A–B–C line after the B–C link fails, the two
 *    routers believing each other until RIP's 16, then the same failure
 *    under split horizon;
 *  - dijkstra: router A's shortest-path-first run on the note's five
 *    routers, the settled set growing, then the routing table it installs
 *    (checked against the note's table).
 */

const INF = Number.POSITIVE_INFINITY;
const showCost = (d: number) => (d === INF ? "∞" : String(d));

/** A row of boxes of different widths, left to right: one table row. */
function tableRow(prefix: string, texts: readonly string[], widths: readonly number[], x: number, y: number, o: { h?: number; gap?: number; tone?: (c: number) => Tone | undefined; size?: number } = {}): Item[] {
  const { h = 30, gap = 4 } = o;
  let cx = x;
  return texts.map((t, c) => {
    const it = box(`${prefix}${c}`, cx, y, t, { tone: o.tone?.(c) ?? "plain", w: widths[c], h, size: o.size ?? 12.5 });
    cx += widths[c] + gap;
    return it;
  });
}

/** Column headings over a tableRow laid out the same way. */
function tableHead(prefix: string, texts: readonly string[], widths: readonly number[], x: number, y: number, gap = 4): Item[] {
  let cx = x;
  return texts.map((t, c) => {
    const it = label(`${prefix}${c}`, t, cx + widths[c] / 2, y, { tone: "faint", size: 11 });
    cx += widths[c] + gap;
    return it;
  });
}

/* ── Longest prefix match ─────────────────────────────────────────── */

const ip = (s: string) => s.split(".").reduce((a, o) => a * 256 + Number(o), 0);
const maskOf = (len: number) => (len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0);
const inPrefix = (addr: string, prefix: string, len: number) => ((ip(addr) & maskOf(len)) >>> 0) === ((ip(prefix) & maskOf(len)) >>> 0);

function longestPrefix(): Walkthrough {
  const table = [
    { prefix: "10.0.0.0", len: 8, hop: "192.168.1.2", dev: "eth1" },
    { prefix: "10.1.0.0", len: 16, hop: "192.168.2.2", dev: "eth2" },
    { prefix: "10.1.2.0", len: 24, hop: "192.168.3.2", dev: "eth3" },
    { prefix: "0.0.0.0", len: 0, hop: "203.0.113.1", dev: "eth0" },
  ];
  const packets = ["10.1.2.5", "10.1.9.9", "10.9.9.9", "8.8.8.8"];
  // What the note's lookup table says each packet gets.
  const expected = ["eth3", "eth2", "eth1", "eth0"];
  const W = [118, 108, 50, 56];
  const X = 0;
  const TY = 74;
  const H = 30;
  const frames: Frame[] = packets.map((dst, p) => {
    const matches = table.map((e) => inPrefix(dst, e.prefix, e.len));
    let best = -1;
    table.forEach((e, i) => {
      if (matches[i] && (best < 0 || e.len > table[best].len)) best = i;
    });
    if (table[best].dev !== expected[p]) throw new Error(`longest-prefix: ${dst} went to ${table[best].dev}, the note says ${expected[p]}`);
    const items: Item[] = [
      label("pl", "packet to", 0, 14, { anchor: "start", size: 11.5 }),
      box("pkt", 64, 0, dst, { tone: "accent", w: 108, h: 28, size: 13 }),
      ...tableHead("hd", ["prefix", "next hop", "iface", "matches?"], W, X, TY - 12),
    ];
    table.forEach((e, i) => {
      const tone: Tone = i === best ? "strong" : matches[i] ? "accent" : "muted";
      items.push(...tableRow(`r${i}-`, [`${e.prefix}/${e.len}`, e.hop, e.dev, matches[i] ? "yes" : "no"], W, X, TY + i * (H + 4), { h: H, tone: () => tone, size: 12 }));
    });
    const hits = table.filter((_, i) => matches[i]).map((e) => `/${e.len}`);
    const win = table[best];
    items.push(label("res", `→ send to ${win.hop} on ${win.dev}`, 186, 14, { anchor: "start", tone: "accent", size: 12.5, weight: 600, mono: true }));
    const caption =
      hits.length === 1
        ? `${dst} matches only the default route, 0.0.0.0/0, which matches every address with zero bits. Nothing more specific exists, so it goes to the ISP at ${win.hop}.`
        : `${dst} matches ${hits.length} entries (${hits.join(", ")}). The longest prefix, ${win.prefix}/${win.len}, is the most specific route and wins: next hop ${win.hop} on ${win.dev}.`;
    return { caption, items };
  });
  return finish({ title: "Longest prefix match: the most specific matching route wins", input: "the routing table below; packets to 10.1.2.5, 10.1.9.9, 10.9.9.9 and 8.8.8.8", frames });
}

/* ── Distance vector: Bellman-Ford rounds ─────────────────────────── */

const DV_NAMES = ["A", "B", "C", "D"];
const DV_EDGES: Array<[number, number, number]> = [
  [0, 1, 2],
  [0, 2, 5],
  [1, 2, 1],
  [2, 3, 2],
];
const DV_POS = [
  { x: 0, y: 0 },
  { x: 130, y: 0 },
  { x: 0, y: 120 },
  { x: 130, y: 120 },
];

interface Route {
  d: number;
  via: number;
}

function distanceVector(): Walkthrough {
  const n = DV_NAMES.length;
  const cost = (a: number, b: number) => DV_EDGES.find(([x, y]) => (x === a && y === b) || (x === b && y === a))?.[2];
  const nbrs = (a: number) => DV_NAMES.map((_, b) => b).filter((b) => b !== a && cost(a, b) !== undefined);
  // Round 0: each router knows its own links.
  let D: Route[][] = DV_NAMES.map((_, x) => DV_NAMES.map((_, y) => (x === y ? { d: 0, via: x } : { d: cost(x, y) ?? INF, via: cost(x, y) === undefined ? -1 : y })));
  const rounds: Route[][][] = [D];
  for (let r = 1; r <= 10; r++) {
    const prev = D;
    // Every router recomputes from its neighbours' vectors of the previous round: D(x, y) = min over v of c(x, v) + D(v, y).
    D = DV_NAMES.map((_, x) =>
      DV_NAMES.map((_, y) => {
        if (x === y) return { d: 0, via: x };
        let best: Route = { d: INF, via: -1 };
        for (const v of nbrs(x)) {
          const c = cost(x, v)! + prev[v][y].d;
          if (c < best.d) best = { d: c, via: v };
        }
        return best;
      }),
    );
    rounds.push(D);
    if (D.every((row, x) => row.every((e, y) => e.d === prev[x][y].d && e.via === prev[x][y].via))) break;
  }
  const last = rounds.length - 1;
  // The note's worked table: A's vector in rounds 0, 1 and 2.
  const want = [
    ["2 B", "5 C", "∞"],
    ["2 B", "3 B", "7 C"],
    ["2 B", "3 B", "5 B"],
  ];
  const cellText = (e: Route, x: number, y: number) => (x === y ? "0" : e.d === INF ? "∞" : `${e.d} ${DV_NAMES[e.via]}`);
  want.forEach((row, r) =>
    row.forEach((t, k) => {
      const got = cellText(rounds[r][0][k + 1], 0, k + 1);
      if (got !== t) throw new Error(`distance-vector: A's route to ${DV_NAMES[k + 1]} in round ${r} is ${got}, the note says ${t}`);
    }),
  );
  if (last !== 3) throw new Error(`distance-vector: expected convergence to show in round 3, saw ${last}`);

  const GX = 200;
  const GY = 28;
  const CW = 46;
  const CH = 30;
  const draw = (r: number, changed: Set<string>): Item[] => {
    const items: Item[] = graph("g", DV_NAMES, DV_POS, DV_EDGES, { r: 18 });
    items.push(label("gt", "link costs", 65, 166, { tone: "faint", size: 11 }));
    DV_NAMES.forEach((d, c) => items.push(label(`ch${c}`, `to ${d}`, GX + 34 + c * (CW + 4) + CW / 2, GY - 12, { tone: "faint", size: 11 })));
    rounds[r].forEach((row, x) => {
      items.push(label(`rh${x}`, `${DV_NAMES[x]}'s vector`, GX + 28, GY + x * (CH + 4) + CH / 2, { anchor: "end", tone: x === 0 ? "ink" : "soft", size: 11.5, weight: x === 0 ? 600 : undefined }));
      row.forEach((e, y) => {
        const tone: Tone = x === y ? "muted" : changed.has(`${x}-${y}`) ? "accent" : r === last ? "strong" : "plain";
        items.push(box(`c${x}-${y}`, GX + 34 + y * (CW + 4), GY + x * (CH + 4), cellText(e, x, y), { tone, w: CW, h: CH, size: 12.5 }));
      });
    });
    items.push(label("rd", r === last ? `round ${r}: no change — converged` : `round ${r}`, GX + 34, GY + 4 * (CH + 4) + 16, { anchor: "start", tone: r === last ? "accent" : "ink", size: 12, weight: 600 }));
    items.push(label("key", "each cell: cost, then next hop", GX + 34, GY + 4 * (CH + 4) + 36, { anchor: "start", tone: "faint", size: 11 }));
    return items;
  };

  const frames: Frame[] = [];
  frames.push({
    caption: "Round 0: each router knows only its own links. B's vector is (A 2, B 0, C 1, D ∞) and C's is (A 5, B 1, C 0, D 2); D is unreachable from A and B because neither touches it.",
    items: draw(0, new Set()),
  });
  for (let r = 1; r <= last; r++) {
    const changed = new Set<string>();
    rounds[r].forEach((row, x) => row.forEach((e, y) => (e.d !== rounds[r - 1][x][y].d || e.via !== rounds[r - 1][x][y].via) && changed.add(`${x}-${y}`)));
    const a = rounds[r][0];
    let caption: string;
    if (r === 1) {
      caption = `Round 1: every router adds its link cost to each neighbour's round-0 vector and keeps the minimum. A finds C cheaper through B, 2 + 1 = ${a[2].d}, than over its own link (5), and reaches D for the first time at 5 + 2 = ${a[3].d} via C. ${changed.size} entries change.`;
    } else if (r === last) {
      caption = `Round ${r}: recomputing from round ${r - 1}'s vectors changes nothing anywhere, so the network has converged. No router ever saw the whole map, only its neighbours' distances.`;
    } else {
      caption = `Round ${r}: B learned D at cost 3 in round 1, and that news reaches A now: 2 + 3 = ${a[3].d} via B beats 7 via C, so A switches its route to D. ${changed.size === 1 ? "That is the only change" : `${changed.size} entries change`}.`;
    }
    frames.push({ caption, items: draw(r, changed) });
  }
  return finish({ title: "Distance vector routing: Bellman-Ford rounds until the tables stop changing", input: "links A–B 2, A–C 5, B–C 1, C–D 2", frames });
}

/* ── Count to infinity ────────────────────────────────────────────── */

function countToInfinity(): Walkthrough {
  const RIP_INF = 16;
  // Line A–B–C, every link cost 1, converged: B reaches C directly at 1, A through B at 2.
  let b = 1;
  let a = 2;
  // B–C fails. With no split horizon, B believes A's advertisement, A believes B's, alternately.
  const history: Array<{ who: "A" | "B"; cost: number }> = [];
  let turn: "A" | "B" = "B";
  while (a < RIP_INF || b < RIP_INF) {
    if (turn === "B") {
      b = Math.min(RIP_INF, 1 + a);
      history.push({ who: "B", cost: b });
    } else {
      a = Math.min(RIP_INF, 1 + b);
      history.push({ who: "A", cost: a });
    }
    turn = turn === "B" ? "A" : "B";
    if (history.length > 40) throw new Error("count-to-infinity: never stopped");
  }
  if (history[0].cost !== 3 || history[1].cost !== 4 || history[2].cost !== 5) throw new Error("count-to-infinity: the first exchanges disagree with the note");
  // With split horizon A never advertises C back to B, its next hop: B has no route at once, and A hears B's unreachable.
  const split: Array<{ who: "A" | "B"; cost: number }> = [
    { who: "B", cost: RIP_INF },
    { who: "A", cost: Math.min(RIP_INF, 1 + RIP_INF) },
  ];

  const P = [
    { x: 0, y: 0 },
    { x: 140, y: 0 },
    { x: 280, y: 0 },
  ];
  const R = 18;
  const HY = 130;
  const HW = 22;
  const draw = (o: { failed: boolean; a: string; b: string; hot?: "A" | "B"; hist: typeof history; histKey: string; tag?: string; done?: boolean }): Item[] => {
    const items: Item[] = [
      link("ab", P[0], P[1], R, { tone: "line", label: "1" }),
      link("bc", P[1], P[2], R, { tone: o.failed ? "error" : "line", dashed: o.failed, label: o.failed ? "down" : "1" }),
      { k: "node", id: "nA", x: P[0].x, y: P[0].y, r: R, text: "A", tone: o.hot === "A" ? "accent" : "plain" },
      { k: "node", id: "nB", x: P[1].x, y: P[1].y, r: R, text: "B", tone: o.hot === "B" ? "accent" : "plain" },
      { k: "node", id: "nC", x: P[2].x, y: P[2].y, r: R, text: "C", tone: o.failed ? "muted" : "plain" },
      box("cA", P[0].x - 56, 32, o.a, { tone: o.hot === "A" ? "accent" : o.done ? "error" : "plain", w: 112, h: 28, size: 12 }),
      box("cB", P[1].x - 56, 32, o.b, { tone: o.hot === "B" ? "accent" : o.done ? "error" : "plain", w: 112, h: 28, size: 12 }),
      label("cap", "each router's cost to C", P[0].x - 56, 76, { anchor: "start", tone: "faint", size: 11 }),
    ];
    if (o.hist.length) {
      items.push(label("hl", o.tag ?? "costs advertised, in order", P[0].x - 52, HY - 18, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
      o.hist.forEach((h, i) => {
        const x = P[0].x - 52 + i * (HW + 3);
        items.push(box(`${o.histKey}${i}`, x, HY, h.cost, { tone: h.cost >= RIP_INF ? "error" : i === o.hist.length - 1 ? "accent" : "plain", w: HW, h: 26, size: 11 }));
        items.push(label(`${o.histKey}w${i}`, h.who, x + HW / 2, HY + 36, { tone: "faint", size: 10, mono: true }));
      });
    }
    return items;
  };
  const via = (c: number, hop: string) => (c >= RIP_INF ? "16 = no route" : `${c} via ${hop}`);
  const frames: Frame[] = [
    { caption: "Before the failure, every link costs 1: B reaches C directly at cost 1, and A reaches C through B at cost 2.", items: draw({ failed: false, a: "2 via B", b: "1 direct", hist: [], histKey: "h" }) },
    {
      caption: "The B–C link fails. B drops its direct route, but A is still advertising cost 2 to C, and nothing in that number says the path runs through B itself.",
      items: draw({ failed: true, a: "2 via B", b: "no route", hot: "B", hist: [], histKey: "h" }),
    },
  ];
  let ca = 2;
  let cb = 1;
  for (let i = 0; i < 3; i++) {
    const h = history[i];
    if (h.who === "B") cb = h.cost;
    else ca = h.cost;
    frames.push({
      caption:
        i === 0
          ? `B believes A's advertisement and sets its cost to C to 1 + 2 = ${h.cost} via A — a route that loops straight back through B.`
          : `${h.who} hears ${h.who === "A" ? "B" : "A"}'s ${h.cost - 1} and raises its own cost to ${h.cost}. Each exchange adds one link's cost, and each router's route points at the other.`,
      items: draw({ failed: true, a: via(ca, "B"), b: via(cb, "A"), hot: h.who, hist: history.slice(0, i + 1), histKey: "h" }),
    });
  }
  frames.push({
    caption: `They keep counting, one exchange at a time, until the cost reaches RIP's infinity, 16: ${history.length} exchanges in all before both routers finally agree that C is unreachable.`,
    items: draw({ failed: true, a: via(16, "B"), b: via(16, "A"), hist: history, histKey: "h", done: true }),
  });
  frames.push({
    caption: "With split horizon, A never advertises C to B, because B is A's next hop for it. B has no route the moment the link fails, and A hears that C is unreachable in the next exchange: 2 exchanges instead of 15.",
    items: draw({ failed: true, a: via(split[1].cost, "B"), b: via(split[0].cost, "A"), hist: split, histKey: "s", tag: "with split horizon" }),
  });
  if (history.length !== 15) throw new Error(`count-to-infinity: ${history.length} exchanges, the caption says 15`);
  return finish({ title: "Count to infinity after a link fails, and split horizon stopping it", input: "line A–B–C, every link cost 1; the B–C link fails", frames });
}

/* ── Link state: Dijkstra from A ──────────────────────────────────── */

function dijkstra(): Walkthrough {
  const names = ["A", "B", "C", "D", "E"];
  const edges: Array<[number, number, number]> = [
    [0, 1, 4],
    [0, 2, 2],
    [1, 2, 1],
    [1, 3, 5],
    [2, 3, 8],
    [2, 4, 10],
    [3, 4, 2],
  ];
  const pos = [
    { x: 0, y: 90 },
    { x: 110, y: 0 },
    { x: 110, y: 180 },
    { x: 230, y: 0 },
    { x: 230, y: 180 },
  ];
  const R = 18;
  const n = names.length;
  const dist = names.map(() => INF);
  const prev = names.map(() => -1);
  const done = names.map(() => false);
  dist[0] = 0;
  // Where each node's distance label sits: above the top row, below the bottom row, left of A.
  const lab = (i: number) => (i === 0 ? { x: pos[0].x - 26, y: pos[0].y, anchor: "end" as const } : pos[i].y < 90 ? { x: pos[i].x, y: pos[i].y - 30, anchor: "middle" as const } : { x: pos[i].x, y: pos[i].y + 30, anchor: "middle" as const });

  const TX = 296;
  const TW = [40, 44, 44];
  const draw = (o: { now?: number; relaxed?: Set<number>; final?: boolean }): Item[] => {
    const treeEdge = (e: number) => {
      const [a, b] = edges[e];
      return (prev[b] === a && done[b]) || (prev[a] === b && done[a]);
    };
    const items = graph("g", names, pos, edges.map(([a, b, w]) => [a, b, w] as const), {
      r: R,
      tone: (i) => (i === o.now ? "accent" : done[i] ? "strong" : "plain"),
      edgeTone: (e): LineTone => (o.relaxed?.has(e) ? "accent" : treeEdge(e) ? "ink" : o.final ? "faint" : "line"),
    });
    names.forEach((_, i) => {
      const l = lab(i);
      items.push(label(`d${i}`, showCost(dist[i]), l.x, l.y, { anchor: l.anchor, tone: done[i] ? "ink" : dist[i] === INF ? "faint" : "accent", size: 12.5, mono: true, weight: 600 }));
    });
    items.push(...tableHead("th", o.final ? ["to", "cost", "next"] : ["node", "dist", "via"], TW, TX, -12));
    names.forEach((nm, i) => {
      if (o.final && i === 0) return;
      let hop = i;
      while (prev[hop] > 0) hop = prev[hop];
      const third = o.final ? names[hop] : prev[i] < 0 ? "–" : names[prev[i]];
      const tone: Tone = i === o.now ? "accent" : done[i] ? "strong" : "plain";
      items.push(...tableRow(`t${i}-`, [nm, showCost(dist[i]), third], TW, TX, (o.final ? i - 1 : i) * 34, { tone: () => tone }));
    });
    return items;
  };

  const frames: Frame[] = [
    { caption: "Router A holds the full map from the flooded link state advertisements and runs Dijkstra with itself as the source: its own distance is 0, every other router starts at ∞.", items: draw({}) },
  ];
  const order: number[] = [];
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    done[u] = true;
    order.push(u);
    const relaxed = new Set<number>();
    const better: string[] = [];
    edges.forEach(([a, b, w], e) => {
      if (a !== u && b !== u) return;
      const v = a === u ? b : a;
      if (done[v]) return;
      if (dist[u] + w < dist[v]) {
        const was = dist[v];
        dist[v] = dist[u] + w;
        prev[v] = u;
        relaxed.add(e);
        better.push(was === INF ? `${names[v]} gets ${dist[v]}` : `${names[v]} improves from ${was} to ${dist[u]} + ${w} = ${dist[v]}`);
      }
    });
    const what = better.length ? `${better.join(", ")}.` : "No unsettled neighbour improves.";
    const caption =
      step === 0
        ? `Settle A at 0 and relax its links: ${what}`
        : step === n - 1
          ? `Settle ${names[u]} at ${dist[u]}, the last router. Every distance is now final: a settled node is never improved, because all links have non-negative cost.`
          : `The smallest unsettled distance is ${names[u]} at ${dist[u]}, so it is settled. Relaxing its links: ${what}`;
    frames.push({ caption, items: draw({ now: u, relaxed }) });
  }
  // The note's routing table for A.
  const firstHop = (i: number) => {
    let h = i;
    while (prev[h] > 0) h = prev[h];
    return names[h];
  };
  const want: Record<string, [number, string]> = { B: [3, "C"], C: [2, "C"], D: [8, "C"], E: [10, "C"] };
  for (const [nm, [d, hop]] of Object.entries(want)) {
    const i = names.indexOf(nm);
    if (dist[i] !== d || firstHop(i) !== hop) throw new Error(`dijkstra: ${nm} is ${dist[i]} via ${firstHop(i)}, the note says ${d} via ${hop}`);
  }
  const unused = edges.filter(([a, b]) => !(prev[b] === a || prev[a] === b)).map(([a, b, w]) => `${names[a]}–${names[b]} (${w})`);
  frames.push({
    caption: `The shortest paths form a tree rooted at A, and A installs only the first hop of each: every destination goes via C. The links on no shortest path at all are ${and(unused)}, the direct A–B link among them.`,
    items: draw({ final: true }),
  });
  return finish({ title: "Link state routing: router A runs Dijkstra on the full map", input: "links A–B 4, A–C 2, B–C 1, B–D 5, C–D 8, C–E 10, D–E 2", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "longest-prefix": longestPrefix,
  "distance-vector": distanceVector,
  "count-to-infinity": countToInfinity,
  dijkstra,
};
