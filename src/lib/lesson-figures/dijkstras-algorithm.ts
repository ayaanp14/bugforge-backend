import { and, finish, link, note, row, rowLabel, slotMid, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, region } from "./kit.js";

/**
 * Dijkstra's Algorithm: the lesson's figures (content/roadmap/
 * dijkstras-algorithm.md places each with "@figure <name>"). Each one runs
 * the real algorithm — BFS, Dijkstra with a lazy heap, the textbook version
 * that never reopens a vertex, Bellman–Ford — on its example and records
 * what it did, so every distance drawn is one the code computed.
 */

type Pt = { x: number; y: number };
type Edge = readonly [number, number, number];

const R = 17;
const fmt = (d: number) => (d === Infinity ? "∞" : String(d));
const minus = (w: number) => (w < 0 ? `−${-w}` : String(w));
/** Weights as a sum the way it is written by hand: [−3, 3, −8] as "−3 + 3 − 8". */
const sum = (ws: readonly number[]) => ws.map((w, i) => (i === 0 ? minus(w) : w < 0 ? ` − ${-w}` : ` + ${w}`)).join("");

/** Where a node's distance readout sits: beside it on its free side. */
type Tag = readonly [dx: number, dy: number, anchor: "start" | "middle" | "end"];
const LEFT: Tag = [-R - 7, 0, "end"];
const RIGHT: Tag = [R + 7, 0, "start"];
const ABOVE: Tag = [0, -R - 11, "middle"];
const BELOW: Tag = [0, R + 12, "middle"];

/** A weighted directed graph: edges first so nodes sit on top, weights as labels, ids e<a>-<b> and n<i>. */
function drawGraph(
  names: readonly string[],
  pos: readonly Pt[],
  edges: readonly Edge[],
  o: { node?: (i: number) => Tone; edge?: (e: number) => LineTone; bow?: (e: number) => number | undefined; dashed?: (e: number) => boolean; weight?: (e: number) => string } = {},
): Item[] {
  const items: Item[] = [];
  edges.forEach(([a, b, w], e) => items.push(link(`e${a}-${b}`, pos[a], pos[b], R, { arrow: true, tone: o.edge?.(e) ?? "line", bow: o.bow?.(e), dashed: o.dashed?.(e), label: o.weight ? o.weight(e) : minus(w) })));
  names.forEach((nm, i) => items.push({ k: "node", id: `n${i}`, x: pos[i].x, y: pos[i].y, r: R, text: nm, tone: o.node?.(i) ?? "plain" }));
  return items;
}

/** "d=…" beside each node. */
function tags(dist: readonly number[], pos: readonly Pt[], at: readonly Tag[], tone: (i: number) => TextTone = () => "soft"): Item[] {
  return dist.map((d, i) => note(`d${i}`, `d=${fmt(d)}`, pos[i].x + at[i][0], pos[i].y + at[i][1], { anchor: at[i][2], size: 11, tone: tone(i) }));
}

/** Plain Dijkstra with a sorted queue and lazy deletion; returns dist, prev and every pop. */
function dijkstra(n: number, edges: readonly Edge[], source: number) {
  const dist = Array(n).fill(Infinity);
  const prev = Array(n).fill(-1);
  const order: number[] = [];
  const heap: Array<[number, number]> = [[0, source]];
  dist[source] = 0;
  while (heap.length) {
    heap.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const [d, u] = heap.shift() as [number, number];
    if (d > dist[u]) continue;
    order.push(u);
    for (const [a, b, w] of edges)
      if (a === u && d + w < dist[b]) {
        dist[b] = d + w;
        prev[b] = u;
        heap.push([dist[b], b]);
      }
  }
  return { dist, prev, order };
}

/* ── Why BFS is not enough ─────────────────────────────────────────── */

