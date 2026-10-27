import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, box, label } from "../../lesson-figures/kit.js";
import { PANEL_X, timeline, type Step } from "./isolation-levels.js";

/**
 * MVCC: the lesson's "one picture" — T1 reading a price twice while T2
 * updates it and commits — run on a model of InnoDB's versions.
 *
 *  - snapshot: transactions get increasing ids; an UPDATE puts a new version
 *    in the table and keeps the old one behind its roll pointer; T1's read
 *    view (REPEATABLE READ) is made at its first read and records which
 *    transactions had committed. Each SELECT walks the chain from the newest
 *    version with the lesson's three rules (own change; committed before the
 *    view; otherwise follow the pointer) — so the 500 T1 reads twice is what
 *    the walk returns, checked against the lesson.
 */

interface Version {
  value: number;
  trx: number;
}

function snapshot(): Walkthrough {
  const committed = new Set<number>([90]);
  const chain: Version[] = [{ value: 500, trx: 90 }]; // newest first
  let nextId = 100;
  const T1 = nextId++;
  let view: { committed: Set<number>; next: number } | null = null;

  /** The lesson's rules, walking from the newest version. */
  const read = (me: number): { version: Version; skipped: Version[] } => {
    if (!view) view = { committed: new Set(committed), next: nextId };
    const skipped: Version[] = [];
    for (const v of chain) {
      if (v.trx === me || view.committed.has(v.trx)) return { version: v, skipped };
      skipped.push(v);
    }
    throw new Error("snapshot: no visible version");
  };

  const steps: Step[] = [
    { t: 1, text: "START TRANSACTION;" },
    { t: 1, text: "SELECT price; -- 500" },
    { t: 2, text: "START TRANSACTION;" },
    { t: 2, text: "UPDATE … price = 550;" },
    { t: 2, text: "COMMIT;" },
    { t: 1, text: "SELECT price; -- 500" },
    { t: 1, text: "COMMIT;" },
  ];

  const VW = 150;
  /** Vertical distance between two versions in the panel. */
  const STEP = 74;
  const panel = (lit: { seen?: Version; skipped?: Version[] }): Item[] => {
    const items: Item[] = [label("ph", "row versions", PANEL_X, 8, { anchor: "start", tone: "ink", weight: 700, size: 12.5 })];
    chain.forEach((v, i) => {
      const y = 30 + i * STEP;
      const tone: Tone = lit.seen === v ? "strong" : lit.skipped?.includes(v) ? "muted" : committed.has(v.trx) ? "plain" : "accent";
      items.push(label(`vl${v.trx}`, i === 0 ? "in the table" : "in the undo log", PANEL_X, y, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
      items.push(box(`v${v.trx}`, PANEL_X, y + 8, `${v.value} · trx ${v.trx}${committed.has(v.trx) ? "" : " (open)"}`, { w: VW, h: 28, size: 12, tone }));
      if (i + 1 < chain.length) items.push(arrow(`rp${v.trx}`, { x: PANEL_X + VW - 22, y: y + 37 }, { x: PANEL_X + VW - 22, y: y + STEP + 6 }, { tone: "line", label: "roll ptr" }));
    });
    const vy = 30 + 2 * STEP;
    if (view) {
      items.push(label("rvl", "T1's read view", PANEL_X, vy, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
      items.push(box("rv", PANEL_X, vy + 8, `sees trx ${[...view.committed].join(", ")}`, { w: VW, h: 28, size: 12, tone: "accent" }));
    }
    return items;
  };

  const frames = [];
  frames.push({ caption: `T1 starts and is given transaction id ${T1}. The price row holds one version, 500, written by transaction 90, which committed long ago.`, items: [...timeline(steps, 0).items, ...panel({})] });
  const r1 = read(T1);
  frames.push({
    caption: `T1's first read makes its read view: transaction 90 had committed, ${T1} is itself, and anything numbered from ${view!.next} on did not exist yet. The newest version passes, so T1 reads ${r1.version.value}.`,
    items: [...timeline(steps, 1).items, ...panel({ seen: r1.version })],
  });
  const T2 = nextId++;
  frames.push({ caption: `T2 starts with id ${T2}. Nothing has changed for T1: no lock was taken by its read, and its view is already fixed.`, items: [...timeline(steps, 2).items, ...panel({})] });
  chain.unshift({ value: 550, trx: T2 });
  frames.push({
    caption: `T2's UPDATE writes a new version, 550 by transaction ${T2}, into the table, and keeps 500 in the undo log behind the roll pointer. Readers are not blocked; they can still reach the old version.`,
    items: [...timeline(steps, 3).items, ...panel({})],
  });
  committed.add(T2);
  frames.push({ caption: `T2 commits. 550 is now the latest committed price — but T1's read view was made before ${T2} committed, and a view never changes.`, items: [...timeline(steps, 4).items, ...panel({})] });
  const r2 = read(T1);
  if (r1.version.value !== 500 || r2.version.value !== 500 || r2.skipped.length !== 1) throw new Error("snapshot: T1 should read 500 twice, skipping one version");
  frames.push({
    caption: `T1 reads again. The newest version is by ${T2}, not in its view, so it follows the roll pointer to 500 by transaction 90, which its view does include, and reads ${r2.version.value} again. Neither transaction ever waited for the other.`,
    items: [...timeline(steps, 5).items, ...panel({ seen: r2.version, skipped: r2.skipped })],
  });
  view = null;
  frames.push({
    caption: "T1 commits and its view is dropped. A transaction reading from now on would see 550; once no read view needs 500, InnoDB's purge discards it from the undo log.",
    items: [...timeline(steps, 6).items, ...panel({})],
  });
  return finish({ title: "MVCC: a reader keeps its snapshot while a writer commits", input: "REPEATABLE READ; price 500, T2 sets it to 550", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  snapshot,
};
