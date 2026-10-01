import { and, finish, link, note, over, row, rowLabel, show, slotMid, slotX, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "./core.js";

/**
 * Walkthroughs for the graph, grid and dynamic-programming hubs. Same rule
 * as reference.ts: every generator runs the real algorithm on its example
 * and records a frame at each step it takes, so every number on screen and
 * in a caption is one the code computed.
 */

type Pt = { x: number; y: number };

/** Node radius for every graph and tree here. */
const R = 17;

const circle = (id: string, p: Pt, text: string, tone: Tone = "plain", r = R): Item => ({ k: "node", id, x: p.x, y: p.y, r, text, tone });
const box = (id: string, x: number, y: number, w: number, h: number, text: string, tone: Tone = "plain", size?: number): Item =>
  size ? { k: "cell", id, x, y, w, h, text, tone, size } : { k: "cell", id, x, y, w, h, text, tone };
const ordinal = (k: number) => `${k}${k % 10 === 1 && k % 100 !== 11 ? "st" : k % 10 === 2 && k % 100 !== 12 ? "nd" : k % 10 === 3 && k % 100 !== 13 ? "rd" : "th"}`;
const isAre = (n: number) => (n === 1 ? "is" : "are");

/** A shortest path a → b over undirected adjacency lists, as node indices (empty when unreachable). */
function pathBetween(adj: ReadonlyArray<readonly number[]>, a: number, b: number): number[] {
  const prev = new Map<number, number>([[a, -1]]);
  const queue = [a];
  while (queue.length) {
    const u = queue.shift() as number;
    if (u === b) break;
    for (const v of adj[u]) if (!prev.has(v)) (prev.set(v, u), queue.push(v));
  }
  if (!prev.has(b)) return [];
  const out: number[] = [];
  for (let at = b; at !== -1; at = prev.get(at) as number) out.unshift(at);
  return out;
}

/* ── graph: an adjacency list from an edge list ───────────────────── */

export function adjacencyList(): Walkthrough {
  const n = 5;
  const edges: Array<[number, number]> = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];
  const pos: Pt[] = [{ x: 0, y: 64 }, { x: 96, y: 0 }, { x: 96, y: 128 }, { x: 210, y: 0 }, { x: 210, y: 128 }];
  const EY = -88;
  const EW = 40;
  const EH = 30;
  const AX = 318;
  const AS = 28;
  const ay = (i: number) => -14 + i * 36;
  const adj: number[][] = Array.from({ length: n }, () => []);
  const frames: Frame[] = [];

  const draw = (k: number, o: { fresh?: boolean; ask?: number } = {}): Item[] => {
    const cur = o.fresh ? edges[k - 1] : undefined;
    const ask = o.ask;
    const items: Item[] = [rowLabel("el", "edges", -12, EY, EH)];
    edges.forEach(([a, b], i) => items.push(box(`ec${i}`, slotX(i, 0, EW, 6), EY, EW, EH, `${a}–${b}`, cur && i === k - 1 ? "accent" : i < k ? "muted" : "plain", 12)));
    edges.slice(0, k).forEach(([a, b], i) => {
      const hot = (cur && i === k - 1) || (ask !== undefined && (a === ask || b === ask));
      items.push(link(`ge${i}`, pos[a], pos[b], R, { tone: hot ? "accent" : "line" }));
    });
    pos.forEach((p, i) => {
      const tone: Tone = ask === i ? "strong" : (ask !== undefined && adj[ask].includes(i)) || cur?.includes(i) ? "accent" : "plain";
      items.push(circle(`n${i}`, p, String(i), tone));
    });
    adj.forEach((list, i) => {
      items.push(rowLabel(`al${i}`, `adj[${i}]`, AX - 8, ay(i), AS));
      if (!list.length) items.push(note(`a${i}e`, "[ ]", AX + 2, ay(i) + AS / 2, { tone: "faint", size: 12 }));
      list.forEach((v, j) => {
        const fresh = cur && ((cur[0] === i && cur[1] === v) || (cur[1] === i && cur[0] === v));
        items.push(box(`a${i}_${v}`, slotX(j, AX, AS, 6), ay(i), AS, AS, String(v), ask === i ? "strong" : fresh ? "accent" : "plain", 12));
      });
    });
    const stored = adj.reduce((s, l) => s + l.length, 0);
    if (ask === undefined) items.push(note("rd", `entries stored: ${stored}${k ? ` (2 × ${k} edges)` : ""}`, 0, 186, { tone: "soft", size: 12 }));
    else {
      items.push(note("rd", `degree: ${adj.map((l, i) => `${i}→${l.length}`).join("  ")}`, 0, 186, { tone: "soft", size: 12 }));
      items.push(note("ask", `neighbours(${ask}) = adj[${ask}] = ${show(adj[ask])}`, 0, 208, { weight: 600 }));
    }
    return items;
  };

  frames.push({
    caption: `An edge list names the joined pairs, but finding one node's neighbours would mean scanning all ${edges.length} edges. An adjacency list gives each of the ${n} nodes its own list instead, filled in a single pass over the edges.`,
    items: draw(0),
  });
  // Each kind of reason is given in full once; a second edge of the same kind gets the short form.
  let cycles = 0;
  let firsts = 0;
  let plain = 0;
  edges.forEach(([a, b], i) => {
    const route = pathBetween(adj, a, b);
    const fresh = [a, b].filter((x) => adj[x].length === 0);
    adj[a].push(b);
    adj[b].push(a);
    const head = `Read edge ${a}–${b}: append ${b} to adj[${a}], now ${show(adj[a])}, and ${a} to adj[${b}], now ${show(adj[b])}.`;
    const busiest = [a, b].reduce((x, y) => (adj[y].length > adj[x].length ? y : x));
    let why: string;
    if (i === 0) why = ` The graph is undirected, so every edge is written twice, once from each end.`;
    else if (route.length)
      why = cycles++ === 0 ? ` ${a} and ${b} were already linked through ${route.join("–")}, so this edge closes a cycle; the lists still only record direct neighbours.` : ` This closes a second cycle, ${[...route, a].join("–")}, and is stored exactly like any other edge.`;
    else if (fresh.length && firsts++ === 0) why = ` ${and(fresh.map(String))} had no neighbours until now; appending to the end of a list is O(1), however long it is.`;
    else
      why =
        plain++ === 0
          ? ` A list's length is its node's degree: ${busiest} now has ${adj[busiest].length} neighbours${fresh.length ? `, while ${and(fresh.map(String))} gets its first` : ""}.`
          : ` Only the two lists the edge names are touched, which is why the whole pass costs O(V + E).`;
    frames.push({ caption: head + why, items: draw(i + 1, { fresh: true }) });
  });
  const ask = adj.reduce((best, l, i) => (l.length > adj[best].length ? i : best), 0);
  const total = adj.reduce((s, l) => s + l.length, 0);
  frames.push({
    caption: `All ${edges.length} edges are in, each stored twice, so the lists hold ${total} entries: the degrees add up to 2E. Building took O(V + E), and now ${ask}'s neighbours are one lookup, adj[${ask}] = ${show(adj[ask])}, in O(degree) instead of an O(E) scan.`,
    items: draw(edges.length, { ask }),
  });
  return finish({ title: "Building an adjacency list from an edge list, one edge at a time", input: `n = ${n}, edges = ${show(edges.map(([a, b]) => `[${a},${b}]`))}`, frames });
}

/* ── depth-first-search: recursion as an explicit stack ────────────── */

