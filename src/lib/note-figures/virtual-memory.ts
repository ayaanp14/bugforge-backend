import { finish, round, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";

/**
 * Virtual Memory and Demand Paging: the note's figures
 * (content/notes/operating-systems/virtual-memory.md places each with
 * "@figure <name>").
 *
 * Each figure runs what it shows. The page-fault animation runs the
 * handler over one process's page table and the machine's frames — the
 * free frame, the table update and the restart all come from that state.
 * The TLB animation runs a small LRU TLB in front of a page table and
 * prices each path with the note's 20 ns TLB and 100 ns memory, then
 * averages them at the note's hit ratio. The two-level walk splits a real
 * 32-bit address into 10 + 10 + 12 bits and counts which inner tables a
 * process with the note's memory layout needs. The working-set animation
 * slides the note's Δ = 4 window over its reference string. Each generator
 * throws when a computed number disagrees with the note's.
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

/* ── Handling a page fault ────────────────────────────────────────── */

function pageFault(): Walkthrough {
  // One process's pages in memory (page → frame); frames used by other processes; 8 frames in all.
  const resident = new Map<number, number>([[0, 4], [2, 6], [5, 1]]);
  const others = new Set([0, 2, 3, 7]);
  const PAGES = 6;
  const FRAMES = 8;
  const WANT = 3;
  const table = (): Array<number | null> => Array.from({ length: PAGES }, (_, p) => resident.get(p) ?? null);
  const owner = (f: number) => [...resident].find(([, fr]) => fr === f)?.[0];
  const freeFrames = () => Array.from({ length: FRAMES }, (_, f) => f).filter((f) => !others.has(f) && owner(f) === undefined);
  // Pages the process may use (its address space) — every page in its table, resident or on disk.
  const legal = (p: number) => p >= 0 && p < PAGES;
  if (resident.has(WANT)) throw new Error("page-fault: the page must start out of memory");
  if (!legal(WANT)) throw new Error("page-fault: the reference must be legal");

  // Run the handler, recording the state after each step.
  type State = { table: Array<number | null>; frames: Array<string>; free: number[] };
  const snap = (): State => ({ table: table(), frames: Array.from({ length: FRAMES }, (_, f) => (others.has(f) ? "other" : owner(f) !== undefined ? `page ${owner(f)}` : "free")), free: freeFrames() });
  const before = snap();
  const free = freeFrames();
  if (!free.length) throw new Error("page-fault: the example assumes a free frame");
  const frame = free[0];
  const reading = { ...snap(), frames: snap().frames.map((s, f) => (f === frame ? `page ${WANT}` : s)) };
  resident.set(WANT, frame);
  const after = snap();
  if (after.table[WANT] !== frame) throw new Error("page-fault: the table update failed");

  // Layout: the OS and the disk across the top, the process and the page
  // table in the middle, physical memory as a row of frames at the bottom;
  // the arrows run in the gaps between them, never across a table.
  const TX = 150; // page table: index, frame, valid bit
  const RH = 24;
  const TY = 70;
  const TR = TX + 104; // the table's right edge
  const MY = TY + PAGES * RH + 44; // memory row
  const MW = 52;
  const DX = 340; // disk
  const rowY = (p: number) => TY + p * RH;
  const frameX = (f: number) => f * (MW + 2);

  type Stage = 0 | 1 | 2 | 3 | 4 | 5;
  const draw = (stage: Stage, st: State): Item[] => {
    const items: Item[] = [];
    // Process.
    items.push(txt("pl", 48, TY - 12, "process", { tone: "soft", size: 11, mono: false, weight: 600 }));
    items.push(cell("proc", 0, TY, 96, 56, "load M", stage === 0 || stage === 5 ? "accent" : "plain", 13));
    items.push(txt("pm", 48, TY + 70, `M is in page ${WANT}`, { tone: "soft", size: 11, mono: false }));
    // Page table.
    items.push(txt("tl", TX + 52, TY - 12, "page table", { tone: "soft", size: 11, mono: false, weight: 600 }));
    st.table.forEach((fr, p) => {
      const hot = p === WANT;
      const tone: Tone = hot ? (stage >= 4 ? "strong" : stage <= 1 ? "error" : "accent") : "plain";
      items.push(cell(`tp${p}`, TX, rowY(p), 22, RH - 3, p, "muted", 11));
      items.push(cell(`tf${p}`, TX + 24, rowY(p), 52, RH - 3, fr === null ? "" : fr, hot ? tone : "plain", 12));
      items.push(cell(`tv${p}`, TX + 78, rowY(p), 26, RH - 3, fr === null ? "i" : "v", hot ? tone : fr === null ? "muted" : "plain", 12));
    });
    // Operating system and disk.
    items.push(cell("os", TX, 0, 140, 34, "operating system", stage >= 1 && stage <= 4 && stage !== 3 ? "accent" : "plain", 11.5));
    items.push(cell("disk", DX, 0, 104, 34, "backing store", stage === 3 ? "accent" : "plain", 11.5));
    items.push(txt("dp", DX + 52, 46, `page ${WANT} is here`, { tone: "soft", size: 11, mono: false }));
    // Physical memory.
    items.push(txt("ml", 0, MY - 12, "physical memory", { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
    st.frames.forEach((s, f) => {
      const tone: Tone = f === frame && stage >= 2 ? (stage >= 3 ? "strong" : "accent") : s === "other" ? "muted" : "plain";
      items.push(cell(`m${f}`, frameX(f), MY, MW, 26, s === "other" ? "" : s.replace("page ", "p"), tone, 11.5));
      items.push(txt(`mf${f}`, frameX(f) + MW / 2, MY + 37, String(f), { tone: "faint", size: 11 }));
    });
    items.push(txt("mk", frameX(FRAMES) - 2, MY + 52, "grey: other processes", { anchor: "end", tone: "faint", size: 11, mono: false }));
    if (stage >= 2) items.push(txt("free", 0, MY + 52, `free frames: ${before.free.join(", ")}`, { anchor: "start", tone: stage === 2 ? "accent" : "soft", size: 11 }));
    // The numbered arrows, each lit on its own step.
    const t = (s: number): LineTone => (s === stage ? "accent" : s < stage ? "ink" : "faint");
    const ry = rowY(WANT) + (RH - 3) / 2;
    items.push(line("s1", 98, TY + 28, TX - 3, ry, t(0), { label: "1" }));
    if (stage >= 1) items.push(line("s2", TR + 3, ry - 4, TR + 10, 37, t(1), { label: "2" }));
    if (stage >= 2) items.push(line("s3", TX + 142, 17, DX - 3, 17, t(3), { label: "3" }));
    if (stage >= 3) items.push(line("s4", DX + 40, 58, frameX(frame) + MW / 2, MY - 3, t(3), { label: "4" }));
    if (stage >= 4) items.push(line("s5", TX + 134, 37, TR + 3, ry + 4, t(4), { label: "5", bow: -26 }));
    if (stage >= 5) items.push(line("s6", TX - 3, 17, 84, TY - 3, t(5), { label: "6" }));
    return items;
  };
  const frames: Frame[] = [
    { caption: `The process executes load M, and M lies in page ${WANT}. The MMU finds entry ${WANT} marked invalid (i): the page is not in memory.`, items: draw(0, before) },
    { caption: `The invalid bit raises a page fault, a trap into the operating system. It checks the process's tables: page ${WANT} is a legal page kept on the backing store, so this is not a segmentation fault.`, items: draw(1, before) },
    { caption: `The OS takes a free frame, frame ${frame}. With none free, a replacement policy would choose a victim, written back to disk first if its dirty bit is set.`, items: draw(2, before) },
    { caption: `It schedules a disk read of page ${WANT} into frame ${frame}. The read takes milliseconds, so the process waits and the CPU runs another process meanwhile.`, items: draw(3, reading) },
    { caption: `When the read completes, the OS writes frame ${frame} into entry ${WANT} and sets its bit to valid (v).`, items: draw(4, after) },
    { caption: `The instruction that faulted is restarted from the beginning. This time entry ${WANT} is valid, the translation gives frame ${frame}, and the load completes as if nothing had happened.`, items: draw(5, after) },
  ];
  return finish({ title: "Handling a page fault, step by step", input: `page ${WANT} not in memory; frames ${before.free.join(", ")} free`, frames });
}

/* ── The TLB: hit, miss, and the average ──────────────────────────── */

function tlbPath(): Walkthrough {
  const T = 20; // TLB lookup, ns
  const M = 100; // memory access, ns
  const H = 0.98;
  const hitCost = T + M;
  const missCost = T + 2 * M;
  const eat = round(H * hitCost + (1 - H) * missCost);
  if (hitCost !== 120 || missCost !== 220 || eat !== 122) throw new Error(`tlb: ${hitCost}/${missCost}/${eat}, the note says 120/220/122`);
  if (round(0.8 * hitCost + 0.2 * missCost) !== 140) throw new Error("tlb: the 0.80 case should be 140");

  // A 4-entry TLB with LRU replacement in front of the page table.
  const PT = [9, 4, 6, 12, 2, 8, 1, 3];
  const tlb: Array<{ page: number; frame: number; used: number }> = [
    { page: 2, frame: PT[2], used: 3 },
    { page: 5, frame: PT[5], used: 1 },
    { page: 0, frame: PT[0], used: 4 },
    { page: 4, frame: PT[4], used: 2 },
  ];
  let clock = 5;
  const look = (page: number) => {
    const at = tlb.findIndex((e) => e.page === page);
    if (at !== -1) {
      tlb[at].used = clock++;
      return { hit: true, slot: at, frame: tlb[at].frame, evicted: null as number | null };
    }
    const frame = PT[page];
    const lru = tlb.reduce((b, e, i) => (e.used < tlb[b].used ? i : b), 0);
    const evicted = tlb[lru].page;
    tlb[lru] = { page, frame, used: clock++ };
    return { hit: false, slot: lru, frame, evicted };
  };
  const snapTlb = () => tlb.map((e) => ({ ...e }));

  const TX = 130; // TLB
  const TY = 24;
  const RH = 24;
  const PY = 164; // page table
  const PRH = 18;
  const OX = 340; // physical address
  const OY = 150;
  const LY = TY + 2 * RH - 14; // logical address cells, level with the TLB's middle
  const draw = (o: { page: number; tlbRows: ReturnType<typeof snapTlb>; hit: boolean; slot: number; frame: number; avg?: boolean }): Item[] => {
    const items: Item[] = [];
    // The logical address goes to the TLB, which compares every entry at once.
    items.push(txt("ll", 41, LY - 12, "logical address", { tone: "soft", size: 11, mono: false, weight: 600 }));
    items.push(cell("lp", 0, LY, 44, 30, `p ${o.page}`, "accent", 12));
    items.push(cell("ld", 46, LY, 36, 30, "d", "plain", 12));
    items.push(line("toT", 84, LY + 15, TX - 3, LY + 15, "accent"));
    items.push(txt("tl", TX + 44, TY - 12, "TLB", { tone: "soft", size: 11, mono: false, weight: 600 }));
    o.tlbRows.forEach((e, r) => {
      const hot = r === o.slot && !o.avg;
      items.push(cell(`tp${r}`, TX, TY + r * RH, 42, RH - 3, e.page, hot ? (o.hit ? "strong" : "accent") : "plain", 12));
      items.push(cell(`tf${r}`, TX + 46, TY + r * RH, 42, RH - 3, e.frame, hot ? (o.hit ? "strong" : "accent") : "plain", 12));
    });
    // The page table, below.
    PT.forEach((fr, p) => {
      const hot = !o.hit && !o.avg && p === o.page;
      items.push(txt(`pp${p}`, TX - 6, PY + p * PRH + 8, String(p), { anchor: "end", tone: "faint", size: 11 }));
      items.push(cell(`pf${p}`, TX, PY + p * PRH, 88, PRH - 2, fr, hot ? "accent" : "plain", 11));
    });
    items.push(txt("pl", TX + 44, PY + PT.length * PRH + 10, "page table (in memory)", { tone: "soft", size: 11, mono: false }));
    // The two paths to the physical address.
    const hitRow = o.avg ? 0 : o.slot;
    const hitTone: LineTone = o.avg || o.hit ? "accent" : "faint";
    const missTone: LineTone = o.avg ? "ink" : o.hit ? "faint" : "accent";
    items.push(line("hit", TX + 90, TY + hitRow * RH + 10, OX - 3, OY + 10, hitTone));
    items.push(line("miss", TX + 44, TY + 4 * RH, TX + 44, PY - 3, missTone));
    items.push(txt("mt", TX + 52, PY - 20, "miss", { anchor: "start", size: 11, mono: false, weight: 600, tone: missTone === "faint" ? "faint" : missTone === "accent" ? "accent" : "soft" }));
    items.push(txt("ht", TX + 120, TY + hitRow * RH + 30, "hit", { anchor: "start", size: 11, mono: false, weight: 600, tone: hitTone === "faint" ? "faint" : "accent" }));
    const ptRow = o.avg ? 7 : o.page;
    items.push(line("walk", TX + 90, PY + ptRow * PRH + 8, OX - 3, OY + 22, missTone));
    items.push(txt("pa", OX + 41, OY - 12, "physical address", { tone: "soft", size: 11, mono: false, weight: 600 }));
    items.push(cell("pf", OX, OY, 44, 30, o.avg ? "f" : `f ${o.frame}`, o.avg ? "plain" : "strong", 12));
    items.push(cell("pd", OX + 46, OY, 36, 30, "d", "plain", 12));
    // What each path costs.
    items.push(txt("ch", 252, 4, `hit:  ${T} + ${M} = ${hitCost} ns`, { anchor: "start", size: 12, weight: o.avg || o.hit ? 700 : undefined, tone: o.avg || o.hit ? "accent" : "soft" }));
    items.push(txt("cm", 252, 24, `miss: ${T} + ${M} + ${M} = ${missCost} ns`, { anchor: "start", size: 12, weight: !o.hit && !o.avg ? 700 : undefined, tone: !o.hit && !o.avg ? "accent" : o.avg ? "ink" : "soft" }));
    return items;
  };
  const a = look(2);
  const rowsA = snapTlb();
  const b = look(7);
  const rowsB = snapTlb();
  if (!a.hit || b.hit || b.evicted === null) throw new Error("tlb: expected a hit, then a miss that evicts");
  const avg = draw({ page: 7, tlbRows: rowsB, hit: true, slot: -1, frame: 0, avg: true });
  avg.push(txt("avg", OX, OY + 56, `EAT = ${H} × ${hitCost}`, { anchor: "start", size: 12.5, weight: 700, tone: "accent" }));
  avg.push(txt("avg2", OX + 38, OY + 76, `+ ${(1 - H).toFixed(2)} × ${missCost}`, { anchor: "start", size: 12.5, weight: 700, tone: "accent" }));
  avg.push(txt("avg3", OX + 38, OY + 96, `= ${eat} ns`, { anchor: "start", size: 12.5, weight: 700, tone: "accent" }));
  return finish({
    title: "Address translation with a TLB: the hit path and the miss path",
    input: `TLB lookup ${T} ns, memory access ${M} ns, hit ratio ${H}`,
    frames: [
      { caption: `Page 2 is in the TLB, a hit: the frame number, ${a.frame}, comes straight out of the TLB and only the data itself is read from memory, ${T} + ${M} = ${hitCost} ns.`, items: draw({ page: 2, tlbRows: rowsA, hit: true, slot: a.slot, frame: a.frame }) },
      { caption: `Page 7 is not in the TLB, a miss. The page table, itself in memory, is read for frame ${b.frame} (one access), the translation replaces page ${b.evicted}, the least recently used entry, and then the data is read: ${missCost} ns.`, items: draw({ page: 7, tlbRows: rowsB, hit: false, slot: b.slot, frame: b.frame }) },
      { caption: `On average, with ${Math.round(H * 100)}% of lookups hitting, an access costs ${eat} ns: within ${eat - M}% of a bare memory access, against ${2 * M} ns with no TLB at all.`, items: avg },
    ],
  });
}

/* ── Two-level page tables ────────────────────────────────────────── */

function twoLevel(): Walkthrough {
  const ADDR = 0x00403abc;
  const p1 = ADDR >>> 22;
  const p2 = (ADDR >>> 12) & 0x3ff;
  const d = ADDR & 0xfff;
  if (p1 !== 1 || p2 !== 3 || d !== 2748) throw new Error(`two-level: ${p1}/${p2}/${d}, the note says 1/3/2748`);
  const FRAME = 9; // what inner table 1's entry 3 holds in this example
  const phys = FRAME * 4096 + d;
  // The note's process: 8 MB of code and data from address 0, a 4 MB stack at the top of the 4 GB space.
  const MB = 1 << 20;
  const regions: Array<[number, number]> = [[0, 8 * MB], [4096 * MB - 4 * MB, 4096 * MB]];
  const needed = new Set<number>();
  for (const [lo, hi] of regions) for (let e = Math.floor(lo / (4 * MB)); e <= Math.floor((hi - 1) / (4 * MB)); e++) needed.add(e);
  const inner = [...needed].sort((a, b) => a - b);
  const kb = (1 + inner.length) * 4;
  if (inner.join() !== "0,1,1023" || kb !== 16) throw new Error(`two-level: inner tables ${inner.join()}, ${kb} KB; the note says 3 inner tables, 16 KB`);

  const bin = (n: number, w: number) => n.toString(2).padStart(w, "0");
  const fields = [
    { id: "f1", text: bin(p1, 10), label: `p1 = ${p1}`, w: 82 },
    { id: "f2", text: bin(p2, 10), label: `p2 = ${p2}`, w: 82 },
    { id: "f3", text: bin(d, 12), label: `d = ${d}`, w: 96 },
  ];
  const fx = (i: number) => fields.slice(0, i).reduce((s, f) => s + f.w + 4, 0);
  const OX = 0;
  const OY = 82;
  const RH = 22;
  const outerRows = ["0", "1", "2", "…", "1023"];
  const outerIdx = [0, 1, 2, -1, 1023];
  const IX = 150;
  const innerRows = ["0", "1", "2", "3", "…"];
  const FX = 330;

  const draw = (stage: number): Item[] => {
    const items: Item[] = [];
    fields.forEach((f, i) => {
      const hot = (stage === 1 && i === 0) || (stage === 2 && i === 1) || (stage === 2 && i === 2);
      items.push(cell(f.id, fx(i), 0, f.w, 26, f.text, hot ? "accent" : "plain", 11));
      items.push(txt(`${f.id}l`, fx(i) + f.w / 2, 38, f.label, { tone: hot ? "accent" : "soft", size: 11, weight: 600 }));
    });
    items.push(txt("ah", fx(3) + 6, 13, "0x00403ABC", { anchor: "start", size: 12, weight: 700 }));
    items.push(txt("bits", fx(3) + 6, 38, "10 + 10 + 12 bits", { anchor: "start", tone: "faint", size: 11 }));
    // The outer table.
    items.push(txt("ol", OX + 40, OY - 12, "outer table", { tone: "soft", size: 11, mono: false, weight: 600 }));
    outerRows.forEach((r, k) => {
      const idx = outerIdx[k];
      const live = stage === 3 ? inner.includes(idx) : idx === p1;
      const tone: Tone = idx === -1 ? "ghost" : live ? (stage === 1 || stage === 3 ? "accent" : "plain") : stage === 3 ? "muted" : "plain";
      items.push(txt(`oi${k}`, OX - 6, OY + k * RH + 10, r, { anchor: "end", tone: "faint", size: 11 }));
      items.push(cell(`o${k}`, OX, OY + k * RH, 80, RH - 3, idx === -1 ? "" : stage === 3 ? (live ? "→ table" : "empty") : idx === p1 ? "→ table" : "", tone, 11));
    });
    if (stage >= 1 && stage <= 2) items.push(line("a1", fx(0) + 40, 46, OX + 40, OY - 22, stage === 1 ? "accent" : "ink"));
    // One inner table (stages 2): entry p2 gives the frame.
    if (stage >= 1 && stage <= 2) {
      items.push(txt("il", IX + 40, OY - 12, `inner table ${p1}`, { tone: "soft", size: 11, mono: false, weight: 600 }));
      innerRows.forEach((r, k) => {
        const hot = stage === 2 && k === p2;
        items.push(txt(`ii${k}`, IX - 6, OY + k * RH + 10, r, { anchor: "end", tone: "faint", size: 11 }));
        items.push(cell(`i${k}`, IX, OY + k * RH, 80, RH - 3, k === p2 && stage === 2 ? `frame ${FRAME}` : r === "…" ? "" : "…", hot ? "strong" : r === "…" ? "ghost" : "plain", 11));
      });
      items.push(line("a2", OX + 82, OY + p1 * RH + 9, IX - 18, OY + 9, stage === 1 ? "accent" : "ink"));
    }
    if (stage === 2) {
      items.push(line("a3", fx(1) + 41, 46, IX + 24, OY - 22, "accent"));
      items.push(txt("pl", FX + 50, OY - 12, "physical address", { tone: "soft", size: 11, mono: false, weight: 600 }));
      items.push(cell("pf", FX, OY + 30, 50, 28, `${FRAME}`, "strong", 12));
      items.push(cell("pd", FX + 52, OY + 30, 50, 28, "0xABC", "plain", 11));
      items.push(line("a4", IX + 82, OY + p2 * RH + 9, FX - 3, OY + 44, "accent"));
      items.push(txt("pv", FX + 51, OY + 78, `${FRAME} × 4096 + ${d}`, { tone: "soft", size: 11 }));
      items.push(txt("pv2", FX + 51, OY + 96, `= ${phys}`, { size: 12, weight: 700, tone: "accent" }));
    }
    if (stage === 3) {
      // Only the inner tables the process uses exist.
      inner.forEach((e, k) => {
        const row = outerIdx.indexOf(e);
        items.push(cell(`it${k}`, IX + 40, OY + k * 44, 128, 34, `inner ${e}: 4 KB`, "accent", 11));
        items.push(line(`ia${k}`, OX + 82, OY + row * RH + 9, IX + 37, OY + k * 44 + 17, "accent"));
      });
      items.push(txt("sum", IX + 40, OY + inner.length * 44 + 14, `1 outer + ${inner.length} inner = ${kb} KB`, { anchor: "start", size: 12.5, weight: 700, tone: "accent" }));
      items.push(txt("sum2", IX + 40, OY + inner.length * 44 + 34, "one flat table: 4 MB", { anchor: "start", size: 12, tone: "soft" }));
    }
    return items;
  };
  return finish({
    title: "A two-level page table: split the address, walk two tables",
    input: "32-bit address 0x00403ABC, 4 KB pages, 10 + 10 + 12 bits",
    frames: [
      { caption: `The 32-bit address splits into three fields: the top 10 bits index the outer table (p1 = ${p1}), the next 10 an inner table (p2 = ${p2}), and the low 12 are the offset in the 4 KB page (d = 0xABC = ${d}).`, items: draw(0) },
      { caption: `Entry ${p1} of the outer table points to an inner table. The outer table has 1,024 entries of 4 bytes, so it fills exactly one 4 KB page.`, items: draw(1) },
      { caption: `Entry ${p2} of that inner table holds the frame, ${FRAME}; the offset is appended unchanged, giving ${phys}. On a TLB miss that walk costs one memory access per level.`, items: draw(2) },
      { caption: `The saving: an inner table exists only where the process has memory. 8 MB of code and data use outer entries 0 and 1, the 4 MB stack entry 1023, so ${inner.length} inner tables plus the outer one cost ${kb} KB instead of 4 MB.`, items: draw(3) },
    ],
  });
}

/* ── The working set ──────────────────────────────────────────────── */

function workingSet(): Walkthrough {
  const REFS = [1, 2, 3, 1, 2, 4, 4, 4, 5, 5, 4, 5];
  const DELTA = 4;
  const ws = (t: number) => [...new Set(REFS.slice(Math.max(0, t - DELTA), t))].sort((a, b) => a - b);
  const note: Record<number, string> = { 4: "1,2,3", 8: "2,4", 12: "4,5" };
  for (const [t, set] of Object.entries(note)) if (ws(Number(t)).join() !== set) throw new Error(`working-set: WS at ${t} is {${ws(Number(t))}}, the note says {${set}}`);
  const CW = 30;
  const STEP = CW + 4;
  const sizes: number[] = [];
  const frames: Frame[] = [];
  for (let t = DELTA; t <= REFS.length; t++) {
    const set = ws(t);
    sizes.push(set.length);
    const items: Item[] = [];
    items.push(txt("tl", -8, 13, "page", { anchor: "end", tone: "soft", size: 11, mono: false }));
    items.push(txt("tt", -8, -12, "time", { anchor: "end", tone: "faint", size: 11, mono: false }));
    items.push({ k: "band", id: "win", x: (t - DELTA) * STEP - 4, y: -4, w: DELTA * STEP + 4, h: CW + 4, tone: "accent" });
    REFS.forEach((r, i) => {
      items.push(txt(`ti${i}`, i * STEP + CW / 2, -12, String(i + 1), { tone: "faint", size: 11 }));
      items.push(cell(`r${i}`, i * STEP, 0, CW, 26, r, i >= t - DELTA && i < t ? "accent" : i >= t ? "muted" : "plain", 13));
    });
    items.push({ k: "span", id: "sp", x1: (t - DELTA) * STEP + 2, x2: (t - 1) * STEP + CW - 2, y: 36, label: `last ${DELTA} references`, tone: "accent", down: true });
    // The working set itself.
    items.push(txt("wl", -8, 80, "WS", { anchor: "end", tone: "soft", size: 12, mono: false, weight: 600 }));
    set.forEach((p, k) => items.push(cell(`w${p}`, k * STEP, 67, CW, 26, p, "strong", 13)));
    items.push(txt("ws", set.length * STEP + 4, 80, `size ${set.length}`, { anchor: "start", size: 12, weight: 600 }));
    // Its size over time, a bar per step so far.
    const BASE = 170;
    items.push(txt("bl", -8, BASE - 20, "size", { anchor: "end", tone: "soft", size: 11, mono: false }));
    items.push({ k: "path", id: "base", pts: [[(DELTA - 1) * STEP - 2, BASE], [REFS.length * STEP - 2, BASE]], tone: "line", width: 1 });
    sizes.forEach((sz, k) => {
      const i = DELTA - 1 + k;
      items.push(cell(`b${i}`, i * STEP + 4, BASE - sz * 16, CW - 8, sz * 16, sz, i === t - 1 ? "accent" : "plain", 11));
    });
    let caption = `At time ${t} the window holds ${REFS.slice(t - DELTA, t).join(" ")}: the working set is {${set.join(", ")}}, size ${set.length}.`;
    const prev = t > DELTA ? ws(t - 1) : set;
    const enters = set.filter((p) => !prev.includes(p));
    const leaves = prev.filter((p) => !set.includes(p));
    const pages = (xs: number[]) => `page${xs.length > 1 ? "s" : ""} ${xs.join(" and ")}`;
    if (t === DELTA) caption += " The process is still in its first locality, pages 1 to 3.";
    else if (enters.length && leaves.length) caption += ` ${pages(enters)[0].toUpperCase()}${pages(enters).slice(1)} enters as ${pages(leaves)} leaves: the locality is moving.`;
    else if (enters.length) caption += ` ${pages(enters)[0].toUpperCase()}${pages(enters).slice(1)} enters, so the set grows while the old locality is still in the window.`;
    else if (leaves.length) caption += ` It shrinks: ${pages(leaves)} fell out of the window.`;
    if (t === REFS.length) caption += " Frames for these pages are all it needs now.";
    frames.push({ caption, items });
  }
  return finish({ title: "The working set: the pages used in the last Δ references", input: `references ${REFS.join(" ")}, Δ = ${DELTA}`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "page-fault": pageFault,
  "tlb-path": tlbPath,
  "two-level": twoLevel,
  "working-set": workingSet,
};
