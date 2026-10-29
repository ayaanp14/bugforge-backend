import { finish, ring, round, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { bars, box, label } from "../lesson-figures/kit.js";
import { packet, type Pt } from "./sd-kit.js";

/**
 * Consistent Hashing: the note's figures (content/notes/system-design/
 * consistent-hashing.md). Every position on the ring is a real hash —
 * FNV-1a with a murmur finaliser, scaled to 0–360° — and every count is
 * made by running the lookup:
 *
 *  - ring-lookup: servers and keys hashed onto the ring; each key walks
 *    clockwise to the first server (a pipeline: one key per frame).
 *  - add-server: server D joins; only the keys on its new arc move, against
 *    hash mod N going from 3 to 4 (computed per key).
 *  - remove-server: server B leaves; only its keys move, to the next server
 *    clockwise, against mod 3 → mod 2.
 *  - virtual-nodes: 1,200 keys over three servers with 1, 4 and 32 points
 *    each; the counts per server come from the same lookup.
 *
 * The servers' names (`cache-A` …) and the user ids are the example's
 * inputs, picked so keys sit apart on the ring and D's arc holds keys; the
 * checks below throw if a hash ever stops giving the picture the captions
 * describe.
 */

/** FNV-1a then the murmur3 finaliser: a cheap hash whose top bits are well mixed. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** Where a name sits on the ring, in degrees clockwise from the top (monotonic in the hash). */
const degOf = (s: string) => (hash(s) / 2 ** 32) * 360;

const R = 112;
/** Ring points one degree apart, clockwise from the top: positions are looked up here. */
const RIM = ring(360, 0, 0, R);
const RIM_OUT = ring(360, 0, 0, R + 30);
const at = (deg: number, pts = RIM): Pt => pts[Math.round(deg) % 360];
const polar = (deg: number, r: number): Pt => ({ x: round(r * Math.sin((deg * Math.PI) / 180)), y: round(-r * Math.cos((deg * Math.PI) / 180)) });

interface Point {
  name: string;
  deg: number;
}

/** The first point clockwise from `deg` (a key exactly on a point belongs to it). */
function ownerOf(deg: number, points: readonly Point[]): string {
  let best: Point | null = null;
  let dist = Infinity;
  for (const p of points) {
    const d = (p.deg - deg + 360) % 360;
    if (d < dist) {
      dist = d;
      best = p;
    }
  }
  return best!.name;
}

/** The clockwise arc from `from` to `to` as a polyline on the ring. */
function arc(id: string, from: number, to: number, o: { tone?: "accent" | "error" | "line"; width?: number; r?: number } = {}): Item {
  const span = (to - from + 360) % 360;
  const steps = Math.max(2, Math.ceil(span / 4));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const p = polar(from + (span * i) / steps, o.r ?? R);
    pts.push([p.x, p.y]);
  }
  return { k: "path", id, pts, tone: o.tone ?? "accent", width: o.width ?? 4 };
}

const circle = (id = "ring"): Item => arc(id, 0, 359.9, { tone: "line", width: 1.6 });

const SERVERS: Point[] = ["A", "B", "C"].map((n) => ({ name: n, deg: degOf(`cache-${n}`) }));
const D: Point = { name: "D", deg: degOf("cache-D") };
const USERS = [62, 63, 66, 68, 69, 70, 74, 79];
const KEYS = USERS.map((u) => ({ id: u, deg: degOf(`user:${u}`) }));

// The picture's preconditions: keys clear of each other and of the servers, so no two marks overlap.
{
  const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  for (const k of KEYS) {
    if ([...SERVERS, D].some((s) => gap(s.deg, k.deg) < 12)) throw new Error(`consistent-hashing: user:${k.id} sits on a server`);
    if (KEYS.some((o) => o !== k && gap(o.deg, k.deg) < 10)) throw new Error(`consistent-hashing: user:${k.id} overlaps another key`);
  }
}

