import { finish, round, textWidth, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, type ClassSpec } from "./kit.js";

/**
 * Classes and Objects: the note's figures (content/notes/oop/classes-and-objects.md
 * places each with "@figure <name>").
 *
 * Each figure runs a model of one of the note's programs and draws what the
 * model did: the Student program (which constructor ran, the one shared
 * count, `this` during a call), Python's attribute lookup for the
 * `self.count += 1` trap, the C++ Tracer program's scopes and heap (the
 * order of every construct and destroy), and the Point program's variables
 * and objects in Java/Python and in C++. Where the note's code group has an
 * output fence, the model's printout is checked against it — the gate ran
 * the real programs, so a model that disagrees throws.
 */

/** A UML object: "a : Student" underlined over its field values. */
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

/** Output lines under a figure, newest last. */
function printout(prefix: string, lines: readonly string[], x: number, y: number, fresh: number): Item[] {
  return lines.map((l, i) => label(`${prefix}${i}`, `> ${l}`, x, y + i * 18, { anchor: "start", tone: i >= lines.length - fresh ? "ink" : "faint", mono: true, size: 12 }));
}

/* ── The Student program: constructors, one shared count, this ──────── */

/** The note's Student class (C++ version), member for member. Statics are underlined, as UML draws them. */
const STUDENT: ClassSpec = {
  name: "Student",
  fields: ["- name: string", "- roll: int", "- count: int"],
  methods: ["+ Student()", "+ Student(name, roll)", "+ Student(other)", "+ rename(name): void", "+ describe(): void", "+ created(): int"],
};
const STATIC_MEMBERS = new Set(["- count: int", "+ created(): int"]);

/** The note's Student program's printout (its output fence). */
const STUDENT_OUTPUT = ["0 Unknown", "42 Meera", "42 Meera (copy)", "Students created: 3"];

