import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { database, packet, service, wire, type NodeBox, type Pt } from "./sd-kit.js";

/**
 * Caching: the note's figures (content/notes/system-design/caching.md).
 * Every figure loops (a points subject), and every hit, miss and value drawn
 * comes from running the cache it shows:
 *
 *  - cache-aside: four reads through a cache-aside lookup (a Map in front of a
 *    "database" Map); one packet glides app → cache (→ database → app).
 *  - lru: an LRU cache of capacity 3 run on an access sequence — order kept
 *    most-recent first, the least recent evicted on a miss when full; hits
 *    and misses counted, the ratio computed.
 *  - write-policies: one write and one read under write-through, write-back
 *    and write-around, each lane's cache/database state simulated; the hops
 *    before the write is acknowledged are counted from the simulation.
 *  - ttl: a 5-second TTL over a timeline of reads while the database's value
 *    changes once; expiry, refills, stale reads and the hit ratio computed.
 */

const pct = (u: number) => `${Math.round(u * 100)}%`;

/* ── Cache-aside ──────────────────────────────────────────────────── */

function cacheAside(): Walkthrough {
  const reads = ["A", "B", "A", "B"];
  const cache = new Map<string, true>();
  let hits = 0;
  let misses = 0;
  const app = service("app", 0, 76, "App server", { w: 104 });
  const cacheBox = (tone: Tone) => service("cache", 210, 0, "Cache", { w: 100, tone });
  const dbBox = (tone: Tone) => database("db", 210, 150, "Database", { w: 100, tone });
  const stops = { app: { x: app.mid.x, y: app.top.y - 18 }, cache: { x: 210 + 50, y: -18 }, db: { x: 210 + 50, y: 150 + 40 + 20 } };
  const frames: Frame[] = [];
  const draw = (where: keyof typeof stops, key: string, o: { cacheTone?: Tone; dbTone?: Tone; via?: "c" | "d"; fresh?: string; done?: boolean }, caption: string) => {
    const c = cacheBox(o.cacheTone ?? "plain");
    const d = dbBox(o.dbTone ?? "plain");
    const items: Item[] = [
      wire("w-c", app.right, c.left, { tone: o.via === "c" ? "accent" : "line" }),
      wire("w-d", app.right, d.left, { tone: o.via === "d" ? "accent" : "line" }),
      ...app.items,
      ...c.items,
      ...d.items,
      label("cl", "in cache:", 326, 19, { anchor: "start", size: 11, tone: "soft" }),
    ];
    [...cache.keys()].forEach((k, i) => items.push(box(`k${k}`, 384 + i * 36, 6, k, { w: 30, h: 26, size: 12, tone: k === o.fresh ? "accent" : "plain" })));
    items.push(label("count", `hits ${hits} · misses ${misses}`, app.mid.x, app.bottom.y + 20, { size: 11, mono: true, tone: "ink" }));
    items.push(packet("req", stops[where], { text: key, tone: o.done ? "strong" : "accent" }));
    frames.push({ caption, items });
  };
  reads.forEach((key, n) => {
    const hit = cache.has(key);
    if (hit) {
      hits += 1;
      draw("cache", key, { cacheTone: "strong", via: "c" }, `Read ${n + 1} asks for ${key}. The app checks the cache first, and ${key} is there: a hit, with no database work.`);
      draw("app", key, { via: "c", done: true }, `The cached ${key} goes straight back to the app — ${hits} hit${hits === 1 ? "" : "s"} so far, the fast path that makes caching worth it.`);
    } else {
      draw("cache", key, { cacheTone: "accent", via: "c" }, `Read ${n + 1} asks for ${key}. The app checks the cache first, but ${key} is not there: a miss.`);
      misses += 1;
      draw("db", key, { dbTone: "accent", via: "d" }, `On a miss the app itself reads ${key} from the database — the slow path. The cache never talks to the database in cache-aside.`);
      cache.set(key, true);
      draw("app", key, { via: "c", fresh: key, done: true }, `The app stores ${key} in the cache, then returns it. Miss ${misses}; the next read of ${key} will be a hit.`);
    }
  });
  if (hits !== reads.length - new Set(reads).size) throw new Error("cache-aside: every repeat read should hit");
  return finish({ title: "Cache-aside: check the cache, fall back to the database, fill the cache", input: "", frames });
}

