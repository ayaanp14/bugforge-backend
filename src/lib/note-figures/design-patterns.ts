import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink, type ClassSpec } from "./kit.js";

/**
 * Design Patterns for Interviews: the note's figures
 * (content/notes/oop/design-patterns.md places each with "@figure <name>").
 * Each pattern is drawn from the note's own program — class boxes carry the
 * members of its Java version (types dropped where they crowd), and every
 * behaviour is a small model of that program run in TypeScript, its printed
 * lines checked against the note's output fence:
 *
 *  - singleton: Config.instance() called twice on a model of Java's lazy
 *    holder idiom — one object, created once;
 *  - builder: the chained Pizza.Builder calls, each returning the builder,
 *    then build() copying it into an immutable Pizza;
 *  - decorator-classes: the Coffee / AddOn class diagram;
 *  - decorator-calls: order.cost() going down the wrappers and the total
 *    building up on the way back;
 *  - observer: the Ticker notifying its subscribers in order, as a sequence
 *    diagram, one call per frame;
 *  - strategy: the Cart / ShippingStrategy class diagram with each
 *    strategy's fee computed for the note's carts.
 */

const HEAD = 22;
const ROW = 20;

/** An object: a header with its name, then one row per field. */
function objectBox(id: string, x: number, y: number, title: string, rows: readonly string[], o: { w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined }) {
  const tone = o.tone ?? "plain";
  const h = HEAD + rows.length * ROW + (rows.length ? 4 : 0);
  const items: Item[] = [{ k: "cell", id, x, y, w: o.w, h, text: "", tone }];
  items.push({ k: "text", id: `${id}-n`, x: x + o.w / 2, y: y + HEAD / 2 + 1, text: title, tone: tone === "muted" ? "faint" : "ink", anchor: "middle", size: 12, mono: false, weight: 700 });
  if (rows.length) items.push({ k: "path", id: `${id}-d`, pts: [[x, y + HEAD], [x + o.w, y + HEAD]], tone: "line", width: 1 });
  const rowMid = (i: number) => y + HEAD + 2 + ROW / 2 + i * ROW;
  rows.forEach((r, i) => items.push({ k: "text", id: `${id}-r${i}`, x: x + 8, y: rowMid(i), text: r, tone: o.rowTone?.(i) ?? "ink", anchor: "start", size: 11.5, mono: true }));
  return { items, h, rowMid, left: x, right: x + o.w, top: y, bottom: y + h, mid: x + o.w / 2 };
}

/** The printed lines so far, under a small heading; lines from `fresh` on are the step's own. */
function consoleLines(prefix: string, out: readonly string[], x: number, y: number, fresh = out.length): Item[] {
  const items: Item[] = [label(`${prefix}-h`, "output", x, y, { anchor: "start", size: 11, weight: 600 })];
  out.forEach((t, i) => items.push({ k: "text", id: `${prefix}${i}`, x, y: y + 18 + i * 16, text: t, tone: i >= fresh ? "accent" : "ink", anchor: "start", size: 11, mono: true }));
  return items;
}

const sameLines = (a: readonly string[], b: readonly string[], what: string) => {
  if (a.join("\n") !== b.join("\n")) throw new Error(`${what}: the model printed ${JSON.stringify(a)}`);
};

/* ── Singleton ────────────────────────────────────────────────────── */

const SINGLETON_OUTPUT = ["same instance: yes", "log level seen through b: DEBUG", "instances created: 1"];

