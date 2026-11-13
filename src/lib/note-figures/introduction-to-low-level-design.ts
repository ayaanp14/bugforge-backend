import { finish, textWidth, type Frame, type Item, type TextTone, type Walkthrough } from "../walkthroughs/core.js";
import { label, region } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink, type ClassSpec } from "./kit.js";
import { service, wire } from "./sd-kit.js";

/**
 * Introduction to Low-Level Design: the note's figures
 * (content/notes/low-level-design/introduction-to-low-level-design.md).
 * Every figure loops (a points subject); the class diagrams build up class
 * by class with stable ids, and the use case is a small parking model run
 * here, its calls recorded as it goes:
 *
 *  - nouns-to-classes: a requirement parsed for its nouns (classes), verbs
 *    (methods) and "has" (relations) — the boxes are derived from the tags;
 *  - model-grows: the parking-lot class diagram, one class and its relation
 *    a frame;
 *  - hld-to-lld: one service of a high-level design opened up into classes;
 *  - walk-a-use-case: park(car) through a two-floor model, one call a frame.
 */

/* ── Nouns and verbs ──────────────────────────────────────────────── */

// [text|Class] a noun, {text|Class.method} a verb, (text) a relation word, <text> an actor.
const REQUIREMENT = [
  "A [parking lot|ParkingLot] (has) [floors|Floor]; each [floor|Floor] (has) [spots|Spot].",
  "A [vehicle|Vehicle] {parks|ParkingLot.park} in a free [spot|Spot] that {fits|Spot.fits} it,",
  "and gets a [ticket|Ticket]. The <driver> {pays|Ticket.pay} the [ticket|Ticket] on exit.",
];
const SIGNATURES: Record<string, string> = { "ParkingLot.park": "+ park(v): Ticket", "Spot.fits": "+ fits(v): bool", "Ticket.pay": "+ pay(): void" };

type Seg = { text: string; kind: "plain" | "noun" | "verb" | "has" | "actor"; ref?: string };

