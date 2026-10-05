import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { gantt, lifelines, message } from "./kit.js";

/**
 * NAT, DHCP and Ports: the note's figures
 * (content/notes/computer-networks/nat-dhcp-and-ports.md places each with
 * "@figure <name>"). Each is drawn from a small simulation:
 *
 *  - port-ranges: the 16-bit port space split at IANA's boundaries, drawn
 *    to scale, with Linux's default ephemeral range laid over it;
 *  - sockets: three connections accepted on one listening port, their
 *    4-tuples checked to be distinct;
 *  - pat-translation: a PAT router translating the note's three outgoing
 *    connections (public ports handed out from 40001), mapping a reply
 *    back and dropping a packet no entry matches;
 *  - dhcp-dora: a client and two DHCP servers, both offering from their
 *    pools; the broadcast Request makes the losing server take its offer
 *    back;
 *  - lease-timeline: a 24-hour lease's T1 and T2 at their default
 *    fractions, 1/2 and 7/8.
 */

/* ── Port ranges ──────────────────────────────────────────────────── */

function portRanges(): Walkthrough {
  const MAX = 65535;
  const ranges = [
    { name: "well-known", from: 0, to: 1023, tone: "strong" as Tone },
    { name: "registered", from: 1024, to: 49151, tone: "plain" as Tone },
    { name: "dynamic", from: 49152, to: 65535, tone: "accent" as Tone },
  ];
  const count = (r: { from: number; to: number }) => r.to - r.from + 1;
  if (ranges.reduce((a, r) => a + count(r), 0) !== MAX + 1) throw new Error("port-ranges: ranges do not cover 0–65535");
  const linux = { from: 32768, to: 60999 };
  const W = 460;
  const px = (p: number) => Math.round((p / (MAX + 1)) * W * 10) / 10;
  const items: Item[] = [];
  ranges.forEach((r, i) => {
    const x1 = px(r.from);
    const x2 = px(r.to + 1);
    items.push({ k: "cell", id: `r${i}`, x: x1, y: 0, w: Math.max(3, x2 - x1), h: 34, text: x2 - x1 > r.name.length * 7.2 + 8 ? r.name : "", tone: r.tone, size: 12 });
    if (i > 0) items.push(label(`c${i}`, `${count(r).toLocaleString("en-GB")} ports`, (x1 + x2) / 2, 48, { size: 11, tone: "soft" }));
  });
  // 1,024 sits 7 units from 0: the well-known block's numbers go in its callout instead.
  for (const b of [0, 49152, 65535]) items.push(label(`b${b}`, b.toLocaleString("en-GB"), b === 65535 ? W : px(b), -10, { anchor: b === 0 ? "start" : b === 65535 ? "end" : "middle", size: 10.5, tone: "faint", mono: true }));
  // The well-known sliver is too thin to name inside: a callout.
  items.push({ k: "path", id: "wkl", pts: [[1.5, 38], [1.5, 62]], tone: "accent", width: 1.2 });
  items.push(label("wk", `well-known: 0–1023, ${count(ranges[0]).toLocaleString("en-GB")} ports (22, 53, 80, 443 …)`, 8, 66, { anchor: "start", size: 11, tone: "accent", weight: 600 }));
  items.push({ k: "span", id: "lx", x1: px(linux.from), x2: px(linux.to + 1), y: 92, label: `Linux's default ephemeral range: ${linux.from}–${linux.to}`, tone: "line", down: true });
  return finish({
    title: "The 65,536 port numbers, drawn to scale",
    input: "",
    frames: [
      {
        caption: `Port numbers are 16 bits, 0 to 65,535. The well-known ports are only the first ${count(ranges[0]).toLocaleString("en-GB")}; registered ports take ${count(ranges[1]).toLocaleString("en-GB")} and IANA's dynamic range the last ${count(ranges[2]).toLocaleString("en-GB")}. Linux picks client ports from its own range, which starts inside the registered block.`,
        items,
      },
    ],
  });
}

