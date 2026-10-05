import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * SQL GROUP BY, HAVING and Subqueries: the note's figures
 * (content/notes/dbms/sql-aggregation-and-subqueries.md places each with
 * "@figure <name>").
 *
 * Every figure evaluates its query over the note's seven employees (Neha's
 * salary NULL) with SQL's rules — a comparison with NULL is UNKNOWN, every
 * aggregate but COUNT(*) skips NULL, AVG prints four decimals as MySQL does
 * — and throws if a result disagrees with the numbers the note prints.
 *
 *  - group-by: rows sorting into groups, then each group collapsing to one row of aggregates;
 *  - where-having: WHERE filtering rows, GROUP BY, then HAVING filtering groups;
 *  - correlated: the per-department average subquery evaluated once per outer row;
 *  - second-highest: OFFSET 1 with and without DISTINCT, and RANK against DENSE_RANK;
 *  - clause-order: the order SQL is written in against the order it is evaluated in.
 */

type Emp = { id: number; name: string; dept: string; salary: number | null };

const EMPLOYEES: Emp[] = [
  { id: 1, name: "Asha", dept: "Engineering", salary: 90000 },
  { id: 2, name: "Vikram", dept: "Engineering", salary: 75000 },
  { id: 3, name: "Meera", dept: "Engineering", salary: 90000 },
  { id: 4, name: "Rohan", dept: "Sales", salary: 60000 },
  { id: 5, name: "Priya", dept: "Sales", salary: 65000 },
  { id: 6, name: "Kabir", dept: "HR", salary: 50000 },
  { id: 7, name: "Neha", dept: "HR", salary: null },
];

/** SQL's `>`: UNKNOWN (null) when either side is NULL. */
const gt = (a: number | null, b: number | null): boolean | null => (a === null || b === null ? null : a > b);
const truth = (v: boolean | null) => (v === null ? "UNKNOWN" : v ? "TRUE" : "FALSE");
const show = (v: number | null) => (v === null ? "NULL" : String(v));

/** The aggregates over one group, NULLs skipped by all but COUNT(*). */
function aggregates(rows: readonly Emp[]) {
  const vals = rows.map((r) => r.salary).filter((v): v is number => v !== null);
  const sum = vals.reduce((a, b) => a + b, 0);
  return { staff: rows.length, paid: vals.length, total: vals.length ? sum : null, avg: vals.length ? sum / vals.length : null };
}
/** AVG as MySQL prints the average of integers: four decimal places. */
const avg4 = (v: number | null) => (v === null ? "NULL" : v.toFixed(4));

/** GROUP BY dept: groups in dept order, as the note's ORDER BY dept prints them. */
function groupBy(rows: readonly Emp[]): Array<{ dept: string; rows: Emp[] }> {
  const m = new Map<string, Emp[]>();
  for (const r of rows) m.set(r.dept, [...(m.get(r.dept) ?? []), r]);
  return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([dept, rs]) => ({ dept, rows: rs }));
}

const H = 26;
const G = 3;

/** Faint column headers over cells starting at x. */
function headers(p: string, cols: ReadonlyArray<{ name: string; w: number }>, x: number, y: number): Item[] {
  let cx = x;
  return cols.map((c, i) => {
    const it = label(`${p}${i}`, c.name, cx + c.w / 2, y, { tone: "soft", size: 11, mono: true });
    cx += c.w + G;
    return it;
  });
}

/** One row of cells, ids `${p}-${c}`. */
function cells(p: string, vals: readonly string[], cols: ReadonlyArray<{ w: number }>, x: number, y: number, tone: (c: number) => Tone): Item[] {
  let cx = x;
  return vals.map((v, c) => {
    const it = box(`${p}-${c}`, cx, y, v, { w: cols[c].w, h: H, size: 12, tone: tone(c) });
    cx += cols[c].w + G;
    return it;
  });
}

const widthOf = (cols: ReadonlyArray<{ w: number }>) => cols.reduce((a, c) => a + c.w + G, -G);

/* ── GROUP BY: sort into groups, collapse each to one row ──────────── */

