import { finish, round, type Frame, type Item, type LineTone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, type Pt } from "../lesson-figures/kit.js";
import { attribute, boxRim, diamondRim, entity, ovalRim, relation } from "./kit.js";

/**
 * ER Model in DBMS: the note's figures (content/notes/dbms/er-model.md
 * places each with "@figure <name>").
 *
 * The library of the worked example is one data structure (LIBRARY below):
 * its entity sets with their attributes, and its relationships with
 * cardinality and participation. The ER diagram is drawn from it, and the
 * ER-to-tables figure runs the mapping rules on it — so the diagram and the
 * tables cannot disagree, and the generator checks the tables against the
 * seven the note lists.
 *
 *  - chen-symbols: the Chen notation, each shape drawn with a name from the library.
 *  - cardinality: relationship instances as lines between entities; the
 *    1:1 / 1:N / M:N label and total/partial participation are computed
 *    from the pairs.
 *  - weak-entity: Book, has, Copy, and copy rows on which copy_no alone
 *    repeats while (isbn, copy_no) does not — both checked on the rows.
 *  - library-er: the library's diagram, one relationship a frame.
 *  - er-to-tables: the mapping rules applied to LIBRARY, a step a frame.
 */

/* ── The worked example, as data ──────────────────────────────────── */

type Attr = { name: string; key?: boolean; partial?: boolean; multivalued?: boolean; derived?: boolean; parts?: string[] };
type Ent = { name: string; attrs: Attr[]; owner?: string };
type Rel = { name: string; a: string; b: string; card: "1:N" | "M:N" | "1:1"; total: string[]; identifying?: boolean; attrs?: string[] };

const LIBRARY: { entities: Ent[]; relations: Rel[] } = {
  entities: [
    { name: "Publisher", attrs: [{ name: "publisher_id", key: true }, { name: "name" }, { name: "city" }] },
    { name: "Book", attrs: [{ name: "isbn", key: true }, { name: "title" }, { name: "year" }] },
    { name: "Author", attrs: [{ name: "author_id", key: true }, { name: "name" }] },
    { name: "Copy", owner: "Book", attrs: [{ name: "copy_no", partial: true }, { name: "shelf" }] },
    {
      name: "Member",
      attrs: [
        { name: "member_id", key: true },
        { name: "name", parts: ["first_name", "last_name"] },
        { name: "phone", multivalued: true },
        { name: "date_of_birth" },
        { name: "age", derived: true },
      ],
    },
  ],
  // `a` is the "one" side of a 1:N; for M:N, the order of the new table's columns.
  relations: [
    { name: "publishes", a: "Publisher", b: "Book", card: "1:N", total: ["Book"] },
    { name: "writes", a: "Book", b: "Author", card: "M:N", total: ["Book"] },
    { name: "has", a: "Book", b: "Copy", card: "1:N", total: ["Copy"], identifying: true },
    { name: "borrows", a: "Member", b: "Copy", card: "1:N", total: [], attrs: ["issue_date", "due_date"] },
  ],
};

const ent = (n: string) => LIBRARY.entities.find((e) => e.name === n)!;
const rel = (n: string) => LIBRARY.relations.find((r) => r.name === n)!;

/* ── Shapes and lines ─────────────────────────────────────────────── */

type Shape = { kind: "box" | "diamond" | "oval"; c: Pt; w: number; h: number };
const rim = (s: Shape, p: Pt): Pt => (s.kind === "box" ? boxRim(s.c, s.w, s.h, p) : s.kind === "diamond" ? diamondRim(s.c, s.w, s.h, p) : ovalRim(s.c, s.w / 2, s.h / 2, p));

/** A line between two shapes, rim to rim; `double` draws total participation as two parallel lines. */
function join(id: string, a: Shape, b: Shape, o: { double?: boolean; tone?: LineTone } = {}): Item[] {
  const p = rim(a, b.c);
  const q = rim(b, a.c);
  const tone = o.tone ?? "ink";
  if (!o.double) return [{ k: "edge", id, x1: p.x, y1: p.y, x2: q.x, y2: q.y, tone }];
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
  const nx = (-(q.y - p.y) / len) * 2.2;
  const ny = ((q.x - p.x) / len) * 2.2;
  return [
    { k: "edge", id, x1: round(p.x + nx), y1: round(p.y + ny), x2: round(q.x + nx), y2: round(q.y + ny), tone },
    { k: "edge", id: `${id}-2`, x1: round(p.x - nx), y1: round(p.y - ny), x2: round(q.x - nx), y2: round(q.y - ny), tone },
  ];
}

