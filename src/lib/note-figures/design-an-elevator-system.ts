import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "./kit.js";
import { packet } from "./sd-kit.js";

/**
 * Design an Elevator System: the note's figures (content/notes/
 * low-level-design/design-an-elevator-system.md). A points subject, so every
 * figure loops. The behaviour is a TypeScript model of the note's program —
 * two elevators (E1 at floor 4 going up with a stop at 7, E2 idle at 0), a
 * dispatcher that prefers the nearest elevator idle or heading towards a
 * call, and a LOOK scheduler — whose printed lines are checked against the
 * note's output fence:
 *
 *  - class-diagram: the dispatcher, the elevator, its direction, the
 *    scheduler interface and two schedulers, one step a frame;
 *  - dispatcher: the four hall calls, each sent to the elevator the rule picks;
 *  - look-run: E1 moving floor by floor, stopping where LOOK says, turning
 *    at its last stop up;
 *  - scan-vs-look: the same stops served by SCAN (to the top floor) and by
 *    LOOK, as floor against floors travelled.
 */

/* ── The model (the note's program) ───────────────────────────────── */

type Dir = "UP" | "DOWN" | "IDLE";
const TOP = 10;

interface Car {
  id: string;
  floor: number;
  dir: Dir;
  moved: number;
  stops: Set<number>;
}

const headingTo = (e: Car, f: number) => e.dir === "IDLE" || (e.dir === "UP" && f >= e.floor) || (e.dir === "DOWN" && f <= e.floor);

/** LOOK: keep going while there are stops ahead, then turn at the last one. */
function lookNext(e: Car): number {
  const s = [...e.stops];
  const above = s.filter((x) => x >= e.floor);
  const below = s.filter((x) => x <= e.floor);
  const up = above.length ? Math.min(...above) : null;
  const down = below.length ? Math.max(...below) : null;
  if (e.dir === "UP") return up ?? down!;
  if (e.dir === "DOWN") return down ?? up!;
  if (up === null) return down!;
  if (down === null) return up;
  return up - e.floor < e.floor - down ? up : down;
}

const CALLS = [9, 1, 6, 2];
const INSIDE = 3;

const OUTPUT = [
  "call 9 -> E1",
  "call 1 -> E2",
  "call 6 -> E1",
  "call 2 -> E2",
  "press 3 inside E1",
  "E1 stops at 6 going UP",
  "E1 stops at 7 going UP",
  "E1 stops at 9 going UP",
  "E1 turns DOWN",
  "E1 stops at 3 going DOWN",
  "E1 idle at 3, moved 11 floors",
  "E2 stops at 1 going UP",
  "E2 stops at 2 going UP",
  "E2 idle at 2, moved 2 floors",
];

interface Assign {
  floor: number;
  to: string;
  /** Each elevator as the call found it: floor, direction, whether it was heading towards the call. */
  seen: Array<{ id: string; floor: number; dir: Dir; heading: boolean; stops: number[] }>;
}

interface Model {
  assigns: Assign[];
  /** E1's stops once everything is assigned, and its start. */
  e1Start: { floor: number; dir: Dir; stops: number[] };
  /** The order each elevator served its stops. */
  served: Record<string, number[]>;
}

