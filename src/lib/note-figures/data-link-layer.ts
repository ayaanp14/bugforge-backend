import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * Data Link Layer: the note's figures
 * (content/notes/computer-networks/data-link-layer.md places each with
 * "@figure <name>"). Each runs what it shows on the note's own example:
 *
 *  - framing: byte stuffing of A FLAG B ESC C and bit stuffing of
 *    011111110, by the stuffing rules (checked against the note);
 *  - crc-division: the modulo-2 long division of 11010110 by 1011, one
 *    XOR per frame, then the codeword and the receiver's check of it and
 *    of a copy with the fourth bit flipped (checked against the note's
 *    program output);
 *  - hamming: Hamming(7,4) encoding of 1011 group by group, then the
 *    syndrome of 0110001 naming position 6;
 *  - arq-loss: Go-Back-N and Selective Repeat sending frames 0–6 with the
 *    first copy of frame 2 lost, both receivers simulated;
 *  - ethernet-frame: the frame's fields and the 64- and 1,518-byte limits
 *    summed from their sizes;
 *  - collision-window: CSMA/CD's space-time picture, the minimum frame
 *    computed as 2 × Tp × R.
 */

/* ── Framing: byte and bit stuffing ───────────────────────────────── */

/** Byte stuffing: an ESC before every FLAG or ESC in the data. Returns the bytes and which of them were inserted. */
function byteStuff(data: readonly string[]): { out: string[]; stuffed: Set<number> } {
  const out: string[] = [];
  const stuffed = new Set<number>();
  for (const b of data) {
    if (b === "FLAG" || b === "ESC") {
      stuffed.add(out.length);
      out.push("ESC");
    }
    out.push(b);
  }
  return { out, stuffed };
}

/** Bit stuffing: a 0 after every run of five 1s. Returns the bits and which of them were stuffed. */
function bitStuff(bits: string): { out: string[]; stuffed: Set<number> } {
  const out: string[] = [];
  const stuffed = new Set<number>();
  let run = 0;
  for (const b of bits) {
    out.push(b);
    run = b === "1" ? run + 1 : 0;
    if (run === 5) {
      stuffed.add(out.length);
      out.push("0");
      run = 0;
    }
  }
  return { out, stuffed };
}