/* ── One listening port, many connections ─────────────────────────── */

function sockets(): Walkthrough {
  const server = { ip: "203.0.113.10", port: 8080 };
  const clients = [
    { ip: "198.51.100.7", port: 50123 },
    { ip: "198.51.100.7", port: 50124 },
    { ip: "192.0.2.44", port: 50123 },
  ];
  const tuples = clients.map((c) => `${c.ip}:${c.port} ↔ ${server.ip}:${server.port}`);
  if (new Set(tuples).size !== tuples.length) throw new Error("sockets: two connections share a 4-tuple");
  const SX = 232;
  const SW = 210;
  const IPW = 108;
  const PW = 56;
  const items: Item[] = [
    label("ct", "clients", (IPW + PW + 4) / 2, -16, { size: 11.5, tone: "ink", weight: 600 }),
    label("st", `server ${server.ip}`, SX + SW / 2, -16, { size: 11.5, tone: "ink", weight: 600 }),
    box("ls", SX, 0, `listening *:${server.port}`, { w: SW, h: 32, size: 12, tone: "muted" }),
  ];
  // Against the first connection, what makes each later one different: its address, its port, or both.
  items.push(label("hi", "client address", IPW / 2, 34, { size: 10.5, tone: "faint" }), label("hp", "port", IPW + 4 + PW / 2, 34, { size: 10.5, tone: "faint" }));
  clients.forEach((c, i) => {
    const y = 48 + i * 52;
    const ipDiffers = i > 0 && c.ip !== clients[0].ip;
    const portDiffers = i > 0 && c.port !== clients[0].port;
    if (i > 0 && !ipDiffers && !portDiffers) throw new Error("sockets: a client repeats the first one");
    items.push(box(`c${i}`, 0, y, c.ip, { w: IPW, h: 32, size: 12, tone: ipDiffers ? "accent" : "plain" }));
    items.push(box(`p${i}`, IPW + 4, y, c.port, { w: PW, h: 32, size: 12, tone: portDiffers ? "accent" : "plain" }));
    items.push(box(`a${i}`, SX, y, `conn ${i + 1}: port ${server.port}`, { w: SW, h: 32, size: 12, tone: "accent" }));
    items.push(arrow(`e${i}`, { x: IPW + PW + 8, y: y + 16 }, { x: SX - 4, y: y + 16 }, { tone: "ink" }));
  });
  items.push(label("ac", "accept() hands out a new socket per client", SX + SW / 2, 48 + 3 * 52 + 6, { size: 11, tone: "soft" }));
  return finish({
    title: "One listening port, three connections",
    input: `server ${server.ip}:${server.port}`,
    frames: [
      {
        caption: `All three connections use the server's port ${server.port}, yet no two share a 4-tuple. The second differs from the first only in its client port, the third only in its client address (highlighted), and the listening socket keeps waiting for more.`,
        items,
      },
    ],
  });
}

/* ── PAT: the translation table ───────────────────────────────────── */

interface Conn {
  inside: string;
  remote: string;
}

