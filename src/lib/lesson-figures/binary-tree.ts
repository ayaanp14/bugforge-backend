import { and, finish, link, note, over, rowLabel, show, slotMid, slotX, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, binaryTree, box, label, type Pt } from "./kit.js";

/**
 * Binary Trees and Tree Traversals: the lesson's figures
 * (content/roadmap/binary-tree.md places each with "@figure <name>").
 *
 * Almost every figure uses the lesson's own example, the tree whose
 * level-order listing is [1, 2, 3, 4, 5, null, 6, null, null, 7]: the
 * generators build it with the lesson's queue builder and then run the
 * real traversal on it, recording a frame at each step. Node ids are the
 * values (`n7`), so a node keeps its place and colour between frames.
 */

const LISTING: ReadonlyArray<number | null> = [1, 2, 3, 4, 5, null, 6, null, null, 7];

type TNode = { val: number; left: TNode | null; right: TNode | null };
type BuildStep = { taken: number; read: number[]; left: number | null; right: number | null; queue: number[]; next: number };

/** The lesson's builder: nodes receive their children in creation order, so a queue. Records each step it takes. */
function build(arr: ReadonlyArray<number | null>): { root: TNode; steps: BuildStep[]; nodes: Map<number, TNode> } {
  const nodes = new Map<number, TNode>();
  const make = (v: number): TNode => {
    const n: TNode = { val: v, left: null, right: null };
    nodes.set(v, n);
    return n;
  };
  const root = make(arr[0] as number);
  const q: TNode[] = [root];
  const steps: BuildStep[] = [];
  let i = 1;
  while (q.length && i < arr.length) {
    const node = q.shift()!;
    const read = [i];
    const a = arr[i];
    if (a !== null) {
      node.left = make(a);
      q.push(node.left);
    }
    i++;
    if (i < arr.length) {
      read.push(i);
      const b = arr[i];
      if (b !== null) {
        node.right = make(b);
        q.push(node.right);
      }
    }
    i++;
    steps.push({ taken: node.val, read, left: node.left?.val ?? null, right: node.right?.val ?? null, queue: q.map((n) => n.val), next: i });
  }
  return { root, steps, nodes };
}

/** Each value's centre, laid out tidily by kit.binaryTree from the listing. */
function placeTree(dx: number, dy: number): Map<number, Pt> {
  const { pos } = binaryTree("_", LISTING, { dx, dy });
  const at = new Map<number, Pt>();
  for (const [i, p] of pos) at.set(LISTING[i] as number, p);
  return at;
}

/** Shift every centre by (dx, dy). */
const moved = (at: Map<number, Pt>, dx: number, dy: number) => new Map([...at].map(([v, p]) => [v, { x: p.x + dx, y: p.y + dy }]));

const preorderNodes = (n: TNode | null, out: TNode[] = []): TNode[] => {
  if (n) {
    out.push(n);
    preorderNodes(n.left, out);
    preorderNodes(n.right, out);
  }
  return out;
};

const depthsOf = (root: TNode): Map<number, number> => {
  const d = new Map<number, number>();
  const go = (n: TNode | null, k: number) => {
    if (!n) return;
    d.set(n.val, k);
    go(n.left, k + 1);
    go(n.right, k + 1);
  };
  go(root, 0);
  return d;
};

/** Edges (parent → child, trimmed to the rims) under the nodes; ids `e<child>` and `n<value>`. */
function drawTree(root: TNode, at: Map<number, Pt>, o: { r: number; tone?: (v: number) => Tone; edge?: (child: number) => LineTone | null; keep?: (v: number) => boolean; size?: number }): Item[] {
  const keep = o.keep ?? (() => true);
  const all = preorderNodes(root).filter((n) => keep(n.val));
  const items: Item[] = [];
  for (const n of all) {
    for (const c of [n.left, n.right]) {
      if (!c || !keep(c.val)) continue;
      const tone = o.edge ? o.edge(c.val) : "line";
      if (tone) items.push(link(`e${c.val}`, at.get(n.val)!, at.get(c.val)!, o.r, { tone }));
    }
  }
  for (const n of all) {
    const p = at.get(n.val)!;
    const node: Item = { k: "node", id: `n${n.val}`, x: p.x, y: p.y, r: o.r, text: String(n.val), tone: o.tone?.(n.val) ?? "plain" };
    items.push(o.size ? { ...node, size: o.size } : node);
  }
  return items;
}

/* ── The vocabulary ───────────────────────────────────────────────── */

