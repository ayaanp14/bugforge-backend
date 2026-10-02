import { and, finish, link, note, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, column, label } from "./kit.js";

/**
 * Minimum Spanning Tree: the lesson's figures (content/roadmap/
 * minimum-spanning-tree.md places each with "@figure <name>"). Every tree
 * drawn is one the code below built — Kruskal with union-find, Prim with a
 * sorted heap, Prim's array version, Dijkstra for the comparison — on the
 * lesson's six-vertex graph or a smaller example, and every weight in a
 * caption is a sum the code took.
 */

type Pt = { x: number; y: number };
type Edge = readonly [number, number, number];

const R = 17;

const NAMES = ["A", "B", "C", "D", "E", "F"];
const EDGES: Edge[] = [[0, 1, 4], [0, 2, 3], [1, 2, 1], [1, 3, 2], [2, 3, 4], [2, 4, 5], [3, 4, 7], [3, 5, 6], [4, 5, 8]];
const POS: Pt[] = [{ x: 0, y: 100 }, { x: 124, y: 0 }, { x: 124, y: 200 }, { x: 262, y: 0 }, { x: 262, y: 200 }, { x: 386, y: 100 }];

const nameOf = (e: Edge, names = NAMES) => `${names[e[0]]}–${names[e[1]]}`;
const weightOf = (es: readonly number[], edges: readonly Edge[] = EDGES) => es.reduce((s, e) => s + edges[e][2], 0);

/** An undirected weighted graph: edges first, then nodes; ids e<index> and n<i>. */
function drawGraph(o: { node?: (i: number) => Tone; edge?: (e: number) => LineTone; dashed?: (e: number) => boolean; names?: readonly string[]; pos?: readonly Pt[]; edges?: readonly Edge[]; prefix?: string } = {}): Item[] {
  const names = o.names ?? NAMES;
  const pos = o.pos ?? POS;
  const edges = o.edges ?? EDGES;
  const p = o.prefix ?? "";
  const items: Item[] = [];
  edges.forEach(([a, b, w], e) => items.push(link(`${p}e${e}`, pos[a], pos[b], R, { tone: o.edge?.(e) ?? "line", dashed: o.dashed?.(e), label: String(w) })));
  names.forEach((nm, i) => items.push({ k: "node", id: `${p}n${i}`, x: pos[i].x, y: pos[i].y, r: R, text: nm, tone: o.node?.(i) ?? "plain" }));
  return items;
}

/** Union-find over n vertices, for the cycle tests. */
function dsu(n: number) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  return { find, union: (a: number, b: number) => (find(a) === find(b) ? false : ((parent[find(a)] = find(b)), true)) };
}

/** Kruskal: the edges kept, scanning in the given order (indices into edges). */
function kruskal(n: number, edges: readonly Edge[], order: readonly number[]): number[] {
  const u = dsu(n);
  const kept: number[] = [];
  for (const e of order) if (kept.length < n - 1 && u.union(edges[e][0], edges[e][1])) kept.push(e);
  return kept;
}
const ascending = (edges: readonly Edge[]) => edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2] || a - b);

/** The vertices on the tree path between a and b, using only the given edges. */
function treePath(n: number, edges: readonly Edge[], tree: readonly number[], a: number, b: number): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of tree) {
    adj[edges[e][0]].push(edges[e][1]);
    adj[edges[e][1]].push(edges[e][0]);
  }
  const prev = new Map<number, number>([[a, -1]]);
  const queue = [a];
  while (queue.length) {
    const u = queue.shift() as number;
    for (const v of adj[u]) if (!prev.has(v)) (prev.set(v, u), queue.push(v));
  }
  const out: number[] = [];
  for (let v = b; v !== -1; v = prev.get(v) as number) out.unshift(v);
  return out;
}
/** The edges (indices) joining consecutive vertices of a path. */
const pathEdges = (edges: readonly Edge[], path: readonly number[]) =>
  path.slice(1).map((v, i) => edges.findIndex(([a, b]) => (a === path[i] && b === v) || (b === path[i] && a === v)));

