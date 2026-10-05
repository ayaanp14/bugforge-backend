import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";

/**
 * Indexing and B+ Trees in DBMS: the note's figures
 * (content/notes/dbms/indexing-and-b-plus-trees.md places each with
 * "@figure <name>").
 *
 * The B+ tree figures run a real order-4 B+ tree (at most 3 keys and 4
 * children a node) with the note's splitting conventions — a full leaf
 * splits 2 + 2 and copies the right half's first key up, a full internal
 * node keeps 2 keys, moves the third up and gives the fourth to a new
 * node — over the note's key sequence, and draw each snapshot it passes
 * through; searches walk that same tree. The other figures compute their
 * own: the sparse index's lookup is a real "largest entry ≤ key" search,
 * the tree height is the logarithm the note quotes, and the composite
 * index's ranges come from sorting its entries and testing each condition.
 * Each generator throws if its result disagrees with the note.
 *
 *  - bplus-insert: 10, 20, 30, 40, 50, 15, 25, 35, 45, 55 into an empty tree;
 *  - bplus-search: a point lookup, a miss, and a range scan along the leaves;
 *  - dense-sparse: a dense and a sparse index over a sorted file, both finding 105;
 *  - fan-out: why three levels of fan-out 100 reach a million keys;
 *  - composite-prefix: which conditions a (dept, city, salary) index can seek.
 */

/* ── An order-4 B+ tree ───────────────────────────────────────────── */

const MAX_KEYS = 3;
type BNode = { leaf: boolean; keys: number[]; kids: BNode[]; uid: number };

class BPlusTree {
  root: BNode;
  private next = 0;
  /** Called with the overflowing node just before it splits (its keys exceed MAX_KEYS). */
  onOverflow: ((n: BNode) => void) | null = null;
  readonly events: string[] = [];
  constructor() {
    this.root = this.node(true);
  }
  private node(leaf: boolean, keys: number[] = [], kids: BNode[] = []): BNode {
    return { leaf, keys, kids, uid: this.next++ };
  }
  insert(key: number) {
    const r = this.ins(this.root, key);
    if (r) {
      this.root = this.node(false, [r.up], [this.root, r.right]);
      this.events.push(`root ${r.up}`);
    }
  }
  private ins(n: BNode, key: number): { up: number; right: BNode } | null {
    if (n.leaf) {
      n.keys.push(key);
      n.keys.sort((a, b) => a - b);
      if (n.keys.length <= MAX_KEYS) {
        this.events.push(`fit ${n.keys.join(" ")}`);
        return null;
      }
      this.onOverflow?.(n);
      const right = this.node(true, n.keys.splice(2));
      this.events.push(`leaf ${n.keys.join(" ")} | ${right.keys.join(" ")} copy ${right.keys[0]}`);
      return { up: right.keys[0], right };
    }
    let i = 0;
    while (i < n.keys.length && key >= n.keys[i]) i++;
    const r = this.ins(n.kids[i], key);
    if (!r) return null;
    n.keys.splice(i, 0, r.up);
    n.kids.splice(i + 1, 0, r.right);
    if (n.keys.length <= MAX_KEYS) return null;
    this.onOverflow?.(n);
    // Keep the first two keys, move the third up, give the fourth (and its two children) to a new node.
    const up = n.keys[2];
    const right = this.node(false, [n.keys[3]], n.kids.splice(3));
    n.keys = n.keys.slice(0, 2);
    this.events.push(`inner ${n.keys.join(" ")} | ${right.keys.join(" ")} move ${up}`);
    return { up, right };
  }
  leaves(n: BNode = this.root): BNode[] {
    return n.leaf ? [n] : n.kids.flatMap((k) => this.leaves(k));
  }
  /** The nodes a search for `key` reads, root to leaf. */
  path(key: number): BNode[] {
    const out: BNode[] = [this.root];
    let n = this.root;
    while (!n.leaf) {
      let i = 0;
      while (i < n.keys.length && key >= n.keys[i]) i++;
      n = n.kids[i];
      out.push(n);
    }
    return out;
  }
}

