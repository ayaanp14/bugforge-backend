import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { lines } from "./kit.js";

/**
 * The OSI Model: the note's figures (content/notes/computer-networks/
 * osi-model.md places each with "@figure <name>").
 *
 *  - path: two hosts, a switch and a router as stacks of the layers each
 *    implements; the data's route down, across and up is drawn from each
 *    device's top layer, so the picture says which layers every hop runs.
 *  - encapsulation: the worked example (1,460 bytes of data over Ethernet)
 *    going down the sender's stack, a header added at each layer and the
 *    trailer at layer 2, then read and stripped going up at the receiver.
 *    Every size is summed from the header sizes and checked against the
 *    note's table (1,480, 1,500, 1,518, 96.2 per cent).
 *  - hops: a frame forwarded by two routers. Each router's forwarding is
 *    simulated — new source and destination MACs for the next link, TTL
 *    minus one — so the cards show what changes per hop and what does not.
 */

const LAYERS = ["Physical", "Data link", "Network", "Transport", "Session", "Presentation", "Application"];

/* ── Which layers each device on the path runs ────────────────────── */

function path(): Walkthrough {
  const devices = [
    { id: "a", name: "Host A", top: 7, w: 104 },
    { id: "s", name: "Switch", top: 2, w: 88 },
    { id: "r", name: "Router", top: 3, w: 88 },
    { id: "b", name: "Host B", top: 7, w: 104 },
  ];
  const H = 24;
  const GAP = 4;
  const SPACE = 36;
  const BASE = 7 * (H + GAP);
  const yOf = (layer: number) => BASE - layer * (H + GAP); // top edge of a layer's box
  const mid = (layer: number) => yOf(layer) + H / 2;
  const xs: number[] = [];
  devices.reduce((x, d) => (xs.push(x), x + d.w + SPACE), 0);

  const items: Item[] = [];
  devices.forEach((d, i) => {
    for (let layer = 1; layer <= d.top; layer++) {
      const tone: Tone = layer >= 4 ? "accent" : "plain";
      items.push(box(`${d.id}${layer}`, xs[i], yOf(layer), `${layer} ${LAYERS[layer - 1]}`, { w: d.w, h: H, size: 11, tone }));
    }
    items.push(label(`${d.id}n`, d.name, xs[i] + d.w / 2, BASE + 30, { tone: "ink", weight: 600, size: 12 }));
  });

  // The data's route: down the sender, along the wire, over the top of each relay, up the receiver.
  const WIRE = BASE + 10;
  const pts: Array<[number, number]> = [[xs[0] + devices[0].w + 10, mid(7)], [xs[0] + devices[0].w + 10, WIRE]];
  for (let i = 1; i < devices.length - 1; i++) {
    const left = xs[i] - 10;
    const right = xs[i] + devices[i].w + 10;
    const over = yOf(devices[i].top) - 7;
    pts.push([left, WIRE], [left, over], [right, over], [right, WIRE]);
  }
  const lastX = xs[devices.length - 1] - 10;
  pts.push([lastX, WIRE], [lastX, mid(7) + 10]);
  items.push({ k: "path", id: "route", pts, tone: "accent", width: 2 });
  items.push(arrow("route-end", { x: lastX, y: mid(7) + 11 }, { x: lastX, y: mid(7) }, { tone: "accent" }));

  // Peers: layers 4 to 7 talk only between the two hosts.
  const x1 = xs[0] + devices[0].w + 18;
  const x2 = xs[3] - 18;
  for (let layer = 4; layer <= 7; layer++) items.push({ k: "edge", id: `peer${layer}`, x1, y1: mid(layer), x2, y2: mid(layer), tone: "faint", dashed: true });
  items.push(label("peerl", "layers 4–7: only the two end hosts", (x1 + x2) / 2, (mid(6) + mid(5)) / 2, { tone: "accent", size: 11.5, weight: 600 }));
  items.push(label("hopl", "layers 1–3 run on every device on the path", (xs[0] + xs[3] + devices[3].w) / 2, BASE + 50, { tone: "soft", size: 11.5, weight: 600 }));

  const relays = devices.slice(1, -1);
  return finish({
    title: "Which layers each device on the path runs",
    input: "",
    frames: [
      {
        caption: `Data goes down all seven layers of Host A and onto the wire. The ${relays[0].name.toLowerCase()} lifts it only to layer ${relays[0].top} and the ${relays[1].name.toLowerCase()} to layer ${relays[1].top}; only Host B takes it back up to layer 7, so layers 4 to 7 are a conversation between the two ends.`,
        items,
      },
    ],
  });
}

