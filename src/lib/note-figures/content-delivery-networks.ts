import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { packet, service, wire } from "./sd-kit.js";

/**
 * Content Delivery Networks: the note's figures (content/notes/system-design/
 * content-delivery-networks.md). Every figure loops, and every number it
 * draws is computed by running the thing it names:
 *
 *  - edge-vs-origin: three users at stated (illustrative) distances, the
 *    round trip computed from the speed of light in fibre, first to a far
 *    origin and then to a near edge.
 *  - origin-pull: three requests for one file through an edge cache that
 *    starts empty — the first misses and fills it, the rest hit.
 *  - ttl-revalidation: an edge's copy with max-age 60 s, run against a list
 *    of requests and one deploy; expired copies are revalidated with
 *    If-None-Match and answered 304 or 200.
 *  - cache-key: five URLs through two cache-key policies (the full URL, and
 *    the URL with tracking parameters dropped and the rest sorted).
 */

/* ── Edge vs origin ───────────────────────────────────────────────── */

/** Light in optical fibre covers about 200 km per millisecond (≈ 2/3 of c). */
const FIBRE_KM_PER_MS = 200;
/** A first HTTPS request: TCP handshake, TLS 1.3 handshake, then the request — one round trip each. */
const FIRST_REQUEST_RTTS = 3;
const rttMs = (km: number) => (2 * km) / FIBRE_KM_PER_MS;

function edgeVsOrigin(): Walkthrough {
  const users = [
    { name: "User in Asia", origin: 13000, edge: 400 },
    { name: "User in Europe", origin: 6500, edge: 300 },
    { name: "User in S. America", origin: 7500, edge: 600 },
  ];
  const RY = (i: number) => i * 88;
  const toOrigin = users.map((u) => rttMs(u.origin));
  const toEdge = users.map((u) => rttMs(u.edge));
  toOrigin.forEach((r, i) => {
    if (toEdge[i] * 10 > r) throw new Error("edge-vs-origin: the edge should be at least ten times closer in time");
  });
  const frames: Frame[] = [];
  // phase 0 = no CDN, 1 = with edges; stop 0 = at the user, 1 = arrived, 2 = answered
  const draw = (phase: 0 | 1, stop: 0 | 1 | 2, caption: string) => {
    const items: Item[] = [];
    const origin = service("origin", 420, RY(1), "Origin", { w: 90, sub: "one region" });
    items.push(...origin.items);
    users.forEach((u, i) => {
      const sub =
        stop === 0
          ? phase === 0
            ? `${u.origin.toLocaleString("en-US")} km to origin`
            : `${u.edge} km to an edge`
          : stop === 1
            ? `RTT ≥ ${phase === 0 ? toOrigin[i] : toEdge[i]} ms`
            : `${FIRST_REQUEST_RTTS} RTTs ≥ ${FIRST_REQUEST_RTTS * (phase === 0 ? toOrigin[i] : toEdge[i])} ms`;
      const user = service(`u${i}`, 0, RY(i), u.name, { w: 128, size: 11, sub, subTone: stop === 2 ? "accent" : "soft" });
      items.push(...user.items);
      if (phase === 0) {
        items.push(wire(`uo${i}`, user.right, origin.left, { tone: stop === 1 ? "accent" : "line" }));
      } else {
        const edge = service(`e${i}`, 200, RY(i), "Edge", { w: 70, tone: stop === 1 ? "accent" : "plain" });
        items.push(...edge.items, wire(`ue${i}`, user.right, edge.left, { tone: stop === 1 ? "accent" : "line" }));
        items.push(wire(`eo${i}`, edge.right, origin.left, { tone: "faint", dashed: true }));
      }
      const at =
        stop === 1
          ? phase === 0
            ? { x: origin.mid.x + (i - 1) * 26, y: origin.top.y - 16 }
            : { x: 235, y: RY(i) - 16 }
          : { x: user.right.x - 14, y: RY(i) - 16 };
      items.push(packet(`p${i}`, at, { text: i + 1, tone: stop === 2 ? "strong" : "accent" }));
    });
    frames.push({ caption, items });
  };
  const km = users.map((u) => u.origin.toLocaleString("en-US")).join(", ");
  draw(0, 0, `Without a CDN every user fetches from one origin in one region. The distances here are illustrative: ${km} km.`);
  draw(0, 1, `Light in fibre covers about ${FIBRE_KM_PER_MS} km per millisecond, so a round trip takes at least 2 × distance ÷ ${FIBRE_KM_PER_MS}: ${toOrigin.join(", ")} ms, before the server does any work.`);
  draw(0, 2, `A first HTTPS request needs about ${FIRST_REQUEST_RTTS} round trips (TCP, TLS 1.3, the request), so the farthest user waits at least ${FIRST_REQUEST_RTTS * Math.max(...toOrigin)} ms on distance alone.`);
  draw(1, 0, `A CDN places edge servers near users and serves cached copies from them. Each user now talks to an edge a few hundred kilometres away.`);
  draw(1, 1, `The round trip to the edge is at least ${toEdge.join(", ")} ms. The handshakes happen with the edge too, not with the far origin.`);
  draw(1, 2, `Three round trips now cost ${toEdge.map((r) => FIRST_REQUEST_RTTS * r).join(", ")} ms instead of ${toOrigin.map((r) => FIRST_REQUEST_RTTS * r).join(", ")} ms, as long as the edge already holds the file.`);
  return finish({ title: "Why a nearby edge is faster: round trips computed from distance", input: "", frames });
}

