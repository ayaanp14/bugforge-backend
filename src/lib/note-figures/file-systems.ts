import { finish, round, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";

/**
 * File Systems: the note's figures
 * (content/notes/operating-systems/file-systems.md places each with
 * "@figure <name>").
 *
 * The allocation figure lays one five-block file out three ways on the same
 * disk and finds logical block 3 under each, counting the reads it takes
 * (the arithmetic for contiguous, the pointer chase for linked, the index
 * look-up for indexed). The inode figure derives every reach from the block
 * and pointer sizes, then walks two byte offsets down the pointer tree. The
 * links figure keeps a directory as a name → inode map, counts links from
 * it and resolves the symbolic link by name, before and after an rm. The
 * FAT figure follows the table from the directory's first cluster. Each
 * generator throws when a computed number disagrees with the note's.
 */

/* ── Lean items ───────────────────────────────────────────────────── */

function cell(id: string, x: number, y: number, w: number, h: number, text: string | number, tone: Tone = "plain", size?: number): Item {
  const it: Item = { k: "cell", id, x, y, w, h, text: String(text) };
  if (tone !== "plain") it.tone = tone;
  if (size) it.size = size;
  return it;
}

function txt(id: string, x: number, y: number, text: string, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  const it: Item = { k: "text", id, x, y, text, anchor: o.anchor ?? "middle", size: o.size ?? 12 };
  if (o.tone && o.tone !== "ink") it.tone = o.tone;
  if (o.mono === false) it.mono = false;
  if (o.weight) it.weight = o.weight;
  return it;
}

function line(id: string, x1: number, y1: number, x2: number, y2: number, tone: LineTone = "ink", o: { head?: boolean; dashed?: boolean; label?: string; bow?: number } = {}): Item {
  const it: Item = { k: "edge", id, x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2), tone };
  if (o.head !== false) it.arrow = true;
  if (o.dashed) it.dashed = true;
  if (o.label) it.label = o.label;
  if (o.bow) it.bow = o.bow;
  return it;
}

const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ── Allocation methods on one disk ───────────────────────────────── */

