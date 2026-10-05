import { finish, link, ring, round, type Frame, type Item, type LineTone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, type Pt } from "../lesson-figures/kit.js";

/**
 * Introduction to Computer Networks: the note's figures
 * (content/notes/computer-networks/introduction-to-computer-networks.md
 * places each with "@figure <name>").
 *
 *  - topologies: the same five devices as a bus, a star, a ring and a full
 *    mesh, each drawn from its edge list; the link and port counts under
 *    each are counted off those lists (the mesh is checked against
 *    n(n − 1)/2).
 *  - domains: a router joining a switched LAN and a hub LAN. Collision and
 *    broadcast domains are computed by union-find over the links (a hub
 *    joins every link it touches into one collision domain; a hub or a
 *    switch joins them into one broadcast domain); the same function
 *    reproduces the note's table (8-port hub, 24-port switch, 3-interface
 *    router) or the module throws.
 *  - switching: circuit against packet switching for one three-packet
 *    message over two links, as space-time diagrams; the circuit's setup
 *    and the routers' store-and-forward are simulated link by link.
 *  - delay: the worked example (1,000 bytes, 10 Mbps, 2,000 km) as a
 *    space-time diagram, then the same path split by a router; every time
 *    is L/R and d/s from the note's numbers, checked against its table.
 */

/* ── Topologies ───────────────────────────────────────────────────── */

const NAMES = ["A", "B", "C", "D", "E"];

function topologies(): Walkthrough {
  const n = NAMES.length;
  const PW = 210;
  const PH = 196;
  const R = 13;
  const items: Item[] = [];
  const degree = (edges: ReadonlyArray<readonly [number, number]>, k: number) => edges.filter(([a, b]) => a === k || b === k).length;
  const host = (id: string, p: Pt): Item => ({ k: "node", id, x: p.x, y: p.y, r: R, text: NAMES[Number(id.slice(-1))], tone: "plain", size: 12 });
  const panel = (prefix: string, col: number, rowN: number, title: string, foot: string, draw: (x0: number, y0: number) => Item[]) => {
    const x0 = col * PW;
    const y0 = rowN * PH;
    items.push(label(`${prefix}t`, title, x0 + 90, y0, { tone: "ink", weight: 600, size: 12.5 }));
    items.push(...draw(x0, y0));
    items.push(label(`${prefix}f`, foot, x0 + 90, y0 + 156, { tone: "soft", size: 11.5 }));
  };

  // Bus: one backbone, a drop cable to each device, terminators at both ends.
  panel("b", 0, 0, "Bus", "1 shared cable, 1 port each", (x0, y0) => {
    const out: Item[] = [];
    const by = y0 + 80;
    out.push({ k: "path", id: "bb", pts: [[x0, by], [x0 + 180, by]], tone: "ink", width: 2.4 });
    out.push({ k: "path", id: "bt1", pts: [[x0, by - 7], [x0, by + 7]], tone: "ink", width: 2.4 });
    out.push({ k: "path", id: "bt2", pts: [[x0 + 180, by - 7], [x0 + 180, by + 7]], tone: "ink", width: 2.4 });
    for (let i = 0; i < n; i++) {
      const x = x0 + 18 + i * 36;
      const y = i % 2 === 0 ? by - 44 : by + 44;
      out.push({ k: "edge", id: `bd${i}`, x1: x, y1: y + (i % 2 === 0 ? R : -R), x2: x, y2: by, tone: "line" });
      out.push(host(`bn${i}`, { x, y }));
    }
    return out;
  });

  // Star: every device to a switch in the middle.
  const starEdges = NAMES.map((_, i) => [i, n] as const);
  if (starEdges.length !== n) throw new Error("topologies: a star has one link per device");
  panel("s", 1, 0, "Star", `${starEdges.length} links, switch has ${degree(starEdges, n)} ports`, (x0, y0) => {
    const c = { x: x0 + 90, y: y0 + 82 };
    const pos = ring(n, c.x, c.y, 54);
    const out: Item[] = starEdges.map(([a]) => link(`se${a}`, pos[a], c, R, { rb: 15 }));
    out.push(box("sc", c.x - 22, c.y - 13, "SW", { w: 44, h: 26, size: 11.5, tone: "accent" }));
    pos.forEach((p, i) => out.push(host(`sn${i}`, p)));
    return out;
  });

  // Ring: each device to the next, the last back to the first.
  const ringEdges = NAMES.map((_, i) => [i, (i + 1) % n] as const);
  const ringPorts = new Set(NAMES.map((_, k) => degree(ringEdges, k)));
  if (ringPorts.size !== 1) throw new Error("topologies: every ring device has the same port count");
  panel("r", 0, 1, "Ring", `${ringEdges.length} links, ${[...ringPorts][0]} ports each`, (x0, y0) => {
    const pos = ring(n, x0 + 90, y0 + 82, 56);
    const out: Item[] = ringEdges.map(([a, b]) => link(`re${a}`, pos[a], pos[b], R, { arrow: true }));
    pos.forEach((p, i) => out.push(host(`rn${i}`, p)));
    return out;
  });

  // Full mesh: every pair.
  const meshEdges: Array<readonly [number, number]> = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) meshEdges.push([a, b]);
  if (meshEdges.length !== (n * (n - 1)) / 2) throw new Error("topologies: a full mesh has n(n − 1)/2 links");
  const meshPorts = degree(meshEdges, 0);
  if (meshPorts !== n - 1) throw new Error("topologies: a full-mesh device has n − 1 ports");
  panel("m", 1, 1, "Full mesh", `${n}×${n - 1}/2 = ${meshEdges.length} links, ${meshPorts} ports each`, (x0, y0) => {
    const pos = ring(n, x0 + 90, y0 + 82, 56);
    const out: Item[] = meshEdges.map(([a, b]) => link(`me${a}-${b}`, pos[a], pos[b], R, { tone: "accent" }));
    pos.forEach((p, i) => out.push(host(`mn${i}`, p)));
    return out;
  });

  return finish({
    title: "Five devices wired four ways",
    input: "",
    frames: [
      {
        caption: `The same ${n} devices as a bus, a star, a ring and a full mesh. The bus shares one cable, the star gives each device its own link to a switch, the ring passes data one way round, and the mesh links every pair: ${meshEdges.length} links for ${n} devices.`,
        items,
      },
    ],
  });
}

