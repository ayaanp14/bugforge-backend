import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, box, label } from "../../lesson-figures/kit.js";
import { rowEdge, rowsTable, show, type Row } from "./kit.js";

/**
 * How indexes work: a B+tree built for real, and InnoDB's two-step lookup.
 *
 *  - btree-lookup: a three-level B+tree built bottom-up from sorted keys
 *    (leaves of two keys, each parent separator the first key of a child),
 *    an equality search descending root → inner → leaf by comparing with
 *    the separators, then a range search reaching its first leaf once and
 *    walking the leaf links sideways. Every comparison drawn is the one the
 *    search made.
 *  - secondary-lookup: the lesson's customers — the secondary index on city
 *    holds (city, id) sorted, the clustered index holds the rows by id; WHERE
 *    city = 'Pune' searches the first for ids, then the second once per id.
 */

const KEYS = [10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 95, 99];
const LEAF = 2;
const FAN = 3;

interface Node {
  id: string;
  keys: number[];
  kids: Node[];
  /** Separator keys for an inner node: kids[i + 1] holds keys ≥ seps[i]. */
  level: number;
}

function build(): Node {
  let nodes: Node[] = [];
  for (let i = 0; i < KEYS.length; i += LEAF) nodes.push({ id: `L${i / LEAF}`, keys: KEYS.slice(i, i + LEAF), kids: [], level: 0 });
  let level = 0;
  while (nodes.length > 1) {
    level++;
    const up: Node[] = [];
    for (let i = 0; i < nodes.length; i += FAN) {
      const kids = nodes.slice(i, i + FAN);
      up.push({ id: `N${level}.${i / FAN}`, keys: kids.slice(1).map(minKey), kids, level });
    }
    nodes = up;
  }
  return nodes[0]!;
}
const minKey = (n: Node): number => (n.level === 0 ? n.keys[0]! : minKey(n.kids[0]!));

/** The child an inner node sends key k to: past every separator ≤ k. */
const childFor = (n: Node, k: number) => n.keys.filter((s) => s <= k).length;

const KW = 28;
const KH = 26;
const LEVEL_Y = [150, 75, 0];

/** Each node's left x, laid out leaves first with parents centred over their children. */
function layout(root: Node): Map<string, { x: number; y: number; w: number }> {
  const at = new Map<string, { x: number; y: number; w: number }>();
  let next = 0;
  const place = (n: Node): void => {
    const w = Math.max(1, n.keys.length) * KW;
    if (n.level === 0) {
      at.set(n.id, { x: next, y: LEVEL_Y[0]!, w });
      next += w + 18;
      return;
    }
    n.kids.forEach(place);
    const a = at.get(n.kids[0]!.id)!;
    const b = at.get(n.kids[n.kids.length - 1]!.id)!;
    at.set(n.id, { x: (a.x + b.x + b.w) / 2 - w / 2, y: LEVEL_Y[n.level]!, w });
  };
  place(root);
  return at;
}