/* ── LRU eviction ─────────────────────────────────────────────────── */

function lru(): Walkthrough {
  const CAP = 3;
  const seq = ["A", "B", "C", "A", "B", "D", "A", "E", "A"];
  const order: string[] = []; // most recent first
  const results: Array<"hit" | "miss"> = [];
  let hits = 0;
  const SX = (i: number) => i * 36;
  const slotX = (i: number) => 40 + i * 64;
  const SLOT_Y = 92;
  const frames: Frame[] = [];
  const draw = (t: number, evicted: string | null, caption: string) => {
    const items: Item[] = [label("seq-t", "accesses", -8, 13, { anchor: "end", size: 11, tone: "soft" })];
    seq.forEach((k, i) => {
      const tone: Tone = i === t ? "accent" : i < t ? (results[i] === "hit" ? "strong" : "plain") : "muted";
      items.push(box(`s${i}`, SX(i), 0, k, { w: 30, h: 26, size: 12, tone }));
      if (i <= t) items.push(label(`r${i}`, results[i] === "hit" ? "hit" : "miss", SX(i) + 15, 38, { size: 10, tone: i === t ? "accent" : "faint" }));
    });
    items.push(label("cache-t", `LRU cache, capacity ${CAP}`, slotX(0) - 6, SLOT_Y - 14, { anchor: "start", size: 11, weight: 600 }));
    for (let i = 0; i < CAP; i++) items.push({ k: "band", id: `slot${i}`, x: slotX(i) - 4, y: SLOT_Y - 4, w: 56, h: 40, tone: "ghost" });
    order.forEach((k, i) => items.push(box(`k${k}`, slotX(i), SLOT_Y, k, { w: 48, h: 32, size: 13, tone: i === 0 && t >= 0 ? "accent" : "plain" })));
    items.push(label("mru", "most recent", slotX(0) + 24, SLOT_Y + 50, { size: 10, tone: "faint" }));
    items.push(label("lru", "least recent", slotX(CAP - 1) + 24, SLOT_Y + 50, { size: 10, tone: "faint" }));
    if (evicted) {
      items.push(box(`k${evicted}`, slotX(CAP) + 26, SLOT_Y, evicted, { w: 48, h: 32, size: 13, tone: "error" }));
      items.push(label("ev-t", "evicted", slotX(CAP) + 50, SLOT_Y + 50, { size: 10, tone: "error" }));
    }
    const misses = results.length - hits;
    items.push(label("count", `hits ${hits} · misses ${misses}${t === seq.length - 1 ? ` · hit ratio ${pct(hits / seq.length)}` : ""}`, 0, SLOT_Y + 76, { anchor: "start", size: 11.5, mono: true, tone: t === seq.length - 1 ? "accent" : "ink" }));
    frames.push({ caption, items });
  };
  draw(-1, null, `An LRU cache holds ${CAP} items, kept in order of last use. When it is full, a miss evicts the least recently used item.`);
  seq.forEach((k, t) => {
    const at = order.indexOf(k);
    let evicted: string | null = null;
    let caption: string;
    if (at >= 0) {
      order.splice(at, 1);
      order.unshift(k);
      results.push("hit");
      hits += 1;
      caption = `Access ${k}: a hit. ${k} moves to the most-recent end, giving ${order.join(", ")}; nothing is evicted.`;
    } else {
      results.push("miss");
      if (order.length === CAP) evicted = order.pop()!;
      order.unshift(k);
      caption = evicted ? `Access ${k}: a miss with the cache full, so ${evicted}, the least recently used, is evicted to make room: ${order.join(", ")}.` : `Access ${k}: a miss. There is still room, so ${k} is loaded and goes in at the most-recent end.`;
    }
    if (t === seq.length - 1) caption += ` In all, ${hits} hits out of ${seq.length} accesses: a hit ratio of ${pct(hits / seq.length)}.`;
    if (order.length > CAP) throw new Error("lru: the cache grew past its capacity");
    draw(t, evicted, caption);
  });
  return finish({ title: "LRU eviction on a capacity-3 cache, access by access", input: "", frames });
}