/** A server's mark on the ring and its name outside it. */
function serverItems(s: Point, tone: "plain" | "accent" | "strong" | "muted" | "error" = "plain", sub?: string): Item[] {
  const p = at(s.deg);
  const o = at(s.deg, RIM_OUT);
  const items: Item[] = [{ k: "node", id: `s-${s.name}`, x: p.x, y: p.y, r: 15, text: s.name, tone, size: 12 }];
  const anchor = o.x > 8 ? "start" : o.x < -8 ? "end" : "middle";
  items.push(label(`s-${s.name}-t`, sub ?? `${Math.round(s.deg)}°`, o.x + (anchor === "start" ? -6 : anchor === "end" ? 6 : 0), o.y + (o.y > 0 ? 6 : -2), { anchor, size: 11, tone: tone === "muted" ? "faint" : tone === "error" ? "error" : "soft" }));
  return items;
}

/** Where the k-th key parked at server `s` waits: inside the ring, two abreast, rows stacked towards the centre. */
function parked(s: Point, k: number): Pt {
  const r = R - 34 - Math.floor(k / 2) * 24;
  const side = k % 2 === 0 ? -1 : 1;
  const c = polar(s.deg, r);
  // Step sideways (perpendicular to the radius) so the two columns sit either side of it.
  const t = (s.deg * Math.PI) / 180;
  return { x: round(c.x + side * 12 * Math.cos(t)), y: round(c.y + side * 12 * Math.sin(t)) };
}

/** Each key's slot at its owner: in key order, except that a key whose owner did not change keeps the slot it had in `prior`. */
function slots(points: readonly Point[], prior?: Map<number, { owner: string; slot: number }>): Map<number, { owner: string; slot: number }> {
  const out = new Map<number, { owner: string; slot: number }>();
  const used = new Map<string, Set<number>>();
  const take = (o: string, n: number) => (used.get(o) ?? used.set(o, new Set()).get(o)!).add(n);
  const moved: Array<{ id: number; owner: string }> = [];
  for (const k of KEYS) {
    const o = ownerOf(k.deg, points);
    const was = prior?.get(k.id);
    if (prior && was && was.owner === o) {
      out.set(k.id, was);
      take(o, was.slot);
    } else if (prior) moved.push({ id: k.id, owner: o });
    else {
      const n = used.get(o)?.size ?? 0;
      out.set(k.id, { owner: o, slot: n });
      take(o, n);
    }
  }
  for (const m of moved) {
    let n = 0;
    while (used.get(m.owner)?.has(n)) n++;
    out.set(m.id, { owner: m.owner, slot: n });
    take(m.owner, n);
  }
  return out;
}

/** Every key parked at its owner, in the given slots. */
function parkAll(points: readonly Point[], at: Map<number, { owner: string; slot: number }>, tone: (id: number) => "plain" | "accent" | "strong" | "muted" = () => "plain"): Item[] {
  return KEYS.map((k) => {
    const { owner, slot } = at.get(k.id)!;
    return packet(`k${k.id}`, parked(points.find((p) => p.name === owner)!, slot), { text: k.id, tone: tone(k.id) });
  });
}

/* ── Ring lookup ──────────────────────────────────────────────────── */

