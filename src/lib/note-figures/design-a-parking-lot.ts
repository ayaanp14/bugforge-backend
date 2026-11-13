import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink, type ClassSpec } from "./kit.js";

/**
 * Design a Parking Lot: the note's figures (content/notes/low-level-design/
 * design-a-parking-lot.md). A points subject, so every figure loops. The
 * behaviour is a TypeScript model of the note's program — the same two
 * levels (S1 M1 L1, then M1 L1), the same best-fit strategy, the same
 * hourly prices — and its printed lines are checked against the note's
 * output fence, so a figure cannot drift from the code:
 *
 *  - class-diagram: the model built up one class (and its relation) a frame;
 *  - allocation: each vehicle gliding into the spot best-fit actually chose,
 *    a car leaving with its fee, and the truck that finds no spot;
 *  - park-sequence: park("KA-04", CAR) as a sequence diagram, the level
 *    answers read off the model at that moment;
 *  - two-gates: two gates racing for the last spots, without and with a lock.
 */

/* ── The model (the note's program) ───────────────────────────────── */

type Kind = "BIKE" | "CAR" | "TRUCK";
const NEEDS: Record<Kind, number> = { BIKE: 0, CAR: 1, TRUCK: 2 };
const RATES: Record<Kind, number> = { BIKE: 10, CAR: 20, TRUCK: 40 };
const SIZE_NAME = ["small", "medium", "large"];

interface Spot {
  level: number;
  id: string;
  size: number;
  plate: string | null;
}

const LEVELS: string[][] = [
  ["S1", "M1", "L1"],
  ["M1", "L1"],
];

type Event = { park: string; kind: Kind; hour: number } | { leave: string; hour: number } | { full: number };

const SCRIPT: Event[] = [
  { park: "KA-01", kind: "BIKE", hour: 0 },
  { park: "KA-02", kind: "CAR", hour: 1 },
  { park: "KA-03", kind: "TRUCK", hour: 1 },
  { full: 1 },
  { park: "KA-04", kind: "CAR", hour: 2 },
  { leave: "KA-02", hour: 4 },
  { park: "KA-05", kind: "CAR", hour: 4 },
  { park: "KA-06", kind: "TRUCK", hour: 5 },
  { park: "KA-07", kind: "TRUCK", hour: 5 },
];

const OUTPUT = [
  "KA-01 BIKE -> level 1 spot S1",
  "KA-02 CAR -> level 1 spot M1",
  "KA-03 TRUCK -> level 1 spot L1",
  "level 1 full: true",
  "KA-04 CAR -> level 2 spot M1",
  "KA-02 leaves level 1 spot M1 after 3h, fee 60",
  "KA-05 CAR -> level 1 spot M1",
  "KA-06 TRUCK -> level 2 spot L1",
  "KA-07 TRUCK -> no spot",
];

/** Best fit: lowest level first; on that level, the smallest free spot that fits. */
function bestFit(levels: Spot[][], kind: Kind): Spot | null {
  for (const level of levels) {
    let best: Spot | null = null;
    for (const s of level) if (s.plate === null && s.size >= NEEDS[kind] && (best === null || s.size < best.size)) best = s;
    if (best) return best;
  }
  return null;
}

interface Step {
  event: Event;
  /** The spots after the event. */
  spots: Spot[][];
  spot: Spot | null;
  fee?: number;
  hours?: number;
  line: string;
}

function runLot(): Step[] {
  const levels: Spot[][] = LEVELS.map((ids, l) => ids.map((id) => ({ level: l + 1, id, size: "SML".indexOf(id[0]), plate: null })));
  const tickets = new Map<string, { kind: Kind; spot: Spot; hour: number }>();
  const steps: Step[] = [];
  const copy = () => levels.map((l) => l.map((s) => ({ ...s })));
  for (const e of SCRIPT) {
    if ("park" in e) {
      const s = bestFit(levels, e.kind);
      if (s) {
        s.plate = e.park;
        tickets.set(e.park, { kind: e.kind, spot: s, hour: e.hour });
      }
      steps.push({ event: e, spots: copy(), spot: s ? { ...s } : null, line: `${e.park} ${e.kind} -> ${s ? `level ${s.level} spot ${s.id}` : "no spot"}` });
    } else if ("leave" in e) {
      const t = tickets.get(e.leave)!;
      tickets.delete(e.leave);
      const spot = { ...t.spot };
      t.spot.plate = null;
      const hours = e.hour - t.hour;
      const fee = Math.max(1, hours) * RATES[t.kind];
      steps.push({ event: e, spots: copy(), spot, fee, hours, line: `${e.leave} leaves level ${spot.level} spot ${spot.id} after ${hours}h, fee ${fee}` });
    } else {
      const full = levels[e.full - 1].every((s) => s.plate !== null);
      steps.push({ event: e, spots: copy(), spot: null, line: `level ${e.full} full: ${full}` });
    }
  }
  const printed = steps.map((s) => s.line);
  if (printed.join("\n") !== OUTPUT.join("\n")) throw new Error(`design-a-parking-lot: the model printed ${JSON.stringify(printed)}`);
  return steps;
}