function runModel(): Model {
  const fresh = (): Car[] => [
    { id: "E1", floor: 4, dir: "UP", moved: 0, stops: new Set([7]) },
    { id: "E2", floor: 0, dir: "IDLE", moved: 0, stops: new Set() },
  ];
  const cars = fresh();
  const out: string[] = [];
  const assigns: Assign[] = [];
  for (const floor of CALLS) {
    const seen = cars.map((e) => ({ id: e.id, floor: e.floor, dir: e.dir, heading: headingTo(e, floor), stops: [...e.stops].sort((a, b) => a - b) }));
    let best: Car | null = null;
    for (const strict of [true, false]) {
      for (const e of cars) if ((!strict || headingTo(e, floor)) && (best === null || Math.abs(e.floor - floor) < Math.abs(best.floor - floor))) best = e;
      if (best) break;
    }
    if (best!.dir === "IDLE") best!.dir = floor >= best!.floor ? "UP" : "DOWN";
    best!.stops.add(floor);
    out.push(`call ${floor} -> ${best!.id}`);
    assigns.push({ floor, to: best!.id, seen });
  }
  cars[0].stops.add(INSIDE);
  out.push(`press ${INSIDE} inside E1`);
  const e1Start = { floor: cars[0].floor, dir: cars[0].dir, stops: [...cars[0].stops].sort((a, b) => a - b) };
  const served: Record<string, number[]> = {};
  for (const e of cars) {
    served[e.id] = [];
    while (e.stops.size) {
      const next = lookNext(e);
      const d: Dir = next > e.floor ? "UP" : next < e.floor ? "DOWN" : e.dir;
      if (d !== e.dir && e.dir !== "IDLE") out.push(`${e.id} turns ${d}`);
      e.dir = d;
      e.moved += Math.abs(next - e.floor);
      e.floor = next;
      e.stops.delete(next);
      served[e.id].push(next);
      out.push(`${e.id} stops at ${next} going ${d}`);
    }
    e.dir = "IDLE";
    out.push(`${e.id} idle at ${e.floor}, moved ${e.moved} floors`);
  }
  if (out.join("\n") !== OUTPUT.join("\n")) throw new Error(`design-an-elevator-system: the model printed ${JSON.stringify(out)}`);
  return { assigns, e1Start, served };
}

/** SCAN: like LOOK, but it rides to the end of the shaft before turning. Returns the floors it visits in order (the end included). */
function scanVisits(start: number, dir: Dir, stops: readonly number[]): number[] {
  const left = new Set(stops);
  const visits: number[] = [];
  let floor = start;
  let d = dir;
  while (left.size) {
    const ahead = [...left].filter((s) => (d === "UP" ? s >= floor : s <= floor)).sort((a, b) => (d === "UP" ? a - b : b - a));
    for (const s of ahead) {
      visits.push(s);
      left.delete(s);
      floor = s;
    }
    if (!left.size) break;
    const end = d === "UP" ? TOP : 0;
    if (floor !== end) visits.push(end);
    floor = end;
    d = d === "UP" ? "DOWN" : "UP";
  }
  return visits;
}

const travelled = (start: number, visits: readonly number[]) => visits.reduce((acc, f, i) => acc + Math.abs(f - (i ? visits[i - 1] : start)), 0);

/* ── Shaft drawing ────────────────────────────────────────────────── */

const FH = 28;
const fy = (f: number) => (TOP - f) * FH;

function floorScale(prefix: string, x: number): Item[] {
  const items: Item[] = [];
  for (let f = 0; f <= TOP; f++) items.push(label(`${prefix}${f}`, String(f), x, fy(f) + FH / 2, { anchor: "end", tone: "faint", size: 10.5, mono: true }));
  return items;
}

function shaft(id: string, x: number, w: number): Item {
  return { k: "band", id, x, y: 0, w, h: (TOP + 1) * FH, tone: "ghost" };
}

/* ── Class diagram, built up ──────────────────────────────────────── */

