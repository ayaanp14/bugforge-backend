import { finish, textWidth, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "./kit.js";

/**
 * Inheritance: the note's figures (content/notes/oop/inheritance.md places
 * each with "@figure <name>").
 *
 * The five kinds of inheritance are drawn from parent lists (the note's own
 * classes) and each is classified from its edges, so a diagram cannot carry
 * the wrong name. The construction figure runs a model of the note's
 * Vehicle → Car → ElectricCar program (super first, then the body; method
 * lookup from the object's own class upwards); the diamond figure builds a
 * Copier the way C++ does with and without virtual inheritance; and the MRO
 * figure runs the C3 linearisation itself, step by step. Each model's
 * printout is checked against the output the gate got from the real
 * programs.
 */

/** Output lines; this step's in ink, earlier ones faint. */
function printout(prefix: string, lines: readonly string[], x: number, y: number, fresh: number): Item[] {
  return lines.map((l, i) => label(`${prefix}${i}`, `> ${l}`, x, y + i * 18, { anchor: "start", tone: i >= lines.length - fresh ? "ink" : "faint", mono: true, size: 12 }));
}

/* ── The five kinds, as class diagrams ────────────────────────────── */

type Edge = readonly [child: string, parent: string];

/** What a hierarchy is, read off its edges — the names in the figure come from this, not from a label typed beside it. */
function classify(edges: readonly Edge[]): string {
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const [c, p] of edges) {
    parents.set(c, [...(parents.get(c) ?? []), p]);
    children.set(p, [...(children.get(p) ?? []), c]);
  }
  const paths = (from: string, to: string): number => (from === to ? 1 : (parents.get(from) ?? []).reduce((n, p) => n + paths(p, to), 0));
  const names = new Set(edges.flat());
  const multi = [...parents.values()].some((ps) => ps.length > 1);
  const diamond = [...names].some((a) => [...names].some((b) => a !== b && paths(a, b) > 1));
  const fan = [...children.values()].some((cs) => cs.length > 1);
  const depth = (c: string): number => Math.max(0, ...(parents.get(c) ?? []).map((p) => 1 + depth(p)));
  const deep = Math.max(...[...names].map(depth));
  if (diamond) return "Hybrid (diamond)";
  if (multi) return "Multiple";
  if (fan) return "Hierarchical";
  if (deep >= 2) return "Multilevel";
  return "Single";
}

/** Lay a small hierarchy out: parents above children, each level centred; returns boxes and their centres. */
function layoutHierarchy(prefix: string, edges: readonly Edge[], x0: number, y0: number, o: { tone?: (n: string) => Tone; edgeTone?: (e: Edge) => LineTone } = {}) {
  const parents = new Map<string, string[]>();
  const order: string[] = [];
  for (const [c, p] of edges) {
    parents.set(c, [...(parents.get(c) ?? []), p]);
    for (const n of [p, c]) if (!order.includes(n)) order.push(n);
  }
  const depth = (c: string): number => Math.max(0, ...(parents.get(c) ?? []).map((p) => 1 + depth(p)));
  const levels: string[][] = [];
  for (const n of order) (levels[depth(n)] ??= []).push(n);
  const H = 28;
  const STEP = 54;
  const GAP = 10;
  const wOf = (n: string) => Math.max(56, Math.ceil(textWidth(n, 12) + 16));
  const rowW = (lv: string[]) => lv.reduce((s, n) => s + wOf(n), 0) + GAP * (lv.length - 1);
  const width = Math.max(...levels.map(rowW));
  const at = new Map<string, { x: number; y: number; w: number }>();
  levels.forEach((lv, d) => {
    let x = x0 + (width - rowW(lv)) / 2;
    for (const n of lv) {
      at.set(n, { x, y: y0 + d * STEP, w: wOf(n) });
      x += wOf(n) + GAP;
    }
  });
  const items: Item[] = [];
  // Spread the ends along a box's edge when several links meet there, so the triangles sit side by side.
  const kidsOf = (p: string) => edges.filter((e) => e[1] === p).map((e) => e[0]).sort((a, b) => at.get(a)!.x - at.get(b)!.x);
  const parentsOf = (c: string) => edges.filter((e) => e[0] === c).map((e) => e[1]).sort((a, b) => at.get(a)!.x - at.get(b)!.x);
  for (const e of edges) {
    const c = at.get(e[0])!;
    const p = at.get(e[1])!;
    const ks = kidsOf(e[1]);
    const ps = parentsOf(e[0]);
    const tx = p.x + p.w / 2 + (ks.indexOf(e[0]) - (ks.length - 1) / 2) * 18;
    const fx = c.x + c.w / 2 + (ps.indexOf(e[1]) - (ps.length - 1) / 2) * 18;
    items.push(...umlLink(`${prefix}e${e[0]}-${e[1]}`, { x: fx, y: c.y }, { x: tx, y: p.y + H }, "inherits", { tone: o.edgeTone?.(e) ?? "ink" }));
  }
  for (const [n, b] of at) items.push(box(`${prefix}${n}`, b.x, b.y, n, { w: b.w, h: H, size: 12, tone: o.tone?.(n) ?? "plain" }));
  return { items, width, height: (levels.length - 1) * STEP + H, at };
}

