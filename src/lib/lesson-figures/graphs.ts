import { and, finish, link, note, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, graph, grid, gridCell, label, type Pt } from "./kit.js";

/**
 * Graph Data Structure: the lesson's figures (content/roadmap/graphs.md
 * places each with "@figure <name>"). A data-structure lesson, so the
 * figures are the vocabulary, how the graph is laid out in memory three
 * ways and what each costs per question, why a tree has V − 1 edges, a
 * directed weighted matrix read by rows and columns, and a grid read as the
 * graph it is. Every number is computed from the edges drawn.
 */

type Edge = readonly [number, number];

/** Undirected adjacency lists, each sorted, from an edge list. */
function undirected(n: number, edges: readonly Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj.map((l) => l.sort((x, y) => x - y));
}

/** A shortest route a → b over undirected lists, as vertices (empty when none). */
function route(adj: ReadonlyArray<readonly number[]>, a: number, b: number): number[] {
  const prev = new Map<number, number>([[a, -1]]);
  const queue = [a];
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    for (const v of adj[u]) if (!prev.has(v)) (prev.set(v, u), queue.push(v));
  }
  if (!prev.has(b)) return [];
  const out: number[] = [];
  for (let at = b; at !== -1; at = prev.get(at) as number) out.unshift(at);
  return out;
}

const names = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const title = (id: string, text: string, x: number, y: number): Item => label(id, text, x, y, { anchor: "start", tone: "ink", weight: 600, size: 12.5 });

/* ── The words: vertex, edge, neighbour, degree ──────────────────── */

function vocabulary(): Walkthrough {
  const n = 5;
  const edges: Edge[] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];
  const pos: Pt[] = [{ x: 0, y: 90 }, { x: 110, y: 0 }, { x: 110, y: 180 }, { x: 250, y: 0 }, { x: 250, y: 180 }];
  const adj = undirected(n, edges);
  const deg = adj.map((l) => l.length);
  // The vertex the figure is about: the busiest one.
  const focus = deg.indexOf(Math.max(...deg));
  const items = graph("n", names(n), pos, edges, {
    tone: (i) => (i === focus ? "strong" : adj[focus].includes(i) ? "accent" : "plain"),
    edgeTone: (e) => (edges[e].includes(focus) ? "accent" : "line"),
  });
  // Each degree on the side of its vertex that no edge uses.
  const side: Array<[number, number, "start" | "middle" | "end"]> = [[-28, 0, "end"], [0, -32, "middle"], [0, 32, "middle"], [0, -32, "middle"], [0, 32, "middle"]];
  pos.forEach((p, i) => items.push(label(`d${i}`, `degree ${deg[i]}`, p.x + side[i][0], p.y + side[i][1], { anchor: side[i][2], tone: i === focus ? "accent" : "soft", size: 11 })));
  const [ea, eb] = edges[edges.length - 1];
  items.push(label("el", `edge ${ea}–${eb}`, pos[ea].x + 12, (pos[ea].y + pos[eb].y) / 2, { anchor: "start", tone: "faint", size: 11 }));
  const sum = deg.reduce((s, d) => s + d, 0);
  items.push(note("sum", `degrees: ${deg.join(" + ")} = ${sum} = 2 × ${edges.length} edges`, -40, 252, { size: 12 }));
  return finish({
    title: "Vertices, edges, neighbours and degree",
    input: `n = ${n}, edges = [${edges.map(([a, b]) => `[${a},${b}]`).join(", ")}]`,
    frames: [
      {
        caption: `Vertex ${focus} is joined by edges to ${and(adj[focus].map(String))}: those are its neighbours, and its degree is ${deg[focus]}. Every edge has two ends, so the degrees always add up to twice the number of edges, here ${sum} = 2 × ${edges.length}.`,
        items,
      },
    ],
  });
}

/* ── Undirected, directed, weighted ───────────────────────────────── */

