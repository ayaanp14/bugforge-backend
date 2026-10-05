import { finish, round, textWidth, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox } from "./kit.js";

/**
 * Encapsulation: the note's figures (content/notes/oop/encapsulation.md
 * places each with "@figure <name>").
 *
 * The access figure reads Java's four access levels from one table (the
 * note's) and draws, for each, which code may use a field; the guard
 * figure runs a model of the note's Product class — the same checks in the
 * constructor, the setters and sell(), the same calls in the same order —
 * and checks its printout against the output the gate got from the real
 * programs; the immutability figures run the note's Money and Roster
 * programs on a model heap of references, with and without the defensive
 * copy, and check the sizes and amounts they print.
 */

/** A UML object: "pen : Product" underlined over its field values. */
function objectBox(prefix: string, title: string, rows: readonly string[], o: { x: number; y: number; w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined }): { items: Item[]; h: number } {
  const head = 24;
  const h = head + rows.length * 16 + 8;
  const tw = textWidth(title, 12, false);
  const items: Item[] = [
    { k: "cell", id: prefix, x: o.x, y: o.y, w: o.w, h, text: "", tone: o.tone ?? "plain" },
    { k: "text", id: `${prefix}-n`, x: o.x + o.w / 2, y: o.y + 12, text: title, tone: "ink", anchor: "middle", size: 12, mono: false, weight: 700 },
    { k: "path", id: `${prefix}-u`, pts: [[round(o.x + o.w / 2 - tw / 2), o.y + 20], [round(o.x + o.w / 2 + tw / 2), o.y + 20]], tone: "ink", width: 1 },
    { k: "path", id: `${prefix}-d`, pts: [[o.x, o.y + head], [o.x + o.w, o.y + head]], tone: "line", width: 1 },
  ];
  rows.forEach((r, i) => items.push({ k: "text", id: `${prefix}-r${i}`, x: o.x + 10, y: o.y + head + 12 + i * 16, text: r, tone: o.rowTone?.(i) ?? "ink", anchor: "start", size: 11.5, mono: true }));
  return { items, h };
}

/** Output lines under a figure; the ones this step printed in ink, earlier ones faint. */
function printout(prefix: string, lines: readonly string[], x: number, y: number, fresh: number): Item[] {
  return lines.map((l, i) => label(`${prefix}${i}`, `> ${l}`, x, y + i * 18, { anchor: "start", tone: i >= lines.length - fresh ? "ink" : "faint", mono: true, size: 12 }));
}

/* ── Java's access levels: who can use a field ────────────────────── */

type Zone = "class" | "package" | "subclass" | "world";
/** The note's Java table, row by row: which code can use a member declared with each modifier. */
const ACCESS: ReadonlyArray<{ modifier: string; decl: string; zones: readonly Zone[] }> = [
  { modifier: "private", decl: "private int stock;", zones: ["class"] },
  { modifier: "package-private", decl: "int stock;  // no modifier", zones: ["class", "package"] },
  { modifier: "protected", decl: "protected int stock;", zones: ["class", "package", "subclass"] },
  { modifier: "public", decl: "public int stock;", zones: ["class", "package", "subclass", "world"] },
];

