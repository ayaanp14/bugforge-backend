import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink, type ClassSpec } from "./kit.js";

/**
 * Design Patterns in LLD: the note's figures
 * (content/notes/low-level-design/design-patterns-in-lld.md). Each pattern
 * is tied to one LLD use and drawn from a small model of it run here:
 *
 *  - strategy-pricing: a parking fee calculator holding a swappable pricing
 *    rule; every fee printed is the rule run on a 3-hour stay;
 *  - observer-displays: a lot notifying its display board and app as cars
 *    come and go, one event a frame, each display's text computed;
 *  - vending-state: a vending machine's transition table run over four
 *    events, the refused one marked;
 *  - factory-vehicles: a factory turning type names into vehicle objects,
 *    the diagram growing with each class it creates;
 *  - decorator-addons: a parking pass wrapped by add-ons, the cost summed
 *    through the wrappers.
 */

/* ── Strategy ─────────────────────────────────────────────────────── */

function strategyPricing(): Walkthrough {
  const HOURS = 3;
  const rules = [
    { k: "hourly", name: "HourlyPricing", fee: (h: number) => 20 * h, says: "20 an hour" },
    { k: "flat", name: "FlatPricing", fee: () => 100, says: "100 a day, any length" },
    { k: "event", name: "EventPricing", fee: (h: number) => 2 * 20 * h, says: "double the hourly rate" },
  ];
  const fees = rules.map((r) => r.fee(HOURS));
  if (fees.join(",") !== "60,100,120") throw new Error(`strategy-pricing: fees ${fees}`);
  const calc = classBox("calc", { name: "FeeCalculator", fields: ["- rule: PricingStrategy"], methods: ["+ setRule(r)", "+ fee(hours): int"] }, { x: 0, y: 0 });
  const ifaceSpec: ClassSpec = { name: "PricingStrategy", stereotype: "interface", methods: ["+ fee(hours): int"] };
  const iface = classBox("iface", ifaceSpec, { x: calc.w + 80, y: 0 });
  const RY = Math.max(calc.h, iface.h) + 60;
  const W = 128;
  const GX = 18;
  const x0 = iface.x + iface.w / 2 - (3 * W + 2 * GX) / 2;
  const concrete = (i: number, tone?: "accent") => classBox(`s${i}`, { name: rules[i]!.name, methods: ["+ fee(hours)"] }, { x: x0 + i * (W + GX), y: RY, w: W, tone });
  const feeLabel = (i: number, tone: "accent" | "ink") => label(`f${i}`, `fee(${HOURS}) = ${fees[i]}`, x0 + i * (W + GX) + W / 2, RY + concrete(i).h + 15, { size: 11, mono: true, tone });
  const realize = (i: number, tone: "accent" | "ink") => umlLink(`r${i}`, concrete(i).top, { x: iface.bottom.x + (i - 1) * 36, y: iface.bottom.y }, "implements", { tone });
  const holds = (tone: "accent" | "ink") => [...umlLink("has", { x: calc.right.x, y: 50 }, { x: iface.x, y: 50 }, "associates", { tone }), label("has-t", "rule", calc.right.x + 40, 40, { size: 10.5, mono: true })];
  const base = (n: number, lit: number): Item[] => {
    const items: Item[] = [...calc.items, ...iface.items, ...holds("ink")];
    for (let i = 0; i < n; i++) items.push(...(i === lit ? concrete(i, "accent").items : concrete(i).items), ...realize(i, i === lit ? "accent" : "ink"), feeLabel(i, i === lit ? "accent" : "ink"));
    return items;
  };
  const frames: Frame[] = [
    { caption: "A parking lot must price a stay, and the pricing rules will change. FeeCalculator keeps the rule in a field typed by an interface, never by a class.", items: [...calc.items, ...classBox("iface", ifaceSpec, { x: iface.x, y: 0, tone: "accent" }).items, ...holds("accent")] },
    { caption: `HourlyPricing implements the interface: ${rules[0]!.says}, so a ${HOURS}-hour stay costs ${fees[0]}.`, items: base(1, 0) },
    { caption: `FlatPricing is a second strategy: ${rules[1]!.says}, so the same stay costs ${fees[1]}. setRule swaps it in at run time.`, items: base(2, 1) },
    { caption: `A new rule for event days, ${rules[2]!.says} (${fees[2]} for ${HOURS} hours), is one new class. FeeCalculator is not edited: open for extension, closed for modification.`, items: base(3, 2) },
  ];
  return finish({ title: "Strategy: a swappable pricing rule for a parking lot", input: `a ${HOURS}-hour stay`, frames });
}

/* ── Observer ─────────────────────────────────────────────────────── */

