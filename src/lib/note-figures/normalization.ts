import { finish, round, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";

/**
 * Normalization in DBMS: the note's figures (content/notes/dbms/
 * normalization.md places each with "@figure <name>").
 *
 * One running example — the college's wide table R, its five functional
 * dependencies and four rows — and one engine: closure, candidate keys and
 * a normal-form test that finds the violating dependency by trying every
 * determinant (smallest first). The decomposition figure lets that engine
 * choose every split, checks each split is lossless and counts each table's
 * rows by projecting R's rows; the other figures run the anomalies, the
 * lossy join and the lost dependency on the same rows. The generators check
 * the note's claims (the two candidate keys, the five BCNF tables, six rows
 * from the lossy join, FD4 lost) and throw if the text and the data part.
 *
 *  - anomalies: update, insertion and deletion anomalies on R's rows.
 *  - normal-forms: 1NF ⊃ 2NF ⊃ 3NF ⊃ BCNF ⊃ 4NF, each relation of the note
 *    placed in the smallest set its computed normal form allows.
 *  - decomposition: R → 2NF → 3NF → BCNF, one split a frame.
 *  - lossy-join: a split on a non-key, joined back into spurious rows.
 *  - lost-dependency: the insert the BCNF tables cannot refuse.
 */

const ATTRS = ["roll_no", "name", "dept", "hod", "course_id", "course_title", "instructor", "grade"];
type FD = { l: string[]; r: string[]; name: string };
const F: FD[] = [
  { name: "FD1", l: ["roll_no"], r: ["name", "dept"] },
  { name: "FD2", l: ["dept"], r: ["hod"] },
  { name: "FD3", l: ["course_id"], r: ["course_title"] },
  { name: "FD4", l: ["roll_no", "course_id"], r: ["instructor", "grade"] },
  { name: "FD5", l: ["instructor"], r: ["course_id"] },
];
type Rec = Record<string, string>;
const R_ROWS: Rec[] = [
  ["101", "Asha", "CSE", "Dr. Rao", "CS301", "DBMS", "Sen", "A"],
  ["101", "Asha", "CSE", "Dr. Rao", "CS302", "Operating Systems", "Khan", "B"],
  ["102", "Vikram", "CSE", "Dr. Rao", "CS301", "DBMS", "Gupta", "A"],
  ["103", "Meera", "ECE", "Dr. Iyer", "CS301", "DBMS", "Sen", "B"],
].map((v) => Object.fromEntries(ATTRS.map((a, i) => [a, v[i]])));

const byOrder = (xs: Iterable<string>) => ATTRS.filter((a) => new Set(xs).has(a));
const fdText = (l: readonly string[], r: readonly string[]) => `${l.join(", ")} → ${r.join(", ")}`;

function closure(xs: readonly string[], fds: readonly FD[] = F): Set<string> {
  const out = new Set(xs);
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of fds)
      if (f.l.every((a) => out.has(a)))
        for (const a of f.r)
          if (!out.has(a)) {
            out.add(a);
            changed = true;
          }
  }
  return out;
}

/** Every subset of s, smallest first, each in attribute order. */
function subsets(s: readonly string[]): string[][] {
  const out: string[][] = [];
  for (let m = 1; m < 1 << s.length; m++) out.push(s.filter((_, i) => m & (1 << i)));
  return out.sort((a, b) => a.length - b.length || ATTRS.indexOf(a[0]) - ATTRS.indexOf(b[0]));
}

const isSuper = (x: readonly string[], s: readonly string[]) => {
  const c = closure(x);
  return s.every((a) => c.has(a));
};

function keysOf(s: readonly string[]): string[][] {
  const keys: string[][] = [];
  for (const x of subsets(s)) if (!keys.some((k) => k.every((a) => x.includes(a))) && isSuper(x, s)) keys.push(x);
  return keys;
}

