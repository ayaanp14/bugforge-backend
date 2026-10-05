import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";

/**
 * IP Addressing and Subnetting: the note's figures (content/notes/
 * computer-networks/ip-addressing-and-subnetting.md places each with
 * "@figure <name>"). Every number is bit arithmetic on 32-bit integers —
 * mask = ones shifted by the prefix, network = address AND mask, broadcast
 * = network OR NOT mask — and each figure checks itself against the rows
 * the note prints, so a figure and its table cannot disagree.
 *
 *  - classes: the first octet's 256 values split by each class's leading
 *    bits into the ranges A to E.
 *  - bits: 192.168.10.150/26 as 32 bits, the mask's boundary, the AND that
 *    gives the network and the OR that gives the broadcast.
 *  - split: 192.168.10.0/24 into four /26s, the two borrowed bits counting
 *    00 to 11 and each subnet's network, hosts and broadcast from its bits.
 *  - vlsm: the note's VLSM task allocated largest first, each block the
 *    smallest 2^h − 2 that fits and aligned to its own size.
 *  - supernet: the common prefix of four /24s (a /22), then a set whose
 *    common prefix covers more networks than it holds.
 */

/* ── 32-bit arithmetic ────────────────────────────────────────────── */

const toInt = (ip: string) => ip.split(".").reduce((n, p) => n * 256 + Number(p), 0);
const toIp = (n: number) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
const maskOf = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);
const and = (a: number, b: number) => (a & b) >>> 0;
const or = (a: number, b: number) => (a | b) >>> 0;
const not = (a: number) => ~a >>> 0;
const bitsOf = (n: number, width = 32) => n.toString(2).padStart(width, "0");
const lastOctet = (n: number) => n % 256;

function describe(cidr: string) {
  const [ip, p] = cidr.split("/");
  const prefix = Number(p);
  const mask = maskOf(prefix);
  const network = and(toInt(ip), mask);
  const broadcast = or(network, not(mask));
  return { prefix, mask, network, broadcast, first: network + 1, last: broadcast - 1, hosts: 2 ** (32 - prefix) - 2 };
}

/* ── Address classes ──────────────────────────────────────────────── */

function classes(): Walkthrough {
  const defs = [
    { c: "A", lead: "0", mask: "/8" },
    { c: "B", lead: "10", mask: "/16" },
    { c: "C", lead: "110", mask: "/24" },
    { c: "D", lead: "1110", mask: "" },
    { c: "E", lead: "1111", mask: "" },
  ];
  // A class is every first octet that starts with its leading bits.
  const ranges = defs.map((d) => {
    const free = 8 - d.lead.length;
    const lo = parseInt(d.lead, 2) * 2 ** free;
    return { ...d, lo, hi: lo + 2 ** free - 1 };
  });
  const expected = ["0-127", "128-191", "192-223", "224-239", "240-255"];
  ranges.forEach((r, i) => {
    if (`${r.lo}-${r.hi}` !== expected[i]) throw new Error(`classes: the note's table gives class ${r.c} as ${expected[i]}, computed ${r.lo}-${r.hi}`);
  });
  // One row per class: its leading bits, then its slice of the first octet's 0–255 drawn to scale.
  const U = 1.4;
  const RH = 24;
  const PITCH = 30;
  const BX = 112;
  const items: Item[] = [
    label("hl", "class", 13, -14, { tone: "faint", size: 10.5 }),
    label("hb", "leading bits", 40, -14, { anchor: "start", tone: "faint", size: 10.5 }),
    label("hr", "first octet, 0 to 255", BX + 256 * U, -14, { anchor: "end", tone: "faint", size: 10.5 }),
  ];
  ranges.forEach((r, i) => {
    const y = i * PITCH;
    items.push(box(`kc${i}`, 0, y, r.c, { w: 26, h: RH, size: 12, tone: i < 3 ? "accent" : "muted" }));
    items.push(label(`kl${i}`, r.lead, 40, y + RH / 2, { anchor: "start", tone: "ink", size: 11.5, mono: true }));
    items.push({ k: "band", id: `kg${i}`, x: BX, y, w: 256 * U, h: RH, tone: "muted" });
    const x = BX + r.lo * U;
    const w = (r.hi - r.lo + 1) * U;
    items.push(box(`kb${i}`, x, y, "", { w, h: RH, tone: i < 3 ? "accent" : "plain" }));
    const text = `${r.lo}–${r.hi}${r.mask ? ` · ${r.mask}` : ""}`;
    // Inside the bar when it fits, otherwise just left of it.
    if (w >= text.length * 6.6 + 12) items.push(label(`kr${i}`, text, x + w / 2, y + RH / 2, { tone: "ink", size: 11, mono: true }));
    else items.push(label(`kr${i}`, text, x - 6, y + RH / 2, { anchor: "end", tone: "ink", size: 11, mono: true }));
  });
  const axisY = ranges.length * PITCH + 4;
  for (const t of [0, 128, 192, 224]) items.push(label(`ax${t}`, String(t), BX + t * U, axisY, { tone: "faint", size: 10, mono: true }));
  return finish({
    title: "Address classes by their leading bits",
    input: "",
    frames: [
      {
        caption: `A class is fixed by the first bits of the first octet: a leading 0 is class A, half of all addresses (${ranges[0].lo} to ${ranges[0].hi}); 10 is B and 110 is C, each half of what is left. D (1110) is multicast and E (1111) reserved, with no default mask.`,
        items,
      },
    ],
  });
}