function studentObjects(): Walkthrough {
  // The model: one static count, per-object name and roll, three constructors that each add one.
  let count = 0;
  interface Obj {
    name: string;
    roll: number;
  }
  const objs = new Map<string, Obj>();
  const construct = (v: string, o: Obj) => {
    objs.set(v, o);
    count++;
  };
  const printed: string[] = [];
  const frames: Frame[] = [];
  const OX = 240;
  const OW = 176;

  const draw = (code: string, o: { method?: string; hot?: string; from?: string; self?: string; fresh?: number }): Item[] => {
    const cb = classBox("cls", { ...STUDENT, fields: STUDENT.fields!.map((f) => (f === "- count: int" ? `- count: int = ${count}` : f)) }, {
      x: 0,
      y: 0,
      w: 172,
      lineTone: (l) => (o.method && l.startsWith(`+ ${o.method}`) ? "accent" : l.startsWith("- count") && o.method?.startsWith("Student") ? "accent" : undefined),
    });
    const items: Item[] = [...cb.items];
    // UML underlines static members: one copy, in the class.
    const lines = [...STUDENT.fields!.map((f) => (f === "- count: int" ? `- count: int = ${count}` : f)), ...STUDENT.methods!];
    const head = 26;
    const fh = STUDENT.fields!.length * 16 + 8;
    lines.forEach((l, i) => {
      const base = STUDENT.fields!.length;
      const raw = i < base ? STUDENT.fields![i] : STUDENT.methods![i - base];
      if (!STATIC_MEMBERS.has(raw)) return;
      const ly = i < base ? head + 4 + 8 + i * 16 : head + fh + 4 + 8 + (i - base) * 16;
      items.push({ k: "path", id: `st${i}`, pts: [[8, ly + 7], [round(8 + textWidth(l, 11)), ly + 7]], tone: "ink", width: 1 });
    });
    items.push(label("cl", "class: one count for all", 86, -12, { tone: "soft", size: 11 }));
    items.push(label("ol", "objects: own name and roll", OX + OW / 2, -12, { tone: "soft", size: 11 }));
    let y = 0;
    for (const [v, ob] of objs) {
      const tone: Tone = o.hot === v ? "accent" : "plain";
      const box_ = objectBox(`o-${v}`, `${v} : Student`, [`name = "${ob.name}"`, `roll = ${ob.roll}`], { x: OX, y, w: OW, tone });
      items.push(...box_.items);
      if (o.self === v) items.push(label("this", "this", OX + OW + 8, y + 12, { anchor: "start", tone: "accent", size: 12, weight: 700, mono: true }));
      if (o.from === v) items.push(arrow("copy", { x: OX + OW + 4, y: y + 46 }, { x: OX + OW + 4, y: y + 46 + 80 }, { tone: "accent", bow: -26, label: "copy" }));
      y += box_.h + 14;
    }
    const CY = Math.max(cb.h, 3 * 64 + 28) + 26;
    items.push(label("code", code, 0, CY, { anchor: "start", tone: "accent", mono: true, size: 12.5, weight: 600 }));
    items.push(...printout("out", printed, 0, CY + 22, o.fresh ?? 0));
    return items;
  };

  construct("a", { name: "Unknown", roll: 0 });
  frames.push({ caption: `No arguments, so the default constructor runs and fills in "Unknown" and 0. The object gets its own name and roll; the class's single count goes to ${count}.`, items: draw("Student a;", { method: "Student()", hot: "a" }) });
  construct("b", { name: "Meera", roll: 42 });
  frames.push({ caption: `Two arguments pick the parameterised constructor. b gets its own fields, and the same shared count, the only copy there is, goes to ${count}.`, items: draw('Student b("Meera", 42);', { method: "Student(name", hot: "b" }) });
  construct("c", { ...objs.get("b")! });
  frames.push({ caption: `Initialising c from b calls the copy constructor: a new object with b's values copied in, not a second name for b. Every constructor adds one, so count is ${count}.`, items: draw("Student c = b;", { method: "Student(other", hot: "c", from: "b" }) });
  objs.get("c")!.name = "Meera (copy)";
  frames.push({ caption: `Inside rename, this points at c, so this->name is c's field. b keeps "${objs.get("b")!.name}" because the two objects share no fields.`, items: draw('c.rename("Meera (copy)");', { method: "rename", hot: "c", self: "c" }) });
  for (const v of ["a", "b", "c"]) printed.push(`${objs.get(v)!.roll} ${objs.get(v)!.name}`);
  frames.push({ caption: "One describe() method serves all three objects. Each call runs the same code with this pointing at a different object, so each prints its own roll and name.", items: draw("a.describe(); b.describe(); c.describe();", { method: "describe", fresh: 3 }) });
  printed.push(`Students created: ${count}`);
  if (JSON.stringify(printed) !== JSON.stringify(STUDENT_OUTPUT)) throw new Error(`studentObjects: model printed ${JSON.stringify(printed)}`);
  frames.push({ caption: `created() is static: it is called on the class, has no this, and reads the one shared count, ${count}. It could not read name or roll, because there is no object to read them from.`, items: draw("Student::created();", { method: "created", fresh: 1 }) });
  return finish({ title: "Three constructors, one shared count, and this", input: 'Student a; Student b("Meera", 42); Student c = b;', frames });
}

/* ── Python's self.count += 1 trap ────────────────────────────────── */

/** Python attribute lookup, as a model: read looks in the object's own dict, then the class's; a write always goes to the object it names. */
interface PyObj {
  dict: Map<string, number | string>;
}