function groupByFigure(): Walkthrough {
  const groups = groupBy(EMPLOYEES);
  const agg = groups.map((g) => ({ dept: g.dept, ...aggregates(g.rows) }));
  // The note's GROUP BY result table.
  const expect = "Engineering 3 3 255000 85000.0000|HR 2 1 50000 50000.0000|Sales 2 2 125000 62500.0000";
  const got = agg.map((a) => `${a.dept} ${a.staff} ${a.paid} ${show(a.total)} ${avg4(a.avg)}`).join("|");
  if (got !== expect) throw new Error(`group-by: ${got} disagrees with the note`);

  const rowCols = [
    { name: "name", w: 66 },
    { name: "dept", w: 100 },
    { name: "salary", w: 66 },
  ];
  const aggCols = [
    { name: "dept", w: 100 },
    { name: "staff", w: 48 },
    { name: "paid", w: 48 },
    { name: "total", w: 66 },
    { name: "avg_salary", w: 96 },
  ];
  const Y0 = 24;
  const GROUP_GAP = 16;
  const rowVals = (e: Emp) => [e.name, e.dept, show(e.salary)];

  // Where each group starts when the rows are sorted into groups.
  const groupTop: number[] = [];
  let y = Y0;
  for (const g of groups) {
    groupTop.push(y);
    y += g.rows.length * (H + G) - G + GROUP_GAP;
  }

  const frames: Frame[] = [];
  {
    const items: Item[] = [...headers("h", rowCols, 0, 6)];
    EMPLOYEES.forEach((e, i) => items.push(...cells(`r${e.id}`, rowVals(e), rowCols, 0, Y0 + i * (H + G), () => "plain")));
    frames.push({ caption: `The ${EMPLOYEES.length} rows as the table stores them, departments mixed. GROUP BY dept will gather the rows that share a dept value into one group each.`, items });
  }
  {
    const items: Item[] = [...headers("h", rowCols, 0, 6)];
    groups.forEach((g, k) => {
      items.push({ k: "band", id: `b${k}`, x: -5, y: groupTop[k] - 5, w: widthOf(rowCols) + 10, h: g.rows.length * (H + G) - G + 10, tone: "accent" });
      g.rows.forEach((e, i) => items.push(...cells(`r${e.id}`, rowVals(e), rowCols, 0, groupTop[k] + i * (H + G), (c) => (c === 1 ? "accent" : "plain"))));
    });
    frames.push({
      caption: `Rows with equal dept values form one group: ${groups.map((g) => `${g.dept} (${g.rows.length})`).join(", ")}. Nothing is computed yet; each aggregate will run once inside each group.`,
      items,
    });
  }
  {
    const items: Item[] = [...headers("a", aggCols, 0, 6)];
    groups.forEach((g, k) => {
      const a = agg[k];
      const mid = groupTop[k] + ((g.rows.length - 1) * (H + G)) / 2;
      items.push({ k: "band", id: `b${k}`, x: -5, y: mid - 5, w: widthOf(aggCols) + 10, h: H + 10, tone: "accent" });
      items.push(...cells(`g${k}`, [a.dept, String(a.staff), String(a.paid), show(a.total), avg4(a.avg)], aggCols, 0, mid, (c) => (c === 0 ? "accent" : "strong")));
    });
    const hr = agg.find((a) => a.paid < a.staff)!;
    frames.push({
      caption: `Each group collapses to one row. COUNT(*) counts rows, but COUNT(salary), SUM and AVG skip NULL: ${hr.dept} has ${hr.staff} staff, ${hr.paid} paid, and its average is ${hr.total} / ${hr.paid}, not / ${hr.staff}.`,
      items,
    });
  }
  return finish({ title: "GROUP BY: rows sort into groups, each group becomes one row", input: "SELECT dept, COUNT(*), COUNT(salary), SUM(salary), AVG(salary) FROM employees GROUP BY dept", frames });
}

/* ── WHERE filters rows, HAVING filters groups ────────────────────── */