function weights(): Walkthrough {
  const names = ["A", "B", "C"];
  const edges: Edge[] = [[0, 2, 10], [0, 1, 2], [1, 2, 3]];
  const pos: Pt[] = [{ x: 0, y: 40 }, { x: 140, y: 140 }, { x: 280, y: 40 }];
  const target = 2;
  // BFS: the first route that reaches C, by number of edges.
  const via = [-1, -1, -1];
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const u = queue.shift() as number;
    for (const [a, b] of edges) if (a === u && !seen.has(b)) (seen.add(b), (via[b] = u), queue.push(b));
  }
  const bfsPath: number[] = [];
  for (let v = target; v !== -1; v = via[v]) bfsPath.unshift(v);
  const cost = (p: number[]) => p.slice(1).reduce((s, v, i) => s + (edges.find(([a, b]) => a === p[i] && b === v) as Edge)[2], 0);
  const best = dijkstra(names.length, edges, 0);
  const bestPath: number[] = [];
  for (let v = target; v !== -1; v = best.prev[v]) bestPath.unshift(v);
  const onPath = (p: number[], e: number) => p.some((v, i) => i > 0 && edges[e][0] === p[i - 1] && edges[e][1] === v);
  const route = (p: number[]) => p.map((v) => names[v]).join(" → ");
  const lines = (both: boolean): Item[] => [
    note("bfs", `BFS: ${route(bfsPath)}, ${bfsPath.length - 1} edge${bfsPath.length === 2 ? "" : "s"}, cost ${cost(bfsPath)}`, 0, 200, { size: 12, tone: both ? "error" : "ink", weight: 600 }),
    ...(both ? [note("dij", `cheapest: ${route(bestPath)}, ${bestPath.length - 1} edges, cost ${cost(bestPath)}`, 0, 222, { size: 12, tone: "accent", weight: 600 })] : []),
  ];
  return finish({
    title: "Fewest edges is not the cheapest route",
    input: edges.map(([a, b, w]) => `${names[a]}→${names[b]} ${w}`).join(", "),
    frames: [
      {
        caption: `BFS reaches vertices in order of how many edges away they are. ${names[target]} is one edge from A, so the first route BFS finds is ${route(bfsPath)} — and it costs ${cost(bfsPath)}.`,
        items: [...drawGraph(names, pos, edges, { node: (i) => (bfsPath.includes(i) ? "accent" : "plain"), edge: (e) => (onPath(bfsPath, e) ? "accent" : "line") }), ...lines(false)],
      },
      {
        caption: `Counting weight instead of edges, ${route(bestPath)} costs ${cost(bestPath)}, less than ${cost(bfsPath)}. Once edges have different weights, the route with fewest edges can be the expensive one — the gap Dijkstra's algorithm fills.`,
        items: [
          ...drawGraph(names, pos, edges, { node: (i) => (i === target ? "strong" : bestPath.includes(i) ? "accent" : "plain"), edge: (e) => (onPath(bestPath, e) ? "accent" : onPath(bfsPath, e) ? "error" : "line") }),
          ...lines(true),
        ],
      },
    ],
  });
}

/* ── The six-vertex example ────────────────────────────────────────── */

const NAMES = ["A", "B", "C", "D", "E", "F"];
const EDGES: Edge[] = [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 3], [4, 5, 2]];
const POS: Pt[] = [{ x: 0, y: 100 }, { x: 130, y: 16 }, { x: 130, y: 184 }, { x: 270, y: 16 }, { x: 270, y: 184 }, { x: 390, y: 100 }];
const TAGS: Tag[] = [LEFT, ABOVE, BELOW, ABOVE, BELOW, RIGHT];