/* ── Collision and broadcast domains ──────────────────────────────── */

type Kind = "host" | "hub" | "switch" | "router";

/**
 * Collision and broadcast domains of a network, by union-find over its
 * links: a hub repeats every signal, so all its links are one collision
 * domain; a switch keeps each port's link apart but forwards broadcasts,
 * so its links share a broadcast domain; a router keeps both apart.
 */
function domains(kinds: readonly Kind[], links: ReadonlyArray<readonly [number, number]>): { collision: number[]; broadcast: number[] } {
  const group = (joins: (k: Kind) => boolean): number[] => {
    const parent = links.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    kinds.forEach((k, dev) => {
      if (!joins(k)) return;
      const mine = links.flatMap(([a, b], i) => (a === dev || b === dev ? [i] : []));
      for (const i of mine.slice(1)) parent[find(i)] = find(mine[0]);
    });
    // Number the domains 1, 2, … in the order their first link appears.
    const ids = new Map<number, number>();
    return links.map((_, i) => {
      const root = find(i);
      if (!ids.has(root)) ids.set(root, ids.size + 1);
      return ids.get(root)!;
    });
  };
  return { collision: group((k) => k === "hub"), broadcast: group((k) => k === "hub" || k === "switch") };
}

const count = (xs: readonly number[]) => new Set(xs).size;