export function depthFirstSearch(): Walkthrough {
  const names = ["A", "B", "C", "D", "E", "F"];
  const N = (i: number) => names[i];
  const edges: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 4]];
  const pos: Pt[] = [{ x: 120, y: 0 }, { x: 60, y: 84 }, { x: 190, y: 84 }, { x: 20, y: 168 }, { x: 110, y: 168 }, { x: 190, y: 168 }];
  // Where each node's discovery number sits: on the side its edges leave free.
  const tag: Array<[number, number, "start" | "middle" | "end"]> = [[0, -R - 11, "middle"], [-R - 6, 0, "end"], [R + 6, 0, "start"], [0, R + 11, "middle"], [0, R + 11, "middle"], [0, R + 11, "middle"]];
  const adj = names.map((_, i) => edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort((a, b) => a - b));
  const edgeOf = (a: number, b: number) => edges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const disc = names.map(() => 0);
  const parent = names.map(() => -1);
  const done = names.map(() => false);
  const stack: number[] = [];
  const back = new Set<number>();
  let clock = 0;
  const frames: Frame[] = [];
  const SX = 296;
  const SW = 72;
  const SH = 28;
  const SB = 168;

  const draw = (final = false): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b], i) => {
      const tree = parent[b] === a || parent[a] === b;
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone: tree ? "accent" : back.has(i) ? "ink" : "line", dashed: back.has(i) }));
    });
    const top = stack[stack.length - 1];
    names.forEach((nm, i) => {
      const tone: Tone = final ? "strong" : i === top ? "strong" : stack.includes(i) ? "accent" : done[i] ? "muted" : "plain";
      items.push(circle(`n${i}`, pos[i], nm, tone));
      if (disc[i]) items.push(note(`t${i}`, `#${disc[i]}`, pos[i].x + tag[i][0], pos[i].y + tag[i][1], { anchor: tag[i][2], tone: "accent", size: 11 }));
    });
    stack.forEach((u, k) => items.push(box(`s${u}`, SX, SB - k * (SH + 6), SW, SH, `dfs(${N(u)})`, u === top ? "strong" : "accent", 12)));
    if (stack.length) items.push(note("top", "← top", SX + SW + 6, SB - (stack.length - 1) * (SH + 6) + SH / 2, { tone: "faint", size: 10 }));
    else items.push(note("empty", "empty", SX + 8, SB + SH / 2, { tone: "faint", size: 12 }));
    items.push(note("sl", "call stack", SX + SW / 2, SB + SH + 14, { anchor: "middle", tone: "soft", size: 11, mono: false }));
    const order = names.map((_, i) => i).filter((i) => disc[i]).sort((a, b) => disc[a] - disc[b]);
    items.push(note("ord", `discovery order: ${order.map(N).join(" ")}`, 0, 232, { weight: final ? 600 : undefined }));
    return items;
  };

  // What the node on top has found already discovered since the last frame, and whether that frame was a return.
  let seen: number[] = [];
  let backtracked = false;
  let toldPath = false;
  const visit = (u: number, from: number) => {
    disc[u] = ++clock;
    parent[u] = from;
    stack.push(u);
    let caption: string;
    if (from < 0) caption = `Depth-first search follows one path as deep as it goes before trying another. dfs(${N(u)}) is called: ${N(u)} is discovered 1st and pushed on the call stack.`;
    else {
      const lead = backtracked ? `Back in dfs(${N(from)}), ` : `In dfs(${N(from)}), `;
      const skipped = seen.length ? `${and(seen.map(N))} ${isAre(seen.length)} already discovered, but ` : "";
      const why =
        clock === names.length
          ? ` That is every node found, but the open calls still have to return.`
          : stack.length === 2 && !backtracked
            ? ` ${N(from)}'s other neighbours wait until ${N(u)}'s whole branch is finished.`
            : backtracked
              ? ` The search goes deep again from here.`
              : !toldPath
                ? ` The stack always holds the path from ${N(stack[0])} down to the node being explored.`
                : ` The path is now ${stack.map(N).join(" → ")}.`;
      if (!backtracked && stack.length > 2) toldPath = true;
      caption = `${lead}${skipped}${N(u)} is unvisited, so dfs(${N(u)}) is pushed on top and ${N(u)} is discovered ${ordinal(disc[u])}.${why}`;
    }
    frames.push({ caption, items: draw() });
    seen = [];
    backtracked = false;
    for (const v of adj[u]) {
      if (v === from) continue;
      if (disc[v]) {
        if (stack.includes(v)) back.add(edgeOf(u, v));
        seen.push(v);
        continue;
      }
      visit(v, u);
    }
    const ancestors = seen.filter((v) => stack.includes(v));
    const finished = seen.filter((v) => !stack.includes(v));
    stack.pop();
    done[u] = true;
    if (from < 0) {
      const order = names.map((_, i) => i).sort((a, b) => disc[a] - disc[b]);
      frames.push({
        caption: `dfs(${N(u)}) returns and the stack is empty. Discovery order: ${order.map(N).join(", ")}; the teal edges are the calls made, the dashed one the back edge. Each node and edge is handled once: O(V + E).`,
        items: draw(true),
      });
      return;
    }
    let back1: string;
    if (adj[u].length === 1) back1 = `${N(u)}'s only neighbour is ${N(from)}, its caller, so dfs(${N(u)}) returns at once and the search backtracks to ${N(from)}.`;
    else {
      const parts: string[] = [];
      for (const v of ancestors) parts.push(`${N(u)}–${N(v)} leads back to ${N(v)}, still on the stack: a back edge, which means the graph has a cycle, so it is not followed.`);
      const fin = finished.length ? `${and(finished.map((v) => `${N(v)}`))} ${isAre(finished.length)} already finished (reached through ${and(finished.map((v) => N(parent[v])))}), so ` : "";
      const lead = backtracked ? `Back in dfs(${N(u)}), ` : "";
      const rest = `nothing unvisited is left${lead || fin ? "" : ` around ${N(u)}`}: dfs(${N(u)}) is popped and the search backtracks to ${N(from)}.`;
      const tail = `${lead}${fin}${rest}`;
      parts.push(tail[0].toUpperCase() + tail.slice(1));
      back1 = parts.join(" ");
    }
    frames.push({ caption: back1, items: draw() });
    seen = [];
    backtracked = true;
  };
  visit(0, -1);
  return finish({ title: "Depth-first search from A, with the call stack drawn out", input: `edges = ${edges.map(([a, b]) => `${N(a)}–${N(b)}`).join(", ")}; start = A`, frames });
}

/* ── topological-sort: Kahn's algorithm on course prerequisites ────── */

export function topologicalSort(): Walkthrough {
  const n = 6;
  const prereq: Array<[number, number]> = [[2, 5], [0, 5], [0, 4], [1, 4], [3, 2], [1, 3]];
  // [a, b] means b must be taken before a, so the arrow runs b → a.
  const edges = prereq.map(([a, b]) => [b, a] as [number, number]);
  const pos: Pt[] = [];
  pos[5] = { x: 0, y: 30 };
  pos[4] = { x: 0, y: 156 };
  pos[2] = { x: 124, y: 0 };
  pos[0] = { x: 124, y: 92 };
  pos[3] = { x: 248, y: 30 };
  pos[1] = { x: 372, y: 112 };
  const indeg = Array.from({ length: n }, (_, v) => edges.filter(([, a]) => a === v).length);
  const used = new Set<number>();
  const order: number[] = [];
  let queue = indeg.map((d, v) => (d === 0 ? v : -1)).filter((v) => v >= 0);
  const QY = 214;
  const OY = 262;
  const frames: Frame[] = [];

  const draw = (o: { taken?: number; crossed?: number[]; changed?: number[]; fresh?: number[]; final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    edges.forEach(([b, a], i) => {
      const tone: LineTone = o.crossed?.includes(i) ? "accent" : used.has(i) ? "faint" : "line";
      items.push(link(`e${i}`, pos[b], pos[a], R, { tone, arrow: true, dashed: used.has(i) && !o.crossed?.includes(i) }));
    });
    for (let v = 0; v < n; v++) {
      const tone: Tone = o.final ? "strong" : v === o.taken ? "strong" : o.fresh?.includes(v) || queue.includes(v) ? "accent" : order.includes(v) ? "muted" : "plain";
      items.push(circle(`n${v}`, pos[v], String(v), tone));
      items.push(note(`in${v}`, `in=${indeg[v]}`, pos[v].x, pos[v].y + R + 11, { anchor: "middle", size: 11, tone: o.changed?.includes(v) ? "accent" : indeg[v] === 0 ? "faint" : "soft" }));
    }
    items.push(rowLabel("ql", "queue", -12, QY));
    if (!queue.length) items.push(note("qe", "empty", 0, QY + 20, { tone: "faint", size: 12 }));
    queue.forEach((v, i) => items.push(box(`t${v}`, slotX(i), QY, 40, 40, String(v), o.fresh?.includes(v) ? "accent" : "plain")));
    items.push(rowLabel("ol", "order", -12, OY));
    if (!order.length) items.push(note("oe", "—", 0, OY + 20, { tone: "faint", size: 12 }));
    order.forEach((v, i) => items.push(box(`t${v}`, slotX(i), OY, 40, 40, String(v), o.final ? "strong" : v === o.taken ? "accent" : "plain")));
    return items;
  };

  frames.push({
    caption: `An arrow b → a means course b must be taken before a, so a course's in-degree counts its unmet prerequisites. Courses ${and(queue.map(String))} have in-degree 0 and can be taken now, so they start the queue.`,
    items: draw({ fresh: queue }),
  });
  let announced = false;
  while (queue.length) {
    const [u, ...rest] = queue;
    queue = rest;
    order.push(u);
    const crossed: number[] = [];
    const changed: number[] = [];
    const fresh: number[] = [];
    edges.forEach(([b, a], i) => {
      if (b !== u) return;
      crossed.push(i);
      changed.push(a);
      if (--indeg[a] === 0) fresh.push(a);
    });
    queue.push(...fresh);
    const drops = changed.map((v, i) => `${v}'s${i === 0 ? " in-degree" : ""} to ${indeg[v]}`);
    let caption = `Take ${u} off the queue and append it to the order. `;
    if (!crossed.length) caption += `No course lists ${u} as a prerequisite, so no in-degree changes${queue.length ? `; ${queue[0]} is next` : ""}.`;
    else {
      caption += `Crossing off its arrows lowers ${and(drops)}; `;
      caption += fresh.length ? `${and(fresh.map(String))} reach${fresh.length === 1 ? "es" : ""} 0 and join${fresh.length === 1 ? "s" : ""} the queue.` : `none reaches 0 yet, so nothing joins the queue.`;
      if (fresh.length && !announced) {
        caption += ` A course is queued the moment its last prerequisite is placed, never earlier.`;
        announced = true;
      }
    }
    crossed.forEach((i) => used.add(i));
    frames.push({ caption, items: draw({ taken: u, crossed, changed, fresh }) });
  }
  frames.push({
    caption: `The order ${order.join(", ")} puts every course after all its prerequisites. All ${n} courses came out, which also proves there is no cycle: a course on a cycle never reaches in-degree 0. Each course and arrow is handled once, O(V + E).`,
    items: draw({ final: true }),
  });
  return finish({ title: "Ordering courses after their prerequisites, with Kahn's topological sort", input: `numCourses = ${n}, prerequisites = ${show(prereq.map(([a, b]) => `[${a},${b}]`))}`, frames });
}

/* ── shortest-path: Dijkstra ───────────────────────────────────────── */

export function dijkstra(): Walkthrough {
  const names = ["A", "B", "C", "D", "E", "F"];
  const N = (i: number) => names[i];
  const pos: Pt[] = [{ x: 0, y: 100 }, { x: 130, y: 16 }, { x: 130, y: 184 }, { x: 270, y: 16 }, { x: 270, y: 184 }, { x: 390, y: 100 }];
  // Distance readouts on each node's free side: A left, the top row above, the bottom row below, F right.
  const tag: Array<[number, number, "start" | "middle" | "end"]> = [[-R - 6, 0, "end"], [0, -R - 11, "middle"], [0, R + 11, "middle"], [0, -R - 11, "middle"], [0, R + 11, "middle"], [R + 6, 0, "start"]];
  const edges: Array<[number, number, number]> = [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 3], [4, 5, 2]];
  const dist = names.map(() => Infinity);
  const via = names.map(() => -1);
  const settled: number[] = [];
  dist[0] = 0;
  const frames: Frame[] = [];
  const fmt = (d: number) => (d === Infinity ? "∞" : String(d));

  const draw = (o: { cur?: number; better?: number[]; worse?: number[]; improved?: number[]; path?: number[] } = {}): Item[] => {
    const items: Item[] = [];
    const onPath = (a: number, b: number) => !!o.path && o.path.some((v, i) => i > 0 && o.path?.[i - 1] === a && v === b);
    edges.forEach(([a, b, w], i) => {
      const tone: LineTone = o.path ? (onPath(a, b) ? "accent" : "faint") : o.better?.includes(i) ? "accent" : o.worse?.includes(i) ? "error" : "line";
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone, arrow: true, label: String(w) }));
    });
    names.forEach((nm, i) => {
      const tone: Tone = o.path ? (o.path.includes(i) ? "strong" : "muted") : i === o.cur ? "strong" : settled.includes(i) ? "muted" : o.improved?.includes(i) ? "accent" : "plain";
      items.push(circle(`n${i}`, pos[i], nm, tone));
      items.push(note(`d${i}`, `d=${fmt(dist[i])}`, pos[i].x + tag[i][0], pos[i].y + tag[i][1], { anchor: tag[i][2], size: 11, tone: o.improved?.includes(i) ? "accent" : settled.includes(i) ? "ink" : "soft" }));
    });
    items.push(note("set", `settled: ${settled.length ? settled.map((v) => `${N(v)}=${dist[v]}`).join("  ") : "none"}`, 0, 246, { size: 12 }));
    const open = names.map((_, i) => i).filter((i) => !settled.includes(i));
    items.push(note("open", open.length ? `unsettled: ${open.map((v) => `${N(v)}=${fmt(dist[v])}`).join("  ")}` : "unsettled: none", 0, 266, { size: 12, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `Each node carries a tentative distance from A: 0 for A itself, ∞ for the rest. Every step settles the unsettled node with the smallest one; with no negative weights, no path found later can undercut it.`,
    items: draw({ improved: [0] }),
  });
  let explainedDrop = false;
  while (settled.length < names.length) {
    const open = names.map((_, i) => i).filter((i) => !settled.includes(i) && dist[i] < Infinity);
    if (!open.length) break;
    const u = open.reduce((b, i) => (dist[i] < dist[b] ? i : b));
    const rivals = open.filter((i) => i !== u);
    const pick = rivals.length ? `the smallest unsettled distance (${open.map((i) => `${N(i)} ${dist[i]}`).join(", ")})` : settled.length === names.length - 1 ? "the last node left" : "the only finite distance left";
    settled.push(u);
    const better: number[] = [];
    const worse: number[] = [];
    const improved: number[] = [];
    const parts: string[] = [];
    let dropped = false;
    edges.forEach(([a, b, w], i) => {
      if (a !== u || settled.includes(b)) return;
      const nd = dist[u] + w;
      if (nd < dist[b]) {
        parts.push(dist[b] === Infinity ? `${N(b)} gets ${dist[u]} + ${w} = ${nd}` : `${N(b)} drops from ${dist[b]} to ${dist[u]} + ${w} = ${nd}`);
        if (dist[b] !== Infinity) dropped = true;
        dist[b] = nd;
        via[b] = u;
        better.push(i);
        improved.push(b);
      } else {
        parts.push(`${N(b)} would get ${dist[u]} + ${w} = ${nd}, no better than ${dist[b]}, so it keeps ${dist[b]}`);
        worse.push(i);
      }
    });
    let caption = `Settle ${N(u)} at ${dist[u]}, ${pick}. `;
    if (!parts.length) caption += `It has no edges to unsettled nodes, so nothing is relaxed${settled.length === names.length ? ", and every node is now settled" : ""}.`;
    else caption += `Relaxing its edges: ${parts.join("; ")}.`;
    if (dropped && !explainedDrop) {
      caption += ` A path with more edges can still weigh less.`;
      explainedDrop = true;
    }
    frames.push({ caption, items: draw({ cur: u, better, worse, improved }) });
  }
  const target = names.length - 1;
  const path: number[] = [];
  for (let v = target; v !== -1; v = via[v]) path.unshift(v);
  frames.push({
    caption: `Every distance is final: ${names.slice(1).map((nm, i) => `${nm} ${dist[i + 1]}`).join(", ")}. Following each node's last improving edge back gives the shortest path to ${N(target)}, ${path.map(N).join(" → ")}, cost ${dist[target]}. With a binary heap this is O((V + E) log V).`,
    items: draw({ path }),
  });
  return finish({ title: "Shortest paths from A in a weighted graph, with Dijkstra's algorithm", input: `edges = ${edges.map(([a, b, w]) => `${N(a)}→${N(b)} ${w}`).join(", ")}; source = A`, frames });
}

