import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { bars, box, label } from "../lesson-figures/kit.js";
import { lifelines, message } from "./kit.js";

/**
 * TCP and UDP: the note's figures (content/notes/computer-networks/
 * tcp-and-udp.md places each with "@figure <name>").
 *
 * The handshake, the close and the loss are played by a small TCP model
 * (`Endpoint` below): each side keeps its next sequence number to send and
 * the next byte it expects, SYN and FIN consume one number each, and every
 * state change is a lookup in RFC 793's transition table. The figures draw
 * the segments that model emits and check them against the numbers the
 * note prints.
 *
 *  - headers: the UDP and TCP headers as 32-bit rows (each row checked to
 *    sum to 32 bits; 8 and 20 bytes, up to 60 from the 4-bit length).
 *  - handshake: SYN, SYN-ACK, ACK from ISNs 100 and 300.
 *  - teardown: FIN, ACK, FIN, ACK from 500 and 800, then TIME_WAIT.
 *  - retransmit: five 1,000-byte segments, the second lost; a cumulative-ACK
 *    receiver answers, and the sender fast-retransmits on the third
 *    duplicate ACK.
 *  - flow: a 4,000-byte receive buffer, its advertised window and what the
 *    sender may send, as the application reads or stops reading.
 *  - cwnd: slow start, congestion avoidance and a loss in round 9,
 *    simulated round by round — by timeout, then by three duplicate ACKs.
 */

/* ── A TCP endpoint ───────────────────────────────────────────────── */

type Flag = "SYN" | "ACK" | "FIN";
interface Segment {
  flags: Flag[];
  seq: number;
  ack?: number;
  len: number;
}

/** RFC 793's transitions, the ones a normal open and close take. */
const TRANSITIONS: Record<string, string> = {
  "CLOSED send SYN": "SYN_SENT",
  "LISTEN recv SYN": "SYN_RECEIVED",
  "SYN_RECEIVED send SYN,ACK": "SYN_RECEIVED",
  "SYN_SENT recv SYN,ACK": "ESTABLISHED",
  "ESTABLISHED send ACK": "ESTABLISHED",
  "SYN_RECEIVED recv ACK": "ESTABLISHED",
  "ESTABLISHED send FIN,ACK": "FIN_WAIT_1",
  "ESTABLISHED recv FIN,ACK": "CLOSE_WAIT",
  "CLOSE_WAIT send ACK": "CLOSE_WAIT",
  "FIN_WAIT_1 recv ACK": "FIN_WAIT_2",
  "CLOSE_WAIT send FIN,ACK": "LAST_ACK",
  "FIN_WAIT_2 recv FIN,ACK": "TIME_WAIT",
  "TIME_WAIT send ACK": "TIME_WAIT",
  "LAST_ACK recv ACK": "CLOSED",
  "TIME_WAIT timeout": "CLOSED",
};

class Endpoint {
  constructor(
    public state: string,
    public sndNxt: number,
    public rcvNxt = 0,
  ) {}
  private move(event: string) {
    const next = TRANSITIONS[`${this.state} ${event}`];
    if (!next) throw new Error(`tcp: no transition from ${this.state} on ${event}`);
    this.state = next;
  }
  send(flags: Flag[], len = 0): Segment {
    const seg: Segment = { flags, seq: this.sndNxt, ack: flags.includes("ACK") ? this.rcvNxt : undefined, len };
    this.sndNxt += len + (flags.includes("SYN") ? 1 : 0) + (flags.includes("FIN") ? 1 : 0);
    this.move(`send ${flags.join(",")}`);
    return seg;
  }
  recv(seg: Segment) {
    if (seg.flags.includes("SYN")) this.rcvNxt = seg.seq + 1;
    else if (seg.seq === this.rcvNxt) this.rcvNxt = seg.seq + seg.len + (seg.flags.includes("FIN") ? 1 : 0);
    this.move(`recv ${seg.flags.join(",")}`);
  }
  timeout() {
    this.move("timeout");
  }
}