type Form = "2NF" | "3NF" | "BCNF";
/** The first dependency X → D on s (determinants tried smallest first) that the form forbids, or null. */
function violation(s: readonly string[], form: Form): { x: string[]; d: string[] } | null {
  const keys = keysOf(s);
  const prime = new Set(keys.flat());
  for (const x of subsets(s)) {
    if (x.length === s.length) continue;
    const c = closure(x);
    let d = s.filter((a) => !x.includes(a) && c.has(a));
    if (form === "2NF") {
      if (!keys.some((k) => k.length > x.length && x.every((a) => k.includes(a)))) continue;
      d = d.filter((a) => !prime.has(a));
    } else {
      if (isSuper(x, s)) continue;
      if (form === "3NF") d = d.filter((a) => !prime.has(a));
    }
    if (d.length) return { x, d };
  }
  return null;
}

/** The highest normal form s satisfies (it is always in 1NF: every value here is atomic). */
const normalForm = (s: readonly string[]): "1NF" | Form => (violation(s, "2NF") ? "1NF" : violation(s, "3NF") ? "2NF" : violation(s, "BCNF") ? "3NF" : "BCNF");

/** Distinct rows of R projected onto s. */
const project = (s: readonly string[]) => [...new Map(R_ROWS.map((r) => [s.map((a) => r[a]).join("|"), r])).values()];

/** The dependencies of F that fire inside x+ and add something in d: the ones a split is "about". */
function usedFds(x: readonly string[], d: readonly string[]): FD[] {
  const have = new Set(x);
  const used: FD[] = [];
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of F)
      if (!used.includes(f) && f.l.every((a) => have.has(a)) && f.r.some((a) => !have.has(a))) {
        f.r.forEach((a) => have.add(a));
        if (f.r.some((a) => d.includes(a))) used.push(f);
        changed = true;
      }
  }
  return used;
}

/* ── Drawing tables of rows ───────────────────────────────────────── */

const W: Record<string, number> = { roll_no: 52, name: 54, dept: 40, hod: 60, course_id: 56, course_title: 112, instructor: 70, grade: 44 };
const RH = 22;
const RG = 3;

function rowsTable(prefix: string, cols: readonly string[], rows: ReadonlyArray<{ id: string; r: Rec }>, x: number, y: number, tone: (id: string, col: string) => Tone | undefined = () => undefined): { items: Item[]; w: number } {
  const items: Item[] = [];
  let cx = x;
  for (const c of cols) {
    items.push(label(`${prefix}h-${c}`, c, cx + W[c] / 2, y - 10, { tone: "faint", size: 10, mono: true }));
    rows.forEach((row, i) => items.push(box(`${prefix}${row.id}-${c}`, cx, y + i * (RH + RG), row.r[c] ?? "NULL", { w: W[c], h: RH, size: 10.5, tone: tone(row.id, c) ?? (row.r[c] === undefined ? "muted" : "plain") })));
    cx += W[c] + RG;
  }
  return { items, w: cx - RG - x };
}

/* ── Anomalies ────────────────────────────────────────────────────── */

