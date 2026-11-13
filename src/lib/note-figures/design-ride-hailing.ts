import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, grid, label } from "../lesson-figures/kit.js";
import { along, packet, service, wire } from "./sd-kit.js";

/**
 * Design a Ride-Hailing App: the case study's figures (content/notes/
 * system-design/design-ride-hailing.md). Every figure loops (a points
 * subject), and every value it draws is computed here:
 *
 *  - geohash: one driver's position encoded by bisection — longitude, then
 *    latitude, then longitude again — four bits, then every cell of the
 *    resulting 4 × 4 grid labelled with the same encoder.
 *  - nearby: eight drivers on a 6 × 6 grid of cells; one location tick moves
 *    them (the cells that change are recomputed), then a rider's cell and its
 *    eight neighbours are searched and the candidates ranked by distance.
 *  - dispatch: that ranked list offered one driver at a time, each offer
 *    locking the driver; a timeout and a decline move on to the next.
 *  - trip-states: the trip's state machine run over a sequence of events
 *    from a transition table — the two events that do not apply are refused.
 */

/* ── Geohash by bisection ─────────────────────────────────────────── */

/** Interleaved bisection bits, longitude first (as geohash does), for a point in the unit square. */
function encode(lon: number, lat: number, bits: number): string {
  let lo = [0, 0];
  let hi = [1, 1];
  let out = "";
  for (let b = 0; b < bits; b++) {
    const axis = b % 2 === 0 ? 0 : 1;
    const v = axis === 0 ? lon : lat;
    const mid = (lo[axis] + hi[axis]) / 2;
    if (v >= mid) {
      out += "1";
      lo = axis === 0 ? [mid, lo[1]] : [lo[0], mid];
    } else {
      out += "0";
      hi = axis === 0 ? [mid, hi[1]] : [hi[0], mid];
    }
  }
  return out;
}

