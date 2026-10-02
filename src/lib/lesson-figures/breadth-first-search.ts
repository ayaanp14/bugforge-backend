import { and, finish, link, note, rowLabel, slotX, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, region, type Pt } from "./kit.js";

/**
 * Breadth-First Search (BFS): the lesson's figures (content/roadmap/
 * breadth-first-search.md places each with "@figure <name>"). The rings a
 * search spreads in and why no edge skips one, the weighted graph where BFS
 * is wrong, why a vertex is marked when it is added, the path read back
 * from parent links, a maze searched as a wave, and many sources at once.
 * Every generator runs BFS on its example and records what it did.
 */

/** The lesson's graph: A–B, A–C, B–D, C–D, C–E, D–F, E–F, F–G. */
const NAMES = ["A", "B", "C", "D", "E", "F", "G"];
const EDGES: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6]];
const ADJ = NAMES.map((_, i) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort((a, b) => a - b));
const R = 18;

/** BFS from `start` over ADJ: distances, parents and the order vertices leave the queue. */
function bfs(start = 0): { dist: number[]; parent: number[]; order: number[] } {
  const dist = NAMES.map(() => -1);
  const parent = NAMES.map(() => -1);
  const order: number[] = [];
  const queue = [start];
  dist[start] = 0;
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    order.push(u);
    for (const v of ADJ[u]) if (dist[v] === -1) (dist[v] = dist[u] + 1, (parent[v] = u), queue.push(v));
  }
  return { dist, parent, order };
}

const node = (id: string, p: Pt, text: string, tone: Tone = "plain", r = R): Item => ({ k: "node", id, x: p.x, y: p.y, r, text, tone });

/** Each vertex placed in the column of its ring, the ring's members spread evenly down it. */
function ringLayout(dist: readonly number[], dx: number, dy: number): Pt[] {
  const pos: Pt[] = [];
  const rings = Math.max(...dist) + 1;
  for (let k = 0; k < rings; k++) {
    const members = dist.map((d, i) => (d === k ? i : -1)).filter((i) => i >= 0);
    members.forEach((v, j) => (pos[v] = { x: k * dx, y: (j - (members.length - 1) / 2) * dy }));
  }
  return pos;
}

/* ── The rings, and why no edge skips one ─────────────────────────── */

function rings(): Walkthrough {
  const { dist, order } = bfs();
  const far = Math.max(...dist);
  const DX = 100;
  const pos = ringLayout(dist, DX, 84);
  const frames: Frame[] = [];

  const draw = (k: number, final = false): Item[] => {
    const items: Item[] = [];
    for (let ring = 0; ring <= far; ring++) {
      const tone: Tone = final ? "accent" : ring === k ? "accent" : ring < k ? "muted" : "ghost";
      items.push(...region(`b${ring}`, ring * DX - 30, -78, 60, 156, undefined, { tone }));
      items.push(label(`bl${ring}`, `ring ${ring}`, ring * DX, -92, { tone: ring <= k ? "accent" : "faint", size: 11, weight: 600 }));
    }
    EDGES.forEach(([a, b], i) => {
      const seen = dist[a] <= k && dist[b] <= k;
      const discovering = !final && seen && Math.max(dist[a], dist[b]) === k && Math.abs(dist[a] - dist[b]) === 1;
      const tone: LineTone = final ? "accent" : discovering ? "accent" : seen ? "ink" : "line";
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone }));
    });
    NAMES.forEach((nm, i) => items.push(node(`n${i}`, pos[i], nm, final ? "strong" : dist[i] === k ? "accent" : dist[i] < k ? "strong" : "plain")));
    const shown = order.filter((v) => final || dist[v] <= k);
    items.push(note("ord", `reached in order: ${shown.map((v) => NAMES[v]).join(" ")}`, -30, 112, { size: 12 }));
    return items;
  };

  frames.push({ caption: `The search starts at A, ring 0. Like a stone dropped in a pond, it spreads outwards one ring at a time: a vertex's ring is the number of edges from A.`, items: draw(0) });
  for (let k = 1; k <= far; k++) {
    const ring = order.filter((v) => dist[v] === k);
    const prev = (v: number) => ADJ[v].filter((u) => dist[u] === k - 1);
    const twice = ring.filter((v) => prev(v).length > 1);
    let caption = `Ring ${k} is ${and(ring.map((v) => NAMES[v]))}: every vertex not reached yet that is a neighbour of ring ${k - 1}.`;
    if (twice.length) caption += ` ${and(twice.map((v) => NAMES[v]))} ${twice.length > 1 ? "are neighbours" : "is a neighbour"} of both ${and(prev(twice[0]).map((u) => NAMES[u]))}, but joins the ring once.`;
    else if (k === far) caption += ` Nothing lies beyond it, so the search is over.`;
    frames.push({ caption, items: draw(k) });
  }
  const span = EDGES.filter(([a, b]) => Math.abs(dist[a] - dist[b]) <= 1).length;
  frames.push({
    caption: `${span === EDGES.length ? `Every one of the ${span} edges` : `${span} of the ${EDGES.length} edges`} joins a ring to the same ring or the next one; none skips a ring. It cannot: when the nearer end leaves the queue, the farther end is reached at most one ring later. So each vertex is first reached along a fewest-edge route.`,
    items: draw(far, true),
  });
  return finish({ title: "BFS spreads in rings, and no edge skips a ring", input: `edges = ${EDGES.map(([a, b]) => `${NAMES[a]}–${NAMES[b]}`).join(", ")}; start = A`, frames });
}