function vocabulary(): Walkthrough {
  const { root, nodes } = build(LISTING);
  const R = 18;
  const DY = 62;
  const at = placeTree(60, DY);
  const depth = depthsOf(root);
  const height = Math.max(...depth.values());
  const leaves = [...nodes.values()].filter((n) => !n.left && !n.right).map((n) => n.val).sort((a, b) => a - b);
  const SUB = 2;
  const subVals = preorderNodes(nodes.get(SUB)!).map((n) => n.val);
  const xs = [...at.values()].map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  const items: Item[] = [];
  // The subtree of 2, as a band behind it, reaching down far enough to hold its leaf labels.
  const sx = subVals.map((v) => at.get(v)!.x);
  const sy = subVals.map((v) => at.get(v)!.y);
  const bx = Math.min(...sx) - R - 9;
  const by = Math.min(...sy) - R - 9;
  const bw = Math.max(...sx) + R + 9 - bx;
  const bh = Math.max(...sy) + R + 24 - by;
  items.push({ k: "band", id: "sub", x: bx, y: by, w: bw, h: bh, tone: "accent" });
  items.push(label("subl", `subtree of ${SUB}`, bx + 4, by + bh + 13, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
  items.push(...drawTree(root, at, { r: R, tone: (v) => (v === root.val ? "accent" : "plain") }));
  items.push(label("rootl", "root", at.get(root.val)!.x, -R - 11, { tone: "accent", size: 11.5, weight: 600 }));
  for (const v of leaves) items.push(label(`leaf${v}`, "leaf", at.get(v)!.x, at.get(v)!.y + R + 11, { size: 11 }));
  for (let d = 0; d <= height; d++) items.push(label(`d${d}`, `depth ${d}`, minX - R - 22, d * DY, { anchor: "end", tone: "faint", size: 11 }));
  const hx = maxX + R + 40;
  items.push(arrow("h", { x: hx, y: 0 }, { x: hx, y: height * DY }, { tone: "ink", label: `height ${height}` }));
  items.push(arrow("h0", { x: hx - 8, y: 0 }, { x: hx + 8, y: 0 }, { tone: "ink", head: false }));

  return finish({
    title: "The parts of a binary tree",
    input: "",
    frames: [
      {
        caption: `The root, ${root.val}, is the one node with no parent; ${and(leaves.map(String))} are leaves, with no children. Depth counts the edges down from the root, and the tree's height is its largest depth, ${height}. The subtree of ${SUB} is ${SUB} with everything below it: ${and(subVals.map(String))}. ${nodes.size} nodes are joined by ${nodes.size - 1} edges.`,
        items,
      },
    ],
  });
}

/* ── Building from a level-order listing ──────────────────────────── */

function buildFigure(): Walkthrough {
  const { root, steps } = build(LISTING);
  const S = 34;
  const G = 4;
  const R = 17;
  const DY = 56;
  const n = LISTING.length;
  const listW = n * (S + G) - G;
  const tree0 = placeTree(58, DY);
  const xs = [...tree0.values()].map((p) => p.x);
  const TY = S + 58;
  // The tree on the right under the listing, the queue on the left beside it.
  const at = moved(tree0, listW - R - Math.max(...xs), TY);
  const QY = TY + 1.5 * DY - S / 2;
  const created = new Set<number>([root.val]);
  const read = new Set<number>([0]);
  const frames: Frame[] = [];
  const entry = (i: number) => (LISTING[i] === null ? "null" : String(LISTING[i]));

  const draw = (o: { now: number[]; next: number; queue: number[]; taken?: number; fresh?: number[]; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("ll", "listing", -10, 0, S)];
    LISTING.forEach((v, i) => {
      items.push({ k: "cell", id: `L${i}`, x: slotX(i, 0, S, G), y: 0, w: S, h: S, text: v === null ? "null" : String(v), tone: o.now.includes(i) ? "accent" : read.has(i) ? "muted" : "plain", size: v === null ? 10.5 : 14 });
      items.push(note(`Li${i}`, String(i), slotMid(i, 0, S, G), S + 11, { anchor: "middle", tone: "faint", size: 10 }));
    });
    if (!o.done && o.next < n) items.push(over("nx", o.next, "next", { size: S, gap: G, tone: "ink" }));
    const fresh = new Set(o.fresh ?? []);
    items.push(
      ...drawTree(root, at, {
        r: R,
        keep: (v) => created.has(v),
        tone: (v) => (o.done ? "plain" : v === o.taken || fresh.has(v) ? "accent" : "plain"),
        edge: (c) => (fresh.has(c) ? "accent" : "line"),
      }),
    );
    items.push(rowLabel("ql", "queue", -10, QY, S));
    o.queue.forEach((v, k) => items.push({ k: "cell", id: `q${v}`, x: slotX(k, 0, S, G), y: QY, w: S, h: S, text: String(v), tone: fresh.has(v) ? "accent" : "plain" }));
    if (o.queue.length) items.push(note("qf", "front", slotMid(0, 0, S, G), QY + S + 11, { anchor: "middle", tone: "faint", size: 10 }));
    else items.push(note("qe", "empty", 0, QY + S / 2, { tone: "faint", size: 12 }));
    return items;
  };

  frames.push({
    caption: `The first entry, ${root.val}, becomes the root and joins a queue. The listing goes level by level, so nodes receive their children in the order they were created: first in, first out.`,
    items: draw({ now: [0], next: 1, queue: [root.val], taken: root.val }),
  });
  for (const st of steps) {
    const fresh = [st.left, st.right].filter((v): v is number => v !== null);
    for (const v of fresh) created.add(v);
    const t = st.taken;
    let caption: string;
    if (st.read.length === 1) caption = `Take ${t}: only one entry is left, ${entry(st.read[0])}, so ${st.left !== null ? `${st.left} becomes its left child and joins the queue` : `${t} gets no left child`}, and the listing ends there.`;
    else if (st.left !== null && st.right !== null) caption = `Take ${t} from the front of the queue: the next two entries, ${st.left} and ${st.right}, become its left and right children and join the back of the queue.`;
    else if (st.left === null && st.right === null) caption = `Take ${t}: the next two entries are both null, so ${t} gets no children — it is a leaf — and nothing joins the queue.`;
    else if (st.left === null) caption = `Take ${t}: the next two entries are null and ${st.right}, so ${t} has no left child, and ${st.right} becomes its right child and joins the queue.`;
    else caption = `Take ${t}: the next two entries are ${st.left} and null, so ${st.left} becomes its left child and ${t} has no right child.`;
    for (const i of st.read) read.add(i);
    frames.push({ caption, items: draw({ now: st.read, next: st.next, queue: st.queue, taken: t, fresh }) });
  }
  const left = steps[steps.length - 1].queue;
  frames.push({
    caption: `The listing has run out, so ${and(left.map(String))} never receive children: they are leaves. Every entry was read once and every node queued once, so building the tree takes O(n) time.`,
    items: draw({ now: [], next: n, queue: left, done: true }),
  });
  return finish({ title: "Building a tree from its level-order listing, with a queue", input: `listing = [${LISTING.map((v) => (v === null ? "null" : v)).join(", ")}]`, frames });
}

/* ── One walk, three orders ───────────────────────────────────────── */

type Pass = "pre" | "in" | "post";

function euler(): Walkthrough {
  const { root } = build(LISTING);
  const R = 17;
  const D = R + 10;
  const S = 30;
  const G = 5;
  const n = preorderNodes(root).length;
  const rowsW = n * (S + G) - G;
  const tree0 = placeTree(78, 62);
  const xs = [...tree0.values()].map((p) => p.x);
  const at = moved(tree0, rowsW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, 0);
  const maxY = Math.max(...[...at.values()].map((p) => p.y));
  const RY = maxY + D + 40;
  const ROWS: Array<[Pass, string]> = [
    ["pre", "preorder"],
    ["in", "inorder"],
    ["post", "postorder"],
  ];

  // The walk round the outside: each arrival at a node, and the passes it makes there.
  type Arrival = { v: number; how: "start" | "down" | "upLeft" | "upRight"; passes: Pass[] };
  const arrivals: Arrival[] = [];
  const visit = (nd: TNode, how: Arrival["how"]) => {
    const first: Pass[] = ["pre"];
    if (!nd.left) {
      first.push("in");
      if (!nd.right) first.push("post");
    }
    arrivals.push({ v: nd.val, how, passes: first });
    if (nd.left) {
      visit(nd.left, "down");
      arrivals.push({ v: nd.val, how: "upLeft", passes: nd.right ? ["in"] : ["in", "post"] });
    }
    if (nd.right) {
      visit(nd.right, "down");
      arrivals.push({ v: nd.val, how: "upRight", passes: ["post"] });
    }
  };
  visit(root, "start");
  const spot = (v: number, p: Pass): [number, number] => {
    const c = at.get(v)!;
    return p === "pre" ? [c.x - D, c.y] : p === "in" ? [c.x, c.y + D] : [c.x + D, c.y];
  };
  // The route through every pass in order; where the walk turns round one node (left → under → right) a corner point keeps it off the node.
  const route: Array<{ pt: [number, number]; ev: number }> = [];
  let ev = 0;
  let last: { v: number; p: Pass } | null = null;
  for (const a of arrivals) {
    for (const p of a.passes) {
      ev++;
      if (last && last.v === a.v) {
        const c = at.get(a.v)!;
        const k = D * 0.72;
        route.push({ pt: [c.x + (last.p === "pre" ? -k : k), c.y + k], ev });
      }
      route.push({ pt: spot(a.v, p), ev });
      last = { v: a.v, p };
    }
  }
  const all = route.map((r) => r.pt);

  const written: Record<Pass, number[]> = { pre: [], in: [], post: [] };
  const frames: Frame[] = [];
  const draw = (upTo: number, o: { cur?: number; fresh?: Array<[Pass, number]>; final?: boolean }): Item[] => {
    const items: Item[] = [{ k: "path", id: "route", pts: all, tone: "faint", dashed: true, width: 1.4 }];
    const done = route.filter((r) => r.ev <= upTo).map((r) => r.pt);
    if (done.length >= 2) items.push({ k: "path", id: "tour", pts: done, tone: "accent", width: 2 });
    items.push(...drawTree(root, at, { r: R, tone: (v) => (v === o.cur ? "accent" : "plain") }));
    const [wx, wy] = done.length ? done[done.length - 1] : all[0];
    if (!o.final) items.push({ k: "node", id: "walker", x: wx, y: wy, r: 5, text: "", tone: "strong" });
    const fresh = new Set((o.fresh ?? []).map(([p, v]) => `${p}${v}`));
    ROWS.forEach(([p, name], k) => {
      const y = RY + k * (S + 12);
      items.push(rowLabel(`rl${p}`, name, -10, y, S));
      written[p].forEach((v, j) => items.push({ k: "cell", id: `${p}${v}`, x: slotX(j, 0, S, G), y, w: S, h: S, text: String(v), tone: o.final ? "strong" : fresh.has(`${p}${v}`) ? "accent" : "plain", size: 13 }));
    });
    return items;
  };

  frames.push({
    caption: "Walk round the outside of the tree, starting at the root and keeping the tree on your left. You pass every node three times — on its left, underneath it, then on its right — and the three depth-first orders differ only in which pass writes it.",
    items: draw(0, {}),
  });
  let leaves = 0;
  let upTo = 0;
  for (const a of arrivals) {
    upTo += a.passes.length;
    for (const p of a.passes) written[p].push(a.v);
    const v = a.v;
    const ps = a.passes.join(",");
    let caption: string;
    if (a.how === "start") caption = `Start on the left of the root, ${v}. This is its first pass, so preorder writes ${v} before anything else.`;
    else if (a.how === "down" && ps === "pre") caption = `Down to ${v}, passing its left side: preorder writes ${v}. Its left subtree comes next.`;
    else if (a.how === "down" && ps === "pre,in") caption = `Down to ${v}, which has no left child, so the walk passes its left side and its underside at once: preorder and inorder both write ${v}.`;
    else if (a.how === "down") caption = leaves++ === 0 ? `Down to ${v}, a leaf. With no subtrees in the way, the walk rounds its left side, underside and right side in one go, so ${v} joins all three orders.` : `Down to ${v}, another leaf: it joins all three orders at once.`;
    else if (a.how === "upLeft" && ps === "in") caption = `Back up to ${v} from its left subtree, passing underneath it: inorder writes ${v}. Its right subtree comes next.`;
    else if (a.how === "upLeft") caption = `Back up to ${v} from its left subtree. It has no right child, so the walk passes underneath it and straight up its right side: inorder and postorder both write ${v}.`;
    else caption = `Back up to ${v} from its right subtree, passing its right side: both of its subtrees are finished, so postorder writes ${v}.`;
    frames.push({ caption, items: draw(upTo, { cur: v, fresh: a.passes.map((p) => [p, v] as [Pass, number]) }) });
  }
  frames.push({
    caption: `Preorder (${written.pre.join(" ")}) writes a node at its first pass, inorder (${written.in.join(" ")}) at the second and postorder (${written.post.join(" ")}) at the third. Each node is passed three times, so every traversal is O(n).`,
    items: draw(ev, { final: true }),
  });
  return finish({ title: "One walk round the tree gives preorder, inorder and postorder", input: "the example tree", frames });
}

/* ── Level order with a queue ─────────────────────────────────────── */

function levelOrder(): Walkthrough {
  const { root, nodes } = build(LISTING);
  const R = 17;
  const S = 34;
  const G = 4;
  const DY = 56;
  const at = moved(placeTree(60, DY), 40, 0);
  const depth = depthsOf(root);
  const height = Math.max(...depth.values());
  const QY = height * DY + R + 36;
  const OY = QY + S + 30;
  const out: number[] = [];
  const frames: Frame[] = [];

  const draw = (queue: number[], o: { cur?: number; fresh?: number[]; final?: boolean }): Item[] => {
    const fresh = new Set(o.fresh ?? []);
    const items: Item[] = [];
    for (let d = 0; d <= height; d++) items.push(label(`lv${d}`, `level ${d}`, -12, d * DY, { anchor: "end", tone: "faint", size: 11 }));
    items.push(...drawTree(root, at, { r: R, tone: (v) => (o.final ? "plain" : v === o.cur ? "accent" : out.includes(v) ? "muted" : "plain"), edge: (c) => (fresh.has(c) ? "accent" : "line") }));
    items.push(rowLabel("ql", "queue", -12, QY, S));
    queue.forEach((v, k) => items.push({ k: "cell", id: `q${v}`, x: slotX(k, 0, S, G), y: QY, w: S, h: S, text: String(v), tone: fresh.has(v) ? "accent" : "plain" }));
    if (!queue.length) items.push(note("qe", "empty", 0, QY + S / 2, { tone: "faint", size: 12 }));
    items.push(rowLabel("ol", "order", -12, OY, S));
    out.forEach((v, k) => items.push({ k: "cell", id: `o${v}`, x: slotX(k, 0, S, G), y: OY, w: S, h: S, text: String(v), tone: o.final ? "strong" : v === o.cur ? "accent" : "plain" }));
    return items;
  };

  const q: number[] = [root.val];
  frames.push({
    caption: "Level order starts with the root alone in a queue. Every step takes the node at the front, writes it down, and puts its children at the back.",
    items: draw([...q], {}),
  });
  const seenLevel = new Set<number>();
  while (q.length) {
    const before = [...q];
    const v = q.shift()!;
    const nd = nodes.get(v)!;
    const kids = [nd.left, nd.right].filter((c): c is TNode => c !== null).map((c) => c.val);
    q.push(...kids);
    out.push(v);
    const d = depth.get(v)!;
    const level = [...depth].filter(([, k]) => k === d).map(([x]) => x);
    const startsLevel = !seenLevel.has(d) && before.length === level.length && before.every((x) => depth.get(x) === d);
    seenLevel.add(d);
    const kidText = kids.length === 2 ? `its children ${and(kids.map(String))} join the back of the queue` : kids.length === 1 ? `its child ${kids[0]} joins the back of the queue` : "it is a leaf, so nothing joins";
    let caption: string;
    if (!q.length) caption = `Take ${v}, the last node: ${kidText}, and the queue is empty. The order is ${show(out)}, level by level; each node was queued and taken once, so it is O(n).`;
    else if (startsLevel && d > 0) caption = `Take ${v} and write it. At that moment the queue held exactly level ${d}: ${and(level.map(String))}. ${kids.length ? `${kidText[0].toUpperCase()}${kidText.slice(1)} behind them, so no deeper node can come out first.` : `${v} is a leaf, so nothing joins.`}`;
    else if (d === 0) caption = `Take ${v} and write it; ${kidText}.`;
    else caption = `Take ${v} and write it; ${kidText}${kids.length ? `, behind the rest of level ${d}` : ""}.`;
    frames.push({ caption, items: draw([...q], { cur: v, fresh: kids, final: !q.length }) });
  }
  return finish({ title: "Level order: a queue visits the tree one level at a time", input: "the example tree", frames });
}

/* ── Ask the children, combine the answers ────────────────────────── */

function heights(): Walkthrough {
  const { root } = build(LISTING);
  const R = 17;
  const at = placeTree(88, 68);
  const h = new Map<number, number>();
  const num = (k: number) => (k < 0 ? `−${-k}` : String(k));
  const frames: Frame[] = [];

  const draw = (cur: number | null, final = false): Item[] => {
    const nd = cur === null ? null : preorderNodes(root).find((x) => x.val === cur)!;
    const asked = new Set([nd?.left?.val, nd?.right?.val].filter((v): v is number => v !== undefined));
    const items = drawTree(root, at, {
      r: R,
      tone: (v) => (final && v === root.val ? "strong" : v === cur ? "accent" : h.has(v) ? "strong" : "plain"),
      edge: (c) => (asked.has(c) ? null : "line"),
    });
    // The children's answers travel up their edges.
    for (const c of asked) items.push(link(`up${c}`, at.get(c)!, at.get(cur!)!, R, { tone: "accent", arrow: true, label: String(h.get(c)) }));
    for (const [v, k] of h) items.push(label(`h${v}`, `h=${k}`, at.get(v)!.x + R + 4, at.get(v)!.y, { anchor: "start", tone: v === cur ? "accent" : "soft", size: 11, mono: true, weight: 600 }));
    return items;
  };

  frames.push({
    caption: "To find a node's height, ask both children for theirs and add one to the larger. An empty child answers −1, so that a leaf comes out at 0. Nothing is known yet: the answers start at the bottom.",
    items: draw(null),
  });
  let leaves = 0;
  const height = (nd: TNode | null): number => {
    if (!nd) return -1;
    const hl = height(nd.left);
    const hr = height(nd.right);
    const v = nd.val;
    const mine = 1 + Math.max(hl, hr);
    h.set(v, mine);
    let caption: string;
    if (!nd.left && !nd.right) caption = leaves++ === 0 ? `${v} is a leaf: both children are empty and answer −1, so height(${v}) = 1 + max(−1, −1) = 0. It hands 0 back to its parent.` : `${v} is a leaf too: height(${v}) = 0, ready for its parent.`;
    else if (nd.left && nd.right) caption = `${v} hears ${num(hl)} from ${nd.left.val} and ${num(hr)} from ${nd.right.val}: height(${v}) = 1 + max(${num(hl)}, ${num(hr)}) = ${mine}.${v === root.val ? " That is the height of the whole tree, found after both children had answered: a postorder walk, O(n)." : ""}`;
    else {
      const c = (nd.left ?? nd.right)!;
      caption = `${v} hears ${num(h.get(c.val)!)} from ${c.val}, and its empty ${nd.left ? "right" : "left"} side answers −1: height(${v}) = 1 + max(${num(hl)}, ${num(hr)}) = ${mine}.`;
    }
    frames.push({ caption, items: draw(v, v === root.val) });
    return mine;
  };
  height(root);
  return finish({ title: "Height by asking the children: answers flow up in postorder", input: "height(empty) = −1; height(node) = 1 + max(height(left), height(right))", frames });
}

/* ── Inorder with an explicit stack ───────────────────────────────── */

function stackInorder(): Walkthrough {
  const { root } = build(LISTING);
  const R = 17;
  const S = 30;
  const G = 5;
  const at = placeTree(56, 56);
  const xs = [...at.values()].map((p) => p.x);
  const maxY = Math.max(...[...at.values()].map((p) => p.y));
  const CX = Math.max(...xs) + R + 64;
  const CW = 44;
  const CH = 30;
  const BASE = maxY + R - CH;
  const OY = maxY + R + 40;
  const out: number[] = [];
  const stack: TNode[] = [];
  const frames: Frame[] = [];

  const draw = (cur: number | null, fresh: number[], final = false): Item[] => {
    const items = drawTree(root, at, { r: R, tone: (v) => (final ? "plain" : v === cur ? "accent" : out.includes(v) ? "muted" : "plain") });
    stack.forEach((s, k) => items.push(box(`s${s.val}`, CX, BASE - k * (CH + 4), s.val, { w: CW, h: CH, tone: fresh.includes(s.val) ? "accent" : "plain" })));
    items.push(label("sl", "stack", CX + CW / 2, BASE + CH + 14, { size: 11, weight: 600 }));
    if (!stack.length) items.push(label("se", "empty", CX + CW / 2, BASE + CH / 2, { tone: "faint", size: 11 }));
    else items.push(label("st", "top", CX + CW + 8, BASE - (stack.length - 1) * (CH + 4) + CH / 2, { anchor: "start", tone: "faint", size: 10.5 }));
    items.push(rowLabel("ol", "visited", -10 - R, OY, S));
    out.forEach((v, k) => items.push({ k: "cell", id: `o${v}`, x: slotX(k, -R, S, G), y: OY, w: S, h: S, text: String(v), tone: final ? "strong" : v === cur ? "accent" : "plain", size: 13 }));
    return items;
  };

  const goLeft = (from: TNode | null): number[] => {
    const pushed: number[] = [];
    for (let c = from; c; c = c.left) {
      stack.push(c);
      pushed.push(c.val);
    }
    return pushed;
  };
  const first = goLeft(root);
  frames.push({
    caption: `Start at the root and go left as far as possible, pushing ${and(first.map(String))}. The stack now holds exactly the nodes whose left subtree is still being visited — what the recursive calls would be holding.`,
    items: draw(null, first),
  });
  while (stack.length) {
    const nd = stack.pop()!;
    out.push(nd.val);
    const pushed = goLeft(nd.right);
    let caption = `Pop ${nd.val}: its left subtree is finished, so visit it.`;
    if (!nd.right) caption += " It has no right child, so nothing is pushed.";
    else if (pushed.length > 1) caption += ` Then go right to ${nd.right.val} and left again as far as possible, pushing ${and(pushed.map(String))}.`;
    else caption += ` Then go right to ${nd.right.val}, which has no left child: push it.`;
    if (!stack.length) caption = `Pop ${nd.val} and visit it. The stack is empty and there is no right subtree left: done, ${show(out)} — the same as the recursion, with a stack you control.`;
    frames.push({ caption, items: draw(nd.val, pushed, !stack.length) });
  }
  return finish({ title: "Inorder without recursion: the call stack made explicit", input: "the example tree", frames });
}

/* ── A tree given as a parent array ───────────────────────────────── */

function parentArray(): Walkthrough {
  const parents = [-1, 0, 0, 1, 1, 2, 4];
  const n = parents.length;
  const children: number[][] = parents.map(() => []);
  let root = -1;
  parents.forEach((p, i) => (p === -1 ? (root = i) : children[p].push(i)));
  // The lesson's dfs: depth flows down as a parameter, size flows up as the return value.
  const depthOf = new Array<number>(n).fill(0);
  const sizeOf = new Array<number>(n).fill(0);
  const dfs = (node: number, depth: number): number => {
    depthOf[node] = depth;
    let size = 1;
    for (const c of children[node]) size += dfs(c, depth + 1);
    sizeOf[node] = size;
    return size;
  };
  dfs(root, 0);
  const height = Math.max(...depthOf);
  const deepest = depthOf.indexOf(height);

  const S = 32;
  const G = 5;
  const R = 17;
  const DY = 56;
  const rowW = n * (S + G) - G;
  const lay = treeLayout<number>(root, (k) => children[k], { dx: 64, dy: DY });
  const lx = [...lay.values()].map((p) => p.x);
  const TY = S + 66;
  const shift = rowW / 2 - (Math.min(...lx) + Math.max(...lx)) / 2;
  const at = new Map([...lay].map(([k, p]) => [k, { x: p.x + shift, y: p.y + TY }]));
  const minX = Math.min(...lx) + shift;
  const TX = rowW + 26;

  const draw = (o: { stage: 0 | 1 | 2 }): Item[] => {
    const items: Item[] = [rowLabel("pl", "parents", -10, 0, S)];
    parents.forEach((p, i) => {
      items.push({ k: "cell", id: `p${i}`, x: slotX(i, 0, S, G), y: 0, w: S, h: S, text: String(p), tone: p === -1 ? "accent" : "plain", size: 13 });
      items.push(note(`pi${i}`, String(i), slotMid(i, 0, S, G), S + 11, { anchor: "middle", tone: "faint", size: 10 }));
    });
    items.push(note("pil", "node i", -10, S + 11, { anchor: "end", tone: "faint", size: 10 }));
    for (let i = 0; i < n; i++) {
      for (const c of children[i]) items.push(link(`e${c}`, at.get(i)!, at.get(c)!, R, { tone: o.stage === 0 ? "line" : "accent", arrow: o.stage === 1 }));
    }
    for (let i = 0; i < n; i++) {
      const p = at.get(i)!;
      items.push({ k: "node", id: `n${i}`, x: p.x, y: p.y, r: R, text: String(i), tone: i === root ? "accent" : "plain" });
      if (o.stage === 2) items.push(label(`s${i}`, String(sizeOf[i]), p.x + R + 4, p.y - R + 3, { anchor: "start", tone: "accent", size: 12, mono: true, weight: 700 }));
    }
    if (o.stage === 1) for (let d = 0; d <= height; d++) items.push(label(`dl${d}`, `depth ${d}`, minX - R - 18, TY + d * DY, { anchor: "end", tone: "accent", size: 11, weight: 600 }));
    if (o.stage === 2) items.push(label("sz", "accent number = subtree size", rowW / 2, TY + height * DY + R + 22, { tone: "accent", size: 11 }));
    if (o.stage === 0) {
      items.push(label("cl", "children lists", TX, TY - 4, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }));
      let k = 0;
      for (let i = 0; i < n; i++) {
        if (!children[i].length) continue;
        items.push(note(`c${i}`, `${i}: ${children[i].join(", ")}`, TX, TY + 18 + k * 19, { tone: "soft", size: 12 }));
        k++;
      }
    }
    return items;
  };

  const lists = children.flatMap((c, i) => (c.length ? [`${i} → ${c.join(", ")}`] : []));
  return finish({
    title: "A tree from a parent array: depth flows down, size flows up",
    input: `parents = ${show(parents)}`,
    frames: [
      {
        caption: `parents[i] names the parent of node i, and −1 marks the root, ${root}. One pass adds each node to its parent's list (${lists.join("; ")}), and the tree is there to walk: no node objects needed.`,
        items: draw({ stage: 0 }),
      },
      {
        caption: `Depth flows down: dfs(node, depth) hands depth + 1 to each child, so depth is a parameter, known before the children are visited. The deepest node, ${deepest}, sits at depth ${height}, the tree's height.`,
        items: draw({ stage: 1 }),
      },
      {
        caption: `Size flows up: each call returns 1 plus its children's sizes, so size is a return value, known only once the children have answered. Node 1's subtree holds ${sizeOf[1]} nodes and the root's all ${sizeOf[root]}.`,
        items: draw({ stage: 2 }),
      },
    ],
  });
}

/* ── Full, complete, perfect, degenerate ──────────────────────────── */

const sup = (k: number) => String(k).replace(/\d/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]);