function kinds(): Walkthrough {
  const roads: Array<[number, number, number]> = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 5], [2, 3, 8]];
  const n = 4;
  const at: Pt[] = [{ x: 0, y: 55 }, { x: 58, y: 0 }, { x: 58, y: 110 }, { x: 116, y: 55 }];
  const STEP = 172;
  const moved = (k: number) => at.map((p) => ({ x: p.x + k * STEP, y: p.y }));
  const focus = 1;
  const items: Item[] = [];

  // Undirected: 1's neighbours, both ways.
  const und = undirected(n, roads.map(([a, b]) => [a, b] as Edge));
  items.push(title("t0", "Undirected", -17, -40));
  items.push(...graph("u", names(n), moved(0), roads.map(([a, b]) => [a, b] as const), { r: 17, tone: (i) => (i === focus ? "accent" : "plain"), edgeTone: (e) => (roads[e][0] === focus || roads[e][1] === focus ? "accent" : "line") }));
  items.push(note("n0", `degree(${focus}) = ${und[focus].length}`, -17, 152, { size: 11 }));

  // Directed: arrows, so arriving and leaving are counted apart.
  const inDeg = roads.filter(([, b]) => b === focus).length;
  const outDeg = roads.filter(([a]) => a === focus).length;
  items.push(title("t1", "Directed", STEP - 17, -40));
  items.push(...graph("d", names(n), moved(1), roads.map(([a, b]) => [a, b] as const), { r: 17, directed: true, tone: (i) => (i === focus ? "accent" : "plain"), edgeTone: (e) => (roads[e][1] === focus ? "accent" : "line") }));
  items.push(note("n1", `in(${focus}) = ${inDeg}, out(${focus}) = ${outDeg}`, STEP - 17, 152, { size: 11 }));

  // Weighted: the cheapest route from 0 to 1, found by trying every simple path.
  const from = 0;
  const to = 1;
  let best: { cost: number; path: number[] } = { cost: Infinity, path: [] };
  const walk = (u: number, path: number[], cost: number) => {
    if (u === to) {
      if (cost < best.cost) best = { cost, path: [...path] };
      return;
    }
    for (const [a, b, w] of roads) if (a === u && !path.includes(b)) walk(b, [...path, b], cost + w);
  };
  walk(from, [from], 0);
  const direct = roads.find(([a, b]) => a === from && b === to)?.[2] ?? Infinity;
  const onBest = (a: number, b: number) => best.path.some((v, i) => i > 0 && best.path[i - 1] === a && v === b);
  items.push(title("t2", "Weighted", 2 * STEP - 17, -40));
  items.push(
    ...graph("w", names(n), moved(2), roads, {
      r: 17,
      directed: true,
      tone: (i) => (best.path.includes(i) ? "accent" : "plain"),
      edgeTone: (e) => (onBest(roads[e][0], roads[e][1]) ? "accent" : "line"),
    }),
  );
  items.push(note("n2", `${from} → ${to} direct: ${direct}`, 2 * STEP - 17, 152, { size: 11 }));
  items.push(note("n3", `${best.path.join(" → ")}: ${best.path.slice(1).map((v, i) => roads.find(([a, b]) => a === best.path[i] && b === v)?.[2]).join(" + ")} = ${best.cost}`, 2 * STEP - 17, 170, { size: 11, tone: "accent" }));

  return finish({
    title: "Undirected, directed and weighted edges",
    input: "",
    frames: [
      {
        caption: `Left: an undirected edge works both ways, so ${focus} simply has ${und[focus].length} neighbours. Middle: the same edges made one-way; ${focus} has ${inDeg} arriving and ${outDeg} leaving. Right: weights put a cost on each edge, and the two-edge route ${best.path.join(" → ")} costs ${best.cost}, less than the direct edge's ${direct}.`,
        items,
      },
    ],
  });
}

/* ── Why a tree has V − 1 edges ───────────────────────────────────── */