const kindOf = (plate: string): Kind => (SCRIPT.find((e) => "park" in e && e.park === plate) as { kind: Kind }).kind;

/* ── Class diagram, built up ──────────────────────────────────────── */

function classDiagram(): Walkthrough {
  const specs: Record<string, ClassSpec> = {
    lot: { name: "ParkingLot", fields: ["- levels: Level[]"], methods: ["+ park(v): Ticket", "+ leave(t): int"] },
    level: { name: "Level", fields: ["- spots: Spot[]"], methods: ["+ isFull(): bool"] },
    spot: { name: "ParkingSpot", fields: ["- size: Size", "- vehicle: Vehicle"], methods: ["+ fits(v): bool"] },
    vehicle: { name: "Vehicle", fields: ["- plate: String", "- type: Type"] },
    factory: { name: "VehicleFactory", methods: ["+ create(plate, type)"] },
    ticket: { name: "Ticket", fields: ["- entryHour: int"] },
    spotStrategy: { name: "SpotStrategy", stereotype: "interface", methods: ["+ find(v): Spot"] },
    pricing: { name: "PricingStrategy", stereotype: "interface", methods: ["+ fee(t, exit): int"] },
  };
  const at: Record<string, [number, number]> = {
    lot: [0, 0],
    level: [0, 150],
    spot: [0, 286],
    ticket: [214, 168],
    vehicle: [214, 290],
    spotStrategy: [404, 0],
    pricing: [404, 104],
    factory: [404, 296],
  };
  const steps: Array<{ adds: string[]; caption: string }> = [
    { adds: ["lot"], caption: "Start from the noun the requirements open with: one ParkingLot, the class the gates talk to. It parks a vehicle (returning a ticket) and takes a ticket back (returning the fee)." },
    { adds: ["level", "spot"], caption: "A lot is made of levels and a level of spots, each with a size. Both are composition: a spot does not exist outside its level, nor a level outside its lot." },
    { adds: ["vehicle", "factory"], caption: "A spot holds at most one Vehicle. VehicleFactory is the one place that turns a type into a vehicle and the spot size it needs, so a new type changes one class." },
    { adds: ["ticket"], caption: "A Ticket records which vehicle went into which spot and when, so leaving needs only the ticket: it frees the spot and prices the stay." },
    { adds: ["spotStrategy", "pricing"], caption: "The two rules that change most sit behind interfaces: which spot to pick (best fit, nearest the lift) and how to charge (hourly, flat, weekend). Swapping one never touches ParkingLot." },
  ];
  const frames: Frame[] = [];
  const shown = new Set<string>();
  for (const step of steps) {
    step.adds.forEach((k) => shown.add(k));
    const fresh = new Set(step.adds);
    const boxes: Record<string, ReturnType<typeof classBox>> = {};
    const items: Item[] = [];
    for (const k of Object.keys(specs)) {
      if (!shown.has(k)) continue;
      const [x, y] = at[k];
      boxes[k] = classBox(k, specs[k], { x, y, tone: fresh.has(k) ? "accent" : "plain" });
    }
    const has = (...ks: string[]) => ks.every((k) => boxes[k]);
    const tone = (...ks: string[]) => (ks.some((k) => fresh.has(k)) ? "accent" : "ink");
    const b = boxes;
    if (has("lot", "level")) items.push(...umlLink("r-lot-level", b.lot.bottom, b.level.top, "composes", { label: "1..*", tone: tone("level") }));
    if (has("level", "spot")) items.push(...umlLink("r-level-spot", b.level.bottom, b.spot.top, "composes", { label: "1..*", tone: tone("spot") }));
    if (has("spot", "vehicle")) items.push(...umlLink("r-spot-vehicle", { x: b.spot.x + b.spot.w, y: b.spot.y + 60 }, { x: b.vehicle.x, y: b.vehicle.y + 56 }, "associates", { label: "0..1", tone: tone("vehicle") }));
    if (has("factory", "vehicle")) items.push(...umlLink("r-factory", b.factory.left, { x: b.vehicle.x + b.vehicle.w, y: b.factory.left.y }, "depends", { label: "creates", tone: tone("factory") }));
    if (has("ticket", "vehicle")) items.push(...umlLink("r-ticket-vehicle", b.ticket.bottom, b.vehicle.top, "associates", { tone: tone("ticket") }));
    if (has("ticket", "spot")) items.push(...umlLink("r-ticket-spot", b.ticket.left, { x: b.spot.x + b.spot.w, y: b.spot.y + 14 }, "associates", { tone: tone("ticket") }));
    if (has("lot", "ticket")) items.push(...umlLink("r-lot-ticket", { x: b.lot.x + b.lot.w, y: b.lot.y + 72 }, b.ticket.top, "depends", { label: "issues", tone: tone("ticket") }));
    if (has("lot", "spotStrategy")) items.push(...umlLink("r-lot-ss", { x: b.lot.x + b.lot.w, y: b.lot.y + 26 }, b.spotStrategy.left, "associates", { tone: tone("spotStrategy") }));
    if (has("lot", "pricing")) items.push(...umlLink("r-lot-pr", { x: b.lot.x + b.lot.w, y: b.lot.y + 48 }, b.pricing.left, "associates", { tone: tone("pricing") }));
    for (const k of Object.keys(boxes)) items.push(...boxes[k].items);
    frames.push({ caption: step.caption, items });
  }
  return finish({ title: "The parking lot's classes, one relation at a time", input: "", frames });
}

