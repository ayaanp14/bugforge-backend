import { and, finish, link, note, row, rowLabel, show, slotMid, slotX, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { grid, label, region } from "./kit.js";

/**
 * Union-Find (Disjoint Set Union): the lesson's figures
 * (content/roadmap/union-find.md places each with "@figure <name>").
 * Every forest is drawn from a real parent array that the real find and
 * union below have just changed, with the array mirrored underneath it, so
 * the picture and the numbers can never disagree.
 */

type Pt = { x: number; y: number };

const R = 16;
/** An array slot plus its gap, as core's row() lays it out. */
const SLOT = 46;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** The root of x, walking parent pointers without changing them. */
const rootOf = (parent: readonly number[], x: number): number => (parent[x] === x ? x : rootOf(parent, parent[x]));
/** The path find(x) walks, x first and the root last. */
function walk(parent: readonly number[], x: number): number[] {
  const path = [x];
  while (parent[path[path.length - 1]] !== path[path.length - 1]) path.push(parent[path[path.length - 1]]);
  return path;
}
/** How many links x is below its root. */
const depthOf = (parent: readonly number[], x: number) => walk(parent, x).length - 1;

/**
 * Each node's centre in a forest drawn from a parent array: one tidy tree
 * per root, roots left to right in index order, children under their
 * parent in index order, `gap` extra between trees, the whole forest
 * centred on `cx` with its roots at height `y`.
 */
function forestLayout(parent: readonly number[], o: { dx?: number; dy?: number; cx?: number; y?: number; gap?: number; only?: readonly number[] } = {}): (i: number) => Pt {
  const { dx = SLOT, dy = 54, cx = 0, y = 0, gap = 0 } = o;
  const nodes = o.only ?? range(parent.length);
  const kids = (k: number) => nodes.filter((i) => parent[i] === k && i !== k);
  const roots = nodes.filter((i) => parent[i] === i);
  const at = new Map<number, Pt>();
  let offset = 0;
  for (const r of roots) {
    const t = treeLayout<number>(r, kids, { dx, dy });
    let max = 0;
    for (const [k, p] of t) {
      at.set(k, { x: p.x + offset, y: p.y });
      max = Math.max(max, p.x);
    }
    offset += max + dx + gap;
  }
  const xs = [...at.values()].map((p) => p.x);
  const shift = cx - (Math.min(...xs) + Math.max(...xs)) / 2;
  return (i: number) => {
    const p = at.get(i) as Pt;
    return { x: p.x + shift, y: p.y + y };
  };
}

/** A forest's arrows (child to parent) and nodes. Edge ids follow the child, so a re-pointed node's arrow glides to its new parent. */
function forestItems(prefix: string, parent: readonly number[], at: (i: number) => Pt, o: { tone?: (i: number) => Tone | undefined; edgeTone?: (child: number) => LineTone | undefined; only?: readonly number[]; r?: number; name?: (i: number) => string } = {}): Item[] {
  const nodes = o.only ?? range(parent.length);
  const r = o.r ?? R;
  const items: Item[] = [];
  for (const i of nodes) if (parent[i] !== i) items.push(link(`${prefix}e${i}`, at(i), at(parent[i]), r, { arrow: true, tone: o.edgeTone?.(i) ?? "line" }));
  for (const i of nodes) items.push({ k: "node", id: `${prefix}${i}`, x: at(i).x, y: at(i).y, r, text: o.name ? o.name(i) : String(i), tone: o.tone?.(i) ?? "plain" });
  return items;
}

/** The parent array as a row of cells with its indices, labelled on the left. */
function parentRow(prefix: string, parent: readonly number[], y: number, tone?: (i: number) => Tone | undefined): Item[] {
  return [rowLabel(`${prefix}l`, "parent", -10, y), ...row(prefix, parent, { y, index: true, tone })];
}

const arrayMid = (n: number) => (slotX(n - 1) + slotX(0) + 40) / 2;

/** A number in superscript digits: 2 and 3 as 2³. */
const sup = (k: number) => String(k).replace(/\d/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]);

/* ── The idea: every set is a tree ─────────────────────────────────── */

