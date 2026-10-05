import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "./kit.js";

/**
 * Abstraction: the note's figures (content/notes/oop/abstraction.md places
 * each with "@figure <name>").
 *
 * The class diagrams list exactly the members of the note's payment classes
 * (C++ version) and its Java Discount interface. What happens is computed:
 * the pay() run walks the fixed steps and dispatches charge() to the
 * object's class; the refund loop asks each class whether it implements
 * Refundable; the Discount run resolves apply(), capped() and percent()
 * through the interface and the implementing class; and the Python ABC
 * figure works out each class's set of still-abstract methods along its
 * MRO, the way Python decides whether a class may be instantiated. Every
 * model's printout is checked against the output the gate got from the
 * real programs.
 */

/** Output lines; this step's in ink, earlier ones faint. */
function printout(prefix: string, lines: readonly string[], x: number, y: number, fresh: number): Item[] {
  return lines.map((l, i) => label(`${prefix}${i}`, `> ${l}`, x, y + i * 18, { anchor: "start", tone: i >= lines.length - fresh ? "ink" : "faint", mono: true, size: 12 }));
}

/* ── The payment classes ──────────────────────────────────────────── */

/** The note's payment classes (C++ version), member for member. */
const PAY: Record<string, { spec: ClassSpec; parent?: string; implements?: string[]; charge?: (f: Record<string, string>, amount: number) => string; refund?: (f: Record<string, string>, amount: number) => string }> = {
  Refundable: { spec: { name: "Refundable", stereotype: "interface", methods: ["+ refund(amount): void"] } },
  PaymentMethod: { spec: { name: "PaymentMethod", stereotype: "abstract", fields: ["# owner: string"], methods: ["+ PaymentMethod(owner)", "# charge(amount) {abstract}", "+ pay(amount): void"] } },
  UpiPayment: {
    parent: "PaymentMethod",
    implements: ["Refundable"],
    spec: { name: "UpiPayment", fields: ["- handle: string"], methods: ["+ UpiPayment(owner, handle)", "# charge(amount): void", "+ refund(amount): void"] },
    charge: (f, a) => `UPI: charged Rs ${a} to ${f.handle}`,
    refund: (f, a) => `UPI: refunded Rs ${a} to ${f.handle}`,
  },
  CardPayment: {
    parent: "PaymentMethod",
    spec: { name: "CardPayment", fields: ["- last4: string"], methods: ["+ CardPayment(owner, last4)", "# charge(amount): void"] },
    charge: (f, a) => `Card: charged Rs ${a} to card ending ${f.last4}`,
  },
};

const isA = (cls: string, type: string): boolean => cls === type || (PAY[cls].implements ?? []).includes(type) || (!!PAY[cls].parent && isA(PAY[cls].parent!, type));

