import { and, finish, link, note, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, type Pt } from "./kit.js";

/**
 * Depth-First Search (DFS): the lesson's figures (content/roadmap/
 * depth-first-search.md places each with "@figure <name>"). DFS beside BFS
 * on one graph, the explicit-stack version, the entry/exit clock as nested
 * bars, island sinking, the three colours that tell a cycle from a diamond,
 * and the all-land grid that makes recursion a million calls deep. Every
 * generator runs the real search and records what it did.
 */

/** The lesson's graph: A–B, A–C, B–D, B–E, C–F, D–E. */
const NAMES = ["A", "B", "C", "D", "E", "F"];
const EDGES: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 4]];
const ADJ = NAMES.map((_, i) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort((a, b) => a - b));
const POS: Pt[] = [{ x: 90, y: 0 }, { x: 40, y: 80 }, { x: 150, y: 80 }, { x: 0, y: 160 }, { x: 85, y: 160 }, { x: 150, y: 160 }];
/** Where each vertex's order number sits: on the side its edges leave free. */
const TAG: Array<[number, number, "start" | "middle" | "end"]> = [[0, -30, "middle"], [-26, 0, "end"], [26, 0, "start"], [0, 30, "middle"], [0, 30, "middle"], [0, 30, "middle"]];
const R = 17;

const node = (id: string, p: Pt, text: string, tone: Tone = "plain", r = R): Item => ({ k: "node", id, x: p.x, y: p.y, r, text, tone });
const at = (p: Pt, dx: number, dy = 0): Pt => ({ x: p.x + dx, y: p.y + dy });
const ordinal = (k: number) => `${k}${k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"}`;
const isTree = (parent: readonly number[], a: number, b: number) => parent[b] === a || parent[a] === b;

/** Recursive DFS from 0 over ADJ: discovery order, parents, and the clock at each entry and exit. */
function dfsRun() {
  const parent = NAMES.map(() => -1);
  const entry = NAMES.map(() => 0);
  const exit = NAMES.map(() => 0);
  const depth = NAMES.map(() => 0);
  const order: number[] = [];
  let clock = 0;
  const visit = (u: number, d: number) => {
    entry[u] = ++clock;
    depth[u] = d;
    order.push(u);
    for (const v of ADJ[u]) if (!entry[v]) (parent[v] = u), visit(v, d + 1);
    exit[u] = ++clock;
  };
  visit(0, 0);
  return { parent, entry, exit, depth, order };
}

/* ── DFS beside BFS ───────────────────────────────────────────────── */

function diveVsRipple(): Walkthrough {
  // BFS on the same lists, for the left panel.
  const bParent = NAMES.map(() => -1);
  const seen = NAMES.map((_, i) => i === 0);
  const bOrder = [0];
  for (let h = 0; h < bOrder.length; h++) for (const v of ADJ[bOrder[h]]) if (!seen[v]) (seen[v] = true, (bParent[v] = bOrder[h]), bOrder.push(v));
  const { parent: dParent, order: dOrder } = dfsRun();
  const OFF = 250;
  const items: Item[] = [];
  const panel = (key: string, dx: number, parent: number[], order: number[], title: string) => {
    items.push(label(`${key}t`, title, dx - 20, -58, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }));
    EDGES.forEach(([a, b], i) => items.push(link(`${key}e${i}`, at(POS[a], dx), at(POS[b], dx), R, { tone: isTree(parent, a, b) ? "accent" : "faint", dashed: !isTree(parent, a, b) })));
    NAMES.forEach((nm, i) => {
      items.push(node(`${key}n${i}`, at(POS[i], dx), nm, i === 0 ? "strong" : "plain"));
      items.push(label(`${key}k${i}`, String(order.indexOf(i) + 1), POS[i].x + dx + TAG[i][0], POS[i].y + TAG[i][1], { anchor: TAG[i][2], tone: "accent", size: 12, weight: 600, mono: true }));
    });
    items.push(note(`${key}o`, `order: ${order.map((v) => NAMES[v]).join(" ")}`, dx - 20, 216, { size: 12, weight: 600 }));
  };
  panel("b", 0, bParent, bOrder, "Breadth-first: ring by ring");
  panel("d", OFF, dParent, dOrder, "Depth-first: one branch to its end");
  const deepest = dOrder.slice(0, dOrder.findIndex((v, i) => i > 0 && dParent[v] !== dOrder[i - 1]));
  return finish({
    title: "The same graph searched breadth-first and depth-first",
    input: `edges = ${EDGES.map(([a, b]) => `${NAMES[a]}–${NAMES[b]}`).join(", ")}; start = A`,
    frames: [
      {
        caption: `Same graph, same neighbour order, numbers giving the visiting order. BFS takes all of A's neighbours first; DFS runs ${deepest.map((v) => NAMES[v]).join(" → ")} to a dead end before it ever looks at ${NAMES[ADJ[0][1]]}. Teal edges are the ones each search arrived by.`,
        items,
      },
    ],
  });
}

