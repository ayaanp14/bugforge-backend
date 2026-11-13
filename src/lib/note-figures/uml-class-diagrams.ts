import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec, type UmlKind } from "./kit.js";

/**
 * UML Class Diagrams for LLD Interviews: the note's figures
 * (content/notes/low-level-design/uml-class-diagrams.md). All loop; class
 * boxes keep their ids so a diagram grows in place:
 *
 *  - class-box-anatomy: one class built compartment by compartment, then
 *    every visibility marker named;
 *  - relations: the six relationships, one row a frame, each drawn by
 *    kit.ts umlLink with the notation the row names;
 *  - multiplicity: Member 1 — 0..3 Loan, with a small model borrowing
 *    books until the rule refuses the fourth loan;
 *  - library-model: the note's library, one class and its relation a frame.
 */

/* ── Anatomy of a class box ───────────────────────────────────────── */

function classBoxAnatomy(): Walkthrough {
  const full: ClassSpec = { name: "Book", fields: ["- isbn: String", "- title: String", "# copies: int"], methods: ["+ isAvailable(): bool", "+ borrow(m: Member): Loan", "~ restock(n: int): void"] };
  const X = 80;
  const W = 200;
  const b = (spec: ClassSpec, tone: (l: string) => "accent" | undefined = () => undefined) => classBox("book", spec, { x: X, y: 0, w: W, lineTone: tone });
  const whole = b(full);
  const head = 26;
  const fh = full.fields!.length * 16 + 8;
  const rowY = (compartment: "f" | "m", i: number) => (compartment === "f" ? head + 4 + 8 + i * 16 : head + fh + 4 + 8 + i * 16);
  const side = (id: string, text: string, y: number) => label(id, text, X - 12, y, { anchor: "end", size: 11, tone: "accent", weight: 600 });
  const VIS: Record<string, string> = { "-": "private", "+": "public", "#": "protected", "~": "package" };
  const vis = (): Item[] => {
    const out: Item[] = [];
    full.fields!.forEach((f, i) => out.push(label(`vf${i}`, `${f[0]} ${VIS[f[0]!]}`, X + W + 12, rowY("f", i), { anchor: "start", size: 11, tone: "accent", mono: true })));
    full.methods!.forEach((m, i) => out.push(label(`vm${i}`, `${m[0]} ${VIS[m[0]!]}`, X + W + 12, rowY("m", i), { anchor: "start", size: 11, tone: "accent", mono: true })));
    return out;
  };
  for (const l of [...full.fields!, ...full.methods!]) if (!VIS[l[0]!]) throw new Error(`class-box-anatomy: no visibility on ${l}`);
  const frames: Frame[] = [
    { caption: "A class box starts with its name in the top compartment. An abstract class or interface adds a stereotype such as «interface» above the name.", items: [...b({ name: "Book" }).items, side("sn", "name", 17)] },
    { caption: "The middle compartment lists fields as visibility, name, colon, type: - isbn: String is a private field holding a String.", items: [...b({ name: "Book", fields: full.fields }).items, side("sn", "name", 17), side("sf", "fields", rowY("f", 1))] },
    { caption: "The bottom compartment lists methods with parameters and a return type. borrow(m: Member): Loan takes a Member and returns a Loan.", items: [...b(full, (l) => (full.methods!.includes(l) ? "accent" : undefined)).items, side("sn", "name", 17), side("sf", "fields", rowY("f", 1)), side("sm", "methods", rowY("m", 1))] },
    { caption: "The first character is the visibility: minus private, plus public, hash protected, tilde package. Fields private, methods public is the usual default.", items: [...whole.items, side("sn", "name", 17), side("sf", "fields", rowY("f", 1)), side("sm", "methods", rowY("m", 1)), ...vis()] },
  ];
  return finish({ title: "Anatomy of a UML class box", input: "", frames });
}

/* ── The six relationships ────────────────────────────────────────── */

const RELATIONS: Array<{ kind: UmlKind; name: string; left: ClassSpec; right: ClassSpec; notation: string; reads: string }> = [
  { kind: "associates", name: "Association", left: { name: "Member" }, right: { name: "Book" }, notation: "solid line, open arrow", reads: "a member knows the books it has" },
  { kind: "aggregates", name: "Aggregation", left: { name: "Library" }, right: { name: "Member" }, notation: "hollow diamond at the whole", reads: "members outlive the library" },
  { kind: "composes", name: "Composition", left: { name: "Library" }, right: { name: "Shelf" }, notation: "filled diamond at the whole", reads: "shelves die with the library" },
  { kind: "inherits", name: "Inheritance", left: { name: "EBook" }, right: { name: "Book" }, notation: "solid line, hollow triangle", reads: "an e-book is a book" },
  { kind: "implements", name: "Realization", left: { name: "Book" }, right: { name: "Borrowable", stereotype: "interface" }, notation: "dashed line, hollow triangle", reads: "Book implements Borrowable" },
  { kind: "depends", name: "Dependency", left: { name: "FineCalc" }, right: { name: "Loan" }, notation: "dashed line, open arrow", reads: "uses a Loan only as a parameter" },
];

