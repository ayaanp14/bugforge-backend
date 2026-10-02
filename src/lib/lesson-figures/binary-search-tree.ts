import { and, finish, link, note, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { binaryTree, box, label, type Pt } from "./kit.js";

/**
 * Binary Search Tree (BST): the lesson's figures
 * (content/roadmap/binary-search-tree.md places each with "@figure <name>").
 *
 * The lesson's tree is what inserting 8, 3, 10, 1, 6, 14, 4, 7, 13 builds;
 * every generator builds it with the real insert and then runs the real
 * search, delete or check on it. Trees are drawn with each node's x at its
 * value's sorted rank and its y at its depth — read left to right, a BST is
 * sorted, and because a value's column never changes, a node moved by a
 * delete or a rotation glides straight up or down. Node ids are the node's
 * identity, not its value, so a delete that copies a value shows the copy.
 */

const VALUES = [8, 3, 10, 1, 6, 14, 4, 7, 13];

type BNode = { id: number; val: number; left: BNode | null; right: BNode | null };

let made = 0;
const node = (val: number): BNode => ({ id: made++, val, left: null, right: null });

/** The lesson's insert: returns the subtree's root; an equal value is ignored. */
function insert(t: BNode | null, v: number, fresh: (v: number) => BNode = node): BNode {
  if (!t) return fresh(v);
  if (v < t.val) t.left = insert(t.left, v, fresh);
  else if (v > t.val) t.right = insert(t.right, v, fresh);
  return t;
}

const buildTree = (values: readonly number[]): BNode => {
  made = 0;
  let root: BNode | null = null;
  for (const v of values) root = insert(root, v);
  return root!;
};

const nodesOf = (t: BNode | null, out: BNode[] = []): BNode[] => {
  if (t) {
    out.push(t);
    nodesOf(t.left, out);
    nodesOf(t.right, out);
  }
  return out;
};
const inorder = (t: BNode | null, out: number[] = []): number[] => {
  if (t) {
    inorder(t.left, out);
    out.push(t.val);
    inorder(t.right, out);
  }
  return out;
};
const heightOf = (t: BNode | null): number => (t ? 1 + Math.max(heightOf(t.left), heightOf(t.right)) : -1);

/** Centres: x by the value's rank among `universe` (every value the figure ever shows), y by depth. */
function rankLayout(root: BNode | null, universe: readonly number[], o: { dx: number; dy: number; x?: number; y?: number }): Map<number, Pt> {
  const rank = new Map([...universe].sort((a, b) => a - b).map((v, i) => [v, i]));
  const at = new Map<number, Pt>();
  const go = (t: BNode | null, d: number) => {
    if (!t) return;
    at.set(t.id, { x: (o.x ?? 0) + rank.get(t.val)! * o.dx, y: (o.y ?? 0) + d * o.dy });
    go(t.left, d + 1);
    go(t.right, d + 1);
  };
  go(root, 0);
  return at;
}

/** Edges then nodes; ids `e<child id>` and `n<node id>`. */
function drawBst(root: BNode | null, at: Map<number, Pt>, o: { r: number; tone?: (t: BNode) => Tone; edge?: (child: BNode) => LineTone; size?: number; prefix?: string }): Item[] {
  const p = o.prefix ?? "";
  const all = nodesOf(root);
  const items: Item[] = [];
  for (const t of all) for (const c of [t.left, t.right]) if (c) items.push(link(`${p}e${c.id}`, at.get(t.id)!, at.get(c.id)!, o.r, { tone: o.edge?.(c) ?? "line" }));
  for (const t of all) {
    const q = at.get(t.id)!;
    const it: Item = { k: "node", id: `${p}n${t.id}`, x: q.x, y: q.y, r: o.r, text: String(t.val), tone: o.tone?.(t) ?? "plain" };
    items.push(o.size ? { ...it, size: o.size } : it);
  }
  return items;
}

const R = 17;
const DX = 42;
const DY = 58;

/* ── The property ─────────────────────────────────────────────────── */

function property(): Walkthrough {
  const root = buildTree(VALUES);
  const at = rankLayout(root, VALUES, { dx: DX, dy: DY });
  const depth = heightOf(root);
  const items: Item[] = [];
  const sides: Array<[BNode, string]> = [
    [root.left!, `all < ${root.val}`],
    [root.right!, `all > ${root.val}`],
  ];
  const bottom = depth * DY + R + 8;
  sides.forEach(([sub, text], k) => {
    const ps = nodesOf(sub).map((t) => at.get(t.id)!);
    const x1 = Math.min(...ps.map((p) => p.x)) - R - 8;
    const x2 = Math.max(...ps.map((p) => p.x)) + R + 8;
    const y1 = Math.min(...ps.map((p) => p.y)) - R - 8;
    items.push({ k: "band", id: `b${k}`, x: x1, y: y1, w: x2 - x1, h: bottom - y1, tone: "accent" });
    items.push(label(`bl${k}`, `${k ? "right" : "left"} subtree: ${text}`, (x1 + x2) / 2, bottom + 13, { tone: "accent", size: 11.5, weight: 600 }));
  });
  // The claim the figure makes, checked against the tree.
  for (const t of nodesOf(root)) {
    if (nodesOf(t.left).some((x) => x.val >= t.val) || nodesOf(t.right).some((x) => x.val <= t.val)) throw new Error(`property: the rule fails at ${t.val}`);
  }
  items.push(...drawBst(root, at, { r: R, tone: (t) => (t === root ? "accent" : "plain") }));
  const SY = bottom + 40;
  const sorted = inorder(root);
  items.push(note("sl", "sorted", -R - 10, SY + 15, { anchor: "end", tone: "soft", size: 12, mono: false }));
  for (const t of nodesOf(root)) {
    const p = at.get(t.id)!;
    items.push(box(`s${t.id}`, p.x - 15, SY, t.val, { w: 30, h: 30, tone: t === root ? "accent" : "plain", size: 13 }));
  }
  const left = nodesOf(root.left).map((t) => t.val).sort((a, b) => a - b);
  const right = nodesOf(root.right).map((t) => t.val).sort((a, b) => a - b);
  return finish({
    title: "The BST property: smaller values left, larger values right",
    input: `insert ${VALUES.join(", ")}`,
    frames: [
      {
        caption: `Every value in ${root.val}'s left subtree (${and(left.map(String))}) is smaller than ${root.val}, every value in its right subtree (${and(right.map(String))}) is larger, and the same holds at every node. Drop each node straight down and they land in sorted order: ${sorted.join(" ")}.`,
        items,
      },
    ],
  });
}

/* ── Search, and insert where the search falls off ────────────────── */

function search(): Walkthrough {
  const root = buildTree(VALUES);
  const NEW = 5;
  const born = node(NEW);
  const universe = [...VALUES, NEW];
  const frames: Frame[] = [];
  const n = VALUES.length;

  const draw = (o: { path: BNode[]; out: Set<number>; found?: BNode; ghost?: BNode; placed?: boolean; lines: string[] }): Item[] => {
    const at = rankLayout(root, universe, { dx: DX, dy: DY });
    const onPath = new Set(o.path.map((t) => t.id));
    const items: Item[] = [];
    if (o.ghost) {
      const parent = o.path[o.path.length - 1];
      const pp = at.get(parent.id)!;
      const depth = o.path.length;
      const rank = [...universe].sort((a, b) => a - b).indexOf(NEW);
      const gp = { x: rank * DX, y: depth * DY };
      items.push(link(`e${born.id}`, pp, gp, R, { tone: "accent", dashed: true }));
      items.push({ k: "node", id: `n${born.id}`, x: gp.x, y: gp.y, r: R, text: String(NEW), tone: "ghost" });
    }
    items.push(
      ...drawBst(root, at, {
        r: R,
        tone: (t) => (t === o.found || (o.placed && t === born) ? "strong" : onPath.has(t.id) ? "accent" : o.out.has(t.id) ? "muted" : "plain"),
        edge: (c) => (onPath.has(c.id) || (o.placed && c === born) ? "accent" : "line"),
      }),
    );
    const base = 4 * DY + R + 26;
    o.lines.forEach((t, k) => items.push(note(`l${k}`, t, 0, base + k * 20, { tone: k ? "soft" : "ink", size: 12.5, weight: k ? undefined : 600 })));
    return items;
  };

  // Search 7, one frame per comparison: each one rules out the node and one whole subtree.
  const TARGET = 7;
  const out = new Set<number>();
  const path: BNode[] = [];
  let cur: BNode | null = root;
  let steps = 0;
  while (cur) {
    path.push(cur);
    steps++;
    if (cur.val === TARGET) {
      frames.push({
        caption: `${TARGET} = ${TARGET}: found after ${steps} comparisons, out of ${n} values. Every comparison discarded the node and a whole subtree, so a search walks a single path from the root: O(h), the height of the tree.`,
        items: draw({ path: path.slice(0, -1), out, found: cur, lines: [`search ${TARGET}: ${path.map((t) => t.val).join(" → ")}`, "found"] }),
      });
      break;
    }
    const goLeft: boolean = TARGET < cur.val;
    const gone = nodesOf(goLeft ? cur.right : cur.left);
    for (const t of gone) out.add(t.id);
    out.add(cur.id);
    const left = n - out.size;
    const first = steps === 1;
    const why = goLeft
      ? `${TARGET} < ${cur.val}, and every value in ${cur.val}'s right subtree is larger than ${cur.val}, so larger than ${TARGET}`
      : `${TARGET} > ${cur.val}, and every value in ${cur.val}'s left subtree is smaller than ${cur.val}, so smaller than ${TARGET}`;
    frames.push({
      caption: `${first ? `Search for ${TARGET}, starting at the root. ` : ""}${why}: ${gone.length ? `${and(gone.map((t) => String(t.val)))} ${gone.length === 1 ? "is" : "are"} ruled out without a look` : "there is nothing on that side"}. Go ${goLeft ? "left" : "right"}.`,
      items: draw({ path, out, lines: [`search ${TARGET}: ${path.map((t) => t.val).join(" → ")}`, `still possible: ${left} of ${n}`] }),
    });
    cur = goLeft ? cur.left : cur.right;
  }

  // Search 5: it falls off the tree, and that empty spot is where insert puts it.
  const p2: BNode[] = [];
  const moves: string[] = [];
  let at: BNode | null = root;
  while (at) {
    p2.push(at);
    moves.push(`${NEW} ${NEW < at.val ? "<" : ">"} ${at.val}, ${NEW < at.val ? "left" : "right"}`);
    at = NEW < at.val ? at.left : at.right;
  }
  const parent = p2[p2.length - 1];
  frames.push({
    caption: `Search for ${NEW}: ${moves.join("; ")} — and ${parent.val}'s ${NEW < parent.val ? "left" : "right"} link is empty. The search falls off the tree, so ${NEW} is not there.`,
    items: draw({ path: p2, out: new Set(), ghost: born, lines: [`search ${NEW}: ${p2.map((t) => t.val).join(" → ")} → empty`, "not found"] }),
  });
  insert(root, NEW, () => born);
  frames.push({
    caption: `Insert ${NEW} is that same search: the empty spot where it fell off is exactly where ${NEW} belongs, so it is attached there as a new leaf. Every comparison on the way put it on the right side of an ancestor, and no other node moves.`,
    items: draw({ path: p2, out: new Set(), placed: true, lines: [`insert ${NEW}: ${p2.map((t) => t.val).join(" → ")} → new leaf`, `inorder: ${inorder(root).join(" ")}`] }),
  });
  return finish({ title: "Searching a BST rules out a whole subtree at every step", input: `the tree from ${VALUES.join(", ")}; search ${TARGET}, then search and insert ${NEW}`, frames });
}

/* ── Delete: three cases ──────────────────────────────────────────── */

/** The lesson's remove, for the leaf and one-child cases (and the successor's removal). */
function remove(t: BNode | null, v: number): BNode | null {
  if (!t) return null;
  if (v < t.val) {
    t.left = remove(t.left, v);
    return t;
  }
  if (v > t.val) {
    t.right = remove(t.right, v);
    return t;
  }
  if (!t.left || !t.right) return t.left ?? t.right;
  let succ = t.right;
  while (succ.left) succ = succ.left;
  t.val = succ.val;
  t.right = remove(t.right, succ.val);
  return t;
}

function deletes(): Walkthrough {
  let root: BNode | null = buildTree(VALUES);
  root = insert(root, 5);
  const universe = inorder(root);
  const frames: Frame[] = [];
  const find = (v: number): BNode => nodesOf(root).find((t) => t.val === v)!;

  const draw = (hot: Set<number>, o: { strong?: Set<number>; muted?: Set<number>; edges?: Set<number> } = {}): Item[] => {
    const at = rankLayout(root, universe, { dx: DX, dy: DY });
    const items = drawBst(root, at, {
      r: R,
      tone: (t) => (o.strong?.has(t.id) ? "strong" : hot.has(t.id) ? "accent" : o.muted?.has(t.id) ? "muted" : "plain"),
      edge: (c) => (o.edges?.has(c.id) ? "accent" : "line"),
    });
    items.push(note("io", `inorder: ${inorder(root).join(" ")}`, 0, 4 * DY + R + 26, { tone: "soft", size: 12.5 }));
    return items;
  };

  // Two children: the inorder successor's value replaces the deleted one.
  const D2 = 3;
  const t3 = find(D2);
  const kids = [t3.left!, t3.right!];
  frames.push({
    caption: `Delete ${D2}. The search finds it with two children, ${kids[0].val} and ${kids[1].val}, and two subtrees cannot both hang from its parent's single link. Something else must take its place.`,
    items: draw(new Set([t3.id]), { edges: new Set(kids.map((k) => k.id)) }),
  });
  const walk = [t3.right!];
  while (walk[walk.length - 1].left) walk.push(walk[walk.length - 1].left!);
  const succ = walk[walk.length - 1];
  frames.push({
    caption: `Its inorder successor is the smallest value in its right subtree: go right once, to ${walk[0].val}, then left as far as possible, to ${succ.val}. ${succ.val} has no left child — a smaller value would be one.`,
    items: draw(new Set(walk.map((t) => t.id)), { strong: new Set([succ.id]), edges: new Set(walk.map((t) => t.id)) }),
  });
  const leftVals = inorder(t3.left);
  t3.val = succ.val;
  const rightRest = inorder(t3.right).filter((v) => v !== succ.val);
  frames.push({
    caption: `Copy ${succ.val} into the node that held ${D2}. It fits that position exactly: larger than everything on its left (${and(leftVals.map(String))}) and smaller than everything still on its right (${and(rightRest.map(String))}). The old ${succ.val} is now a duplicate to remove.`,
    items: draw(new Set([t3.id]), { muted: new Set([succ.id]) }),
  });
  const succChild = succ.left ?? succ.right;
  t3.right = remove(t3.right, succ.val);
  frames.push({
    caption: `Remove the old ${succ.val} from the right subtree. It has ${succChild ? `one child, ${succChild.val}, which takes its place` : "no children, so it simply goes"} — an easy case, which is why the successor is chosen.`,
    items: draw(new Set(succChild ? [succChild.id] : []), { edges: new Set(succChild ? [succChild.id] : []) }),
  });

  // A leaf.
  const LEAF = 1;
  const parentOfLeaf = nodesOf(root).find((t) => t.left?.val === LEAF || t.right?.val === LEAF)!;
  root = remove(root, LEAF);
  frames.push({
    caption: `Delete ${LEAF}: a leaf. ${parentOfLeaf.val}'s ${parentOfLeaf.left === null ? "left" : "right"} link simply becomes empty, and since nothing hung below ${LEAF}, nothing else changes.`,
    items: draw(new Set([parentOfLeaf.id])),
  });

  // One child.
  const ONE = 10;
  const t10 = find(ONE);
  const only = (t10.left ?? t10.right)!;
  const carried = nodesOf(only).filter((t) => t !== only).map((t) => t.val);
  root = remove(root, ONE);
  frames.push({
    caption: `Delete ${ONE}: one child, ${only.val}, which moves up into its place${carried.length ? ` and brings ${and(carried.map(String))} along` : ""}. That whole subtree was already on the right of ${root!.val}, so it still is: the rule holds.`,
    items: draw(new Set(nodesOf(only).map((t) => t.id)), { edges: new Set([only.id, ...nodesOf(only).map((t) => t.id)]) }),
  });
  frames.push({
    caption: `After three deletes the inorder is still sorted, and the root ${root!.val} has children ${root!.left!.val} and ${root!.right!.val}. Each delete was a search plus, at most, one walk down to the successor: O(h).`,
    items: draw(new Set(), { strong: new Set([root!.id]) }),
  });
  return finish({ title: "Deleting from a BST: two children, a leaf, one child", input: `the tree after insert 5; delete ${D2}, then ${LEAF}, then ${ONE}`, frames });
}

/* ── Validation: the parent-only check against ranges ─────────────── */

function validate(): Walkthrough {
  // Tree B, built by hand as the lesson's program does: 4 is on the wrong side of 5.
  const LEVEL = [5, 3, 8, null, null, 4, 9];
  const { pos } = binaryTree("_", LEVEL, { dx: 112, dy: 70 });
  const at = new Map<number, Pt>();
  for (const [i, p] of pos) at.set(LEVEL[i] as number, p);
  made = 0;
  const b = node(5);
  b.left = node(3);
  b.right = node(8);
  b.right.left = node(4);
  b.right.right = node(9);
  const all = nodesOf(b);
  const byVal = (v: number) => all.find((t) => t.val === v)!;

  const parentOnly = (t: BNode | null): boolean => !t || (!(t.left && t.left.val >= t.val) && !(t.right && t.right.val <= t.val) && parentOnly(t.left) && parentOnly(t.right));
  const visits: Array<{ t: BNode; low: number; high: number; ok: boolean }> = [];
  const isValid = (t: BNode | null, low: number, high: number): boolean => {
    if (!t) return true;
    const ok = t.val > low && t.val < high;
    visits.push({ t, low, high, ok });
    if (!ok) return false;
    return isValid(t.left, low, t.val) && isValid(t.right, t.val, high);
  };
  const simple = parentOnly(b);
  const ranged = isValid(b, -Infinity, Infinity);
  const bad = visits.find((v) => !v.ok)!;
  const bound = (x: number) => (x === -Infinity ? "−∞" : x === Infinity ? "+∞" : String(x));
  const range = (v: { low: number; high: number }) => `(${bound(v.low)}, ${bound(v.high)})`;
  // Search 4 the BST way, to show the damage.
  const sPath: BNode[] = [];
  let s: BNode | null = b;
  while (s && s.val !== bad.t.val) {
    sPath.push(s);
    s = bad.t.val < s.val ? s.left : s.right;
  }
  const lastS = sPath[sPath.length - 1];

  const draw = (o: { edgeLabels?: boolean; path?: BNode[]; shown?: number; lines: string[]; ghost?: boolean }): Item[] => {
    const onPath = new Set((o.path ?? []).map((t) => t.id));
    const shownVisits = visits.slice(0, o.shown ?? 0);
    const failed = shownVisits.some((v) => !v.ok);
    const items: Item[] = [];
    if (o.ghost) {
      const lp = at.get(lastS.val)!;
      const gp = { x: lp.x + (bad.t.val < lastS.val ? -34 : 34), y: lp.y + 58 };
      items.push(link("gse", lp, gp, R, { tone: "accent", dashed: true }));
      items.push({ k: "text", id: "gst", x: gp.x, y: gp.y, text: "empty", tone: "faint", anchor: "middle", size: 11, mono: false });
    }
    for (const t of all) {
      for (const c of [t.left, t.right]) {
        if (!c) continue;
        const lbl = o.edgeLabels ? (c === t.left ? `${c.val} < ${t.val}` : `${c.val} > ${t.val}`) : undefined;
        items.push(link(`e${c.id}`, at.get(t.val)!, at.get(c.val)!, R, { tone: o.edgeLabels || (onPath.has(t.id) && onPath.has(c.id)) ? "accent" : "line", label: lbl }));
      }
    }
    for (const t of all) {
      const v = shownVisits.find((x) => x.t === t);
      const tone: Tone = v && !v.ok ? "error" : v ? "accent" : o.ghost && t === bad.t ? "error" : onPath.has(t.id) ? "accent" : "plain";
      const p = at.get(t.val)!;
      items.push({ k: "node", id: `n${t.id}`, x: p.x, y: p.y, r: R, text: String(t.val), tone });
      if (v) {
        const isLeft = all.some((x) => x.left === t);
        const isRoot = t === b;
        items.push({ k: "text", id: `r${t.id}`, x: isRoot ? p.x : isLeft ? p.x - R - 7 : p.x + R + 7, y: isRoot ? p.y - R - 12 : p.y, text: range(v), tone: v.ok ? "accent" : "error", anchor: isRoot ? "middle" : isLeft ? "end" : "start", size: 11.5, weight: 600 });
      }
    }
    const base = 2 * 70 + R + 30;
    o.lines.forEach((t, k) => items.push(note(`l${k}`, t, -60, base + k * 20, { tone: failed && k === o.lines.length - 1 ? "error" : "ink", size: 12.5, weight: 600 })));
    return items;
  };

  const v5 = visits[0];
  const v3 = visits[1];
  const v8 = visits[2];
  return finish({
    title: "Validating a BST: comparing with the parent is not enough",
    input: "tree B = [5, 3, 8, null, null, 4, 9], built by hand",
    frames: [
      {
        caption: `Checked only against its own children, every node passes: ${byVal(3).val} < ${b.val} < ${byVal(8).val} and ${byVal(4).val} < ${byVal(8).val} < ${byVal(9).val}. The parent-only check calls this tree ${simple ? "valid" : "invalid"}.`,
        items: draw({ edgeLabels: true, lines: [`parent-only check: ${simple ? "valid" : "invalid"}`] }),
      },
      {
        caption: `But ${bad.t.val} sits in ${b.val}'s right subtree while being smaller than ${b.val}. A search for ${bad.t.val} goes ${bad.t.val < b.val ? "left" : "right"} at ${b.val}, then ${bad.t.val < lastS.val ? "left" : "right"} at ${lastS.val}, and falls off the tree: ${bad.t.val} is reported missing although it is right there.`,
        items: draw({ path: sPath, ghost: true, lines: [`parent-only check: ${simple ? "valid" : "invalid"}`, `search ${bad.t.val}: ${sPath.map((t) => t.val).join(" → ")} → not found`] }),
      },
      {
        caption: `The right check hands each node the open range its value must lie in. The root may hold anything, ${range(v5)}. Going left caps the range at the parent's value, so ${v3.t.val} needs ${range(v3)}; going right raises the floor, so ${v8.t.val} needs ${range(v8)}. Both fit.`,
        items: draw({ shown: 3, lines: [`range check: ${visits.slice(0, 3).map((v) => v.t.val).join(", ")} fit`] }),
      },
      {
        caption: `${bad.t.val} inherits ${v8.t.val}'s floor and gets ${v8.t.val} as its ceiling: it must lie in ${range(bad)}. It does not, so the range check reports the tree ${ranged ? "valid" : "invalid"}. The range carries every ancestor's limit, not just the parent's.`,
        items: draw({ shown: visits.length, lines: [`range check: ${ranged ? "valid" : "invalid"} at ${bad.t.val}`] }),
      },
    ],
  });
}

/* ── Lowest common ancestor ───────────────────────────────────────── */

function lca(): Walkthrough {
  const root = buildTree(VALUES);
  const at = rankLayout(root, VALUES, { dx: DX, dy: DY });
  const frames: Frame[] = [];
  const draw = (p: number, q: number, path: BNode[], answer?: BNode, line?: string): Item[] => {
    const onPath = new Set(path.map((t) => t.id));
    const items: Item[] = [];
    for (const t of nodesOf(root)) if (t.val === p || t.val === q) items.push({ k: "node", id: `ring${t.val}`, x: at.get(t.id)!.x, y: at.get(t.id)!.y, r: R + 5, text: "", tone: "ghost" });
    items.push(
      ...drawBst(root, at, {
        r: R,
        tone: (t) => (t === answer ? "strong" : onPath.has(t.id) ? "accent" : "plain"),
        edge: (c) => (onPath.has(c.id) && path.some((t) => t.left === c || t.right === c) ? "accent" : "line"),
      }),
    );
    items.push(note("l0", `LCA(${p}, ${q})`, 0, 3 * DY + R + 30, { size: 12.5, weight: 600 }));
    if (line) items.push(note("l1", line, 0, 3 * DY + R + 50, { tone: "soft", size: 12.5 }));
    return items;
  };
  const run = (p: number, q: number) => {
    const path: BNode[] = [];
    let cur: BNode | null = root;
    while (cur) {
      path.push(cur);
      if (p < cur.val && q < cur.val) {
        frames.push({ caption: `LCA(${p}, ${q}): at ${cur.val}, both values are smaller, so both lie in ${cur.val}'s left subtree — and so does every node that holds them both. Go left.`, items: draw(p, q, [...path], undefined, `both < ${cur.val}: go left`) });
        cur = cur.left;
      } else if (p > cur.val && q > cur.val) {
        frames.push({ caption: `At ${cur.val}, both ${p} and ${q} are larger, so both lie in its right subtree. Go right.`, items: draw(p, q, [...path], undefined, `both > ${cur.val}: go right`) });
        cur = cur.right;
      } else {
        frames.push({
          caption: `${path.length === 1 ? `LCA(${p}, ${q}) is settled at the root: ` : `At ${cur.val}, `}${p} < ${cur.val} < ${q}: the two values sit on different sides, so this is where their paths part and no deeper node holds both. The answer is ${cur.val}, after ${path.length} ${path.length === 1 ? "step" : "steps"}: O(h).`,
          items: draw(p, q, [...path], cur, `${p} < ${cur.val} < ${q}: split here → ${cur.val}`),
        });
        return;
      }
    }
  };
  run(4, 7);
  run(4, 14);
  return finish({ title: "Lowest common ancestor: walk down until the two values split", input: `the tree from ${VALUES.join(", ")}; LCA(4, 7) and LCA(4, 14)`, frames });
}

/* ── Insertion order decides the shape ────────────────────────────── */

function skewed(): Walkthrough {
  const r = 14;
  const sortedOrder = [1, 2, 3, 4, 5, 6, 7];
  const mixedOrder = [4, 2, 6, 1, 3, 5, 7];
  const chain = buildTree(sortedOrder);
  const bushy = buildTree(mixedOrder);
  const comparisons = (t: BNode | null, v: number) => {
    let k = 0;
    while (t) {
      k++;
      if (t.val === v) break;
      t = v < t.val ? t.left : t.right;
    }
    return k;
  };
  const hc = heightOf(chain);
  const hb = heightOf(bushy);
  const atC = rankLayout(chain, sortedOrder, { dx: 30, dy: 36, y: 30 });
  const atB = rankLayout(bushy, mixedOrder, { dx: 34, dy: 56, x: 250, y: 30 });
  const items: Item[] = [
    ...drawBst(chain, atC, { r, prefix: "c", size: 12 }),
    ...drawBst(bushy, atB, { r, prefix: "b", size: 12 }),
    label("tc", `insert ${sortedOrder.join(", ")}`, 0, 0, { anchor: "start", tone: "ink", size: 12, weight: 600 }),
    label("hc", `height ${hc}: a chain`, 0, 30 + hc * 36 + 30, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }),
    label("tb", `insert ${mixedOrder.join(", ")}`, 250 + 3 * 34, 0, { tone: "ink", size: 12, weight: 600 }),
    label("hb", `height ${hb}`, 250 + 3 * 34, 30 + hb * 56 + 30, { tone: "accent", size: 11.5, weight: 600 }),
  ];
  return finish({
    title: "The same seven values, inserted in two orders",
    input: "",
    frames: [
      {
        caption: `Sorted input makes each value the right child of the last: a chain of height ${hc}, where finding 7 takes ${comparisons(chain, 7)} comparisons — a linked list. A mixed order builds height ${hb}, and 7 takes ${comparisons(bushy, 7)}. Every operation costs O(h), so the shape is everything.`,
        items,
      },
    ],
  });
}

