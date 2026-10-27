import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { cmp, or3, rowsTable, rowTag, show, showTruth, type Row, type Truth } from "./kit.js";

/**
 * The WHERE clause: the lesson's three employees filtered one row at a time.
 *
 *  - where-rows: `WHERE dept <> 'Sales'` evaluated per row with SQL's
 *    comparison — Asha FALSE, Ravi TRUE, Meera's NULL UNKNOWN — keeping only
 *    TRUE (just Ravi, as the lesson says), then `OR dept IS NULL` turning
 *    Meera's UNKNOWN into TRUE.
 */

const EMPLOYEES: Row[] = [
  { emp_id: 1, name: "Asha", dept: "Sales" },
  { emp_id: 2, name: "Ravi", dept: "Support" },
  { emp_id: 3, name: "Meera", dept: null },
];

function whereRows(): Walkthrough {
  const plain = (r: Row): Truth => cmp(r.dept ?? null, "<>", "Sales");
  const withNull = (r: Row): Truth => or3(plain(r), r.dept === null);
  const keptPlain = EMPLOYEES.filter((r) => plain(r) === true).map((r) => r.name);
  if (keptPlain.join() !== "Ravi") throw new Error(`where-rows: <> 'Sales' kept ${keptPlain.join()}, the lesson says only Ravi`);
  const keptNull = EMPLOYEES.filter((r) => withNull(r) === true).map((r) => r.name);

  /** `upto` rows evaluated so far; `test` which condition. */
  const draw = (upto: number, test: "plain" | "null", cur: number | null): Item[] => {
    const f = test === "plain" ? plain : withNull;
    const t = rowsTable("e", "employees", ["emp_id", "name", "dept"], EMPLOYEES, {
      key: (r) => EMPLOYEES[r]!.emp_id as number,
      tone: (r, c) => {
        if (r === cur) return "accent";
        if (r >= upto) return "plain";
        const v = f(EMPLOYEES[r]!);
        return v === true ? "strong" : c === 2 && v === null ? "accent" : "muted";
      },
      w: { emp_id: 60, name: 64, dept: 76 },
    });
    const items: Item[] = [...t.items];
    EMPLOYEES.forEach((r, i) => {
      if (i >= upto) return;
      const v = f(r);
      const expr = test === "plain" ? `${show(r.dept ?? null)} <> 'Sales'` : `${showTruth(plain(r))} OR ${r.dept === null ? "TRUE" : "FALSE"}`;
      const verdict = v === true ? "  → kept" : "  → dropped";
      items.push(rowTag(`v${r.emp_id}`, t, i, `${expr} = ${showTruth(v)}${verdict}`, { tone: v === true ? "accent" : v === null ? "accent" : "soft", weight: v === null ? 600 : undefined }));
    });
    return items;
  };

  return finish({
    title: "WHERE keeps a row only when its condition is TRUE",
    input: "SELECT name FROM employees WHERE dept <> 'Sales'",
    frames: [
      { caption: "WHERE takes the rows one at a time and evaluates the condition for each. Asha's dept is Sales, so Sales <> 'Sales' is FALSE and her row is dropped.", items: draw(1, "plain", 0) },
      { caption: "Ravi's dept is Support, and Support <> 'Sales' is TRUE: his row moves on to SELECT.", items: draw(2, "plain", 1) },
      {
        caption: "Meera's dept is NULL. NULL <> 'Sales' is not TRUE or FALSE but UNKNOWN — nobody knows what the missing value is.",
        items: draw(3, "plain", 2),
      },
      {
        caption: `WHERE keeps only TRUE, and drops FALSE and UNKNOWN alike, so the answer is ${keptPlain.join(", ")} alone — though most people asking who is not in Sales would include Meera.`,
        items: draw(3, "plain", null),
      },
      {
        caption: `Saying what NULL rows should do fixes it: WHERE dept <> 'Sales' OR dept IS NULL. For Meera that is UNKNOWN OR TRUE, which is TRUE, so the answer becomes ${keptNull.join(" and ")}.`,
        items: draw(3, "null", null),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "where-rows": whereRows,
};
