import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { and3, not3, or3, showTruth, type Truth } from "./kit.js";

/**
 * NULL and three-valued logic: AND, OR and NOT over TRUE, FALSE and UNKNOWN.
 *
 *  - truth-tables: both 3 × 3 tables computed by the kit's and3/or3 (the
 *    same rules the other figures filter with) and checked against the
 *    lesson's printed tables; then the cells a known side decides (FALSE in
 *    AND, TRUE in OR), the cells left UNKNOWN, and NOT's row.
 */

const VALUES: Truth[] = [true, false, null];
const W = 70;
const H = 26;
const G = 3;
const LW = 66;

/** One operator's table: row and column headings, a cell per pair, `${p}${r}${c}` ids. */
function grid(p: string, op: string, f: (a: Truth, b: Truth) => Truth, y0: number, tone: (a: Truth, b: Truth, v: Truth) => Tone): Item[] {
  const x = 0;
  const items: Item[] = [label(`${p}op`, op, x + LW / 2, y0 + 13, { tone: "ink", weight: 700, size: 12.5 })];
  VALUES.forEach((b, c) => items.push(label(`${p}c${c}`, showTruth(b), x + LW + c * (W + G) + W / 2, y0 + 13, { tone: "soft", size: 11, mono: true })));
  VALUES.forEach((a, r) => {
    const y = y0 + 26 + r * (H + G);
    items.push(label(`${p}r${r}`, showTruth(a), x + LW - 8, y + H / 2, { anchor: "end", tone: "soft", size: 11, mono: true }));
    VALUES.forEach((b, c) => {
      const v = f(a, b);
      items.push(box(`${p}${r}${c}`, x + LW + c * (W + G), y, showTruth(v), { w: W, h: H, size: 11, tone: tone(a, b, v) }));
    });
  });
  return items;
}

function truthTables(): Walkthrough {
  // The lesson's tables, row by row (TRUE, FALSE, UNKNOWN against the same).
  const want = {
    and: ["TRUE FALSE UNKNOWN", "FALSE FALSE FALSE", "UNKNOWN FALSE UNKNOWN"],
    or: ["TRUE TRUE TRUE", "TRUE FALSE UNKNOWN", "TRUE UNKNOWN UNKNOWN"],
  };
  for (const [name, f] of [["and", and3], ["or", or3]] as const) {
    const got = VALUES.map((a) => VALUES.map((b) => showTruth(f(a, b))).join(" "));
    if (got.join() !== want[name].join()) throw new Error(`truth-tables: ${name} computes ${got.join(" / ")}`);
  }

  // AND above OR, NOT as a column to their right: narrow enough to stay legible on a phone.
  const OY = 26 + 3 * (H + G) + 22;
  const NX = LW + 3 * (W + G) + 40;
  const value = (v: Truth): Tone => (v === true ? "strong" : v === false ? "muted" : "accent");

  const draw = (stage: "and" | "both" | "decided" | "unknown" | "not"): Item[] => {
    const andTone = (a: Truth, b: Truth, v: Truth): Tone => {
      if (stage === "decided") return a === false || b === false ? "strong" : "ghost";
      if (stage === "unknown") return v === null ? "accent" : "ghost";
      if (stage === "not") return "ghost";
      return value(v);
    };
    const orTone = (a: Truth, b: Truth, v: Truth): Tone => {
      if (stage === "decided") return a === true || b === true ? "strong" : "ghost";
      if (stage === "unknown") return v === null ? "accent" : "ghost";
      if (stage === "not") return "ghost";
      return value(v);
    };
    const items: Item[] = grid("a", "AND", and3, 0, andTone);
    if (stage !== "and") items.push(...grid("o", "OR", or3, OY, orTone));
    if (stage === "not") {
      items.push(label("nop", "NOT", NX + W + 13, 13, { tone: "ink", weight: 700, size: 12.5 }));
      VALUES.forEach((a, i) => {
        const y = 26 + i * (H + G);
        items.push(box(`ni${i}`, NX, y, showTruth(a), { w: W, h: H, size: 11, tone: "plain" }));
        items.push(label(`na${i}`, "→", NX + W + 13, y + H / 2, { tone: "faint", size: 12 }));
        items.push(box(`no${i}`, NX + W + 26, y, showTruth(not3(a)), { w: W, h: H, size: 11, tone: value(not3(a)) }));
      });
    }
    return items;
  };

  return finish({
    title: "Three-valued logic: AND, OR and NOT with UNKNOWN",
    input: "TRUE, FALSE and UNKNOWN (what a comparison with NULL gives)",
    frames: [
      { caption: "AND is TRUE only when both sides are TRUE. With an UNKNOWN on either side the answer is usually UNKNOWN too — but not always.", items: draw("and") },
      { caption: "OR is TRUE when either side is TRUE. In both tables each row is the left value and each column the right one.", items: draw("both") },
      { caption: "The principle: if the known side already decides the answer, the unknown side does not matter. FALSE AND anything is FALSE; TRUE OR anything is TRUE.", items: draw("decided") },
      {
        caption: "Everywhere else UNKNOWN wins, and WHERE drops UNKNOWN just as it drops FALSE. That is how a NULL in a condition makes rows disappear.",
        items: draw("unknown"),
      },
      { caption: "NOT swaps TRUE and FALSE but leaves UNKNOWN unknown — so wrapping a condition in NOT never brings a NULL row back.", items: draw("not") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "truth-tables": truthTables,
};