function framing(): Walkthrough {
  const data = ["A", "FLAG", "B", "ESC", "C"];
  const { out: sent, stuffed: escs } = byteStuff(data);
  if (sent.join(" ") !== "A ESC FLAG B ESC ESC C") throw new Error(`framing: byte stuffing gave ${sent.join(" ")}`);
  const bits = "011111110";
  const { out, stuffed } = bitStuff(bits);
  if (out.join("") !== "0111110110") throw new Error(`framing: bit stuffing gave ${out.join("")}`);

  const BW = 48;
  const BG = 5;
  const byteFrame: Item[] = [
    label("t1", "data from the network layer", 0, -14, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }),
    ...data.map((b, i) => box(`d${i}`, 58 + i * (BW + BG), 0, b, { w: BW, h: 30, size: 11.5, tone: b === "FLAG" || b === "ESC" ? "accent" : "plain" })),
    label("t2", "on the wire", 0, 74, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }),
    box("f0", 0, 88, "FLAG", { w: BW, h: 30, size: 11.5, tone: "muted" }),
  ];
  sent.forEach((b, i) => byteFrame.push(box(`s${i}`, BW + BG + i * (BW + BG), 88, b, { w: BW, h: 30, size: 11.5, tone: escs.has(i) ? "strong" : b === "FLAG" || b === "ESC" ? "accent" : "plain" })));
  byteFrame.push(box("f1", BW + BG + sent.length * (BW + BG), 88, "FLAG", { w: BW, h: 30, size: 11.5, tone: "muted" }));
  for (const i of escs) byteFrame.push(label(`k${i}`, "stuffed", BW + BG + i * (BW + BG) + BW / 2, 132, { tone: "accent", size: 11 }));
  byteFrame.push(label("k-f", "boundary", BW / 2, 132, { tone: "faint", size: 11 }));

  const CW = 26;
  const CG = 4;
  const FW = 92;
  const runs: string[] = [];
  let run = 0;
  for (const b of bits) {
    run = b === "1" ? run + 1 : 0;
    runs.push(b === "1" ? String(run) : "");
  }
  const bitFrame: Item[] = [
    label("u1", "data bits", 0, -14, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }),
    ...bits.split("").map((b, i) => box(`b${i}`, FW + CG + i * (CW + CG), 0, b, { w: CW, h: 30, size: 13, tone: runs[i] && Number(runs[i]) >= 5 ? "accent" : "plain" })),
    ...runs.map((r, i) => label(`r${i}`, r, FW + CG + i * (CW + CG) + CW / 2, 42, { tone: Number(r) === 5 ? "accent" : "faint", size: 10.5, mono: true })),
    label("rl", "run of 1s", FW - 6, 42, { anchor: "end", tone: "faint", size: 10.5 }),
    label("u2", "on the wire", 0, 74, { anchor: "start", size: 11.5, weight: 600, tone: "ink" }),
    box("g0", 0, 88, "flag 01111110", { w: FW, h: 30, size: 10.5, tone: "muted" }),
    ...out.map((b, i) => box(`o${i}`, FW + CG + i * (CW + CG), 88, b, { w: CW, h: 30, size: 13, tone: stuffed.has(i) ? "strong" : "plain" })),
    box("g1", FW + CG + out.length * (CW + CG), 88, "flag 01111110", { w: FW, h: 30, size: 10.5, tone: "muted" }),
  ];
  for (const i of stuffed) bitFrame.push(label(`sl${i}`, "stuffed 0", FW + CG + i * (CW + CG) + CW / 2, 136, { tone: "accent", size: 11 }));

  const stuffedAt = [...stuffed][0];
  return finish({
    title: "Byte stuffing and bit stuffing keep data from imitating a frame boundary",
    input: "bytes A FLAG B ESC C; bits 011111110",
    frames: [
      {
        caption: `Byte stuffing: a FLAG byte marks each end of the frame, so a FLAG or ESC inside the data gets an ESC in front of it. ${data.join(" ")} goes out as ${sent.join(" ")}, and the receiver drops each ESC and keeps the byte after it.`,
        items: byteFrame,
      },
      {
        caption: `Bit stuffing: the flag is 01111110, six 1s in a row. After any five 1s the sender inserts a 0, so ${bits} goes out as ${out.join("")} with the stuffed bit at position ${stuffedAt + 1}. The receiver deletes the 0 after any five 1s.`,
        items: bitFrame,
      },
    ],
  });
}

/* ── CRC: modulo-2 long division ──────────────────────────────────── */

const xorBits = (a: string, b: string) => a.split("").map((c, i) => (c === b[i] ? "0" : "1")).join("");

function remainderOf(dividend: string, gen: string): string {
  const w = dividend.split("");
  const n = gen.length - 1;
  for (let i = 0; i + n < w.length; i++) if (w[i] === "1") for (let j = 0; j < gen.length; j++) w[i + j] = w[i + j] === gen[j] ? "0" : "1";
  return w.slice(w.length - n).join("");
}