function btreeLookup(): Walkthrough {
  const root = build();
  if (root.level !== 2) throw new Error(`btree-lookup: expected a three-level tree, built ${root.level + 1}`);
  const at = layout(root);
  const all: Node[] = [];
  const walk = (n: Node) => {
    all.push(n);
    n.kids.forEach(walk);
  };
  walk(root);
  const leaves = all.filter((n) => n.level === 0);

  // The searches, recorded.
  const descend = (k: number) => {
    const path: Array<{ node: Node; slot: number }> = [];
    let n = root;
    while (n.level > 0) {
      const c = childFor(n, k);
      path.push({ node: n, slot: c });
      n = n.kids[c]!;
    }
    path.push({ node: n, slot: n.keys.indexOf(k) });
    return path;
  };
  const target = 60;
  const path = descend(target);
  const leafHit = path[path.length - 1]!;
  if (leafHit.slot < 0) throw new Error("btree-lookup: the search missed its key");
  const [lo, hi] = [50, 85];
  const start = descend(lo)[path.length - 1]!.node;
  const walked: Node[] = [];
  for (let i = leaves.indexOf(start); i < leaves.length; i++) {
    walked.push(leaves[i]!);
    if (leaves[i]!.keys.some((k) => k > hi)) break;
  }
  const inRange = KEYS.filter((k) => k >= lo && k <= hi);

  const draw = (o: { lit?: Set<string>; keyTone?: (n: Node, i: number) => Tone | undefined; note?: string; links?: Set<string> }): Item[] => {
    const items: Item[] = [];
    for (const n of all) {
      const p = at.get(n.id)!;
      for (const kid of n.kids) {
        const c = at.get(kid.id)!;
        const hot = o.lit?.has(n.id) && o.lit?.has(kid.id);
        items.push(arrow(`e${kid.id}`, { x: c.x + c.w / 2 > p.x + p.w / 2 ? p.x + p.w - 4 : c.x + c.w / 2 < p.x + p.w / 2 ? p.x + 4 : p.x + p.w / 2, y: p.y + KH }, { x: c.x + c.w / 2, y: c.y - 2 }, { tone: hot ? "accent" : "line", head: true }));
      }
      n.keys.forEach((k, i) => items.push(box(`k${n.id}.${i}`, p.x + i * KW, p.y, k, { w: KW, h: KH, size: 11.5, tone: o.keyTone?.(n, i) ?? (o.lit?.has(n.id) ? "accent" : n.level === 0 ? "plain" : "muted") })));
    }
    for (let i = 0; i + 1 < leaves.length; i++) {
      const a = at.get(leaves[i]!.id)!;
      const b = at.get(leaves[i + 1]!.id)!;
      const hot = o.links?.has(leaves[i]!.id);
      items.push(arrow(`ll${i}`, { x: a.x + a.w + 2, y: a.y + KH / 2 }, { x: b.x - 2, y: b.y + KH / 2 }, { tone: hot ? "accent" : "faint", head: true }));
    }
    items.push(label("lv2", "root", -10, LEVEL_Y[2]! + KH / 2, { anchor: "end", tone: "soft", size: 11 }));
    items.push(label("lv1", "inner", -10, LEVEL_Y[1]! + KH / 2, { anchor: "end", tone: "soft", size: 11 }));
    items.push(label("lv0", "leaves", -10, LEVEL_Y[0]! + KH / 2, { anchor: "end", tone: "soft", size: 11 }));
    if (o.note) items.push(label("note", o.note, 0, LEVEL_Y[0]! + KH + 26, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    return items;
  };

  const litUpTo = (n: number) => new Set(path.slice(0, n).map((s) => s.node.id));
  const [r, inner] = [path[0]!, path[1]!];
  const sepText = (s: { node: Node; slot: number }) => {
    const ks = s.node.keys;
    return s.slot === 0 ? `${target} < ${ks[0]}` : s.slot === ks.length ? `${target} ≥ ${ks[ks.length - 1]}` : `${ks[s.slot - 1]} ≤ ${target} < ${ks[s.slot]}`;
  };

  return finish({
    title: "A B+tree: descend once, then walk the leaves",
    input: `keys ${KEYS.join(", ")} · ${LEAF} per leaf`,
    frames: [
      {
        caption: `The index keeps the keys sorted in leaf pages linked left to right. Each inner page holds only separators that steer a search: here ${leaves.length} leaves, ${root.kids.length} inner pages and one root.`,
        items: draw({}),
      },
      {
        caption: `Find ${target}. The root compares it with its separator: ${sepText(r)}, so the search goes to child ${r.slot + 1}. One page read.`,
        items: draw({ lit: litUpTo(1), keyTone: (n) => (n === r.node ? "accent" : undefined) }),
      },
      {
        caption: `The inner page compares again: ${sepText(inner)}, child ${inner.slot + 1}. A second page read, and only one page per level is ever touched.`,
        items: draw({ lit: litUpTo(2) }),
      },
      {
        caption: `The leaf holds ${target}: found in ${path.length} page reads. With hundreds of keys per real page, three or four levels cover tens of millions of rows.`,
        items: draw({ lit: litUpTo(3), keyTone: (n, i) => (n === leafHit.node && i === leafHit.slot ? "strong" : undefined), note: `${target}: ${path.length} pages read of ${all.length}` }),
      },
      {
        caption: `A range, ${lo} to ${hi}, descends once to the leaf holding ${lo}, then follows the leaf links sideways, reading ${walked.length} leaves and stopping at the first key past ${hi}.`,
        items: draw({
          lit: new Set([...descend(lo).map((s) => s.node.id), ...walked.map((n) => n.id)]),
          links: new Set(walked.slice(0, -1).map((n) => n.id)),
          keyTone: (n, i) => (n.level === 0 && walked.includes(n) ? (n.keys[i]! >= lo && n.keys[i]! <= hi ? "strong" : "muted") : undefined),
          note: `BETWEEN ${lo} AND ${hi} → ${inRange.join(", ")}`,
        }),
      },
    ],
  });
}

const CUSTOMERS: Row[] = [
  { id: 1, email: "asha@…", city: "Pune" },
  { id: 2, email: "ravi@…", city: "Delhi" },
  { id: 3, email: "meera@…", city: "Pune" },
];

function secondaryLookup(): Walkthrough {
  // The secondary index: (city, id) sorted — what idx_customers_city's leaves hold.
  const idx = [...CUSTOMERS].map((r) => ({ city: r.city, id: r.id })).sort((a, b) => String(a.city).localeCompare(String(b.city)) || (a.id as number) - (b.id as number));
  const want = "Pune";
  const hits = idx.filter((e) => e.city === want).map((e) => e.id as number);
  if (hits.join() !== "1,3") throw new Error("secondary-lookup: Pune should give ids 1 and 3");
  const clustered = [...CUSTOMERS].sort((a, b) => (a.id as number) - (b.id as number));

  const draw = (step: 0 | 1 | 2 | 3): Item[] => {
    const s = rowsTable("x", "idx_customers_city (secondary)", ["city", "id"], idx, {
      key: (r) => `${idx[r]!.city}.${idx[r]!.id}`,
      tone: (r) => (step >= 1 && idx[r]!.city === want ? "accent" : step >= 1 ? "muted" : "plain"),
      w: { city: 64, id: 40 },
    });
    const CX = s.right + 120;
    const fetched = step === 2 ? hits.slice(0, 1) : step === 3 ? hits : [];
    const c = rowsTable("c", "clustered index (PRIMARY) — the rows", ["id", "email", "city"], clustered, {
      x: CX,
      key: (r) => clustered[r]!.id as number,
      tone: (r) => (fetched.includes(clustered[r]!.id as number) ? (fetched[fetched.length - 1] === clustered[r]!.id ? "strong" : "accent") : step >= 2 ? "muted" : "plain"),
      w: { id: 40, email: 70, city: 60 },
    });
    const items: Item[] = [...s.items, ...c.items];
    fetched.forEach((id) => {
      const from = idx.findIndex((e) => e.id === id);
      const to = clustered.findIndex((r) => r.id === id);
      items.push(arrow(`f${id}`, rowEdge(s, from, "right"), rowEdge(c, to, "left"), { tone: "accent", label: `id ${id}` }));
    });
    const reads = step === 3 ? `1 search of the index + ${hits.length} searches of the clustered index` : step === 1 ? `WHERE city = '${want}' → ids ${hits.join(", ")}` : "";
    if (reads) items.push(label("note", reads, 0, Math.max(s.bottom, c.bottom) + 22, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    return items;
  };

  return finish({
    title: "A secondary index stores the primary key, not the row",
    input: `SELECT * FROM customers WHERE city = '${want}'`,
    frames: [
      { caption: "InnoDB keeps two trees here. The clustered index is the table itself, rows sorted by id. The secondary index on city holds only each city with its row's id, sorted by city.", items: draw(0) },
      { caption: `The search goes down the secondary index to '${want}' and reads the matching entries side by side: ids ${hits.join(" and ")}. It has the ids, not yet the rows.`, items: draw(1) },
      { caption: `For the full row it searches the clustered index by id. First id ${hits[0]}: its leaf holds the whole row, city ${show(clustered.find((r) => r.id === hits[0])!.city!)} included.`, items: draw(2) },
      {
        caption: `Then id ${hits[1]}: one clustered lookup per matching row. Cheap for a few rows; for a third of the table those jumps cost more than a scan, which is why the optimizer may skip the index.`,
        items: draw(3),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "btree-lookup": btreeLookup,
  "secondary-lookup": secondaryLookup,
};
