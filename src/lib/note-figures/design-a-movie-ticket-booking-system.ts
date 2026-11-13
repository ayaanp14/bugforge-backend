import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink, type ClassSpec, type Pt, type UmlKind } from "./kit.js";
import { packet, wire } from "./sd-kit.js";

/**
 * Design a Movie Ticket Booking System: the note's figures
 * (content/notes/low-level-design/design-a-movie-ticket-booking-system.md).
 * Every behaviour is a TypeScript model of the note's program — ShowSeat
 * with a version and a hold that lapses, BookingService.hold/pay — run on
 * the program's own scenario, its printed lines checked against the note's
 * output fence before anything is drawn:
 *
 *  - class-diagram: the nine classes added one a frame, with their relations;
 *  - booking-sequence: bob's successful booking (t=3..4) as calls between
 *    objects, one call a frame, the versions and amount read off the model;
 *  - seat-race: alice and bob both read A2 at version 0; the version check
 *    lets exactly one write land;
 *  - seat-states: seats A1, A2 and B1 moving between AVAILABLE, HELD and
 *    BOOKED through the scenario, including a hold that lapses.
 */

/* ── The model (the note's program, line for line) ───────────────── */

const HOLD = 5;
type Status = "AVAILABLE" | "HELD" | "BOOKED";

class ShowSeat {
  status: Status = "AVAILABLE";
  version = 0;
  by = 0;
  until = 0;
  constructor(readonly id: string) {}
  state(now: number): Status {
    return this.status === "HELD" && now >= this.until ? "AVAILABLE" : this.status;
  }
  write(status: Status, by = 0, until = 0) {
    this.status = status;
    this.by = by;
    this.until = until;
    this.version++;
  }
}

interface Booking {
  id: number;
  user: string;
  seats: string[];
  amount: number;
}

type HoldResult = { ok: true; booking: Booking } | { ok: false; seat: string; reason: "version" | "taken"; actual: number; expected: number };

class BookingService {
  seats = new Map<string, ShowSeat>();
  nextId = 1;
  out: string[] = [];
  constructor(ids: string[], readonly pricing: (s: string) => number) {
    for (const s of ids) this.seats.set(s, new ShowSeat(s));
  }
  seat(s: string) {
    return this.seats.get(s)!;
  }
  read(ids: string[]) {
    return ids.map((s) => this.seat(s).version);
  }
  hold(user: string, ids: string[], seen: number[], now: number): HoldResult {
    const head = `t=${now} ${user} holds ${ids.join(" ")}: `;
    for (let i = 0; i < ids.length; i++) {
      const seat = this.seat(ids[i]);
      if (seat.version !== seen[i]) {
        this.out.push(`${head}FAILED, ${ids[i]} is at version ${seat.version}, expected ${seen[i]}`);
        return { ok: false, seat: ids[i], reason: "version", actual: seat.version, expected: seen[i] };
      }
      if (seat.state(now) !== "AVAILABLE") {
        this.out.push(`${head}FAILED, ${ids[i]} is taken`);
        return { ok: false, seat: ids[i], reason: "taken", actual: seat.version, expected: seen[i] };
      }
    }
    const b: Booking = { id: this.nextId++, user, seats: ids, amount: ids.reduce((sum, s) => sum + this.pricing(s), 0) };
    for (const s of ids) this.seat(s).write("HELD", b.id, now + HOLD);
    this.out.push(`${head}OK, booking ${b.id} held until t=${now + HOLD}`);
    return { ok: true, booking: b };
  }
  pay(b: Booking, paid: boolean, now: number): boolean {
    const mine = b.seats.filter((s) => this.seat(s).by === b.id && this.seat(s).state(now) === "HELD");
    const head = `t=${now} ${b.user} pays ${b.amount}: `;
    if (paid && mine.length === b.seats.length) {
      for (const s of mine) this.seat(s).write("BOOKED", b.id);
      this.out.push(`${head}CONFIRMED booking ${b.id}`);
      return true;
    }
    for (const s of mine) this.seat(s).write("AVAILABLE");
    this.out.push(`${head}FAILED, released ${mine.join(" ")}`);
    return false;
  }
}

const rowPricing = (s: string) => (s.startsWith("A") ? 250 : 180);
const SEAT_IDS = ["A1", "A2", "B1"];

