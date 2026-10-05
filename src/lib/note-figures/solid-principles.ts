import { finish, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "./kit.js";

/**
 * SOLID Principles: the note's figures (content/notes/oop/solid-principles.md
 * places each with "@figure <name>"). Each principle is a before → after
 * pair of frames on the note's own example, the class boxes' members read
 * off its code groups (types left out where UML allows), and whatever the
 * figure claims is computed:
 *
 *  - srp-split: the Invoice's responsibilities grouped by the actor who asks
 *    for changes — one class per actor;
 *  - ocp-checkout: the switch and the Strategy version both run on the
 *    example (they must agree), then FestiveDiscount added as a class;
 *  - lsp-square: resize() run on a Rectangle and a Square model, statement by
 *    statement, the broken expectation computed (16, not 20);
 *  - isp-split: which methods each device is forced to implement but cannot
 *    honour, before and after the interface is split;
 *  - dip-inversion: every dependency arrow classified by the layers it joins,
 *    so the "inversion" is counted, not asserted.
 */

/**
 * Lines of code, mono: SVG collapses leading spaces, so indentation becomes
 * an x offset of one character width (0.6 em) per space.
 */
function codeLines(prefix: string, texts: readonly string[], x: number, y: number, o: { size?: number; gap?: number; tone?: (i: number) => TextTone | undefined } = {}): Item[] {
  const sz = o.size ?? 11.5;
  const gap = o.gap ?? 20;
  return texts.map((t, i) => {
    const indent = t.length - t.trimStart().length;
    return { k: "text", id: `${prefix}${i}`, x: x + indent * sz * 0.6, y: y + i * gap, text: t.trimStart(), tone: o.tone?.(i) ?? "ink", anchor: "start", size: sz, mono: true } as Item;
  });
}

const size = (spec: ClassSpec) => {
  const b = classBox("probe", spec, {});
  return { w: b.w, h: b.h };
};

/** A box with a title and plain rows of text (a responsibilities compartment, a function's signature). */
function noteBox(id: string, x: number, y: number, title: string, rows: readonly string[], o: { w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined; italic?: boolean }) {
  const H = 24;
  const R = 18;
  const h = H + rows.length * R + (rows.length ? 6 : 0);
  const tone = o.tone ?? "plain";
  const items: Item[] = [{ k: "cell", id, x, y, w: o.w, h, text: "", tone }];
  items.push({ k: "text", id: `${id}-n`, x: x + o.w / 2, y: y + H / 2 + 1, text: title, tone: "ink", anchor: "middle", size: 12.5, mono: false, weight: 700 });
  if (rows.length) items.push({ k: "path", id: `${id}-d`, pts: [[x, y + H], [x + o.w, y + H]], tone: "line", width: 1 });
  rows.forEach((r, i) => items.push({ k: "text", id: `${id}-r${i}`, x: x + 8, y: y + H + 3 + R / 2 + i * R, text: r, tone: o.rowTone?.(i) ?? "ink", anchor: "start", size: 11, mono: false }));
  return { items, h, top: { x: x + o.w / 2, y }, bottom: { x: x + o.w / 2, y: y + h }, left: { x, y: y + h / 2 }, right: { x: x + o.w, y: y + h / 2 } };
}

/* ── S: one reason to change per class ────────────────────────────── */

/** A class box whose rows are responsibilities with ids of their own, so a job glides from one class to another. */
function jobsBox(id: string, x: number, y: number, title: string, jobs: ReadonlyArray<{ id: string; text: string }>, o: { w: number; tone?: Tone }): Item[] {
  const H = 24;
  const R = 18;
  const h = H + jobs.length * R + (jobs.length ? 6 : 0);
  const items: Item[] = [
    { k: "cell", id, x, y, w: o.w, h, text: "", tone: o.tone ?? "plain" },
    { k: "text", id: `${id}-n`, x: x + o.w / 2, y: y + H / 2 + 1, text: title, tone: "ink", anchor: "middle", size: 12.5, mono: false, weight: 700 },
  ];
  if (jobs.length) items.push({ k: "path", id: `${id}-d`, pts: [[x, y + H], [x + o.w, y + H]], tone: "line", width: 1 });
  jobs.forEach((j, i) => items.push({ k: "text", id: j.id, x: x + 8, y: y + H + 3 + R / 2 + i * R, text: j.text, tone: "ink", anchor: "start", size: 11, mono: false }));
  return items;
}

/** The note's Invoice: three things it does, and who asks for each to change. */
const INVOICE_JOBS = [
  { job: "total with taxes", actor: "finance team", owner: "InvoiceCalculator" },
  { job: "PDF layout", actor: "design team", owner: "InvoicePdfRenderer" },
  { job: "database storage", actor: "database admin", owner: "InvoiceRepository" },
] as const;

function srpSplit(): Walkthrough {
  // Split by actor: group the jobs by who asks for changes, one class per group.
  const byActor = new Map<string, Array<(typeof INVOICE_JOBS)[number]>>();
  for (const j of INVOICE_JOBS) byActor.set(j.actor, [...(byActor.get(j.actor) ?? []), j]);
  const before = new Set(INVOICE_JOBS.map((j) => j.actor)).size;
  const after = [...byActor.values()].map((js) => new Set(js.map((j) => j.actor)).size);
  if (before !== 3 || after.some((n) => n !== 1)) throw new Error("srp-split: the split should leave one actor per class");

  const W = 150;
  const GAP = 20;
  const col = (i: number) => i * (W + GAP);
  const AY = 0;
  const CY = 74;
  const actor = (i: number, name: string): Item => box(`a${i}`, col(i) + 10, AY, name, { w: W - 20, h: 26, size: 11, tone: "muted" });

  const jobs = INVOICE_JOBS.map((j, i) => ({ id: `j${i}`, text: j.job }));
  const frame1: Item[] = [];
  INVOICE_JOBS.forEach((j, i) => frame1.push(actor(i, j.actor)));
  frame1.push(...jobsBox("inv", col(1), CY, "Invoice", jobs, { w: W, tone: "error" }));
  INVOICE_JOBS.forEach((_, i) => frame1.push(arrow(`e${i}`, { x: col(i) + W / 2, y: AY + 27 }, { x: col(1) + W / 2 + (i - 1) * 30, y: CY - 2 }, { tone: "error" })));

  const frame2: Item[] = [];
  INVOICE_JOBS.forEach((j, i) => frame2.push(actor(i, j.actor)));
  [...byActor.entries()].forEach(([who, group], i) => {
    const jobs = group;
    frame2.push(...jobsBox(`c${i}`, col(i), CY, jobs[0].owner, jobs.map((jb) => ({ id: `j${INVOICE_JOBS.indexOf(jb)}`, text: jb.job })), { w: W, tone: "accent" }));
    frame2.push(arrow(`e${INVOICE_JOBS.findIndex((x) => x.actor === who)}`, { x: col(i) + W / 2, y: AY + 27 }, { x: col(i) + W / 2, y: CY - 2 }, { tone: "accent" }));
  });
  const DY = CY + 24 + 18 + 6 + 56;
  frame2.push({ k: "cell", id: "inv", x: col(1), y: DY, w: W, h: 30, text: "", tone: "plain" }, { k: "text", id: "inv-n", x: col(1) + W / 2, y: DY + 15, text: "Invoice", tone: "ink", anchor: "middle", size: 12.5, mono: false, weight: 700 });
  frame2.push(label("inv-s", "the data all three work on", col(1) + W / 2, DY + 46, { size: 11 }));
  for (let i = 0; i < 3; i++) frame2.push(...umlLink(`u${i}`, { x: col(i) + W / 2, y: CY + 48 }, { x: col(1) + W / 2 + (i - 1) * 40, y: DY - 1 }, "depends"));

  return finish({
    title: "Single Responsibility: split the Invoice by who asks for changes",
    input: "",
    frames: [
      { caption: "Before: one Invoice class computes taxes, lays out the PDF and stores itself. Three groups of people ask for changes to it, so a layout change can break the tax code it shares fields with.", items: frame1 },
      { caption: "After: one class per actor. Each has a single reason to change, and Invoice is just the data the three work on, so the design team can no longer break a tax calculation.", items: frame2 },
    ],
  });
}

/* ── O: add a class, not a branch ─────────────────────────────────── */

/** The note's three discount policies, as its programs compute them (integer arithmetic). */
const POLICIES = [
  { cls: "NoDiscount", name: "Regular", type: "regular", apply: (a: number) => a },
  { cls: "StudentDiscount", name: "Student", type: "student", apply: (a: number) => Math.floor((a * 90) / 100) },
  { cls: "FestiveDiscount", name: "Festive", type: "festive", apply: (a: number) => a - Math.min(Math.floor(a / 4), 500) },
] as const;
const OCP_OUTPUT = ["Regular customer pays 1000", "Student customer pays 900", "Festive customer pays 750"];

function ocpCheckout(): Walkthrough {
  const AMOUNT = 1000;
  // The switch version, extended the way OCP forbids: a new branch edited into tested code.
  const switchCheckout = (amount: number, type: string) => {
    if (type === "regular") return amount;
    if (type === "student") return Math.floor((amount * 90) / 100);
    if (type === "festive") return amount - Math.min(Math.floor(amount / 4), 500);
    throw new Error(`no branch for ${type}`);
  };
  const checkout = (amount: number, policy: (typeof POLICIES)[number]) => policy.apply(amount);
  const printed = POLICIES.map((p) => `${p.name} customer pays ${checkout(AMOUNT, p)}`);
  if (printed.join("\n") !== OCP_OUTPUT.join("\n")) throw new Error(`ocp-checkout: the policies print ${JSON.stringify(printed)}`);
  for (const p of POLICIES) if (switchCheckout(AMOUNT, p.type) !== checkout(AMOUNT, p)) throw new Error(`ocp-checkout: the two designs disagree on ${p.type}`);

  const code = [
    "checkout(amount, type):",
    '    if type == "regular": return amount',
    '    if type == "student": return amount * 90 / 100',
    '    if type == "festive": return amount - min(amount / 4, 500)',
  ];
  const before: Item[] = [
    ...codeLines("code", code, 18, 12, { size: 11.5, gap: 22, tone: (i) => (i === 3 ? "error" : "ink") }),
    { k: "band", id: "edit", x: 0, y: 12 + 3 * 22 - 11, w: 470, h: 22, tone: "error" },
    label("plus", "+", 6, 12 + 3 * 22, { tone: "error", size: 13, weight: 700, mono: true }),
    label("why", "the Festive offer means editing, re-testing and re-deploying checkout", 0, 12 + 4 * 22 + 14, { anchor: "start", size: 11, tone: "error" }),
  ];
  // The band must sit behind the text it marks.
  before.sort((a, b) => (a.k === "band" ? -1 : b.k === "band" ? 1 : 0));

  const iface: ClassSpec = { name: "DiscountPolicy", stereotype: "interface", methods: ["+ name(): String", "+ apply(amount: int): int"] };
  const impl = (cls: string): ClassSpec => ({ name: cls, methods: ["+ name()", "+ apply(amount)"] });
  const W = 136;
  const GAP = 18;
  const IY = 0;
  const isz = size(iface);
  const IX = (3 * W + 2 * GAP - isz.w) / 2 + 40;
  const after: Item[] = [];
  const ib = classBox("iface", iface, { x: IX, y: IY });
  after.push(...ib.items);
  const fn = noteBox("fn", -20, IY + 22, "checkout", ["(amount, policy)"], { w: 112 });
  after.push(...fn.items, ...umlLink("use", fn.right, { x: IX, y: fn.right.y }, "depends"));
  const RY = IY + isz.h + 56;
  POLICIES.forEach((p, i) => {
    const x = 40 + i * (W + GAP) - 40;
    const b = classBox(`p${i}`, impl(p.cls), { x, y: RY, w: W, tone: p.cls === "FestiveDiscount" ? "accent" : "plain" });
    after.push(...b.items);
    after.push(...umlLink(`i${i}`, b.top, { x: IX + isz.w / 2 + (i - 1) * 34, y: IY + isz.h }, "implements"));
    after.push(label(`r${i}`, `apply(${AMOUNT}) = ${p.apply(AMOUNT)}`, x + W / 2, RY + b.h + 14, { size: 11, mono: true, tone: p.cls === "FestiveDiscount" ? "accent" : "soft" }));
  });
  after.push(label("added", "added later", 40 + 2 * (W + GAP) - 40 + W / 2, RY + b2h(impl("x")) + 32, { size: 11, tone: "accent", weight: 600 }));

  return finish({
    title: "Open/Closed: add a class instead of editing the switch",
    input: `checkout(${AMOUNT}, …) for each customer type`,
    frames: [
      { caption: "Before: checkout switches on a type code. Adding the Festive offer means editing a function that already works and is tested, and re-testing every branch in it.", items: before },
      {
        caption: `After: checkout depends only on the DiscountPolicy abstraction. FestiveDiscount arrives as a new class, checkout is untouched, and the three pay ${POLICIES.map((p) => p.apply(AMOUNT)).join(", ")} exactly as the switch computed.`,
        items: after,
      },
    ],
  });
}

const b2h = (spec: ClassSpec) => size(spec).h;

/* ── L: a Square that breaks Rectangle's promise ──────────────────── */

class Rect {
  w = 0;
  h = 0;
  setWidth(x: number) {
    this.w = x;
  }
  setHeight(x: number) {
    this.h = x;
  }
  area() {
    return this.w * this.h;
  }
}
class Sq extends Rect {
  override setWidth(x: number) {
    this.w = this.h = x;
  }
  override setHeight(x: number) {
    this.w = this.h = x;
  }
}
const LSP_OUTPUT = ["Rectangle: expected 20, got 20", "Square: expected 20, got 16"];

function lspSquare(): Walkthrough {
  // resize() from the note, run on both shapes with a snapshot after each statement.
  const shapes = [
    { name: "Rectangle", obj: new Rect() as Rect },
    { name: "Square", obj: new Sq() as Rect },
  ];
  type Snap = Array<{ w: number; h: number; broke: Array<"w" | "h"> }>;
  const snaps: Snap[] = [];
  /** Rectangle's promise: a setter changes its own side and leaves the other alone. */
  const call = (setter: "w" | "h", x: number) => {
    const before = shapes.map((s) => ({ w: s.obj.w, h: s.obj.h }));
    shapes.forEach((s) => (setter === "w" ? s.obj.setWidth(x) : s.obj.setHeight(x)));
    snaps.push(
      shapes.map((s, k) => {
        const promised = { ...before[k], [setter]: x };
        const broke = (["w", "h"] as const).filter((f) => s.obj[f] !== promised[f]);
        return { w: s.obj.w, h: s.obj.h, broke: [...(snaps.length ? snaps[snaps.length - 1][k].broke : []), ...broke] };
      }),
    );
  };
  snaps.push(shapes.map((s) => ({ w: s.obj.w, h: s.obj.h, broke: [] })));
  call("w", 5);
  call("h", 4);
  if (snaps[2][0].broke.length || snaps[1][1].broke.join() !== "h" || snaps[2][1].broke.join() !== "h,w") throw new Error("lsp-square: only the square should break the promise, height first, then width");
  const printed = shapes.map((s) => `${s.name}: expected 20, got ${s.obj.area()}`);
  if (printed.join("\n") !== LSP_OUTPUT.join("\n")) throw new Error(`lsp-square: resize printed ${JSON.stringify(printed)}`);
  const EXPECT = 5 * 4;

  const code = ["def resize(r, label):  # written for Rectangle", "    r.set_width(5)", "    r.set_height(4)  # relies on the width staying 5", '    print(f"{label}: expected 20, got {r.area()}")'];
  const U = 13;
  const PY = 118;
  const PW = 210;
  const draw = (step: number, line: number, o: { verdict?: boolean } = {}): Item[] => {
    const items: Item[] = [{ k: "band", id: "cur", x: 0, y: 4 + line * 20 - 10, w: 380, h: 20, tone: "accent" }];
    items.push(...codeLines("code", code, 8, 4, { size: 11.5, gap: 20, tone: (i) => (i === line ? "accent" : "ink") }));
    shapes.forEach((s, k) => {
      const x = k * (PW + 30);
      const { w, h, broke } = snaps[step][k];
      // Only what this statement broke is red; a side broken earlier stays as it is now.
      const fresh = step > 0 ? broke.filter((f) => !snaps[step - 1][k].broke.includes(f)) : [];
      const broken = fresh.length > 0;
      items.push(label(`t${k}`, `${s.name}()`, x, PY, { anchor: "start", tone: "ink", size: 12.5, weight: 600 }));
      items.push(label(`w${k}`, `width = ${w}`, x, PY + 22, { anchor: "start", size: 11.5, mono: true, tone: fresh.includes("w") ? "error" : "ink" }));
      items.push(label(`h${k}`, `height = ${h}`, x, PY + 40, { anchor: "start", size: 11.5, mono: true, tone: fresh.includes("h") ? "error" : "ink" }));
      if (w && h) {
        const ok = !o.verdict || w * h === EXPECT;
        items.push({ k: "cell", id: `shape${k}`, x: x + 100, y: PY + 10, w: w * U, h: h * U, text: `${w}×${h}`, tone: o.verdict ? (ok ? "strong" : "error") : broken ? "error" : "accent", size: 11 });
      } else if (w) {
        items.push({ k: "path", id: `flat${k}`, pts: [[x + 100, PY + 10], [x + 100 + w * U, PY + 10]], tone: "accent", width: 2 });
        items.push(label(`fl${k}`, `${w}×${h}`, x + 100 + (w * U) / 2, PY + 24, { size: 11, mono: true, tone: "accent" }));
      }
      if (o.verdict) {
        const got = w * h;
        items.push(label(`v${k}`, `area ${got}: ${got === EXPECT ? "as expected" : `expected ${EXPECT}`}`, x, PY + 10 + 5 * U + 26, { anchor: "start", size: 11.5, weight: 600, tone: got === EXPECT ? "accent" : "error" }));
      }
    });
    return items;
  };
  const sq = snaps[1][1];
  return finish({
    title: "Liskov Substitution: a Square breaks code written for Rectangle",
    input: "resize(Rectangle()), resize(Square())",
    frames: [
      { caption: "resize() is written against Rectangle's promise: setting the width leaves the height alone. Both shapes start at 0 by 0.", items: draw(0, 0) },
      {
        caption: `set_width(5): the rectangle is 5 wide and still 0 high, as promised. Square's override keeps its sides equal, so its height changed too: it is ${sq.w} by ${sq.h}.`,
        items: draw(1, 1),
      },
      { caption: `set_height(4): the rectangle becomes 5 by 4. The square sets both sides again and becomes 4 by 4 — the width resize() relied on has changed under it.`, items: draw(2, 2) },
      {
        caption: `area() is ${snaps[2][0].w * snaps[2][0].h} for the rectangle and ${snaps[2][1].w * snaps[2][1].h} for the square. A subtype that breaks what callers of its base type rely on is not substitutable, whatever the maths says.`,
        items: draw(2, 3, { verdict: true }),
      },
    ],
  });
}

/* ── I: split the fat interface ───────────────────────────────────── */

/** The note's split interfaces (its Java code), and what each device can really do. */
const SMALL = [
  { name: "Printer", method: "+ print(doc)" },
  { name: "Scanner", method: "+ scan()" },
  { name: "Fax", method: "+ fax(doc, number)" },
] as const;
const DEVICES = [
  { name: "BasicPrinter", can: ["+ print(doc)"] },
  { name: "OfficeMachine", can: ["+ print(doc)", "+ scan()", "+ fax(doc, number)"] },
] as const;

function ispSplit(): Walkthrough {
  // The fat interface is the union of the small ones: the note's Machine with print, scan and fax.
  const fat = SMALL.map((s) => s.method);
  const forced = (dev: (typeof DEVICES)[number], methods: readonly string[]) => methods.filter((m) => !(dev.can as readonly string[]).includes(m));
  const forcedBefore = DEVICES.map((d) => forced(d, fat));
  // After the split, a device implements exactly the interfaces whose method it can honour.
  const implemented = DEVICES.map((d) => SMALL.filter((s) => (d.can as readonly string[]).includes(s.method)));
  const forcedAfter = DEVICES.map((d, i) => forced(d, implemented[i].map((s) => s.method)));
  if (forcedBefore[0].length !== 2 || forcedAfter.some((f) => f.length)) throw new Error("ispSplit: the split should leave nothing forced");

  const DW = 168;
  const DY = 150;
  const devX = [118, 118 + DW + 40];
  // Before: one interface with every method; each device must implement all of it.
  const machine = classBox("fat", { name: "Machine", stereotype: "interface", methods: fat }, { x: devX[0] + (DW + 40) / 2 + DW / 2 - 80, y: 0, w: 160 });
  const before: Item[] = [...machine.items];
  const client = noteBox("pa", -20, DY + 6, "printAll", ["(p: Machine, docs)"], { w: 116 });
  before.push(...client.items, ...umlLink("pa-u", client.top, { x: machine.left.x, y: machine.left.y + 10 }, "depends", { tone: "error" }));
  before.push(label("pa-s", "uses only print", -20 + 58, DY + 6 + client.h + 14, { size: 11, tone: "error", weight: 600 }));
  DEVICES.forEach((d, i) => {
    const b = classBox(`d${i}`, { name: d.name, methods: fat }, { x: devX[i], y: DY, w: DW, lineTone: (l) => (forcedBefore[i].includes(l) ? "error" : undefined) });
    before.push(...b.items, ...umlLink(`m${i}`, b.top, { x: machine.bottom.x + (i ? 20 : -20), y: machine.bottom.y }, "implements"));
    if (forcedBefore[i].length) before.push(label(`f${i}`, `forced to throw: ${forcedBefore[i].map((m) => m.slice(2).replace(/\(.*\)/, "")).join(", ")}`, devX[i] + DW / 2, DY + b.h + 14, { size: 11, tone: "error", weight: 600 }));
  });

  // After: three small interfaces; devices implement what they can; printAll asks for Printer only.
  const after: Item[] = [];
  const IW = [110, 110, 150];
  const ix = [devX[0] - 30, devX[0] + 98, devX[0] + 226];
  const ifaces = SMALL.map((s, k) => classBox(`s${k}`, { name: s.name, stereotype: "interface", methods: [s.method] }, { x: ix[k], y: 0, w: IW[k] }));
  ifaces.forEach((b) => after.push(...b.items));
  DEVICES.forEach((d, i) => {
    const b = classBox(`d${i}`, { name: d.name, methods: d.can }, { x: devX[i], y: DY, w: DW });
    after.push(...b.items);
    implemented[i].forEach((s) => {
      const k = SMALL.indexOf(s);
      const n = implemented[i].length;
      const at = { x: b.top.x + (n > 1 ? (implemented[i].indexOf(s) - 1) * 46 : 0), y: b.top.y };
      after.push(...umlLink(`m${i}-${k}`, at, ifaces[k].bottom, "implements"));
    });
  });
  const pa = noteBox("pa", -20, DY + 6, "printAll", ["(p: Printer, docs)"], { w: 116 });
  after.push(...pa.items, ...umlLink("pa-u", pa.top, { x: ifaces[0].bottom.x - 24, y: ifaces[0].bottom.y }, "depends"));
  return finish({
    title: "Interface Segregation: split one fat interface into three",
    input: "",
    frames: [
      {
        caption: `Before: one Machine interface with print, scan and fax. BasicPrinter must implement all three and throw from ${forcedBefore[0].length} of them, and every client that only prints changes when the fax method does.`,
        items: before,
      },
      {
        caption: "After: Printer, Scanner and Fax. BasicPrinter implements only Printer, OfficeMachine all three, and printAll asks for a Printer — so no class implements a method it cannot honour.",
        items: after,
      },
    ],
  });
}

/* ── D: invert the dependency ─────────────────────────────────────── */

type Layer = "policy" | "detail";
interface Dep {
  from: string;
  to: string;
}

function dipInversion(): Walkthrough {
  const layer: Record<string, Layer> = { OrderNotifier: "policy", MessageSender: "policy", EmailSender: "detail", SmsSender: "detail", FakeSender: "detail" };
  const beforeDeps: Dep[] = [{ from: "OrderNotifier", to: "EmailSender" }];
  const afterDeps: Dep[] = [{ from: "OrderNotifier", to: "MessageSender" }, ...["EmailSender", "SmsSender", "FakeSender"].map((d) => ({ from: d, to: "MessageSender" }))];
  const count = (deps: Dep[], a: Layer, b: Layer) => deps.filter((d) => layer[d.from] === a && layer[d.to] === b).length;
  const downBefore = count(beforeDeps, "policy", "detail");
  const downAfter = count(afterDeps, "policy", "detail");
  const upAfter = count(afterDeps, "detail", "policy");
  if (downBefore !== 1 || downAfter !== 0 || upAfter !== 3) throw new Error("dip-inversion: the arrows should all point at the abstraction after the change");

  // The program, run: three notifiers, one per sender; the fake records instead of sending.
  const fakeSent: string[] = [];
  const shipped = (send: (to: string, text: string) => void, id: number, to: string) => send(to, `Order ${id} shipped`);
  const out: string[] = [];
  shipped((to, text) => out.push(`email to ${to}: ${text}`), 42, "asha@example.com");
  shipped((to, text) => out.push(`sms to ${to}: ${text}`), 42, "90000 00001");
  shipped((_to, text) => fakeSent.push(text), 7, "test");
  out.push(`fake sender recorded ${fakeSent.length} message: ${fakeSent[0]}`);
  if (out[2] !== "fake sender recorded 1 message: Order 7 shipped") throw new Error(`dip-inversion: the program printed ${out[2]}`);

  const BAND_W = 500;
  const PY = 0;
  const DY = 168;
  const frameItems = (after: boolean): Item[] => {
    const items: Item[] = [...region("hi", -10, PY + 12, BAND_W, 112, "policy (high level)"), ...region("lo", -10, DY - 6, BAND_W, 100, "details (low level)")];
    const notifier = classBox("on", { name: "OrderNotifier", fields: after ? ["- sender: MessageSender"] : [], methods: ["+ shipped(orderId, to)"] }, { x: 10, y: PY + 28, w: 186 });
    items.push(...notifier.items);
    if (!after) {
      const email = classBox("em", { name: "EmailSender", methods: ["+ send(to, text)"] }, { x: 34, y: DY + 14, w: 138 });
      items.push(...email.items, ...umlLink("dep", notifier.bottom, email.top, "depends", { tone: "error", label: "new EmailSender()" }));
      return items;
    }
    const iface = classBox("ms", { name: "MessageSender", stereotype: "interface", methods: ["+ send(to, text)"] }, { x: 290, y: PY + 28, w: 150 });
    items.push(...iface.items, ...umlLink("dep", notifier.right, { x: iface.left.x, y: notifier.right.y }, "associates", { tone: "accent" }));
    ["EmailSender", "SmsSender", "FakeSender"].forEach((n, i) => {
      const spec: ClassSpec = n === "FakeSender" ? { name: n, fields: ["~ sent: List<String>"], methods: ["+ send(to, text)"] } : { name: n, methods: ["+ send(to, text)"] };
      const id = n === "EmailSender" ? "em" : `d${i}`;
      const b = classBox(id, spec, { x: [34, 186, 330][i], y: DY + 14, w: i === 2 ? 150 : 138 });
      items.push(...b.items, ...umlLink(`up${i}`, b.top, { x: iface.bottom.x + (i - 1) * 30, y: iface.bottom.y }, "implements", { tone: "accent" }));
    });
    return items;
  };
  return finish({
    title: "Dependency Inversion: point the arrows at an abstraction",
    input: "",
    frames: [
      { caption: "Before: the business policy creates an EmailSender itself, so its only dependency arrow points down at a detail. Switching to SMS means editing OrderNotifier, and testing it sends real email.", items: frameItems(false) },
      {
        caption: `After: OrderNotifier owns a MessageSender interface and receives a sender through its constructor. All ${upAfter} details now point up at that abstraction — the inversion — and the fake one records ${fakeSent.length} message for a test instead of sending.`,
        items: frameItems(true),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "srp-split": srpSplit,
  "ocp-checkout": ocpCheckout,
  "lsp-square": lspSquare,
  "isp-split": ispSplit,
  "dip-inversion": dipInversion,
};