/* ── Origin pull ──────────────────────────────────────────────────── */

function originPull(): Walkthrough {
  const PATH = "/logo.png";
  const TTL = 3600;
  const starts = [0, 3, 4]; // the frame each request leaves the users
  type Stop = "users" | "edge" | "origin" | "back" | "served";
  const cache = new Map<string, number>();
  let fetches = 0;
  // Work out each request's route by running the cache: the edge looks the path up when the request arrives.
  const routes: Array<{ stops: Stop[]; hit: boolean }> = [];
  const fillAt = new Set<number>();
  const last = Math.max(...starts) + 2; // the last request hits, so it is served two frames after it leaves
  const frames: Frame[] = [];
  for (let f = 0; f <= last; f++) {
    // A response back at the edge this frame is stored before any lookup this frame.
    if (fillAt.has(f)) {
      cache.set(PATH, TTL);
      fetches += 1;
    }
    starts.forEach((s, j) => {
      if (s + 1 !== f) return;
      const hit = cache.has(PATH);
      routes[j] = { hit, stops: hit ? ["users", "edge", "served"] : ["users", "edge", "origin", "back", "served"] };
      if (!hit) fillAt.add(s + 3);
    });
    const items: Item[] = [];
    const users = service("users", 0, 0, "Users", { w: 84 });
    const edge = service("edge", 170, 0, "Edge", { w: 96 });
    const origin = service("origin", 370, 0, "Origin", { w: 90, sub: `fetches: ${fetches}` });
    const stored = cache.has(PATH);
    items.push(...users.items, ...edge.items, ...origin.items);
    items.push(wire("ue", users.right, edge.left), wire("eo", edge.right, origin.left, { dashed: true, tone: "faint" }));
    items.push(box("slot", 143, 56, stored ? `${PATH} · cached` : "cache: empty", { w: 150, h: 26, size: 11, tone: stored ? "strong" : "ghost" }));
    let caption = "";
    starts.forEach((s, j) => {
      const at = f - s;
      if (at < 0) return;
      const route = routes[j] ?? { stops: ["users"] as Stop[], hit: false };
      const stop = route.stops[Math.min(at, route.stops.length - 1)];
      if (at > 0 && !routes[j]) return;
      const n = j + 1;
      const pos =
        stop === "users" ? { x: users.mid.x + 18, y: -16 }
          : stop === "edge" ? { x: edge.mid.x, y: -16 }
            : stop === "origin" ? { x: origin.mid.x, y: -16 }
              : stop === "back" ? { x: edge.mid.x, y: -16 }
                : { x: 14 + j * 24, y: 54 };
      const tone = stop === "served" ? "strong" : stop === "back" ? "strong" : "accent";
      items.push(packet(`r${j}`, pos, { text: n, tone }));
      if (stop === "edge" && route.hit) caption ||= j === 1 ? `Request ${n} reaches the edge and finds ${PATH} in its cache: a hit. The edge answers at once and the origin is not asked.` : `Request ${n} hits as well, while request ${n - 1} has already been answered from the edge in one short round trip.`;
      if (stop === "edge" && !route.hit) caption ||= `Request ${n} reaches the edge, whose cache is empty: a miss. The edge has nothing to serve yet.`;
      if (stop === "origin") caption ||= `On a miss the edge pulls the file from the origin itself. This is an origin-pull CDN: nothing is uploaded ahead of time.`;
      if (stop === "back") caption ||= `The origin's answer comes back through the edge, which stores a copy for as long as its Cache-Control allows (max-age=${TTL} here).`;
    });
    if (!caption) {
      if (f === 0) caption = `Users ask the nearest edge for ${PATH}. The edge starts with an empty cache.`;
      else if (f === last) {
        const hits = routes.filter((r) => r.hit).length;
        caption = `${starts.length} requests, ${fetches} origin fetch, ${hits} hits: once a file is cached, the origin only sees the first request per edge until the copy expires.`;
      } else caption = `Request 1 is served from the copy the origin sent, and the following requests are already on their way to the edge.`;
    }
    frames.push({ caption, items });
  }
  const hits = routes.filter((r) => r.hit).length;
  if (fetches !== 1 || hits !== starts.length - 1) throw new Error("origin-pull: expected one miss and the rest hits");
  return finish({ title: "Origin pull: the first request misses and fills the edge, later ones hit", input: "", frames });
}