function anomalies(): Walkthrough {
  const keys = keysOf(ATTRS);
  if (keys.map((k) => k.join("+")).join(" ") !== "roll_no+course_id roll_no+instructor") throw new Error(`anomalies: keys ${keys.map((k) => k.join("+")).join(", ")}, the note says {roll_no, course_id} and {roll_no, instructor}`);
  const rows = R_ROWS.map((r, i) => ({ id: String(i), r: { ...r } }));
  const H = rows.length * (RH + RG);
  const say = (text: string, tone: "accent" | "error" = "error"): Item => label("n", text, 0, H + 14, { anchor: "start", tone, size: 11.5, weight: 600 });
  const frames: Frame[] = [];

  // Update: CSE gets a new head.
  const cse = rows.filter(({ r }) => r.dept === "CSE");
  const oldHod = cse[0].r.hod;
  if (cse.length !== 3) throw new Error(`anomalies: ${cse.length} CSE rows, the note says three`);
  frames.push({
    caption: `Update anomaly: the fact "${oldHod} heads CSE" is stored on ${cse.length} rows, one per CSE enrolment, so a new head means changing all ${cse.length} of them.`,
    items: [...rowsTable("r", ATTRS, rows, 0, 0, (id, c) => (c === "hod" && cse.some((x) => x.id === id) ? "accent" : c === "dept" && cse.some((x) => x.id === id) ? "accent" : undefined)).items, say(`${cse.length} rows hold one fact`, "accent")],
  });
  const NEW = "Dr. Das";
  const missed = cse[cse.length - 1].id;
  for (const x of cse) if (x.id !== missed) x.r.hod = NEW;
  const heads = new Set(cse.map((x) => x.r.hod));
  if (heads.size !== 2) throw new Error("anomalies: a missed row should leave CSE with two heads");
  frames.push({
    caption: `Miss one of them and the table contradicts itself: CSE now has two heads, ${[...heads].join(" and ")}, and nothing says which is right. dept → hod is broken by the table's own rows.`,
    items: [...rowsTable("r", ATTRS, rows, 0, 0, (id, c) => (c === "hod" && cse.some((x) => x.id === id) ? (id === missed ? "error" : "accent") : undefined)).items, say(`CSE: ${[...heads].join(" and ")}`)],
  });
  for (const x of cse) x.r.hod = oldHod;

  // Insertion: a course nobody has taken yet.
  const fresh = { id: "new", r: { course_id: "CS303", course_title: "Computer Networks" } as Rec };
  const inEveryKey = ATTRS.filter((a) => keys.every((k) => k.includes(a)));
  if (inEveryKey.join() !== "roll_no") throw new Error("anomalies: roll_no should be in every key");
  frames.push({
    caption: `Insertion anomaly: a new course, CS303, cannot be recorded until someone enrols. Its row would need roll_no, which is part of every candidate key and so cannot be NULL.`,
    items: [...rowsTable("r", ATTRS, [...rows, fresh], 0, 0, (id, c) => (id === "new" ? (c === "roll_no" ? "error" : c.startsWith("course") ? "accent" : "muted") : undefined)).items, label("n", "rejected: roll_no is part of every key", 0, H + RH + RG + 14, { anchor: "start", tone: "error", size: 11.5, weight: 600 })],
  });

  // Deletion: Meera leaves.
  const gone = rows.filter(({ r }) => r.roll_no === "103");
  const left = rows.filter(({ r }) => r.roll_no !== "103");
  const lost = gone[0].r;
  if (left.some(({ r }) => r.dept === lost.dept)) throw new Error("anomalies: another row still records the ECE head");
  frames.push({
    caption: `Deletion anomaly: when ${lost.name} leaves and her row is deleted, the only record that ${lost.hod} heads ${lost.dept} goes with it. One delete removed two facts.`,
    items: [...rowsTable("r", ATTRS, left, 0, 0).items, say(`lost: ${lost.hod} heads ${lost.dept}`)],
  });
  return finish({ title: "Insertion, update and deletion anomalies in R", input: "R(roll_no, name, dept, hod, course_id, course_title, instructor, grade)", frames });
}

/* ── The normal forms as nested sets ──────────────────────────────── */