/* ── minimum-spanning-tree: Kruskal ────────────────────────────────── */

export function kruskal(): Walkthrough {
  const names = ["A", "B", "C", "D", "E", "F"];
  const N = (i: number) => names[i];
  const pos: Pt[] = [{ x: 0, y: 92 }, { x: 112, y: 0 }, { x: 112, y: 184 }, { x: 244, y: 0 }, { x: 244, y: 184 }, { x: 356, y: 92 }];
  const edges: Array<[number, number, number]> = [[0, 1, 4], [0, 2, 3], [1, 2, 1], [1, 3, 2], [2, 3, 4], [2, 4, 5], [3, 4, 7], [3, 5, 6], [4, 5, 8]];
  const sorted = edges.map((_, i) => i).sort((a, b) => edges[a][2] - edges[b][2] || a - b);
  const label = (i: number) => `${N(edges[i][0])}–${N(edges[i][1])}`;
  const parent = names.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const status = new Map<number, "kept" | "cycle">();
  let total = 0;
  const frames: Frame[] = [];
  const LX = 436;
  const LW = 64;
  const LH = 24;
  const ly = (rank: number) => -12 + rank * 28;
  const comps = () => {
    const by = new Map<number, number[]>();
    names.forEach((_, i) => by.set(find(i), [...(by.get(find(i)) ?? []), i]));
    return [...by.values()].sort((a, b) => a[0] - b[0]);
  };
  const compOf = (x: number) => `{${comps().find((c) => c.includes(x))?.map(N).join(", ")}}`;

  const draw = (o: { cur?: number; final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b, w], i) => {
      const s = status.get(i);
      const tone: LineTone = i === o.cur ? (s === "kept" ? "accent" : "error") : s === "kept" ? "accent" : s === "cycle" || o.final ? "faint" : "line";
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone, label: String(w), dashed: s === "cycle" && i !== o.cur }));
    });
    const cur = o.cur === undefined ? [] : [edges[o.cur][0], edges[o.cur][1]];
    names.forEach((nm, i) => items.push(circle(`n${i}`, pos[i], nm, o.final ? "strong" : cur.includes(i) ? "accent" : "plain")));
    items.push(note("lh", "sorted edges", LX, ly(0) - 14, { tone: "soft", size: 11, mono: false }));
    sorted.forEach((ei, rank) => {
      const s = status.get(ei);
      const tone: Tone = ei === o.cur ? (s === "kept" ? "accent" : "error") : s === "kept" ? "strong" : s === "cycle" || o.final ? "muted" : "plain";
      items.push(box(`l${ei}`, LX, ly(rank), LW, LH, `${label(ei)} ${edges[ei][2]}`, tone, 12));
      if (s) items.push(note(`m${ei}`, s === "kept" ? "kept" : "cycle", LX + LW + 8, ly(rank) + LH / 2, { size: 11, tone: s === "kept" ? "accent" : ei === o.cur ? "error" : "faint" }));
    });
    items.push(note("comp", `components: ${comps().map((c) => `{${c.map(N).join(",")}}`).join(" ")}`, 0, 246, { size: 12, tone: "soft" }));
    items.push(note("tot", `total weight = ${total}`, 0, 268, { weight: o.final ? 600 : undefined }));
    return items;
  };

  frames.push({
    caption: `Kruskal sorts the ${edges.length} edges by weight and tries them cheapest first. Every node starts as its own component; an edge is kept only if it joins two different components, because inside one it would close a cycle.`,
    items: draw(),
  });
  let kept = 0;
  for (const ei of sorted) {
    if (kept === names.length - 1) break;
    const [a, b, w] = edges[ei];
    if (find(a) === find(b)) {
      const tree = names.map((_, v) => edges.flatMap(([x, y], j) => (status.get(j) !== "kept" ? [] : x === v ? [y] : y === v ? [x] : [])));
      const route = pathBetween(tree, a, b).map(N).join("–");
      status.set(ei, "cycle");
      frames.push({
        caption: `${label(ei)} (${w}) is next, but ${N(a)} and ${N(b)} are already in one component, joined by ${route}. Adding it would close a cycle, so it is skipped.`,
        items: draw({ cur: ei }),
      });
      continue;
    }
    const before = [compOf(a), compOf(b)];
    parent[find(a)] = find(b);
    status.set(ei, "kept");
    total += w;
    kept++;
    const e = `${label(ei)} (${w})`;
    const caption =
      kept === 1
        ? `${e} is the cheapest edge of all, and it joins ${before[0]} and ${before[1]}, two different components, so it is kept and they merge. Total ${total}.`
        : kept === names.length - 1
          ? `${e} joins ${before[0]} and ${before[1]} and is kept: total ${total}. That is ${kept} edges, and a spanning tree of ${names.length} nodes needs exactly ${kept}, so the search can stop.`
          : kept === 2
            ? `${e} is the cheapest edge left and joins ${before[0]} to ${before[1]}, so it is kept: total ${total}. The lightest edge between two components is always safe to take.`
            : `${e} links ${before[0]} to ${before[1]}, different components again, so it is kept: total ${total}.`;
    frames.push({ caption, items: draw({ cur: ei }) });
  }
  const unseen = sorted.filter((ei) => !status.has(ei));
  frames.push({
    caption: `The tree is complete, so ${and(unseen.map((ei) => `${label(ei)} (${edges[ei][2]})`))} ${unseen.length === 1 ? "is" : "are"} never even looked at. The minimum spanning tree weighs ${total}; sorting dominates the cost, O(E log E), with union-find answering each component check.`,
    items: draw({ final: true }),
  });
  return finish({ title: "Minimum spanning tree of a weighted graph, with Kruskal's algorithm", input: `edges = ${edges.map(([a, b, w]) => `${N(a)}–${N(b)} ${w}`).join(", ")}`, frames });
}

/* ── union-find: union by size and path compression ────────────────── */

