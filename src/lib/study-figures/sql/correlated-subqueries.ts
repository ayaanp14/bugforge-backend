import { finish, type Frame, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { cmp, rowsTable, show, showTruth, type Row } from "./kit.js";
import { expectRows } from "./join-walk.js";

/**
 * A correlated subquery on the lesson's employees: for each outer row e,
 * the inner query is run again with e.dept filled in — the department's
 * salaries averaged — and e is kept when its salary is above that average.
 */

const EMPLOYEES: Row[] = [
  { id: 1, name: "Asha", dept: "Eng", salary: 120000 },
  { id: 2, name: "Ben", dept: "Eng", salary: 95000 },
  { id: 3, name: "Chen", dept: "Sales", salary: 70000 },
  { id: 4, name: "Dina", dept: "Sales", salary: 82000 },
  { id: 5, name: "Esha", dept: "Ops", salary: 60000 },
];

const avgOf = (dept: unknown) => {
  const xs = EMPLOYEES.filter((x) => x.dept === dept).map((x) => x.salary as number);
  return xs.reduce((a, b) => a + b, 0) / xs.length;
};

function perRowAverage(): Walkthrough {
  // The lesson prints the averages and the two kept rows.
  for (const [d, a] of [["Eng", 107500], ["Sales", 76000], ["Ops", 60000]] as const) if (avgOf(d) !== a) throw new Error(`per-row-average: ${d} averages ${avgOf(d)}, the lesson says ${a}`);
  const verdict = EMPLOYEES.map((e) => cmp(e.salary ?? null, ">", avgOf(e.dept)));
  expectRows("per-row-average", EMPLOYEES.filter((_, i) => verdict[i] === true).map((e) => [e.name ?? null, e.dept ?? null, e.salary ?? null]), [
    ["Asha", "Eng", 120000],
    ["Dina", "Sales", 82000],
  ]);
  const PX = 270;

  const draw = (cur: number | null, done: number): Item[] => {
    const curDept = cur === null ? null : EMPLOYEES[cur]!.dept;
    const t = rowsTable("e", "employees e (outer)", ["name", "dept", "salary"], EMPLOYEES, {
      w: { name: 58, dept: 58, salary: 72 },
      tone: (r, c) => (r === cur ? "accent" : curDept !== null && EMPLOYEES[r]!.dept === curDept && c === 2 ? "ghost" : r < done ? "muted" : "plain"),
    });
    const items: Item[] = [...t.items];
    if (cur !== null) {
      const e = EMPLOYEES[cur]!;
      const peers = EMPLOYEES.filter((x) => x.dept === e.dept);
      const avg = avgOf(e.dept);
      items.push(label("q", `inner query, x.dept = '${show(e.dept)}'`, PX, t.rowY(0) - 12, { anchor: "start", tone: "ink", size: 11.5, mono: true, weight: 700 }));
      peers.forEach((x) => items.push(box(`x${x.id}`, PX, t.rowY(peers.indexOf(x)), show(x.salary), { w: 72, h: t.h, size: 12, tone: "accent" })));
      items.push(label("avg", `AVG = ${avg}`, PX + 84, t.rowY(0) + t.h / 2, { anchor: "start", tone: "accent", size: 12, mono: true, weight: 700 }));
      const v = verdict[cur]!;
      items.push(
        label("cmp", `${show(e.salary)} > ${avg} is ${showTruth(v)}`, PX, t.rowY(peers.length) + t.h / 2 + 4, { anchor: "start", tone: v ? "accent" : "soft", size: 12, mono: true, weight: 600 }),
      );
    }
    const kept = EMPLOYEES.map((e, i) => ({ e, i })).filter(({ i }) => verdict[i] === true && (i < done || i === cur));
    const o = rowsTable("o", "kept so far", ["name", "dept", "salary"], kept.map((k) => k.e), {
      y: t.bottom + 28,
      key: (r) => String(kept[r]!.e.id),
      w: { name: 58, dept: 58, salary: 72 },
      tone: (r) => (kept[r]!.i === cur ? "accent" : "strong"),
    });
    items.push(...o.items);
    return items;
  };

  const frames: Frame[] = [
    {
      caption: "The inner query mentions e.dept, a column of the outer row, so it cannot run once on its own. Conceptually it runs again for every employee, with that employee's department filled in.",
      items: draw(null, 0),
    },
  ];
  EMPLOYEES.forEach((e, i) => {
    const peers = EMPLOYEES.filter((x) => x.dept === e.dept).length;
    const v = verdict[i]!;
    const avg = avgOf(e.dept);
    frames.push({
      caption:
        peers === 1
          ? `${show(e.name)} is alone in ${show(e.dept)}, so the average is her own salary, ${avg}. ${show(e.salary)} > ${avg} is FALSE: equal is not above, and she is left out.`
          : `For ${show(e.name)} the inner query averages the ${peers} ${show(e.dept)} salaries: ${avg}. ${show(e.salary)} > ${avg} is ${showTruth(v)}, so ${show(e.name)} is ${v ? "kept" : "left out"}.`,
      items: draw(i, i),
    });
  });
  return finish({ title: "A correlated subquery runs once per outer row", input: "WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept)", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "per-row-average": perRowAverage,
};
