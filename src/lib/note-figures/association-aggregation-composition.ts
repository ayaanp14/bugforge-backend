import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec, type UmlKind } from "./kit.js";

/**
 * Association, Aggregation and Composition: the note's figures
 * (content/notes/oop/association-aggregation-composition.md places each with
 * "@figure <name>").
 *
 *  - notation: the four has-a / is-a lines UML draws, on classes the note
 *    names (the ASCII sketch the note used to carry);
 *  - car-classes: the class diagram of the note's Car program, members read
 *    off the Java version, multiplicities derived from each field's shape;
 *  - car-lifetime: that program run statement by statement on a model heap,
 *    with a mark-and-sweep collector deciding what dies when `first = null`;
 *  - destruction-order: the C++ House/Department program run on a model of
 *    C++ scopes (destructor body, then members in reverse; locals in
 *    reverse), its printed log checked against the note's output fence;
 *  - stack-reuse: what a caller can call on a stack built by inheriting from
 *    `list` against one that holds a list, with both run on the example.
 */

/* ── Shared drawing: an object on a model heap ────────────────────── */

const HEAD = 22;
const ROW = 20;

/** An object: a header with its name, then one row per field (left-aligned, mono). */
function objectBox(id: string, x: number, y: number, title: string, rows: readonly string[], o: { w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined }) {
  const tone = o.tone ?? "plain";
  const ink: TextTone = tone === "muted" ? "faint" : "ink";
  const h = HEAD + rows.length * ROW + (rows.length ? 4 : 0);
  const items: Item[] = [{ k: "cell", id, x, y, w: o.w, h, text: "", tone }];
  items.push({ k: "text", id: `${id}-n`, x: x + o.w / 2, y: y + HEAD / 2 + 1, text: title, tone: ink, anchor: "middle", size: 12, mono: false, weight: 700 });
  if (rows.length) items.push({ k: "path", id: `${id}-d`, pts: [[x, y + HEAD], [x + o.w, y + HEAD]], tone: tone === "muted" ? "faint" : "line", width: 1 });
  const rowMid = (i: number) => y + HEAD + 2 + ROW / 2 + i * ROW;
  rows.forEach((r, i) => items.push({ k: "text", id: `${id}-r${i}`, x: x + 8, y: rowMid(i), text: r, tone: tone === "muted" ? "faint" : (o.rowTone?.(i) ?? "ink"), anchor: "start", size: 11.5, mono: true }));
  return { items, h, rowMid, left: x, right: x + o.w, top: y, bottom: y + h };
}

/** The program's printed lines so far, under a small heading. */
function consoleLines(prefix: string, lines: readonly string[], x: number, y: number, o: { fresh?: number; gap?: number } = {}): Item[] {
  const gap = o.gap ?? 16;
  const items: Item[] = [label(`${prefix}-h`, "output", x, y, { anchor: "start", size: 11, weight: 600 })];
  lines.forEach((t, i) => items.push({ k: "text", id: `${prefix}${i}`, x, y: y + 18 + i * gap, text: t, tone: o.fresh !== undefined && i >= o.fresh ? "accent" : "ink", anchor: "start", size: 11, mono: true }));
  return items;
}

/* ── notation: the relationship lines ─────────────────────────────── */

interface Relation {
  whole: string;
  part: string;
  kind: "associates" | "aggregates" | "composes" | "inherits";
  name: string;
  /** Multiplicity at each end, as the note's text gives it. */
  wholeMult?: string;
  partMult?: string;
  says: string;
}

/**
 * The note's examples of each strength, weakest first: Teacher/Student
 * (many-to-many, from "How classes relate"), the C++ program's Department
 * and Professor (a professor may sit in two departments) and House and Room
 * (a house owns one or more rooms), and Car is-a Vehicle.
 */
const RELATIONS: readonly Relation[] = [
  { whole: "Teacher", part: "Student", kind: "associates", name: "association", wholeMult: "*", partMult: "*", says: "independent lifetimes" },
  { whole: "Department", part: "Professor", kind: "aggregates", name: "aggregation", wholeMult: "*", partMult: "*", says: "parts outlive the whole" },
  { whole: "House", part: "Room", kind: "composes", name: "composition", wholeMult: "1", partMult: "1..*", says: "parts end with the whole" },
  { whole: "Car", part: "Vehicle", kind: "inherits", name: "inheritance", says: "is-a, one object" },
];

