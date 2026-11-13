import { finish, link, note, rowLabel, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Topological sort (Competitive Programming, module 09): Kahn's algorithm
 * with a min-heap, the version that prints the lexicographically smallest
 * order (the module's first exercise).
 *
 *  - peel: six courses, seven "a before b" edges. In-degrees are counted
 *    from the edges; every course with in-degree 0 waits in the ready heap;
 *    each frame pops the smallest, appends it to the order, crosses off its
 *    out-edges and lets any course that reaches in-degree 0 into the heap.
 *    Everything drawn is the run's own state.
 */

type Pt = { x: number; y: number };

const R = 17;
const N = 6;
const EDGES: Array<[number, number]> = [[3, 1], [3, 4], [2, 4], [4, 6], [1, 6], [6, 5], [1, 5]];
const POS: Record<number, Pt> = { 2: { x: 0, y: 20 }, 3: { x: 0, y: 140 }, 4: { x: 130, y: 20 }, 1: { x: 130, y: 140 }, 6: { x: 260, y: 80 }, 5: { x: 390, y: 80 } };
const vertices = Array.from({ length: N }, (_, i) => i + 1);

function peel(): Walkthrough {
  const indeg: Record<number, number> = {};
  for (const v of vertices) indeg[v] = EDGES.filter(([, b]) => b === v).length;
  const crossed = new Set<string>();
  const order: number[] = [];
  let ready = vertices.filter((v) => indeg[v] === 0).sort((a, b) => a - b);
  const RY = 210;
  const S = 40;

  const draw = (o: { cur?: number; changed?: number[] } = {}): Item[] => {
    const items: Item[] = [];
    for (const [a, b] of EDGES) {
      const gone = crossed.has(`${a}-${b}`);
      const tone: LineTone = gone ? "faint" : a === o.cur ? "accent" : "line";
      items.push(link(`e${a}-${b}`, POS[a]!, POS[b]!, R, { arrow: true, tone, dashed: gone }));
    }
    for (const v of vertices) {
      const tone: Tone = v === o.cur ? "accent" : order.includes(v) ? "strong" : ready.includes(v) ? "accent" : "plain";
      items.push({ k: "node", id: `n${v}`, x: POS[v]!.x, y: POS[v]!.y, r: R, text: String(v), tone: order.includes(v) && v !== o.cur ? "muted" : tone });
      const dy = POS[v]!.y < 80 ? -R - 11 : R + 12;
      items.push(label(`in${v}`, `in=${indeg[v]}`, POS[v]!.x, POS[v]!.y + dy, { tone: o.changed?.includes(v) ? "accent" : "soft", size: 11, mono: true }));
    }
    items.push(rowLabel("rl", "ready", -10, RY, S));
    if (ready.length) ready.forEach((v, i) => items.push(box(`q${v}`, i * (S + 6), RY, v, { w: S, h: S, tone: "accent" })));
    else items.push(note("re", "empty", 0, RY + S / 2, { tone: "faint", size: 12 }));
    items.push(rowLabel("ol", "order", 160, RY, S));
    order.forEach((v, i) => items.push(box(`q${v}`, 170 + i * (S + 6), RY, v, { w: S, h: S, tone: "strong" })));
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `Count the arrows into each course: ${vertices.map((v) => `${v} has ${indeg[v]}`).join(", ")}. Courses ${ready.join(" and ")} need nothing first, so they start in the ready min-heap.`,
      items: draw(),
    },
  ];
  while (ready.length) {
    const u = ready.shift()!;
    order.push(u);
    const changed: number[] = [];
    for (const [a, b] of EDGES)
      if (a === u) {
        crossed.add(`${a}-${b}`);
        indeg[b]!--;
        changed.push(b);
      }
    const fresh = changed.filter((v) => indeg[v] === 0);
    ready = [...ready, ...fresh].sort((a, b) => a - b);
    const drops = changed.length ? `Cross off its arrows: ${changed.map((v) => `${v} drops to ${indeg[v]}`).join(", ")}.` : "It has no arrows out.";
    const enter = fresh.length ? ` ${fresh.join(" and ")} ${fresh.length === 1 ? "reaches" : "reach"} 0 and ${fresh.length === 1 ? "joins" : "join"} the heap.` : "";
    const why = order.length === 1 ? ` The heap hands out the smallest ready course, which makes the order the lexicographically smallest one.` : "";
    frames.push({ caption: `Pop ${u}, the smallest ready course, and append it to the order.${why} ${drops}${enter}`, items: draw({ cur: u, changed }) });
  }
  if (order.length !== N) throw new Error("peel: the example is a DAG and must place every course");
  frames.push({ caption: `The heap is empty and all ${N} courses are placed: ${order.join(", ")}. Every arrow points forwards in it. Had fewer than ${N} been placed, the rest would sit on a cycle.`, items: draw() });
  return finish({ title: "Kahn's algorithm peels the courses with nothing left to wait for", input: `edges = ${EDGES.map(([a, b]) => `${a}→${b}`).join(", ")}`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  peel,
};