/** A plain-data copy of the tree, so a snapshot keeps its shape after later inserts. */
type Snap = { leaf: boolean; keys: number[]; kids: Snap[]; uid: number };
const snap = (n: BNode): Snap => ({ leaf: n.leaf, keys: [...n.keys], kids: n.kids.map(snap), uid: n.uid });
const shape = (n: Snap): string => (n.leaf ? `[${n.keys.join(" ")}]` : `[${n.keys.join(" ")}](${n.kids.map(shape).join(" ")})`);

const KW = 30;
const KH = 28;
const LEVEL = 68;
const NODE_GAP = 18;
/** The final tree's height in levels below the root: leaves always sit at this depth, so the tree grows upward. */
const LEAF_DEPTH = 2;

type Placed = { n: Snap; x: number; y: number; w: number };

/** Leaves left to right, centred on cx; each internal node centred over its children. */
function place(root: Snap, cx: number): Placed[] {
  const depth = (n: Snap): number => (n.leaf ? 0 : 1 + depth(n.kids[0]));
  const height = depth(root);
  const out: Placed[] = [];
  const leaves: Snap[] = [];
  const collect = (n: Snap) => (n.leaf ? leaves.push(n) : n.kids.forEach(collect));
  collect(root);
  const total = leaves.reduce((a, l) => a + l.keys.length * KW, 0) + NODE_GAP * (leaves.length - 1);
  let x = cx - total / 2;
  const at = new Map<Snap, Placed>();
  for (const l of leaves) {
    const p = { n: l, x, y: LEAF_DEPTH * LEVEL, w: l.keys.length * KW };
    at.set(l, p);
    x += p.w + NODE_GAP;
  }
  const up = (n: Snap, d: number): Placed => {
    if (n.leaf) return at.get(n)!;
    const kids = n.kids.map((k) => up(k, d + 1));
    const mid = (kids[0].x + kids[kids.length - 1].x + kids[kids.length - 1].w) / 2;
    const w = n.keys.length * KW;
    const p = { n, x: mid - w / 2, y: (LEAF_DEPTH - height + d) * LEVEL, w };
    at.set(n, p);
    return p;
  };
  up(root, 0);
  for (const p of at.values()) out.push(p);
  return out;
}

/** Draw a snapshot: key cells (leaf keys `k<v>`, signposts `i<v>`), child pointers, and the leaf links. */
function drawTree(root: Snap, o: { cx?: number; tone?: (n: Snap, key: number) => Tone | undefined; edge?: (parent: Snap, child: Snap) => "accent" | "line"; link?: (from: Snap) => "accent" | "line" } = {}): Item[] {
  const placed = place(root, o.cx ?? 200);
  const byNode = new Map(placed.map((p) => [p.n, p]));
  const items: Item[] = [];
  for (const p of placed) {
    if (p.n.leaf) continue;
    p.n.kids.forEach((k, i) => {
      const c = byNode.get(k)!;
      items.push({ k: "edge", id: `e${k.uid}`, x1: p.x + i * KW, y1: p.y + KH, x2: c.x + c.w / 2, y2: c.y - 1, tone: o.edge?.(p.n, k) ?? "line" });
    });
  }
  const leaves = placed.filter((p) => p.n.leaf).sort((a, b) => a.x - b.x);
  leaves.slice(0, -1).forEach((p, i) => {
    const q = leaves[i + 1];
    items.push({ k: "edge", id: `l${p.n.uid}`, x1: p.x + p.w + 2, y1: p.y + KH / 2, x2: q.x - 3, y2: q.y + KH / 2, tone: o.link?.(p.n) ?? "line", arrow: true });
  });
  for (const p of placed) p.n.keys.forEach((k, i) => items.push(box(`${p.n.leaf ? "k" : "i"}${k}`, p.x + i * KW, p.y, k, { w: KW, h: KH, size: 12, tone: o.tone?.(p.n, k) ?? "plain" })));
  return items;
}

const KEYS = [10, 20, 30, 40, 50, 15, 25, 35, 45, 55];
const NOTE_FINAL = "[40]([20 30]([10 15] [20 25] [30 35]) [50]([40 45] [50 55]))";

function buildFinal(): BPlusTree {
  const t = new BPlusTree();
  for (const k of KEYS) t.insert(k);
  if (shape(snap(t.root)) !== NOTE_FINAL) throw new Error(`bplus: final tree ${shape(snap(t.root))} is not the note's`);
  return t;
}

const list = (ks: readonly number[]) => `[${ks.join(" ")}]`;

