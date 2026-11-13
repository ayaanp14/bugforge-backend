import { finish, link, note, row, rowLabel, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box } from "../../lesson-figures/kit.js";

/**
 * Shortest paths (Competitive Programming, module 08): Dijkstra's frontier.
 *
 *  - frontier: the lesson's contest Dijkstra — a min-heap of (distance,
 *    vertex) pairs with lazy deletion — run on a six-vertex directed graph.
 *    Each frame is one pop: a vertex settles and relaxes its out-edges, or a
 *    stale pair (its distance already beaten) is thrown away. The dist row,
 *    the heap and every caption are read off the run itself.
 */

type Pt = { x: number; y: number };
type Edge = readonly [number, number, number];

const R = 17;
const NAMES = ["A", "B", "C", "D", "E", "F"];
const EDGES: Edge[] = [[0, 1, 5], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 6], [2, 4, 7], [3, 4, 2], [3, 5, 6], [4, 5, 1]];
const POS: Pt[] = [{ x: 0, y: 90 }, { x: 130, y: 10 }, { x: 130, y: 170 }, { x: 270, y: 10 }, { x: 270, y: 170 }, { x: 400, y: 90 }];
const fmt = (d: number) => (d === Infinity ? "∞" : String(d));

function frontier(): Walkthrough {
  const n = NAMES.length;
  const dist: number[] = Array(n).fill(Infinity);
  const done: boolean[] = Array(n).fill(false);
  type Entry = { id: string; d: number; v: number };
  let pushes = 0;
  let heap: Entry[] = [];
  const push = (d: number, v: number) => {
    heap.push({ id: `h${pushes++}`, d, v });
    heap.sort((x, y) => x.d - y.d || x.v - y.v);
  };
  const DY = 236;
  const HY = DY + 70;

  const draw = (o: { cur?: number; relaxed?: number[]; stale?: Entry[] } = {}): Item[] => {
    const items: Item[] = [];
    EDGES.forEach(([a, b, w]) => {
      const tone: LineTone = a === o.cur && o.relaxed?.includes(b) ? "accent" : done[a] && done[b] ? "faint" : "line";
      items.push(link(`e${a}-${b}`, POS[a]!, POS[b]!, R, { arrow: true, tone, label: String(w) }));
    });
    const tone = (i: number): Tone => (i === o.cur ? "accent" : done[i] ? "strong" : "plain");
    NAMES.forEach((nm, i) => items.push({ k: "node", id: `n${i}`, x: POS[i]!.x, y: POS[i]!.y, r: R, text: nm, tone: tone(i) }));
    items.push(rowLabel("dl", "dist", -10, DY));
    items.push(...row("c", dist.map(fmt), { y: DY, tone: (i) => (o.relaxed?.includes(i) ? "accent" : done[i] ? "strong" : "plain") }));
    NAMES.forEach((nm, i) => items.push({ k: "text", id: `cn${i}`, x: 20 + i * 46, y: DY - 10, text: nm, tone: "faint", anchor: "middle", size: 10 }));
    items.push(rowLabel("hl", "heap", -10, HY));
    o.stale?.forEach((e, i) => items.push(box(e.id, i * 58, HY, `${e.d}:${NAMES[e.v]}`, { w: 52, h: 40, tone: "error", size: 12 })));
    const shift = o.stale?.length ?? 0;
    heap.forEach((e, i) => items.push(box(e.id, (i + shift) * 58, HY, `${e.d}:${NAMES[e.v]}`, { w: 52, h: 40, tone: i === 0 && !o.stale ? "accent" : "plain", size: 12 })));
    if (!heap.length && !o.stale) items.push(note("he", "empty", 0, HY + 20, { tone: "faint", size: 12 }));
    return items;
  };

  dist[0] = 0;
  push(0, 0);
  const frames: Frame[] = [{ caption: "dist[A] = 0 and every other distance is infinity. The heap holds one pair, (0, A): distance first, so the smallest distance is always on top.", items: draw() }];
  let stales = 0;
  while (heap.length) {
    const top = heap.shift()!;
    if (top.d > dist[top.v]!) {
      if (heap.every((e) => e.d > dist[e.v]!)) {
        // Only stale pairs are left: show the whole drain as one step.
        const rest = [top, ...heap];
        heap = [];
        frames.push({
          caption: `Every pair left is stale: ${rest.map((e) => `(${e.d}, ${NAMES[e.v]}) against dist ${dist[e.v]}`).join(", ")}. Each pop is skipped in O(log V).`,
          items: draw({ stale: rest }),
        });
        break;
      }
      frames.push({
        caption: stales++ === 0
          ? `Pop (${top.d}, ${NAMES[top.v]}): stale, because dist[${NAMES[top.v]}] is already ${dist[top.v]}. Lazy deletion just skips it — the check d > dist[v] is one line.`
          : `Pop (${top.d}, ${NAMES[top.v]}): stale again — dist[${NAMES[top.v]}] is ${dist[top.v]}. Skipped.`,
        items: draw({ stale: [top] }),
      });
      continue;
    }
    done[top.v] = true;
    const relaxed: number[] = [];
    const notes: string[] = [];
    for (const [a, b, w] of EDGES) {
      if (a !== top.v || top.d + w >= dist[b]!) continue;
      notes.push(`${NAMES[b]} ${fmt(dist[b]!)} → ${top.d + w}`);
      dist[b] = top.d + w;
      relaxed.push(b);
      push(dist[b]!, b);
    }
    const first = frames.length === 1;
    const caption = relaxed.length
      ? `Pop (${top.d}, ${NAMES[top.v]}): ${NAMES[top.v]} is settled at ${top.d}${first ? "" : ", since no path through a later vertex can be shorter"}. Relax its edges: ${notes.join(", ")}.`
      : `Pop (${top.d}, ${NAMES[top.v]}): settled at ${top.d}. None of its edges improves anything.`;
    frames.push({ caption, items: draw({ cur: top.v, relaxed }) });
  }
  frames.push({
    caption: `The heap is empty. Final distances from A: ${NAMES.map((nm, i) => `${nm} ${fmt(dist[i]!)}`).join(", ")}. Each vertex settled once; each edge relaxed at most once: O((V + E) log V).`,
    items: draw(),
  });
  return finish({ title: "Dijkstra's frontier: a heap of (distance, vertex) pairs", input: EDGES.map(([a, b, w]) => `${NAMES[a]}→${NAMES[b]} ${w}`).join(", "), frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  frontier,
};