function observerDisplays(): Walkthrough {
  const lot = { free: 2, observers: [] as Array<"board" | "app"> };
  const render = { board: (n: number) => (n === 0 ? "FULL" : `Free: ${n}`), app: (n: number) => (n === 0 ? "push: lot full" : `${n} spot${n === 1 ? "" : "s"} free`) };
  const shows: Record<"board" | "app", string> = { board: render.board(lot.free), app: render.app(lot.free) };
  type Msg = { from: number; to: number; text: string };
  const who = { gate: 0, lot: 1, board: 2, app: 3 } as const;
  const steps: Array<{ msgs: Msg[]; shows: typeof shows; free: number }> = [];
  lot.observers.push("board", "app");
  steps.push({ msgs: [{ from: who.gate, to: who.lot, text: "subscribe(board)" }, { from: who.gate, to: who.lot, text: "subscribe(app)" }], shows: { ...shows }, free: lot.free });
  const event = (name: "park()" | "leave()") => {
    lot.free += name === "park()" ? -1 : 1;
    const msgs: Msg[] = [{ from: who.gate, to: who.lot, text: name }];
    for (const o of lot.observers) {
      shows[o] = render[o](lot.free);
      msgs.push({ from: who.lot, to: who[o], text: `update(${lot.free})` });
    }
    steps.push({ msgs, shows: { ...shows }, free: lot.free });
  };
  event("park()");
  event("park()");
  event("leave()");
  if (steps[2]!.shows.board !== "FULL" || steps[3]!.free !== 1) throw new Error("observer-displays: model drifted");

  const ll = lifelines("ll", ["Gate", "lot: ParkingLot", "board: Display", "app: MobileApp"], { gap: 128, w: 112, length: 118, size: 11 });
  const draw = (k: number): Item[] => {
    const s = steps[k]!;
    const items: Item[] = [...ll.items];
    s.msgs.forEach((m, i) => items.push(...message(`m${k}-${i}`, ll.xOf(m.from), ll.xOf(m.to), ll.top + 26 + i * 32, m.text, { tone: m.from === who.lot ? "accent" : "ink" })));
    const y = ll.top + 140;
    items.push(label("free", `free = ${s.free}`, ll.xOf(1), y, { size: 11.5, mono: true, weight: 700 }));
    items.push(box("sb", ll.xOf(2) - 56, y - 12, s.shows.board, { w: 112, h: 26, size: 11.5, tone: s.free === 0 ? "error" : "plain" }));
    items.push(box("sa", ll.xOf(3) - 56, y - 12, s.shows.app, { w: 112, h: 26, size: 11.5, tone: "plain" }));
    return items;
  };
  const frames: Frame[] = [
    { caption: "The board at the entrance and the mobile app both need the free-spot count. They subscribe to the lot, which keeps them in a list typed by an Observer interface.", items: draw(0) },
    { caption: `A car parks: free drops to ${steps[1]!.free} and the lot calls update on every subscriber in order. It does not know what a board or an app does with the number.`, items: draw(1) },
    { caption: "The last spot is taken: update(0). The board decides on its own to show FULL and the app sends a push; the lot's code is the same.", items: draw(2) },
    { caption: `A car leaves and free goes back to ${steps[3]!.free}. Adding an SMS alert later means one new observer class and one subscribe call.`, items: draw(3) },
  ];
  return finish({ title: "Observer: the lot tells every display when a spot frees up", input: "2 free spots; park, park, leave", frames });
}

/* ── State ────────────────────────────────────────────────────────── */