function countTrap(): Walkthrough {
  const run = (fixed: boolean) => {
    const cls: PyObj = { dict: new Map([["count", 0]]) };
    const objects: PyObj[] = [];
    const reads: string[] = [];
    for (const [name, roll] of [["Unknown", 0], ["Meera", 42], ["Asha", 7]] as const) {
      const self: PyObj = { dict: new Map<string, number | string>([["name", name], ["roll", roll]]) };
      if (fixed) {
        cls.dict.set("count", Number(cls.dict.get("count")) + 1); // Student.count += 1
      } else {
        // self.count += 1: the read falls through to the class, the write lands on the object.
        const found = self.dict.has("count") ? "object" : "class";
        const v = Number(self.dict.get("count") ?? cls.dict.get("count"));
        reads.push(found);
        self.dict.set("count", v + 1);
      }
      objects.push(self);
    }
    return { cls, objects, reads };
  };
  const bad = run(false);
  const good = run(true);
  if (bad.cls.dict.get("count") !== 0 || bad.objects.some((o) => o.dict.get("count") !== 1)) throw new Error("countTrap: buggy run should leave Student.count at 0 and 1 on each object");
  if (good.cls.dict.get("count") !== 3 || good.objects.some((o) => o.dict.has("count"))) throw new Error("countTrap: fixed run should count 3 on the class");

  const CW = 160;
  const OX = 256;
  const OW = 150;
  const draw = (r: ReturnType<typeof run>, o: { stmt: string; upto: number; showRead?: boolean; fixed: boolean }): Item[] => {
    const items: Item[] = [];
    const cc = Number(r.cls.dict.get("count"));
    items.push(...region("cr", 0, 0, CW, 60, "class Student", { tone: o.fixed ? "accent" : "ghost" }));
    items.push(box("cc", 14, 16, `count = ${cc}`, { w: CW - 28, h: 30, size: 12, tone: o.fixed ? "strong" : "plain" }));
    r.objects.slice(0, o.upto).forEach((ob, i) => {
      const rows = [`name = "${ob.dict.get("name")}"`, ...(ob.dict.has("count") ? [`count = ${ob.dict.get("count")}`] : [])];
      const y = i * 70;
      const b = objectBox(`ob${i}`, `object ${i + 1}`, rows, { x: OX, y, w: OW, rowTone: (k) => (k === 1 ? "error" : "ink") });
      items.push(...b.items);
      // The lookup chain: an attribute the object lacks is looked for in its class.
      items.push(arrow(`ty${i}`, { x: OX - 2, y: y + 12 }, { x: CW + 3, y: 20 + i * 8 }, { tone: o.showRead ? "accent" : "line", dashed: !o.showRead, label: o.showRead ? "read: 0" : undefined }));
      if (o.showRead) items.push(label("wr", "← written: 0 + 1", OX + OW + 6, y + 24 + 28, { anchor: "start", tone: "error", size: 11.5, weight: 600 }));
    });
    items.push(label("stmt", o.stmt, 0, 3 * 70 + 6, { anchor: "start", tone: o.fixed ? "accent" : "error", mono: true, size: 12.5, weight: 600 }));
    items.push(label("res", `Student.created() → ${cc}`, 0, 3 * 70 + 26, { anchor: "start", tone: "ink", mono: true, size: 12 }));
    return items;
  };
  return finish({
    title: "Why self.count += 1 never counts in Python",
    input: "class Student: count = 0",
    frames: [
      {
        caption: `In the first object's initialiser, self.count is read first: the object has no count, so the lookup falls through to the class and finds ${0}. The += then writes count = 1 onto the object, not the class.`,
        items: draw(bad, { stmt: "self.count += 1", upto: 1, showRead: true, fixed: false }),
      },
      {
        caption: `Every object does the same, so after three students each has a private count of 1 and the class's count is still ${bad.cls.dict.get("count")}. The shared counter never moved.`,
        items: draw(bad, { stmt: "self.count += 1", upto: 3, fixed: false }),
      },
      {
        caption: `Writing to the class by name, Student.count += 1, changes the one shared attribute: ${good.cls.dict.get("count")} after three students, and no object has a count of its own.`,
        items: draw(good, { stmt: "Student.count += 1", upto: 3, fixed: true }),
      },
    ],
  });
}

/* ── The Tracer program: where each object lives and when it dies ──── */

type Storage = "static" | "stack" | "heap";
interface Live {
  name: string;
  storage: Storage;
  /** Nesting depth of the scope that owns it (stack only). */
  depth: number;
}

/** The note's Tracer program's printout (its output fence). */
const TRACER_OUTPUT = [
  "construct global",
  "main starts",
  "construct a",
  "construct b",
  "construct c",
  "inner scope ends",
  "destroy c",
  "destroy b",
  "construct heap",
  "construct owned",
  "destroy heap",
  "main ends",
  "destroy owned",
  "destroy a",
  "destroy global",
];

