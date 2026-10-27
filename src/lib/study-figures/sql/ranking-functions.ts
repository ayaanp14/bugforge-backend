import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";
import { rowsTable, rowTag, type Row } from "./kit.js";

/**
 * Ranking functions: the lesson's `scores` table.
 *
 *  - three-rankings: ROW_NUMBER, RANK and DENSE_RANK added one column at a
 *    time over the same order, each computed by its definition (a running
 *    count; one plus the rows strictly ahead; the position among distinct
 *    values) and checked against the lesson's printed result.
 */

const SCORES: Row[] = [
  { player: "Asha", score: 90 },
  { player: "Ben", score: 90 },
  { player: "Chen", score: 85 },
  { player: "Dev", score: 80 },
  { player: "Eva", score: 80 },
  { player: "Farah", score: 70 },
];

function threeRankings(): Walkthrough {
  const sorted = [...SCORES].sort((a, b) => (b.score as number) - (a.score as number) || String(a.player).localeCompare(String(b.player)));
  const rowNum = sorted.map((_, i) => i + 1);
  const rnk = sorted.map((r) => 1 + sorted.filter((o) => (o.score as number) > (r.score as number)).length);
  const distinct = [...new Set(sorted.map((r) => r.score as number))];
  const dense = sorted.map((r) => distinct.indexOf(r.score as number) + 1);
  const printed = { rowNum: [1, 2, 3, 4, 5, 6], rnk: [1, 1, 3, 4, 4, 6], dense: [1, 1, 2, 3, 3, 4] };
  const same = (a: number[], b: number[]) => a.join() === b.join();
  if (!same(rowNum, printed.rowNum) || !same(rnk, printed.rnk) || !same(dense, printed.dense)) throw new Error("three-rankings: the computed ranks disagree with the lesson's table");

  // Tie groups: runs of equal score.
  const ties = distinct.map((s) => ({ s, rows: sorted.map((r, i) => (r.score === s ? i : -1)).filter((i) => i >= 0) })).filter((g) => g.rows.length > 1);
  const chen = sorted.findIndex((r) => r.player === "Chen");
  const ahead = rnk[chen]! - 1;

  const draw = (n: 0 | 1 | 2 | 3): Item[] => {
    const cols = ["player", "score", "row_num", "rnk", "dense_rnk"].slice(0, 2 + n);
    const vals = [rowNum, rnk, dense];
    const rows = sorted.map((r, i) => ({ ...r, row_num: vals[0]![i]!, rnk: vals[1]![i]!, dense_rnk: vals[2]![i]! }));
    const t = rowsTable("r", "ORDER BY score DESC", cols, rows, {
      key: (r) => sorted[r]!.player as string,
      tone: (r, c) => (c === 1 + n && n > 0 ? "accent" : c >= 2 ? "plain" : ties.some((g) => g.rows.includes(r)) && n === 0 ? "accent" : "plain"),
      w: { player: 64, score: 52, row_num: 66, rnk: 46, dense_rnk: 80 },
    });
    const items: Item[] = [...t.items];
    if (n === 0) for (const g of ties) items.push(rowTag(`tie${g.s}`, t, g.rows[0]!, `tie on ${g.s}`, { tone: "accent", weight: 600 }));
    if (n === 1) items.push(rowTag("note", t, 1, "tie broken by player", { tone: "accent" }));
    if (n === 2) items.push(rowTag("note", t, chen, `${ahead} rows ahead → ${rnk[chen]}; 2 is skipped`, { tone: "accent", weight: 600 }));
    if (n === 3) items.push(rowTag("note", t, chen, `next distinct score → ${dense[chen]}`, { tone: "accent", weight: 600 }));
    items.push(label("w", "the window: OVER (ORDER BY score DESC)", t.left, t.bottom + 20, { anchor: "start", tone: "soft", size: 11, mono: true }));
    return items;
  };

  return finish({
    title: "ROW_NUMBER, RANK and DENSE_RANK on the same ties",
    input: "scores ordered by score DESC, player",
    frames: [
      { caption: `All three functions number the rows in the window's order, highest score first. Two ties matter: Asha and Ben share 90, Dev and Eva share 80.`, items: draw(0) },
      { caption: `ROW_NUMBER gives every row a different number, 1 to ${sorted.length}. Inside a tie the ORDER BY decides — here the player name puts Asha before Ben; without it the engine would choose.`, items: draw(1) },
      {
        caption: `RANK is one plus the rows strictly ahead. Tied rows share a rank, then the count jumps: Asha and Ben are both 1, and Chen, with ${ahead} rows ahead, is ${rnk[chen]}. No one is ranked 2.`,
        items: draw(2),
      },
      {
        caption: `DENSE_RANK is the value's position among the ${distinct.length} distinct scores, so ties share and nothing is skipped: Chen is ${dense[chen]}, Farah ${dense[dense.length - 1]}. This is the one for "the second highest score".`,
        items: draw(3),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "three-rankings": threeRankings,
};