/** The program's dry run: the distance table and the heap, entry by entry, with lazy deletion. */
function heapRun(): Walkthrough {
  const n = NAMES.length;
  const dist = Array(n).fill(Infinity);
  const settled: number[] = [];
  type Entry = { id: string; d: number; v: number };
  let pushes = 0;
  const heap: Entry[] = [];
  const push = (d: number, v: number) => heap.push({ id: `h${pushes++}`, d, v });
  const sortHeap = () => heap.sort((x, y) => x.d - y.d || x.v - y.v);
  const frames: Frame[] = [];
  const HY = 92;
  const EW = 62;
  const HX = 92;

  const draw = (o: { popped?: Entry; stale?: boolean; improved?: number[] } = {}): Item[] => {
    const items: Item[] = [rowLabel("dl", "dist", -10, 0)];
    items.push(
      ...row("c", dist.map(fmt), {
        tone: (i) => (o.improved?.includes(i) ? "accent" : settled.includes(i) ? "strong" : "plain"),
      }),
    );
    NAMES.forEach((nm, i) => items.push(label(`cl${i}`, nm, slotMid(i), -11, { tone: "faint", size: 11, mono: true })));
    items.push(label("pl", "popped", 0, HY - 12, { anchor: "start", size: 11, tone: "soft" }));
    items.push(label("hl", "heap, smallest first", HX, HY - 12, { anchor: "start", size: 11, tone: "soft" }));
    if (o.popped) items.push(box(o.popped.id, 0, HY, `(${o.popped.d}, ${NAMES[o.popped.v]})`, { w: EW, h: 34, tone: o.stale ? "error" : "accent", size: 13 }));
    // An entry already beaten by a smaller distance is stale while it waits: drawn as out of play.
    heap.forEach((e, k) => items.push(box(e.id, HX + k * (EW + 6), HY, `(${e.d}, ${NAMES[e.v]})`, { w: EW, h: 34, size: 13, tone: e.d > dist[e.v] ? "muted" : "plain" })));
    if (!heap.length) items.push(label("empty", "empty", HX, HY + 17, { anchor: "start", size: 12, tone: "faint" }));
    items.push(note("set", `settled: ${settled.length ? settled.map((v) => NAMES[v]).join(" ") : "none"}`, 0, HY + 62, { size: 12, weight: 600 }));
    return items;
  };

  dist[0] = 0;
  push(0, 0);
  frames.push({
    caption: "dist starts at 0 for the source A and ∞ elsewhere, and the heap holds one entry, (distance, vertex) = (0, A). Each step pops the smallest entry.",
    items: draw({ improved: [0] }),
  });
  let explainedLazy = false;
  let stale = 0;
  while (heap.length) {
    sortHeap();
    const top = heap.shift() as Entry;
    const u = top.v;
    if (top.d > dist[u]) {
      stale++;
      frames.push({
        caption: heap.length
          ? `Pop (${top.d}, ${NAMES[u]}), but dist[${NAMES[u]}] is already ${dist[u]}: this entry is stale, left over from before ${NAMES[u]} improved. Skip it without touching a single edge.`
          : `Pop (${top.d}, ${NAMES[u]}): stale too, since dist[${NAMES[u]}] = ${dist[u]}. The heap is empty. Of ${pushes} entries pushed, ${stale} were stale; the settling order was ${settled.map((v) => NAMES[v]).join(", ")} — by distance, not by name.`,
        items: draw({ popped: top, stale: true }),
      });
      continue;
    }
    settled.push(u);
    const improved: number[] = [];
    const said: string[] = [];
    let kept = "";
    for (const [a, b, w] of EDGES) {
      if (a !== u) continue;
      if (top.d + w < dist[b]) {
        said.push(dist[b] === Infinity ? `${NAMES[b]} gets ${top.d + w}` : `${NAMES[b]} drops from ${dist[b]} to ${top.d + w}`);
        if (dist[b] !== Infinity && !explainedLazy) kept = ` ${NAMES[b]}'s old entry stays in the heap: finding and removing it would need a decrease-key that the standard heaps lack.`;
        dist[b] = top.d + w;
        improved.push(b);
        push(dist[b], b);
      } else if (!settled.includes(b)) said.push(`${NAMES[u]} → ${NAMES[b]} would give ${top.d + w}, no better than ${dist[b]}`);
    }
    if (kept) explainedLazy = true;
    sortHeap();
    const relax = said.length ? `Relaxing its edges: ${said.join("; ")}.` : "It has no edges to relax.";
    frames.push({
      caption: `Pop (${top.d}, ${NAMES[u]}): ${top.d} = dist[${NAMES[u]}], so ${NAMES[u]} is settled. ${relax}${kept}`,
      items: draw({ popped: top, improved }),
    });
  }
  return finish({ title: "The heap during Dijkstra's algorithm, with lazy deletion", input: `edges = ${EDGES.map(([a, b, w]) => `${NAMES[a]}→${NAMES[b]} ${w}`).join(", ")}`, frames });
}

/* ── Why it works ──────────────────────────────────────────────────── */