function geohash(): Walkthrough {
  const S = 256;
  const X0 = 0;
  const Y0 = 24;
  const D = { lon: 0.62, lat: 0.3 };
  const px = (lon: number) => X0 + lon * S;
  const py = (lat: number) => Y0 + (1 - lat) * S;
  const code = encode(D.lon, D.lat, 4);
  // Replay the bisection to get the box kept after each bit.
  const boxes: Array<{ lo: [number, number]; hi: [number, number]; axis: number; mid: number }> = [];
  let lo: [number, number] = [0, 0];
  let hi: [number, number] = [1, 1];
  for (let b = 0; b < 4; b++) {
    const axis = b % 2;
    const mid = (lo[axis] + hi[axis]) / 2;
    if (code[b] === "1") lo = axis === 0 ? [mid, lo[1]] : [lo[0], mid];
    else hi = axis === 0 ? [mid, hi[1]] : [hi[0], mid];
    boxes.push({ lo: [...lo], hi: [...hi], axis, mid });
  }
  const CX = 290;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string, all = false) => {
    const items: Item[] = [label("t", "city area (longitude →, latitude ↑)", 0, 8, { anchor: "start", tone: "soft", size: 11, weight: 600 })];
    if (k > 0 && !all) {
      const b = boxes[k - 1];
      items.push({ k: "band", id: "keep", x: px(b.lo[0]), y: py(b.hi[1]), w: (b.hi[0] - b.lo[0]) * S, h: (b.hi[1] - b.lo[1]) * S, tone: "accent" });
    }
    items.push({ k: "band", id: "area", x: X0, y: Y0, w: S, h: S, tone: "ghost" });
    items.push({ k: "path", id: "frame", pts: [[X0, Y0], [X0 + S, Y0], [X0 + S, Y0 + S], [X0, Y0 + S]], closed: true, tone: "ink", width: 1.2 });
    // Split lines drawn so far: each bit halves the box it was taken from.
    let blo: [number, number] = [0, 0];
    let bhi: [number, number] = [1, 1];
    for (let b = 0; b < (all ? 0 : k); b++) {
      const s = boxes[b];
      const pts: Array<[number, number]> = s.axis === 0 ? [[px(s.mid), py(bhi[1])], [px(s.mid), py(blo[1])]] : [[px(blo[0]), py(s.mid)], [px(bhi[0]), py(s.mid)]];
      items.push({ k: "path", id: `split${b}`, pts, tone: b === k - 1 ? "accent" : "line", width: 1.4, dashed: b !== k - 1 });
      blo = s.lo;
      bhi = s.hi;
    }
    if (all) {
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        const lon = (c + 0.5) / 4;
        const lat = 1 - (r + 0.5) / 4;
        const cc = encode(lon, lat, 4);
        const mine = cc === code;
        if (mine) items.push({ k: "band", id: "mine", x: px(c / 4), y: py(1 - r / 4), w: S / 4, h: S / 4, tone: "strong" });
        items.push(label(`cell${c}-${r}`, cc, px(lon), py(lat) - 14, { tone: mine ? "ink" : "faint", size: 11, mono: true }));
      }
      for (let i = 1; i < 4; i++) {
        items.push({ k: "path", id: `gv${i}`, pts: [[px(i / 4), Y0], [px(i / 4), Y0 + S]], tone: "faint", width: 1 });
        items.push({ k: "path", id: `gh${i}`, pts: [[X0, Y0 + (i * S) / 4], [X0 + S, Y0 + (i * S) / 4]], tone: "faint", width: 1 });
      }
    }
    items.push(packet("drv", { x: px(D.lon), y: py(D.lat) }, { text: "D", tone: "accent" }));
    items.push(label("ch", "driver's code", CX, 40, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    for (let b = 0; b < 4; b++) {
      const has = all || b < k;
      items.push(box(`bit${b}`, CX + b * 32, 52, has ? code[b] : "", { w: 28, h: 28, size: 13, tone: !has ? "ghost" : all ? "strong" : b === k - 1 ? "accent" : "plain" }));
      items.push(label(`ax${b}`, b % 2 === 0 ? "lon" : "lat", CX + b * 32 + 14, 94, { tone: "faint", size: 10 }));
    }
    frames.push({ caption, items });
  };
  draw(0, "A geohash turns a position into a short code by halving the map again and again. Each halving writes one bit: 1 for the east or north half, 0 for the west or south.");
  boxes.forEach((b, i) => {
    const axis = b.axis === 0 ? "longitude" : "latitude";
    const side = code[i] === "1" ? (b.axis === 0 ? "east" : "north") : b.axis === 0 ? "west" : "south";
    draw(i + 1, `Bit ${i + 1} splits by ${axis}: the driver is in the ${side} half, so the bit is ${code[i]}. The code so far is ${code.slice(0, i + 1)}, and the box keeps only that half.`);
  });
  draw(5, `Four bits name one of 16 cells; the driver's is ${code}. Cells sharing a prefix are near each other, but 1001 and its neighbour 0011 share none, so searches also read adjacent cells. Real geohash writes every 5 bits as a base-32 character: 6 characters is about 1.2 km by 0.6 km.`, true);
  return finish({ title: "Geohash: halve the map, one bit per halving", input: "", frames });
}

/* ── Nearby drivers ───────────────────────────────────────────────── */

const N = 6;
const CELL_M = 500; // assumed cell side in metres, to turn grid distances into a readable figure
const DRIVERS = [
  { id: 1, x: 0.5, y: 0.6, vx: 0.2, vy: 0 },
  { id: 2, x: 3.3, y: 2.5, vx: 0, vy: 0 },
  { id: 3, x: 1.6, y: 3.8, vx: 0.6, vy: 0 },
  { id: 4, x: 4.7, y: 4.4, vx: 0, vy: -0.2 },
  { id: 5, x: 2.7, y: 4.6, vx: 0, vy: 0 },
  { id: 6, x: 5.4, y: 1.2, vx: 0, vy: 0.3 },
  { id: 7, x: 3.6, y: 5.3, vx: -0.1, vy: 0 },
  { id: 8, x: 0.4, y: 5.5, vx: 0, vy: 0 },
];
const RIDER = { x: 2.6, y: 3.4 };
const cellOf = (p: { x: number; y: number }) => ({ c: Math.floor(p.x), r: Math.floor(p.y) });

