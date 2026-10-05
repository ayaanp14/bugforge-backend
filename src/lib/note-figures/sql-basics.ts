import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";

/**
 * SQL Basics: the note's figures (content/notes/dbms/sql-basics.md places
 * each with "@figure <name>").
 *
 *  - families: a short script run statement by statement through a tiny
 *    in-memory database (schema, rows, grants, an open transaction), so each
 *    command family is seen landing on the part it changes; the transfer's
 *    total is checked before and after COMMIT.
 *  - logical-order: one SELECT processed clause by clause over the note's
 *    students table — the rows each step leaves are computed by filtering,
 *    grouping, aggregating, sorting and cutting the data in TypeScript.
 *  - null-logic: five WHERE conditions evaluated on every row with SQL's
 *    three-valued logic; the rows each keeps are checked against the note.
 *  - delete-truncate-drop: the three commands applied to copies of the
 *    table, with the AUTO_INCREMENT counter each leaves behind.
 */

type Student = { id: number; name: string; dept: string; marks: number | null; city: string };
/** The note's students table, after its INSERT and before the UPDATE and DELETE. */
const STUDENTS: Student[] = [
  { id: 1, name: "Asha", dept: "CSE", marks: 91, city: "Pune" },
  { id: 2, name: "Vikram", dept: "CSE", marks: 78, city: "Delhi" },
  { id: 3, name: "Meera", dept: "ECE", marks: 85, city: "Chennai" },
  { id: 4, name: "Rohan", dept: "ME", marks: null, city: "Pune" },
  { id: 5, name: "Priya", dept: "ECE", marks: 67, city: "Delhi" },
];
const show = (v: number | string | null) => (v === null ? "NULL" : String(v));

/* ── The command families ─────────────────────────────────────────── */