function paymentClasses(): Walkthrough {
  const W = { ref: 170, pm: 214, upi: 210, card: 210 };
  const TOP = 64;
  const ref = classBox("Refundable", PAY.Refundable.spec, { x: 0, y: TOP, w: W.ref });
  const pm = classBox("PaymentMethod", PAY.PaymentMethod.spec, { x: W.ref + 70, y: TOP, w: W.pm });
  const BOT = TOP + Math.max(ref.h, pm.h) + 56;
  const draw = (focus: "classes" | "caller"): Item[] => {
    const abstractTone: Tone = focus === "caller" ? "accent" : "plain";
    const concreteTone: Tone = focus === "caller" ? "muted" : "plain";
    const r = classBox("Refundable", PAY.Refundable.spec, { x: 0, y: TOP, w: W.ref, tone: abstractTone });
    const p = classBox("PaymentMethod", PAY.PaymentMethod.spec, {
      x: W.ref + 70,
      y: TOP,
      w: W.pm,
      tone: abstractTone,
      lineTone: (l): TextTone | undefined => (focus === "classes" && l.includes("{abstract}") ? "accent" : undefined),
    });
    const u = classBox("UpiPayment", PAY.UpiPayment.spec, { x: 40, y: BOT, w: W.upi, tone: concreteTone });
    const c = classBox("CardPayment", PAY.CardPayment.spec, { x: 40 + W.upi + 34, y: BOT, w: W.card, tone: concreteTone });
    const items: Item[] = [
      ...umlLink("u-pm", { x: u.top.x + 30, y: u.top.y }, { x: p.bottom.x - 30, y: p.bottom.y }, "inherits"),
      ...umlLink("u-r", { x: u.top.x - 40, y: u.top.y }, r.bottom, "implements"),
      ...umlLink("c-pm", c.top, { x: p.bottom.x + 30, y: p.bottom.y }, "inherits"),
      ...r.items,
      ...p.items,
      ...u.items,
      ...c.items,
    ];
    // The checkout code: it holds PaymentMethod and asks for Refundable; it names a concrete class only where it creates one.
    const cx = W.ref + 10;
    items.push(box("client", cx, 0, "checkout loop in main()", { w: 190, h: 30, size: 11.5, tone: focus === "caller" ? "strong" : "plain" }));
    const dep = focus === "caller" ? "accent" : "line";
    items.push(...umlLink("d-pm", { x: cx + 150, y: 31 }, { x: p.top.x, y: p.top.y - 1 }, "depends", { tone: dep, label: focus === "caller" ? "m.pay(499)" : undefined }));
    items.push(...umlLink("d-r", { x: cx + 30, y: 31 }, { x: r.top.x + 30, y: r.top.y - 1 }, "depends", { tone: dep, label: focus === "caller" ? "r.refund(99)" : undefined }));
    return items;
  };
  // The diagram's claims, checked against the class data.
  if (!isA("UpiPayment", "Refundable") || isA("CardPayment", "Refundable") || !isA("CardPayment", "PaymentMethod")) throw new Error("paymentClasses: hierarchy disagrees with the program");
  return finish({
    title: "The note's payment design: an interface, an abstract class, two implementations",
    input: "",
    frames: [
      {
        caption: "PaymentMethod is abstract: it has state (owner), a constructor and a finished pay(), and leaves charge() to subclasses. Refundable is an interface, a single promise. UpiPayment extends one and implements the other; CardPayment only extends.",
        items: draw("classes"),
      },
      {
        caption: "The checkout code depends only on the two abstractions: it calls pay() on a PaymentMethod and refund() on a Refundable. A new payment class can arrive without a line of checkout changing.",
        items: draw("caller"),
      },
    ],
  });
}

/* ── pay(): the fixed steps, with charge() supplied by the subclass ── */

const PAY_OUTPUT = [
  "UPI: charged Rs 499 to asha@bank",
  "receipt for Asha: Rs 499",
  "Card: charged Rs 499 to card ending 4242",
  "receipt for Ravi: Rs 499",
  "rejected: amount must be positive",
  "UPI: refunded Rs 99 to asha@bank",
];