function crcDivision(): Walkthrough {
  const data = "11010110";
  const gen = "1011";
  const r = gen.length - 1;
  const work = (data + "0".repeat(r)).split("");
  const L = work.length;
  const S = 30;
  const G = 4;
  const x = (i: number) => i * (S + G);
  const Y = { work: 0, div: 46, res: 96 };

  const rowOf = (prefix: string, bits: readonly string[], y: number, tone: (i: number) => Tone, at = 0): Item[] => bits.map((b, i) => box(`${prefix}${i}`, x(at + i), y, b, { w: S, h: S, size: 13, tone: tone(i) }));
  const labels = (withDiv: boolean): Item[] => {
    const items: Item[] = [label("lw", "dividend", -10, Y.work + S / 2, { anchor: "end", size: 11.5 })];
    if (withDiv) {
      items.push(label("ld", "XOR", -10, Y.div + S / 2, { anchor: "end", size: 11.5 }));
      items.push(label("lr", "result", -10, Y.res + S / 2, { anchor: "end", size: 11.5 }));
    }
    return items;
  };

  const frames: Frame[] = [];
  frames.push({
    caption: `The generator ${gen} has degree ${r}, so ${r} zeros are appended to the data ${data}. The division runs on these ${L} bits, and subtraction is XOR: no carries, no borrows.`,
    items: [
      ...labels(false),
      ...rowOf("w", work, Y.work, (i) => (i >= data.length ? "accent" : "plain")),
      { k: "span", id: "zs", x1: x(data.length) + 2, x2: x(L - 1) + S - 2, y: Y.work + S + 10, label: `${r} zeros appended`, tone: "accent", down: true },
      label("gl", `generator ${gen}`, x(0), Y.div + 30, { anchor: "start", size: 12, tone: "ink", mono: true }),
    ],
  });
  let step = 0;
  for (let i = 0; i + r < L; i++) {
    step++;
    const lead = work[i];
    const divisor = lead === "1" ? gen : "0".repeat(gen.length);
    const before = work.slice(i, i + gen.length).join("");
    const after = xorBits(before, divisor);
    const items: Item[] = [
      ...labels(true),
      { k: "band", id: "win", x: x(i) - 3, y: Y.work - 3, w: x(i + r) + S - x(i) + 6, h: S + 6, tone: "accent" },
      ...rowOf("w", work, Y.work, (k) => (k < i ? "muted" : k >= i && k <= i + r ? "accent" : "plain")),
      ...rowOf("d", divisor.split(""), Y.div, () => (lead === "1" ? "plain" : "muted"), i),
      { k: "path", id: "bar", pts: [[x(i) - 2, Y.div + S + 8], [x(i + r) + S + 2, Y.div + S + 8]], tone: "ink", width: 1.2 },
      ...rowOf("x", after.split(""), Y.res, (k) => (k === 0 ? "muted" : "accent"), i),
    ];
    for (let j = 0; j < gen.length; j++) work[i + j] = after[j];
    frames.push({
      caption:
        lead === "1"
          ? `Step ${step}: the leading bit is 1, so XOR the generator under it: ${before} ⊕ ${gen} = ${after}. The leading bit becomes 0 and the window moves one bit right.`
          : `Step ${step}: the leading bit is 0, so XOR 0000 — ${before} stays ${after}. A zero leading bit means the generator does not go in here; the window just moves on.`,
      items,
    });
  }
  const rem = work.slice(L - r).join("");
  if (rem !== remainderOf(data + "0".repeat(r), gen) || rem !== "111") throw new Error(`crc-division: remainder ${rem}, the note says 111`);
  const code = data + rem;
  if (code !== "11010110111") throw new Error(`crc-division: codeword ${code}`);
  const CY = 64;
  frames.push({
    caption: `After ${step} steps only the last ${r} bits can be non-zero: the remainder is ${rem}. It replaces the appended zeros, and ${code} is the codeword that goes on the wire.`,
    items: [
      ...labels(false),
      ...rowOf("w", work, Y.work, (k) => (k >= L - r ? "strong" : "muted")),
      label("lc", "codeword", -10, CY + S / 2, { anchor: "end", size: 11.5, tone: "ink" }),
      ...rowOf("c", code.split(""), CY, (k) => (k >= data.length ? "strong" : "plain")),
      { k: "span", id: "cs1", x1: x(0) + 2, x2: x(data.length - 1) + S - 2, y: CY + S + 10, label: "data", tone: "line", down: true },
      { k: "span", id: "cs2", x1: x(data.length) + 2, x2: x(L - 1) + S - 2, y: CY + S + 10, label: "remainder", tone: "accent", down: true },
    ],
  });
  const flipped = code.split("");
  flipped[3] = flipped[3] === "0" ? "1" : "0";
  const bad = flipped.join("");
  const okRem = remainderOf(code, gen);
  const badRem = remainderOf(bad, gen);
  if (okRem !== "000" || badRem !== "001") throw new Error(`crc-division: checks gave ${okRem} and ${badRem}, the note says 000 and 001`);
  frames.push({
    caption: `The receiver divides what arrives by ${gen}. The codeword leaves ${okRem}, so it is accepted; with the fourth bit flipped in transit it leaves ${badRem}, not zero, and the frame is discarded.`,
    items: [
      label("lc", "codeword", -10, Y.work + S / 2, { anchor: "end", size: 11.5, tone: "ink" }),
      ...rowOf("c", code.split(""), Y.work, () => "plain"),
      label("ok", `÷ ${gen} → ${okRem}: accept`, x(0), Y.work + S + 18, { anchor: "start", size: 12.5, tone: "accent", weight: 600, mono: true }),
      label("lb", "corrupted", -10, CY + 26 + S / 2, { anchor: "end", size: 11.5, tone: "error" }),
      ...rowOf("e", flipped, CY + 26, (k) => (k === 3 ? "error" : "plain")),
      label("no", `÷ ${gen} → ${badRem}: reject`, x(0), CY + 26 + S + 18, { anchor: "start", size: 12.5, tone: "error", weight: 600, mono: true }),
    ],
  });
  return finish({ title: "CRC: dividing 11010110 by 1011 with XOR", input: `data = ${data}, generator = ${gen}`, frames });
}

