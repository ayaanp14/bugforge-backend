import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";

/**
 * Keys in DBMS: the note's figures (content/notes/dbms/keys-in-dbms.md
 * places each with "@figure <name>").
 *
 *  - key-lattice: every one of the 32 attribute sets of the student
 *    relation, laid out by size. The generator computes each set's closure
 *    under the college's rules (roll_no and email each determine the row),
 *    keeps the sets whose closure is everything (the super keys), then the
 *    minimal ones (the candidate keys) — and checks the counts the note
 *    states (24 super keys, 2 candidate keys).
 *  - composite-key: the enrolment rows tested column set by column set;
 *    duplicates are found by grouping the rows, not marked by hand.
 *  - foreign-key: each student's dept_id looked up in department, an insert
 *    whose value is missing rejected, and a NULL accepted.
 *  - on-delete: department ECE deleted under RESTRICT, CASCADE and SET
 *    NULL, each action run on its own copy of the rows.
 */

const ATTRS = ["roll_no", "email", "name", "dept_id", "batch"] as const;
const INITIAL: Record<string, string> = { roll_no: "R", email: "E", name: "N", dept_id: "D", batch: "B" };
/** The college's rules: a roll number and a college email each identify a student. */
const FDS: Array<[string[], string[]]> = [
  [["roll_no"], ["email", "name", "dept_id", "batch"]],
  [["email"], ["roll_no", "name", "dept_id", "batch"]],
];

function closure(xs: readonly string[]): Set<string> {
  const out = new Set(xs);
  for (let changed = true; changed; ) {
    changed = false;
    for (const [l, r] of FDS)
      if (l.every((a) => out.has(a)))
        for (const a of r)
          if (!out.has(a)) {
            out.add(a);
            changed = true;
          }
  }
  return out;
}

/* ── Super, candidate and primary keys ────────────────────────────── */

function keyLattice(): Walkthrough {
  const n = ATTRS.length;
  const sets: string[][] = [];
  for (let m = 0; m < 1 << n; m++) sets.push(ATTRS.filter((_, i) => m & (1 << i)));
  const name = (s: readonly string[]) => (s.length ? s.map((a) => INITIAL[a]).join("") : "{ }");
  const isSuper = (s: readonly string[]) => closure(s).size === n;
  const supers = sets.filter(isSuper);
  // Minimal: no set with one attribute fewer is still a super key.
  const candidates = supers.filter((s) => s.every((a) => !isSuper(s.filter((b) => b !== a))));
  const primary = ["roll_no"];
  if (sets.length !== 32 || supers.length !== 24) throw new Error(`key-lattice: ${supers.length} super keys of ${sets.length}, the note says 24 of 32`);
  if (candidates.map(name).join(",") !== "R,E") throw new Error(`key-lattice: candidate keys ${candidates.map(name).join(",")}, the note says roll_no and email`);
  if (!candidates.some((c) => name(c) === name(primary))) throw new Error("key-lattice: the primary key must be a candidate key");
  const outside = sets.length - supers.length;

  const W = 42;
  const H = 26;
  const G = 5;
  const RG = 10;
  const bySize = Array.from({ length: n + 1 }, (_, k) => sets.filter((s) => s.length === k));
  const widest = Math.max(...bySize.map((r) => r.length)) * (W + G) - G;
  const draw = (tone: (s: string[]) => Tone, readout: string): Item[] => {
    const items: Item[] = [label("legend", "R roll_no · E email · N name · D dept_id · B batch", widest / 2, -24, { tone: "soft", size: 11.5, mono: true })];
    bySize.forEach((row, k) => {
      const x0 = (widest - (row.length * (W + G) - G)) / 2;
      const y = k * (H + RG);
      items.push(label(`sz${k}`, `${k}`, -14, y + H / 2, { tone: "faint", size: 10.5, mono: true }));
      row.forEach((s, i) => items.push(box(`s${name(s)}`, x0 + i * (W + G), y, name(s), { w: W, h: H, size: 11.5, tone: tone(s) })));
    });
    items.push(label("size", "size", -14, -24, { tone: "faint", size: 10.5 }));
    items.push(label("read", readout, widest / 2, (n + 1) * (H + RG) + 8, { tone: "ink", size: 12, weight: 600 }));
    return items;
  };
  const sup = new Set(supers.map(name));
  const cand = new Set(candidates.map(name));
  const frames: Frame[] = [
    {
      caption: `Five attributes make 2^${n} = ${sets.length} sets, drawn here by size. A set is a super key when its closure is all five attributes: knowing its values fixes the whole row.`,
      items: draw(() => "plain", `${sets.length} attribute sets`),
    },
    {
      caption: `Every set containing roll_no or email determines the row: ${supers.length} super keys. The ${outside} grey sets are the subsets of {name, dept_id, batch}, which never identify a student.`,
      items: draw((s) => (sup.has(name(s)) ? "accent" : "muted"), `${supers.length} super keys`),
    },
    {
      caption: `Candidate keys are the minimal super keys: remove any attribute and they stop identifying rows. Only ${[...cand].join(" and ")} qualify; RN is a super key, but its N can go.`,
      items: draw((s) => (cand.has(name(s)) ? "strong" : sup.has(name(s)) ? "plain" : "muted"), `${candidates.length} candidate keys, both single attributes`),
    },
    {
      caption: `The designer picks one candidate key as the primary key: roll_no, short and never changing. email becomes an alternate key, declared UNIQUE. Every candidate key is a super key, but ${supers.length - candidates.length} of the ${supers.length} super keys are not candidate keys.`,
      items: draw((s) => (name(s) === name(primary) ? "strong" : cand.has(name(s)) ? "accent" : "muted"), "primary key R · alternate key E"),
    },
  ];
  return finish({ title: "Super keys, candidate keys and the primary key, from all 32 sets", input: "R(roll_no, email, name, dept_id, batch); roll_no and email each unique", frames });
}