function patTranslation(): Walkthrough {
  const PUBLIC = "203.0.113.5";
  const out: Conn[] = [
    { inside: "192.168.1.10:51000", remote: "198.51.100.20:443" },
    { inside: "192.168.1.11:51000", remote: "198.51.100.20:443" },
    { inside: "192.168.1.10:51001", remote: "198.51.100.30:80" },
  ];
  const table: Array<{ inside: string; pub: string; remote: string }> = [];
  let nextPort = 40001;
  const translate = (c: Conn) => {
    const hit = table.find((r) => r.inside === c.inside && r.remote === c.remote);
    if (hit) return hit;
    const row = { inside: c.inside, pub: `${PUBLIC}:${nextPort++}`, remote: c.remote };
    table.push(row);
    return row;
  };
  const inbound = (dst: string) => table.find((r) => r.pub === dst);

  const W = [148, 140, 140];
  const TY = 112;
  const tableItems = (hot: number, tone: Tone): Item[] => {
    const items: Item[] = [];
    let x = 0;
    ["inside (private)", "public (after NAT)", "remote"].forEach((h, c) => {
      items.push(label(`h${c}`, h, x + W[c] / 2, TY - 12, { tone: "faint", size: 11 }));
      x += W[c] + 4;
    });
    table.forEach((r, i) => {
      let cx = 0;
      [r.inside, r.pub, r.remote].forEach((t, c) => {
        items.push(box(`t${i}-${c}`, cx, TY + i * 34, t, { w: W[c], h: 30, size: 11.5, tone: i === hot ? tone : "plain" }));
        cx += W[c] + 4;
      });
    });
    return items;
  };
  // The packet being rewritten, drawn above the table: what the inside sees, the router, what the outside sees.
  const packet = (inner: string, outer: string, dir: "out" | "in", o: { dropped?: boolean } = {}): Item[] => {
    const L = 160;
    const RX = 192;
    const RW = 92;
    const OX = RX + RW + 32;
    return [
      label("pi", dir === "out" ? "source, inside" : "destination, inside", L / 2, 0, { size: 11, tone: "faint" }),
      box("pa", 0, 12, inner, { w: L, h: 30, size: 11.5, tone: o.dropped ? "muted" : dir === "out" ? "accent" : "strong" }),
      box("rt", RX, 8, `NAT ${PUBLIC}`, { w: RW, h: 38, size: 10.5, tone: "plain" }),
      label("po", dir === "out" ? "source, outside" : "destination, outside", OX + L / 2, 0, { size: 11, tone: "faint" }),
      box("pb", OX, 12, outer, { w: L, h: 30, size: 11.5, tone: o.dropped ? "error" : dir === "out" ? "strong" : "accent" }),
      dir === "out" ? arrow("p1", { x: L + 4, y: 27 }, { x: RX - 4, y: 27 }, { tone: "ink" }) : arrow("p1", { x: RX - 4, y: 27 }, { x: L + 4, y: 27 }, { tone: o.dropped ? "error" : "ink", dashed: o.dropped }),
      dir === "out" ? arrow("p2", { x: RX + RW + 4, y: 27 }, { x: OX - 4, y: 27 }, { tone: "ink" }) : arrow("p2", { x: OX - 4, y: 27 }, { x: RX + RW + 4, y: 27 }, { tone: o.dropped ? "error" : "ink" }),
      label("pd", dir === "out" ? `to ${table[table.length - 1]?.remote ?? ""}` : "reply from the server", OX + L / 2, 58, { size: 11, tone: "soft", mono: dir === "out" }),
    ];
  };

  const frames: Frame[] = [];
  out.forEach((c, i) => {
    const row = translate(c);
    const sameAs = table.findIndex((r) => r !== row && r.inside.split(":")[1] === row.inside.split(":")[1]);
    frames.push({
      caption:
        i === 0
          ? `192.168.1.10 opens a connection from port 51000. The router rewrites the private source to its public address and a fresh port, ${row.pub.split(":")[1]}, and records the pair in its translation table.`
          : sameAs >= 0
            ? `192.168.1.11 happens to pick the same source port, 51000, for the same server. Its packets get their own public port, ${row.pub.split(":")[1]}, so the two connections stay apart outside.`
            : `A second connection from 192.168.1.10, to another server, gets public port ${row.pub.split(":")[1]}. Every connection is one row; the destination is never rewritten on the way out.`,
      items: [...packet(row.inside, row.pub, "out"), ...tableItems(table.indexOf(row), "accent")],
    });
  });
  if (table.map((r) => r.pub.split(":")[1]).join(",") !== "40001,40002,40003") throw new Error("pat-translation: ports differ from the note's table");
  const replyTo = `${PUBLIC}:40002`;
  const back = inbound(replyTo);
  if (!back || back.inside !== "192.168.1.11:51000") throw new Error("pat-translation: the reply maps to the wrong host");
  frames.push({
    caption: `A reply from 198.51.100.20:443 arrives for ${replyTo}. The router finds port 40002 in its table, rewrites the destination to ${back.inside} and forwards it inside.`,
    items: [...packet(back.inside, replyTo, "in"), ...tableItems(table.indexOf(back), "strong")],
  });
  const stray = `${PUBLIC}:50000`;
  if (inbound(stray)) throw new Error("pat-translation: the stray packet matched");
  frames.push({
    caption: `A packet for ${stray} matches no row: nobody inside asked for it, so there is nowhere to send it and it is dropped. This is why a server behind NAT needs a port-forwarding entry.`,
    items: [...packet("no entry", stray, "in", { dropped: true }), ...tableItems(-1, "plain")],
  });
  return finish({ title: "PAT: three connections share one public address", input: `inside 192.168.1.0/24, public address ${PUBLIC}`, frames });
}