function normalForms(): Walkthrough {
  const rel = (name: string, attrs: string[]) => ({ name, attrs, nf: normalForm(attrs) as string });
  const final = [
    rel("Student", ["roll_no", "name", "dept"]),
    rel("Department", ["dept", "hod"]),
    rel("Course", ["course_id", "course_title"]),
    rel("Teaches", ["instructor", "course_id"]),
    rel("Enrollment", ["roll_no", "instructor", "grade"]),
  ];
  // A course's textbooks and its lab days, independent of each other. No FD of F touches textbook or lab_day,
  // so the only key is all three columns and the table is in BCNF; course_id ↠ textbook, with course_id not a key, breaks 4NF.
  const tbAttrs = ["course_id", "textbook", "lab_day"];
  const tbForm = normalForm(tbAttrs);
  if (tbForm !== "BCNF" || keysOf(tbAttrs).length !== 1 || keysOf(tbAttrs)[0].length !== 3) throw new Error("normal-forms: the textbook table should be in BCNF with all three columns its only key");
  const tbRows = [
    ["CS301", "Korth", "Mon"],
    ["CS301", "Korth", "Thu"],
    ["CS301", "Navathe", "Mon"],
    ["CS301", "Navathe", "Thu"],
  ];
  // The MVD holds on the rows: every textbook of the course pairs with every lab day of it.
  const books = [...new Set(tbRows.map((r) => r[1]))];
  const days = [...new Set(tbRows.map((r) => r[2]))];
  if (tbRows.length !== books.length * days.length) throw new Error("normal-forms: course_id ↠ textbook should hold on the rows");
  const textbook = { name: "course_id, textbook, lab_day", attrs: tbAttrs, nf: tbForm as string };
  const placed = [
    { name: "the sheet, lists in cells", nf: "none" },
    rel("R, all eight columns", ATTRS),
    rel("Student(roll_no, name, dept, hod)", ["roll_no", "name", "dept", "hod"]),
    rel("Enrollment(roll_no, course_id, instructor, grade)", ["roll_no", "course_id", "instructor", "grade"]),
    textbook,
    ...final.map((f) => ({ ...f, nf: f.nf === "BCNF" ? "4NF" : f.nf })),
  ];
  const want = ["none", "1NF", "2NF", "3NF", "BCNF", "4NF", "4NF", "4NF", "4NF", "4NF"];
  if (placed.map((p) => p.nf).join() !== want.join()) throw new Error(`normal-forms: computed ${placed.map((p) => `${p.name}=${p.nf}`).join(", ")}`);
  const levels = ["none", "1NF", "2NF", "3NF", "BCNF", "4NF"];
  const titles = ["not in 1NF", "1NF", "2NF", "3NF", "BCNF", "4NF"];
  const WD = 512;
  const STRIP = 38;
  const IN = 10;
  const H = levels.length * STRIP + levels.length * 10;
  const items: Item[] = [];
  levels.forEach((lv, k) => {
    const x = k * IN;
    const y = k * STRIP;
    items.push({ k: "band", id: `b${k}`, x, y, w: WD - 2 * x, h: H - y - k * 10, tone: k === levels.length - 1 ? "accent" : k ? "ghost" : "plain" });
    items.push(label(`l${k}`, titles[k], x + 10, y + 19, { anchor: "start", tone: k >= 4 ? "accent" : "ink", size: 12, weight: 700 }));
    const here = placed.filter((p) => p.nf === lv);
    let cx = x + 10 + Math.ceil(titles[k].length * 12 * 0.6) + 14;
    here.forEach((p, i) => {
      const w = Math.ceil(p.name.length * 11 * 0.6 + 12);
      items.push(box(`c${k}-${i}`, cx, y + 7, p.name, { w, h: 24, size: 11, tone: lv === "none" ? "muted" : lv === "4NF" ? "strong" : "plain" }));
      cx += w + 5;
    });
    if (cx - 6 > WD - x - 8) throw new Error(`normal-forms: the ${titles[k]} strip overflows`);
  });
  return finish({
    title: "Each normal form is a stricter set; where the note's tables land",
    input: "",
    frames: [
      {
        caption: "Every BCNF table is in 3NF, every 3NF table in 2NF, and so on. R is only in 1NF, the 2NF Student is stopped by dept → hod, Enrollment by instructor → course_id, and the textbook table by its multivalued dependency. The five final tables reach 4NF.",
        items,
      },
    ],
  });
}

/* ── The decomposition, chosen by the engine ──────────────────────── */

type Table = { id: string; cols: Array<{ a: string; id: string }> };
const NAMES: Array<[string, string]> = [
  ["roll_no,name,dept,hod,course_id,course_title,instructor,grade", "R"],
  ["roll_no,course_id,course_title,instructor,grade", "rest of R"],
  ["roll_no,name,dept,hod", "Student"],
  ["roll_no,name,dept", "Student"],
  ["course_id,course_title", "Course"],
  ["dept,hod", "Department"],
  ["course_id,instructor", "Teaches"],
  ["roll_no,course_id,instructor,grade", "Enrollment"],
  ["roll_no,instructor,grade", "Enrollment"],
];
const nameOf = (t: Table) => NAMES.find(([k]) => k === byOrder(t.cols.map((c) => c.a)).join(","))?.[1] ?? "?";
const ORDER = ["Student", "Department", "Course", "Teaches", "R", "rest of R", "Enrollment"];