function ringLookup(): Walkthrough {
  const frames: Frame[] = [];
  const owners = KEYS.map((k) => ownerOf(k.deg, SERVERS));
  for (let t = 0; t <= KEYS.length + 1; t++) {
    const items: Item[] = [circle()];
    const cur = t >= 1 && t <= KEYS.length ? t - 1 : -1;
    if (cur >= 0) {
      const s = SERVERS.find((p) => p.name === owners[cur])!;
      // Stop short of the key's and the server's circles so the line never runs through their labels.
      items.push(arc("walk", KEYS[cur].deg + 6, s.deg - 9));
    }
    const done = SERVERS.map((s) => owners.slice(0, Math.max(0, t - 1)).filter((o) => o === s.name).length);
    SERVERS.forEach((s, i) => items.push(...serverItems(s, cur >= 0 && owners[cur] === s.name ? "accent" : "plain", t > KEYS.length ? `${Math.round(s.deg)}° · ${done[i]} keys` : undefined)));
    const slot = slots(SERVERS);
    KEYS.forEach((k, j) => {
      if (j > cur && cur >= 0) return;
      if (cur < 0 && t === 0) return;
      if (j === cur) {
        items.push(packet(`k${k.id}`, at(k.deg), { text: k.id, tone: "accent" }));
        return;
      }
      const o = owners[j];
      items.push(packet(`k${k.id}`, parked(SERVERS.find((p) => p.name === o)!, slot.get(k.id)!.slot), { text: k.id, tone: t > KEYS.length ? "strong" : "plain" }));
    });
    const caption =
      t === 0
        ? `Each server's address is hashed to a point on a ring of 0–360°: A lands at ${Math.round(SERVERS[0].deg)}°, B at ${Math.round(SERVERS[1].deg)}° and C at ${Math.round(SERVERS[2].deg)}°.`
        : cur >= 0
          ? `user:${KEYS[cur].id} hashes to ${Math.round(KEYS[cur].deg)}°. Walking clockwise from there, the first server it meets is ${owners[cur]}, so ${owners[cur]} stores it.`
          : `All ${KEYS.length} keys placed: ${SERVERS.map((s, i) => `${s.name} holds ${done[i]}`).join(", ")}. A lookup needs only the sorted server positions and one binary search.`;
    frames.push({ caption, items });
  }
  return finish({ title: "A hash ring: each key belongs to the first server clockwise from it", input: "", frames });
}

/* ── Changing the pool, against mod N ─────────────────────────────── */

/** The mod-N table: each key's server under `hash mod before` and, once shown, `hash mod after`. */
function modTable(x: number, before: string[], after: string[] | null, ringMoved: Set<number>): Item[] {
  const items: Item[] = [];
  const W = [62, 50, 50];
  const H = 22;
  const y0 = -R + 6;
  items.push(label("th0", "key", x + W[0] / 2, y0 - 12, { size: 11, tone: "soft" }));
  items.push(label("th1", `mod ${before.length}`, x + W[0] + 4 + W[1] / 2, y0 - 12, { size: 11, tone: "soft" }));
  if (after) items.push(label("th2", `mod ${after.length}`, x + W[0] + W[1] + 8 + W[2] / 2, y0 - 12, { size: 11, tone: "soft" }));
  KEYS.forEach((k, i) => {
    const y = y0 + i * (H + 3);
    const h = hash(`user:${k.id}`);
    const b = before[h % before.length];
    items.push(box(`tk${i}`, x, y, `user:${k.id}`, { w: W[0], h: H, size: 11, tone: ringMoved.has(k.id) ? "accent" : "plain" }));
    items.push(box(`tb${i}`, x + W[0] + 4, y, b, { w: W[1], h: H, size: 11 }));
    if (after) {
      const a = after[h % after.length];
      items.push(box(`ta${i}`, x + W[0] + W[1] + 8, y, a, { w: W[2], h: H, size: 11, tone: a !== b ? "error" : "plain" }));
    }
  });
  return items;
}

/** Of the residues mod lcm(a, b), the fraction a uniform hash keeps on the same index: the long-run share mod N leaves in place. */
function modStayShare(a: number, b: number): number {
  let lcm = a;
  while (lcm % b) lcm += a;
  let stay = 0;
  for (let r = 0; r < lcm; r++) if (r % a === r % b) stay++;
  return stay / lcm;
}

