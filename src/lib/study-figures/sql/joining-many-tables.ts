import { finish, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, label } from "../../lesson-figures/kit.js";
import { cmp, rowEdge, rowsTable, rowTag, type Row } from "./kit.js";
import { joinPairs } from "./join-walk.js";

/**
 * Joining many tables.
 *
 *  - junction-chain: students and courses are many-to-many, so the pairs
 *    live in enrollments; the chain joins one table at a time and each join
 *    gives every row so far its partners (the lesson's schema, a few rows of
 *    it — the lesson prints no data for this one);
 *  - fan-out: the lesson's customer with 3 orders (total 300) and 2 payments
 *    (total 250) — two independent child tables joined at once pair every
 *    order with every payment, and the sums come out 600 and 750.
 */

const STUDENTS: Row[] = [
  { id: 1, name: "Asha" },
  { id: 2, name: "Ben" },
];
const ENROLLMENTS: Row[] = [
  { student_id: 1, course_id: 10, grade: 82 },
  { student_id: 1, course_id: 20, grade: 75 },
  { student_id: 2, course_id: 10, grade: 90 },
];
const COURSES: Row[] = [
  { id: 10, title: "SQL" },
  { id: 20, title: "Java" },
];

function junctionChain(): Walkthrough {
  const se = joinPairs(STUDENTS, ENROLLMENTS, (s, e) => cmp(e.student_id ?? null, "=", s.id ?? null), "inner").map(([i, j]) => [i!, j!] as [number, number]);
  const courseOf = (e: Row) => COURSES.findIndex((c) => cmp(c.id ?? null, "=", e.course_id ?? null) === true);
  if (se.length !== ENROLLMENTS.length || ENROLLMENTS.some((e) => courseOf(e) < 0)) throw new Error("junction-chain: every enrollment must meet one student and one course");
  const EX = 160;
  const CX = 410;
  const coursesPer = (sid: unknown) => ENROLLMENTS.filter((e) => e.student_id === sid).length;
  const studentsPer = (cid: unknown) => ENROLLMENTS.filter((e) => e.course_id === cid).length;

  const draw = (stage: 0 | 1 | 2): Item[] => {
    const s = rowsTable("s", "students", ["id", "name"], STUDENTS, { w: { id: 34, name: 56 }, tone: () => (stage >= 1 ? "accent" : "plain") });
    const e = rowsTable("e", "enrollments", ["student_id", "course_id", "grade"], ENROLLMENTS, {
      x: EX,
      w: { student_id: 84, course_id: 76, grade: 50 },
      tone: () => (stage >= 1 ? "accent" : "plain"),
    });
    const c = rowsTable("c", "courses", ["id", "title"], COURSES, { x: CX, w: { id: 34, title: 56 }, tone: () => (stage >= 2 ? "accent" : "plain") });
    const items: Item[] = [...s.items, ...e.items, ...c.items];
    ENROLLMENTS.forEach((en, k) => {
      const si = STUDENTS.findIndex((st) => st.id === en.student_id);
      items.push(arrow(`es${k}`, rowEdge(e, k, "left"), rowEdge(s, si, "right"), { tone: stage >= 1 ? "accent" : "line" }));
      items.push(arrow(`ec${k}`, rowEdge(e, k, "right"), rowEdge(c, courseOf(en), "left"), { tone: stage >= 2 ? "accent" : "line" }));
    });
    const y = Math.max(s.bottom, e.bottom, c.bottom) + 30;
    if (stage === 0) {
      items.push(label("m1", `one student → many enrollments (Asha: ${coursesPer(1)})`, 0, y, { anchor: "start", tone: "soft", size: 11.5, mono: true }));
      items.push(label("m2", `one course → many enrollments (SQL: ${studentsPer(10)})`, 0, y + 18, { anchor: "start", tone: "soft", size: 11.5, mono: true }));
    } else {
      const cols = stage === 1 ? ["student", "course_id", "grade"] : ["student", "course", "grade"];
      const rows = se.map(([i, j]) => ({ student: STUDENTS[i]!.name ?? null, course_id: ENROLLMENTS[j]!.course_id ?? null, course: COURSES[courseOf(ENROLLMENTS[j]!)]!.title ?? null, grade: ENROLLMENTS[j]!.grade ?? null }));
      const o = rowsTable("o", stage === 1 ? "students JOIN enrollments" : "… JOIN courses", cols, rows, {
        y,
        key: (r) => String(se[r]![1]),
        w: { student: 66, course_id: 76, course: 76, grade: 50 },
        tone: (_, col) => (col === 1 ? "accent" : "strong"),
      });
      items.push(...o.items);
    }
    return items;
  };

  return finish({
    title: "Many-to-many: the pairs live in a junction table",
    input: "students s JOIN enrollments e ON … JOIN courses c ON …",
    frames: [
      {
        caption: "A student takes many courses and a course has many students. No column can hold a list, so each (student, course) pair is a row of enrollments, pointing at both sides.",
        items: draw(0),
      },
      {
        caption: `The first join gives each student one row per enrollment: Asha ${coursesPer(1)} rows, Ben ${coursesPer(2)}. The course is still only an id, and the junction's own column, grade, comes along.`,
        items: draw(1),
      },
      {
        caption: "The second join gives each of those rows its course, through course_id. Each ON links the new table to one already present; two joins cross the junction table.",
        items: draw(2),
      },
    ],
  });
}