function parseLine(line: string): Seg[] {
  const out: Seg[] = [];
  const re = /\[([^|\]]+)\|([^\]]+)\]|\{([^|}]+)\|([^}]+)\}|\(([^)]+)\)|<([^>]+)>|([^[{(<]+)/g;
  for (const m of line.matchAll(re)) {
    if (m[1]) out.push({ text: m[1], kind: "noun", ref: m[2] });
    else if (m[3]) out.push({ text: m[3], kind: "verb", ref: m[4] });
    else if (m[5]) out.push({ text: m[5], kind: "has" });
    else if (m[6]) out.push({ text: m[6], kind: "actor" });
    else if (m[7]) out.push({ text: m[7], kind: "plain" });
  }
  return out;
}

function nounsToClasses(): Walkthrough {
  const lines = REQUIREMENT.map(parseLine);
  const segs = lines.flat();
  const classes = [...new Set(segs.filter((s) => s.kind === "noun").map((s) => s.ref!))];
  const methods = new Map<string, string[]>(classes.map((c) => [c, []]));
  for (const s of segs.filter((x) => x.kind === "verb")) {
    const [owner] = s.ref!.split(".");
    const sig = SIGNATURES[s.ref!];
    if (!methods.has(owner!) || !sig) throw new Error(`nouns-to-classes: verb ${s.text} names no class`);
    if (!methods.get(owner!)!.includes(sig)) methods.get(owner!)!.push(sig);
  }
  if (classes.join(",") !== "ParkingLot,Floor,Spot,Vehicle,Ticket") throw new Error(`nouns-to-classes: classes ${classes.join(",")}`);

  const SIZE = 12;
  const LH = 20;
  const textItems = (tone: (s: Seg) => TextTone, weight: (s: Seg) => number | undefined): Item[] => {
    const items: Item[] = [];
    lines.forEach((segsOf, li) => {
      let x = 0;
      segsOf.forEach((s, i) => {
        // SVG drops a text's leading and trailing spaces, so they become x offsets.
        const lead = s.text.length - s.text.trimStart().length;
        const body = s.text.trim();
        if (body) items.push({ k: "text", id: `w${li}-${i}`, x: x + textWidth(" ".repeat(lead), SIZE), y: li * LH, text: body, tone: tone(s), anchor: "start", size: SIZE, mono: true, weight: weight(s) });
        x += textWidth(s.text, SIZE);
      });
    });
    return items;
  };
  const W = 120;
  const BY = 3 * LH + 22;
  const pos: Record<string, { x: number; y: number }> = {
    ParkingLot: { x: 0, y: BY },
    Floor: { x: 150, y: BY },
    Spot: { x: 300, y: BY },
    Ticket: { x: 0, y: BY + 100 },
    Vehicle: { x: 300, y: BY + 100 },
  };
  const boxes = (withMethods: boolean, lit: (c: string) => boolean) => {
    const items: Item[] = [];
    const b: Record<string, ReturnType<typeof classBox>> = {};
    for (const c of classes) {
      const spec: ClassSpec = { name: c, methods: withMethods ? methods.get(c) : [] };
      b[c] = classBox(`c-${c}`, spec, { x: pos[c]!.x, y: pos[c]!.y, w: W, tone: lit(c) ? "accent" : "plain" });
      items.push(...b[c]!.items);
    }
    return { items, b };
  };
  const legend = (text: string, tone: TextTone) => label("legend", text, 0, BY + 186, { anchor: "start", size: 11.5, tone, weight: 600 });

  const f0 = textItems(() => "ink", () => undefined);
  const nounTone = (s: Seg): TextTone => (s.kind === "noun" ? "accent" : s.kind === "actor" ? "faint" : "ink");
  const b1 = boxes(false, () => true);
  const f1 = [...textItems(nounTone, (s) => (s.kind === "noun" ? 700 : undefined)), ...b1.items, legend("nouns → classes   (driver is an actor, not a class)", "accent")];
  const owners = new Set([...methods].filter(([, m]) => m.length).map(([c]) => c));
  const b2 = boxes(true, (c) => owners.has(c));
  const f2 = [...textItems((s) => (s.kind === "verb" ? "accent" : s.kind === "actor" ? "faint" : "ink"), (s) => (s.kind === "noun" || s.kind === "verb" ? 700 : undefined)), ...b2.items, legend("verbs → methods on the class that owns the data", "accent")];
  const b3 = boxes(true, () => false);
  const f3 = [
    ...textItems((s) => (s.kind === "has" ? "accent" : s.kind === "actor" ? "faint" : "ink"), (s) => (s.kind === "has" ? 700 : undefined)),
    ...b3.items,
    ...umlLink("r1", { x: pos["ParkingLot"]!.x + W, y: BY + 13 }, { x: pos["Floor"]!.x, y: BY + 13 }, "composes", { tone: "accent" }),
    ...umlLink("r2", { x: pos["Floor"]!.x + W, y: BY + 13 }, { x: pos["Spot"]!.x, y: BY + 13 }, "composes", { tone: "accent" }),
    legend("\"has\" → a relation between two classes", "accent"),
  ];
  const frames: Frame[] = [
    { caption: "Start from the requirement exactly as the interviewer gave it. Read it slowly: the nouns, the verbs and the word has are the raw material of the design.", items: f0 },
    { caption: `The nouns become candidate classes: ${classes.join(", ")}. The driver is a noun too, but an actor outside the system, so it gets no class.`, items: f1 },
    { caption: "The verbs become methods, each on the class that owns the data it needs: park on ParkingLot, fits on Spot, pay on Ticket.", items: f2 },
    { caption: "Has marks a relation: a lot has floors, a floor has spots. Both are compositions here, because a floor does not exist apart from its lot.", items: f3 },
  ];
  return finish({ title: "Nouns become classes, verbs become methods", input: "", frames });
}

/* ── The model grows ──────────────────────────────────────────────── */

const MODEL: Record<string, ClassSpec> = {
  lot: { name: "ParkingLot", fields: ["- floors: Floor[]"], methods: ["+ park(v): Ticket", "+ leave(t): int"] },
  floor: { name: "Floor", fields: ["- spots: Spot[]"], methods: ["+ find(v): Spot"] },
  spot: { name: "Spot", fields: ["- size: Size", "- parked: Vehicle"], methods: ["+ fits(v): bool"] },
  vehicle: { name: "Vehicle", stereotype: "abstract", fields: ["- plate: String"], methods: ["+ size(): Size"] },
  car: { name: "Car", methods: ["+ size(): Size"] },
  bike: { name: "Bike", methods: ["+ size(): Size"] },
  ticket: { name: "Ticket", fields: ["- spot: Spot", "- inAt: int"], methods: ["+ fee(outAt): int"] },
};

function modelGrows(): Walkthrough {
  const GX = 44;
  const lot = classBox("lot", MODEL.lot!, { x: 0, y: 0 });
  const floor = classBox("floor", MODEL.floor!, { x: lot.w + GX, y: 0 });
  const spot = classBox("spot", MODEL.spot!, { x: floor.x + floor.w + GX, y: 0 });
  const R1 = Math.max(lot.h, floor.h, spot.h) + 56;
  const vehicleW = 120;
  const vehicle = classBox("vehicle", MODEL.vehicle!, { x: spot.x + spot.w / 2 - vehicleW / 2, y: R1, w: vehicleW });
  const R2 = R1 + vehicle.h + 48;
  const car = classBox("car", MODEL.car!, { x: vehicle.top.x - 120, y: R2, w: 110 });
  const bike = classBox("bike", MODEL.bike!, { x: vehicle.top.x + 10, y: R2, w: 110 });
  const ticket = classBox("ticket", MODEL.ticket!, { x: 0, y: R1 });

  // The fee rule Ticket.fee carries, run once so the caption's number is the model's: 20 an hour or part of one.
  const fee = (inAt: number, outAt: number) => Math.max(1, Math.ceil((outAt - inAt) / 60)) * 20;
  const sample = fee(9 * 60, 11 * 60 + 30);
  if (sample !== 60) throw new Error(`model-grows: fee ${sample}`);

  const steps: Array<{ add: string[]; caption: string }> = [
    { add: ["lot"], caption: "Begin with the class the use cases enter through: ParkingLot, with park and leave as its public methods. Everything else hangs off it." },
    { add: ["floor"], caption: "A lot has one or more floors. Floors never exist without their lot, so it is a composition (filled diamond) with multiplicity 1..*." },
    { add: ["spot"], caption: "Each floor has spots, again a composition. A spot knows its size and which vehicle, if any, is parked in it." },
    { add: ["vehicle", "car", "bike"], caption: "A spot holds 0..1 Vehicle. Vehicle is abstract, and Car and Bike extend it, so a truck later is a new class rather than an edit to Spot." },
    { add: ["ticket"], caption: `park creates a Ticket that remembers its spot and entry time. Its fee rule, 20 an hour or part of one, charges ${sample} for 9:00 to 11:30.` },
  ];
  const boxes: Record<string, ReturnType<typeof classBox>> = { lot, floor, spot, vehicle, car, bike, ticket };
  const links: Record<string, Item[]> = {
    floor: [...umlLink("l-floor", { x: lot.right.x, y: 13 }, { x: floor.x, y: 13 }, "composes"), label("l-floor-n", "1..*", floor.x - 14, 3, { size: 10.5, mono: true })],
    spot: [...umlLink("l-spot", { x: floor.right.x, y: 13 }, { x: spot.x, y: 13 }, "composes"), label("l-spot-n", "1..*", spot.x - 14, 3, { size: 10.5, mono: true })],
    vehicle: [
      ...umlLink("l-veh", spot.bottom, vehicle.top, "associates"),
      label("l-veh-n", "0..1", vehicle.top.x + 18, vehicle.y - 12, { size: 10.5, mono: true }),
      ...umlLink("l-car", car.top, { x: vehicle.bottom.x - 12, y: vehicle.bottom.y }, "inherits"),
      ...umlLink("l-bike", bike.top, { x: vehicle.bottom.x + 12, y: vehicle.bottom.y }, "inherits"),
    ],
    ticket: [
      ...umlLink("l-tk", lot.bottom, ticket.top, "depends"),
      label("l-tk-t", "creates", lot.bottom.x + 30, (lot.bottom.y + ticket.top.y) / 2, { size: 10.5 }),
      ...umlLink("l-tk-s", ticket.right, { x: spot.x + 16, y: spot.bottom.y }, "associates"),
    ],
  };
  const shown: string[] = [];
  const frames: Frame[] = steps.map((s) => {
    shown.push(...s.add);
    const items: Item[] = [];
    for (const k of shown) {
      const b = boxes[k]!;
      const fresh = s.add.includes(k);
      items.push(...(fresh ? classBox(k, MODEL[k]!, { x: b.x, y: b.y, w: b.w, tone: "accent" }).items : b.items));
    }
    for (const k of shown) for (const it of links[k] ?? []) items.push(s.add.includes(k) && it.k !== "text" ? { ...it, tone: "accent" } as Item : it);
    return { caption: s.caption, items };
  });
  return finish({ title: "A parking-lot model, one class at a time", input: "", frames });
}

/* ── HLD to LLD ───────────────────────────────────────────────────── */

function hldToLld(): Walkthrough {
  const names = ["Client", "API gateway", "Parking service", "Database"];
  const W = 114;
  const GX = 22;
  const lit = 2;
  const nodes = (tone: (i: number) => "plain" | "accent" | "muted") => names.map((n, i) => service(`h${i}`, i * (W + GX), 0, n, { w: W, tone: tone(i) }));
  const hld = (tone: (i: number) => "plain" | "accent" | "muted") => {
    const ns = nodes(tone);
    const items: Item[] = [];
    ns.forEach((n, i) => {
      items.push(...n.items);
      if (i > 0) items.push(wire(`hw${i}`, ns[i - 1]!.right, n.left));
    });
    return { ns, items };
  };
  const RY = 80;
  const svc = classBox("svc", { name: "ParkingService", methods: ["+ enter(v): Ticket", "+ exit(t): int"] }, { x: 0, y: RY + 18 });
  const strat = classBox("strat", { name: "SpotPicker", stereotype: "interface", methods: ["+ pick(v): Spot"] }, { x: svc.w + 70, y: RY + 18 });
  const lotB = classBox("lotb", { name: "ParkingLot", methods: ["+ freeSpots(v)"] }, { x: 0, y: RY + 18 + svc.h + 44 });
  const near = classBox("near", { name: "NearestFirst", methods: ["+ pick(v): Spot"] }, { x: strat.x, y: lotB.y });
  const regionW = near.x + near.w + 18;
  const regionH = lotB.y + lotB.h - RY + 12;

  const f0 = hld(() => "plain").items;
  const h1 = hld((i) => (i === lit ? "accent" : "muted"));
  const f1 = [...h1.items, label("q", "what is inside this box?", h1.ns[lit]!.mid.x, h1.ns[lit]!.bottom.y + 18, { size: 11.5, tone: "accent" })];
  const zoom = (): Item[] => {
    const h = hld((i) => (i === lit ? "accent" : "muted"));
    return [
      ...h.items,
      ...region("zoom", -9, RY, regionW, regionH, "Parking service, low-level", { tone: "ghost", labelTone: "accent" }),
      { k: "edge", id: "zl", x1: h.ns[lit]!.left.x, y1: h.ns[lit]!.bottom.y, x2: -9, y2: RY, tone: "faint", dashed: true },
      { k: "edge", id: "zr", x1: h.ns[lit]!.left.x + W, y1: h.ns[lit]!.bottom.y, x2: regionW - 9, y2: RY, tone: "faint", dashed: true },
    ];
  };
  const f2 = [...zoom(), ...svc.items, ...lotB.items, ...umlLink("u1", svc.bottom, lotB.top, "associates")];
  const f3 = [
    ...zoom(),
    ...svc.items,
    ...lotB.items,
    ...umlLink("u1", svc.bottom, lotB.top, "associates"),
    ...classBox("strat", { name: "SpotPicker", stereotype: "interface", methods: ["+ pick(v): Spot"] }, { x: strat.x, y: strat.y, tone: "accent" }).items,
    ...classBox("near", { name: "NearestFirst", methods: ["+ pick(v): Spot"] }, { x: near.x, y: near.y, w: near.w, tone: "accent" }).items,
    ...umlLink("u2", svc.right, strat.left, "associates", { tone: "accent" }),
    ...umlLink("u3", near.top, strat.bottom, "implements", { tone: "accent" }),
  ];
  return finish({
    title: "From high-level design to low-level design",
    input: "",
    frames: [
      { caption: "High-level design draws services, databases and the arrows between them. It answers what runs where and how the pieces talk.", items: f0 },
      { caption: "A low-level design round picks one of those boxes, here the parking service, and asks what code lives inside it.", items: f1 },
      { caption: "Inside the box are classes: a ParkingService that use cases call, holding the ParkingLot model with its floors and spots.", items: f2 },
      { caption: "How a spot is chosen will change, so it hides behind a SpotPicker interface; NearestFirst is today's rule, and a new rule is a new class.", items: f3 },
    ],
  });
}

/* ── Walk a use case ──────────────────────────────────────────────── */

function walkAUseCase(): Walkthrough {
  type Spot = { id: string; size: "bike" | "car"; free: boolean };
  const floors: Array<{ name: string; spots: Spot[] }> = [
    { name: "F1", spots: [{ id: "F1-1", size: "bike", free: true }, { id: "F1-2", size: "car", free: false }] },
    { name: "F2", spots: [{ id: "F2-1", size: "car", free: true }, { id: "F2-2", size: "car", free: true }] },
  ];
  const actors = ["Gate", "ParkingLot", "F1: Floor", "F2: Floor", "F2-1: Spot"];
  const who = (name: string) => actors.findIndex((a) => a === name || a.startsWith(`${name}:`));
  type Msg = { from: number; to: number; text: string; reply?: boolean };
  const msgs: Msg[] = [];
  const call = (from: string, to: string, text: string, reply = false) => msgs.push({ from: who(from), to: who(to), text, reply });
  // park(car), run on the model: ask each floor in turn for a free spot that fits.
  call("Gate", "ParkingLot", "park(car)");
  let chosen: Spot | null = null;
  for (const f of floors) {
    call("ParkingLot", f.name, "find(car)");
    const s = f.spots.find((x) => x.free && x.size === "car") ?? null;
    call(f.name, "ParkingLot", s ? s.id : "null", true);
    if (s) {
      chosen = s;
      break;
    }
  }
  if (!chosen || chosen.id !== "F2-1") throw new Error("walk-a-use-case: expected F2-1");
  call("ParkingLot", `${chosen.id}`, "assign(car)");
  chosen.free = false;
  call("ParkingLot", "Gate", `Ticket(${chosen.id})`, true);
  if (msgs.some((m) => m.from < 0 || m.to < 0)) throw new Error("walk-a-use-case: unknown actor");

  const GAP = 104;
  const STEP = 32;
  const ll = lifelines("ll", actors, { gap: GAP, w: 94, length: msgs.length * STEP + 14, size: 11 });
  const captions = [
    "The driver arrives: the gate calls park(car) on the lot. Walking one use case through the classes is how you prove the design works.",
    "The lot asks floor F1 for a free spot that fits a car. The lot does not search spots itself; each floor owns its own.",
    "F1's only car spot is taken and its free spot is for bikes, so F1 answers null and the lot moves on.",
    "The lot asks floor F2 the same question with the same call. Floors are interchangeable to the lot.",
    "F2 answers with spot F2-1, its first free car spot.",
    "The lot calls assign(car) on F2-1, so the spot now records which vehicle it holds and is no longer free.",
    "The lot creates a Ticket for F2-1 and returns it to the gate. Seven calls, each on the class that owns the data it touches.",
  ];
  if (captions.length !== msgs.length) throw new Error("walk-a-use-case: a caption per call");
  const frames: Frame[] = msgs.map((_, k) => {
    const items: Item[] = [...ll.items];
    msgs.slice(0, k + 1).forEach((m, i) => {
      const tone = i === k ? "accent" : "ink";
      items.push(...message(`m${i}`, ll.xOf(m.from), ll.xOf(m.to), ll.top + 22 + i * STEP, m.text, { tone, dashed: m.reply, textTone: i === k ? "accent" : m.text === "null" ? "soft" : "ink" }));
    });
    return { caption: captions[k]!, items };
  });
  return finish({ title: "Walking park(car) through the classes", input: "F1: bike spot free, car spot taken · F2: two free car spots", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "nouns-to-classes": nounsToClasses,
  "model-grows": modelGrows,
  "hld-to-lld": hldToLld,
  "walk-a-use-case": walkAUseCase,
};