function notation(): Walkthrough {
  const BW = 92;
  const BH = 32;
  const LINK = 128;
  const STEP = 62;
  const items: Item[] = [];
  RELATIONS.forEach((r, i) => {
    const y = i * STEP;
    const mid = y + BH / 2;
    const x2 = BW + LINK;
    items.push(box(`w${i}`, 0, y, r.whole, { w: BW, h: BH, size: 12.5 }));
    items.push(box(`p${i}`, x2, y, r.part, { w: BW, h: BH, size: 12.5 }));
    if (r.kind === "associates") {
      // A bidirectional association is a plain line: no arrowhead, no diamond.
      items.push({ k: "edge", id: `l${i}`, x1: BW, y1: mid, x2, y2: mid, tone: "ink" });
    } else if (r.kind === "inherits") {
      // UML puts the triangle on the parent: the subclass (Car) is the box on the left here.
      items.push(...umlLink(`l${i}`, { x: BW, y: mid }, { x: x2, y: mid }, "inherits"));
    } else {
      items.push(...umlLink(`l${i}`, { x: BW, y: mid }, { x: x2, y: mid }, r.kind as UmlKind));
    }
    if (r.wholeMult) items.push(label(`wm${i}`, r.wholeMult, BW + (r.kind === "associates" ? 8 : 26), mid - 11, { anchor: "start", size: 11, mono: true }));
    if (r.partMult) items.push(label(`pm${i}`, r.partMult, x2 - 6, mid - 11, { anchor: "end", size: 11, mono: true }));
    items.push(label(`n${i}`, r.name, x2 + BW + 18, mid - 8, { anchor: "start", tone: "ink", size: 12.5, weight: 600 }));
    items.push(label(`s${i}`, r.says, x2 + BW + 18, mid + 9, { anchor: "start", size: 11 }));
  });
  // The scale: each line down makes a stronger claim than the one above it.
  const kinds = RELATIONS.map((r) => r.kind);
  if (kinds.indexOf("aggregates") > kinds.indexOf("composes") || kinds.indexOf("associates") > kinds.indexOf("aggregates")) throw new Error("notation: rows must run weakest to strongest");
  return finish({
    title: "How UML draws association, aggregation, composition and inheritance",
    input: "",
    frames: [
      {
        caption: "A plain line is an association; a hollow diamond on the whole is aggregation; a filled diamond on the whole is composition; a hollow triangle on the parent is inheritance. The numbers are multiplicities: how many objects sit at that end.",
        items,
      },
    ],
  });
}

/* ── car-classes: the Car program's class diagram ─────────────────── */

/** The members of the Java version of the note's first program, constructors left out. */
const CAR: ClassSpec = { name: "Car", fields: ["- reg: String", "- engine: Engine", "- driver: Driver"], methods: ["+ assign(d: Driver): void", "+ start(): void"] };
const ENGINE: ClassSpec = { name: "Engine", fields: ["- cc: int"], methods: ["+ start(): String"] };
const DRIVER: ClassSpec = { name: "Driver", fields: ["- name: String", "- trips: int"], methods: ["+ recordTrip(): void", "+ getName(): String", "+ getTrips(): int"] };

/**
 * How each of Car's reference fields is set in the program, which decides
 * both the UML kind and the multiplicities: a field filled by the
 * constructor with an object it builds is composition, exactly one; a field
 * filled from outside, null until then, is aggregation, zero or one — and
 * one driver may be assigned to many cars.
 */
const CAR_FIELDS = [
  { field: "engine", type: "Engine", setBy: "constructor" as const, nullable: false },
  { field: "driver", type: "Driver", setBy: "assign" as const, nullable: true },
];

