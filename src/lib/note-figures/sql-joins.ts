import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * SQL Joins: the note's figures (content/notes/dbms/sql-joins.md places
 * each with "@figure <name>").
 *
 * Every figure runs a real join over the note's own tables — `employees`
 * (Rohan's dept_id is NULL, manager_id points into the same table) and
 * `departments` (HR has nobody) — with SQL's three-valued comparison, so a
 * NULL key matches nothing. Nothing in a result is typed in: the matched
 * pairs, the NULL-padded rows, the 4 × 3 cross product and the fan-out
 * counts all come from `joinRows` below, and each figure throws if its
 * result disagrees with the row counts the note's tables print.
 *
 *  - match-rows: an inner/left join run one employee at a time, ending with
 *    which rows each of the four joins keeps;
 *  - cross-grid: the cross join as a 4 × 3 grid, the ON condition filtering
 *    it to the inner join, and the rows the outer joins pad back;
 *  - self-join: the table twice, manager_id pointing into the other copy;
 *  - fan-out: a non-unique key on both sides multiplying rows.
 */

type Val = string | number | null;
type Row = Record<string, Val>;

const EMPLOYEES: Row[] = [
  { emp_id: 1, name: "Asha", dept_id: 10, manager_id: null },
  { emp_id: 2, name: "Vikram", dept_id: 20, manager_id: 1 },
  { emp_id: 3, name: "Meera", dept_id: 10, manager_id: 1 },
  { emp_id: 4, name: "Rohan", dept_id: null, manager_id: 2 },
];
const DEPARTMENTS: Row[] = [
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Sales" },
  { dept_id: 30, dept_name: "HR" },
];
const BONUSES: Row[] = [
  { dept_id: 10, amount: 5000 },
  { dept_id: 10, amount: 2000 },
  { dept_id: 20, amount: 3000 },
];

/** SQL's `=`: TRUE, FALSE or UNKNOWN (null) — a NULL on either side is UNKNOWN. */
const sqlEq = (a: Val, b: Val): boolean | null => (a === null || b === null ? null : a === b);

type Kind = "inner" | "left" | "right" | "full" | "cross";

/** The join, by the definition: every pair whose condition is TRUE, then the unmatched rows the kind keeps, padded with NULL. */
function joinRows(L: Row[], R: Row[], on: (l: Row, r: Row) => boolean | null, kind: Kind): Array<[number | null, number | null]> {
  const out: Array<[number | null, number | null]> = [];
  const rightHit = new Set<number>();
  L.forEach((l, i) => {
    let hit = false;
    R.forEach((r, j) => {
      if (kind === "cross" || on(l, r) === true) {
        out.push([i, j]);
        hit = true;
        rightHit.add(j);
      }
    });
    if (!hit && (kind === "left" || kind === "full")) out.push([i, null]);
  });
  if (kind === "right" || kind === "full") R.forEach((_, j) => !rightHit.has(j) && out.push([null, j]));
  return out;
}

const byDept = (e: Row, d: Row) => sqlEq(e.dept_id, d.dept_id);
const show = (v: Val) => (v === null ? "NULL" : String(v));

/** A table of cells under a bold title and faint column headers. Cell ids `${p}${r}-${c}`. */
function table(p: string, title: string, cols: ReadonlyArray<{ name: string; w: number }>, rows: ReadonlyArray<ReadonlyArray<string>>, o: { x: number; y: number; h?: number; tone?: (r: number, c: number) => Tone | undefined }) {
  const h = o.h ?? 26;
  const gap = 3;
  const colX: number[] = [];
  let cx = o.x;
  for (const c of cols) {
    colX.push(cx);
    cx += c.w + gap;
  }
  const rowY = (r: number) => o.y + 34 + r * (h + gap);
  const items: Item[] = [label(`${p}T`, title, o.x, o.y, { anchor: "start", tone: "ink", weight: 700, size: 12.5 })];
  cols.forEach((c, i) => items.push(label(`${p}H${i}`, c.name, colX[i] + c.w / 2, o.y + 21, { tone: "soft", size: 11, mono: true })));
  rows.forEach((row, r) => row.forEach((v, c) => items.push(box(`${p}${r}-${c}`, colX[c], rowY(r), v, { w: cols[c].w, h, size: 12, tone: o.tone?.(r, c) ?? "plain" }))));
  return { items, colX, rowY, h, right: cx - gap, bottom: rowY(rows.length) - gap };
}

/* ── An inner and a left join, one employee at a time ─────────────── */

function matchRows(): Walkthrough {
  const inner = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "inner");
  const left = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "left");
  const right = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "right");
  const full = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "full");
  const counts = { inner: inner.length, left: left.length, right: right.length, full: full.length };
  // The note's "Join types at a glance" table.
  if (counts.inner !== 3 || counts.left !== 4 || counts.right !== 4 || counts.full !== 5) throw new Error(`match-rows: counts ${JSON.stringify(counts)} disagree with the note`);

  const EX = 0;
  const DX = 250;
  const eCols = [
    { name: "name", w: 66 },
    { name: "dept_id", w: 58 },
  ];
  const dCols = [
    { name: "dept_id", w: 58 },
    { name: "dept_name", w: 100 },
  ];
  const RY = 172;
  const frames: Frame[] = [];

  const draw = (cur: number | null, done: number, o: { final?: boolean } = {}): Item[] => {
    // What the join has produced so far: the left join's rows for employees 0 … done − 1, and at the end the full join's.
    const rows = o.final ? full : left.filter(([i]) => i !== null && (i < done || i === cur));
    const matchedNow = cur === null ? [] : inner.filter(([i]) => i === cur).map(([, j]) => j as number);
    const e = table("e", "employees", eCols, EMPLOYEES.map((r) => [show(r.name), show(r.dept_id)]), {
      x: EX,
      y: 0,
      tone: (r) => (r === cur ? "accent" : r < done || o.final ? "muted" : "plain"),
    });
    const hitDepts = new Set(rows.flatMap(([i, j]) => (i === null || j === null ? [] : [j])));
    const d = table("d", "departments", dCols, DEPARTMENTS.map((r) => [show(r.dept_id), show(r.dept_name)]), {
      x: DX,
      y: 0,
      tone: (r) => (matchedNow.includes(r) ? "accent" : o.final && !hitDepts.has(r) ? "accent" : hitDepts.has(r) ? "muted" : "plain"),
    });
    const items: Item[] = [...e.items, ...d.items];
    // A line per matched pair produced so far, from the employee's dept_id to the department's.
    inner
      .filter(([i]) => (i as number) < done || i === cur)
      .forEach(([i, j]) =>
        items.push({
          k: "edge",
          id: `l${i}-${j}`,
          x1: e.right + 3,
          y1: e.rowY(i as number) + e.h / 2,
          x2: DX - 4,
          y2: d.rowY(j as number) + d.h / 2,
          tone: i === cur ? "accent" : "line",
          arrow: false,
        }),
      );
    if (cur !== null && matchedNow.length === 0) items.push(label("nm", "no match", (e.right + DX) / 2, e.rowY(cur) + e.h / 2, { tone: "accent", size: 11, weight: 600 }));
    // The result so far.
    const outCols = [
      { name: "name", w: 66 },
      { name: "dept_name", w: 100 },
    ];
    const out = table("o", o.final ? "FULL OUTER JOIN result" : "result so far", outCols, rows.map(([i, j]) => [i === null ? "NULL" : show(EMPLOYEES[i].name), j === null ? "NULL" : show(DEPARTMENTS[j].dept_name)]), {
      x: EX,
      y: RY,
      tone: (r) => {
        const [i, j] = rows[r];
        if (i === null || j === null) return "accent";
        return i === cur ? "accent" : "strong";
      },
    });
    // Ids by the pair, not the position, so a row keeps its place as others arrive.
    const outItems = out.items.map((it) => {
      const m = /^o(\d+)-(\d)$/.exec(it.id);
      if (!m) return it;
      const [i, j] = rows[Number(m[1])];
      return { ...it, id: `o${i ?? "n"}.${j ?? "n"}-${m[2]}` };
    });
    items.push(...outItems);
    if (o.final) {
      rows.forEach(([i, j], r) => {
        const tag = i === null ? "RIGHT and FULL only" : j === null ? "LEFT and FULL only" : "every join";
        items.push(label(`tag${i ?? "n"}.${j ?? "n"}`, tag, out.right + 12, out.rowY(r) + out.h / 2, { anchor: "start", tone: i === null || j === null ? "accent" : "soft", size: 11 }));
      });
      items.push(label("cnt", `INNER ${counts.inner} · LEFT ${counts.left} · RIGHT ${counts.right} · FULL ${counts.full} rows`, EX, out.bottom + 24, { anchor: "start", tone: "ink", size: 12, weight: 600, mono: true }));
    }
    return items;
  };

  frames.push({
    caption: "The join reads employees one row at a time and looks in departments for every row whose dept_id equals this employee's. Each pair found becomes one result row.",
    items: draw(null, 0),
  });
  EMPLOYEES.forEach((emp, i) => {
    const hits = inner.filter(([a]) => a === i).map(([, j]) => DEPARTMENTS[j as number]);
    const caption =
      hits.length > 0
        ? `${emp.name}'s dept_id is ${show(emp.dept_id)}, which equals ${hits.map((h) => `${h.dept_name}'s`).join(" and ")}: one result row, ${emp.name} with ${hits.map((h) => h.dept_name).join(", ")}.${i > 0 && inner.some(([a, j]) => (a as number) < i && hits.some((h) => DEPARTMENTS[j as number] === h)) ? " A department may match any number of employees." : ""}`
        : `${emp.name}'s dept_id is NULL, and NULL = 10 is UNKNOWN, never TRUE, so no department matches. An inner join emits nothing; a left join still emits ${emp.name}, with NULL for every department column.`;
    frames.push({ caption, items: draw(i, i) });
  });
  const unmatched = full.filter(([i]) => i === null).map(([, j]) => DEPARTMENTS[j as number].dept_name);
  frames.push({
    caption: `No employee pointed at ${unmatched.join(", ")}, so a right join adds it with NULL for the employee. A full outer join keeps both padded rows: ${counts.inner} matched pairs plus one unmatched row from each side.`,
    items: draw(null, EMPLOYEES.length, { final: true }),
  });
  return finish({ title: "Matching rows: inner, left, right and full outer join", input: "employees JOIN departments ON e.dept_id = d.dept_id", frames });
}