/** The proof on a small graph: any other route to the next vertex must leave the settled region, and cannot come back cheaper. */
function whyFinal(): Walkthrough {
  const names = ["S", "A", "Y", "U"];
  const [S, A, Y, U] = [0, 1, 2, 3];
  const edges: Edge[] = [[S, A, 2], [A, U, 3], [S, Y, 7], [Y, U, 1]];
  const pos: Pt[] = [{ x: 0, y: 80 }, { x: 140, y: 0 }, { x: 140, y: 160 }, { x: 280, y: 80 }];
  const at: Tag[] = [LEFT, ABOVE, BELOW, RIGHT];
  // Run Dijkstra until U is the next to settle.
  const dist = [0, Infinity, Infinity, Infinity];
  const settled: number[] = [];
  while (true) {
    const open = names.map((_, i) => i).filter((i) => !settled.includes(i) && dist[i] < Infinity);
    const u = open.reduce((b, i) => (dist[i] < dist[b] ? i : b));
    if (u === U) break;
    settled.push(u);
    for (const [a, b, w] of edges) if (a === u && dist[u] + w < dist[b]) dist[b] = dist[u] + w;
  }
  const exit = edges.findIndex(([a, b]) => settled.includes(a) && b === Y);
  const rest = edges.findIndex(([a, b]) => a === Y && b === U);
  const viaY = dist[Y] + edges[rest][2];
  const NEG = -3;
  const ps = settled.map((i) => pos[i]);
  const rx1 = Math.min(...ps.map((p) => p.x)) - R - 14;
  const rx2 = Math.max(...ps.map((p) => p.x)) + R + 14;
  const ry1 = Math.min(...ps.map((p) => p.y)) - R - 26;
  const ry2 = Math.max(...ps.map((p) => p.y)) + R + 14;
  const best = edges.map((_, e) => e).filter((e) => edges[e][1] === U && settled.includes(edges[e][0]));

  const draw = (o: { step: 1 | 2 | 3 | 4 }): Item[] => {
    const items: Item[] = [...region("reg", rx1, ry1, rx2 - rx1, ry2 - ry1, "settled: distances final")];
    const routeTone = (e: number): LineTone => (o.step === 4 && e === rest ? "error" : o.step >= 2 && (e === exit || e === rest) ? "accent" : o.step === 1 && best.includes(e) ? "accent" : "line");
    items.push(
      ...drawGraph(names, pos, edges, {
        node: (i) => (settled.includes(i) ? "strong" : i === U ? (o.step === 3 ? "strong" : o.step === 4 ? "error" : "accent") : i === Y && o.step >= 2 ? "accent" : "plain"),
        edge: routeTone,
        weight: (e) => (o.step === 4 && e === rest ? minus(NEG) : minus(edges[e][2])),
      }),
    );
    items.push(...tags(dist, pos, at, (i) => (settled.includes(i) ? "ink" : i === U ? "accent" : "soft")));
    const line =
      o.step === 1
        ? `next to settle: ${names[U]}, the smallest unsettled d`
        : o.step === 2
          ? `route via ${names[Y]}: at least d[${names[Y]}] = ${dist[Y]} on leaving`
          : o.step === 3
            ? `via ${names[Y]}: ${dist[Y]} + ${edges[rest][2]} = ${viaY} ≥ ${dist[U]}, so ${dist[U]} is final`
            : `with ${names[Y]} → ${names[U]} = ${minus(NEG)}: ${dist[Y]} − ${-NEG} = ${dist[Y] + NEG} < ${dist[U]}`;
    items.push(note("line", line, 0, 230, { size: 12, weight: 600, tone: o.step === 4 ? "error" : "ink" }));
    return items;
  };

  return finish({
    title: "Why the closest unsettled vertex is final",
    input: edges.map(([a, b, w]) => `${names[a]}→${names[b]} ${w}`).join(", "),
    frames: [
      {
        caption: `${and(settled.map((i) => `${names[i]} = ${dist[i]}`))} are settled and final. Of the rest, ${names[U]} has the smallest tentative distance, ${dist[U]}, against ${names[Y]}'s ${dist[Y]}, so it is next. Could some route not yet seen reach ${names[U]} for less?`,
        items: draw({ step: 1 }),
      },
      {
        caption: `Any other route to ${names[U]} starts in the settled region and has to leave it somewhere. This one leaves on ${names[edges[exit][0]]} → ${names[Y]}, arriving with at least d[${names[Y]}] = ${dist[Y]} — and ${dist[Y]} ≥ ${dist[U]}, because ${names[U]} was the smallest.`,
        items: draw({ step: 2 }),
      },
      {
        caption: `The rest of the route, ${names[Y]} → ${names[U]}, can only add weight, because no weight is negative: ${viaY} ≥ ${dist[U]}. Every route that leaves the region is at least as long, so ${dist[U]} is final and ${names[U]} is settled for good.`,
        items: draw({ step: 3 }),
      },
      {
        caption: `That last step is the one a negative edge breaks. If ${names[Y]} → ${names[U]} weighed ${minus(NEG)}, the route through ${names[Y]} would cost ${dist[Y] + NEG}, less than ${dist[U]} — and ${names[U]} would already have been settled at the wrong distance.`,
        items: draw({ step: 4 }),
      },
    ],
  });
}