function carClasses(): Walkthrough {
  // Horizontal links: the engine's line leaves Car near its top, the driver's near its bottom.
  const GAP = 132;
  const car = classBox("car", CAR, { x: 0, y: 0 });
  const X2 = car.w + GAP;
  const linkY = { Engine: 24, Driver: car.h - 24 };
  // Each part's box is centred on its link where it can be (a probe measures its height first).
  const engineAt = classBox("eng", ENGINE, { x: X2, y: linkY.Engine - classBox("eng", ENGINE, {}).h / 2 });
  const driver = classBox("drv", DRIVER, { x: X2, y: Math.max(engineAt.y + engineAt.h + 24, linkY.Driver - classBox("drv", DRIVER, {}).h / 2) });
  const items: Item[] = [...car.items, ...engineAt.items, ...driver.items];
  for (const spec of [CAR, ENGINE, DRIVER]) for (const f of spec.fields ?? []) if (!/^[-+] \w+: \w+$/.test(f)) throw new Error(`car-classes: odd field line "${f}"`);
  for (const f of CAR_FIELDS) {
    if (!CAR.fields?.some((l) => l === `- ${f.field}: ${f.type}`)) throw new Error(`car-classes: Car has no field ${f.field}`);
    const kind: UmlKind = f.setBy === "constructor" ? "composes" : "aggregates";
    const target = f.type === "Engine" ? engineAt : driver;
    const y = linkY[f.type as "Engine" | "Driver"];
    if (y < target.y + 8 || y > target.y + target.h - 8) throw new Error(`car-classes: the ${f.field} link misses its class box`);
    const from = { x: car.right.x, y };
    const to = { x: target.left.x, y };
    items.push(...umlLink(`l-${f.field}`, from, to, kind));
    const partMult = f.nullable ? "0..1" : "1";
    const wholeMult = kind === "composes" ? "1" : "*";
    // Multiplicities over each end of the line; the relationship's name under its middle.
    items.push(label(`pm-${f.field}`, partMult, to.x - 6, y - 10, { anchor: "end", size: 11, mono: true }));
    items.push(label(`wm-${f.field}`, wholeMult, from.x + 26, y - 10, { anchor: "start", size: 11, mono: true }));
    items.push(label(`k-${f.field}`, kind === "composes" ? "composition" : "aggregation", from.x + 20 + (to.x - from.x - 20) / 2, y + 12, { anchor: "middle", size: 11, tone: "accent", weight: 600 }));
  }
  return finish({
    title: "The Car program as a class diagram",
    input: "",
    frames: [
      {
        caption: "Car builds its Engine in its own constructor and never hands it out: composition, exactly one engine per car. Its driver is set later through assign() and may be null: aggregation, zero or one driver per car, while one driver can drive any number of cars.",
        items,
      },
    ],
  });
}

/* ── car-lifetime: the program on a model heap ────────────────────── */

type Val = number | string | null | { ref: number };
interface HeapObj {
  id: number;
  cls: "Car" | "Engine" | "Driver";
  fields: Record<string, Val>;
}

/** The Java version of the program, run on a model heap whose collector frees whatever no root can reach. */
function runCarProgram() {
  const heap = new Map<number, HeapObj>();
  const vars: Record<string, number | null> = {};
  const out: string[] = [];
  let next = 1;
  const alloc = (cls: HeapObj["cls"], fields: Record<string, Val>) => {
    const o: HeapObj = { id: next++, cls, fields };
    heap.set(o.id, o);
    return o.id;
  };
  const get = (id: number) => {
    const o = heap.get(id);
    if (!o) throw new Error(`car-lifetime: object ${id} used after it was freed`);
    return o;
  };
  const deref = (v: Val) => {
    if (v === null || typeof v !== "object") throw new Error("car-lifetime: null dereference");
    return get(v.ref);
  };
  const newDriver = (name: string) => alloc("Driver", { name, trips: 0 });
  // Composition: the constructor builds the engine; nothing else ever holds it.
  const newCar = (reg: string, cc: number) => alloc("Car", { reg, engine: { ref: alloc("Engine", { cc }) }, driver: null });
  const assign = (car: number, d: number) => (get(car).fields.driver = { ref: d });
  const start = (car: number) => {
    const c = get(car);
    const d = deref(c.fields.driver);
    d.fields.trips = (d.fields.trips as number) + 1;
    const e = deref(c.fields.engine);
    out.push(`${c.fields.reg}: ${e.fields.cc}cc engine started, driven by ${d.fields.name}`); // delegation
  };
  /** Mark from the variables, sweep the rest: what Java's collector (or CPython's reference counts, here) frees. */
  const collect = (): number[] => {
    const seen = new Set<number>();
    const visit = (id: number) => {
      if (seen.has(id)) return;
      seen.add(id);
      for (const v of Object.values(get(id).fields)) if (v && typeof v === "object") visit(v.ref);
    };
    for (const id of Object.values(vars)) if (id !== null) visit(id);
    const freed = [...heap.keys()].filter((id) => !seen.has(id));
    for (const id of freed) heap.delete(id);
    return freed;
  };
  const snap = () => ({ heap: new Map([...heap].map(([k, o]) => [k, { ...o, fields: { ...o.fields } }])), vars: { ...vars }, out: [...out] });

  const steps: Array<{ s: ReturnType<typeof snap>; freed?: HeapObj[]; what: string }> = [];
  vars.asha = newDriver("Asha");
  steps.push({ s: snap(), what: "driver" });
  vars.first = newCar("KA-01-1234", 1197);
  steps.push({ s: snap(), what: "first" });
  assign(vars.first, vars.asha);
  steps.push({ s: snap(), what: "assign1" });
  start(vars.first);
  steps.push({ s: snap(), what: "start1" });
  vars.first = null;
  const before = snap();
  const freedIds = collect();
  steps.push({ s: snap(), freed: freedIds.map((id) => before.heap.get(id)!), what: "free" });
  vars.second = newCar("KA-05-9876", 1462);
  assign(vars.second, vars.asha);
  steps.push({ s: snap(), what: "second" });
  start(vars.second);
  const asha = get(vars.asha);
  out.push(`${asha.fields.name} has driven ${asha.fields.trips} cars`);
  steps.push({ s: snap(), what: "start2" });
  return { steps, freedIds };
}