/* ── The cross join, filtered by ON, padded by the outer joins ────── */

function crossGrid(): Walkthrough {
  const cross = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "cross");
  if (cross.length !== EMPLOYEES.length * DEPARTMENTS.length || cross.length !== 12) throw new Error("cross-grid: the cross join is not 4 × 3 = 12 rows");
  const inner = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "inner");
  const full = joinRows(EMPLOYEES, DEPARTMENTS, byDept, "full");
  const W = 94;
  const H = 30;
  const G = 4;
  const X0 = 0;
  const Y0 = 0;
  const cx = (c: number) => X0 + c * (W + G);
  const cy = (r: number) => Y0 + r * (H + G);
  const loneRows = full.filter(([, j]) => j === null).map(([i]) => i as number);
  const loneCols = full.filter(([i]) => i === null).map(([, j]) => j as number);

  const draw = (stage: "cross" | "on" | "outer"): Item[] => {
    const items: Item[] = [];
    DEPARTMENTS.forEach((d, c) => {
      items.push(label(`ch${c}`, show(d.dept_name), cx(c) + W / 2, Y0 - 26, { tone: "soft", size: 11, mono: true }));
      items.push(label(`ci${c}`, `(${d.dept_id})`, cx(c) + W / 2, Y0 - 12, { tone: "faint", size: 10.5, mono: true }));
    });
    EMPLOYEES.forEach((e, r) => items.push(label(`rh${r}`, `${e.name} (${show(e.dept_id)})`, X0 - 10, cy(r) + H / 2, { anchor: "end", tone: "soft", size: 11, mono: true })));
    cross.forEach(([i, j], n) => {
      const e = EMPLOYEES[i as number];
      const d = DEPARTMENTS[j as number];
      const v = byDept(e, d);
      const text = stage === "cross" ? `row ${n + 1}` : `${show(e.dept_id)} = ${show(d.dept_id)}`;
      const tone: Tone = stage === "cross" ? "plain" : v === true ? "strong" : "muted";
      items.push(box(`c${i}-${j}`, cx(j as number), cy(i as number), text, { w: W, h: H, size: 12, tone }));
    });
    if (stage === "outer") {
      const PX = cx(DEPARTMENTS.length) + 14;
      const PY = cy(EMPLOYEES.length) + 14;
      items.push(label("pl", "LEFT pads", PX + W / 2, Y0 - 14, { tone: "accent", size: 11, weight: 600 }));
      for (const r of loneRows) items.push(box(`pr${r}`, PX, cy(r), "dept NULL", { w: W, h: H, size: 12, tone: "accent" }));
      items.push(label("pb", "RIGHT pads", X0 - 10, PY + H / 2, { anchor: "end", tone: "accent", size: 11, weight: 600 }));
      for (const c of loneCols) items.push(box(`pc${c}`, cx(c), PY, "emp NULL", { w: W, h: H, size: 12, tone: "accent" }));
    }
    return items;
  };

  const unknownRow = EMPLOYEES.find((e) => e.dept_id === null)!;
  return finish({
    title: "A join is a cross join filtered by its ON condition",
    input: "employees CROSS JOIN departments",
    frames: [
      {
        caption: `A cross join pairs every employee with every department, with no condition: ${EMPLOYEES.length} × ${DEPARTMENTS.length} = ${cross.length} result rows, one per cell.`,
        items: draw("cross"),
      },
      {
        caption: `An inner join keeps only the cells where ON e.dept_id = d.dept_id is TRUE: ${inner.length} of ${cross.length}. ${unknownRow.name}'s comparisons are NULL = 10, NULL = 20 and NULL = 30, all UNKNOWN, so his row has no TRUE cell.`,
        items: draw("on"),
      },
      {
        caption: `Outer joins add back what has no TRUE cell, padded with NULL: a left join adds ${loneRows.map((r) => EMPLOYEES[r].name).join(", ")}'s row, a right join ${loneCols.map((c) => DEPARTMENTS[c].dept_name).join(", ")}'s column, and a full outer join both.`,
        items: draw("outer"),
      },
    ],
  });
}