/* ── A rotation ───────────────────────────────────────────────────── */

function rotation(): Walkthrough {
  const root = buildTree([4, 2, 5, 1, 3]);
  const universe = inorder(root);
  const draw = (t: BNode, hot: Set<number>, tag: string, lifted: Set<number>): Item[] => {
    const at = rankLayout(t, universe, { dx: 46, dy: 60 });
    const items = drawBst(t, at, { r: R, edge: (c) => (hot.has(c.id) ? "accent" : "line"), tone: (n) => (lifted.has(n.id) ? "accent" : "plain") });
    items.push(note("io", `inorder: ${inorder(t).join(" ")}`, 0, 2 * 60 + R + 28, { tone: "soft", size: 12.5 }));
    items.push(note("tag", tag, 0, -R - 16, { tone: "ink", size: 12.5, weight: 600, mono: false }));
    return items;
  };
  const y = root;
  const x = y.left!;
  const B = x.right!;
  const order = inorder(root);
  const before = draw(root, new Set([x.id, B.id]), `before: ${y.val} on top`, new Set([x.id, y.id]));
  // Rotate right at y: x comes up, y goes down to its right, and x's right subtree B crosses over to become y's left.
  y.left = B;
  x.right = y;
  const after = draw(x, new Set([y.id, B.id]), `after rotating right: ${x.val} on top`, new Set([x.id, y.id]));
  return finish({
    title: "A right rotation lifts a node without breaking the order",
    input: "insert 4, 2, 5, 1, 3; rotate right at 4",
    frames: [
      { caption: `Before: ${y.val} is on top with left child ${x.val}, and ${x.val}'s right child is ${B.val}. Read left to right, the values are ${order.join(", ")} — the order any reshaping must keep.`, items: before },
      {
        caption: `Rotating right at ${y.val} lifts ${x.val} to the top, ${y.val} becomes ${x.val}'s right child, and ${B.val} crosses over to become ${y.val}'s left child. Only three links changed, so it is O(1), and the inorder is still ${inorder(x).join(", ")}.`,
        items: after,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  property,
  search,
  delete: deletes,
  validate,
  lca,
  skewed,
  rotation,
};