function inheritanceTypes(): Walkthrough {
  // The note's examples for each kind.
  const kinds: ReadonlyArray<{ edges: readonly Edge[]; java: string }> = [
    { edges: [["Car", "Vehicle"]], java: "all languages" },
    { edges: [["Car", "Vehicle"], ["ElectricCar", "Car"]], java: "all languages" },
    { edges: [["Car", "Vehicle"], ["Bike", "Vehicle"], ["Truck", "Vehicle"]], java: "all languages" },
    { edges: [["Copier", "Scanner"], ["Copier", "Printer"]], java: "Java: interfaces only" },
    { edges: [["Scanner", "Device"], ["Printer", "Device"], ["Copier", "Scanner"], ["Copier", "Printer"]], java: "Java: interfaces only" },
  ];
  const expected = ["Single", "Multilevel", "Hierarchical", "Multiple", "Hybrid (diamond)"];
  const items: Item[] = [];
  const rows = [kinds.slice(0, 3), kinds.slice(3)];
  let y = 0;
  let k = 0;
  for (const row of rows) {
    const built = row.map((kd, i) => ({ kd, name: classify(kd.edges), lay: layoutHierarchy(`k${k + i}-`, kd.edges, 0, 0) }));
    const rowH = Math.max(...built.map((b) => b.lay.height));
    let x = 0;
    built.forEach((b, i) => {
      if (b.name !== expected[k + i]) throw new Error(`inheritanceTypes: edges for ${expected[k + i]} classify as ${b.name}`);
      const lay = layoutHierarchy(`k${k + i}-`, b.kd.edges, x, y + 22 + (rowH - b.lay.height));
      items.push(label(`t${k + i}`, b.name, x + lay.width / 2, y + 2, { tone: "ink", size: 12.5, weight: 700 }));
      items.push(...lay.items);
      items.push(label(`j${k + i}`, b.kd.java, x + lay.width / 2, y + 22 + rowH + 16, { tone: b.kd.java.startsWith("Java") ? "accent" : "faint", size: 11 }));
      x += lay.width + 34;
    });
    k += row.length;
    y += rowH + 70;
  }
  return finish({
    title: "The five kinds of inheritance, on the note's classes",
    input: "",
    frames: [
      {
        caption: "Each hollow triangle points from a child to its parent. The top three need only one parent per class; Multiple gives one class two parents, and Hybrid adds a shared grandparent, the diamond that Java allows only through interfaces.",
        items,
      },
    ],
  });
}

/* ── new ElectricCar: constructors run top-down, describe() looks up from the object ── */

interface ClassDef {
  parent?: string;
  spec: ClassSpec;
  /** What the constructor passes to super, from its own arguments. */
  superArgs?: (args: Array<string | number>) => Array<string | number>;
  /** The constructor body: fields it sets, then what it prints. */
  body: (args: Array<string | number>) => { set: Record<string, string | number>; print: string };
  /** describe(): calls super.describe() first (all three do), then prints this line. */
  describe?: (f: Record<string, string | number>) => string;
}