/* ── A self join: the table twice under two aliases ───────────────── */

function selfJoin(): Walkthrough {
  const pairs = joinRows(EMPLOYEES, EMPLOYEES, (e, m) => sqlEq(e.manager_id, m.emp_id), "left");
  if (pairs.length !== 4 || pairs.filter(([, j]) => j !== null).length !== 3) throw new Error("self-join: the note's self join returns 4 rows, 3 with a manager");
  const eCols = [
    { name: "emp_id", w: 54 },
    { name: "name", w: 66 },
    { name: "manager_id", w: 82 },
  ];
  const mCols = [
    { name: "emp_id", w: 54 },
    { name: "name", w: 66 },
  ];
  const MX = 300;
  const managers = new Set(pairs.flatMap(([, j]) => (j === null ? [] : [j])));
  const e = table("e", "employees e (the employee)", eCols, EMPLOYEES.map((r) => [show(r.emp_id), show(r.name), show(r.manager_id)]), {
    x: 0,
    y: 0,
    tone: (r, c) => (c === 2 ? (EMPLOYEES[r].manager_id === null ? "muted" : "accent") : "plain"),
  });
  const m = table("m", "employees m (the manager)", mCols, EMPLOYEES.map((r) => [show(r.emp_id), show(r.name)]), {
    x: MX,
    y: 0,
    tone: (r, c) => (c === 0 && managers.has(r) ? "accent" : "plain"),
  });
  const items: Item[] = [...e.items, ...m.items];
  pairs.forEach(([i, j]) => {
    if (j === null) return;
    items.push(arrow(`a${i}`, { x: e.right + 4, y: e.rowY(i as number) + e.h / 2 }, { x: MX - 5, y: m.rowY(j) + m.h / 2 }, { tone: "accent" }));
  });
  const lone = EMPLOYEES[pairs.find(([, j]) => j === null)![0] as number].name;
  return finish({
    title: "A self join: one table under two aliases",
    input: "employees e LEFT JOIN employees m ON e.manager_id = m.emp_id",
    frames: [
      {
        caption: `Read the table twice: as e, the employee, and as m, the manager. Each manager_id points at the row of m with that emp_id; ${lone}'s NULL points nowhere, so an inner self join would drop her and a left one keeps her with a NULL manager.`,
        items,
      },
    ],
  });
}