/* ── Allocation: cars into the spots best fit chose ───────────────── */

const SPOT_W = [56, 72, 92];
const SPOT_H = 44;
const LOT_X = 120;
const LEVEL_Y = [26, 122];

function spotRect(level: number, index: number) {
  const ids = LEVELS[level - 1];
  let x = LOT_X;
  for (let i = 0; i < index; i++) x += SPOT_W["SML".indexOf(ids[i][0])] + 8;
  const w = SPOT_W["SML".indexOf(ids[index][0])];
  return { x, y: LEVEL_Y[level - 1], w, h: SPOT_H };
}

const GATE = { x: 0, y: 84 };
const EXIT = { x: 404, y: 84 };

function car(plate: string, x: number, y: number, w: number, tone: Tone): Item {
  return { k: "cell", id: `car-${plate}`, x, y, w, h: 28, text: plate, tone, size: 10.5 };
}

function allocation(): Walkthrough {
  const steps = runLot();
  const parks = SCRIPT.filter((e) => "park" in e) as Array<{ park: string; kind: Kind }>;
  const frames: Frame[] = [];
  // Which vehicle waits at the gate after step i: the next park event's.
  const nextAfter = (i: number) => {
    for (let j = i + 1; j < SCRIPT.length; j++) {
      const e = SCRIPT[j];
      if ("park" in e) return e;
    }
    return null;
  };
  const draw = (spots: Spot[][], o: { hot?: string; waiting: { park: string; kind: Kind } | null; leaving?: string; rejected?: string; fullLevel?: number; note: string }): Item[] => {
    const items: Item[] = [];
    items.push(label("gate-t", "Entry gate", GATE.x + 34, GATE.y - 14, { tone: "soft", size: 11, weight: 600 }));
    items.push(label("exit-t", "Exit", EXIT.x + 30, EXIT.y - 14, { tone: "soft", size: 11, weight: 600 }));
    spots.forEach((level, l) => {
      const n = l + 1;
      const full = level.every((s) => s.plate !== null);
      items.push(label(`lv${n}`, `Level ${n}${full ? " · full" : ""}`, LOT_X, LEVEL_Y[l] - 12, { anchor: "start", tone: o.fullLevel === n ? "accent" : "soft", size: 11, weight: 600 }));
      level.forEach((s, i) => {
        const r = spotRect(n, i);
        const hot = o.hot !== undefined && s.plate === o.hot;
        items.push(box(`sp${n}-${s.id}`, r.x, r.y, "", { w: r.w, h: r.h, tone: hot ? "accent" : s.plate ? "strong" : "plain" }));
        items.push(label(`sl${n}-${s.id}`, `${s.id} ${SIZE_NAME[s.size]}`, r.x + r.w / 2, r.y + r.h + 11, { tone: "faint", size: 10 }));
        if (s.plate) items.push(car(s.plate, r.x + 4, r.y + 8, r.w - 8, hot ? "accent" : "strong"));
      });
    });
    if (o.waiting) {
      items.push(car(o.waiting.park, GATE.x + 4, GATE.y, 60, "plain"));
      items.push(label("wait-k", o.waiting.kind, GATE.x + 34, GATE.y + 42, { tone: "soft", size: 10.5, mono: true }));
    }
    if (o.rejected) {
      items.push(car(o.rejected, GATE.x + 4, GATE.y, 60, "error"));
      items.push(label("wait-k", `${kindOf(o.rejected)} · no spot`, GATE.x + 34, GATE.y + 42, { tone: "error", size: 10.5, mono: true }));
    }
    if (o.leaving) items.push(car(o.leaving, EXIT.x, EXIT.y, 60, "muted"));
    items.push(label("note", o.note, 0, 206, { anchor: "start", tone: "ink", size: 11.5, mono: true }));
    return items;
  };
  const empty = LEVELS.map((ids, l) => ids.map((id) => ({ level: l + 1, id, size: "SML".indexOf(id[0]), plate: null as string | null })));
  frames.push({
    caption: "Two levels, five spots of three sizes. The spot strategy is best fit: try the lowest level first, and on it take the smallest free spot the vehicle fits in.",
    items: draw(empty, { waiting: parks[0], note: "best fit: lowest level, smallest spot that fits" }),
  });
  steps.forEach((s, i) => {
    const e = s.event;
    const waiting = nextAfter(i);
    if ("full" in e) return; // folded into the frame that filled the level
    if ("park" in e && s.spot) {
      const filled = steps[i + 1] && "full" in steps[i + 1].event ? 1 : undefined;
      const sizes = ["any spot", "a medium or large spot", "only a large spot"][NEEDS[e.kind]];
      const caption = filled
        ? `${e.park}, a truck, fits only a large spot, so it takes L1. Every spot on level 1 is now taken: the next vehicle's search moves on to level 2.`
        : `${e.park} (${e.kind.toLowerCase()}) fits ${sizes}; best fit takes level ${s.spot.level}'s smallest free one that fits, ${s.spot.id}${s.spot.level > 1 ? ", because level 1 has none left" : ""}.`;
      frames.push({ caption, items: draw(s.spots, { hot: e.park, waiting, fullLevel: filled, note: `ticket: ${e.park} in level ${s.spot.level} spot ${s.spot.id}, hour ${e.hour}` }) });
    } else if ("park" in e) {
      frames.push({
        caption: `${e.park} is a truck and the only large spots are both taken, so best fit returns nothing and the gate turns it away — the display board should already say "full" for trucks.`,
        items: draw(s.spots, { rejected: e.park, waiting: null, note: `${e.park}: no spot · display board: TRUCK full` }),
      });
    } else if ("leave" in e) {
      frames.push({
        caption: `${e.leave} leaves after ${s.hours} hours. The ticket frees level ${s.spot!.level} spot ${s.spot!.id} and the hourly pricing strategy charges ${s.hours} × ${RATES[kindOf(e.leave)]} = ${s.fee}.`,
        items: draw(s.spots, { leaving: e.leave, waiting, note: `${e.leave}: ${s.hours}h × ${RATES[kindOf(e.leave)]} = fee ${s.fee}` }),
      });
    }
  });
  return finish({ title: "Best fit at work: every vehicle into the spot the strategy chose", input: "", frames });
}