function bplusInsert(): Walkthrough {
  const t = new BPlusTree();
  const frames: Frame[] = [];
  let overflowShot: { root: Snap; uid: number } | null = null;
  t.onOverflow = (n) => {
    overflowShot = { root: snap(t.root), uid: n.uid };
  };
  const keyTone = (key: number, hot: Set<number>, up: Set<number>) => (n: Snap, k: number): Tone | undefined => {
    if (!n.leaf && up.has(k)) return "accent";
    if (n.leaf && hot.has(k)) return k === key ? "accent" : undefined;
    return undefined;
  };
  // 10, 20 and 30 fill the first leaf without a split: one frame for the three.
  for (const k of KEYS.slice(0, 3)) t.insert(k);
  frames.push({
    caption: `The tree starts as one leaf that is also the root. ${KEYS.slice(0, 3).join(", ")} fit, because an order-4 node holds at most ${MAX_KEYS} keys, kept sorted.`,
    items: drawTree(snap(t.root)),
  });
  let prevSignposts = new Set<number>();
  for (const key of KEYS.slice(3)) {
    overflowShot = null;
    const before = t.events.length;
    t.insert(key);
    const ev = t.events.slice(before);
    const root = snap(t.root);
    const signposts = new Set<number>();
    const walk = (n: Snap) => {
      if (!n.leaf) {
        n.keys.forEach((k) => signposts.add(k));
        n.kids.forEach(walk);
      }
    };
    walk(root);
    const fresh = new Set([...signposts].filter((k) => !prevSignposts.has(k)));
    const pathNow = t.path(key);
    const parentNow = pathNow.length > 1 ? pathNow[pathNow.length - 2].keys : [];
    const shot = overflowShot as { root: Snap; uid: number } | null;
    const leafSplit = ev.find((e) => e.startsWith("leaf "));
    const innerSplit = ev.find((e) => e.startsWith("inner "));
    const parts = (e: string) => /^\w+ (.+) \| (.+) (copy|move) (\d+)$/.exec(e)!;
    if (key === KEYS[3] && shot) {
      // The first split, shown before and after: the overflowing leaf, then the two halves.
      frames.push({
        caption: `${key} belongs in the same leaf, which would then hold ${shot.root.keys.length} keys, one more than the limit of ${MAX_KEYS}. A node that overflows must split.`,
        items: drawTree(shot.root, { tone: () => "error" }),
      });
    }
    if (innerSplit && shot) {
      const [, l, r, , up] = parts(leafSplit!);
      frames.push({
        caption: `${key} lands in a full leaf, which splits into [${l}] and [${r}], copying ${up} up. Now the root holds ${list(shot.root.keys)}, ${shot.root.keys.length} keys: it overflows too.`,
        items: drawTree(shot.root, { tone: (n, k) => (n.uid === shot.uid ? "error" : n.leaf && (k === key) ? "accent" : undefined) }),
      });
      const [, il, ir, , iup] = parts(innerSplit);
      frames.push({
        caption: `An internal node splits differently: it keeps [${il}], moves ${iup} up into a new root and gives [${ir}] to a new right node. ${iup} is moved, not copied, so it is no longer at that level. The tree grew at the top, so every leaf stays at the same depth.`,
        items: drawTree(root, { tone: (n, k) => (!n.leaf && k === Number(iup) ? "strong" : undefined) }),
      });
    } else if (leafSplit) {
      const [, l, r, , up] = parts(leafSplit);
      const newRoot = ev.some((e) => e.startsWith("root "));
      frames.push({
        caption: newRoot
          ? `The leaf splits into [${l}] and [${r}], and the right half's first key, ${up}, is copied up into a new root. It stays in the leaf too, because every key lives in a leaf; the root's copy is only a signpost.`
          : `${key} makes a full leaf overflow, so it splits into [${l}] and [${r}] and copies ${up} up: the parent becomes ${list(parentNow)}${parentNow.length === MAX_KEYS ? ", now full" : ""}.`,
        items: drawTree(root, { tone: keyTone(key, new Set([key]), fresh) }),
      });
    } else {
      const fit = ev.find((e) => e.startsWith("fit "))!.slice(4);
      const at = t.path(key)[0];
      const dir = at.leaf ? "" : key < at.keys[0] ? `${key} < ${at.keys[0]}, so it goes left: ` : `${key} ≥ ${at.keys[at.keys.findIndex((k, i) => key >= k && (i === at.keys.length - 1 || key < at.keys[i + 1]))]}, so it follows that pointer: `;
      frames.push({
        caption: `${dir}[${fit}] still has room, so ${key} simply fits. Nothing above the leaf changes.`,
        items: drawTree(root, { tone: keyTone(key, new Set([key]), new Set()) }),
      });
    }
    prevSignposts = signposts;
  }
  if (shape(snap(t.root)) !== NOTE_FINAL) throw new Error(`bplus-insert: final tree ${shape(snap(t.root))} is not the note's`);
  return finish({ title: "Inserting into an order-4 B+ tree, with splits", input: `insert ${KEYS.join(", ")}`, frames });
}