/** The note's output fence for that program. */
const CAR_OUTPUT = ["KA-01-1234: 1197cc engine started, driven by Asha", "KA-05-9876: 1462cc engine started, driven by Asha", "Asha has driven 2 cars"];

function carLifetime(): Walkthrough {
  const { steps, freedIds } = runCarProgram();
  const last = steps[steps.length - 1].s;
  if (last.out.join("\n") !== CAR_OUTPUT.join("\n")) throw new Error(`car-lifetime: the model printed ${JSON.stringify(last.out)}`);
  const freeStep = steps.find((s) => s.what === "free")!;
  const freedCls = (freeStep.freed ?? []).map((o) => o.cls).sort();
  if (freedCls.join() !== "Car,Engine") throw new Error(`car-lifetime: expected the car and its engine to be freed, got ${freedCls}`);
  if (![...freeStep.s.heap.values()].some((o) => o.cls === "Driver")) throw new Error("car-lifetime: the driver should survive the first car");

  // Geometry: variables on the left, the car's slot top middle, its engine to its right, the driver below the engine.
  const SX = 0;
  const HX = 120;
  const CAR_W = 150;
  const EX = HX + CAR_W + 56;
  const E_W = 112;
  const DY = 104;
  const VAR_Y: Record<string, number> = { first: 0, second: 36, asha: DY + 22 };
  const CY = 0;
  // The dot in a reference row ("engine ●", "driver ●": seven characters before it, 11.5 px mono).
  const dotX = (b: { left: number }) => b.left + 8 + 7 * 11.5 * 0.6 + 3.5;

  const draw = (st: ReturnType<typeof runCarProgram>["steps"][number], o: { focus?: string[]; dying?: HeapObj[]; fresh?: number }): Item[] => {
    const focus = new Set(o.focus ?? []);
    const items: Item[] = [...region("stk", SX, -8, 94, DY + 76, "variables"), ...region("hp", HX - 12, -8, EX + E_W + 12 - (HX - 12), DY + 76, "heap")];
    const objs = [...st.s.heap.values(), ...(o.dying ?? [])];
    const place = new Map<number, ReturnType<typeof objectBox>>();
    const dying = new Set((o.dying ?? []).map((d) => d.id));
    for (const ob of objs) {
      const tone: Tone = dying.has(ob.id) ? "muted" : focus.has(`o${ob.id}`) ? "accent" : "plain";
      if (ob.cls === "Car") {
        const drv = ob.fields.driver;
        const b = objectBox(`o${ob.id}`, HX, CY, "Car", [`reg = "${ob.fields.reg}"`, "engine ●", drv === null ? "driver = null" : "driver ●"], { w: CAR_W, tone });
        place.set(ob.id, b);
      } else if (ob.cls === "Engine") {
        place.set(ob.id, objectBox(`o${ob.id}`, EX, CY + 31, "Engine", [`cc = ${ob.fields.cc}`], { w: E_W, tone }));
      } else {
        place.set(ob.id, objectBox(`o${ob.id}`, EX, DY, "Driver", [`name = "${ob.fields.name}"`, `trips = ${ob.fields.trips}`], { w: E_W + 0, tone, rowTone: (i) => (i === 1 && focus.has("trips") ? "accent" : undefined) }));
      }
    }
    for (const b of place.values()) items.push(...b.items);
    // References from fields.
    for (const ob of objs) {
      if (ob.cls !== "Car") continue;
      const b = place.get(ob.id)!;
      const dead = dying.has(ob.id);
      const e = ob.fields.engine as { ref: number };
      const eb = place.get(e.ref)!;
      items.push(arrow(`r${ob.id}e`, { x: dotX(b) + 6, y: b.rowMid(1) }, { x: eb.left, y: b.rowMid(1) }, { tone: dead ? "faint" : "ink" }));
      const d = ob.fields.driver;
      if (d && typeof d === "object") {
        const db = place.get(d.ref)!;
        items.push(arrow(`r${ob.id}d`, { x: dotX(b) + 6, y: b.rowMid(2) }, { x: db.left, y: db.top + 12 }, { tone: dead ? "faint" : focus.has("assign") ? "accent" : "ink" }));
      }
    }
    // Variables.
    for (const name of ["first", "second", "asha"]) {
      const y = VAR_Y[name];
      if (!(name in st.s.vars)) continue;
      const v = st.s.vars[name];
      items.push(label(`vn-${name}`, name, SX + 8, y + 11, { anchor: "start", tone: "ink", size: 12, mono: true }));
      items.push(box(`vb-${name}`, SX + 56, y, v === null ? "null" : "●", { w: v === null ? 30 : 22, h: 22, size: v === null ? 10.5 : 11, tone: v === null ? "muted" : focus.has(`v-${name}`) ? "accent" : "plain" }));
      if (v !== null) {
        const t = place.get(v)!;
        const ty = name === "asha" ? y + 11 : name === "first" ? t.top + 11 : t.top + 36;
        items.push(arrow(`va-${name}`, { x: SX + 78, y: y + 11 }, { x: t.left, y: ty }, { tone: focus.has(`v-${name}`) ? "accent" : "ink" }));
      }
    }
    items.push(...consoleLines("out", st.s.out, SX, DY + 94, { fresh: o.fresh }));
    return items;
  };

  const at = (what: string) => steps.find((s) => s.what === what)!;
  const idOf = (st: (typeof steps)[number], cls: HeapObj["cls"], nth = 0) => [...st.s.heap.values()].filter((o) => o.cls === cls)[nth]?.id;
  const s1 = at("driver");
  const s2 = at("first");
  const s3 = at("assign1");
  const s4 = at("start1");
  const s5 = at("free");
  const s6 = at("second");
  const s7 = at("start2");
  const d = s7.s.heap.get(s7.s.vars.asha!)!;
  const frames: Frame[] = [
    { caption: "Driver asha = new Driver(\"Asha\"): a driver exists on its own, before any car, and only the variable asha refers to it.", items: draw(s1, { focus: [`o${idOf(s1, "Driver")}`, "v-asha"] }) },
    {
      caption: `new Car("KA-01-1234", 1197) builds its Engine inside the constructor. The car is the only thing holding that engine: composition.`,
      items: draw(s2, { focus: [`o${idOf(s2, "Car")}`, `o${idOf(s2, "Engine")}`, "v-first"] }),
    },
    { caption: "first.assign(asha) stores a reference to a driver the car did not create. Two references now reach the driver: aggregation.", items: draw(s3, { focus: ["assign"] }) },
    {
      caption: `first.start() delegates to its engine's start() and records a trip on the driver, whose trips becomes ${s4.s.heap.get(s4.s.vars.asha!)!.fields.trips}.`,
      items: draw(s4, { focus: ["trips"], fresh: 0 }),
    },
    {
      caption: `first = null leaves the car unreachable. The engine was reachable only through the car, so the collector frees both; asha still reaches the driver, so the driver lives on.`,
      items: draw(s5, { dying: s5.freed }),
    },
    { caption: "A second car is built with an engine of its own, and the same driver is assigned to it: one part shared over time by two wholes.", items: draw(s6, { focus: [`o${idOf(s6, "Car")}`, `o${idOf(s6, "Engine")}`, "v-second"] }) },
    {
      caption: `second.start() records the driver's second trip. The driver outlived the first car and its engine, and has driven ${d.fields.trips} cars.`,
      items: draw(s7, { focus: ["trips"], fresh: 1 }),
    },
  ];
  if (freedIds.length !== 2) throw new Error("car-lifetime: two objects should be freed");
  return finish({ title: "A car's engine dies with it; its driver does not", input: "the note's Car program (Java version)", frames });
}