/** Two sets as two trees in one parent array, and the walk find(3) takes to its root. */
function forest(): Walkthrough {
  const parent = [0, 0, 0, 2, 4, 4];
  const n = parent.length;
  const x = 3;
  const path = walk(parent, x);
  const root = path[path.length - 1];
  const at = forestLayout(parent, { dx: 60, dy: 60, gap: 40, cx: arrayMid(n) });
  const roots = range(n).filter((i) => parent[i] === i);
  const members = (r: number) => range(n).filter((i) => rootOf(parent, i) === r);
  const items: Item[] = [];
  // A dashed outline round each tree, named by its members and its root.
  for (const r of roots) {
    const ps = members(r).map(at);
    const x1 = Math.min(...ps.map((p) => p.x)) - R - 12;
    const x2 = Math.max(...ps.map((p) => p.x)) + R + 12;
    const y1 = Math.min(...ps.map((p) => p.y)) - R - 10;
    const y2 = Math.max(...ps.map((p) => p.y)) + R + 10;
    items.push(...region(`set${r}`, x1, y1, x2 - x1, y2 - y1, `{${members(r).join(", ")}}, root ${r}`, { labelTone: r === root ? "accent" : "soft" }));
  }
  const onPath = (i: number) => path.includes(i);
  items.push(
    ...forestItems("n", parent, at, {
      tone: (i) => (i === root ? "strong" : onPath(i) ? "accent" : "plain"),
      edgeTone: (i) => (onPath(i) && onPath(parent[i]) ? "accent" : "line"),
    }),
  );
  const PY = 186;
  items.push(...parentRow("p", parent, PY, (i) => (i === root ? "strong" : onPath(i) ? "accent" : "plain")));
  items.push(note("find", `find(${x}): ${path.join(" → ")}, so ${x} is in the set named ${root}`, 0, PY + 76, { size: 12, weight: 600 }));
  return finish({
    title: "Every set is a tree, stored as one parent array",
    input: "",
    frames: [
      {
        caption: `Each set is a tree, and parent[x] is one step from x towards its root; a root is its own parent (parent[${roots[0]}] = ${roots[0]}, parent[${roots[1]}] = ${roots[1]}). The root names the set: find(${x}) follows ${path.join(" → ")}, so ${x} belongs to the set named ${root}.`,
        items,
      },
    ],
  });
}

/* ── Keeping the trees short ───────────────────────────────────────── */