/* ── A composite key, tested on rows ──────────────────────────────── */

type Rec = Record<string, string>;
const COLW: Record<string, number> = { roll_no: 58, course_id: 74, grade: 52, name: 62, dept_id: 62 };
const RH = 24;
const RG = 3;

/** Rows as a table: faint headers, one cell per value, ids `${prefix}${row id}-${col}`. */
function rowsTable(prefix: string, cols: readonly string[], rows: ReadonlyArray<{ id: string; r: Rec }>, x: number, y: number, tone: (id: string, col: string) => Tone | undefined): Item[] {
  const items: Item[] = [];
  let cx = x;
  for (const c of cols) {
    items.push(label(`${prefix}h-${c}`, c, cx + COLW[c] / 2, y - 11, { tone: "faint", size: 10.5, mono: true }));
    rows.forEach((row, i) => items.push(box(`${prefix}${row.id}-${c}`, cx, y + i * (RH + RG), row.r[c] ?? "NULL", { w: COLW[c], h: RH, size: 11.5, tone: tone(row.id, c) ?? (row.r[c] === undefined ? "muted" : "plain") })));
    cx += COLW[c] + RG;
  }
  return items;
}

function compositeKey(): Walkthrough {
  const cols = ["roll_no", "course_id", "grade"];
  const rows = (
    [
      { roll_no: "101", course_id: "CS301", grade: "A" },
      { roll_no: "101", course_id: "CS302", grade: "B" },
      { roll_no: "102", course_id: "CS301", grade: "A" },
      { roll_no: "103", course_id: "CS302", grade: "B" },
    ] as Rec[]
  ).map((r, i) => ({ id: String(i), r }));
  // Rows whose values on these columns are shared with another row.
  const clashes = (key: string[]) => {
    const seen = new Map<string, string[]>();
    for (const { id, r } of rows) {
      const k = key.map((c) => r[c]).join("|");
      seen.set(k, [...(seen.get(k) ?? []), id]);
    }
    return { dup: new Set([...seen.values()].filter((ids) => ids.length > 1).flat()), first: [...seen.entries()].find(([, ids]) => ids.length > 1) };
  };
  const frames: Frame[] = [];
  const tests: string[][] = [["roll_no"], ["course_id"], ["roll_no", "course_id"]];
  const verdicts: boolean[] = [];
  for (const key of tests) {
    const { dup, first } = clashes(key);
    verdicts.push(dup.size === 0);
    const items = rowsTable("e", cols, rows, 0, 0, (id, c) => (key.includes(c) ? (dup.has(id) ? "error" : dup.size ? "accent" : "strong") : undefined));
    items.push(label("t", `testing {${key.join(", ")}}`, 0, 4 * (RH + RG) + 14, { anchor: "start", tone: dup.size ? "error" : "accent", size: 12, weight: 600 }));
    const caption = dup.size
      ? `{${key.join(", ")}} alone is not a key: ${first![0].replace("|", ", ")} appears on ${first![1].length} rows. One counterexample is enough to rule a key out.`
      : `{${key.join(", ")}} is different on every row, which matches the college's rule that a student takes a course once: the composite primary key. The rows agree with the rule; they could never prove it.`;
    frames.push({ caption, items });
  }
  if (verdicts.join() !== "false,false,true") throw new Error(`composite-key: expected only the pair to be unique, got ${verdicts.join()}`);
  return finish({ title: "A composite key: neither column alone, the pair together", input: "enrollment(roll_no, course_id, grade)", frames });
}

