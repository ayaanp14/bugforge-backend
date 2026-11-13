import { finish, type Frame, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * The ticket booking lesson's figure (scripts/study-plans/lld/06-ticket-booking):
 *
 *  - hold-race: the first exercise's visible case, one command a frame. The
 *    model is that exercise's Show (all-or-none holds, a stored expiry that
 *    is read rather than fired, payments that book or release), and the lines
 *    it prints are checked against the case's expected output.
 */

type Status = "AVAILABLE" | "HELD" | "BOOKED";
interface ShowSeat {
  id: string;
  status: Status;
  holder: string | null;
  heldUntil: number;
}

class Show {
  now = 0;
  readonly seats: ShowSeat[];
  constructor(
    cols: number,
    readonly hold: number,
  ) {
    this.seats = Array.from({ length: cols }, (_, i) => ({ id: `A${i + 1}`, status: "AVAILABLE" as Status, holder: null, heldUntil: 0 }));
  }
  availableAt(s: ShowSeat): boolean {
    return s.status === "AVAILABLE" || (s.status === "HELD" && this.now >= s.heldUntil);
  }
  holdSeats(user: string, ids: string[]): string {
    for (const id of ids) {
      const s = this.seats.find((x) => x.id === id);
      if (!s) return `${user} cannot hold ${id}: no such seat`;
      if (!this.availableAt(s)) return `${user} cannot hold ${id}: ${s.status === "BOOKED" ? "booked" : "held"}`;
    }
    for (const id of ids) Object.assign(this.seats.find((x) => x.id === id)!, { status: "HELD", holder: user, heldUntil: this.now + this.hold });
    return `${user} holds ${ids.join(" ")} until t=${this.now + this.hold}`;
  }
  pay(user: string, ok: boolean): string {
    const mine = this.seats.filter((s) => s.status === "HELD" && this.now < s.heldUntil && s.holder === user);
    for (const s of mine) Object.assign(s, ok ? { status: "BOOKED" } : { status: "AVAILABLE", holder: null });
    if (!mine.length) return `${user} has no active hold`;
    const ids = mine.map((s) => s.id).join(" ");
    return ok ? `${user} booked ${ids}` : `${user} payment failed, released ${ids}`;
  }
  map(): string {
    return `t=${this.now}\nA: ${this.seats.map((s) => (s.status === "BOOKED" ? "X" : this.availableAt(s) ? "." : "H")).join(" ")}`;
  }
}

const SCRIPT = ["HOLD alice A1 A2", "HOLD bob A2 A3", "TICK 2", "PAY alice fail", "HOLD bob A2 A3", "TICK 1", "PAY bob ok", "HOLD carol A1", "TICK 5", "SHOW", "HOLD dave A1", "SHOW"];
const EXPECTED = [
  "alice holds A1 A2 until t=5",
  "bob cannot hold A2: held",
  "alice payment failed, released A1 A2",
  "bob holds A2 A3 until t=7",
  "bob booked A2 A3",
  "carol holds A1 until t=8",
  "t=8\nA: . X X .",
  "dave holds A1 until t=13",
  "t=8\nA: H X X .",
];

interface Moment {
  cmd: string | null;
  said: string | null;
  now: number;
  seats: Array<ShowSeat & { lapsed: boolean }>;
}

function run(): Moment[] {
  const show = new Show(4, 5);
  const printed: string[] = [];
  const snap = (cmd: string | null, said: string | null): Moment => ({
    cmd,
    said,
    now: show.now,
    seats: show.seats.map((s) => ({ ...s, lapsed: s.status === "HELD" && show.now >= s.heldUntil })),
  });
  const moments: Moment[] = [snap(null, null)];
  for (const cmd of SCRIPT) {
    const p = cmd.split(" ");
    let said: string | null = null;
    if (p[0] === "HOLD") said = show.holdSeats(p[1]!, p.slice(2));
    else if (p[0] === "PAY") said = show.pay(p[1]!, p[2] === "ok");
    else if (p[0] === "TICK") show.now += Number(p[1]);
    else said = show.map();
    if (said !== null) printed.push(said);
    // SHOW prints what the frames already draw; it gets no frame of its own.
    if (p[0] !== "SHOW") moments.push(snap(cmd, said));
  }
  if (printed.join("\n") !== EXPECTED.join("\n")) throw new Error(`ticket-booking-design hold-race: the model printed ${JSON.stringify(printed)}`);
  return moments;
}