function treeEdges(): Walkthrough {
  const n = 6;
  const pos: Pt[] = [{ x: 0, y: 0 }, { x: 130, y: 0 }, { x: 260, y: 0 }, { x: 0, y: 100 }, { x: 130, y: 100 }, { x: 260, y: 100 }];
  const order: Edge[] = [[0, 1], [3, 4], [1, 4], [2, 5], [1, 2], [4, 5]];
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const members = (x: number) => names(n).map(Number).filter((v) => find(v) === find(x));
  const added: Edge[] = [];
  let components = n;
  const frames: Frame[] = [];

  const draw = (o: { fresh?: Edge; cycle?: number[]; bad?: Edge } = {}): Item[] => {
    const all = o.bad ? [...added, o.bad] : added;
    const onCycle = (a: number, b: number) => !!o.cycle && o.cycle.some((v, i) => i > 0 && ((o.cycle![i - 1] === a && v === b) || (o.cycle![i - 1] === b && v === a)));
    // Each component of two or more vertices as a shaded band (in this
    // layout every component's bounding box holds only its own vertices).
    const items: Item[] = [];
    const roots = new Set(names(n).map((v) => find(Number(v))));
    for (const root of roots) {
      const vs = names(n).map(Number).filter((v) => find(v) === root);
      if (vs.length < 2) continue;
      const xs = vs.map((v) => pos[v].x);
      const ys = vs.map((v) => pos[v].y);
      const P = 26;
      items.push({ k: "band", id: `c${Math.min(...vs)}`, x: Math.min(...xs) - P, y: Math.min(...ys) - P, w: Math.max(...xs) - Math.min(...xs) + 2 * P, h: Math.max(...ys) - Math.min(...ys) + 2 * P, tone: "muted" });
    }
    items.push(...graph("n", names(n), pos, all, {
      r: 18,
      tone: (i) => (o.cycle?.includes(i) || o.fresh?.includes(i) ? "accent" : "plain"),
      edgeTone: (e): LineTone => {
        const [a, b] = all[e];
        if (o.bad && e === all.length - 1) return "error";
        if (o.fresh && a === o.fresh[0] && b === o.fresh[1]) return "accent";
        return onCycle(a, b) ? "accent" : "ink";
      },
    }));
    items.push(note("cnt", `edges: ${all.length} · components: ${components}`, -26, 152, { weight: 600 }));
    return items;
  };

  frames.push({ caption: `Six vertices and no edges yet: six components, each a vertex on its own. Watch the count as edges arrive — each one can merge at most two pieces.`, items: draw() });
  for (const e of order) {
    const [a, b] = e;
    if (find(a) === find(b)) {
      const cyc = route(undirected(n, added), a, b);
      frames.push({
        caption: `Edge ${a}–${b} is one too many: ${a} and ${b} are already connected through ${cyc.join("–")}, so the new edge closes a cycle. That is why a tree has exactly V − 1 edges, and exactly one path between any two of its vertices.`,
        items: draw({ cycle: cyc, bad: e }),
      });
      break;
    }
    const left = `{${members(a).join(", ")}}`;
    const right = `{${members(b).join(", ")}}`;
    parent[find(a)] = find(b);
    added.push(e);
    components--;
    let caption = `Edge ${a}–${b} links ${left} with ${right}: ${components + 1} components become ${components}.`;
    if (added.length === 1) caption += ` Joining two separate pieces can never close a cycle, since no route linked them before.`;
    if (components === 1) caption += ` One component after ${added.length} edges, V − 1, and no cycle: a tree. Fewer edges could not connect 6 vertices.`;
    frames.push({ caption, items: draw({ fresh: e }) });
  }
  return finish({ title: "Why a tree on V vertices has exactly V − 1 edges", input: `edges added in the order ${order.map(([a, b]) => `${a}–${b}`).join(", ")}`, frames });
}

/* ── Three ways to store one graph, and what a question costs in each ─ */

