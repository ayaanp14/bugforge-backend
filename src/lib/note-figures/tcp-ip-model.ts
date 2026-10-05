import { finish, link, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";

/**
 * The TCP/IP Model: the note's figures (content/notes/computer-networks/
 * tcp-ip-model.md places each with "@figure <name>").
 *
 *  - mapping: the seven OSI layers beside the five-layer textbook model and
 *    RFC 1122's four, each box as tall as the OSI layers it covers (the
 *    covers are checked to partition layers 1 to 7).
 *  - headers: one real frame — an HTTP GET for example.com inside TCP, IP
 *    and Ethernet — as nested boxes with each header's size, the totals
 *    summed from them, then demultiplexed: each layer looks up the field
 *    that names its payload (EtherType, Protocol, destination port) in the
 *    same tables the note prints.
 *  - hourglass: the protocols of the note's "tricky protocols" table on
 *    their layers, each joined to what carries it and labelled with the
 *    number that names it there; every application protocol is followed
 *    down its carriers and must pass through IP.
 */

const OSI = ["Physical", "Data link", "Network", "Transport", "Session", "Presentation", "Application"];

/* ── TCP/IP against OSI ───────────────────────────────────────────── */

function mapping(): Walkthrough {
  const models: Array<{ id: string; title: string; w: number; layers: Array<{ name: string; covers: number[] }> }> = [
    { id: "o", title: "OSI (7)", w: 118, layers: OSI.map((name, i) => ({ name: `${i + 1} ${name}`, covers: [i + 1] })) },
    {
      id: "f",
      title: "Textbook (5)",
      w: 104,
      layers: [
        { name: "Application", covers: [5, 6, 7] },
        { name: "Transport", covers: [4] },
        { name: "Network", covers: [3] },
        { name: "Data link", covers: [2] },
        { name: "Physical", covers: [1] },
      ],
    },
    {
      id: "t",
      title: "TCP/IP, RFC 1122 (4)",
      w: 140,
      layers: [
        { name: "Application", covers: [5, 6, 7] },
        { name: "Transport", covers: [4] },
        { name: "Internet", covers: [3] },
        { name: "Link", covers: [1, 2] },
      ],
    },
  ];
  for (const m of models) {
    const all = m.layers.flatMap((l) => l.covers).sort((a, b) => a - b);
    if (all.join() !== "1,2,3,4,5,6,7") throw new Error(`mapping: ${m.title} must cover OSI layers 1 to 7 once each`);
    for (const l of m.layers) for (let k = 1; k < l.covers.length; k++) if (l.covers[k] - l.covers[k - 1] !== 1) throw new Error(`mapping: ${l.name} must cover adjacent layers`);
  }
  const H = 28;
  const GAP = 4;
  const SPACE = 22;
  const top = (layer: number) => (7 - layer) * (H + GAP);
  const items: Item[] = [];
  let x = 0;
  for (const m of models) {
    items.push(label(`${m.id}h`, m.title, x + m.w / 2, -16, { tone: "ink", weight: 600, size: 12 }));
    m.layers.forEach((l, i) => {
      const hi = Math.max(...l.covers);
      const lo = Math.min(...l.covers);
      const merged = l.covers.length > 1;
      const tone: Tone = m.id === "o" ? "plain" : merged ? "accent" : "plain";
      items.push(box(`${m.id}${i}`, x, top(hi), l.name, { w: m.w, h: top(lo) - top(hi) + H, size: 11.5, tone }));
    });
    x += m.w + SPACE;
  }
  const merged = models[2].layers.filter((l) => l.covers.length > 1);
  return finish({
    title: "The TCP/IP layers against the seven OSI layers",
    input: "",
    frames: [
      {
        caption: `Each box spans the OSI layers it does the job of. TCP/IP's ${merged[0].name.toLowerCase()} layer absorbs OSI's top three and its ${merged[1].name.toLowerCase()} layer the bottom two; the textbook's five-layer model keeps data link and physical apart.`,
        items,
      },
    ],
  });
}

/* ── One frame, nested, then demultiplexed ────────────────────────── */

const ETHERTYPES: Record<number, string> = { 0x0800: "IPv4", 0x86dd: "IPv6", 0x0806: "ARP" };
const PROTOCOLS: Record<number, string> = { 6: "TCP", 17: "UDP", 1: "ICMP" };
const PORTS: Record<number, string> = { 80: "HTTP", 443: "HTTPS", 53: "DNS" };
const hex = (v: number) => `0x${v.toString(16).toUpperCase().padStart(4, "0")}`;

function headers(): Walkthrough {
  const request = "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n";
  const DATA = new TextEncoder().encode(request).length;
  const TCP_H = 20;
  const IP_H = 20;
  const ETH_H = 14;
  const FCS = 4;
  const segment = TCP_H + DATA;
  const packet = IP_H + segment;
  const frame = ETH_H + packet + FCS;
  if (frame < 64) throw new Error("headers: a frame under 64 bytes would be padded, and the figure does not draw padding");
  const etherType = 0x0800;
  const protocol = 6;
  const port = 80;
  // Demultiplex by the same tables the note prints.
  const l3 = ETHERTYPES[etherType];
  const l4 = PROTOCOLS[protocol];
  const app = PORTS[port];
  if (l3 !== "IPv4" || l4 !== "TCP" || app !== "HTTP") throw new Error("headers: the frame must demultiplex to IPv4, TCP and HTTP");

  // Containers: each one's children start 24 below its top and stop 8 above its bottom.
  const W = 480;
  const BOTTOM = 164;
  const box2 = (id: string, x: number, y: number, w: number, h: number, tone: Tone): Item => ({ k: "cell", id, x, y, w, h, text: "", tone });
  type Step = 0 | 1 | 2 | 3 | 4;
  const draw = (step: Step): Item[] => {
    // step 0: arrived; 1: link reads EtherType; 2: IP reads protocol; 3: TCP reads port; 4: delivered.
    const gone = (level: number) => step > level + 1 || (step === 4 && level < 3);
    const toneOf = (level: number, header: boolean): Tone => (gone(level) ? "muted" : step === level + 1 && header ? "accent" : "plain");
    const ink = (level: number, hot: boolean): TextTone => (gone(level) ? "faint" : hot ? "accent" : "ink");
    const items: Item[] = [];
    const container = (id: string, level: number, x: number, w: number, title: string) => {
      const y = level * 24;
      items.push(box2(id, x, y, w, BOTTOM - level * 8 - y, gone(level) ? "muted" : "ghost"));
      items.push(label(`${id}-t`, title, x + 8, y + 12, { anchor: "start", tone: gone(level) ? "faint" : "soft", size: 11, weight: 600 }));
    };
    const header = (id: string, level: number, x: number, w: number, rows: string[], hot: number) => {
      const y = (level + 1) * 24;
      items.push(box2(id, x, y, w, BOTTOM - (level + 1) * 8 - y, toneOf(level, true)));
      rows.forEach((r, i) => items.push(label(`${id}-${i}`, r, x + w / 2, y + 16 + i * 16, { tone: ink(level, step === level + 1 && i === hot), size: 11, mono: i > 0, weight: i === 0 ? 600 : undefined })));
    };
    container("eth", 0, 0, W, `Ethernet frame: ${frame} bytes`);
    header("ethh", 0, 8, 86, ["Ethernet", `${ETH_H} B`, `type ${hex(etherType)}`], 2);
    container("ip", 1, 102, W - 102 - 58, `IP packet: ${packet} bytes`);
    header("iph", 1, 110, 80, ["IPv4", `${IP_H} B`, `proto ${protocol}`], 2);
    container("tcp", 2, 198, W - 198 - 66, `TCP segment: ${segment} bytes`);
    header("tcph", 2, 206, 80, ["TCP", `${TCP_H} B`, `port ${port}`], 2);
    const dx = 294;
    const dy = 72;
    const dw = W - dx - 74;
    items.push(box2("data", dx, dy, dw, BOTTOM - 24 - dy, step === 4 ? "accent" : "plain"));
    const dataInk: TextTone = "ink";
    items.push(label("data-0", "HTTP request", dx + dw / 2, dy + 16, { tone: dataInk, size: 11, weight: 600 }));
    items.push(label("data-1", `${DATA} B`, dx + dw / 2, dy + 32, { tone: dataInk, size: 11, mono: true }));
    items.push(label("data-2", "GET /", dx + dw / 2, dy + 48, { tone: dataInk, size: 11, mono: true }));
    // The trailer, part of the Ethernet level.
    items.push(box2("fcs", W - 50, 24, 42, BOTTOM - 8 - 24, toneOf(0, true)));
    items.push(label("fcs-0", "FCS", W - 29, 40, { tone: ink(0, false), size: 11, weight: 600 }));
    items.push(label("fcs-1", `${FCS} B`, W - 29, 56, { tone: ink(0, false), size: 11, mono: true }));
    const read = [`EtherType ${hex(etherType)} means ${l3}`, `Protocol ${protocol} means ${l4}`, `port ${port} means the ${app} server`, `${DATA} bytes reach the ${app} server`];
    if (step > 0) items.push(label("read", read[step - 1], W / 2, BOTTOM + 20, { tone: step === 4 ? "ink" : "accent", size: 12, weight: 600 }));
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `A browser's request, ${DATA} bytes of text, wrapped three times: a ${TCP_H}-byte TCP header makes a ${segment}-byte segment, a ${IP_H}-byte IP header a ${packet}-byte packet, and Ethernet's ${ETH_H}-byte header and ${FCS}-byte FCS a ${frame}-byte frame.`,
      items: draw(0),
    },
    { caption: `The link layer checks the FCS and reads the EtherType, ${hex(etherType)}: the payload is an ${l3} packet, so it strips the header and trailer and hands the ${packet} bytes to IP.`, items: draw(1) },
    { caption: `IP sees its own address as the destination and reads the Protocol field, ${protocol}: the payload is a ${l4} segment, so the ${segment} bytes go to TCP.`, items: draw(2) },
    { caption: `TCP reads the destination port, ${port}, and finds the socket of the process listening there, the web server.`, items: draw(3) },
    { caption: `The server reads the ${DATA}-byte request. Three header fields, one per layer, named what each payload was; ${frame - DATA} of the frame's ${frame} bytes were headers and trailer.`, items: draw(4) },
  ];
  return finish({ title: "One HTTP request inside TCP, IP and Ethernet", input: `GET / HTTP/1.1 with Host: example.com, sent to port ${port}`, frames });
}