const n = (v: number) => v.toLocaleString("en-GB");
/** How diagrams name a segment: SYN-ACK in full; a FIN by its FIN (every segment after the handshake carries ACK too). */
const kindOf = (s: Segment) => (s.flags.includes("SYN") ? s.flags.join("-") : s.flags.includes("FIN") ? "FIN" : "ACK");
const segText = (s: Segment) => `${kindOf(s)}, seq ${n(s.seq)}${s.ack !== undefined ? `, ack ${n(s.ack)}` : ""}`;

/* ── Sequence diagrams ────────────────────────────────────────────── */

const GAPX = 250;
const ROW = 58;
const DROP = 26;

interface Step {
  from: 0 | 1;
  seg: Segment;
  /** Each side's state after this step, and the y it changed at (send or arrival). */
  states: [string, string];
}

function sequence(names: [string, string], start: [string, string], steps: Step[], upto: number, o: { extra?: Item[]; length: number; hot?: number } = { length: 0 }): Item[] {
  const ll = lifelines("ll", names, { gap: GAPX, w: 84, h: 28, length: o.length });
  const items: Item[] = [...ll.items];
  const top = ll.top;
  const yOf = (k: number) => top + 36 + k * ROW;
  // States: one label per change, on the side it belongs to; the newest change is accent.
  const changes: Array<{ side: 0 | 1; text: string; y: number; step: number }> = [
    { side: 0, text: start[0], y: top + 13, step: -1 },
    { side: 1, text: start[1], y: top + 13, step: -1 },
  ];
  let prev = [...start];
  steps.slice(0, upto + 1).forEach((s, k) => {
    for (const side of [0, 1] as const) {
      if (s.states[side] === prev[side]) continue;
      // The sender changes as it sends; the receiver when the segment lands.
      const y = side === s.from ? yOf(k) : yOf(k) + DROP;
      changes.push({ side, text: s.states[side], y, step: k });
    }
    prev = [...s.states];
  });
  for (const c of changes) {
    const x = c.side === 0 ? ll.xOf(0) - 10 : ll.xOf(1) + 10;
    const tone: TextTone = c.step === upto ? "accent" : "soft";
    items.push(label(`st${c.side}-${c.text}`, c.text, x, c.y, { anchor: c.side === 0 ? "end" : "start", tone, size: 11, mono: true, weight: c.step === upto ? 600 : undefined }));
  }
  steps.slice(0, upto + 1).forEach((s, k) => {
    const x1 = ll.xOf(s.from);
    const x2 = ll.xOf(1 - s.from);
    items.push(...message(`m${k}`, x1, x2, yOf(k), segText(s.seg), { drop: DROP, tone: k === upto ? "accent" : "ink" }));
  });
  if (o.extra) items.push(...o.extra);
  return items;
}

function handshake(): Walkthrough {
  const client = new Endpoint("CLOSED", 100);
  const server = new Endpoint("LISTEN", 300);
  const steps: Step[] = [];
  const exchange = (from: Endpoint, to: Endpoint, flags: Flag[]) => {
    const seg = from.send(flags);
    to.recv(seg);
    steps.push({ from: from === client ? 0 : 1, seg, states: [client.state, server.state] });
  };
  exchange(client, server, ["SYN"]);
  exchange(server, client, ["SYN", "ACK"]);
  exchange(client, server, ["ACK"]);
  const expect = ["SYN, seq 100", "SYN-ACK, seq 300, ack 101", "ACK, seq 101, ack 301"];
  steps.forEach((s, i) => {
    if (segText(s.seg) !== expect[i]) throw new Error(`handshake: step ${i + 1} is "${segText(s.seg)}", the note says "${expect[i]}"`);
  });
  if (client.state !== "ESTABLISHED" || server.state !== "ESTABLISHED") throw new Error("handshake: both sides must end ESTABLISHED");
  const L = steps.length * ROW + 24;
  const [syn, synAck, ack] = steps;
  return finish({
    title: "The TCP three-way handshake",
    input: "client ISN 100, server ISN 300",
    frames: [
      { caption: `The client sends a SYN carrying its initial sequence number, ${syn.seg.seq}, and enters SYN_SENT. The server, listening, receives it and enters SYN_RECEIVED.`, items: sequence(["Client", "Server"], ["CLOSED", "LISTEN"], steps, 0, { length: L }) },
      {
        caption: `The server answers SYN-ACK: its own ISN, ${synAck.seg.seq}, and ack ${synAck.seg.ack}, because the SYN used up number ${syn.seg.seq} and ${synAck.seg.ack} is the next byte it expects. On receipt the client is ESTABLISHED.`,
        items: sequence(["Client", "Server"], ["CLOSED", "LISTEN"], steps, 1, { length: L }),
      },
      {
        caption: `The client acknowledges the server's ISN with ack ${ack.seg.ack}; its seq is ${ack.seg.seq}, and data may ride in this very segment. The server is now ESTABLISHED too: each side has announced its ISN and heard it acknowledged.`,
        items: sequence(["Client", "Server"], ["CLOSED", "LISTEN"], steps, 2, { length: L }),
      },
    ],
  });
}