function paySteps(): Walkthrough {
  const methods = [
    { cls: "UpiPayment", f: { owner: "Asha", handle: "asha@bank" } as Record<string, string> },
    { cls: "CardPayment", f: { owner: "Ravi", last4: "4242" } as Record<string, string> },
  ];
  const printed: string[] = [];
  /** PaymentMethod::pay, as the note writes it: check, then charge (dispatched), then the receipt. */
  const pay = (m: (typeof methods)[number], amount: number): { reached: number; charger?: string } => {
    if (amount <= 0) {
      printed.push("rejected: amount must be positive");
      return { reached: 0 };
    }
    // charge() is pure virtual in PaymentMethod; the object's own class supplies it.
    let c: string | undefined = m.cls;
    while (c && !PAY[c].charge) c = PAY[c].parent;
    if (!c) throw new Error(`paySteps: ${m.cls} has no charge()`);
    printed.push(PAY[c].charge!(m.f, amount));
    printed.push(`receipt for ${m.f.owner}: Rs ${amount}`);
    return { reached: 2, charger: c };
  };

  const STEPS = ["1. amount > 0 ?", "2. charge(amount)", "3. print the receipt"];
  const SW = 196;
  const RX = SW + 70;
  const RW = 200;
  const frames: Frame[] = [];
  const draw = (o: { code: string; reached?: number; rejected?: boolean; charger?: string; refund?: boolean; fresh: number }): Item[] => {
    const items: Item[] = [label("hl", "PaymentMethod::pay (written once)", SW / 2, -12, { tone: "soft", size: 11 }), label("hr", "supplied by each subclass", RX + RW / 2, -12, { tone: "soft", size: 11 })];
    STEPS.forEach((s, i) => {
      let tone: Tone = "plain";
      if (o.reached !== undefined) tone = o.rejected && i === 0 ? "error" : i <= o.reached && !(o.rejected && i > 0) ? "accent" : "muted";
      if (o.refund) tone = "muted";
      items.push(box(`st${i}`, 0, i * 50, s, { w: SW, h: 34, size: 12, tone }));
      if (i) items.push(arrow(`sa${i}`, { x: SW / 2, y: i * 50 - 15 }, { x: SW / 2, y: i * 50 - 2 }, { tone: "ink" }));
    });
    ["UpiPayment", "CardPayment"].forEach((c, k) => {
      const hot = o.charger === c;
      const y = k * 60;
      const text = o.refund ? (isA(c, "Refundable") ? `${c}::refund` : `${c}: not Refundable`) : `${c}::charge`;
      const tone: Tone = o.refund ? (isA(c, "Refundable") ? "strong" : "muted") : hot ? "strong" : "plain";
      items.push(box(`im${k}`, RX, y, text, { w: RW, h: 34, size: 11.5, tone }));
    });
    if (o.charger) items.push(arrow("disp", { x: SW + 3, y: 50 + 17 }, { x: RX - 3, y: (o.charger === "UpiPayment" ? 0 : 60) + 17 }, { tone: "accent" }));
    items.push(label("code", o.code, 0, 3 * 50 + 6, { anchor: "start", tone: o.rejected ? "error" : "accent", mono: true, size: 12.5, weight: 600 }));
    items.push(...printout("out", printed, 0, 3 * 50 + 28, o.fresh));
    return items;
  };

  let before = printed.length;
  let r = pay(methods[0], 499);
  frames.push({ caption: `pay() is written once in PaymentMethod. For Asha's UpiPayment the check passes, and step 2 is a virtual call that lands in ${r.charger}::charge, the only part that differs.`, items: draw({ code: "methods[0]->pay(499);", reached: r.reached, charger: r.charger, fresh: printed.length - before }) });
  before = printed.length;
  r = pay(methods[1], 499);
  frames.push({ caption: `The same steps for Ravi's card: only step 2 changes, now running ${r.charger}::charge. The caller wrote pay(499) both times and never learned which class it held.`, items: draw({ code: "methods[1]->pay(499);", reached: r.reached, charger: r.charger, fresh: printed.length - before }) });
  before = printed.length;
  r = pay(methods[1], 0);
  frames.push({ caption: "An amount of 0 fails step 1, so charge() is never called. The rule lives in the abstract class, and no subclass can forget it.", items: draw({ code: "methods[1]->pay(0);", reached: r.reached, rejected: true, fresh: printed.length - before }) });
  before = printed.length;
  const refunded: string[] = [];
  for (const m of methods)
    if (isA(m.cls, "Refundable")) {
      printed.push(PAY[m.cls].refund!(m.f, 99));
      refunded.push(m.cls);
    }
  if (JSON.stringify(printed) !== JSON.stringify(PAY_OUTPUT)) throw new Error(`paySteps: model printed ${JSON.stringify(printed)}`);
  frames.push({
    caption: `The refund loop asks each object whether it is also a Refundable. Only ${refunded.join(" and ")} implements that interface, so only it is refunded; the card is skipped, not broken.`,
    items: draw({ code: "if (auto r = dynamic_cast<Refundable*>(m)) r->refund(99);", refund: true, fresh: printed.length - before }),
  });
  return finish({ title: "What the caller sees, pay(), and what each class supplies, charge()", input: 'methods = [UpiPayment("Asha", "asha@bank"), CardPayment("Ravi", "4242")]', frames });
}

/* ── Java's interface members, and who runs which ─────────────────── */

const DISCOUNT_OUTPUT = ["festive price: 500", "no discount: 1000", "cap: 50%"];