/* ── TTL and revalidation ─────────────────────────────────────────── */

function ttlRevalidation(): Walkthrough {
  const MAX_AGE = 60;
  type Ev = { t: number; kind: "request" | "deploy" };
  const events: Ev[] = [
    { t: 0, kind: "request" },
    { t: 30, kind: "request" },
    { t: 75, kind: "request" },
    { t: 100, kind: "deploy" },
    { t: 120, kind: "request" },
    { t: 150, kind: "request" },
  ];
  let originVersion = 1;
  let copy: { version: number; freshUntil: number } | null = null;
  const T_MAX = 220;
  const X0 = 20;
  const XW = 460;
  const tx = (t: number) => X0 + (t / T_MAX) * XW;
  const AXIS = 150;
  const frames: Frame[] = [];
  let servedStale = false;
  for (const ev of events) {
    let exchange = "";
    let outcome = "";
    let contacted = false;
    let caption = "";
    if (ev.kind === "deploy") {
      originVersion += 1;
      caption = `At ${ev.t}s a deploy changes the file to v${originVersion} on the origin. The edge does not know: its copy of v${copy!.version} is fresh until ${copy!.freshUntil}s.`;
    } else if (!copy) {
      copy = { version: originVersion, freshUntil: ev.t + MAX_AGE };
      exchange = `GET → 200, v${originVersion}`;
      outcome = `v${copy.version} (miss)`;
      contacted = true;
      caption = `At ${ev.t}s the first request misses. The edge fetches v${copy.version} with Cache-Control: max-age=${MAX_AGE} and keeps it fresh until ${copy.freshUntil}s.`;
    } else if (ev.t < copy.freshUntil) {
      outcome = `v${copy.version} (hit)`;
      if (copy.version !== originVersion) servedStale = true;
      caption =
        copy.version === originVersion
          ? `At ${ev.t}s the copy is still fresh, so the edge serves it without asking the origin.`
          : `At ${ev.t}s the copy is still fresh by its TTL, so users get v${copy.version} although the origin has v${originVersion}. The TTL bounds how stale content can get.`;
    } else {
      contacted = true;
      const was = copy.version;
      if (originVersion === copy.version) {
        copy = { version: copy.version, freshUntil: ev.t + MAX_AGE };
        exchange = `If-None-Match: v${was} → 304`;
        outcome = `v${copy.version} (revalidated)`;
        caption = `At ${ev.t}s the copy has expired. The edge asks with If-None-Match; the origin answers 304 Not Modified, no body, and the copy is fresh until ${copy.freshUntil}s.`;
      } else {
        copy = { version: originVersion, freshUntil: ev.t + MAX_AGE };
        exchange = `If-None-Match: v${was} → 200, v${copy.version}`;
        outcome = `v${copy.version} (refetched)`;
        caption = `At ${ev.t}s the copy has expired again. This time the ETag no longer matches, so the origin sends 200 with v${copy.version} and users see the new file.`;
      }
    }
    const items: Item[] = [];
    const users = service("users", 0, 0, "Users", { w: 80, sub: outcome || " ", subTone: "accent" });
    const edge = service("edge", 160, 0, "Edge", { w: 96, tone: ev.kind === "request" && !contacted ? "accent" : "plain" });
    const origin = service("origin", 380, 0, "Origin", { w: 90, tone: contacted || ev.kind === "deploy" ? "accent" : "plain", sub: `has v${originVersion}` });
    items.push(...users.items, ...edge.items, ...origin.items);
    items.push(wire("ue", users.right, edge.left, { tone: ev.kind === "request" ? "accent" : "line" }));
    items.push(wire("eo", edge.right, origin.left, { tone: contacted ? "accent" : "faint", dashed: !contacted }));
    items.push(label("ex", exchange, (edge.right.x + origin.left.x) / 2, -14, { tone: "accent", size: 11, mono: true }));
    items.push(box("copy", 133, 54, copy ? `copy v${copy.version} · fresh to ${copy.freshUntil}s` : "no copy", { w: 150, h: 26, size: 11, tone: copy ? "strong" : "ghost" }));
    // The timeline: the copy's fresh window as a band, the event as a pointer.
    items.push({ k: "path", id: "axis", pts: [[X0, AXIS], [X0 + XW, AXIS]], tone: "ink", width: 1.2 });
    for (let t = 0; t <= T_MAX; t += 40) items.push(label(`tk${t}`, `${t}s`, tx(t), AXIS - 34, { tone: "faint", size: 10 }));
    if (copy) items.push({ k: "band", id: "fresh", x: tx(copy.freshUntil - MAX_AGE), y: AXIS - 22, w: tx(copy.freshUntil) - tx(copy.freshUntil - MAX_AGE), h: 18, tone: "strong" });
    items.push(label("fresh-t", "shaded: the copy's fresh window", X0 + XW, AXIS - 52, { tone: "faint", size: 10, anchor: "end" }));
    items.push({ k: "ptr", id: "now", x: tx(ev.t), y: AXIS + 2, label: ev.kind === "deploy" ? `deploy ${ev.t}s` : `${ev.t}s`, tone: ev.kind === "deploy" ? "ink" : "accent" });
    frames.push({ caption, items });
  }
  if (!servedStale) throw new Error("ttl-revalidation: the example should serve a stale copy inside its TTL");
  return finish({ title: "TTL and revalidation: fresh copies are served, expired ones are checked", input: "", frames });
}