function accessLevels(): Walkthrough {
  // Each level must reach everything the one before it reached: the levels nest.
  ACCESS.forEach((a, i) => {
    if (i > 0 && !ACCESS[i - 1].zones.every((z) => a.zones.includes(z))) throw new Error(`accessLevels: ${a.modifier} does not include ${ACCESS[i - 1].modifier}`);
  });
  const ZONE_NAME: Record<Zone, string> = { class: "Product's own methods", package: "Inventory (same package)", subclass: "SalePen (subclass, other package)", world: "Main (other package)" };
  const PX = 0;
  const AX = 262;
  const W = 200;
  // Who tries to use stock, and where they sit.
  const users: Array<{ zone: Exclude<Zone, "class">; name: string; sub: string; x: number; y: number }> = [
    { zone: "package", name: "Inventory", sub: "same package", x: PX + 14, y: 124 },
    { zone: "subclass", name: "SalePen extends Product", sub: "subclass, other package", x: AX + 14, y: 20 },
    { zone: "world", name: "Main", sub: "unrelated, other package", x: AX + 14, y: 124 },
  ];
  const frames: Frame[] = ACCESS.map((a) => {
    const items: Item[] = [];
    items.push(...region("pk1", PX, 0, W, 186, "package shop"));
    items.push(...region("pk2", AX, 0, W, 186, "package app"));
    const pb = classBox("prod", { name: "Product", fields: [a.decl.replace(/;.*$/, ";")], methods: ["void sell(int qty)"] }, { x: PX + 14, y: 20, w: W - 28, lineTone: (l) => (l.includes("stock") || l.includes("sell") ? "accent" : undefined) });
    items.push(...pb.items);
    const stockY = 20 + 26 + 4 + 8;
    for (const u of users) {
      const ok = a.zones.includes(u.zone);
      items.push(box(`u-${u.zone}`, u.x, u.y, "", { w: W - 28, h: 44, tone: ok ? "accent" : "plain" }));
      items.push(label(`un-${u.zone}`, u.name, u.x + (W - 28) / 2, u.y + 14, { tone: "ink", size: 11.5, weight: 700 }));
      items.push(label(`us-${u.zone}`, ok ? (u.zone === "subclass" ? "can use its own stock" : "can use stock") : "compile error", u.x + (W - 28) / 2, u.y + 31, { tone: ok ? "accent" : "error", size: 11.5, weight: 600 }));
      const tone: LineTone = ok ? "accent" : "error";
      const to = u.zone === "package" ? { x: PX + W / 2, y: 20 + pb.h + 2 } : u.zone === "subclass" ? { x: PX + W - 14 + 2, y: stockY } : { x: PX + W - 14 + 2, y: 20 + pb.h - 10 };
      const from = u.zone === "package" ? { x: u.x + (W - 28) / 2, y: u.y - 2 } : { x: u.x - 2, y: u.y + 22 };
      items.push(arrow(`a-${u.zone}`, from, to, { tone, dashed: !ok }));
    }
    items.push(label("decl", a.decl, PX, 206, { anchor: "start", tone: "accent", mono: true, size: 12.5, weight: 600 }));
    const reach = a.zones.map((z) => ZONE_NAME[z]);
    const caption =
      a.modifier === "private"
        ? `private: only Product's own code, such as sell(), may touch stock. Inventory, the subclass and Main all fail to compile, which is what lets Product keep its invariant.`
        : a.modifier === "package-private"
          ? `With no modifier, Java opens the member to every class in package shop, so Inventory compiles too. Code in another package, even a subclass, still cannot see it.`
          : a.modifier === "protected"
            ? `protected adds subclasses in other packages, through their own type: SalePen can use the stock it inherits. Java's protected also keeps the whole package, which C++'s does not.`
            : `public removes the wall: all ${reach.length} kinds of code can read and write stock, including Main, and Product can no longer promise anything about its value.`;
    return { caption, items };
  });
  return finish({ title: "Who can use a field, for each of Java's four access levels", input: "class Product in package shop; SalePen and Main in package app", frames });
}

/* ── The note's Product program: every change goes through a check ──── */

class ProductModel {
  price = 0;
  stock = 0;
  constructor(
    readonly name: string,
    price: number,
    stock: number,
  ) {
    this.setPrice(price); // the constructor uses the same checks
    this.setStock(stock);
  }
  setPrice(p: number): void {
    if (p <= 0) throw new RangeError("price must be positive");
    this.price = p;
  }
  setStock(s: number): void {
    if (s < 0) throw new RangeError("stock cannot be negative");
    this.stock = s;
  }
  sell(qty: number): void {
    if (qty > this.stock) throw new RangeError(`only ${this.stock} in stock`);
    this.stock -= qty;
  }
  show(): string {
    return `${this.name}: Rs ${this.price}, stock ${this.stock}`;
  }
}

/** The note's Product program's printout (its output fence). */
const PRODUCT_OUTPUT = ["Pen: Rs 20, stock 100", "rejected: price must be positive", "rejected: stock cannot be negative", "rejected: only 70 in stock", "Pen: Rs 25, stock 70"];