export function unionFind(): Walkthrough {
  const n = 6;
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = Array.from({ length: n }, () => 1);
  type Op = ["union" | "connected", number, number];
  // One frame per group: the two unions after the first follow its rule exactly, so they share a frame.
  const groups: Op[][] = [[["union", 0, 1]], [["union", 2, 3], ["union", 4, 5]], [["union", 1, 3]], [["connected", 3, 5]], [["union", 3, 5]], [["connected", 5, 1]]];
  const ops = groups.flat();
  const PY = 158;
  const SY = 224;
  const frames: Frame[] = [];

  /** find with path compression: the path walked, the root, and the nodes re-pointed. */
  const find = (x: number) => {
    const path = [x];
    while (parent[path[path.length - 1]] !== path[path.length - 1]) path.push(parent[path[path.length - 1]]);
    const root = path[path.length - 1];
    const moved = path.filter((v) => v !== root && parent[v] !== root);
    for (const v of moved) parent[v] = root;
    return { root, path, moved };
  };
  const shortcut = new Set<number>(); // nodes path compression has re-pointed, so their next find is one hop
  const findSays = (x: number, p: number[]) => (p.length === 1 ? `find(${x}) = ${x}, a root` : p.length === 2 && shortcut.has(x) ? `find(${x}) now takes one hop, ${p.join(" → ")}, thanks to the compression` : `find(${x}) walks ${p.join(" → ")}`);
  const bothSay = (x: number, px: number[], y: number, py: number[]) => (px.length === 1 && py.length === 1 ? `find(${x}) = ${x} and find(${y}) = ${y} are both roots` : `${findSays(x, px)}${shortcut.has(x) || shortcut.has(y) ? ";" : " and"} ${findSays(y, py)}`);
  const rootOf = (x: number): number => (parent[x] === x ? x : rootOf(parent[x]));

  const layout = () => {
    const kids = (k: number) => (k === -1 ? parent.map((p, i) => (p === i ? i : -1)).filter((i) => i >= 0) : parent.map((p, i) => (p === k && i !== k ? i : -1)).filter((i) => i >= 0));
    const at = treeLayout<number>(-1, kids, { dx: 52, dy: 62 });
    return (i: number) => {
      const p = at.get(i) as { x: number; y: number };
      return { x: p.x, y: p.y - 62 };
    };
  };

  const draw = (o: { path?: number[]; roots?: number[]; fresh?: number[]; changed?: number[]; sized?: number[]; line?: string; final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    const at = layout();
    parent.forEach((p, i) => {
      if (p === i) return;
      const hot = o.fresh?.includes(i) || (o.path?.includes(i) && o.path.includes(p));
      items.push(link(`e${i}`, at(i), at(p), 16, { arrow: true, tone: hot ? "accent" : "line" }));
    });
    parent.forEach((_, i) => {
      const tone: Tone = o.final ? (parent[i] === i ? "strong" : "accent") : o.roots?.includes(i) ? "strong" : o.path?.includes(i) ? "accent" : "plain";
      items.push(circle(`n${i}`, at(i), String(i), tone, 16));
    });
    items.push(rowLabel("pl", "parent", -12, PY));
    items.push(...row("p", parent, { y: PY, index: true, tone: (i) => (o.changed?.includes(i) ? "accent" : "plain") }));
    items.push(rowLabel("sl", "size", -12, SY));
    items.push(...row("z", size, { y: SY, text: (i) => (parent[i] === i ? String(size[i]) : "·"), tone: (i) => (o.sized?.includes(i) ? "accent" : parent[i] === i ? "plain" : "muted") }));
    if (o.line) items.push(note("op", o.line, 0, SY + 66, { weight: 600, size: 12 }));
    return items;
  };

  frames.push({
    caption: `Union-find keeps disjoint sets as trees: parent[i] points one step towards the set's root, and a root points at itself. At the start each of the ${n} elements is its own set of size 1.`,
    items: draw({ line: "every element is its own root" }),
  });
  let lastAnswer = "";
  let unions = 0;
  for (const group of groups) {
    const [op, a, b] = group[0];
    if (op === "connected") {
      const fa = find(a);
      const fb = find(b);
      const moved = [...fa.moved, ...fb.moved];
      moved.forEach((v) => shortcut.add(v));
      const compress = moved.length ? ` On the way back, path compression points ${and(moved.map(String))} straight at the root: ${moved.map((v) => `parent[${v}] = ${parent[v]}`).join(", ")}.` : "";
      const yes = fa.root === fb.root;
      lastAnswer = `connected(${a}, ${b}) = ${yes}`;
      frames.push({
        caption: `connected(${a}, ${b})? ${findSays(a, fa.path)} and ${findSays(b, fb.path)}.${compress} The roots are ${yes ? `both ${fa.root}, so yes, they are in one set` : `${fa.root} and ${fb.root}, so no`}.`,
        items: draw({ path: [...fa.path, ...fb.path], roots: [fa.root, fb.root], changed: moved, line: `connected(${a}, ${b})? ${fa.root} ${yes ? "=" : "≠"} ${fb.root} → ${yes ? "yes" : "no"}` }),
      });
      continue;
    }
    const path: number[] = [];
    const fresh: number[] = [];
    const roots: number[] = [];
    const changed: number[] = [];
    const says: string[] = [];
    let caption = "";
    for (const [, x, y] of group) {
      const fx = find(x);
      const fy = find(y);
      const moved = [...fx.moved, ...fy.moved];
      const tie = size[fx.root] === size[fy.root];
      const [big, small] = size[fx.root] >= size[fy.root] ? [fx.root, fy.root] : [fy.root, fx.root];
      const sinking = parent.map((_, i) => i).filter((i) => rootOf(i) === small);
      const before = [size[big], size[small]];
      parent[small] = big;
      size[big] += size[small];
      path.push(...fx.path, ...fy.path);
      fresh.push(small);
      roots.push(big);
      changed.push(small, ...moved);
      says.push(`parent[${small}] = ${big}`);
      if (group.length > 1) continue;
      const compress = moved.length ? ` On the way, path compression points ${and(moved.map(String))} straight at the root.` : "";
      const sizes = tie ? `Sizes ${before[0]} and ${before[1]} tie${unions === 0 ? ", and a tie goes to the first root" : " again"}` : `Size ${before[0]} beats size ${before[1]}`;
      const why =
        unions === 0
          ? ` Each root keeps its set's size so the next union knows which tree is bigger.`
          : tie
            ? ` A node sinks a level only when its tree is hung under one at least as big, so its set at least doubles each time: no node sinks more than log₂ n levels.`
            : ` Hanging the smaller tree under the larger leaves the bigger tree's depths alone: only ${and(sinking.map(String))} sink one level.`;
      caption = `union(${x}, ${y}): ${bothSay(x, fx.path, y, fy.path)}.${compress} ${sizes}, so root ${small} goes under ${big}: parent[${small}] = ${big}, size[${big}] = ${size[big]}.${why}`;
      unions++;
    }
    if (group.length > 1) {
      const sets = [...new Set(parent.map((_, i) => rootOf(i)))].map((r) => `{${parent.map((_, i) => i).filter((i) => rootOf(i) === r).join(", ")}}`);
      caption = `${and(group.map(([, x, y]) => `union(${x}, ${y})`))} follow the same rule: each joins two single elements, so ${and(says)}. That leaves ${sets.length} sets: ${and(sets)}.`;
      unions += group.length;
    }
    frames.push({ caption, items: draw({ path, fresh, roots, changed, sized: roots, line: `${group.map(([, x, y]) => `union(${x}, ${y})`).join(", ")}: ${says.join(", ")}` }) });
  }
  frames.push({
    caption: `So ${lastAnswer}. Every element now points straight at root 0, so any later find is one hop. With union by size and path compression, m operations cost O(m·α(n)), where α stays below 5 for any real n.`,
    items: draw({ final: true, line: `${lastAnswer}; all in one set` }),
  });
  return finish({ title: "Merging sets and answering connected? queries, with union-find", input: `n = ${n}; ${ops.map(([op, a, b]) => `${op}(${a}, ${b})`).join(", ")}`, frames });
}

/* ── biconnected-component: Tarjan's low-link DFS ──────────────────── */

export function articulationPoints(): Walkthrough {
  const names = ["A", "B", "C", "D", "E", "F"];
  const N = (i: number) => names[i];
  const edges: Array<[number, number]> = [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5]];
  const pos: Pt[] = [{ x: 30, y: 0 }, { x: 30, y: 150 }, { x: 130, y: 75 }, { x: 290, y: 75 }, { x: 390, y: 0 }, { x: 390, y: 150 }];
  // disc/low readouts: A and E above, B and F below, C and D below and nudged towards the bridge, clear of their triangle edges.
  const tag: Pt[] = [{ x: 30, y: -R - 11 }, { x: 30, y: 150 + R + 11 }, { x: 148, y: 75 + R + 11 }, { x: 272, y: 75 + R + 11 }, { x: 390, y: -R - 11 }, { x: 390, y: 150 + R + 11 }];
  const adj = names.map((_, i) => edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort((a, b) => a - b));
  const edgeOf = (a: number, b: number) => edges.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const disc = names.map(() => 0);
  const low = names.map(() => 0);
  const parent = names.map(() => -1);
  const done = names.map(() => false);
  const stack: number[] = [];
  const back = new Set<number>();
  const cut = new Set<number>();
  const bridges = new Set<number>();
  const comps: number[][] = [];
  const edgeStack: number[] = [];
  let clock = 0;
  const frames: Frame[] = [];

  const draw = (o: { check?: string; final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b], i) => {
      const tree = parent[b] === a || parent[a] === b;
      const tone: LineTone = o.final ? (bridges.has(i) ? "accent" : "line") : tree ? "accent" : back.has(i) ? "ink" : "line";
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone, dashed: back.has(i) && !o.final, label: o.final && bridges.has(i) ? "bridge" : undefined }));
    });
    const top = stack[stack.length - 1];
    names.forEach((nm, i) => {
      const tone: Tone = o.final ? (cut.has(i) ? "strong" : "plain") : i === top ? "strong" : stack.includes(i) ? "accent" : done[i] ? "muted" : "plain";
      items.push(circle(`n${i}`, pos[i], nm, tone));
      if (disc[i]) items.push(note(`t${i}`, `d=${disc[i]} low=${low[i]}`, tag[i].x, tag[i].y, { anchor: "middle", size: 11, tone: "soft" }));
      if (cut.has(i)) items.push(note(`c${i}`, "cut vertex", tag[i].x, tag[i].y + 16, { anchor: "middle", size: 11, tone: "accent", weight: 600, mono: false }));
    });
    items.push(note("rule", "u is a cut vertex if a child v has low[v] ≥ disc[u]", 0, 232, { size: 11, tone: "soft" }));
    if (o.check) items.push(note("chk", o.check, 0, 254, { size: 12, weight: 600 }));
    return items;
  };

  const visit = (u: number, from: number) => {
    disc[u] = low[u] = ++clock;
    parent[u] = from;
    stack.push(u);
    let shown = false;
    const backs: number[] = [];
    const show1 = () => {
      if (shown) return;
      shown = true;
      let caption: string;
      if (from < 0) caption = `Tarjan's DFS stamps each node with disc, the time it is reached, and low, the smallest disc its subtree can reach through one back edge. Start at ${N(u)}: disc = low = 1.`;
      else if (backs.length)
        caption = `${N(from)} → ${N(u)} is a tree edge: disc[${N(u)}] = ${disc[u]}. Its neighbour ${and(backs.map(N))} is an ancestor already discovered, so ${N(u)}–${and(backs.map(N))} is a back edge and low[${N(u)}] drops to ${low[u]}: ${N(u)}'s subtree can climb above ${N(from)}.`;
      else {
        const ahead = adj[u].filter((v) => v !== from && !disc[v]);
        const why =
          clock === 2
            ? "Until a back edge says otherwise, a node's low is its own disc."
            : ahead.length > 1
              ? `Its neighbours ${and(ahead.map(N))} are still undiscovered, so the search goes on to ${N(ahead[0])} first.`
              : ahead.length === 1
                ? `Its one undiscovered neighbour, ${N(ahead[0])}, is next.`
                : `It has no undiscovered neighbour, so it finishes at once.`;
        caption = `${N(from)} → ${N(u)} is a tree edge: disc[${N(u)}] = low[${N(u)}] = ${disc[u]}. ${why}`;
      }
      frames.push({ caption, items: draw() });
    };
    let lastChild = -1;
    for (const v of adj[u]) {
      if (v === from) continue;
      if (!disc[v]) {
        show1();
        edgeStack.push(edgeOf(u, v));
        visit(v, u);
        lastChild = v;
        const was = low[u];
        low[u] = Math.min(low[u], low[v]);
        // low[v] >= disc[u] closes a biconnected component: the edges pushed since u–v. For the root that always holds.
        if (low[v] >= disc[u]) {
          const cs: number[] = [];
          const stop = edgeOf(u, v);
          for (;;) {
            const e = edgeStack.pop() as number;
            cs.push(e);
            if (e === stop) break;
          }
          comps.push([...new Set(cs.flatMap((e) => edges[e]))].sort((a, b) => a - b));
          if (low[v] > disc[u]) bridges.add(stop);
        }
        if (from < 0) continue; // the root's rule is applied once all its children are back
        const lowMsg = `${N(v)} returns to ${N(u)}: low[${N(u)}] = min(${was}, low[${N(v)}] = ${low[v]}) = ${low[u]}.`;
        let caption: string;
        let check: string;
        if (low[v] >= disc[u]) {
          cut.add(u);
          check = `low[${N(v)}] = ${low[v]} ≥ disc[${N(u)}] = ${disc[u]} → ${N(u)} is a cut vertex`;
          caption = `${lowMsg} low[${N(v)}] = ${low[v]} ≥ disc[${N(u)}] = ${disc[u]}: nothing below ${N(u)} climbs above it, so removing ${N(u)} cuts ${N(v)}'s side off. ${N(u)} is a cut vertex${low[v] > disc[u] ? `, and since ${low[v]} > ${disc[u]}, ${N(u)}–${N(v)} is a bridge` : ""}.`;
        } else {
          check = `low[${N(v)}] = ${low[v]} < disc[${N(u)}] = ${disc[u]} → ${N(u)} is not cut by ${N(v)}`;
          caption = `${lowMsg} low[${N(v)}] = ${low[v]} < disc[${N(u)}] = ${disc[u]}: ${N(v)}'s subtree has a back edge to above ${N(u)}, so it stays connected without ${N(u)}.`;
        }
        frames.push({ caption, items: draw({ check }) });
      } else if (disc[v] < disc[u]) {
        // An ancestor: a back edge. (A later disc is a descendant, whose back edge was counted from its side.)
        back.add(edgeOf(u, v));
        edgeStack.push(edgeOf(u, v));
        low[u] = Math.min(low[u], disc[v]);
        backs.push(v);
      }
    }
    show1();
    stack.pop();
    done[u] = true;
    if (from < 0) {
      const kids = names.filter((_, i) => parent[i] === u).length;
      if (kids >= 2) cut.add(u);
      const cutNames = [...cut].sort((a, b) => a - b).map(N);
      const bridgeNames = [...bridges].map((e) => `${N(edges[e][0])}–${N(edges[e][1])}`);
      const compNames = comps.map((c) => `{${c.map(N).join(", ")}}`).sort();
      frames.push({
        caption: `${N(lastChild)} returns to ${N(u)}, the root, which is a cut vertex only with two or more DFS children; ${N(u)} has ${kids === 1 ? "only one" : kids}. Result: cut vertices ${and(cutNames)}, bridge ${and(bridgeNames)}, components ${and(compNames)}, from one DFS: O(V + E).`,
        items: draw({ final: true, check: `cut vertices: ${cutNames.join(", ")} · bridge: ${bridgeNames.join(", ")}` }),
      });
    }
  };
  visit(0, -1);
  return finish({ title: "Cut vertices and bridges of a graph, with Tarjan's low-link DFS", input: `edges = ${edges.map(([a, b]) => `${N(a)}–${N(b)}`).join(", ")}; start = A`, frames });
}