/** The note's output fence. */
const PROGRAM_OUTPUT = [
  "alice and bob both read A2 at version 0",
  "t=0 alice holds A1 A2: OK, booking 1 held until t=5",
  "t=0 bob holds A2 B1: FAILED, A2 is at version 1, expected 0",
  "t=2 alice pays 500: FAILED, released A1 A2",
  "t=3 bob holds A2 B1: OK, booking 2 held until t=8",
  "t=4 bob pays 430: CONFIRMED booking 2",
  "t=6 carol holds A1: OK, booking 3 held until t=11",
  "t=20 dave holds A1: OK, booking 4 held until t=25",
  "t=20 seats: A1=HELD A2=BOOKED B1=BOOKED",
];

/** A snapshot of every seat after one step of the scenario. */
interface Step {
  now: number;
  what: string;
  seats: Array<{ id: string; state: Status; version: number }>;
}

/** The program's main(), run on the model; returns the snapshots and checks the printed lines. */
function runScenario() {
  const svc = new BookingService(SEAT_IDS, rowPricing);
  const steps: Step[] = [];
  const snap = (now: number, what: string) => steps.push({ now, what, seats: SEAT_IDS.map((id) => ({ id, state: svc.seat(id).state(now), version: svc.seat(id).version })) });
  snap(0, "start");
  const seenA = svc.read(["A1", "A2"]);
  const seenB = svc.read(["A2", "B1"]);
  svc.out.push(`alice and bob both read A2 at version ${seenA[1]}`);
  const alice = svc.hold("alice", ["A1", "A2"], seenA, 0);
  snap(0, "alice holds A1 A2");
  const bobFirst = svc.hold("bob", ["A2", "B1"], seenB, 0);
  if (!alice.ok || bobFirst.ok) throw new Error("movie: exactly one of the racing holds must win");
  svc.pay(alice.booking, false, 2);
  snap(2, "alice's payment fails");
  const bobSeen = svc.read(["A2", "B1"]);
  const bob = svc.hold("bob", ["A2", "B1"], bobSeen, 3);
  snap(3, "bob holds A2 B1");
  if (!bob.ok) throw new Error("movie: bob's second hold should succeed");
  svc.pay(bob.booking, true, 4);
  snap(4, "bob pays");
  svc.hold("carol", ["A1"], svc.read(["A1"]), 6);
  snap(6, "carol holds A1");
  snap(11, "carol's hold lapses");
  svc.hold("dave", ["A1"], svc.read(["A1"]), 20);
  snap(20, "dave holds A1");
  svc.out.push(`t=20 seats: ${[...svc.seats.keys()].sort().map((s) => `${s}=${svc.seat(s).state(20)}`).join(" ")}`);
  if (svc.out.join("\n") !== PROGRAM_OUTPUT.join("\n")) throw new Error(`movie: the model printed ${JSON.stringify(svc.out)}`);
  return { steps, alice: alice.booking, bobFirst, bob: bob.booking, bobSeen };
}

/* ── Class diagram, built up ──────────────────────────────────────── */

const COL_W = 140;
const COL_GAP = 40;
const ROW_H = 74;
const ROW_GAP = 30;

interface Cls {
  key: string;
  spec: ClassSpec;
  col: number;
  row: number;
  why: string;
}

const CLASSES: Cls[] = [
  { key: "show", spec: { name: "Show", fields: ["- movie, start", "- screen"] }, col: 1, row: 1, why: "Start from the thing people actually buy into: a Show is one movie at one start time on one screen." },
  { key: "screen", spec: { name: "Screen", fields: ["- id", "- seats: List"] }, col: 2, row: 0, why: "A Show plays on a Screen. Many shows reuse the same screen across the day, so the show only points at it." },
  { key: "seat", spec: { name: "Seat", fields: ["- row, number", "- type"] }, col: 2, row: 1, why: "A Screen is made of physical Seats (row, number, type). They exist as long as the screen does, hence composition." },
  { key: "cinema", spec: { name: "Cinema", fields: ["- name", "- screens: List"] }, col: 1, row: 0, why: "A Cinema owns its screens. Deleting a cinema deletes its screens, so this is composition too." },
  { key: "city", spec: { name: "City", fields: ["- name", "- cinemas: List"] }, col: 0, row: 0, why: "A City groups cinemas for browsing. A cinema is not part of a city the way a seat is part of a screen: aggregation." },
  {
    key: "showseat",
    spec: { name: "ShowSeat", fields: ["- status", "- version, until"] },
    col: 1,
    row: 2,
    why: "The key class: ShowSeat is one seat for one show. A seat is free at 6 pm and sold at 9 pm, so status, version and the hold's expiry live here, not on Seat.",
  },
  { key: "booking", spec: { name: "Booking", fields: ["- showSeats", "- status, amount"] }, col: 0, row: 2, why: "A Booking ties a show to the ShowSeats it holds, with an amount from the pricing strategy and its own status." },
  { key: "user", spec: { name: "User", fields: ["- id", "- name"] }, col: 0, row: 1, why: "A User makes bookings. Keep the user thin: login, profile and history belong to other services." },
  { key: "payment", spec: { name: "Payment", fields: ["- amount", "- status"] }, col: 0, row: 3, why: "A Payment belongs to one booking. Its success confirms the seats; its failure releases them. That is the whole model." },
];