/* ── The hourglass ────────────────────────────────────────────────── */

function hourglass(): Walkthrough {
  type Layer = "Application" | "Transport" | "Internet" | "Link";
  // Each protocol: its layer (by position, as the note's table places it), what carries it, and the number that names it there.
  const P: Record<string, { layer: Layer; x: number; in?: string; via?: string }> = {
    HTTP: { layer: "Application", x: 0, in: "TCP", via: "80" },
    SMTP: { layer: "Application", x: 68, in: "TCP", via: "25" },
    BGP: { layer: "Application", x: 136, in: "TCP", via: "179" },
    DNS: { layer: "Application", x: 220, in: "UDP", via: "53" },
    DHCP: { layer: "Application", x: 288, in: "UDP", via: "67" },
    RIP: { layer: "Application", x: 356, in: "UDP", via: "520" },
    TCP: { layer: "Transport", x: 68, in: "IP", via: "6" },
    UDP: { layer: "Transport", x: 288, in: "IP", via: "17" },
    ICMP: { layer: "Internet", x: 40, in: "IP", via: "1" },
    IP: { layer: "Internet", x: 178, in: "Ethernet", via: "0x0800" },
    OSPF: { layer: "Internet", x: 316, in: "IP", via: "89" },
    ARP: { layer: "Link", x: 40, in: "Ethernet", via: "0x0806" },
    Ethernet: { layer: "Link", x: 178 },
    "Wi-Fi": { layer: "Link", x: 316 },
  };
  const ROWS: Layer[] = ["Application", "Transport", "Internet", "Link"];
  const ROW_H = 78;
  const pos = (name: string) => ({ x: P[name].x, y: ROWS.indexOf(P[name].layer) * ROW_H });
  // The waist: every application protocol's chain of carriers must pass through IP.
  for (const [name, p] of Object.entries(P)) {
    if (p.layer !== "Application") continue;
    const chain: string[] = [];
    for (let at: string | undefined = name; at; at = P[at].in) chain.push(at);
    if (!chain.includes("IP") || !["Ethernet", "Wi-Fi"].includes(chain[chain.length - 1])) throw new Error(`hourglass: ${name} must reach a link through IP (${chain.join(" → ")})`);
  }
  const BH = 24;
  const bw = (name: string) => Math.max(54, Math.ceil(name.length * 6.6 + 14));
  const items: Item[] = [];
  ROWS.forEach((r, i) => items.push(label(`row${i}`, r, -40, i * ROW_H, { anchor: "end", tone: "soft", size: 11.5, weight: 600 })));
  const edges: Array<[string, string, string | undefined]> = Object.entries(P).flatMap(([name, p]) => (p.in ? [[name, p.in, p.via] as [string, string, string | undefined]] : []));
  edges.push(["IP", "Wi-Fi", undefined]);
  for (const [a, b, via] of edges) {
    const pa = pos(a);
    const pb = pos(b);
    const same = pa.y === pb.y;
    // Boxes, not circles: trim the line to the box edge it leaves through.
    const ra = same ? bw(a) / 2 : BH / 2 + 2;
    const rb = same ? bw(b) / 2 : BH / 2 + 2;
    items.push(link(`e${a}-${b}`, pa, pb, ra, { rb, tone: b === "IP" || a === "IP" ? "accent" : "line", label: via }));
  }
  for (const name of Object.keys(P)) {
    const p = pos(name);
    items.push(box(`n${name}`, p.x - bw(name) / 2, p.y - BH / 2, name, { w: bw(name), h: BH, size: 11, tone: name === "IP" ? "strong" : "plain" }));
  }
  const apps = Object.values(P).filter((p) => p.layer === "Application").length;
  return finish({
    title: "The narrow waist: everything over IP, IP over every link",
    input: "",
    frames: [
      {
        caption: `Each line joins a protocol to the one that carries it, labelled with the port, protocol number or EtherType that names it there. All ${apps} application protocols reach the wire through IP, which runs over any link; ICMP and OSPF ride inside IP yet belong to the internet layer.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  mapping,
  headers,
  hourglass,
};
