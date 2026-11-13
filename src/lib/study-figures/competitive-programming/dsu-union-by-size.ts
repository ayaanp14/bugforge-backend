import { finish, link, note, row, rowLabel, slotX, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../../walkthroughs/core.js";

/**
 * Disjoint set union (Competitive Programming, module 07): union by size
 * and path compression on seven elements. Every forest is drawn from the
 * real parent and size arrays that the real `find` and `unite` below have
 * just changed — the arrays are mirrored under the trees — so the picture
 * and the numbers cannot disagree.
 *
 *  - flatten: seven singletons; unite(0,1), unite(2,3), unite(0,2) builds a
 *    depth-2 path 3 → 2 → 0; unite(4,5), unite(4,6); then unite(3,6), whose
 *    find(3) and find(6) each re-point the walked nodes straight at the root.
 *    Ties in size keep the first root on top (the lesson's code).
 */

type Pt = { x: number; y: number };

const N = 7;
const R = 16;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** One tidy tree per root, roots left to right, centred on cx. */
function forestLayout(parent: readonly number[], cx: number): (i: number) => Pt {
  const dx = 46;
  const kids = (k: number) => range(parent.length).filter((i) => parent[i] === k && i !== k);
  const at = new Map<number, Pt>();
  let offset = 0;
  for (const r of range(parent.length).filter((i) => parent[i] === i)) {
    const t = treeLayout<number>(r, kids, { dx, dy: 54 });
    let max = 0;
    for (const [k, p] of t) {
      at.set(k, { x: p.x + offset, y: p.y });
      max = Math.max(max, p.x);
    }
    offset += max + dx + 8;
  }
  const xs = [...at.values()].map((p) => p.x);
  const shift = cx - (Math.min(...xs) + Math.max(...xs)) / 2;
  return (i: number) => {
    const p = at.get(i)!;
    return { x: p.x + shift, y: p.y };
  };
}

function flatten(): Walkthrough {
  const parent = range(N);
  const size = Array(N).fill(1);
  /** The path find(x) walks, x first and the root last, read without changing anything. */
  const pathOf = (x: number) => {
    const p = [x];
    while (parent[p[p.length - 1]!] !== p[p.length - 1]) p.push(parent[p[p.length - 1]!]!);
    return p;
  };
  /** find with path compression: every node on the walk now points at the root. */
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]!)));
  const height = () => Math.max(...range(N).map((i) => pathOf(i).length - 1));

  const cx = (slotX(N - 1) + 40) / 2;
  const PY = 190;
  const draw = (o: { hot?: number[]; root?: number; fresh?: number[] } = {}): Item[] => {
    const at = forestLayout(parent, cx);
    const items: Item[] = [];
    for (const i of range(N))
      if (parent[i] !== i) {
        const tone: LineTone = o.fresh?.includes(i) ? "accent" : "line";
        items.push(link(`e${i}`, at(i), at(parent[i]!), R, { arrow: true, tone }));
      }
    const tone = (i: number): Tone => (i === o.root ? "strong" : o.hot?.includes(i) ? "accent" : "plain");
    for (const i of range(N)) items.push({ k: "node", id: `n${i}`, x: at(i).x, y: at(i).y, r: R, text: String(i), tone: tone(i) });
    items.push(rowLabel("pl", "parent", -10, PY));
    items.push(...row("p", parent, { y: PY, index: true, tone: (i) => (o.fresh?.includes(i) ? "accent" : "plain") }));
    items.push(rowLabel("sl", "size", -10, PY + 62));
    items.push(...row("s", size, { y: PY + 62, tone: (i) => (parent[i] === i ? (i === o.root ? "strong" : "plain") : "muted"), text: (i) => (parent[i] === i ? String(size[i]) : "·") }));
    const sets = range(N).filter((i) => parent[i] === i).length;
    items.push(note("rd", `sets: ${sets} · tallest tree: ${height()} link${height() === 1 ? "" : "s"}`, 0, PY + 126, { size: 12, weight: 600 }));
    return items;
  };

  const frames: Frame[] = [{ caption: `Seven elements, seven sets: every element is its own root, so parent[i] = i and size[i] = 1. The size row is only read at a root.`, items: draw() }];

  /** unite(a, b) as the lesson writes it, with the frame that shows it. */
  const unite = (a: number, b: number, extra = "") => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) throw new Error("flatten: the example never unites a set with itself");
    const tie = size[ra] === size[rb];
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
    const rule = tie ? `Both sets have size ${size[ra] - size[rb]}, a tie, so ${ra} stays the root` : `The set of ${rb} is smaller, so its root ${rb} goes under ${ra}`;
    frames.push({ caption: `unite(${a}, ${b}): ${rule} and size[${ra}] becomes ${size[ra]}.${extra}`, items: draw({ root: ra, fresh: [rb] }) });
  };

  unite(0, 1);
  unite(2, 3);
  unite(0, 2, " Now 3 sits two links below its root — the only kind of path compression can shorten.");
  unite(4, 5);
  unite(4, 6);

  // unite(3, 6): first the walk find(3) takes, then the walk re-pointed.
  const walk3 = pathOf(3);
  frames.push({ caption: `unite(3, 6) starts with find(3), which walks ${walk3.join(" → ")} to the root ${walk3[walk3.length - 1]}.`, items: draw({ hot: walk3.slice(0, -1), root: walk3[walk3.length - 1] }) });
  const r3 = find(3);
  const moved3 = walk3.slice(0, -1).filter((v) => pathOf(v).length === 2);
  frames.push({ caption: `Path compression: on the way back every node of that walk points straight at ${r3}, so parent[3] is now ${parent[3]} and the next find(3) is one step.`, items: draw({ hot: moved3, root: r3, fresh: [3] }) });
  const walk6 = pathOf(6);
  const r6 = walk6[walk6.length - 1]!;
  if (size[r3]! <= size[r6]!) throw new Error("flatten: the example expects the set of 3 to be the larger");
  find(6);
  parent[r6] = r3;
  size[r3] += size[r6]!;
  frames.push({
    caption: `find(6) is ${walk6.join(" → ")}. The set of ${r3} has ${size[r3]! - size[r6]!} elements and the set of ${r6} has ${size[r6]}, so ${r6} goes under ${r3}: one set of ${size[r3]}.`,
    items: draw({ root: r3, fresh: [r6] }),
  });
  const walkLast = pathOf(5);
  find(5);
  frames.push({
    caption: `A later find(5) walks ${walkLast.join(" → ")} once and flattens it. Union by size keeps every tree at most log2 n tall; path compression flattens what is walked, and together a find costs almost O(1).`,
    items: draw({ hot: [5], root: r3, fresh: [5] }),
  });
  return finish({ title: "Union by size and path compression", input: "unite(0,1), unite(2,3), unite(0,2), unite(4,5), unite(4,6), unite(3,6), find(5)", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  flatten,
};