interface Rel {
  id: string;
  from: string;
  to: string;
  kind: UmlKind;
  /** Where on each box the line attaches: a side and a fraction along it. */
  a: [Side, number];
  b: [Side, number];
}
type Side = "top" | "bottom" | "left" | "right";

const RELS: Rel[] = [
  { id: "show-screen", from: "show", to: "screen", kind: "associates", a: ["top", 0.8], b: ["bottom", 0.2] },
  { id: "screen-seat", from: "screen", to: "seat", kind: "composes", a: ["bottom", 0.5], b: ["top", 0.5] },
  { id: "cinema-screen", from: "cinema", to: "screen", kind: "composes", a: ["right", 0.5], b: ["left", 0.5] },
  { id: "city-cinema", from: "city", to: "cinema", kind: "aggregates", a: ["right", 0.5], b: ["left", 0.5] },
  { id: "show-showseat", from: "show", to: "showseat", kind: "composes", a: ["bottom", 0.5], b: ["top", 0.5] },
  { id: "showseat-seat", from: "showseat", to: "seat", kind: "associates", a: ["right", 0.4], b: ["bottom", 0.3] },
  { id: "booking-show", from: "booking", to: "show", kind: "associates", a: ["right", 0.2], b: ["left", 0.8] },
  { id: "booking-showseat", from: "booking", to: "showseat", kind: "associates", a: ["right", 0.65], b: ["left", 0.65] },
  { id: "user-booking", from: "user", to: "booking", kind: "associates", a: ["bottom", 0.5], b: ["top", 0.5] },
  { id: "booking-payment", from: "booking", to: "payment", kind: "composes", a: ["bottom", 0.5], b: ["top", 0.5] },
];

function anchor(c: Cls, [side, f]: [Side, number]): Pt {
  const x = c.col * (COL_W + COL_GAP);
  const y = c.row * (ROW_H + ROW_GAP);
  if (side === "top") return { x: x + COL_W * f, y };
  if (side === "bottom") return { x: x + COL_W * f, y: y + ROW_H };
  if (side === "left") return { x, y: y + ROW_H * f };
  return { x: x + COL_W, y: y + ROW_H * f };
}

function classDiagram(): Walkthrough {
  const byKey = new Map(CLASSES.map((c) => [c.key, c]));
  const frames: Frame[] = [];
  CLASSES.forEach((added, k) => {
    const present = new Set(CLASSES.slice(0, k + 1).map((c) => c.key));
    const items: Item[] = [];
    for (const c of CLASSES.slice(0, k + 1)) {
      const b = classBox(`c-${c.key}`, c.spec, { x: c.col * (COL_W + COL_GAP), y: c.row * (ROW_H + ROW_GAP), w: COL_W, tone: c === added ? "accent" : "plain" });
      if (b.h !== ROW_H) throw new Error(`movie class-diagram: ${c.key} is ${b.h} tall, the grid assumes ${ROW_H}`);
      items.push(...b.items);
    }
    for (const r of RELS) {
      if (!present.has(r.from) || !present.has(r.to)) continue;
      const fresh = r.from === added.key || r.to === added.key;
      items.push(...umlLink(`r-${r.id}`, anchor(byKey.get(r.from)!, r.a), anchor(byKey.get(r.to)!, r.b), r.kind, { tone: fresh ? "accent" : "ink" }));
    }
    frames.push({ caption: added.why, items });
  });
  return finish({ title: "The booking model, one class at a time", input: "", frames });
}

/* ── Booking sequence ─────────────────────────────────────────────── */