/** The textbook algorithm on a graph with one negative edge: B is settled at 2 before the route through C, costing 1, is found. */
function negative(): Walkthrough {
  const names = ["A", "B", "C"];
  const edges: Edge[] = [[0, 1, 2], [0, 2, 3], [2, 1, -2]];
  const pos: Pt[] = [{ x: 0, y: 0 }, { x: 220, y: 0 }, { x: 0, y: 140 }];
  const at: Tag[] = [LEFT, RIGHT, LEFT];
  const n = names.length;
  // The true distances, by Bellman–Ford.
  const truth = [0, Infinity, Infinity];
  for (let k = 1; k < n; k++) for (const [a, b, w] of edges) if (truth[a] + w < truth[b]) truth[b] = truth[a] + w;
  const dist = [0, Infinity, Infinity];
  const settled: number[] = [];
  const frames: Frame[] = [];

  const draw = (o: { cur?: number; good?: number[]; ignored?: number } = {}): Item[] => {
    const items = drawGraph(names, pos, edges, {
      node: (i) => (o.ignored !== undefined && i === edges[o.ignored][1] ? "error" : settled.includes(i) ? "strong" : i === o.cur ? "accent" : "plain"),
      edge: (e) => (e === o.ignored ? "error" : o.good?.includes(e) ? "accent" : "line"),
    });
    items.push(...tags(dist, pos, at, (i) => (o.ignored !== undefined && i === edges[o.ignored][1] ? "error" : settled.includes(i) ? "ink" : "soft")));
    items.push(note("set", `settled: ${settled.length ? settled.map((i) => `${names[i]} = ${dist[i]}`).join(", ") : "none"}`, -40, 200, { size: 12, weight: 600 }));
    if (o.ignored !== undefined) items.push(note("true", `true distance to ${names[edges[o.ignored][1]]}: ${truth[edges[o.ignored][1]]}`, -40, 222, { size: 12, weight: 600, tone: "error" }));
    return items;
  };

  frames.push({ caption: `Dijkstra from A on a graph with one negative edge, C → B weighing ${minus(edges[2][2])}. The textbook algorithm settles the closest vertex and never looks at it again.`, items: draw({ cur: 0 }) });
  while (settled.length < n) {
    const open = names.map((_, i) => i).filter((i) => !settled.includes(i) && dist[i] < Infinity);
    const u = open.reduce((b, i) => (dist[i] < dist[b] ? i : b));
    settled.push(u);
    const good: number[] = [];
    const said: string[] = [];
    let ignored: number | undefined;
    edges.forEach(([a, b, w], e) => {
      if (a !== u) return;
      if (settled.includes(b)) {
        if (dist[u] + w < dist[b]) ignored = e;
        return;
      }
      if (dist[u] + w < dist[b]) {
        dist[b] = dist[u] + w;
        good.push(e);
        said.push(`${names[b]} = ${dist[b]}`);
      }
    });
    let caption: string;
    if (ignored !== undefined) {
      const [, b, w] = edges[ignored];
      caption = `Settle ${names[u]} at ${dist[u]}. Its edge to ${names[b]} gives ${dist[u]} + (${minus(w)}) = ${dist[u] + w}, less than ${dist[b]} — but ${names[b]} is already settled, so the algorithm keeps ${dist[b]}. The true distance is ${truth[b]}: settling ${names[b]} first was wrong.`;
    } else if (said.length) caption = `Settle ${names[u]} at ${dist[u]} and relax its edges: ${and(said)}.`;
    else {
      const rival = names.map((_, i) => i).find((i) => !settled.includes(i) && dist[i] < Infinity);
      caption = `${names[u]} has the smallest distance, ${dist[u]}${rival !== undefined ? ` (${names[rival]} has ${dist[rival]})` : ""}, so it is settled and final. Nothing that comes later is supposed to beat it.`;
    }
    frames.push({ caption, items: draw({ cur: u, good, ignored }) });
  }
  return finish({ title: "A negative edge breaks the greedy choice", input: edges.map(([a, b, w]) => `${names[a]}→${names[b]} ${minus(w)}`).join(", "), frames });
}

