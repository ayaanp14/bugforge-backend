import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";

/**
 * Introduction to DBMS: the note's figures (content/notes/dbms/
 * introduction-to-dbms.md places each with "@figure <name>").
 *
 *  - file-vs-dbms: two offices keeping their own files of the same students.
 *    The generator finds the values held twice, applies one change of
 *    address to one file and diffs the files, then stores the rows once,
 *    applies the same UPDATE once and derives both offices' views from it.
 *  - data-models: one set of enrolments in the hierarchical, network and
 *    relational models — the tree is built from the rows, so the course
 *    stored twice under two students is counted, not drawn by hand.
 *  - three-schema: the three levels and their two mappings; the mappings
 *    are computed from the schemas (which tables a view's columns live in,
 *    which storage a table's columns use), then an index is added and a
 *    table is split, and the generator checks what each change reached.
 *  - components: the parts of a DBMS between its users and the disk.
 *  - tiers: one-, two- and three-tier arrangements.
 */

type Col = { key: string; label: string; w: number };
type Row = { id: string; cells: Record<string, string> };
const RH = 24;
const CG = 3;

/** A small table: faint column names over one cell per value; ids `${prefix}${row}-${col}` unless `cellId` says otherwise. */
function table(prefix: string, cols: readonly Col[], rows: readonly Row[], o: { x: number; y: number; tone?: (row: string, col: string) => Tone | undefined; cellId?: (row: string, col: string) => string; headId?: (col: string) => string; size?: number }): { items: Item[]; w: number; h: number } {
  const items: Item[] = [];
  const xs: number[] = [];
  let x = o.x;
  for (const c of cols) {
    xs.push(x);
    x += c.w + CG;
  }
  cols.forEach((c, i) => items.push({ k: "text", id: o.headId?.(c.key) ?? `${prefix}h-${c.key}`, x: xs[i] + c.w / 2, y: o.y - 10, text: c.label, tone: "faint", anchor: "middle", size: 10.5, mono: true }));
  rows.forEach((r, ri) =>
    cols.forEach((c, ci) => items.push(box(o.cellId?.(r.id, c.key) ?? `${prefix}${r.id}-${c.key}`, xs[ci], o.y + ri * (RH + CG), r.cells[c.key] ?? "", { w: c.w, h: RH, size: o.size ?? 11.5, tone: o.tone?.(r.id, c.key) ?? "plain" }))),
  );
  return { items, w: x - CG - o.x, h: rows.length * (RH + CG) - CG };
}

/* ── File system against DBMS ─────────────────────────────────────── */

