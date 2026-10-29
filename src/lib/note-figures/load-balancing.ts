import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { label } from "../lesson-figures/kit.js";
import { packet, service, wire, type NodeBox } from "./sd-kit.js";

/**
 * Load Balancing: the note's figures (content/notes/system-design/
 * load-balancing.md). Every figure loops (a points subject), and every
 * choice it draws is made by running the policy it names:
 *
 *  - round-robin: six requests through a round-robin balancer to three
 *    servers, as a pipeline (each frame moves every request one stop).
 *  - least-connections: requests of different lengths arriving one a second;
 *    the balancer counts each server's open connections and picks the fewest.
 *  - health-checks: a server misses checks, is taken out of rotation after
 *    two misses in a row and put back after two passes.
 *  - ip-hash: clients pinned to servers by hashing their address, then one
 *    server removed and the hash taken over two — the clients that move.
 */

const SERVERS = ["S1", "S2", "S3"];
const SX = 330;
const SY = (i: number) => i * 66;

/** The fixed picture: clients, the balancer, three servers. */
function stage(o: { serverTone?: (i: number) => "plain" | "accent" | "strong" | "muted" | "error"; sub?: (i: number) => string; lbSub?: string } = {}) {
  const clients = service("clients", 0, SY(1), "Clients", { w: 92 });
  const lb = service("lb", 152, SY(1), "Load balancer", { w: 116, sub: o.lbSub });
  const servers: NodeBox[] = SERVERS.map((s, i) => service(`s${i}`, SX, SY(i), s, { w: 92, tone: o.serverTone?.(i) ?? "plain", sub: o.sub?.(i) }));
  return { clients, lb, servers };
}

/* ── Round robin ──────────────────────────────────────────────────── */

function roundRobin(): Walkthrough {
  const N = 6;
  const target = Array.from({ length: N }, (_, j) => j % SERVERS.length);
  const frames: Frame[] = [];
  for (let t = 0; t <= N + 1; t++) {
    // Request j (0-based) waits at the clients in frame j, is at the balancer in j + 1 and on its server in j + 2.
    const served = target.filter((_, j) => j + 2 <= t);
    const count = SERVERS.map((_, i) => served.filter((s) => s === i).length);
    const { clients, lb, servers } = stage({ sub: (i) => `${count[i]} served`, serverTone: (i) => (t >= 2 && target[t - 2] === i ? "accent" : "plain") });
    const items: Item[] = [...clients.items, ...lb.items, wire("c-lb", clients.right, lb.left)];
    servers.forEach((s, i) => items.push(wire(`lb-s${i}`, lb.right, s.left, { tone: t >= 2 && target[t - 2] === i ? "accent" : "line" }), ...s.items));
    for (let j = 0; j < N; j++) {
      const at = t - j;
      if (at === 0) items.push(packet(`r${j}`, { x: clients.mid.x, y: clients.top.y - 16 }, { text: j + 1 }));
      else if (at === 1) items.push(packet(`r${j}`, { x: lb.mid.x, y: lb.top.y - 16 }, { text: j + 1 }));
      else if (at === 2) items.push(packet(`r${j}`, { x: servers[target[j]].right.x + 16, y: servers[target[j]].mid.y }, { text: j + 1, tone: "strong" }));
    }
    const caption =
      t === 0
        ? "Requests arrive at the load balancer, which keeps a pointer to the next server in a fixed order: S1, S2, S3, then S1 again."
        : t <= N && t >= 2
          ? `Request ${t - 1} goes to ${SERVERS[target[t - 2]]}, the server whose turn it was; the pointer moves on to ${SERVERS[(target[t - 2] + 1) % SERVERS.length]}, while request ${t} reaches the balancer.`
          : t === 1
            ? "Request 1 reaches the load balancer. Round robin asks nothing about the servers — it only reads whose turn it is."
            : `Request ${N} lands on ${SERVERS[target[N - 1]]}. Six requests, ${count.join("/")} each: an even spread, as long as every request costs the same.`;
    frames.push({ caption, items });
  }
  return finish({ title: "Round robin: each server takes the next request in turn", input: "", frames });
}

/* ── Least connections ────────────────────────────────────────────── */