/** The pieces a set of edges leaves the vertices in. */
function pieces(n: number, edges: readonly Edge[], kept: readonly number[]): number[][] {
  const u = dsu(n);
  for (const e of kept) u.union(edges[e][0], edges[e][1]);
  const by = new Map<number, number[]>();
  for (let i = 0; i < n; i++) by.set(u.find(i), [...(by.get(u.find(i)) ?? []), i]);
  return [...by.values()];
}

/* ── What a spanning tree is ───────────────────────────────────────── */

function spanningTrees(): Walkthrough {
  const n = NAMES.length;
  // Every spanning tree of the graph, by brute force over the 5-edge subsets (126 of them).
  let count = 0;
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === n - 1) {
      if (pieces(n, EDGES, chosen).length === 1) count++;
      return;
    }
    for (let e = from; e < EDGES.length; e++) pick(e + 1, [...chosen, e]);
  };
  pick(0, []);
  const heavy = kruskal(n, EDGES, ascending(EDGES).reverse());
  const light = kruskal(n, EDGES, ascending(EDGES));
  const added = EDGES.findIndex((_, e) => !heavy.includes(e) && EDGES[e][2] === Math.min(...EDGES.filter((_, j) => !heavy.includes(j)).map((x) => x[2])));
  const loop = pathEdges(EDGES, treePath(n, EDGES, heavy, EDGES[added][0], EDGES[added][1]));
  const cut = heavy.find((e) => EDGES[e][0] === 2 && EDGES[e][1] === 4) ?? heavy[0];
  const halves = pieces(n, EDGES, heavy.filter((e) => e !== cut));
  const set = (vs: number[]) => `{${vs.map((v) => NAMES[v]).join(", ")}}`;
  const total = (es: number[]) => note("tot", `${es.length} edges, weight ${weightOf(es)}`, 0, 256, { size: 12, weight: 600 });

  return finish({
    title: "Spanning trees of a weighted graph",
    input: EDGES.map(([a, b, w]) => `${NAMES[a]}–${NAMES[b]} ${w}`).join(", "),
    frames: [
      {
        caption: `${n} offices and ${EDGES.length} possible cables, each with a cost. A spanning tree keeps just enough edges to connect all ${n} with no cycle — always exactly V − 1 = ${n - 1}, since each edge that closes no cycle joins two separate pieces.`,
        items: [...drawGraph(), note("tot", `${EDGES.length} edges, weight ${weightOf(EDGES.map((_, e) => e))} in all`, 0, 256, { size: 12, tone: "soft" })],
      },
      {
        caption: `One spanning tree: ${n - 1} edges, every vertex reached, no cycle, total weight ${weightOf(heavy)}. This graph has ${count} spanning trees like it, and the task is to find the lightest without listing them all.`,
        items: [...drawGraph({ node: () => "accent", edge: (e) => (heavy.includes(e) ? "accent" : "faint") }), total(heavy)],
      },
      {
        caption: `Add any other edge, such as ${nameOf(EDGES[added])}, and it closes exactly one cycle: the new edge plus the tree path between its ends, ${loop.length + 1} edges in all here.`,
        items: [...drawGraph({ node: () => "accent", edge: (e) => (e === added || loop.includes(e) ? "accent" : heavy.includes(e) ? "ink" : "faint"), dashed: (e) => e === added }), note("tot", `+ ${nameOf(EDGES[added])}: one cycle, ${loop.length + 1} edges`, 0, 256, { size: 12, weight: 600, tone: "accent" })],
      },
      {
        caption: `Remove any tree edge, such as ${nameOf(EDGES[cut])}, and the tree falls into exactly two pieces, ${set(halves[0])} and ${set(halves[1])}. Every edge of a spanning tree is needed.`,
        items: [
          ...drawGraph({ node: (i) => (halves[0].includes(i) ? "accent" : "plain"), edge: (e) => (e === cut ? "faint" : heavy.includes(e) ? "ink" : "faint"), dashed: (e) => e === cut }),
          note("tot", `− ${nameOf(EDGES[cut])}: two pieces`, 0, 256, { size: 12, weight: 600 }),
        ],
      },
      {
        caption: `Of all ${count} spanning trees, the lightest weighs ${weightOf(light)}: the minimum spanning tree, ${and(light.map((e) => nameOf(EDGES[e])))}. The rest of the lesson finds it greedily, one safe edge at a time.`,
        items: [...drawGraph({ node: () => "strong", edge: (e) => (light.includes(e) ? "accent" : "faint") }), total(light)],
      },
    ],
  });
}

