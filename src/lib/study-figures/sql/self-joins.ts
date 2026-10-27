import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, label } from "../../lesson-figures/kit.js";
import { cmp, rowEdge, rowsTable, rowTag, show, sqlCompare, type Row } from "./kit.js";
import { expectRows, joinPairs } from "./join-walk.js";

/**
 * A self join on the lesson's employees: one table under two aliases, e (the
 * employee) and m (the manager), each manager_id pointing at the m row with
 * that id — Meera's NULL at nothing — then the classic comparison of a row
 * with its partner, employees who earn more than their manager.
 */

const EMPLOYEES: Row[] = [
  { id: 1, name: "Meera", salary: 150000, manager_id: null },
  { id: 2, name: "Arjun", salary: 90000, manager_id: 1 },
  { id: 3, name: "Kiran", salary: 110000, manager_id: 2 },
  { id: 4, name: "Leela", salary: 70000, manager_id: 2 },
  { id: 5, name: "Omar", salary: 160000, manager_id: 1 },
];

function managerLinks(): Walkthrough {
  const pairs = joinPairs(EMPLOYEES, EMPLOYEES, (e, m) => cmp(m.id ?? null, "=", e.manager_id ?? null), "inner").map(([i, j]) => [i!, j!] as [number, number]);
  const byName = [...pairs].sort((a, b) => sqlCompare(EMPLOYEES[a[0]]!.name ?? null, EMPLOYEES[b[0]]!.name ?? null));
  expectRows("manager-links", byName.map(([i, j]) => [EMPLOYEES[i]!.name ?? null, EMPLOYEES[j]!.name ?? null]), [
    ["Arjun", "Meera"],
    ["Kiran", "Arjun"],
    ["Leela", "Arjun"],
    ["Omar", "Meera"],
  ]);
  const richer = byName.filter(([i, j]) => cmp(EMPLOYEES[i]!.salary ?? null, ">", EMPLOYEES[j]!.salary ?? null) === true);
  expectRows("manager-links salary", richer.map(([i, j]) => [EMPLOYEES[i]!.name ?? null, EMPLOYEES[j]!.name ?? null]), [
    ["Kiran", "Arjun"],
    ["Omar", "Meera"],
  ]);
  const top = EMPLOYEES.find((e) => e.manager_id === null)!;
  const MX = 400;

  const draw = (stage: "copies" | "links" | "result" | "compare"): Item[] => {
    const e = rowsTable("e", "employees e (the employee)", ["id", "name", "salary", "manager_id"], EMPLOYEES, {
      w: { id: 34, name: 60, salary: 62, manager_id: 84 },
      tone: (r, c) => (stage === "copies" ? "plain" : c === 3 ? (EMPLOYEES[r]!.manager_id === null ? "muted" : "accent") : stage === "compare" && c === 2 ? "accent" : "plain"),
    });
    const used = new Set(pairs.map(([, j]) => j));
    const m = rowsTable("m", "employees m (the manager)", ["id", "name", "salary"], EMPLOYEES, {
      x: MX,
      w: { id: 34, name: 60, salary: 62 },
      tone: (r, c) => (stage !== "copies" && used.has(r) && (c === 0 || (stage === "compare" && c === 2)) ? "accent" : "plain"),
    });
    const items: Item[] = [...e.items, ...m.items];
    if (stage !== "copies") {
      pairs.forEach(([i, j]) => items.push(arrow(`a${i}`, rowEdge(e, i, "right"), rowEdge(m, j, "left"), { tone: "accent" })));
      items.push(label("none", "no partner", e.right + 8, e.rowY(EMPLOYEES.indexOf(top)) + e.h / 2, { anchor: "start", tone: "faint", size: 11, mono: true }));
    }
    if (stage === "result" || stage === "compare") {
      const shown = stage === "result" ? byName : byName;
      const o = rowsTable(
        "o",
        stage === "result" ? "JOIN … ON m.id = e.manager_id" : "WHERE e.salary > m.salary",
        stage === "result" ? ["employee", "manager"] : ["employee", "salary", "manager", "manager_salary"],
        shown.map(([i, j]) => ({ employee: EMPLOYEES[i]!.name ?? null, salary: EMPLOYEES[i]!.salary ?? null, manager: EMPLOYEES[j]!.name ?? null, manager_salary: EMPLOYEES[j]!.salary ?? null })),
        {
          y: Math.max(e.bottom, m.bottom) + 30,
          key: (r) => String(EMPLOYEES[shown[r]![0]]!.id),
          w: { employee: 76, manager: 70, salary: 70, manager_salary: 112 },
          tone: (r) => (stage === "result" ? "strong" : richer.includes(shown[r]!) ? "strong" : "muted"),
        },
      );
      items.push(...o.items);
      if (stage === "compare") shown.forEach((p, r) => items.push(rowTag(`t${EMPLOYEES[p[0]]!.id}`, o, r, richer.includes(p) ? "earns more: kept" : "earns less", { tone: richer.includes(p) ? "accent" : "faint", weight: richer.includes(p) ? 600 : undefined })));
    }
    return items;
  };

  return finish({
    title: "A self join: one table, read as employee and as manager",
    input: "employees e JOIN employees m ON m.id = e.manager_id",
    frames: [
      { caption: "A self join reads one table twice under two aliases: e plays the employee, m the manager. They are the same rows; only the roles differ.", items: draw("copies") },
      {
        caption: `Each employee's manager_id points at the m row with that id. ${show(top.name)}'s manager_id is NULL, and NULL equals nothing, so her row has no partner and an inner self join drops her.`,
        items: draw("links"),
      },
      { caption: `Each arrow is one result row: the employee beside the manager it points at, ${byName.length} rows sorted by employee. A LEFT JOIN would add ${show(top.name)} with a NULL manager.`, items: draw("result") },
      {
        caption: `With both rows side by side, comparing them is a WHERE clause. Only ${richer.map(([i, j]) => `${show(EMPLOYEES[i]!.name)} (over ${show(EMPLOYEES[j]!.name)})`).join(" and ")} earn more than their manager.`,
        items: draw("compare"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "manager-links": managerLinks,
};