/* ── Where BFS is wrong: weights ──────────────────────────────────── */

function weightedTrap(): Walkthrough {
  const names = ["A", "B", "C"];
  const edges: Array<[number, number, number]> = [[0, 1, 1], [1, 2, 1], [0, 2, 5]];
  const pos: Pt[] = [{ x: 0, y: 110 }, { x: 150, y: 0 }, { x: 300, y: 110 }];
  const adj = names.map((_, i) => edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort((a, b) => a - b));
  const weight = (a: number, b: number) => edges.find(([x, y]) => (x === a && y === b) || (x === b && y === a))![2];
  // BFS: fewest edges.
  const parent = [-1, -1, -1];
  const seen = [true, false, false];
  const queue = [0];
  for (let h = 0; h < queue.length; h++) for (const v of adj[queue[h]]) if (!seen[v]) (seen[v] = true, (parent[v] = queue[h]), queue.push(v));
  const bfsPath: number[] = [];
  for (let v = 2; v !== -1; v = parent[v]) bfsPath.unshift(v);
  // Cheapest: try every simple path from A to C.
  let best = { cost: Infinity, path: [] as number[] };
  const walk = (u: number, path: number[], cost: number) => {
    if (u === 2) return void (cost < best.cost && (best = { cost, path: [...path] }));
    for (const v of adj[u]) if (!path.includes(v)) walk(v, [...path, v], cost + weight(u, v));
  };
  walk(0, [0], 0);
  const cost = (p: number[]) => p.slice(1).reduce((s, v, i) => s + weight(p[i], v), 0);
  const on = (p: number[], a: number, b: number) => p.some((v, i) => i > 0 && ((p[i - 1] === a && v === b) || (p[i - 1] === b && v === a)));

  const draw = (showBest: boolean, readout: string[]): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b, w], i) => {
      const tone: LineTone = showBest ? (on(best.path, a, b) ? "accent" : on(bfsPath, a, b) ? "error" : "line") : on(bfsPath, a, b) ? "accent" : "line";
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone, label: String(w) }));
    });
    names.forEach((nm, i) => items.push(node(`n${i}`, pos[i], nm, i === 0 ? "strong" : !showBest || best.path.includes(i) ? "accent" : "plain")));
    readout.forEach((t, i) => items.push(note(`r${i}`, t, -18, 160 + i * 20, { size: 12, tone: i === 1 ? "accent" : "ink" })));
    return items;
  };
  const show = (p: number[]) => p.map((v) => names[v]).join(" → ");
  const bfsLine = `BFS: ${show(bfsPath)}, ${bfsPath.length - 1} edge, cost ${cost(bfsPath)}`;
  return finish({
    title: "On a weighted graph, the fewest edges is not the cheapest route",
    input: `A–B weight 1, B–C weight 1, A–C weight 5`,
    frames: [
      {
        caption: `BFS from A puts B and C in the same ring, because each is one edge from A, so it reports ${show(bfsPath)}: ${bfsPath.length - 1} edge, which costs ${cost(bfsPath)}.`,
        items: draw(false, [bfsLine]),
      },
      {
        caption: `The cheapest route is ${show(best.path)}, cost ${best.cost}, with more edges. BFS counts edges and never looks at weights, so with weights you need Dijkstra's algorithm, which takes vertices in order of total cost.`,
        items: draw(true, [bfsLine, `cheapest: ${show(best.path)}, cost ${best.cost}`]),
      },
    ],
  });
}

