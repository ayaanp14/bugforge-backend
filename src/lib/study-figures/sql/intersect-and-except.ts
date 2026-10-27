import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, box, label } from "../../lesson-figures/kit.js";
import { and3, cmp, show, showTruth, type Truth, type Val } from "./kit.js";

/**
 * INTERSECT and EXCEPT.
 *
 *  - intersect: the SQL takers against the Python takers (a few rows for
 *    the lesson's query — Asha enrolled in SQL twice, as its text says),
 *    whole rows matched across the branches, each kept once: Asha, Kiran;
 *  - three-anti-joins: the lesson's never-sold products against sales.sku
 *    'A1', 'B2', NULL — EXCEPT (NULLs equal) and NOT EXISTS (= finds
 *    nothing for a NULL) keep C3 and D4, NOT IN goes UNKNOWN and keeps none.
 */

const SQL_TAKERS = ["Asha", "Ben", "Kiran", "Asha"];
const PYTHON_TAKERS = ["Kiran", "Asha", "Dev"];

function intersect(): Walkthrough {
  const both = [...new Set(SQL_TAKERS.filter((s) => PYTHON_TAKERS.includes(s)))];
  if (both.join() !== "Asha,Kiran") throw new Error(`intersect: got ${both.join()}, the lesson prints Asha, Kiran`);
  const W = 80;
  const H = 26;
  const G = 4;
  const y = (s: number) => 30 + s * (H + G);
  const PX = 190;
  const RX = 370;

  const draw = (stage: 0 | 1 | 2): Item[] => {
    const items: Item[] = [
      label("ha", "WHERE course = 'SQL'", 0, 8, { anchor: "start", tone: "ink", size: 11, mono: true, weight: 700 }),
      label("hb", "… = 'Python'", PX, 8, { anchor: "start", tone: "ink", size: 11, mono: true, weight: 700 }),
    ];
    SQL_TAKERS.forEach((s, i) => items.push(box(`a${i}`, 0, y(i), s, { w: W, h: H, size: 12, tone: stage === 0 ? "plain" : PYTHON_TAKERS.includes(s) ? "accent" : "muted" })));
    PYTHON_TAKERS.forEach((s, i) => items.push(box(`b${i}`, PX, y(i), s, { w: W, h: H, size: 12, tone: stage === 0 ? "plain" : SQL_TAKERS.includes(s) ? "accent" : "muted" })));
    if (stage >= 1)
      SQL_TAKERS.forEach((s, i) => {
        const j = PYTHON_TAKERS.indexOf(s);
        if (j >= 0) items.push(arrow(`m${i}`, { x: W + 3, y: y(i) + H / 2 }, { x: PX - 3, y: y(j) + H / 2 }, { tone: "accent", head: false }));
      });
    if (stage === 2) {
      items.push(label("hr", "INTERSECT", RX, 8, { anchor: "start", tone: "ink", size: 11, mono: true, weight: 700 }));
      both.forEach((s, k) => items.push(box(`r${s}`, RX, y(k), s, { w: W, h: H, size: 12, tone: "strong" })));
    }
    return items;
  };

  return finish({
    title: "INTERSECT: the rows both results contain, once each",
    input: "SELECT student … 'SQL' INTERSECT SELECT student … 'Python'",
    frames: [
      { caption: "Each SELECT runs on its own: the students taking SQL and the students taking Python. Asha is enrolled in SQL twice.", items: draw(0) },
      {
        caption: `INTERSECT compares whole rows across the two results. ${both.join(" and ")} appear in both; ${[...new Set([...SQL_TAKERS, ...PYTHON_TAKERS].filter((s) => !both.includes(s)))].join(" and ")} appear in only one.`,
        items: draw(1),
      },
      { caption: `The result is each shared row once — ${both.join(", ")} — Asha's two SQL rows included. Like UNION, INTERSECT removes duplicates.`, items: draw(2) },
    ],
  });
}

const PRODUCTS: Val[] = ["A1", "B2", "C3", "D4"];
const SALES: Val[] = ["A1", "B2", null];

/** EXCEPT and DISTINCT compare rows with NULLs equal. */
const sameRow = (a: Val, b: Val) => a === b;