function classDiagram(): Walkthrough {
  const specs: Record<string, ClassSpec> = {
    dispatcher: { name: "Dispatcher", fields: ["- elevators: List"], methods: ["+ call(floor)", "+ run(e)"] },
    elevator: { name: "Elevator", fields: ["- floor: int", "- dir: Direction", "- stops: SortedSet"], methods: ["+ headingTo(f): bool"] },
    direction: { name: "Direction", stereotype: "enum", fields: ["UP", "DOWN", "IDLE"] },
    scheduler: { name: "Scheduler", stereotype: "interface", methods: ["+ next(e): int"] },
    look: { name: "LookScheduler" },
    scan: { name: "ScanScheduler" },
  };
  const at: Record<string, [number, number]> = {
    dispatcher: [0, 0],
    elevator: [0, 150],
    direction: [236, 196],
    scheduler: [262, 0],
    look: [200, 112],
    scan: [334, 112],
  };
  const steps: Array<{ adds: string[]; caption: string }> = [
    { adds: ["dispatcher"], caption: "The Dispatcher is the building's brain: hall buttons call it with a floor, and it decides which elevator answers." },
    { adds: ["elevator"], caption: "The dispatcher owns the elevators. Each knows its floor, its direction and the stops it still has to make, kept sorted so the next one up or down is quick to find." },
    { adds: ["direction"], caption: "The direction is the elevator's state: moving up, moving down or idle. It decides which stops count as ahead, and so where the car goes next." },
    { adds: ["scheduler"], caption: "Choosing the next stop is a Strategy behind a Scheduler interface, so the building can change its policy without touching the elevator." },
    { adds: ["look", "scan"], caption: "LOOK turns at the last stop in its direction; SCAN rides to the end of the shaft first. Both answer next(e); FCFS or a rush-hour policy would be one more class." },
  ];
  const frames: Frame[] = [];
  const shown = new Set<string>();
  for (const step of steps) {
    step.adds.forEach((k) => shown.add(k));
    const fresh = new Set(step.adds);
    const b: Record<string, ReturnType<typeof classBox>> = {};
    for (const k of Object.keys(specs)) {
      if (!shown.has(k)) continue;
      b[k] = classBox(k, specs[k], { x: at[k][0], y: at[k][1], w: k === "look" || k === "scan" ? 120 : undefined, tone: fresh.has(k) ? "accent" : "plain" });
    }
    const tone = (k: string) => (fresh.has(k) ? "accent" : "ink");
    const items: Item[] = [];
    if (b.elevator) items.push(...umlLink("r-el", b.dispatcher.bottom, b.elevator.top, "composes", { label: "1..*", tone: tone("elevator") }));
    if (b.direction) items.push(...umlLink("r-dir", { x: b.elevator.x + b.elevator.w, y: b.elevator.y + 50 }, b.direction.left, "associates", { tone: tone("direction") }));
    if (b.scheduler) items.push(...umlLink("r-sch", { x: b.dispatcher.x + b.dispatcher.w, y: b.dispatcher.y + 36 }, b.scheduler.left, "associates", { tone: tone("scheduler") }));
    if (b.look) items.push(...umlLink("r-look", b.look.top, { x: b.scheduler.x + 30, y: b.scheduler.bottom.y }, "implements", { tone: tone("look") }));
    if (b.scan) items.push(...umlLink("r-scan", b.scan.top, { x: b.scheduler.x + b.scheduler.w - 30, y: b.scheduler.bottom.y }, "implements", { tone: tone("scan") }));
    for (const k of Object.keys(b)) items.push(...b[k].items);
    frames.push({ caption: step.caption, items });
  }
  return finish({ title: "The elevator system's classes, one step at a time", input: "", frames });
}

/* ── The dispatcher assigning hall calls ──────────────────────────── */