/** The note's three classes (Java version), member for member. */
const VEHICLES: Record<string, ClassDef> = {
  Vehicle: {
    spec: { name: "Vehicle", fields: ["# wheels: int"], methods: ["+ Vehicle(wheels)", "+ describe(): void"] },
    body: ([wheels]) => ({ set: { wheels }, print: "Vehicle constructor" }),
    describe: (f) => `Vehicle: ${f.wheels} wheels`,
  },
  Car: {
    parent: "Vehicle",
    spec: { name: "Car", fields: ["# model: String"], methods: ["+ Car(model)", "+ describe(): void"] },
    superArgs: () => [4],
    body: ([model]) => ({ set: { model }, print: "Car constructor" }),
    describe: (f) => `Car: ${f.model}`,
  },
  ElectricCar: {
    parent: "Car",
    spec: { name: "ElectricCar", fields: ["- batteryKwh: int"], methods: ["+ ElectricCar(model, kwh)", "+ describe(): void"] },
    superArgs: ([model]) => [model],
    body: ([, kwh]) => ({ set: { batteryKwh: kwh }, print: "ElectricCar constructor" }),
    describe: (f) => `ElectricCar: ${f.batteryKwh} kWh battery`,
  },
};

const VEHICLE_OUTPUT = ["Vehicle constructor", "Car constructor", "ElectricCar constructor", "Vehicle: 4 wheels", "Car: Nexon", "ElectricCar: 30 kWh battery"];