/** A cardinality mark (1, N, M) beside a line, just off the entity's end of it. */
function cardMark(id: string, e: Shape, r: Shape, text: string, side = 1, tone: "ink" | "accent" = "ink"): Item {
  const p = rim(e, r.c);
  const len = Math.hypot(r.c.x - e.c.x, r.c.y - e.c.y) || 1;
  const ux = (r.c.x - e.c.x) / len;
  const uy = (r.c.y - e.c.y) / len;
  return { k: "text", id, x: round(p.x + ux * 12 - uy * 10 * side), y: round(p.y + uy * 12 + ux * 10 * side), text, tone, anchor: "middle", size: 12, mono: true, weight: 700 };
}

/** A dashed underline: a weak entity's partial key. */
const dashUnder = (id: string, c: Pt, name: string): Item => {
  const half = (name.length * 11.5 * 0.6) / 2;
  return { k: "path", id, pts: [[round(c.x - half), c.y + 8], [round(c.x + half), c.y + 8]], tone: "ink", width: 1.1, dashed: true };
};

/** An attribute oval with its line to its owner; a partial key gets a dashed underline. */
function attrOf(id: string, owner: Shape, c: Pt, a: Attr): { items: Item[]; shape: Shape } {
  const at = attribute(id, c.x, c.y, a.name, { key: a.key, derived: a.derived, multivalued: a.multivalued });
  const shape: Shape = { kind: "oval", c, w: at.rx * 2, h: at.ry * 2 };
  const items = [...join(`${id}-l`, shape, owner, { tone: "line" }), ...at.items];
  if (a.partial) items.push(dashUnder(`${id}-u`, c, a.name));
  return { items, shape };
}

/* ── Chen notation ────────────────────────────────────────────────── */

function chenSymbols(): Walkthrough {
  const items: Item[] = [];
  const ROW = 52;
  const L = { sym: 50, text: 112 };
  const R = { sym: 316, text: 376 };
  const say = (id: string, x: number, y: number, text: string) => items.push(label(`${id}-x`, text, x, y, { anchor: "start", tone: "ink", size: 11.5 }));
  const member = ent("Member");
  const copy = ent("Copy");
  const pick = (e: Ent, f: (a: Attr) => boolean | undefined) => {
    const a = e.attrs.find(f);
    if (!a) throw new Error(`chen-symbols: ${e.name} has no such attribute`);
    return a;
  };

  // Left column: entity sets, relationships, lines.
  let y = 0;
  items.push(...entity("e", L.sym, y, member.name, { w: 90, h: 32 }).items);
  say("e", L.text, y, "entity set");
  y += ROW;
  if (!copy.owner) throw new Error("chen-symbols: Copy should be weak");
  items.push(...entity("w", L.sym, y, copy.name, { w: 90, h: 34, weak: true }).items);
  say("w", L.text, y, "weak entity set");
  y += ROW;
  items.push(...relation("r", L.sym, y, rel("borrows").name, { w: 96, h: 40 }).items);
  say("r", L.text, y, "relationship set");
  y += ROW;
  const ident = LIBRARY.relations.find((x) => x.identifying)!;
  items.push(...relation("ir", L.sym, y, ident.name, { w: 96, h: 40, identifying: true }).items);
  say("ir", L.text, y, "identifying relationship");
  y += ROW;
  const line = (id: string, yy: number, double: boolean) => items.push(...join(id, { kind: "box", c: { x: L.sym - 46, y: yy }, w: 0, h: 0 }, { kind: "box", c: { x: L.sym + 46, y: yy }, w: 0, h: 0 }, { double }));
  line("tp", y, true);
  say("tp", L.text, y, "total participation");
  y += ROW - 12;
  line("pp", y, false);
  say("pp", L.text, y, "partial participation");
  y += ROW - 12;
  line("cd", y, false);
  items.push(label("cd1", "1", L.sym - 40, y - 10, { tone: "ink", size: 12, mono: true, weight: 700 }), label("cd2", "N", L.sym + 40, y - 10, { tone: "ink", size: 12, mono: true, weight: 700 }));
  say("cd", L.text, y, "cardinality: 1, N or M");

  // Right column: the attribute kinds, all from Member and Copy.
  y = 0;
  const oval = (id: string, a: Attr, yy: number) => {
    const at = attribute(id, R.sym, yy, a.name, { key: a.key, derived: a.derived, multivalued: a.multivalued });
    items.push(...at.items);
    if (a.partial) items.push(dashUnder(`${id}-u`, { x: R.sym, y: yy }, a.name));
  };
  oval("a", pick(copy, (a) => !a.partial && !a.key), y);
  say("a", R.text, y, "attribute");
  y += ROW;
  oval("k", pick(member, (a) => a.key), y);
  say("k", R.text, y, "key attribute");
  y += ROW;
  oval("pk", pick(copy, (a) => a.partial), y);
  say("pk", R.text, y, "partial key");
  y += ROW;
  oval("mv", pick(member, (a) => a.multivalued), y);
  say("mv", R.text, y, "multi-valued attribute");
  y += ROW;
  oval("dv", pick(member, (a) => a.derived), y);
  say("dv", R.text, y, "derived attribute");
  y += ROW;
  const comp = pick(member, (a) => a.parts !== undefined);
  const top = attribute("cp", R.sym, y, comp.name);
  items.push(...top.items);
  const topShape: Shape = { kind: "oval", c: { x: R.sym, y }, w: top.rx * 2, h: top.ry * 2 };
  comp.parts!.forEach((p, i) => {
    const c = { x: R.sym + (i ? 44 : -44), y: y + 44 };
    const short = p.replace(/_name$/, "");
    const at = attribute(`cp${i}`, c.x, c.y, short, { rx: 36, ry: 13 });
    items.push(...join(`cp${i}-l`, { kind: "oval", c, w: 72, h: 26 }, topShape, { tone: "line" }), ...at.items);
  });
  say("cp", R.text, y, "composite attribute");
  return finish({
    title: "Chen notation, drawn with the library's own names",
    input: "",
    frames: [
      {
        caption: "Rectangles are entity sets and diamonds relationships, doubled for a weak entity and the relationship that identifies it. Ovals are attributes: the key underlined, a partial key dash-underlined, multi-valued doubled, derived dashed, and a composite one split into its parts.",
        items,
      },
    ],
  });
}