/* ── matrix: rotate 90° clockwise in place ─────────────────────────── */

export function rotateMatrix(): Walkthrough {
  const n = 3;
  const m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  const before = m.map((r) => [...r]);
  // Which original cell sits at each position now: the id that glides.
  const ids = m.map((r, i) => r.map((_, j) => `m${i}${j}`));
  const S = 44;
  const G = 6;
  const X0 = 170;
  const BS = 28;
  const frames: Frame[] = [];
  const at = (i: number, j: number) => ({ x: X0 + j * (S + G), y: i * (S + G) });

  const draw = (o: { hot?: Array<[number, number]>; mirror?: "diag" | "mid"; rule: string; final?: boolean }): Item[] => {
    const items: Item[] = [];
    // The mirror line sits behind the cells: it shows in the gaps and past the corners without striking through a value.
    const far = n * (S + G) - G;
    if (o.mirror === "diag") items.push({ k: "edge", id: "mir", x1: X0 - 8, y1: -8, x2: X0 + far + 8, y2: far + 8, tone: "ink", dashed: true });
    if (o.mirror === "mid") items.push({ k: "edge", id: "mir", x1: X0 + far / 2, y1: -8, x2: X0 + far / 2, y2: far + 2, tone: "ink", dashed: true });
    // What the current pass leaves where it is: the diagonal under a transpose, the middle column under a row mirror.
    const fixed = (i: number, j: number) => (o.mirror === "diag" ? i === j : o.mirror === "mid" ? 2 * j === n - 1 : false);
    items.push(note("bl", "before", 0, -14, { tone: "soft", size: 11, mono: false }));
    before.forEach((r, i) => r.forEach((v, j) => items.push(box(`b${i}${j}`, j * (BS + 4), i * (BS + 4), BS, BS, String(v), o.final && j === 0 ? "accent" : "muted", 12))));
    items.push(note("wl", o.final ? "after" : "in place", X0, -14, { tone: "soft", size: 11, mono: false }));
    for (let j = 0; j < n; j++) items.push(note(`cx${j}`, String(j), at(0, j).x + S / 2, n * (S + G) + 6, { anchor: "middle", tone: "faint", size: 10 }));
    for (let i = 0; i < n; i++) items.push(note(`rx${i}`, String(i), X0 - 10, at(i, 0).y + S / 2, { anchor: "end", tone: "faint", size: 10 }));
    m.forEach((r, i) =>
      r.forEach((v, j) => {
        const tone: Tone = o.final ? "strong" : o.hot?.some(([a, b]) => a === i && b === j) ? "accent" : fixed(i, j) ? "muted" : "plain";
        items.push(box(ids[i][j], at(i, j).x, at(i, j).y, S, S, String(v), tone));
      }),
    );
    items.push(note("rule", o.rule, X0 + far + 26, far / 2, { tone: "soft", size: 12 }));
    return items;
  };
  const swap = (a: [number, number], b: [number, number]) => {
    [m[a[0]][a[1]], m[b[0]][b[1]]] = [m[b[0]][b[1]], m[a[0]][a[1]]];
    [ids[a[0]][a[1]], ids[b[0]][b[1]]] = [ids[b[0]][b[1]], ids[a[0]][a[1]]];
  };

  frames.push({
    caption: `A 90° clockwise turn sends the value at (i, j) to (j, ${n - 1} − i). Doing that directly needs cycles of four moves; it is simpler as two passes of plain swaps, a transpose and then a mirror of each row.`,
    items: draw({ rule: "(i, j) → (j, n−1−i)" }),
  });
  let first = true;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const a = m[i][j];
      const b = m[j][i];
      swap([i, j], [j, i]);
      const last = i === n - 2;
      frames.push({
        caption: `${first ? "Transpose first: s" : "S"}wap m[${i}][${j}] = ${a} with m[${j}][${i}] = ${b} across the main diagonal.${first ? ` The diagonal cells ${and(before.map((r, k) => String(r[k])))} map to themselves and never move.` : last ? ` The transpose is done: row i now holds what column i held.` : ` Only cells above the diagonal start a swap, so no pair is swapped back.`}`,
        items: draw({ hot: [[i, j], [j, i]], mirror: "diag", rule: "(i, j) ↔ (j, i)" }),
      });
      first = false;
    }
  for (let i = 0; i < n; i++) {
    const was = [...m[i]];
    for (let j = 0; j < Math.floor(n / 2); j++) swap([i, j], [i, n - 1 - j]);
    frames.push({
      caption:
        i === 0
          ? `Now mirror each row. Row 0, ${show(was)}, becomes ${show(m[i])}: its ends swap and the middle stays. Together with the transpose this moves (i, j) to (j, ${n - 1} − i), exactly the turn.`
          : i === n - 1
            ? `Row ${i}, ${show(was)}, becomes ${show(m[i])}, the last swap: every value has reached its rotated place.`
            : `Row ${i}, ${show(was)}, becomes ${show(m[i])}. Each row is mirrored on its own, so the rows can be done in any order.`,
      items: draw({ hot: Array.from({ length: n }, (_, j) => [i, j] as [number, number]).filter(([, j]) => j !== (n - 1) / 2), mirror: "mid", rule: "(i, j) ↔ (i, n−1−j)" }),
    });
  }
  frames.push({
    caption: `Rotated: ${show(m.map((r) => show(r)))}. The old first column ${before.map((r) => r[0]).reverse().join(", ")}, read bottom-up, is the new first row. Every cell is touched a constant number of times: O(n²) time and O(1) extra space.`,
    items: draw({ final: true, rule: "rotated 90° clockwise" }),
  });
  return finish({ title: "Rotating a square matrix 90° clockwise in place, with transpose and mirror", input: `matrix = ${show(before.map((r) => show(r)))}`, frames });
}

/* ── simulation: a robot following commands ────────────────────────── */