function constructionOrder(): Walkthrough {
  // The model: a constructor first runs its parent's (with the arguments its super call passes), then its own body.
  const events: Array<{ kind: "call" | "body"; cls: string; set?: Record<string, string | number>; print?: string }> = [];
  const fields: Record<string, string | number> = {};
  const construct = (cls: string, args: Array<string | number>) => {
    events.push({ kind: "call", cls });
    const d = VEHICLES[cls];
    if (d.parent) construct(d.parent, d.superArgs!(args));
    const b = d.body(args);
    Object.assign(fields, b.set);
    events.push({ kind: "body", cls, set: b.set, print: b.print });
  };
  construct("ElectricCar", ["Nexon", 30]);
  // Method lookup starts at the object's own class; each describe() calls super.describe() before its own line.
  const resolve = (cls: string, m: "describe"): string => {
    for (let c: string | undefined = cls; c; c = VEHICLES[c].parent) if (VEHICLES[c][m]) return c;
    throw new Error(`constructionOrder: no ${m}`);
  };
  const describeLines: string[] = [];
  const runDescribe = (cls: string) => {
    const owner = resolve(cls, "describe");
    const parent = VEHICLES[owner].parent;
    if (parent) runDescribe(parent);
    describeLines.push(VEHICLES[owner].describe!(fields));
  };
  const objectClass = "ElectricCar";
  const firstRun = resolve(objectClass, "describe");
  runDescribe(objectClass);
  const printed = [...events.filter((e) => e.kind === "body").map((e) => e.print!), ...describeLines];
  if (JSON.stringify(printed) !== JSON.stringify(VEHICLE_OUTPUT)) throw new Error(`constructionOrder: model printed ${JSON.stringify(printed)}`);

  const chain = ["Vehicle", "Car", "ElectricCar"];
  const CW = 196;
  const GAPY = 44;
  const boxes = new Map<string, ReturnType<typeof classBox>>();
  let y = 0;
  for (const c of chain) {
    const b = classBox(`c-${c}`, VEHICLES[c].spec, { x: 0, y, w: CW });
    boxes.set(c, b);
    y += b.h + GAPY;
  }
  const OX = CW + 50;
  const OW = 212;
  const parts = chain.map((c) => ({ c, field: Object.keys(VEHICLES[c].body(["", 0]).set)[0] }));

  const draw = (o: { code: string; built: string[]; hotClass?: string; hotLine?: string; up?: boolean; describing?: string[]; out: string[]; fresh: number }): Item[] => {
    const items: Item[] = [];
    for (const c of chain) {
      const b = boxes.get(c)!;
      items.push(...classBox(`c-${c}`, VEHICLES[c].spec, { x: b.x, y: b.y, w: CW, tone: o.hotClass === c ? "accent" : "plain", lineTone: (l): TextTone | undefined => (o.hotLine && l.includes(o.hotLine) && (o.hotClass === c || o.describing?.includes(c)) ? "accent" : undefined) }).items);
    }
    for (let i = 1; i < chain.length; i++) {
      const child = boxes.get(chain[i])!;
      const par = boxes.get(chain[i - 1])!;
      const lit = o.up || o.describing?.includes(chain[i]);
      items.push(...umlLink(`l${i}`, child.top, par.bottom, "inherits", { tone: lit ? "accent" : "ink" }));
      const tag = o.up ? (i === 2 ? "super(model)" : "super(4)") : o.describing?.includes(chain[i]) ? "super.describe()" : "";
      if (tag) items.push(label(`lt${i}`, tag, child.top.x + 10, (child.top.y + par.bottom.y) / 2 + 4, { anchor: "start", tone: "accent", mono: true, size: 11.5, weight: 600 }));
    }
    // The object: its parts in memory order, parent's first; a part fills when its constructor's body has run.
    items.push(label("ot", "the ElectricCar object", OX + OW / 2, -10, { tone: "soft", size: 11 }));
    parts.forEach((p, i) => {
      const done = o.built.includes(p.c);
      const val = done ? fields[p.field] : "";
      items.push(box(`p-${p.c}`, OX, i * 36, done ? `${p.c}: ${p.field} = ${typeof val === "string" ? `"${val}"` : val}` : `${p.c} part`, { w: OW, h: 32, size: 11, tone: done ? (o.built[o.built.length - 1] === p.c && !o.describing ? "strong" : "plain") : "ghost" }));
    });
    items.push(label("code", o.code, OX, 3 * 36 + 22, { anchor: "start", tone: "accent", mono: true, size: 12, weight: 600 }));
    items.push(...printout("out", o.out, OX, 3 * 36 + 46, o.fresh));
    return items;
  };

  const frames: Frame[] = [];
  const bodies = events.filter((e) => e.kind === "body");
  const calls = events.filter((e) => e.kind === "call").map((e) => e.cls);
  frames.push({
    caption: `new calls ElectricCar's constructor, but its first act is super(model), whose first act is super(4): the calls climb ${calls.join(" → ")} before any body runs.`,
    items: draw({ code: 'new ElectricCar("Nexon", 30)', built: [], up: true, hotLine: "(", hotClass: "ElectricCar", out: [], fresh: 0 }),
  });
  const out: string[] = [];
  bodies.forEach((b, i) => {
    out.push(b.print!);
    const [f, v] = Object.entries(b.set!)[0];
    frames.push({
      caption:
        i === 0
          ? `The topmost constructor's body runs first: ${b.cls} sets ${f} = ${v}. The parent's part of the object must exist before a child can build on it.`
          : `Back down one level, ${b.cls}'s body runs and sets ${f} = ${typeof v === "string" ? `"${v}"` : v}.${i === bodies.length - 1 ? " The object is complete only now, and bodies ran top-down." : ""}`,
      items: draw({ code: 'new ElectricCar("Nexon", 30)', built: bodies.slice(0, i + 1).map((x) => x.cls), hotClass: b.cls, hotLine: `${b.cls}(`, out: [...out], fresh: 1 }),
    });
  });
  frames.push({
    caption: `v is declared as a Vehicle, yet v.describe() looks the method up from the object's own class, ${objectClass}, and finds ${firstRun}'s version there before Vehicle's is ever considered.`,
    items: draw({ code: "Vehicle v = ...; v.describe();", built: chain, hotClass: firstRun, hotLine: "describe", out: [...out], fresh: 0 }),
  });
  frames.push({
    caption: `Each describe() calls super.describe() before printing, so the calls climb to Vehicle and the lines come out top-down: ${describeLines.map((l) => l.split(":")[0]).join(", ")}.`,
    items: draw({ code: "Vehicle v = ...; v.describe();", built: chain, describing: chain, hotLine: "describe", out: [...out, ...describeLines], fresh: describeLines.length }),
  });
  return finish({ title: "Constructors run from the top down; describe() is found from the bottom up", input: 'Vehicle v = new ElectricCar("Nexon", 30); v.describe();', frames });
}

/* ── The diamond in C++: two Device parts, or one shared ───────────── */

interface CppClass {
  bases: Array<{ name: string; virtual: boolean }>;
  /** The base initialisers this class's constructor writes: Device(1) in Scanner, Device(3) in Copier. */
  init: Record<string, number>;
}