/* ── Cardinality and participation, on instances ──────────────────── */

function cardinality(): Walkthrough {
  const panels: Array<{ verb: string; left: string; right: string; ls: string[]; rs: string[]; pairs: Array<[string, string]>; want: string }> = [
    { verb: "headed by", left: "Department", right: "Professor", ls: ["CSE", "ECE", "ME"], rs: ["Rao", "Iyer", "Sen", "Khan"], pairs: [["CSE", "Rao"], ["ECE", "Iyer"], ["ME", "Sen"]], want: "1:1" },
    { verb: "publishes", left: "Publisher", right: "Book", ls: ["P1", "P2", "P3"], rs: ["B1", "B2", "B3", "B4"], pairs: [["P1", "B1"], ["P1", "B2"], ["P2", "B3"], ["P2", "B4"]], want: "1:N" },
    { verb: "writes", left: "Author", right: "Book", ls: ["A1", "A2", "A3"], rs: ["B1", "B2", "B3"], pairs: [["A1", "B1"], ["A1", "B2"], ["A2", "B2"], ["A3", "B3"]], want: "M:N" },
  ];
  const items: Item[] = [];
  const BW = 44;
  const BH = 22;
  const PW = 148;
  const GAP = 30;
  const STEP = 30;
  const read: string[] = [];
  panels.forEach((p, k) => {
    const x0 = k * (PW + GAP);
    // The most partners any one entity has, on each side, and who has none.
    const most = (side: 0 | 1) => Math.max(...(side ? p.ls : p.rs).map((v) => p.pairs.filter((q) => q[side ? 0 : 1] === v).length));
    const lMax = most(0);
    const rMax = most(1);
    const card = `${lMax > 1 ? "M" : "1"}:${rMax > 1 ? "N" : "1"}`;
    if (card !== p.want) throw new Error(`cardinality: ${p.verb} reads ${card}, expected ${p.want}`);
    const lonely = (vs: string[], side: 0 | 1) => vs.filter((v) => !p.pairs.some((q) => q[side] === v));
    const lOut = lonely(p.ls, 0);
    const rOut = lonely(p.rs, 1);
    read.push(`${p.left} ${p.verb} ${p.right} is ${card}`);
    items.push(label(`t${k}`, `${card}  ${p.verb}`, x0 + PW / 2, -46, { tone: "ink", weight: 700, size: 12.5 }));
    items.push(label(`hl${k}`, p.left, x0 + BW / 2, -24, { tone: "soft", size: 11 }));
    items.push(label(`hr${k}`, p.right, x0 + PW - BW / 2, -24, { tone: "soft", size: 11 }));
    const ly = (i: number) => i * STEP + (Math.max(p.ls.length, p.rs.length) - p.ls.length) * (STEP / 2);
    const ry = (i: number) => i * STEP + (Math.max(p.ls.length, p.rs.length) - p.rs.length) * (STEP / 2);
    p.pairs.forEach(([l, r], i) => {
      const a = p.ls.indexOf(l);
      const b = p.rs.indexOf(r);
      items.push({ k: "edge", id: `p${k}-${i}`, x1: x0 + BW + 1, y1: ly(a) + BH / 2, x2: x0 + PW - BW - 1, y2: ry(b) + BH / 2, tone: "accent" });
    });
    p.ls.forEach((v, i) => items.push(box(`l${k}-${i}`, x0, ly(i), v, { w: BW, h: BH, size: 11, tone: lOut.includes(v) ? "muted" : "plain" })));
    p.rs.forEach((v, i) => items.push(box(`r${k}-${i}`, x0 + PW - BW, ry(i), v, { w: BW, h: BH, size: 11, tone: rOut.includes(v) ? "muted" : "plain" })));
    const bottom = Math.max(p.ls.length, p.rs.length) * STEP + 8;
    items.push(label(`pl${k}`, lOut.length ? "partial" : "total", x0 + BW / 2, bottom, { tone: lOut.length ? "faint" : "accent", size: 11, weight: 600 }));
    items.push(label(`pr${k}`, rOut.length ? "partial" : "total", x0 + PW - BW / 2, bottom, { tone: rOut.length ? "faint" : "accent", size: 11, weight: 600 }));
  });
  return finish({
    title: "Cardinality and participation, read off the relationship's pairs",
    input: "",
    frames: [
      {
        caption: "Each line is one related pair. Cardinality is the most partners one entity has on each side: each department has one head (1:1), a publisher many books but a book one publisher (1:N), authors and books many of each (M:N). A grey entity takes part in no pair, so its side's participation is partial.",
        items,
      },
    ],
  });
}