function leastConnections(): Walkthrough {
  // Request j arrives at second j + 1 and holds its connection for `lasts[j]` seconds.
  const lasts = [6, 1, 1, 5, 1, 2, 1];
  const open: Array<Array<{ j: number; ends: number }>> = SERVERS.map(() => []);
  const frames: Frame[] = [];
  const picks: number[] = [];
  const W = 26;
  const draw = (now: number, incoming: number | null, chose: number | null, caption: string) => {
    const lb = service("lb", 0, SY(1), "Load balancer", { w: 116 });
    const items: Item[] = [...lb.items, label("clock", `t = ${now}s`, 58, SY(1) - 18, { tone: "soft", size: 11, mono: true })];
    SERVERS.forEach((s, i) => {
      const box = service(`s${i}`, 180, SY(i), s, { w: 64, tone: chose === i ? "accent" : "plain" });
      items.push(wire(`lb-s${i}`, lb.right, box.left, { tone: chose === i ? "accent" : "line" }), ...box.items);
      items.push(label(`n${i}`, `${open[i].length} open`, 180 + 64 + 8 + 4 * (W + 4) + 6, SY(i) + 23, { anchor: "start", tone: chose === i ? "accent" : "soft", size: 11 }));
      open[i].forEach((c, k) => items.push({ k: "cell", id: `c${c.j}`, x: 252 + k * (W + 4), y: SY(i) + 6, w: W, h: 26, text: String(c.ends - now), tone: c.j === chose ? "accent" : "plain", size: 11 }));
    });
    if (incoming !== null) items.push({ k: "cell", id: `c${incoming}`, x: 45, y: SY(1) + 44, w: W, h: 26, text: String(lasts[incoming]), tone: "accent", size: 11 });
    frames.push({ caption, items });
  };
  draw(1, 0, null, "Each request holds a connection for a different time (the number on it, in seconds). The balancer counts every server's open connections.");
  for (let j = 0; j < lasts.length; j++) {
    const now = j + 1;
    for (const list of open) for (let k = list.length - 1; k >= 0; k--) if (list[k].ends <= now) list.splice(k, 1);
    const fewest = Math.min(...open.map((l) => l.length));
    const pick = open.findIndex((l) => l.length === fewest);
    const counts = open.map((l) => l.length);
    open[pick].push({ j, ends: now + lasts[j] });
    picks.push(pick);
    const tie = counts.filter((c) => c === fewest).length > 1;
    const caption = `At ${now}s a ${lasts[j]}-second request arrives. Open connections are ${counts.join(", ")}, so it goes to ${SERVERS[pick]}${tie ? ", the first of the servers tied for fewest" : ", the least busy"}.`;
    draw(now, j + 1 < lasts.length ? j + 1 : null, pick, caption);
  }
  // Check the claim the note makes: the two long requests do not pile onto one server.
  const longOn = new Set(picks.filter((_, j) => lasts[j] >= 5));
  if (longOn.size < 2) throw new Error("least-connections: both long requests went to one server");
  return finish({ title: "Least connections: the next request goes to the server with the fewest open", input: "", frames });
}

/* ── Health checks ────────────────────────────────────────────────── */