/* ── Hamming(7,4) ─────────────────────────────────────────────────── */

function hamming(): Walkthrough {
  const dataBits = "1011";
  const roles = ["p1", "p2", "d1", "p4", "d2", "d3", "d4"];
  const word: Array<string | null> = Array(7).fill(null);
  const dataPos = [3, 5, 6, 7];
  dataPos.forEach((p, i) => (word[p - 1] = dataBits[i]));
  const checks = [1, 2, 4];
  const covers = (c: number) => [1, 2, 3, 4, 5, 6, 7].filter((p) => (p & c) !== 0);
  const S = 36;
  const G = 6;
  const X0 = 64;
  const x = (p: number) => X0 + (p - 1) * (S + G);
  const RY = (k: number) => 92 + k * 40;
  const RX = x(7) + S + 14;

  const header = (bits: Array<string | null>, tone: (p: number) => Tone): Item[] => {
    const items: Item[] = [label("pl", "position", X0 - 10, -12, { anchor: "end", size: 11, tone: "faint" })];
    for (let p = 1; p <= 7; p++) {
      items.push(label(`n${p}`, String(p), x(p) + S / 2, -12, { tone: "faint", size: 11, mono: true }));
      items.push(box(`w${p}`, x(p), 0, bits[p - 1] ?? "?", { w: S, h: S, size: 14, tone: tone(p) }));
      items.push(label(`ro${p}`, roles[p - 1], x(p) + S / 2, S + 12, { tone: roles[p - 1].startsWith("p") ? "accent" : "faint", size: 11, mono: true }));
    }
    return items;
  };
  const groupRow = (k: number, bits: Array<string | null>, o: { hot?: boolean; tone?: Tone; result?: string; resultTone?: "accent" | "ink" | "error" | "soft" }): Item[] => {
    const c = checks[k];
    const items: Item[] = [label(`gl${k}`, `group ${c}`, X0 - 10, RY(k) + 14, { anchor: "end", size: 11.5, tone: o.hot ? "ink" : "soft", weight: o.hot ? 600 : undefined })];
    for (const p of covers(c)) items.push(box(`g${k}-${p}`, x(p) + 4, RY(k), bits[p - 1] ?? "?", { w: S - 8, h: 28, size: 12.5, tone: o.tone ?? (o.hot ? "accent" : "plain") }));
    if (o.result) items.push(label(`gr${k}`, o.result, RX, RY(k) + 14, { anchor: "start", size: 12, tone: o.resultTone ?? "soft", mono: true }));
    return items;
  };
  const frames: Frame[] = [];
  frames.push({
    caption: `The data bits ${dataBits} go into positions ${dataPos.join(", ")}; positions 1, 2 and 4, the powers of 2, are check bits. Check bit c covers every position whose binary number has c's bit set, so the groups overlap.`,
    items: [...header(word, (p) => (word[p - 1] === null ? "ghost" : "plain")), ...checks.flatMap((_, k) => groupRow(k, word, {}))],
  });
  const results: string[] = [];
  checks.forEach((c, k) => {
    const others = covers(c).filter((p) => p !== c);
    const ones = others.filter((p) => word[p - 1] === "1").length;
    word[c - 1] = ones % 2 === 0 ? "0" : "1";
    results[k] = `${ones} ones → p${c} = ${word[c - 1]}`;
    frames.push({
      caption: `Group ${c} covers positions ${covers(c).join(", ")}. Positions ${others.join(", ")} hold ${others.map((p) => word[p - 1]).join(", ")}: ${ones} ones, so even parity makes p${c} = ${word[c - 1]}.`,
      items: [
        ...header(word, (p) => (p === c ? "strong" : covers(c).includes(p) ? "accent" : word[p - 1] === null ? "ghost" : "plain")),
        ...checks.flatMap((_, j) => groupRow(j, word, { hot: j === k, result: results[j], resultTone: j === k ? "accent" : "soft" })),
      ],
    });
  });
  const code = word.join("");
  if (code !== "0110011") throw new Error(`hamming: codeword ${code}, the note says 0110011`);
  const got = code.split("");
  got[5] = got[5] === "0" ? "1" : "0";
  const recv = got.join("");
  if (recv !== "0110001") throw new Error(`hamming: received ${recv}`);
  const syn = checks.map((c) => covers(c).filter((p) => got[p - 1] === "1").length % 2);
  const pos = syn.reduce((a, s, k) => a + s * checks[k], 0);
  if (pos !== 6) throw new Error(`hamming: syndrome names ${pos}, the note says 6`);
  const recheck = checks.map((c, k) => `${covers(c).filter((p) => got[p - 1] === "1").length} ones → c${c} = ${syn[k]}`);
  frames.push({
    caption: `${recv} arrives instead of ${code}. The receiver rechecks every group: group 1 still has even parity, but groups 2 and 4 now have odd parity, so c1 = 0, c2 = 1 and c4 = 1.`,
    items: [
      ...header(got, () => "plain"),
      ...checks.flatMap((_, k) => groupRow(k, got, { tone: syn[k] ? "error" : "plain", result: recheck[k], resultTone: syn[k] ? "error" : "soft" })),
    ],
  });
  const fixed = [...got];
  fixed[pos - 1] = fixed[pos - 1] === "0" ? "1" : "0";
  frames.push({
    caption: `Read the checks as a binary number, c4 c2 c1 = ${syn.slice().reverse().join("")} = ${pos}: position ${pos} is the only one inside both failing groups and outside the passing one. Flipping it back restores ${fixed.join("")}.`,
    items: [
      ...header(fixed, (p) => (p === pos ? "strong" : "plain")),
      ...checks.flatMap((_, k) => groupRow(k, got, { tone: syn[k] ? "error" : "muted", result: `c${checks[k]} = ${syn[k]}`, resultTone: syn[k] ? "error" : "soft" })),
      label("syn", `c4 c2 c1 = ${syn.slice().reverse().join(" ")} = ${pos}`, RX, -12, { anchor: "start", size: 12.5, tone: "accent", weight: 600, mono: true }),
    ],
  });
  return finish({ title: "Hamming(7,4): placing check bits, then finding a flipped bit", input: `data = ${dataBits}, even parity; then ${recv} arrives`, frames });
}