/** The same unions twice: always the second root under the first builds a chain; union by size builds a star. */
function chainVsSize(): Walkthrough {
  const n = 5;
  const ops: Array<[number, number]> = [[1, 0], [2, 1], [3, 2], [4, 3]];
  const naive = range(n);
  const sized = range(n);
  const size = Array(n).fill(1);
  const W = 200;
  const LX = W / 2;
  const RX = W + 50 + W / 2;
  const opts = { dx: 42, dy: 52, y: 0 };
  const frames: Frame[] = [];
  const height = (p: readonly number[]) => Math.max(...range(n).map((i) => depthOf(p, i)));

  const draw = (o: { fresh?: [number, number]; roots?: [number[], number[]] } = {}): Item[] => {
    const items: Item[] = [
      label("tl", "second root under the first", LX, -40, { tone: "ink", weight: 600, size: 12 }),
      label("tr", "union by size", RX, -40, { tone: "ink", weight: 600, size: 12 }),
    ];
    const atL = forestLayout(naive, { ...opts, cx: LX });
    const atR = forestLayout(sized, { ...opts, cx: RX });
    const hot = (side: 0 | 1, i: number) => o.roots?.[side].includes(i);
    items.push(...forestItems("a", naive, atL, { tone: (i) => (hot(0, i) ? "accent" : "plain"), edgeTone: (i) => (o.fresh?.[0] === i ? "accent" : "line") }));
    items.push(...forestItems("b", sized, atR, { tone: (i) => (hot(1, i) ? "accent" : "plain"), edgeTone: (i) => (o.fresh?.[1] === i ? "accent" : "line") }));
    const hl = height(naive);
    const hr = height(sized);
    items.push(note("hl", `tallest path: ${hl} link${hl === 1 ? "" : "s"}`, LX, 254, { anchor: "middle", size: 12, tone: hl > 1 ? "error" : "ink", weight: 600 }));
    items.push(note("hr", `tallest path: ${hr} link${hr === 1 ? "" : "s"}`, RX, 254, { anchor: "middle", size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `The same ${ops.length} unions on ${n} elements, twice. On the left every union hangs the second root under the first, whatever the sizes. On the right, union by size hangs the smaller tree under the larger root.`,
    items: draw(),
  });
  ops.forEach(([a, b], k) => {
    // Left: no size check at all.
    const la = rootOf(naive, a);
    const lb = rootOf(naive, b);
    naive[lb] = la;
    // Right: the program's rule, ties to the first root.
    let ra = rootOf(sized, a);
    let rb = rootOf(sized, b);
    const before = [size[ra], size[rb]];
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    sized[rb] = ra;
    size[ra] += size[rb];
    const sunk = range(n).filter((i) => rootOf(naive, i) === la && i !== la);
    let caption: string;
    if (k === 0) caption = `union(${a}, ${b}): two lone nodes, so both sides hang ${lb} under ${la}. So far the rules agree.`;
    else if (k === 1)
      caption = `union(${a}, ${b}): the left hangs root ${lb}, and everything under it, below the lone node ${la}, so ${and(sunk.filter((i) => i !== lb).map(String))} sink${sunk.length > 2 ? "" : "s"} a level too. The right compares sizes ${before[0]} and ${before[1]} and hangs ${rb} under ${ra} instead.`;
    else if (k === 2) caption = `union(${a}, ${b}): the same again. Each union pushes the whole left tree one level down, to ${height(naive)} links now; the right only adds ${rb} as one more leaf of root ${ra}.`;
    else if (k < ops.length - 1) caption = `union(${a}, ${b}): ${height(naive)} links on the left and still ${height(sized)} on the right. Without a size check the shape is left to the order of the calls, and this order is the worst.`;
    else {
      const fl = depthOf(naive, 0);
      const fr = depthOf(sized, 0);
      caption = `After ${ops.length} unions the left is a chain: find(0) walks ${fl} links, no faster than a list. The right is a star: find(0) takes ${fr}. Every find costs the depth of the tree, so short trees are the whole game.`;
    }
    frames.push({ caption, items: draw({ fresh: [lb, rb], roots: [[la], [ra]] }) });
  });
  return finish({ title: "Why the smaller tree goes under the larger one", input: `n = ${n}; ${ops.map(([a, b]) => `union(${a}, ${b})`).join(", ")}`, frames });
}

/** Union by size in its worst case: element 7 sinks one level per round, and its set doubles every time it does. */
function doubling(): Walkthrough {
  const n = 8;
  const rounds: Array<Array<[number, number]>> = [
    [[0, 1], [2, 3], [4, 5], [6, 7]],
    [[0, 2], [4, 6]],
    [[0, 4]],
  ];
  const watch = 7;
  const parent = range(n);
  const size = Array(n).fill(1);
  const union = (a: number, b: number) => {
    let ra = rootOf(parent, a);
    let rb = rootOf(parent, b);
    if (ra === rb) return;
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
  };
  const G = { x: 90, y: 236, w: 58, h: 28, gap: 3 };
  const history: Array<[number, number]> = [[depthOf(parent, watch), size[rootOf(parent, watch)]]];
  const frames: Frame[] = [];

  const draw = (final = false): Item[] => {
    const at = forestLayout(parent, { dx: 50, dy: 54, cx: 175, y: 10 });
    const r = rootOf(parent, watch);
    const path = walk(parent, watch);
    const items: Item[] = forestItems("n", parent, at, {
      tone: (i) => (i === watch ? "strong" : rootOf(parent, i) === r ? "accent" : "plain"),
      edgeTone: (i) => (path.includes(i) && i !== r ? "accent" : "line"),
    });
    // The record so far, one column per round: how deep the watched node sits, and how big its set is.
    items.push(
      ...grid("t", [history.map(([d]) => d), history.map(([, s]) => s)], {
        ...G,
        rowLabels: [`depth of ${watch}`, "its set"],
        colLabels: history.map((_, k) => (k === 0 ? "start" : `round ${k}`)),
        tone: (_, c) => (final ? "plain" : c === history.length - 1 ? "accent" : "plain"),
      }),
    );
    if (final) {
      const [d, s] = history[history.length - 1];
      items.push(note("rd", `${d} sinks, each doubling: ${s} = 2${sup(d)}, so depth ≤ log₂ ${s}`, G.x - 70, G.y + 2 * (G.h + G.gap) + 20, { size: 12, weight: 600 }));
    }
    return items;
  };

  frames.push({
    caption: `Union by size merges ${n} elements in the pattern that builds the tallest trees it can: always two sets of equal size. Follow element ${watch}, and how deep it sits against how big its set is.`,
    items: draw(),
  });
  rounds.forEach((ops, k) => {
    ops.forEach(([a, b]) => union(a, b));
    const d = depthOf(parent, watch);
    const s = size[rootOf(parent, watch)];
    history.push([d, s]);
    const said = and(ops.map(([a, b]) => `union(${a}, ${b})`));
    frames.push({
      caption:
        k === 0
          ? `${said}: ${watch} goes under ${parent[watch]}. It sank one level, and the set it now belongs to has ${s} elements — twice what it had.`
          : `${said}: ${watch}'s whole tree goes under an equal one, so ${watch} sinks to depth ${d} and its set doubles to ${s}.`,
      items: draw(),
    });
  });
  const [d, s] = history[history.length - 1];
  frames.push({
    caption: `A node sinks only when its tree goes under one at least as big, so every sink at least doubles its set. A set of ${s} allows ${d} doublings; a million elements allow 20. No find is ever longer than log₂ n links.`,
    items: draw(true),
  });
  return finish({ title: "Why union by size keeps every tree within log₂ n levels", input: `n = ${n}; pairs, then pairs of pairs, then halves`, frames });
}

/** Path compression: one find on a tall path points every node it passed straight at the root. */
function compression(): Walkthrough {
  // A tall tree, the kind unions without a size check build: 4 hangs four links below the root.
  const start = [0, 0, 1, 2, 3, 3, 1];
  const parent = [...start];
  const n = parent.length;
  const frames: Frame[] = [];
  const PY = 268;

  const draw = (o: { path?: number[]; changed?: number[]; root?: number } = {}): Item[] => {
    const at = forestLayout(parent, { dx: 52, dy: 54, cx: arrayMid(n), y: 0 });
    const items = forestItems("n", parent, at, {
      tone: (i) => (i === o.root ? "strong" : o.path?.includes(i) ? "accent" : "plain"),
      edgeTone: (i) => (o.changed?.includes(i) || (o.path?.includes(i) && o.path.includes(parent[i])) ? "accent" : "line"),
    });
    items.push(...parentRow("p", parent, PY, (i) => (o.changed?.includes(i) ? "accent" : "plain")));
    return items;
  };
  const find = (x: number) => {
    const path = walk(parent, x);
    const root = path[path.length - 1];
    const changed = path.filter((v) => v !== root && parent[v] !== root);
    for (const v of changed) parent[v] = root;
    return { path, root, changed };
  };

  const first = 4;
  const deep = walk(parent, first);
  frames.push({
    caption: `A tall tree, the kind unions build without a size check. find(${first}) has to climb ${deep.length - 1} links to reach the root, ${deep[deep.length - 1]} — and without help, every later find(${first}) would climb them all again.`,
    items: draw(),
  });
  frames.push({
    caption: `find(${first}) walks ${deep.join(" → ")} and learns the root. Every node on that walk is in the root's set, whichever route it takes — so it can point straight at the root instead.`,
    items: draw({ path: deep, root: deep[deep.length - 1] }),
  });
  const before5 = depthOf(parent, 5);
  const f = find(first);
  const after5 = depthOf(parent, 5);
  frames.push({
    caption: `Path compression does exactly that on the way back: ${f.changed.map((v) => `parent[${v}]`).join(", ")} become ${f.root}. Node 5 rode along with 3: its depth fell from ${before5} to ${after5} without being touched.`,
    items: draw({ changed: f.changed, root: f.root }),
  });
  const g = find(5);
  const tallest = Math.max(...range(n).map((i) => depthOf(parent, i)));
  frames.push({
    caption: `The next find(5) walks only ${g.path.join(" → ")} and flattens that too. A slow find pays for itself: now no node is more than ${tallest} links from the root, and the paths it walked are one hop for good.`,
    items: draw({ path: g.path, changed: g.changed, root: g.root }),
  });
  return finish({ title: "Path compression flattens every path a find walks", input: `parent = ${show(start)}`, frames });
}

/* ── Dry run of the first program ──────────────────────────────────── */

function dryRun(): Walkthrough {
  const n = 8;
  type Op = ["union" | "connected", number, number];
  const ops: Op[] = [
    ["union", 0, 1], ["union", 2, 3], ["union", 1, 3], ["union", 4, 5], ["union", 6, 7], ["union", 5, 7], ["union", 3, 0],
    ["connected", 7, 4], ["connected", 1, 6],
  ];
  const parent = range(n);
  const size = Array(n).fill(1);
  let sets = n;
  const PY = 164;
  const frames: Frame[] = [];
  const printed: string[] = [];

  const find = (x: number) => {
    const path = walk(parent, x);
    const root = path[path.length - 1];
    const moved = path.filter((v) => v !== root && parent[v] !== root);
    for (const v of moved) parent[v] = root;
    return { path, root, moved };
  };
  const draw = (o: { path?: number[]; roots?: number[]; fresh?: number; changed?: number[]; final?: boolean } = {}): Item[] => {
    const at = forestLayout(parent, { dx: SLOT, dy: 54, cx: arrayMid(n), y: 0 });
    const items = forestItems("n", parent, at, {
      tone: (i) => (o.roots?.includes(i) ? "strong" : o.path?.includes(i) ? "accent" : "plain"),
      edgeTone: (i) => (i === o.fresh || o.changed?.includes(i) ? "accent" : "line"),
    });
    items.push(...parentRow("p", parent, PY, (i) => (o.changed?.includes(i) || i === o.fresh ? "accent" : o.final && parent[i] === i ? "strong" : "plain")));
    items.push(note("sets", `sets: ${sets}`, slotX(n - 1) + 40, PY - 24, { anchor: "end", size: 12, tone: "soft" }));
    if (printed.length) items.push(note("out", printed[printed.length - 1], 0, PY + 72, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `The first program on ${n} elements. Each starts as its own root, so there are ${n} sets. Ties in size go the same way every time: the second root goes under the first.`,
    items: draw(),
  });
  ops.forEach(([op, a, b], k) => {
    const fa = find(a);
    const fb = find(b);
    const moved = [...fa.moved, ...fb.moved];
    const walks = [fa, fb]
      .map((f, j) => (f.path.length === 1 ? `find(${[a, b][j]}) = ${f.root}` : `find(${[a, b][j]}) walks ${f.path.join(" → ")}`))
      .join(" and ");
    const compressed = moved.length ? ` Path compression re-points ${and(moved.map(String))} straight at ${parent[moved[0]]}.` : "";
    if (op === "connected") {
      const yes = fa.root === fb.root;
      printed.push(`connected(${a}, ${b}) = ${yes}`);
      const last = k === ops.length - 1;
      frames.push({
        caption: last
          ? `connected(${a}, ${b}): ${walks}: different roots, so false. Every element now points straight at its root, ${show(parent)}, so any later find is one hop.`
          : `connected(${a}, ${b}): ${walks}.${compressed} Same root, ${fa.root}: true.`,
        items: draw({ path: [...fa.path, ...fb.path], roots: [fa.root, fb.root], changed: moved, final: last }),
      });
      return;
    }
    if (fa.root === fb.root) {
      printed.push(`union(${a}, ${b}): already in one set`);
      frames.push({
        caption: `union(${a}, ${b}): ${walks}.${compressed} Both roots are ${fa.root}, so nothing merges — but the find still flattened the path it walked.`,
        items: draw({ path: [...fa.path, ...fb.path], roots: [fa.root], changed: moved }),
      });
      return;
    }
    let ra = fa.root;
    let rb = fb.root;
    const sizes = [size[ra], size[rb]];
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
    sets--;
    printed.push(`union(${a}, ${b}): merged, ${sets} sets left`);
    const rule =
      sizes[0] === sizes[1]
        ? sizes[0] === 1
          ? `two lone roots, so ${rb} goes under ${ra}`
          : `sizes ${sizes[0]} and ${sizes[1]} tie, so root ${rb} goes under ${ra}, taking its whole tree along`
        : `size ${size[ra] - size[rb]} beats ${size[rb]}, so ${rb} goes under ${ra}`;
    frames.push({
      caption: `union(${a}, ${b}): ${walks}: ${rule}. ${sets} sets left.`,
      items: draw({ path: [...fa.path, ...fb.path], roots: [ra], fresh: rb, changed: moved }),
    });
  });
  return finish({ title: "The first program, one operation at a time", input: ops.map(([op, a, b]) => `${op}(${a}, ${b})`).join(", "), frames });
}

/* ── Finding the edge that closes a cycle ──────────────────────────── */

function cycle(): Walkthrough {
  const edges: Array<[number, number]> = [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]];
  const n = edges.length;
  const names = range(n + 1).map(String);
  const parent = range(n + 1);
  const size = Array(n + 1).fill(1);
  const find = (x: number) => rootOf(parent, x);
  const pos: Record<number, Pt> = { 1: { x: 100, y: 0 }, 2: { x: 210, y: 0 }, 3: { x: 210, y: 104 }, 4: { x: 100, y: 104 }, 5: { x: 0, y: 0 } };
  const nodes = range(n).map((i) => i + 1);
  const status = new Map<number, "kept" | "cycle">();
  const PY = 172;
  const PX = 0;
  const frames: Frame[] = [];

  const draw = (o: { cur?: number; moved?: number; done?: boolean; cyc?: number[] } = {}): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b], i) => {
      const s = status.get(i);
      const tone: LineTone = s === "cycle" ? "error" : i === o.cur || o.cyc?.includes(i) ? "accent" : s === "kept" ? "ink" : "faint";
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone, dashed: !s }));
    });
    for (const v of nodes) {
      const tone: Tone = o.cur !== undefined && edges[o.cur].includes(v) ? "accent" : "plain";
      items.push({ k: "node", id: `n${v}`, x: pos[v].x, y: pos[v].y, r: R, text: names[v], tone });
    }
    // parent[1..n]: slot 0 is unused because the labels start at 1.
    items.push(rowLabel("pl", "parent", PX - 10, PY));
    items.push(...row("p", nodes.map((v) => parent[v]), { x: PX, y: PY, tone: (k) => (nodes[k] === o.moved ? "accent" : "plain") }));
    nodes.forEach((v, k) => items.push(label(`pi${k}`, String(v), slotMid(k, PX), PY + 51, { tone: "faint", size: 10.5, mono: true })));
    if (o.done) items.push(note("ans", `answer: [${edges[o.cur as number].join(", ")}]`, PX, PY + 78, { weight: 600, size: 12 }));
    return items;
  };

  frames.push({
    caption: `A tree on nodes 1 to ${n} plus one extra edge; the dashed edges are still to be read, in order. Union each edge's ends as it comes, and watch for the first union that fails.`,
    items: draw(),
  });
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    let ra = find(a);
    let rb = find(b);
    const roots = [ra, rb];
    if (ra === rb) {
      status.set(i, "cycle");
      // The cycle it closes: this edge plus the kept edges on the path between its ends.
      const adj = new Map<number, number[]>();
      edges.forEach(([x, y], j) => {
        if (status.get(j) !== "kept") return;
        adj.set(x, [...(adj.get(x) ?? []), y]);
        adj.set(y, [...(adj.get(y) ?? []), x]);
      });
      const prev = new Map<number, number>([[a, -1]]);
      const queue = [a];
      while (queue.length) {
        const u = queue.shift() as number;
        for (const v of adj.get(u) ?? []) if (!prev.has(v)) (prev.set(v, u), queue.push(v));
      }
      const route: number[] = [];
      for (let v = b; v !== -1; v = prev.get(v) as number) route.unshift(v);
      const cyc = edges.map((_, j) => j).filter((j) => status.get(j) === "kept" && route.some((v, k) => k > 0 && edges[j].includes(v) && edges[j].includes(route[k - 1])));
      const unread = edges.slice(i + 1).map((e) => `[${e.join(", ")}]`);
      frames.push({
        caption: `[${a}, ${b}]: find(${a}) = ${ra} and find(${b}) = ${rb}, the same root. ${a} and ${b} were already joined by ${route.join("–")}, so this edge closes the cycle and is the answer. ${and(unread)} ${unread.length === 1 ? "is" : "are"} never read.`,
        items: draw({ cur: i, done: true, cyc }),
      });
      break;
    }
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
    status.set(i, "kept");
    frames.push({
      caption:
        i === 0
          ? `[${a}, ${b}]: find(${a}) = ${roots[0]} and find(${b}) = ${roots[1]}, different roots, so no path joins them yet and the edge cannot close a cycle. Union: parent[${rb}] = ${ra}.`
          : `[${a}, ${b}]: find(${a}) = ${roots[0]} and find(${b}) = ${roots[1]} differ, so the edge joins two separate sets. Union: parent[${rb}] = ${ra}, and the set of ${ra} is now {${nodes.filter((v) => find(v) === ra).join(", ")}}.`,
      items: draw({ cur: i, moved: rb }),
    });
  }
  return finish({ title: "Redundant Connection: the first union that fails closes the cycle", input: `edges = ${show(edges.map((e) => `[${e.join(", ")}]`))}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  forest,
  "chain-vs-size": chainVsSize,
  doubling,
  compression,
  "dry-run": dryRun,
  cycle,
};