function threeStores(): Walkthrough {
  const n = 5;
  const edges: Edge[] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];
  const pos: Pt[] = [{ x: 0, y: 55 }, { x: 75, y: 0 }, { x: 75, y: 110 }, { x: 175, y: 0 }, { x: 175, y: 110 }];
  const adj = undirected(n, edges);
  const matrix = Array.from({ length: n }, (_, u) => Array.from({ length: n }, (_, v) => (adj[u].includes(v) ? 1 : 0)));
  const AX = 286;
  const AS = 24;
  const ay = (i: number) => -14 + i * 30;
  const EY = 182;
  const EW = 38;
  const M = { x: 316, y: EY, w: 24, h: 24, gap: 3 };
  const q = 1;
  const [ca, cb] = [3, 4];

  type Ask = "none" | "edges" | "matrix" | "list" | "check";
  const draw = (ask: Ask, readout: string): Item[] => {
    const nb = ask === "edges" || ask === "matrix" || ask === "list";
    const items = graph("n", names(n), pos, edges, {
      r: 16,
      tone: (i) => (nb ? (i === q ? "strong" : adj[q].includes(i) ? "accent" : "plain") : ask === "check" && (i === ca || i === cb) ? "accent" : "plain"),
      edgeTone: (e) => (nb && edges[e].includes(q)) || (ask === "check" && edges[e][0] === ca && edges[e][1] === cb) ? "accent" : "line",
    });
    // The adjacency list, top right.
    items.push(title("ta", "adjacency list", AX - 52, -36));
    adj.forEach((list, u) => {
      items.push(label(`al${u}`, `adj[${u}]`, AX - 8, ay(u) + AS / 2, { anchor: "end", mono: true, size: 11.5 }));
      list.forEach((v, j) => items.push(box(`a${u}-${v}`, AX + j * (AS + 4), ay(u), v, { w: AS, h: AS, size: 12, tone: ask === "list" && u === q ? "strong" : ask === "check" && u === ca ? "accent" : "plain" })));
    });
    // The edge list, bottom left.
    items.push(title("te", "edge list", 0, EY - 26));
    edges.forEach(([a, b], i) => {
      const tone: Tone = ask === "edges" ? (a === q || b === q ? "strong" : "accent") : "plain";
      items.push(box(`e${i}`, i * (EW + 5), EY, `${a}–${b}`, { w: EW, h: 26, size: 12, tone }));
    });
    // The matrix, bottom right.
    items.push(title("tm", "adjacency matrix", M.x, EY - 40));
    items.push(
      ...grid("m", matrix, {
        ...M,
        size: 12,
        rowLabels: names(n),
        colLabels: names(n),
        tone: (r, c) => {
          if (ask === "matrix" && r === q) return matrix[r][c] ? "strong" : "accent";
          if (ask === "check" && r === ca && c === cb) return "strong";
          return matrix[r][c] ? "plain" : "muted";
        },
      }),
    );
    items.push(note("rd", readout, 0, gridCell(n - 1, 0, M).y + M.h + 26, { size: 12, weight: 600 }));
    return items;
  };

  const found = adj[q].length;
  const edgesRead = edges.length;
  const frames: Frame[] = [
    {
      caption: `One graph, three layouts. The edge list keeps the ${edges.length} pairs as given; the matrix gives every ordered pair of vertices a cell, ${n * n} in all; the adjacency list gives each vertex the list of its neighbours, ${2 * edges.length} entries for ${edges.length} edges.`,
      items: draw("none", `stored: ${edges.length} pairs · ${n * n} cells · ${2 * edges.length} entries`),
    },
    {
      caption: `Who are the neighbours of ${q}? The edge list must read all ${edgesRead} pairs to find the ${found} that name ${q}: O(E) for one question, and a search asks it once for every vertex.`,
      items: draw("edges", `neighbours(${q}) from the edge list: ${edgesRead} read, ${found} found`),
    },
    {
      caption: `The matrix reads row ${q}, all ${n} cells, and keeps the ${found} that hold a 1: O(V) per vertex, however few neighbours it has.`,
      items: draw("matrix", `neighbours(${q}) from the matrix: ${n} read, ${found} found`),
    },
    {
      caption: `The adjacency list hands over adj[${q}] = [${adj[q].join(", ")}] directly: O(degree), exactly the work there is. That is why searches use it.`,
      items: draw("list", `neighbours(${q}) from the list: ${adj[q].length} read, ${found} found`),
    },
    {
      caption: `Is ${ca} joined to ${cb}? The matrix answers with the single cell matrix[${ca}][${cb}], O(1); the list scans adj[${ca}]. That is the matrix's one strength, bought with V² cells: ${n * n} here, 10¹⁰ for V = 10⁵.`,
      items: draw("check", `matrix[${ca}][${cb}] = ${matrix[ca][cb]}: one cell read`),
    },
  ];
  return finish({ title: "The same graph as an edge list, an adjacency matrix and an adjacency list", input: `n = ${n}, edges = [${edges.map(([a, b]) => `[${a},${b}]`).join(", ")}]`, frames });
}

/* ── A directed, weighted graph in a matrix ───────────────────────── */