function discountInterface(): Walkthrough {
  const CAP_PERCENT = 50;
  // The interface's members, as the note's Java declares them, each with its kind.
  const members = [
    { kind: "constant", sig: "CAP_PERCENT = 50", id: "cap" },
    { kind: "abstract", sig: "int percent()", id: "percent" },
    { kind: "default", sig: "int apply(int price)", id: "apply" },
    { kind: "private", sig: "int capped()", id: "capped" },
    { kind: "static", sig: "Discount none()", id: "none" },
  ];
  /** The implementations: FestiveDiscount's percent(), and the lambda none() returns. */
  const impls: Record<string, () => number> = { FestiveDiscount: () => 70, "lambda from none()": () => 0 };
  const run = (impl: string) => {
    const percent = impls[impl]();
    const capped = Math.min(percent, CAP_PERCENT); // private helper
    const apply = (price: number) => price - Math.floor((price * capped) / 100); // default method
    return { percent, capped, apply };
  };
  const festive = run("FestiveDiscount");
  const none = run("lambda from none()");
  const printed = [`festive price: ${festive.apply(1000)}`, `no discount: ${none.apply(1000)}`, `cap: ${CAP_PERCENT}%`];
  if (JSON.stringify(printed) !== JSON.stringify(DISCOUNT_OUTPUT)) throw new Error(`discountInterface: model printed ${JSON.stringify(printed)}`);

  const KW = 76;
  const SW = 196;
  const IX = KW + 8;
  const RH = 30;
  const top = 30;
  const CX = IX + SW + 56;
  const CW = 170;
  const draw = (o: { hot?: string[]; impl?: string; lines?: string[] }): Item[] => {
    const items: Item[] = [label("it", "«interface» Discount", IX + SW / 2, 10, { tone: "ink", size: 12.5, weight: 700 })];
    members.forEach((m, i) => {
      const hot = o.hot?.includes(m.id);
      items.push(box(`k${i}`, 0, top + i * (RH + 6), m.kind, { w: KW, h: RH, size: 11, tone: hot ? "accent" : "muted" }));
      items.push(box(`m${i}`, IX, top + i * (RH + 6), m.sig, { w: SW, h: RH, size: 11.5, tone: hot ? "accent" : "plain" }));
    });
    items.push(label("ct", "implementations of percent()", CX + CW / 2, 10, { tone: "soft", size: 11 }));
    Object.keys(impls).forEach((n, k) => {
      const y = top + k * 56;
      items.push(box(`i${k}`, CX, y, `${n}: ${impls[n]()}`, { w: CW, h: RH, size: 11, tone: o.impl === n ? "strong" : "plain" }));
      items.push(...umlLink(`imp${k}`, { x: CX - 2, y: y + RH / 2 }, { x: IX + SW + 2, y: top + 1 * (RH + 6) + RH / 2 + (k ? 7 : -7) }, "implements", { tone: o.impl === n ? "accent" : "line" }));
    });
    (o.lines ?? []).forEach((l, i) => items.push(label(`l${i}`, l, 0, top + 5 * (RH + 6) + 16 + i * 20, { anchor: "start", tone: i === (o.lines?.length ?? 0) - 1 ? "accent" : "ink", mono: true, size: 12, weight: i === (o.lines?.length ?? 0) - 1 ? 700 : 500 })));
    return items;
  };
  return finish({
    title: "Inside a Java interface: five kinds of member",
    input: "interface Discount { … }; class FestiveDiscount implements Discount",
    frames: [
      {
        caption: "An interface lists one abstract method every implementer must write, and since Java 8 and 9 it can also carry a default body, a private helper for it, a static factory and constants. It never holds per-object state.",
        items: draw({}),
      },
      {
        caption: `new FestiveDiscount().apply(1000) runs the inherited default apply(), which calls the private capped(), which calls percent() on the object: ${festive.percent}, capped at ${CAP_PERCENT}. The price is 1000 − 1000 × ${festive.capped} / 100 = ${festive.apply(1000)}.`,
        items: draw({ hot: ["apply", "capped", "percent", "cap"], impl: "FestiveDiscount", lines: [`percent() = ${festive.percent}, capped() = min(${festive.percent}, ${CAP_PERCENT}) = ${festive.capped}`, `apply(1000) = ${festive.apply(1000)}`] }),
      },
      {
        caption: `The static none() is called on the interface itself and returns a lambda: percent() is the only abstract method, so () -> 0 implements the whole interface. Its apply(1000) gives ${none.apply(1000)}.`,
        items: draw({ hot: ["none", "apply", "capped", "percent", "cap"], impl: "lambda from none()", lines: [`percent() = ${none.percent}, capped() = min(${none.percent}, ${CAP_PERCENT}) = ${none.capped}`, `Discount.none().apply(1000) = ${none.apply(1000)}`] }),
      },
    ],
  });
}

/* ── Python's ABC: which classes can be instantiated ──────────────── */

/** The note's Python classes: which names each defines, and whether that definition is abstract. */
const PY: Record<string, { bases: string[]; defs: Record<string, "abstract" | "concrete"> }> = {
  ABC: { bases: [], defs: {} },
  Shape: { bases: ["ABC"], defs: { area: "abstract" } },
  Square: { bases: ["Shape"], defs: { __init__: "concrete", area: "concrete" } },
  Blob: { bases: ["Shape"], defs: {} },
};

/** The MRO for single inheritance: the class, then its parent's MRO. */
const pyMro = (c: string): string[] => [c, ...PY[c].bases.flatMap(pyMro)];