/* ── DHCP: DORA with two servers ──────────────────────────────────── */

function dhcpDora(): Walkthrough {
  const servers = [
    { name: "server A", ip: "192.168.1.1", pool: ["192.168.1.23", "192.168.1.24"], reserved: [] as string[] },
    { name: "server B", ip: "192.168.1.2", pool: ["192.168.1.150", "192.168.1.151"], reserved: [] as string[] },
  ];
  // Discover reaches both; each reserves the first free address of its pool and offers it.
  const offers = servers.map((s) => {
    const ip = s.pool.shift()!;
    s.reserved.push(ip);
    return { from: s, ip };
  });
  // The client takes the first offer to arrive.
  const chosen = offers[0];
  // The broadcast Request names the chosen server; the others put their offer back.
  for (const o of offers) if (o !== chosen) o.from.pool.unshift(o.from.reserved.pop()!);
  if (chosen.ip !== "192.168.1.23" || servers[1].pool[0] !== "192.168.1.150") throw new Error("dhcp-dora: the simulation disagrees with the note");

  const ROW = 60;
  const L = lifelines("ll", ["laptop", `A ${servers[0].ip}`, `B ${servers[1].ip}`], { gap: 170, w: 120, h: 28, length: 4 * ROW + 26 });
  const x = L.xOf;
  const y = (r: number) => 64 + r * ROW;
  const sub = (id: string, text: string, x1: number, x2: number, yy: number, tone: "accent" | "soft" | "faint" = "soft"): Item => label(id, text, (x1 + x2) / 2, yy + 14, { size: 11, tone, mono: true });
  const discover: Item[] = [
    ...message("d1", x(0), x(1), y(0), "DISCOVER (broadcast)", { tone: "accent" }),
    { k: "edge", id: "d2", x1: x(1) + 2, y1: y(0), x2: x(2) - 3, y2: y(0), tone: "accent", arrow: true, dashed: true },
    sub("d3", "0.0.0.0:68 → 255.255.255.255:67", x(0), x(2), y(0)),
  ];
  const offer: Item[] = [
    ...message("o1", x(1), x(0), y(1) - 6, `OFFER ${offers[0].ip}`, { dashed: true }),
    ...message("o2", x(2), x(0), y(1) + 22, `OFFER ${offers[1].ip}`, { dashed: true }),
  ];
  const request: Item[] = [
    ...message("r1", x(0), x(1), y(2) + 16, `REQUEST ${chosen.ip}`, { tone: "accent" }),
    { k: "edge", id: "r2", x1: x(1) + 2, y1: y(2) + 16, x2: x(2) - 3, y2: y(2) + 16, tone: "accent", arrow: true, dashed: true },
    sub("r3", "names A; broadcast", x(1), x(2), y(2) + 16, "faint"),
  ];
  const ack: Item[] = [
    ...message("a1", x(1), x(0), y(3) + 16, `ACK ${chosen.ip}`, { dashed: true, tone: "accent" }),
    sub("a2", "mask, gateway, DNS, 24 h lease", x(0), x(1), y(3) + 16),
  ];
  const keepB = (released: boolean): Item => box("bk", x(2) - 68, y(3) + 4, released ? `${offers[1].ip} freed` : `${offers[1].ip} held`, { w: 136, h: 26, size: 11, tone: released ? "muted" : "accent" });
  const frames: Frame[] = [
    {
      caption: "Discover: the laptop has no address yet, so it broadcasts from 0.0.0.0 port 68 to 255.255.255.255 port 67, with its MAC address inside. Every DHCP server on the segment hears it.",
      items: [...L.items, ...discover],
    },
    {
      caption: `Offer: each server reserves an address from its pool and offers it with the mask, gateway, DNS servers and lease time. Server A offers ${offers[0].ip}, server B ${offers[1].ip}.`,
      items: [...L.items, ...discover, ...offer, keepB(false)],
    },
    {
      caption: `Request: the laptop takes A's offer and broadcasts its choice, naming server A. Broadcasting is the point: server B hears that its offer was declined and returns ${offers[1].ip} to its pool.`,
      items: [...L.items, ...discover, ...offer, ...request, keepB(true)],
    },
    {
      caption: `Acknowledge: server A confirms the lease. After an optional ARP probe to make sure nobody else uses it, the laptop configures ${chosen.ip} and its settings for the lease time.`,
      items: [...L.items, ...discover, ...offer, ...request, keepB(true), ...ack],
    },
  ];
  return finish({ title: "DHCP's DORA exchange when two servers answer", input: "a laptop joins a network with two DHCP servers", frames });
}

