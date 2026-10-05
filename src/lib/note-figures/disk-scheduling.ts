import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";

/**
 * Disk Scheduling Algorithms: the note's figures
 * (content/notes/operating-systems/disk-scheduling.md places each with
 * "@figure <name>").
 *
 * Each figure is the head-movement chart a student draws: cylinders 0–199
 * across the top, one row per stop going down in service order, and the
 * head's path as a line through the stops. The orders are not typed in —
 * `schedule` runs each algorithm on the note's queue (head at 70, moving
 * up) and the chart, the per-move distances down the right and the total
 * all come from that run. Each generator throws when its total disagrees
 * with the note's. SSTF is an animation, one greedy choice per frame; LOOK
 * and C-LOOK share a figure so the one difference shows as the path
 * changing.
 */

const HEAD = 70;
const LAST = 199;
const QUEUE = [120, 35, 180, 10, 95, 160, 50, 130];

type Algo = "FCFS" | "SSTF" | "SCAN" | "C-SCAN" | "LOOK" | "C-LOOK";

/** One stop of the head: a request served, or an edge it travels to without serving anything. */
interface Stop {
  cyl: number;
  served: boolean;
}

/** The SSTF choice at each step, kept for the animation's captions. */
interface Choice {
  from: number;
  to: number;
  /** The pending requests and their distances, nearest first. */
  options: Array<{ cyl: number; d: number }>;
}

function sstfChoices(): Choice[] {
  const left = [...QUEUE];
  let at = HEAD;
  const out: Choice[] = [];
  while (left.length) {
    // Nearest first; a tie goes to the lower cylinder, the note's rule.
    const options = left.map((cyl) => ({ cyl, d: Math.abs(cyl - at) })).sort((a, b) => a.d - b.d || a.cyl - b.cyl);
    const to = options[0].cyl;
    out.push({ from: at, to, options });
    left.splice(left.indexOf(to), 1);
    at = to;
  }
  return out;
}

/** The head's stops under each algorithm, starting at HEAD and moving towards higher cylinders. */
function schedule(algo: Algo): Stop[] {
  const up = QUEUE.filter((c) => c >= HEAD).sort((a, b) => a - b);
  const downNearFirst = QUEUE.filter((c) => c < HEAD).sort((a, b) => b - a);
  const downLowFirst = [...downNearFirst].reverse();
  const s = (cs: number[]) => cs.map((cyl) => ({ cyl, served: true }));
  const edge = (cyl: number) => ({ cyl, served: false });
  const start: Stop = { cyl: HEAD, served: false };
  switch (algo) {
    case "FCFS":
      return [start, ...s(QUEUE)];
    case "SSTF":
      return [start, ...s(sstfChoices().map((c) => c.to))];
    case "SCAN":
      return [start, ...s(up), edge(LAST), ...s(downNearFirst)];
    case "C-SCAN":
      return [start, ...s(up), edge(LAST), edge(0), ...s(downLowFirst)];
    case "LOOK":
      return [start, ...s(up), ...s(downNearFirst)];
    case "C-LOOK":
      return [start, ...s(up), ...s(downLowFirst)];
  }
}

/** A jump that serves nothing on the way: C-SCAN's return from the last cylinder, C-LOOK's from the highest request to the lowest. */
function isReturn(algo: Algo, stops: readonly Stop[], k: number): boolean {
  if (k === 0) return false;
  if (algo === "C-SCAN") return stops[k - 1].cyl === LAST && stops[k].cyl === 0;
  if (algo === "C-LOOK") return stops[k].cyl < stops[k - 1].cyl;
  return false;
}

function totals(algo: Algo, stops: readonly Stop[]): { all: number; noReturn: number } {
  let all = 0;
  let noReturn = 0;
  for (let k = 1; k < stops.length; k++) {
    const d = Math.abs(stops[k].cyl - stops[k - 1].cyl);
    all += d;
    if (!isReturn(algo, stops, k)) noReturn += d;
  }
  return { all, noReturn };
}