/** Python's rule: a name is still abstract if the first definition along the MRO is abstract. */
function stillAbstract(c: string): string[] {
  const names = new Set(pyMro(c).flatMap((k) => Object.keys(PY[k].defs)));
  return [...names].filter((n) => PY[pyMro(c).find((k) => PY[k].defs[n])!].defs[n] === "abstract").sort();
}

const ABC_OUTPUT = ["TypeError: the class is still abstract", "TypeError: the class is still abstract", "Square: created, area 9", "['area']"];

function abstractCheck(): Walkthrough {
  const tries = [
    { call: "Shape()", cls: "Shape", side: 0 },
    { call: "Blob()", cls: "Blob", side: 0 },
    { call: "Square(3)", cls: "Square", side: 3 },
  ];
  const printed: string[] = [];
  const results = tries.map((t) => {
    const missing = stillAbstract(t.cls);
    printed.push(missing.length ? "TypeError: the class is still abstract" : `${t.cls}: created, area ${t.side * t.side}`);
    return { ...t, missing };
  });
  printed.push(`[${stillAbstract("Shape").map((n) => `'${n}'`).join(", ")}]`);
  if (JSON.stringify(printed) !== JSON.stringify(ABC_OUTPUT)) throw new Error(`abstractCheck: model printed ${JSON.stringify(printed)}`);

  const specs: Record<string, ClassSpec> = {
    Shape: { name: "Shape", stereotype: "abstract", methods: ["+ area() {abstract}"] },
    Square: { name: "Square", fields: ["+ side"], methods: ["+ area()"] },
    Blob: { name: "Blob", methods: ["pass"] },
  };
  const BW = 150;
  const draw = (hot: number | null): Item[] => {
    const toneOf = (c: string): Tone => (hot === null ? "plain" : results[hot].cls !== c ? "plain" : results[hot].missing.length ? "error" : "accent");
    const sh = classBox("Shape", specs.Shape, { x: (2 * BW + 40 - BW) / 2, y: 0, w: BW, tone: toneOf("Shape") });
    const sq = classBox("Square", specs.Square, { x: 0, y: sh.h + 50, w: BW, tone: toneOf("Square") });
    const bl = classBox("Blob", specs.Blob, { x: BW + 40, y: sh.h + 50, w: BW, tone: toneOf("Blob") });
    const items: Item[] = [
      ...umlLink("sq-s", sq.top, { x: sh.bottom.x - 20, y: sh.bottom.y }, "inherits"),
      ...umlLink("bl-s", bl.top, { x: sh.bottom.x + 20, y: sh.bottom.y }, "inherits"),
      ...sh.items,
      ...sq.items,
      ...bl.items,
    ];
    const RX = 2 * BW + 80;
    items.push(label("rh", "try to create one", RX, -2, { anchor: "start", tone: "soft", size: 11 }));
    results.forEach((r, i) => {
      if (hot === null || i > hot) return;
      const y = 22 + i * 62;
      items.push(label(`c${i}`, r.call, RX, y, { anchor: "start", tone: "ink", mono: true, size: 12.5, weight: 700 }));
      items.push(label(`a${i}`, r.missing.length ? `still abstract: ${r.missing.join(", ")}` : "nothing abstract left", RX, y + 18, { anchor: "start", tone: "soft", mono: true, size: 11 }));
      items.push(label(`r${i}`, r.missing.length ? "TypeError" : `created, area ${r.side * r.side}`, RX, y + 36, { anchor: "start", tone: r.missing.length ? "error" : "accent", mono: true, size: 12, weight: 700 }));
    });
    return items;
  };
  return finish({
    title: "Python refuses to create an object while any abstract method is left",
    input: "class Shape(ABC): area is abstract; Square defines area; Blob does not",
    frames: results.map((r, i) => ({
      caption:
        i === 0
          ? `Python checks when you create an object, not when you define the class. Shape's own area() is marked abstract, so Shape() raises TypeError.`
          : r.missing.length
            ? `Blob defines nothing, so looking up area along its MRO (${pyMro(r.cls).join(", ")}) finds Shape's abstract version first. Defining Blob was fine; creating one raises TypeError.`
            : `Square's own area() is found before Shape's, so nothing abstract remains and Square(3) is created; its area is ${r.side} × ${r.side} = ${r.side * r.side}.`,
      items: draw(i),
    })),
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "payment-classes": paymentClasses,
  "pay-steps": paySteps,
  "discount-interface": discountInterface,
  "abstract-check": abstractCheck,
};