function whereHaving(): Walkthrough {
  const LIMIT = 60000;
  const MIN = 2;
  const tests = EMPLOYEES.map((e) => gt(e.salary, LIMIT));
  const kept = EMPLOYEES.filter((_, i) => tests[i] === true);
  const groups = groupBy(kept);
  const passes = groups.map((g) => g.rows.length >= MIN);
  const answer = groups.filter((_, k) => passes[k]).map((g) => `${g.dept} ${g.rows.length}`);
  if (kept.map((e) => e.name).join(",") !== "Asha,Vikram,Meera,Priya" || answer.join(",") !== "Engineering 3") throw new Error(`where-having: ${answer.join(",")} disagrees with the note`);

  const cols = [
    { name: "name", w: 66 },
    { name: "dept", w: 100 },
    { name: "salary", w: 66 },
    { name: `salary > ${LIMIT}`, w: 112 },
  ];
  const Y0 = 24;
  const rowVals = (e: Emp, i: number) => [e.name, e.dept, show(e.salary), truth(tests[i])];
  const frames: Frame[] = [];
  {
    const items: Item[] = [...headers("h", cols, 0, 6)];
    EMPLOYEES.forEach((e, i) => items.push(...cells(`r${e.id}`, rowVals(e, i), cols, 0, Y0 + i * (H + G), (c) => (tests[i] === true ? (c === 3 ? "accent" : "plain") : "muted"))));
    const unknown = EMPLOYEES.filter((_, i) => tests[i] === null).map((e) => e.name);
    const equal = EMPLOYEES.filter((e) => e.salary === LIMIT).map((e) => e.name);
    frames.push({
      caption: `WHERE runs first, on single rows: ${kept.length} rows have a salary over ${LIMIT}. ${equal.join(", ")}'s ${LIMIT} is not greater, and ${unknown.join(", ")}'s NULL gives UNKNOWN, which WHERE drops like FALSE.`,
      items,
    });
  }
  const groupTop: number[] = [];
  let y = Y0;
  for (const g of groups) {
    groupTop.push(y);
    y += g.rows.length * (H + G) - G + 16;
  }
  const grouped = (withHaving: boolean): Item[] => {
    const items: Item[] = [...headers("h", cols.slice(0, 3), 0, 6)];
    groups.forEach((g, k) => {
      const tone: Tone = withHaving ? (passes[k] ? "strong" : "muted") : "accent";
      items.push({ k: "band", id: `b${k}`, x: -5, y: groupTop[k] - 5, w: widthOf(cols.slice(0, 3)) + 10, h: g.rows.length * (H + G) - G + 10, tone: withHaving && !passes[k] ? "muted" : "accent" });
      g.rows.forEach((e, i) => items.push(...cells(`r${e.id}`, rowVals(e, EMPLOYEES.indexOf(e)).slice(0, 3), cols.slice(0, 3), 0, groupTop[k] + i * (H + G), () => (withHaving && !passes[k] ? "muted" : "plain"))));
      const CX = widthOf(cols.slice(0, 3)) + 24;
      items.push(box(`c${k}`, CX, groupTop[k], `COUNT(*) = ${g.rows.length}`, { w: 112, h: H, size: 12, tone }));
      if (withHaving) items.push(label(`v${k}`, `>= ${MIN}? ${truth(passes[k])}`, CX + 122, groupTop[k] + H / 2, { anchor: "start", tone: passes[k] ? "accent" : "faint", size: 12, mono: true, weight: 600 }));
    });
    return items;
  };
  frames.push({
    caption: `GROUP BY sees only the ${kept.length} survivors: ${groups.map((g) => `${g.dept} with ${g.rows.length}`).join(" and ")}. HR has no group at all, because WHERE removed both of its rows before grouping began.`,
    items: grouped(false),
  });
  frames.push({
    caption: `HAVING runs last, on whole groups, so it may test COUNT(*). ${groups.map((g, k) => `${g.dept}'s ${g.rows.length} ${passes[k] ? "passes" : "fails"}`).join(" and ")} the test >= ${MIN}: the result is one row, ${answer[0].replace(" ", ", ")}.`,
    items: grouped(true),
  });
  return finish({ title: "WHERE filters rows before grouping, HAVING filters groups after", input: `WHERE salary > ${LIMIT} GROUP BY dept HAVING COUNT(*) >= ${MIN}`, frames });
}

/* ── A correlated subquery, once per outer row ─────────────────────── */