function decompose(): Array<{ tables: Table[]; form?: Form; x?: string[]; d?: string[]; from?: string; to?: string }> {
  let tables: Table[] = [{ id: "R", cols: ATTRS.map((a) => ({ a, id: `R-${a}` })) }];
  const steps: Array<{ tables: Table[]; form?: Form; x?: string[]; d?: string[]; from?: string; to?: string }> = [{ tables }];
  let n = 0;
  for (const form of ["2NF", "3NF", "BCNF"] as const) {
    for (let again = true; again; ) {
      again = false;
      for (const t of tables) {
        const attrs = byOrder(t.cols.map((c) => c.a));
        const v = violation(attrs, form);
        if (!v) continue;
        const id = `T${++n}`;
        const made: Table = { id, cols: [...v.x.map((a) => ({ a, id: `${id}-${a}` })), ...t.cols.filter((c) => v.d.includes(c.a))] };
        const rest: Table = { id: t.id, cols: t.cols.filter((c) => !v.d.includes(c.a)) };
        // Lossless: the common attributes (the determinant) must be a key of one side — here, of the new table.
        if (!isSuper(v.x, made.cols.map((c) => c.a))) throw new Error(`decomposition: splitting on ${v.x.join(",")} would be lossy`);
        const from = nameOf(t);
        tables = [...tables.filter((x) => x !== t), rest, made];
        steps.push({ tables, form, x: v.x, d: v.d, from, to: nameOf(made) });
        again = true;
        break;
      }
    }
  }
  return steps;
}