export function robotSimulation(): Walkthrough {
  const W = 5;
  const H = 4;
  const S = 40;
  const G = 4;
  const blocks = new Set(["2,2", "4,1"]);
  const cmds = "GGRGGLGG";
  const DIRS: Array<[number, number]> = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const NAME = ["north", "east", "south", "west"];
  const ARROW = ["↑", "→", "↓", "←"];
  const cx = (gx: number) => gx * (S + G);
  const cy = (gy: number) => (H - 1 - gy) * (S + G);
  const CY = -58;
  const CS = 24;
  let x = 0;
  let y = 0;
  let d = 0;
  const trail = new Set(["0,0"]);
  let blocked = 0;
  const frames: Frame[] = [];

  const draw = (o: { k?: number; hit?: string; wall?: boolean; final?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("cl", "commands", -12, CY, CS)];
    [...cmds].forEach((c, i) => items.push(box(`k${i}`, slotX(i, 0, CS, 4), CY, CS, CS, c, i === o.k ? "accent" : o.k !== undefined && i < o.k ? "muted" : o.final ? "muted" : "plain", 12)));
    for (let gy = H - 1; gy >= 0; gy--)
      for (let gx = 0; gx < W; gx++) {
        const key = `${gx},${gy}`;
        const tone: Tone = blocks.has(key) ? (o.hit === key ? "error" : "muted") : trail.has(key) ? "accent" : "plain";
        items.push(box(`g${gx}_${gy}`, cx(gx), cy(gy), S, S, blocks.has(key) ? "#" : "", tone, 13));
      }
    for (let gx = 0; gx < W; gx++) items.push(note(`xl${gx}`, String(gx), cx(gx) + S / 2, cy(0) + S + 11, { anchor: "middle", tone: "faint", size: 10 }));
    for (let gy = 0; gy < H; gy++) items.push(note(`yl${gy}`, String(gy), -8, cy(gy) + S / 2, { anchor: "end", tone: "faint", size: 10 }));
    // A step off the grid is stopped by the wall: a red stroke on the side of the robot's cell it tried to leave.
    if (o.wall) {
      const [dx, dy] = DIRS[d];
      const mx = cx(x) + S / 2 + (dx * (S + G)) / 2;
      const my = cy(y) + S / 2 - (dy * (S + G)) / 2;
      items.push({ k: "edge", id: "wall", x1: dx ? mx : cx(x) - 2, y1: dy ? my : cy(y) - 2, x2: dx ? mx : cx(x) + S + 2, y2: dy ? my : cy(y) + S + 2, tone: "error" });
    }
    items.push(circle("bot", { x: cx(x) + S / 2, y: cy(y) + S / 2 }, ARROW[d], o.final ? "strong" : "accent", 14));
    items.push(note("pos", `at (${x}, ${y}) facing ${NAME[d]}${blocked ? ` · blocked steps: ${blocked}` : ""}`, 0, cy(0) + S + 34, { weight: o.final ? 600 : undefined, size: 12 }));
    return items;
  };

  frames.push({
    caption: `The robot starts at (0, 0) facing north. G steps one cell forward unless an obstacle (#) or the edge of the grid is in the way; L and R turn 90° on the spot. No cleverness is needed: following the rules exactly is the solution.`,
    items: draw(),
  });
  let explainedTurn = false;
  let explainedStay = false;
  let lastMove = -1; // the heading of the last G that moved, -1 after a turn
  [...cmds].forEach((c, k) => {
    let caption: string;
    let hit: string | undefined;
    let wall = false;
    if (c === "G") {
      const [dx, dy] = DIRS[d];
      const nx = x + dx;
      const ny = y + dy;
      const inside = nx >= 0 && ny >= 0 && nx < W && ny < H;
      if (!inside || blocks.has(`${nx},${ny}`)) {
        blocked++;
        if (inside) hit = `${nx},${ny}`;
        else wall = true;
        caption = inside
          ? `G at (${x}, ${y}): the cell ahead, (${nx}, ${ny}), holds an obstacle, so the robot stays put.${explainedStay ? "" : " The command is used up, but the position does not change."}`
          : `G at (${x}, ${y}): the cell ahead, (${nx}, ${ny}), is off the grid, so the wall stops the robot exactly as an obstacle would${explainedStay ? "" : "; the command is used up and nothing moves"}.`;
        explainedStay = true;
        lastMove = -1;
      } else {
        x = nx;
        y = ny;
        trail.add(`${x},${y}`);
        caption =
          lastMove === d
            ? `Another G, still facing ${NAME[d]}: (${x}, ${y}) is free too, so the robot moves again.`
            : k === 0
              ? `G: facing ${NAME[d]}, a step adds (${dx}, ${dy}) to the position. (${x}, ${y}) is free, so the robot moves there.`
              : `G: now facing ${NAME[d]}, a step adds (${dx}, ${dy}) instead, and (${x}, ${y}) is free, so the robot moves there.`;
        lastMove = d;
      }
    } else {
      const was = d;
      d = (d + (c === "R" ? 1 : 3)) % 4;
      caption = `${c} at (${x}, ${y}) turns the robot from ${NAME[was]} to ${NAME[d]} without moving.${explainedTurn ? " Only the heading changes, so the next G goes a new way." : ` Headings are an index into [north, east, south, west], so R is +1 and L is −1, mod 4.`}`;
      explainedTurn = true;
      lastMove = -1;
    }
    frames.push({ caption, items: draw({ k, hit, wall }) });
  });
  frames.push({
    caption: `All ${cmds.length} commands are done: the robot ends at (${x}, ${y}) facing ${NAME[d]}, after ${blocked} blocked step${blocked === 1 ? "" : "s"}. With the obstacles in a hash set each command is O(1), so the run is O(n) for n commands.`,
    items: draw({ final: true }),
  });
  return finish({ title: "Where a robot ends up after a command string, by simulating each step", input: `grid ${W}×${H}, obstacles at (2, 2) and (4, 1), start (0, 0) facing north, commands = "${cmds}"`, frames });
}

/* ── dynamic-programming: House Robber ─────────────────────────────── */

