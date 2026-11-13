import { finish, type Frame, type Item, type TextTone, type Tone } from "../../walkthroughs/core.js";
import type { Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "../../note-figures/kit.js";

/**
 * From requirements to classes (scripts/study-plans/lld/01-modelling): the
 * library desk the lesson's first program builds.
 *
 *  - library-classes: Library, Book, Member and the Loan between them, one
 *    class a frame, then the two rules that sit on Loan;
 *  - borrow-run: the exercise's visible case run through the same model the
 *    reference solution implements (14-day loans, two books a member), the
 *    state after each command and the line it prints — checked against the
 *    case's expected output.
 */

/* ── Class diagram ────────────────────────────────────────────────── */

const SIZE = 10;
const LIBRARY: ClassSpec = { name: "Library", fields: ["- books: Map<id, Book>", "- members: Map<name, Member>"], methods: ["+ addBook(id, title)", "+ join(name)", "+ borrow(name, id, day): Loan", "+ giveBack(id, day): int", "+ overdue(day): List"] };
const BOOK: ClassSpec = { name: "Book", fields: ["- id: String", "- title: String", "- loan: Loan"], methods: ["+ onLoan(): boolean"] };
const LOAN: ClassSpec = { name: "Loan", fields: ["- dueDay: int"], methods: ["+ overdueOn(day): boolean", "+ daysLate(day): int"] };
const MEMBER: ClassSpec = { name: "Member", fields: ["- name: String", "- loans: List<Loan>"] };

function libraryClasses(): Walkthrough {
  const probe = (spec: ClassSpec) => classBox("p", spec, { size: SIZE });
  const bw = probe(BOOK).w;
  const lw = probe(LOAN).w;
  const mw = probe(MEMBER).w;
  const libW = probe(LIBRARY).w;
  const GAP = 50;
  const total = bw + GAP + lw + GAP + mw;
  const lib0 = probe(LIBRARY);
  const rowY = lib0.h + 70;
  const at = { lib: (total - libW) / 2, book: 0, loan: bw + GAP, member: bw + GAP + lw + GAP };

  const draw = (id: string, spec: ClassSpec, x: number, y: number, tone: Tone, lit?: (line: string) => TextTone | undefined) => classBox(id, spec, { x, y, size: SIZE, tone, lineTone: lit });
  const rules = (line: string): TextTone | undefined => (/overdue/.test(line) ? "accent" : undefined);

  const frame = (n: number): Item[] => {
    const tone = (k: number): Tone => (n === k ? "accent" : "plain");
    const lineTone = (k: number) => (n === k ? "accent" : "ink");
    const lib = draw("lib", LIBRARY, at.lib, 0, tone(0), n === 4 ? rules : undefined);
    const items: Item[] = [...lib.items];
    if (n >= 1) {
      const book = draw("book", BOOK, at.book, rowY, tone(1));
      items.push(...book.items, ...umlLink("lb", { x: lib.x + 30, y: lib.y + lib.h }, book.top, "composes", { tone: lineTone(1) }), label("lb-n", "0..*", book.top.x + 24, rowY - 10, { size: 10.5, mono: true }));
    }
    if (n >= 2) {
      const member = draw("member", MEMBER, at.member, rowY, tone(2));
      items.push(...member.items, ...umlLink("lm", { x: lib.x + lib.w - 30, y: lib.y + lib.h }, member.top, "composes", { tone: lineTone(2) }), label("lm-n", "0..*", member.top.x - 24, rowY - 10, { size: 10.5, mono: true }));
    }
    if (n >= 3) {
      const loan = draw("loan", LOAN, at.loan, rowY, tone(3), n === 4 ? rules : undefined);
      const y = rowY + 40;
      items.push(
        ...loan.items,
        ...umlLink("ob", { x: loan.x, y }, { x: at.book + bw, y }, "associates", { tone: lineTone(3) }),
        label("ob-n", "0..1", at.book + bw + 14, y - 9, { size: 10.5, mono: true }),
        ...umlLink("om", { x: loan.x + lw, y }, { x: at.member, y }, "associates", { tone: lineTone(3) }),
        label("om-n", "0..2", at.member - 14, y - 9, { size: 10.5, mono: true }),
      );
    }
    return items;
  };

  const frames: Frame[] = [
    { caption: "Library is the class the desk calls: it finds books and members by key and offers the verbs of the brief — add, join, borrow, give back, list overdue.", items: frame(0) },
    { caption: "The library owns its books — composition, a filled diamond at the owner. A Book knows its id and title, and whether it is out right now.", items: frame(1) },
    { caption: "Members are owned the same way. A Member holds its own loans, which is what the two-book limit is counted from.", items: frame(2) },
    { caption: "The due day belongs to neither side, so the link gets a class: a Loan points at one book and one member. A book has at most one loan, a member at most two.", items: frame(3) },
    { caption: "Each rule sits with its data: overdueOn and daysLate read only the due day, so they live on Loan, and Library.overdue just asks each loan.", items: frame(4) },
  ];
  return finish({ title: "Library desk: from the brief's nouns to four classes", input: "", frames });
}

/* ── The run ──────────────────────────────────────────────────────── */

type Cmd = { op: "BORROW"; name: string; id: string; day: number } | { op: "RETURN"; id: string; day: number } | { op: "OVERDUE"; day: number };

const BOOKS: Array<{ id: string; title: string }> = [
  { id: "B1", title: "Dune" },
  { id: "B2", title: "Emma" },
];
const MEMBERS = ["ada", "bo"];
const SCRIPT: Cmd[] = [
  { op: "BORROW", name: "ada", id: "B1", day: 1 },
  { op: "BORROW", name: "bo", id: "B1", day: 2 },
  { op: "BORROW", name: "bo", id: "B2", day: 3 },
  { op: "OVERDUE", day: 16 },
  { op: "RETURN", id: "B1", day: 20 },
  { op: "OVERDUE", day: 18 },
];
/** The exercise's visible case prints these for the six commands above. */
const PRINTED = ['ada borrowed B1 "Dune", due day 15', "error: B1 is on loan", 'bo borrowed B2 "Emma", due day 17', "overdue: B1", "B1 returned 5 days late", "overdue: B2"];

type State = { loans: Map<string, { member: string; due: number }> };

function step(s: State, c: Cmd): { line: string; refused: boolean; touched: string[] } {
  if (c.op === "BORROW") {
    if (s.loans.has(c.id)) return { line: `error: ${c.id} is on loan`, refused: true, touched: [c.id] };
    const held = [...s.loans.values()].filter((l) => l.member === c.name).length;
    if (held >= 2) return { line: `error: ${c.name} already has 2 books`, refused: true, touched: [c.name] };
    s.loans.set(c.id, { member: c.name, due: c.day + 14 });
    return { line: `${c.name} borrowed ${c.id} "${BOOKS.find((b) => b.id === c.id)!.title}", due day ${c.day + 14}`, refused: false, touched: [c.id, c.name] };
  }
  if (c.op === "RETURN") {
    const loan = s.loans.get(c.id);
    if (!loan) return { line: `error: ${c.id} is not on loan`, refused: true, touched: [c.id] };
    s.loans.delete(c.id);
    const late = Math.max(0, c.day - loan.due);
    return { line: late === 0 ? `${c.id} returned on time` : `${c.id} returned ${late} ${late === 1 ? "day" : "days"} late`, refused: false, touched: [c.id, loan.member] };
  }
  const ids = BOOKS.map((b) => b.id).filter((id) => {
    const l = s.loans.get(id);
    return l !== undefined && c.day > l.due;
  });
  return { line: `overdue: ${ids.length ? ids.join(" ") : "none"}`, refused: false, touched: ids };
}

const cmdText = (c: Cmd) => (c.op === "BORROW" ? `BORROW ${c.name} ${c.id} ${c.day}` : c.op === "RETURN" ? `RETURN ${c.id} ${c.day}` : `OVERDUE ${c.day}`);

function borrowRun(): Walkthrough {
  const s: State = { loans: new Map() };
  const H = 30;
  const ROW = 38;
  const MX = 300;

  // An OVERDUE frame marks the late books red; elsewhere red is a refusal.
  const draw = (cmd: string | null, line: string | null, refused: boolean, touched: string[], late = false): Item[] => {
    const items: Item[] = [
      label("h-b", "books", 0, -12, { anchor: "start", weight: 600 }),
      label("h-m", "members", MX, -12, { anchor: "start", weight: 600 }),
    ];
    BOOKS.forEach((b, i) => {
      const y = i * ROW;
      const loan = s.loans.get(b.id);
      const hot = touched.includes(b.id);
      const tone: Tone = hot ? (refused || late ? "error" : "accent") : loan ? "strong" : "plain";
      items.push(box(`b${b.id}`, 0, y, b.id, { w: 40, h: H, size: 12 }));
      items.push(box(`t${b.id}`, 44, y, b.title, { w: 64, h: H, size: 12 }));
      items.push(box(`s${b.id}`, 112, y, loan ? `${loan.member} · due ${loan.due}` : "on the shelf", { w: 140, h: H, tone, size: 12 }));
    });
    MEMBERS.forEach((m, i) => {
      const n = [...s.loans.values()].filter((l) => l.member === m).length;
      items.push(box(`m${m}`, MX, i * ROW, `${m} · ${n}/2 books`, { w: 120, h: H, tone: touched.includes(m) ? "accent" : "plain", size: 12 }));
    });
    const y = BOOKS.length * ROW + 18;
    items.push({ k: "text", id: "cmd", x: 0, y, text: cmd ?? "after ADD B1, ADD B2, JOIN ada, JOIN bo", tone: "soft", anchor: "start", size: 12, mono: true });
    if (line) items.push({ k: "text", id: "out", x: 0, y: y + 22, text: `→ ${line}`, tone: refused ? "error" : "accent", anchor: "start", size: 12, mono: true, weight: 600 });
    return items;
  };

  const frames: Frame[] = [{ caption: "The state after the ADD and JOIN lines: two books on the shelf, two members holding nothing. Every later command is one method call on this model.", items: draw(null, null, false, []) }];
  const printed: string[] = [];
  SCRIPT.forEach((c) => {
    const r = step(s, c);
    printed.push(r.line);
    let caption: string;
    if (c.op === "BORROW" && !r.refused) caption = `${c.name} borrows ${c.id} on day ${c.day}: a new Loan links the book and the member, due on day ${c.day + 14}, and both sides point at it.`;
    else if (c.op === "BORROW") caption = `${c.name} asks for ${c.id}, but the book already holds a loan. The Book refuses with an exception and main prints it after "error:"; nothing changes.`;
    else if (c.op === "RETURN") caption = `${c.id} comes back on day ${c.day}. The loan ends, the member is down a book, and Loan.daysLate works out the ${r.line.match(/\d+ days?/)?.[0] ?? "no days"} late.`;
    else caption = `OVERDUE ${c.day} asks every loan whether day ${c.day} is past its due day: ${r.touched.length ? r.touched.join(", ") : "none"}. Nothing is stored, so tomorrow's answer is never stale.`;
    frames.push({ caption, items: draw(cmdText(c), r.line, r.refused, r.touched, c.op === "OVERDUE") });
  });
  if (printed.join("\n") !== PRINTED.join("\n")) throw new Error(`borrow-run: the model printed ${JSON.stringify(printed)}`);
  return finish({ title: "The library desk running the exercise's first case", input: "ADD B1 Dune, ADD B2 Emma, JOIN ada, JOIN bo, then six commands", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "library-classes": libraryClasses,
  "borrow-run": borrowRun,
};