/* ── Encapsulation and decapsulation ──────────────────────────────── */

function encapsulation(): Walkthrough {
  const DATA = 1460;
  const TCP = 20;
  const IP = 20;
  const ETH = 14;
  const FCS = 4;
  const MTU = 1500;
  const segment = DATA + TCP;
  const packet = segment + IP;
  const frame = packet + ETH + FCS;
  const share = ((DATA / frame) * 100).toFixed(1);
  if (segment !== 1480 || packet !== MTU || frame !== 1518 || share !== "96.2" || MTU - IP - TCP !== DATA) {
    throw new Error(`encapsulation: the note's table says 1,480 / 1,500 / 1,518 bytes and 96.2 per cent; computed ${segment} / ${packet} / ${frame} / ${share}`);
  }
  const PREAMBLE = 8; // 7 bytes of 10101010 and the start-of-frame delimiter 10101011
  const bits = frame * 8;
  const n = (v: number) => v.toLocaleString("en-GB");

  const H = 26;
  const GAP = 4;
  const SW = 104; // the stack's width
  const BASE = 7 * (H + GAP);
  const yOf = (layer: number) => BASE - layer * (H + GAP);
  // The unit's boxes keep their x from frame to frame; a header appears to the left of what it wraps.
  const X0 = SW + 34;
  const part = {
    eth: { x: X0, w: 46, text: "Eth", size: ETH },
    ip: { x: X0 + 48, w: 46, text: "IP", size: IP },
    tcp: { x: X0 + 96, w: 46, text: "TCP", size: TCP },
    data: { x: X0 + 144, w: 124, text: "HTTP data", size: DATA },
    fcs: { x: X0 + 270, w: 40, text: "FCS", size: FCS },
  };
  type Part = keyof typeof part;

  const draw = (o: { side: string; layers: number[]; at: number; parts: Part[]; hot: Part[]; name: string; total: number; delivered?: boolean; bits?: boolean }): Item[] => {
    const items: Item[] = [label("side", o.side, SW / 2, -16, { tone: "ink", weight: 600, size: 12 })];
    for (let layer = 7; layer >= 1; layer--) {
      const on = o.layers.includes(layer);
      items.push(box(`L${layer}`, 0, yOf(layer), `${layer} ${LAYERS[layer - 1]}`, { w: SW, h: H, size: 11, tone: on ? "accent" : "plain" }));
    }
    const y = yOf(o.at);
    const first = part[o.parts[0]];
    const last = part[o.parts[o.parts.length - 1]];
    // The sender's layer hands its unit on; the receiver's layer takes it in.
    const ends = [{ x: SW + 6, y: y + H / 2 }, { x: first.x - 6, y: y + H / 2 }];
    items.push(o.side === "Sender" ? arrow("pt", ends[0], ends[1], { tone: "accent" }) : arrow("pt", ends[1], ends[0], { tone: "accent" }));
    for (const p of o.parts) {
      const q = part[p];
      const tone: Tone = o.bits ? "muted" : o.delivered ? "strong" : o.hot.includes(p) ? "accent" : "plain";
      items.push(box(`u-${p}`, q.x, y, q.text, { w: q.w, h: H, size: 11, tone }));
      items.push(label(`s-${p}`, `${n(q.size)} B`, q.x + q.w / 2, y + H + 11, { tone: "faint", size: 10.5, mono: true }));
    }
    items.push({ k: "span", id: "unit", x1: first.x + 1, x2: last.x + last.w - 1, y: y - 7, label: o.bits ? `${n(bits)} bits after the preamble` : `${o.name}: ${n(o.total)} bytes`, tone: o.delivered ? "accent" : "ink" });
    if (o.bits) items.push(label("bits", "10101010 × 7, 10101011, then the frame", (first.x + last.x + last.w) / 2, y + H + 30, { tone: "accent", size: 11, mono: true }));
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `The application layers produce ${n(DATA)} bytes of data, here an HTTP request. In TCP/IP the presentation and session jobs happen inside the application, so the data leaves layer 5 as it is.`,
      items: draw({ side: "Sender", layers: [7, 6, 5], at: 7, parts: ["data"], hot: ["data"], name: "data", total: DATA }),
    },
    {
      caption: `The transport layer adds a ${TCP}-byte TCP header holding the ports, sequence and acknowledgement numbers. Header and payload together are a segment of ${n(segment)} bytes.`,
      items: draw({ side: "Sender", layers: [4], at: 4, parts: ["tcp", "data"], hot: ["tcp"], name: "segment", total: segment }),
    },
    {
      caption: `The network layer adds a ${IP}-byte IP header with the source and destination IP addresses, making a ${n(packet)}-byte packet: exactly Ethernet's maximum payload, the MTU.`,
      items: draw({ side: "Sender", layers: [3], at: 3, parts: ["ip", "tcp", "data"], hot: ["ip"], name: "packet", total: packet }),
    },
    {
      caption: `The data link layer adds a ${ETH}-byte Ethernet header with the MAC addresses and a ${FCS}-byte trailer, the frame check sequence: a ${n(frame)}-byte frame, of which ${share} per cent is the user's data.`,
      items: draw({ side: "Sender", layers: [2], at: 2, parts: ["eth", "ip", "tcp", "data", "fcs"], hot: ["eth", "fcs"], name: "frame", total: frame }),
    },
    {
      caption: `The physical layer knows nothing of headers: it sends an ${PREAMBLE}-byte preamble so the receiver can lock on, then the frame's ${n(bits)} bits as signals on the medium.`,
      items: draw({ side: "Sender", layers: [1], at: 1, parts: ["eth", "ip", "tcp", "data", "fcs"], hot: [], name: "bits", total: frame, bits: true }),
    },
    {
      caption: `At the receiver the data link layer rebuilds the frame, recomputes the check sequence and compares it with the FCS. They match, so it removes its header and trailer and passes the ${n(packet)}-byte packet up.`,
      items: draw({ side: "Receiver", layers: [2], at: 2, parts: ["eth", "ip", "tcp", "data", "fcs"], hot: ["eth", "fcs"], name: "frame", total: frame }),
    },
    {
      caption: `The network layer reads the destination IP address, sees it is this host's own, and strips the IP header. The protocol field says TCP, so the ${n(segment)}-byte segment goes to the transport layer.`,
      items: draw({ side: "Receiver", layers: [3], at: 3, parts: ["ip", "tcp", "data"], hot: ["ip"], name: "packet", total: packet }),
    },
    {
      caption: "TCP reads the destination port to find the program, checks the sequence number to put the bytes in order, and removes its header.",
      items: draw({ side: "Receiver", layers: [4], at: 4, parts: ["tcp", "data"], hot: ["tcp"], name: "segment", total: segment }),
    },
    {
      caption: `The application receives exactly the ${n(DATA)} bytes that were sent. Each layer read only its own header, written by its peer on the sender, which is what layering means.`,
      items: draw({ side: "Receiver", layers: [7, 6, 5], at: 7, parts: ["data"], hot: [], name: "data", total: DATA, delivered: true }),
    },
  ];
  return finish({ title: "Encapsulation down the sender, decapsulation up the receiver", input: `${n(DATA)} bytes of data over Ethernet, no IP or TCP options`, frames });
}