/* ── Go-Back-N vs Selective Repeat ────────────────────────────────── */

type Act = "keep" | "lost" | "drop" | "buffer";

function arq(kind: "gbn" | "sr", frames: number, lostSeq: number): { tx: Array<{ seq: number; resent: boolean }>; act: Act[]; delivered: number[]; timeoutAt: number } {
  const tx: Array<{ seq: number; resent: boolean }> = [];
  const act: Act[] = [];
  const delivered: number[] = [];
  const buffered = new Set<number>();
  const received = new Set<number>();
  let expected = 0;
  let lostOnce = false;
  const arrive = (seq: number, resent: boolean) => {
    tx.push({ seq, resent });
    if (seq === lostSeq && !lostOnce) {
      lostOnce = true;
      act.push("lost");
      return;
    }
    if (seq === expected) {
      delivered.push(seq);
      received.add(seq);
      expected++;
      act.push("keep");
      // Selective Repeat hands up whatever it buffered behind the gap.
      while (buffered.has(expected)) {
        buffered.delete(expected);
        delivered.push(expected);
        expected++;
      }
      return;
    }
    if (kind === "sr" && seq > expected) {
      buffered.add(seq);
      received.add(seq);
      act.push("buffer");
    } else act.push("drop");
  };
  for (let s = 0; s < frames; s++) arrive(s, false);
  const timeoutAt = tx.length;
  // The timer for the oldest unacknowledged frame runs out.
  if (kind === "gbn") for (let s = expected; s < frames; s++) arrive(s, true);
  else for (let s = 0; s < frames; s++) if (!received.has(s)) arrive(s, true);
  return { tx, act, delivered, timeoutAt };
}