/** One location tick, then the search: rider's cell + 8 neighbours, candidates ranked by straight-line distance. */
function search() {
  const before = DRIVERS.map((d) => ({ ...d }));
  const after = DRIVERS.map((d) => ({ ...d, x: Math.round((d.x + d.vx) * 100) / 100, y: Math.round((d.y + d.vy) * 100) / 100 }));
  const moved = after.filter((d, i) => {
    const a = cellOf(before[i]);
    const b = cellOf(d);
    return a.c !== b.c || a.r !== b.r;
  });
  const rc = cellOf(RIDER);
  const inBlock = (p: { x: number; y: number }) => {
    const c = cellOf(p);
    return Math.abs(c.c - rc.c) <= 1 && Math.abs(c.r - rc.r) <= 1;
  };
  const ranked = after
    .filter(inBlock)
    .map((d) => ({ id: d.id, m: Math.round(Math.hypot(d.x - RIDER.x, d.y - RIDER.y) * CELL_M) }))
    .sort((a, b) => a.m - b.m);
  // The search is only correct if no driver outside the block is nearer than the best inside it.
  const outside = after.filter((d) => !inBlock(d)).map((d) => Math.hypot(d.x - RIDER.x, d.y - RIDER.y) * CELL_M);
  if (ranked.length < 3 || Math.min(...outside) < ranked[0].m) throw new Error("nearby: the example's block search should find the true nearest driver");
  return { before, after, moved, rc, inBlock, ranked };
}

