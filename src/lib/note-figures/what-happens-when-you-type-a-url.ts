import { finish, treeLayout, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { lifelines, message } from "./kit.js";

/**
 * What Happens When You Type a URL: the note's figures
 * (content/notes/computer-networks/what-happens-when-you-type-a-url.md
 * places each with "@figure <name>"):
 *
 *  - first-visit: the journey as a sequence diagram drawn to a time scale,
 *    every arrow placed by adding up the note's round trips (DNS 10 ms,
 *    server 40 ms, 50 ms of server work); the totals — 180 ms, 140 ms over
 *    QUIC, 90 ms on a reused connection — are checked against the note;
 *  - hop-by-hop: the first packet's headers as it leaves the laptop, after
 *    the home router's NAT and after one ISP router, each hop applied to
 *    the headers by the forwarding rules (new MACs every hop, TTL down by
 *    one, addresses rewritten only at the NAT);
 *  - rendering: a tiny page parsed into a DOM, matched against its CSS,
 *    the render tree pruned of what is not displayed, laid out top to
 *    bottom and painted.
 */

/* ── The first visit, on a time scale ─────────────────────────────── */

interface Step {
  name: string;
  /** Who the browser talks to: 0 the resolver, 2 the server. */
  peer: 0 | 2;
  rttMs: number;
  /** Time the far side spends before answering. */
  workMs?: number;
  ask: string;
  answer: string;
}

const STEPS: Step[] = [
  { name: "DNS", peer: 0, rttMs: 10, ask: "A? www.example.com", answer: "203.0.113.10" },
  { name: "TCP", peer: 2, rttMs: 40, ask: "SYN", answer: "SYN-ACK" },
  { name: "TLS 1.3", peer: 2, rttMs: 40, ask: "ACK, ClientHello", answer: "ServerHello … Finished" },
  { name: "HTTP", peer: 2, rttMs: 40, workMs: 50, ask: "Finished, GET /products", answer: "200 OK, first byte" },
];

function schedule(steps: readonly Step[]): Array<{ send: number; arrive: number; reply: number; back: number }> {
  let t = 0;
  return steps.map((s) => {
    const send = t;
    const arrive = send + s.rttMs / 2;
    const reply = arrive + (s.workMs ?? 0);
    const back = reply + s.rttMs / 2;
    t = back;
    return { send, arrive, reply, back };
  });
}

function firstVisit(): Walkthrough {
  const times = schedule(STEPS);
  const total = times[times.length - 1].back;
  const ends = times.map((t) => t.back);
  if (ends.join(",") !== "10,50,90,180") throw new Error(`first-visit: running totals ${ends.join(", ")}, the note says 10, 50, 90, 180`);
  // HTTP/3: QUIC merges the TCP and TLS round trips into one.
  const quic = schedule([STEPS[0], { ...STEPS[2], name: "QUIC + TLS" }, STEPS[3]]);
  const quicTotal = quic[quic.length - 1].back;
  // A repeat visit over a kept-alive connection: only the request remains.
  const repeat = schedule([STEPS[3]])[0].back;
  if (quicTotal !== 140 || repeat !== 90) throw new Error(`first-visit: QUIC ${quicTotal} ms, repeat ${repeat} ms, the note says 140 and 90`);

  const PX = 1.9;
  const Y0 = 48;
  const y = (ms: number) => Y0 + ms * PX;
  const L = lifelines("ll", ["resolver", "browser", "server"], { x: 0, gap: 0, w: 96, h: 28, length: y(total) - 28 + 14 });
  // Uneven lanes: the resolver is close, the server far.
  const X = [0, 136, 386];
  const lanes: Item[] = L.items.map((it) => {
    const i = Number(it.id.replace(/\D/g, ""));
    if (it.k === "edge") return { ...it, x1: X[i], x2: X[i] };
    if (it.k === "cell") return { ...it, x: X[i] - 48 };
    return it;
  });
  const stepItems = (k: number, hot: boolean): Item[] => {
    const s = STEPS[k];
    const t = times[k];
    const far = X[s.peer];
    // DNS is so quick that its two arrows nearly touch at this scale: its answer is labelled under its arrow instead of over it.
    const under = t.back - t.send < 20;
    const items: Item[] = [
      ...message(`q${k}`, X[1], far, y(t.send), s.ask, { drop: (t.arrive - t.send) * PX, tone: hot ? "accent" : "ink", size: 11 }),
      ...message(`a${k}`, far, X[1], y(t.reply), under ? "" : s.answer, { drop: (t.back - t.reply) * PX, tone: hot ? "accent" : "ink", dashed: true, size: 11 }),
      // The clock: a time axis down the left edge, level with each answer's arrival.
      label(`t${k}`, `${t.back} ms`, -30, y(t.back), { anchor: "end", size: 11, tone: hot ? "accent" : "soft", mono: true, weight: 600 }),
      { k: "path", id: `tg${k}`, pts: [[-26, y(t.back)], [X[1] - 4, y(t.back)]], tone: "faint", dashed: true, width: 1 },
    ];
    if (under) items.push(label(`a${k}-u`, s.answer, (X[1] + far) / 2, y(t.back) + 12, { size: 11, tone: hot ? "accent" : "ink", mono: true }));
    if (s.workMs) items.push({ k: "cell", id: `w${k}`, x: far - 5, y: y(t.arrive), w: 10, h: s.workMs * PX, text: "", tone: hot ? "accent" : "muted" }, label(`wl${k}`, `builds the page, ${s.workMs} ms`, far - 12, y(t.arrive) + (s.workMs * PX) / 2, { anchor: "end", size: 11, tone: "soft" }));
    return items;
  };
  const axis: Item[] = [label("tzero", "0 ms", -30, Y0, { anchor: "end", size: 11, tone: "faint", mono: true }), { k: "path", id: "tax", pts: [[-22, Y0], [-22, y(total)]], tone: "line", width: 1 }];
  const upto = (n: number): Item[] => [...lanes, ...axis, ...STEPS.slice(0, n).flatMap((_, k) => stepItems(k, k === n - 1))];
  const frames: Frame[] = [
    {
      caption: `DNS first: there is nothing to connect to until the name is an address. The recursive resolver, ${STEPS[0].rttMs} ms away, has www.example.com cached and answers ${STEPS[0].answer}.`,
      items: upto(1),
    },
    {
      caption: `The TCP handshake with the server, ${STEPS[1].rttMs} ms away: SYN out, SYN-ACK back. The browser's ACK will ride with its next message, so the clock reads ${ends[1]} ms.`,
      items: upto(2),
    },
    {
      caption: `TLS 1.3 needs one more round trip: key shares, the certificate and Finished. ${ends[2]} ms have passed and not one byte of the page has been asked for.`,
      items: upto(3),
    },
    {
      caption: `The GET goes out, the server spends ${STEPS[3].workMs} ms building the page, and the first byte of HTML arrives at ${total} ms — before any CSS or image. Over QUIC it would be ${quicTotal} ms; on a reused connection, ${repeat} ms.`,
      items: upto(4),
    },
  ];
  return finish({ title: "A first visit on a time scale: the first byte after 180 ms", input: "resolver 10 ms away (cached), server 40 ms away, 50 ms of server work, TLS 1.3", frames });
}

/* ── Hop by hop: what changes in the headers ──────────────────────── */

interface Headers {
  dstMac: string;
  srcMac: string;
  srcIp: string;
  dstIp: string;
  ttl: number;
  srcPort: number;
  dstPort: number;
}

function hopByHop(): Walkthrough {
  const start: Headers = { dstMac: "home router", srcMac: "laptop", srcIp: "192.168.1.10", dstIp: "203.0.113.10", ttl: 64, srcPort: 51000, dstPort: 443 };
  // Each hop: the router forwards to its next hop's MAC from its own outgoing interface, decrements TTL, and the home router also translates.
  const hops = [
    { at: "home router", out: "home router", next: "ISP router", nat: { ip: "203.0.113.5", port: 40001 } },
    { at: "ISP router", out: "ISP router", next: "next router", nat: undefined },
  ];
  const states: Headers[] = [start];
  for (const h of hops) {
    const prev = states[states.length - 1];
    if (prev.dstMac !== h.at) throw new Error(`hop-by-hop: the frame was not addressed to ${h.at}`);
    const next: Headers = { ...prev, dstMac: h.next, srcMac: h.out, ttl: prev.ttl - 1 };
    if (h.nat) {
      next.srcIp = h.nat.ip;
      next.srcPort = h.nat.port;
    }
    states.push(next);
  }
  if (states.some((s) => s.dstIp !== start.dstIp)) throw new Error("hop-by-hop: the destination address changed");

  const path = ["laptop", "home router", "ISP router", "…", "server"];
  const PW = 86;
  const fields = (h: Headers): Array<[string, string[], keyof Headers | null, (keyof Headers)[]]> => [
    ["Ethernet", [`to: ${h.dstMac}`, `from: ${h.srcMac}`], null, ["dstMac", "srcMac"]],
    ["IP", [`from ${h.srcIp}`, `to ${h.dstIp}`, `TTL ${h.ttl}`], null, ["srcIp", "dstIp", "ttl"]],
    ["TCP", [`port ${h.srcPort}`, `port ${h.dstPort}`], null, ["srcPort", "dstPort"]],
  ];
  const draw = (k: number): Item[] => {
    const h = states[k];
    const prev = states[k - 1];
    const items: Item[] = [];
    path.forEach((p, i) => {
      const x = i * (PW + 13);
      items.push(box(`n${i}`, x, 0, p, { w: PW, h: 28, size: 11, tone: i === k ? "accent" : i < k ? "muted" : "plain" }));
      if (i < path.length - 1) items.push(arrow(`na${i}`, { x: x + PW + 2, y: 14 }, { x: x + PW + 11, y: 14 }, { tone: i === k ? "accent" : "line" }));
    });
    items.push(label("on", k === 0 ? "leaving the laptop" : `leaving the ${hops[k - 1].at}`, 0, 52, { anchor: "start", size: 11.5, tone: "ink", weight: 600 }));
    const W = [70, 146, 146, 64];
    let row = 0;
    for (const [layer, texts, , keys] of fields(h)) {
      const yy = 66 + row * 38;
      items.push(box(`l${row}`, 0, yy, layer, { w: W[0], h: 32, size: 11.5, tone: "muted" }));
      let x = W[0] + 4;
      texts.forEach((t, c) => {
        const changed = prev !== undefined && prev[keys[c]] !== h[keys[c]];
        items.push(box(`f${row}-${c}`, x, yy, t, { w: W[c + 1], h: 32, size: 11.5, tone: changed ? "accent" : "plain" }));
        x += W[c + 1] + 4;
      });
      row++;
    }
    const yy = 66 + row * 38;
    items.push(box("l3", 0, yy, "TLS", { w: W[0], h: 32, size: 11.5, tone: "muted" }));
    items.push(box("f3", W[0] + 4, yy, "encrypted: GET /products?id=7 …", { w: W[1] + W[2] + 4, h: 32, size: 11.5, tone: "plain" }));
    return items;
  };
  const changedList = (k: number) => (["dstMac", "srcMac", "srcIp", "dstIp", "ttl", "srcPort", "dstPort"] as const).filter((f) => states[k][f] !== states[k - 1][f]);
  const c1 = changedList(1);
  const c2 = changedList(2);
  if (!c1.includes("srcIp") || c2.includes("srcIp") || !c2.includes("dstMac")) throw new Error("hop-by-hop: the rewrites are not the ones the captions describe");
  return finish({
    title: "The first packet hop by hop: what changes and what never does",
    input: "laptop 192.168.1.10 to server 203.0.113.10:443, home router public address 203.0.113.5",
    frames: [
      {
        caption: "The server is on another network, so the Ethernet frame is addressed to the home router's MAC address (found by ARP), while the IP packet inside is addressed to the server itself.",
        items: draw(0),
      },
      {
        caption: `The home router rebuilds the frame for its next link with new MAC addresses, lowers the TTL to ${states[1].ttl}, and its NAT rewrites the private source to ${states[1].srcIp}, port ${states[1].srcPort}. These ${c1.length} fields change.`,
        items: draw(1),
      },
      {
        caption: `At the ISP's router only the frame and the TTL change: new MAC addresses for the next link, TTL ${states[2].ttl}. The IP addresses and ports now stay fixed all the way to the server.`,
        items: draw(2),
      },
    ],
  });
}

/* ── Rendering: DOM, CSSOM, render tree, layout, paint ────────────── */

interface El {
  id: string;
  tag: string;
  cls?: string;
  text: string;
  kids: El[];
}

/** A tokenizer for the tiny page: tags with an optional class, and text. Enough to build its DOM honestly. */
function parseHtml(html: string): El {
  const root: El = { id: "doc", tag: "#document", text: "", kids: [] };
  const stack: El[] = [root];
  let n = 0;
  for (const m of html.matchAll(/<(\/?)([a-z0-9]+)(?:\s+class="([^"]+)")?\s*>|([^<]+)/g)) {
    const top = stack[stack.length - 1];
    if (m[4]) {
      if (m[4].trim()) top.text += m[4].trim();
    } else if (m[1]) stack.pop();
    else {
      const el: El = { id: `e${n++}`, tag: m[2], cls: m[3], text: "", kids: [] };
      top.kids.push(el);
      stack.push(el);
    }
  }
  return root.kids[0];
}

function rendering(): Walkthrough {
  const html = '<html><head><title>Shop</title></head><body><h1>Shop</h1><p class="promo">Sale</p><p>Hello</p></body></html>';
  const css: Array<{ sel: string; display?: string; size?: number }> = [
    { sel: "head", display: "none" },
    { sel: "h1", size: 32 },
    { sel: "p", size: 16 },
    { sel: ".promo", display: "none" },
  ];
  const dom = parseHtml(html);
  const matches = (e: El, sel: string) => (sel.startsWith(".") ? e.cls === sel.slice(1) : e.tag === sel);
  const style = (e: El) => {
    const st: { display: string; size: number } = { display: "block", size: 16 };
    for (const r of css) if (matches(e, r.sel)) Object.assign(st, Object.fromEntries(Object.entries({ display: r.display, size: r.size }).filter(([, v]) => v !== undefined)));
    return st;
  };
  // The render tree: the DOM minus anything display: none, and everything under it.
  const shown = new Set<string>();
  const walk = (e: El) => {
    if (style(e).display === "none") return;
    shown.add(e.id);
    e.kids.forEach(walk);
  };
  walk(dom);
  // Layout: block boxes stacked top to bottom, each line 1.25 × its font size, no margins.
  const boxes: Array<{ id: string; text: string; y: number; h: number; size: number }> = [];
  let cursor = 0;
  const lay = (e: El) => {
    if (!shown.has(e.id)) return;
    if (e.text && e.kids.length === 0) {
      const h = style(e).size * 1.25;
      boxes.push({ id: e.id, text: e.text, y: cursor, h, size: style(e).size });
      cursor += h;
    }
    e.kids.forEach(lay);
  };
  lay(dom);
  if (boxes.map((b) => b.text).join(",") !== "Shop,Hello" || cursor !== 60) throw new Error(`rendering: laid out ${boxes.map((b) => b.text)} to ${cursor}px`);

  const all: El[] = [];
  const collect = (e: El) => {
    all.push(e);
    e.kids.forEach(collect);
  };
  collect(dom);
  const byId = new Map(all.map((e) => [e.id, e]));
  const at = treeLayout(dom.id, (id) => byId.get(id)!.kids.map((k) => k.id), { dx: 72, dy: 56 });
  const NW = 64;
  const name = (e: El) => (e.cls ? `${e.tag}.${e.cls}` : e.tag);
  const tree = (tone: (e: El) => Tone, edgeTone: (e: El) => "line" | "faint"): Item[] => {
    const items: Item[] = [];
    for (const e of all)
      for (const k of e.kids) {
        const a = at.get(e.id)!;
        const b = at.get(k.id)!;
        items.push({ k: "edge", id: `te${k.id}`, x1: a.x, y1: a.y + 13, x2: b.x, y2: b.y - 13, tone: edgeTone(k) });
      }
    for (const e of all) {
      const p = at.get(e.id)!;
      items.push(box(`tn${e.id}`, p.x - NW / 2, p.y - 13, name(e), { w: NW, h: 26, size: 11, tone: tone(e) }));
      if (e.text && e.kids.length === 0) items.push(label(`tt${e.id}`, `"${e.text}"`, p.x, p.y + 24, { size: 10.5, tone: tone(e) === "muted" ? "faint" : "soft", mono: true }));
    }
    return items;
  };
  const right = Math.max(...[...at.values()].map((p) => p.x)) + NW / 2 + 28;
  const cssLines = css.map((r) => `${r.sel} { ${r.display ? `display: ${r.display}` : `font-size: ${r.size}px`} }`);
  const cssPanel = (hot: Set<number>): Item[] => [
    label("ch", "CSSOM", right, -4, { anchor: "start", size: 11.5, tone: "ink", weight: 600 }),
    ...cssLines.map((t, i) => label(`cl${i}`, t, right, 18 + i * 18, { anchor: "start", size: 11, mono: true, tone: hot.has(i) ? "accent" : "soft" })),
  ];
  const PAGE_W = 150;
  const page = (paint: boolean): Item[] => {
    const top = 112;
    const items: Item[] = [label("ph", paint ? "painted" : "layout", right, top - 14, { anchor: "start", size: 11.5, tone: "ink", weight: 600 })];
    items.push({ k: "cell", id: "pg", x: right, y: top, w: PAGE_W, h: cursor + 24, text: "", tone: "plain" });
    for (const b of boxes) {
      items.push({ k: "cell", id: `pb${b.id}`, x: right + 8, y: top + 12 + b.y, w: PAGE_W - 16, h: b.h, text: paint ? b.text : "", tone: paint ? "strong" : "ghost", size: Math.min(15, b.size * 0.5 + 4) });
      if (!paint) items.push(label(`py${b.id}`, `y ${b.y}, h ${b.h}`, right + PAGE_W / 2, top + 12 + b.y + b.h / 2, { size: 10.5, tone: "accent", mono: true }));
    }
    return items;
  };
  const hidden = all.filter((e) => !shown.has(e.id)).map(name);
  const frames: Frame[] = [
    {
      caption: "The HTML parser turns the markup into the DOM, a tree of element nodes, while the bytes are still arriving. Every element is in it, the head and the hidden promotion included.",
      items: [...tree(() => "plain", () => "line")],
    },
    {
      caption: "The CSS is parsed into the CSSOM, a set of rules the browser matches against every DOM node. Here two rules hide things and two set font sizes.",
      items: [...tree(() => "plain", () => "line"), ...cssPanel(new Set())],
    },
    {
      caption: `DOM plus CSSOM gives the render tree: only what will be drawn. Rules with display: none drop ${hidden.filter((h) => !h.includes("title")).join(" and ")} and everything inside them, so the title and "Sale" never reach the screen.`,
      items: [...tree((e) => (shown.has(e.id) ? "accent" : "muted"), (e) => (shown.has(e.id) ? "line" : "faint")), ...cssPanel(new Set([0, 3]))],
    },
    {
      caption: `Layout computes each box's position and size: the 32 px heading takes ${boxes[0].h} px from the top, and the paragraph starts at y ${boxes[1].y}. Change a size or add text and this step, a reflow, runs again.`,
      items: [...tree((e) => (shown.has(e.id) ? "accent" : "muted"), (e) => (shown.has(e.id) ? "line" : "faint")), ...cssPanel(new Set([1, 2])), ...page(false)],
    },
    {
      caption: "Paint fills each box with pixels, text, colours and borders, and compositing stacks the painted layers on screen. Only now does the visitor see the page.",
      items: [...tree((e) => (shown.has(e.id) ? "accent" : "muted"), (e) => (shown.has(e.id) ? "line" : "faint")), ...cssPanel(new Set()), ...page(true)],
    },
  ];
  return finish({ title: "From HTML to pixels: DOM, CSSOM, render tree, layout and paint", input: "a page with a heading, a hidden promotion and a paragraph", frames });
}

/* ── The server side: where a request is answered ─────────────────── */

interface Tier {
  name: string;
  /** Answers the path itself, or passes it on. */
  answers: (path: string) => boolean;
  /** Where TLS ends: the hop after this one is plain HTTP inside the data centre. */
  terminatesTls?: boolean;
}

function serverSide(): Walkthrough {
  const edgeCache = new Set(["/logo.png", "/app.css"]);
  const redis = new Map<string, string>([["product:3", "cached"]]);
  const tiers: Tier[] = [
    { name: "CDN edge", answers: (p) => edgeCache.has(p) },
    { name: "load balancer", answers: () => false, terminatesTls: true },
    { name: "web server", answers: (p) => p.startsWith("/static/") },
    { name: "app server", answers: () => false },
    { name: "cache", answers: (p) => redis.has(`product:${new URLSearchParams(p.split("?")[1] ?? "").get("id")}`) },
    { name: "database", answers: () => true },
  ];
  const walk = (path: string) => {
    const seen: number[] = [];
    for (let i = 0; i < tiers.length; i++) {
      seen.push(i);
      if (tiers[i].answers(path)) return { seen, by: i };
    }
    throw new Error(`server-side: nobody answered ${path}`);
  };
  const img = walk("/logo.png");
  const page = walk("/products?id=7");
  if (img.by !== 0 || tiers[page.by].name !== "database" || !page.seen.includes(4)) throw new Error("server-side: the paths differ from the captions");
  const tlsEnd = tiers.findIndex((t) => t.terminatesTls);

  const BW = 100;
  const GAP = 18;
  // The chain runs along the top to the web server, then down: the app server under it, its cache to the left, the database below.
  const COL = (c: number) => c * (BW + GAP);
  const AT = [
    { x: COL(1), y: 0 },
    { x: COL(2), y: 0 },
    { x: COL(3), y: 0 },
    { x: COL(3), y: 72 },
    { x: COL(2), y: 72 },
    { x: COL(3), y: 144 },
  ];
  const pos = (i: number) => AT[i];
  // Each tier's arrow comes from the one that hands it the request.
  const fromOf = [-1, 0, 1, 2, 3, 3];
  const H = 32;
  const edge = (i: number): [{ x: number; y: number }, { x: number; y: number }] => {
    const a = fromOf[i] < 0 ? { x: 0, y: 0 } : pos(fromOf[i]);
    const b = pos(i);
    if (a.y === b.y) return b.x > a.x ? [{ x: a.x + BW + 2, y: a.y + H / 2 }, { x: b.x - 3, y: b.y + H / 2 }] : [{ x: a.x - 2, y: a.y + H / 2 }, { x: b.x + BW + 3, y: b.y + H / 2 }];
    return [{ x: a.x + BW / 2, y: a.y + H + 2 }, { x: b.x + BW / 2, y: b.y - 3 }];
  };
  const draw = (r: { seen: number[]; by: number }, path: string): Item[] => {
    const items: Item[] = [box("br", 0, 0, "browser", { w: BW, h: 32, size: 11.5, tone: "accent" })];
    tiers.forEach((t, i) => {
      const p = pos(i);
      const tone: Tone = i === r.by ? "strong" : r.seen.includes(i) ? (i >= 4 ? "muted" : "accent") : "plain";
      items.push(box(`b${i}`, p.x, p.y, t.name, { w: BW, h: 32, size: 11.5, tone }));
    });
    for (let i = 0; i < tiers.length; i++) {
      const [a, b] = edge(i);
      const used = r.seen.includes(i);
      items.push(arrow(`e${i}`, a, b, { tone: used ? "accent" : "line", dashed: !used }));
    }
    items.push(label("https", "HTTPS", BW + GAP / 2, -12, { size: 11, tone: "soft" }));
    items.push(label("plain", "plain HTTP", pos(tlsEnd).x + BW + GAP / 2, -12, { size: 11, tone: "soft" }));
    items.push(label("req", `GET ${path}`, 0, 92, { anchor: "start", size: 12, tone: "ink", mono: true, weight: 600 }));
    items.push(label("by", `answered by: ${tiers[r.by].name}`, 0, 114, { anchor: "start", size: 11.5, tone: "accent", weight: 600 }));
    return items;
  };
  return finish({
    title: "Behind the server's address: where a request is answered",
    input: "a CDN in front of a load balancer, web and app servers, a cache and a database",
    frames: [
      {
        caption: "DNS pointed the browser at a nearby CDN edge, not the origin. The logo is in the edge's cache, so the edge answers at once and nothing behind it hears about the request.",
        items: draw(img, "/logo.png"),
      },
      {
        caption: `The product page is dynamic: the edge passes it on. TLS ends at the ${tiers[tlsEnd].name}, which picks a server; the app server misses in the cache for product 7 and reads the database, and the HTML returns the same way.`,
        items: draw(page, "/products?id=7"),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "first-visit": firstVisit,
  "hop-by-hop": hopByHop,
  rendering,
  "server-side": serverSide,
};