/* ── destruction-order: C++ scopes on the House/Department program ── */

interface CppObj {
  key: string;
  cls: "House" | "Room" | "Professor" | "Department";
  name: string;
  /** Members held by value, in declaration order: destroyed with the object. */
  members: CppObj[];
  /** Non-owning pointers (Department's staff). */
  staff: CppObj[];
  alive: boolean;
}

/** The note's output fence for the House/Department program. */
const CPP_OUTPUT = [
  "house goes out of scope:",
  "house destroyed",
  "room bedroom destroyed",
  "room kitchen destroyed",
  "department goes out of scope:",
  "department closed, 2 professors released",
  "professors still here: Rao, Iyer",
  "main ends:",
  "professor Iyer destroyed",
  "professor Rao destroyed",
];

function runCppProgram() {
  const log: string[] = [];
  const all: CppObj[] = [];
  const make = (key: string, cls: CppObj["cls"], name: string, members: CppObj[] = []): CppObj => {
    const o: CppObj = { key, cls, name, members, staff: [], alive: true };
    all.push(o);
    return o;
  };
  const order: string[] = [];
  /** A destructor's body runs first, then the members are destroyed in reverse order of declaration. Pointers are left alone. */
  const destroy = (o: CppObj) => {
    if (o.cls === "House") log.push("house destroyed");
    if (o.cls === "Room") log.push(`room ${o.name} destroyed`);
    if (o.cls === "Professor") log.push(`professor ${o.name} destroyed`);
    if (o.cls === "Department") log.push(`department closed, ${o.staff.length} professors released`);
    o.alive = false;
    order.push(o.key);
    for (const m of [...o.members].reverse()) destroy(m);
  };
  /** Leaving a scope destroys its locals in reverse order of construction. */
  const leave = (locals: CppObj[]) => [...locals].reverse().forEach(destroy);
  const snaps: Array<{ log: string[]; alive: Set<string>; order: string[]; staff: string[] }> = [];
  const snap = () => snaps.push({ log: [...log], alive: new Set(all.filter((o) => o.alive).map((o) => o.key)), order: [...order], staff: all.find((o) => o.cls === "Department")?.staff.map((p) => p.key) ?? [] });

  const rao = make("rao", "Professor", "Rao");
  const iyer = make("iyer", "Professor", "Iyer");
  const mainLocals = [rao, iyer];
  snap(); // 0
  log.push("house goes out of scope:");
  // Members are constructed in declaration order, before the House's own constructor body.
  const h = make("h", "House", "h", [make("kitchen", "Room", "kitchen"), make("bedroom", "Room", "bedroom")]);
  snap(); // 1
  order.length = 0;
  leave([h]);
  snap(); // 2
  order.length = 0;
  const cse = make("cse", "Department", "cse");
  cse.staff.push(rao, iyer);
  log.push("department goes out of scope:");
  snap(); // 3
  leave([cse]);
  snap(); // 4
  order.length = 0;
  log.push(`professors still here: ${[rao, iyer].map((p) => p.name).join(", ")}`);
  log.push("main ends:");
  leave(mainLocals);
  snap(); // 5
  if (log.join("\n") !== CPP_OUTPUT.join("\n")) throw new Error(`destruction-order: the model printed ${JSON.stringify(log)}`);
  return snaps;
}