/* ── Mark on add, not on take ─────────────────────────────────────── */

function markOnAdd(): Walkthrough {
  const { dist } = bfs();
  const pos = ringLayout(dist, 78, 72);
  const QY = [82, 130];
  const S = 32;
  // The two versions, run in step: top marks a vertex when it joins the queue, bottom when it leaves.
  type Run = { queue: number[]; marked: boolean[]; head: number; added: number[]; from: number; dupes: number };
  const runs: Run[] = [0, 1].map(() => ({ queue: [0], marked: NAMES.map((_, i) => i === 0), head: 0, added: [], from: 0, dupes: 0 }));
  runs[1].marked[0] = false;
  const frames: Frame[] = [];

  const draw = (current: number, looked: number[]): Item[] => {
    const items: Item[] = [];
    EDGES.forEach(([a, b], i) => items.push(link(`e${i}`, pos[a], pos[b], R, { tone: current >= 0 && (a === current || b === current) ? "accent" : "line" })));
    NAMES.forEach((nm, i) => items.push(node(`n${i}`, pos[i], nm, i === current ? "strong" : looked.includes(i) ? "accent" : "plain")));
    ["mark when added", "mark when taken"].forEach((t, r) => {
      const run = runs[r];
      items.push(rowLabel(`l${r}`, t, -14, QY[r], S));
      const waiting = run.queue.slice(run.head);
      if (!waiting.length) items.push(note(`qe${r}`, "empty", 0, QY[r] + S / 2, { tone: "faint", size: 12 }));
      const copies = new Map<number, number>();
      waiting.forEach((v, i) => {
        const c = copies.get(v) ?? 0;
        copies.set(v, c + 1);
        // A second copy of a vertex still waiting, or a copy of one already
        // processed, is the waste this figure is about.
        const waste = waiting.indexOf(v) !== i || (r === 1 && run.marked[v]);
        const fresh = run.head + i >= run.from;
        items.push(box(`q${r}-${v}-${c}`, slotX(i, 0, S, 6), QY[r], NAMES[v], { w: S, h: S, size: 13, tone: waste ? "error" : fresh ? "accent" : "plain" }));
      });
      items.push(note(`m${r}`, `marked: ${NAMES.filter((_, i) => run.marked[i]).join(" ") || "none"}`, 5 * (S + 6) + 14, QY[r] + S / 2, { size: 11, tone: "soft" }));
    });
    return items;
  };

  frames.push({
    caption: `Two versions of BFS, run side by side from A. They differ in one thing: whether a vertex is marked as seen when it joins the queue (top) or only when it is taken out (bottom).`,
    items: draw(-1, []),
  });
  for (let step = 0; step < 4; step++) {
    let taken = -1;
    for (const [r, run] of runs.entries()) {
      run.added = [];
      run.from = run.queue.length;
      let u = run.queue[run.head++];
      if (r === 1) {
        // Taking marks it; a stale copy of a vertex already marked is skipped.
        while (run.marked[u]) u = run.queue[run.head++];
        run.marked[u] = true;
      }
      taken = u;
      for (const v of ADJ[u]) {
        if (run.marked[v]) continue;
        if (r === 0) run.marked[v] = true;
        if (r === 1 && run.queue.slice(run.head).includes(v)) run.dupes++;
        run.queue.push(v);
        run.added.push(v);
      }
    }
    const [top, bottom] = runs;
    const nm = (vs: number[]) => and(vs.map((v) => NAMES[v]));
    const extra = bottom.added.filter((v) => !top.added.includes(v));
    let caption: string;
    if (!extra.length) caption = `Take ${NAMES[taken]}: both add ${nm(top.added) || "nothing"}. The top version marks ${top.added.length > 1 ? "them" : "it"} at once; the bottom one waits until ${top.added.length > 1 ? "they come" : "it comes"} out.`;
    else
      caption = `Take ${NAMES[taken]}: the top version sees ${nm(extra)} already marked and adds only ${nm(top.added)}. In the bottom one ${nm(extra)} is still waiting unmarked in the queue, so it goes in a second time.`;
    if (step === 3)
      caption = `Take ${NAMES[taken]}: the bottom queue still holds a stale copy, which must be skipped when it comes out or ${NAMES[taken]}'s neighbours are scanned twice. Every early arrival adds a copy: up to about 2E entries instead of V.`;
    frames.push({ caption, items: draw(taken, top.added) });
  }
  return finish({ title: "Mark a vertex when it joins the queue, not when it leaves", input: `edges = ${EDGES.map(([a, b]) => `${NAMES[a]}–${NAMES[b]}`).join(", ")}; start = A`, frames });
}