function threeAntiJoins(): Walkthrough {
  const exceptKeep = PRODUCTS.map((p) => !SALES.some((s) => sameRow(p, s)));
  const notExistsKeep = PRODUCTS.map((p) => !SALES.some((s) => cmp(p, "=", s) === true));
  const notIn: Truth[] = PRODUCTS.map((p) => SALES.reduce<Truth>((acc, s) => and3(acc, cmp(p, "<>", s)), true));
  const kept = (keep: boolean[]) => PRODUCTS.filter((_, i) => keep[i]).map(show);
  // The lesson's block: NOT IN → (no rows), NOT EXISTS → C3, D4, EXCEPT → C3, D4.
  if (kept(exceptKeep).join() !== "C3,D4" || kept(notExistsKeep).join() !== "C3,D4" || notIn.some((t) => t === true)) throw new Error("three-anti-joins: disagrees with the lesson's results");

  const W = 64;
  const CW = 112;
  const H = 26;
  const G = 4;
  const y = (s: number) => 44 + s * (H + G);
  const colX = (k: number) => W + 22 + k * (CW + G);
  const METHODS = ["EXCEPT", "NOT EXISTS", "NOT IN"];

  const draw = (shown: number): Item[] => {
    const items: Item[] = [label("sl", `sales.sku: ${SALES.map((s) => (s === null ? "NULL" : `'${s}'`)).join(", ")}`, 0, 8, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 700 })];
    items.push(label("hp", "products.sku", W / 2, 32, { tone: "soft", size: 11, mono: true }));
    PRODUCTS.forEach((p, i) => items.push(box(`p${i}`, 0, y(i), show(p), { w: W, h: H, size: 12 })));
    METHODS.slice(0, shown).forEach((m, k) => {
      items.push(label(`h${k}`, m, colX(k) + CW / 2, 32, { tone: "ink", size: 11, mono: true, weight: 700 }));
      PRODUCTS.forEach((p, i) => {
        let text: string;
        let tone: Tone;
        if (k === 2) {
          const t = notIn[i]!;
          text = t === null ? "UNKNOWN: drop" : t ? "TRUE: keep" : "FALSE: drop";
          tone = t === null ? "error" : t ? "strong" : "muted";
        } else {
          const keep = (k === 0 ? exceptKeep : notExistsKeep)[i]!;
          text = keep ? "keep" : "sold: drop";
          tone = keep ? "strong" : "muted";
        }
        items.push(box(`c${k}-${i}`, colX(k), y(i), text, { w: CW, h: H, size: 11.5, tone }));
      });
      const res = k === 2 ? PRODUCTS.filter((_, i) => notIn[i] === true).map(show) : kept(k === 0 ? exceptKeep : notExistsKeep);
      items.push(label(`res${k}`, res.length ? `→ ${res.join(", ")}` : "→ (no rows)", colX(k) + CW / 2, y(PRODUCTS.length) + 12, { tone: res.length ? "accent" : "error", size: 12, mono: true, weight: 700 }));
    });
    return items;
  };

  return finish({
    title: "Products never sold: EXCEPT, NOT EXISTS and NOT IN",
    input: "products A1, B2, C3, D4 — and one sale with a NULL sku",
    frames: [
      { caption: "Four products and three sales, one of them with a NULL sku. The question: which products never sold? The answer should be C3 and D4.", items: draw(0) },
      { caption: "EXCEPT removes every product row that also appears in sales. It compares whole rows with NULLs treated as equal, so the NULL sale is just a row matching nothing here: C3 and D4 remain.", items: draw(1) },
      { caption: "NOT EXISTS asks, per product, whether some sale has s.sku = p.sku. For C3 the NULL sale gives UNKNOWN, which is not a match, so no matching row exists: C3 and D4 again.", items: draw(2) },
      {
        caption: `NOT IN expands to C3 <> 'A1' AND C3 <> 'B2' AND C3 <> NULL. The last test is ${showTruth(cmp("C3", "<>", null))}, so the AND never becomes TRUE and the query returns no rows at all.`,
        items: draw(3),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  intersect,
  "three-anti-joins": threeAntiJoins,
};