const TONE_OF: Record<Act, Tone> = { keep: "strong", buffer: "accent", drop: "muted", lost: "error" };
const LEGEND: Record<Act, string> = { keep: "delivered", buffer: "buffered", drop: "discarded", lost: "lost" };

function arqLoss(): Walkthrough {
  const N = 7;
  const LOST = 2;
  const gbn = arq("gbn", N, LOST);
  const sr = arq("sr", N, LOST);
  const resent = (r: typeof gbn) => r.tx.filter((t) => t.resent).map((t) => t.seq);
  if (resent(gbn).join(",") !== "2,3,4,5,6" || resent(sr).join(",") !== "2") throw new Error(`arq-loss: resent ${resent(gbn)} and ${resent(sr)}`);
  for (const r of [gbn, sr]) if (r.delivered.join(",") !== "0,1,2,3,4,5,6") throw new Error(`arq-loss: delivered ${r.delivered}`);
  const S = 30;
  const G = 4;
  const X0 = 62;
  const gapAt = (i: number, r: typeof gbn) => (i >= r.timeoutAt ? 16 : 0);
  const cx = (i: number, r: typeof gbn) => X0 + i * (S + G) + gapAt(i, r);
  const draw = (r: typeof gbn, name: string): Item[] => {
    const items: Item[] = [
      label("ls", "sender", X0 - 10, S / 2, { anchor: "end", size: 11.5, tone: "ink" }),
      label("lr", "receiver", X0 - 10, 56 + S / 2, { anchor: "end", size: 11.5, tone: "ink" }),
    ];
    r.tx.forEach((t, i) => {
      const a = r.act[i];
      items.push(box(`t${i}`, cx(i, r), 0, t.seq, { w: S, h: S, size: 13, tone: a === "lost" ? "error" : t.resent ? "accent" : "plain" }));
      items.push(arrow(`a${i}`, { x: cx(i, r) + S / 2, y: S + 2 }, { x: cx(i, r) + S / 2, y: 54 }, { tone: a === "lost" ? "error" : "line", dashed: a === "lost" }));
      items.push(box(`v${i}`, cx(i, r), 56, a === "lost" ? "×" : t.seq, { w: S, h: S, size: 13, tone: TONE_OF[a] }));
    });
    // The legend: what each receiver tone means, only the ones this protocol uses.
    let lx = X0;
    for (const a of ["keep", "buffer", "drop", "lost"] as const) {
      if (!r.act.includes(a)) continue;
      items.push(box(`k-${a}`, lx, 56 + S + 12, "", { w: 14, h: 14, tone: TONE_OF[a] }));
      items.push(label(`kl-${a}`, LEGEND[a], lx + 20, 56 + S + 19, { anchor: "start", size: 11, tone: "soft" }));
      lx += 26 + LEGEND[a].length * 6.2;
    }
    const tx = cx(r.timeoutAt, r) - 10;
    items.push({ k: "path", id: "to", pts: [[tx, -8], [tx, 56 + S + 8]], tone: "ink", dashed: true, width: 1.2 });
    items.push(label("tol", "timeout for frame 2", tx + 6, -12, { anchor: "start", size: 11, tone: "soft" }));
    items.push(label("sum", `${name}: ${r.tx.length} transmissions, ${resent(r).length} of them resent`, X0, 56 + S + 46, { anchor: "start", size: 12, weight: 600, tone: "ink" }));
    return items;
  };
  return finish({
    title: "Frames 0 to 6 with frame 2 lost: Go-Back-N against Selective Repeat",
    input: "frames 0–6 sent back to back; the first copy of frame 2 is lost",
    frames: [
      {
        caption: `Go-Back-N: the receiver accepts only the frame it expects next, so it discards 3, 4, 5 and 6 even though they arrived intact. When frame 2's timer runs out the sender goes back and resends ${resent(gbn).join(", ")}: ${gbn.tx.length} transmissions for 7 frames.`,
        items: draw(gbn, "Go-Back-N"),
      },
      {
        caption: `Selective Repeat: the receiver buffers 3 to 6 and acknowledges each one, so the sender resends only frame 2. When it arrives, frames 2 to 6 go up to the network layer in order: ${sr.tx.length} transmissions in all.`,
        items: draw(sr, "Selective Repeat"),
      },
    ],
  });
}