function decomposition(): Walkthrough {
  const steps = decompose();
  const last = steps[steps.length - 1].tables;
  const finalNames = last.map(nameOf).sort();
  if (finalNames.join() !== "Course,Department,Enrollment,Student,Teaches") throw new Error(`decomposition: ended with ${finalNames.join(", ")}, the note has five tables`);
  if (!last.every((t) => normalForm(byOrder(t.cols.map((c) => c.a))) === "BCNF")) throw new Error("decomposition: a final table is not in BCNF");
  // Dependency preservation: an FD is kept if its left side, closed one table at a time, reaches its right side.
  const preserved = (f: FD) => {
    const got = new Set(f.l);
    for (let changed = true; changed; ) {
      changed = false;
      for (const t of last) {
        const s = t.cols.map((c) => c.a);
        const c = closure(s.filter((a) => got.has(a)));
        for (const a of s) if (c.has(a) && !got.has(a)) {
          got.add(a);
          changed = true;
        }
      }
    }
    return f.r.every((a) => got.has(a));
  };
  const lost = F.filter((f) => !preserved(f)).map((f) => f.name);
  if (lost.join() !== "FD4") throw new Error(`decomposition: lost ${lost.join(",") || "nothing"}, the note says FD4`);
  const raoR = R_ROWS.filter((r) => r.hod === "Dr. Rao").length;

  const TW = 94;
  const HH = 22;
  const LH = 16;
  const TY = 104;
  const draw = (s: (typeof steps)[number], o: { final?: boolean } = {}): Item[] => {
    const items: Item[] = [];
    const used = s.x ? usedFds(s.x, s.d!) : [];
    F.forEach((f, i) =>
      items.push({ k: "text", id: `fd${i}`, x: 0, y: i * 16, text: `${f.name}  ${fdText(f.l, f.r)}`, tone: o.final ? (lost.includes(f.name) ? "error" : "soft") : used.includes(f) ? "accent" : "soft", anchor: "start", size: 11, mono: true, weight: used.includes(f) || (o.final && lost.includes(f.name)) ? 700 : undefined }),
    );
    const sorted = [...s.tables].sort((a, b) => ORDER.indexOf(nameOf(a)) - ORDER.indexOf(nameOf(b)));
    sorted.forEach((t, i) => {
      const x = i * (TW + 8);
      const attrs = t.cols.map((c) => c.a);
      const key = keysOf(byOrder(attrs))[0];
      const fresh = !o.final && s.to !== undefined && nameOf(t) === s.to && t.id !== "R";
      items.push(box(`h-${t.id}`, x, TY, nameOf(t), { w: TW, h: HH, size: 11, tone: o.final ? "strong" : fresh ? "accent" : "plain" }));
      items.push(box(`b-${t.id}`, x, TY + HH, "", { w: TW, h: t.cols.length * LH + 8 }));
      t.cols.forEach((c, j) => {
        const y = TY + HH + 4 + LH / 2 + j * LH;
        const moved = s.d?.includes(c.a) && fresh;
        items.push({ k: "text", id: c.id, x: x + 7, y, text: c.a, tone: moved ? "accent" : "ink", anchor: "start", size: 10.5, mono: true, weight: key.includes(c.a) ? 700 : undefined });
        if (key.includes(c.a)) items.push({ k: "path", id: `u-${c.id}`, pts: [[x + 7, y + 7], [round(x + 7 + c.a.length * 6.3), y + 7]], tone: "ink", width: 1 });
      });
      items.push({ k: "text", id: `n-${t.id}`, x: x + TW / 2, y: TY + HH + t.cols.length * LH + 20, text: `${project(attrs).length} rows`, tone: "faint", anchor: "middle", size: 10, mono: true });
    });
    return items;
  };
  /** The step's two lines of reasoning, under the tallest table of the frame. */
  const verdict = (tables: Table[], a: string, b: string, tone: "accent" | "error" = "accent"): Item[] => {
    const y = TY + HH + Math.max(...tables.map((t) => t.cols.length)) * LH + 44;
    return [label("v1", a, 0, y, { anchor: "start", tone, size: 11.5, weight: 600 }), label("v2", b, 0, y + 18, { anchor: "start", tone: "soft", size: 11.5 })];
  };
  const frames: Frame[] = [];
  const keys = keysOf(ATTRS).map((k) => `{${k.join(", ")}}`);
  frames.push({
    caption: `R is in 1NF: one row per student and course. Its candidate keys are ${keys.join(" and ")}, so roll_no, course_id and instructor are prime and every other column is not. Bold underlined columns are a key.`,
    items: [...draw(steps[0]), ...verdict(steps[0].tables, `keys ${keys.join(" and ")}`, "1NF; check 2NF next")],
  });
  for (const s of steps.slice(1)) {
    const dep = fdText(s.x!, s.d!);
    const kind = s.form === "2NF" ? `${s.x!.join(", ")} is only part of a key` : s.form === "3NF" ? `${s.x!.join(", ")} is not a key and ${s.d!.join(", ")} is not prime` : `${s.x!.join(", ")} is not a super key of ${s.from}`;
    const why = s.form === "2NF" ? "a partial dependency" : s.form === "3NF" ? "a transitive dependency" : "a determinant that is not a super key";
    const extra = s.to === "Department" ? ` The head of CSE, stored ${raoR} times in R, is now stored once.` : s.to === "Teaches" ? " Sen teaching CS301 is now one row, not two." : "";
    frames.push({
      caption: `${s.form}: ${dep} breaks it, ${why} (${kind}). Split ${s.to} off ${s.from}; the common column ${s.x!.join(", ")} is ${s.to}'s key, so the join back is lossless.${extra}`,
      items: [...draw(s), ...verdict(s.tables, `${s.form}: ${dep}`, `split off ${s.to}: ${s.x!.join(", ")} is its key, lossless`)],
    });
  }
  frames.push({
    caption: `Every determinant is now a key: five tables in BCNF. The price is ${lost.join(", ")}: (roll_no, course_id) → instructor, grade spans Teaches and Enrollment, so no single table can check it any more.`,
    items: [...draw(steps[steps.length - 1], { final: true }), ...verdict(last, "BCNF: every determinant is a key", `${lost.join(", ")} is no longer checked inside one table`, "accent")],
  });
  return finish({ title: "Normalizing R to BCNF, one split at a time", input: "R(roll_no, name, dept, hod, course_id, course_title, instructor, grade)", frames });
}