function vendingState(): Walkthrough {
  type S = "Idle" | "HasCoin" | "Dispensing";
  const table: Record<S, Partial<Record<string, S>>> = {
    Idle: { insertCoin: "HasCoin" },
    HasCoin: { select: "Dispensing", refund: "Idle" },
    Dispensing: { dispense: "Idle" },
  };
  const pos: Record<S, { x: number; y: number }> = { Idle: { x: 0, y: 110 }, HasCoin: { x: 250, y: 0 }, Dispensing: { x: 250, y: 220 } };
  const W = 116;
  const H = 40;
  const mid = (s: S) => ({ x: pos[s].x + W / 2, y: pos[s].y + H / 2 });
  const edges: Array<{ id: string; from: S; to: S; ev: string; a: { x: number; y: number }; b: { x: number; y: number }; bow?: number }> = [
    { id: "e1", from: "Idle", to: "HasCoin", ev: "insertCoin", a: { x: W, y: pos.Idle.y + 8 }, b: { x: pos.HasCoin.x, y: pos.HasCoin.y + 28 } },
    { id: "e4", from: "HasCoin", to: "Idle", ev: "refund", a: { x: pos.HasCoin.x, y: pos.HasCoin.y + 12 }, b: { x: 30, y: pos.Idle.y }, bow: 40 },
    { id: "e2", from: "HasCoin", to: "Dispensing", ev: "select", a: { x: mid("HasCoin").x, y: H }, b: { x: mid("Dispensing").x, y: pos.Dispensing.y } },
    { id: "e3", from: "Dispensing", to: "Idle", ev: "dispense", a: { x: pos.Dispensing.x, y: pos.Dispensing.y + 20 }, b: { x: W / 2, y: pos.Idle.y + H } },
  ];
  for (const e of edges) if (table[e.from][e.ev] !== e.to) throw new Error(`vending-state: edge ${e.ev} disagrees with the table`);
  const events = ["select", "insertCoin", "select", "dispense"];
  let state: S = "Idle";
  const frames: Frame[] = [];
  const draw = (lit: string | null, refused: string | null): Item[] => {
    const items: Item[] = [];
    for (const e of edges) items.push({ k: "edge", id: e.id, x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y, tone: e.id === lit ? "accent" : "line", arrow: true, bow: e.bow, label: e.ev });
    for (const s of Object.keys(pos) as S[]) items.push(box(`st-${s}`, pos[s].x, pos[s].y, s, { w: W, h: H, tone: s === state ? "accent" : "plain", size: 12.5 }));
    items.push(label("cur", `state = ${state}`, 0, pos.Dispensing.y + H + 26, { anchor: "start", size: 12, mono: true, weight: 700, tone: "accent" }));
    if (refused) items.push(label("ref", `${refused}() refused in ${state}`, 0, pos.Dispensing.y + H + 46, { anchor: "start", size: 11.5, mono: true, tone: "error" }));
    return items;
  };
  frames.push({ caption: "A vending machine behaves differently in each state. With the State pattern each state is a class implementing the same methods, and the machine delegates to its current state object.", items: draw(null, null) });
  const said: string[] = [];
  for (const ev of events) {
    const next: S | undefined = table[state][ev];
    if (!next) {
      frames.push({ caption: `${ev}() arrives in ${state}. The Idle state's select just answers "insert a coin first": no if-else on a status field anywhere.`, items: draw(null, ev) });
      said.push(`refused ${ev}`);
      continue;
    }
    const edge = edges.find((e) => e.from === state && e.ev === ev)!;
    const from = state;
    state = next;
    said.push(`${from}->${next}`);
    frames.push({
      caption:
        next === "HasCoin"
          ? `insertCoin() in Idle: the Idle state object handles it and switches the machine to a HasCoin state. The state, not the caller, picks the next state.`
          : next === "Dispensing"
            ? "select() in HasCoin: the item is chosen and the machine moves to Dispensing, where coins are no longer accepted."
            : "dispense() drops the item and returns to Idle, ready for the next customer. Adding a SoldOut state means one new class.",
      items: draw(edge.id, null),
    });
  }
  if (said.join(" ") !== "refused select Idle->HasCoin HasCoin->Dispensing Dispensing->Idle") throw new Error(`vending-state: ${said.join(" ")}`);
  return finish({ title: "State: a vending machine's behaviour follows its state", input: "events: select, insertCoin, select, dispense", frames });
}

/* ── Factory ──────────────────────────────────────────────────────── */