/* ── park("KA-04", CAR) as a sequence diagram ─────────────────────── */

function parkSequence(): Walkthrough {
  const steps = runLot();
  // The lot as KA-04 arrives: the state after the step before its park.
  const i = steps.findIndex((s) => "park" in s.event && s.event.park === "KA-04");
  const before = steps[i - 1].spots;
  const after = steps[i];
  const freeFor = (level: Spot[]) => {
    const fit = level.filter((s) => s.plate === null && s.size >= NEEDS.CAR).sort((a, b) => a.size - b.size);
    return fit.length ? fit[0].id : "none";
  };
  const l1 = freeFor(before[0]);
  const l2 = freeFor(before[1]);
  if (l1 !== "none" || `level 2 spot ${l2}` !== `level ${after.spot!.level} spot ${after.spot!.id}`) throw new Error("park-sequence: the levels' answers disagree with the model");

  const names = ["Gate", "ParkingLot", "BestFit", "Level 1", "Level 2"];
  const GAPX = 112;
  const Y0 = 64;
  const DY = 40;
  const msgs: Array<{ from: number; to: number; text: string; reply?: boolean; caption: string }> = [
    { from: 0, to: 1, text: "park(KA-04, CAR)", caption: "A car with plate KA-04 reaches the entry gate, which calls the lot. VehicleFactory turns CAR into a vehicle that needs a medium spot." },
    { from: 1, to: 2, text: "find(levels, car)", caption: "The lot does not search itself: it asks its spot strategy. Swapping BestFit for another strategy changes this one arrow's target." },
    { from: 2, to: 3, text: "free medium+?", caption: "Best fit starts at the lowest level and asks for the smallest free spot of medium size or larger." },
    { from: 3, to: 2, text: l1, reply: true, caption: "Level 1 has nothing free: the bike, the first car and the truck took S1, M1 and L1." },
    { from: 2, to: 4, text: "free medium+?", caption: "So the strategy moves on to level 2 and asks the same question." },
    { from: 4, to: 2, text: l2, reply: true, caption: `Level 2 answers ${l2}, its smallest free spot that fits a car; L1 stays free for a truck.` },
    { from: 2, to: 1, text: `level 2 ${l2}`, reply: true, caption: "The strategy returns the spot. The lot marks it taken and writes a ticket with the plate, the spot and the entry hour." },
    { from: 1, to: 0, text: "Ticket", reply: true, caption: `The gate prints the ticket and lifts the barrier: KA-04 is parked in level 2 spot ${l2}.` },
  ];
  const length = Y0 + DY * msgs.length - 30;
  const frames: Frame[] = [];
  msgs.forEach((_, n) => {
    const { items, xOf } = lifelines("ll", names, { gap: GAPX, w: 92, length, tone: (k) => (k === msgs[n].to ? "accent" : undefined) });
    msgs.slice(0, n + 1).forEach((m, j) => items.push(...message(`m${j}`, xOf(m.from), xOf(m.to), Y0 + j * DY, m.text, { dashed: m.reply, tone: j === n ? "accent" : "ink", textTone: j === n ? "accent" : "ink", size: 10.5 })));
    frames.push({ caption: msgs[n].caption, items });
  });
  return finish({ title: "park(KA-04, CAR): the gate, the lot, the strategy and the levels", input: "", frames });
}