/* ── A lossy join ─────────────────────────────────────────────────── */

function lossyJoin(): Walkthrough {
  const facts = R_ROWS.map((r) => ({ roll_no: r.roll_no, course_id: r.course_id, grade: r.grade }));
  const p1 = [...new Map(facts.map((r) => [`${r.roll_no}|${r.grade}`, { roll_no: r.roll_no, grade: r.grade }])).values()];
  const p2 = [...new Map(facts.map((r) => [`${r.course_id}|${r.grade}`, { course_id: r.course_id, grade: r.grade }])).values()];
  const joined = p1.flatMap((a) => p2.filter((b) => b.grade === a.grade).map((b) => ({ roll_no: a.roll_no, course_id: b.course_id, grade: a.grade })));
  const real = new Set(facts.map((r) => `${r.roll_no}|${r.course_id}|${r.grade}`));
  const spurious = joined.filter((r) => !real.has(`${r.roll_no}|${r.course_id}|${r.grade}`));
  if (joined.length !== 6 || spurious.length !== 2) throw new Error(`lossy-join: ${joined.length} rows, ${spurious.length} spurious; the note says 6 and 2`);
  // grade determines nothing: it is a key of neither side.
  if (new Set(p1.map((r) => r.grade)).size === p1.length || new Set(p2.map((r) => r.grade)).size === p2.length) throw new Error("lossy-join: grade should repeat on both sides");
  const rows = (rs: Rec[], prefix: string) => rs.map((r, i) => ({ id: `${prefix}${i}`, r }));
  const PX = 0;
  const QX = 136;
  const JX = 300;
  const top: Item[] = [
    label("t1", "(roll_no, grade)", PX, -32, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }),
    label("t2", "(course_id, grade)", QX, -32, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }),
  ];
  const left = [...rowsTable("p", ["roll_no", "grade"], rows(p1, "a"), PX, 0, (_id, c) => (c === "grade" ? "accent" : undefined)).items, ...rowsTable("q", ["course_id", "grade"], rows(p2, "b"), QX, 0, (_id, c) => (c === "grade" ? "accent" : undefined)).items];
  const original = rowsTable("o", ["roll_no", "course_id", "grade"], rows(facts, "o"), JX, 0).items;
  const isSpur = (r: Rec) => !real.has(`${r.roll_no}|${r.course_id}|${r.grade}`);
  const result = rowsTable("j", ["roll_no", "course_id", "grade"], rows(joined, "j"), JX, 0, (id) => (isSpur(joined[Number(id.slice(1))]) ? "error" : undefined)).items;
  return finish({
    title: "A lossy split: joining on grade invents rows",
    input: "enrolment facts (roll_no, course_id, grade), split on grade",
    frames: [
      {
        caption: `Split the ${facts.length} enrolment facts into (roll_no, grade) and (course_id, grade). The only common column is grade, and grade determines nothing: A and B each appear on several rows of both pieces.`,
        items: [...top, label("t3", "original rows", JX, -32, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }), ...left, ...original],
      },
      {
        caption: `Joining the pieces back on grade pairs every roll number with every course of the same grade: ${joined.length} rows instead of ${facts.length}. ${spurious.map((r) => `(${r.roll_no}, ${r.course_id}, ${r.grade})`).join(" and ")} never happened, and nothing marks them as false.`,
        items: [...top, label("t3", `joined on grade: ${joined.length} rows`, JX, -32, { anchor: "start", tone: "error", size: 11.5, weight: 600 }), ...left, ...result],
      },
    ],
  });
}

/* ── A dependency the BCNF tables cannot check ────────────────────── */