function teardown(): Walkthrough {
  const client = new Endpoint("ESTABLISHED", 500, 800);
  const server = new Endpoint("ESTABLISHED", 800, 500);
  const steps: Step[] = [];
  const exchange = (from: Endpoint, to: Endpoint, flags: Flag[]) => {
    const seg = from.send(flags);
    to.recv(seg);
    steps.push({ from: from === client ? 0 : 1, seg, states: [client.state, server.state] });
  };
  exchange(client, server, ["FIN", "ACK"]);
  exchange(server, client, ["ACK"]);
  exchange(server, client, ["FIN", "ACK"]);
  exchange(client, server, ["ACK"]);
  const expect = ["FIN, seq 500, ack 800", "ACK, seq 800, ack 501", "FIN, seq 800, ack 501", "ACK, seq 501, ack 801"];
  steps.forEach((s, i) => {
    if (segText(s.seg) !== expect[i]) throw new Error(`teardown: step ${i + 1} is "${segText(s.seg)}", the note says "${expect[i]}"`);
  });
  if (client.state !== "TIME_WAIT" || server.state !== "CLOSED") throw new Error("teardown: the closer waits in TIME_WAIT, the other side is CLOSED");
  const waitState = client.state;
  client.timeout();
  const L = steps.length * ROW + 64;
  const names: [string, string] = ["Client", "Server"];
  const start: [string, string] = ["ESTABLISHED", "ESTABLISHED"];
  const lastY = 28 + 36 + 3 * ROW + DROP;
  const wait: Item[] = [
    { k: "edge", id: "tw", x1: -6, y1: lastY + 4, x2: -6, y2: lastY + 40, tone: "accent" },
    label("twl", "2 × MSL", -12, lastY + 22, { anchor: "end", tone: "accent", size: 11, mono: true }),
    label("twc", client.state, -10, lastY + 52, { anchor: "end", tone: "accent", size: 11, mono: true, weight: 600 }),
  ];
  const [fin1, ack1, fin2, ack2] = steps;
  return finish({
    title: "Closing a TCP connection: four segments and TIME_WAIT",
    input: "client's next seq 500, server's 800",
    frames: [
      { caption: `The client has no more data and sends FIN, seq ${fin1.seg.seq}: FIN_WAIT_1. The server's TCP receives it and moves to CLOSE_WAIT, waiting for its application to finish.`, items: sequence(names, start, steps, 0, { length: L }) },
      { caption: `The server acknowledges at once, ack ${ack1.seg.ack}, since the FIN used number ${fin1.seg.seq}. The client is in FIN_WAIT_2: its direction is closed, but the server may still send data, a half-close.`, items: sequence(names, start, steps, 1, { length: L }) },
      { caption: `When its application closes, the server sends its own FIN, seq ${fin2.seg.seq}, and enters LAST_ACK. The client, receiving it, enters ${waitState}.`, items: sequence(names, start, steps, 2, { length: L }) },
      { caption: `The client's final ACK, ack ${ack2.seg.ack}, reaches the server, which closes. Steps 2 and 3 often travel as one segment, giving three in all.`, items: sequence(names, start, steps, 3, { length: L }) },
      {
        caption: `The client waits two maximum segment lifetimes before closing, in case its last ACK was lost and the FIN comes again, and so stray segments of this connection die out first.`,
        items: sequence(names, start, steps, 3, { length: L, extra: wait }),
      },
    ],
  });
}

