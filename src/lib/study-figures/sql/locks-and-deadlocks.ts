import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { PANEL_X, panelCell, timeline, type Step } from "./isolation-levels.js";

/**
 * Locks and deadlocks: the lesson's two transfers locking rows 1 and 2 in
 * opposite orders.
 *
 *  - deadlock: each UPDATE asks the lock table for an exclusive lock on its
 *    row — granted when free or already its own, otherwise the transaction
 *    waits and the wait-for graph gains an edge to the holder. The side
 *    panel draws the lock table and that graph; the cycle is found by
 *    following the edges, not declared.
 */

type Tx = 1 | 2;

function deadlock(): Walkthrough {
  const holder = new Map<number, Tx>();
  const waits = new Map<Tx, { row: number; on: Tx }>();
  const request = (t: Tx, row: number): "granted" | "waits" => {
    const h = holder.get(row);
    if (h === undefined || h === t) {
      holder.set(row, t);
      return "granted";
    }
    waits.set(t, { row, on: h });
    return "waits";
  };
  /** The cycle through t's waits, if following them comes back to t. */
  const cycle = (t: Tx): Tx[] | null => {
    const seen: Tx[] = [t];
    let at = waits.get(t)?.on;
    while (at !== undefined) {
      if (at === t) return seen;
      if (seen.includes(at)) return null;
      seen.push(at);
      at = waits.get(at)?.on;
    }
    return null;
  };

  const steps: Step[] = [
    { t: 1, text: "UPDATE … id = 1;" },
    { t: 2, text: "UPDATE … id = 2;" },
    { t: 1, text: "UPDATE … id = 2 -- waits" },
    { t: 2, text: "UPDATE … id = 1 -- waits" },
  ];

  const NODE_Y = 186;
  const n1 = { x: PANEL_X + 22, y: NODE_Y };
  const n2 = { x: PANEL_X + 124, y: NODE_Y };
  const panel = (inCycle: boolean): Item[] => {
    const items: Item[] = [
      label("ph", "locks held", PANEL_X, 8, { anchor: "start", tone: "ink", weight: 700, size: 12.5 }),
      ...[1, 2].flatMap((row, i) => {
        const h = holder.get(row);
        return panelCell(`lk${row}`, `row ${row}`, h ? `X by T${h}` : "free", 30 + i * 46, h ? "accent" : "ghost", 130);
      }),
      label("wh", "wait-for graph", PANEL_X, 138, { anchor: "start", tone: "ink", weight: 700, size: 12.5 }),
      { k: "node", id: "g1", x: n1.x, y: n1.y, r: 16, text: "T1", tone: inCycle ? "error" : waits.has(1) ? "accent" : "plain" },
      { k: "node", id: "g2", x: n2.x, y: n2.y, r: 16, text: "T2", tone: inCycle ? "error" : waits.has(2) ? "accent" : "plain" },
    ];
    for (const [t, w] of waits) {
      const [a, b] = t === 1 ? [n1, n2] : [n2, n1];
      const dir = b.x > a.x ? 1 : -1;
      items.push({ k: "edge", id: `w${t}`, x1: a.x + 17 * dir, y1: a.y, x2: b.x - 18 * dir, y2: b.y, tone: inCycle ? "error" : "accent", arrow: true, bow: -40, label: `row ${w.row}` });
    }
    return items;
  };

  const frames = [];
  if (request(1, 1) !== "granted") throw new Error("deadlock: T1 should get row 1");
  frames.push({ caption: "Both transactions have started. T1 updates row 1 and takes an exclusive lock on it, held until it commits.", items: [...timeline(steps, 0).items, ...panel(false)] });
  if (request(2, 2) !== "granted") throw new Error("deadlock: T2 should get row 2");
  frames.push({ caption: "T2 updates row 2 and takes its exclusive lock. So far there is no conflict: each holds a different row.", items: [...timeline(steps, 1).items, ...panel(false)] });
  if (request(1, 2) !== "waits" || cycle(1)) throw new Error("deadlock: T1 should wait without a cycle");
  frames.push({ caption: "T1 now wants row 2, which T2 holds, so T1 waits — an edge T1 → T2 in the wait-for graph. A wait alone is normal; it ends when T2 commits.", items: [...timeline(steps, 2).items, ...panel(false)] });
  if (request(2, 1) !== "waits") throw new Error("deadlock: T2 should wait");
  const loop = cycle(2);
  if (!loop || loop.length !== 2) throw new Error("deadlock: the second wait should close a two-transaction cycle");
  frames.push({
    caption: `T2 wants row 1, which T1 holds: an edge T2 → T1 closes a cycle, and neither can ever proceed. InnoDB sees it at once, rolls back the transaction it judges smaller with error 1213, and the other goes on.`,
    items: [...timeline(steps, 3).items, ...panel(true)],
  });
  return finish({ title: "A deadlock: two transactions, each waiting for the other", input: "T1 locks row 1 then 2; T2 locks row 2 then 1", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  deadlock,
};