function lifetimes(): Walkthrough {
  // A tiny C++ machine: objects with storage, scopes as a stack of local lists (destroyed in reverse), pointers to heap objects.
  const live = new Map<string, Live>();
  const printed: string[] = [];
  type Local = { v: string; kind: "object" | "raw" | "unique"; target: string };
  const scopes: Local[][] = [];
  const statics: string[] = [];
  const pointers = new Map<string, { kind: "raw" | "unique"; target: string | null }>();
  const construct = (name: string, storage: Storage) => {
    live.set(name, { name, storage, depth: scopes.length });
    printed.push(`construct ${name}`);
  };
  const destroy = (name: string) => {
    if (!live.delete(name)) throw new Error(`lifetimes: ${name} destroyed twice`);
    printed.push(`destroy ${name}`);
  };
  const local = (v: string) => {
    construct(v, "stack");
    scopes[scopes.length - 1].push({ v, kind: "object", target: v });
  };
  const exitScope = () => {
    const s = scopes.pop()!;
    for (const l of [...s].reverse()) {
      if (l.kind === "object") destroy(l.target);
      else if (l.kind === "unique" && pointers.get(l.v)?.target) destroy(pointers.get(l.v)!.target!);
      pointers.delete(l.v);
    }
  };

  const frames: Frame[] = [];
  const COL = { st: 0, sk: 128, hp: 340 };
  const ROW = 34;
  // Everything that has existed so far stays drawn where it lived (muted once destroyed), in declaration order.
  const stackRows: Array<{ v: string; kind: Local["kind"]; inner: boolean }> = [];
  const heapOrder: string[] = [];
  const draw = (touched: Set<string>, fresh: number): Item[] => {
    const items: Item[] = [];
    // Made this step: accent. Destroyed (this step or earlier): muted, left where it lived.
    const tone = (n: string): Tone => (!live.has(n) ? "muted" : touched.has(n) ? "accent" : "plain");
    items.push(...region("rs", COL.st, 0, 108, 52, "static storage"));
    items.push(...region("rk", COL.sk, 0, 172, 5 * ROW + 14, "stack: main's frame"));
    items.push(...region("rh", COL.hp, 0, 112, 2 * 44 + 10, "heap"));
    for (const n of statics) items.push(box(`b-${n}`, COL.st + 10, 11, n, { w: 88, h: 30, size: 12, tone: tone(n) }));
    const innerRows = stackRows.map((r, i) => (r.inner ? i : -1)).filter((i) => i >= 0);
    if (innerRows.length) {
      const y0 = 8 + innerRows[0] * ROW;
      items.push(...region("ri", COL.sk + 8, y0 - 2, 156, innerRows.length * ROW + 2, "", { tone: "ghost" }));
      items.push(label("ril", "{ inner }", COL.sk + 156, y0 + 13, { anchor: "end", tone: "faint", size: 11 }));
    }
    stackRows.forEach((r, i) => {
      const y = 8 + i * ROW;
      const x = COL.sk + (r.inner ? 16 : 10);
      if (r.kind === "object") {
        items.push(box(`b-${r.v}`, x, y, r.v, { w: 70, h: 28, size: 12, tone: tone(r.v) }));
        return;
      }
      const p = pointers.get(r.v);
      const t = p?.target ?? null;
      const alive = scopes.some((sc) => sc.some((l) => l.v === r.v));
      items.push(box(`v-${r.v}`, x, y, r.kind === "raw" ? `${r.v}: Tracer*` : `${r.v}: unique_ptr`, { w: 152, h: 28, size: 11.5, tone: alive ? (t && live.has(t) ? "plain" : "muted") : "muted" }));
      if (alive && t && live.has(t)) items.push(arrow(`p-${r.v}`, { x: x + 154, y: y + 14 }, { x: COL.hp + 10, y: 10 + heapOrder.indexOf(t) * 44 + 14 }, { tone: touched.has(t) ? "accent" : "ink" }));
    });
    heapOrder.forEach((n, i) => items.push(box(`b-${n}`, COL.hp + 12, 10 + i * 44, n, { w: 88, h: 28, size: 12, tone: tone(n) })));
    items.push(...printout("out", printed.slice(-4), 0, 5 * ROW + 40, Math.min(fresh, 4)));
    return items;
  };
  const step = (caption: string, fn: () => void) => {
    const before = printed.length;
    fn();
    const lines = printed.slice(before);
    const touched = new Set(lines.flatMap((l) => (l.startsWith("construct ") || l.startsWith("destroy ") ? [l.split(" ")[1]] : [])));
    frames.push({ caption, items: draw(touched, lines.length) });
  };
  const declare = (v: string, kind: Local["kind"], inner = false) => stackRows.push({ v, kind, inner });

  step("Tracer global is a global, in static storage: it is constructed before main runs, so its line is printed first.", () => {
    statics.push("global");
    construct("global", "static");
  });
  step("main starts and declares a, a local object: its storage is part of main's stack frame, and its constructor runs at the declaration.", () => {
    printed.push("main starts");
    scopes.push([]);
    declare("a", "object");
    local("a");
  });
  step("The braces open an inner scope. b and c are constructed in the order they are declared, inside that scope.", () => {
    scopes.push([]);
    declare("b", "object", true);
    declare("c", "object", true);
    local("b");
    local("c");
  });
  step("At the closing brace the inner scope's locals die in the reverse order of construction: c first, then b. Nothing else is touched.", () => {
    printed.push("inner scope ends");
    exitScope();
  });
  step("new puts a Tracer on the heap and raw holds only its address; make_unique does the same but hands ownership to the unique_ptr owned.", () => {
    declare("raw", "raw");
    declare("owned", "unique");
    heapOrder.push("heap");
    construct("heap", "heap");
    scopes[0].push({ v: "raw", kind: "raw", target: "heap" });
    pointers.set("raw", { kind: "raw", target: "heap" });
    heapOrder.push("owned");
    construct("owned", "heap");
    scopes[0].push({ v: "owned", kind: "unique", target: "owned" });
    pointers.set("owned", { kind: "unique", target: "owned" });
  });
  step("delete raw destroys the heap object at once. raw still holds the old address, now dangling; forgetting this line would have leaked the object.", () => {
    destroy("heap");
    pointers.set("raw", { kind: "raw", target: null });
  });
  step("main returns, and its locals die in reverse order: owned's destructor deletes the object it owns, then a is destroyed. A raw pointer's destruction does nothing.", () => {
    printed.push("main ends");
    exitScope();
  });
  step("Last, after main has returned, the static object is destroyed. Every object's end of life is a line of the program you can point at.", () => {
    destroy("global");
  });
  if (JSON.stringify(printed) !== JSON.stringify(TRACER_OUTPUT)) throw new Error(`lifetimes: model printed ${JSON.stringify(printed)}`);
  return finish({ title: "Where each C++ object lives, and when it is destroyed", input: 'Tracer global("global"); main: a, { b, c }, new, make_unique', frames });
}