function addServer(): Walkthrough {
  const before = SERVERS;
  const after = [...SERVERS, D];
  const ownBefore = new Map(KEYS.map((k) => [k.id, ownerOf(k.deg, before)]));
  const ownAfter = new Map(KEYS.map((k) => [k.id, ownerOf(k.deg, after)]));
  const moved = new Set(KEYS.filter((k) => ownBefore.get(k.id) !== ownAfter.get(k.id)).map((k) => k.id));
  for (const id of moved) if (ownAfter.get(id) !== "D") throw new Error("consistent-hashing: a key moved to a server other than the new one");
  const prev = [...before].sort((a, b) => ((D.deg - a.deg + 360) % 360) - ((D.deg - b.deg + 360) % 360))[0];
  const modBefore = ["A", "B", "C"];
  const modAfter = ["A", "B", "C", "D"];
  const modMoved = KEYS.filter((k) => modBefore[hash(`user:${k.id}`) % 3] !== modAfter[hash(`user:${k.id}`) % 4]).length;
  if (moved.size < 1 || moved.size >= modMoved) throw new Error("consistent-hashing: the ring should move fewer keys than mod N here");
  const stay = modStayShare(3, 4);
  const slotsBefore = slots(before);
  const slotsAfter = slots(after, slotsBefore);
  const TX = R + 72;
  const frames: Frame[] = [];
  const draw = (stage: number, caption: string) => {
    const items: Item[] = [circle()];
    if (stage >= 1) items.push(arc("newarc", prev.deg + 8, D.deg - 8));
    before.forEach((s) => items.push(...serverItems(s)));
    if (stage >= 1) items.push(...serverItems(D, stage === 1 ? "accent" : "strong"));
    items.push(...(stage >= 2 ? parkAll(after, slotsAfter, (id) => (moved.has(id) ? "accent" : "plain")) : parkAll(before, slotsBefore)));
    if (stage >= 3) items.push(...modTable(TX, modBefore, stage >= 4 ? modAfter : null, moved));
    frames.push({ caption, items });
  };
  draw(0, `Three servers and ${KEYS.length} keys, each key stored on the first server clockwise from it. Now the pool grows: server D is added.`);
  draw(1, `D hashes to ${Math.round(D.deg)}°, between ${prev.name} and the next server. It takes over only the arc from ${prev.name} (${Math.round(prev.deg)}°) up to itself; every other arc is untouched.`);
  draw(2, `Only the keys on that arc move: ${moved.size} of ${KEYS.length} (${[...moved].map((id) => `user:${id}`).join(", ")}), all from ${[...new Set([...moved].map((id) => ownBefore.get(id)))].join(", ")} to D. No other server's keys change hands.`);
  draw(3, `Compare plain modulo hashing, server = hash(key) mod N: with three servers each key's index is hash mod 3. The ${moved.size} keys the ring moved are highlighted.`);
  draw(4, `Adding D makes it hash mod 4, and ${modMoved} of ${KEYS.length} keys change server (red). On average mod N moves ${Math.round((1 - stay) * 100)}% of keys going from 3 to 4; the ring moves only the new arc's share.`);
  return finish({ title: "Adding a server: the ring moves one arc of keys, mod N moves most of them", input: "", frames });
}