/** The note's C++ diamond program; `virtual` on the two middle classes' base. */
function diamondClasses(virtualBase: boolean): Record<string, CppClass> {
  return {
    Device: { bases: [], init: {} },
    Scanner: { bases: [{ name: "Device", virtual: virtualBase }], init: { Device: 1 } },
    Printer: { bases: [{ name: "Device", virtual: virtualBase }], init: { Device: 2 } },
    Copier: { bases: [{ name: "Scanner", virtual: false }, { name: "Printer", virtual: false }], init: virtualBase ? { Device: 3 } : {} },
  };
}

/** C++'s construction of a most-derived object: virtual bases first, built by the most derived class; then direct bases in order; then the body. */
function buildCpp(classes: Record<string, CppClass>, most: string) {
  const order: string[] = [];
  const devices: Array<{ id: number; via: string }> = [];
  const virtuals: string[] = [];
  const findVirtuals = (c: string) => {
    for (const b of classes[c].bases) {
      findVirtuals(b.name);
      if (b.virtual && !virtuals.includes(b.name)) virtuals.push(b.name);
    }
  };
  findVirtuals(most);
  const run = (c: string, arg: number | undefined, via: string) => {
    if (c === "Device") {
      if (arg === undefined) throw new Error(`buildCpp: Device built with no argument via ${via}`);
      devices.push({ id: arg, via });
      order.push(`Device(${arg})`);
      return;
    }
    for (const b of classes[c].bases) if (!b.virtual) run(b.name, classes[c].init[b.name], c);
    order.push(c);
  };
  for (const v of virtuals) run(v, classes[most].init[v], most);
  run(most, undefined, most);
  return { order, devices, virtuals };
}

const DIAMOND_OUTPUT = ["Device(3)", "Scanner", "Printer", "Copier", "one Device, id 3"];

function diamond(): Walkthrough {
  const edges: Edge[] = [["Scanner", "Device"], ["Printer", "Device"], ["Copier", "Scanner"], ["Copier", "Printer"]];
  const parents = (c: string) => edges.filter((e) => e[0] === c).map((e) => e[1]);
  const allPaths = (from: string, to: string): string[][] => (from === to ? [[to]] : parents(from).flatMap((p) => allPaths(p, to).map((path) => [from, ...path])));
  const paths = allPaths("Copier", "Device");
  const plain = buildCpp(diamondClasses(false), "Copier");
  const shared = buildCpp(diamondClasses(true), "Copier");
  if (plain.devices.length !== paths.length) throw new Error("diamond: without virtual there should be one Device per path");
  if (shared.devices.length !== 1) throw new Error("diamond: virtual inheritance should leave one Device");
  const printed = [...shared.order, `one Device, id ${shared.devices[0].id}`];
  if (JSON.stringify(printed) !== JSON.stringify(DIAMOND_OUTPUT)) throw new Error(`diamond: model printed ${JSON.stringify(printed)}`);

  const OX = 206;
  const OW = 236;
  const drawClasses = (lit: number | "all" | null): Item[] => {
    const onPath = (e: Edge) => (lit === null ? false : (lit === "all" ? paths : [paths[lit]]).some((p) => p.some((n, i) => n === e[0] && p[i + 1] === e[1])));
    return layoutHierarchy("d-", edges, 0, 20, { edgeTone: (e) => (onPath(e) ? "accent" : "ink"), tone: (n) => (n === "Copier" || n === "Device" ? (lit === null ? "plain" : "accent") : "plain") }).items;
  };
  const layoutObject = (devicesBy: Array<{ id: number; via: string }>, sharedDevice: boolean): Item[] => {
    const items: Item[] = [...region("obj", OX, 20, OW, 150, "a Copier object in memory")];
    ["Scanner", "Printer"].forEach((p, i) => {
      const px = OX + 10 + i * 112;
      items.push(box(`part-${p}`, px, 32, "", { w: 104, h: sharedDevice ? 40 : 84, tone: "plain" }));
      items.push(label(`pl-${p}`, `${p} part`, px + 52, 46, { tone: "ink", size: 11.5, weight: 600 }));
      const d = devicesBy.find((x) => x.via === p);
      if (d) items.push(box(`dev-${p}`, px + 8, 62, `Device id=${d.id}`, { w: 88, h: 46, size: 11, tone: "error" }));
    });
    if (sharedDevice) {
      ["Scanner", "Printer"].forEach((p, i) => items.push(arrow(`sh-${p}`, { x: OX + 62 + i * 112, y: 73 }, { x: OX + 118 + (i ? 20 : -20), y: 85 }, { tone: "accent", dashed: true, head: false })));
      items.push(box("dev-shared", OX + 50, 86, `Device id=${devicesBy[0].id}`, { w: 136, h: 36, size: 12, tone: "strong" }));
    }
    items.push(box("part-own", OX + 10, 132, "Copier's own part", { w: OW - 20, h: 28, size: 11.5, tone: "plain" }));
    return items;
  };

  const frames: Frame[] = [];
  frames.push({
    caption: `Copier inherits from Scanner and Printer, and both inherit from Device, so there are ${paths.length} paths from Copier up to Device: ${paths.map((p) => p.join(" → ")).join(" and ")}.`,
    items: [...drawClasses("all"), ...layoutObject([], false).slice(0, 2), label("q", "one Device part, or two?", OX + OW / 2, 95, { tone: "soft", size: 12, weight: 600 })],
  });
  frames.push({
    caption: `Without virtual, each path brings its own Device: the Scanner part holds one (id ${plain.devices[0].id}) and the Printer part another (id ${plain.devices[1].id}). Writing c.id is a compile error, because the compiler cannot tell which one you mean.`,
    items: [...drawClasses("all"), ...layoutObject(plain.devices, false), label("res", "c.id  →  error: ambiguous", OX, 196, { anchor: "start", tone: "error", mono: true, size: 12, weight: 600 })],
  });
  frames.push({
    caption: `With virtual inheritance the two paths share one Device, built first and by the most derived class: Copier's Device(${shared.devices[0].id}) runs and Scanner's Device(1) and Printer's Device(2) are skipped. Order: ${shared.order.join(", ")}.`,
    items: [
      ...drawClasses(null),
      ...layoutObject(shared.devices, true),
      label("res", `c.id  →  ${shared.devices[0].id}`, OX, 196, { anchor: "start", tone: "accent", mono: true, size: 12, weight: 600 }),
      label("ord", shared.order.join(" → "), OX, 216, { anchor: "start", tone: "soft", mono: true, size: 11 }),
    ],
  });
  return finish({ title: "The diamond in C++: two Device parts, or one shared", input: "struct Copier : Scanner, Printer; both : (virtual) Device", frames });
}