/* ── Reading a shortest path back from the parent links ───────────── */

function pathBack(): Walkthrough {
  const { dist, parent } = bfs();
  const pos: Pt[] = [{ x: 40, y: 90 }, { x: 130, y: 30 }, { x: 130, y: 150 }, { x: 220, y: 90 }, { x: 220, y: 210 }, { x: 310, y: 150 }, { x: 400, y: 150 }];
  const target = dist.indexOf(Math.max(...dist));
  // Every shortest path, counted level by level, and one that differs from the parent chain.
  const ways = NAMES.map((_, v) => (v === 0 ? 1 : 0));
  const byDist = NAMES.map((_, i) => i).sort((a, b) => dist[a] - dist[b]);
  for (const v of byDist) for (const u of ADJ[v]) if (dist[u] === dist[v] + 1) ways[u] += ways[v];
  const back: number[] = [];
  for (let v = target; v !== -1; v = parent[v]) back.push(v);
  const other: number[] = [target];
  while (other[0] !== 0) {
    const v = other[0];
    const preds = ADJ[v].filter((u) => dist[u] === dist[v] - 1);
    other.unshift(preds.find((u) => !back.includes(u) || u === 0) ?? preds[0]);
  }
  const frames: Frame[] = [];

  const draw = (walked: number, final = false): Item[] => {
    const items: Item[] = [];
    const onWalk = (v: number) => back.indexOf(v) >= 0 && back.indexOf(v) < walked;
    EDGES.forEach(([a, b], i) => {
      const child = parent[b] === a ? b : parent[a] === b ? a : -1;
      if (child < 0) return items.push(link(`e${i}`, pos[a], pos[b], R, { tone: "faint", dashed: true }));
      const hot = onWalk(child) || (final && back.includes(child) && child !== 0);
      items.push(link(`e${i}`, pos[child], pos[parent[child]], R, { tone: hot ? "accent" : "ink", arrow: true }));
    });
    NAMES.forEach((nm, i) => {
      const tone: Tone = final ? (back.includes(i) ? "strong" : "plain") : i === back[walked] ? "strong" : onWalk(i) ? "accent" : "plain";
      items.push(node(`n${i}`, pos[i], nm, tone));
      items.push(label(`d${i}`, `d=${dist[i]}`, pos[i].x, pos[i].y + R + 11, { tone: "faint", size: 11, mono: true }));
    });
    const trail = back.slice(0, Math.min(walked + 1, back.length)).map((v) => NAMES[v]);
    const text = final ? `path: ${[...back].reverse().map((v) => NAMES[v]).join(" → ")}` : walked < 0 ? `parent: ${NAMES.map((nm, i) => `${nm}=${parent[i] < 0 ? "–" : NAMES[parent[i]]}`).join(" ")}` : `walked back: ${trail.join(" ← ")}`;
    items.push(note("trail", text, 20, 262, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `During the search each vertex records the parent it was discovered from, one step nearer A. Drawn as arrows, the parent links form the BFS tree; the dashed edges were never used to discover anything.`,
    items: draw(-1),
  });
  for (let i = 0; i < back.length - 1; i++) {
    const v = back[i];
    frames.push({
      caption:
        i === 0
          ? `To find a shortest path to ${NAMES[v]}, start at ${NAMES[v]} and follow its parent link to ${NAMES[parent[v]]}, one ring nearer A.`
          : parent[v] === 0
            ? `${NAMES[v]}'s parent is A, the start, which has no parent of its own: the walk is over after ${dist[target]} links.`
            : i === 1
              ? `${NAMES[v]}'s parent is ${NAMES[parent[v]]}, at distance ${dist[parent[v]]}. Each link drops exactly one ring, so the walk takes exactly ${dist[target]} steps.`
              : `${NAMES[v]}'s parent is ${NAMES[parent[v]]}. The chain only ever moves nearer to A, so it can never loop.`,
      items: draw(i + 1),
    });
  }
  frames.push({
    caption: `The walk reaches A, so the path read backwards and reversed is ${[...back].reverse().map((v) => NAMES[v]).join(" → ")}: ${dist[target]} edges, matching dist[${NAMES[target]}]. ${other.map((v) => NAMES[v]).join(" → ")} is just as short (${ways[target]} shortest paths in all); BFS returns the one its neighbour order found first.`,
    items: draw(back.length, true),
  });
  return finish({ title: "Recovering a shortest path from the parent links", input: `BFS from A on the lesson's graph; target = ${NAMES[target]}`, frames });
}

/* ── A maze, searched as a wave ───────────────────────────────────── */

function maze(): Walkthrough {
  const grid = ["S.#.....", ".##.###.", "....#...", ".##...#.", "...#.#.E"];
  const rows = grid.length;
  const cols = grid[0].length;
  const find = (ch: string) => {
    const r = grid.findIndex((row) => row.includes(ch));
    return [r, grid[r].indexOf(ch)] as const;
  };
  const [sr, sc] = find("S");
  const [er, ec] = find("E");
  const DR = [-1, 1, 0, 0];
  const DC = [0, 0, -1, 1];
  const search = (r0: number, c0: number, stopAt?: readonly [number, number]) => {
    const dist = grid.map((row) => [...row].map(() => -1));
    const parent = grid.map((row) => [...row].map(() => -1));
    const queue: Array<[number, number]> = [[r0, c0]];
    dist[r0][c0] = 0;
    for (let h = 0; h < queue.length; h++) {
      const [r, c] = queue[h];
      if (stopAt && r === stopAt[0] && c === stopAt[1]) break;
      for (let d = 0; d < 4; d++) {
        const nr = r + DR[d];
        const nc = c + DC[d];
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] === "#" || dist[nr][nc] !== -1) continue;
        dist[nr][nc] = dist[r][c] + 1;
        parent[nr][nc] = r * cols + c;
        queue.push([nr, nc]);
      }
    }
    return { dist, parent };
  };
  const { dist, parent } = search(sr, sc, [er, ec]);
  const goal = dist[er][ec];
  // The other way round: a route forced along the top row, to say how much longer it is.
  const fromE = search(er, ec).dist;
  const full = search(sr, sc).dist;
  const topRow = [...grid[0]].map((_, c) => c).filter((c) => grid[0][c] !== "#" && c > grid[0].indexOf("#"));
  const viaTop = Math.min(...topRow.map((c) => full[0][c] + fromE[0][c]));
  const route = new Set<number>();
  for (let at = parent[er][ec]; at !== sr * cols + sc; at = parent[Math.floor(at / cols)][at % cols]) route.add(at);

  const S = 34;
  const G = 4;
  const at = (r: number, c: number) => ({ x: c * (S + G), y: r * (S + G) });
  const frontier = (k: number) => {
    const out: string[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dist[r][c] === k) out.push(`(${r}, ${c})`);
    return out;
  };
  const draw = (k: number, showRoute = false): Item[] => {
    const items: Item[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const p = at(r, c);
        const wall = grid[r][c] === "#";
        const d = dist[r][c];
        const reached = d >= 0 && d <= k;
        const isS = r === sr && c === sc;
        const isE = r === er && c === ec;
        const text = wall ? "#" : isS ? "S" : reached ? String(d) : isE ? "E" : "";
        let tone: Tone = wall ? "muted" : "plain";
        if (!wall && reached) tone = showRoute ? (route.has(r * cols + c) || isS || isE ? "strong" : "plain") : d === k ? "accent" : "plain";
        if (isE && reached && !showRoute) tone = "strong";
        items.push(box(`c${r}-${c}`, p.x, p.y, text, { w: S, h: S, size: 12, tone }));
      }
    const q = frontier(k).length;
    items.push(note("rd", showRoute ? `shortest path: ${goal} steps` : `queue: the ${q} cell${q === 1 ? "" : "s"} at distance ${k}`, 0, rows * (S + G) + 14, { size: 12, weight: 600 }));
    return items;
  };

  const frames: Frame[] = [];
  frames.push({ caption: `S is distance 0 and the only cell in the queue. Walls never enter it, so the search can only flow through open cells, one step in four directions at a time.`, items: draw(0) });
  const stops = [3, 6, 9, 11, goal - 1];
  const cellsAt = (k: number) => {
    const out: Array<[number, number]> = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dist[r][c] === k) out.push([r, c]);
    return out;
  };
  const ancestorAt = (r: number, c: number, k: number): number => {
    let at = r * cols + c;
    while (dist[Math.floor(at / cols)][at % cols] > k) at = parent[Math.floor(at / cols)][at % cols];
    return at;
  };
  const name = (at: number) => `(${Math.floor(at / cols)}, ${at % cols})`;
  let lo = 1;
  for (const [i, k] of stops.entries()) {
    const fr = frontier(k);
    let caption: string;
    if (i === 0) caption = `Distances ${lo} to ${k}: every open cell within ${k} steps is numbered, each when it is first reached, and the number never changes. The queue always holds the frontier, the cells numbered last.`;
    else if (k === goal - 1) caption = `Distance ${k}: the fronts are at ${and(fr)}, and one of them is beside E. Every cell ${k} steps away is reached before any cell ${k + 1} steps away.`;
    else {
      // Which earlier fronts died out in a dead end, and how far each live one is from E.
      const before = cellsAt(lo - 1).map(([r, c]) => r * cols + c);
      const live = new Set(cellsAt(k).map(([r, c]) => ancestorAt(r, c, lo - 1)));
      const dead = before.filter((at) => !live.has(at));
      const toE = cellsAt(k).sort(([r1, c1], [r2, c2]) => fromE[r2][c2] - fromE[r1][c1]).map(([r, c], j) => (j === 0 ? `(${r}, ${c}) is ${fromE[r][c]} steps from E` : `(${r}, ${c}) only ${fromE[r][c]}`));
      const words = ["No", "One", "Two", "Three", "Four"];
      if (dead.length) caption = `Distances ${lo} to ${k}: the front from ${and(dead.map(name))} ran into a dead end and stopped; the queue simply has nothing more from it. ${fr.length === 1 ? "One front is" : `${words[fr.length] ?? fr.length} fronts are`} still moving, at ${and(fr)}.`;
      else if (fr.length > 1 && i === 1) caption = `Distances ${lo} to ${k}: the wave has split around the walls and moves on ${fr.length} fronts at once, ${and(fr)}. The queue takes them in turn, so no front gets ahead.`;
      else caption = `Distances ${lo} to ${k}: both fronts have reached the right-hand column. ${toE.join(", ")}, so the lower front will arrive first.`;
    }
    frames.push({ caption, items: draw(k) });
    lo = k + 1;
  }
  frames.push({
    caption: `E is numbered ${goal}. The route along the top row would have taken ${viaTop} steps, but BFS reaches every cell at distance ${goal} before any at ${goal + 1}, so the first number E gets is the shortest. The search stops here.`,
    items: draw(goal),
  });
  frames.push({ caption: `Following the parent links back from E, one cell nearer S each time, marks the route: ${goal} steps. Each open cell entered the queue at most once, so the whole search was O(rows × columns).`, items: draw(goal, true) });
  return finish({ title: "BFS through a maze: the wave reaches the exit by the shortest route", input: `maze = ${grid.map((r) => `"${r}"`).join(", ")}`, frames });
}