/* ── Searching: a point lookup, a miss, a range ───────────────────── */

function bplusSearch(): Walkthrough {
  const t = buildFinal();
  const root = snap(t.root);
  // Snapshots share uids with the live tree, so a path is a set of uids.
  const lookup = (key: number) => {
    const path = t.path(key);
    const leaf = path[path.length - 1];
    return { uids: new Set(path.map((n) => n.uid)), found: leaf.keys.includes(key), reads: path.length, leaf };
  };
  const hit = lookup(35);
  const miss = lookup(22);
  const LO = 22;
  const HI = 42;
  // Range: descend as for LO, then follow the leaf links until a key passes HI.
  const leaves = t.leaves();
  const start = leaves.indexOf(lookup(LO).leaf);
  const got: number[] = [];
  const visited = new Set<number>();
  let stopAt = -1;
  outer: for (let i = start; i < leaves.length; i++) {
    visited.add(leaves[i].uid);
    for (const k of leaves[i].keys) {
      if (k > HI) {
        stopAt = k;
        break outer;
      }
      if (k >= LO) got.push(k);
    }
  }
  if (!hit.found || hit.reads !== 3 || miss.found || got.join() !== "25,30,35,40") throw new Error(`bplus-search: ${hit.found}/${hit.reads}/${miss.found}/${got} disagree with the note`);
  const pathEdge = (uids: Set<number>) => (p: Snap, c: Snap) => (uids.has(p.uid) && uids.has(c.uid) ? "accent" : "line") as "accent" | "line";
  const rangeUids = lookup(LO).uids;
  return finish({
    title: "Searching a B+ tree: one path down, then along the leaves",
    input: "the tree after inserting 10 … 55",
    frames: [
      {
        caption: `Lookup 35: at the root, 35 < 40, so go left; at [20 30], 35 ≥ 30, so take the third pointer; the leaf [30 35] holds it. ${hit.reads} page reads, one per level.`,
        items: drawTree(root, { tone: (n, k) => (hit.uids.has(n.uid) ? (n.leaf && k === 35 ? "strong" : "accent") : undefined), edge: pathEdge(hit.uids) }),
      },
      {
        caption: "Lookup 22 follows the same rules to the leaf [20 25] and finds no 22 there. A miss also costs exactly one read per level: every search ends at a leaf.",
        items: drawTree(root, { tone: (n) => (miss.uids.has(n.uid) ? (n.leaf ? "error" : "accent") : undefined), edge: pathEdge(miss.uids) }),
      },
      {
        caption: `Range ${LO} to ${HI}: descend as for ${LO} to [20 25], then follow the leaf links right, collecting ${got.join(", ")}, and stop at ${stopAt}, the first key past ${HI}. The tree is never climbed again.`,
        items: drawTree(root, {
          tone: (n, k) => (n.leaf && got.includes(k) ? "strong" : n.leaf && k === stopAt ? "muted" : !n.leaf && rangeUids.has(n.uid) ? "accent" : undefined),
          edge: pathEdge(rangeUids),
          link: (from) => (visited.has(from.uid) && [...visited].includes(leaves[leaves.findIndex((l) => l.uid === from.uid) + 1]?.uid ?? -1) ? "accent" : "line"),
        }),
      },
    ],
  });
}

/* ── Dense and sparse indexes ─────────────────────────────────────── */