/* ── The cut property ──────────────────────────────────────────────── */

function cutProperty(): Walkthrough {
  const n = NAMES.length;
  const side = [0, 1, 2]; // A, B, C on one side of the cut
  const crosses = (e: number) => side.includes(EDGES[e][0]) !== side.includes(EDGES[e][1]);
  const crossing = EDGES.map((_, e) => e).filter(crosses);
  const e0 = crossing.reduce((b, e) => (EDGES[e][2] < EDGES[b][2] ? e : b));
  // A spanning tree without e0: the heaviest one, by Kruskal from the top.
  const T = kruskal(n, EDGES, ascending(EDGES).reverse());
  if (T.includes(e0)) throw new Error("the example tree must skip the lightest crossing edge");
  const cyc = pathEdges(EDGES, treePath(n, EDGES, T, EDGES[e0][0], EDGES[e0][1]));
  const f = cyc.find(crosses) as number;
  const swapped = [...T.filter((e) => e !== f), e0];
  const cx = (POS[1].x + POS[3].x) / 2;
  const cutLine: Item[] = [
    { k: "path", id: "cut", pts: [[cx, -40], [cx, 236]], tone: "ink", dashed: true, width: 1.4 },
    label("cl", `{${side.map((v) => NAMES[v]).join(", ")}}`, cx - 12, -46, { anchor: "end", size: 11.5, tone: "ink", weight: 600 }),
    label("cr", `{${NAMES.map((_, i) => i).filter((i) => !side.includes(i)).map((v) => NAMES[v]).join(", ")}}`, cx + 12, -46, { anchor: "start", size: 11.5, tone: "ink", weight: 600 }),
  ];
  const read = (id: string, text: string, tone: "ink" | "accent" | "error" = "ink") => note(id, text, 0, 270, { size: 12, weight: 600, tone });
  const list = (es: number[]) => es.map((e) => `${nameOf(EDGES[e])} ${EDGES[e][2]}`).join(", ");

  return finish({
    title: "The cut property: the lightest crossing edge is always safe",
    input: "",
    frames: [
      {
        caption: `A cut splits the vertices into two groups. ${crossing.length} edges cross this one: ${list(crossing)}. Every spanning tree uses at least one of them, or the two sides would not be connected. The claim: the lightest, ${nameOf(EDGES[e0])}, is safe to take.`,
        items: [...cutLine, ...drawGraph({ edge: (e) => (e === e0 ? "accent" : crosses(e) ? "ink" : "faint") }), read("r", `lightest crossing edge: ${nameOf(EDGES[e0])} (${EDGES[e0][2]})`, "accent")],
      },
      {
        caption: `Suppose a spanning tree skips ${nameOf(EDGES[e0])}, like this one of weight ${weightOf(T)}. It still has to cross the cut, so it uses a heavier crossing edge instead.`,
        items: [...cutLine, ...drawGraph({ node: () => "accent", edge: (e) => (T.includes(e) ? "accent" : "faint") }), read("r", `tree T without ${nameOf(EDGES[e0])}: weight ${weightOf(T)}`)],
      },
      {
        caption: `Add ${nameOf(EDGES[e0])} to it: that closes one cycle. The cycle crosses the cut on ${nameOf(EDGES[e0])}, so to get back it must cross again — on ${nameOf(EDGES[f])}, which weighs ${EDGES[f][2]}, at least as much as ${EDGES[e0][2]}.`,
        items: [
          ...cutLine,
          ...drawGraph({ node: () => "accent", edge: (e) => (e === f ? "error" : e === e0 || cyc.includes(e) ? "accent" : T.includes(e) ? "ink" : "faint"), dashed: (e) => e === e0 }),
          read("r", `cycle crosses back on ${nameOf(EDGES[f])} (${EDGES[f][2]})`, "error"),
        ],
      },
      {
        caption: `Swap ${nameOf(EDGES[f])} out: still connected, still ${n - 1} edges, and ${weightOf(T)} + ${EDGES[e0][2]} − ${EDGES[f][2]} = ${weightOf(swapped)}, never heavier. So some minimum spanning tree contains the lightest crossing edge, and a greedy algorithm may take it.`,
        items: [...cutLine, ...drawGraph({ node: () => "accent", edge: (e) => (e === e0 ? "accent" : swapped.includes(e) ? "ink" : "faint") }), read("r", `T + ${nameOf(EDGES[e0])} − ${nameOf(EDGES[f])}: weight ${weightOf(swapped)}`, "accent")],
      },
    ],
  });
}