/* ── b = a: two names for one object, or two objects ───────────────── */

/** The note's Point program's printout (its output fence). */
const POINT_OUTPUT = ["after b.x = 10: a.x = 10", "after c.x = 99: a.x = 10, c.x = 99"];

function aliasing(): Walkthrough {
  // Java/Python model: variables hold references; objects live on a heap.
  const heap: Array<{ x: number; y: number }> = [];
  const env = new Map<string, number>();
  const printed: string[] = [];
  const frames: Frame[] = [];
  const VX = 0;
  const HX = 170;

  const drawRefs = (code: string, o: { hotObj?: number; fresh?: number }): Item[] => {
    const items: Item[] = [];
    items.push(...region("rv", VX, 0, 110, 150, "variables"));
    items.push(...region("rh", HX, 0, 150, 150, "heap"));
    heap.forEach((p, i) => {
      const b = objectBox(`h${i}`, `Point #${i + 1}`, [`x = ${p.x}`, `y = ${p.y}`], { x: HX + 14, y: 12 + i * 70, w: 122, tone: o.hotObj === i ? "accent" : "plain" });
      items.push(...b.items);
    });
    [...env.keys()].forEach((v, k) => {
      const y = 14 + k * 44;
      items.push(box(`v-${v}`, VX + 14, y, v, { w: 44, h: 30, size: 13 }));
      const t = env.get(v)!;
      items.push(arrow(`r-${v}`, { x: VX + 60, y: y + 15 }, { x: HX + 12, y: 12 + t * 70 + 20 + (k % 2) * 8 }, { tone: o.hotObj === t ? "accent" : "ink" }));
    });
    items.push(label("code", code, 0, 172, { anchor: "start", tone: "accent", mono: true, size: 12.5, weight: 600 }));
    items.push(...printout("out", printed, 0, 194, o.fresh ?? 0));
    return items;
  };

  heap.push({ x: 1, y: 2 });
  env.set("a", 0);
  frames.push({ caption: "In Java and Python the object is created on the heap and the variable a holds only a reference to it, drawn as an arrow.", items: drawRefs("Point a = new Point(1, 2);", { hotObj: 0 }) });
  env.set("b", env.get("a")!);
  frames.push({ caption: "b = a copies the reference, not the object. There is still one Point, now with two arrows into it: b is a second name for the same object.", items: drawRefs("Point b = a;", { hotObj: 0 }) });
  heap[env.get("b")!].x = 10;
  printed.push(`after b.x = 10: a.x = ${heap[env.get("a")!].x}`);
  frames.push({ caption: `Writing through b changes the one object, so reading through a sees it too: a.x is ${heap[env.get("a")!].x}. This sharing is called aliasing.`, items: drawRefs("b.x = 10;", { hotObj: 0, fresh: 1 }) });
  const src = heap[env.get("a")!];
  heap.push({ x: src.x, y: src.y });
  env.set("c", heap.length - 1);
  frames.push({ caption: "A real copy has to be asked for — a copy constructor, or copy.copy in Python. It builds a second object with the same values, and c refers to that one.", items: drawRefs("Point c = new Point(a);", { hotObj: 1, fresh: 0 }) });
  heap[env.get("c")!].x = 99;
  printed.push(`after c.x = 99: a.x = ${heap[env.get("a")!].x}, c.x = ${heap[env.get("c")!].x}`);
  if (JSON.stringify(printed) !== JSON.stringify(POINT_OUTPUT)) throw new Error(`aliasing: model printed ${JSON.stringify(printed)}`);
  frames.push({ caption: `Changing the copy leaves the original alone: c.x is ${heap[env.get("c")!].x} while a.x stays ${heap[env.get("a")!].x}. Two objects now, three variables.`, items: drawRefs("c.x = 99;", { hotObj: 1, fresh: 1 }) });

  // C++ model: a variable is its object's storage; a reference is another name for the same storage; plain = copies the whole object.
  const cpp = new Map<string, { x: number; y: number }>();
  const names = new Map<string, string>(); // name -> storage it names
  cpp.set("a", { x: 1, y: 2 });
  names.set("a", "a");
  names.set("b", "a"); // Point& b = a
  cpp.get(names.get("b")!)!.x = 10;
  cpp.set("c", { ...cpp.get("a")! }); // Point c = a
  names.set("c", "c");
  cpp.get("c")!.x = 99;
  if (cpp.get("a")!.x !== 10 || cpp.get("c")!.x !== 99) throw new Error("aliasing: C++ model disagrees with the program");
  const cppItems: Item[] = [...region("rv", VX, 0, 320, 150, "C++: main's stack frame holds the objects themselves")];
  [...cpp.keys()].forEach((st, i) => {
    const p = cpp.get(st)!;
    const b = objectBox(`h${i}`, `Point ${st}`, [`x = ${p.x}`, `y = ${p.y}`], { x: VX + 30 + i * 160, y: 30, w: 122, tone: st === "c" ? "accent" : "plain" });
    cppItems.push(...b.items);
    const alias = [...names.entries()].filter(([n, s]) => s === st && n !== st).map(([n]) => n);
    alias.forEach((n) => cppItems.push(label(`al-${n}`, `${n} (Point&) names this one`, VX + 30 + i * 160 + 61, 112, { tone: "soft", size: 11 })));
  });
  cppItems.push(label("code", "Point& b = a;  Point c = a;", 0, 172, { anchor: "start", tone: "accent", mono: true, size: 12.5, weight: 600 }));
  cppItems.push(...printout("out", printed, 0, 194, 0));
  frames.push({ caption: "C++ by default stores the object in the variable itself. Point& b = a gives Java-style sharing, while Point c = a copies the whole object into c, so the same output needs no new.", items: cppItems });
  return finish({ title: "What b = a does: two names for one object, or two objects", input: "a = Point(1, 2); b = a; b.x = 10; c = copy of a; c.x = 99", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "student-objects": studentObjects,
  "count-trap": countTrap,
  "object-lifetimes": lifetimes,
  aliasing,
};