function singleton(): Walkthrough {
  // Java's holder idiom: Holder (and its INSTANCE) is initialised the first time instance() touches it.
  const statics = { created: 0, holderLoaded: false, instance: null as number | null };
  const heap: Array<{ logLevel: string }> = [];
  const vars: Record<string, number> = {};
  const instance = () => {
    if (!statics.holderLoaded) {
      statics.holderLoaded = true;
      heap.push({ logLevel: "INFO" }); // private Config() { created++; }
      statics.created++;
      statics.instance = heap.length - 1;
    }
    return statics.instance!;
  };
  type Snap = { statics: typeof statics; heap: typeof heap; vars: typeof vars; out: string[] };
  const out: string[] = [];
  const snaps: Snap[] = [];
  const snap = () => snaps.push({ statics: { ...statics }, heap: heap.map((o) => ({ ...o })), vars: { ...vars }, out: [...out] });
  snap();
  vars.a = instance();
  snap();
  vars.b = instance();
  snap();
  heap[vars.a].logLevel = "DEBUG";
  out.push(`same instance: ${vars.a === vars.b ? "yes" : "no"}`);
  out.push(`log level seen through b: ${heap[vars.b].logLevel}`);
  out.push(`instances created: ${statics.created}`);
  snap();
  sameLines(out, SINGLETON_OUTPUT, "singleton");

  const CX = 104;
  const HY = 128;
  const draw = (s: Snap, o: { hot?: string[]; fresh?: number }): Item[] => {
    const hot = new Set(o.hot ?? []);
    const items: Item[] = [...region("cls", CX - 12, 0, 196, 88, "class Config (static)"), ...region("vars", 0, HY - 12, 72, 92, "variables"), ...region("heap", CX - 12, HY - 12, 196, 92, "heap")];
    const st = objectBox("st", CX, 12, "Config", [`created = ${s.statics.created}`, s.statics.holderLoaded ? "INSTANCE ●" : "Holder not loaded"], {
      w: 172,
      tone: hot.has("st") ? "accent" : "plain",
      rowTone: (i) => (hot.has(`st${i}`) ? "accent" : undefined),
    });
    items.push(...st.items);
    let obj: ReturnType<typeof objectBox> | undefined;
    if (s.heap.length) {
      obj = objectBox("obj", CX, HY + 10, "Config object", [`logLevel = "${s.heap[0].logLevel}"`], { w: 172, tone: hot.has("obj") ? "accent" : "plain", rowTone: () => (hot.has("log") ? "accent" : undefined) });
      items.push(...obj.items);
      // "INSTANCE ●": the dot sits nine characters in (11.5 px mono); the reference runs straight down from it.
      const dot = CX + 8 + 9 * 6.9 + 3.5;
      items.push(arrow("inst", { x: dot, y: st.rowMid(1) + 6 }, { x: dot, y: obj.top - 1 }, { tone: hot.has("st") ? "accent" : "ink" }));
    }
    (["a", "b"] as const).forEach((v, i) => {
      if (!(v in s.vars)) return;
      const y = HY + 2 + i * 34;
      items.push(label(`vn${v}`, v, 12, y + 11, { anchor: "start", tone: "ink", size: 12.5, mono: true }));
      items.push(box(`vb${v}`, 32, y, "●", { w: 22, h: 22, size: 11, tone: hot.has(v) ? "accent" : "plain" }));
      if (obj) items.push(arrow(`va${v}`, { x: 54, y: y + 11 }, { x: CX - 1, y: obj.top + 11 + i * 22 }, { tone: hot.has(v) ? "accent" : "ink" }));
    });
    items.push(...consoleLines("out", s.out, 0, HY + 104, o.fresh));
    return items;
  };
  const [s0, s1, s2, s3] = snaps;
  return finish({
    title: "Singleton: two calls to instance(), one object",
    input: "Config a = Config.instance(); Config b = Config.instance();",
    frames: [
      { caption: "Before the first call nothing exists: no Config object, and the nested Holder class has not even been loaded. The constructor is private, so instance() is the only way in.", items: draw(s0, {}) },
      {
        caption: `The first instance() call loads Holder, whose static initialiser runs new Config() — created becomes ${s1.statics.created} — and a receives that object.`,
        items: draw(s1, { hot: ["st", "st0", "st1", "obj", "a"] }),
      },
      { caption: `The second call finds Holder already initialised and returns the same object; created stays ${s2.statics.created}. No lock is needed: the JVM initialises a class once.`, items: draw(s2, { hot: ["b"] }) },
      { caption: "a.setLogLevel(\"DEBUG\") changes the one object, so b sees DEBUG too: a == b is true and exactly one instance was ever created.", items: draw(s3, { hot: ["log"], fresh: 0 }) },
    ],
  });
}

/* ── Builder ──────────────────────────────────────────────────────── */

const BUILDER_OUTPUT = ["Large pizza, cheese=true, olives=false, extras=2", "Small pizza, cheese=false, olives=true, extras=0"];