/** The note's totals: with the return jump counted, and without it. */
const NOTE_TOTAL: Record<Algo, [number, number]> = {
  FCFS: [790, 790],
  SSTF: [230, 230],
  SCAN: [318, 318],
  "C-SCAN": [378, 179],
  LOOK: [280, 280],
  "C-LOOK": [320, 150],
};

function checked(algo: Algo): { stops: Stop[]; all: number; noReturn: number } {
  const stops = schedule(algo);
  const t = totals(algo, stops);
  const [all, noReturn] = NOTE_TOTAL[algo];
  if (t.all !== all || t.noReturn !== noReturn) throw new Error(`${algo}: ${t.all} (${t.noReturn} without the return), the note says ${all} (${noReturn})`);
  // Every request served exactly once.
  const served = stops.filter((x) => x.served).map((x) => x.cyl).sort((a, b) => a - b);
  if (served.join() !== [...QUEUE].sort((a, b) => a - b).join()) throw new Error(`${algo}: does not serve each request once`);
  return { stops, ...t };
}

/* ── The chart ────────────────────────────────────────────────────── */

const W = 370; // px for cylinders 0..199
const X = (cyl: number) => Math.round((cyl / LAST) * W * 10) / 10;
const ROW = 24;
const TOP = 46;
const Y = (k: number) => TOP + k * ROW;
const MOVED_X = W + 66;

function txt(id: string, x: number, y: number, text: string, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  const it: Item = { k: "text", id, x, y, text, anchor: o.anchor ?? "middle", size: o.size ?? 11 };
  if (o.tone && o.tone !== "ink") it.tone = o.tone;
  if (o.mono === false) it.mono = false;
  if (o.weight) it.weight = o.weight;
  return it;
}

/** The axis: cylinders 0–199 along the top, with a few ticks. */
function axis(): Item[] {
  const items: Item[] = [{ k: "path", id: "ax", pts: [[0, 0], [W, 0]], tone: "ink", width: 1.2 }];
  for (const t of [0, 50, 100, 150, LAST]) {
    items.push({ k: "path", id: `tk${t}`, pts: [[X(t), 0], [X(t), 4]], tone: "ink", width: 1.2 });
    items.push(txt(`tl${t}`, X(t), -10, String(t), { tone: "faint", size: 11 }));
  }
  items.push(txt("axl", W / 2, -26, "cylinder", { tone: "soft", size: 11, mono: false, weight: 600 }));
  items.push(txt("mvh", MOVED_X, -10, "moved", { anchor: "end", tone: "soft", size: 11, mono: false, weight: 600 }));
  items.push(txt("sth", -24, -10, "stop", { anchor: "end", tone: "soft", size: 11, mono: false, weight: 600 }));
  return items;
}

/**
 * The head's path through `stops` (rows 0 .. upto): a dot and its cylinder
 * at each stop, a segment per move — dashed for a return jump that serves
 * nothing — and the distance of each move down the right.
 */