/* ── Python's MRO, computed by C3 linearisation ───────────────────── */

const PY_BASES: Record<string, string[]> = { object: [], Device: ["object"], Scanner: ["Device"], Printer: ["Device"], Copier: ["Scanner", "Printer"] };

/** One step of the merge, recorded for drawing. */
interface MergeStep {
  lists: string[][];
  result: string[];
  rejected: string[];
  taken: string;
}

/** C3: L[C] = C + merge(L[B1], …, L[Bn], [B1, …, Bn]). Take the first head that is in no list's tail. */
function c3(cls: string, trace?: MergeStep[]): string[] {
  const bases = PY_BASES[cls];
  if (!bases.length) return [cls];
  const lists = [...bases.map((b) => c3(b)), [...bases]];
  const result = [cls];
  while (lists.some((l) => l.length)) {
    const rejected: string[] = [];
    let taken: string | undefined;
    for (const l of lists) {
      if (!l.length) continue;
      const head = l[0];
      if (lists.some((m) => m.indexOf(head) > 0)) {
        if (!rejected.includes(head)) rejected.push(head);
        continue;
      }
      taken = head;
      break;
    }
    if (!taken) throw new Error(`c3: no consistent order for ${cls}`);
    trace?.push({ lists: lists.map((l) => [...l]), result: [...result], rejected, taken });
    result.push(taken);
    for (const l of lists) if (l[0] === taken) l.shift();
  }
  return result;
}

const MRO_OUTPUT = ["['Copier', 'Scanner', 'Printer', 'Device', 'object']", "Copier init", "Scanner init", "Printer init", "Device init", "Scanner -> Printer -> Device"];

