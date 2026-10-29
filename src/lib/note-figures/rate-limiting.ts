import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { packet, service, wire } from "./sd-kit.js";

/**
 * Rate Limiting: the note's figures (content/notes/system-design/
 * rate-limiting.md). Every figure loops (a points subject), and every
 * accept or reject it draws is decided by running the algorithm it names on
 * the request stream written at the top of its generator:
 *
 *  - token-bucket: a 4-token bucket refilled at 1 token a second, run over
 *    six seconds of arrivals; a request with no token is a 429.
 *  - leaky-bucket: a 3-slot queue drained at one request a tick; arrivals
 *    that find it full are dropped.
 *  - fixed-window: a counter per minute (limit 5) lets ten requests through
 *    in 40 seconds across the window edge — the boundary burst, measured.
 *  - sliding-window: the same stream through a sliding log, which never
 *    lets more than five through in any 60 seconds.
 */

/* ── Token bucket ─────────────────────────────────────────────────── */

function tokenBucket(): Walkthrough {
  const CAP = 4;
  const RATE = 1; // tokens added per second
  const arrivals = [3, 4, 0, 1, 2, 1]; // requests arriving in seconds 1..6
  // Run the bucket: refill at the start of each second, then spend a token per request.
  let tokens = CAP;
  const log: Array<{ before: number; refilled: number; ok: number; rejected: number; after: number }> = [];
  for (const n of arrivals) {
    const before = Math.min(CAP, tokens + RATE);
    const refilled = before - tokens;
    const ok = Math.min(n, before);
    tokens = before - ok;
    log.push({ before, refilled, ok, rejected: n - ok, after: tokens });
  }
  const accepted = log.reduce((s, l) => s + l.ok, 0);
  const rejected = log.reduce((s, l) => s + l.rejected, 0);
  // The promise a token bucket makes: never more than the capacity plus what was refilled.
  if (accepted > CAP + RATE * arrivals.length) throw new Error("token-bucket: more accepted than the bucket can hold");
  if (rejected === 0) throw new Error("token-bucket: the burst should overflow the bucket");

  const SLOT_H = 26;
  const TX = 110; // timeline's left edge
  const COL = 52;
  const BASE = 4 * SLOT_H + 2; // the timeline's baseline, level with the bucket's floor
  const frames: Frame[] = [];
  const draw = (sec: number, final: boolean, caption: string) => {
    const tk = sec === 0 ? CAP : log[sec - 1].after;
    const items: Item[] = [label("b-h", `bucket ${tk}/${CAP}`, 30, -12, { tone: "ink", size: 11, weight: 600 })];
    for (let i = 0; i < CAP; i++) {
      // Slot 0 is the bottom one; tokens fill from the floor up.
      const y = (CAP - 1 - i) * SLOT_H;
      items.push(box(`slot${i}`, 0, y, "", { w: 60, h: SLOT_H - 4 }));
      if (i < tk) items.push(packet(`tok${i}`, { x: 30, y: y + (SLOT_H - 4) / 2 }, { r: 7, tone: "strong" }));
    }
    items.push(label("b-rate", `+${RATE} token/s`, 30, BASE + 14, { tone: sec > 0 && !final && log[sec - 1].refilled > 0 ? "accent" : "soft", size: 11 }));
    items.push(label("t-h", "requests in each second", TX, -12, { anchor: "start", tone: "ink", size: 11, weight: 600 }));
    arrivals.forEach((n, s) => {
      const x = TX + s * COL;
      const shown = s < sec;
      const current = s === sec - 1 && !final;
      items.push(label(`sec${s}`, `${s + 1}s`, x + 22, BASE + 14, { tone: current ? "accent" : "soft", size: 11 }));
      if (!shown) return;
      for (let k = 0; k < n; k++) {
        const ok = k < log[s].ok;
        const tone: Tone = !ok ? "error" : current ? "accent" : "strong";
        items.push(box(`r${s}-${k}`, x, BASE - 2 - (k + 1) * SLOT_H + 4, ok ? "200" : "429", { w: 44, h: SLOT_H - 4, tone, size: 11 }));
      }
    });
    items.push({ k: "edge", id: "base", x1: TX - 6, y1: BASE, x2: TX + arrivals.length * COL - 2, y2: BASE, tone: "faint" });
    frames.push({ caption, items });
  };
  draw(0, false, `The bucket holds up to ${CAP} tokens and gains ${RATE} a second. Every request must take a token; a request that finds the bucket empty is refused with 429.`);
  log.forEach((l, s) => {
    const n = arrivals[s];
    const refill = l.refilled > 0 ? `a refill brings it to ${l.before}` : `the bucket is already full, so the refill is lost`;
    const what =
      n === 0
        ? `no request arrives, so the token is saved for the next burst`
        : l.rejected > 0
          ? `${n} requests arrive: ${l.ok} take the last tokens and ${l.rejected} get 429 Too Many Requests`
          : `${n} request${n === 1 ? "" : "s"} arrive${n === 1 ? "s" : ""} and ${n === 1 ? "takes a token" : `take ${n} tokens`}, leaving ${l.after}`;
    draw(s + 1, false, `Second ${s + 1}: ${refill}; ${what}.`);
  });
  draw(arrivals.length, true, `Over ${arrivals.length} seconds ${accepted} requests passed and ${rejected} were refused: a burst may spend the whole bucket at once, but the long-run rate is held to ${RATE} a second.`);
  return finish({ title: "Token bucket: a burst spends the tokens, then requests wait for refills", input: "", frames });
}