function factoryVehicles(): Walkthrough {
  const KINDS: Record<string, { cls: string; spot: string }> = { car: { cls: "Car", spot: "compact" }, bike: { cls: "Bike", spot: "small" }, truck: { cls: "Truck", spot: "large" } };
  const create = (type: string) => {
    const k = KINDS[type];
    if (!k) throw new Error(`factory-vehicles: unknown type ${type}`);
    return k;
  };
  const client = classBox("client", { name: "EntryGate", methods: ["+ admit(type)"] }, { x: 0, y: 0, w: 130 });
  const factory = classBox("fac", { name: "VehicleFactory", methods: ["+ create(type): Vehicle"] }, { x: 200, y: 0 });
  const vehicle = classBox("veh", { name: "Vehicle", stereotype: "abstract", methods: ["+ spotSize(): Size"] }, { x: factory.x, y: factory.h + 50, w: factory.w });
  const RY = vehicle.y + vehicle.h + 50;
  const W = 112;
  const GX = 16;
  const x0 = vehicle.top.x - (3 * W + 2 * GX) / 2;
  const types = ["car", "bike", "truck"];
  const log: string[] = [];
  const frames: Frame[] = [];
  const draw = (made: number): Item[] => {
    const items: Item[] = [...client.items, ...factory.items, ...vehicle.items];
    items.push(...umlLink("use", { x: client.right.x, y: 34 }, { x: factory.x, y: 34 }, "depends"), ...umlLink("mk", factory.bottom, vehicle.top, "depends"), label("mk-t", "creates", factory.bottom.x + 30, (factory.bottom.y + vehicle.top.y) / 2 + 4, { size: 10.5 }));
    for (let i = 0; i < made; i++) {
      const k = create(types[i]!);
      const b = classBox(`v${i}`, { name: k.cls, methods: ["+ spotSize()"] }, { x: x0 + i * (W + GX), y: RY, w: W, tone: i === made - 1 ? "accent" : undefined });
      items.push(...b.items, ...umlLink(`in${i}`, b.top, { x: vehicle.bottom.x + (i - 1) * 30, y: vehicle.bottom.y }, "inherits", { tone: i === made - 1 ? "accent" : "ink" }));
    }
    log.forEach((l, i) => items.push(label(`log${i}`, l, 0, client.h + 40 + i * 18, { anchor: "start", size: 11, mono: true, tone: i === log.length - 1 ? "accent" : "ink" })));
    return items;
  };
  frames.push({ caption: "The entry gate gets a type name from a sensor or a form and needs a vehicle object. It asks VehicleFactory instead of calling new on a concrete class.", items: draw(0) });
  types.forEach((t, i) => {
    const k = create(t);
    log.push(`create("${t}") → ${k.cls}`);
    frames.push({
      caption:
        i === 0
          ? `create("${t}") returns a ${k.cls}, typed as Vehicle. The gate only ever sees Vehicle and asks it for its spot size: ${k.spot}.`
          : i === 1
            ? `create("${t}") returns a ${k.cls}, which needs a ${k.spot} spot. The choice of class lives in one place, the factory.`
            : `Adding ${k.cls}s (${k.spot} spots) touched only the factory's table. The gate, the lot and the spot-finding code did not change.`,
      items: draw(i + 1),
    });
  });
  return finish({ title: "Factory: one place decides which vehicle class to create", input: "create car, bike, truck", frames });
}

/* ── Decorator ────────────────────────────────────────────────────── */

function decoratorAddons(): Walkthrough {
  // Each layer: what it adds and the label it draws. Built inside out, like new Valet(new EvCharging(new BasicPass())).
  const layers = [
    { id: "base", name: "BasicPass", adds: 60 },
    { id: "ev", name: "EvCharging", adds: 40 },
    { id: "valet", name: "Valet", adds: 50 },
  ];
  const cost = (n: number) => layers.slice(0, n).reduce((s, l) => s + l.adds, 0);
  if (cost(3) !== 150) throw new Error("decorator-addons: total");
  const CX = 180;
  const CY = 110;
  const rect = (i: number) => {
    const w = 170 + i * 90;
    const h = 56 + i * 64;
    return { x: CX - w / 2, y: CY - h / 2, w, h };
  };
  const draw = (n: number, showCost: boolean): Item[] => {
    const items: Item[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const r = rect(i);
      const lit = i === n - 1 && !showCost;
      items.push({ k: "cell", id: layers[i]!.id, x: r.x, y: r.y, w: r.w, h: r.h, text: "", tone: lit ? "accent" : "plain" });
      items.push(label(`${layers[i]!.id}-t`, `${layers[i]!.name}  +${layers[i]!.adds}`, r.x + 10, r.y + 16, { anchor: "start", size: 11.5, mono: true, weight: 700, tone: lit ? "accent" : "ink" }));
    }
    if (showCost) {
      let run = 0;
      layers.forEach((l, i) => {
        run += l.adds;
        items.push(label(`run${i}`, i === 0 ? `cost() = ${run}` : `+ ${l.adds} = ${run}`, CX + rect(2).w / 2 + 14, CY - 30 + i * 30, { anchor: "start", size: 11.5, mono: true, tone: i === 2 ? "accent" : "ink", weight: i === 2 ? 700 : undefined }));
      });
    }
    return items;
  };
  return finish({
    title: "Decorator: add-ons wrap a parking pass",
    input: "new Valet(new EvCharging(new BasicPass()))",
    frames: [
      { caption: `A BasicPass costs ${cost(1)}. Customers can add EV charging, valet, or both, and a subclass per combination would explode.`, items: draw(1, false) },
      { caption: `EvCharging wraps the pass: it is also a Pass, holds the inner one, and its cost() is the inner cost plus 40, so ${cost(2)}.`, items: draw(2, false) },
      { caption: `Valet wraps that in turn. The caller still holds one Pass and calls one cost(); it cannot tell how many wrappers there are.`, items: draw(3, false) },
      { caption: `cost() runs from the outside in and the total builds on the way back out: 60, then 100, then ${cost(3)}. Any order or mix of add-ons works.`, items: draw(3, true) },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "strategy-pricing": strategyPricing,
  "observer-displays": observerDisplays,
  "vending-state": vendingState,
  "factory-vehicles": factoryVehicles,
  "decorator-addons": decoratorAddons,
};