/* ── DFS with an explicit stack ───────────────────────────────────── */

function explicitStack(): Walkthrough {
  type Entry = { v: number; by: number; id: number };
  let pushes = 0;
  const stack: Entry[] = [{ v: 0, by: -1, id: pushes++ }];
  const mark = NAMES.map(() => 0);
  const via = NAMES.map(() => -1);
  let count = 0;
  const SX = 260;
  const SW = 64;
  const SH = 28;
  const SB = 150;
  const frames: Frame[] = [];

  const draw = (current: number, pushed: number[], skipped = false): Item[] => {
    const items: Item[] = [];
    EDGES.forEach(([a, b], i) => items.push(link(`e${i}`, POS[a], POS[b], R, { tone: via[b] === a || via[a] === b ? "accent" : "line" })));
    NAMES.forEach((nm, i) => {
      items.push(node(`n${i}`, POS[i], nm, i === current ? (skipped ? "muted" : "strong") : mark[i] ? "accent" : "plain"));
      if (mark[i]) items.push(label(`k${i}`, String(mark[i]), POS[i].x + TAG[i][0], POS[i].y + TAG[i][1], { anchor: TAG[i][2], tone: "accent", size: 12, weight: 600, mono: true }));
    });
    stack.forEach((e, k) => items.push(box(`s${e.id}`, SX, SB - k * (SH + 6), `${NAMES[e.v]}`, { w: SW, h: SH, size: 13, tone: pushed.includes(e.id) ? "accent" : mark[e.v] ? "error" : "plain" })));
    if (stack.length) items.push(label("top", "← top", SX + SW + 8, SB - (stack.length - 1) * (SH + 6) + SH / 2, { anchor: "start", tone: "faint", size: 11 }));
    else items.push(label("empty", "empty", SX + SW / 2, SB + SH / 2, { tone: "faint", size: 12 }));
    items.push(label("sl", "stack", SX + SW / 2, SB + SH + 14, { tone: "soft", size: 11, weight: 600 }));
    const order = NAMES.map((_, i) => i).filter((i) => mark[i]).sort((a, b) => mark[a] - mark[b]);
    items.push(note("ord", `visited: ${order.map((v) => NAMES[v]).join(" ") || "–"}`, -18, 214, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({ caption: `The stack starts with A, unmarked. A vertex is marked when it is popped, which is the moment the recursive version would enter it.`, items: draw(-1, [0]) });
  while (stack.length) {
    const e = stack.pop() as Entry;
    if (mark[e.v]) {
      frames.push({
        caption: `Pop ${NAMES[e.v]}: already visited, because it was pushed twice, so it is skipped. Marking on pop is what keeps the true depth-first order, at the price of extra entries: the stack can hold O(E) of them.`,
        items: draw(e.v, [], true),
      });
      continue;
    }
    mark[e.v] = ++count;
    via[e.v] = e.by;
    const fresh = ADJ[e.v].filter((v) => !mark[v]);
    const ids: number[] = [];
    for (const v of [...fresh].reverse()) {
      const id = pushes++;
      stack.push({ v, by: e.v, id });
      ids.push(id);
    }
    let caption: string;
    if (!fresh.length) caption = `Pop ${NAMES[e.v]} and mark it ${ordinal(count)}. Every neighbour is already visited, so nothing is pushed: this is where recursion would return.`;
    else if (count === 1) caption = `Pop A and mark it 1st. Its unvisited neighbours ${and(fresh.map((v) => NAMES[v]))} are pushed in reverse order, so ${NAMES[fresh[0]]}, the first, ends on top and comes off next, just as recursion would take it first.`;
    else {
      const twice = fresh.filter((v) => stack.filter((x) => x.v === v).length > 1);
      caption = `Pop ${NAMES[e.v]}, mark it ${ordinal(count)}, push ${and(fresh.map((v) => NAMES[v]))}.${twice.length ? ` ${and(twice.map((v) => NAMES[v]))} is now on the stack twice: it was pushed earlier but not yet popped, and is only marked when it is.` : ` The search goes deeper from here, as recursion would.`}`;
    }
    frames.push({ caption, items: draw(e.v, ids) });
  }
  const order = NAMES.map((_, i) => i).sort((a, b) => mark[a] - mark[b]);
  frames.push({ caption: `The stack is empty. The visiting order, ${order.map((v) => NAMES[v]).join(" ")}, is exactly the recursive one, and no call stack was used, so depth is limited only by memory.`, items: draw(-1, []) });
  return finish({ title: "DFS with an explicit stack instead of recursion", input: `edges = ${EDGES.map(([a, b]) => `${NAMES[a]}–${NAMES[b]}`).join(", ")}; start = A`, frames });
}

/* ── Entry and exit times nest like brackets ─────────────────────── */

function entryExit(): Walkthrough {
  const { entry, exit, depth, order } = dfsRun();
  const ticks = Math.max(...exit);
  const U = 36;
  const H = 26;
  const ROW = 34;
  const items: Item[] = [];
  const byExit = NAMES.map((_, i) => i).sort((a, b) => exit[a] - exit[b]);
  for (let t = 1; t <= ticks; t++) items.push(label(`t${t}`, String(t), (t - 0.5) * U, -16, { tone: "faint", size: 11, mono: true }));
  items.push(label("clk", "clock", -10, -16, { anchor: "end", tone: "soft", size: 11 }));
  NAMES.forEach((nm, i) => {
    const x = (entry[i] - 1) * U + 2;
    const w = (exit[i] - entry[i] + 1) * U - 4;
    items.push(box(`b${i}`, x, depth[i] * ROW, `${nm} ${entry[i]}–${exit[i]}`, { w, h: H, size: 12, tone: depth[i] === 0 ? "strong" : "accent" }));
  });
  const deepest = Math.max(...depth);
  for (let d = 0; d <= deepest; d++) items.push(label(`d${d}`, `depth ${d}`, -10, d * ROW + H / 2, { anchor: "end", tone: "faint", size: 11 }));
  const Y = (deepest + 1) * ROW + 14;
  items.push(note("pre", `entry order (preorder):  ${order.map((v) => NAMES[v]).join(" ")}`, -62, Y, { size: 12 }));
  items.push(note("post", `exit order (postorder):  ${byExit.map((v) => NAMES[v]).join(" ")}`, -62, Y + 22, { size: 12 }));
  // The same clock written as brackets: "(" at an entry, ")" at an exit.
  const events: string[] = [];
  for (let t = 1; t <= ticks; t++) {
    const e = entry.indexOf(t);
    events.push(e >= 0 ? `(${NAMES[e]}` : `${NAMES[exit.indexOf(t)]})`);
  }
  items.push(note("br", events.join(" ").replace(/\( /g, "("), -62, Y + 44, { size: 12, tone: "accent" }));
  const inner = NAMES.findIndex((_, i) => depth[i] === deepest);
  return finish({
    title: "Entry and exit times: every call's interval sits inside its caller's",
    input: `DFS from A on the lesson's graph, neighbours in alphabetical order`,
    frames: [
      {
        caption: `Each bar runs from the tick its call starts to the tick it returns, one clock for both. The bars nest like brackets: ${NAMES[inner]} is entered after its callers and leaves before them. Entry order is preorder; exit order is postorder, children before parents.`,
        items,
      },
    ],
  });
}

/* ── Counting islands by sinking them ─────────────────────────────── */

function islands(): Walkthrough {
  const start = ["11000", "11011", "00001", "01000", "11101"];
  const grid = start.map((r) => r.split(""));
  const rows = grid.length;
  const cols = grid[0].length;
  const DR = [-1, 1, 0, 0];
  const DC = [0, 0, -1, 1];
  const S = 40;
  const G = 5;
  const owner = grid.map((r) => r.map(() => 0));
  const step = grid.map((r) => r.map(() => 0));
  const LETTERS = "abcdefgh";
  let island = 0;
  let largest = 0;
  const frames: Frame[] = [];

  const draw = (current: number): Item[] => {
    const items: Item[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const o = owner[r][c];
        const land = start[r][c] === "1";
        const tone: Tone = !land ? "muted" : o === 0 ? "plain" : o === current ? "accent" : "strong";
        const text = !land ? "0" : o === 0 ? "1" : o === current ? `#${step[r][c]}` : LETTERS[o - 1];
        items.push(box(`g${r}-${c}`, c * (S + G), r * (S + G), text, { w: S, h: S, size: 14, tone }));
      }
    items.push(note("rd", `islands: ${island} · largest: ${largest}`, 0, rows * (S + G) + 14, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({ caption: `Land is 1 and water 0. The outer loop scans row by row; each land cell that no earlier search has sunk starts a new island, and sink() floods all of it.`, items: draw(0) });
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== "1") continue;
      island++;
      const path: string[] = [];
      const from: string[] = [];
      let n = 0;
      const sink = (y: number, x: number, by: string): number => {
        if (y < 0 || y >= rows || x < 0 || x >= cols || grid[y][x] !== "1") return 0;
        grid[y][x] = "0"; // mark before going deeper
        owner[y][x] = island;
        step[y][x] = ++n;
        path.push(`(${y}, ${x})`);
        from.push(by);
        let size = 1;
        for (let d = 0; d < 4; d++) size += sink(y + DR[d], x + DC[d], `(${y}, ${x})`);
        return size;
      };
      const size = sink(r, c, "");
      // The first visit that is not called from the cell just before it is a backtrack.
      const back = path.findIndex((_, i) => i > 1 && from[i] !== path[i - 1]);
      largest = Math.max(largest, size);
      let caption: string;
      if (island === 1) caption = `Island 1 starts at (${r}, ${c}). sink() tries up, down, left, right, diving at once into each land cell it finds: ${path.join(", ")}, numbered in the order reached. Each turns to water before the dive goes on.`;
      else if (size === 1) caption = `Island ${island} is the single cell (${r}, ${c}): the cells beside it are water, and cells only join along a side, never at a corner.`;
      else if (back > 0) caption = `Island ${island} starts at (${r}, ${c}). After ${path[back - 1]}, a dead end, the calls return to ${from[back]}, which still has a neighbour to try: ${path[back]}. That return is the backtrack.`;
      else caption = `Island ${island} starts at (${r}, ${c}), the first land cell left, and sink() reaches ${size} cells. Sunk islands are now water, so the scan passes over them without starting anything.`;
      frames.push({ caption, items: draw(island) });
    }
  frames.push({ caption: `The scan ends with ${island} islands, the largest ${largest} cells. Every cell was scanned once and every land cell sunk once, so the whole count is O(rows × columns).`, items: draw(-1) });
  return finish({ title: "Counting islands: each DFS sinks one island", input: `grid = [${start.map((r) => `"${r}"`).join(", ")}]`, frames });
}

/* ── White, grey and black: a diamond is not a cycle ──────────────── */

function threeColours(): Walkthrough {
  const graphs: Array<{ title: string; edges: Array<[number, number]>; pos: Pt[]; merge: boolean }> = [
    { title: "graph 1", edges: [[0, 1], [0, 2], [1, 3], [2, 3]], pos: [{ x: 60, y: 0 }, { x: 0, y: 80 }, { x: 120, y: 80 }, { x: 60, y: 160 }], merge: false },
    { title: "graph 2", edges: [[0, 1], [1, 2], [2, 3], [3, 1]], pos: [{ x: 60, y: 0 }, { x: 60, y: 80 }, { x: 120, y: 160 }, { x: 0, y: 160 }], merge: true },
  ];
  const OFF = 230;
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const colour = graphs.map((g) => g.pos.map(() => WHITE));
  const parent = graphs.map((g) => g.pos.map(() => -1));
  const finished = graphs.map(() => [] as number[]);
  const path = graphs.map(() => [] as number[]);
  const looked = graphs.map(() => new Map<string, LineTone>());
  const frames: Frame[] = [];

  const draw = (): Item[] => {
    const items: Item[] = [];
    graphs.forEach((g, k) => {
      const dx = k * OFF;
      items.push(label(`t${k}`, g.title, dx - 17, -40, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }));
      g.edges.forEach(([a, b], i) => {
        const seenTone = looked[k].get(`${a}-${b}`);
        const tone: LineTone = seenTone ?? (parent[k][b] === a ? "accent" : "line");
        items.push(link(`g${k}e${i}`, at(g.pos[a], dx), at(g.pos[b], dx), R, { tone, arrow: true, dashed: seenTone === "ink" }));
      });
      g.pos.forEach((p, i) => items.push(node(`g${k}n${i}`, at(p, dx), String(i), colour[k][i] === GREY ? "accent" : colour[k][i] === BLACK ? "muted" : "plain")));
      items.push(note(`p${k}`, `grey path: ${path[k].length ? path[k].join(" → ") : "–"}`, dx - 17, 200, { size: 11.5 }));
      items.push(note(`f${k}`, `finished: ${finished[k].length ? finished[k].join(" ") : "–"}`, dx - 17, 220, { size: 11.5 }));
    });
    // The legend: what each colour means.
    const key: Array<[Tone, string]> = [["plain", "white: not visited"], ["accent", "grey: on the path"], ["muted", "black: finished"]];
    key.forEach(([tone, text], i) => {
      items.push(node(`kn${i}`, { x: i * 150 - 10, y: 252 }, "", tone, 7));
      items.push(label(`kt${i}`, text, i * 150 + 2, 252, { anchor: "start", size: 11 }));
    });
    return items;
  };

  graphs.forEach((g, k) => {
    const adj = g.pos.map((_, i) => g.edges.filter(([a]) => a === i).map(([, b]) => b));
    type Ev = { kind: "enter"; u: number; from: number } | { kind: "exit"; u: number } | { kind: "edge"; u: number; v: number; seen: number };
    const events: Ev[] = [];
    const dfs = (u: number, from: number): boolean => {
      colour[k][u] = GREY;
      events.push({ kind: "enter", u, from });
      for (const v of adj[u]) {
        if (colour[k][v] !== WHITE) {
          events.push({ kind: "edge", u, v, seen: colour[k][v] });
          if (colour[k][v] === GREY) return true;
          continue;
        }
        parent[k][v] = u;
        if (dfs(v, u)) return true;
      }
      colour[k][u] = BLACK;
      events.push({ kind: "exit", u });
      return false;
    };
    dfs(0, -1);
    // Replay the run into frames, resetting the state to before it.
    colour[k] = g.pos.map(() => WHITE);
    parent[k] = g.pos.map(() => -1);
    let exits: number[] = [];
    events.forEach((ev, i) => {
      const next = events[i + 1];
      if (ev.kind === "enter") {
        colour[k][ev.u] = GREY;
        if (ev.from >= 0) parent[k][ev.u] = ev.from;
        path[k].push(ev.u);
        if (g.merge && next?.kind === "enter") return;
        let caption: string;
        if (g.merge) caption = `Graph 2 has the edge 3 → 1. The search runs ${path[k].join(" → ")} and every vertex it enters turns grey: all ${path[k].length} are on the current path, none finished.`;
        else if (ev.from < 0) caption = `Graph 1 is a diamond: two routes from 0 meet at 3, but nothing leads back. dfs(0) colours 0 grey, meaning it is on the current path.`;
        else if (path[k].length === 2 && !finished[k].length) caption = `${ev.from} → ${ev.u} leads to a white vertex, so dfs(${ev.u}) starts and ${ev.u} turns grey. The grey vertices are always the path from the start: ${path[k].join(" → ")}.`;
        else if (finished[k].length) caption = `Back in dfs(${ev.from}), the next edge ${ev.from} → ${ev.u} leads to white ${ev.u}, which turns grey.`;
        else caption = `${ev.from} → ${ev.u}: ${ev.u} is white, so it turns grey too, and the path is ${path[k].join(" → ")}.`;
        frames.push({ caption, items: draw() });
      } else if (ev.kind === "exit") {
        colour[k][ev.u] = BLACK;
        finished[k].push(ev.u);
        path[k].pop();
        exits.push(ev.u);
        if (next?.kind === "exit") return;
        const done = exits;
        exits = [];
        let caption: string;
        if (!path[k].length) caption = `${and(done.map(String))} finish. No edge ever met a grey vertex, so graph 1 has no cycle; the vertices finished in the order ${finished[k].join(", ")}.`;
        else caption = `${done[0]} has no outgoing edge left to try, so it finishes and turns black${done.length > 1 ? `, and so ${done.length > 2 ? "do" : "does"} ${and(done.slice(1).map(String))}` : ""}. Black means everything reachable from it has been explored.`;
        frames.push({ caption, items: draw() });
      } else {
        const tone: LineTone = ev.seen === GREY ? "error" : "ink";
        looked[k].set(`${ev.u}-${ev.v}`, tone);
        let caption: string;
        if (ev.seen === BLACK) caption = `${ev.u} → ${ev.v} meets ${ev.v} a second time, but ${ev.v} is black: finished, with no way back to the current path. Not a cycle, although a plain visited flag would say it was.`;
        else {
          const cyc = path[k].slice(path[k].indexOf(ev.v));
          caption = `${ev.u} → ${ev.v} meets a grey vertex: ${ev.v} is still on the path, waiting for its call to return, so ${[...cyc, ev.v].join(" → ")} is a cycle. An edge to a grey vertex is a back edge, and it always closes a cycle.`;
        }
        frames.push({ caption, items: draw() });
      }
    });
  });
  return finish({ title: "Three colours tell a cycle from two routes that meet", input: `graph 1: 0→1, 0→2, 1→3, 2→3; graph 2: 0→1, 1→2, 2→3, 3→1`, frames });
}

/* ── How deep recursion goes on an all-land grid ─────────────────── */

function deepSnake(): Walkthrough {
  const N = 5;
  const DR = [-1, 1, 0, 0];
  const DC = [0, 0, -1, 1];
  const visit = Array.from({ length: N }, () => Array.from({ length: N }, () => 0));
  const order: Array<[number, number]> = [];
  let depth = 0;
  let deepest = 0;
  const dfs = (r: number, c: number) => {
    if (r < 0 || r >= N || c < 0 || c >= N || visit[r][c]) return;
    visit[r][c] = order.length + 1;
    order.push([r, c]);
    deepest = Math.max(deepest, ++depth);
    for (let d = 0; d < 4; d++) dfs(r + DR[d], c + DC[d]);
    depth--;
  };
  dfs(0, 0);
  // It never backtracks before the end exactly when each visit is next to the one before.
  const straight = order.every(([r, c], i) => i === 0 || Math.abs(r - order[i - 1][0]) + Math.abs(c - order[i - 1][1]) === 1);
  const D = 50;
  const NR = 15;
  const p = (r: number, c: number): Pt => ({ x: c * D, y: r * D });
  const items: Item[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
        if (r + dr >= N || c + dc >= N) continue;
        const k = visit[r][c];
        const k2 = visit[r + dr][c + dc];
        const onPath = Math.abs(k - k2) === 1;
        const [a, b] = k < k2 ? [p(r, c), p(r + dr, c + dc)] : [p(r + dr, c + dc), p(r, c)];
        items.push(link(`l${r}-${c}-${dr}`, a, b, NR, { tone: onPath ? "accent" : "faint", arrow: onPath }));
      }
  order.forEach(([r, c], i) => items.push(node(`v${r}-${c}`, p(r, c), String(i + 1), i === order.length - 1 ? "strong" : "accent", NR)));
  items.push(note("rd", `deepest call stack: ${deepest} calls for ${N * N} cells`, -NR, (N - 1) * D + NR + 22, { size: 12, weight: 600 }));
  return finish({
    title: "On an all-land grid, recursion goes as deep as the grid is big",
    input: `a ${N} × ${N} grid of land; DFS from (0, 0) trying up, down, left, right`,
    frames: [
      {
        caption: straight
          ? `DFS from the corner never backtracks until the end: down column 0, up column 1, and on, so all ${deepest} calls are on the stack at once. A 1,000 × 1,000 grid would need a million frames, far past Python's default limit of 1,000.`
          : `The deepest chain of calls holds ${deepest} of the ${N * N} cells at once.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "dive-vs-ripple": diveVsRipple,
  "explicit-stack": explicitStack,
  "entry-exit": entryExit,
  islands,
  "three-colours": threeColours,
  "deep-snake": deepSnake,
};