/* ── Leaky bucket ─────────────────────────────────────────────────── */

function leakyBucket(): Walkthrough {
  const SIZE = 3; // queue slots
  const arrivals = [3, 3, 0, 1, 0, 0]; // requests arriving in ticks 1..6
  // Run it: arrivals join the queue while there is room (the rest are dropped), then the head leaves.
  let next = 1;
  const queue: number[] = [];
  const dropped: number[] = [];
  const ticks: Array<{ queue: number[]; sent: number | null; droppedNow: number[]; joined: number[]; dropped: number[] }> = [];
  const waiting: number[][] = arrivals.map((n) => Array.from({ length: n }, () => next++));
  waiting.forEach((group) => {
    // The head leaves first, then arrivals take whatever room that left.
    const sent = queue.length ? queue.shift()! : null;
    const droppedNow: number[] = [];
    const joined: number[] = [];
    for (const r of group) {
      if (queue.length < SIZE) {
        queue.push(r);
        joined.push(r);
      } else {
        dropped.push(r);
        droppedNow.push(r);
      }
    }
    ticks.push({ queue: [...queue], sent, droppedNow, joined, dropped: [...dropped] });
  });
  if (ticks.some((t) => t.queue.length > SIZE)) throw new Error("leaky-bucket: the queue overflowed its slots");
  if (dropped.length === 0) throw new Error("leaky-bucket: the burst should overflow the queue");
  const served = ticks.filter((t) => t.sent !== null).length;

  const client = (tone: Tone = "plain") => service("client", 0, 40, "Clients", { w: 84, tone });
  const QX = 140;
  const slotX = (i: number) => QX + (SIZE - 1 - i) * 40; // queue index 0 (the head) is nearest the server
  const server = (sub: string) => service("server", 310, 40, "API server", { w: 96, sub });
  const frames: Frame[] = [];
  const draw = (t: number, caption: string) => {
    const state = t === 0 ? { queue: [] as number[], sent: null, dropped: [] as number[] } : ticks[t - 1];
    const sentSoFar = ticks.slice(0, t).filter((k) => k.sent !== null).length;
    const c = client();
    const s = server(`served ${sentSoFar}`);
    const items: Item[] = [...c.items, ...s.items, label("q-h", `queue · ${SIZE} slots`, QX + 56, 26, { tone: "ink", size: 11, weight: 600 })];
    for (let i = 0; i < SIZE; i++) items.push(box(`slot${i}`, slotX(i), 40, "", { w: 34, h: 38 }));
    items.push(wire("c-q", c.right, { x: QX - 4, y: 59 }), wire("q-s", { x: QX + SIZE * 40 - 2, y: 59 }, s.left, { tone: state.sent !== null ? "accent" : "line" }));
    items.push(label("d-h", "dropped", QX - 4, 112, { anchor: "start", tone: "soft", size: 11 }));
    state.queue.forEach((r, i) => items.push(packet(`r${r}`, { x: slotX(i) + 17, y: 59 }, { text: r })));
    if (state.sent !== null) items.push(packet(`r${state.sent}`, { x: s.right.x + 16, y: s.mid.y }, { text: state.sent, tone: "strong" }));
    state.dropped.forEach((r, i) => items.push(packet(`r${r}`, { x: QX + 64 + i * 26, y: 108 }, { text: r, tone: "error" })));
    // Next tick's arrivals wait above the clients, so they glide in next frame.
    (waiting[t] ?? []).forEach((r, i, all) => items.push(packet(`r${r}`, { x: c.mid.x + (i - (all.length - 1) / 2) * 24, y: 22 }, { text: r })));
    frames.push({ caption, items });
  };
  draw(0, `Requests join a queue of ${SIZE} slots, and each tick the server takes exactly one from its head, however fast they arrive. Three requests are about to arrive.`);
  ticks.forEach((k, i) => {
    const t = i + 1;
    const parts: string[] = [];
    if (k.joined.length) parts.push(`${k.joined.length === 1 ? `request ${k.joined[0]} joins` : `requests ${k.joined.join(", ")} join`} the queue`);
    if (k.droppedNow.length) parts.push(`${k.droppedNow.join(" and ")} find it full and are dropped`);
    const sent = k.sent !== null ? `request ${k.sent} leaks out to the server` : `the queue was empty, so the server takes nothing yet`;
    const caption = parts.length ? `Tick ${t}: ${sent}; ${parts.join(", ")}.` : `Tick ${t}: nothing arrives and ${sent}${k.sent !== null ? `, still one a tick` : ""}.`;
    draw(t, t === ticks.length ? `Tick ${t}: request ${k.sent} leaks out and the queue is empty. ${served} requests were served at a steady one a tick and ${dropped.length} were dropped — the burst was smoothed, not passed on.` : caption);
  });
  return finish({ title: "Leaky bucket: a queue drained at a constant rate", input: "", frames });
}

