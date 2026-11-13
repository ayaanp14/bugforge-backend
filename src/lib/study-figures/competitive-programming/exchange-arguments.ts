import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Greedy and the exchange argument (scripts/study-plans/competitive-
 * programming/05-greedy/01-exchange-arguments.md):
 *
 *  - exchange: activity selection on the classic eleven intervals. The
 *    earliest-finish greedy is run for real; an optimal schedule that
 *    differs from it in as many places as possible is found by brute force
 *    over every subset; then the exchange argument is played out — the
 *    optimal schedule's i-th interval is swapped for the greedy's i-th, each
 *    swap checked to leave a valid schedule of the same size — until the
 *    optimum *is* the greedy's choice. Nothing drawn is asserted: every
 *    swap is verified before its frame is built.
 */

type Iv = readonly [number, number];
const IVS: Iv[] = [
  [1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14], [12, 16],
];
const fmt = (iv: Iv) => `[${iv[0]},${iv[1]})`;

/** Touching ends do not overlap: [1,4) then [4,6) is fine. */
const valid = (set: readonly Iv[]) => {
  const s = [...set].sort((a, b) => a[0] - b[0]);
  return s.every((iv, i) => i === 0 || s[i - 1]![1] <= iv[0]);
};

function greedy(ivs: readonly Iv[]): Iv[] {
  const order = [...ivs].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const out: Iv[] = [];
  let free = -Infinity;
  for (const iv of order) if (iv[0] >= free) {
    out.push(iv);
    free = iv[1];
  }
  return out;
}

function exchange(): Walkthrough {
  const G = greedy(IVS);
  // Every maximum schedule, then the one sharing the fewest positions with G.
  let best: Iv[][] = [];
  for (let mask = 0; mask < 1 << IVS.length; mask++) {
    const pick = IVS.filter((_, i) => mask & (1 << i));
    if (!valid(pick)) continue;
    if (!best.length || pick.length > best[0]!.length) best = [pick];
    else if (pick.length === best[0]!.length) best.push(pick);
  }
  if (best[0]!.length !== G.length) throw new Error(`exchange: greedy took ${G.length}, the optimum is ${best[0]!.length}`);
  const byStart = (s: readonly Iv[]) => [...s].sort((a, b) => a[0] - b[0]);
  const same = (s: readonly Iv[]) => byStart(s).filter((iv, i) => iv === G[i]).length;
  const O0 = byStart(best.reduce((a, b) => (same(b) < same(a) ? b : a)));

  // Lanes by finishing time — the order the greedy reads them in.
  const lanes = [...IVS].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const PX = 28;
  const LANE = 26;
  const BAR = 20;
  const maxT = Math.max(...IVS.map((iv) => iv[1]));
  const axisY = lanes.length * LANE + 8;
  const tagX = maxT * PX + 14;

  const draw = (tone: (iv: Iv) => Tone, tag: (iv: Iv) => string | null): Item[] => {
    const items: Item[] = [];
    lanes.forEach((iv, l) => {
      items.push(box(`b${l}`, iv[0] * PX, l * LANE, fmt(iv), { w: (iv[1] - iv[0]) * PX, h: BAR, size: 10, tone: tone(iv) }));
      const t = tag(iv);
      if (t) items.push(label(`t${l}`, t, tagX, l * LANE + BAR / 2, { anchor: "start", size: 11, weight: 600, tone: t === "swapped out" ? "error" : "accent" }));
    });
    items.push({ k: "path", id: "axis", pts: [[0, axisY], [maxT * PX, axisY]], tone: "ink", width: 1.2 });
    for (let t = 0; t <= maxT; t += 2) items.push(label(`x${t}`, String(t), t * PX, axisY + 12, { size: 10, mono: true, tone: "faint" }));
    // Reserve the tag column so the viewBox never changes between frames.
    items.push({ k: "path", id: "edge", pts: [[tagX + 90, 0], [tagX + 90, 0.1]], tone: "faint", width: 0.1 });
    return items;
  };

  const inSet = (s: readonly Iv[]) => (iv: Iv) => s.includes(iv);
  const frames: Frame[] = [
    {
      caption: `${IVS.length} activities, each [start, end), drawn one per lane in order of finishing time. Pick as many as possible with no two overlapping; one may start exactly when another ends.`,
      items: draw(() => "plain", () => null),
    },
    {
      caption: `The greedy: always take the activity that finishes first among those that start after the last one taken. It takes ${G.map(fmt).join(", ")}: ${G.length} activities.`,
      items: draw((iv) => (inSet(G)(iv) ? "accent" : "muted"), (iv) => (inSet(G)(iv) ? "greedy" : null)),
    },
    {
      caption: `Is ${G.length} the best? Take any optimal schedule O, say ${O0.map(fmt).join(", ")} — also ${O0.length}, sharing only ${same(O0)} of its activities with the greedy's.`,
      items: draw((iv) => (inSet(O0)(iv) ? "strong" : "muted"), (iv) => (inSet(O0)(iv) ? "O" : null)),
    },
  ];

  // The exchange: position by position, put the greedy's choice in O's place.
  let O = O0.slice();
  for (let i = 0; i < G.length; i++) {
    if (O[i] === G[i]) continue;
    const out = O[i]!;
    const next = O.slice();
    next[i] = G[i]!;
    if (!valid(next) || next.length !== O.length) throw new Error(`exchange: swapping ${fmt(out)} for ${fmt(G[i]!)} broke the schedule`);
    if (G[i]![1] > out[1]) throw new Error("exchange: the greedy's pick should finish no later");
    const after = O[i + 1];
    frames.push({
      caption: `Swap O's activity ${i + 1}, ${fmt(out)}, for the greedy's ${fmt(G[i]!)}. The greedy's ends at ${G[i]![1]}, no later than ${out[1]}, so it still ${after ? `finishes before ${fmt(after)} starts` : "fits after the others"}. Still valid, still ${next.length}.`,
      items: draw(
        (iv) => (iv === out ? "error" : iv === G[i] ? "accent" : inSet(next)(iv) ? "strong" : "muted"),
        (iv) => (iv === out ? "swapped out" : inSet(next)(iv) ? (iv === G[i] ? "swapped in" : "O") : null),
      ),
    });
    O = next;
  }
  frames.push({
    caption: `After the swaps O is exactly the greedy's schedule and never lost an activity. Since O was any optimum, the greedy's ${G.length} is optimal. That is an exchange argument.`,
    items: draw((iv) => (inSet(G)(iv) ? "strong" : "muted"), (iv) => (inSet(G)(iv) ? "greedy = O" : null)),
  });

  return finish({ title: "Why earliest finish is optimal: exchange an optimum into the greedy", input: IVS.map(fmt).join(" "), frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  exchange,
};