function allocation(): Walkthrough {
  const BLOCKS = 20;
  const WANT = 3; // logical block to find
  // Contiguous: the note's example, start 14, length 5.
  const START = 14;
  const LENGTH = 5;
  // Linked: five blocks scattered, each holding the next block's number.
  const NEXT = new Map<number, number | null>([[9, 16], [16, 1], [1, 10], [10, 18], [18, null]]);
  const FIRST = 9;
  // Indexed: an index block listing the same scattered blocks in order.
  const INDEX_BLOCK = 4;
  const chain: number[] = [];
  for (let b: number | null = FIRST; b !== null; b = NEXT.get(b) ?? null) chain.push(b);
  if (chain.length !== LENGTH) throw new Error("allocation: the linked file should have five blocks");
  const index = [...chain];
  const methods = [
    { blocks: Array.from({ length: LENGTH }, (_, i) => START + i), target: START + WANT, reads: 1, entry: [`start ${START}`, `length ${LENGTH}`], how: `${START} + ${WANT} = ${START + WANT}` },
    { blocks: chain, target: chain[WANT], reads: WANT + 1, entry: [`first ${FIRST}`, `last ${chain[chain.length - 1]}`], how: `follow ${chain.slice(0, WANT + 1).join(" → ")}` },
    { blocks: index, target: index[WANT], reads: 2, entry: [`index block ${INDEX_BLOCK}`, ""], how: `entry ${WANT} of block ${INDEX_BLOCK} = ${index[WANT]}` },
  ];
  if (methods[1].reads !== chain.slice(0, WANT + 1).length) throw new Error("allocation: linked reads miscounted");

  // The disk as one strip of blocks; links are arcs above it, so no line crosses a block.
  const CW = 22;
  const STEP = CW + 2;
  const Y = 0;
  const bx = (b: number) => b * STEP;
  const top = (b: number) => ({ x: bx(b) + CW / 2, y: Y - 2 });
  const arc = (id: string, from: number, to: number, tone: LineTone): Item => {
    const h = 8 + Math.abs(to - from) * 2.4;
    return line(id, top(from).x, top(from).y, top(to).x, top(to).y, tone, { bow: -Math.sign(to - from) * 2 * h });
  };
  const DY = 64;
  const frames: Frame[] = methods.map((m, k) => {
    const items: Item[] = [];
    const own = new Set(m.blocks);
    for (let b = 0; b < BLOCKS; b++) {
      const isIndex = k === 2 && b === INDEX_BLOCK;
      const tone: Tone = b === m.target ? "strong" : isIndex || own.has(b) ? "accent" : "plain";
      items.push(cell(`b${b}`, bx(b), Y, CW, 26, b, tone, 11));
    }
    m.blocks.forEach((b, i) => items.push(txt(`lb${b}`, bx(b) + CW / 2, Y + 37, `L${i}`, { tone: b === m.target ? "accent" : "soft", size: 11, weight: b === m.target ? 700 : 600 })));
    if (k === 2) items.push(txt("lbi", bx(INDEX_BLOCK) + CW / 2, Y + 37, "idx", { tone: "accent", size: 11, weight: 600 }));
    if (k === 1) chain.slice(0, -1).forEach((b, i) => items.push(arc(`ch${i}`, b, chain[i + 1], i < WANT ? "accent" : "line")));
    if (k === 2) index.forEach((b, i) => items.push(arc(`ix${i}`, INDEX_BLOCK, b, i === WANT ? "accent" : "line")));
    // The directory entry and, for indexed, the index block's contents.
    items.push(txt("deh", 0, DY, "directory entry", { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
    items.push(cell("de0", 0, DY + 12, 72, 26, "notes", "plain", 12));
    items.push(cell("de1", 74, DY + 12, 116, 26, m.entry[0], "accent", 12));
    items.push(cell("de2", 192, DY + 12, 90, 26, m.entry[1], m.entry[1] ? "accent" : "ghost", 12));
    if (k === 2) {
      items.push(txt("il", 304, DY, `block ${INDEX_BLOCK} holds`, { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
      index.forEach((b, i) => items.push(cell(`ie${i}`, 304 + i * 30, DY + 12, 28, 26, b, i === WANT ? "strong" : "plain", 12)));
    }
    items.push(txt("how", 0, DY + 60, `logical block ${WANT}: ${m.how}`, { anchor: "start", size: 12, weight: 600 }));
    items.push(txt("rd", 0, DY + 80, `${m.reads} disk read${m.reads > 1 ? "s" : ""} to reach it`, { anchor: "start", size: 12, weight: 700, tone: "accent" }));
    return {
      caption:
        k === 0
          ? `Contiguous: the file is blocks ${START} to ${START + LENGTH - 1} and the directory keeps the start and length. Logical block ${WANT} is at ${START} + ${WANT} = ${START + WANT}, found by arithmetic: one read.`
          : k === 1
            ? `Linked: the blocks are scattered and each holds the number of the next. Reaching logical block ${WANT} means reading ${chain.slice(0, WANT).join(", ")} for their pointers first: ${m.reads} reads, and block 50 would take 51.`
            : `Indexed: block ${INDEX_BLOCK} lists the file's blocks in order. Read it, take entry ${WANT}, which is block ${index[WANT]}, and read that: two reads for any block, at the cost of a whole block for the index.`,
      items,
    };
  });
  return finish({ title: "Three ways to lay out one five-block file", input: `a ${BLOCKS}-block disk; find logical block ${WANT}`, frames });
}

/* ── The Unix inode ───────────────────────────────────────────────── */

function inode(): Walkthrough {
  const BLOCK = 4096;
  const PTR = 4;
  const per = BLOCK / PTR;
  const DIRECT = 12;
  const reach = [DIRECT, per, per ** 2, per ** 3];
  const total = reach.reduce((a, b) => a + b, 0);
  if (per !== 1024 || total !== 1_074_791_436) throw new Error(`inode: ${per} pointers, ${total} blocks; the note says 1,024 and 1,074,791,436`);
  const human = (blocks: number) => {
    const bytes = blocks * BLOCK;
    const units = ["B", "KB", "MB", "GB", "TB"];
    let u = 0;
    let v = bytes;
    while (v >= 1024 && u < units.length - 1) {
      v /= 1024;
      u++;
    }
    return `${Number.isInteger(v) ? v : v.toFixed(1)} ${units[u]}`;
  };
  if (reach.map(human).join() !== "48 KB,4 MB,4 GB,4 TB") throw new Error(`inode: reaches ${reach.map(human).join()}`);
  // Where a byte lives: which pointer, which entries, how many reads (inode already in memory).
  const locate = (byte: number) => {
    let b = Math.floor(byte / BLOCK);
    const logical = b;
    if (b < DIRECT) return { logical, level: 0, entries: [b], reads: 1 };
    b -= DIRECT;
    for (let level = 1; level <= 3; level++) {
      if (b < per ** level) {
        const entries: number[] = [];
        for (let l = level - 1; l >= 0; l--) entries.push(Math.floor(b / per ** l) % per);
        return { logical, level, entries, reads: level + 1 };
      }
      b -= per ** level;
    }
    throw new Error("inode: past the largest file");
  };
  const A = locate(60_000);
  const B = locate(10_485_760);
  if (A.logical !== 14 || A.level !== 1 || A.reads !== 2) throw new Error(`inode: byte 60,000 → block ${A.logical}, level ${A.level}, ${A.reads} reads`);
  if (B.logical !== 2560 || B.level !== 2 || B.reads !== 3) throw new Error(`inode: byte 10,485,760 → block ${B.logical}, level ${B.level}, ${B.reads} reads`);

  const IW = 120;
  const RH = 26;
  const rows = ["type, permissions", "owner, size", "times, link count", "direct 0", "direct 1", "…", "direct 11", "single indirect", "double indirect", "triple indirect"];
  const ptrRow = (level: number) => 7 + level - 1; // rows of the indirect pointers
  const COL = [IW + 24, IW + 86, IW + 148]; // index blocks, one column per level
  const DATA = IW + 210;
  const BW = 50;
  const y = (r: number) => r * RH;
  const draw = (hit?: { level: number; entries: number[]; logical: number; byte: number }): Item[] => {
    const items: Item[] = [];
    items.push(txt("il", IW / 2, -12, "inode", { tone: "soft", size: 11, mono: false, weight: 600 }));
    rows.forEach((r, i) => {
      const meta = i < 3;
      const onPath = hit && ((hit.level === 0 && i === 3 + Math.min(hit.entries[0], 3)) || (hit.level > 0 && i === ptrRow(hit.level)));
      items.push(cell(`r${i}`, 0, y(i), IW, RH - 3, r, meta ? "muted" : onPath ? "accent" : r === "…" ? "ghost" : "plain", 11));
    });
    // Direct pointers go straight to data blocks.
    [3, 4, 6].forEach((i) => {
      items.push(line(`d${i}`, IW + 2, y(i) + 11, DATA - 3, y(i) + 11, "line"));
      items.push(cell(`dd${i}`, DATA, y(i), BW, RH - 3, "data", "plain", 11));
    });
    // Each indirect pointer: a chain of index blocks, then data.
    for (let level = 1; level <= 3; level++) {
      const r = ptrRow(level);
      const on = hit && hit.level === level;
      let x = IW + 2;
      for (let l = 0; l < level; l++) {
        const entry = on ? hit!.entries[l] : null;
        items.push(line(`p${level}-${l}`, x, y(r) + 11, COL[l] - 3, y(r) + 11, on ? "accent" : "line"));
        items.push(cell(`ib${level}-${l}`, COL[l], y(r), BW, RH - 3, entry === null ? "1,024" : `[${entry}]`, on ? "accent" : "plain", 11));
        x = COL[l] + BW + 2;
      }
      items.push(line(`p${level}-d`, x, y(r) + 11, DATA - 3, y(r) + 11, on ? "accent" : "line"));
      items.push(cell(`dd${r}`, DATA, y(r), BW, RH - 3, "data", on ? "strong" : "plain", 11));
    }
    if (hit && hit.level === 0) items.push(cell(`dd${3 + hit.entries[0]}`, DATA, y(3 + hit.entries[0]), BW, RH - 3, "data", "strong", 11));
    // What each kind of pointer reaches.
    const RX = DATA + BW + 10;
    items.push(txt("rh", RX, -12, "reaches", { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
    items.push(txt("rd", RX, y(4) + 11, `${DIRECT} → ${human(DIRECT)}`, { anchor: "start", size: 11 }));
    const pw = ["1,024", "1,024²", "1,024³"];
    for (let level = 1; level <= 3; level++) items.push(txt(`rr${level}`, RX, y(ptrRow(level)) + 11, `${pw[level - 1]} → ${human(reach[level])}`, { anchor: "start", size: 11, weight: hit?.level === level ? 700 : undefined, tone: hit?.level === level ? "accent" : "ink" }));
    items.push(txt("cols", COL[0], y(10) + 12, "index blocks: 4,096 B ÷ 4 B = 1,024 pointers each", { anchor: "start", tone: "faint", size: 11, mono: false }));
    if (hit) items.push(txt("byte", 0, y(10) + 34, `byte ${commas(hit.byte)} → logical block ${commas(hit.logical)}: ${hit.level + 1} read${hit.level ? "s" : ""}`, { anchor: "start", size: 12, weight: 700, tone: "accent" }));
    else items.push(txt("byte", 0, y(10) + 34, `largest file: ${commas(total)} blocks, just over 4 TB`, { anchor: "start", size: 12, weight: 700 }));
    return items;
  };
  const singleStart = DIRECT;
  const doubleStart = DIRECT + per;
  return finish({
    title: "An inode's direct and indirect block pointers",
    input: "4 KB blocks, 4-byte block pointers, inode already in memory",
    frames: [
      { caption: `The inode holds the file's attributes (no name) and 15 pointers. Twelve point straight at data, ${human(DIRECT)}; the indirect ones point at blocks of 1,024 pointers, one, two and three levels deep, reaching ${human(reach[1])}, ${human(reach[2])} and ${human(reach[3])}.`, items: draw() },
      { caption: `Byte 60,000 is in logical block ${A.logical}. Blocks ${singleStart} to ${commas(doubleStart - 1)} go through the single indirect block, at entry ${A.logical} − ${singleStart} = ${A.entries[0]}: read that block, then the data. Two reads.`, items: draw({ ...A, byte: 60_000 }) },
      { caption: `Byte 10,485,760 (10 MB) is in block ${commas(B.logical)}, past ${commas(doubleStart - 1)}, so in the double indirect range at position ${B.logical - doubleStart}: entry ${B.entries[0]} of the first index block, entry ${B.entries[1]} of the second, then the data. Three reads.`, items: draw({ ...B, byte: 10_485_760 }) },
    ],
  });
}

/* ── Hard and symbolic links ──────────────────────────────────────── */

function links(): Walkthrough {
  type Entry = { name: string; inode: number };
  const dir: Entry[] = [
    { name: "notes.txt", inode: 1234 },
    { name: "copy.txt", inode: 1234 },
    { name: "short", inode: 1300 },
  ];
  const symlinks = new Map<number, string>([[1300, "notes.txt"]]);
  const linkCount = (d: Entry[], ino: number) => d.filter((e) => e.inode === ino).length;
  const resolve = (d: Entry[], name: string): number | null => {
    const e = d.find((x) => x.name === name);
    if (!e) return null;
    const target = symlinks.get(e.inode);
    return target === undefined ? e.inode : resolve(d, target);
  };
  const before = { dir, count: linkCount(dir, 1234), viaCopy: resolve(dir, "copy.txt"), viaShort: resolve(dir, "short") };
  const after = dir.filter((e) => e.name !== "notes.txt");
  const now = { dir: after, count: linkCount(after, 1234), viaCopy: resolve(after, "copy.txt"), viaShort: resolve(after, "short") };
  if (before.count !== 2 || now.count !== 1 || now.viaCopy !== 1234 || now.viaShort !== null || before.viaShort !== 1234) throw new Error("links: the link counts or resolution disagree with the note");

  const RH = 34;
  const DX = 0;
  const IX = 210;
  const BX = 360;
  const iy = (ino: number) => (ino === 1234 ? 10 : 96);
  const draw = (st: typeof before, removed: boolean): Item[] => {
    const items: Item[] = [];
    items.push(txt("dh", DX + 70, -12, "directory", { tone: "soft", size: 11, mono: false, weight: 600 }));
    dir.forEach((e, i) => {
      const gone = !st.dir.includes(e);
      items.push(cell(`dn${i}`, DX, i * RH, 90, RH - 6, e.name, gone ? "error" : "plain", 12));
      items.push(cell(`di${i}`, DX + 92, i * RH, 48, RH - 6, gone ? "" : e.inode, gone ? "error" : "muted", 11.5));
      if (!gone) items.push(line(`dl${i}`, DX + 142, i * RH + 14, IX - 3, iy(e.inode) + 18, e.inode === 1234 ? "accent" : "ink"));
    });
    if (removed) items.push(txt("rm", DX, 3 * RH + 4, "rm notes.txt", { anchor: "start", size: 12, weight: 700, tone: "error" }));
    // Inode 1234: the file.
    items.push(cell("i1", IX, iy(1234), 96, 38, `inode 1234`, "accent", 12));
    items.push(txt("i1c", IX + 48, iy(1234) + 50, `link count ${st.count}`, { size: 11.5, weight: 700, tone: "accent" }));
    items.push(line("i1d", IX + 98, iy(1234) + 19, BX - 3, iy(1234) + 19, "accent"));
    items.push(cell("b1", BX, iy(1234), 100, 38, "file data", "strong", 12));
    // Inode 1300: the symbolic link, whose data is a name.
    items.push(cell("i2", IX, iy(1300), 96, 38, "inode 1300", "plain", 12));
    items.push(txt("i2c", IX + 48, iy(1300) + 50, "symlink", { tone: "soft", size: 11, mono: false }));
    items.push(line("i2d", IX + 98, iy(1300) + 19, BX - 3, iy(1300) + 19, "ink"));
    items.push(cell("b2", BX, iy(1300), 100, 38, `"notes.txt"`, st.viaShort === null ? "error" : "plain", 12));
    // The symlink is resolved by name, through the directory.
    const nt = dir.findIndex((e) => e.name === "notes.txt");
    // The lookup runs under everything and back into the directory from the left.
    const ry = iy(1300) + 70;
    const tone: LineTone = st.viaShort === null ? "error" : "line";
    items.push({ k: "path", id: "res", pts: [[BX + 50, iy(1300) + 40], [BX + 50, ry], [DX - 16, ry], [DX - 16, nt * RH + 14]], tone, dashed: true, width: 1.4 });
    items.push(line("resa", DX - 16, nt * RH + 14, DX - 3, nt * RH + 14, tone));
    items.push(txt("rt", (BX + 50 + DX) / 2, ry + 12, st.viaShort === null ? "lookup of notes.txt fails: dangling" : "opening short looks up notes.txt by name", { tone: st.viaShort === null ? "error" : "soft", size: 11, mono: false, weight: 600 }));
    return items;
  };
  return finish({
    title: "Hard links share an inode; a symbolic link stores a name",
    input: "notes.txt and copy.txt name inode 1234; short is a symbolic link to notes.txt",
    frames: [
      { caption: `notes.txt and copy.txt are two directory entries for the same inode, so its link count is ${before.count} and neither name is the original. short has an inode of its own whose data is just the name notes.txt, looked up each time it is opened.`, items: draw(before, false) },
      { caption: `rm notes.txt removes one directory entry: the count drops to ${now.count} and copy.txt still reaches the data, freed only when the count reaches 0. short still holds notes.txt, a name that no longer exists, so it dangles.`, items: draw(now, true) },
    ],
  });
}

/* ── FAT: a chain in a table ──────────────────────────────────────── */

function fat(): Walkthrough {
  const EOF = -1;
  // Clusters 2–11 (0 and 1 are reserved). 0 = free; other files own 5→6.
  const table = new Map<number, number>([[2, 10], [3, 0], [4, 7], [5, 6], [6, EOF], [7, 2], [8, 0], [9, 0], [10, EOF], [11, 0]]);
  const FIRST = 4;
  const chain: number[] = [];
  for (let c = FIRST; c !== EOF; c = table.get(c)!) {
    if (chain.includes(c) || chain.length > 20) throw new Error("fat: the chain loops");
    chain.push(c);
  }
  if (chain.join() !== "4,7,2,10") throw new Error(`fat: chain ${chain.join()}, the note says 4, 7, 2, 10`);
  const free = [...table].filter(([, v]) => v === 0).map(([c]) => c);
  const RH = 26;
  const TX = 190;
  const clusters = [...table.keys()];
  const ry = (c: number) => clusters.indexOf(c) * RH;
  const items: Item[] = [];
  items.push(txt("th", TX + 40, -12, "FAT (cached in memory)", { tone: "soft", size: 11, mono: false, weight: 600 }));
  clusters.forEach((c) => {
    const v = table.get(c)!;
    const on = chain.includes(c);
    items.push(txt(`ci${c}`, TX - 8, ry(c) + 11, String(c), { anchor: "end", tone: on ? "accent" : "faint", size: 11, weight: on ? 700 : undefined }));
    items.push(cell(`cv${c}`, TX, ry(c), 80, RH - 4, v === EOF ? "end" : v === 0 ? "free" : v, on ? (v === EOF ? "strong" : "accent") : v === 0 ? "muted" : "plain", 12));
  });
  // The directory entry points at the first cluster; each entry points at the next.
  items.push(txt("dh", 60, -12, "directory entry", { tone: "soft", size: 11, mono: false, weight: 600 }));
  items.push(cell("dn", 0, 0, 120, 26, "notes.txt", "plain", 12));
  items.push(cell("df", 0, 28, 120, 26, `first cluster ${FIRST}`, "accent", 12));
  items.push(line("d0", 122, 41, TX - 26, ry(FIRST) + 11, "accent"));
  chain.slice(0, -1).forEach((c, i) => {
    const n = chain[i + 1];
    const span = Math.abs(ry(n) - ry(c));
    // Later links bow wider, so the arcs nest instead of crossing.
    items.push(line(`ch${i}`, TX + 82, ry(c) + 11, TX + 82, ry(n) + 11, "accent", { bow: (ry(n) > ry(c) ? -1 : 1) * (20 + i * 30 + span / 6), label: String(i + 1) }));
  });
  items.push(txt("rd", 0, clusters.length * RH + 14, `notes.txt = clusters ${chain.join(" → ")}`, { anchor: "start", size: 12, weight: 700, tone: "accent" }));
  items.push(txt("fr", 0, clusters.length * RH + 34, `free clusters: ${free.join(", ")}`, { anchor: "start", size: 11.5, tone: "soft" }));
  return finish({
    title: "FAT: following a file's cluster chain through the table",
    input: `directory: notes.txt starts at cluster ${FIRST}`,
    frames: [
      {
        caption: `The directory gives the first cluster, ${FIRST}; its FAT entry gives the next, and so on until an end mark: ${chain.join(", ")}. The whole walk happens in the cached table, so only the wanted cluster is read from disk, and free entries double as the free-space list.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  allocation,
  inode,
  links,
  fat,
};