/* ── One address against its mask ─────────────────────────────────── */

function bits(): Walkthrough {
  const CIDR = "192.168.10.150/26";
  const ip = toInt(CIDR.split("/")[0]);
  const d = describe(CIDR);
  if (toIp(d.mask) !== "255.255.255.192" || toIp(d.network) !== "192.168.10.128" || toIp(d.broadcast) !== "192.168.10.191" || d.hosts !== 62) {
    throw new Error(`bits: the note's worked example says mask 255.255.255.192, network .128, broadcast .191, 62 hosts; computed ${toIp(d.mask)}, ${toIp(d.network)}, ${toIp(d.broadcast)}, ${d.hosts}`);
  }
  const CW = 12;
  const CH = 20;
  const GAP = 1;
  const OCT = 6;
  const PITCH = 46;
  const xOf = (i: number) => i * (CW + GAP) + Math.floor(i / 8) * OCT;
  const octetMid = (o: number) => (xOf(o * 8) + xOf(o * 8 + 7) + CW) / 2;
  const boundary = (xOf(d.prefix - 1) + CW + xOf(d.prefix)) / 2;
  const rows = [
    { id: "a", name: "address", value: ip },
    { id: "m", name: "mask /26", value: d.mask },
    { id: "n", name: "network", value: d.network },
    { id: "b", name: "broadcast", value: d.broadcast },
  ];
  const draw = (shown: number): Item[] => {
    const items: Item[] = [];
    rows.slice(0, shown).forEach((r, k) => {
      const y = k * PITCH;
      const b = bitsOf(r.value);
      const result = k >= 2;
      items.push(label(`${r.id}l`, r.name, -10, y + CH / 2, { anchor: "end", tone: result ? "ink" : "soft", size: 11.5, weight: result ? 600 : undefined }));
      for (let i = 0; i < 32; i++) {
        const net = i < d.prefix;
        const tone: Tone = shown === 1 ? "plain" : r.id === "m" ? (net ? "accent" : "plain") : result && k === shown - 1 ? (net ? "accent" : "strong") : net ? "accent" : "plain";
        items.push(box(`${r.id}${i}`, xOf(i), y, b[i], { w: CW, h: CH, size: 11, tone }));
      }
      const dec = toIp(r.value).split(".");
      dec.forEach((v, o) => items.push(label(`${r.id}d${o}`, v, octetMid(o), y + CH + 11, { tone: (result ? "ink" : "soft") as TextTone, size: 11, mono: true, weight: result && o === 3 ? 600 : undefined })));
    });
    if (shown >= 2) {
      items.push({ k: "edge", id: "cut", x1: boundary, y1: -16, x2: boundary, y2: (shown - 1) * PITCH + CH + 4, tone: "accent", dashed: true });
      items.push(label("cutl", `/${d.prefix}`, boundary, -24, { tone: "accent", size: 11.5, weight: 600, mono: true }));
      items.push(label("netl", "network bits", xOf(0), -24, { anchor: "start", tone: "soft", size: 11 }));
      items.push(label("hostl", "host bits", xOf(31) + CW, -24, { anchor: "end", tone: "soft", size: 11 }));
    }
    return items;
  };
  const hostBits = 32 - d.prefix;
  return finish({
    title: "Finding the network and broadcast address with bits",
    input: CIDR,
    frames: [
      { caption: `Every IPv4 address is 32 bits, four octets of eight. The last octet here is 150 = ${bitsOf(150, 8)} in binary; the first three are 192, 168 and 10.`, items: draw(1) },
      { caption: `/${d.prefix} means the mask is ${d.prefix} ones and then ${hostBits} zeros, ${toIp(d.mask)}. Bits left of the line name the network; the ${hostBits} to its right name a host on it.`, items: draw(2) },
      { caption: `AND each bit with the mask: the network bits pass through and the host bits become 0. The last octet ${bitsOf(150, 8)} becomes ${bitsOf(lastOctet(d.network), 8)}, so the network address is ${toIp(d.network)}.`, items: draw(3) },
      {
        caption: `Set every host bit to 1 instead and you get the broadcast address, ${toIp(d.broadcast)}. The ${hostBits} host bits give 2^${hostBits} = ${2 ** hostBits} addresses; less these two, ${d.hosts} hosts, .${lastOctet(d.first)} to .${lastOctet(d.last)}.`,
        items: draw(4),
      },
    ],
  });
}