function bookingSequence(): Walkthrough {
  const run = runScenario();
  const at3 = run.steps.find((s) => s.what === "alice's payment fails")!;
  const free = at3.seats.filter((s) => s.state === "AVAILABLE").map((s) => s.id);
  const held = run.steps.find((s) => s.what === "bob holds A2 B1")!;
  const booked = run.steps.find((s) => s.what === "bob pays")!;
  if (!run.bob.seats.every((id) => booked.seats.find((s) => s.id === id)!.state === "BOOKED")) throw new Error("movie: bob's seats should end BOOKED");
  const who = ["bob", "BookingService", "ShowSeats", "Payment"];
  type Msg = { from: number; to: number; text: string; reply?: boolean; caption: string };
  const msgs: Msg[] = [
    { from: 0, to: 1, text: "seatMap(show)", caption: "Bob opens the 18:00 show. The service reads the ShowSeats of that show, not the screen's Seats, because only ShowSeat knows whether a seat is free tonight." },
    { from: 1, to: 0, text: `free: ${free.join(" ")}`, reply: true, caption: `At t=3 alice's failed payment has released her seats, so ${free.join(", ")} are all free. Bob picks A2 and B1.` },
    { from: 0, to: 1, text: "hold(A2, B1)", caption: "Bob asks to hold both seats. The request carries the versions bob read, so a seat that changed since will refuse the write." },
    {
      from: 1,
      to: 2,
      text: `if version=${run.bobSeen.join(",")}`,
      caption: `The service writes both seats in one transaction, each only if its version is still the one bob read (${run.bobSeen.join(" and ")}). All match, so both become HELD.`,
    },
    { from: 2, to: 1, text: `held until t=${held.now + HOLD}`, reply: true, caption: `The hold lasts ${HOLD} minutes, until t=${held.now + HOLD}. Nobody else can hold A2 or B1 until bob pays, gives up or the time runs out.` },
    { from: 1, to: 3, text: `charge(${run.bob.amount})`, caption: `The pricing strategy priced row A at ${rowPricing("A2")} and row B at ${rowPricing("B1")}, so the booking asks the payment gateway for ${run.bob.amount}.` },
    { from: 3, to: 1, text: "success", reply: true, caption: "The gateway answers success at t=4, inside the hold window. Payment happens outside any database lock: it can take seconds." },
    { from: 1, to: 2, text: "mark BOOKED", caption: "Only now do the seats become BOOKED, and only the seats this booking holds. Had the card failed, the same call would set them back to AVAILABLE." },
    { from: 1, to: 0, text: `booking ${run.bob.id} confirmed`, reply: true, caption: `Bob gets booking ${run.bob.id}. An observer on the booking would now send the ticket by mail and SMS without the service knowing how.` },
  ];
  if (held.now !== 3 || booked.now !== 4) throw new Error("movie: sequence times do not match the scenario");
  const GAP = 136;
  const TOP = 46;
  const STEP = 30;
  const ll = lifelines("ll", who, { gap: GAP, w: 112, length: TOP + (msgs.length - 1) * STEP + 4, size: 11.5 });
  const frames: Frame[] = msgs.map((m, k) => {
    const items: Item[] = [...ll.items];
    msgs.slice(0, k + 1).forEach((p, i) => {
      const y = ll.top + TOP - 12 + i * STEP;
      const now = i === k;
      const tone = now ? "accent" : "line";
      items.push(...message(`m${i}`, ll.xOf(p.from), ll.xOf(p.to), y, "", { tone, dashed: p.reply }));
      const right = p.to > p.from;
      items.push(label(`mt${i}`, p.text, ll.xOf(p.from) + (right ? 8 : -8), y - 8, { anchor: right ? "start" : "end", size: 11, mono: true, tone: now ? "accent" : "soft" }));
    });
    return { caption: m.caption, items };
  });
  return finish({ title: "Booking two seats: hold, pay, confirm", input: "", frames });
}

/* ── The race for one seat ────────────────────────────────────────── */