function fileVsDbms(): Walkthrough {
  type Rec = Record<string, string>;
  const accounts: Rec[] = [
    { roll: "101", name: "Asha", city: "Pune", fee: "paid" },
    { roll: "102", name: "Vikram", city: "Delhi", fee: "due" },
  ];
  const exam: Rec[] = [
    { roll: "101", name: "Asha", city: "Pune", marks: "91" },
    { roll: "102", name: "Vikram", city: "Delhi", marks: "78" },
  ];
  const A: Col[] = [
    { key: "roll", label: "roll", w: 40 },
    { key: "name", label: "name", w: 60 },
    { key: "city", label: "city", w: 62 },
    { key: "fee", label: "fee", w: 46 },
  ];
  const B: Col[] = [...A.slice(0, 3), { key: "marks", label: "marks", w: 46 }];
  const BX = 250;
  // Values held by both files: the same student's field, present in each.
  const both = (a: Rec[], b: Rec[]) => {
    const out = new Set<string>();
    for (const r of a) {
      const o = b.find((x) => x.roll === r.roll);
      if (o) for (const f of Object.keys(r)) if (f !== "roll" && f in o) out.add(`${r.roll}-${f}`);
    }
    return out;
  };
  const differ = (a: Rec[], b: Rec[]) => [...both(a, b)].filter((k) => {
    const [roll, f] = k.split("-");
    return a.find((r) => r.roll === roll)![f] !== b.find((r) => r.roll === roll)![f];
  });
  const rows = (rs: Rec[]): Row[] => rs.map((r) => ({ id: r.roll, cells: r }));
  const files = (o: { tone: (side: "a" | "b", row: string, col: string) => Tone | undefined }): Item[] => [
    label("ta", "accounts.dat (accounts office)", 0, -36, { anchor: "start", tone: "ink", weight: 600 }),
    label("tb", "exam.dat (exam cell)", BX, -36, { anchor: "start", tone: "ink", weight: 600 }),
    ...table("a", A, rows(accounts), { x: 0, y: 0, tone: (r, c) => o.tone("a", r, c) }).items,
    ...table("b", B, rows(exam), { x: BX, y: 0, tone: (r, c) => o.tone("b", r, c) }).items,
  ];
  const NOTE_Y = 2 * (RH + CG) + 22;
  const frames: Frame[] = [];

  const dup = both(accounts, exam);
  if (dup.size !== 4) throw new Error(`file-vs-dbms: expected 4 values held twice, found ${dup.size}`);
  frames.push({
    caption: `Each office keeps its own file of the same students. Every name and city is stored in both files, ${dup.size} values held twice, and nothing links a row in one file to its twin in the other.`,
    items: [...files({ tone: (_s, r, c) => (dup.has(`${r}-${c}`) ? "accent" : undefined) }), label("n1", `stored twice: ${dup.size} values`, 0, NOTE_Y, { anchor: "start", tone: "accent", size: 12, weight: 600 })],
  });

  // Asha moves to Mumbai; only the accounts office hears about it.
  const moved = { roll: "101", city: "Mumbai" };
  accounts.find((r) => r.roll === moved.roll)!.city = moved.city;
  const bad = differ(accounts, exam);
  if (bad.length !== 1 || bad[0] !== "101-city") throw new Error(`file-vs-dbms: expected one disagreement, found ${bad.join(", ")}`);
  const oldCity = exam.find((r) => r.roll === moved.roll)!.city;
  frames.push({
    caption: `Asha moves to ${moved.city} and the accounts office updates its file. The exam cell's copy still says ${oldCity}, so the two files now disagree and nothing in either can say which one is right.`,
    items: [
      ...files({ tone: (s, r, c) => (`${r}-${c}` === bad[0] ? (s === "a" ? "accent" : "error") : undefined) }),
      label("n1", `accounts.dat: ${moved.city} · exam.dat: ${oldCity}`, 0, NOTE_Y, { anchor: "start", tone: "error", size: 12, weight: 600 }),
    ],
  });

  // The DBMS: each student once, the same change applied once, both offices reading views of the one table.
  const merged: Rec[] = [
    { roll: "101", name: "Asha", city: oldCity, fee: "paid", marks: "91" },
    { roll: "102", name: "Vikram", city: "Delhi", fee: "due", marks: "78" },
  ];
  merged.find((r) => r.roll === moved.roll)!.city = moved.city;
  const view = (cols: string[]) => merged.map((r) => cols.map((c) => r[c]).join(","));
  const accView = view(["roll", "name", "city", "fee"]);
  const examView = view(["roll", "name", "city", "marks"]);
  if (!accView[0].includes(moved.city) || !examView[0].includes(moved.city)) throw new Error("file-vs-dbms: a view missed the update");
  const T: Col[] = [...A, { key: "marks", label: "marks", w: 46 }];
  const TX = 118;
  const TY = 24;
  const tw = T.reduce((s, c) => s + c.w + CG, -CG);
  // The table's cells reuse the files' ids: the accounts copy glides down, the exam copy's duplicates fade out.
  const cellId = (r: string, c: string) => (c === "marks" ? `b${r}-${c}` : `a${r}-${c}`);
  const tbl = table("t", T, rows(merged), { x: TX, y: TY, cellId, headId: (c) => (c === "marks" ? "bh-marks" : `ah-${c}`), tone: (r, c) => (r === moved.roll && c === "city" ? "strong" : undefined) });
  const appY = -42;
  const AW = 100;
  const aX = TX + 6;
  const bX = TX + tw - 6 - AW;
  frames.push({
    caption: `With a DBMS each student is stored once, and the change of city is one UPDATE. Both offices read the same row through their own views, so they cannot disagree, and a new question is a query rather than a new program.`,
    items: [
      ...region("db", TX - 12, TY - 24, tw + 24, tbl.h + 36),
      ...tbl.items,
      box("appA", aX, appY, "accounts app", { w: AW, h: 26, size: 11 }),
      box("appB", bX, appY, "exam app", { w: AW, h: 26, size: 11 }),
      arrow("vA", { x: aX + AW / 2, y: appY + 27 }, { x: aX + AW / 2, y: TY - 26 }, { tone: "accent" }),
      arrow("vB", { x: bX + AW / 2, y: appY + 27 }, { x: bX + AW / 2, y: TY - 26 }, { tone: "accent" }),
      label("n1", `DBMS: each student once · both views read ${moved.city}`, TX - 12, TY + tbl.h + 30, { anchor: "start", tone: "accent", size: 12, weight: 600 }),
    ],
  });
  return finish({ title: "Two files of the same students against one database", input: "", frames });
}