export function houseRobber(): Walkthrough {
  const nums = [2, 7, 9, 3, 1];
  const dp: Array<number | null> = nums.map(() => null);
  const SZ = 40;
  const GG = 20;
  const NY = 0;
  const DY = 100;
  const mid = (i: number) => slotMid(i, 0, SZ, GG);
  const frames: Frame[] = [];

  const draw = (o: { i?: number; robWins?: boolean; robbed?: number[]; readout?: string } = {}): Item[] => {
    const items: Item[] = [rowLabel("nl", "nums", -12, NY), rowLabel("dl", "dp", -12, DY)];
    const i = o.i;
    items.push(...row("h", nums, { y: NY, size: SZ, gap: GG, index: true, tone: (k) => (o.robbed ? (o.robbed.includes(k) ? "strong" : "muted") : k === i && o.robWins !== undefined ? "accent" : "plain") }));
    items.push(
      ...row("dp", nums, {
        y: DY,
        size: SZ,
        gap: GG,
        text: (k) => (dp[k] === null ? "" : String(dp[k])),
        tone: (k) => (o.robbed ? (k === nums.length - 1 ? "strong" : "plain") : k === i ? "strong" : i !== undefined && (k === i - 1 || k === i - 2) ? "accent" : dp[k] === null ? "ghost" : "plain"),
      }),
    );
    if (i !== undefined && i >= 1 && !o.robbed) {
      items.push({ k: "edge", id: "skip", x1: mid(i - 1), y1: DY - 2, x2: mid(i), y2: DY - 3, bow: -20, arrow: true, tone: o.robWins ? "line" : "accent", label: "skip" });
      if (i >= 2) items.push({ k: "edge", id: "rob", x1: mid(i - 2), y1: DY + SZ + 2, x2: mid(i), y2: DY + SZ + 3, bow: 34, arrow: true, tone: o.robWins ? "accent" : "line", label: `+${nums[i]}` });
      // dp[1] has no dp[i−2] to add to (it is 0), so robbing is just nums[1] coming straight down.
      else items.push({ k: "edge", id: "rob1", x1: mid(i) + 12, y1: NY + SZ + 18, x2: mid(i) + 12, y2: DY - 3, arrow: true, tone: o.robWins ? "accent" : "line", label: `+${nums[i]}` });
    }
    if (o.readout) items.push(note("rd", o.readout, 0, DY + SZ + 50, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `No two neighbouring houses can both be robbed. Let dp[i] be the most money from houses 0..i: either skip house i and keep dp[i−1], or rob it and add nums[i] to dp[i−2], the best that leaves house i−1 alone.`,
    items: draw({ readout: "dp[i] = max(dp[i−1], dp[i−2] + nums[i])" }),
  });
  nums.forEach((v, i) => {
    const skip = i >= 1 ? (dp[i - 1] as number) : 0;
    const before = i >= 2 ? (dp[i - 2] as number) : 0;
    const rob = before + v;
    dp[i] = Math.max(skip, rob);
    const robWins = rob > skip;
    let caption: string;
    if (i === 0) caption = `dp[0] = ${v}: with a single house, rob it. This is the base case every later cell builds on.`;
    else if (i === 1) caption = `dp[1] = max(dp[0], nums[1]) = max(${skip}, ${v}) = ${dp[i]}: houses 0 and 1 are neighbours, so take the richer one${robWins ? ", house 1" : ", house 0"}.`;
    else
      caption = robWins
        ? `dp[${i}] = max(skip: ${skip}, rob: ${before} + ${v} = ${rob}) = ${dp[i]}. Robbing house ${i} wins, so the best plan so far ends with house ${i}.`
        : `dp[${i}] = max(skip: ${skip}, rob: ${before} + ${v} = ${rob}) = ${dp[i]}. Skipping wins: house ${i} is worth less than what robbing it would give up.`;
    const readout = i === 0 ? `dp[0] = nums[0] = ${v}` : `dp[${i}] = max(${skip}, ${i >= 2 ? `${before} + ` : ""}${v}) = ${dp[i]}`;
    frames.push({ caption, items: draw({ i, robWins: i === 0 ? undefined : robWins, readout }) });
  });
  const robbed: number[] = [];
  for (let i = nums.length - 1; i >= 0; ) {
    if (i === 0 || dp[i] !== dp[i - 1]) {
      robbed.unshift(i);
      i -= 2;
    } else i -= 1;
  }
  const best = dp[nums.length - 1] as number;
  frames.push({
    caption: `The answer is dp[${nums.length - 1}] = ${best}. Walking back, a house was robbed wherever dp changes from its left neighbour: houses ${and(robbed.map(String))}, ${robbed.map((k) => nums[k]).join(" + ")} = ${best}. One pass, O(n) time, and O(1) space keeping only the last two cells.`,
    items: draw({ robbed, readout: `best = ${best} (houses ${robbed.join(", ")})` }),
  });
  return finish({ title: "Most money from non-adjacent houses, with dynamic programming", input: `nums = ${show(nums)}`, frames });
}

/* ── memoization: fib(5) as a call tree with a cache ───────────────── */

export function memoizedFibonacci(): Walkthrough {
  const N = 5;
  type Call = { id: string; n: number; kids: string[]; kind: "base" | "computed" | "hit"; value: number; parent: string | null };
  const calls = new Map<string, Call>();
  const events: Array<{ t: "call" | "ret"; id: string }> = [];
  const memo = new Map<number, number>();
  let counter = 0;
  const fib = (n: number, parent: string | null): number => {
    const id = `c${counter++}`;
    const call: Call = { id, n, kids: [], kind: "base", value: 0, parent };
    calls.set(id, call);
    if (parent) calls.get(parent)?.kids.push(id);
    events.push({ t: "call", id });
    if (n < 2) call.value = n;
    else if (memo.has(n)) {
      call.kind = "hit";
      call.value = memo.get(n) as number;
    } else {
      call.kind = "computed";
      call.value = fib(n - 1, id) + fib(n - 2, id);
      memo.set(n, call.value);
    }
    events.push({ t: "ret", id });
    return call.value;
  };
  fib(N, null);
  const naive = (n: number): number => (n < 2 ? 1 : 1 + naive(n - 1) + naive(n - 2));
  const at = treeLayout<string>("c0", (k) => calls.get(k)?.kids ?? [], { dx: 58, dy: 58 });
  const MX = 330;
  const MS = 38;
  const keys = Array.from({ length: N - 1 }, (_, i) => i + 2);
  const frames: Frame[] = [];

  const live = new Set<string>();
  const open = new Set<string>();
  const shut = new Set<string>();
  const stored = new Map<number, number>();
  const draw = (o: { now?: string[]; memoHot?: number[]; final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    for (const id of live) {
      const c = calls.get(id) as Call;
      if (c.parent) items.push(link(`l${id}`, at.get(c.parent) as Pt, at.get(id) as Pt, R, { tone: open.has(id) ? "accent" : "line" }));
    }
    for (const id of live) {
      const c = calls.get(id) as Call;
      const p = at.get(id) as Pt;
      const tone: Tone = o.final ? (id === "c0" ? "strong" : c.kind === "hit" ? "muted" : "plain") : o.now?.includes(id) ? "strong" : open.has(id) ? "accent" : c.kind === "hit" ? "muted" : "plain";
      items.push({ k: "node", id: `n${id}`, x: p.x, y: p.y, r: R, text: `f(${c.n})`, tone, size: 11 });
      if (shut.has(id)) {
        const leaf = c.kids.length === 0;
        items.push(note(`v${id}`, c.kind === "hit" ? `memo: ${c.value}` : `= ${c.value}`, leaf ? p.x : p.x + R + 5, leaf ? p.y + R + 11 : p.y, { anchor: leaf ? "middle" : "start", size: 11, tone: c.kind === "hit" ? "faint" : "accent" }));
      }
    }
    items.push(note("ml", "memo", MX, -24, { tone: "soft", size: 11, mono: false }));
    keys.forEach((k, i) => {
      items.push(box(`m${k}`, slotX(i, MX, MS, 6), 0, MS, MS, stored.has(k) ? String(stored.get(k)) : "", o.memoHot?.includes(k) ? "accent" : stored.has(k) ? (o.final ? "strong" : "plain") : "ghost", 13));
      items.push(note(`mi${k}`, `[${k}]`, slotMid(i, MX, MS, 6), MS + 11, { anchor: "middle", tone: "faint", size: 10 }));
    });
    const made = [...live].length;
    items.push(note("calls", `calls so far: ${made}`, MX, 84, { size: 12, tone: "soft" }));
    if (o.final) items.push(note("naive", `plain recursion: ${naive(N)}`, MX, 104, { size: 12, tone: "soft" }));
    return items;
  };

  let e = 0;
  const apply = (ev: { t: "call" | "ret"; id: string }) => {
    if (ev.t === "call") {
      live.add(ev.id);
      open.add(ev.id);
    } else {
      open.delete(ev.id);
      shut.add(ev.id);
      const c = calls.get(ev.id) as Call;
      if (c.kind === "computed") stored.set(c.n, c.value);
    }
  };
  apply(events[e++]);
  frames.push({
    caption: `Plain recursion for fib(${N}) recomputes the same smaller values again and again. Memoization keeps a table: before working anything out, a call checks the memo, and after working it out, it writes the answer there.`,
    items: draw({ now: ["c0"] }),
  });
  const name = (id: string) => `fib(${(calls.get(id) as Call).n})`;
  let firstBase = true;
  let stores = 0;
  while (e < events.length) {
    const batch: Array<{ t: "call" | "ret"; id: string }> = [];
    let stop: { t: "call" | "ret"; id: string } | undefined;
    while (e < events.length) {
      const ev = events[e++];
      apply(ev);
      batch.push(ev);
      const c = calls.get(ev.id) as Call;
      if (ev.t === "ret" && (c.kind !== "base" || firstBase)) {
        stop = ev;
        break;
      }
    }
    if (!stop) break;
    const c = calls.get(stop.id) as Call;
    const baseRets = batch.filter((b) => b.t === "ret" && (calls.get(b.id) as Call).kind === "base" && b.id !== stop?.id).map((b) => b.id);
    let caption: string;
    if (c.kind === "base") {
      firstBase = false;
      const chain = batch.filter((b) => b.t === "call").map((b) => name(b.id));
      caption = `Nothing is cached yet, so fib(${N}) calls ${chain.join(", which calls ")}: always the n − 1 branch first. ${name(c.id)} is a base case and returns ${c.value} at once.`;
      frames.push({ caption, items: draw({ now: [c.id] }) });
      continue;
    }
    if (c.kind === "hit") {
      const parentName = name(c.parent as string);
      caption = `${parentName} needs ${name(c.id)} next. memo[${c.n}] = ${c.value} is already there, so the call returns at once: the ${naive(c.n) - 1} calls a plain ${name(c.id)} would make below it never happen.`;
      frames.push({ caption, items: draw({ now: [c.id], memoHot: [c.n] }) });
      continue;
    }
    const [a, b] = c.kids.map((k) => calls.get(k) as Call);
    const pre = baseRets.length ? `${and(baseRets.map((id) => `${name(id)} returns ${(calls.get(id) as Call).value}`))}, so ` : "";
    const sum = `${name(c.id)} = ${name(a.id)} + ${name(b.id)} = ${a.value} + ${b.value} = ${c.value}`;
    if (c.id === "c0") {
      caption = `${pre}${sum}, after ${live.size} calls where plain recursion makes ${naive(N)}. Each fib(k) was computed once and every repeat was an O(1) lookup, so the time is O(n), with O(n) memory for the memo and the stack.`;
      frames.push({ caption, items: draw({ final: true }) });
    } else {
      const below = keys.filter((k) => k < N).every((k) => stored.has(k));
      caption =
        stores === 0
          ? `${pre}${sum}. Before returning, ${name(c.id)} writes its answer to memo[${c.n}], so no later call has to work it out again.`
          : stores === 1
            ? `${pre}${sum}, written to memo[${c.n}] on the way out. The base cases cost O(1) anyway, so only n ≥ 2 is cached.`
            : `${pre}${sum}, written to memo[${c.n}].${below ? ` The memo now holds every value below fib(${N}).` : ""}`;
      stores++;
      frames.push({ caption, items: draw({ now: [c.id], memoHot: [c.n] }) });
    }
  }
  return finish({ title: "Fibonacci without repeated work, with memoization", input: `fib(${N}); fib(n) = fib(n − 1) + fib(n − 2), fib(0) = 0, fib(1) = 1`, frames });
}

/* ── digit-dp: count numbers in [0, N] with a given digit sum ──────── */

export function digitSumCount(): Walkthrough {
  const N = 213;
  const S = 4;
  const digits = String(N).split("").map(Number);
  const L = digits.length;
  // free[k][r]: how many strings of k free digits (leading zeros allowed) have digit sum r.
  const free: number[][] = [Array.from({ length: S + 1 }, (_, r) => (r === 0 ? 1 : 0))];
  for (let k = 1; k < L; k++) free.push(Array.from({ length: S + 1 }, (_, r) => Array.from({ length: Math.min(9, r) + 1 }, (_, dd) => free[k - 1][r - dd]).reduce((a, b) => a + b, 0)));
  const brute = Array.from({ length: N + 1 }, (_, v) => v).filter((v) => String(v).split("").reduce((s, c) => s + Number(c), 0) === S);

  const RY = (p: number) => 64 + p * 42;
  const RH = 30;
  const BX = 112;
  const BW = 76;
  const TX = 64;
  const TY = RY(L + 1) + 40;
  const TS = 30;
  const frames: Frame[] = [];
  type Branch = { p: number; d: number; text: string; add: number | null };
  const branches: Branch[] = [];
  let count = 0;

  const draw = (o: { p?: number; hot?: number[]; cell?: [number, number][]; showTable?: boolean; final?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("nl", "N", -12, 0, 34)];
    items.push(...row("nd", digits, { size: 34, tone: (i) => (i === o.p ? "accent" : "plain") }));
    items.push(note("s", `S = ${S}`, 140, 17, { size: 13 }));
    items.push(note("cnt", `count = ${count}`, 230, 17, { weight: 600, size: 13 }));
    // One row per tight state the walk has reached: (position, digit sum so far, tight).
    const rows = new Set(branches.map((b) => b.p));
    if (o.p !== undefined) rows.add(o.p);
    items.push(note("sh", "(pos, sum, tight)", BX - 10, RY(0) - 14, { anchor: "end", size: 10, tone: "faint" }));
    for (const p of rows) {
      const sum = digits.slice(0, p).reduce((a, b) => a + b, 0);
      items.push(note(`st${p}`, `(${p}, ${sum}, tight)`, BX - 10, RY(p) + RH / 2, { anchor: "end", size: 11, tone: p === o.p ? "accent" : "soft" }));
    }
    branches.forEach((b, i) => {
      const idx = branches.filter((x) => x.p === b.p).indexOf(b);
      const tone: Tone = o.final ? (b.add ? "strong" : "muted") : o.hot?.includes(i) ? "accent" : b.add === 0 ? "muted" : "plain";
      items.push(box(`br${b.p}_${b.d}`, slotX(idx, BX, BW, 6), RY(b.p), BW, RH, b.text, tone, 11));
    });
    if (o.showTable) {
      items.push(note("tl", "free[k][r]: k free digits with sum r", 0, TY - 26, { size: 11, tone: "soft", mono: false }));
      for (let r = 0; r <= S; r++) items.push(note(`th${r}`, `r=${r}`, slotMid(r, TX, TS, 4), TY - 9, { anchor: "middle", size: 10, tone: "faint" }));
      free.forEach((rowV, k) => {
        items.push(note(`tk${k}`, `k=${k}`, TX - 8, TY + k * (TS + 4) + TS / 2, { anchor: "end", size: 11, tone: "soft" }));
        rowV.forEach((v, r) => items.push(box(`f${k}_${r}`, slotX(r, TX, TS, 4), TY + k * (TS + 4), TS, TS, String(v), o.cell?.some(([a, b]) => a === k && b === r) ? "accent" : "plain", 12)));
      });
    }
    return items;
  };

  frames.push({
    caption: `Count the numbers from 0 to ${N} whose digits sum to ${S}. Build each one digit by digit from the left, as a state (position, sum so far, tight): tight means the prefix still equals ${N}'s, so the next digit may not exceed ${N}'s digit there.`,
    items: draw({ p: 0 }),
  });
  frames.push({
    caption: `Once a digit goes below ${N}'s, the rest is free: any digits at all. So precompute free[k][r], the ways k free digits can sum to r, by adding the last digit: free[k][r] = free[k−1][r] + free[k−1][r−1] + … + free[k−1][r−9].`,
    items: draw({ showTable: true, cell: free[L - 1].map((_, r) => [L - 1, r] as [number, number]) }),
  });
  let sum = 0;
  for (let p = 0; p < L; p++) {
    const left = L - 1 - p;
    for (let dd = 0; dd <= digits[p]; dd++) {
      if (dd < digits[p]) {
        const need = S - sum - dd;
        const add = need >= 0 ? free[left][need] : 0;
        branches.push({ p, d: dd, text: `${dd} → +${add}`, add });
        count += add;
        // Branches with nothing to add at the last position are shown together in one frame.
        if (left === 0 && dd < digits[p] - 1) continue;
        const group = left === 0 ? branches.filter((b) => b.p === p && b.d < digits[p]) : [branches[branches.length - 1]];
        const prefix = digits.slice(0, p).join("");
        let caption: string;
        if (left === 0) {
          const parts = group.map((b) => (S - sum - b.d < 0 ? `${b.d} overshoots ${S}` : `${b.d} needs ${S - sum - b.d} more with no digits left, ${b.add ? "which works" : "impossible"}`));
          const hits = group.filter((b) => b.add).map((b) => `${prefix}${b.d}`);
          caption = `At position ${p} (sum ${sum}, tight), digits 0 to ${digits[p] - 1} finish the number: ${parts.join("; ")}. That adds ${hits.length}${hits.length ? ` (${and(hits)})` : ""}.`;
        } else
          caption = `At position ${p} (sum ${sum}, tight), choose ${dd}, below ${N}'s ${digits[p]}: the number is no longer tight, and its ${left} remaining digit${left === 1 ? "" : "s"} must sum to ${S} − ${sum} − ${dd} = ${need}. free[${left}][${need}] = ${add}${add <= 5 ? ` (${brute.filter((v) => String(v).padStart(L, "0").startsWith(`${prefix}${dd}`)).map((v) => String(v).padStart(L, "0")).join(", ")})` : ""}.`;
        frames.push({ caption, items: draw({ p, hot: group.map((b) => branches.indexOf(b)), cell: need >= 0 && left > 0 ? [[left, need]] : group.filter((b) => S - sum - b.d >= 0).map((b) => [0, S - sum - b.d] as [number, number]), showTable: true }) });
      } else {
        branches.push({ p, d: dd, text: `${dd} → tight`, add: null });
        sum += dd;
        const end = p === L - 1;
        if (end) branches.push({ p: L, d: 0, text: `${sum} ${sum === S ? "=" : "≠"} ${S} → +${sum === S ? 1 : 0}`, add: sum === S ? 1 : 0 });
        if (end && sum === S) count += 1;
        frames.push({
          caption: end
            ? `Choosing ${dd}, ${N}'s own digit, keeps the number tight to the very end: it is ${N} itself, whose digit sum is ${sum}, ${sum === S ? `equal to ${S}, so it counts` : `not ${S}, so it adds 0`}.`
            : `Choosing ${dd}, ${N}'s own digit, keeps the number tight: the next position is still capped. The state becomes (position ${p + 1}, sum ${sum}, tight).`,
          items: draw({ p: end ? undefined : p + 1, hot: [branches.length - 1, ...(end ? [branches.length - 2] : [])], showTable: true }),
        });
      }
    }
  }
  if (count !== brute.length) throw new Error(`digit-dp: counted ${count}, brute force ${brute.length}`);
  frames.push({
    caption: `count = ${count}: ${brute.join(", ")}. Only one state per position stays tight and every free branch is a table lookup, so the work is O(digits × S × 10) instead of checking all ${N + 1} numbers.`,
    items: draw({ final: true, showTable: true }),
  });
  return finish({ title: "Counting numbers up to N with a given digit sum, with digit DP", input: `N = ${N}, S = ${S}: how many x in [0, ${N}] have digit sum ${S}?`, frames });
}

/* ── bitmask: every subset's sum from a smaller mask ───────────────── */

export function subsetSums(): Walkthrough {
  const nums = [3, 5, 1];
  const n = nums.length;
  const target = 6;
  const total = 1 << n;
  const sum: Array<number | null> = Array.from({ length: total }, () => null);
  sum[0] = 0;
  const bin = (m: number) => m.toString(2).padStart(n, "0");
  const members = (m: number) => nums.map((_, j) => j).filter((j) => m & (1 << j));
  const MY = 112;
  const MW = 44;
  const MG = 8;
  const mid = (m: number) => slotMid(m, 0, MW, MG);
  const frames: Frame[] = [];

  const draw = (o: { m?: number; final?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("nl", "nums", -12, 0)];
    const m = o.m;
    const low = m === undefined ? -1 : Math.log2(m & -m);
    items.push(...row("x", nums, { tone: (j) => (m !== undefined && m & (1 << j) ? "accent" : "plain") }));
    nums.forEach((_, j) => items.push(note(`bt${j}`, `bit ${j}`, slotMid(j), 51, { anchor: "middle", tone: "faint", size: 10 })));
    if (m !== undefined) items.push(over("low", low, "lowest bit", { tone: "accent" }));
    items.push(rowLabel("ml", "sum", -12, MY, MW));
    for (let k = 0; k < total; k++) {
      items.push(note(`b${k}`, bin(k), mid(k), MY - 10, { anchor: "middle", size: 11, tone: k === m ? "accent" : "faint" }));
      const src = m === undefined ? -1 : m & (m - 1);
      const tone: Tone = o.final ? (sum[k] === target ? "strong" : "plain") : k === m ? "strong" : k === src ? "accent" : sum[k] === null ? "ghost" : "plain";
      items.push(box(`s${k}`, slotX(k, 0, MW, MG), MY, MW, MW, sum[k] === null ? "" : String(sum[k]), tone));
    }
    if (m !== undefined) {
      const src = m & (m - 1);
      const chord = mid(m) - mid(src);
      items.push({ k: "edge", id: "arc", x1: mid(src), y1: MY + MW + 2, x2: mid(m), y2: MY + MW + 3, bow: Math.min(52, 26 + chord * 0.12), arrow: true, tone: "accent", label: `+${nums[low]}` });
      items.push(note("rd", `sum[${bin(m)}] = sum[${bin(src)}] + nums[${low}] = ${sum[src]} + ${nums[low]} = ${sum[m]}`, 0, MY + MW + 70, { size: 12, weight: 600 }));
    } else if (o.final) items.push(note("rd", `sum = ${target}: ${Array.from({ length: total }, (_, k) => k).filter((k) => sum[k] === target).map((k) => `mask ${bin(k)} = {${members(k).map((j) => nums[j]).join(", ")}}`).join(", ")}`, 0, MY + MW + 70, { size: 12, weight: 600 }));
    else items.push(note("rd", "sum[mask] = sum[mask & (mask − 1)] + nums[lowest bit]", 0, MY + MW + 70, { size: 12, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `Each subset of ${show(nums)} is a ${n}-bit mask: bit j, counted from the right, set means nums[j] is in, and mask ${bin(0)} is the empty set with sum 0. Clearing a mask's lowest set bit, mask & (mask − 1), gives a smaller mask, which is already done.`,
    items: draw(),
  });
  for (let m = 1; m < total; m++) {
    const low = Math.log2(m & -m);
    const src = m & (m - 1);
    sum[m] = (sum[src] as number) + nums[low];
    const set = `{${members(m).map((j) => nums[j]).join(", ")}}`;
    const srcSet = src ? `{${members(src).map((j) => nums[j]).join(", ")}}` : "the empty set";
    const why =
      m === 1
        ? ` One addition per mask, never a loop over the bits.`
        : m === 2
          ? ` A single-bit mask always comes from ${bin(0)}.`
          : m === 4
            ? ` Going through the masks in increasing order is what makes this safe: mask & (mask − 1) is always smaller, so it is always done.`
          : m === total - 1
            ? ` The last mask, the whole set, reuses ${bin(src)} like every other.`
            : "";
    frames.push({
      caption: `mask ${bin(m)} = ${set}: its lowest set bit is bit ${low} (nums[${low}] = ${nums[low]}), and without it the mask is ${bin(src)}, ${srcSet}, already known to sum to ${sum[src]}. So sum[${bin(m)}] = ${sum[src]} + ${nums[low]} = ${sum[m]}.${why}`,
      items: draw({ m }),
    });
  }
  const hits = Array.from({ length: total }, (_, k) => k).filter((k) => sum[k] === target);
  frames.push({
    caption: `All ${total} subset sums came from one addition each: O(2ⁿ), not O(n·2ⁿ) for re-adding every subset. Any question about subsets is now a lookup: ${hits.map((k) => `${bin(k)} = {${members(k).map((j) => nums[j]).join(", ")}}`).join(" and ")} ${hits.length === 1 ? "is the only one" : "are the ones"} summing to ${target}.`,
    items: draw({ final: true }),
  });
  return finish({ title: "Every subset's sum from a smaller subset, with bitmask DP", input: `nums = ${show(nums)}; which subsets sum to ${target}?`, frames });
}

export const WALKTHROUGHS: Record<string, () => Walkthrough> = {
  graph: adjacencyList,
  "depth-first-search": depthFirstSearch,
  "topological-sort": topologicalSort,
  "shortest-path": dijkstra,
  "minimum-spanning-tree": kruskal,
  "union-find": unionFind,
  "biconnected-component": articulationPoints,
  matrix: rotateMatrix,
  simulation: robotSimulation,
  "dynamic-programming": houseRobber,
  memoization: memoizedFibonacci,
  "digit-dp": digitSumCount,
  bitmask: subsetSums,
};