/* ── Two gates, the last spots ────────────────────────────────────── */

function twoGates(): Walkthrough {
  // Two free medium spots; gates A and B each run "find the first free spot, then take it".
  type Op = { gate: "A" | "B"; op: "read" | "write" | "lock" | "unlock" };
  const run = (ops: Op[]) => {
    const spots: Record<string, string | null> = { M1: null, M2: null };
    const seen: Record<string, string | null> = { A: null, B: null };
    const states: Array<{ op: Op; spots: Record<string, string | null>; seen: Record<string, string | null>; holder: string | null; clash: boolean }> = [];
    let holder: string | null = null;
    let clash = false;
    for (const op of ops) {
      if (op.op === "lock") holder = op.gate;
      else if (op.op === "unlock") holder = null;
      else if (op.op === "read") seen[op.gate] = (["M1", "M2"] as const).find((s) => spots[s] === null) ?? null;
      else {
        const s = seen[op.gate]!;
        if (spots[s] !== null) clash = true;
        spots[s] = op.gate === "A" ? "KA-08" : "KA-09";
      }
      states.push({ op, spots: { ...spots }, seen: { ...seen }, holder, clash });
    }
    return states;
  };
  const noLock = run([
    { gate: "A", op: "read" },
    { gate: "B", op: "read" },
    { gate: "A", op: "write" },
    { gate: "B", op: "write" },
  ]);
  const locked = run([
    { gate: "A", op: "lock" },
    { gate: "A", op: "read" },
    { gate: "A", op: "write" },
    { gate: "A", op: "unlock" },
    { gate: "B", op: "lock" },
    { gate: "B", op: "read" },
    { gate: "B", op: "write" },
  ]);
  const lastBad = noLock[noLock.length - 1];
  const lastGood = locked[locked.length - 1];
  if (!lastBad.clash || lastBad.spots.M2 !== null) throw new Error("two-gates: the unlocked run should double-book M1");
  if (lastGood.clash || lastGood.spots.M1 !== "KA-08" || lastGood.spots.M2 !== "KA-09") throw new Error("two-gates: the locked run should give each car its own spot");

  const plate = { A: "KA-08", B: "KA-09" } as const;
  const gateY = { A: 30, B: 110 } as const;
  const spotAt = { M1: { x: 300, y: 22 }, M2: { x: 300, y: 104 } } as const;
  const draw = (s: (typeof noLock)[number] | null, o: { mode: string; parked: Record<string, string[]>; clash?: boolean }): Item[] => {
    const items: Item[] = [label("mode", o.mode, 0, 0, { anchor: "start", tone: "ink", size: 12, weight: 700 })];
    (["A", "B"] as const).forEach((g) => {
      items.push(box(`gate${g}`, 0, gateY[g], `Gate ${g}`, { w: 70, h: 36, tone: s && s.op.gate === g ? "accent" : "plain", size: 11.5 }));
      const read = s?.seen[g];
      items.push(label(`seen${g}`, read ? `saw ${read} free` : "", 35, gateY[g] + 50, { tone: "soft", size: 10.5, mono: true }));
    });
    items.push(box("lock", 150, 66, s?.holder ? `lock: ${s.holder}` : "lock: free", { w: 92, h: 32, tone: s?.holder ? "accent" : o.mode.startsWith("No") ? "muted" : "plain", size: 11 }));
    (["M1", "M2"] as const).forEach((sp) => {
      const who = o.parked[sp];
      const bad = who.length > 1;
      items.push(box(`spot${sp}`, spotAt[sp].x, spotAt[sp].y, "", { w: 96, h: 52, tone: bad ? "error" : who.length ? "strong" : "plain" }));
      items.push(label(`spotl${sp}`, `${sp} medium`, spotAt[sp].x + 48, spotAt[sp].y + 64, { tone: "faint", size: 10 }));
    });
    // Cars: at their gate until written, then in the spot they wrote (two in one spot sit side by side, both red).
    (["A", "B"] as const).forEach((g) => {
      const sp = (["M1", "M2"] as const).find((k) => o.parked[k].includes(plate[g]));
      if (!sp) items.push({ k: "cell", id: `car${g}`, x: 80, y: gateY[g] + 4, w: 52, h: 28, text: plate[g], tone: "plain", size: 10.5 });
      else {
        const k = o.parked[sp].indexOf(plate[g]);
        const two = o.parked[sp].length > 1;
        items.push({ k: "cell", id: `car${g}`, x: spotAt[sp].x + (two ? 2 + k * 47 : 22), y: spotAt[sp].y + 12, w: two ? 45 : 52, h: 28, text: plate[g], tone: two ? "error" : "strong", size: two ? 9.5 : 10.5 });
      }
    });
    return items;
  };
  // Who has written into each spot so far (a double booking keeps both).
  const parkedOf = (states: typeof noLock, upto: number) => {
    const p: Record<string, string[]> = { M1: [], M2: [] };
    states.slice(0, upto + 1).forEach((st) => {
      if (st.op.op === "write") p[st.seen[st.op.gate]!].push(plate[st.op.gate]);
    });
    return p;
  };
  const frames: Frame[] = [
    { caption: "Two cars reach two gates at the same moment, and two medium spots are free. Each gate runs the same code: find the first free spot, then mark it taken.", items: draw(null, { mode: "No lock", parked: { M1: [], M2: [] } }) },
    { caption: `Without a lock the two steps interleave: gate A reads ${noLock[1].seen.A} as free, and before it writes, gate B reads the lot and also sees ${noLock[1].seen.B} free.`, items: draw(noLock[1], { mode: "No lock", parked: parkedOf(noLock, 1) }) },
    { caption: `Both gates write: ${plate.A} and ${plate.B} are both assigned M1 while M2 stays empty. That is a double booking, the race interviewers ask about.`, items: draw(lastBad, { mode: "No lock", parked: parkedOf(noLock, 3) }) },
    { caption: `With a lock around find-and-take, gate A holds it, reads M1 free and takes it; gate B must wait, so it cannot read a stale lot.`, items: draw(locked[2], { mode: "With a lock", parked: parkedOf(locked, 2) }) },
    { caption: `A releases the lock, B takes it, reads the lot again and finds M2 the first free spot. Each car gets its own spot; the critical section is just those two steps.`, items: draw(lastGood, { mode: "With a lock", parked: parkedOf(locked, locked.length - 1) }) },
  ];
  return finish({ title: "Two gates, two free spots: a race without a lock, none with one", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "class-diagram": classDiagram,
  allocation,
  "park-sequence": parkSequence,
  "two-gates": twoGates,
};