function invariantGuard(): Walkthrough {
  const DOORS = ["setPrice", "setStock", "sell", "show"];
  const FIELDS = ["price", "stock"] as const;
  const RX = 120;
  const RW = 320;
  const DW = 92;
  const DY = (i: number) => 22 + i * 38;
  const FX = RX + 150;
  const FY = (f: (typeof FIELDS)[number]) => (f === "price" ? 40 : 98);
  const printed: string[] = [];
  const frames: Frame[] = [];
  let pen: ProductModel | null = null;

  const draw = (code: string, o: { door?: string; field?: (typeof FIELDS)[number]; refused?: boolean; direct?: boolean; fresh?: number }): Item[] => {
    const items: Item[] = [];
    items.push(...region("obj", RX, 0, RW, 170, "pen : Product — fields private, methods public", { tone: "plain" }));
    DOORS.forEach((d, i) => {
      const hot = o.door === d;
      items.push(box(`d-${d}`, RX - DW / 2, DY(i), `${d}()`, { w: DW, h: 30, size: 11.5, tone: hot ? (o.refused ? "error" : "accent") : "plain" }));
    });
    items.push(label("nm", `name = "${pen?.name ?? ""}"`, FX + 60, 150, { tone: "soft", mono: true, size: 11.5 }));
    for (const f of FIELDS) {
      const hot = o.field === f;
      items.push(box(`f-${f}`, FX, FY(f), `${f} = ${pen ? pen[f] : "?"}`, { w: 120, h: 32, size: 12.5, tone: hot ? (o.refused ? "error" : "strong") : "plain" }));
    }
    if (o.door) {
      const i = DOORS.indexOf(o.door);
      items.push(arrow("call", { x: 0, y: DY(i) + 15 }, { x: RX - DW / 2 - 3, y: DY(i) + 15 }, { tone: o.refused ? "error" : "accent" }));
      if (o.field && !o.refused) items.push(arrow("write", { x: RX + DW / 2 + 2, y: DY(i) + 15 }, { x: FX - 3, y: FY(o.field) + 16 }, { tone: "accent" }));
      if (o.refused) items.push(label("no", "throws", (RX - DW / 2) / 2, DY(i) + 4, { tone: "error", size: 11.5, weight: 600 }));
    }
    if (o.direct) {
      // Straight at the field from outside, stopped by the object's edge.
      items.push(arrow("call", { x: FX + 60, y: 232 }, { x: FX + 60, y: 174 }, { tone: "error", dashed: true }));
      items.push(label("no", "stock has private access", FX + 68, 206, { anchor: "start", tone: "error", size: 11.5, weight: 600 }));
    }
    items.push(label("code", code, 0, 194, { anchor: "start", tone: o.refused || o.direct ? "error" : "accent", mono: true, size: 12.5, weight: 600 }));
    items.push(...printout("out", printed, 0, 216, o.fresh ?? 0));
    return items;
  };

  const attempt = (fn: () => void): string | null => {
    try {
      fn();
      return null;
    } catch (e) {
      const msg = `rejected: ${(e as Error).message}`;
      printed.push(msg);
      return msg;
    }
  };

  pen = new ProductModel("Pen", 20, 100);
  printed.push(pen.show());
  frames.push({ caption: `The constructor runs the same setPrice and setStock checks as everyone else, so pen starts valid: price ${pen.price}, stock ${pen.stock}. An invalid Product can never be created.`, items: draw('new Product("Pen", 20, 100);', { fresh: 1 }) });
  frames.push({ caption: "Outside code cannot reach a private field at all: this line does not compile. The public methods on the object's edge are the only way in, and each one checks before it writes.", items: draw("pen.stock = -1;", { direct: true }) });
  const p0 = pen.price;
  if (!attempt(() => pen!.setPrice(-5))) throw new Error("invariantGuard: setPrice(-5) should throw");
  frames.push({ caption: `setPrice(-5) fails its check and throws before the assignment, so price is still ${pen.price}. A failed call leaves the object exactly as it was.`, items: draw("pen.setPrice(-5);", { door: "setPrice", field: "price", refused: true, fresh: 1 }) });
  if (pen.price !== p0) throw new Error("invariantGuard: a rejected setPrice changed price");
  if (!attempt(() => pen!.setStock(-1))) throw new Error("invariantGuard: setStock(-1) should throw");
  frames.push({ caption: `setStock(-1) is refused the same way: stock stays ${pen.stock}, because stock may never be negative.`, items: draw("pen.setStock(-1);", { door: "setStock", field: "stock", refused: true, fresh: 1 }) });
  const s0 = pen.stock;
  attempt(() => pen!.sell(30));
  frames.push({ caption: `sell(30) is an operation, not a raw setter: it checks there is enough stock, then writes ${s0} − 30 = ${pen.stock} itself.`, items: draw("pen.sell(30);", { door: "sell", field: "stock" }) });
  const msg = attempt(() => pen!.sell(500));
  if (!msg) throw new Error("invariantGuard: sell(500) should throw");
  frames.push({ caption: `sell(500) asks for more than the ${pen.stock} in stock, so sell refuses and says why. The caller never had to check; the rule lives in one place.`, items: draw("pen.sell(500);", { door: "sell", field: "stock", refused: true, fresh: 1 }) });
  attempt(() => pen!.setPrice(25));
  printed.push(pen.show());
  if (JSON.stringify(printed) !== JSON.stringify(PRODUCT_OUTPUT)) throw new Error(`invariantGuard: model printed ${JSON.stringify(printed)}`);
  frames.push({ caption: `A valid price goes through: price becomes ${pen.price}. Of the six calls, three were refused, and stock and price kept their rules after every one.`, items: draw("pen.setPrice(25); pen.show();", { door: "setPrice", field: "price", fresh: 1 }) });
  return finish({ title: "Every change to pen goes through a method that checks it", input: 'pen = Product("Pen", 20, 100)', frames });
}