/* ── Prim's algorithm ─────────────────────────────────────────────── */

function prim(): Walkthrough {
  const n = NAMES.length;
  // Same layout as the hub's Kruskal walkthrough, a little narrower, with the heap beside it.
  const pos: Pt[] = [{ x: 0, y: 92 }, { x: 112, y: 0 }, { x: 112, y: 184 }, { x: 244, y: 0 }, { x: 244, y: 184 }, { x: 356, y: 92 }];
  type Entry = { id: string; w: number; v: number; from: number; e: number };
  const inTree = new Set<number>([0]);
  const treeEdges: number[] = [];
  const heap: Entry[] = [];
  let pushed = 0;
  const pushFrom = (u: number) => {
    const out: Entry[] = [];
    EDGES.forEach(([a, b, w], e) => {
      const v = a === u ? b : b === u ? a : -1;
      if (v >= 0 && !inTree.has(v)) out.push({ id: `h${pushed++}`, w, v, from: u, e });
    });
    heap.push(...out);
    heap.sort((x, y) => x.w - y.w || x.v - y.v);
    return out;
  };
  const HX = 412;
  const EW = 66;
  const EH = 26;
  const frames: Frame[] = [];
  let total = 0;
  const entryText = (x: Entry) => `${NAMES[x.from]}–${NAMES[x.v]} ${x.w}`;

  const draw = (o: { popped?: Entry; stale?: boolean } = {}): Item[] => {
    const items = drawGraph({
      pos,
      node: (i) => (inTree.has(i) ? "strong" : o.popped && o.popped.v === i && !o.stale ? "accent" : "plain"),
      edge: (e) => (o.popped?.e === e ? (o.stale ? "error" : "accent") : treeEdges.includes(e) ? "accent" : heap.some((x) => x.e === e && !inTree.has(x.v)) ? "ink" : "faint"),
      dashed: (e) => o.stale === true && o.popped?.e === e,
    });
    items.push(label("pl", "popped", HX, -14, { anchor: "start", size: 11, tone: "soft" }));
    if (o.popped) items.push(box(o.popped.id, HX, 0, entryText(o.popped), { w: EW, h: EH, size: 12, tone: o.stale ? "error" : "accent" }));
    items.push(label("hl", "heap", HX, 52, { anchor: "start", size: 11, tone: "soft" }));
    heap.forEach((x, k) => items.push(box(x.id, HX, 64 + k * (EH + 4), entryText(x), { w: EW, h: EH, size: 12, tone: inTree.has(x.v) ? "muted" : "plain" })));
    items.push(note("tot", `tree: ${[...inTree].map((v) => NAMES[v]).join(" ")} · total ${total}`, 0, 246, { size: 12, weight: 600 }));
    return items;
  };

  pushFrom(0);
  frames.push({
    caption: `Prim grows one tree from A. Every edge leaving the tree goes into a min-heap keyed by its own weight — here ${and(heap.map(entryText))}, lightest first. The cut is always the tree against everything else.`,
    items: draw(),
  });
  while (inTree.size < n && heap.length) {
    const top = heap.shift() as Entry;
    if (inTree.has(top.v)) {
      frames.push({
        caption: `Pop ${entryText(top)}: ${NAMES[top.v]} is already in the tree, so this entry is stale — the edge would close a cycle. Skip it.`,
        items: draw({ popped: top, stale: true }),
      });
      continue;
    }
    inTree.add(top.v);
    treeEdges.push(top.e);
    total += top.w;
    const pushedNow = inTree.size < n ? pushFrom(top.v) : [];
    const lead = treeEdges.length === 1 ? `It is the lightest edge crossing the cut, so the cut property says it is safe: ${NAMES[top.v]} joins.` : `${NAMES[top.v]} joins the tree.`;
    const more = pushedNow.length ? ` Push its edges to vertices still outside: ${and(pushedNow.map(entryText))}.` : inTree.size < n ? ` It has no edges to vertices still outside.` : "";
    const done = inTree.size === n ? ` All ${n} vertices are in: ${n - 1} edges weighing ${total} — the same tree Kruskal's algorithm finds, picked in a different order.` : ` Total ${total}.`;
    frames.push({ caption: `Pop ${entryText(top)}. ${lead}${more}${done}`, items: draw({ popped: top }) });
  }
  return finish({ title: "Prim's algorithm grows one tree from A", input: `start = A; ${EDGES.map(([a, b, w]) => `${NAMES[a]}–${NAMES[b]} ${w}`).join(", ")}`, frames });
}