function removeServer(): Walkthrough {
  const gone = SERVERS[1];
  const after = SERVERS.filter((s) => s !== gone);
  const ownBefore = new Map(KEYS.map((k) => [k.id, ownerOf(k.deg, SERVERS)]));
  const ownAfter = new Map(KEYS.map((k) => [k.id, ownerOf(k.deg, after)]));
  const moved = new Set(KEYS.filter((k) => ownBefore.get(k.id) !== ownAfter.get(k.id)).map((k) => k.id));
  for (const id of moved) if (ownBefore.get(id) !== gone.name) throw new Error("consistent-hashing: a key moved that was not on the removed server");
  const heirs = [...new Set([...moved].map((id) => ownAfter.get(id)))];
  if (heirs.length !== 1) throw new Error("consistent-hashing: the removed server's keys should all go to its clockwise neighbour");
  const modBefore = ["A", "B", "C"];
  const modAfter = ["A", "C"];
  const modMoved = KEYS.filter((k) => modBefore[hash(`user:${k.id}`) % 3] !== modAfter[hash(`user:${k.id}`) % 2]).length;
  if (moved.size >= modMoved) throw new Error("consistent-hashing: the ring should move fewer keys than mod N on removal");
  const prev = [...after].sort((a, b) => ((gone.deg - a.deg + 360) % 360) - ((gone.deg - b.deg + 360) % 360))[0];
  const slotsBefore = slots(SERVERS);
  const slotsAfter = slots(after, slotsBefore);
  const TX = R + 72;
  const frames: Frame[] = [];
  const draw = (stage: number, caption: string) => {
    const items: Item[] = [circle()];
    const heir = after.find((p) => p.name === heirs[0])!;
    if (stage === 1) items.push(arc("lost", prev.deg + 8, gone.deg - 8, { tone: "error" }));
    // Once B is gone its arc is part of the heir's: the heir now owns everything from the server before B up to itself.
    if (stage >= 2) items.push(arc("lost", prev.deg + 8, heir.deg - 8));
    after.forEach((s) => items.push(...serverItems(s, stage === 2 && s.name === heirs[0] ? "accent" : "plain")));
    items.push(...serverItems(gone, stage === 0 ? "plain" : stage === 1 ? "error" : "muted", stage >= 2 ? "removed" : undefined));
    items.push(...(stage >= 2 ? parkAll(after, slotsAfter, (id) => (moved.has(id) ? "accent" : "plain")) : parkAll(SERVERS, slotsBefore, (id) => (stage >= 1 && moved.has(id) ? "accent" : "plain"))));
    if (stage >= 3) items.push(...modTable(TX, modBefore, modAfter, moved));
    frames.push({ caption, items });
  };
  draw(0, `The same ring: A, B and C share ${KEYS.length} keys. Now server B fails and has to leave the pool.`);
  draw(1, `B owned the arc from ${prev.name} (${Math.round(prev.deg)}°) to itself (${Math.round(gone.deg)}°), holding ${moved.size} keys. Those keys now have no server.`);
  draw(2, `Each of B's keys keeps walking clockwise and reaches ${heirs[0]}, so ${moved.size} keys move, all to ${heirs[0]}. ${heirs[0]}'s arc now runs from ${prev.name} to itself; no other key moves.`);
  draw(3, `With mod N, losing B turns hash mod 3 into hash mod 2: ${modMoved} of ${KEYS.length} keys change server (red), including keys that were never on B.`);
  return finish({ title: "Removing a server: only its own keys move, to the next server clockwise", input: "", frames });
}

/* ── Virtual nodes ────────────────────────────────────────────────── */