function denseSparse(): Walkthrough {
  const ROLLS = [101, 102, 103, 104, 105, 106, 107, 108, 109];
  const PER_BLOCK = 3;
  const WANT = 105;
  const blockOf = (i: number) => Math.floor(i / PER_BLOCK);
  const dense = ROLLS;
  const sparse = ROLLS.filter((_, i) => i % PER_BLOCK === 0);
  // Sparse lookup: the largest entry not greater than the key, then scan that block.
  let e = -1;
  for (let i = 0; i < sparse.length; i++) if (sparse[i] <= WANT) e = i;
  const blockRows = ROLLS.map((r, i) => [r, i] as const).filter(([, i]) => blockOf(i) === e);
  const scanned = blockRows.slice(0, blockRows.findIndex(([r]) => r === WANT) + 1);
  if (sparse[e] !== 104 || scanned.length !== 2 || !dense.includes(WANT)) throw new Error("dense-sparse: lookups disagree with the note");

  const RH = 22;
  const rowY = (i: number) => 40 + i * (RH + 3) + blockOf(i) * 22;
  const IW = 52;
  const DX = 112;
  const DW = 92;
  const SX = DX + DW + 60;
  const items: Item[] = [
    label("hd", "dense index", IW / 2, 6, { tone: "soft", size: 11.5, weight: 600 }),
    label("hf", "data file", DX + DW / 2, 6, { tone: "soft", size: 11.5, weight: 600 }),
    label("hs", "sparse index", SX + IW / 2, 6, { tone: "soft", size: 11.5, weight: 600 }),
  ];
  for (let b = 0; b * PER_BLOCK < ROLLS.length; b++) {
    const y1 = rowY(b * PER_BLOCK) - 4;
    const y2 = rowY(Math.min(ROLLS.length, (b + 1) * PER_BLOCK) - 1) + RH + 4;
    items.push(...region(`b${b}`, DX - 5, y1, DW + 10, y2 - y1, `block ${b + 1}`, { tone: b === e ? "accent" : "ghost", labelTone: b === e ? "accent" : "soft" }));
  }
  ROLLS.forEach((r, i) => {
    const want = r === WANT;
    items.push(box(`d${i}`, 0, rowY(i), r, { w: IW, h: RH, size: 11.5, tone: want ? "accent" : "plain" }));
    items.push(arrow(`da${i}`, { x: IW + 3, y: rowY(i) + RH / 2 }, { x: DX - 8, y: rowY(i) + RH / 2 }, { tone: want ? "accent" : "faint" }));
    items.push(box(`r${i}`, DX, rowY(i), `roll ${r}`, { w: DW, h: RH, size: 11.5, tone: want ? "strong" : scanned.some(([, j]) => j === i) ? "accent" : "plain" }));
  });
  sparse.forEach((r, k) => {
    const i = ROLLS.indexOf(r);
    items.push(box(`s${k}`, SX, rowY(i), r, { w: IW, h: RH, size: 11.5, tone: k === e ? "accent" : "plain" }));
    items.push(arrow(`sa${k}`, { x: SX - 3, y: rowY(i) + RH / 2 }, { x: DX + DW + 8, y: rowY(i) + RH / 2 }, { tone: k === e ? "accent" : "faint" }));
  });
  return finish({
    title: "Dense and sparse indexes on a file sorted by roll_no",
    input: `find roll_no ${WANT}`,
    frames: [
      {
        caption: `The dense index has an entry for all ${dense.length} keys and points straight at ${WANT}. The sparse index has one entry per block, ${sparse.length} in all: take the largest entry not above ${WANT}, ${sparse[e]}, read block ${e + 1} and scan to ${WANT}.`,
        items,
      },
    ],
  });
}

/* ── Fan-out: three levels for a million keys ─────────────────────── */