/* ── Fixed window and sliding window ──────────────────────────────── */

const LIMIT = 5;
const WINDOW = 60; // seconds
const STREAM = [40, 44, 48, 52, 56, 64, 68, 72, 76, 80, 88, 101, 106]; // request times, seconds
const PX = 4; // px per second
const AXIS_Y = 100;
const DOT_Y = 84;

function axis(): Item[] {
  const items: Item[] = [{ k: "edge", id: "axis", x1: 0, y1: AXIS_Y, x2: 120 * PX, y2: AXIS_Y, tone: "ink" }];
  for (const t of [0, 30, 60, 90, 120]) {
    items.push({ k: "edge", id: `tick${t}`, x1: t * PX, y1: AXIS_Y, x2: t * PX, y2: AXIS_Y + 4, tone: "ink" });
    items.push(label(`tl${t}`, `${t}s`, t * PX, AXIS_Y + 16, { tone: "faint", size: 10 }));
  }
  return items;
}

/** The most accepted requests inside any WINDOW-second span — the number a limit is meant to cap. */
function busiest(times: number[]): { count: number; from: number; to: number } {
  let best = { count: 0, from: 0, to: 0 };
  for (let i = 0; i < times.length; i++) {
    let j = i;
    while (j + 1 < times.length && times[j + 1] - times[i] < WINDOW) j++;
    if (j - i + 1 > best.count) best = { count: j - i + 1, from: times[i], to: times[j] };
  }
  return best;
}

