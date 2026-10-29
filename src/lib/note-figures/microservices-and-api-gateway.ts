import { finish, link, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, region } from "../lesson-figures/kit.js";
import { packet, service, wire, type NodeBox } from "./sd-kit.js";

/**
 * Microservices and API Gateway: the note's figures (content/notes/
 * system-design/microservices-and-api-gateway.md). Every figure loops (a
 * points subject), and what each draws is computed by running the thing:
 *
 *  - monolith-vs-services: two code changes shipped both ways; what is
 *    redeployed is the change's deploy unit (the whole app vs one service).
 *  - api-gateway: five requests through a gateway that checks the token,
 *    counts each client's requests against a limit and routes by path prefix.
 *  - service-discovery: instances register and heartbeat to a registry with
 *    a TTL; one crashes and expires; a caller's lookups follow the table.
 *  - circuit-breaker: the closed → open → half-open state machine run on a
 *    downstream that fails for a while and then recovers.
 */

/* ── Monolith vs microservices ────────────────────────────────────── */

function monolithVsServices(): Walkthrough {
  const MODULES = ["users", "orders", "payments", "search"];
  const changes = ["payments", "search"];
  // Versions after each deploy: the monolith ships as one unit, a service as itself.
  let app = 1;
  const svc: Record<string, number> = Object.fromEntries(MODULES.map((m) => [m, 1]));
  let monoRedeploys = 0;
  let svcRedeploys = 0;
  const RH = 34;
  const frames: Frame[] = [];
  const draw = (edited: string | null, deployed: string | null, caption: string, settled = false) => {
    const items: Item[] = [...region("mono", 0, 18, 130, MODULES.length * RH + 14, `Monolith · app v${app}`, { tone: deployed ? "accent" : "ghost", labelTone: deployed ? "accent" : "soft" })];
    MODULES.forEach((m, i) => {
      const tone: Tone = deployed ? "accent" : m === edited ? "accent" : "plain";
      items.push(box(`m-${m}`, 12, 26 + i * RH, m, { w: 106, h: 26, size: 11, tone }));
    });
    items.push(label("svc-h", "Services · one deploy each", 190, 9, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    MODULES.forEach((m, i) => {
      const tone: Tone = m === deployed ? "accent" : m === edited ? "accent" : settled && changes.includes(m) ? "strong" : "plain";
      items.push(box(`s-${m}`, 190, 26 + i * RH, `${m} v${svc[m]}`, { w: 118, h: 26, size: 11, tone }));
      items.push(box(`db-${m}`, 322, 26 + i * RH, "db", { w: 34, h: 26, size: 10, tone: "plain" }));
      items.push(wire(`w-${m}`, { x: 308, y: 39 + i * RH }, { x: 322, y: 39 + i * RH }, { head: false }));
    });
    frames.push({ caption, items });
  };
  draw(null, null, "The same four features built two ways: one monolith, deployed as a single unit, and four services, each with its own code, database and deploy.");
  for (const c of changes) {
    draw(c, null, `A developer changes the ${c} code. In both designs only the ${c} logic is touched.`);
    app += 1;
    svc[c] += 1;
    monoRedeploys += MODULES.length;
    svcRedeploys += 1;
    draw(c, c, `Shipping it: the monolith is rebuilt, retested and redeployed whole as app v${app} — all ${MODULES.length} modules restart. Only the ${c} service is redeployed, as ${c} v${svc[c]}.`);
    // The deploy units must be what the caption says.
    if (svcRedeploys !== changes.indexOf(c) + 1) throw new Error("monolith-vs-services: a service deploy should ship one service");
  }
  draw(null, null, `After ${changes.length} changes the monolith has restarted ${monoRedeploys} module copies and the services ${svcRedeploys}. Each team ships alone, at the price of a network between the parts.`, true);
  return finish({ title: "Monolith vs microservices: what one change redeploys", input: "", frames });
}

/* ── API gateway ──────────────────────────────────────────────────── */

const SERVICES = ["users", "orders", "products"];
const SY = (i: number) => i * 66;

function apiGateway(): Walkthrough {
  const LIMIT = 2; // requests per client in this window
  const reqs = [
    { client: "A", path: "/users/7", token: true },
    { client: "A", path: "/orders/12", token: true },
    { client: "B", path: "/products/3", token: false },
    { client: "B", path: "/orders/15", token: true },
    { client: "A", path: "/users/9", token: true },
  ];
  // Run the gateway: authenticate, then count against the client's limit, then route by the path's first segment.
  const used: Record<string, number> = {};
  const outcome = reqs.map((r) => {
    if (!r.token) return { status: 401, to: -1, why: "no token" };
    used[r.client] = (used[r.client] ?? 0) + 1;
    if (used[r.client] > LIMIT) return { status: 429, to: -1, why: `client ${r.client} over ${LIMIT}` };
    const to = SERVICES.indexOf(r.path.split("/")[1]);
    if (to < 0) throw new Error(`api-gateway: no route for ${r.path}`);
    return { status: 200, to, why: SERVICES[to] };
  });
  if (!outcome.some((o) => o.status === 401) || !outcome.some((o) => o.status === 429)) throw new Error("api-gateway: the example should show both refusals");
  const tag = (j: number) => `${reqs[j].client}${j + 1}`;
  const N = reqs.length;
  const frames: Frame[] = [];
  for (let t = 0; t <= N + 1; t++) {
    const atGw = t >= 1 && t <= N ? t - 1 : null;
    const landed = t >= 2 ? t - 2 : null;
    const o = atGw !== null ? outcome[atGw] : null;
    const clients = service("clients", 0, SY(1), "Clients", { w: 84 });
    const gw = service("gw", 150, SY(1), "API gateway", { w: 112, sub: atGw !== null ? `${reqs[atGw].path} → ${o!.status === 200 ? o!.why : o!.status}` : "auth · limit · route", subTone: o && o.status !== 200 ? "error" : atGw !== null ? "accent" : "soft" });
    const lastTo = landed !== null ? outcome[landed].to : -1;
    const svcs: NodeBox[] = SERVICES.map((s, i) => service(`s${i}`, 340, SY(i), s, { w: 92, tone: i === lastTo ? "accent" : "plain" }));
    const items: Item[] = [...clients.items, ...gw.items, wire("c-gw", clients.right, gw.left)];
    svcs.forEach((s, i) => items.push(wire(`gw-s${i}`, gw.right, s.left, { tone: i === lastTo ? "accent" : "line" }), ...s.items));
    for (let j = 0; j < N; j++) {
      const at = t - j;
      if (at === 0) items.push(packet(`r${j}`, { x: clients.mid.x, y: clients.top.y - 16 }, { text: tag(j) }));
      else if (at === 1) items.push(packet(`r${j}`, { x: gw.mid.x, y: gw.top.y - 16 }, { text: tag(j) }));
      else if (at === 2 && outcome[j].to >= 0) items.push(packet(`r${j}`, { x: svcs[outcome[j].to].right.x + 16, y: svcs[outcome[j].to].mid.y }, { text: tag(j), tone: "strong" }));
      else if (at === 2) {
        items.push(packet(`r${j}`, { x: gw.left.x - 22, y: gw.bottom.y + 40 }, { text: tag(j), tone: "error" }));
        items.push(label("rej", `${outcome[j].status} · ${outcome[j].why}`, gw.left.x - 4, gw.bottom.y + 44, { anchor: "start", tone: "error", size: 11 }));
      }
    }
    let caption: string;
    if (t === 0) caption = `Clients send every request to one address, the gateway. It checks the token, counts each client's requests against a limit of ${LIMIT}, then routes by the path.`;
    else {
      const parts: string[] = [];
      if (landed !== null) {
        const ol = outcome[landed];
        parts.push(
          ol.status === 200
            ? `${tag(landed)} (${reqs[landed].path}) is forwarded to the ${ol.why} service`
            : ol.status === 401
              ? `${tag(landed)} carries no token, so the gateway answers 401 and no service sees it`
              : `${tag(landed)} is client ${reqs[landed].client}'s request number ${LIMIT + 1}, over the limit: 429 at the gateway`,
        );
      }
      if (atGw !== null) parts.push(`${tag(atGw)} reaches the gateway${landed === null ? ", which reads its token and path" : ""}`);
      caption = t === N + 1 ? `${parts[0]}. Auth and rate limiting ran once, at the edge, so the services hold only their own logic.` : `${parts.join("; ")}.`;
      caption = caption.charAt(0).toUpperCase() + caption.slice(1);
    }
    frames.push({ caption, items });
  }
  return finish({ title: "API gateway: one entry point that authenticates, limits and routes", input: "", frames });
}

/* ── Service discovery ────────────────────────────────────────────── */

function serviceDiscovery(): Walkthrough {
  const TTL = 30; // seconds without a heartbeat before an entry is dropped
  const instances = [
    { name: "orders-1", addr: "10.0.1.5", diesAt: 15 },
    { name: "orders-2", addr: "10.0.2.8", diesAt: Infinity },
  ];
  type Step = { t: number; kind: "intro" | "register" | "heartbeat" | "lookup" | "call"; who?: number };
  const script: Step[] = [
    { t: 0, kind: "intro" },
    { t: 0, kind: "register", who: 0 },
    { t: 0, kind: "register", who: 1 },
    { t: 10, kind: "lookup" },
    { t: 10, kind: "call" },
    { t: 20, kind: "heartbeat", who: 1 },
    { t: 30, kind: "heartbeat", who: 1 },
    { t: 40, kind: "heartbeat", who: 1 },
    { t: 40, kind: "lookup" },
    { t: 40, kind: "call" },
  ];
  // Run the registry: every live instance heartbeats each 10 s; an entry older than the TTL is removed.
  const seen = new Map<number, number>();
  let list: number[] = [];
  let calls = 0;
  let lastCall = -1;
  const frames: Frame[] = [];
  const checkout = service("checkout", 0, 34, "checkout", { w: 88 });
  const registry = service("reg", 170, 150, "Registry", { w: 110 });
  const inst = (i: number, t: number, tone: Tone) =>
    service(`i${i}`, 400, 10 + i * 76, instances[i].name, { w: 96, tone: t >= instances[i].diesAt ? "muted" : tone, sub: t >= instances[i].diesAt ? "crashed" : instances[i].addr });
  script.forEach((s) => {
    for (const [i, inst0] of instances.entries()) if (s.t > 0 && s.t % 10 === 0 && s.t < inst0.diesAt && seen.has(i)) seen.set(i, s.t);
    if (s.kind === "register") seen.set(s.who!, s.t);
    const expired = [...seen.entries()].filter(([, at]) => s.t - at >= TTL).map(([i]) => i);
    expired.forEach((i) => seen.delete(i));
    if (s.kind === "lookup") list = [...seen.keys()].sort();
    if (s.kind === "call") {
      lastCall = list[calls % list.length];
      calls += 1;
      if (s.t >= instances[lastCall].diesAt) throw new Error("service-discovery: a call went to a crashed instance");
    }
    const tones = instances.map((_, i) => ((s.kind === "register" || s.kind === "heartbeat") && s.who === i) || (s.kind === "call" && lastCall === i) ? "accent" : "plain") as Tone[];
    const boxes = instances.map((_, i) => inst(i, s.t, tones[i]));
    const items: Item[] = [...checkout.items, ...registry.items, ...boxes.flatMap((b) => b.items)];
    items.push(label("clock", `t = ${s.t}s`, 0, 4, { anchor: "start", tone: "soft", size: 11, mono: true }));
    // The registry's table.
    const rows = [...seen.entries()].sort((a, b) => a[0] - b[0]);
    items.push(label("tbl-h", `table (TTL ${TTL}s)`, 110, 208, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    rows.forEach(([i, at], r) => {
      const fresh = (s.kind === "register" || s.kind === "heartbeat") && s.who === i;
      const stale = s.t >= instances[i].diesAt;
      const tone: Tone = fresh ? "accent" : stale ? "error" : "plain";
      items.push(box(`row${i}-n`, 110, 218 + r * 28, instances[i].name, { w: 70, h: 24, size: 10, tone }));
      items.push(box(`row${i}-a`, 184, 218 + r * 28, instances[i].addr, { w: 70, h: 24, size: 10, tone }));
      items.push(box(`row${i}-s`, 258, 218 + r * 28, `${s.t - at}s ago`, { w: 56, h: 24, size: 10, tone }));
    });
    let caption = "";
    const name = (i: number) => instances[i].name;
    if (s.kind === "intro") caption = "Instances come and go as they scale and crash, so the caller cannot hard-code addresses. It asks a registry, which knows who is alive.";
    else if (s.kind === "register") {
      items.push(wire("msg", boxes[s.who!].left, registry.right, { tone: "accent", label: "register" }));
      caption = `${name(s.who!)} starts and registers its address, ${instances[s.who!].addr}, with the registry.`;
    } else if (s.kind === "heartbeat") {
      items.push(wire("msg", boxes[s.who!].left, registry.right, { tone: "accent", dashed: true, label: "heartbeat" }));
      const dead = instances.findIndex((x) => s.t >= x.diesAt);
      caption = expired.length
        ? `${name(expired[0])} has been silent for ${TTL} seconds, so its entry expires and is removed; ${name(s.who!)} still heartbeats.`
        : seen.has(dead)
          ? `${name(s.who!)} sends its heartbeat. ${name(dead)} crashed at ${instances[dead].diesAt}s and has gone quiet for ${s.t - seen.get(dead)!}s, short of the ${TTL}s TTL, so it is still listed.`
          : `${name(s.who!)} sends its heartbeat; the registry resets its age to 0.`;
    } else if (s.kind === "lookup") {
      items.push(wire("msg", checkout.bottom, registry.left, { tone: "accent", label: "where is orders?" }));
      caption = `checkout asks the registry for "orders" and gets ${list.length} address${list.length === 1 ? "" : "es"}: ${list.map((i) => instances[i].addr).join(" and ")}.`;
    } else {
      items.push(wire("msg", checkout.right, boxes[lastCall].left, { tone: "accent" }));
      caption =
        calls === 1
          ? `checkout picks ${name(lastCall)} from the list and calls it directly; the registry is not in the request path.`
          : `The new list has only ${name(lastCall)}, so the call reaches a live instance — no one edited a config file.`;
    }
    frames.push({ caption, items });
  });
  return finish({ title: "Service discovery: instances register, callers look them up", input: "", frames });
}

/* ── Circuit breaker ──────────────────────────────────────────────── */

type BState = "closed" | "open" | "half-open";

function circuitBreaker(): Walkthrough {
  const THRESHOLD = 3; // failures in a row that open the breaker
  const COOL = 3; // ticks the breaker stays open before a probe
  const healthy = (t: number) => t === 1 || t >= 10; // the downstream fails from tick 2 to tick 9
  const T = 12;
  // Run the state machine on one call per tick.
  let state: BState = "closed";
  let fails = 0;
  let openedAt = 0;
  const log: Array<{ t: number; from: BState; to: BState; result: "ok" | "fail" | "fast"; probe: boolean; fails: number }> = [];
  for (let t = 1; t <= T; t++) {
    const from = state;
    let result: "ok" | "fail" | "fast";
    let probe = false;
    if (state === "open" && t - openedAt >= COOL) {
      state = "half-open";
      probe = true;
    }
    if (state === "open") result = "fast";
    else {
      result = healthy(t) ? "ok" : "fail";
      if (state === "half-open") {
        state = result === "ok" ? "closed" : "open";
        if (state === "open") openedAt = t;
        fails = 0;
      } else if (result === "fail") {
        fails += 1;
        if (fails >= THRESHOLD) {
          state = "open";
          openedAt = t;
        }
      } else fails = 0;
    }
    log.push({ t, from, to: state, result, probe, fails });
  }
  if (state !== "closed") throw new Error("circuit-breaker: the breaker should close once the downstream recovers");
  if (log.some((l) => l.result === "fast" && l.from !== "open")) throw new Error("circuit-breaker: only an open breaker fails fast");

  const POS: Record<BState, { x: number; y: number }> = { closed: { x: 50, y: 50 }, open: { x: 350, y: 50 }, "half-open": { x: 200, y: 170 } };
  const R = 36;
  const EDGES: Array<{ id: string; a: BState; b: BState; text: string; bow?: number }> = [
    { id: "c-o", a: "closed", b: "open", text: `${THRESHOLD} failures in a row` },
    { id: "o-h", a: "open", b: "half-open", text: `after ${COOL} ticks`, bow: 46 },
    { id: "h-o", a: "half-open", b: "open", text: "probe fails", bow: 46 },
    { id: "h-c", a: "half-open", b: "closed", text: "probe ok" },
  ];
  const CX = 2;
  const CY = 252;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const l = k > 0 ? log[k - 1] : null;
    const now: BState = l ? l.to : "closed";
    const taken = new Set<string>();
    if (l) {
      if (l.probe) taken.add("o-h");
      if (l.from !== l.to || l.probe) {
        const a = l.probe ? "half-open" : l.from;
        const e = EDGES.find((x) => x.a === a && x.b === l.to);
        if (e) taken.add(e.id);
      }
    }
    const items: Item[] = [];
    for (const e of EDGES) items.push(link(e.id, POS[e.a], POS[e.b], R, { arrow: true, bow: e.bow, label: e.text, tone: (taken.has(e.id) ? (e.b === "open" ? "error" : "accent") : "line") as LineTone }));
    (Object.keys(POS) as BState[]).forEach((s) => {
      const tone: Tone = s === now ? (s === "open" ? "error" : "accent") : "plain";
      items.push({ k: "node", id: `st-${s}`, x: POS[s].x, y: POS[s].y, r: R, text: s === "half-open" ? "Half-open" : s === "open" ? "Open" : "Closed", tone, size: 11 });
    });
    items.push(label("fails", `failures in a row: ${l ? l.fails : 0}`, POS.closed.x, POS.closed.y - R - 10, { tone: l && l.fails > 0 && l.to === "closed" ? "error" : "soft", size: 11 }));
    items.push(label("calls-h", "calls, one per tick", CX, CY - 26, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    log.forEach((c, i) => {
      const x = CX + i * 33;
      if (i >= k) {
        items.push(box(`c${i}`, x, CY, "", { w: 29, h: 24, tone: "ghost" }));
        return;
      }
      const tone: Tone = c.result === "fail" ? "error" : c.result === "fast" ? "muted" : i === k - 1 ? "accent" : "strong";
      items.push(box(`c${i}`, x, CY, c.result, { w: 29, h: 24, size: 10, tone }));
      if (c.probe) items.push(label(`p${i}`, "probe", x + 14.5, CY + 36, { tone: "soft", size: 9 }));
    });
    if (k > 0) items.push({ k: "ptr", id: "now", x: CX + (k - 1) * 33 + 14.5, y: CY - 2, label: "", tone: "accent", up: false });
    frames.push({ caption, items });
  };
  draw(0, `Each call to a downstream service goes through a breaker. Closed passes calls; ${THRESHOLD} failures in a row open it, and an open breaker refuses calls at once.`);
  log.forEach((c, i) => {
    let caption: string;
    if (c.probe) caption = c.to === "closed" ? `Tick ${c.t}: another probe, and the service answers. The breaker closes and normal traffic resumes.` : `Tick ${c.t}: ${COOL} ticks have passed, so one probe call is let through. It fails, and the breaker opens again for another ${COOL} ticks.`;
    else if (c.result === "fast") caption = `Tick ${c.t}: the breaker is open, so the call fails fast without touching the struggling service — no threads wait on timeouts.`;
    else if (c.to === "open") caption = `Tick ${c.t}: failure ${c.fails} in a row reaches the threshold. The breaker opens, stopping the failure from spreading to every caller.`;
    else if (c.result === "fail") caption = `Tick ${c.t}: the downstream call fails (failure ${c.fails} in a row). Still under ${THRESHOLD}, so the breaker stays closed.`;
    else caption = c.t === 1 ? `Tick ${c.t}: the call succeeds; the breaker stays closed.` : `Tick ${c.t}: calls pass normally again, and the failure count stays at 0.`;
    if (i === log.length - 1) caption = `Tick ${c.t}: closed and healthy. Over ${T} calls the breaker spared the failing service ${log.filter((x) => x.result === "fast").length} calls it could not have answered.`;
    draw(i + 1, caption);
  });
  return finish({ title: "Circuit breaker: closed, open, half-open, run on a failing service", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "monolith-vs-services": monolithVsServices,
  "api-gateway": apiGateway,
  "service-discovery": serviceDiscovery,
  "circuit-breaker": circuitBreaker,
};