/** Prim against Dijkstra on a triangle: the cheapest tree is not the tree of cheapest routes. */
function primVsDijkstra(): Walkthrough {
  const names = ["A", "B", "C"];
  const edges: Edge[] = [[0, 1, 2], [1, 2, 2], [0, 2, 3]];
  const tri: Pt[] = [{ x: 0, y: 120 }, { x: 80, y: 0 }, { x: 160, y: 120 }];
  const n = names.length;
  // Prim: grow from A by the lightest edge leaving the tree.
  const primTree: number[] = [];
  const inP = new Set([0]);
  while (inP.size < n) {
    const e = edges.map((_, i) => i).filter((i) => inP.has(edges[i][0]) !== inP.has(edges[i][1])).reduce((b, i) => (edges[i][2] < edges[b][2] ? i : b));
    primTree.push(e);
    inP.add(edges[e][0]);
    inP.add(edges[e][1]);
  }
  // Dijkstra: settle by total distance from A; each vertex keeps the edge of its last improvement.
  const dist = [0, Infinity, Infinity];
  const via = [-1, -1, -1];
  const done = new Set<number>();
  while (done.size < n) {
    const u = [0, 1, 2].filter((i) => !done.has(i)).reduce((b, i) => (dist[i] < dist[b] ? i : b));
    done.add(u);
    edges.forEach(([a, b, w], e) => {
      const v = a === u ? b : b === u ? a : -1;
      if (v >= 0 && !done.has(v) && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        via[v] = e;
      }
    });
  }
  const dijTree = via.filter((e) => e >= 0);
  const routeIn = (tree: number[], to: number) => weightOf(pathEdges(edges, treePath(n, edges, tree, 0, to)), edges);
  const DX = 250;
  const panel = (prefix: string, x: number, tree: number[], title: string): Item[] => {
    const pos = tri.map((p) => ({ x: p.x + x, y: p.y }));
    return [
      label(`${prefix}t`, title, x + 80, -40, { tone: "ink", weight: 600, size: 12 }),
      ...drawGraph({ names, pos, edges, prefix, node: (i) => (i === 0 ? "strong" : "accent"), edge: (e) => (tree.includes(e) ? "accent" : "faint"), dashed: (e) => !tree.includes(e) }),
      note(`${prefix}w`, `tree weight ${weightOf(tree, edges)}`, x + 80, 168, { anchor: "middle", size: 12, weight: 600 }),
      note(`${prefix}r`, `route A to C: ${routeIn(tree, 2)}`, x + 80, 190, { anchor: "middle", size: 12, tone: "soft" }),
    ];
  };
  const cIn = (tree: number[]) => edges[tree.find((e) => edges[e].includes(2) && edges[e][1] === 2) as number];
  return finish({
    title: "Prim's tree and Dijkstra's tree from the same start",
    input: edges.map(([a, b, w]) => `${names[a]}–${names[b]} ${w}`).join(", "),
    frames: [
      {
        caption: `Same graph, same start. Prim keys C by the one edge that would join it, so C comes in by ${nameOf(cIn(primTree), names)} (${cIn(primTree)[2]}): total ${weightOf(primTree, edges)}. Dijkstra keys C by its whole route, and ${dist[2]} < ${routeIn(primTree, 2)}, so it takes ${nameOf(cIn(dijTree), names)}: total ${weightOf(dijTree, edges)}, but the shorter route.`,
        items: [...panel("p", 0, primTree, "Prim: lightest tree"), ...panel("d", DX, dijTree, "Dijkstra: shortest routes")],
      },
    ],
  });
}