function mro(): Walkthrough {
  const trace: MergeStep[] = [];
  const order = c3("Copier", trace);
  // super() means "the next class in the object's MRO": __init__ runs once per class in that order, and start() chains along it.
  const inits = order.filter((c) => c !== "object").map((c) => `${c} init`);
  const starters = order.filter((c) => c !== "Copier" && c !== "object");
  const start = starters.join(" -> ");
  const printed = [`[${order.map((c) => `'${c}'`).join(", ")}]`, ...inits, start];
  if (JSON.stringify(printed) !== JSON.stringify(MRO_OUTPUT)) throw new Error(`mro: model printed ${JSON.stringify(printed)}`);

  const W = 70;
  const G = 6;
  const LX = 104;
  const rowY = (i: number) => 16 + i * 40;
  const listNames = [...PY_BASES.Copier.map((b) => `L[${b}]`), "bases"];
  const RY = rowY(listNames.length) + 22;

  const draw = (step: MergeStep | null, done: string[], o: { taken?: string; rejected?: string[]; chain?: boolean }): Item[] => {
    const items: Item[] = [label("hd", "merge these, keeping each list's order:", 0, 0, { anchor: "start", tone: "soft", size: 11.5 })];
    const lists = step?.lists ?? [];
    listNames.forEach((n, i) => {
      items.push(label(`ln${i}`, n, LX - 10, rowY(i) + 14, { anchor: "end", tone: "ink", mono: true, size: 12 }));
      const full = i < PY_BASES.Copier.length ? c3(PY_BASES.Copier[i]) : PY_BASES.Copier;
      const left = lists[i] ?? [];
      full.forEach((c, k) => {
        const gone = !left.includes(c) || k < full.length - left.length;
        const isHead = !gone && left[0] === c;
        const tone: Tone = gone ? "muted" : isHead && o.taken === c ? "strong" : isHead && o.rejected?.includes(c) ? "error" : "plain";
        items.push(box(`c${i}-${k}`, LX + k * (W + G), rowY(i), c, { w: W, h: 28, size: 11.5, tone }));
      });
    });
    items.push(label("rl", "MRO", LX - 10, RY + 14, { anchor: "end", tone: "accent", size: 12, weight: 700 }));
    done.forEach((c, k) => items.push(box(`r${k}`, LX + k * (W + G), RY, c, { w: W, h: 28, size: 11.5, tone: o.chain ? "accent" : k === done.length - 1 && o.taken ? "strong" : "plain" })));
    if (o.chain) {
      for (let k = 0; k + 1 < done.length - 1; k++) items.push(arrow(`s${k}`, { x: LX + k * (W + G) + W / 2 + 6, y: RY + 34 }, { x: LX + (k + 1) * (W + G) + W / 2 - 6, y: RY + 34 }, { tone: "accent", bow: -12 }));
      items.push(label("sl", "each super() moves one step right", LX, RY + 62, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
      items.push(label("st", `start(): "${start}"`, LX, RY + 82, { anchor: "start", tone: "ink", mono: true, size: 12 }));
    }
    return items;
  };

  const frames: Frame[] = [];
  frames.push({
    caption: "C3 starts the order with Copier itself, then merges its parents' own orders and the list of its parents, Scanner before Printer, as written in the class statement.",
    items: draw(trace[0], ["Copier"], {}),
  });
  trace.forEach((st) => {
    const done = [...st.result, st.taken];
    const why = st.rejected.length
      ? `${st.rejected.join(", ")} is a head but still sits in the tail of another list, so it must wait; the next head, ${st.taken}, appears in no tail and is taken.`
      : `${st.taken} heads its list${st.lists.filter((l) => l[0] === st.taken).length > 1 ? "s" : ""} and appears in no list's tail, so it is taken and removed everywhere.`;
    frames.push({ caption: why, items: draw(st, done, { taken: st.taken, rejected: st.rejected }) });
  });
  frames.push({
    caption: `The MRO is ${order.join(", ")}. super() means the next class in this list, so Scanner's super() reaches Printer, not Device: each __init__ runs once and start() returns "${start}".`.replace("__init__", "initialiser"),
    items: draw(null, order, { chain: true }),
  });
  return finish({ title: "Python's method resolution order for Copier, computed by C3", input: "class Copier(Scanner, Printer); Scanner(Device); Printer(Device)", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "inheritance-types": inheritanceTypes,
  "construction-order": constructionOrder,
  diamond,
  mro,
};

