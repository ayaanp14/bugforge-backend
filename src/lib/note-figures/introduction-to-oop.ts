import { finish, round, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "./kit.js";

/**
 * Introduction to Object-Oriented Programming: the note's figures
 * (content/notes/oop/introduction-to-oop.md places each with "@figure <name>").
 *
 * Every figure is drawn from the note's own programs. The Account figures
 * run a model of the note's Account class (the same rule in withdraw, the
 * same calls in the same order) and check its printout against the output
 * the gate got from the real C++/Java/Python/JavaScript programs; the
 * class diagram lists exactly the members of the note's Shape, Rectangle
 * and Triangle, and the polymorphism frame dispatches area() through that
 * class data rather than writing 20 and 12 in by hand.
 */

/* ── The note's Account program, as a model ───────────────────────── */

class AccountModel {
  constructor(
    readonly owner: string,
    public balance: number,
  ) {}
  deposit(amount: number): void {
    this.balance += amount;
  }
  withdraw(amount: number): boolean {
    if (amount > this.balance) return false; // the object guards its own rule
    this.balance -= amount;
    return true;
  }
  show(): string {
    return `${this.owner} has Rs ${this.balance}`;
  }
}

/** What the note's first code group prints — the gate ran all four programs; the model must agree with them. */
const ACCOUNT_OUTPUT = ["Ravi: withdrawal refused", "Asha has Rs 750", "Ravi has Rs 700"];

/** The note's Account class as UML, member for member (C++ version: owner and balance private, everything else public). */
const ACCOUNT: ClassSpec = {
  name: "Account",
  fields: ["- owner: string", "- balance: int"],
  methods: ["+ Account(owner, opening)", "+ deposit(amount): void", "+ withdraw(amount): bool", "+ show(): void"],
};

/** A UML object: "asha : Account" underlined over its field values. */
function objectBox(prefix: string, title: string, rows: readonly string[], o: { x: number; y: number; w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined }): { items: Item[]; h: number } {
  const head = 26;
  const h = head + rows.length * 16 + 8;
  const tw = title.length * 12 * 0.56;
  const items: Item[] = [
    { k: "cell", id: prefix, x: o.x, y: o.y, w: o.w, h, text: "", tone: o.tone ?? "plain" },
    { k: "text", id: `${prefix}-n`, x: o.x + o.w / 2, y: o.y + 13, text: title, tone: "ink", anchor: "middle", size: 12, mono: false, weight: 700 },
    { k: "path", id: `${prefix}-u`, pts: [[round(o.x + o.w / 2 - tw / 2), o.y + 21], [round(o.x + o.w / 2 + tw / 2), o.y + 21]], tone: "ink", width: 1 },
    { k: "path", id: `${prefix}-d`, pts: [[o.x, o.y + head], [o.x + o.w, o.y + head]], tone: "line", width: 1 },
  ];
  rows.forEach((r, i) => items.push({ k: "text", id: `${prefix}-r${i}`, x: o.x + 10, y: o.y + head + 12 + i * 16, text: r, tone: o.rowTone?.(i) ?? "ink", anchor: "start", size: 11.5, mono: true }));
  return { items, h };
}

/* ── Procedural vs object-oriented ────────────────────────────────── */

function proceduralVsOop(): Walkthrough {
  // The two accounts the note's program opens, before any call.
  const accounts = [new AccountModel("Asha", 500), new AccountModel("Ravi", 1000)];
  const fns = ["deposit(acc, n)", "withdraw(acc, n)", "show(acc)"];
  const methods = ["deposit", "withdraw", "show"];
  const items: Item[] = [];

  // Left: procedural — the records in one block, free functions beside it, and every function (or any other code) reaching every record.
  const FW = 134;
  const RH = 30;
  const rows = fns.length + 1;
  const OH = 84; // one object's box on the right
  const OG = 24;
  const span = 2 * OH + OG;
  const RG = (span - rows * RH) / (rows - 1);
  const DX = FW + 30;
  const DW = 86;
  const top = 18;
  items.push(label("lt", "Procedural", 0, -30, { anchor: "start", tone: "ink", weight: 700, size: 13 }));
  items.push(label("ls", "data and functions apart", 0, -13, { anchor: "start", tone: "soft", size: 11.5 }));
  items.push(...region("ldata", DX, top, DW, span, "records"));
  accounts.forEach((a, i) => items.push(box(`rec${i}`, DX + 7, top + span / 2 - RH - 4 + i * (RH + 8), `${a.owner.toLowerCase()} ${a.balance}`, { w: DW - 14, h: RH, size: 11.5 })));
  fns.forEach((f, i) => {
    const y = top + i * (RH + RG);
    items.push(box(`fn${i}`, 0, y, f, { w: FW, h: RH, size: 11 }));
    items.push(arrow(`fa${i}`, { x: FW + 2, y: y + RH / 2 }, { x: DX - 3, y: y + RH / 2 }, { tone: "line" }));
  });
  const sy = top + fns.length * (RH + RG);
  items.push(box("stray", 0, sy, "acc.balance = -500", { w: FW, h: RH, size: 11, tone: "error" }));
  items.push(arrow("sa", { x: FW + 2, y: sy + RH / 2 }, { x: DX - 3, y: sy + RH / 2 }, { tone: "error" }));

  // Right: object-oriented — each object holds its own balance, reachable only through its own methods.
  const RX = DX + DW + 36;
  const OW = 220;
  const MW = 70;
  items.push(label("rt", "Object-oriented", RX, -30, { anchor: "start", tone: "ink", weight: 700, size: 13 }));
  items.push(label("rs", "data and methods bundled", RX, -13, { anchor: "start", tone: "soft", size: 11.5 }));
  accounts.forEach((a, i) => {
    const y = top + i * (OH + OG);
    const id = a.owner.toLowerCase();
    items.push(...region(`obj${i}`, RX, y, OW, OH, `${id} : Account`, { tone: "accent", labelTone: "accent" }));
    const bx = RX + (OW - 104) / 2;
    items.push(box(`rec${i}r`, bx, y + 10, `balance ${a.balance}`, { w: 104, h: 26, size: 11.5, tone: "strong" }));
    methods.forEach((m, k) => {
      const mx = RX + (OW - 3 * MW - 2 * 6) / 2 + k * (MW + 6);
      items.push(box(`m${i}-${k}`, mx, y + OH - 34, `${m}()`, { w: MW, h: 24, size: 11 }));
      items.push(arrow(`ma${i}-${k}`, { x: mx + MW / 2, y: y + OH - 36 }, { x: bx + 52 + (k - 1) * 34, y: y + 39 }, { tone: "accent" }));
    });
  });
  return finish({
    title: "The same accounts, organised two ways",
    input: `Account("Asha", 500), Account("Ravi", 1000)`,
    frames: [
      {
        caption: `Left: the balances sit in plain records that every function is handed, so nothing stops some other line from writing a negative balance. Right: each object holds its own balance (${accounts[0].balance} and ${accounts[1].balance}), and only its own methods can change it.`,
        items,
      },
    ],
  });
}

/* ── A class stamps out objects; calls change one object's state ───── */

function blueprint(): Walkthrough {
  const cls = classBox("cls", ACCOUNT, { x: 0, y: 0 });
  const OX = cls.w + 70;
  const OW = 170;
  const objs = new Map<string, AccountModel>();
  const printed: string[] = [];
  const frames: Frame[] = [];

  const draw = (code: string, o: { hot?: string; refused?: boolean; out?: string[]; method?: string }): Item[] => {
    const items: Item[] = [...classBox("cls", ACCOUNT, { x: 0, y: 0, lineTone: (l) => (o.method && l.includes(`${o.method}(`) ? (o.refused ? "error" : "accent") : undefined) }).items];
    let y = 0;
    for (const [name, a] of objs) {
      const tone: Tone = o.hot === name ? (o.refused ? "error" : "accent") : "plain";
      const ob = objectBox(`o-${name}`, `${name} : Account`, [`owner = "${a.owner}"`, `balance = ${a.balance}`], { x: OX, y, w: OW, tone, rowTone: (i) => (i === 1 && o.hot === name ? (o.refused ? "error" : "accent") : "ink") });
      items.push(...ob.items);
      items.push(arrow(`i-${name}`, { x: OX - 2, y: y + 30 }, { x: cls.w + 3, y: Math.min(cls.h - 10, 30 + y * 0.4) }, { tone: "line", dashed: true }));
      y += ob.h + 26;
    }
    items.push(label("io", "instance of", (cls.w + OX) / 2, 15, { tone: "faint", size: 11 }));
    const CY = cls.h + 30;
    items.push(label("code", code, 0, CY, { anchor: "start", tone: "accent", mono: true, size: 12.5, weight: 600 }));
    (o.out ?? []).forEach((line, i) => items.push(label(`out${i}`, `> ${line}`, 0, CY + 22 + i * 18, { anchor: "start", tone: "soft", mono: true, size: 12 })));
    return items;
  };

  // The note's main(), statement by statement.
  objs.set("asha", new AccountModel("Asha", 500));
  frames.push({ caption: `The class is only a definition. The constructor call makes the first object, with its own owner and balance: asha starts with Rs ${objs.get("asha")!.balance}.`, items: draw('Account asha("Asha", 500);', { hot: "asha", method: "Account" }) });
  objs.set("ravi", new AccountModel("Ravi", 1000));
  frames.push({ caption: `A second object from the same class gets its own copy of every field: ravi's balance is ${objs.get("ravi")!.balance}, and the two objects share nothing but their methods.`, items: draw('Account ravi("Ravi", 1000);', { hot: "ravi", method: "Account" }) });
  objs.get("asha")!.deposit(250);
  frames.push({ caption: `deposit runs on asha alone: her balance becomes ${objs.get("asha")!.balance}, and ravi's ${objs.get("ravi")!.balance} does not move. The method found the right balance through the object it was called on.`, items: draw("asha.deposit(250);", { hot: "asha", method: "deposit" }) });
  const before = objs.get("ravi")!.balance;
  const ok = objs.get("ravi")!.withdraw(1500);
  if (ok) throw new Error("blueprint: withdraw(1500) should be refused");
  printed.push("Ravi: withdrawal refused");
  frames.push({ caption: `1500 is more than ravi's ${before}, so withdraw refuses and returns false. The balance cannot go negative because no code outside the class can write it.`, items: draw("ravi.withdraw(1500);", { hot: "ravi", refused: true, out: printed, method: "withdraw" }) });
  objs.get("ravi")!.withdraw(300);
  frames.push({ caption: `A withdrawal the balance can cover goes through: ${before} − 300 = ${objs.get("ravi")!.balance}.`, items: draw("ravi.withdraw(300);", { hot: "ravi", out: printed, method: "withdraw" }) });
  for (const a of objs.values()) printed.push(a.show());
  if (JSON.stringify(printed) !== JSON.stringify(ACCOUNT_OUTPUT)) throw new Error(`blueprint: model printed ${JSON.stringify(printed)}`);
  frames.push({ caption: `Each object reports its own state: ${printed[1]}, ${printed[2]}. One class, two objects, each with its own data and the same guarded behaviour.`, items: draw("asha.show(); ravi.show();", { out: printed, method: "show" }) });
  return finish({ title: "One class, two objects, each with its own state", input: 'asha = Account("Asha", 500), ravi = Account("Ravi", 1000)', frames });
}

/* ── The four pillars on the Shape program ────────────────────────── */

interface ShapeClass {
  spec: ClassSpec;
  parent?: string;
  /** The method bodies this class defines, as functions of its fields: what dispatch finds. */
  impl: Partial<Record<string, (f: Record<string, number>) => number | string>>;
}

/** The note's second code group, as class data. Shape declares both methods with no body (pure virtual / abstract). */
const SHAPES: Record<string, ShapeClass> = {
  Shape: { spec: { name: "Shape", stereotype: "abstract", methods: ["+ name(): string", "+ area(): int"] }, impl: {} },
  Rectangle: {
    parent: "Shape",
    spec: { name: "Rectangle", fields: ["- w: int", "- h: int"], methods: ["+ Rectangle(w, h)", "+ name(): string", "+ area(): int"] },
    impl: { name: () => "Rectangle", area: (f) => f.w * f.h },
  },
  Triangle: {
    parent: "Shape",
    spec: { name: "Triangle", fields: ["- base: int", "- height: int"], methods: ["+ Triangle(base, height)", "+ name(): string", "+ area(): int"] },
    impl: { name: () => "Triangle", area: (f) => Math.floor((f.base * f.height) / 2) },
  },
};

/** Run-time dispatch: start at the object's own class and walk up until a class defines the method. */
function dispatch(cls: string, method: string): { owner: string; fn: (f: Record<string, number>) => number | string } {
  for (let c: string | undefined = cls; c; c = SHAPES[c].parent) {
    const fn = SHAPES[c].impl[method];
    if (fn) return { owner: c, fn };
  }
  throw new Error(`fourPillars: ${cls} has no body for ${method}()`);
}

function fourPillars(): Walkthrough {
  const shape = classBox("shape", SHAPES.Shape.spec, { x: 0, y: 0, w: 170 });
  const rect = classBox("rect", SHAPES.Rectangle.spec, { x: 0, y: 0 });
  const tri = classBox("tri", SHAPES.Triangle.spec, { x: 0, y: 0 });
  const GAP = 44;
  const total = rect.w + GAP + tri.w;
  const CY = shape.h + 56;
  const place = (b: ReturnType<typeof classBox>, prefix: string, spec: ClassSpec, x: number, y: number, tone: Tone, lineTone?: (l: string) => TextTone | undefined) => classBox(prefix, spec, { x, y, w: b.w, tone, lineTone });

  // The loop of the note's main(): two objects, their fields, and what area() returns for each.
  const objects: Array<{ cls: string; fields: Record<string, number>; ctor: string }> = [
    { cls: "Rectangle", fields: { w: 4, h: 5 }, ctor: "Rectangle(4, 5)" },
    { cls: "Triangle", fields: { base: 6, height: 4 }, ctor: "Triangle(6, 4)" },
  ];
  const results = objects.map((o) => {
    const d = dispatch(o.cls, "area");
    const name = dispatch(o.cls, "name").fn(o.fields);
    return { ...o, owner: d.owner, area: Number(d.fn(o.fields)), name: String(name) };
  });
  const sum = results.reduce((s, r) => s + r.area, 0);
  if (results.some((r) => r.owner !== r.cls)) throw new Error("fourPillars: each shape should run its own area()");

  const draw = (hot: "abstraction" | "encapsulation" | "inheritance" | "polymorphism"): Item[] => {
    const sx = (total - shape.w) / 2;
    const s = place(shape, "shape", SHAPES.Shape.spec, sx, 0, hot === "abstraction" ? "accent" : "plain");
    const priv = (l: string): TextTone | undefined => (hot === "encapsulation" && l.startsWith("-") ? "accent" : hot === "encapsulation" ? "faint" : undefined);
    const poly = (l: string): TextTone | undefined => (hot === "polymorphism" && l.includes("area") ? "accent" : undefined);
    const r = place(rect, "rect", SHAPES.Rectangle.spec, 0, CY, "plain", (l) => priv(l) ?? poly(l));
    const t = place(tri, "tri", SHAPES.Triangle.spec, rect.w + GAP, CY, "plain", (l) => priv(l) ?? poly(l));
    const edge = hot === "inheritance" ? "accent" : "ink";
    const items: Item[] = [
      ...umlLink("inh-r", r.top, { x: sx + shape.w * 0.3, y: s.bottom.y }, "inherits", { tone: edge }),
      ...umlLink("inh-t", t.top, { x: sx + shape.w * 0.7, y: s.bottom.y }, "inherits", { tone: edge }),
      ...s.items,
      ...r.items,
      ...t.items,
    ];
    const BY = CY + Math.max(rect.h, tri.h) + 30;
    // The objects the loop walks over, under their classes; their results only once dispatch is the subject.
    results.forEach((res, i) => {
      const b = i === 0 ? r : t;
      items.push(label(`obj${i}`, res.ctor, b.x + b.w / 2, BY - 6, { tone: hot === "polymorphism" ? "soft" : "faint", mono: true, size: 11.5 }));
      if (hot === "polymorphism") items.push(label(`call${i}`, `area() = ${res.area}`, b.x + b.w / 2, BY + 12, { tone: "accent", mono: true, size: 12, weight: 600 }));
    });
    items.push(
      hot === "polymorphism"
        ? label("sum", `total = ${results.map((x) => x.area).join(" + ")} = ${sum}`, total / 2, BY + 40, { tone: "ink", mono: true, size: 12, weight: 600 })
        : label("sum", "for s in shapes: total += s.area()", total / 2, BY + 40, { tone: "faint", mono: true, size: 12 }),
    );
    return items;
  };

  return finish({
    title: "The four pillars in the note's Shape program",
    input: "shapes = [Rectangle(4, 5), Triangle(6, 4)]",
    frames: [
      { caption: "Abstraction: Shape says what every shape can do, name() and area(), and says nothing about how. It cannot be instantiated; callers are written against it.", items: draw("abstraction") },
      { caption: "Encapsulation: each concrete class keeps its own dimensions private. Nothing outside Rectangle can read or change w and h, so a rectangle's area depends only on its own constructor's values.", items: draw("encapsulation") },
      { caption: "Inheritance: Rectangle and Triangle are kinds of Shape (the hollow triangles point at the parent), so either one can be used wherever a Shape is expected.", items: draw("inheritance") },
      {
        caption: `Polymorphism: the loop calls s.area() without knowing which shape it holds, and each object runs its own class's version — ${results[0].area} for the rectangle, ${results[1].area} for the triangle, ${sum} in total.`,
        items: draw("polymorphism"),
      },
    ],
  });
}

/* ── What each style makes cheap: new types or new operations ──────── */

/** "both" for two, "all 3" beyond. */
const every = (n: number) => (n === 2 ? "both" : `all ${n}`);

function typesVsOperations(): Walkthrough {
  // The Shape program's code as a grid: one piece of code per (type, operation).
  const types = ["Rectangle", "Triangle"];
  const ops = ["name()", "area()"];
  const newType = "Circle";
  const newOp = "perimeter()";
  const allTypes = [...types, newType];
  const allOps = [...ops, newOp];
  const W = 92;
  const H = 30;
  const G = 6;
  const X0 = 86;
  const Y0 = 34;
  const cx = (c: number) => X0 + c * (W + G);
  const cy = (r: number) => Y0 + r * (H + G);

  const draw = (style: "oop" | "proc"): { items: Item[]; newTypeEdits: number; newOpEdits: number } => {
    const items: Item[] = [];
    // The grouping each style puts code in: a class per row, or a function per column.
    if (style === "oop") allTypes.forEach((t, r) => items.push({ k: "band", id: `g${r}`, x: cx(0) - 5, y: cy(r) - 4, w: allOps.length * (W + G) + 4, h: H + 8, tone: t === newType ? "strong" : "accent" }));
    else allOps.forEach((op, c) => items.push({ k: "band", id: `g${c}`, x: cx(c) - 4, y: cy(0) - 5, w: W + 8, h: allTypes.length * (H + G) + 4, tone: op === newOp ? "strong" : "accent" }));
    allTypes.forEach((t, r) => items.push(label(`rl${r}`, t, X0 - 10, cy(r) + H / 2, { anchor: "end", tone: t === newType ? "accent" : "ink", size: 12, weight: 600 })));
    allOps.forEach((op, c) => items.push(label(`cl${c}`, op, cx(c) + W / 2, Y0 - 14, { tone: op === newOp ? "accent" : "ink", mono: true, size: 12, weight: 600 })));
    let newTypeEdits = 0;
    let newOpEdits = 0;
    allTypes.forEach((t, r) =>
      allOps.forEach((op, c) => {
        const fresh = t === newType || op === newOp;
        items.push(box(`c${r}-${c}`, cx(c), cy(r), fresh ? "new" : "code", { w: W, h: H, size: 11.5, tone: fresh ? "ghost" : "plain" }));
      }),
    );
    // Count the units of code (classes or functions) each change has to open.
    if (style === "oop") {
      newTypeEdits = 1; // the Circle row is one new class
      newOpEdits = types.length; // a perimeter() method in every existing class
    } else {
      newOpEdits = 1; // one new function
      newTypeEdits = ops.length; // a Circle case in every existing function
    }
    const groupName = style === "oop" ? "class" : "function";
    const many = (n: number) => `edit ${n} ${groupName}${groupName.endsWith("s") ? "es" : "s"}`;
    const BY = cy(allTypes.length) + 10;
    items.push(label("t1", `new type ${newType}: ${newTypeEdits === 1 ? `1 new ${groupName}` : many(newTypeEdits)}`, X0 - 70, BY, { anchor: "start", tone: newTypeEdits === 1 ? "accent" : "ink", size: 12, weight: 600 }));
    items.push(label("t2", `new operation ${newOp}: ${newOpEdits === 1 ? `1 new ${groupName}` : many(newOpEdits)}`, X0 - 70, BY + 20, { anchor: "start", tone: newOpEdits === 1 ? "accent" : "ink", size: 12, weight: 600 }));
    items.push(label("hd", style === "oop" ? "Object-oriented: one class per row" : "Procedural: one function per column", X0 - 70, -2, { anchor: "start", tone: "ink", size: 13, weight: 700 }));
    return { items, newTypeEdits, newOpEdits };
  };

  const oop = draw("oop");
  const proc = draw("proc");
  return finish({
    title: "What each style makes cheap: a new type or a new operation",
    input: "types: Rectangle, Triangle; operations: name(), area()",
    frames: [
      {
        caption: `In OOP every row of this grid is a class. Adding ${newType} is one new class written in one place; adding ${newOp} means opening ${every(oop.newOpEdits)} existing classes to add a method.`,
        items: oop.items,
      },
      {
        caption: `Procedural code groups the same grid by column: each operation is one function that switches on the kind of shape. Adding ${newOp} is one new function; adding ${newType} means a new case in ${every(proc.newTypeEdits)} existing functions.`,
        items: proc.items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "procedural-vs-oop": proceduralVsOop,
  "class-and-objects": blueprint,
  "four-pillars": fourPillars,
  "types-vs-operations": typesVsOperations,
};