function families(): Walkthrough {
  type Db = { cols: string[] | null; rows: Array<[number, number]>; work: Array<[number, number]> | null; grants: string[]; result: Array<[number, number]> | null };
  type Stmt = { fam: string; sql: string; run: (db: Db) => string };
  const live = (db: Db) => db.work ?? db.rows;
  const script: Stmt[] = [
    { fam: "DDL", sql: "CREATE TABLE accounts (id INT, balance INT);", run: (db) => ((db.cols = ["id", "balance"]), "schema") },
    { fam: "DML", sql: "INSERT INTO accounts VALUES (1, 5000), (2, 3000);", run: (db) => (live(db).push([1, 5000], [2, 3000]), "rows") },
    { fam: "DCL", sql: "GRANT SELECT ON accounts TO intern;", run: (db) => (db.grants.push("intern: SELECT"), "grants") },
    { fam: "TCL", sql: "START TRANSACTION;", run: (db) => ((db.work = db.rows.map((r) => [...r] as [number, number])), "tx") },
    { fam: "DML", sql: "UPDATE accounts SET balance = balance - 1000 WHERE id = 1;", run: (db) => (live(db).forEach((r) => r[0] === 1 && (r[1] -= 1000)), "rows") },
    { fam: "DML", sql: "UPDATE accounts SET balance = balance + 1000 WHERE id = 2;", run: (db) => (live(db).forEach((r) => r[0] === 2 && (r[1] += 1000)), "rows") },
    { fam: "TCL", sql: "COMMIT;", run: (db) => ((db.rows = db.work!), (db.work = null), "tx") },
    { fam: "DQL", sql: "SELECT * FROM accounts;", run: (db) => ((db.result = db.rows.map((r) => [...r] as [number, number])), "result") },
  ];
  const db: Db = { cols: null, rows: [], work: null, grants: [], result: null };
  const total = (rs: Array<[number, number]>) => rs.reduce((s, r) => s + r[1], 0);
  const LH = 17;
  const DY = script.length * LH + 34;
  const frames: Frame[] = [];
  const captions = [
    "DDL defines structure. CREATE TABLE writes the table's definition into the catalog; there are no rows yet. In MySQL a DDL statement also commits any open transaction.",
    "DML changes the rows. INSERT adds two accounts; the structure is untouched. With autocommit on, as MySQL has by default, each statement is its own transaction.",
    "DCL controls who may do what. GRANT records a privilege for the user intern: it may read accounts and nothing else. The table and its rows do not change.",
    "TCL groups statements. START TRANSACTION opens a transaction, and the UPDATE that follows changes account 1 only inside it: under MySQL's default isolation level, other sessions still read 5000.",
    "The second UPDATE moves the money into account 2, still inside the transaction. Halfway through, a ROLLBACK here would undo both changes at once.",
    "COMMIT makes both changes permanent together. The total is unchanged, so no money was created or lost; a crash before COMMIT would have kept neither.",
    "DQL reads. SELECT returns the committed rows as a result and changes nothing, which is why some books list it apart from DML.",
  ];
  // Frames: START TRANSACTION and the first UPDATE share one frame.
  const groups = [[0], [1], [2], [3, 4], [5], [6], [7]];
  const before = (() => {
    const copy: Db = { cols: null, rows: [], work: null, grants: [], result: null };
    script.slice(0, 2).forEach((s) => s.run(copy));
    return total(copy.rows);
  })();
  groups.forEach((g, k) => {
    let touched = "";
    for (const i of g) touched = script[i].run(db);
    if (script[g[g.length - 1]].sql === "COMMIT;" && total(db.rows) !== before) throw new Error("families: the transfer changed the total");
    const hot = new Set(g);
    const done = Math.max(...g);
    const items: Item[] = [];
    script.forEach((s, i) => {
      const tone: TextTone = hot.has(i) ? "accent" : i < done ? "ink" : "faint";
      items.push({ k: "text", id: `f${i}`, x: 0, y: i * LH, text: s.fam, tone: hot.has(i) ? "accent" : "faint", anchor: "start", size: 10.5, mono: true, weight: 700 });
      items.push({ k: "text", id: `q${i}`, x: 34, y: i * LH, text: s.sql, tone, anchor: "start", size: 11, mono: true, weight: hot.has(i) ? 700 : undefined });
    });
    // The database: the table (schema over rows), the grants, the transaction.
    items.push(label("dbt", "the database", 0, DY - 22, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    if (db.cols) {
      db.cols.forEach((c, j) => items.push(box(`h${j}`, j * 76, DY, c, { w: 72, h: 22, size: 11, tone: touched === "schema" ? "accent" : "muted" })));
      const shown = live(db);
      const committed = new Map(db.rows.map((r) => [r[0], r[1]]));
      shown.forEach((r, i) =>
        r.forEach((v, j) => {
          const pending = db.work !== null && committed.get(r[0]) !== r[1] && j === 1;
          items.push(box(`r${r[0]}-${j}`, j * 76, DY + 25 + i * 25, v, { w: 72, h: 22, size: 11.5, tone: pending ? "accent" : touched === "rows" && k === 1 ? "accent" : "plain" }));
        }),
      );
    }
    items.push(label("gt", "grants", 176, DY + 11, { anchor: "start", tone: "faint", size: 10.5 }));
    items.push(label("gv", db.grants.join(", ") || "none", 176, DY + 29, { anchor: "start", tone: touched === "grants" ? "accent" : db.grants.length ? "ink" : "faint", size: 11, mono: true, weight: touched === "grants" ? 700 : undefined }));
    items.push(label("tt", "transaction", 176, DY + 53, { anchor: "start", tone: "faint", size: 10.5 }));
    items.push(label("tv", db.work ? "open, not yet visible" : touched === "tx" ? "committed" : "none", 176, DY + 71, { anchor: "start", tone: touched === "tx" || db.work ? "accent" : "faint", size: 11, mono: true, weight: touched === "tx" ? 700 : undefined }));
    if (db.result) {
      items.push(label("res", "result", 330, DY + 11, { anchor: "start", tone: "faint", size: 10.5 }));
      db.result.forEach((r, i) => items.push(label(`rs${i}`, `${r[0]} | ${r[1]}`, 330, DY + 29 + i * 18, { anchor: "start", tone: "accent", size: 11.5, mono: true, weight: 700 })));
    }
    frames.push({ caption: captions[k], items });
  });
  return finish({ title: "One script, five families of SQL commands", input: "", frames });
}

/* ── The logical order of a SELECT ────────────────────────────────── */

function logicalOrder(): Walkthrough {
  // Written order on the page; `step` is the order the DBMS processes them.
  const clauses = [
    { text: "SELECT city, MAX(marks) AS best", step: 5 },
    { text: "FROM students", step: 1 },
    { text: "WHERE marks IS NOT NULL", step: 2 },
    { text: "GROUP BY city", step: 3 },
    { text: "HAVING MAX(marks) > 80", step: 4 },
    { text: "ORDER BY best DESC", step: 6 },
    { text: "LIMIT 1;", step: 7 },
  ];
  type Group = { city: string; rows: Student[] };
  type Out = { city: string; best: number };
  const from = STUDENTS.map((r) => ({ ...r }));
  const where = from.filter((r) => r.marks !== null);
  const groups: Group[] = [];
  for (const r of where) {
    const g = groups.find((x) => x.city === r.city);
    if (g) g.rows.push(r);
    else groups.push({ city: r.city, rows: [r] });
  }
  const max = (g: Group) => Math.max(...g.rows.map((r) => r.marks as number));
  const having = groups.filter((g) => max(g) > 80);
  const selected: Out[] = having.map((g) => ({ city: g.city, best: max(g) }));
  const ordered = [...selected].sort((a, b) => b.best - a.best);
  const limited = ordered.slice(0, 1);
  if (limited.length !== 1 || limited[0].city !== "Pune" || limited[0].best !== 91) throw new Error(`logical-order: got ${JSON.stringify(limited)}`);
  const dropped = groups.filter((g) => !having.includes(g));

  const QW = 230;
  const TX = QW + 20;
  const COLS: Array<[keyof Student, number]> = [["id", 28], ["name", 60], ["dept", 40], ["marks", 48], ["city", 66]];
  const RH = 22;
  const RG = 3;
  const query = (active: number): Item[] =>
    clauses.flatMap((c, i): Item[] => [
      { k: "text", id: `n${i}`, x: 0, y: i * 19, text: String(c.step), tone: c.step === active ? "accent" : "faint", anchor: "start", size: 11, mono: true, weight: 700 },
      { k: "text", id: `c${i}`, x: 18, y: i * 19, text: c.text, tone: c.step === active ? "accent" : c.step < active ? "ink" : "faint", anchor: "start", size: 11, mono: true, weight: c.step === active ? 700 : undefined },
    ]);
  const head = (cols: Array<[string, number]>): Item[] => {
    let x = TX;
    return cols.map(([c, w]) => {
      const it = label(`h-${c}`, c, x + w / 2, -12, { tone: "faint", size: 10.5, mono: true });
      x += w + RG;
      return it;
    });
  };
  const rowItems = (r: Student, y: number, tone: Tone): Item[] => {
    let x = TX;
    return COLS.map(([c, w]) => {
      const it = box(`s${r.id}-${c}`, x, y, show(r[c]), { w, h: RH, size: 11, tone: c === "marks" && r.marks === null && tone === "plain" ? "muted" : tone });
      x += w + RG;
      return it;
    });
  };
  const table = (rs: Student[], tone: (r: Student) => Tone = () => "plain"): Item[] => [...head(COLS), ...rs.flatMap((r, i) => rowItems(r, i * (RH + RG), tone(r)))];
  const grouped = (gs: Group[], tone: (g: Group) => Tone): Item[] => {
    const items: Item[] = [...head(COLS)];
    let y = 0;
    for (const g of gs) {
      const h = g.rows.length * (RH + RG) - RG;
      items.push({ k: "band", id: `g-${g.city}`, x: TX - 5, y: y - 3, w: COLS.reduce((s, [, w]) => s + w + RG, -RG) + 10, h: h + 6, tone: tone(g) === "error" ? "error" : "accent" });
      g.rows.forEach((r, i) => items.push(...rowItems(r, y + i * (RH + RG), tone(g))));
      y += h + 12;
    }
    return items;
  };
  const OUT: Array<[string, number]> = [["city", 66], ["best", 48]];
  const outTable = (rs: Out[], tone: (r: Out, i: number) => Tone = () => "plain"): Item[] => [
    ...head(OUT),
    ...rs.flatMap((r, i) => {
      const t = tone(r, i);
      return [box(`o-${r.city}`, TX, i * (RH + RG), r.city, { w: 66, h: RH, size: 11, tone: t }), box(`ob-${r.city}`, TX + 66 + RG, i * (RH + RG), r.best, { w: 48, h: RH, size: 11, tone: t })];
    }),
  ];
  const names = (rs: Student[]) => rs.map((r) => r.name).join(", ");
  const frames: Frame[] = [
    {
      caption: `A query is written SELECT first, but processed in the numbered order. Step 1, FROM: the DBMS starts from every row of students, all ${from.length} of them.`,
      items: [...query(1), ...table(from)],
    },
    {
      caption: `Step 2, WHERE marks IS NOT NULL keeps a row only when the condition is TRUE. ${names(from.filter((r) => !where.includes(r)))} has no marks, so his row goes; ${where.length} rows remain. SELECT has not run yet, so WHERE cannot use the alias best.`,
      items: [...query(2), ...table(from, (r) => (where.includes(r) ? "plain" : "error"))],
    },
    {
      caption: `Step 3, GROUP BY city collects the rows into ${groups.length} groups: ${groups.map((g) => `${g.city} (${g.rows.length})`).join(", ")}. From here on, each group is one row of the result.`,
      items: [...query(3), ...grouped(groups, () => "plain")],
    },
    {
      caption: `Step 4, HAVING filters groups, not rows, and can use aggregates. ${dropped.map((g) => `${g.city}'s best is ${max(g)}`).join(", ")}, not above 80, so that group goes.`,
      items: [...query(4), ...grouped(groups, (g) => (having.includes(g) ? "plain" : "error"))],
    },
    {
      caption: `Step 5, SELECT computes the output columns: one row per remaining group, city and MAX(marks) named best: ${selected.map((r) => `${r.city} ${r.best}`).join(", ")}.`,
      items: [...query(5), ...outTable(selected, () => "accent")],
    },
    {
      caption: `Step 6, ORDER BY best DESC sorts the result, and may use the alias because SELECT has run. ${ordered.map((r) => `${r.city} ${r.best}`).join(" then ")}: without ORDER BY nothing guarantees any order.`,
      items: [...query(6), ...outTable(ordered)],
    },
    {
      caption: `Step 7, LIMIT 1 keeps the first row of the sorted result: ${limited[0].city}, ${limited[0].best}, the city with the best score among those above 80.`,
      items: [...query(7), ...outTable(ordered, (_r, i) => (i < 1 ? "strong" : "muted"))],
    },
  ];
  return finish({ title: "The order a SELECT is processed in, on the students table", input: "students(id, name, dept, marks, city), five rows", frames });
}

/* ── Three-valued logic ───────────────────────────────────────────── */

function nullLogic(): Walkthrough {
  type V = "TRUE" | "FALSE" | "UNKNOWN";
  const cmp = (a: number | null, f: (x: number) => boolean): V => (a === null ? "UNKNOWN" : f(a) ? "TRUE" : "FALSE");
  const not = (v: V): V => (v === "UNKNOWN" ? "UNKNOWN" : v === "TRUE" ? "FALSE" : "TRUE");
  const tests: Array<{ text: string; f: (r: Student) => V }> = [
    { text: "marks > 80", f: (r) => cmp(r.marks, (x) => x > 80) },
    { text: "marks <= 80", f: (r) => cmp(r.marks, (x) => x <= 80) },
    { text: "NOT (marks > 80)", f: (r) => not(cmp(r.marks, (x) => x > 80)) },
    // Comparing with NULL is UNKNOWN whatever the other side holds.
    { text: "marks = NULL", f: () => "UNKNOWN" },
    { text: "marks IS NULL", f: (r) => (r.marks === null ? "TRUE" : "FALSE") },
  ];
  const kept = tests.map((t) => STUDENTS.filter((r) => t.f(r) === "TRUE").map((r) => r.name).join(", ") || "none");
  const want = ["Asha, Meera", "Vikram, Priya", "Vikram, Priya", "none", "Rohan"];
  if (kept.join("|") !== want.join("|")) throw new Error(`null-logic: kept ${kept.join(" | ")}, the note says ${want.join(" | ")}`);
  const LX = 118;
  const CW = 64;
  const items: Item[] = [];
  STUDENTS.forEach((r, j) => {
    items.push(label(`sn${j}`, r.name, LX + j * (CW + 4) + CW / 2, -30, { tone: "ink", size: 11, mono: true, weight: 600 }));
    items.push(label(`sm${j}`, show(r.marks), LX + j * (CW + 4) + CW / 2, -14, { tone: r.marks === null ? "accent" : "faint", size: 10.5, mono: true }));
  });
  tests.forEach((t, i) => {
    const y = i * 30;
    items.push(label(`t${i}`, t.text, LX - 10, y + 12, { anchor: "end", tone: "ink", size: 11, mono: true }));
    STUDENTS.forEach((r, j) => {
      const v = t.f(r);
      items.push(box(`v${i}-${j}`, LX + j * (CW + 4), y, v, { w: CW, h: 24, size: 10.5, tone: v === "TRUE" ? "strong" : v === "UNKNOWN" ? "accent" : "muted" }));
    });
  });
  items.push(label("k", "WHERE keeps only TRUE (solid); UNKNOWN is dropped like FALSE", LX - 108, tests.length * 30 + 10, { anchor: "start", tone: "soft", size: 11 }));
  return finish({
    title: "Three-valued logic: what WHERE does with Rohan's NULL",
    input: "students.marks: 91, 78, 85, NULL, 67",
    frames: [
      {
        caption: "Every comparison with Rohan's NULL is UNKNOWN, and NOT UNKNOWN is still UNKNOWN, so his row passes neither marks > 80 nor its opposite. marks = NULL is UNKNOWN for every row and returns nothing; only IS NULL finds him.",
        items,
      },
    ],
  });
}

/* ── DELETE, TRUNCATE and DROP ────────────────────────────────────── */

function deleteTruncateDrop(): Walkthrough {
  type Table = { rows: Student[]; next: number } | null;
  // The table after the note's five inserts: AUTO_INCREMENT hands out 1–5, so the next id is 6.
  const start: Table = { rows: STUDENTS.map((r) => ({ ...r })), next: Math.max(...STUDENTS.map((r) => r.id)) + 1 };
  const del = (t: Table): Table => ({ rows: t!.rows.filter((r) => r.marks !== null), next: t!.next });
  const truncate = (t: Table): Table => ({ rows: [], next: 1 });
  const drop = (): Table => null;
  const panels: Array<{ title: string; sub: string; t: Table; from?: Table }> = [
    { title: "before", sub: "", t: start },
    { title: "DELETE … WHERE", sub: "marks IS NULL", t: del(start), from: start },
    { title: "TRUNCATE", sub: "TABLE students", t: truncate(start) },
    { title: "DROP", sub: "TABLE students", t: drop() },
  ];
  const d = panels[1].t!;
  if (d.rows.length !== 4 || d.next !== 6 || panels[2].t!.next !== 1) throw new Error("delete-truncate-drop: counters or rows are off");
  const PW = 104;
  const GAP = 18;
  const items: Item[] = [];
  panels.forEach((p, k) => {
    const x = k * (PW + GAP);
    items.push(label(`t${k}`, p.title, x + PW / 2, -46, { tone: k ? "ink" : "soft", size: 11.5, mono: true, weight: 700 }));
    if (p.sub) items.push(label(`u${k}`, p.sub, x + PW / 2, -31, { tone: "faint", size: 10, mono: true }));
    if (!p.t) {
      items.push({ k: "band", id: `gone${k}`, x, y: -12, w: PW, h: 5 * 22 + 22, tone: "ghost" });
      items.push(label(`gl${k}`, "no table:", x + PW / 2, 46, { tone: "error", size: 11, weight: 600 }));
      items.push(label(`gm${k}`, "rows, columns,", x + PW / 2, 62, { tone: "faint", size: 10.5 }));
      items.push(label(`gn${k}`, "indexes all gone", x + PW / 2, 76, { tone: "faint", size: 10.5 }));
      return;
    }
    items.push(box(`hi${k}`, x, -12, "id", { w: 30, h: 20, size: 10.5, tone: "muted" }), box(`hn${k}`, x + 32, -12, "name", { w: PW - 32, h: 20, size: 10.5, tone: "muted" }));
    start!.rows.forEach((r, i) => {
      const there = p.t!.rows.includes(r) || p.t!.rows.some((x) => x.id === r.id);
      const y = 10 + i * 22;
      if (there) items.push(box(`ri${k}-${i}`, x, y, r.id, { w: 30, h: 20, size: 10.5 }), box(`rn${k}-${i}`, x + 32, y, r.name, { w: PW - 32, h: 20, size: 10.5 }));
      else if (p.from) items.push(box(`ri${k}-${i}`, x, y, r.id, { w: 30, h: 20, size: 10.5, tone: "error" }), box(`rn${k}-${i}`, x + 32, y, r.name, { w: PW - 32, h: 20, size: 10.5, tone: "error" }));
    });
    items.push(label(`nx${k}`, `next id: ${p.t.next}`, x + PW / 2, 10 + 5 * 22 + 8, { tone: k === 2 ? "accent" : k === 1 ? "ink" : "soft", size: 11, mono: true, weight: k ? 700 : undefined }));
  });
  return finish({
    title: "DELETE, TRUNCATE and DROP on the same table",
    input: "students after the five inserts",
    frames: [
      {
        caption: `DELETE removes the rows its WHERE picks (Rohan, in red) and keeps counting ids from ${d.next}. TRUNCATE empties the table but keeps its structure, and the counter restarts at ${panels[2].t!.next}. DROP removes the table itself.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  families,
  "logical-order": logicalOrder,
  "null-logic": nullLogic,
  "delete-truncate-drop": deleteTruncateDrop,
};