function dispatcher(): Walkthrough {
  const m = runModel();
  const X = { E1: 120, E2: 230 } as const;
  const CW = 56;
  const draw = (o: { cars: Array<{ id: "E1" | "E2"; floor: number; dir: Dir; stops: number[] }>; call?: { floor: number; to?: "E1" | "E2" }; hot?: string }): Item[] => {
    const items: Item[] = [...floorScale("fl", 14)];
    for (const c of o.cars) {
      items.push(shaft(`sh${c.id}`, X[c.id], CW));
      items.push(label(`nm${c.id}`, c.id, X[c.id] + CW / 2, -14, { tone: "ink", size: 12, weight: 700 }));
      for (const s of c.stops) items.push({ k: "node", id: `st${c.id}-${s}`, x: X[c.id] + CW + 12, y: fy(s) + FH / 2, r: 5, text: "", tone: "accent" });
      items.push(box(`car${c.id}`, X[c.id] + 4, fy(c.floor) + 3, c.dir === "IDLE" ? "idle" : c.dir === "UP" ? "▲ up" : "▼ down", { w: CW - 8, h: FH - 6, tone: o.hot === c.id ? "accent" : "strong", size: 10 }));
    }
    items.push(label("hall", "hall calls", 58, -14, { tone: "soft", size: 11 }));
    if (o.call) {
      items.push(box("hallbtn", 34, fy(o.call.floor) + 4, `call ${o.call.floor}`, { w: 48, h: FH - 8, tone: "accent", size: 10 }));
      items.push({ k: "edge", id: "hallwire", x1: 84, y1: fy(o.call.floor) + FH / 2, x2: o.call.to ? X[o.call.to] - 2 : 100, y2: fy(o.call.floor) + FH / 2, tone: "accent", arrow: true, dashed: true });
      const p = o.call.to ? { x: X[o.call.to] + CW + 12, y: fy(o.call.floor) + FH / 2 } : { x: 54, y: fy(o.call.floor) + FH / 2 };
      items.push(packet("call", p, { text: o.call.floor, tone: "accent", r: 10 }));
    }
    return items;
  };
  type CarView = { id: "E1" | "E2"; floor: number; dir: Dir; stops: number[] };
  const view = (a: Assign): CarView[] => a.seen.map((s) => ({ id: s.id as "E1" | "E2", floor: s.floor, dir: s.dir, stops: s.stops }));
  const frames: Frame[] = [];
  const first = view(m.assigns[0]);
  frames.push({ caption: "E1 is at floor 4 going up with a stop at 7; E2 is idle at the ground floor. The dispatcher prefers the nearest elevator that is idle or already heading towards the call.", items: draw({ cars: first }) });
  m.assigns.forEach((a, i) => {
    const after: CarView[] = i + 1 < m.assigns.length ? view(m.assigns[i + 1]) : m.assigns[i].seen.map((s) => {
      const stops = s.id === a.to ? [...s.stops, a.floor].sort((x, y) => x - y) : s.stops;
      return { id: s.id as "E1" | "E2", floor: s.floor, dir: s.id === a.to && s.dir === "IDLE" ? (a.floor >= s.floor ? "UP" : "DOWN") : s.dir, stops };
    });
    const why = a.seen
      .map((s) => `${s.id} ${s.heading ? `${s.dir === "IDLE" ? "is idle" : `is heading there`}, ${Math.abs(s.floor - a.floor)} away` : "is moving away"}`)
      .join("; ");
    const caption = `A call at floor ${a.floor}: ${why}. It goes to ${a.to}.`;
    // The call appears at its hall button, then lands on the chosen elevator — two frames would flicker, so it lands in this one.
    frames.push({ caption, items: draw({ cars: after, call: { floor: a.floor, to: a.to as "E1" | "E2" }, hot: a.to }) });
  });
  const last = m.assigns[m.assigns.length - 1];
  const finalCars = last.seen.map((s) => ({ id: s.id as "E1" | "E2", floor: s.floor, dir: s.dir === "IDLE" ? ("UP" as Dir) : s.dir, stops: s.id === "E1" ? m.e1Start.stops : [...s.stops, last.floor].sort((x, y) => x - y) }));
  frames.push({ caption: `Inside E1 a passenger presses ${INSIDE}. A car button never goes through the dispatcher: the stop belongs to that elevator, even though it is behind it.`, items: draw({ cars: finalCars, hot: "E1" }) });
  return finish({ title: "The dispatcher: each hall call to the nearest elevator heading its way", input: "", frames });
}

/* ── LOOK, floor by floor ─────────────────────────────────────────── */

