import { finish, type Frame, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * The elevator lesson's figure (scripts/study-plans/lld/05-elevator):
 *
 *  - look-steps: the first exercise's visible case run tick by tick. The
 *    model below is that exercise's Elevator (CALL / STEP, LOOK settling the
 *    direction after every tick), and the lines it prints are checked
 *    against the case's expected output, so the figure cannot drift from the
 *    program the learner writes. One frame per STEP; the calls that arrive
 *    between ticks appear as they land.
 */

type Dir = "UP" | "DOWN" | "IDLE";

class Car {
  dir: Dir = "IDLE";
  readonly stops = new Set<number>();
  constructor(
    readonly top: number,
    public floor: number,
  ) {}

  private ahead(d: Dir): boolean {
    const s = [...this.stops];
    return d === "UP" ? s.some((f) => f > this.floor) : d === "DOWN" ? s.some((f) => f < this.floor) : false;
  }

  call(f: number): string | null {
    if (f < 0 || f > this.top) return `invalid floor ${f}`;
    this.stops.add(f);
    if (this.dir === "IDLE" && f !== this.floor) this.dir = f > this.floor ? "UP" : "DOWN";
    return null;
  }

  step(): string {
    if (!this.stops.size) return `idle at ${this.floor}`;
    let line: string;
    if (this.stops.delete(this.floor)) line = `stop at ${this.floor}`;
    else {
      this.floor += this.dir === "UP" ? 1 : -1;
      line = `${this.dir} to ${this.floor}`;
      if (this.stops.delete(this.floor)) line += ": stop";
    }
    if (!this.stops.size) this.dir = "IDLE";
    else if (this.dir === "IDLE" || !this.ahead(this.dir)) this.dir = this.ahead("UP") ? "UP" : "DOWN";
    return line;
  }

  sorted(): number[] {
    return [...this.stops].sort((a, b) => a - b);
  }
}

const TOP = 6;
const START = 2;
/** The exercise's visible case without its STATUS lines (they print state the figure draws). */
const SCRIPT = ["CALL 5", "CALL 0", "STEP", "CALL 4", "STEP", "CALL 3", "STEP", "STEP", "STEP", "STEP", "STEP", "STEP"];
const PRINTED = ["UP to 3", "UP to 4: stop", "UP to 5: stop", "DOWN to 4", "DOWN to 3: stop", "DOWN to 2", "DOWN to 1", "DOWN to 0: stop"];

interface Tick {
  /** Calls that landed after this tick, before the next one (drawn in this frame). */
  calls: number[];
  /** What the tick printed; null for the opening frame (the calls before the first STEP). */
  line: string | null;
  floor: number;
  dir: Dir;
  stops: number[];
}

function run(): Tick[] {
  const car = new Car(TOP, START);
  const ticks: Tick[] = [{ calls: [], line: null, floor: car.floor, dir: car.dir, stops: [] }];
  const printed: string[] = [];
  for (const cmd of SCRIPT) {
    const [op, arg] = cmd.split(" ");
    if (op === "CALL") {
      const said = car.call(Number(arg));
      if (said) printed.push(said);
      ticks[ticks.length - 1]!.calls.push(Number(arg));
    } else {
      const line = car.step();
      printed.push(line);
      ticks.push({ calls: [], line, floor: car.floor, dir: car.dir, stops: [] });
    }
    // The frame shows the state after everything that happened up to the next tick.
    const t = ticks[ticks.length - 1]!;
    t.dir = car.dir;
    t.stops = car.sorted();
  }
  if (printed.join("\n") !== PRINTED.join("\n")) throw new Error(`elevator-design look-steps: the model printed ${JSON.stringify(printed)}`);
  return ticks;
}

const FH = 30;
const fy = (f: number) => (TOP - f) * FH;
const SX = 34;
const SW = 58;
const LOG_X = 150;

function lookSteps(): Walkthrough {
  const ticks = run();
  const frames: Frame[] = [];
  const captions = [
    `The car is idle at floor ${START}. CALL 5 gives it a direction, up, at once; CALL 0 is a second stop, below it.`,
    "STEP: a stop lies ahead at 5, so the car moves up one floor. Meanwhile CALL 4 comes in, ahead of the car, and joins this sweep.",
    "STEP: the car moves to 4, which is a stop, so it is served in the same tick. CALL 3 arrives now, behind the car: it must wait.",
    "STEP: up to 5, the last stop above. Nothing lies ahead any more, so LOOK turns the car down as it stops, instead of riding on to the top.",
    "STEP: down to 4. It was served on the way up, so the car passes it; the stops ahead are 3 and 0.",
    "STEP: down to 3, the call that came in behind the car. It waited exactly one sweep.",
    "STEP: down to 2, no one asked for it, so the car keeps moving.",
    "STEP: down to 1, the last floor before the remaining stop.",
    "STEP: down to 0, the last stop. With no stops left the car goes idle; every call was served within two sweeps.",
  ];
  if (captions.length !== ticks.length) throw new Error(`elevator-design look-steps: ${ticks.length} ticks, ${captions.length} captions`);
  const log: string[] = [];
  ticks.forEach((t, i) => {
    if (t.line) log.push(t.line);
    const items: Item[] = [];
    for (let f = 0; f <= TOP; f++) items.push(label(`fl${f}`, String(f), SX - 10, fy(f) + FH / 2, { anchor: "end", tone: "faint", size: 11, mono: true }));
    items.push({ k: "band", id: "shaft", x: SX, y: 0, w: SW, h: (TOP + 1) * FH, tone: "ghost" });
    for (const s of [0, 3, 4, 5]) {
      const waiting = t.stops.includes(s);
      const fresh = t.calls.includes(s) && waiting;
      items.push({ k: "node", id: `st${s}`, x: SX + SW + 14, y: fy(s) + FH / 2, r: 6, text: "", tone: waiting ? (fresh ? "strong" : "accent") : "muted" });
    }
    const stopped = t.line ? /stop/.test(t.line) : false;
    const glyph = t.dir === "UP" ? "▲" : t.dir === "DOWN" ? "▼" : "idle";
    items.push(box("car", SX + 4, fy(t.floor) + 3, stopped ? "doors" : glyph, { w: SW - 8, h: FH - 6, tone: stopped ? "accent" : "strong", size: 11 }));
    items.push(label("st-h", "state", LOG_X, 8, { anchor: "start", tone: "soft", size: 11 }));
    items.push(label("st", `at ${t.floor} ${t.dir} · stops ${t.stops.length ? t.stops.join(" ") : "none"}`, LOG_X, 28, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 700 }));
    items.push(label("log-h", "printed", LOG_X, 62, { anchor: "start", tone: "soft", size: 11 }));
    log.forEach((l, j) =>
      items.push(label(`log${j}`, l, LOG_X, 82 + j * 17, { anchor: "start", tone: j === log.length - 1 && i > 0 ? "accent" : "ink", size: 11.5, mono: true, weight: j === log.length - 1 ? 600 : 400 })),
    );
    if (t.calls.length) items.push(label("arrive", `new: ${t.calls.map((c) => `CALL ${c}`).join(", ")}`, LOG_X, 45, { anchor: "start", tone: "accent", size: 11, mono: true }));
    frames.push({ caption: captions[i]!, items });
  });
  return finish({ title: "LOOK, one STEP at a time: up for 4 and 5, then down for 3 and 0", input: "6 2 · CALL 5 · CALL 0 · STEP · CALL 4 · STEP · CALL 3 · STEP …", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "look-steps": lookSteps,
};