/* ── Fan-out: a key that is not unique on either side ─────────────── */

function fanOut(): Walkthrough {
  const pairs = joinRows(EMPLOYEES, BONUSES, byDept, "inner");
  const depts = [...new Set(BONUSES.map((b) => b.dept_id as number))];
  const per = depts.map((d) => {
    const l = EMPLOYEES.filter((e) => e.dept_id === d).length;
    const r = BONUSES.filter((b) => b.dept_id === d).length;
    return { d, l, r, n: pairs.filter(([i]) => EMPLOYEES[i as number].dept_id === d).length };
  });
  for (const p of per) if (p.n !== p.l * p.r) throw new Error(`fan-out: dept ${p.d} gave ${p.n} rows, not ${p.l} × ${p.r}`);
  if (pairs.length !== 5) throw new Error("fan-out: the note says 5 rows");
  const eCols = [
    { name: "name", w: 66 },
    { name: "dept_id", w: 58 },
  ];
  const bCols = [
    { name: "dept_id", w: 58 },
    { name: "amount", w: 62 },
  ];
  const BX = 240;
  const e = table("e", "employees", eCols, EMPLOYEES.map((r) => [show(r.name), show(r.dept_id)]), {
    x: 0,
    y: 0,
    tone: (r) => (pairs.some(([i]) => i === r) ? "plain" : "muted"),
  });
  const b = table("b", "bonuses", bCols, BONUSES.map((r) => [show(r.dept_id), show(r.amount)]), { x: BX, y: 0 });
  const items: Item[] = [...e.items, ...b.items];
  pairs.forEach(([i, j]) => {
    const many = per.find((p) => p.d === EMPLOYEES[i as number].dept_id)!;
    items.push({ k: "edge", id: `l${i}-${j}`, x1: e.right + 3, y1: e.rowY(i as number) + e.h / 2, x2: BX - 4, y2: b.rowY(j as number) + b.h / 2, tone: many.l * many.r > 1 ? "accent" : "line" });
  });
  per.forEach((p, k) => items.push(label(`n${k}`, `dept ${p.d}: ${p.l} employee${p.l === 1 ? "" : "s"} × ${p.r} bonus${p.r === 1 ? "" : "es"} = ${p.n} row${p.n === 1 ? "" : "s"}`, 0, e.bottom + 26 + k * 20, { anchor: "start", tone: p.n > 1 ? "accent" : "soft", size: 12, mono: true, weight: k === 0 ? 600 : undefined })));
  items.push(label("tot", `${pairs.length} rows in all, from ${EMPLOYEES.length} employees`, 0, e.bottom + 26 + per.length * 20 + 4, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
  return finish({
    title: "Fan-out: every matching pair is one row",
    input: "employees JOIN bonuses ON e.dept_id = b.dept_id",
    frames: [
      {
        caption: `Each line is one result row. Two Engineering employees meet two Engineering bonuses, so dept 10 alone gives ${per[0].n} rows, and any SUM over employee columns now counts each of them twice.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "match-rows": matchRows,
  "cross-grid": crossGrid,
  "self-join": selfJoin,
  "fan-out": fanOut,
};