/* ── Cache key ────────────────────────────────────────────────────── */

/** Drop tracking parameters (utm_*) and sort the rest, so equivalent URLs share one key. */
function normalise(url: string): string {
  const [path, query = ""] = url.split("?");
  const kept = query.split("&").filter((p) => p && !p.startsWith("utm_")).sort();
  return kept.length ? `${path}?${kept.join("&")}` : path;
}

function cacheKey(): Walkthrough {
  const urls = ["/a.png?w=200", "/a.png?w=200&utm_source=mail", "/a.png?w=400", "/a.png?utm_source=ad&w=200", "/a.png?w=400"];
  const full = new Set<string>();
  const norm = new Set<string>();
  const rows = urls.map((u) => {
    const k = normalise(u);
    const r = { url: u, key: k, fullHit: full.has(u), normHit: norm.has(k) };
    full.add(u);
    norm.add(k);
    return r;
  });
  const fullFetch = rows.filter((r) => !r.fullHit).length;
  const normFetch = rows.filter((r) => !r.normHit).length;
  if (normFetch >= fullFetch) throw new Error("cache-key: normalising should save origin fetches");
  const C1 = 0;
  const C2 = 200;
  const C3 = 280;
  const C4 = 400;
  const RH = 28;
  const ry = (i: number) => 28 + i * RH;
  const frames: Frame[] = [];
  const draw = (upTo: number, caption: string, totals = false) => {
    const items: Item[] = [
      label("h1", "Request URL", C1, 8, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("h2", "Key: full URL", C2 + 26, 8, { tone: "soft", size: 11, weight: 600 }),
      label("h3", "Key: no utm_*, sorted", C3 + 66, 8, { tone: "soft", size: 11, weight: 600 }),
    ];
    rows.forEach((r, i) => {
      if (i > upTo) return;
      const cur = i === upTo && !totals;
      const y = ry(i);
      items.push(label(`u${i}`, r.url, C1, y + 11, { anchor: "start", mono: true, size: 11, tone: cur ? "accent" : "ink" }));
      items.push(box(`f${i}`, C2, y, r.fullHit ? "HIT" : "MISS", { w: 52, h: 22, size: 10, tone: r.fullHit ? "strong" : "plain" }));
      items.push(label(`k${i}`, r.key, C3, y + 11, { anchor: "start", mono: true, size: 11, tone: cur ? "accent" : "ink" }));
      items.push(box(`n${i}`, C4, y, r.normHit ? "HIT" : "MISS", { w: 52, h: 22, size: 10, tone: r.normHit ? "strong" : "plain" }));
    });
    if (totals) {
      const y = ry(rows.length) + 8;
      items.push(label("tl", "origin fetches", C1, y + 11, { anchor: "start", size: 11, weight: 600 }));
      items.push(box("tf", C2, y, fullFetch, { w: 52, h: 22, size: 11, tone: "accent" }));
      items.push(box("tn", C4, y, normFetch, { w: 52, h: 22, size: 11, tone: "strong" }));
    }
    frames.push({ caption, items });
  };
  rows.forEach((r, i) => {
    const what =
      i === 0
        ? `The edge looks each request up by its cache key. ${r.url} is new under both keys, so both miss and fetch from the origin.`
        : r.fullHit && r.normHit
          ? `${r.url} was seen before, so both policies hit.`
          : !r.fullHit && r.normHit
            ? `${r.url} is a new string, so the full-URL key misses. Dropping the tracking parameter and sorting gives ${r.key}, already cached: a hit.`
            : `${r.url} asks for a different size, so it is a new object under either key and both miss.`;
    draw(i, what);
  });
  draw(rows.length - 1, `Same ${rows.length} requests: ${fullFetch} origin fetches with the raw URL as key, ${normFetch} with a normalised key. Keep in the key only what changes the response.`, true);
  return finish({ title: "Cache keys: the same file under two keys is fetched twice", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "edge-vs-origin": edgeVsOrigin,
  "origin-pull": originPull,
  "ttl-revalidation": ttlRevalidation,
  "cache-key": cacheKey,
};