/* ── A weak entity ────────────────────────────────────────────────── */

function weakEntity(): Walkthrough {
  const book = ent("Book");
  const copy = ent("Copy");
  const has = rel("has");
  if (copy.owner !== book.name || !has.identifying || has.b !== copy.name) throw new Error("weak-entity: Copy should hang off Book through has");
  const ownerKey = book.attrs.find((a) => a.key)!;
  const partial = copy.attrs.find((a) => a.partial)!;
  const other = copy.attrs.find((a) => !a.partial)!;
  const items: Item[] = [];
  const Y = 64;
  const B: Shape = { kind: "box", c: { x: 50, y: Y }, w: 92, h: 36 };
  const H: Shape = { kind: "diamond", c: { x: 200, y: Y }, w: 84, h: 44 };
  const C: Shape = { kind: "box", c: { x: 350, y: Y }, w: 92, h: 36 };
  items.push(...join("bh", B, H), ...join("hc", H, C, { double: has.total.includes(copy.name) }));
  items.push(...entity("B", B.c.x, B.c.y, book.name, { w: B.w, h: B.h }).items);
  items.push(...relation("H", H.c.x, H.c.y, has.name, { w: H.w, h: H.h, identifying: true }).items);
  items.push(...entity("C", C.c.x, C.c.y, copy.name, { w: C.w, h: C.h, weak: true }).items);
  items.push(cardMark("c1", B, H, "1"), cardMark("c2", C, H, "N", -1));
  items.push(...attrOf("ak", B, { x: 50, y: 6 }, ownerKey).items);
  items.push(...attrOf("ap", C, { x: 300, y: 4 }, partial).items);
  items.push(...attrOf("ao", C, { x: 420, y: 10 }, other).items);

  // Copies of two books: copy numbers restart for each book.
  const rows: Array<[string, number, string]> = [
    ["4471", 1, "A3"],
    ["4471", 2, "A3"],
    ["5320", 1, "C1"],
  ];
  const unique = (f: (r: [string, number, string]) => string) => new Set(rows.map(f)).size === rows.length;
  const byPartial = unique((r) => String(r[1]));
  const byFull = unique((r) => `${r[0]}/${r[1]}`);
  if (byPartial || !byFull) throw new Error("weak-entity: the rows should repeat copy_no and not (isbn, copy_no)");
  const repeated = rows.map((r) => r[1]).filter((v, i, all) => all.indexOf(v) !== i)[0];
  const TY = 140;
  const cols = [ownerKey.name, partial.name, other.name];
  const CW = [64, 70, 56];
  const xs = [200, 267, 340];
  cols.forEach((c, i) => items.push(label(`th${i}`, c, xs[i] + CW[i] / 2, TY - 12, { tone: "faint", size: 10.5, mono: true })));
  rows.forEach((r, ri) =>
    r.forEach((v, ci) => items.push(box(`tc${ri}-${ci}`, xs[ci], TY + ri * 27, v, { w: CW[ci], h: 24, size: 11.5, tone: ci === 1 && v === repeated ? "error" : ci < 2 ? "accent" : "plain" }))),
  );
  items.push(label("tl", "copy table", xs[0] - 12, TY + 13, { anchor: "end", tone: "soft", size: 11, weight: 600 }));
  items.push(label("n1", `${partial.name} ${repeated} repeats: not a key alone`, xs[0], TY + 3 * 27 + 14, { anchor: "start", tone: "error", size: 11.5, weight: 600 }));
  items.push(label("n2", `(${ownerKey.name}, ${partial.name}) is unique: the key`, xs[0], TY + 3 * 27 + 32, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
  return finish({
    title: "A weak entity: Copy is identified through Book",
    input: "",
    frames: [
      {
        caption: `Copy has no key of its own: copy ${repeated} exists for more than one book. It is a weak entity (double box) identified through the double diamond, with total participation (double line), and its key is the owner's ${ownerKey.name} plus its partial key ${partial.name}.`,
        items,
      },
    ],
  });
}

/* ── The library's ER diagram ─────────────────────────────────────── */

const AT = {
  Publisher: { x: 47, y: 84 },
  Book: { x: 263, y: 84 },
  Author: { x: 455, y: 84 },
  Copy: { x: 263, y: 270 },
  Member: { x: 47, y: 270 },
  publishes: { x: 158, y: 84 },
  writes: { x: 360, y: 84 },
  has: { x: 263, y: 177 },
  borrows: { x: 158, y: 270 },
} as const;

function libraryEr(): Walkthrough {
  const shapes = new Map<string, Shape>();
  const entShape = (n: keyof typeof AT): Shape => ({ kind: "box", c: AT[n], w: n === "Publisher" ? 90 : 78, h: 34 });
  const relShape = (n: keyof typeof AT): Shape => ({ kind: "diamond", c: AT[n], w: n === "publishes" ? 96 : 80, h: 44 });
  for (const e of LIBRARY.entities) shapes.set(e.name, entShape(e.name as keyof typeof AT));
  for (const r of LIBRARY.relations) shapes.set(r.name, relShape(r.name as keyof typeof AT));

  // Each frame adds one relationship; an entity, its key and its lines appear with the first relationship that needs them.
  const keyAt: Record<string, Pt> = { Publisher: { x: 47, y: 26 }, Book: { x: 263, y: 26 }, Author: { x: 455, y: 26 }, Copy: { x: 362, y: 270 }, Member: { x: 47, y: 206 } };
  const relAttrAt: Record<string, Pt[]> = { borrows: [{ x: 106, y: 336 }, { x: 214, y: 340 }] };
  const shown = new Set<string>();
  const drawn: Item[] = [];
  const frames: Frame[] = [];
  const order = ["publishes", "writes", "has", "borrows"];
  const say: Record<string, (r: Rel) => string> = {
    publishes: (r) => `A publisher publishes many books and every book has exactly one publisher: 1 on the ${r.a} side, N on the ${r.b} side, and a double line because every ${r.b.toLowerCase()} must take part.`,
    writes: (r) => `Authors and books are many-to-many (M:N). Every book has at least one author, so the ${r.a} side is a double line; an author may have no book in the library yet, so that side is single.`,
    has: () => "Copy is weak: a double box, joined to its owner Book by the double diamond has, with total participation. Its partial key copy_no is dash-underlined, because copy 2 means something only for one book.",
    borrows: (r) => `A member may hold several copies and a copy is with at most one member: 1:N, partial on both sides. ${(r.attrs ?? []).join(" and ")} describe the loan itself, so they hang off the diamond, not off either entity.`,
  };
  for (const name of order) {
    const r = rel(name);
    const R = shapes.get(r.name)!;
    const hot: Item[] = [];
    for (const side of [r.a, r.b]) {
      if (shown.has(side)) continue;
      shown.add(side);
      const e = ent(side);
      const S = shapes.get(side)!;
      const key = e.attrs.find((a) => a.key || a.partial)!;
      drawn.push(...attrOf(`k-${side}`, S, keyAt[side], key).items);
      drawn.push(...entity(`e-${side}`, S.c.x, S.c.y, side, { w: S.w, h: S.h, weak: !!e.owner }).items);
    }
    (r.attrs ?? []).forEach((a, i) => hot.push(...attrOf(`ra-${r.name}-${i}`, R, relAttrAt[r.name][i], { name: a }).items));
    const one = r.card === "M:N" ? "M" : "1";
    const many = "N";
    for (const [side, mark] of [[r.a, one], [r.b, many]] as const) {
      const S = shapes.get(side)!;
      hot.push(...join(`j-${r.name}-${side}`, S, R, { double: r.total.includes(side), tone: "accent" }));
      const vertical = Math.abs(S.c.x - R.c.x) < 1;
      hot.push(cardMark(`c-${r.name}-${side}`, S, R, mark, vertical ? -1 : 1, "accent"));
    }
    hot.push(...relation(`r-${r.name}`, R.c.x, R.c.y, r.name, { w: R.w, h: R.h, identifying: r.identifying }).items);
    // Settle the previous frame's accent before this one adds its own.
    const settled = drawn.map((it) => (it.k === "edge" && it.tone === "accent" ? { ...it, tone: "ink" as const } : it.k === "text" && it.tone === "accent" ? { ...it, tone: "ink" as const } : it));
    drawn.length = 0;
    drawn.push(...settled);
    // Lines go under the shapes: put this relationship's lines first.
    const lines = hot.filter((it) => it.k === "edge" && it.id.startsWith("j-"));
    const rest = hot.filter((it) => !lines.includes(it));
    drawn.unshift(...lines);
    drawn.push(...rest);
    frames.push({ caption: say[name](r), items: [...drawn] });
  }
  frames.push({
    caption: "The finished diagram: five entity sets, four relationships, each key on its entity. Read every line twice, once for cardinality (1, M, N) and once for participation (double or single), before turning it into tables.",
    items: drawn.map((it) => (it.k === "edge" && it.tone === "accent" ? { ...it, tone: "ink" as const } : it.k === "text" && it.tone === "accent" ? { ...it, tone: "ink" as const } : it)),
  });
  return finish({ title: "The library as an ER diagram, one relationship at a time", input: "", frames });
}

/* ── ER to tables ─────────────────────────────────────────────────── */

/** `step`: when the column arrived, if later than its table (a foreign key added to an older table). */
type Column = { name: string; pk?: boolean; fk?: string; notNull?: boolean; step?: number };
type TableDef = { name: string; cols: Column[]; step: number; why: string };

/** The mapping rules, run on LIBRARY in the order a student applies them. Steps: 0 strong entities, 1 relationships between them, 2 the weak entity and its loan, 3 the multi-valued attribute. */
function mapToTables(): TableDef[] {
  const tables: TableDef[] = [];
  const t = (n: string) => tables.find((x) => x.name === n.toLowerCase())!;
  const pk = (n: string) => t(n).cols.filter((c) => c.pk);
  // Strong entities: simple attributes; a composite flattened into its parts; multi-valued and derived left out.
  for (const e of LIBRARY.entities.filter((x) => !x.owner)) {
    const cols: Column[] = [];
    for (const a of e.attrs) {
      if (a.multivalued || a.derived) continue;
      if (a.parts) cols.push(...a.parts.map((p) => ({ name: p })));
      else cols.push({ name: a.name, pk: a.key });
    }
    tables.push({ name: e.name.toLowerCase(), cols, step: 0, why: "strong entity" });
  }
  // Relationships between strong entities: 1:N puts the one side's key on the N side, M:N gets a table.
  for (const r of LIBRARY.relations.filter((x) => !x.identifying && !ent(x.a).owner && !ent(x.b).owner)) {
    if (r.card === "1:N") t(r.b).cols.push(...pk(r.a).map((c) => ({ name: c.name, fk: r.a.toLowerCase(), notNull: r.total.includes(r.b), step: 1 })));
    else tables.push({ name: r.name, cols: [...pk(r.a), ...pk(r.b)].map((c, i) => ({ name: c.name, pk: true, fk: (i < pk(r.a).length ? r.a : r.b).toLowerCase() })), step: 1, why: "M:N relationship" });
  }
  // Weak entities: the owner's key plus the partial key, then any 1:N relationship landing on them.
  for (const e of LIBRARY.entities.filter((x) => x.owner)) {
    const cols: Column[] = [...pk(e.owner!).map((c) => ({ name: c.name, pk: true, fk: e.owner!.toLowerCase() }))];
    for (const a of e.attrs) cols.push({ name: a.name, pk: a.partial });
    tables.push({ name: e.name.toLowerCase(), cols, step: 2, why: "weak entity" });
    for (const r of LIBRARY.relations.filter((x) => x.b === e.name && !x.identifying)) {
      t(e.name).cols.push(...pk(r.a).map((c) => ({ name: c.name, fk: r.a.toLowerCase(), notNull: r.total.includes(r.b) })), ...(r.attrs ?? []).map((a) => ({ name: a })));
    }
  }
  // Multi-valued attributes: a table of (owner key, value).
  for (const e of LIBRARY.entities)
    for (const a of e.attrs.filter((x) => x.multivalued))
      tables.push({ name: `${e.name.toLowerCase()}_${a.name}`, cols: [...pk(e.name).map((c) => ({ name: c.name, pk: true, fk: e.name.toLowerCase() })), { name: a.name, pk: true }], step: 3, why: "multi-valued attribute" });
  // The seven tables the note lists, column for column.
  const want: Record<string, string> = {
    publisher: "publisher_id*,name,city",
    book: "isbn*,title,year,publisher_id>",
    author: "author_id*,name",
    writes: "isbn*>,author_id*>",
    copy: "isbn*>,copy_no*,shelf,member_id>,issue_date,due_date",
    member: "member_id*,first_name,last_name,date_of_birth",
    member_phone: "member_id*>,phone*",
  };
  const got = Object.fromEntries(tables.map((x) => [x.name, x.cols.map((c) => `${c.name}${c.pk ? "*" : ""}${c.fk ? ">" : ""}`).join(",")]));
  for (const [n, cols] of Object.entries(want)) if (got[n] !== cols) throw new Error(`er-to-tables: ${n} is (${got[n]}), the note says (${cols})`);
  if (tables.length !== 7) throw new Error(`er-to-tables: ${tables.length} tables, the note says 7`);
  if (!t("Book").cols.find((c) => c.name === "publisher_id")!.notNull || t("Copy").cols.find((c) => c.name === "member_id")!.notNull) throw new Error("er-to-tables: NOT NULL should follow total participation");
  return tables;
}

function erToTables(): Walkthrough {
  const tables = mapToTables();
  const TW = 118;
  const HH = 22;
  const LH = 17;
  const GX = 14;
  const place: Record<string, { x: number; y: number }> = {
    publisher: { x: 0, y: 0 },
    book: { x: TW + GX, y: 0 },
    writes: { x: 2 * (TW + GX), y: 0 },
    author: { x: 3 * (TW + GX), y: 0 },
    copy: { x: TW + GX, y: 142 },
    member: { x: 2 * (TW + GX), y: 142 },
    member_phone: { x: 3 * (TW + GX), y: 142 },
  };
  const rowY = (t: TableDef, col: string) => place[t.name].y + HH + 4 + LH / 2 + t.cols.findIndex((c) => c.name === col) * LH;
  const arrived = (t: TableDef, c: Column) => c.step ?? t.step;
  const draw = (upTo: number): Item[] => {
    const items: Item[] = [];
    const live = tables.filter((t) => t.step <= upTo);
    for (const t of live) {
      const at = place[t.name];
      const hot = t.step === upTo;
      // A column added to an older table in this step (a foreign key) is the step's news too.
      const fresh = (c: Column) => arrived(t, c) === upTo;
      items.push(box(`h-${t.name}`, at.x, at.y, t.name, { w: TW, h: HH, size: 11.5, tone: hot ? "accent" : "plain" }));
      const shown = t.cols.filter((c) => arrived(t, c) <= upTo);
      items.push(box(`b-${t.name}`, at.x, at.y + HH, "", { w: TW, h: shown.length * LH + 8 }));
      shown.forEach((c, i) => {
        const y = at.y + HH + 4 + LH / 2 + i * LH;
        items.push({ k: "text", id: `c-${t.name}-${c.name}`, x: at.x + 7, y, text: c.name, tone: fresh(c) ? "accent" : "ink", anchor: "start", size: 11, mono: true, weight: c.pk ? 700 : undefined });
        if (c.pk) items.push({ k: "path", id: `u-${t.name}-${c.name}`, pts: [[at.x + 7, y + 7], [round(at.x + 7 + c.name.length * 6.6), y + 7]], tone: "ink", width: 1 });
        if (c.fk) items.push({ k: "text", id: `f-${t.name}-${c.name}`, x: at.x + TW - 6, y, text: "FK", tone: "faint", anchor: "end", size: 9.5, mono: true });
      });
    }
    // Every foreign key as an arrow to the table it references, from the side facing it.
    for (const t of live)
      for (const c of t.cols.filter((x) => x.fk && arrived(t, x) <= upTo)) {
        const ref = tables.find((x) => x.name === c.fk)!;
        if (ref.step > upTo) continue;
        const a = place[t.name];
        const b = place[ref.name];
        const y1 = rowY(t, c.name);
        const y2 = rowY(ref, ref.cols.find((x) => x.pk)!.name);
        const tone = arrived(t, c) === upTo ? "accent" : "line";
        let it: Item;
        if (b.y < a.y && Math.abs(b.x - a.x) < 1) it = { k: "edge", id: `fk-${t.name}-${c.name}`, x1: a.x + 30, y1: a.y - 1, x2: b.x + 30, y2: place[ref.name].y + HH + ref.cols.length * LH + 10, tone, arrow: true };
        else if (b.x < a.x) it = { k: "edge", id: `fk-${t.name}-${c.name}`, x1: a.x - 1, y1, x2: b.x + TW + 2, y2, tone, arrow: true };
        else it = { k: "edge", id: `fk-${t.name}-${c.name}`, x1: a.x + TW + 1, y1, x2: b.x - 2, y2, tone, arrow: true };
        items.unshift(it);
      }
    items.push(label("key", "bold underlined = primary key · FK → the table it references", 0, 316, { anchor: "start", tone: "faint", size: 10.5 }));
    return items;
  };
  const n = (s: number) => tables.filter((t) => t.step === s).map((t) => t.name);
  const frames: Frame[] = [
    {
      caption: `Each strong entity set becomes a table keyed by its key: ${n(0).join(", ")}. Member's composite name becomes first_name and last_name, its derived age is not stored, and its multi-valued phone waits for a table of its own.`,
      items: draw(0),
    },
    {
      caption: `publishes is 1:N, so the one side's key, publisher_id, goes into book as a foreign key, NOT NULL because every book has a publisher. writes is M:N and becomes its own table, ${n(1).join(", ")}, keyed by both foreign keys.`,
      items: draw(1),
    },
    {
      caption: "The weak entity Copy becomes a table keyed by its owner's isbn plus copy_no. borrows is 1:N towards Copy, so member_id and the loan's issue_date and due_date go into copy, nullable because most copies are on the shelf.",
      items: draw(2),
    },
    {
      caption: `The multi-valued phone becomes ${n(3).join(", ")}(member_id, phone), one row per number, keyed by both. That makes ${tables.length} tables, with every relationship now a foreign key or a table.`,
      items: draw(3),
    },
  ];
  return finish({ title: "Turning the library's ER diagram into tables", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "chen-symbols": chenSymbols,
  cardinality,
  "weak-entity": weakEntity,
  "library-er": libraryEr,
  "er-to-tables": erToTables,
};