/* ── Data models on the same data ─────────────────────────────────── */

function dataModels(): Walkthrough {
  const dept = "CSE";
  const students = ["Asha", "Vikram"];
  const takes: Array<[string, string]> = [
    ["Asha", "DBMS"],
    ["Asha", "OS"],
    ["Vikram", "DBMS"],
  ];
  const courses = [...new Set(takes.map(([, c]) => c))];
  const items: Item[] = [];
  const W = 52;
  const H = 24;
  const LV = 58;
  const head = (id: string, text: string, x: number) => items.push(label(id, text, x, -26, { tone: "ink", weight: 600, size: 12 }));
  const node = (id: string, text: string, cx: number, y: number, tone: Tone = "plain") => items.push(box(id, cx - W / 2, y, text, { w: W, h: H, size: 11, tone }));
  const down = (id: string, a: { x: number; y: number }, b: { x: number; y: number }, tone: "line" | "accent" = "line") =>
    items.push({ k: "edge", id, x1: a.x, y1: a.y + H, x2: b.x, y2: b.y - 1, tone, arrow: true });

  // Hierarchical: every record has one parent, so a course under two students is two records.
  const hx = 0;
  head("hh", "Hierarchical (tree)", hx + 82);
  const leaves = takes.map(([s, c], i) => ({ s, c, x: hx + 26 + i * 56 }));
  const sx = (s: string) => {
    const xs = leaves.filter((l) => l.s === s).map((l) => l.x);
    return (Math.min(...xs) + Math.max(...xs)) / 2;
  };
  const rootX = (sx(students[0]) + sx(students[1])) / 2;
  node("hr", dept, rootX, 0);
  const copies = new Map<string, number>();
  for (const l of leaves) copies.set(l.c, (copies.get(l.c) ?? 0) + 1);
  const twice = [...copies].filter(([, n]) => n > 1).map(([c]) => c);
  if (twice.length !== 1 || twice[0] !== "DBMS") throw new Error(`data-models: expected DBMS stored twice, got ${twice.join(",")}`);
  students.forEach((s, i) => {
    node(`hs${i}`, s, sx(s), LV);
    down(`hes${i}`, { x: rootX, y: 0 }, { x: sx(s), y: LV });
  });
  leaves.forEach((l, i) => {
    node(`hc${i}`, l.c, l.x, 2 * LV, twice.includes(l.c) ? "accent" : "plain");
    down(`hec${i}`, { x: sx(l.s), y: LV }, { x: l.x, y: 2 * LV }, twice.includes(l.c) ? "accent" : "line");
  });
  items.push(label("hn", `${twice[0]} stored ${copies.get(twice[0])} times`, hx + 82, 2 * LV + H + 16, { tone: "accent", size: 11, weight: 600 }));

  // Network: records are nodes of a graph, so the one DBMS record has two parents. The shared
  // course sits between its two students and the other one under its only student, so no lines cross.
  const nx = 178;
  head("nh", "Network (graph)", nx + 82);
  const nStudent = (i: number) => nx + 26 + i * 112;
  const nCourse = (c: string) => {
    const who = takes.filter(([, x]) => x === c).map(([s]) => nStudent(students.indexOf(s)));
    return (Math.min(...who) + Math.max(...who)) / 2;
  };
  node("nr", dept, nx + 82, 0);
  students.forEach((s, i) => {
    node(`ns${i}`, s, nStudent(i), LV);
    down(`nes${i}`, { x: nx + 82, y: 0 }, { x: nStudent(i), y: LV });
  });
  courses.forEach((c, i) => node(`nc${i}`, c, nCourse(c), 2 * LV, c === twice[0] ? "accent" : "plain"));
  takes.forEach(([s, c], i) => down(`nec${i}`, { x: nStudent(students.indexOf(s)), y: LV }, { x: nCourse(c), y: 2 * LV }, c === twice[0] ? "accent" : "line"));
  const parents = takes.filter(([, c]) => c === twice[0]).length;
  items.push(label("nn", `${twice[0]} stored once, ${parents} parents`, nx + 82, 2 * LV + H + 16, { tone: "accent", size: 11, weight: 600 }));

  // Relational: no links at all — the enrolment is rows of values, matched by a join.
  const rx = 356;
  head("rh", "Relational (tables)", rx + 66);
  const rel = table("rt", [{ key: "s", label: "student", w: 66 }, { key: "c", label: "course", w: 62 }], takes.map(([s, c], i) => ({ id: String(i), cells: { s, c } })), { x: rx, y: 26, size: 11 });
  items.push(...rel.items);
  items.push(label("rn", "links are values", rx + 66, 2 * LV + H + 16, { tone: "soft", size: 11, weight: 600 }));

  return finish({
    title: "The same enrolments in three data models",
    input: takes.map(([s, c]) => `${s} takes ${c}`).join(", "),
    frames: [
      {
        caption: `A tree gives each record one parent, so ${twice[0]}, taken by two students, is stored twice. A network lets the one ${twice[0]} record have ${["no", "one", "two", "three"][parents]} parents. The relational model has no links at all: an enrolment is a row of values, and a join matches them.`,
        items,
      },
    ],
  });
}