/* ── Rebuilding the path ───────────────────────────────────────────── */

function prevTree(): Walkthrough {
  const n = NAMES.length;
  const { dist, prev } = dijkstra(n, EDGES, 0);
  const target = 5;
  const path: number[] = [];
  for (let v = target; v !== -1; v = prev[v]) path.unshift(v);
  const treeEdge = (e: number) => prev[EDGES[e][1]] === EDGES[e][0];
  const onPath = (e: number) => path.some((v, i) => i > 0 && EDGES[e][0] === path[i - 1] && EDGES[e][1] === v);
  const PY = 252;

  const draw = (walk: boolean): Item[] => {
    const items = drawGraph(NAMES, POS, EDGES, {
      node: (i) => (walk ? (path.includes(i) ? (i === target ? "strong" : "accent") : "muted") : i === 0 ? "strong" : "plain"),
      edge: (e) => (walk ? (onPath(e) ? "accent" : "faint") : treeEdge(e) ? "accent" : "faint"),
    });
    items.push(...tags(dist, POS, TAGS));
    items.push(rowLabel("pl", "prev", -10, PY));
    items.push(...row("p", prev.map((p) => (p === -1 ? "–" : NAMES[p])), { y: PY, tone: (i) => (walk && path.includes(i) && i !== 0 ? "accent" : "plain") }));
    NAMES.forEach((nm, i) => items.push(label(`pi${i}`, nm, slotMid(i), PY + 51, { tone: "faint", size: 11, mono: true })));
    if (walk) items.push(note("path", `reversed: ${path.map((v) => NAMES[v]).join(" → ")}, cost ${dist[target]}`, 0, PY + 78, { size: 12, weight: 600 }));
    return items;
  };

  const back = [...path].reverse().map((v) => NAMES[v]);
  return finish({
    title: "The prev pointers form a shortest-path tree",
    input: "",
    frames: [
      {
        caption: `prev[v] is the vertex whose relaxation last improved v. Drawn as edges, the ${n - 1} prev pointers form a tree rooted at A — the shortest-path tree — and no faint edge lies on a shortest path from A.`,
        items: draw(false),
      },
      {
        caption: `To print the path to ${NAMES[target]}, start there and follow prev until it runs out: ${back.join(" ← ")}. Reversed, that is the route, cost ${dist[target]}. A vertex left at ∞ has no prev, so check the distance before walking.`,
        items: draw(true),
      },
    ],
  });
}

/* ── Bellman–Ford ─────────────────────────────────────────────────── */