/* ── What changes at each hop ─────────────────────────────────────── */

function hops(): Walkthrough {
  // Interfaces: A has m1; R1 has m2 (towards A) and m3; R2 has m4 and m5; B has m6.
  const nodes = [
    { name: "A", ifs: ["m1"] },
    { name: "R1", ifs: ["m2", "m3"] },
    { name: "R2", ifs: ["m4", "m5"] },
    { name: "B", ifs: ["m6"] },
  ];
  const SRC_IP = "10.0.0.5";
  const DST_IP = "203.0.113.10";
  type Frame2 = { srcMac: string; dstMac: string; srcIp: string; dstIp: string; ttl: number; port: number };
  const PORT = 443;
  // Forward hop by hop: each sender writes its outgoing interface as the source MAC and the next device's incoming one as the destination; a router decrements the TTL.
  const onLink: Frame2[] = [];
  let ttl = 64;
  for (let i = 0; i < nodes.length - 1; i++) {
    if (i > 0) ttl -= 1; // the router forwarding it
    const out = nodes[i].ifs[nodes[i].ifs.length - 1];
    const into = nodes[i + 1].ifs[0];
    onLink.push({ srcMac: out, dstMac: into, srcIp: SRC_IP, dstIp: DST_IP, ttl, port: PORT });
  }
  if (new Set(onLink.map((f) => f.srcMac)).size !== onLink.length) throw new Error("hops: the source MAC must change on every link");
  if (new Set(onLink.map((f) => `${f.srcIp}>${f.dstIp}:${f.port}`)).size !== 1) throw new Error("hops: the IP addresses must stay the same end to end");

  const SPACE = 150;
  const BW = 56;
  const BH = 28;
  const CW = 146;
  const CY = 66;
  const cx = (i: number) => i * SPACE;
  const base: Item[] = [];
  nodes.forEach((d, i) => {
    base.push(box(`d${i}`, cx(i) - BW / 2, 0, d.name, { w: BW, h: BH, size: 12, tone: d.name.startsWith("R") ? "plain" : "accent" }));
  });
  for (let i = 0; i < nodes.length - 1; i++) {
    base.push({ k: "edge", id: `w${i}`, x1: cx(i) + BW / 2, y1: BH / 2, x2: cx(i + 1) - BW / 2, y2: BH / 2, tone: "line" });
    base.push(label(`il${i}`, nodes[i].ifs[nodes[i].ifs.length - 1], cx(i) + BW / 2 + 6, BH / 2 - 9, { anchor: "start", tone: "faint", size: 10.5, mono: true }));
    base.push(label(`ir${i}`, nodes[i + 1].ifs[0], cx(i + 1) - BW / 2 - 6, BH / 2 - 9, { anchor: "end", tone: "faint", size: 10.5, mono: true }));
  }

  const card = (k: number, newest: boolean): Item[] => {
    const f = onLink[k];
    const x = cx(k) + SPACE / 2 - CW / 2;
    const out: Item[] = [
      box(`c${k}`, x, CY, "", { w: CW, h: 108, tone: newest ? "accent" : "plain" }),
      label(`ct${k}`, `link ${k + 1}`, x + CW / 2, CY - 10, { tone: "soft", size: 11, weight: 600 }),
      // Field names and values in two columns (SVG collapses runs of spaces, so no padding).
      ...lines(`cn${k}-`, ["dst MAC", "src MAC", "src IP", "dst IP", "TTL", "dst port"], x + 8, CY + 14, { size: 10.5, gap: 16, tone: () => "soft" }),
      ...lines(`cv${k}-`, [f.dstMac, f.srcMac, f.srcIp, f.dstIp, String(f.ttl), String(f.port)], x + 62, CY + 14, { size: 10.5, gap: 16, tone: (i) => (i < 2 || (i === 4 && k > 0) ? "accent" : "ink") }),
    ];
    out.push({ k: "edge", id: `cp${k}`, x1: cx(k) + SPACE / 2, y1: BH / 2 + 3, x2: cx(k) + SPACE / 2, y2: CY - 18, tone: "faint", dashed: true });
    return out;
  };
  const upTo = (k: number): Item[] => [...base, ...Array.from({ length: k + 1 }, (_, j) => card(j, j === k)).flat()];

  return finish({
    title: "What a router changes in each frame it forwards",
    input: `A (${SRC_IP}) sends to B (${DST_IP}) through two routers`,
    frames: [
      {
        caption: `On the first link A addresses the frame to R1's interface ${onLink[0].dstMac}, from its own ${onLink[0].srcMac}. The IP header inside names the real destination, B, and starts with TTL ${onLink[0].ttl}.`,
        items: upTo(0),
      },
      {
        caption: `R1 strips the frame, reads the destination IP address, decrements the TTL to ${onLink[1].ttl} and builds a new frame for the next link: from ${onLink[1].srcMac} to R2's ${onLink[1].dstMac}. The IP addresses are untouched.`,
        items: upTo(1),
      },
      {
        caption: `R2 does the same, so the last frame goes from ${onLink[2].srcMac} to B's ${onLink[2].dstMac} with TTL ${onLink[2].ttl}. The MAC addresses changed on every link; the IP addresses and the destination port stayed the same from end to end.`,
        items: upTo(2),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  path,
  encapsulation,
  hops,
};