/* ── When the minimum spanning tree is unique ─────────────────────── */

/** A square of equal sides: every spanning tree leaves out one side, and all of them are minimum. */
function square(): Walkthrough {
  const names = ["P", "Q", "R", "S"];
  const edges: Edge[] = [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]];
  const pos: Pt[] = [{ x: 0, y: 0 }, { x: 130, y: 0 }, { x: 130, y: 130 }, { x: 0, y: 130 }];
  const n = names.length;
  // Every 3-edge subset that connects the square, and the least weight among them.
  const trees: number[][] = [];
  for (let skip = 0; skip < edges.length; skip++) {
    const kept = edges.map((_, e) => e).filter((e) => e !== skip);
    if (pieces(n, edges, kept).length === 1) trees.push(kept);
  }
  const least = Math.min(...trees.map((t) => weightOf(t, edges)));
  const minimum = trees.filter((t) => weightOf(t, edges) === least);
  const frames: Frame[] = minimum.map((t, k) => {
    const left = edges.map((_, e) => e).find((e) => !t.includes(e)) as number;
    return {
      caption:
        k === 0
          ? `Four sides of weight 1. Leave out ${nameOf(edges[left], names)} and the other three form a spanning tree of weight ${least}. Here every weight is equal, so the choice of side is free.`
          : k === minimum.length - 1
            ? `Leave out ${nameOf(edges[left], names)}: the ${minimum.length}th minimum spanning tree, weight ${least} again. Repeated weights allow several MSTs, but never different totals; with all weights distinct there is exactly one.`
            : `Leave out ${nameOf(edges[left], names)} instead: another spanning tree, and it weighs ${least} too.`,
      items: [
        ...drawGraph({ names, pos, edges, node: () => "strong", edge: (e) => (t.includes(e) ? "accent" : "faint"), dashed: (e) => e === left }),
        note("w", `tree ${k + 1} of ${minimum.length}: weight ${least}`, 65, 178, { anchor: "middle", size: 12, weight: 600 }),
      ],
    };
  });
  return finish({ title: "Equal weights, several minimum spanning trees", input: edges.map(([a, b, w]) => `${names[a]}–${names[b]} ${w}`).join(", "), frames });
}

/* ── Connecting points: Prim's array version ───────────────────────── */