function domainsFigure(): Walkthrough {
  // The note's table first: the same rule must give its numbers.
  const star = (centre: Kind, hosts: number) => {
    const kinds: Kind[] = [centre, ...Array.from({ length: hosts }, () => "host" as const)];
    return domains(kinds, kinds.slice(1).map((_, i) => [0, i + 1] as const));
  };
  const hub8 = star("hub", 8);
  const sw24 = star("switch", 24);
  const rt3 = star("router", 3);
  const table: Array<[string, { collision: number[]; broadcast: number[] }, number, number]> = [
    ["8-port hub", hub8, 1, 1],
    ["24-port switch", sw24, 24, 1],
    ["router with 3 interfaces", rt3, 3, 3],
  ];
  for (const [what, d, c, b] of table) if (count(d.collision) !== c || count(d.broadcast) !== b) throw new Error(`domains: the note's table says a ${what} makes ${c} collision and ${b} broadcast domains`);

  // The figure's network: a router between a switched LAN and a hub LAN.
  const kinds: Kind[] = ["router", "switch", "hub", "host", "host", "host", "host", "host", "host"];
  const names = ["Router", "Switch", "Hub", "H1", "H2", "H3", "H4", "H5", "H6"];
  const links: Array<readonly [number, number]> = [
    [3, 1],
    [4, 1],
    [5, 1],
    [1, 0],
    [6, 2],
    [7, 2],
    [8, 2],
    [2, 0],
  ];
  const d = domains(kinds, links);
  const nc = count(d.collision);
  const nb = count(d.broadcast);
  const hubLinks = links.flatMap(([a, b], i) => (a === 2 || b === 2 ? [i] : []));
  if (count(hubLinks.map((i) => d.collision[i])) !== 1) throw new Error("domains: a hub's links must share one collision domain");

  const pos: Pt[] = [
    { x: 240, y: 26 },
    { x: 110, y: 112 },
    { x: 370, y: 112 },
    { x: 46, y: 206 },
    { x: 110, y: 206 },
    { x: 174, y: 206 },
    { x: 306, y: 206 },
    { x: 370, y: 206 },
    { x: 434, y: 206 },
  ];
  const BW = 66;
  const BH = 28;
  const R = 16;
  const rim = (i: number) => (kinds[i] === "host" ? R : 17);

  const draw = (mode: "collision" | "broadcast"): Item[] => {
    const items: Item[] = [];
    if (mode === "broadcast") {
      const regions = [
        { id: "bd1", x: 14, y: 88, w: 192, h: 142, text: "broadcast domain 1" },
        { id: "bd2", x: 274, y: 88, w: 192, h: 142, text: "broadcast domain 2" },
      ];
      for (const g of regions) {
        items.push({ k: "band", id: g.id, x: g.x, y: g.y, w: g.w, h: g.h, tone: "accent" });
        items.push(label(`${g.id}-t`, g.text, g.x + g.w / 2, g.y + g.h + 14, { tone: "accent", size: 11.5, weight: 600 }));
      }
    }
    links.forEach(([a, b], i) => {
      const onHub = hubLinks.includes(i);
      const tone: LineTone = mode === "collision" && onHub ? "accent" : "ink";
      items.push(link(`l${i}`, pos[a], pos[b], rim(a), { rb: rim(b), tone, label: mode === "collision" ? String(d.collision[i]) : undefined }));
    });
    kinds.forEach((k, i) => {
      if (k === "host") items.push({ k: "node", id: `n${i}`, x: pos[i].x, y: pos[i].y, r: R, text: names[i], tone: "plain", size: 11 });
      else items.push(box(`n${i}`, pos[i].x - BW / 2, pos[i].y - BH / 2, names[i], { w: BW, h: BH, size: 12, tone: k === "hub" && mode === "collision" ? "accent" : "plain" }));
    });
    const summary = mode === "collision" ? `collision domains: ${nc} (the number on each link)` : `broadcast domains: ${nb}`;
    items.push(label("sum", summary, 240, 262, { tone: "ink", size: 12.5, weight: 600 }));
    return items;
  };

  const switchPorts = links.filter(([a, b]) => kinds[a] === "switch" || kinds[b] === "switch").length;
  return finish({
    title: "Collision and broadcast domains around a router",
    input: "",
    frames: [
      {
        caption: `Each of the switch's ${switchPorts} ports is its own collision domain, so H1, H2 and H3 never collide. The hub repeats every signal out of every port, so its ${hubLinks.length} links are one domain, ${nc} in all.`,
        items: draw("collision"),
      },
      {
        caption: `A broadcast from H1 is forwarded by the switch to every port but stops at the router, and the hub side is the same: ${nb} broadcast domains, one per router interface.`,
        items: draw("broadcast"),
      },
    ],
  });
}

/* ── Circuit switching vs packet switching ────────────────────────── */