/* ── Immutable Money: plus returns a new object ───────────────────── */

const MONEY_OUTPUT = ["price: INR 499.50", "total: INR 549.75"];

function moneyPlus(): Walkthrough {
  const heap: Array<{ paise: number; currency: string }> = [];
  const vars = new Map<string, number>();
  const fmt = (m: { paise: number; currency: string }) => `${m.currency} ${Math.floor(m.paise / 100)}.${String(m.paise % 100).padStart(2, "0")}`;
  const VX = 0;
  const HX = 140;
  const draw = (code: string, hot: number[], o: { temp?: number } = {}): Item[] => {
    const ROW = 72;
    const items: Item[] = [...region("rv", VX, 0, 96, 3 * ROW + 8, "variables"), ...region("rh", HX, 0, 200, 3 * ROW + 8, "objects (never changed)")];
    heap.forEach((m, i) => {
      const b = objectBox(`m${i}`, i === o.temp ? "Money (the argument)" : "Money", [`paise = ${m.paise}`, `currency = "${m.currency}"`], { x: HX + 14, y: 10 + i * ROW, w: 172, tone: hot.includes(i) ? "accent" : "plain" });
      items.push(...b.items);
    });
    for (const [v, t] of vars) {
      const y = 10 + t * ROW + 17;
      items.push(box(`v-${v}`, VX + 12, y, v, { w: 60, h: 30, size: 12.5 }));
      items.push(arrow(`r-${v}`, { x: VX + 74, y: y + 15 }, { x: HX + 12, y: y + 15 }, { tone: hot.includes(t) ? "accent" : "ink" }));
    }
    items.push(label("code", code, 0, 3 * ROW + 32, { anchor: "start", tone: "accent", mono: true, size: 12.5, weight: 600 }));
    return items;
  };
  const frames: Frame[] = [];
  heap.push({ paise: 49950, currency: "INR" });
  vars.set("price", 0);
  frames.push({ caption: `price refers to a Money of ${heap[0].paise} paise, ${fmt(heap[0])}. Its fields are private and final, and Money has no setters, so this object will hold that amount for as long as it exists.`, items: draw("Money price = new Money(49950, \"INR\");", [0]) });
  heap.push({ paise: 5025, currency: "INR" });
  const sum = { paise: heap[0].paise + heap[1].paise, currency: heap[0].currency }; // plus(): a new Money, never this one changed
  heap.push(sum);
  vars.set("total", 2);
  const printed = [`price: ${fmt(heap[vars.get("price")!])}`, `total: ${fmt(heap[vars.get("total")!])}`];
  if (JSON.stringify(printed) !== JSON.stringify(MONEY_OUTPUT)) throw new Error(`moneyPlus: model printed ${JSON.stringify(printed)}`);
  frames.push({
    caption: `plus does not add into price. It builds a third object holding ${heap[0].paise} + ${heap[1].paise} = ${sum.paise} paise, and price still reads ${fmt(heap[0])} while total reads ${fmt(sum)}.`,
    items: draw("Money total = price.plus(new Money(5025, \"INR\"));", [2], { temp: 1 }),
  });
  return finish({ title: "An immutable object is never changed; a change makes a new one", input: "price = Money(49950, \"INR\"); total = price.plus(Money(5025, \"INR\"))", frames });
}