/* ── Loss and fast retransmit ─────────────────────────────────────── */

function retransmit(): Walkthrough {
  const FIRST = 101;
  const MSS = 1000;
  const COUNT = 5;
  const LOST = 1; // the second segment, on its first trip
  // The receiver: cumulative ACKs, out-of-order segments buffered.
  let expected = FIRST;
  const held = new Map<number, number>();
  const receive = (seq: number, len: number): number => {
    if (seq === expected) {
      expected += len;
      while (held.has(expected)) {
        const l = held.get(expected)!;
        held.delete(expected);
        expected += l;
      }
    } else if (seq > expected) held.set(seq, len);
    return expected;
  };
  type Row = { dir: 0 | 1; text: string; tone: "ink" | "accent" | "error"; lost?: boolean; note?: string };
  const rows: Row[] = [];
  const marks: number[] = []; // the row count each frame ends at
  let dups = 0;
  let lastAck = 0;
  let retransmitted = -1;
  let heldRange = "";
  for (let i = 0; i < COUNT; i++) {
    const seq = FIRST + i * MSS;
    if (i === LOST) {
      rows.push({ dir: 0, text: `seq ${n(seq)}`, tone: "error", lost: true });
      marks.push(rows.length);
      continue;
    }
    rows.push({ dir: 0, text: `seq ${n(seq)}`, tone: "ink" });
    const ack = receive(seq, MSS);
    if (ack === lastAck) dups++;
    lastAck = ack;
    rows.push({ dir: 1, text: dups ? `ACK ${n(ack)}, duplicate ${dups}` : `ACK ${n(ack)}`, tone: dups ? "accent" : "ink" });
    if (dups === 3) {
      // Three duplicates: resend the segment the receiver keeps asking for, without waiting for the timer.
      retransmitted = ack;
      const keys = [...held.keys()].sort((a, b) => a - b);
      heldRange = `holds ${n(keys[0])} to ${n(keys[keys.length - 1] + held.get(keys[keys.length - 1])! - 1)}`;
      rows.push({ dir: 0, text: `seq ${n(ack)} again`, tone: "accent", note: "fast retransmit" });
      const after = receive(ack, MSS);
      rows.push({ dir: 1, text: `ACK ${n(after)}`, tone: "accent" });
      lastAck = after;
    }
    if (i === 0 || i === 2 || i === COUNT - 1) marks.push(rows.length);
  }
  if (retransmitted !== FIRST + LOST * MSS) throw new Error("retransmit: the segment resent must be the one lost");
  if (lastAck !== FIRST + COUNT * MSS) throw new Error(`retransmit: the note says the final ACK is 5,101; computed ${n(lastAck)}`);
  // Split the last stretch so the third duplicate and the retransmission get their own frame.
  const third = rows.findIndex((r) => r.text.endsWith("duplicate 3")) + 1;
  marks.splice(marks.length - 1, 0, third);

  const PITCH = 30;
  const ll = lifelines("ll", ["Sender", "Receiver"], { gap: 260, w: 84, h: 28, length: rows.length * PITCH + 14 });
  const draw = (upto: number, newFrom: number, extra: Item[] = []): Item[] => {
    const items: Item[] = [...ll.items];
    rows.slice(0, upto).forEach((r, k) => {
      const y = ll.top + 20 + k * PITCH;
      const x1 = ll.xOf(r.dir);
      const x2 = ll.xOf(1 - r.dir);
      const tone = k >= newFrom ? r.tone : r.tone === "error" ? "error" : "ink";
      if (r.lost) {
        const xm = (x1 + x2) / 2 + 20;
        items.push({ k: "edge", id: `r${k}`, x1: x1 + 2, y1: y, x2: xm, y2: y + 10, tone: "error", arrow: false });
        items.push(label(`r${k}-x`, "×", xm + 6, y + 8, { tone: "error", size: 16, weight: 700 }));
        items.push(label(`r${k}-t`, `${r.text}, lost`, (x1 + xm) / 2, y - 7, { tone: "error", size: 11, mono: true }));
      } else {
        items.push(...message(`r${k}`, x1, x2, y, r.text, { drop: 12, tone: tone === "ink" ? "ink" : tone }));
      }
      if (r.note) items.push(label(`r${k}-n`, r.note, x1 - 10, y + 2, { anchor: "end", tone: "accent", size: 11, weight: 600 }));
    });
    return [...items, ...extra];
  };
  const heldText = (y: number): Item => label("held", heldRange, ll.xOf(1) + 10, y, { anchor: "start", tone: "soft", size: 11, mono: true });
  const yRow = (k: number) => ll.top + 20 + k * PITCH;
  const frames: Frame[] = [
    { caption: `The sender's data starts at byte ${FIRST}, in segments of ${n(MSS)} bytes. The first arrives and the receiver acknowledges ${n(FIRST + MSS)}: it holds every byte before that.`, items: draw(marks[0], 0) },
    { caption: `The second segment, bytes ${n(FIRST + MSS)} to ${n(FIRST + 2 * MSS - 1)}, is lost on the way. Nothing tells the sender yet, and it keeps sending while its window allows.`, items: draw(marks[1], marks[0]) },
    { caption: `Segment 3 arrives with a gap before it. The receiver buffers it but can only repeat ACK ${n(FIRST + MSS)}, since acknowledgements are cumulative: a duplicate ACK.`, items: draw(marks[2], marks[1]) },
    { caption: `Segments 4 and 5 arrive and are buffered too, and each brings another ACK ${n(FIRST + MSS)}. Three duplicates say one segment is missing while later ones get through.`, items: draw(marks[3], marks[2], [heldText(yRow(marks[3] - 1) + 14)]) },
    { caption: `The sender resends seq ${n(retransmitted)} at once instead of waiting for its timer. It fills the gap, and the receiver acknowledges ${n(lastAck)} in one go because the rest was already buffered.`, items: draw(marks[4], marks[3]) },
  ];
  return finish({ title: "A lost segment, duplicate ACKs and fast retransmit", input: `5 segments of ${n(MSS)} bytes from byte ${FIRST}; the second is lost`, frames });
}