function relations(): Walkthrough {
  const W = 92;
  const GAP = 96;
  const RH = 64;
  const TX = 2 * W + GAP + 16;
  const row = (r: (typeof RELATIONS)[number], i: number, lit: boolean): Item[] => {
    const y = i * RH;
    const left = classBox(`l${i}`, r.left, { x: 0, y, w: W, tone: lit ? "accent" : "plain" });
    const right = classBox(`r${i}`, r.right, { x: W + GAP, y: r.right.stereotype ? y - 6 : y, w: W, tone: lit ? "accent" : "plain" });
    const ly = y + 21;
    return [
      ...left.items,
      ...right.items,
      ...umlLink(`k${i}`, { x: W, y: ly }, { x: W + GAP, y: ly }, r.kind, { tone: lit ? "accent" : "ink" }),
      label(`n${i}`, r.name, TX, y + 14, { anchor: "start", size: 12, weight: 700, tone: lit ? "accent" : "ink" }),
      label(`d${i}`, r.notation, TX, y + 30, { anchor: "start", size: 11, tone: "soft" }),
    ];
  };
  const frames: Frame[] = RELATIONS.map((r, k) => ({
    caption: `${r.name}: ${r.notation}. Read it as "${r.reads}".`,
    items: RELATIONS.slice(0, k + 1).flatMap((x, i) => row(x, i, i === k)),
  }));
  return finish({ title: "The six class relationships and how UML draws them", input: "", frames });
}

/* ── Multiplicity ─────────────────────────────────────────────────── */

function multiplicity(): Walkthrough {
  const MAX = 3; // the 0..3 end: a member holds at most three loans
  const member = classBox("cm", { name: "Member", fields: ["- name: String"], methods: ["+ borrow(b: Book)"] }, { x: 0, y: 0, w: 140 });
  const loan = classBox("cl", { name: "Loan", fields: ["- due: Date"], methods: ["+ close()"] }, { x: 280, y: 0, w: 130 });
  const LY = 13;
  const diagram: Item[] = [
    ...member.items,
    ...loan.items,
    ...umlLink("ml", { x: member.right.x, y: LY }, { x: loan.x, y: LY }, "associates"),
    label("m1", "1", member.right.x + 8, LY - 8, { anchor: "start", size: 11.5, mono: true, tone: "accent", weight: 700 }),
    label("m2", `0..${MAX}`, loan.x - 8, LY - 8, { anchor: "end", size: 11.5, mono: true, tone: "accent", weight: 700 }),
  ];
  // The model: asha borrows four books; the class enforces the 0..3 end.
  const books = ["Dune", "Emma", "Ulysses", "Beloved"];
  const loans: string[] = [];
  const results: Array<{ book: string; ok: boolean }> = [];
  for (const book of books) {
    const ok = loans.length < MAX;
    if (ok) loans.push(book);
    results.push({ book, ok });
  }
  if (results.filter((r) => r.ok).length !== MAX || results[3]!.ok) throw new Error("multiplicity: the fourth loan must be refused");

  const OY = member.h + 56;
  const objects = (k: number): Item[] => {
    const items: Item[] = [label("ot", "objects at run time", 0, OY - 16, { anchor: "start", size: 11, tone: "soft", weight: 600 }), box("asha", 0, OY + 40, "asha: Member", { w: 140, h: 32, size: 12 })];
    for (let i = 0; i <= k - 1 && i < results.length; i++) {
      const r = results[i]!;
      const y = OY + i * 42;
      const fresh = i === k - 1;
      items.push(box(`o${i}`, 280, y, `${r.ok ? `L${i + 1}` : "L?"}: ${r.book}`, { w: 130, h: 32, tone: !r.ok ? "error" : fresh ? "accent" : "plain", size: 12 }));
      items.push({ k: "edge", id: `oe${i}`, x1: 140, y1: OY + 56, x2: 280, y2: y + 16, tone: !r.ok ? "error" : fresh ? "accent" : "line", dashed: !r.ok });
      if (!r.ok) items.push(label("refused", `refused: already ${MAX}`, 345, y + 50, { size: 11, tone: "error", weight: 600 }));
    }
    return items;
  };
  const frames: Frame[] = [
    { caption: `Multiplicity is written at each end of a line: one Member has 0..${MAX} Loans, and each Loan belongs to exactly 1 Member.`, items: [...diagram, ...objects(0)] },
    ...results.map((r, i) => ({
      caption: r.ok
        ? i === MAX - 1
          ? `asha borrows ${r.book}: ${i + 1} loans, the upper bound of 0..${MAX}. The diagram allows exactly this many links from one Member.`
          : `asha borrows ${r.book}, creating loan ${i + 1}. The member end says 1: this loan links to asha and to nobody else.`
        : `A fourth borrow would break 0..${MAX}, so borrow refuses it. Multiplicity is a rule the code must enforce, not just a label.`,
      items: [...diagram, ...objects(i + 1)],
    })),
  ];
  return finish({ title: "Multiplicity: how many objects sit at each end", input: "Member 1 — 0..3 Loan; asha borrows four books", frames });
}