/* ── Write-through, write-back, write-around ──────────────────────── */

type Spot = "app" | "cache" | "db";
interface Lane {
  name: string;
  cache: number | null;
  db: number;
  dirty: boolean;
  ackHops: number | null;
}

function writePolicies(): Walkthrough {
  const OLD = 3;
  const NEW = 5;
  const lanes: Lane[] = ["Write-through", "Write-back", "Write-around"].map((name) => ({ name, cache: OLD, db: OLD, dirty: false, ackHops: null }));
  // Each lane's script, frame by frame: where its packet is and what that stop does.
  type Act = { at: Spot; tag: string; via?: "ac" | "cd" | "ad"; run?: (l: Lane) => void; note?: string };
  const write = (l: Lane, hops: number) => (l.ackHops = hops);
  const scripts: Act[][] = [
    [
      { at: "app", tag: "W" },
      { at: "cache", tag: "W", via: "ac", run: (l) => (l.cache = NEW) },
      { at: "db", tag: "W", via: "cd", run: (l) => (l.db = NEW) },
      { at: "app", tag: "W", via: "ac", run: (l) => write(l, 2), note: "ack" },
      { at: "cache", tag: "R", via: "ac", note: "hit" },
      { at: "app", tag: "R", via: "ac" },
      { at: "app", tag: "R" },
    ],
    [
      { at: "app", tag: "W" },
      { at: "cache", tag: "W", via: "ac", run: (l) => ((l.cache = NEW), (l.dirty = true)) },
      { at: "app", tag: "W", via: "ac", run: (l) => write(l, 1), note: "ack" },
      { at: "app", tag: "W" },
      { at: "cache", tag: "R", via: "ac", note: "hit" },
      { at: "db", tag: "F", via: "cd", run: (l) => ((l.db = l.cache!), (l.dirty = false)), note: "flush" },
      { at: "app", tag: "R" },
    ],
    [
      { at: "app", tag: "W" },
      { at: "db", tag: "W", via: "ad", run: (l) => ((l.db = NEW), (l.cache = null)) },
      { at: "app", tag: "W", via: "ad", run: (l) => write(l, 1), note: "ack" },
      { at: "app", tag: "W" },
      { at: "cache", tag: "R", via: "ac", note: "miss" },
      { at: "db", tag: "R", via: "ad", run: (l) => (l.cache = l.db) },
      { at: "app", tag: "R" },
    ],
  ];
  const FRAMES = scripts[0].length;
  if (scripts.some((s) => s.length !== FRAMES)) throw new Error("write-policies: lanes must run the same number of frames");
  const LW = 168;
  const frames: Frame[] = [];
  const captions = (f: number): string => {
    const [t, b, a] = lanes;
    switch (f) {
      case 0:
        return `Every lane starts with x = ${OLD} in both the cache and the database. Each app now writes x = ${NEW}.`;
      case 1:
        return "Write-through and write-back update the cache first. Write-around skips the cache, writes the database and drops the cached copy.";
      case 2:
        return `Write-back acknowledges after ${b.ackHops} hop, leaving the database at x = ${b.db} — dirty data a cache crash would lose. Write-around is acknowledged too; write-through is still writing the database.`;
      case 3:
        return `Write-through acknowledges only after both copies hold x = ${t.db}: ${t.ackHops} hops, slower writes, but cache and database always agree.`;
      case 4:
        return `Now each app reads x. Write-through and write-back hit the cache; write-around misses, because its write bypassed the cache.`;
      case 5:
        return `Write-around fetches x = ${a.db} from the database and fills the cache. Write-back's background flush finally writes x = ${b.db} to the database.`;
      default:
        return `Settled: every lane holds x = ${NEW} in both places. The trade-off was write speed (${t.ackHops} vs ${b.ackHops} hops to acknowledge) against durability and read-after-write hits.`;
    }
  };
  for (let f = 0; f < FRAMES; f++) {
    const items: Item[] = [];
    lanes.forEach((l, k) => {
      const act = scripts[k][f];
      act.run?.(l);
      const ox = k * LW + 24;
      items.push(label(`t${k}`, l.name, ox + 50, 0, { size: 11.5, weight: 600, tone: "ink" }));
      const tone = (s: Spot): Tone => (act.at === s && f > 0 && f < FRAMES - 1 ? "accent" : "plain");
      const app = service(`a${k}`, ox, 16, "App", { w: 100, tone: tone("app") });
      const cache = service(`c${k}`, ox, 96, "Cache", { w: 100, tone: tone("cache"), sub: l.cache === null ? "empty" : `x = ${l.cache}${l.dirty ? " · dirty" : ""}`, subTone: l.dirty ? "error" : "soft" });
      const db = database(`d${k}`, ox, 182, "Database", { w: 100, tone: l.db === NEW && f === FRAMES - 1 ? "strong" : tone("db"), sub: `x = ${l.db}`, subTone: l.db === OLD && l.cache === NEW ? "error" : "soft" });
      const boxes: Record<Spot, NodeBox> = { app, cache, db };
      items.push(
        wire(`ac${k}`, app.bottom, cache.top, { tone: act.via === "ac" ? "accent" : "line" }),
        wire(`cd${k}`, { x: cache.bottom.x, y: cache.bottom.y + 20 }, db.top, { tone: act.via === "cd" ? "accent" : "line" }),
        // The app's direct path to the database (write-around's write, a miss's read), curved round the cache's left.
        wire(`ad${k}`, app.left, db.left, { tone: act.via === "ad" ? "accent" : "faint", bow: 26, head: true }),
        ...app.items,
        ...cache.items,
        ...db.items,
      );
      const b = boxes[act.at];
      const p: Pt = { x: b.right.x + 16, y: b.mid.y };
      items.push(packet(`p${k}`, p, { text: act.tag, tone: f === FRAMES - 1 ? "strong" : "accent" }));
      if (act.note) items.push(label(`n${k}`, act.note, p.x, p.y - 18, { size: 10, tone: act.note === "miss" ? "ink" : "accent" }));
    });
    frames.push({ caption: captions(f), items });
  }
  const [t, b, a] = lanes;
  if (!(t.ackHops! > b.ackHops! && b.ackHops === a.ackHops)) throw new Error("write-policies: write-through should take more hops to acknowledge");
  if (lanes.some((l) => l.cache !== NEW || l.db !== NEW || l.dirty)) throw new Error("write-policies: every lane should end consistent");
  return finish({ title: "Write-through, write-back and write-around: one write, then one read", input: "", frames });
}