/* ── The Ethernet frame ───────────────────────────────────────────── */

function ethernetFrame(): Walkthrough {
  const fields = [
    { name: "Preamble", min: 7, max: 7, w: 62, counted: false },
    { name: "SFD", min: 1, max: 1, w: 34, counted: false },
    { name: "Dest MAC", min: 6, max: 6, w: 62, counted: true },
    { name: "Src MAC", min: 6, max: 6, w: 56, counted: true },
    { name: "EtherType", min: 2, max: 2, w: 68, counted: true },
    { name: "Payload", min: 46, max: 1500, w: 92, counted: true },
    { name: "FCS", min: 4, max: 4, w: 38, counted: true },
  ];
  const lo = fields.filter((f) => f.counted).reduce((a, f) => a + f.min, 0);
  const hi = fields.filter((f) => f.counted).reduce((a, f) => a + f.max, 0);
  const header = fields.filter((f) => f.counted && f.name !== "Payload" && f.name !== "FCS").reduce((a, f) => a + f.min, 0);
  if (lo !== 64 || hi !== 1518 || header !== 14) throw new Error(`ethernet-frame: ${lo}–${hi} bytes, header ${header}`);
  const G = 3;
  const items: Item[] = [];
  const xs: number[] = [];
  let x = 0;
  fields.forEach((f, i) => {
    xs.push(x);
    items.push(box(`f${i}`, x, 0, f.name, { w: f.w, h: 36, size: 11, tone: f.counted ? (f.name === "FCS" ? "accent" : "plain") : "muted" }));
    items.push(label(`b${i}`, f.min === f.max ? `${f.min}` : `${f.min}–${f.max}`, x + f.w / 2, 50, { tone: "faint", size: 11, mono: true }));
    x += f.w + G;
  });
  const end = (i: number) => xs[i] + fields[i].w;
  items.push(label("bl", "bytes", -8, 50, { anchor: "end", tone: "faint", size: 11 }));
  items.push({ k: "span", id: "s1", x1: xs[0] + 2, x2: end(1) - 2, y: -10, label: "not counted", tone: "line" });
  items.push({ k: "span", id: "s2", x1: xs[2] + 2, x2: end(4) - 2, y: -10, label: `header: ${header} bytes`, tone: "line" });
  items.push({ k: "span", id: "s3", x1: xs[2] + 2, x2: end(6) - 2, y: 66, label: `the frame: ${lo} to ${hi.toLocaleString("en-GB")} bytes`, tone: "accent", down: true });
  items.push(label("fcs", "FCS: a CRC-32 over the counted fields", end(6), 104, { anchor: "end", tone: "accent", size: 11 }));
  return finish({
    title: "The Ethernet frame and its size limits",
    input: "",
    frames: [
      {
        caption: `Counting from the destination address to the FCS, a frame is 6 + 6 + 2 + 46 + 4 = ${lo} bytes at least and 6 + 6 + 2 + 1,500 + 4 = ${hi.toLocaleString("en-GB")} at most. The preamble and SFD only synchronise the receiver and are not counted.`,
        items,
      },
    ],
  });
}

/* ── CSMA/CD: why a frame must outlast a round trip ───────────────── */

