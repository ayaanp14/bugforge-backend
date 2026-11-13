import { finish, treeLayout, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { packet, service, wire } from "./sd-kit.js";

/**
 * Design Search Autocomplete: the case study's figures (content/notes/
 * system-design/design-search-autocomplete.md). Every figure loops (a
 * points subject), and everything drawn comes from running a real trie
 * over the sample queries below:
 *
 *  - build: the queries inserted one at a time; new nodes appear on the
 *    path, a word's node carries its count.
 *  - top-k: each prefix node's stored top 3, computed bottom-up by merging
 *    its children's lists (checked against a brute-force scan).
 *  - lookup: a user typing "tree" — one step down the trie per keystroke,
 *    the node's stored list returned as the suggestions.
 *  - pipeline: a window of new query logs aggregated, merged into the
 *    counts, the trie rebuilt and swapped onto the serving replicas — and
 *    the suggestions for "tr" changing as a result.
 */

const K = 3;
/** Sample queries and how often each was searched: an example, not real traffic. */
const COUNTS: Array<[string, number]> = [
  ["to", 50],
  ["tree", 40],
  ["try", 36],
  ["top", 35],
  ["trie", 25],
  ["toy", 20],
  ["true", 15],
];

type Ranked = Array<[string, number]>;
const rank = (xs: Ranked): Ranked => [...xs].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

class Trie {
  /** Every prefix node, keyed by the prefix it spells ("" is the root). */
  nodes = new Map<string, { kids: string[]; count: number; top: Ranked }>([["", { kids: [], count: 0, top: [] }]]);
  insert(word: string, count: number): string[] {
    const made: string[] = [];
    for (let i = 1; i <= word.length; i++) {
      const p = word.slice(0, i);
      if (!this.nodes.has(p)) {
        this.nodes.set(p, { kids: [], count: 0, top: [] });
        const parent = this.nodes.get(word.slice(0, i - 1))!;
        parent.kids.push(p);
        parent.kids.sort();
        made.push(p);
      }
    }
    this.nodes.get(word)!.count += count;
    return made;
  }
  /** Fill every node's top K bottom-up: its own word (if any) merged with its children's lists. */
  computeTop(p = ""): Ranked {
    const n = this.nodes.get(p)!;
    const all: Ranked = n.count ? [[p, n.count]] : [];
    for (const k of n.kids) all.push(...this.computeTop(k));
    n.top = rank(all).slice(0, K);
    return n.top;
  }
  /** Brute force: every word under the prefix, ranked. */
  scan(p: string): Ranked {
    return rank([...this.nodes].filter(([w, n]) => n.count && w.startsWith(p)).map(([w, n]) => [w, n.count] as [string, number])).slice(0, K);
  }
}

function build(counts = COUNTS): Trie {
  const t = new Trie();
  for (const [w, c] of counts) t.insert(w, c);
  t.computeTop();
  for (const p of t.nodes.keys()) if (p && JSON.stringify(t.scan(p)) !== JSON.stringify(t.nodes.get(p)!.top)) throw new Error(`top-k: "${p}" disagrees with a scan`);
  return t;
}

const R = 13;
/** A query's count beside its node: under a leaf, to the left of a node with children (its edges run below it). */
const countLabel = (p: string, count: number, x: number, y: number, inner: boolean, tone: "soft" | "accent" = "soft"): Item =>
  inner ? label(`c-${p}`, `${p} ${count}`, x - R - 4, y + 1, { anchor: "end", size: 9.5, mono: true, tone }) : label(`c-${p}`, `${p} ${count}`, x, y + R + 10, { size: 9.5, mono: true, tone });
const show = (r: Ranked) => r.map(([w, c]) => `${w} ${c}`).join(", ");

/** The trie drawn as a tree under a root dot; `tone(prefix)` colours a node. */
function drawTrie(t: Trie, o: { only?: Set<string>; tone?: (p: string) => Tone; counts?: boolean; edge?: (p: string) => boolean } = {}) {
  const at = treeLayout<string>("", (p) => t.nodes.get(p)!.kids, { dx: 52, dy: 48 });
  const items: Item[] = [];
  for (const [p, n] of t.nodes) {
    if (o.only && !o.only.has(p)) continue;
    const pos = at.get(p)!;
    for (const k of n.kids) {
      if (o.only && !o.only.has(k)) continue;
      const c = at.get(k)!;
      const hot = o.edge?.(k);
      items.push({ k: "edge", id: `e-${k}`, x1: pos.x, y1: pos.y + (p ? R : 4), x2: c.x, y2: c.y - R, tone: hot ? "accent" : "line" });
    }
    if (!p) items.push({ k: "node", id: "n-root", x: pos.x, y: pos.y, r: 4, text: "", tone: "plain" });
    else {
      items.push({ k: "node", id: `n-${p}`, x: pos.x, y: pos.y, r: R, text: p[p.length - 1], tone: o.tone?.(p) ?? (n.count ? "strong" : "plain"), size: 12 });
      if (o.counts !== false && n.count) items.push(countLabel(p, n.count, pos.x, pos.y, n.kids.length > 0));
    }
  }
  return { items, at };
}

/* ── Build ────────────────────────────────────────────────────────── */

function buildFigure(): Walkthrough {
  const full = build();
  const t = new Trie();
  const frames: Frame[] = [];
  const seen = new Set<string>([""]);
  COUNTS.forEach(([w, c], i) => {
    const made = t.insert(w, c);
    for (const p of [...made, w]) seen.add(p);
    const path = new Set(Array.from({ length: w.length }, (_, j) => w.slice(0, j + 1)));
    // Draw on the finished trie's layout so nodes never jump as words arrive.
    const counted = new Set(COUNTS.slice(0, i + 1).map(([x]) => x));
    const { items } = drawTrie(full, {
      only: seen,
      tone: (p) => (made.includes(p) ? "accent" : counted.has(p) ? "strong" : path.has(p) ? "accent" : "plain"),
      edge: (p) => path.has(p),
      counts: false,
    });
    for (const x of counted) {
      const node = items.find((it) => it.id === `n-${x}`);
      if (node && node.k === "node") items.push(countLabel(x, COUNTS.find(([y]) => y === x)![1], node.x, node.y, full.nodes.get(x)!.kids.length > 0, x === w ? "accent" : "soft"));
    }
    const shared = w.length - made.length;
    const caption =
      i === 0
        ? `Insert "${w}" (searched ${c} times): one node per letter, and the last node marks a complete query with its count.`
        : i === COUNTS.length - 1
          ? `"${w}" reuses ${shared} nodes and adds ${made.length}. ${COUNTS.length} queries share one trie of ${full.nodes.size - 1} nodes: a common prefix is stored once.`
          : `Insert "${w}" (${c}): ${shared ? `it walks ${shared} existing node${shared > 1 ? "s" : ""} ("${w.slice(0, shared)}")` : "nothing is shared"} and adds ${made.length === 0 ? "no new node, only a count" : `${made.length} new`}.`;
    frames.push({ caption, items });
  });
  return finish({ title: "A trie built from search queries and their counts", input: "", frames });
}

/* ── Top-k per node ───────────────────────────────────────────────── */

function topKFigure(): Walkthrough {
  const t = build();
  const order = ["tre", "tr", "to", "t"];
  const frames: Frame[] = [];
  order.forEach((p, i) => {
    const done = new Set(order.slice(0, i));
    const kids = t.nodes.get(p)!.kids;
    const { items, at } = drawTrie(t, { tone: (q) => (q === p ? "accent" : kids.includes(q) ? "plain" : done.has(q) ? "strong" : "plain") });
    const top = t.nodes.get(p)!.top;
    const xs = [...at.values()].map((v) => v.x);
    const PX = Math.max(...xs) + 40;
    items.push(label("ph", `stored at "${p}"`, PX, 8, { anchor: "start", size: 11, weight: 600, tone: "accent" }));
    for (let r = 0; r < K; r++) {
      const e = top[r];
      items.push(box(`k${r}`, PX, 20 + r * 32, e ? `${e[0]} · ${e[1]}` : "", { w: 104, h: 26, size: 11, tone: e ? (i === order.length - 1 ? "strong" : "accent") : "muted" }));
    }
    const from = kids.map((k) => `"${k}"`).join(", ");
    const caption =
      i === 0
        ? `Each node stores its top ${K} queries so a lookup never scans a subtree. "${p}" has one query below it: ${show(top)}.`
        : i === order.length - 1
          ? `"${p}" merges ${from} and keeps ${show(top)}. The lists are built offline, bottom-up; at query time they are only read.`
          : `"${p}" merges ${t.nodes.get(p)!.count ? "its own query with " : ""}its children's lists (${from}) and keeps the best ${K}: ${show(top)}.`;
    frames.push({ caption, items });
  });
  return finish({ title: `Top ${K} suggestions stored at every prefix`, input: "", frames });
}

/* ── Lookup ───────────────────────────────────────────────────────── */

function lookupFigure(): Walkthrough {
  const t = build();
  const typed = "tree";
  const frames: Frame[] = [];
  for (let i = 1; i <= typed.length; i++) {
    const p = typed.slice(0, i);
    const path = new Set(Array.from({ length: i }, (_, j) => typed.slice(0, j + 1)));
    const { items, at } = drawTrie(t, { tone: (q) => (q === p ? "accent" : path.has(q) ? "strong" : "plain"), edge: (q) => path.has(q), counts: false });
    const xs = [...at.values()].map((v) => v.x);
    const PX = Math.max(...xs) + 40;
    items.push(box("q", PX, 0, `${p}|`, { w: 120, h: 28, size: 12, tone: "plain" }));
    const top = t.nodes.get(p)!.top;
    for (let r = 0; r < K; r++) items.push(box(`s${r}`, PX, 38 + r * 30, top[r] ? top[r][0] : "", { w: 120, h: 26, size: 11, tone: top[r] ? (i === typed.length ? "strong" : "accent") : "muted" }));
    const caption =
      i === 1
        ? `The user types "${p}". The service steps one node down from the root and returns the list stored there: ${top.map((x) => x[0]).join(", ")}.`
        : i === typed.length
          ? `"${p}" is a whole query; its node offers ${top.map((x) => x[0]).join(", ")}. Each keystroke cost one step and one read, however many queries share the prefix.`
          : `"${p}": one more step down, a new stored list — ${top.map((x) => x[0]).join(", ")}. No ranking happens while the user waits.`;
    frames.push({ caption, items });
  }
  return finish({ title: `Typing "${typed}": one trie step per keystroke`, input: "", frames });
}

/* ── The rebuild pipeline ─────────────────────────────────────────── */

function pipelineFigure(): Walkthrough {
  const before = build();
  const LOG = ["try", "try", "trie", "try", "toy", "try", "true", "try"];
  const window = new Map<string, number>();
  for (const q of LOG) window.set(q, (window.get(q) ?? 0) + 1);
  const merged = COUNTS.map(([w, c]) => [w, c + (window.get(w) ?? 0)] as [string, number]);
  const after = build(merged);
  const oldTr = before.nodes.get("tr")!.top;
  const newTr = after.nodes.get("tr")!.top;
  if (show(oldTr) === show(newTr)) throw new Error("pipeline: the example should change the suggestions for tr");
  const agg = rank([...window]);
  const X = [0, 124, 248, 386];
  const stages = (hot: number, versions: [string, string]): Item[] => {
    const logs = service("logs", X[0], 30, "Query logs", { w: 96, tone: hot === 0 ? "accent" : "plain" });
    const ag = service("agg", X[1], 30, "Aggregator", { w: 96, tone: hot === 1 ? "accent" : "plain" });
    const bl = service("bld", X[2], 30, "Trie builder", { w: 104, tone: hot === 2 ? "accent" : "plain" });
    const r1 = service("r1", X[3], 0, `Replica 1 · ${versions[0]}`, { w: 116, size: 11, tone: hot === 3 ? (versions[0] === "v2" ? "accent" : "plain") : versions[0] === "v2" ? "strong" : "plain" });
    const r2 = service("r2", X[3], 60, `Replica 2 · ${versions[1]}`, { w: 116, size: 11, tone: hot === 4 ? "strong" : "plain" });
    return [
      ...logs.items, ...ag.items, ...bl.items, ...r1.items, ...r2.items,
      wire("w0", logs.right, ag.left, { tone: hot === 1 ? "accent" : "line" }),
      wire("w1", ag.right, bl.left, { tone: hot === 2 ? "accent" : "line" }),
      wire("w2", bl.right, r1.left, { tone: hot >= 3 ? "accent" : "line" }),
      wire("w3", bl.right, r2.left, { tone: hot === 4 ? "accent" : "line" }),
    ];
  };
  const PY = 124;
  const table = (title: string, rows: Ranked, o: { tone?: Tone; fmt?: (r: [string, number]) => string } = {}): Item[] => [
    label("tt", title, 0, PY, { anchor: "start", size: 11, weight: 600 }),
    ...rows.map((r, i) => box(`t${i}`, (i % 4) * 118, PY + 12 + Math.floor(i / 4) * 32, o.fmt ? o.fmt(r) : `${r[0]} +${r[1]}`, { w: 110, h: 26, size: 10.5, tone: o.tone ?? "plain" })),
  ];
  const frames: Frame[] = [];
  {
    const items = stages(0, ["v1", "v1"]);
    LOG.slice(0, 4).forEach((q, i) => items.push(packet(`p${i}`, { x: 14 + i * 22, y: 14 }, { text: q[0] + q[q.length - 1], r: 9 })));
    items.push(...table(`Serving v1 — "tr" suggests`, oldTr, { fmt: (r) => `${r[0]} ${r[1]}` }));
    frames.push({ caption: `Every search is logged. While the serving trie (v1) still offers ${show(oldTr)} for "tr", new queries pile up in the logs.`, items });
  }
  {
    const items = stages(1, ["v1", "v1"]);
    LOG.slice(0, 4).forEach((q, i) => items.push(packet(`p${i}`, { x: X[1] + 14 + i * 22, y: 14 }, { text: q[0] + q[q.length - 1], r: 9 })));
    items.push(...table(`This window: ${LOG.length} searches, counted`, agg, { tone: "accent" }));
    frames.push({ caption: `A periodic job aggregates the window: ${agg.map(([w, c]) => `${w} +${c}`).join(", ")}. Counting offline keeps writes off the serving path.`, items });
  }
  {
    const items = stages(2, ["v1", "v1"]);
    items.push(...table(`New counts`, rank(merged), { tone: "plain", fmt: (r) => `${r[0]} ${r[1]}` }));
    frames.push({ caption: `The window is added to the stored counts and the builder makes a new trie, v2, recomputing every node's top ${K}.`, items });
  }
  {
    const items = stages(3, ["v2", "v1"]);
    items.push(...table(`v2 — "tr" suggests`, newTr, { tone: "accent", fmt: (r) => `${r[0]} ${r[1]}` }));
    frames.push({ caption: `Replica 1 swaps to v2 while replica 2 keeps serving v1, so suggestions never stop. In v2, "tr" offers ${show(newTr)}.`, items });
  }
  {
    const items = stages(4, ["v2", "v2"]);
    items.push(...table(`v2 — "tr" suggests`, newTr, { tone: "strong", fmt: (r) => `${r[0]} ${r[1]}` }));
    frames.push({ caption: `Both replicas serve v2. "${newTr[0][0]}" overtook "${oldTr[0][0]}" — suggestions follow what people search, one rebuild behind.`, items });
  }
  return finish({ title: "Logs → counts → new trie → replicas", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  build: buildFigure,
  "top-k": topKFigure,
  lookup: lookupFigure,
  pipeline: pipelineFigure,
};