function shapes(): Walkthrough {
  type Shape = { name: string; level: Array<number | null>; fact: (t: { n: number; h: number }) => string; holds: (root: TNode, n: number, h: number) => boolean };
  const R = 13;
  const DY = 42;
  const W = 156;
  const COL = 210;
  const countKids = (t: TNode) => (t.left ? 1 : 0) + (t.right ? 1 : 0);
  const heightOf = (t: TNode | null): number => (t ? 1 + Math.max(heightOf(t.left), heightOf(t.right)) : -1);
  const SHAPES: Shape[] = [
    { name: "Full", level: [1, 2, 3, null, null, 4, 5], fact: () => "0 or 2 children at every node", holds: (t) => preorderNodes(t).every((x) => countKids(x) !== 1) },
    {
      name: "Complete",
      level: [1, 2, 3, 4, 5, 6],
      fact: () => "last level filled from the left",
      holds: (t) => {
        // Level order meets no node after the first gap.
        const q: Array<TNode | null> = [t];
        let gap = false;
        for (let i = 0; i < q.length; i++) {
          const x = q[i];
          if (!x) gap = true;
          else {
            if (gap) return false;
            q.push(x.left, x.right);
          }
        }
        return true;
      },
    },
    { name: "Perfect", level: [1, 2, 3, 4, 5, 6, 7], fact: ({ n, h }) => `height ${h}: 2${sup(h + 1)} − 1 = ${n} nodes`, holds: (_t, n, h) => n === 2 ** (h + 1) - 1 },
    { name: "Degenerate", level: [1, null, 2, null, 3, null, 4], fact: ({ n, h }) => `height ${h} = n − 1: a chain`, holds: (t, n, h) => h === n - 1 },
  ];
  const items: Item[] = [];
  // Each tree laid out by heap position (index i at depth d gets 1/2ᵈ of the width), so no two nodes can collide.
  const built = SHAPES.map((s) => {
    const { root, nodes } = build(s.level);
    const h = heightOf(root);
    if (!s.holds(root, nodes.size, h)) throw new Error(`shapes: ${s.name} does not hold for ${show(s.level.map((v) => (v === null ? "null" : v)))}`);
    return { s, root, n: nodes.size, h };
  });
  let oy = 0;
  for (let rowStart = 0; rowStart < built.length; rowStart += 2) {
    const rowH = Math.max(...built.slice(rowStart, rowStart + 2).map((b) => b.h));
    built.slice(rowStart, rowStart + 2).forEach((b, j) => {
      const k = rowStart + j;
      const ox = j * COL;
      const pos = new Map<number, Pt>();
      const place = (t: TNode | null, i: number, d: number) => {
        if (!t) return;
        const p = i - (2 ** d - 1);
        pos.set(t.val, { x: ox + ((p + 0.5) * W) / 2 ** d, y: oy + 30 + d * DY });
        place(t.left, 2 * i + 1, d + 1);
        place(t.right, 2 * i + 2, d + 1);
      };
      place(b.root, 0, 0);
      for (const t of preorderNodes(b.root)) for (const c of [t.left, t.right]) if (c) items.push(link(`${k}e${c.val}`, pos.get(t.val)!, pos.get(c.val)!, R));
      for (const t of preorderNodes(b.root)) items.push({ k: "node", id: `${k}n${t.val}`, x: pos.get(t.val)!.x, y: pos.get(t.val)!.y, r: R, text: String(t.val), tone: "plain", size: 11 });
      items.push(label(`t${k}`, b.s.name, ox + W / 2, oy, { tone: "ink", size: 12.5, weight: 600 }));
      items.push(label(`f${k}`, b.s.fact({ n: b.n, h: b.h }), ox + W / 2, oy + 30 + rowH * DY + R + 15, { size: 11 }));
    });
    oy += 30 + rowH * DY + R + 15 + 36;
  }
  return finish({
    title: "Four shapes of binary tree",
    input: "",
    frames: [
      {
        caption: "Full: no node has exactly one child. Complete: every level is full except the last, filled from the left — the heap's shape. Perfect: every level full, so a tree of height h holds 2ʰ⁺¹ − 1 nodes. Degenerate: one child each, a chain whose height is n − 1.",
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  vocabulary,
  build: buildFigure,
  "one-walk": euler,
  "level-order": levelOrder,
  heights,
  "stack-inorder": stackInorder,
  "parent-array": parentArray,
  shapes,
};