class PizzaBuilder {
  cheese = false;
  olives = false;
  extras = 0;
  constructor(readonly size: string) {}
  withCheese() {
    this.cheese = true;
    return this;
  }
  withOlives() {
    this.olives = true;
    return this;
  }
  withExtras(n: number) {
    if (n < 0) throw new RangeError("extras cannot be negative");
    this.extras = n;
    return this;
  }
  build() {
    return Object.freeze({ size: this.size, cheese: this.cheese, olives: this.olives, extras: this.extras });
  }
}
const pizzaString = (p: ReturnType<PizzaBuilder["build"]>) => `${p.size} pizza, cheese=${p.cheese}, olives=${p.olives}, extras=${p.extras}`;

function builder(): Walkthrough {
  // Both of the note's chains, run; the first is drawn step by step.
  sameLines([pizzaString(new PizzaBuilder("Large").withCheese().withExtras(2).build()), pizzaString(new PizzaBuilder("Small").withOlives().build())], BUILDER_OUTPUT, "builder");
  const chain = ['new Pizza.Builder("Large")', ".cheese()", ".extras(2)", ".build()"];
  const b = new PizzaBuilder("Large");
  type Snap = { fields: [string, string][]; changed: number[]; returned: "builder" | "pizza"; pizza?: ReturnType<PizzaBuilder["build"]> };
  const fieldsOf = (x: PizzaBuilder): [string, string][] => [
    ["size", `"${x.size}"`],
    ["cheese", String(x.cheese)],
    ["olives", String(x.olives)],
    ["extras", String(x.extras)],
  ];
  const snaps: Snap[] = [];
  let prev = fieldsOf(b);
  const step = (fn: () => PizzaBuilder) => {
    const r = fn();
    if (r !== b) throw new Error("builder: each step must return the same builder");
    const now = fieldsOf(b);
    snaps.push({ fields: now, changed: now.flatMap((f, i) => (f[1] !== prev[i][1] ? [i] : [])), returned: "builder" });
    prev = now;
  };
  snaps.push({ fields: fieldsOf(b), changed: [0], returned: "builder" });
  step(() => b.withCheese());
  step(() => b.withExtras(2));
  const pizza = b.build();
  snaps.push({ fields: fieldsOf(b), changed: [], returned: "pizza", pizza });
  if (pizzaString(pizza) !== BUILDER_OUTPUT[0]) throw new Error("builder: the drawn chain does not print the first line");

  // The chain as chips along the top.
  const CW = chain.map((c) => Math.ceil(c.length * 11.5 * 0.6 + 14));
  const chipX = CW.map((_, i) => CW.slice(0, i).reduce((s, w) => s + w + 4, 0));
  const BX = 0;
  const BY = 76;
  const PX = 270;
  const draw = (k: number): Item[] => {
    const s = snaps[k];
    const items: Item[] = chain.map((c, i) => box(`ch${i}`, chipX[i], 0, c, { w: CW[i], h: 26, size: 11.5, tone: i === k ? "accent" : i < k ? "plain" : "muted" }));
    const bb = objectBox("bld", BX, BY, "Pizza.Builder", s.fields.map(([f, v]) => `${f} = ${v}`), { w: 170, tone: s.returned === "builder" ? "accent" : "plain", rowTone: (i) => (s.changed.includes(i) ? "accent" : undefined) });
    items.push(...bb.items);
    items.push(arrow("ret", { x: chipX[k] + CW[k] / 2, y: 27 }, s.returned === "builder" ? { x: Math.min(bb.right - 20, Math.max(bb.left + 20, chipX[k] + CW[k] / 2)), y: BY - 2 } : { x: Math.min(PX + 150, Math.max(PX + 20, chipX[k] + CW[k] / 2)), y: BY - 2 }, { tone: "accent" }));
    items.push(label("retl", s.returned === "builder" ? "returns this" : "returns a new Pizza", chipX[k] + CW[k] / 2 + (s.pizza ? -8 : 8), 44, { anchor: s.pizza ? "end" : "start", size: 11, tone: "accent", weight: 600 }));
    if (s.pizza) {
      const p = s.pizza;
      const pb = objectBox("pz", PX, BY, "Pizza (immutable)", [`size = "${p.size}"`, `cheese = ${p.cheese}`, `olives = ${p.olives}`, `extras = ${p.extras}`], { w: 170, tone: "accent" });
      items.push(...pb.items, arrow("copy", { x: bb.right + 2, y: BY + 50 }, { x: PX - 2, y: BY + 50 }, { tone: "ink", label: "copied" }));
      items.push(...consoleLines("out", [pizzaString(p)], 0, BY + pb.h + 28, 0));
    }
    return items;
  };
  return finish({
    title: "Builder: name each step, then build an immutable object",
    input: 'new Pizza.Builder("Large").cheese().extras(2).build()',
    frames: [
      { caption: "The builder's constructor takes the one required value, the size. Every optional field starts at its default: no cheese, no olives, no extras.", items: draw(0) },
      { caption: "cheese() sets one field and returns the builder itself, which is what lets the next call chain straight on.", items: draw(1) },
      { caption: "extras(2) checks its argument first — a negative count throws here, before any Pizza exists — then sets it and returns the builder again.", items: draw(2) },
      { caption: `build() copies the builder's fields into a new Pizza whose fields are final, so the finished object can never change. Its toString() prints the line in the note's output.`, items: draw(3) },
    ],
  });
}