/* ── Flow control ─────────────────────────────────────────────────── */

function flow(): Walkthrough {
  const BUF = 4000;
  const MSS = 1000;
  // Receiver: bytes received and not yet read by the application; the window is the free space.
  let unread = 0;
  let nextExpected = 1;
  let nextToSend = 1;
  let readSoFar = 0;
  const rwnd = () => BUF - unread;
  type Snap = { acked: number; sent: number; limit: number; unread: number; read: number; rwnd: number; note: string };
  const snaps: Snap[] = [];
  const snap = (note: string) => snaps.push({ acked: nextExpected, sent: nextToSend, limit: nextExpected + rwnd(), unread, read: readSoFar, rwnd: rwnd(), note });
  const sendAll = () => {
    while (nextToSend + MSS <= nextExpected + rwnd()) nextToSend += MSS;
  };
  const arrive = () => {
    unread += nextToSend - nextExpected;
    nextExpected = nextToSend;
  };
  const read = (k: number) => {
    unread -= k;
    readSoFar += k;
  };

  sendAll();
  snap(`window ${n(rwnd())}: bytes 1 to ${n(nextToSend - 1)} go`);
  arrive();
  read(1000);
  const before = nextToSend;
  sendAll();
  snap(`ACK ${n(nextExpected)}, window ${n(rwnd())}: ${n(before)} to ${n(nextToSend - 1)} go`);
  arrive();
  snap(`ACK ${n(nextExpected)}, window ${n(rwnd())}: the sender waits`);
  read(2000);
  const from = nextToSend;
  sendAll();
  snap(`window ${n(rwnd())}: ${n(from)} to ${n(nextToSend - 1)} may go`);
  // The note's table: rwnd 4,000, 1,000, 0, 2,000.
  if (snaps.map((s) => s.rwnd).join() !== "4000,1000,0,2000") throw new Error(`flow: the note's table advertises 4,000, 1,000, 0, 2,000; computed ${snaps.map((s) => s.rwnd).join(", ")}`);

  const SEGS = 7;
  const W = 56;
  const G = 4;
  const SY = 0;
  const BY = 92;
  const segX = (i: number) => i * (W + G);
  const draw = (s: Snap): Item[] => {
    const items: Item[] = [label("sl", "sender's bytes, in 1,000-byte segments", 0, SY - 14, { anchor: "start", tone: "soft", size: 11 })];
    for (let i = 0; i < SEGS; i++) {
      const lo = 1 + i * MSS;
      const tone: Tone = lo < s.acked ? "muted" : lo < s.sent ? "accent" : lo < s.limit ? "plain" : "ghost";
      items.push(box(`s${i}`, segX(i), SY, `${i + 1}`, { w: W, h: 28, size: 12, tone }));
    }
    const lo = Math.floor((s.acked - 1) / MSS);
    const hi = Math.floor((s.limit - 1) / MSS) - 1;
    if (hi >= lo) items.push({ k: "span", id: "win", x1: segX(lo) + 2, x2: segX(hi) + W - 2, y: SY + 40, label: `window ${n(s.rwnd)}`, tone: "accent", down: true });
    else items.push(label("win0", "window 0: send nothing", segX(lo), SY + 50, { anchor: "start", tone: "accent", size: 11, weight: 600 }));
    // The receive buffer: read bytes are gone, unread ones occupy slots, the rest is the window.
    items.push(label("bl", `receive buffer, ${n(BUF)} bytes`, 0, BY - 14, { anchor: "start", tone: "soft", size: 11 }));
    const slots = BUF / MSS;
    const full = s.unread / MSS;
    for (let i = 0; i < slots; i++) items.push(box(`b${i}`, i * (80 + G), BY, i < full ? "unread" : "free", { w: 80, h: 28, size: 11, tone: i < full ? "accent" : "plain" }));
    items.push(label("app", `application has read ${n(s.read)}`, slots * (80 + G) + 6, BY + 14, { anchor: "start", tone: "soft", size: 11 }));
    items.push(label("note", s.note, 0, BY + 52, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 600 }));
    return items;
  };
  return finish({
    title: "Flow control: the receiver's window paces the sender",
    input: `${n(BUF)}-byte receive buffer, ${n(MSS)}-byte segments`,
    frames: [
      { caption: `The buffer is empty, so the receiver advertises ${n(snaps[0].rwnd)} bytes. The sender sends four segments and must then stop, whatever its own speed.`, items: draw(snaps[0]) },
      { caption: `All four arrived, but the application has read only ${n(snaps[1].read)} bytes, so ${n(snaps[1].unread)} sit in the buffer and the window is ${n(snaps[1].rwnd)}. The window slides on to segment 5.`, items: draw(snaps[1]) },
      { caption: "Segment 5 fills the buffer and the application has stopped reading: the window is 0. The sender stops, probing now and then with a tiny segment so it hears when space opens.", items: draw(snaps[2]) },
      { caption: `The application reads ${n(snaps[3].read - snaps[2].read)} bytes, the receiver advertises a window of ${n(snaps[3].rwnd)}, and the sender may send two more segments.`, items: draw(snaps[3]) },
    ],
  });
}