function directedMatrix(): Walkthrough {
  const n = 4;
  const roads: Array<[number, number, number]> = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 5], [2, 3, 8]];
  const pos: Pt[] = [{ x: 0, y: 75 }, { x: 105, y: 0 }, { x: 105, y: 150 }, { x: 210, y: 75 }];
  const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (const [a, b, w] of roads) matrix[a][b] = w; // directed: only the from → to cell
  const outDeg = (u: number) => matrix[u].filter((w) => w).length;
  const inDeg = (v: number) => matrix.filter((row) => row[v]).length;
  const M = { x: 300, y: 22, w: 34, h: 34, gap: 4 };

  const draw = (o: { row?: number; col?: number; cells?: Array<[number, number]>; nodes?: number[]; edge?: (a: number, b: number) => boolean; readout: string }): Item[] => {
    const items = graph("n", names(n), pos, roads, { r: 18, directed: true, tone: (i) => (o.nodes?.includes(i) ? "strong" : "plain"), edgeTone: (e) => (o.edge?.(roads[e][0], roads[e][1]) ? "accent" : "line") });
    items.push(
      ...grid("m", matrix, {
        ...M,
        size: 13,
        text: (r, c) => (matrix[r][c] ? String(matrix[r][c]) : "·"),
        rowLabels: names(n),
        colLabels: names(n),
        tone: (r, c) => {
          const hit = r === o.row || c === o.col || o.cells?.some(([a, b]) => a === r && b === c);
          if (hit) return matrix[r][c] ? "strong" : "accent";
          return matrix[r][c] ? "plain" : "muted";
        },
      }),
    );
    items.push(label("to", "to →", M.x, M.y - 30, { anchor: "start", size: 11 }));
    items.push(label("from", "from ↓", M.x - 8, M.y - 30, { anchor: "end", size: 11 }));
    items.push(note("rd", o.readout, 0, 214, { size: 12, weight: 600 }));
    return items;
  };

  const [qa, qb] = [2, 1];
  const r = 2;
  const c = 1;
  const src = names(n).map(Number).filter((v) => inDeg(v) === 0);
  const sink = names(n).map(Number).filter((v) => outDeg(v) === 0);
  const frames: Frame[] = [
    {
      caption: `Five one-way roads with their lengths. A directed edge fills only its own cell, matrix[from][to], so the matrix is no longer symmetric: matrix[${qa}][${qb}] = ${matrix[qa][qb]}, but matrix[${qb}][${qa}] is empty — there is no road from ${qb} to ${qa}.`,
      items: draw({ cells: [[qa, qb], [qb, qa]], nodes: [qa, qb], edge: (a, b) => a === qa && b === qb, readout: `matrix[${qa}][${qb}] = ${matrix[qa][qb]} · matrix[${qb}][${qa}] = none` }),
    },
    {
      caption: `Row ${r} lists the roads leaving ${r}: to ${and(matrix[r].flatMap((w, v) => (w ? [String(v)] : [])))}. Counting its filled cells gives the out-degree, ${outDeg(r)}.`,
      items: draw({ row: r, nodes: [r], edge: (a) => a === r, readout: `out-degree(${r}) = ${outDeg(r)}` }),
    },
    {
      caption: `Column ${c} lists the roads arriving at ${c}: from ${and(matrix.flatMap((row, u) => (row[c] ? [String(u)] : [])))}. Its filled cells give the in-degree, ${inDeg(c)}.`,
      items: draw({ col: c, nodes: [c], edge: (_, b) => b === c, readout: `in-degree(${c}) = ${inDeg(c)}` }),
    },
    {
      caption: `Column ${src.join(", ")} is empty, so no road leads to ${src.join(", ")}, and row ${sink.join(", ")} is empty, so none leaves ${sink.join(", ")}. In a dependency graph those are the job that can start at once and the job nothing waits for.`,
      items: draw({ col: src[0], row: sink[0], nodes: [...src, ...sink], readout: `in-degree(${src[0]}) = 0 · out-degree(${sink[0]}) = 0` }),
    },
  ];
  return finish({ title: "A directed, weighted graph in an adjacency matrix", input: `edges (from, to, weight) = ${roads.map(([a, b, w]) => `(${a},${b},${w})`).join(", ")}`, frames });
}

/* ── A grid is a graph ────────────────────────────────────────────── */