function switching(): Walkthrough {
  const PACKETS = 3;
  const T = 1; // transmission time of one packet on one link
  const P = 0.5; // propagation time of one link
  const U = 34; // px per time unit
  const GAPX = 62;
  const TOP = 46;
  const y = (t: number) => round(TOP + t * U);

  // Circuit: a setup message out and a confirmation back (control messages, transmission time negligible), then the whole message streams through.
  const setup = 4 * P;
  const circuitEnd = setup + PACKETS * T + 2 * P;

  // Packets: store and forward, each link sending one packet at a time.
  type Hop = { link: number; pkt: number; start: number };
  const hops: Hop[] = [];
  const linkFree = [0, 0];
  for (let k = 0; k < PACKETS; k++) {
    let ready = k * T; // the source sends back to back
    for (let l = 0; l < 2; l++) {
      const start = Math.max(ready, linkFree[l]);
      hops.push({ link: l, pkt: k, start });
      linkFree[l] = start + T;
      ready = start + T + P; // the next node has the whole packet
    }
  }
  const packetEnd = Math.max(...hops.filter((h) => h.link === 1).map((h) => h.start + T + P));
  if (packetEnd !== PACKETS * T + T + 2 * P) throw new Error("switching: store and forward over two links should cost one extra packet time");
  if (circuitEnd !== 6 || packetEnd !== 5) throw new Error("switching: the captions expect 6 and 5");

  const items: Item[] = [];
  const TMAX = Math.max(circuitEnd, packetEnd);
  const lanes = (prefix: string, x0: number, mid: string, title: string) => {
    items.push(label(`${prefix}h`, title, x0 + GAPX, 0, { tone: "ink", weight: 600, size: 12.5 }));
    ["A", mid, "B"].forEach((name, i) => {
      const x = x0 + i * GAPX;
      items.push({ k: "edge", id: `${prefix}l${i}`, x1: x, y1: TOP - 10, x2: x, y2: y(TMAX) + 6, tone: "line" });
      items.push(box(`${prefix}b${i}`, x - 28, 14, name, { w: 56, h: 22, size: 11.5 }));
    });
  };
  const slab = (id: string, xa: number, xb: number, t0: number, dur: number, tone: "accent" | "strong", text?: string, at = 0.5) => {
    const drop = P * Math.abs(xb - xa) / GAPX;
    items.push({ k: "path", id, pts: [[xa, y(t0)], [xb, y(t0 + P * Math.abs(xb - xa) / GAPX)], [xb, y(t0 + P * Math.abs(xb - xa) / GAPX + dur)], [xa, y(t0 + dur)]], closed: true, fill: tone, tone: "accent", width: 1.2 });
    if (text) items.push(label(`${id}-t`, text, xa + (xb - xa) * at, y(t0 + drop * at + dur / 2), { tone: "ink", size: 11, mono: true }));
  };

  // Left: the circuit.
  const CX = 0;
  lanes("c", CX, "switch", "Circuit switching");
  const legs: Array<[number, number, number]> = [
    [0, 1, 0],
    [1, 2, P],
    [2, 1, 2 * P],
    [1, 0, 3 * P],
  ];
  legs.forEach(([a, b, t0], i) => items.push(arrow(`cs${i}`, { x: CX + a * GAPX, y: y(t0) }, { x: CX + b * GAPX, y: y(t0 + P) }, { tone: "ink", dashed: true })));
  items.push(label("csl", "setup", CX + 2 * GAPX + 8, y(setup / 2), { anchor: "start", size: 11 }));
  slab("cd", CX, CX + 2 * GAPX, setup, PACKETS * T, "accent", "message", 0.25);
  items.push(label("ce", `done at ${circuitEnd}`, CX + 2 * GAPX + 8, y(circuitEnd), { anchor: "start", tone: "ink", size: 11, weight: 600 }));

  // Right: the packets.
  const PX = 2 * GAPX + 100;
  lanes("p", PX, "router", "Packet switching");
  for (const h of hops) slab(`pp${h.pkt}-${h.link}`, PX + h.link * GAPX, PX + (h.link + 1) * GAPX, h.start, T, h.pkt === PACKETS - 1 ? "strong" : "accent", String(h.pkt + 1));
  items.push(label("pe", `done at ${packetEnd}`, PX + 2 * GAPX + 8, y(packetEnd), { anchor: "start", tone: "ink", size: 11, weight: 600 }));

  // The time axis, once, on the far left.
  for (let t = 0; t <= TMAX; t += 1) items.push(label(`t${t}`, String(t), CX - 34, y(t), { anchor: "end", tone: "faint", size: 10.5, mono: true }));
  items.push(label("tl", "time", CX - 34, y(TMAX) + 18, { anchor: "end", tone: "faint", size: 10.5 }));

  return finish({
    title: "The same message by circuit and by packets",
    input: `${PACKETS} packets over two links; ${T} time unit to send a packet on a link, ${P} to cross it`,
    frames: [
      {
        caption: `The circuit spends ${setup} units reserving the path, then the bits stream through the switch without stopping and the last arrives at ${circuitEnd}. Packets start at once, but the router must hold each whole packet before sending it on; the last arrives at ${packetEnd}.`,
        items,
      },
    ],
  });
}

/* ── Transmission and propagation delay ───────────────────────────── */