/* ── The library model ────────────────────────────────────────────── */

function libraryModel(): Walkthrough {
  const W = 132;
  const C = [0, 196, 392];
  const R = [0, 150];
  const specs: Record<string, ClassSpec> = {
    library: { name: "Library", fields: ["- name: String"], methods: ["+ join(m: Member)"] },
    book: { name: "Book", fields: ["- isbn: String"], methods: ["+ isAvailable()"] },
    member: { name: "Member", fields: ["- loans: Loan[]"], methods: ["+ borrow(b: Book)"] },
    loan: { name: "Loan", fields: ["- due: Date"], methods: ["+ isLate(): bool"] },
    borrowable: { name: "Borrowable", stereotype: "interface", methods: ["+ isAvailable()"] },
    fine: { name: "FineCalc", methods: ["+ fine(l: Loan)"] },
  };
  const at: Record<string, [number, number]> = { library: [0, 0], book: [1, 0], borrowable: [2, 0], member: [0, 1], loan: [1, 1], fine: [2, 1] };
  const boxOf = (k: string, tone?: "accent") => classBox(k, specs[k]!, { x: C[at[k]![0]]!, y: R[at[k]![1]]! - (specs[k]!.stereotype ? 12 : 0), w: W, tone });
  const B = Object.fromEntries(Object.keys(specs).map((k) => [k, boxOf(k)])) as Record<string, ReturnType<typeof classBox>>;
  const mult = (id: string, text: string, x: number, y: number, anchor: "start" | "end" = "start") => label(id, text, x, y, { anchor, size: 10.5, mono: true });
  const hy = (k: string) => B[k]!.y + 13 + (specs[k]!.stereotype ? 12 : 0);
  const links: Record<string, Item[]> = {
    book: [...umlLink("e-book", { x: W, y: hy("library") }, { x: C[1]!, y: hy("book") }, "aggregates"), mult("e-book-n", "0..*", C[1]! - 6, hy("book") - 8, "end")],
    member: [...umlLink("e-mem", B["library"]!.bottom, B["member"]!.top, "aggregates"), mult("e-mem-n", "0..*", B["member"]!.top.x + 8, B["member"]!.y - 10)],
    loan: [
      ...umlLink("e-loan", { x: W, y: hy("member") }, { x: C[1]!, y: hy("loan") }, "associates"),
      mult("e-loan-a", "1", W + 6, hy("member") - 8),
      mult("e-loan-b", "0..3", C[1]! - 6, hy("loan") - 8, "end"),
      ...umlLink("e-lb", B["loan"]!.top, B["book"]!.bottom, "associates"),
      mult("e-lb-a", "0..*", B["loan"]!.top.x + 8, B["loan"]!.y - 10),
      mult("e-lb-b", "1", B["book"]!.bottom.x + 8, B["book"]!.bottom.y + 14),
    ],
    borrowable: [...umlLink("e-real", { x: C[1]! + W, y: hy("book") }, { x: C[2]!, y: hy("book") }, "implements")],
    fine: [...umlLink("e-dep", { x: C[2]!, y: hy("fine") }, { x: C[1]! + W, y: hy("loan") }, "depends")],
  };
  const order: Array<{ k: string; caption: string }> = [
    { k: "library", caption: "The library example starts from Library, the class the use cases enter through: members join it and borrow its books." },
    { k: "book", caption: "Library aggregates 0..* Books (hollow diamond): a book record can outlive one library, for example when a branch closes." },
    { k: "member", caption: "Library also aggregates 0..* Members. A member account exists on its own and could belong to another branch." },
    { k: "loan", caption: "A Loan links one Member to one Book: Member 1 to 0..3 Loan caps the loans, and each Loan points at exactly 1 Book." },
    { k: "borrowable", caption: "Book realizes the Borrowable interface (dashed line, hollow triangle), so a DVD could later be lent through the same code." },
    { k: "fine", caption: "FineCalc depends on Loan (dashed arrow): it only takes a Loan as a parameter and keeps no reference to it." },
  ];
  const shown: string[] = [];
  const frames: Frame[] = order.map(({ k, caption }) => {
    shown.push(k);
    const items: Item[] = [];
    for (const s of shown) items.push(...(s === k ? boxOf(s, "accent").items : B[s]!.items));
    for (const s of shown) for (const it of links[s] ?? []) items.push(s === k && it.k !== "text" ? ({ ...it, tone: "accent" } as Item) : it);
    return { caption, items };
  });
  return finish({ title: "A library system's class diagram, built up", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "class-box-anatomy": classBoxAnatomy,
  relations,
  multiplicity,
  "library-model": libraryModel,
};