const ORDERS: Row[] = [
  { id: 1, amount: 100 },
  { id: 2, amount: 120 },
  { id: 3, amount: 80 },
];
const PAYMENTS: Row[] = [
  { id: 1, amount: 150 },
  { id: 2, amount: 100 },
];

function fanOut(): Walkthrough {
  const sum = (rs: Row[]) => rs.reduce((a, r) => a + (r.amount as number), 0);
  if (sum(ORDERS) !== 300 || sum(PAYMENTS) !== 250) throw new Error("fan-out: the lesson's customer has orders totalling 300 and payments totalling 250");
  // Both children joined to the one customer: every order row meets every payment row.
  const rows = ORDERS.flatMap((o) => PAYMENTS.map((p) => ({ o, p })));
  const ordered = rows.reduce((a, r) => a + (r.o.amount as number), 0);
  const paid = rows.reduce((a, r) => a + (r.p.amount as number), 0);
  if (ordered !== 600 || paid !== 750) throw new Error(`fan-out: got ${ordered}/${paid}, the lesson prints 600 and 750`);
  const PX = 250;

  const draw = (stage: "children" | "pairs" | "sums" | "fix"): Item[] => {
    const o = rowsTable("o", "Asha's orders", ["id", "amount"], ORDERS, { w: { id: 34, amount: 62 }, tone: () => (stage === "fix" ? "muted" : "plain") });
    const p = rowsTable("p", "Asha's payments", ["id", "amount"], PAYMENTS, { x: PX, w: { id: 34, amount: 62 }, tone: () => (stage === "fix" ? "muted" : "plain") });
    const items: Item[] = [...o.items, ...p.items];
    if (stage === "children") {
      items.push(label("t1", `orders total ${sum(ORDERS)}`, 0, o.bottom + 22, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
      items.push(label("t2", `payments total ${sum(PAYMENTS)}`, PX, o.bottom + 22, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
      return items;
    }
    if (stage !== "fix") ORDERS.forEach((_, i) => PAYMENTS.forEach((__, j) => items.push(arrow(`l${i}-${j}`, rowEdge(o, i, "right"), rowEdge(p, j, "left"), { tone: "accent", head: false }))));
    const y = Math.max(o.bottom, p.bottom) + 28;
    if (stage === "fix") {
      const t = rowsTable("f", "aggregate each child first, then join", ["name", "ordered", "paid"], [{ name: "Asha", ordered: sum(ORDERS), paid: sum(PAYMENTS) }], {
        y,
        w: { name: 56, ordered: 70, paid: 56 },
        tone: () => "strong",
      });
      items.push(...t.items);
      return items;
    }
    const t = rowsTable(
      "r",
      `joined: ${ORDERS.length} × ${PAYMENTS.length} = ${rows.length} rows`,
      ["o.amount", "p.amount"],
      rows.map((r) => ({ "o.amount": r.o.amount ?? null, "p.amount": r.p.amount ?? null })),
      { y, h: 22, key: (r) => `${rows[r]!.o.id}.${rows[r]!.p.id}`, w: { "o.amount": 72, "p.amount": 72 }, tone: () => (stage === "sums" ? "error" : "plain") },
    );
    items.push(...t.items);
    if (stage === "sums") {
      items.push(rowTag("s1", t, 1, `SUM(o.amount) = ${ordered}, not ${sum(ORDERS)}`, { tone: "error", weight: 600 }));
      items.push(rowTag("s2", t, 3, `SUM(p.amount) = ${paid}, not ${sum(PAYMENTS)}`, { tone: "error", weight: 600 }));
    }
    return items;
  };

  return finish({
    title: "Fan-out: two independent child tables multiply each other",
    input: "customers LEFT JOIN orders … LEFT JOIN payments …",
    frames: [
      { caption: `Asha has ${ORDERS.length} orders, totalling ${sum(ORDERS)}, and ${PAYMENTS.length} payments, totalling ${sum(PAYMENTS)}. The two tables are not related to each other — only to her.`, items: draw("children") },
      {
        caption: `Joining both to the customer pairs every order row with every payment row: ${ORDERS.length} × ${PAYMENTS.length} = ${rows.length} rows, though she has only ${ORDERS.length + PAYMENTS.length} child rows.`,
        items: draw("pairs"),
      },
      {
        caption: `Summing now counts each order ${PAYMENTS.length} times and each payment ${ORDERS.length} times: ${ordered} ordered and ${paid} paid. No error, plausible numbers — which is why the bug survives review.`,
        items: draw("sums"),
      },
      { caption: `The fix: total each child first, one row per customer each, then join the totals. ${sum(ORDERS)} and ${sum(PAYMENTS)}, the real figures.`, items: draw("fix") },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "junction-chain": junctionChain,
  "fan-out": fanOut,
};
