import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, label } from "../../lesson-figures/kit.js";
import { rowsTable, show, type Row } from "./kit.js";

/**
 * OVER and PARTITION BY: the lesson's `employees` table.
 *
 *  - partition-vs-group: the rows sorted into one partition per department,
 *    GROUP BY collapsing each partition to one row, and the same AVG with
 *    OVER (PARTITION BY dept) written beside every row instead — computed
 *    here, and checked against the lesson's printed averages.
 */

const EMPLOYEES: Row[] = [
  { id: 1, name: "Asha", dept: "Eng", salary: 90000 },
  { id: 2, name: "Ben", dept: "Eng", salary: 70000 },
  { id: 3, name: "Chen", dept: "Sales", salary: 50000 },
  { id: 4, name: "Dev", dept: "Sales", salary: 40000 },
  { id: 5, name: "Eva", dept: "HR", salary: 45000 },
];

function partitionVsGroup(): Walkthrough {
  // Partitions in the output's order: dept, then name.
  const sorted = [...EMPLOYEES].sort((a, b) => String(a.dept).localeCompare(String(b.dept)) || String(a.name).localeCompare(String(b.name)));
  const depts = [...new Set(sorted.map((r) => r.dept as string))];
  const avg = new Map(depts.map((d) => {
    const s = EMPLOYEES.filter((r) => r.dept === d).map((r) => r.salary as number);
    return [d, s.reduce((a, b) => a + b, 0) / s.length];
  }));
  const printed: Record<string, number> = { Eng: 80000, HR: 45000, Sales: 45000 };
  for (const d of depts) if (avg.get(d) !== printed[d]) throw new Error(`partition-vs-group: ${d} averages ${avg.get(d)}, the lesson prints ${printed[d]}`);

  // A partition's rows sit together with a gap between partitions.
  const part = (r: Row) => depts.indexOf(r.dept as string);
  const W = { name: 62, dept: 58, salary: 70, dept_avg: 74 };

  const draw = (stage: "table" | "partition" | "group" | "window"): Item[] => {
    const rows = stage === "table" ? EMPLOYEES : sorted;
    const withAvg = stage === "window" ? rows.map((r) => ({ ...r, dept_avg: avg.get(r.dept as string)! })) : rows;
    const cols = stage === "window" ? ["name", "dept", "salary", "dept_avg"] : ["name", "dept", "salary"];
    const t = rowsTable("e", stage === "window" ? "AVG(salary) OVER (PARTITION BY dept)" : "employees", cols, withAvg, {
      key: (r) => rows[r]!.id as number,
      slot: (r) => (stage === "table" ? r : r + part(rows[r]!) * 0.45),
      tone: (r, c) => (stage === "window" && c === 3 ? "accent" : stage === "group" ? "muted" : "plain"),
      w: W,
    });
    const items: Item[] = [...t.items];
    if (stage !== "table") {
      for (const d of depts) {
        const first = rows.findIndex((r) => r.dept === d);
        const n = rows.filter((r) => r.dept === d).length;
        const s0 = first + depts.indexOf(d) * 0.45;
        const top = t.rowY(s0) - 3;
        const h = n * (t.h + 3) + 3;
        items.push({ k: "band", id: `p${d}`, x: t.left - 6, y: top, w: t.right - t.left + 12, h, tone: stage === "group" ? "ghost" : "accent" });
        items.push(label(`pl${d}`, d, t.left - 12, top + h / 2, { anchor: "end", tone: "soft", size: 11, weight: 600 }));
      }
    }
    if (stage === "group") {
      const GX = t.right + 70;
      const g = rowsTable("g", "GROUP BY dept", ["dept", "dept_avg"], depts.map((d) => ({ dept: d, dept_avg: avg.get(d)! })), {
        x: GX,
        key: (r) => depts[r]!,
        slot: (r) => {
          const first = sorted.findIndex((x) => x.dept === depts[r]);
          const n = sorted.filter((x) => x.dept === depts[r]).length;
          return first + r * 0.45 + (n - 1) / 2;
        },
        tone: () => "strong",
        w: { dept: 58, dept_avg: 74 },
      });
      items.push(...g.items);
      depts.forEach((d, i) => {
        const first = sorted.findIndex((x) => x.dept === d);
        const n = sorted.filter((x) => x.dept === d).length;
        const y = t.rowY(first + i * 0.45 + (n - 1) / 2) + t.h / 2;
        items.push(arrow(`ga${d}`, { x: t.right + 10, y }, { x: GX - 6, y }, { tone: "accent" }));
      });
    }
    return items;
  };

  const eng = EMPLOYEES.filter((r) => r.dept === "Eng");
  return finish({
    title: "PARTITION BY keeps every row; GROUP BY keeps one per group",
    input: "AVG(salary) OVER (PARTITION BY dept)  vs  GROUP BY dept",
    frames: [
      { caption: `The employees table: ${EMPLOYEES.length} people in ${depts.length} departments, each row with its own name and salary.`, items: draw("table") },
      {
        caption: `PARTITION BY dept sorts the rows into ${depts.length} partitions, one per department. Each row's window is its own partition; HR's partition holds a single row, and that is fine.`,
        items: draw("partition"),
      },
      {
        caption: `GROUP BY dept would collapse each partition into one row: ${depts.length} rows out, and the names and salaries are gone — ${eng.map((r) => r.name).join(" and ")} become a single Eng row.`,
        items: draw("group"),
      },
      {
        caption: `With OVER the same AVG is computed per partition but written beside every row: all ${EMPLOYEES.length} rows survive, Asha and Ben both carry Eng's ${show(avg.get("Eng")!)}, so salary minus dept_avg is one expression on one row.`,
        items: draw("window"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "partition-vs-group": partitionVsGroup,
};