function fixedWindow(): Walkthrough {
  // Run the counter: one count per window, reset when the window changes.
  const counts = new Map<number, number>();
  const ok = STREAM.map((t) => {
    const w = Math.floor(t / WINDOW);
    const c = counts.get(w) ?? 0;
    if (c >= LIMIT) return false;
    counts.set(w, c + 1);
    return true;
  });
  const burst = busiest(STREAM.filter((_, i) => ok[i]));
  if (burst.count !== 2 * LIMIT) throw new Error(`fixed-window: expected a ${2 * LIMIT}-request burst across the edge, got ${burst.count}`);
  const batches = [[0, 1, 2], [3, 4], [5, 6, 7], [8, 9], [10, 11, 12]];
  const frames: Frame[] = [];
  const draw = (upTo: number, current: number[], caption: string, showBurst = false) => {
    const items: Item[] = [];
    for (let w = 0; w < 2; w++) {
      const active = current.some((i) => Math.floor(STREAM[i] / WINDOW) === w);
      const n = STREAM.slice(0, upTo).filter((t, i) => ok[i] && Math.floor(t / WINDOW) === w).length;
      items.push({ k: "band", id: `win${w}`, x: w * WINDOW * PX + 2, y: 40, w: WINDOW * PX - 4, h: 56, tone: active ? "accent" : "ghost" });
      items.push(label(`cnt${w}`, `window ${w + 1}: ${n}/${LIMIT}`, w * WINDOW * PX + 10, 56, { anchor: "start", tone: active ? "accent" : "soft", size: 11, weight: 600 }));
    }
    items.push(...axis());
    STREAM.slice(0, upTo).forEach((t, i) => {
      const tone: Tone = !ok[i] ? "error" : showBurst ? "strong" : current.includes(i) ? "accent" : "strong";
      items.push(packet(`d${i}`, { x: t * PX, y: DOT_Y }, { r: 6, tone }));
    });
    if (showBurst) items.push({ k: "span", id: "burst", x1: burst.from * PX - 6, x2: burst.to * PX + 6, y: 22, label: `${burst.count} passed in ${burst.to - burst.from} s`, tone: "error" });
    frames.push({ caption, items });
  };
  draw(0, [], `A fixed window keeps one counter per minute, limit ${LIMIT}, and resets it when the clock crosses into the next minute.`);
  let upTo = 0;
  batches.forEach((b) => {
    upTo = b[b.length - 1] + 1;
    const times = b.map((i) => STREAM[i]);
    const w = Math.floor(times[0] / WINDOW) + 1;
    const passed = b.filter((i) => ok[i]).length;
    const n = STREAM.slice(0, upTo).filter((t, i) => ok[i] && Math.floor(t / WINDOW) === w - 1).length;
    const caption =
      passed === b.length
        ? n === LIMIT
          ? `Requests at ${times.join(" and ")} s fill window ${w}: its counter reaches ${LIMIT}/${LIMIT}${w === 2 ? ", though the last five came only seconds after window 1 filled" : ""}.`
          : `Requests at ${times.join(", ")} s fall in window ${w}; its counter is ${n} of ${LIMIT}, so all pass${w === 2 ? " — the counter started again from zero at 60 s" : ""}.`
        : `Requests at ${times.join(", ")} s find window ${w} already at ${LIMIT}/${LIMIT} and are refused with 429.`;
    draw(upTo, b, caption);
  });
  draw(STREAM.length, [], `The boundary burst: ${burst.count} requests passed between ${burst.from} s and ${burst.to} s, twice the limit inside one minute, because the burst straddled the reset.`, true);
  return finish({ title: "Fixed window: twice the limit gets through across a window edge", input: "", frames });
}