/* ── A /24 into four /26s ─────────────────────────────────────────── */

const U = 1.7; // px per address on the 0–255 bar

function bar(prefix: string, blocks: Array<{ lo: number; size: number; text: string; tone: Tone }>, y: number): Item[] {
  const items: Item[] = [];
  blocks.forEach((b, i) => items.push(box(`${prefix}${i}`, b.lo * U, y, b.size * U >= b.text.length * 6.6 + 6 ? b.text : "", { w: b.size * U, h: 30, size: 11, tone: b.tone })));
  return items;
}

function split(): Walkthrough {
  const BASE = toInt("192.168.10.0");
  const FROM = 24;
  const NEED = 4;
  let s = 0;
  while (2 ** s < NEED) s++;
  const prefix = FROM + s;
  const hostBits = 32 - prefix;
  const size = 2 ** hostBits;
  const subnets = Array.from({ length: 2 ** s }, (_, k) => describe(`${toIp(BASE + k * size)}/${prefix}`));
  // The note's table, row by row.
  const table = [
    ["192.168.10.0", "192.168.10.1", "192.168.10.62", "192.168.10.63"],
    ["192.168.10.64", "192.168.10.65", "192.168.10.126", "192.168.10.127"],
    ["192.168.10.128", "192.168.10.129", "192.168.10.190", "192.168.10.191"],
    ["192.168.10.192", "192.168.10.193", "192.168.10.254", "192.168.10.255"],
  ];
  subnets.forEach((d, k) => {
    const got = [d.network, d.first, d.last, d.broadcast].map(toIp);
    if (got.join() !== table[k].join() || d.hosts !== 62) throw new Error(`split: subnet ${k + 1} is ${got.join(", ")}, the note says ${table[k].join(", ")}`);
  });
  if (subnets.length * size !== 256) throw new Error("split: the subnets must cover the /24 exactly");

  const CW = 24;
  const CH = 24;
  const X0 = 78;
  const bitX = (i: number) => X0 + i * (CW + 3);
  const BAR_Y = 118;
  const octet = (id: string, y: number, name: string, value: number | null, sub: string): Item[] => {
    const items: Item[] = [label(`${id}l`, name, X0 - 10, y + CH / 2, { anchor: "end", tone: "soft", size: 11.5 })];
    const b = value === null ? null : bitsOf(value, 8);
    for (let i = 0; i < 8; i++) {
      const isSub = i < s;
      const text = b ? b[i] : isSub ? "s" : "h";
      items.push(box(`${id}${i}`, bitX(i), y, text, { w: CW, h: CH, size: 12, tone: isSub ? "accent" : "plain" }));
    }
    items.push(label(`${id}v`, sub, bitX(8) + 6, y + CH / 2, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    return items;
  };
  const draw = (cur: number | null, done: number): Item[] => {
    const items: Item[] = [];
    if (cur === null) {
      items.push(...octet("r1", 0, "last octet", null, `${s} subnet bits, ${hostBits} host bits`));
    } else {
      const d = subnets[cur];
      items.push(...octet("r1", 0, "network", lastOctet(d.network), `.${lastOctet(d.network)}`));
      items.push(...octet("r2", CH + 10, "broadcast", lastOctet(d.broadcast), `.${lastOctet(d.broadcast)}`));
      items.push(label("info", `hosts .${lastOctet(d.first)} to .${lastOctet(d.last)}: 2^${hostBits} − 2 = ${d.hosts}`, 0, 84, { anchor: "start", tone: "ink", size: 12, mono: true }));
    }
    items.push(
      ...bar(
        "s",
        subnets.map((d, k) => ({ lo: lastOctet(d.network), size, text: `.${lastOctet(d.network)}/${prefix}`, tone: (k === cur ? "accent" : k < done ? "plain" : "ghost") as Tone })),
        BAR_Y,
      ),
    );
    subnets.forEach((d, k) => items.push(label(`st${k}`, String(lastOctet(d.network)), lastOctet(d.network) * U, BAR_Y + 42, { tone: "faint", size: 10.5, mono: true })));
    items.push(label("st4", "255", 256 * U, BAR_Y + 42, { tone: "faint", size: 10.5, mono: true }));
    return items;
  };

  const frames: Frame[] = [
    {
      caption: `Four subnets need ${s} borrowed bits, since 2^${s} = ${2 ** s}, so the prefix grows from /${FROM} to /${prefix}. That leaves ${hostBits} host bits: each subnet is a block of ${size} addresses.`,
      items: draw(null, 0),
    },
  ];
  subnets.forEach((d, k) => {
    const sb = bitsOf(k, s);
    frames.push({
      caption:
        k === 0
          ? `Subnet bits ${sb}: with the host bits all 0 the last octet is ${lastOctet(d.network)}, the network address; all 1 gives ${lastOctet(d.broadcast)}, the broadcast. Everything between is a host.`
          : `Subnet bits ${sb}: the network is .${lastOctet(d.network)} and the broadcast .${lastOctet(d.broadcast)}, so this block starts exactly where the last one ended.${k === subnets.length - 1 ? ` The four blocks fill the /${FROM}: ${subnets.length} × ${size} = 256.` : ""}`,
      items: draw(k, k),
    });
  });
  return finish({ title: "Splitting a /24 into four /26 subnets", input: "192.168.10.0/24 into 4 equal subnets", frames });
}

/* ── VLSM, largest first ──────────────────────────────────────────── */

function vlsm(): Walkthrough {
  const BASE = toInt("192.168.10.0");
  const needs = [100, 50, 20, 2];
  const order = [...needs].sort((a, b) => b - a);
  type Block = { need: number; prefix: number; lo: number; size: number; d: ReturnType<typeof describe> };
  const blocks: Block[] = [];
  let cursor = 0;
  for (const need of order) {
    let h = 0;
    while (2 ** h - 2 < need) h++;
    const size = 2 ** h;
    const lo = Math.ceil(cursor / size) * size; // aligned to its own size
    blocks.push({ need, prefix: 32 - h, lo, size, d: describe(`${toIp(BASE + lo)}/${32 - h}`) });
    cursor = lo + size;
  }
  const table = [
    [25, "192.168.10.0", 127],
    [26, "192.168.10.128", 191],
    [27, "192.168.10.192", 223],
    [30, "192.168.10.224", 227],
  ] as const;
  blocks.forEach((b, i) => {
    const [p, net, bc] = table[i];
    if (b.prefix !== p || toIp(b.d.network) !== net || lastOctet(b.d.broadcast) !== bc) throw new Error(`vlsm: row ${i + 1} should be /${p} at ${net}, computed /${b.prefix} at ${toIp(b.d.network)}`);
  });
  const free = cursor;
  if (free !== 228) throw new Error("vlsm: the note says .228 to .255 stay free");

  const BAR_Y = 70;
  const draw = (k: number): Item[] => {
    const items: Item[] = [label("nl", "needs", -10, 13, { anchor: "end", tone: "soft", size: 11.5 })];
    order.forEach((n, i) => items.push(box(`n${i}`, i * 60, 0, `${n}`, { w: 52, h: 26, size: 12, tone: i === k ? "accent" : i < k ? "muted" : "plain" })));
    const shown = blocks.slice(0, k + 1);
    const segs = shown.map((b, i) => ({ lo: b.lo, size: b.size, text: `.${b.lo}/${b.prefix}`, tone: (i === k ? "accent" : "plain") as Tone }));
    if (k === blocks.length - 1) segs.push({ lo: free, size: 256 - free, text: "", tone: "ghost" });
    items.push(...bar("b", segs, BAR_Y));
    // Blocks too narrow for their name get it on a leader line above.
    shown.forEach((b, i) => {
      if (b.size * U >= `.${b.lo}/${b.prefix}`.length * 6.6 + 6) return;
      const cx = (b.lo + b.size / 2) * U;
      items.push({ k: "edge", id: `bt${i}`, x1: cx, y1: BAR_Y - 2, x2: cx, y2: BAR_Y - 14, tone: "accent" });
      items.push(label(`btl${i}`, `.${b.lo}/${b.prefix}`, cx, BAR_Y - 22, { tone: "accent", size: 11, mono: true, weight: 600 }));
    });
    if (k === blocks.length - 1) items.push(label("fl", `.${free}–.255 free`, (free + (256 - free) / 2) * U, BAR_Y + 44, { tone: "soft", size: 11, mono: true }));
    const b = blocks[k];
    const h = 32 - b.prefix;
    items.push(label("why", `${b.need} hosts: 2^${h} − 2 = ${2 ** h - 2} fits, so /${b.prefix}, block of ${b.size}`, 0, BAR_Y + (k === blocks.length - 1 ? 64 : 48), { anchor: "start", tone: "ink", size: 12, mono: true }));
    return items;
  };
  const frames: Frame[] = blocks.map((b, k) => {
    const h = 32 - b.prefix;
    const range = `.${lastOctet(b.d.first)} to .${lastOctet(b.d.last)}`;
    let caption: string;
    if (k === 0) caption = `Sort the needs largest first. ${b.need} hosts need ${h} host bits, because 2^${h} − 2 = ${2 ** h - 2} is the first that fits, so a /${b.prefix} of ${b.size} addresses at .${b.lo}, hosts ${range}.`;
    else if (k < blocks.length - 1) caption = `${b.need} hosts fit in 2^${h} − 2 = ${2 ** h - 2}: a /${b.prefix}. The next free address, .${b.lo}, is a multiple of ${b.size}, so the block starts there, hosts ${range}.`;
    else caption = `The router link needs 2 addresses, so a /${b.prefix} of ${b.size} at .${b.lo}. Because each block went largest first, every one started on a multiple of its size, and .${free} to .255 stay free for later.`;
    return { caption, items: draw(k) };
  });
  return finish({ title: "VLSM: each subnet the smallest block that fits", input: "192.168.10.0/24 for LANs of 100, 50 and 20 hosts and a 2-host link", frames });
}

/* ── Supernetting ─────────────────────────────────────────────────── */

function supernet(): Walkthrough {
  const common = (ns: number[]) => {
    let p = 0;
    while (p < 32 && ns.every((n) => (n >>> (31 - p)) % 2 === (ns[0] >>> (31 - p)) % 2)) p++;
    return p;
  };
  const sets = [
    { thirds: [0, 1, 2, 3] },
    { thirds: [1, 2, 3, 4] },
  ].map((set) => {
    const nets = set.thirds.map((t) => toInt(`192.168.${t}.0`));
    const p = common(nets);
    const summary = and(nets[0], maskOf(p));
    const covers = 2 ** (24 - p); // how many /24s the summary holds
    return { ...set, nets, p, summary, covers, exact: covers === nets.length && summary === nets[0] };
  });
  if (!sets[0].exact || sets[0].p !== 22 || toIp(sets[0].summary) !== "192.168.0.0") throw new Error("supernet: 192.168.0.0 to 3.0 must summarise exactly as 192.168.0.0/22");
  if (sets[1].exact) throw new Error("supernet: 192.168.1.0 to 4.0 must not form one block");

  const CW = 22;
  const CH = 24;
  const X0 = 112;
  const bx = (i: number) => X0 + i * (CW + 3);
  const draw = (k: number): Item[] => {
    const set = sets[k];
    const keep = set.p - 16; // shared bits inside the third octet
    const items: Item[] = [label("hd", "third octet", bx(4), -12, { tone: "faint", size: 10.5 })];
    set.nets.forEach((n, r) => {
      const y = r * (CH + 6);
      items.push(label(`l${r}`, `192.168.${set.thirds[r]}.0/24`, X0 - 10, y + CH / 2, { anchor: "end", tone: "soft", size: 11, mono: true }));
      const b = bitsOf(Math.floor(n / 256) % 256, 8);
      for (let i = 0; i < 8; i++) items.push(box(`c${r}-${i}`, bx(i), y, b[i], { w: CW, h: CH, size: 12, tone: i < keep ? "accent" : "plain" }));
    });
    const cut = bx(keep) - 1.5;
    const bottom = set.nets.length * (CH + 6) - 6;
    items.push({ k: "edge", id: "cut", x1: cut, y1: -4, x2: cut, y2: bottom + 4, tone: "accent", dashed: true });
    const verdict: TextTone = k === 0 ? "accent" : "error";
    const line1 = `common prefix: 16 + ${keep} = ${set.p} bits`;
    const line2 = set.exact ? `${toIp(set.summary)}/${set.p} holds exactly these ${set.nets.length}` : `${toIp(set.summary)}/${set.p} would hold ${set.covers} networks, not ${set.nets.length}`;
    items.push(label("v1", line1, X0, bottom + 22, { anchor: "start", tone: "ink", size: 12, mono: true }));
    items.push(label("v2", line2, X0, bottom + 40, { anchor: "start", tone: verdict, size: 12, mono: true, weight: 600 }));
    return items;
  };
  return finish({
    title: "Summarising four networks into one route",
    input: "192.168.0.0/24 to 192.168.3.0/24, then 192.168.1.0/24 to 192.168.4.0/24",
    frames: [
      { caption: `The four third octets differ only in their last ${24 - sets[0].p} bits, so the first ${sets[0].p} bits are shared and one route, ${toIp(sets[0].summary)}/${sets[0].p}, covers all four and nothing else.`, items: draw(0) },
      {
        caption: `Shift the set by one and the third octets ${sets[1].thirds[0]} to ${sets[1].thirds[3]} agree only in their first ${sets[1].p - 16} bits. The shared prefix shrinks to /${sets[1].p}, a block of ${sets[1].covers} networks from ${toIp(sets[1].summary)}, so these four cannot be one route.`,
        items: draw(1),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  classes,
  bits,
  split,
  vlsm,
  supernet,
};