function gridGraph(): Walkthrough {
  const rows = ["..#..", ".#..#", "...#.", "#...."];
  const R = rows.length;
  const C = rows[0].length;
  const open = (r: number, c: number) => r >= 0 && r < R && c >= 0 && c < C && rows[r][c] === ".";
  const DIRS: Array<[string, number, number]> = [["up", -1, 0], ["down", 1, 0], ["left", 0, -1], ["right", 0, 1]];
  const [fr, fc] = [0, 3];
  const items: Item[] = [];

  // Left: the grid as the input gives it.
  const S = 34;
  const D = 52;
  const NR = 14;
  const near: Array<{ name: string; ok: boolean; why: string; r: number; c: number }> = [];
  for (const [name, dr, dc] of DIRS) {
    const r = fr + dr;
    const c = fc + dc;
    const inside = r >= 0 && r < R && c >= 0 && c < C;
    near.push({ name, ok: open(r, c), why: !inside ? "outside the grid" : open(r, c) ? "open" : "a wall", r, c });
  }
  const isNear = (r: number, c: number) => near.some((x) => x.ok && x.r === r && x.c === c);
  items.push(title("t1", "the input", 0, -D - 30));
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      items.push(box(`g${r}-${c}`, c * (S + 4), -NR + r * (S + 4), rows[r][c] === "#" ? "#" : "", { w: S, h: S, size: 13, tone: rows[r][c] === "#" ? "muted" : r === fr && c === fc ? "strong" : isNear(r, c) ? "accent" : "plain" }));

  // Right: the graph it describes, one vertex per open cell.
  const GX = 250;
  const at = (r: number, c: number): Pt => ({ x: GX + c * D, y: r * D });
  let edgeCount = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (!open(r, c)) continue;
      // Each edge once: to the right and downwards.
      for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
        if (!open(r + dr, c + dc)) continue;
        edgeCount++;
        const hot = (r === fr && c === fc && isNear(r + dr, c + dc)) || (r + dr === fr && c + dc === fc && isNear(r, c));
        items.push(link(`l${r}-${c}-${dr}`, at(r, c), at(r + dr, c + dc), NR, { tone: hot ? "accent" : "line" }));
      }
    }
  let opens = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const p = at(r, c);
      if (open(r, c)) {
        opens++;
        items.push({ k: "node", id: `v${r}-${c}`, x: p.x, y: p.y, r: NR, text: "", tone: r === fr && c === fc ? "strong" : isNear(r, c) ? "accent" : "plain" });
      } else items.push(box(`w${r}-${c}`, p.x - 12, p.y - 12, "#", { w: 24, h: 24, tone: "muted", size: 12 }));
    }
  items.push(title("t2", "the graph it describes", GX - NR, -D - 30));
  // Every direction from the focus cell: teal to a neighbour, red to what blocks it.
  const f = at(fr, fc);
  for (const d of near) {
    const p = at(d.r, d.c);
    const ux = Math.sign(p.x - f.x);
    const uy = Math.sign(p.y - f.y);
    // Each label beside what it names, clear of the lines: right of a box above, above a cell beside, right of a line below.
    const tag = (text: string, tone: "accent" | "error") =>
      items.push(uy < 0 ? label(`ol${d.name}`, text, p.x + 18, p.y, { anchor: "start", tone, size: 11 }) : uy > 0 ? label(`ol${d.name}`, text, f.x + 8, (f.y + p.y) / 2, { anchor: "start", tone, size: 11 }) : label(`ol${d.name}`, text, p.x, p.y - 24, { tone, size: 11 }));
    if (d.ok) {
      tag(d.name, "accent");
      continue;
    }
    const inside = d.why !== "outside the grid";
    if (!inside) items.push(box(`out${d.name}`, p.x - 12, p.y - 12, "", { w: 24, h: 24, tone: "ghost" }));
    tag(`${d.name}: ${inside ? "wall" : "outside"}`, "error");
    items.push(arrow(`x${d.name}`, { x: f.x + ux * (NR + 2), y: f.y + uy * (NR + 2) }, { x: p.x - ux * 14, y: p.y - uy * 14 }, { tone: "error" }));
  }
  items.push(note("rd", `${R} × ${C} grid: ${opens} open cells, ${edgeCount} edges, none stored`, 0, (R - 1) * D + 40, { size: 12 }));
  const ok = near.filter((d) => d.ok).map((d) => d.name);
  const bad = near.filter((d) => !d.ok).map((d) => `${d.name} is ${d.why}`);
  return finish({
    title: "A grid is a graph whose edges are never stored",
    input: `grid = [${rows.map((r) => `"${r}"`).join(", ")}]`,
    frames: [
      {
        caption: `Each open cell is a vertex, joined to the open cells beside it. From (${fr}, ${fc}) the four direction offsets are tried in turn: ${and(bad)}, so only ${and(ok)} lead to neighbours. The edges are worked out when needed, never built.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  vocabulary,
  kinds,
  "tree-edges": treeEdges,
  "three-stores": threeStores,
  "directed-matrix": directedMatrix,
  "grid-graph": gridGraph,
};