function collisionWindow(): Walkthrough {
  // Tp = 25.6 µs, R = 10 Mbps = 10 bits per µs. Times in tenths of a microsecond keep the arithmetic exact.
  const TP = 256;
  const BITS_PER_TENTH = 1;
  const minBits = 2 * TP * BITS_PER_TENTH;
  if (minBits !== 512 || minBits / 8 !== 64) throw new Error(`collision-window: ${minBits} bits`);
  const W = 300;
  const k = 120 / TP;
  const y = (t: number) => t * k;
  const AX = 0;
  const BX = W;
  const EPS = 6;
  const us = (t: number) => `${(t / 10).toFixed(1)} µs`;
  const base: Item[] = [
    label("na", "station A", AX, -30, { tone: "ink", size: 12, weight: 600 }),
    label("nb", "station B", BX, -30, { tone: "ink", size: 12, weight: 600 }),
    { k: "path", id: "axa", pts: [[AX, -14], [AX, y(2 * TP) + 24]], tone: "line", width: 1.2 },
    { k: "path", id: "axb", pts: [[BX, -14], [BX, y(2 * TP) + 24]], tone: "line", width: 1.2 },
    label("tm", "time ↓", AX - 14, y(2 * TP) + 22, { anchor: "end", tone: "faint", size: 11 }),
    label("t0", "0", AX - 14, 0, { anchor: "end", tone: "faint", size: 11, mono: true }),
  ];
  const aFront = { k: "edge" as const, id: "fa", x1: AX, y1: 0, x2: BX, y2: y(TP), tone: "accent" as const, arrow: true };
  const frames: Frame[] = [
    {
      caption: `A senses an idle cable and starts sending at time 0. Its signal needs the propagation delay Tp = ${us(TP)} to reach B at the far end of the longest cable allowed.`,
      items: [...base, { k: "cell", id: "bar", x: AX - 5, y: 0, w: 10, h: y(TP), text: "", tone: "accent" }, aFront, label("t1", us(TP), BX + 14, y(TP) + 2, { anchor: "start", tone: "faint", size: 11, mono: true })],
    },
    {
      caption: "Just before A's signal arrives, B still hears silence and starts sending too. The two signals collide next to B at once, but A cannot know until the collision's signal travels all the way back.",
      items: [
        ...base,
        { k: "cell", id: "bar", x: AX - 5, y: 0, w: 10, h: y(2 * TP - EPS), text: "", tone: "accent" },
        aFront,
        label("t1", us(TP), BX + 14, y(TP) + 2, { anchor: "start", tone: "faint", size: 11, mono: true }),
        { k: "edge", id: "fb", x1: BX, y1: y(TP) - 2, x2: AX, y2: y(2 * TP) - 2, tone: "error", arrow: true },
        label("bx", "B starts: collision", BX + 14, y(TP) - 16, { anchor: "start", tone: "error", size: 11, weight: 600 }),
      ],
    },
    {
      caption: `The news reaches A at 2 × Tp = ${us(2 * TP)}. A detects the collision only if it is still transmitting then, so a frame must last at least 2 × Tp × R = ${minBits} bit times: ${minBits / 8} bytes at 10 Mbps.`,
      items: [
        ...base,
        { k: "cell", id: "bar", x: AX - 5, y: 0, w: 10, h: y(2 * TP), text: "", tone: "strong" },
        aFront,
        label("t1", us(TP), BX + 14, y(TP) + 2, { anchor: "start", tone: "faint", size: 11, mono: true }),
        { k: "edge", id: "fb", x1: BX, y1: y(TP) - 2, x2: AX, y2: y(2 * TP) - 2, tone: "error", arrow: true },
        label("bx", "B starts: collision", BX + 14, y(TP) - 16, { anchor: "start", tone: "error", size: 11, weight: 600 }),
        label("t2", us(2 * TP), AX - 14, y(2 * TP), { anchor: "end", tone: "ink", size: 11, mono: true }),
        label("mf", `A still sending: ≥ ${minBits} bits = ${minBits / 8} bytes`, AX + 14, y(2 * TP) + 22, { anchor: "start", tone: "accent", size: 12, weight: 600 }),
      ],
    },
  ];
  return finish({ title: "CSMA/CD: why Ethernet's minimum frame is 64 bytes", input: "Tp = 25.6 µs on the longest cable, R = 10 Mbps", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  framing,
  "crc-division": crcDivision,
  hamming,
  "arq-loss": arqLoss,
  "ethernet-frame": ethernetFrame,
  "collision-window": collisionWindow,
};