/* ── TTL expiry ───────────────────────────────────────────────────── */

function ttl(): Walkthrough {
  const TTL = 5;
  const END = 12;
  const reads = [0, 2, 4, 6, 8, 10];
  const CHANGE = { at: 3, from: "v1", to: "v2" };
  const dbAt = (t: number) => (t >= CHANGE.at ? CHANGE.to : CHANGE.from);
  const U = 38;
  const X = (t: number) => t * U;
  const ROW_C = 34;
  const ROW_D = 84;
  const AXIS = 140;
  let entry: { value: string; from: number; expires: number } | null = null;
  const fills: Array<{ value: string; from: number; expires: number }> = [];
  const outcome: Array<{ t: number; kind: "miss" | "hit" | "stale"; value: string }> = [];
  const frames: Frame[] = [];
  reads.forEach((t, f) => {
    let kind: "miss" | "hit" | "stale";
    if (entry && t < entry.expires) kind = entry.value === dbAt(t) ? "hit" : "stale";
    else {
      entry = { value: dbAt(t), from: t, expires: t + TTL };
      fills.push(entry);
      kind = "miss";
    }
    outcome.push({ t, kind, value: entry.value });
    const items: Item[] = [
      label("rc", "cache", -10, ROW_C + 13, { anchor: "end", size: 11, tone: "soft" }),
      label("rd", "database", -10, ROW_D + 13, { anchor: "end", size: 11, tone: "soft" }),
      { k: "path", id: "axis", pts: [[0, AXIS], [X(END), AXIS]], tone: "ink", width: 1.2 },
    ];
    for (let s = 0; s <= END; s += 2) items.push(label(`tk${s}`, `${s}s`, X(s), AXIS + 26, { size: 10, tone: "faint" }));
    fills.forEach((e, i) => {
      const live = e === entry;
      // Words sit at the bar's left end, clear of the clock line that crosses it two seconds in.
      items.push(box(`e${i}`, X(e.from), ROW_C, "", { w: X(Math.min(e.expires, END)) - X(e.from) - 2, h: 26, tone: live ? "accent" : "muted" }));
      items.push(label(`et${i}`, `${e.value} (${TTL}s)`, X(e.from) + 7, ROW_C + 13, { anchor: "start", size: 11, mono: true, tone: live ? "ink" : "faint" }));
    });
    // The database's value: v1 until the change, then v2 — drawn as far as the clock has reached the change.
    const changed = t >= CHANGE.at;
    items.push(box("v1", 0, ROW_D, "", { w: X(changed ? CHANGE.at : END) - 2, h: 26, tone: "plain" }), label("v1t", CHANGE.from, 7, ROW_D + 13, { anchor: "start", size: 11, mono: true, tone: "ink" }));
    if (changed) items.push(box("v2", X(CHANGE.at), ROW_D, "", { w: X(END) - X(CHANGE.at), h: 26, tone: "plain" }), label("v2t", CHANGE.to, X(CHANGE.at) + 7, ROW_D + 13, { anchor: "start", size: 11, mono: true, tone: "ink" }));
    outcome.forEach((o, i) => {
      const now = i === outcome.length - 1;
      const tone: Tone = o.kind === "stale" ? "error" : now ? "accent" : o.kind === "hit" ? "strong" : "plain";
      items.push({ k: "node", id: `m${i}`, x: X(o.t), y: AXIS, r: 9, text: o.kind === "miss" ? "M" : "H", tone, size: 10 });
    });
    items.push({ k: "edge", id: "now", x1: X(t), y1: ROW_C - 6, x2: X(t), y2: AXIS - 11, tone: "accent", dashed: true });
    items.push(label("res", `${outcome[f].kind === "stale" ? "stale hit" : outcome[f].kind}: ${outcome[f].value}`, X(t), ROW_C - 14, { size: 11, mono: true, tone: outcome[f].kind === "stale" ? "error" : "accent" }));
    const hits = outcome.filter((o) => o.kind !== "miss").length;
    const stale = outcome.filter((o) => o.kind === "stale").length;
    let caption: string;
    if (f === 0) caption = `At ${t}s the cache is empty: a miss. The value ${entry.value} is read from the database and cached with a ${TTL}-second TTL, so it expires at ${entry.expires}s.`;
    else if (f === reads.length - 1) caption = `At ${t}s: a hit. Over ${reads.length} reads, ${hits} hits (${pct(hits / reads.length)}), ${stale} of them stale. A shorter TTL means fresher data but more misses.`;
    else if (kind === "stale") caption = `The database changed to ${CHANGE.to} at ${CHANGE.at}s, but at ${t}s the cache still serves ${entry.value} until it expires. A TTL bounds staleness; it does not prevent it.`;
    else if (kind === "miss") caption = `At ${t}s the entry has expired (at ${fills[fills.length - 2].expires}s), so the read misses and refills the cache with ${entry.value}, valid until ${entry.expires}s.`;
    else caption = `At ${t}s the entry is ${t - entry.from}s old, younger than its ${TTL}s TTL: a hit on ${entry.value}, matching the database.`;
    frames.push({ caption, items });
  });
  if (!outcome.some((o) => o.kind === "stale")) throw new Error("ttl: the example should show a stale read");
  return finish({ title: "TTL expiry: a cached value lives 5 seconds, stale or not", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "cache-aside": cacheAside,
  lru,
  "write-policies": writePolicies,
  ttl,
};