/* ── The three-schema architecture ────────────────────────────────── */

function threeSchema(): Walkthrough {
  type Table = { name: string; cols: string[] };
  type Store = { id: string; text: string; table: string; col?: string };
  const views = [
    { id: "exam", cols: ["roll_no", "name", "marks"] },
    { id: "accounts", cols: ["roll_no", "name", "fee"] },
  ];
  const v0: Table[] = [{ name: "student", cols: ["roll_no", "name", "email", "marks", "fee"] }];
  const pages = (t: string): Store => ({ id: `pg-${t}`, text: `pages: ${t}`, table: t });
  const index = (t: string, col: string): Store => ({ id: `ix-${col}`, text: `index: ${col}`, table: t, col });
  // Which tables a view reads: for each of its columns, the first table holding it.
  const readsOf = (cols: string[], ts: Table[]) => {
    const out = new Set<string>();
    for (const c of cols) {
      const t = ts.find((x) => x.cols.includes(c));
      if (!t) throw new Error(`three-schema: no table holds ${c}`);
      out.add(t.name);
    }
    return [...out];
  };
  // Every store must belong to a table that exists and, for an index, still holds its column.
  const checkStores = (ts: Table[], ss: Store[]) => {
    for (const s of ss) {
      const t = ts.find((x) => x.name === s.table);
      if (!t || (s.col && !t.cols.includes(s.col))) throw new Error(`three-schema: ${s.text} has no table`);
    }
  };
  const W = 512;
  // Level names sit in a column on the left, inside their band, so no arrow ever crosses one.
  const CX = 96;
  const LEVEL = [0, 96, 192];
  const CH = 28;
  const fit = (s: string, size: number) => Math.ceil(s.length * size * 0.6 + 16);
  const lay = <T,>(xs: T[], text: (t: T) => string, size: number) => {
    const ws = xs.map((x) => fit(text(x), size));
    const total = ws.reduce((a, b) => a + b, 0) + (xs.length - 1) * 10;
    let x = CX + (W - CX - total) / 2;
    return xs.map((t, i) => {
      const at = { t, x, w: ws[i] };
      x += ws[i] + 10;
      return at;
    });
  };
  /** An arrow from a box above to a box below: straight down through the overlap of the two when there is one. */
  const drop = (id: string, a: { x: number; w: number }, ya: number, b: { x: number; w: number }, yb: number, tone: "line" | "accent"): Item => {
    const lo = Math.max(a.x, b.x) + 8;
    const hi = Math.min(a.x + a.w, b.x + b.w) - 8;
    const x1 = lo <= hi ? (lo + hi) / 2 : a.x + a.w / 2;
    const x2 = lo <= hi ? x1 : b.x + b.w / 2;
    return arrow(id, { x: x1, y: ya }, { x: x2, y: yb }, { tone });
  };
  /** The leftmost point any of these arrows reaches at height y. */
  const leftmost = (arrows: Item[], y: number): number => Math.min(...arrows.flatMap((it) => (it.k === "edge" ? [it.x1 + ((it.x2 - it.x1) * (y - it.y1)) / (it.y2 - it.y1 || 1)] : [])));

  const draw = (ts: Table[], stores: Store[], o: { hot: "none" | "physical" | "logical"; changed: Set<string> }): Item[] => {
    checkStores(ts, stores);
    const items: Item[] = [];
    const level = (id: string, r: number, name: string, sub: string) => {
      items.push({ k: "band", id, x: 0, y: LEVEL[r] - 10, w: W, h: CH + 20, tone: "ghost" });
      items.push(label(`${id}-n`, name, 12, LEVEL[r] + 7, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
      items.push(label(`${id}-s`, sub, 12, LEVEL[r] + 22, { anchor: "start", tone: "faint", size: 10.5 }));
    };
    level("rx", 0, "External", "views");
    level("rc", 1, "Conceptual", "tables");
    level("ri", 2, "Internal", "storage");
    const vs = lay(views, (v) => `${v.id}: ${v.cols.join(", ")}`, 11);
    const tsAt = lay(ts, (t) => `${t.name}(${t.cols.join(", ")})`, 11);
    const ss = lay(stores, (s) => s.text, 10.5);
    vs.forEach((v) => items.push(box(`v-${v.t.id}`, v.x, LEVEL[0], `${v.t.id}: ${v.t.cols.join(", ")}`, { w: v.w, h: CH, size: 11 })));
    tsAt.forEach((t) => items.push(box(`t-${t.t.name}`, t.x, LEVEL[1], `${t.t.name}(${t.t.cols.join(", ")})`, { w: t.w, h: CH, size: 11, tone: o.changed.has(t.t.name) ? "accent" : "plain" })));
    ss.forEach((s) => items.push(box(`s-${s.t.id}`, s.x, LEVEL[2], s.t.text, { w: s.w, h: CH, size: 10.5, tone: o.changed.has(s.t.id) ? "accent" : "plain" })));
    const upper: Item[] = [];
    const lower: Item[] = [];
    for (const v of vs)
      for (const name of readsOf(v.t.cols, ts)) {
        const t = tsAt.find((x) => x.t.name === name)!;
        upper.push(drop(`m1-${v.t.id}-${name}`, v, LEVEL[0] + CH + 1, t, LEVEL[1] - 2, o.hot === "logical" ? "accent" : "line"));
      }
    for (const s of ss) {
      const t = tsAt.find((x) => x.t.name === s.t.table)!;
      lower.push(drop(`m2-${s.t.id}`, t, LEVEL[1] + CH + 1, s, LEVEL[2] - 2, o.hot === "physical" && o.changed.has(s.t.id) ? "accent" : "line"));
    }
    items.push(...upper, ...lower);
    // Each mapping is named in its gap (the regions' titles say which levels it joins), wherever its arrows leave room.
    const name = (id: string, y: number, arrows: Item[], hot: boolean) => {
      if (leftmost(arrows, y) < CX) throw new Error("three-schema: an arrow runs through the level names");
      items.push(label(id, "mapping", 12, y, { anchor: "start", tone: hot ? "accent" : "faint", size: 11, weight: hot ? 600 : undefined }));
    };
    name("ml1", LEVEL[0] + CH + 24, upper, o.hot === "logical");
    name("ml2", LEVEL[1] + CH + 24, lower, o.hot === "physical");
    return items;
  };

  const s0 = [pages("student"), index("student", "roll_no")];
  const before = views.map((v) => readsOf(v.cols, v0).join("+"));
  const frames: Frame[] = [
    {
      caption: "One database, described three times: the views each user sees, the tables of the whole database, and the pages and indexes that store them. The DBMS keeps a mapping between each pair of neighbouring levels and translates every query through both.",
      items: draw(v0, s0, { hot: "none", changed: new Set() }),
    },
  ];

  // A physical change: a new index. The tables and views are the same objects before and after.
  const s1 = [...s0, index("student", "email")];
  frames.push({
    caption: "Physical data independence: adding an index on email changes the internal level and its mapping only. The student table and both views are untouched, so no query or program changes.",
    items: draw(v0, s1, { hot: "physical", changed: new Set(["ix-email"]) }),
  });

  // A logical change: fee moves to its own table. The views keep their columns; one mapping becomes a join.
  const v2: Table[] = [
    { name: "student", cols: ["roll_no", "name", "email", "marks"] },
    { name: "fees", cols: ["roll_no", "fee"] },
  ];
  const after = views.map((v) => readsOf(v.cols, v2).join("+"));
  const rejoined = views.filter((_, i) => after[i] !== before[i]).map((v) => v.id);
  if (rejoined.length !== 1 || rejoined[0] !== "accounts") throw new Error(`three-schema: expected only the accounts view to need a join, got ${rejoined.join(",")}`);
  frames.push({
    caption: `Logical data independence: fee moves to a table of its own. The ${rejoined[0]} view is redefined as a join of student and fees, so it shows the same columns as before, and the programs that read through it keep working.`,
    items: draw(v2, [...s1, pages("fees")], { hot: "logical", changed: new Set(["fees", "student", "pg-fees"]) }),
  });
  return finish({ title: "The three-schema architecture and data independence", input: "", frames });
}

/* ── Inside a DBMS ────────────────────────────────────────────────── */

function components(): Walkthrough {
  const W = 500;
  const CH = 28;
  const bands: Array<{ id: string; title: string; parts: string[]; span?: number[] }> = [
    { id: "u", title: "Users", parts: ["DBA", "users, apps, analysts"], span: [1, 3] },
    { id: "q", title: "Query processor", parts: ["DDL interpreter", "DML compiler", "optimizer", "executor"] },
    { id: "s", title: "Storage manager", parts: ["auth + integrity", "transactions", "buffer manager", "file manager"] },
    { id: "d", title: "Disk", parts: ["data dictionary", "log", "data files", "indexes"] },
  ];
  const GAPY = 50;
  const BH = CH + 22;
  const items: Item[] = [];
  const cw = (W - 24 - 3 * 10) / 4;
  const cx = (i: number) => 12 + i * (cw + 10);
  const yOf = (r: number) => r * (BH + GAPY) + 11;
  bands.forEach((b, r) => {
    const y = r * (BH + GAPY);
    items.push(...region(`r${b.id}`, 0, y, W, BH, b.title));
    b.parts.forEach((p, i) => {
      const [from, n] = b.span && i === 1 ? b.span : [i, 1];
      items.push(box(`${b.id}${i}`, cx(from), y + 11, p, { w: cw * n + 10 * (n - 1), h: CH, size: 11, tone: b.id === "d" ? "muted" : "plain" }));
    });
  });
  const mid = (i: number) => cx(i) + cw / 2;
  // Between bands: straight down, in the gutter between two columns so no arrow crosses a box or a band's title.
  const gutter = (i: number) => cx(i) + cw + 5;
  const down = (id: string, r: number, x: number, text: string) =>
    items.push({ k: "edge", id, x1: x, y1: yOf(r) + CH + 12, x2: x, y2: yOf(r + 1) - 12, tone: "ink", arrow: true, label: text });
  // The DDL arrow keeps to the right of its column, clear of the band title on the left.
  down("a-ddl", 0, cx(0) + cw - 18, "DDL");
  down("a-sql", 0, mid(1), "SQL");
  items.push(arrow("q12", { x: cx(1) + cw + 1, y: yOf(1) + CH / 2 }, { x: cx(2) - 2, y: yOf(1) + CH / 2 }));
  items.push(arrow("q23", { x: cx(2) + cw + 1, y: yOf(1) + CH / 2 }, { x: cx(3) - 2, y: yOf(1) + CH / 2 }));
  down("a-pages", 1, gutter(2), "page requests");
  down("a-io", 2, gutter(2), "reads and writes");
  return finish({
    title: "Inside a DBMS, from users down to the disk",
    input: "",
    frames: [
      {
        caption: "A query passes through the query processor (parsed, checked against the data dictionary, planned by the optimizer, run by the executor) and the storage manager (access checked, made part of a transaction, served from the buffer, read from files). The log is what recovery replays after a crash.",
        items,
      },
    ],
  });
}

/* ── One, two and three tiers ─────────────────────────────────────── */

function tiers(): Walkthrough {
  const items: Item[] = [];
  const CW = 140;
  const CH = 30;
  const COL = [0, 168, 336];
  const Y = [0, 96, 192];
  const AX = 40;
  const cell = (id: string, c: number, r: number, text: string, tone: Tone = "plain") => items.push(box(id, COL[c], Y[r], text, { w: CW, h: CH, size: 11, tone }));
  const link2 = (id: string, c: number, r: number, text: string) => items.push({ k: "edge", id, x1: COL[c] + AX, y1: Y[r] + CH + 9, x2: COL[c] + AX, y2: Y[r + 1] - 9, tone: "ink", arrow: true, label: text });
  // A machine's outline, its name over the right-hand corner (the arrows run down the left third).
  const machine = (id: string, c: number, r1: number, r2: number, text: string) => {
    items.push({ k: "band", id, x: COL[c] - 7, y: Y[r1] - 7, w: CW + 14, h: Y[r2] - Y[r1] + CH + 14, tone: "ghost" });
    items.push(label(`${id}-t`, text, COL[c] + CW + 7, Y[r1] - 15, { anchor: "end", tone: "faint", size: 10.5, weight: 600 }));
  };
  const heads = ["One tier", "Two tier", "Three tier"];
  heads.forEach((h, c) => items.push(label(`h${c}`, h, COL[c] + CW / 2, -40, { tone: "ink", weight: 600, size: 12.5 })));

  machine("m0", 0, 0, 1, "one machine");
  cell("a0", 0, 0, "DBA console or app");
  link2("l0", 0, 0, "SQL");
  cell("b0", 0, 1, "DBMS + database", "accent");

  machine("m1a", 1, 0, 0, "user's machine");
  cell("a1", 1, 0, "client program");
  link2("l1", 1, 0, "SQL");
  machine("m1b", 1, 1, 1, "server");
  cell("b1", 1, 1, "DBMS + database", "accent");

  machine("m2a", 2, 0, 0, "user's device");
  cell("a2", 2, 0, "browser or app");
  link2("l2a", 2, 0, "HTTP");
  machine("m2b", 2, 1, 1, "application server");
  cell("b2", 2, 1, "business logic");
  link2("l2b", 2, 1, "SQL");
  machine("m2c", 2, 2, 2, "database server");
  cell("c2", 2, 2, "DBMS + database", "accent");
  return finish({
    title: "One-tier, two-tier and three-tier database architectures",
    input: "",
    frames: [
      {
        caption: "One tier: the user or app works on the database on the same machine. Two tier: a client sends SQL straight to the database server. Three tier: the client talks only to an application server, which alone holds the database connection and the business rules.",
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "file-vs-dbms": fileVsDbms,
  "data-models": dataModels,
  "three-schema": threeSchema,
  components,
  tiers,
};