function virtualNodes(): Walkthrough {
  const KEYCOUNT = 1200;
  const keyDegs = Array.from({ length: KEYCOUNT }, (_, i) => degOf(`user:${i}`));
  const names = ["A", "B", "C"];
  const pointsFor = (v: number): Point[] => names.flatMap((n) => Array.from({ length: v }, (_, j) => ({ name: n, deg: degOf(`shard-${n}#${j}`) })));
  const countsFor = (pts: Point[]) => {
    const sorted = [...pts].sort((a, b) => a.deg - b.deg);
    const c = new Map(names.map((n) => [n, 0]));
    for (const d of keyDegs) {
      const p = sorted.find((q) => q.deg >= d) ?? sorted[0];
      c.set(p.name, c.get(p.name)! + 1);
    }
    return names.map((n) => c.get(n)!);
  };
  const share = (pts: Point[], name: string) => {
    const sorted = [...pts].sort((a, b) => a.deg - b.deg);
    let own = 0;
    sorted.forEach((p, i) => {
      if (p.name !== name) return;
      const before = sorted[(i - 1 + sorted.length) % sorted.length];
      own += (p.deg - before.deg + 360) % 360 || 360;
    });
    return own / 360;
  };
  const VS = [1, 4, 16, 64];
  const sets = VS.map(pointsFor);
  const counts = sets.map(countsFor);
  const spread = counts.map((c) => Math.max(...c) / Math.min(...c));
  if (!spread.every((x, i) => i === 0 || x < spread[i - 1])) throw new Error("consistent-hashing: more virtual nodes should even the load in this example");
  const heavy = names[counts[0].indexOf(Math.max(...counts[0]))];
  const BX = R + 70;
  const BASE = R - 10;
  const UNIT = 160 / Math.max(...counts.flat());
  const even = KEYCOUNT / names.length;
  const frames: Frame[] = [];
  const draw = (si: number, showBars: boolean, highlight: boolean, caption: string) => {
    const pts = sets[si];
    const items: Item[] = [circle()];
    if (highlight) {
      const sorted = [...pts].sort((a, b) => a.deg - b.deg);
      sorted.forEach((p, i) => {
        if (p.name !== heavy) return;
        const before = sorted[(i - 1 + sorted.length) % sorted.length];
        items.push(arc(`own${i}`, before.deg, p.deg));
      });
    }
    pts.forEach((p, idx) => {
      const j = idx % VS[si];
      const pos = at(p.deg);
      const big = VS[si] === 1;
      items.push({ k: "node", id: `v${p.name}${j}`, x: pos.x, y: pos.y, r: big ? 11 : VS[si] <= 16 ? 5 : 3, text: big ? p.name : "", tone: p.name === heavy ? "accent" : "plain", size: 11 });
    });
    items.push(label("vlabel", VS[si] === 1 ? "1 point per server" : `${VS[si]} points per server`, 0, -6, { size: 12, tone: "ink", weight: 600 }));
    if (VS[si] > 1) items.push(label("vkey", `${heavy}'s points in blue`, 0, 12, { size: 11 }));
    if (showBars) {
      items.push(...bars("b", counts[si], { x: BX, base: BASE, unit: UNIT, w: 44, gap: 14, tone: (i) => (names[i] === heavy ? "accent" : "plain") }));
      names.forEach((n, i) => items.push(label(`bn${i}`, n, BX + 22 + i * 58, BASE + 14, { size: 12, tone: "ink" })));
      const ey = round(BASE - even * UNIT);
      items.push({ k: "path", id: "even", pts: [[BX - 6, ey], [BX + 3 * 58 - 8, ey]], tone: "ink", dashed: true, width: 1 });
      items.push(label("even-t", `even: ${even}`, BX + 3 * 58 - 4, ey, { anchor: "start", size: 11 }));
      items.push(label("bt", `keys per server (of ${KEYCOUNT})`, BX + 80, BASE + 34, { size: 11 }));
    }
    frames.push({ caption, items });
  };
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  draw(0, false, true, `With one point per server, the arcs are as uneven as the hashes fall: ${heavy} owns the arc before it, ${pct(share(sets[0], heavy))} of the whole ring.`);
  draw(0, true, true, `Hash ${KEYCOUNT} keys onto the ring and ${heavy} stores ${counts[0][names.indexOf(heavy)]} of them, against ${counts[0].filter((_, i) => names[i] !== heavy).join(" and ")} for the others: ${spread[0].toFixed(1)}× between busiest and idlest.`);
  draw(1, true, true, `Give each server ${VS[1]} virtual nodes (hash "${heavy}#0", "${heavy}#1", …). ${heavy}'s share is now ${VS[1]} smaller arcs scattered round the ring, and the counts are ${counts[1].join(" / ")}.`);
  draw(2, true, true, `At ${VS[2]} points per server ${heavy}'s arcs are short and spread all round the ring: ${counts[2].join(" / ")} keys, ${spread[2].toFixed(2)}× between busiest and idlest.`);
  draw(3, true, false, `At ${VS[3]} points each: ${counts[3].join(" / ")}, within ${spread[3].toFixed(2)}×. More points per server gives smaller, more even arcs, and a leaving server's keys scatter over many neighbours instead of one.`);
  return finish({ title: "Virtual nodes: many points per server even out the load", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "ring-lookup": ringLookup,
  "add-server": addServer,
  "remove-server": removeServer,
  "virtual-nodes": virtualNodes,
};