/* ── Many sources at once: rotting oranges ────────────────────────── */

function rotting(): Walkthrough {
  const start = [
    [2, 1, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 1, 2],
  ];
  const grid = start.map((r) => [...r]);
  const rows = grid.length;
  const cols = grid[0].length;
  const when: number[][] = grid.map((r) => r.map((v) => (v === 2 ? 0 : -1)));
  let queue: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === 2) queue.push([r, c]);
  const sources = queue.map(([r, c]) => `(${r}, ${c})`);
  let fresh = grid.flat().filter((v) => v === 1).length;
  const S = 44;
  const G = 5;
  const frames: Frame[] = [];

  const draw = (minute: number): Item[] => {
    const items: Item[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = grid[r][c];
        const tone: Tone = v === 0 ? "muted" : v === 1 ? "plain" : when[r][c] === minute ? "accent" : "strong";
        items.push(box(`o${r}-${c}`, c * (S + G), r * (S + G), v, { w: S, h: S, size: 14, tone }));
      }
    items.push(note("rd", `minute ${minute} · fresh left: ${fresh} · queue: ${queue.length}`, 0, rows * (S + G) + 14, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `2 is rotten, 1 fresh, 0 empty. Both rotten oranges, ${and(sources)}, go into the queue before the loop starts, all at minute 0, so the rot spreads from both at once; ${fresh} oranges are fresh.`,
    items: draw(0),
  });
  let minute = 0;
  while (queue.length && fresh > 0) {
    const level = queue.length;
    const next: Array<[number, number]> = [];
    for (const [r, c] of queue)
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2;
        when[nr][nc] = minute + 1;
        fresh--;
        next.push([nr, nc]);
      }
    minute++;
    queue = next;
    const cells = and(next.map(([r, c]) => `(${r}, ${c})`));
    let caption = `Minute ${minute}: the queue held ${level} rotten orange${level === 1 ? "" : "s"}, so exactly ${level} ${level === 1 ? "is" : "are"} taken — one whole level. Their fresh neighbours ${cells} rot and join the queue for the next minute.`;
    if (minute === 1) caption = `Minute 1: the queue held ${level} cells, and taking exactly that many is one whole level. Their fresh neighbours, ${cells}, rot together and wait in the queue for minute 2.`;
    if (fresh === 0) caption = `Minute ${minute}: ${cells} ${next.length === 1 ? "rots" : "rot"} and no fresh orange is left, so the answer is ${minute}. An orange walled off by empty cells would still be fresh when the queue ran dry, and the answer would be −1.`;
    frames.push({ caption, items: draw(minute) });
  }
  return finish({ title: "Multi-source BFS: every rotten orange spreads at the same time", input: `grid = [${start.map((r) => `[${r.join(",")}]`).join(", ")}]`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  rings,
  "weighted-trap": weightedTrap,
  "mark-on-add": markOnAdd,
  "path-back": pathBack,
  maze,
  rotting,
};