/* ── Roster: the defensive copy ──────────────────────────────────── */

function defensiveCopy(): Walkthrough {
  const run = (copy: boolean) => {
    const lists: string[][] = [];
    lists.push(["Asha", "Ravi"]); // input
    const input = 0;
    let names: number;
    if (copy) {
      lists.push([...lists[input]]); // List.copyOf(names) / tuple(names)
      names = lists.length - 1;
    } else names = input; // this.names = names: the caller's own list
    return { lists, input, names };
  };
  const VX = 0;
  const HX = 160;
  const draw = (r: ReturnType<typeof run>, o: { code: string; size?: number; bad?: boolean }): Item[] => {
    const items: Item[] = [...region("rv", VX, 0, 120, 150, "references"), ...region("rh", HX, 0, 240, 150, "lists")];
    r.lists.forEach((l, i) => {
      const y = 14 + i * 66;
      items.push(label(`ln${i}`, i === r.input ? "caller's list" : "Roster's own copy", HX + 14, y + 6, { anchor: "start", tone: "soft", size: 11 }));
      l.forEach((name, k) => items.push(box(`l${i}-${k}`, HX + 14 + k * 70, y + 16, `"${name}"`, { w: 64, h: 28, size: 11.5, tone: k >= 2 ? "accent" : "plain" })));
    });
    const refs: Array<[string, number]> = [["input", r.input], ["roster.names", r.names]];
    refs.forEach(([v, t], k) => {
      const y = 24 + k * 66;
      items.push(box(`v${k}`, VX + 10, y, v, { w: 100, h: 30, size: 11.5 }));
      items.push(arrow(`r${k}`, { x: VX + 112, y: y + 15 }, { x: HX + 12, y: 14 + t * 66 + 30 }, { tone: v === "roster.names" && o.bad ? "error" : "ink" }));
    });
    items.push(label("code", o.code, 0, 172, { anchor: "start", tone: o.bad ? "error" : "accent", mono: true, size: 12.5, weight: 600 }));
    if (o.size !== undefined) items.push(label("res", `roster.size() → ${o.size}`, 0, 194, { anchor: "start", tone: o.bad ? "error" : "ink", mono: true, size: 12.5, weight: 600 }));
    return items;
  };
  const good = run(true);
  const f1 = draw(good, { code: "Roster roster = new Roster(input);  // List.copyOf" });
  good.lists[good.input].push("Kiran");
  const goodSize = good.lists[good.names].length;
  if (goodSize !== 2) throw new Error(`defensiveCopy: with the copy the roster should report 2, got ${goodSize}`);
  const f2 = draw(good, { code: 'input.add("Kiran");', size: goodSize });
  const bad = run(false);
  bad.lists[bad.input].push("Kiran");
  const badSize = bad.lists[bad.names].length;
  const f3 = draw(bad, { code: "this.names = names;  // no copy", size: badSize, bad: true });
  return finish({
    title: "Why an immutable class copies the list it is given",
    input: 'input = ["Asha", "Ravi"]; roster = Roster(input); input.add("Kiran")',
    frames: [
      { caption: "The constructor copies the caller's list, so the roster's field refers to a list nobody else holds. Two references, two lists.", items: f1 },
      { caption: `The caller adds Kiran to its own list, which now holds ${good.lists[good.input].length} names. The roster's copy is untouched and size() still says ${goodSize}, as the note's program prints.`, items: f2 },
      { caption: `Without the copy, the field is one more reference to the caller's list, and the same add changes the "immutable" roster behind its back: size() says ${badSize}.`, items: f3 },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "access-levels": accessLevels,
  "invariant-guard": invariantGuard,
  "money-plus": moneyPlus,
  "defensive-copy": defensiveCopy,
};