function lookRun(): Walkthrough {
  const m = runModel();
  const start = m.e1Start;
  const order = m.served.E1;
  // Floor-by-floor positions between the stops LOOK chose.
  const path: Array<{ floor: number; dir: Dir }> = [{ floor: start.floor, dir: start.dir }];
  let at = start.floor;
  for (const s of order) {
    while (at !== s) {
      at += s > at ? 1 : -1;
      path.push({ floor: at, dir: s > path[path.length - 1].floor ? "UP" : "DOWN" });
    }
  }
  if (path.length > 16) throw new Error(`look-run: ${path.length} frames`);
  const X = 40;
  const CW = 60;
  const frames: Frame[] = [];
  const left = new Set(start.stops);
  let turned = false;
  path.forEach((p, i) => {
    const stopping = i > 0 && left.has(p.floor) && order.includes(p.floor);
    if (stopping) left.delete(p.floor);
    const prevDir = i > 0 ? path[i - 1].dir : start.dir;
    const turning = i > 0 && p.dir !== prevDir;
    if (turning) turned = true;
    const items: Item[] = [...floorScale("fl", 26), shaft("sh", X, CW)];
    for (const s of start.stops) {
      const done = !left.has(s);
      items.push({ k: "node", id: `st${s}`, x: X + CW + 14, y: fy(s) + FH / 2, r: 6, text: "", tone: done ? "muted" : "accent" });
    }
    items.push(box("car", X + 4, fy(p.floor) + 3, stopping ? "doors" : p.dir === "UP" ? "▲" : "▼", { w: CW - 8, h: FH - 6, tone: stopping ? "accent" : "strong", size: 11 }));
    const remaining = order.filter((s) => left.has(s));
    items.push(label("q-h", "stops left, in LOOK order", 136, 6, { anchor: "start", tone: "soft", size: 11 }));
    items.push(label("q", remaining.length ? remaining.join(" → ") : "none", 136, 26, { anchor: "start", tone: "ink", size: 13, mono: true, weight: 700 }));
    items.push(label("dir", `direction: ${!remaining.length ? "idle" : p.dir === "UP" ? "up" : "down"}`, 136, 52, { anchor: "start", tone: turning ? "accent" : "soft", size: 11.5, mono: true }));
    let caption: string;
    if (i === 0) caption = `E1 is at floor ${p.floor} going up, with stops at ${start.stops.join(", ")}. LOOK serves every stop above it in order before it considers the one below.`;
    else if (stopping && turning) caption = `E1 has turned and reaches floor ${p.floor}, its last stop; the stop list is empty, so it goes idle here after ${travelled(start.floor, order)} floors.`;
    else if (stopping && remaining.length && remaining[0] < p.floor && !turned) caption = `Stop at ${p.floor}: nothing is left above it, so LOOK turns here instead of riding on to floor ${TOP}. Next is ${remaining[0]}, below.`;
    else if (stopping) caption = `The doors open at floor ${p.floor}. Stops still ahead going up: ${remaining.filter((s) => s > p.floor).join(", ")}.`;
    else if (turning || p.dir === "DOWN") caption = `Going down past floor ${p.floor}: no stop here, the next one is ${remaining[0]}.`;
    else caption = `Passing floor ${p.floor} on the way up: no one asked for it, so the car keeps moving to ${remaining[0]}.`;
    if (stopping && !remaining.length && !turning) caption = `E1 reaches floor ${p.floor}, the last stop, and goes idle after ${travelled(start.floor, order)} floors.`;
    frames.push({ caption, items });
  });
  return finish({ title: "LOOK: E1 serves 6, 7 and 9 on the way up, then turns for 3", input: "", frames });
}

/* ── SCAN against LOOK ────────────────────────────────────────────── */

