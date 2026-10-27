import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { and3, cmp, not3, or3, rowsTable, rowTag, show, showTruth, type Row, type Truth, type Val } from "./kit.js";

/**
 * NOT IN and NULL, on the lesson's own data: orders' customer_ids are 1, 2
 * and — after the guest checkout — NULL. `x IN (list)` is an OR of `x = v`
 * and `x NOT IN (list)` an AND of `x <> v`, each comparison three-valued;
 * the figure evaluates both term by term for Chen (3), then runs NOT IN for
 * every customer and shows WHERE keeping nobody.
 */

const LIST: Val[] = [1, 2, null];
const CUSTOMERS: Row[] = [
  { id: 1, name: "Asha" },
  { id: 2, name: "Ben" },
  { id: 3, name: "Chen" },
];

const inList = (x: Val): Truth => LIST.reduce<Truth>((acc, v) => or3(acc, cmp(x, "=", v)), false);
const notInList = (x: Val): Truth => LIST.reduce<Truth>((acc, v) => and3(acc, cmp(x, "<>", v)), true);

const truthTone = (t: Truth): Tone => (t === null ? "error" : t ? "strong" : "muted");

function notInUnknown(): Walkthrough {
  const X = 3;
  // NOT IN is the negation of IN, by definition and by the expansion — checked both ways.
  if (notInList(X) !== not3(inList(X)) || inList(X) !== null || notInList(X) !== null) throw new Error("not-in-unknown: 3 [NOT] IN (1, 2, NULL) must be UNKNOWN both ways");
  const verdicts = CUSTOMERS.map((c) => notInList(c.id ?? null));
  if (verdicts.some((v) => v === true)) throw new Error("not-in-unknown: the lesson's query returns no rows");

  const TW = 82;
  const OPW = 44;
  const termX = (k: number) => 84 + k * (TW + OPW);
  const line = (p: string, y: number, title: string, op: "=" | "<>", join: "OR" | "AND", shown: number, final: boolean): Item[] => {
    const items: Item[] = [label(`${p}t`, title, 0, y + 15, { anchor: "start", tone: "ink", size: 12.5, mono: true, weight: 700 })];
    LIST.forEach((v, k) => {
      const t = cmp(X, op, v);
      const on = k < shown;
      items.push(box(`${p}b${k}`, termX(k), y, `${X} ${op} ${show(v)}`, { w: TW, h: 30, size: 12, tone: on ? truthTone(t) : "plain" }));
      if (on) items.push(label(`${p}r${k}`, showTruth(t), termX(k) + TW / 2, y + 44, { tone: t === null ? "error" : "soft", size: 11, mono: true, weight: 600 }));
      if (k < LIST.length - 1) items.push(label(`${p}o${k}`, join, termX(k) + TW + OPW / 2, y + 15, { tone: "faint", size: 11.5, mono: true, weight: 700 }));
    });
    if (final) {
      const all = op === "=" ? inList(X) : notInList(X);
      items.push(label(`${p}eq`, `= ${showTruth(all)}`, termX(LIST.length - 1) + TW + 10, y + 15, { anchor: "start", tone: "error", size: 13, mono: true, weight: 700 }));
    }
    return items;
  };

  const IN_Y = 0;
  const NOT_Y = 76;
  const custs = (): Item[] => {
    const t = rowsTable("c", "WHERE id NOT IN (1, 2, NULL)", ["id", "name"], CUSTOMERS, { y: 160, w: { id: 34, name: 60 }, tone: (r) => truthTone(verdicts[r]!) });
    const items: Item[] = [...t.items];
    CUSTOMERS.forEach((c, r) => {
      const v = verdicts[r]!;
      const why = v === false ? `${show(c.id)} <> ${show(c.id)} is FALSE` : `${show(c.id)} <> NULL is UNKNOWN`;
      items.push(rowTag(`v${r}`, t, r, `${showTruth(v)} (${why}) → dropped`, { tone: v === null ? "error" : "faint", weight: 600 }));
    });
    items.push(label("none", "result: (no rows)", 0, t.bottom + 20, { anchor: "start", tone: "error", size: 12.5, mono: true, weight: 700 }));
    return items;
  };

  return finish({
    title: "Why NOT IN returns nothing once the list holds a NULL",
    input: "orders.customer_id = 1, 2, NULL — and Chen's id is 3",
    frames: [
      { caption: "x IN (list) is shorthand for one equality test per value, joined by OR. For Chen, 3 IN (1, 2, NULL) becomes three comparisons.", items: line("i", IN_Y, "3 IN", "=", "OR", 0, false) },
      { caption: "3 = 1 and 3 = 2 are plainly FALSE. So far nothing matched.", items: line("i", IN_Y, "3 IN", "=", "OR", 2, false) },
      {
        caption: "3 = NULL is UNKNOWN: nobody can say whether a missing value equals 3. FALSE OR FALSE OR UNKNOWN is UNKNOWN — not FALSE.",
        items: line("i", IN_Y, "3 IN", "=", "OR", 3, true),
      },
      {
        caption: "NOT IN negates it: an AND of <> tests. 3 <> 1 and 3 <> 2 are TRUE, but 3 <> NULL is UNKNOWN, and TRUE AND TRUE AND UNKNOWN is UNKNOWN.",
        items: [...line("i", IN_Y, "3 IN", "=", "OR", 3, true), ...line("n", NOT_Y, "3 NOT IN", "<>", "AND", 3, true)],
      },
      {
        caption: `Run for every customer: ${CUSTOMERS.filter((_, r) => verdicts[r] === false).map((c) => show(c.name)).join(" and ")} are FALSE (their id is in the list), ${CUSTOMERS.filter((_, r) => verdicts[r] === null).map((c) => show(c.name)).join(", ")} is UNKNOWN. WHERE keeps only TRUE, so the query returns no rows at all.`,
        items: [...line("i", IN_Y, "3 IN", "=", "OR", 3, true), ...line("n", NOT_Y, "3 NOT IN", "<>", "AND", 3, true), ...custs()],
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "not-in-unknown": notInUnknown,
};
