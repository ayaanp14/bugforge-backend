import { finish, type Frame, type Item, type TextTone, type Tone } from "../../walkthroughs/core.js";
import type { Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";
import { classBox, umlLink, type ClassSpec } from "../../note-figures/kit.js";

/**
 * Parking lot (scripts/study-plans/lld/03-parking-lot):
 *
 *  - parking-classes: the lot, its levels and spots, the vehicle a spot
 *    holds, and the SpotStrategy the lot asks — one step a frame;
 *  - best-fit: the first exercise's visible case run through the same
 *    best-fit rule the reference solution implements (lowest level, then the
 *    smallest free spot that fits, then the first listed) — the printed
 *    lines are checked against the case's expected output.
 */

/* ── Classes ──────────────────────────────────────────────────────── */

const SIZE = 10;
const LOT: ClassSpec = { name: "ParkingLot", fields: ["- levels: List<Level>", "- strategy: SpotStrategy", "- pricing: PricingStrategy"], methods: ["+ park(v, hour): Ticket", "+ leave(plate, hour): Receipt"] };
const LEVEL: ClassSpec = { name: "Level", fields: ["- number: int", "- spots: List<Spot>"], methods: ["+ free(): int"] };
const SPOT: ClassSpec = { name: "Spot", fields: ["- id: String", "- size: Size", "- vehicle: Vehicle"], methods: ["+ fits(v): boolean"] };
const VEHICLE: ClassSpec = { name: "Vehicle", fields: ["- plate: String", "- type: VehicleType"] };
const STRATEGY: ClassSpec = { name: "SpotStrategy", stereotype: "interface", methods: ["+ find(levels, v): Spot"] };
const BEST_FIT: ClassSpec = { name: "BestFit", methods: ["+ find(levels, v): Spot"] };

function parkingClasses(): Walkthrough {
  const probe = (s: ClassSpec) => classBox("p", s, { size: SIZE });
  const lotW = probe(LOT).w;
  const X2 = lotW + 90;
  const ROW_GAP = 40;
  const y2 = probe(LOT).h + ROW_GAP;
  const y3 = y2 + probe(LEVEL).h + ROW_GAP;
  const mult = (id: string, text: string, x: number, y: number) => label(id, text, x, y, { size: 10.5, mono: true, anchor: "start" });

  const draw = (n: number): Item[] => {
    const tone = (k: number): Tone => (n === k ? "accent" : "plain");
    const line = (k: number) => (n === k ? "accent" : "ink");
    const fitsLit = n === 2 ? (l: string): TextTone | undefined => (/fits|size|type/.test(l) ? "accent" : undefined) : undefined;
    const lot = classBox("lot", LOT, { size: SIZE, tone: tone(0), lineTone: n === 3 ? (l) => (/strategy/.test(l) ? "accent" : undefined) : undefined });
    const items: Item[] = [...lot.items];
    if (n >= 1) {
      const level = classBox("level", LEVEL, { y: y2, size: SIZE, tone: tone(1) });
      const spot = classBox("spot", SPOT, { y: y3, size: SIZE, tone: tone(1), lineTone: fitsLit });
      items.push(
        ...level.items,
        ...spot.items,
        ...umlLink("ll", { x: 50, y: lot.h }, { x: 50, y: y2 }, "composes", { tone: line(1) }),
        mult("ll-n", "1..*", 58, y2 - 9),
        ...umlLink("ls", { x: 50, y: y2 + level.h }, { x: 50, y: y3 }, "composes", { tone: line(1) }),
        mult("ls-n", "1..*", 58, y3 - 9),
      );
      if (n >= 2) {
        const vehicle = classBox("vehicle", VEHICLE, { x: X2, y: y3 + 16, size: SIZE, tone: tone(2), lineTone: fitsLit });
        const y = y3 + 40;
        items.push(...vehicle.items, ...umlLink("sv", { x: spot.w, y }, { x: X2, y }, "associates", { tone: line(2) }), mult("sv-n", "0..1", X2 - 34, y - 9));
      }
      if (n >= 3) {
        const strategy = classBox("strat", STRATEGY, { x: X2, y: 10, size: SIZE, tone: "accent" });
        const fit = classBox("bestfit", BEST_FIT, { x: X2, y: y2 + 10, w: strategy.w, size: SIZE, tone: "accent" });
        items.push(
          ...strategy.items,
          ...fit.items,
          ...umlLink("lst", { x: lotW, y: 45 }, { x: X2, y: 45 }, "associates", { tone: "accent" }),
          ...umlLink("impl", fit.top, strategy.bottom, "implements", { tone: "accent" }),
        );
      }
    }
    return items;
  };

  const frames: Frame[] = [
    { caption: "ParkingLot is what the gates call: park issues a ticket, leave returns a receipt. It holds the levels and two strategies, and decides neither the spot nor the fee itself.", items: draw(0) },
    { caption: "The lot owns its levels and each level owns its spots — composition both times. A level keeps its spots in a List, in the order they were given.", items: draw(1) },
    { caption: "A spot holds at most one vehicle. Its Size and the vehicle type's need are both ordered S, M, L, so fits is a single comparison: free, and size at least the need.", items: draw(2) },
    { caption: "Which spot is the strategy's business. The lot calls SpotStrategy.find; BestFit is one implementation, and a nearest-to-the-lift rule would be another class.", items: draw(3) },
  ];
  return finish({ title: "Parking lot classes: composition below, a strategy beside", input: "", frames });
}

/* ── Best fit, run ────────────────────────────────────────────────── */

type Size = "S" | "M" | "L";
const RANK: Record<Size, number> = { S: 0, M: 1, L: 2 };
const NEEDS: Record<string, Size> = { BIKE: "S", CAR: "M", TRUCK: "L" };
const LEVELS = [
  ["S1", "M1", "L1"],
  ["M1", "M2"],
];
type Cmd = { op: "PARK"; plate: string; type: string } | { op: "LEAVE"; plate: string };
const SCRIPT: Cmd[] = [
  { op: "PARK", plate: "KA01", type: "CAR" },
  { op: "PARK", plate: "KA02", type: "BIKE" },
  { op: "PARK", plate: "KA03", type: "TRUCK" },
  { op: "PARK", plate: "KA04", type: "CAR" },
  { op: "LEAVE", plate: "KA01" },
  { op: "PARK", plate: "KA05", type: "CAR" },
];
/** The first exercise's visible case prints these for the six commands. */
const PRINTED = ["KA01 parked at level 1 spot M1", "KA02 parked at level 1 spot S1", "KA03 parked at level 1 spot L1", "KA04 parked at level 2 spot M1", "KA01 left level 1 spot M1", "KA05 parked at level 1 spot M1"];

type Spot = { level: number; id: string; size: Size; plate: string | null };

function bestFit(levels: Spot[][], need: Size): Spot | null {
  for (const level of levels) {
    let best: Spot | null = null;
    for (const s of level) if (s.plate === null && RANK[s.size] >= RANK[need] && (!best || RANK[s.size] < RANK[best.size])) best = s;
    if (best) return best;
  }
  return null;
}

function bestFitRun(): Walkthrough {
  const levels: Spot[][] = LEVELS.map((ids, i) => ids.map((id) => ({ level: i + 1, id, size: id[0] as Size, plate: null })));
  const W = 64;
  const H = 40;
  const GX = 12;
  const RY = 64;
  const X0 = 70;

  const draw = (hot: Spot | null, hotTone: Tone, cmd: string | null, line: string | null): Item[] => {
    const items: Item[] = [];
    levels.forEach((level, li) => {
      const y = li * RY;
      items.push(label(`lv${li}`, `level ${li + 1}`, X0 - 12, y + H / 2 + 4, { anchor: "end", weight: 600 }));
      level.forEach((s, si) => {
        const x = X0 + si * (W + GX);
        const tone: Tone = s === hot ? hotTone : s.plate ? "strong" : "plain";
        items.push(box(`s${li}-${s.id}`, x, y, s.plate ?? s.id, { w: W, h: H, tone, size: 12 }));
        items.push(label(`z${li}-${s.id}`, s.plate ? `${s.id} · ${s.size}` : `size ${s.size}`, x + W / 2, y + H + 11, { size: 10 }));
      });
    });
    const y = levels.length * RY + 14;
    items.push({ k: "text", id: "cmd", x: 0, y, text: cmd ?? "spot ids start with their size: S < M < L", tone: "soft", anchor: "start", size: 12, mono: true });
    if (line) items.push({ k: "text", id: "out", x: 0, y: y + 22, text: `→ ${line}`, tone: "accent", anchor: "start", size: 12, mono: true, weight: 600 });
    return items;
  };

  const frames: Frame[] = [{ caption: "Two levels, all spots free. A bike fits any spot, a car a medium or large one, a truck only a large one; best fit tries level 1 before level 2.", items: draw(null, "plain", null, null) }];
  const printed: string[] = [];
  for (const c of SCRIPT) {
    if (c.op === "LEAVE") {
      const s = levels.flat().find((x) => x.plate === c.plate)!;
      s.plate = null;
      const line = `${c.plate} left level ${s.level} spot ${s.id}`;
      printed.push(line);
      frames.push({ caption: `${c.plate} leaves and level ${s.level} spot ${s.id} is free again. Nothing else moves: parked vehicles keep their spots.`, items: draw(s, "accent", `LEAVE ${c.plate}`, line) });
      continue;
    }
    const need = NEEDS[c.type]!;
    const spot = bestFit(levels, need)!;
    const fitting = levels[spot.level - 1]!.filter((s) => s.plate === null && RANK[s.size] >= RANK[need]).map((s) => s.id);
    const skipped = levels.slice(0, spot.level - 1).length;
    spot.plate = c.plate;
    const line = `${c.plate} parked at level ${spot.level} spot ${spot.id}`;
    printed.push(line);
    const why =
      skipped > 0
        ? `level 1 has no free spot that fits a ${c.type.toLowerCase()}, so best fit moves to level ${spot.level} and takes ${spot.id}`
        : fitting.length > 1
          ? `on level 1, ${fitting.join(" and ")} fit a ${c.type.toLowerCase()}; best fit takes the smallest, ${spot.id}, keeping bigger spots for bigger vehicles`
          : `on level 1 only ${spot.id} fits a ${c.type.toLowerCase()}, so that is the spot`;
    frames.push({ caption: `${c.plate}, a ${c.type.toLowerCase()} needing size ${need}: ${why}.`, items: draw(spot, "accent", `PARK ${c.plate} ${c.type}`, line) });
  }
  if (printed.join("\n") !== PRINTED.join("\n")) throw new Error(`best-fit: the model printed ${JSON.stringify(printed)}`);
  return finish({ title: "Best fit: lowest level first, then the smallest spot that fits", input: "level 1: S1 M1 L1 · level 2: M1 M2", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "parking-classes": parkingClasses,
  "best-fit": bestFitRun,
};
