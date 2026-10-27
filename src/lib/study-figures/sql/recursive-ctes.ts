import { finish, type Frame, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, label } from "../../lesson-figures/kit.js";
import { cmp, rowEdge, rowsTable, rowTag, show, sqlCompare, type Row } from "./kit.js";
import { expectRows } from "./join-walk.js";

/**
 * A recursive CTE on the lesson's org chart, run the way it runs: the
 * anchor once (the employee with no manager), then the recursive member
 * again and again with org meaning only the previous round's rows, each
 * round joining the employees those people manage — until a round comes
 * back empty.
 */

const EMPLOYEES: Row[] = [
  { id: 1, name: "Meera", manager_id: null },
  { id: 2, name: "Arjun", manager_id: 1 },
  { id: 3, name: "Divya", manager_id: 1 },
  { id: 4, name: "Kabir", manager_id: 2 },
  { id: 5, name: "Leela", manager_id: 4 },
];

type OrgRow = { e: Row; depth: number; round: number };

function orgRounds(): Walkthrough {
  // The evaluation, round by round.
  const rounds: OrgRow[][] = [EMPLOYEES.filter((e) => e.manager_id === null).map((e) => ({ e, depth: 0, round: 0 }))];
  for (let k = 1; k < 20; k++) {
    const prev = rounds[k - 1]!;
    const next = EMPLOYEES.flatMap((e) => prev.filter((o) => cmp(e.manager_id ?? null, "=", o.e.id ?? null) === true).map((o) => ({ e, depth: o.depth + 1, round: k })));
    rounds.push(next);
    if (next.length === 0) break;
  }
  const all = rounds.flat();
  const ordered = [...all].sort((a, b) => a.depth - b.depth || sqlCompare(a.e.name ?? null, b.e.name ?? null));
  expectRows("org-rounds", ordered.map((o) => [o.e.name ?? null, o.depth]), [
    ["Meera", 0],
    ["Arjun", 1],
    ["Divya", 1],
    ["Kabir", 2],
    ["Leela", 3],
  ]);
  const OX = 300;

  const draw = (upTo: number): Item[] => {
    const cur = rounds[upTo]!;
    const prevIds = new Set((upTo > 0 ? rounds[upTo - 1]! : []).map((o) => o.e.id));
    const curIds = new Set(cur.map((o) => o.e.id));
    const t = rowsTable("e", "employees", ["id", "name", "manager_id"], EMPLOYEES, {
      w: { id: 34, name: 62, manager_id: 88 },
      tone: (r) => (curIds.has(EMPLOYEES[r]!.id) ? "accent" : prevIds.has(EMPLOYEES[r]!.id) ? "strong" : "plain"),
    });
    const sofar = all.filter((o) => o.round <= upTo);
    const o = rowsTable("o", "org (the result so far)", ["name", "depth"], sofar.map((x) => ({ name: x.e.name ?? null, depth: x.depth })), {
      x: OX,
      key: (r) => String(sofar[r]!.e.id),
      w: { name: 62, depth: 52 },
      tone: (r) => (sofar[r]!.round === upTo ? "accent" : "muted"),
    });
    const items: Item[] = [...t.items, ...o.items];
    // Each new row of this round, pointed at from the employee it came from.
    sofar.forEach((x, s) => {
      if (x.round !== upTo) return;
      items.push(arrow(`l${x.e.id}`, rowEdge(t, EMPLOYEES.indexOf(x.e), "right"), rowEdge(o, s, "left"), { tone: "accent" }));
    });
    let s = 0;
    for (let k = 0; k <= upTo && k < rounds.length; k++) {
      if (rounds[k]!.length) items.push(rowTag(`r${k}`, o, s, `round ${k + 1}`, { tone: k === upTo ? "accent" : "faint" }));
      s += rounds[k]!.length;
    }
    if (cur.length === 0) items.push(label("stop", `round ${upTo + 1}: no one → stop`, OX, o.bottom + 20, { anchor: "start", tone: "accent", size: 12, mono: true, weight: 700 }));
    return items;
  };

  const frames: Frame[] = rounds.map((r, k) => {
    const prev = k > 0 ? rounds[k - 1]! : [];
    const names = (xs: OrgRow[]) => xs.map((x) => show(x.e.name)).join(" and ");
    const caption =
      k === 0
        ? `The anchor runs once: the employee whose manager_id IS NULL. ${names(r)} is round one, at depth 0, and goes into the result.`
        : r.length === 0
          ? `The recursive member runs again with org meaning only ${names(prev)}. Nobody reports to ${names(prev)}, so the round is empty and recursion stops. The result is the union of all ${k} rounds.`
          : `The recursive member joins employees to the previous round only — ${names(prev)}. Whoever reports to ${prev.length === 1 ? "that person" : "them"} is round ${k + 1}: ${names(r)}, at depth ${r[0]!.depth}.`;
    return { caption, items: draw(k) };
  });
  return finish({ title: "WITH RECURSIVE, one round at a time", input: "anchor: manager_id IS NULL · recursive: JOIN org ON e.manager_id = org.id", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "org-rounds": orgRounds,
};