function delay(): Walkthrough {
  // The worked example's numbers.
  const BYTES = 1000;
  const RATE = 10e6; // bps
  const KM = 2000;
  const SPEED = 2e8; // m/s
  const L = BYTES * 8;
  const trans = (L / RATE) * 1000; // ms
  const prop = ((KM * 1000) / SPEED) * 1000; // ms
  const total = trans + prop;
  const viaRouter = 2 * trans + 2 * (prop / 2);
  const bdp = RATE * (prop / 1000);
  const ms = (v: number) => `${Number(v.toFixed(3))} ms`;
  if (L !== 8000 || ms(trans) !== "0.8 ms" || ms(prop) !== "10 ms" || ms(total) !== "10.8 ms" || ms(viaRouter) !== "11.6 ms" || bdp !== 100000) {
    throw new Error(`delay: the note's table says 0.8 + 10 = 10.8 ms (11.6 via a router) and 100,000 bits in flight; computed ${ms(trans)}, ${ms(prop)}, ${ms(viaRouter)}, ${bdp}`);
  }

  const W = 300; // px for 2,000 km
  const U = 22; // px per ms
  const TOP = 40;
  const y = (t: number) => round(TOP + t * U);
  const END = 12;

  const parallelogram = (id: string, xa: number, xb: number, t0: number, tone: "accent" | "strong"): Item => {
    const p = prop * ((xb - xa) / W);
    return { k: "path", id, pts: [[xa, y(t0)], [xb, y(t0 + p)], [xb, y(t0 + p + trans)], [xa, y(t0 + trans)]], closed: true, fill: tone, tone: "accent", width: 1.2 };
  };
  const host = (id: string, x: number, name: string): Item[] => [
    { k: "edge", id: `${id}l`, x1: x, y1: TOP - 8, x2: x, y2: y(END), tone: "line" },
    box(id, x - 26, TOP - 34, name, { w: 52, h: 24, size: 12 }),
  ];
  const time = (id: string, x: number, t: number, side: "start" | "end", tone: "ink" | "soft" = "soft"): Item => label(id, ms(t), side === "end" ? x - 8 : x + 8, y(t), { anchor: side, tone, size: 11, mono: true });

  const one: Item[] = [
    { k: "span", id: "dist", x1: 0, x2: W, y: TOP - 44, label: `${KM.toLocaleString("en-GB")} km at ${SPEED / 1e8} × 10⁸ m/s`, tone: "ink" },
    ...host("A", 0, "A"),
    ...host("B", W, "B"),
    parallelogram("p0", 0, W, 0, "accent"),
    time("a0", 0, 0, "end"),
    time("a1", 0, trans, "end"),
    time("b0", W, prop, "start"),
    time("b1", W, total, "start", "ink"),
    label("lt", `transmission L/R = ${ms(trans)}`, W / 2, y(END) + 18, { tone: "ink", size: 11.5 }),
    label("lp", `propagation d/s = ${ms(prop)}, total ${ms(total)}`, W / 2, y(END) + 36, { tone: "ink", size: 11.5 }),
  ];
  const mid = W / 2;
  const two: Item[] = [
    { k: "span", id: "dist", x1: 0, x2: mid - 2, y: TOP - 44, label: `${(KM / 2).toLocaleString("en-GB")} km`, tone: "ink" },
    { k: "span", id: "dist2", x1: mid + 2, x2: W, y: TOP - 44, label: `${(KM / 2).toLocaleString("en-GB")} km`, tone: "ink" },
    ...host("A", 0, "A"),
    ...host("R", mid, "R"),
    ...host("B", W, "B"),
    parallelogram("p0", 0, mid, 0, "accent"),
    parallelogram("p1", mid, W, prop / 2 + trans, "accent"),
    time("a0", 0, 0, "end"),
    time("a1", 0, trans, "end"),
    time("r1", mid, prop / 2 + trans, "end"),
    time("b1", W, viaRouter, "start", "ink"),
    label("lt", `2 × ${ms(trans)} + 2 × ${ms(prop / 2)} = ${ms(viaRouter)}`, W / 2, y(END) + 18, { tone: "ink", size: 11.5 }),
    label("lp", "the router waits for the last bit before it sends", W / 2, y(END) + 36, { tone: "ink", size: 11.5 }),
  ];
  return finish({
    title: "Transmission and propagation delay for one packet",
    input: `${BYTES.toLocaleString("en-GB")}-byte packet, ${RATE / 1e6} Mbps link, ${KM.toLocaleString("en-GB")} km`,
    frames: [
      {
        caption: `Time runs down the page. Pushing ${L.toLocaleString("en-GB")} bits onto a ${RATE / 1e6} Mbps link takes ${ms(trans)}, the slab's thickness; each bit then needs ${ms(prop)} to cross ${KM.toLocaleString("en-GB")} km, its slope. The last bit lands at ${ms(total)}.`,
        items: one,
      },
      {
        caption: `Put a router halfway and the propagation adds up to the same ${ms(prop)}, but the router must receive all ${L.toLocaleString("en-GB")} bits before it sends the first one on, so the transmission time is paid twice: ${ms(viaRouter)}.`,
        items: two,
      },
    ] satisfies Frame[],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  topologies,
  domains: domainsFigure,
  switching,
  delay,
};