const SW = 70;
const SH = 46;
const GAP = 22;
const Y = 70;

function holdRace(): Walkthrough {
  const moments = run();
  const captions = [
    "Four seats for one show, all available; a hold lasts 5 minutes. The clock is the script's own: it moves only on TICK.",
    "alice holds A1 and A2 together. Both are free, so both become HELD by her until t=5.",
    "bob wants A2 and A3. A2 is alice's, so the hold is refused whole: bob gets nothing, not even the free A3.",
    "Two minutes pass. Nothing is fired; the holds just have less time left.",
    "alice's card is declined. Her seats are released at once, not at t=5, so nobody is kept waiting for a payment that has already failed.",
    "bob tries again and gets A2 and A3 together, until t=7.",
    "Another minute: it is t=3, and bob's hold is still good.",
    "bob's payment succeeds while his hold is valid, so A2 and A3 become BOOKED for this show.",
    "carol holds A1 until t=8. She never pays.",
    "The clock reaches t=8. carol's hold is still stored on the seat, but it is read as lapsed: A1 shows as available without any timer.",
    "dave asks for A1 and gets it: a lapsed hold is free to take, until t=13.",
  ];
  if (captions.length !== moments.length) throw new Error(`ticket-booking-design hold-race: ${moments.length} moments, ${captions.length} captions`);
  const frames: Frame[] = moments.map((m, i) => {
    const items: Item[] = [];
    items.push(label("clock", `t=${m.now}`, 0, 10, { anchor: "start", tone: "ink", size: 15, mono: true, weight: 700 }));
    items.push(label("cmd", m.cmd ? `> ${m.cmd}` : "show: 4 seats, holds last 5 min", 70, 10, { anchor: "start", tone: m.cmd ? "accent" : "soft", size: 12, mono: true }));
    items.push(label("screen", "SCREEN", (4 * SW + 3 * GAP) / 2, Y - 22, { tone: "faint", size: 10 }));
    m.seats.forEach((s, j) => {
      const x = j * (SW + GAP);
      const held = s.status === "HELD" && !s.lapsed;
      const tone = s.status === "BOOKED" ? "strong" : held ? "accent" : "plain";
      items.push(box(`seat${j}`, x, Y, s.id, { w: SW, h: SH, tone, size: 13 }));
      const state = s.status === "BOOKED" ? "booked" : held ? "held" : s.lapsed ? "lapsed" : "free";
      items.push(label(`st${j}`, state, x + SW / 2, Y + SH + 14, { tone: held || s.status === "BOOKED" ? "ink" : "faint", size: 11, weight: held ? 600 : 400 }));
      const who = s.status === "BOOKED" ? s.holder ?? "" : held ? `${s.holder} < ${s.heldUntil}` : s.lapsed ? `was ${s.holder}` : "";
      items.push(label(`who${j}`, who || " ", x + SW / 2, Y + SH + 30, { tone: "soft", size: 10.5, mono: true }));
    });
    items.push(label("said-h", "prints", 0, Y + SH + 62, { anchor: "start", tone: "soft", size: 11 }));
    items.push(label("said", m.said ?? (m.cmd ? "(nothing: TICK only moves the clock)" : "nothing yet"), 0, Y + SH + 80, { anchor: "start", tone: m.said ? (/cannot|failed|no active/.test(m.said) ? "error" : "ink") : "faint", size: 12, mono: true, weight: 600 }));
    return { caption: captions[i]!, items };
  });
  return finish({ title: "Holds that expire: four seats, four buyers, one clock", input: "1 4 5 · HOLD alice A1 A2 · HOLD bob A2 A3 · TICK 2 · PAY alice fail …", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "hold-race": holdRace,
};