function seatRace(): Walkthrough {
  // The opening of main(): both read A2, then alice writes, then bob does.
  const svc = new BookingService(SEAT_IDS, rowPricing);
  const seenA = svc.read(["A2"]);
  const seenB = svc.read(["A2"]);
  const before = { version: svc.seat("A2").version, state: svc.seat("A2").state(0) };
  const a = svc.hold("alice", ["A2"], seenA, 0);
  const mid = { version: svc.seat("A2").version, state: svc.seat("A2").state(0) };
  const b = svc.hold("bob", ["A2"], seenB, 0);
  if (!a.ok || b.ok || b.reason !== "version") throw new Error("movie seat-race: alice must win and bob fail the version check");
  const winners = [a, b].filter((r) => r.ok).length;
  if (winners !== 1) throw new Error("movie seat-race: exactly one hold must succeed");

  const AX = 0;
  const BX = 380;
  const UW = 96;
  const SX = 170;
  const SW = 156;
  const SY = 110;
  const user = (id: string, x: number, name: string, tone: Tone, sub: string, subTone: "soft" | "accent" | "error" = "soft") => [
    box(id, x, 0, name, { w: UW, h: 36, tone }),
    label(`${id}-sub`, sub, x + UW / 2, 52, { size: 11, mono: true, tone: subTone }),
  ];
  const seat = (state: string, version: number, tone: Tone, holder = "") => [
    box("seat", SX, SY, "", { w: SW, h: 64, tone }),
    label("seat-n", "ShowSeat A2", SX + SW / 2, SY + 15, { size: 12, weight: 700 }),
    label("seat-s", state, SX + SW / 2, SY + 34, { size: 11.5, mono: true, tone: tone === "accent" || tone === "strong" ? "accent" : "ink" }),
    label("seat-v", `version ${version}${holder}`, SX + SW / 2, SY + 51, { size: 11, mono: true, tone: "soft" }),
  ];
  const aEnd: Pt = { x: AX + UW / 2, y: 64 };
  const bEnd: Pt = { x: BX + UW / 2, y: 64 };
  const sA: Pt = { x: SX + 30, y: SY - 2 };
  const sB: Pt = { x: SX + SW - 30, y: SY - 2 };
  const frames: Frame[] = [
    {
      caption: `Alice and bob both want A2 for the same show. The ShowSeat row says ${before.state}, version ${before.version}. Without a guard, both could see it free and both could book it.`,
      items: [...user("ua", AX, "alice", "plain", "wants A2"), ...user("ub", BX, "bob", "plain", "wants A2"), ...seat(before.state, before.version, "plain")],
    },
    {
      caption: `Both read the seat before either writes: each now holds "A2 is free at version ${seenA[0]}". This is the race: the reads cannot tell who will win.`,
      items: [
        ...user("ua", AX, "alice", "plain", `read v=${seenA[0]}`, "accent"),
        ...user("ub", BX, "bob", "plain", `read v=${seenB[0]}`, "accent"),
        ...seat(before.state, before.version, "plain"),
        wire("wa", sA, aEnd, { tone: "accent", dashed: true }),
        wire("wb", sB, bEnd, { tone: "accent", dashed: true }),
      ],
    },
    {
      caption: `Alice's write goes first: set HELD where version = ${seenA[0]}. The row still has version ${before.version}, so one row changes and the version becomes ${mid.version}.`,
      items: [
        ...user("ua", AX, "alice", "accent", "1 row updated", "accent"),
        ...user("ub", BX, "bob", "plain", `read v=${seenB[0]}`),
        ...seat(mid.state, mid.version, "accent", " · alice"),
        wire("wa", aEnd, sA, { tone: "accent", label: `v=${seenA[0]}?` }),
      ],
    },
    {
      caption: `Bob's write says the same thing, where version = ${seenB[0]}, but the row is now at version ${mid.version}. Zero rows change: the database itself refused the second booking.`,
      items: [
        ...user("ua", AX, "alice", "strong", "holds A2"),
        ...user("ub", BX, "bob", "error", "0 rows updated", "error"),
        ...seat(mid.state, mid.version, "accent", " · alice"),
        wire("wb", bEnd, sB, { tone: "error", label: `v=${seenB[0]}?` }),
      ],
    },
    {
      caption: `Exactly ${winners} of the two holds landed. Bob is told A2 was just taken and picks another seat; alice has ${HOLD} minutes to pay before her hold lapses.`,
      items: [
        ...user("ua", AX, "alice", "strong", `pay by t=${HOLD}`),
        ...user("ub", BX, "bob", "muted", "pick another seat"),
        ...seat(mid.state, mid.version, "accent", " · alice"),
      ],
    },
  ];
  return finish({ title: "Two buyers, one seat: the version check lets one win", input: "", frames });
}

/* ── Seat states ──────────────────────────────────────────────────── */