/* ── The congestion window ────────────────────────────────────────── */

function cwnd(): Walkthrough {
  const ROUNDS = 16;
  const SSTHRESH = 16;
  const LOSS = 9;
  const run = (kind: "timeout" | "dupacks") => {
    let c = 1;
    let th = SSTHRESH;
    const out: Array<{ cwnd: number; ssthresh: number }> = [];
    for (let r = 1; r <= ROUNDS; r++) {
      out.push({ cwnd: c, ssthresh: th });
      if (r === LOSS) {
        th = Math.floor(c / 2);
        c = kind === "timeout" ? 1 : th;
      } else if (c < th) c = Math.min(2 * c, th); // slow start, capped at the threshold
      else c += 1; // congestion avoidance
    }
    return out;
  };
  const timeout = run("timeout");
  const dup = run("dupacks");
  const table = [1, 2, 4, 8, 16, 17, 18, 19, 20, 1, 2, 4, 8, 10, 11, 12];
  if (timeout.map((x) => x.cwnd).join() !== table.join()) throw new Error(`cwnd: the note's table is ${table.join(", ")}; computed ${timeout.map((x) => x.cwnd).join(", ")}`);
  if (dup[LOSS].cwnd !== 10) throw new Error("cwnd: Reno's fast recovery continues from cwnd = 10 in round 10");

  const W = 20;
  const G = 4;
  const UNIT = 8;
  const BASE = 22 * UNIT;
  const xOf = (r: number) => (r - 1) * (W + G); // left edge of round r's bar
  const thresh = (series: typeof timeout): Item => {
    const pts: Array<[number, number]> = [];
    series.forEach((x, i) => {
      const y = BASE - x.ssthresh * UNIT;
      pts.push([xOf(i + 1) - G / 2, y], [xOf(i + 1) + W + G / 2, y]);
    });
    return { k: "path", id: "th", pts, tone: "ink", dashed: true, width: 1.4 };
  };
  const threshLabel = (v: number): Item => label("thl", `ssthresh ${v}`, xOf(ROUNDS) + W + 8, BASE - v * UNIT, { anchor: "start", tone: "soft", size: 11, mono: true });
  const axis = (): Item[] => {
    const items: Item[] = [{ k: "path", id: "ax", pts: [[-6, 0], [-6, BASE], [xOf(ROUNDS) + W + 4, BASE]], tone: "ink", width: 1.2 }];
    for (let r = 1; r <= ROUNDS; r++) items.push(label(`x${r}`, String(r), xOf(r) + W / 2, BASE + 11, { tone: "faint", size: 10, mono: true }));
    for (const v of [0, 5, 10, 15, 20]) items.push(label(`y${v}`, String(v), -12, BASE - v * UNIT, { anchor: "end", tone: "faint", size: 10, mono: true }));
    items.push(label("xl", "RTT round", xOf(ROUNDS) + W, BASE + 28, { anchor: "end", tone: "soft", size: 11, weight: 600 }));
    items.push(label("yl", "cwnd (MSS)", -6, -14, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    return items;
  };
  const lossMark = (text: string): Item[] => [
    { k: "edge", id: "loss", x1: xOf(LOSS) + W / 2, y1: BASE - 20 * UNIT - 22, x2: xOf(LOSS) + W / 2, y2: BASE - 20 * UNIT - 4, tone: "error", arrow: true },
    label("lossl", text, xOf(LOSS) + W / 2 - 6, BASE - 20 * UNIT - 30, { anchor: "middle", tone: "error", size: 11, weight: 600 }),
  ];
  const phase = (id: string, from: number, to: number, text: string): Item => ({ k: "span", id, x1: xOf(from) + 1, x2: xOf(to) + W - 1, y: BASE + 46, label: text, tone: "ink", down: true });

  const series = (s: typeof timeout, tone: (i: number) => Tone) => bars("b", s.map((x) => x.cwnd), { base: BASE, unit: UNIT, w: W, gap: G, tone });
  const frames: Frame[] = [
    {
      caption: `Slow start doubles cwnd every round, 1, 2, 4, 8, until it reaches ssthresh = ${SSTHRESH} in round 5. From there congestion avoidance adds one MSS a round: ${timeout
        .slice(5, LOSS)
        .map((x) => x.cwnd)
        .join(", ")}.`,
      items: [...axis(), ...series(timeout.slice(0, LOSS), () => "accent"), thresh(timeout.map((x) => ({ ...x, ssthresh: SSTHRESH }))), threshLabel(SSTHRESH), phase("p1", 1, 5, "slow start"), phase("p2", 6, LOSS, "avoidance")],
    },
    {
      caption: `A timeout in round ${LOSS}, at cwnd = ${timeout[LOSS - 1].cwnd}, halves the threshold to ${timeout[LOSS].ssthresh} and drops cwnd to 1. Slow start runs again but stops at the new threshold: ${timeout[13].cwnd}, not ${SSTHRESH}, in round 14, then grows by one a round.`,
      items: [...axis(), ...series(timeout, (i) => (i >= LOSS ? "accent" : "plain")), thresh(timeout), threshLabel(timeout[ROUNDS - 1].ssthresh), ...lossMark("timeout"), phase("p1", 1, 5, "slow start"), phase("p2", 6, LOSS, "avoidance"), phase("p3", LOSS + 1, 13, "slow start"), phase("p4", 14, ROUNDS, "avoidance")],
    },
    {
      caption: `Had three duplicate ACKs signalled the loss instead, Reno would halve the threshold the same way but continue from cwnd = ${dup[LOSS].cwnd} (fast recovery), skipping slow start: the sawtooth of AIMD.`,
      items: [...axis(), ...series(dup, (i) => (i >= LOSS ? "accent" : "plain")), thresh(dup), threshLabel(dup[ROUNDS - 1].ssthresh), ...lossMark("3 dup ACKs"), phase("p1", 1, 5, "slow start"), phase("p2", 6, LOSS, "avoidance"), phase("p4", LOSS + 1, ROUNDS, "avoidance")],
    },
  ];
  return finish({ title: "TCP's congestion window over 16 rounds", input: `ssthresh = ${SSTHRESH} MSS, cwnd starts at 1 MSS, a loss in round ${LOSS}`, frames });
}

/* ── The headers ──────────────────────────────────────────────────── */

function headers(): Walkthrough {
  type Field = [string, number];
  const UDP: Field[][] = [
    [["source port (16)", 16], ["destination port (16)", 16]],
    [["length (16)", 16], ["checksum (16)", 16]],
  ];
  const TCP: Field[][] = [
    [["source port (16)", 16], ["destination port (16)", 16]],
    [["sequence number (32)", 32]],
    [["acknowledgement number (32)", 32]],
    [["hlen", 4], ["rsvd + flags (12)", 12], ["window, rwnd (16)", 16]],
    [["checksum (16)", 16], ["urgent pointer (16)", 16]],
  ];
  for (const h of [UDP, TCP]) for (const row of h) if (row.reduce((s, [, b]) => s + b, 0) !== 32) throw new Error(`headers: a row must hold 32 bits (${row.map(([f]) => f).join(", ")})`);
  const bytes = (h: Field[][]) => (h.length * 32) / 8;
  const hlenBits = 4;
  const maxHeader = (2 ** hlenBits - 1) * 4;
  if (bytes(UDP) !== 8 || bytes(TCP) !== 20 || maxHeader !== 60) throw new Error("headers: the note says 8 bytes for UDP, 20 to 60 for TCP");

  const PX = 10; // per bit
  const RH = 26;
  const items: Item[] = [];
  for (const b of [0, 8, 16, 24, 31]) items.push(label(`bit${b}`, String(b), b * PX + (b === 31 ? PX / 2 : 0), -10, { tone: "faint", size: 10, mono: true }));
  const block = (prefix: string, h: Field[][], y0: number, title: string, tone: Tone) => {
    items.push(label(`${prefix}t`, title, -14, y0 - 12, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
    h.forEach((row, r) => {
      let bit = 0;
      row.forEach(([name, w], c) => {
        items.push(box(`${prefix}${r}-${c}`, bit * PX, y0 + r * RH, name, { w: w * PX, h: RH, size: 11, tone: r === 0 ? tone : "plain" }));
        bit += w;
      });
      items.push(label(`${prefix}o${r}`, String(r * 4), -6, y0 + r * RH + RH / 2, { anchor: "end", tone: "faint", size: 10, mono: true }));
    });
  };
  const UY = 30;
  block("u", UDP, UY, `UDP header: ${bytes(UDP)} bytes`, "accent");
  const TY = UY + UDP.length * RH + 46;
  block("t", TCP, TY, `TCP header: ${bytes(TCP)} bytes, up to ${maxHeader} with options`, "accent");
  const OY = TY + TCP.length * RH;
  items.push(box("topt", 0, OY, `options, 0 to ${maxHeader - bytes(TCP)} bytes`, { w: 32 * PX, h: RH, size: 11, tone: "ghost" }));
  return finish({
    title: "The UDP and TCP headers, 32 bits to a row",
    input: "",
    frames: [
      {
        caption: `Both start with the two 16-bit ports. UDP adds only a length and a checksum: ${bytes(UDP)} bytes. TCP adds the sequence and acknowledgement numbers, flags and window: ${bytes(TCP)} bytes, and its 4-bit length counts 32-bit words, so options can take it to ${maxHeader}.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  headers,
  handshake,
  teardown,
  retransmit,
  flow,
  cwnd,
};