/* ── Foreign keys ─────────────────────────────────────────────────── */

const STUDENTS: Rec[] = [
  { roll_no: "101", name: "Asha", dept_id: "CSE" },
  { roll_no: "102", name: "Vikram", dept_id: "CSE" },
  { roll_no: "103", name: "Asha", dept_id: "ECE" },
  { roll_no: "104", name: "Meera", dept_id: "ECE" },
];
const DEPTS = ["CSE", "ECE"];
const S_COLS = ["roll_no", "name", "dept_id"];
const PX = 280;

/** The two tables side by side and an arrow from every non-NULL dept_id to the department row it names. */
function fkTables(students: ReadonlyArray<{ id: string; r: Rec }>, depts: readonly string[], tone: (id: string, col: string) => Tone | undefined, deptTone: (d: string) => Tone | undefined, hot: Set<string>): Item[] {
  const items: Item[] = [];
  const sw = S_COLS.reduce((s, c) => s + COLW[c] + RG, -RG);
  items.push(label("st", "student (child)", 0, -32, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
  items.push(label("dt", "department (parent)", PX, -32, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
  students.forEach(({ id, r }, i) => {
    const j = depts.indexOf(r.dept_id);
    if (r.dept_id === undefined || j < 0) return;
    items.push({ k: "edge", id: `fk${id}`, x1: sw + 2, y1: i * (RH + RG) + RH / 2, x2: PX - 3, y2: j * (RH + RG) + RH / 2, tone: hot.has(id) ? "accent" : "line", arrow: true });
  });
  items.push(...rowsTable("s", S_COLS, students, 0, 0, tone));
  items.push(label("dh", "dept_id", PX + COLW.dept_id / 2, -11, { tone: "faint", size: 10.5, mono: true }));
  depts.forEach((d, j) => items.push(box(`d${d}`, PX, j * (RH + RG), d, { w: COLW.dept_id, h: RH, size: 11.5, tone: deptTone(d) ?? "plain" })));
  return items;
}

function foreignKey(): Walkthrough {
  const base = STUDENTS.map((r) => ({ id: r.roll_no, r }));
  const refs = (r: Rec) => r.dept_id === undefined || DEPTS.includes(r.dept_id);
  if (!base.every(({ r }) => refs(r))) throw new Error("foreign-key: the starting rows must all be valid");
  const frames: Frame[] = [];
  frames.push({
    caption: `student.dept_id is a foreign key referencing department.dept_id. Every value must exist in the parent table; it may repeat, as CSE does for ${base.filter(({ r }) => r.dept_id === "CSE").length} students.`,
    items: fkTables(base, DEPTS, (_id, c) => (c === "dept_id" ? "accent" : undefined), () => "accent", new Set(base.map((b) => b.id))),
  });
  const bad: Rec = { roll_no: "105", name: "Kiran", dept_id: "CIV" };
  if (refs(bad)) throw new Error("foreign-key: CIV should be missing from department");
  frames.push({
    caption: `INSERT student 105 with dept_id 'CIV': there is no CIV in department, so referential integrity fails and the DBMS rejects the row. Nothing is stored.`,
    items: [...fkTables([...base, { id: "105", r: bad }], DEPTS, (id) => (id === "105" ? "error" : undefined), () => undefined, new Set()), label("n", "rejected: no department CIV", 0, 5 * (RH + RG) + 12, { anchor: "start", tone: "error", size: 12, weight: 600 })],
  });
  const loose: Rec = { roll_no: "105", name: "Kiran" };
  if (!refs(loose)) throw new Error("foreign-key: a NULL foreign key must be accepted");
  frames.push({
    caption: "INSERT the same student with dept_id NULL instead: it is accepted, linked to no department. A foreign key may be NULL unless the column is also declared NOT NULL.",
    items: [...fkTables([...base, { id: "105", r: loose }], DEPTS, (id, c) => (id === "105" && c !== "dept_id" ? "accent" : undefined), () => undefined, new Set()), label("n", "accepted: dept_id NULL, not linked", 0, 5 * (RH + RG) + 12, { anchor: "start", tone: "accent", size: 12, weight: 600 })],
  });
  return finish({ title: "A foreign key: every value must exist in the parent, or be NULL", input: "", frames });
}

/* ── ON DELETE ────────────────────────────────────────────────────── */

function onDelete(): Walkthrough {
  const GONE = "ECE";
  type Outcome = { students: Rec[]; depts: string[]; failed: boolean };
  /** DELETE FROM department WHERE dept_id = GONE, under one referential action. */
  const run = (action: "RESTRICT" | "CASCADE" | "SET NULL"): Outcome => {
    const students = STUDENTS.map((r) => ({ ...r }));
    const children = students.filter((r) => r.dept_id === GONE);
    if (action === "RESTRICT") return { students, depts: [...DEPTS], failed: children.length > 0 };
    const depts = DEPTS.filter((d) => d !== GONE);
    if (action === "CASCADE") return { students: students.filter((r) => r.dept_id !== GONE), depts, failed: false };
    for (const r of children) delete r.dept_id;
    return { students, depts, failed: false };
  };
  const refs = STUDENTS.filter((r) => r.dept_id === GONE).map((r) => r.roll_no);
  if (refs.join() !== "103,104") throw new Error(`on-delete: expected 103 and 104 to reference ECE, got ${refs.join()}`);
  const rows = (rs: Rec[]) => rs.map((r) => ({ id: r.roll_no, r }));
  const frames: Frame[] = [
    {
      caption: `DELETE FROM department WHERE dept_id = '${GONE}'. Students ${refs.join(" and ")} still reference it, so the foreign key's ON DELETE action decides what happens to them.`,
      items: fkTables(rows(STUDENTS), DEPTS, (id, c) => (refs.includes(id) && c === "dept_id" ? "accent" : undefined), (d) => (d === GONE ? "accent" : undefined), new Set(refs)),
    },
  ];
  const r1 = run("RESTRICT");
  if (!r1.failed || r1.students.length !== 4) throw new Error("on-delete: RESTRICT should refuse and change nothing");
  frames.push({
    caption: "RESTRICT (and NO ACTION): the delete fails with an error and nothing changes. It is the safe choice wherever losing history by accident would be worse than an error.",
    items: [...fkTables(rows(r1.students), r1.depts, () => undefined, (d) => (d === GONE ? "error" : undefined), new Set()), label("n", "error: rows still reference ECE", 0, 4 * (RH + RG) + 12, { anchor: "start", tone: "error", size: 12, weight: 600 })],
  });
  const r2 = run("CASCADE");
  frames.push({
    caption: `CASCADE: ${GONE} is deleted and so are students ${refs.join(" and ")}, ${STUDENTS.length - r2.students.length} rows removed by one statement. Right for rows that mean nothing without their parent, like enrolments.`,
    items: [...fkTables(rows(r2.students), r2.depts, () => undefined, () => undefined, new Set()), label("n", `${r2.students.length} students left`, 0, 4 * (RH + RG) + 12, { anchor: "start", tone: "accent", size: 12, weight: 600 })],
  });
  const r3 = run("SET NULL");
  const nulled = r3.students.filter((r) => r.dept_id === undefined).map((r) => r.roll_no);
  frames.push({
    caption: `SET NULL: ${GONE} is deleted, and students ${nulled.join(" and ")} keep their rows with dept_id NULL, which needs a nullable column. Right when the child outlives its parent, as a student does a merged department.`,
    items: [...fkTables(rows(r3.students), r3.depts, (id, c) => (nulled.includes(id) && c === "dept_id" ? "accent" : undefined), () => undefined, new Set()), label("n", `${nulled.length} students unlinked`, 0, 4 * (RH + RG) + 12, { anchor: "start", tone: "accent", size: 12, weight: 600 })],
  });
  return finish({ title: "Deleting a referenced department under three ON DELETE actions", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "key-lattice": keyLattice,
  "composite-key": compositeKey,
  "foreign-key": foreignKey,
  "on-delete": onDelete,
};