function slidingWindow(): Walkthrough {
  // Run the sliding log: keep the times of accepted requests; count those in (t − WINDOW, t].
  const log: number[] = [];
  const steps = STREAM.map((t) => {
    const inWindow = log.filter((a) => a > t - WINDOW);
    const pass = inWindow.length < LIMIT;
    if (pass) log.push(t);
    return { t, pass, counted: inWindow.length };
  });
  const most = busiest(log);
  if (most.count > LIMIT) throw new Error("sliding-window: more than the limit passed in some window");
  const frames: Frame[] = [];
  const draw = (upTo: number, caption: string) => {
    const now = upTo > 0 ? STREAM[upTo - 1] : null;
    const items: Item[] = [...axis()];
    if (now !== null) {
      const from = Math.max(0, now - WINDOW);
      items.push({ k: "band", id: "win", x: from * PX, y: 40, w: (now - from) * PX, h: 56, tone: steps[upTo - 1].pass ? "accent" : "ghost" });
      items.push({ k: "span", id: "span", x1: from * PX, x2: now * PX, y: 30, label: `last ${WINDOW} s holds ${steps[upTo - 1].counted + (steps[upTo - 1].pass ? 1 : 0)}`, tone: steps[upTo - 1].pass ? "accent" : "error" });
      items.push({ k: "ptr", id: "now", x: now * PX, y: AXIS_Y + 22, label: "now", tone: steps[upTo - 1].pass ? "accent" : "error", up: true });
    }
    STREAM.slice(0, upTo).forEach((t, i) => {
      const s = steps[i];
      const tone: Tone = !s.pass ? "error" : now === null ? "strong" : t > now - WINDOW ? "accent" : "muted";
      items.push(packet(`d${i}`, { x: t * PX, y: DOT_Y }, { r: 6, tone }));
    });
    frames.push({ caption, items });
  };
  draw(0, `A sliding window log keeps the time of every request it let through, and admits a new one only if fewer than ${LIMIT} of those fall in the last ${WINDOW} seconds.`);
  // Frames by batch, so a run of identical refusals plays as one step.
  const first = steps.findIndex((x) => !x.pass);
  const reopen = steps.findIndex((x, i) => i > first && x.pass);
  const batches = [[0, 1, 2], [3, 4], [first], steps.map((_, i) => i).filter((i) => i > first && i < reopen), [reopen], [reopen + 1]];
  if (batches.flat().length !== STREAM.length || batches[3].some((i) => steps[i].pass)) throw new Error("sliding-window: batches do not cover the stream");
  batches.forEach((b) => {
    const s = steps[b[b.length - 1]];
    const times = b.map((i) => STREAM[i]);
    let caption: string;
    if (b[0] === first) caption = `At ${s.t} s the window reaches back to ${s.t - WINDOW} s and already holds ${s.counted}. There is no reset to exploit, so this request gets 429.`;
    else if (b.length > 1 && !s.pass) caption = `Requests at ${times.join(", ")} s are refused too: the window holds ${LIMIT} until the request at ${log[0]} s slides out at ${log[0] + WINDOW} s.`;
    else if (b[0] >= reopen) caption = `At ${s.t} s older requests have slid out of the window; only ${s.counted} remain, so this one passes${b[0] > reopen ? " as well" : ""}.`;
    else if (b.every((i) => steps[i].pass) && log.slice(0, b[b.length - 1] + 1).length === LIMIT) caption = `At ${times.join(" and ")} s the log reaches ${LIMIT} timestamps inside the window: the limit, with every one of them still counted.`;
    else caption = `Requests at ${times.join(", ")} s each find fewer than ${LIMIT} timestamps in the last ${WINDOW} seconds, so all pass and are logged.`;
    draw(b[b.length - 1] + 1, caption);
  });
  // The settled picture: every accepted request strong, the busiest minute measured.
  const items = frames[frames.length - 1].items.filter((it) => it.id !== "win" && it.id !== "span" && it.id !== "now").map((it) => (it.k === "node" && it.tone !== "error" ? { ...it, tone: "strong" as Tone } : it));
  items.push({ k: "span", id: "span", x1: most.from * PX - 6, x2: most.to * PX + 6, y: 30, label: `busiest minute: ${most.count}`, tone: "accent" });
  frames.push({ caption: `${log.length} of ${STREAM.length} requests passed, and no ${WINDOW}-second span holds more than ${most.count}. The price is memory: one timestamp per accepted request.`, items });
  return finish({ title: "Sliding window: the limit holds over every 60 seconds", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "token-bucket": tokenBucket,
  "leaky-bucket": leakyBucket,
  "fixed-window": fixedWindow,
  "sliding-window": slidingWindow,
};