function bellmanFord(): Walkthrough {
  const names = ["S", "A", "B", "C", "D"];
  const n = names.length;
  // The edges in the order they are scanned — the worst order for this graph.
  const edges: Edge[] = [[3, 4, 2], [1, 3, 3], [2, 3, 4], [2, 1, -3], [0, 1, 4], [0, 2, 5]];
  const extra: Edge = [3, 2, -8];
  const pos: Pt[] = [{ x: 0, y: 80 }, { x: 140, y: 0 }, { x: 140, y: 160 }, { x: 280, y: 80 }, { x: 400, y: 80 }];
  const at: Tag[] = [LEFT, ABOVE, BELOW, ABOVE, ABOVE];
  const LY = 236;
  const LW = 60;
  const frames: Frame[] = [];

  const run = (es: readonly Edge[], rounds: number) => {
    const dist = Array(n).fill(Infinity);
    const prev = Array(n).fill(-1);
    dist[0] = 0;
    const log: Array<{ changed: number[]; said: string[]; dist: number[] }> = [];
    for (let r = 1; r <= rounds; r++) {
      const changed: number[] = [];
      const said: string[] = [];
      es.forEach(([u, v, w], e) => {
        if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
          said.push(`${names[u]} → ${names[v]} gives ${names[v]} = ${dist[u] + w}`);
          dist[v] = dist[u] + w;
          prev[v] = u;
          changed.push(e);
        }
      });
      log.push({ changed, said, dist: [...dist] });
    }
    const improves = es.map((_, e) => e).filter((e) => dist[es[e][0]] !== Infinity && dist[es[e][0]] + es[e][2] < dist[es[e][1]]);
    return { dist, prev, log, improves };
  };

  const draw = (es: readonly Edge[], dist: readonly number[], o: { changed?: number[]; path?: number[]; bad?: number[] } = {}): Item[] => {
    const onPath = (e: number) => !!o.path && o.path.some((v, i) => i > 0 && es[e][0] === o.path?.[i - 1] && es[e][1] === v);
    const items = drawGraph(names, pos, es, {
      node: (i) => (o.path?.includes(i) ? (i === o.path[o.path.length - 1] ? "strong" : "accent") : o.changed?.some((e) => es[e][1] === i) ? "accent" : "plain"),
      edge: (e) => (o.bad?.includes(e) ? "error" : o.changed?.includes(e) || onPath(e) ? "accent" : "line"),
      // C → B and B → C share a chord: bow both (the same sign bends opposite ways for opposite directions).
      bow: (e) => (es[e] === extra ? 34 : es.includes(extra) && es[e][0] === extra[1] && es[e][1] === extra[0] ? 20 : undefined),
    });
    items.push(...tags(dist, pos, at, (i) => (o.changed?.some((e) => es[e][1] === i) ? "accent" : "soft")));
    items.push(label("lh", "scan order, every round", 0, LY - 14, { anchor: "start", size: 11, tone: "soft" }));
    es.forEach(([u, v, w], e) => items.push(box(`l${e}`, e * (LW + 6), LY, `${names[u]}→${names[v]} ${minus(w)}`, { w: LW, h: 28, size: 12, tone: o.bad?.includes(e) ? "error" : o.changed?.includes(e) ? "accent" : "plain" })));
    return items;
  };

  const start = Array(n).fill(Infinity);
  start[0] = 0;
  frames.push({
    caption: `Bellman–Ford relaxes every edge, in one fixed order, round after round: V − 1 = ${n - 1} rounds. The order below is the worst one for this graph — the shortest path to D uses these edges back to front.`,
    items: draw(edges, start),
  });
  const plain = run(edges, n - 1);
  plain.log.forEach((r, k) => {
    const round = k + 1;
    let caption = `Round ${round}: ${r.said.length ? `${and(r.said)}.` : "nothing changes."}`;
    if (round === 1) caption += ` No other edge starts from a known distance yet.`;
    else if (r.said.some((s) => s.startsWith("B → A"))) caption += ` B → A, weighing ${minus(edges[3][2])}, beats the direct edge: a route with more edges can be cheaper.`;
    else if (round === n - 1) caption += ` The shortest path S → B → A → C → D has ${n - 1} edges, and this order fixed one per round, so all ${n - 1} rounds were needed.`;
    frames.push({ caption, items: draw(edges, r.dist, { changed: r.changed }) });
  });
  const path: number[] = [];
  for (let v = n - 1; v !== -1; v = plain.prev[v]) path.unshift(v);
  frames.push({
    caption: `One extra pass over the edges improves nothing, so there is no negative cycle and every distance is final. The prev pointers give ${path.map((v) => names[v]).join(" → ")}, cost ${plain.dist[n - 1]}.`,
    items: draw(edges, plain.dist, { path }),
  });
  const withCycle = [...edges, extra];
  const bad = run(withCycle, n - 1);
  const cycle = [2, 1, 3, 2];
  const loop = cycle.slice(1).map((v, i) => withCycle.findIndex(([a, b]) => a === cycle[i] && b === v));
  const total = loop.reduce((s, e) => s + withCycle[e][2], 0);
  frames.push({
    caption: `Now add C → B weighing ${minus(extra[2])}: the loop ${cycle.map((v) => names[v]).join(" → ")} weighs ${sum(loop.map((e) => withCycle[e][2]))} = ${minus(total)}. After ${n - 1} rounds the extra pass still improves ${bad.improves.length} edges: a negative cycle is reachable, and going round it lowers every distance again, so no shortest path exists.`,
    items: draw(withCycle, bad.dist, { bad: loop }),
  });
  return finish({ title: "Bellman–Ford: every edge, V − 1 times", input: `edges in scan order: ${edges.map(([a, b, w]) => `${names[a]}→${names[b]} ${minus(w)}`).join(", ")}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  weights,
  "heap-run": heapRun,
  "why-final": whyFinal,
  negative,
  "prev-tree": prevTree,
  "bellman-ford": bellmanFord,
};