/* ── Lease timeline ───────────────────────────────────────────────── */

function leaseTimeline(): Walkthrough {
  const LEASE = 24;
  const t1 = LEASE * (1 / 2);
  const t2 = LEASE * (7 / 8);
  if (t1 !== 12 || t2 !== 21) throw new Error(`lease-timeline: T1 ${t1}, T2 ${t2}`);
  const g = gantt("g", [
    { who: "bound: use the address", from: 0, to: t1, tone: "plain" },
    { who: "renewing: unicast", from: t1, to: t2, tone: "accent" },
    { who: "rebind", from: t2, to: LEASE, tone: "strong" },
  ], { unit: 19, h: 34, size: 11.5 });
  const mark = (id: string, t: number, text: string): Item[] => [
    label(id, text, g.x(t), -22, { size: 11, tone: "accent", weight: 600 }),
    { k: "path", id: `${id}-m`, pts: [[g.x(t), -14], [g.x(t), -2]], tone: "accent", width: 1.2 },
  ];
  const items: Item[] = [
    ...g.items,
    ...mark("t1", t1, `T1 = ${t1} h`),
    ...mark("t2", t2, `T2 = ${t2} h`),
    label("hr", "hours", g.x(LEASE) + 8, 45, { anchor: "start", size: 10, tone: "faint" }),
    label("rb", "rebinding: REQUEST broadcast to any server", g.x(LEASE), 68, { anchor: "end", size: 11, tone: "accent" }),
    label("ex", "at 24 h the lease expires: stop using the address", g.x(LEASE), 86, { anchor: "end", size: 11, tone: "error" }),
  ];
  return finish({
    title: "A 24-hour DHCP lease: when the client renews and rebinds",
    input: "lease = 24 hours, default T1 and T2",
    frames: [
      {
        caption: `For a ${LEASE}-hour lease, the client starts renewing with its own server at T1 = ${t1} hours. If that server stays silent, at T2 = ${t2} hours it broadcasts to any server; if the lease ends with no answer, it must give the address up.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "port-ranges": portRanges,
  sockets,
  "pat-translation": patTranslation,
  "dhcp-dora": dhcpDora,
  "lease-timeline": leaseTimeline,
};
