import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { bars, box, label } from "../lesson-figures/kit.js";
import { along, database, packet, service, wire } from "./sd-kit.js";

/**
 * Database Sharding: the note's figures (content/notes/system-design/
 * database-sharding.md). Every figure loops, and every placement it draws is
 * computed by running the partitioning rule it names:
 *
 *  - range-vs-hash: eight keys through range sharding (by first letter) and
 *    hash sharding (FNV-1a mod 3), side by side.
 *  - hot-shard: sequential order ids under range and hash sharding — the
 *    writes each shard receives, counted.
 *  - resharding: twelve keys under hash mod 3, then mod 4; the keys whose
 *    shard changes are counted and moved.
 *  - scatter-gather: a query by the shard key reaches one shard; a top-3
 *    query without it fans out to every shard, and the router merges the
 *    local answers (checked against the true top 3 of all rows).
 */

/** FNV-1a over the key's characters: the same key always gives the same number. */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/* ── Range vs hash ────────────────────────────────────────────────── */

function rangeVsHash(): Walkthrough {
  const keys = ["alice", "chen", "farah", "kiran", "maya", "priya", "ravi", "zoe"];
  const RANGES = [
    { name: "A–H", lo: "a", hi: "h" },
    { name: "I–P", lo: "i", hi: "p" },
    { name: "Q–Z", lo: "q", hi: "z" },
  ];
  const rangeOf = (k: string) => RANGES.findIndex((r) => k[0] >= r.lo && k[0] <= r.hi);
  const hashOf = (k: string) => fnv(k) % 3;
  const placed = keys.map((k) => ({ k, r: rangeOf(k), h: hashOf(k) }));
  const SX = (i: number) => 120 + i * 118;
  const PY = (p: number) => p * 176;
  const frames: Frame[] = [];
  const draw = (landed: number, caption: string) => {
    const items: Item[] = [];
    [0, 1].forEach((p) => {
      const py = PY(p);
      items.push(label(`t${p}`, p === 0 ? "Range: by first letter" : "Hash: FNV-1a(key) mod 3", 0, py + 6, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
      const counts = [0, 0, 0];
      for (let i = 0; i < 3; i++) items.push(box(`s${p}-${i}`, SX(i), py + 22, p === 0 ? `Shard ${RANGES[i].name}` : `Shard ${i}`, { w: 100, h: 30, size: 11 }));
      placed.forEach((x, j) => {
        const id = `k${p}-${j}`;
        const shard = p === 0 ? x.r : x.h;
        if (j < landed) {
          const n = counts[shard]++;
          if (n >= 4) throw new Error("range-vs-hash: a shard's column would overflow");
          items.push(box(id, SX(shard) + 10, py + 62 + n * 26, x.k, { w: 80, h: 22, size: 11, tone: j === landed - 1 ? "accent" : "plain" }));
        } else if (j === landed) {
          items.push(box(id, 0, py + 62, x.k, { w: 80, h: 22, size: 11, tone: "ghost" }));
        }
      });
      if (landed === keys.length) items.push(label(`c${p}`, `rows per shard: ${counts.join(" / ")}`, 0, py + 100, { anchor: "start", size: 11, tone: "accent" }));
    });
    frames.push({ caption, items });
  };
  draw(0, "Each row has a shard key. Range sharding gives each shard a span of keys; hash sharding hashes the key and takes the result mod the shard count.");
  placed.forEach((x, j) =>
    draw(j + 1, `"${x.k}" starts with ${x.k[0]}, so range sharding stores it on ${RANGES[x.r].name}; FNV-1a("${x.k}") mod 3 = ${x.h}, so hash sharding stores it on shard ${x.h}.`),
  );
  const rc = [0, 1, 2].map((i) => placed.filter((x) => x.r === i).length);
  const hc = [0, 1, 2].map((i) => placed.filter((x) => x.h === i).length);
  frames[frames.length - 1].caption += ` Range keeps neighbours together (${rc.join("/")}), so "names a to d" reads one shard; hash scatters them (${hc.join("/")}).`;
  return finish({ title: "Range vs hash sharding: where the same keys land", input: "", frames });
}

/* ── Hot shard ────────────────────────────────────────────────────── */

function hotShard(): Walkthrough {
  const BATCH = 3;
  const BATCHES = 4;
  const FIRST = 2001; // the next order id; shard 3's range starts here
  const rangeShard = (id: number) => (id <= 1000 ? 0 : id <= 2000 ? 1 : 2);
  const hashShard = (id: number) => fnv(String(id)) % 3;
  const range = [0, 0, 0];
  const hash = [0, 0, 0];
  const UNIT = 9;
  const BASE = 150;
  const frames: Frame[] = [];
  const draw = (caption: string, hot: boolean) => {
    const items: Item[] = [];
    [0, 1].forEach((p) => {
      const x0 = p * 250;
      const vals = p === 0 ? range : hash;
      const max = Math.max(...vals);
      items.push(label(`t${p}`, p === 0 ? "Range by order id" : "Hash of order id, mod 3", x0, 8, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
      items.push(...bars(`b${p}-`, vals, { x: x0 + 10, base: BASE, unit: UNIT, w: 50, gap: 16, tone: (i) => (vals[i] === 0 ? "ghost" : p === 0 && hot && vals[i] === max ? "error" : "accent") }));
      const names = p === 0 ? ["1–1000", "1001–2000", "2001+"] : ["shard 0", "shard 1", "shard 2"];
      names.forEach((n, i) => items.push(label(`n${p}-${i}`, n, x0 + 10 + i * 66 + 25, BASE + 14, { size: 10, tone: "soft" })));
      items.push({ k: "path", id: `base${p}`, pts: [[x0 + 4, BASE], [x0 + 200, BASE]], tone: "ink", width: 1 });
    });
    frames.push({ caption, items });
  };
  draw(`New orders get increasing ids, starting at ${FIRST}. Ids up to 2000 are taken, so under range sharding each new id falls in the last range; hash sharding hashes the id first.`, false);
  for (let b = 0; b < BATCHES; b++) {
    const ids = Array.from({ length: BATCH }, (_, k) => FIRST + b * BATCH + k);
    const hs = ids.map(hashShard);
    ids.forEach((id, k) => {
      range[rangeShard(id)] += 1;
      hash[hs[k]] += 1;
    });
    const last = b === BATCHES - 1;
    draw(
      last
        ? `After ${BATCHES * BATCH} orders, range sharding has put ${range[2]} of them on one shard: a hot shard, while the other two get no new writes. Hashing spread them ${hash.join("/")}.`
        : `Orders ${ids[0]}–${ids[ids.length - 1]} arrive. Range sends all ${BATCH} to the 2001+ shard; hashing sends them to shards ${hs.join(", ")}.`,
      last,
    );
  }
  if (range[2] !== BATCH * BATCHES) throw new Error("hot-shard: every new order should land on the last range");
  if (Math.max(...hash) > (BATCH * BATCHES) / 2) throw new Error("hot-shard: hashing should spread the orders");
  return finish({ title: "A hot shard: sequential keys under range sharding all hit one shard", input: "", frames });
}

/* ── Resharding with modulo ───────────────────────────────────────── */

function resharding(): Walkthrough {
  const keys = Array.from({ length: 12 }, (_, i) => `user${i + 1}`);
  const h = keys.map(fnv);
  const before = h.map((v) => v % 3);
  const after = h.map((v) => v % 4);
  const movers = keys.map((_, i) => i).filter((i) => before[i] !== after[i]);
  if (movers.length <= keys.length / 2) throw new Error("resharding: the example should move most keys");
  const ideal = keys.filter((_, i) => after[i] === 3).length; // the keys the new shard must take, at the least
  const half = Math.ceil(movers.length / 2);
  if (movers.filter((i) => after[i] !== 3).length * 2 <= movers.length) throw new Error("resharding: most movers should move between old shards");
  const SX = (i: number) => i * 112;
  const frames: Frame[] = [];
  // home(i, stage): which shard key i sits on; stage counts how many movers have gone.
  const draw = (moved: number, o: { shards: 3 | 4; mark: boolean; settled?: boolean }, caption: string) => {
    const items: Item[] = [];
    const home = (i: number) => (movers.indexOf(i) >= 0 && movers.indexOf(i) < moved ? after[i] : before[i]);
    for (let s = 0; s < 4; s++) {
      if (s === 3 && o.shards === 3) continue;
      const n = keys.filter((_, i) => home(i) === s).length;
      items.push(box(`s${s}`, SX(s), 0, `Shard ${s}`, { w: 96, h: 30, size: 11, tone: s === 3 ? "accent" : "plain" }));
      items.push(label(`c${s}`, `${n} keys`, SX(s) + 48, 44, { size: 10, tone: "soft" }));
    }
    const slot = [0, 0, 0, 0];
    keys.forEach((k, i) => {
      const s = home(i);
      const isMover = movers.includes(i);
      const gone = isMover && movers.indexOf(i) < moved;
      const tone = o.settled ? (isMover ? "accent" : "plain") : gone ? "strong" : o.mark && isMover ? "accent" : "plain";
      items.push(box(`k${i}`, SX(s) + 8, 56 + slot[s]++ * 25, k, { w: 80, h: 21, size: 10, tone }));
    });
    frames.push({ caption, items });
  };
  draw(0, { shards: 3, mark: false }, `Twelve keys placed by hash(key) mod 3. A key's shard is fixed by its hash, so any server can work out where it lives.`);
  draw(0, { shards: 4, mark: true }, `A fourth shard is added, so the rule becomes hash mod 4. For ${movers.length} of the ${keys.length} keys (marked) the answer changes.`);
  draw(half, { shards: 4, mark: true }, `The marked keys must be copied to their new shards. Most of them move between old shards, not into the new one.`);
  draw(movers.length, { shards: 4, mark: true }, `All ${movers.length} keys have moved. During the move, reads must know whether a key has been copied yet.`);
  draw(movers.length, { shards: 4, mark: false, settled: true }, `${movers.length} of ${keys.length} keys moved, yet the new shard only needed ${ideal}. Consistent hashing moves close to that minimum.`);
  return finish({ title: "Resharding with mod N: adding one shard moves most keys", input: "", frames });
}

/* ── Scatter–gather ───────────────────────────────────────────────── */

function scatterGather(): Walkthrough {
  const rows = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, score: ((i + 1) * 37) % 100 }));
  const shardOf = (id: number) => fnv(String(id)) % 3;
  const local = [0, 1, 2].map((s) => rows.filter((r) => shardOf(r.id) === s).map((r) => r.score).sort((a, b) => b - a).slice(0, 3));
  const merged = local.flat().sort((a, b) => b - a).slice(0, 3);
  const truth = rows.map((r) => r.score).sort((a, b) => b - a).slice(0, 3);
  if (merged.join() !== truth.join()) throw new Error("scatter-gather: merging local top-3s must give the true top 3");
  const POINT = 7;
  const pointShard = shardOf(POINT);
  const pointScore = rows.find((r) => r.id === POINT)!.score;
  const RY = (i: number) => i * 84;
  const frames: Frame[] = [];
  const draw = (stage: number, caption: string) => {
    const items: Item[] = [];
    const router = service("router", 0, RY(1), "Router", { w: 90 });
    const shards = [0, 1, 2].map((s) => database(`d${s}`, 200, RY(s), `Shard ${s}`, { w: 90, sub: `${rows.filter((r) => shardOf(r.id) === s).length} rows`, tone: (stage === 1 && s === pointShard) || stage === 3 ? "accent" : "plain" }));
    items.push(...router.items);
    shards.forEach((d, s) => items.push(wire(`w${s}`, router.right, d.left, { tone: (stage === 1 && s === pointShard) || stage === 3 || stage === 5 ? "accent" : "line" }), ...d.items));
    const query = stage <= 1 ? `WHERE user_id = ${POINT}` : "ORDER BY score DESC LIMIT 3";
    items.push(label("q", query, 0, -20, { anchor: "start", mono: true, size: 11, tone: "accent" }));
    if (stage === 0) items.push(packet("p", { x: router.right.x + 14, y: router.top.y - 14 }, { text: "Q" }));
    if (stage === 1) {
      const d = shards[pointShard];
      items.push(packet("p", along(router.right, d.left, 0.7), { text: "Q" }));
      items.push(label("pr", `score ${pointScore}`, 300, RY(pointShard) + 24, { anchor: "start", size: 11, tone: "accent" }));
    }
    shards.forEach((d, s) => {
      if (stage === 2) items.push(packet(`f${s}`, { x: router.right.x + 14, y: router.top.y - 14 }, { text: "Q" }));
      if (stage === 3) items.push(packet(`f${s}`, along(router.right, d.left, 0.7), { text: "Q" }));
      if (stage >= 4) local[s].forEach((v, k) => items.push(box(`l${s}-${k}`, 304 + k * 34, RY(s) + 6, v, { w: 30, h: 26, size: 11, tone: stage === 4 ? "accent" : "plain" })));
      if (stage === 5) items.push(packet(`f${s}`, along(router.right, d.left, 0.35), { text: 3, tone: "strong" }));
    });
    if (stage === 6) merged.forEach((v, k) => items.push(box(`m${k}`, k * 34, RY(1) + 52, v, { w: 30, h: 26, size: 11, tone: "strong" })));
    frames.push({ caption, items });
  };
  draw(0, `A query that names the shard key can be routed: the router computes FNV-1a("${POINT}") mod 3 = ${pointShard}.`);
  draw(1, `Only shard ${pointShard} is asked, and it answers with user ${POINT}'s row. A point lookup costs the same however many shards there are.`);
  draw(2, `Now "the top 3 scores overall". The query has no shard key, so the router cannot tell which shards hold the answer.`);
  draw(3, `It scatters the query to all 3 shards. Every shard does work for every such query, so adding shards does not make it cheaper.`);
  draw(4, `Each shard computes its own top 3: ${local.map((l) => l.join(", ")).join(" | ")}.`);
  draw(5, `The local answers travel back. The router must wait for the slowest shard, so one slow shard slows every scatter query.`);
  draw(6, `The router merges the ${local.flat().length} candidates into the true top 3: ${merged.join(", ")}. Choose a shard key that most queries include.`);
  return finish({ title: "Scatter–gather: a query without the shard key asks every shard", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "range-vs-hash": rangeVsHash,
  "hot-shard": hotShard,
  resharding,
  "scatter-gather": scatterGather,
};