function seatStates(): Walkthrough {
  const { steps } = runScenario();
  const STATES: Status[] = ["AVAILABLE", "HELD", "BOOKED"];
  const W = 130;
  const H = 76;
  const pos: Record<Status, Pt> = { AVAILABLE: { x: 0, y: 150 }, HELD: { x: 175, y: 0 }, BOOKED: { x: 350, y: 150 } };
  const captions: Record<string, (s: Step) => string> = {
    start: () => "Every ShowSeat starts AVAILABLE. The status is a small state machine: each state decides what hold, pay and time are allowed to do to it.",
    "alice holds A1 A2": (s) => `t=${s.now}: alice holds A1 and A2. AVAILABLE allows a hold, so both move to HELD, each with an expiry ${HOLD} minutes away.`,
    "alice's payment fails": (s) => `t=${s.now}: alice's card is declined. HELD allows a release, so both seats go straight back to AVAILABLE; nobody waits for the timer.`,
    "bob holds A2 B1": (s) => `t=${s.now}: bob holds A2 and B1. A2 is held for the second time tonight; B1 for the first.`,
    "bob pays": (s) => `t=${s.now}: bob's payment succeeds while his seats are still HELD, so A2 and B1 become BOOKED. BOOKED refuses every further hold.`,
    "carol holds A1": (s) => `t=${s.now}: carol holds A1 and then never pays. The hold runs until t=${s.now + HOLD}.`,
    "carol's hold lapses": (s) => `t=${s.now}: carol's hold has lapsed. Nobody had to run a job: a HELD seat past its expiry simply reads as AVAILABLE.`,
    "dave holds A1": (s) => `t=${s.now}: dave holds A1 and gets it. Final state: A1 HELD for dave, A2 and B1 BOOKED for bob.`,
  };
  const prev = new Map<string, Status>();
  const frames: Frame[] = steps.map((s) => {
    const moved = new Set(s.seats.filter((x) => prev.has(x.id) && prev.get(x.id) !== x.state).map((x) => x.id));
    const items: Item[] = [];
    // Each transition runs rim to rim, its own pair of points, so hold and release never share a line.
    const at = (st: Status, fx: number, fy: number): Pt => ({ x: pos[st].x + W * fx, y: pos[st].y + H * fy });
    const tr = (id: string, a: Status, b: Status, from: Pt, to: Pt, text: string, lx: number, ly: number, anchor: "start" | "end") => {
      const lit = s.seats.some((x) => moved.has(x.id) && prev.get(x.id) === a && x.state === b);
      items.push({ k: "edge", id, x1: from.x, y1: from.y, x2: to.x, y2: to.y, tone: lit ? "accent" : "line", arrow: true });
      items.push(label(`${id}-t`, text, lx, ly, { size: 11, tone: lit ? "accent" : "soft", weight: 600, anchor }));
    };
    tr("t-hold", "AVAILABLE", "HELD", at("AVAILABLE", 0.6, 0), at("HELD", 0, 0.7), "hold", 116, 96, "end");
    tr("t-release", "HELD", "AVAILABLE", at("HELD", 0.3, 1), at("AVAILABLE", 1, 0.35), "fail / lapse", 186, 134, "start");
    tr("t-pay", "HELD", "BOOKED", at("HELD", 1, 0.7), at("BOOKED", 0.4, 0), "pay ok", 366, 96, "start");
    for (const st of STATES) {
      const here = s.seats.filter((x) => x.state === st);
      const tone: Tone = here.some((x) => moved.has(x.id)) ? "accent" : "plain";
      items.push(box(`s-${st}`, pos[st].x, pos[st].y, "", { w: W, h: H, tone }));
      items.push(label(`s-${st}-n`, st, pos[st].x + W / 2, pos[st].y + 16, { size: 12, weight: 700, mono: true }));
    }
    for (const st of STATES) {
      const here = s.seats.filter((x) => x.state === st);
      here.forEach((x, i) => {
        const p = { x: pos[st].x + W / 2 + (i - (here.length - 1) / 2) * 32, y: pos[st].y + 48 };
        items.push(packet(`p-${x.id}`, p, { text: x.id, r: 13, tone: moved.has(x.id) ? "accent" : st === "BOOKED" ? "strong" : "plain" }));
      });
    }
    items.push(label("clock", `t = ${s.now}`, 175 + W / 2, 210, { size: 13, mono: true, weight: 700, tone: "ink" }));
    for (const x of s.seats) prev.set(x.id, x.state);
    return { caption: captions[s.what](s), items };
  });
  return finish({ title: "A seat's status is a state machine: AVAILABLE, HELD, BOOKED", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "class-diagram": classDiagram,
  "booking-sequence": bookingSequence,
  "seat-race": seatRace,
  "seat-states": seatStates,
};