function path(algo: Algo, stops: readonly Stop[], upto = stops.length - 1, o: { current?: number; past?: boolean } = {}): Item[] {
  const items: Item[] = [];
  for (let k = 1; k <= upto; k++) {
    const ret = isReturn(algo, stops, k);
    const e: Item = { k: "edge", id: `e${k}`, x1: X(stops[k - 1].cyl), y1: Y(k - 1), x2: X(stops[k].cyl), y2: Y(k), tone: ret ? "line" : o.past && k !== o.current ? "ink" : "accent" };
    if (ret) e.dashed = true;
    items.push(e);
  }
  for (let k = 0; k <= upto; k++) {
    const st = stops[k];
    const tone: Tone = k === 0 ? "plain" : st.served ? (k === o.current ? "accent" : "strong") : "muted";
    items.push({ k: "node", id: `p${k}`, x: X(st.cyl), y: Y(k), r: k === 0 ? 5 : 4, text: "", tone });
    // The label goes where neither the move in nor the move out runs.
    const sIn = k > 0 ? Math.sign(stops[k - 1].cyl - st.cyl) : 0;
    const sOut = k < upto ? Math.sign(stops[k + 1].cyl - st.cyl) : 0;
    let side: number;
    let dy = 0;
    if (sIn !== 0 && sOut !== 0 && sIn !== sOut) {
      side = sOut;
      dy = -8;
    } else side = -(sIn || sOut) || 1;
    // Keep labels inside the axis span; an edge stop with no request is labelled outside it.
    if (X(st.cyl) + side * 40 > W + 30) side = -1;
    if (X(st.cyl) + side * 40 < -30) side = 1;
    if (!st.served && k > 0) {
      side = st.cyl === LAST ? 1 : -1;
      dy = 0;
    }
    const text = k === 0 ? `${st.cyl} start` : String(st.cyl);
    items.push(txt(`l${k}`, X(st.cyl) + side * 9, Y(k) + dy, text, { anchor: side > 0 ? "start" : "end", tone: st.served || k === 0 ? "ink" : "faint", size: 11, weight: st.served ? 600 : undefined }));
    items.push(txt(`n${k}`, -24, Y(k), String(k), { anchor: "end", tone: "faint", size: 11 }));
    if (k > 0) {
      const d = Math.abs(st.cyl - stops[k - 1].cyl);
      items.push(txt(`m${k}`, MOVED_X, Y(k), `+${d}`, { anchor: "end", tone: isReturn(algo, stops, k) ? "faint" : "ink", size: 11 }));
    }
  }
  return items;
}

function totalLine(id: string, y: number, text: string): Item {
  return txt(id, MOVED_X, y, text, { anchor: "end", size: 12, weight: 700 });
}

/** A still chart of one algorithm's run. */
function still(algo: Algo, title: string, caption: (stops: Stop[], t: { all: number; noReturn: number }) => string): () => Walkthrough {
  return () => {
    const { stops, all, noReturn } = checked(algo);
    const items = [...axis(), ...path(algo, stops)];
    const bottom = Y(stops.length - 1) + 30;
    items.push(totalLine("tot", bottom, all === noReturn ? `total ${all}` : `total ${all} (${noReturn} without the return)`));
    return finish({ title, input: `queue ${QUEUE.join(", ")}; head at ${HEAD}, moving up; cylinders 0–${LAST}`, frames: [{ caption: caption(stops, { all, noReturn }), items }] });
  };
}

const served = (stops: readonly Stop[]) => stops.filter((s) => s.served).map((s) => s.cyl);

/* ── SSTF, one greedy choice at a time ────────────────────────────── */