function correlated(): Walkthrough {
  const avgOf = (dept: string) => aggregates(EMPLOYEES.filter((x) => x.dept === dept)).avg;
  const verdict = EMPLOYEES.map((e) => gt(e.salary, avgOf(e.dept)));
  const kept = EMPLOYEES.filter((_, i) => verdict[i] === true).map((e) => e.name);
  if (kept.join(",") !== "Asha,Meera,Priya") throw new Error(`correlated: kept ${kept.join(",")}, the note says Asha, Meera, Priya`);

  const cols = [
    { name: "name", w: 62 },
    { name: "dept", w: 96 },
    { name: "salary", w: 62 },
  ];
  const Y0 = 24;
  const PX = widthOf(cols) + 34;
  const frames: Frame[] = [];
  const draw = (cur: number | null): Item[] => {
    const items: Item[] = [...headers("h", cols, 0, 6)];
    const curDept = cur === null ? null : EMPLOYEES[cur].dept;
    EMPLOYEES.forEach((e, i) => {
      if (curDept !== null && e.dept === curDept) items.push({ k: "band", id: `bd${i}`, x: -5, y: Y0 + i * (H + G) - 2, w: widthOf(cols) + 10, h: H + 4, tone: "accent" });
    });
    EMPLOYEES.forEach((e, i) => {
      const done = cur === null || i < cur;
      const tone: Tone = i === cur ? "accent" : done ? (verdict[i] === true ? "strong" : "muted") : "plain";
      items.push(...cells(`r${e.id}`, [e.name, e.dept, show(e.salary)], cols, 0, Y0 + i * (H + G), () => tone));
    });
    if (cur !== null) {
      const e = EMPLOYEES[cur];
      const a = avgOf(e.dept);
      const ry = Y0 + cur * (H + G) + H / 2;
      items.push(arrow("ar", { x: widthOf(cols) + 6, y: ry }, { x: PX - 6, y: ry }, { tone: "accent" }));
      const py = Math.min(Math.max(ry - 38, Y0 - 6), Y0 + 7 * (H + G) - 84);
      items.push(label("q1", "subquery for this row:", PX, py, { anchor: "start", tone: "soft", size: 11 }));
      items.push(label("q2", "AVG(salary) WHERE", PX, py + 19, { anchor: "start", tone: "ink", size: 12, mono: true }));
      items.push(label("q5", `dept = '${e.dept}'`, PX, py + 36, { anchor: "start", tone: "ink", size: 12, mono: true }));
      items.push(label("q3", `= ${avg4(a)}`, PX, py + 55, { anchor: "start", tone: "accent", size: 12, mono: true, weight: 600 }));
      items.push(label("q4", `${show(e.salary)} > ${a === null ? "NULL" : a}: ${truth(verdict[cur])}`, PX, py + 76, { anchor: "start", tone: verdict[cur] === true ? "accent" : "soft", size: 12, mono: true, weight: 600 }));
    } else {
      items.push(label("q1", `kept: ${kept.join(", ")}`, PX, Y0 + H, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
      items.push(label("q2", `subquery runs: ${EMPLOYEES.length}`, PX, Y0 + H + 22, { anchor: "start", tone: "soft", size: 11.5, mono: true }));
      items.push(label("q3", `distinct averages: ${new Set(EMPLOYEES.map((e) => e.dept)).size}`, PX, Y0 + H + 40, { anchor: "start", tone: "soft", size: 11.5, mono: true }));
    }
    return items;
  };
  const seen = new Set<string>();
  EMPLOYEES.forEach((e, i) => {
    const a = avgOf(e.dept);
    const first = !seen.has(e.dept);
    seen.add(e.dept);
    const v = verdict[i];
    let caption: string;
    if (i === 0) caption = `The subquery refers to e.dept, the outer row's department, so it is evaluated again for each outer row. For ${e.name}, it averages ${e.dept}: ${a}. ${e.salary} > ${a} is TRUE, so ${e.name} is kept.`;
    else if (e.salary === null) caption = `${e.name}'s salary is NULL, so NULL > ${a} is UNKNOWN and the row is dropped, even though the subquery itself ran and returned ${a}.`;
    else if (e.salary === a) caption = `${e.name} earns ${e.salary} and ${e.dept}'s average is ${a}${first ? " (the NULL salary is skipped)" : ""}: equal is not greater, so the row is dropped.`;
    else caption = `${e.name}: ${e.dept}'s average is ${a}${first ? "" : ", computed again for this row"}. ${e.salary} > ${a} is ${truth(v)}, so ${e.name} is ${v ? "kept" : "dropped"}.`;
    frames.push({ caption, items: draw(i) });
  });
  frames.push({
    caption: `${kept.length} rows survive: ${kept.join(", ")}. Logically the subquery ran ${EMPLOYEES.length} times for only ${seen.size} different answers, which is why optimizers often rewrite it as a join with each department's average computed once.`,
    items: draw(null),
  });
  return finish({ title: "A correlated subquery is evaluated once per outer row", input: "WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept = e.dept)", frames });
}

/* ── The second highest salary: DISTINCT and DENSE_RANK ────────────── */

function secondHighest(): Walkthrough {
  // ORDER BY salary DESC: MySQL sorts NULL last in descending order.
  const desc = (a: number | null, b: number | null) => (a === null ? 1 : b === null ? -1 : b - a);
  const all = EMPLOYEES.map((e) => e.salary).sort(desc);
  const distinct = [...new Set(all)].sort(desc);
  const plainPick = all[1];
  const distinctPick = distinct[1];
  // RANK and DENSE_RANK over the non-NULL salaries, as the note's method 3 filters them.
  const ranked = all.filter((v): v is number => v !== null);
  const rank = ranked.map((v) => ranked.findIndex((x) => x === v) + 1);
  const dense = ranked.map((v) => [...new Set(ranked)].indexOf(v) + 1);
  const denseTwo = [...new Set(ranked.filter((_, i) => dense[i] === 2))];
  const rankTwo = ranked.filter((_, i) => rank[i] === 2);
  if (plainPick !== 90000 || distinctPick !== 75000 || denseTwo.join() !== "75000" || rankTwo.length !== 0) throw new Error("second-highest: results disagree with the note");

  const W = 76;
  const X = 150;
  const Y0 = 24;
  const rowY = (i: number) => Y0 + i * (H + G);
  const frames: Frame[] = [];
  const column = (vals: ReadonlyArray<number | null>, picked: number, ok: boolean): Item[] => {
    const items: Item[] = [label("hs", "salary", X + W / 2, 6, { tone: "soft", size: 11, mono: true })];
    // Ids by value and occurrence, so the duplicate 90000 is the one that leaves when DISTINCT is added.
    const seen = new Map<string, number>();
    vals.forEach((v, i) => {
      const key = show(v);
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      items.push(box(`s${key}-${n}`, X, rowY(i), key, { w: W, h: H, size: 12, tone: i === picked ? (ok ? "strong" : "error") : i < picked ? "muted" : "plain" }));
    });
    return items;
  };
  // A sideways caret: drawn as a short arrow into the picked cell.
  const pointer = (i: number, text: string, tone: "accent" | "error"): Item[] => [arrow("pa", { x: X - 16, y: rowY(i) + H / 2 }, { x: X - 4, y: rowY(i) + H / 2 }, { tone }), label("pt", text, X - 22, rowY(i) + H / 2, { anchor: "end", tone, size: 11.5, mono: true, weight: 600 })];
  frames.push({
    caption: `ORDER BY salary DESC LIMIT 1 OFFSET 1 skips one row and returns the next. Without DISTINCT the tie at the top fills two rows, so the "second highest" comes back as ${plainPick}, the highest again.`,
    items: [...column(all, 1, false), ...pointer(1, "OFFSET 1", "error")],
  });
  frames.push({
    caption: `SELECT DISTINCT salary keeps one copy of each value before the sort, so OFFSET 1 lands on ${distinctPick}, the second highest distinct salary. The NULL is kept too, and sorts last.`,
    items: [...column(distinct, 1, true), ...pointer(1, "OFFSET 1", "accent")],
  });
  {
    const items: Item[] = [...column(ranked, ranked.indexOf(distinctPick), true)];
    const RX = X + W + 14;
    items.push(label("hr", "RANK", RX + 30, 6, { tone: "soft", size: 11, mono: true }), label("hd", "DENSE_RANK", RX + 60 + 6 + 45, 6, { tone: "soft", size: 11, mono: true }));
    ranked.forEach((_, i) => {
      items.push(box(`rk${i}`, RX, rowY(i), rank[i], { w: 60, h: H, size: 12, tone: "plain" }));
      items.push(box(`dr${i}`, RX + 66, rowY(i), dense[i], { w: 90, h: H, size: 12, tone: dense[i] === 2 ? "strong" : "plain" }));
    });
    items.push(...pointer(ranked.indexOf(distinctPick), "rank 2", "accent"));
    frames.push({
      caption: `With the NULL filtered out, DENSE_RANK numbers the distinct values 1, 2, 3 with no gaps, so rank 2 is ${denseTwo[0]}. RANK skips a number after the tie, ${rank.slice(0, 3).join(", ")}, so no row has rank 2 and the query would return nothing.`,
      items,
    });
  }
  return finish({ title: "The second highest salary: why DISTINCT and DENSE_RANK matter", input: `salaries: ${EMPLOYEES.map((e) => show(e.salary)).join(", ")}`, frames });
}

/* ── Written order against evaluation order ───────────────────────── */

function clauseOrder(): Walkthrough {
  const WRITTEN = ["SELECT", "DISTINCT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"];
  const LOGICAL: Array<[string, string]> = [
    ["FROM", "build the working rows (and joins)"],
    ["WHERE", "keep rows where the test is TRUE"],
    ["GROUP BY", "form the groups"],
    ["HAVING", "keep groups where the test is TRUE"],
    ["SELECT", "compute columns, aggregates, aliases"],
    ["DISTINCT", "remove duplicate rows"],
    ["ORDER BY", "sort (aliases exist now)"],
    ["LIMIT", "cut the result"],
  ];
  if ([...WRITTEN].sort().join() !== LOGICAL.map(([c]) => c).sort().join()) throw new Error("clause-order: the two orders hold different clauses");
  const W = 84;
  const XL = 0;
  const XR = 170;
  const Y0 = 28;
  const rowY = (i: number) => Y0 + i * (H + 8);
  const items: Item[] = [
    label("hw", "as written", XL + W / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
    label("he", "as evaluated", XR + W / 2, 8, { tone: "soft", size: 11.5, weight: 600 }),
  ];
  WRITTEN.forEach((c, i) => {
    const j = LOGICAL.findIndex(([x]) => x === c);
    const moved = j > i;
    items.push(box(`w${i}`, XL, rowY(i), c, { w: W, h: H, size: 12, tone: moved ? "accent" : "plain" }));
    items.push({ k: "edge", id: `e${i}`, x1: XL + W + 3, y1: rowY(i) + H / 2, x2: XR - 4, y2: rowY(j) + H / 2, tone: moved ? "accent" : "line", arrow: true });
  });
  LOGICAL.forEach(([c, what], j) => {
    items.push(box(`l${j}`, XR, rowY(j), c, { w: W, h: H, size: 12, tone: c === "SELECT" || c === "DISTINCT" ? "accent" : "plain" }));
    items.push(label(`n${j}`, `${j + 1}`, XR + W + 10, rowY(j) + H / 2, { anchor: "start", tone: "faint", size: 11, mono: true }));
    items.push(label(`d${j}`, what, XR + W + 26, rowY(j) + H / 2, { anchor: "start", tone: "ink", size: 11.5 }));
  });
  const sel = LOGICAL.findIndex(([c]) => c === "SELECT") + 1;
  return finish({
    title: "SQL is written SELECT first but evaluated FROM first",
    input: "",
    frames: [
      {
        caption: `SELECT is written first but runs ${["first", "second", "third", "fourth", "fifth", "sixth"][sel - 1]}, after the rows are filtered and grouped. So WHERE cannot see aliases or aggregates, which do not exist yet, while ORDER BY, running later, can use both.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "group-by": groupByFigure,
  "where-having": whereHaving,
  correlated,
  "second-highest": secondHighest,
  "clause-order": clauseOrder,
};