function healthChecks(): Walkthrough {
  const FALL = 2; // misses in a row before a server is taken out
  const RISE = 2; // passes in a row before it is put back
  // What S2 answers to each round of checks; S1 and S3 always answer.
  const s2 = [true, false, false, false, true, true];
  let up = [true, true, true];
  let misses = 0;
  let passes = 0;
  const frames: Frame[] = [];
  s2.forEach((ok, round) => {
    const was = up[1];
    if (ok) {
      misses = 0;
      passes += 1;
      if (!up[1] && passes >= RISE) up = [true, true, true];
    } else {
      passes = 0;
      misses += 1;
      if (up[1] && misses >= FALL) up = [true, false, true];
    }
    const rotation = SERVERS.filter((_, i) => up[i]);
    const { lb, servers } = stage({
      lbSub: `rotation: ${rotation.join(", ")}`,
      serverTone: (i) => (i === 1 && !up[1] ? "muted" : i === 1 && !ok ? "error" : "plain"),
      sub: (i) => (i !== 1 ? "healthy" : !up[1] ? `out · ${passes} pass${passes === 1 ? "" : "es"}` : ok ? "healthy" : `${misses} miss${misses === 1 ? "" : "es"}`),
    });
    const items: Item[] = [...lb.items];
    servers.forEach((s, i) => {
      const pass = i !== 1 || ok;
      items.push(wire(`chk${i}`, lb.right, s.left, { tone: pass ? "line" : "error", dashed: true, label: pass ? "200" : "timeout" }), ...s.items);
    });
    items.push(label("round", `check round ${round + 1}`, lb.mid.x, SY(0) + 8, { tone: "soft", size: 11 }));
    const caption =
      ok && was === up[1]
        ? round === 0
          ? `Every few seconds the balancer calls each server's health endpoint. All three answer 200, so all three stay in rotation.`
          : `S2 answers again (${passes} pass${passes === 1 ? "" : "es"} in a row); it needs ${RISE} before it is trusted with traffic again.`
        : ok
          ? `A second pass in a row: S2 is put back into rotation and traffic is spread over all three servers again.`
          : was && !up[1]
            ? `A ${FALL === misses ? "second" : "further"} miss in a row: S2 is taken out of rotation. Requests now go only to ${rotation.join(" and ")} — users never see S2's errors.`
            : up[1]
              ? `S2 times out once. One miss could be a blip, so the balancer keeps it in rotation until ${FALL} misses in a row.`
              : `S2 is still failing its checks; it stays out, and ${rotation.join(" and ")} carry all the traffic.`;
    frames.push({ caption, items });
  });
  if (!up[1]) throw new Error("health-checks: S2 should be back in rotation by the last round");
  return finish({ title: "Health checks: a failing server is taken out, then put back", input: "", frames });
}

/* ── IP hash ──────────────────────────────────────────────────────── */

/** FNV-1a over the address's characters: the same address always gives the same number. */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function ipHash(): Walkthrough {
  const ips = ["10.0.0.4", "10.0.0.9", "10.0.1.7", "10.0.2.3", "10.0.3.8"];
  const three = ips.map((ip) => fnv(ip) % 3);
  const two = ips.map((ip) => fnv(ip) % 2);
  const moved = ips.filter((_, i) => three[i] !== two[i]).length;
  if (new Set(three).size < 3) throw new Error("ip-hash: the example should reach all three servers");
  const CY = (i: number) => i * 44;
  const SYH = (i: number) => 22 + i * 66;
  const frames: Frame[] = [];
  const draw = (upTo: number, servers: number, map: number[], caption: string, movedMark = false) => {
    const items: Item[] = [];
    const cs = ips.map((ip, i) => service(`c${i}`, 0, CY(i), ip, { w: 100, h: 32, size: 11, tone: i === upTo ? "accent" : "plain" }));
    const ss = SERVERS.map((s, i) => service(`s${i}`, 290, SYH(i), s, { w: 80, tone: i >= servers ? "muted" : "plain", sub: i >= servers ? "removed" : undefined }));
    ss.forEach((s) => items.push(...s.items));
    cs.forEach((c, i) => {
      items.push(...c.items);
      if (i > upTo) return;
      const changed = movedMark && three[i] !== map[i];
      items.push(wire(`w${i}`, c.right, ss[map[i]].left, { tone: i === upTo || changed ? "accent" : "faint" }));
    });
    frames.push({ caption, items });
  };
  draw(-1, 3, three, "Some apps keep a user's session in one server's memory. IP hash pins each client to a server by hashing its address, so no table is needed.");
  ips.forEach((ip, i) => draw(i, 3, three, `hash(${ip}) mod 3 = ${three[i]}, so ${ip} goes to ${SERVERS[three[i]]} — and every later request from it does too.`));
  draw(ips.length, 2, two, `S3 is removed and the hash is now taken mod 2: ${moved} of ${ips.length} clients land on a different server and lose their session. Consistent hashing moves far fewer.`, true);
  return finish({ title: "IP hash: the same client always reaches the same server", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "round-robin": roundRobin,
  "least-connections": leastConnections,
  "health-checks": healthChecks,
  "ip-hash": ipHash,
};