function destructionOrder(): Walkthrough {
  const snaps = runCppProgram();
  const ordinal = ["1st", "2nd", "3rd", "4th"];
  // The two blocks never exist at once, so they share one slot on the left; main's professors sit on the right.
  const PX = 304;
  const PW = 116;
  const LW = 216;
  const P_Y: Record<string, number> = { rao: 14, iyer: 66 };
  const OUT_Y = 150;

  const draw = (i: number, o: { scopes?: Array<"s1" | "s2">; dying?: string[]; ptrs?: boolean; fresh: number; ended?: boolean; survivors?: boolean }): Item[] => {
    const s = snaps[i];
    const dying = new Set(o.dying ?? []);
    const shown = (key: string) => s.alive.has(key) || dying.has(key);
    const tone = (key: string): Tone => (dying.has(key) ? "muted" : "plain");
    const items: Item[] = [...region("main", -12, -30, PX + PW + 24, OUT_Y + 20, o.ended ? "main (returned)" : "main")];
    if (o.scopes?.includes("s1")) items.push(...region("s1", 0, 0, LW + 16, 116, "{ House h; }"));
    if (o.scopes?.includes("s2")) items.push(...region("s2", 0, 0, LW + 16, 84, "{ Department cse; … }"));
    const mark = (key: string, x: number, y: number) => {
      const n = s.order.indexOf(key);
      if (dying.has(key) && n >= 0) items.push(label(`ord-${key}`, `destroyed ${ordinal[n]}`, x, y, { anchor: "end", tone: "accent", size: 10.5, weight: 600 }));
    };
    if (shown("h")) {
      items.push({ k: "cell", id: "h", x: 8, y: 8, w: LW, h: 100, text: "", tone: tone("h") });
      items.push(label("h-n", "h: House", 16, 22, { anchor: "start", tone: dying.has("h") ? "faint" : "ink", size: 12, weight: 700 }));
      mark("h", LW + 16, -9);
      ["kitchen", "bedroom"].forEach((r, k) => {
        items.push(box(`room-${r}`, 16 + k * 102, 36, `${r}: Room`, { w: 96, h: 40, size: 11, tone: tone(r) }));
        mark(r, 16 + k * 102 + 96, 92);
      });
    }
    // Department's staff vector, one row per pointer it holds; the dot sits after "staff[k] " (nine characters, 11.5 px mono).
    const dotX = 8 + 8 + 9 * 11.5 * 0.6 + 3.5;
    let cse: ReturnType<typeof objectBox> | undefined;
    if (shown("cse")) {
      cse = objectBox("cse", 8, 8, "cse: Department", s.staff.map((_, k) => `staff[${k}] ●`), { w: LW, tone: tone("cse") });
      items.push(...cse.items);
      mark("cse", LW + 16, -9);
    }
    for (const p of ["rao", "iyer"]) {
      if (!shown(p)) continue;
      items.push(...objectBox(`p-${p}`, PX, P_Y[p], `${p}: Professor`, [], { w: PW, tone: dying.has(p) ? "muted" : o.survivors ? "accent" : "plain" }).items);
      mark(p, PX + PW, P_Y[p] - 9);
    }
    if (o.ptrs && cse) {
      const c = cse;
      s.staff.forEach((p, k) => items.push(arrow(`ptr-${p}`, { x: dotX + 6, y: c.rowMid(k) }, { x: PX, y: P_Y[p] + 11 }, { tone: dying.has("cse") ? "faint" : "ink" })));
    }
    items.push(...consoleLines("out", s.log, -4, OUT_Y + 14, { fresh: o.fresh, gap: 15 }));
    return items;
  };

  const frames: Frame[] = [
    { caption: "main creates two professors, rao and iyer, before any department exists. They belong to main's scope.", items: draw(0, { fresh: 0 }) },
    {
      caption: "Inside the first block, House h is built. Its rooms are members held by value: they are constructed first, in declaration order, and live inside the house.",
      items: draw(1, { scopes: ["s1"], fresh: 0 }),
    },
    {
      caption: `The block ends. ~House runs first, then its members are destroyed in reverse order of declaration: ${snaps[2].order.map((k) => (k === "h" ? "the house" : k)).join(", then ")}. Composition: the parts cannot outlive the whole.`,
      items: draw(2, { scopes: ["s1"], dying: snaps[2].order, fresh: 1 }),
    },
    { caption: `Department cse hires &rao and &iyer: its staff vector holds ${snaps[3].staff.length} pointers to professors it did not create.`, items: draw(3, { scopes: ["s2"], ptrs: true, fresh: 4 }) },
    {
      caption: "The second block ends and only the department is destroyed. Its vector of pointers goes, but a pointer's destruction never touches what it points at: aggregation.",
      items: draw(4, { scopes: ["s2"], ptrs: true, dying: ["cse"], fresh: 5, survivors: true }),
    },
    {
      caption: `The professors are still there when main ends, and are destroyed as its locals: in reverse order of construction, ${snaps[5].order.join(" before ")}.`,
      items: draw(5, { dying: snaps[5].order, fresh: 6, ended: true }),
    },
  ];
  return finish({ title: "C++ destroys composed parts with their whole, never aggregated ones", input: "the note's House and Department program", frames });
}