/* ── Decorator ────────────────────────────────────────────────────── */

const DECORATOR_OUTPUT = ["espresso = Rs 100", "espresso + milk + milk + caramel = Rs 205"];

function decoratorClasses(): Walkthrough {
  const coffee: ClassSpec = { name: "Coffee", stereotype: "interface", methods: ["+ describe(): String", "+ cost(): int"] };
  const espresso: ClassSpec = { name: "Espresso", methods: ["+ describe()", "+ cost()"] };
  const addOn: ClassSpec = { name: "AddOn", stereotype: "abstract", fields: ["# inner: Coffee"] };
  const milk: ClassSpec = { name: "Milk", methods: ["+ describe()", "+ cost()"] };
  const caramel: ClassSpec = { name: "Caramel", methods: ["+ describe()", "+ cost()"] };
  const c = classBox("coffee", coffee, { x: 150, y: 0, w: 170 });
  const e = classBox("esp", espresso, { x: 0, y: c.h + 60, w: 124 });
  const a = classBox("add", addOn, { x: 230, y: c.h + 60, w: 140 });
  const MY = a.y + a.h + 56;
  const m = classBox("milk", milk, { x: 160, y: MY, w: 124 });
  const k = classBox("car", caramel, { x: 310, y: MY, w: 124 });
  const items: Item[] = [...c.items, ...e.items, ...a.items, ...m.items, ...k.items];
  items.push(...umlLink("i1", e.top, { x: c.bottom.x - 30, y: c.bottom.y }, "implements"));
  items.push(...umlLink("i2", { x: a.top.x - 20, y: a.top.y }, { x: c.bottom.x + 30, y: c.bottom.y }, "implements"));
  items.push(...umlLink("x1", m.top, { x: a.bottom.x - 20, y: a.bottom.y }, "inherits"));
  items.push(...umlLink("x2", k.top, { x: a.bottom.x + 20, y: a.bottom.y }, "inherits"));
  // The decorator's defining link: an AddOn has a Coffee — any Coffee, including another AddOn.
  const innerRow = a.y + 38 + 4 + 8; // classBox: a stereotyped head is 38 tall, then the first 16 px field line
  const from = { x: a.right.x, y: innerRow };
  const corner: [number, number] = [a.right.x + 46, innerRow];
  const top: [number, number] = [a.right.x + 46, c.y + 30];
  items.push({ k: "path", id: "has", pts: [[from.x, from.y], corner, top, [c.right.x + 8, c.y + 30]], tone: "accent", width: 1.6 });
  items.push(arrow("has-h", { x: c.right.x + 8, y: c.y + 30 }, { x: c.right.x + 1, y: c.y + 30 }, { tone: "accent" }));
  items.push(label("has-l", "inner", a.right.x + 52, (innerRow + c.y + 30) / 2, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
  return finish({
    title: "Decorator: is a Coffee and has a Coffee",
    input: "",
    frames: [
      {
        caption: "Every add-on implements Coffee, so it can stand wherever a coffee is expected, and holds another Coffee as inner, so add-ons wrap each other in any order. Milk and Caramel only add their bit and delegate the rest.",
        items,
      },
    ],
  });
}

interface Layer {
  cls: "Caramel" | "Milk" | "Espresso";
  add: number;
  word: string;
  inner?: Layer;
}

function decoratorCalls(): Walkthrough {
  // new Caramel(new Milk(new Milk(new Espresso()))), with the note's prices.
  const espresso: Layer = { cls: "Espresso", add: 100, word: "espresso" };
  const order: Layer = { cls: "Caramel", add: 45, word: "caramel", inner: { cls: "Milk", add: 30, word: "milk", inner: { cls: "Milk", add: 30, word: "milk", inner: espresso } } };
  const events: Array<{ kind: "call" | "return"; depth: number; cost?: number; text?: string }> = [];
  const run = (l: Layer, depth: number): { cost: number; text: string } => {
    events.push({ kind: "call", depth });
    const below = l.inner ? run(l.inner, depth + 1) : null;
    const r = below ? { cost: below.cost + l.add, text: `${below.text} + ${l.word}` } : { cost: l.add, text: l.word };
    events.push({ kind: "return", depth, cost: r.cost, text: r.text });
    return r;
  };
  const total = run(order, 0);
  sameLines([`${espresso.word} = Rs ${espresso.add}`, `${total.text} = Rs ${total.cost}`], DECORATOR_OUTPUT, "decorator-calls");
  const layers: Layer[] = [];
  for (let l: Layer | undefined = order; l; l = l.inner) layers.push(l);
  const returns = events.filter((e) => e.kind === "return");

  const W = 92;
  const GAP = 26;
  const Y = 36;
  const xOf = (i: number) => 54 + i * (W + GAP);
  const draw = (shownReturns: number, calling: boolean): Item[] => {
    const back = new Map(returns.slice(0, shownReturns).map((r) => [r.depth, r]));
    const items: Item[] = [label("ord", "order", 0, Y + 23, { anchor: "start", tone: "ink", size: 12.5, mono: true }), arrow("ord-a", { x: 44, y: Y + 23 }, { x: xOf(0) - 2, y: Y + 23 }, { tone: "ink" })];
    layers.forEach((l, i) => {
      const done = back.has(i);
      const tone: Tone = done ? "accent" : calling ? "plain" : "plain";
      items.push(...objectBox(`l${i}`, xOf(i), Y, l.cls, [l.inner ? `+ ${l.add}` : `${l.add}`], { w: W, tone }).items);
      if (i < layers.length - 1) items.push(arrow(`in${i}`, { x: xOf(i) + W + 2, y: Y + 34 }, { x: xOf(i + 1) - 2, y: Y + 34 }, { tone: calling && !done ? "accent" : "ink" }));
      if (i < layers.length - 1 && i === 0) items.push(label("inl", "inner", xOf(0) + W + GAP / 2, Y + 22, { size: 10.5 }));
      if (calling) items.push(label(`call${i}`, "cost()", xOf(i) + W / 2, Y - 12, { size: 11, mono: true, tone: done ? "soft" : "accent" }));
      const r = back.get(i);
      if (r) {
        items.push(label(`rv${i}`, `returns ${r.cost}`, xOf(i) + W / 2, Y + 80, { size: 11.5, mono: true, tone: "accent", weight: 600 }));
        if (i < layers.length - 1) items.push(arrow(`rb${i}`, { x: xOf(i + 1) + 10, y: Y + 64 }, { x: xOf(i) + W - 10, y: Y + 64 }, { tone: "accent", bow: -12 }));
      }
    });
    if (back.has(0)) items.push(...consoleLines("out", [`${total.text} = Rs ${total.cost}`], 0, Y + 112, 0));
    return items;
  };
  const frames: Frame[] = [
    { caption: "new Caramel(new Milk(new Milk(new Espresso()))) builds a chain of four objects, each holding the next as inner. Only Espresso is a real drink; the others are wrappers that all look like a Coffee.", items: draw(0, false) },
    { caption: "order.cost() is called on the outermost wrapper. Each add-on first asks its inner coffee for its cost, so the call travels all the way down to the espresso.", items: draw(0, true) },
  ];
  returns.forEach((r, n) => {
    const l = layers[r.depth];
    const below = n ? returns[n - 1].cost! : 0;
    frames.push({
      caption: l.inner ? `${l.cls} adds ${l.add} to the ${below} its inner coffee returned and returns ${r.cost}.` : `Espresso has nothing inside it: it returns its own price, ${r.cost}, and the chain starts unwinding.`,
      items: draw(n + 1, true),
    });
  });
  frames[frames.length - 1].caption += ` describe() unwinds the same way, giving "${total.text}".`;
  return finish({ title: "Decorator: one call passes through every wrapper", input: "order = new Caramel(new Milk(new Milk(new Espresso())))", frames });
}

/* ── Observer ─────────────────────────────────────────────────────── */

const OBSERVER_OUTPUT = ["display: ACME = 1500", "display: ACME = 1580", "alert: ACME above 1550 (now 1580)", "alert: ACME above 1550 (now 1610)"];

function observer(): Walkthrough {
  // The note's main(), run on a model Ticker: observers are called in subscription order.
  type Obs = { name: "display" | "alert"; onPrice: (s: string, p: number) => string | null };
  const display: Obs = { name: "display", onPrice: (s, p) => `display: ${s} = ${p}` };
  const LIMIT = 1550;
  const alert: Obs = { name: "alert", onPrice: (s, p) => (p > LIMIT ? `alert: ${s} above ${LIMIT} (now ${p})` : null) };
  const ticker = { symbol: "ACME", observers: [] as Obs[] };
  const out: string[] = [];
  type Msg = { from: number; to: number; text: string; reply?: boolean; printed?: string | null };
  const steps: Array<{ msgs: Msg[]; observers: string[]; out: string[]; fresh: number }> = [];
  const who = { main: 0, acme: 1, display: 2, alert: 3 } as const;
  const record = (msgs: Msg[], fresh: number) => steps.push({ msgs, observers: ticker.observers.map((o) => o.name), out: [...out], fresh });
  const subscribe = (o: Obs) => ticker.observers.push(o);
  const unsubscribe = (o: Obs) => (ticker.observers = ticker.observers.filter((x) => x !== o));
  const setPrice = (p: number) => {
    const fresh = out.length;
    const msgs: Msg[] = [{ from: who.main, to: who.acme, text: `setPrice(${p})` }];
    for (const o of ticker.observers) {
      const line = o.onPrice(ticker.symbol, p);
      if (line) out.push(line);
      msgs.push({ from: who.acme, to: who[o.name], text: `onPrice("ACME", ${p})`, printed: line });
    }
    record(msgs, fresh);
  };
  subscribe(display);
  subscribe(alert);
  record([{ from: 0, to: 1, text: "subscribe(display)" }, { from: 0, to: 1, text: "subscribe(alert)" }], 0);
  setPrice(1500);
  setPrice(1580);
  unsubscribe(display);
  record([{ from: 0, to: 1, text: "unsubscribe(display)" }], out.length);
  setPrice(1610);
  sameLines(out, OBSERVER_OUTPUT, "observer");

  // main is a narrow column on the left; the three objects are full lifelines. Labels start at the sender so a long call never runs over the next lifeline.
  const GAPX = 140;
  const MAIN_X = -140;
  const MY = 52;
  const LEN = 112;
  const ll = lifelines("ll", ["acme: Ticker", "display: Display", "alert: Alert"], { gap: GAPX, w: 116, length: LEN, size: 11.5 });
  const xOf = (i: number) => (i === 0 ? MAIN_X : ll.xOf(i - 1));
  const draw = (k: number): Item[] => {
    const s = steps[k];
    const items: Item[] = [{ k: "edge", id: "main-l", x1: MAIN_X, y1: ll.top, x2: MAIN_X, y2: ll.top + LEN, tone: "faint", dashed: true }, box("main", MAIN_X - 32, 0, "main", { w: 64, h: 30, size: 11.5 }), ...ll.items];
    s.msgs.forEach((m, i) => {
      const y = MY + i * 34;
      const silent = m.printed === null;
      const tone = silent ? "line" : m.from === 0 ? "ink" : "accent";
      items.push(...message(`m${k}-${i}`, xOf(m.from), xOf(m.to), y, "", { tone }));
      items.push(label(`mt${k}-${i}`, m.text, xOf(m.from) + 8, y - 9, { anchor: "start", size: 11, mono: true, tone: silent ? "faint" : tone === "accent" ? "accent" : "ink" }));
      if (m.printed) items.push(label(`p${k}-${i}`, "prints", xOf(m.to) + 8, y, { anchor: "start", size: 10.5, tone: "accent", weight: 600 }));
      if (silent) items.push(label(`p${k}-${i}`, "prints nothing", xOf(m.to) - 8, y + 11, { anchor: "end", size: 10.5, tone: "faint" }));
    });
    items.push(label("obs", `acme.observers = [${s.observers.join(", ")}]`, MAIN_X - 32, ll.top + LEN + 22, { anchor: "start", size: 11.5, mono: true, tone: "ink" }));
    items.push(...consoleLines("out", s.out, MAIN_X - 32, ll.top + LEN + 52, s.fresh));
    return items;
  };
  const silentStep = steps.findIndex((s) => s.msgs.some((m) => m.printed === null));
  const frames: Frame[] = [
    { caption: "main subscribes a Display and an Alert to the ACME ticker. The ticker keeps them in a list and knows them only as PriceObserver, never as the concrete classes.", items: draw(0) },
    {
      caption: `setPrice(1500): the ticker calls onPrice on each observer in subscription order. The display prints; the alert is called too, but ${1500} is not above its limit of ${LIMIT}, so it prints nothing.`,
      items: draw(1),
    },
    { caption: "setPrice(1580): the same two calls in the same order. This time the price is above 1550, so both observers react.", items: draw(2) },
    { caption: "unsubscribe(display) removes the display from the list. Nothing else changes: the ticker still does not know or care what kind of objects it is notifying.", items: draw(3) },
    { caption: "setPrice(1610) notifies only the alert. Four lines in all, exactly the note's output: the subject never changed when its audience did.", items: draw(4) },
  ];
  if (silentStep !== 1) throw new Error("observer: the alert should stay silent at 1500 only");
  return finish({ title: "Observer: the ticker notifies whoever is subscribed, in order", input: "the note's ACME ticker program", frames });
}

/* ── Strategy ─────────────────────────────────────────────────────── */

const STRATEGY_OUTPUT = ["standard: 450 + 40 = 490", "express: 450 + 100 = 550", "pickup: 450 + 0 = 450", "standard: 800 + 0 = 800"];

function strategy(): Walkthrough {
  const strategies = [
    { cls: "Standard", name: "standard", cost: (t: number) => (t >= 500 ? 0 : 40) },
    { cls: "Express", name: "express", cost: () => 100 },
    { cls: "Pickup", name: "pickup", cost: () => 0 },
  ];
  const checkout = (total: number, s: (typeof strategies)[number]) => `${s.name}: ${total} + ${s.cost(total)} = ${total + s.cost(total)}`;
  const [standard, express, pickup] = strategies;
  sameLines([checkout(450, standard), checkout(450, express), checkout(450, pickup), checkout(800, standard)], STRATEGY_OUTPUT, "strategy");

  const cart = classBox("cart", { name: "Cart", fields: ["- total: int", "- shipping: ShippingStrategy"], methods: ["+ setShipping(s)", "+ checkout()"] }, { x: 0, y: 0 });
  const iface = classBox("ss", { name: "ShippingStrategy", stereotype: "interface", methods: ["+ name(): String", "+ cost(cartTotal: int): int"] }, { x: cart.w + 80, y: 0 });
  const items: Item[] = [...cart.items, ...iface.items];
  items.push(...umlLink("has", { x: cart.right.x, y: 50 }, { x: iface.left.x, y: 50 }, "associates"), label("has-l", "shipping", cart.right.x + 40, 38, { size: 11, tone: "soft", mono: true }));
  const RY = Math.max(cart.h, iface.h) + 54;
  const W = 120;
  const GAP = 22;
  const x0 = (iface.x + iface.w - (3 * W + 2 * GAP)) / 2;
  strategies.forEach((s, i) => {
    const x = x0 + i * (W + GAP);
    const b = classBox(`s${i}`, { name: s.cls, methods: ["+ name()", "+ cost(total)"] }, { x, y: RY, w: W });
    items.push(...b.items, ...umlLink(`im${i}`, b.top, { x: iface.bottom.x + (i - 1) * 40, y: iface.bottom.y }, "implements"));
    items.push(label(`c${i}`, `cost(450) = ${s.cost(450)}`, x + W / 2, RY + b.h + 14, { size: 11, mono: true, tone: "accent" }));
    if (s === standard) items.push(label(`c${i}b`, `cost(800) = ${s.cost(800)}`, x + W / 2, RY + b.h + 31, { size: 11, mono: true, tone: "accent" }));
  });
  return finish({
    title: "Strategy: the cart holds a swappable shipping rule",
    input: "Cart(450) with each strategy, then Cart(800)",
    frames: [
      {
        caption: `Cart calls shipping.cost(total) and never asks which rule it holds; setShipping swaps the object at run time. For a 450 cart the fees are ${strategies.map((s) => s.cost(450)).join(", ")}, and Standard ships an 800 cart free.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  singleton,
  builder,
  "decorator-classes": decoratorClasses,
  "decorator-calls": decoratorCalls,
  observer,
  strategy,
};