function lostDependency(): Walkthrough {
  const teaches = [...new Map(R_ROWS.map((r) => [r.instructor, { instructor: r.instructor, course_id: r.course_id }])).values()];
  const enrol = R_ROWS.map((r) => ({ roll_no: r.roll_no, instructor: r.instructor, grade: r.grade }));
  const insert = { roll_no: "101", instructor: "Gupta", grade: "C" };
  // Both tables' own keys accept it: (roll_no, instructor) is new in Enrollment, and Teaches is untouched.
  if (enrol.some((r) => r.roll_no === insert.roll_no && r.instructor === insert.instructor)) throw new Error("lost-dependency: the insert should not clash with Enrollment's key");
  if (!teaches.some((t) => t.instructor === insert.instructor)) throw new Error("lost-dependency: Gupta must be in Teaches");
  const after = [...enrol, insert];
  const joined = after.map((e) => ({ ...e, course_id: teaches.find((t) => t.instructor === e.instructor)!.course_id }));
  const clash = joined.filter((r) => r.roll_no === insert.roll_no && r.course_id === joined[joined.length - 1].course_id);
  if (clash.length !== 2) throw new Error("lost-dependency: the join should show two rows for (101, CS301)");
  const TX = 0;
  const EX = 176;
  const rows = (rs: Rec[], p: string) => rs.map((r, i) => ({ id: `${p}${i}`, r }));
  const head = (id: string, t: string, x: number, tone: "ink" | "error" = "ink") => label(id, t, x, -32, { anchor: "start", tone, size: 11.5, weight: 600 });
  const course = clash[0].course_id;
  const clashIds = new Set(joined.flatMap((r, i) => (r.roll_no === insert.roll_no && r.course_id === course ? [`e${i}`] : [])));
  const both = (id: string) => clashIds.has(id);
  return finish({
    title: "Dependency preservation: the insert BCNF cannot refuse",
    input: "Teaches(instructor, course_id), Enrollment(roll_no, instructor, grade)",
    frames: [
      {
        caption: "In BCNF, Teaches says which course each instructor teaches and Enrollment which instructor's section each student is in. FD4, a student takes a course once, is in neither table.",
        items: [head("tt", "Teaches", TX), head("te", "Enrollment", EX), ...rowsTable("t", ["instructor", "course_id"], rows(teaches, "t"), TX, 0).items, ...rowsTable("e", ["roll_no", "instructor", "grade"], rows(enrol, "e"), EX, 0).items],
      },
      {
        caption: `INSERT (${insert.roll_no}, ${insert.instructor}, ${insert.grade}) into Enrollment. Its key (roll_no, instructor) is new, so the table accepts it, and Teaches is not involved at all.`,
        items: [head("tt", "Teaches", TX), head("te", "Enrollment", EX), ...rowsTable("t", ["instructor", "course_id"], rows(teaches, "t"), TX, 0).items, ...rowsTable("e", ["roll_no", "instructor", "grade"], rows(after, "e"), EX, 0, (id) => (id === `e${after.length - 1}` ? "accent" : undefined)).items],
      },
      {
        caption: `Only a join shows the damage: ${insert.instructor} teaches ${course}, so student ${insert.roll_no} is now in ${course} twice, with grades ${clash.map((c) => c.grade).join(" and ")}. FD4 is broken, and enforcing it needs that join or a trigger on every insert.`,
        items: [head("tt", "Teaches", TX), head("te", "Enrollment", EX), ...rowsTable("t", ["instructor", "course_id"], rows(teaches, "t"), TX, 0, (id) => (clash.some((c) => c.instructor === teaches[Number(id.slice(1))].instructor) ? "error" : undefined)).items, ...rowsTable("e", ["roll_no", "instructor", "grade"], rows(after, "e"), EX, 0, (id) => (both(id) ? "error" : undefined)).items, label("n", `${insert.roll_no} in ${course} twice: FD4 broken`, EX, after.length * (RH + RG) + 14, { anchor: "start", tone: "error", size: 11.5, weight: 600 })],
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  anomalies,
  "normal-forms": normalForms,
  decomposition,
  "lossy-join": lossyJoin,
  "lost-dependency": lostDependency,
};
