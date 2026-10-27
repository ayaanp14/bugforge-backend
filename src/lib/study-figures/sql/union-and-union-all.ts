import { finish, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * UNION ALL and UNION on the lesson's city example ("if three customers
 * live in Pune and one supplier does, Pune appears once" — and four times
 * under UNION ALL): the two branches' rows are appended into one column,
 * then UNION keeps each distinct row once across the whole result,
 * duplicates within one branch included.
 */

const CUSTOMER_CITIES = ["Pune", "Delhi", "Pune", "Pune"];
const SUPPLIER_CITIES = ["Mumbai", "Pune"];

function unionDedup(): Walkthrough {
  const all = [...CUSTOMER_CITIES.map((c, i) => ({ key: `c${i}`, city: c, from: "customers" })), ...SUPPLIER_CITIES.map((c, i) => ({ key: `s${i}`, city: c, from: "suppliers" }))];
  const pune = all.filter((r) => r.city === "Pune");
  if (CUSTOMER_CITIES.filter((c) => c === "Pune").length !== 3 || SUPPLIER_CITIES.filter((c) => c === "Pune").length !== 1 || pune.length !== 4)
    throw new Error("union-dedup: the lesson has three customers and one supplier in Pune");
  // UNION: the first occurrence of each distinct row, in the order the rows arrive.
  const seen = new Set<string>();
  const firsts = all.filter((r) => (seen.has(r.city) ? false : (seen.add(r.city), true)));
  const W = 92;
  const H = 26;
  const G = 4;
  const y = (s: number) => 34 + s * (H + G);
  const CX = 0;
  const SX = 130;
  const RX = 300;

  const cell = (key: string, x: number, s: number, text: string, tone: Tone): Item => box(`u${key}`, x, y(s), text, { w: W, h: H, size: 12, tone });

  // The branch headers; once the rows have moved, dashed ghosts mark where they came from.
  const branches = (ghosts = false): Item[] => [
    label("hc", "customers.city", CX, 8, { anchor: "start", tone: "ink", size: 11, mono: true, weight: 700 }),
    label("hs", "suppliers.city", SX, 8, { anchor: "start", tone: "ink", size: 11, mono: true, weight: 700 }),
    ...(ghosts ? [...CUSTOMER_CITIES.map((_, i) => box(`g c${i}`, CX, y(i), "", { w: W, h: H, tone: "ghost" })), ...SUPPLIER_CITIES.map((_, i) => box(`g s${i}`, SX, y(i), "", { w: W, h: H, tone: "ghost" }))] : []),
  ];
  const stacked = (stage: "all" | "mark" | "distinct"): Item[] => {
    const items: Item[] = [];
    const head = stage === "all" ? `UNION ALL: ${all.length} rows` : stage === "mark" ? "UNION: each row checked" : `UNION: ${firsts.length} rows`;
    items.push(label("hr", head, RX, 8, { anchor: "start", tone: "ink", size: 11, mono: true, weight: 700 }));
    const rows = stage === "distinct" ? firsts : all;
    rows.forEach((r, s) => {
      const dup = !firsts.includes(r);
      const tone: Tone = stage === "all" ? (r.from === "customers" ? "plain" : "accent") : stage === "mark" ? (dup ? "error" : "strong") : "strong";
      items.push(cell(r.key, RX, s, r.city, tone));
      if (stage === "all") items.push(label(`f${r.key}`, r.from, RX + W + 10, y(s) + H / 2, { anchor: "start", tone: r.from === "customers" ? "faint" : "accent", size: 11, mono: true }));
      if (stage === "mark") items.push(label(`f${r.key}`, dup ? "seen already: removed" : "first time: kept", RX + W + 10, y(s) + H / 2, { anchor: "start", tone: dup ? "error" : "accent", size: 11, mono: true }));
    });
    return items;
  };

  return finish({
    title: "UNION ALL appends; UNION then keeps each distinct row once",
    input: "SELECT city FROM customers UNION [ALL] SELECT city FROM suppliers",
    frames: [
      {
        caption: "Each SELECT runs on its own: the customers' cities and the suppliers' cities. Three customers and one supplier are in Pune.",
        items: [...branches(), ...CUSTOMER_CITIES.map((c, i) => cell(`c${i}`, CX, i, c, "plain")), ...SUPPLIER_CITIES.map((c, i) => cell(`s${i}`, SX, i, c, "accent"))],
      },
      {
        caption: `UNION ALL appends the second result's rows under the first's and does nothing else: ${all.length} rows, Pune ${pune.length} times. No checking, so it streams.`,
        items: [...branches(true), ...stacked("all")],
      },
      {
        caption: "UNION must also remember every row it has emitted and test each new one against them. Duplicates are removed across the whole result — the two repeats inside the customers branch too.",
        items: [...branches(true), ...stacked("mark")],
      },
      {
        caption: `What remains is the set of distinct cities, ${firsts.map((r) => r.city).join(", ")}. Right for "every city we deal with"; wrong for counting or summing, where real repeats matter.`,
        items: [...branches(true), ...stacked("distinct")],
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "union-dedup": unionDedup,
};
