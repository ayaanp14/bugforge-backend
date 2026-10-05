import { finish, round, textWidth, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";

/**
 * Polymorphism: the note's figures (content/notes/oop/polymorphism.md
 * places each with "@figure <name>").
 *
 * Dispatch is computed, never drawn from memory: the vtables are built from
 * the note's Employee hierarchy (one slot per virtual function the base
 * declares, each filled with the nearest class that defines it), a call
 * through a vptr reads the slot and runs that body on the object's fields,
 * a dynamic_cast walks the object's class chain, and overload resolution
 * filters the overload set by the arguments. Each model's printout is
 * checked against the output the gate got from the real programs.
 */

/** A UML-style object box: a title over rows. */
function objectBox(prefix: string, title: string, rows: readonly string[], o: { x: number; y: number; w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined }): { items: Item[]; h: number; rowY: (i: number) => number } {
  const head = 24;
  const h = head + rows.length * 18 + 6;
  const tw = textWidth(title, 12, false);
  const rowY = (i: number) => o.y + head + 12 + i * 18;
  const items: Item[] = [
    { k: "cell", id: prefix, x: o.x, y: o.y, w: o.w, h, text: "", tone: o.tone ?? "plain" },
    { k: "text", id: `${prefix}-n`, x: o.x + o.w / 2, y: o.y + 12, text: title, tone: "ink", anchor: "middle", size: 12, mono: false, weight: 700 },
    { k: "path", id: `${prefix}-u`, pts: [[round(o.x + o.w / 2 - tw / 2), o.y + 20], [round(o.x + o.w / 2 + tw / 2), o.y + 20]], tone: "ink", width: 1 },
    { k: "path", id: `${prefix}-d`, pts: [[o.x, o.y + head], [o.x + o.w, o.y + head]], tone: "line", width: 1 },
  ];
  rows.forEach((r, i) => items.push({ k: "text", id: `${prefix}-r${i}`, x: o.x + 10, y: rowY(i), text: r, tone: o.rowTone?.(i) ?? "ink", anchor: "start", size: 11.5, mono: true }));
  return { items, h, rowY };
}

/* ── The note's Employee hierarchy, as class data ─────────────────── */

type Fields = Record<string, number | string>;
interface EmpClass {
  parent?: string;
  /** Virtual functions this class declares (the base's list fixes the vtable's slot order). */
  virtuals?: readonly string[];
  /** Bodies this class defines for virtual functions; absent = pure virtual here or inherited. */
  defines: Record<string, (f: Fields) => number | string>;
  fields: readonly string[];
}

const EMP: Record<string, EmpClass> = {
  Employee: { virtuals: ["~Employee", "role", "pay"], defines: {}, fields: ["name"] },
  Manager: { parent: "Employee", defines: { role: () => "Manager", pay: (f) => Number(f.salary) + Number(f.bonus) }, fields: ["salary", "bonus"] },
  Engineer: { parent: "Employee", defines: { role: () => "Engineer", pay: (f) => Number(f.salary) }, fields: ["salary"] },
  Intern: { parent: "Employee", defines: { role: () => "Intern", pay: (f) => Number(f.stipend) }, fields: ["stipend"] },
};

const chainOf = (cls: string): string[] => (cls ? [cls, ...(EMP[cls].parent ? chainOf(EMP[cls].parent!) : [])] : []);

/** A class's vtable: the root's slots in order; each holds the nearest definition walking up from the class. A destructor slot holds the class's own destructor. */
function vtable(cls: string): Array<{ slot: string; owner: string | null }> {
  const root = chainOf(cls).at(-1)!;
  return EMP[root].virtuals!.map((slot) => {
    if (slot.startsWith("~")) return { slot: "~", owner: cls };
    const owner = chainOf(cls).find((c) => EMP[c].defines[slot]) ?? null;
    return { slot, owner };
  });
}

/** A virtual call: read the object's vptr (its class's vtable), take the slot, run that body on the object's fields. */
function virtualCall(obj: { cls: string; fields: Fields }, method: string): { owner: string; result: number | string; slotIndex: number } {
  const table = vtable(obj.cls);
  const slotIndex = table.findIndex((s) => s.slot === method);
  const owner = table[slotIndex]?.owner;
  if (!owner) throw new Error(`virtualCall: ${obj.cls}.${method} is pure virtual`);
  return { owner, result: EMP[owner].defines[method](obj.fields), slotIndex };
}

const STAFF = [
  { cls: "Manager", fields: { name: "Meera", salary: 120000, bonus: 30000 } as Fields },
  { cls: "Engineer", fields: { name: "Arjun", salary: 90000 } as Fields },
  { cls: "Intern", fields: { name: "Riya", stipend: 25000 } as Fields },
];

/** The note's Employee program's printout (its output fence). */
const PAYROLL_OUTPUT = ["Meera (Manager): 150000", "Arjun (Engineer): 90000", "Riya (Intern): 25000", "Payroll total: 265000", "Meera approves leave"];

/** Run the note's main() on the model, so every figure below draws from a checked run. */
function payroll() {
  const lines: string[] = [];
  let total = 0;
  const calls = STAFF.map((o) => {
    const role = virtualCall(o, "role");
    const pay = virtualCall(o, "pay");
    lines.push(`${o.fields.name} (${role.result}): ${pay.result}`);
    total += Number(pay.result);
    return { role, pay };
  });
  lines.push(`Payroll total: ${total}`);
  const casts = STAFF.map((o) => chainOf(o.cls).includes("Manager"));
  STAFF.forEach((o, i) => casts[i] && lines.push(`${o.fields.name} approves leave`));
  if (JSON.stringify(lines) !== JSON.stringify(PAYROLL_OUTPUT)) throw new Error(`payroll: model printed ${JSON.stringify(lines)}`);
  return { calls, total, casts };
}

/* ── The vtable ───────────────────────────────────────────────────── */

function vtableFigure(): Walkthrough {
  const run = payroll();
  const OW = 168;
  const TX = OW + 70;
  const TW = 196;
  const ROWH = 112;

  const draw = (hot: number | null): Item[] => {
    const items: Item[] = [label("ho", "objects", OW / 2, -12, { tone: "soft", size: 11 }), label("ht", "one vtable per class", TX + TW / 2, -12, { tone: "soft", size: 11 })];
    STAFF.forEach((o, i) => {
      const y = i * ROWH;
      const isHot = hot === i;
      const rows = ["vptr", ...EMP[o.cls].fields.length ? chainOf(o.cls).reverse().flatMap((c) => EMP[c].fields.map((f) => `${f} = ${o.fields[f]}`)) : []];
      const ob = objectBox(`o${i}`, `${o.fields.name} : ${o.cls}`, rows, { x: 0, y, w: OW, tone: isHot ? "accent" : "plain", rowTone: (r) => (r === 0 ? (isHot ? "accent" : "soft") : undefined) });
      items.push(...ob.items);
      const table = vtable(o.cls);
      const tb = { x: TX, y: y + 4 };
      items.push(box(`t${i}`, tb.x, tb.y, `${o.cls}'s vtable`, { w: TW, h: 24, size: 11.5, tone: isHot ? "accent" : "muted" }));
      table.forEach((s, k) => {
        const hotSlot = isHot && s.slot === "pay";
        items.push(box(`s${i}-${k}`, tb.x, tb.y + 28 + k * 24, s.slot === "~" ? `destructor → ~${o.cls}` : `${s.slot} → ${s.owner}::${s.slot}${hotSlot ? ` = ${run.calls[i].pay.result}` : ""}`, { w: TW, h: 22, size: 11, tone: hotSlot ? "strong" : "plain" }));
      });
      items.push(arrow(`v${i}`, { x: OW - 10, y: ob.rowY(0) }, { x: TX - 3, y: tb.y + 12 }, { tone: isHot ? "accent" : "ink" }));
    });
    return items;
  };

  const frames: Frame[] = [
    {
      caption: "Every object of a class with virtual functions carries a hidden vptr, set by its constructor, pointing at its class's vtable. Each class's table has the same slots in the same order; an override fills its slot with that class's own function.",
      items: draw(null),
    },
  ];
  STAFF.forEach((o, i) => {
    const c = run.calls[i].pay;
    const detail = o.cls === "Manager" ? `${o.fields.salary} + ${o.fields.bonus} = ${c.result}` : `${c.result}`;
    frames.push({
      caption:
        i === 0
          ? `e->pay() for staff[0] compiles to: follow e's vptr, read the ${["first", "second", "third", "fourth"][c.slotIndex]} slot (pay), call what is there. Here that is ${c.owner}::pay, which returns ${detail}.`
          : `The same machine code for staff[${i}] reads a different vptr and so a different table, and runs ${c.owner}::pay: ${detail}.${i === STAFF.length - 1 ? ` The loop never asked which class it held; the total is ${run.total}.` : ""}`,
      items: draw(i),
    });
  });
  return finish({ title: "How e->pay() finds the right function: vptr, vtable, slot", input: 'staff = [Manager("Meera"), Engineer("Arjun"), Intern("Riya")]', frames });
}

/* ── Compile time vs run time ─────────────────────────────────────── */

interface Overload {
  sig: string;
  params: readonly string[];
  body: (...a: number[]) => number;
}
/** The note's two area() overloads. */
const AREA: readonly Overload[] = [
  { sig: "int area(int side)", params: ["int"], body: (side) => side * side },
  { sig: "int area(int width, int height)", params: ["int", "int"], body: (w, h) => w * h },
];

/** Overload resolution, as far as this example needs it: the candidates whose parameter list matches the argument types. */
function resolveOverload(args: readonly number[]): { chosen: Overload; rejected: Overload[] } {
  const types = args.map(() => "int");
  const fits = AREA.filter((o) => o.params.length === types.length && o.params.every((p, i) => p === types[i]));
  if (fits.length !== 1) throw new Error(`resolveOverload: ${fits.length} candidates for ${args.length} argument(s)`);
  return { chosen: fits[0], rejected: AREA.filter((o) => o !== fits[0]) };
}

function bindingTime(): Walkthrough {
  const run = payroll();
  const LW = 248;
  const RX = LW + 34;
  const RW = 220;
  const items0 = (activeLeft: boolean): Item[] => [
    ...region("lc", 0, 0, LW, 196, "compile time: the compiler decides", { tone: activeLeft ? "accent" : "ghost", labelTone: activeLeft ? "accent" : "soft" }),
    ...region("rc", RX, 0, RW, 196, "run time: the object decides", { tone: activeLeft ? "ghost" : "accent", labelTone: activeLeft ? "soft" : "accent" }),
  ];
  const frames: Frame[] = [];
  const printed: string[] = [];
  for (const args of [[5], [3, 4]]) {
    const r = resolveOverload(args);
    const value = r.chosen.body(...args);
    printed.push(`${args.length === 1 ? "square" : "rectangle"} area: ${value}`);
    const items = items0(true);
    items.push(label("call", `area(${args.join(", ")})`, 12, 26, { anchor: "start", tone: "ink", mono: true, size: 13, weight: 700 }));
    items.push(label("argt", `argument types: (${args.map(() => "int").join(", ")})`, 12, 46, { anchor: "start", tone: "soft", mono: true, size: 11.5 }));
    AREA.forEach((o, k) => {
      const ok = o === r.chosen;
      items.push(box(`ov${k}`, 12, 62 + k * 40, o.sig, { w: LW - 24, h: 32, size: 11, tone: ok ? "strong" : "error" }));
    });
    items.push(label("res", `bound before the program runs → ${value}`, 12, 160, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
    items.push(label("rq", "nothing left to decide", RX + RW / 2, 100, { tone: "faint", size: 11.5 }));
    frames.push({
      caption: `area(${args.join(", ")}) has ${args.length} int argument${args.length > 1 ? "s" : ""}, so only ${r.chosen.sig} fits and the other overload is rejected for its parameter count. The choice is fixed in the compiled code; it returns ${value}.`,
      items,
    });
  }
  if (printed.join("|") !== "square area: 25|rectangle area: 12") throw new Error(`bindingTime: overloads printed ${printed.join("|")}`);
  // The override: the compiler knows only Employee, so it emits a call through the vtable slot; each object answers at run time.
  const items = items0(false);
  items.push(label("call", "e->pay()", 12, 26, { anchor: "start", tone: "ink", mono: true, size: 13, weight: 700 }));
  items.push(label("dt", "declared type of e: Employee*", 12, 50, { anchor: "start", tone: "soft", mono: true, size: 11.5 }));
  items.push(box("emit", 12, 66, "call through vtable slot pay", { w: LW - 24, h: 32, size: 11, tone: "plain" }));
  items.push(label("res", "which function: not known yet", 12, 160, { anchor: "start", tone: "soft", size: 11.5, weight: 600 }));
  STAFF.forEach((o, i) => {
    const c = run.calls[i].pay;
    items.push(box(`rt${i}`, RX + 12, 26 + i * 54, `${o.cls}::pay → ${c.result}`, { w: RW - 24, h: 32, size: 11.5, tone: "strong" }));
    items.push(label(`rl${i}`, `e = staff[${i}], a ${o.cls}`, RX + 14, 26 + i * 54 + 42, { anchor: "start", tone: "soft", size: 11 }));
  });
  items.push(arrow("hand", { x: LW - 10, y: 82 }, { x: RX + 10, y: 42 }, { tone: "accent", bow: -20 }));
  frames.push({
    caption: `For e->pay() the compiler sees only Employee*, so it can only emit "call whatever is in slot pay". The one call site then runs ${STAFF.map((o) => `${o.cls}::pay`).join(", ")} in turn, chosen by each object.`,
    items,
  });
  return finish({ title: "Overloads are chosen by the compiler; overrides by the object", input: "area(5); area(3, 4); for e in staff: e->pay()", frames });
}

/* ── Upcasting and a checked downcast ─────────────────────────────── */

function casts(): Walkthrough {
  const run = payroll();
  const PX = 0;
  const OX = 150;
  const CX = 330;
  const frames: Frame[] = [];
  const printed: string[] = [];
  const draw = (o: { step: number | null; done: number }): Item[] => {
    const items: Item[] = [label("hp", "staff: Employee*", PX + 50, -12, { tone: "soft", size: 11 }), label("hc", "dynamic_cast<Manager*>", CX + 70, -12, { tone: "soft", size: 11 })];
    STAFF.forEach((s, i) => {
      const y = i * 52;
      const hot = o.step === i;
      items.push(box(`p${i}`, PX, y, `staff[${i}]`, { w: 100, h: 34, size: 12, tone: hot ? "accent" : "plain" }));
      items.push(arrow(`a${i}`, { x: PX + 102, y: y + 17 }, { x: OX - 3, y: y + 17 }, { tone: hot ? "accent" : "ink" }));
      items.push(box(`o${i}`, OX, y, `${s.fields.name} : ${s.cls}`, { w: 140, h: 34, size: 11.5, tone: hot ? "accent" : "plain" }));
      if (i < o.done) {
        const ok = run.casts[i];
        items.push(box(`c${i}`, CX, y, ok ? "Manager* (valid)" : "nullptr", { w: 140, h: 34, size: 11.5, tone: ok ? "strong" : "muted" }));
        items.push(arrow(`ca${i}`, { x: OX + 142, y: y + 17 }, { x: CX - 3, y: y + 17 }, { tone: ok ? "accent" : "line", dashed: !ok }));
      }
    });
    items.push(...printed.map((l, k) => label(`out${k}`, `> ${l}`, PX, 3 * 52 + 14 + k * 18, { anchor: "start", tone: "ink", mono: true, size: 12 })));
    return items;
  };
  frames.push({
    caption: "Upcasting: each element is used through an Employee pointer, whatever its real class. That is always safe, because every Manager, Engineer and Intern is an Employee.",
    items: draw({ step: null, done: 0 }),
  });
  STAFF.forEach((s, i) => {
    const ok = run.casts[i];
    if (ok) printed.push(`${s.fields.name} approves leave`);
    frames.push({
      caption: ok
        ? `dynamic_cast checks the object's real class at run time: ${s.fields.name} is a ${s.cls}, so the cast returns a usable Manager pointer and approveLeave() can be called.`
        : `${s.fields.name} is ${/^[AEIOU]/.test(s.cls) ? "an" : "a"} ${s.cls}, which is not a Manager anywhere up its chain (${chainOf(s.cls).join(" → ")}), so the cast returns nullptr instead of a pointer to the wrong thing.`,
      items: draw({ step: i, done: i + 1 }),
    });
  });
  return finish({ title: "Upcasting is implicit; a downcast is checked", input: "for e in staff: if (auto m = dynamic_cast<const Manager*>(e)) m->approveLeave();", frames });
}

/* ── Object slicing ───────────────────────────────────────────────── */

/** The slicing example's classes: Employee::role is virtual with a body; Manager overrides it. */
const SLICE: Record<string, { parent?: string; role: string }> = { Employee: { role: "Employee" }, Manager: { parent: "Employee", role: "Manager" } };
const SLICING_OUTPUT = ["by value: Employee", "by reference: Manager", "assigned copy: Employee"];

function slicing(): Walkthrough {
  // A copy into an Employee value is built by Employee's copy constructor: it is an Employee, and its vptr says so.
  const m = { cls: "Manager" };
  const byValue = { cls: "Employee", from: m };
  const byRef = m; // a reference is the object itself
  const role = (o: { cls: string }) => SLICE[o.cls].role;
  const printed = [`by value: ${role(byValue)}`, `by reference: ${role(byRef)}`, `assigned copy: ${role({ cls: "Employee" })}`];
  if (JSON.stringify(printed) !== JSON.stringify(SLICING_OUTPUT)) throw new Error(`slicing: model printed ${JSON.stringify(printed)}`);

  const MX = 0;
  const EX = 250;
  const W = 200;
  const tableFor = (cls: string, x: number, y: number, hot: boolean, id: string): Item[] => [
    box(`${id}-h`, x, y, `${cls}'s vtable`, { w: W, h: 24, size: 11, tone: hot ? "accent" : "muted" }),
    box(id, x, y + 26, `role → ${cls}::role`, { w: W, h: 26, size: 11.5, tone: hot ? "strong" : "plain" }),
  ];
  const mObj = (hot: boolean, tableHot = false): Item[] => {
    const items: Item[] = [box("m", MX, 0, "", { w: W, h: 94, tone: hot ? "accent" : "plain" })];
    items.push(label("m-n", "m : Manager", MX + W / 2, 13, { tone: "ink", size: 12, weight: 700 }));
    items.push(box("m-e", MX + 10, 26, "Employee part: vptr", { w: W - 20, h: 26, size: 11 }));
    items.push(box("m-m", MX + 10, 58, "Manager part", { w: W - 20, h: 26, size: 11 }));
    items.push(...tableFor("Manager", MX, 140, tableHot, "tm"));
    items.push(arrow("mv", { x: MX + 40, y: 52 }, { x: MX + 40, y: 137 }, { tone: "ink" }));
    return items;
  };
  const frames: Frame[] = [];
  {
    const items = mObj(false);
    items.push(box("e", EX, 0, "", { w: W, h: 94, tone: "accent" }));
    items.push(label("e-n", "e : Employee (a copy)", EX + W / 2, 13, { tone: "ink", size: 12, weight: 700 }));
    items.push(box("e-e", EX + 10, 26, "Employee part: vptr", { w: W - 20, h: 26, size: 11, tone: "plain" }));
    items.push(box("e-m", EX + 10, 58, "Manager part: sliced off", { w: W - 20, h: 26, size: 11, tone: "ghost" }));
    items.push(arrow("cp", { x: MX + W - 8, y: 39 }, { x: EX + 8, y: 39 }, { tone: "accent", label: "copy" }));
    items.push(...tableFor("Employee", EX, 140, true, "te"));
    items.push(arrow("ev", { x: EX + 40, y: 52 }, { x: EX + 40, y: 137 }, { tone: "accent" }));
    items.push(label("res", `byValue(m): e.role() → "${role(byValue)}"`, MX, 214, { anchor: "start", tone: "error", mono: true, size: 12, weight: 600 }));
    frames.push({ caption: `Passing m by value copies only the Employee part into a new Employee object, whose constructor points its vptr at Employee's vtable. The Manager part is cut away, so role() answers "${role(byValue)}". Employee copy = m slices the same way.`, items });
  }
  {
    const items = mObj(true, true);
    items.push(box("e", EX, 30, "e : const Employee&", { w: W, h: 34, size: 11.5, tone: "accent" }));
    items.push(arrow("cp", { x: EX - 2, y: 47 }, { x: MX + W + 3, y: 47 }, { tone: "accent" }));
    items.push(label("e-n", "a reference: another name for m", EX + W / 2, 80, { tone: "soft", size: 11 }));
    items.push(label("res", `byReference(m): e.role() → "${role(byRef)}"`, MX, 214, { anchor: "start", tone: "accent", mono: true, size: 12, weight: 600 }));
    frames.push({ caption: `By reference nothing is copied: e is another name for m itself, the vptr still points at Manager's vtable, and role() answers "${role(byRef)}". Polymorphism in C++ needs a pointer or a reference.`, items });
  }
  return finish({ title: "Object slicing: a derived object copied into a base value", input: "Manager m; byValue(m); byReference(m);", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "binding-time": bindingTime,
  vtable: vtableFigure,
  casts,
  slicing,
};