function scanVsLook(): Walkthrough {
  const m = runModel();
  const { floor: start, dir, stops } = m.e1Start;
  const look = m.served.E1;
  const scan = scanVisits(start, dir, stops);
  const lookTotal = travelled(start, look);
  const scanTotal = travelled(start, scan);
  if (scanTotal <= lookTotal || !scan.includes(TOP)) throw new Error("scan-vs-look: SCAN should ride to the top and travel further");
  const UX = 20;
  const UY = 24;
  const X0 = 30;
  const px = (moved: number) => X0 + moved * UX;
  const py = (f: number) => (TOP - f) * UY;
  const series = [
    { key: "scan", name: "SCAN", visits: scan, tone: "faint" as const },
    { key: "look", name: "LOOK", visits: look, tone: "accent" as const },
  ];
  const frames: Frame[] = [];
  const steps = Math.max(scan.length, look.length);
  for (let k = 0; k <= steps; k++) {
    const items: Item[] = [];
    // Every floor on the axis; the requested ones in the accent, with a guide line across.
    for (let f = 0; f <= TOP; f++) {
      const asked = stops.includes(f);
      items.push(label(`yl${f}`, String(f), X0 - 8, py(f), { anchor: "end", tone: asked ? "accent" : "faint", size: 10, mono: true, weight: asked ? 700 : 400 }));
      if (asked || f === 0 || f === TOP) items.push({ k: "edge", id: `gl${f}`, x1: X0, y1: py(f), x2: px(scanTotal), y2: py(f), tone: "faint", dashed: true });
    }
    items.push(label("ylab", "floor (requested in bold)", 0, -16, { anchor: "start", tone: "soft", size: 11 }));
    items.push(label("xlab", "floors travelled →", px(scanTotal), py(0) + 22, { anchor: "end", tone: "soft", size: 11 }));
    for (const s of series) {
      let moved = 0;
      let floor = start;
      const upto = Math.min(k, s.visits.length);
      for (let i = 0; i < upto; i++) {
        const next = s.visits[i];
        const d = Math.abs(next - floor);
        items.push({ k: "edge", id: `${s.key}-seg${i}`, x1: px(moved), y1: py(floor), x2: px(moved + d), y2: py(next), tone: s.tone === "accent" ? "accent" : "ink", dashed: s.key === "scan" });
        moved += d;
        floor = next;
      }
      // SCAN's car is a ring and LOOK's a dot inside it, so both show where their paths coincide.
      items.push({ k: "node", id: `${s.key}-car`, x: px(moved), y: py(floor), r: s.key === "scan" ? 10 : 5, text: "", tone: s.key === "look" ? "strong" : "accent" });
      const done = upto === s.visits.length;
      items.push(label(`${s.key}-t`, `${s.name}: ${moved} floors${done ? " · done" : ""}`, px(scanTotal) + 10, s.key === "scan" ? 0 : 20, { anchor: "start", tone: s.key === "look" ? "accent" : "ink", size: 11.5, mono: true, weight: done ? 700 : 400 }));
    }
    let caption: string;
    if (k === 0) caption = `Both policies start E1 at floor ${start} going up with stops at ${stops.join(", ")}, the floors in bold. SCAN is the ring and dashed line, LOOK the dot and solid line.`;
    else if (k <= 3) caption = `Both serve ${look[k - 1]} on the way up in the same order, so their lines run together.`;
    else if (k === 4) caption = `Here they part: with nothing above 9, LOOK turns and heads straight for 3, while SCAN rides on to floor ${TOP}, the end of the shaft.`;
    else caption = `SCAN finally turns at ${TOP} and comes down to 3: ${scanTotal} floors against LOOK's ${lookTotal}. LOOK saves the empty ride; SCAN's sweep is simpler to bound.`;
    frames.push({ caption, items });
  }
  return finish({ title: "SCAN against LOOK: the same stops, two ways to turn", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "class-diagram": classDiagram,
  dispatcher,
  "look-run": lookRun,
  "scan-vs-look": scanVsLook,
};