function fanOut(): Walkthrough {
  const N = 1_000_000;
  const F = 100;
  const ROWS_PER_PAGE = 100;
  let levels = 0;
  while (F ** levels < N) levels++;
  const perLevel = Array.from({ length: levels }, (_, d) => F ** d);
  const scanPages = N / ROWS_PER_PAGE;
  const reads = levels + 1;
  if (levels !== 3 || reads !== 4 || scanPages !== 10_000 || perLevel[levels - 1] * F !== N) throw new Error("fan-out: the note says 3 levels, 4 reads, 10,000 pages");
  const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const BW = 44;
  const BH = 26;
  const ROW = 58;
  // Two pages on each side of an ellipsis; the lookup goes through the second.
  const XS = [0, 52, 136, 188];
  const MID = (XS[1] + BW + XS[2]) / 2;
  const TX = XS[3] + BW + 26;
  const items: Item[] = [];
  let prev = { x: MID, y: 0 };
  perLevel.forEach((count, d) => {
    const y = d * ROW;
    const name = d === 0 ? "root" : d === levels - 1 ? "leaf" : "page";
    let hot: { x: number; y: number };
    if (count === 1) {
      items.push(box(`p${d}`, MID - BW / 2, y, name, { w: BW, h: BH, size: 11.5, tone: "accent" }));
      hot = { x: MID, y };
    } else {
      XS.forEach((x, i) => items.push(box(`p${d}-${i}`, x, y, name, { w: BW, h: BH, size: 11.5, tone: i === 1 ? "accent" : "plain" })));
      items.push(label(`dots${d}`, "…", MID, y + BH / 2, { tone: "soft", size: 15 }));
      hot = { x: XS[1] + BW / 2, y };
    }
    if (d > 0) items.push(arrow(`a${d}`, { x: prev.x, y: prev.y + BH + 2 }, { x: hot.x, y: y - 3 }, { tone: "accent" }));
    const text = d === levels - 1 ? `${fmt(count)} leaf pages × ${F} keys` : `${fmt(count)} page${count === 1 ? "" : "s"}`;
    items.push(label(`c${d}`, text, TX, y + BH / 2, { anchor: "start", tone: "soft", size: 12 }));
    prev = hot;
  });
  items.push(label("keys", `= ${fmt(F ** levels)} keys`, TX, (levels - 1) * ROW + BH / 2 + 18, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
  const dy = levels * ROW;
  items.push(box("data", prev.x - 40, dy, "the row's page", { w: 80 + 24, h: BH, size: 11.5, tone: "strong" }));
  items.push(arrow("ad", { x: prev.x, y: prev.y + BH + 2 }, { x: prev.x, y: dy - 3 }, { tone: "accent" }));
  items.push(label("sum", `index: ${levels} + 1 = ${reads} page reads`, TX, dy + BH / 2 - 9, { anchor: "start", tone: "accent", size: 12, weight: 600 }));
  items.push(label("scan", `full scan: ${fmt(scanPages)} pages`, TX, dy + BH / 2 + 9, { anchor: "start", tone: "error", size: 12, weight: 600 }));
  return finish({
    title: "Why a B+ tree is shallow: fan-out 100, three levels",
    input: `${fmt(N)} keys, ${F} to a page`,
    frames: [
      {
        caption: `Each page of the tree points to ${F} pages below it, so the levels hold ${perLevel.map(fmt).join(", ")} pages and the leaves reach ${fmt(F ** levels)} keys. A lookup reads one page per level and then the row's page: ${reads} reads instead of ${fmt(scanPages)}.`,
        items,
      },
    ],
  });
}

/* ── A composite index and the leftmost-prefix rule ───────────────── */

function compositePrefix(): Walkthrough {
  type E = { dept: string; city: string; salary: number };
  const raw: E[] = [
    { dept: "IT", city: "Pune", salary: 47000 },
    { dept: "CSE", city: "Pune", salary: 52000 },
    { dept: "MECH", city: "Delhi", salary: 42000 },
    { dept: "CSE", city: "Delhi", salary: 58000 },
    { dept: "ECE", city: "Pune", salary: 50000 },
    { dept: "CSE", city: "Pune", salary: 45000 },
    { dept: "MECH", city: "Pune", salary: 55000 },
    { dept: "ECE", city: "Mumbai", salary: 38000 },
    { dept: "CSE", city: "Pune", salary: 61000 },
  ];
  // The index's order: by dept, then city within dept, then salary within (dept, city).
  const idx = [...raw].sort((a, b) => (a.dept !== b.dept ? (a.dept < b.dept ? -1 : 1) : a.city !== b.city ? (a.city < b.city ? -1 : 1) : a.salary - b.salary));
  const runs = (ix: number[]) => ix.reduce((n, v, i) => n + (i === 0 || v !== ix[i - 1] + 1 ? 1 : 0), 0);
  const where = (p: (e: E) => boolean) => idx.flatMap((e, i) => (p(e) ? [i] : []));
  const cases: Array<{ cond: string; match: number[]; seek: number[] | null; note: string[] }> = [];
  const dept = where((e) => e.dept === "CSE");
  cases.push({ cond: "dept = 'CSE'", match: dept, seek: dept, note: ["seek dept = 'CSE'", "one contiguous range"] });
  const three = where((e) => e.dept === "CSE" && e.city === "Pune" && e.salary > 50000);
  cases.push({ cond: "dept = 'CSE' AND city = 'Pune' AND salary > 50000", match: three, seek: three, note: ["seek on all three:", "a range on the last"] });
  const city = where((e) => e.city === "Pune");
  cases.push({ cond: "city = 'Pune'", match: city, seek: null, note: [`${city.length} matches in ${runs(city)} runs:`, "no single range to seek"] });
  const skip = where((e) => e.dept === "CSE" && e.salary > 50000);
  cases.push({ cond: "dept = 'CSE' AND salary > 50000", match: skip, seek: dept, note: ["seek dept = 'CSE',", "then filter salary"] });
  // The rule the figure illustrates: a leftmost prefix gives one run; a non-leading column does not.
  if (runs(dept) !== 1 || runs(three) !== 1 || runs(city) < 2 || runs(skip) < 2 || !skip.every((i) => dept.includes(i))) throw new Error("composite-prefix: the sample does not show the rule");

  const cols = [
    { name: "dept", w: 56 },
    { name: "city", w: 70 },
    { name: "salary", w: 66 },
  ];
  const RH = 24;
  const rowY = (i: number) => 26 + i * (RH + 3);
  const colX = [0, 59, 132];
  const NX = 220;
  const draw = (c: (typeof cases)[number]): Item[] => {
    const items: Item[] = cols.map((col, j) => label(`h${j}`, col.name, colX[j] + col.w / 2, 8, { tone: "soft", size: 11, mono: true }));
    if (c.seek) items.push({ k: "band", id: "seek", x: -6, y: rowY(c.seek[0]) - 4, w: colX[2] + cols[2].w + 12, h: rowY(c.seek[c.seek.length - 1]) + RH + 4 - (rowY(c.seek[0]) - 4), tone: "accent" });
    idx.forEach((e, i) => {
      const hit = c.match.includes(i);
      const tone: Tone = hit ? "accent" : c.seek && c.seek.includes(i) ? "plain" : "muted";
      [e.dept, e.city, String(e.salary)].forEach((v, j) => items.push(box(`c${i}-${j}`, colX[j], rowY(i), v, { w: cols[j].w, h: RH, size: 11.5, tone })));
    });
    c.note.forEach((t, k) => items.push(label(`n${k}`, t, NX, rowY(Math.max(0, (c.seek ?? c.match)[0])) + RH / 2 + k * 17, { anchor: "start", tone: c.seek ? "accent" : "error", size: 12, weight: 600 })));
    return items;
  };
  return finish({
    title: "A composite index on (dept, city, salary): what it can seek",
    input: "CREATE INDEX idx ON employees (dept, city, salary)",
    frames: [
      {
        caption: `The index keeps its ${idx.length} entries sorted by dept, then city, then salary. dept = 'CSE' is a leftmost prefix, so its ${dept.length} entries sit together: one seek to the first, then read until dept changes.`,
        items: draw(cases[0]),
      },
      {
        caption: `Equality on dept and city narrows the run to CSE, Pune, which is sorted by salary inside, so salary > 50000 is a range at its end: ${three.length} entries, found by seeking on all three columns.`,
        items: draw(cases[1]),
      },
      {
        caption: `city = 'Pune' skips the leading column. Its ${city.length} entries are scattered through ${runs(city)} separate runs, one per department, so the index offers no single range to seek and the query must scan.`,
        items: draw(cases[2]),
      },
      {
        caption: `With dept = 'CSE' AND salary > 50000, city sits between them unused, so salary is not sorted inside the CSE run. The index seeks dept, then checks salary on each of the ${dept.length} entries and keeps ${skip.length}.`,
        items: draw(cases[3]),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "bplus-insert": bplusInsert,
  "bplus-search": bplusSearch,
  "dense-sparse": denseSparse,
  "fan-out": fanOut,
  "composite-prefix": compositePrefix,
};