function sstf(): Walkthrough {
  const { stops, all } = checked("SSTF");
  const choices = sstfChoices();
  const frames: Frame[] = [];
  // The pending requests sit on the axis: plain while waiting, accent when chosen, muted once served.
  const pending = (k: number): Item[] =>
    QUEUE.map((c) => {
      const servedAt = stops.findIndex((s, i) => i > 0 && s.cyl === c);
      const tone: Tone = servedAt === k + 1 ? "strong" : servedAt <= k ? "muted" : "plain";
      return { k: "cell", id: `q${c}`, x: X(c) - 5, y: -5, w: 10, h: 10, text: "", tone } as Item;
    });
  // Each waiting request's cylinder under its square.
  const waiting = (k: number): Item[] =>
    QUEUE.filter((c) => stops.findIndex((s, i) => i > 0 && s.cyl === c) > k).map((c) => {
      // A request within 22 px of a lower one drops its label to a second line.
      const crowded = QUEUE.some((o) => o < c && X(c) - X(o) < 22);
      return txt(`w${c}`, X(c), crowded ? 26 : 14, String(c), { tone: "soft", size: 11 });
    });
  frames.push({
    caption: `The head starts at ${HEAD} with ${QUEUE.length} requests waiting, the squares on the axis. SSTF ignores arrival order and direction: at every step it serves whichever pending request is nearest the head.`,
    items: [...axis(), ...pending(-1), ...waiting(0), ...path("SSTF", stops, 0)],
  });
  choices.forEach((c, k) => {
    const [best, next] = c.options;
    let caption = `From ${c.from} the nearest pending request is ${c.to}, ${best.d} cylinders away`;
    caption += next ? ` (the next nearest, ${next.cyl}, is ${next.d}).` : ", the last one.";
    if (k === 0) caption += " So the head turns down, away from the requests clustered above it.";
    if (k > 0 && Math.sign(c.to - c.from) !== Math.sign(choices[k - 1].to - choices[k - 1].from)) caption += ` Nothing is left below, so the head crosses back over ${HEAD} and works upwards.`;
    const last = k === choices.length - 1;
    const items = [...axis(), ...pending(k), ...waiting(k + 1), ...path("SSTF", stops, k + 1, { current: k + 1, past: !last })];
    if (last) {
      items.push(totalLine("tot", Y(stops.length - 1) + 30, `total ${all}`));
      caption += ` Every request is served after ${all} cylinders of movement.`;
    }
    frames.push({ caption, items });
  });
  return finish({ title: "SSTF: always the nearest pending request", input: `queue ${QUEUE.join(", ")}; head at ${HEAD}; cylinders 0–${LAST}`, frames });
}

/* ── LOOK and C-LOOK ──────────────────────────────────────────────── */

function look(): Walkthrough {
  const a = checked("LOOK");
  const b = checked("C-LOOK");
  const top = Math.max(...served(a.stops));
  const low = Math.min(...served(b.stops));
  return finish({
    title: "LOOK and C-LOOK turn at the last request, not the edge",
    input: `queue ${QUEUE.join(", ")}; head at ${HEAD}, moving up; cylinders 0–${LAST}`,
    frames: [
      {
        caption: `LOOK sweeps up to ${top}, the highest request, and reverses there instead of going on to ${LAST}, then serves ${served(a.stops).filter((c) => c < HEAD).join(", ")} on the way down: ${a.all} cylinders.`,
        items: [...axis(), ...path("LOOK", a.stops), totalLine("tot", Y(a.stops.length - 1) + 30, `total ${a.all}`)],
      },
      {
        caption: `C-LOOK serves only on the way up. From ${top} it jumps straight to ${low}, the lowest pending request (dashed, serving nothing), and sweeps up again: ${b.all} cylinders counting the jump, ${b.noReturn} without it.`,
        items: [...axis(), ...path("C-LOOK", b.stops), totalLine("tot", Y(b.stops.length - 1) + 30, `total ${b.all} (${b.noReturn} without the jump)`)],
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  fcfs: still("FCFS", "FCFS: requests in arrival order", (stops, t) => `FCFS serves the queue exactly as it arrived, ${served(stops).join(", ")}, so the head swings from one side of the disk to the other: ${t.all} cylinders in all, the worst of the six.`),
  sstf,
  scan: still("SCAN", "SCAN: sweep to the end of the disk, then reverse", (stops, t) => `SCAN serves ${served(stops).filter((c) => c >= HEAD).join(", ")} on the way up, carries on to cylinder ${LAST} although nothing waits there, then reverses and serves ${served(stops).filter((c) => c < HEAD).join(", ")}: ${t.all} cylinders.`),
  "c-scan": still("C-SCAN", "C-SCAN: serve one way, then return to cylinder 0", (stops, t) => `C-SCAN sweeps up to ${LAST}, returns to 0 without serving anything (dashed), and serves ${served(stops).filter((c) => c < HEAD).join(", ")} on the next upward sweep: ${t.all} cylinders counting the return, ${t.noReturn} without it.`),
  look,
};