/* ── stack-reuse: inherit a list, or hold one ─────────────────────── */

/** Python 3.11's public list methods (dir(list) without the dunders). */
const LIST_METHODS = ["append", "clear", "copy", "count", "extend", "index", "insert", "pop", "remove", "reverse", "sort"];

function stackReuse(): Walkthrough {
  // The Python version of the program, run on plain arrays.
  const bad: number[] = [];
  const inheritedPush = (x: number) => bad.push(x);
  inheritedPush(1);
  inheritedPush(2);
  bad.splice(0, 0, 99); // bad.insert(0, 99): list's own method, inherited
  const items_: number[] = [];
  const s = {
    push: (x: number) => items_.push(x),
    pop: () => {
      if (!items_.length) throw new RangeError("pop from empty stack");
      return items_.pop()!;
    },
  };
  [10, 20, 30].forEach(s.push);
  const popped = s.pop();
  if (bad.join() !== "99,1,2" || popped !== 30) throw new Error("stack-reuse: the model disagrees with the note's output");

  const inherited = ["push", ...LIST_METHODS];
  const composed = ["push", "pop", "peek", "size"];
  const chips = (prefix: string, names: readonly string[], x: number, y: number, width: number, hot: (n: string) => Tone): { items: Item[]; bottom: number } => {
    const out: Item[] = [];
    let cx = x;
    let cy = y;
    names.forEach((n, i) => {
      const w = Math.ceil(n.length * 6.6 + 14);
      if (cx + w > x + width) {
        cx = x;
        cy += 28;
      }
      out.push(box(`${prefix}${i}`, cx, cy, n, { w, h: 22, size: 11, tone: hot(n) }));
      cx += w + 6;
    });
    return { items: out, bottom: cy + 22 };
  };

  const L = 0;
  const R = 270;
  const W = 230;
  const items: Item[] = [];
  items.push(label("lt", "InheritedStack(list): is-a list", L, -2, { anchor: "start", tone: "ink", size: 12.5, weight: 600 }));
  items.push(label("rt", "Stack: has-a list", R, -2, { anchor: "start", tone: "ink", size: 12.5, weight: 600 }));
  // list is drawn by name only: its members are the chips below, not part of the point here.
  const parent = box("lp", L + 75, 16, "list", { w: 80, h: 30, size: 12.5 });
  const child = classBox("lc", { name: "InheritedStack", methods: ["+ push(x)"] }, { x: L + 40, y: 92, w: 150 });
  items.push(parent, ...child.items, ...umlLink("li", child.top, { x: L + 115, y: 46 }, "inherits"));
  const holder = classBox("rc", { name: "Stack", fields: ["- _items: list"], methods: ["+ push(x)", "+ pop()", "+ peek()", "+ size()"] }, { x: R, y: 16, w: 140 });
  const partY = holder.right.y;
  items.push(...holder.items, box("rp", R + 176, partY - 15, "list", { w: 60, h: 30, size: 12.5 }), ...umlLink("ri", holder.right, { x: R + 176, y: partY }, "composes"));
  const top = Math.max(child.y + child.h, holder.y + holder.h) + 34;
  items.push(label("lcall", `a caller can call ${inherited.length} methods`, L, top, { anchor: "start", size: 11.5, weight: 600 }));
  items.push(label("rcall", `a caller can call ${composed.length} methods`, R, top, { anchor: "start", size: 11.5, weight: 600 }));
  const lc = chips("lm", inherited, L, top + 14, W, (n) => (n === "insert" ? "error" : n === "push" ? "accent" : "plain"));
  const rc = chips("rm", composed, R, top + 14, W, () => "accent");
  items.push(...lc.items, ...rc.items);
  const y2 = Math.max(lc.bottom, rc.bottom) + 24;
  items.push({ k: "text", id: "lres", x: L, y: y2, text: `push(1), push(2), insert(0, 99)`, tone: "soft", anchor: "start", size: 11, mono: true });
  items.push({ k: "text", id: "lres2", x: L, y: y2 + 18, text: `→ [${bad.join(", ")}]: 99 under the stack`, tone: "error", anchor: "start", size: 11, mono: true });
  items.push({ k: "text", id: "rres", x: R, y: y2, text: "push(10), push(20), push(30), pop()", tone: "soft", anchor: "start", size: 11, mono: true });
  items.push({ k: "text", id: "rres2", x: R, y: y2 + 18, text: `→ ${popped}: only stack operations exist`, tone: "accent", anchor: "start", size: 11, mono: true });
  return finish({
    title: "Reusing a list: inherit it, or hold it",
    input: "",
    frames: [
      {
        caption: `Inheriting from list hands callers all ${LIST_METHODS.length} of list's methods, so insert(0, 99) puts a value at the bottom of a "stack". Holding the list as a private part exposes only the ${composed.length} methods Stack chose to write.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  notation,
  "car-classes": carClasses,
  "car-lifetime": carLifetime,
  "destruction-order": destructionOrder,
  "stack-reuse": stackReuse,
};