function nearby(): Walkthrough {
  const { before, after, moved, rc, inBlock, ranked } = search();
  if (moved.length === 0) throw new Error("nearby: the tick should move a driver into another cell");
  const W = 42;
  const GAPC = 2;
  const opt = { w: W, h: W, gap: GAPC };
  const at = (p: { x: number; y: number }) => ({ x: p.x * (W + GAPC), y: p.y * (W + GAPC) });
  const LX = N * (W + GAPC) + 24;
  const rows = Array.from({ length: N }, () => Array.from({ length: N }, () => ""));
  const frames: Frame[] = [];
  const draw = (stage: number, caption: string) => {
    const ds = stage === 0 ? before : after;
    const block = (r: number, c: number) => Math.abs(c - rc.c) <= 1 && Math.abs(r - rc.r) <= 1;
    const items: Item[] = grid("g", rows, {
      ...opt,
      tone: (r, c) => {
        if (stage >= 2 && r === rc.r && c === rc.c) return "accent";
        if (stage >= 3 && block(r, c)) return "plain";
        if (stage === 1 && moved.some((d) => cellOf(d).r === r && cellOf(d).c === c)) return "accent";
        return stage >= 3 ? "ghost" : "plain";
      },
    });
    ds.forEach((d) => {
      const cand = stage >= 3 && inBlock(d);
      const best = stage >= 5 && d.id === ranked[0].id;
      const tone: Tone = best ? "strong" : cand ? "accent" : stage >= 3 ? "muted" : stage === 1 && moved.some((m) => m.id === d.id) ? "accent" : "plain";
      items.push(packet(`d${d.id}`, at(d), { text: d.id, tone, r: 9 }));
    });
    if (stage >= 2) items.push(box("rider", at(RIDER).x - 9, at(RIDER).y - 9, "R", { w: 18, h: 18, size: 10, tone: "plain" }));
    items.push(label("lh", stage >= 4 ? "candidates by distance" : "location store", LX, 8, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    if (stage >= 4) {
      ranked.forEach((c, i) => {
        items.push(box(`rk${c.id}`, LX, 20 + i * 32, `driver ${c.id} · ${c.m} m`, { w: 130, h: 26, size: 10, tone: stage >= 5 && i === 0 ? "strong" : "plain" }));
      });
    } else {
      items.push(label("l1", "driver → latest cell", LX, 30, { anchor: "start", tone: "faint", size: 10 }));
      items.push(label("l2", stage === 0 ? "update every ~4 s" : `${moved.length} driver${moved.length > 1 ? "s" : ""} changed cell`, LX, 48, { anchor: "start", tone: stage === 1 ? "accent" : "faint", size: 10 }));
    }
    frames.push({ caption, items });
  };
  const m = moved.map((d) => {
    const a = cellOf(before[DRIVERS.findIndex((x) => x.id === d.id)]);
    const b = cellOf(d);
    return `driver ${d.id} from cell (${a.c},${a.r}) to (${b.c},${b.r})`;
  });
  draw(0, `Each cell is about ${CELL_M} m across (an assumption). Every driver's app sends its position every few seconds, and the location store keeps only the latest one, indexed by cell.`);
  draw(1, `One tick later the drivers have moved. Only ${m.join(" and ")} changed cell, so the index moves just that entry; the rest overwrite their position in place.`);
  draw(2, `A rider requests a car. The server computes the rider's cell, (${rc.c},${rc.r}), the same way it computes every driver's — no scan of all drivers.`);
  draw(3, `It reads the rider's cell and its eight neighbours, because a driver just across a cell border can be closer than one inside. ${ranked.length} drivers are in those nine cells.`);
  draw(4, `Only those candidates get an exact distance: ${ranked.map((c) => `${c.id} at ${c.m} m`).join(", ")}. Real systems rank by road ETA, not straight-line distance.`);
  draw(5, `Driver ${ranked[0].id} ranks first. Had the nine cells held too few drivers, the search would widen to the next ring of cells and try again.`);
  return finish({ title: "Nearby drivers: search the rider's cell and its neighbours", input: "", frames });
}

/* ── Dispatch ─────────────────────────────────────────────────────── */

function dispatch(): Walkthrough {
  const { ranked } = search();
  const answers = ["timeout", "decline", "accept"] as const;
  if (ranked.length < answers.length) throw new Error("dispatch: not enough candidates");
  const cands = ranked.slice(0, answers.length);
  const matcher = service("match", 0, 66, "Matching", { w: 96 });
  const rider = service("rider", 0, 166, "Rider", { w: 96 });
  const DX = 260;
  const frames: Frame[] = [];
  // Run the offers: one driver at a time, each locked while it holds the offer.
  type St = "waiting" | "offered" | "timed out" | "declined" | "accepted";
  const status: St[] = cands.map(() => "waiting");
  const draw = (cur: number | null, phase: "offer" | "reply" | null, caption: string) => {
    const items: Item[] = [...matcher.items];
    cands.forEach((c, i) => {
      const st = status[i];
      const tone: Tone = st === "accepted" ? "strong" : st === "offered" ? "accent" : st === "waiting" ? "plain" : "muted";
      const d = service(`dr${i}`, DX, i * 66, `Driver ${c.id}`, { w: 104, tone, sub: `${c.m} m · ${st}${st === "offered" ? " (locked)" : ""}`, subTone: st === "offered" || st === "accepted" ? "accent" : "soft" });
      items.push(...d.items);
      const live = cur === i;
      items.push(wire(`w${i}`, matcher.right, d.left, { tone: live ? (st === "accepted" ? "accent" : st === "offered" ? "accent" : "faint") : "line", dashed: live && (st === "timed out" || st === "declined") }));
      if (live && phase === "offer") items.push(packet("offer", along(matcher.right, d.left, 0.62), { text: "?", tone: "accent" }));
      if (live && phase === "reply") items.push(packet("offer", along(d.left, matcher.right, 0.38), { text: st === "accepted" ? "✓" : "✗", tone: st === "accepted" ? "strong" : "muted" }));
    });
    const done = status.includes("accepted");
    items.push(...rider.items);
    items.push(wire("m-r", matcher.bottom, rider.top, { tone: done ? "accent" : "line", label: done ? "matched" : undefined }));
    frames.push({ caption, items });
  };
  draw(null, null, `Matching takes the ranked candidates, ${cands.map((c) => `driver ${c.id}`).join(", ")}, and offers the trip to one driver at a time, nearest first.`);
  cands.forEach((c, i) => {
    status[i] = "offered";
    draw(i, "offer", i === 0 ? `Driver ${c.id} gets the offer and is locked for about 10 seconds, so no other rider's request can be offered the same driver at the same time.` : `The offer moves on to driver ${c.id}, next on the list, which is now the one locked while it decides. Only one driver holds this offer at a time.`);
    status[i] = answers[i] === "accept" ? "accepted" : answers[i] === "decline" ? "declined" : "timed out";
    const caption =
      answers[i] === "timeout"
        ? `Driver ${c.id} does not answer before the offer expires. The lock lapses by itself, so a lost phone or a dropped connection cannot hold a driver forever.`
        : answers[i] === "decline"
          ? `Driver ${c.id} declines. The lock is released at once and matching moves to the next driver on the list.`
          : `Driver ${c.id} accepts. Matching records the trip against that driver in one conditional write and tells the rider who is coming.`;
    draw(i, "reply", caption);
  });
  return finish({ title: "Dispatch: offer the trip to one driver at a time", input: "", frames });
}

/* ── Trip state machine ───────────────────────────────────────────── */

type State = "Requested" | "Matched" | "Arrived" | "In trip" | "Completed" | "Cancelled";
const NEXT: Record<string, Partial<Record<State, State>>> = {
  accept: { Requested: "Matched" },
  arrive: { Matched: "Arrived" },
  start: { Arrived: "In trip" },
  end: { "In trip": "Completed" },
  cancel: { Requested: "Cancelled", Matched: "Cancelled", Arrived: "Cancelled" },
};

function tripStates(): Walkthrough {
  const MAIN: State[] = ["Requested", "Matched", "Arrived", "In trip", "Completed"];
  const BW = 76;
  const STEP = 116;
  const pos = (s: State) => (s === "Cancelled" ? { x: STEP * 1, y: 120 } : { x: MAIN.indexOf(s) * STEP, y: 30 });
  const events = ["accept", "start", "arrive", "start", "cancel", "end"];
  // Run the machine: an event with no entry for the current state is refused.
  let state = "Requested" as State;
  const log = events.map((e) => {
    const to = NEXT[e][state];
    const from = state;
    if (to) state = to;
    return { e, from, to: to ?? null };
  });
  if (state !== "Completed" || log.filter((l) => !l.to).length !== 2) throw new Error("trip-states: the run should end Completed with two refused events");
  const edges: Array<[State, State, string]> = [];
  for (const [e, m] of Object.entries(NEXT)) for (const [f, t] of Object.entries(m)) edges.push([f as State, t as State, e]);
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const l = k > 0 ? log[k - 1] : null;
    const cur: State = l ? (l.to ?? l.from) : "Requested";
    const items: Item[] = [];
    edges.forEach(([f, t, e]) => {
      const a = pos(f);
      const b = pos(t);
      const taken = l?.to && l.from === f && l.to === t;
      const from = t === "Cancelled" ? { x: a.x + BW / 2, y: a.y + 30 } : { x: a.x + BW, y: a.y + 15 };
      const to = t === "Cancelled" ? { x: b.x + BW / 2 + (a.x - b.x) / 4, y: b.y } : { x: b.x, y: b.y + 15 };
      items.push(wire(`e-${f}-${t}`, from, to, { tone: taken ? "accent" : "line", dashed: t === "Cancelled" }));
      if (t !== "Cancelled") items.push(label(`el-${f}`, e, (from.x + to.x) / 2, a.y - 8, { tone: taken ? "accent" : "faint", size: 10, mono: true }));
    });
    items.push(label("cl", "cancel", STEP * 1 + BW / 2 + 70, 100, { tone: "faint", size: 10 }));
    [...MAIN, "Cancelled" as State].forEach((s) => {
      const p = pos(s);
      const tone: Tone = s === cur ? (s === "Completed" ? "strong" : "accent") : "plain";
      items.push(box(`s-${s}`, p.x, p.y, s, { w: BW, h: 30, size: 11, tone }));
    });
    items.push(label("ev", l ? `event: ${l.e}` : "events arrive from both apps", 0, 186, { anchor: "start", tone: l && !l.to ? "error" : "accent", size: 11, mono: true }));
    items.push(label("res", l ? (l.to ? `${l.from} → ${l.to}` : `refused in ${l.from}`) : "", 0, 206, { anchor: "start", tone: l && !l.to ? "error" : "ink", size: 11, mono: true }));
    frames.push({ caption, items });
  };
  draw(0, "A trip is a state machine stored with the trip row. Each event names a transition; it applies only if the trip is in the state the transition starts from.");
  log.forEach((l, i) => {
    const caption = !l.to
      ? l.e === "start"
        ? `"start" arrives while the trip is ${l.from}, before the driver has reached the pickup. No transition starts there, so the event is refused and the state is unchanged.`
        : `"cancel" arrives during the ride. In this table a trip in progress cannot be cancelled, only ended, so the event is refused.`
      : l.e === "end"
        ? "The driver ends the ride: In trip becomes Completed, which triggers fare calculation and payment once, off the hot path."
        : `"${l.e}" moves the trip from ${l.from} to ${l.to}. Written as UPDATE … WHERE state = '${l.from}', two events racing cannot both apply.`;
    draw(i + 1, caption);
  });
  return finish({ title: "The trip state machine: events apply only from the right state", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  geohash,
  nearby,
  dispatch,
  "trip-states": tripStates,
};