function points(): Walkthrough {
  const pts: Array<[number, number]> = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]];
  const n = pts.length;
  const S = 30;
  const pos: Pt[] = pts.map(([x, y]) => ({ x: x * S, y: (10 - y) * S }));
  const cost = (a: number, b: number) => Math.abs(pts[a][0] - pts[b][0]) + Math.abs(pts[a][1] - pts[b][1]);
  const best = pts.map((_, i) => (i === 0 ? 0 : Infinity));
  const from = pts.map(() => -1);
  const inTree: number[] = [];
  let total = 0;
  const CX = 296;
  const CY = 70;
  const frames: Frame[] = [];
  const fmt = (v: number) => (v === Infinity ? "∞" : String(v));
  const RP = 15;

  const draw = (o: { cur?: number; dropped?: number[] } = {}): Item[] => {
    // The unit grid: a Manhattan distance is the number of grid steps between two points.
    const items: Item[] = [];
    for (let gx = 0; gx <= 7; gx++) items.push({ k: "path", id: `gx${gx}`, pts: [[gx * S, 0], [gx * S, 10 * S]], tone: "faint", width: 1 });
    for (let gy = 0; gy <= 10; gy++) items.push({ k: "path", id: `gy${gy}`, pts: [[0, (10 - gy) * S], [7 * S, (10 - gy) * S]], tone: "faint", width: 1 });
    for (let gx = 0; gx <= 7; gx++) items.push(label(`tx${gx}`, String(gx), gx * S, 10 * S + 26, { size: 10.5, tone: "faint", mono: true }));
    for (let gy = 0; gy <= 10; gy += 2) items.push(label(`ty${gy}`, String(gy), -24, (10 - gy) * S, { size: 10.5, tone: "faint", mono: true, anchor: "end" }));
    // The cheapest known edge from the tree to each point outside it, dashed; a tree edge, solid with its cost.
    pts.forEach((_, v) => {
      if (from[v] < 0) return;
      const tree = inTree.includes(v);
      items.push(link(`t${v}`, pos[from[v]], pos[v], RP, { tone: tree ? "accent" : o.dropped?.includes(v) ? "ink" : "faint", dashed: !tree, label: tree ? String(cost(from[v], v)) : undefined }));
    });
    pts.forEach((_, v) => {
      items.push({ k: "node", id: `n${v}`, x: pos[v].x, y: pos[v].y, r: RP, text: String(v), tone: inTree.includes(v) ? (v === o.cur ? "strong" : "accent") : "plain" });
    });
    items.push(label("bh", "best", CX + 28, CY - 14, { size: 11, tone: "soft" }));
    items.push(...column("b", best.map((b, v) => (inTree.includes(v) ? "in" : fmt(b))), { x: CX, y: CY, w: 56, h: 30, gap: 6, tone: (v) => (v === o.cur ? "strong" : inTree.includes(v) ? "muted" : o.dropped?.includes(v) ? "accent" : "plain"), size: 13 }));
    pts.forEach((_, v) => items.push(label(`bi${v}`, String(v), CX - 10, CY + v * 36 + 15, { size: 11, tone: "faint", mono: true })));
    items.push(note("tot", `total = ${total}`, CX, CY + n * 36 + 20, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Joining two points costs their Manhattan distance, |x₁ − x₂| + |y₁ − y₂|, and every pair may be joined. Prim's array version keeps best[v], the cheapest known edge from the tree to v: 0 for the start, ∞ for the rest.`,
    items: draw(),
  });
  while (inTree.length < n) {
    const u = pts.map((_, i) => i).filter((i) => !inTree.includes(i)).reduce((b, i) => (best[i] < best[b] ? i : b));
    inTree.push(u);
    total += best[u];
    const dropped: number[] = [];
    for (let v = 0; v < n; v++) {
      if (inTree.includes(v)) continue;
      if (cost(u, v) < best[v]) {
        best[v] = cost(u, v);
        from[v] = u;
        dropped.push(v);
      }
    }
    const joined = from[u] >= 0 ? `by the edge ${from[u]}–${u}, cost ${best[u]}` : "as the start";
    const scan = dropped.length ? ` Scanning the rest, ${and(dropped.map((v) => `best[${v}] drops to ${best[v]}`))}.` : inTree.length < n ? ` Scanning the rest changes nothing: ${u} is no nearer to any of them.` : "";
    const caption =
      inTree.length === n
        ? `The smallest best is point ${u}'s ${best[u]}, so it joins ${joined}. All ${n} points are in, total ${total}, after ${n} scans of ${n} entries: O(n²) time, O(n) memory, and no list of the n(n − 1)/2 edges at all.`
        : `The smallest best is point ${u}'s ${best[u]}, so it joins ${joined}; total ${total}.${scan}`;
    frames.push({ caption, items: draw({ cur: u, dropped }) });
  }
  return finish({ title: "Min Cost to Connect All Points with Prim's array version", input: `points = ${pts.map(([x, y]) => `(${x}, ${y})`).join(", ")}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "spanning-trees": spanningTrees,
  "cut-property": cutProperty,
  prim,
  "prim-vs-dijkstra": primVsDijkstra,
  square,
  points,
};
