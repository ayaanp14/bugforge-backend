import { finish, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, lifelines, message, umlLink, type ClassSpec } from "./kit.js";
import { packet } from "./sd-kit.js";

/**
 * Design a Vending Machine: the note's figures (content/notes/
 * low-level-design/design-a-vending-machine.md). A points subject, so every
 * figure loops. The behaviour is a TypeScript model of the note's program —
 * the State pattern over Idle / HasMoney / Dispensing / OutOfStock, Chips at
 * 15 and Juice at 22 with one of each, greedy change from 10/5/2/1 — and its
 * printed lines are checked against the note's output fence:
 *
 *  - class-diagram: the machine, its items, the State interface and the four
 *    states, one step a frame;
 *  - state-machine: the scenario's events one a frame, the current state lit
 *    and the transition taken drawn;
 *  - change-making: greedy change for 8, then the coin set where greedy
 *    loses to the optimum (computed by a small DP);
 *  - select-sequence: select("A2") with 30 paid, as a sequence diagram.
 */

/* ── The model (the note's program) ───────────────────────────────── */

type StateName = "Idle" | "HasMoney" | "Dispensing" | "OutOfStock";
const COINS = [10, 5, 2, 1];

type Event = { insert: number } | { select: string };
const SCRIPT: Event[] = [{ insert: 10 }, { select: "A1" }, { insert: 10 }, { select: "A1" }, { insert: 10 }, { insert: 10 }, { insert: 10 }, { select: "A2" }, { insert: 10 }];

const OUTPUT = [
  "insert 10: Idle -> HasMoney, balance 10",
  "select A1: Chips costs 15, insert 5 more",
  "insert 10: balance 20",
  "select A1: HasMoney -> Dispensing",
  "dispense: Dispensing -> Idle, Chips, change 5",
  "insert 10: Idle -> HasMoney, balance 10",
  "insert 10: balance 20",
  "insert 10: balance 30",
  "select A2: HasMoney -> Dispensing",
  "dispense: Dispensing -> OutOfStock, Juice, change 5+2+1",
  "insert 10: sold out, returned 10",
];

/** Greedy change: the largest coin that fits, again and again. */
function greedy(amount: number, coins: readonly number[]): number[] {
  const out: number[] = [];
  for (const c of coins) while (amount >= c) {
    out.push(c);
    amount -= c;
  }
  return out;
}

interface Line {
  text: string;
  from: StateName;
  to: StateName;
  balance: number;
  stock: Record<string, number>;
  change?: number[];
}

function runMachine(): Line[] {
  const items: Record<string, { name: string; price: number; stock: number }> = { A1: { name: "Chips", price: 15, stock: 1 }, A2: { name: "Juice", price: 22, stock: 1 } };
  let state = "Idle" as StateName;
  let balance = 0;
  const lines: Line[] = [];
  const say = (text: string, to: StateName, change?: number[]) => {
    lines.push({ text, from: state, to, balance, stock: Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.stock])), change });
    state = to;
  };
  const move = (to: StateName, event: string, note: string | null, change?: number[]) => say(`${event}: ${state} -> ${to}${note === null ? "" : `, ${note}`}`, to, change);
  for (const e of SCRIPT) {
    if ("insert" in e) {
      if (state === "Idle") {
        balance += e.insert;
        move("HasMoney", `insert ${e.insert}`, `balance ${balance}`);
      } else if (state === "HasMoney") {
        balance += e.insert;
        say(`insert ${e.insert}: balance ${balance}`, state);
      } else if (state === "OutOfStock") say(`insert ${e.insert}: sold out, returned ${e.insert}`, state);
      else say(`insert ${e.insert}: busy, returned ${e.insert}`, state);
    } else {
      const item = items[e.select];
      if (state !== "HasMoney") say(`select ${e.select}: ignored in ${state}`, state);
      else if (item.stock === 0) say(`select ${e.select}: ${item.name} sold out`, state);
      else if (balance < item.price) say(`select ${e.select}: ${item.name} costs ${item.price}, insert ${item.price - balance} more`, state);
      else {
        move("Dispensing", `select ${e.select}`, null);
        item.stock -= 1;
        const change = greedy(balance - item.price, COINS);
        balance = 0;
        const empty = Object.values(items).every((i) => i.stock === 0);
        move(empty ? "OutOfStock" : "Idle", "dispense", `${item.name}, change ${change.length ? change.join("+") : "none"}`, change);
      }
    }
  }
  const printed = lines.map((l) => l.text);
  if (printed.join("\n") !== OUTPUT.join("\n")) throw new Error(`design-a-vending-machine: the model printed ${JSON.stringify(printed)}`);
  return lines;
}

/* ── Class diagram, built up ──────────────────────────────────────── */

function classDiagram(): Walkthrough {
  const specs: Record<string, ClassSpec> = {
    machine: { name: "VendingMachine", fields: ["- state: State", "- balance: int", "- items: Map"], methods: ["+ move(next: State)", "+ change(amt): coins"] },
    item: { name: "Item", fields: ["- name: String", "- price: int", "- stock: int"] },
    state: { name: "State", stereotype: "interface", methods: ["+ insert(m, coin)", "+ select(m, code)", "+ dispense(m)"] },
    idle: { name: "Idle" },
    hasMoney: { name: "HasMoney" },
    dispensing: { name: "Dispensing" },
    out: { name: "OutOfStock" },
  };
  const at: Record<string, [number, number]> = {
    machine: [0, 0],
    item: [0, 156],
    state: [236, 30],
    idle: [0, 300],
    hasMoney: [116, 300],
    dispensing: [232, 300],
    out: [348, 300],
  };
  const steps: Array<{ adds: string[]; caption: string }> = [
    { adds: ["machine"], caption: "One VendingMachine holds the money inserted so far and the current state. Customers only ever call the machine: insert a coin, select a code." },
    { adds: ["item"], caption: "The machine owns its items, each with a name, a price and a stock count, keyed by a slot code such as A1." },
    { adds: ["state"], caption: "Every event is passed on to the current State object. What a coin or a button does depends on the state, so the answer lives in the state, not in an if-chain." },
    { adds: ["idle", "hasMoney"], caption: "Idle takes the first coin and moves to HasMoney. HasMoney adds coins, refuses a selection it cannot pay for and moves to Dispensing when it can." },
    { adds: ["dispensing", "out"], caption: "Dispensing drops the item and the change, then moves to Idle, or to OutOfStock when nothing is left; OutOfStock returns every coin. A new state is a new class." },
  ];
  const frames: Frame[] = [];
  const shown = new Set<string>();
  for (const step of steps) {
    step.adds.forEach((k) => shown.add(k));
    const fresh = new Set(step.adds);
    const b: Record<string, ReturnType<typeof classBox>> = {};
    for (const k of Object.keys(specs)) {
      if (!shown.has(k)) continue;
      b[k] = classBox(k, specs[k], { x: at[k][0], y: at[k][1], w: specs[k].fields || specs[k].methods ? undefined : 104, tone: fresh.has(k) ? "accent" : "plain" });
    }
    const tone = (k: string) => (fresh.has(k) ? "accent" : "ink");
    const items: Item[] = [];
    if (b.item) items.push(...umlLink("r-item", b.machine.bottom, b.item.top, "composes", { label: "1..*", tone: tone("item") }));
    if (b.state) items.push(...umlLink("r-state", { x: b.machine.x + b.machine.w, y: b.machine.y + 50 }, b.state.left, "associates", { label: "current", tone: tone("state") }));
    ["idle", "hasMoney", "dispensing", "out"].forEach((k, i) => {
      if (b[k]) items.push(...umlLink(`r-${k}`, b[k].top, { x: b.state.x + 22 + i * ((b.state.w - 44) / 3), y: b.state.bottom.y }, "implements", { tone: tone(k) }));
    });
    for (const k of Object.keys(b)) items.push(...b[k].items);
    frames.push({ caption: step.caption, items });
  }
  return finish({ title: "The vending machine's classes: the State pattern, step by step", input: "", frames });
}

/* ── The state machine, running the scenario ──────────────────────── */

const POS: Record<StateName, { x: number; y: number }> = {
  Idle: { x: 0, y: 40 },
  HasMoney: { x: 250, y: 40 },
  Dispensing: { x: 250, y: 190 },
  OutOfStock: { x: 0, y: 190 },
};
const SW = 116;
const SH = 40;

function stateMachine(): Walkthrough {
  const lines = runMachine();
  const mid = (s: StateName) => ({ x: POS[s].x + SW / 2, y: POS[s].y + SH / 2 });
  type Arc = { id: string; from: StateName; to: StateName; text: string; a: { x: number; y: number }; b: { x: number; y: number }; bow?: number };
  const arcs: Arc[] = [
    { id: "t-ih", from: "Idle", to: "HasMoney", text: "insert coin", a: { x: SW, y: 40 + SH / 2 }, b: { x: 250, y: 40 + SH / 2 } },
    { id: "t-hd", from: "HasMoney", to: "Dispensing", text: "select (paid)", a: { x: 250 + SW / 2 + 22, y: 40 + SH }, b: { x: 250 + SW / 2 + 22, y: 190 } },
    { id: "t-di", from: "Dispensing", to: "Idle", text: "stock left", a: { x: 250, y: 190 + 4 }, b: { x: SW - 8, y: 40 + SH } },
    { id: "t-do", from: "Dispensing", to: "OutOfStock", text: "all sold", a: { x: 250, y: 190 + SH / 2 + 8 }, b: { x: SW, y: 190 + SH / 2 + 8 } },
  ];
  const draw = (o: { cur: StateName; arc?: string; self?: boolean; event: string; balance: number; stock: Record<string, number>; note: string }): Item[] => {
    const items: Item[] = [];
    for (const a of arcs) {
      const hot = a.id === o.arc;
      items.push({ k: "edge", id: a.id, x1: a.a.x, y1: a.a.y, x2: a.b.x, y2: a.b.y, tone: hot ? "accent" : "line", arrow: true, bow: a.bow });
      const mx = (a.a.x + a.b.x) / 2;
      const my = (a.a.y + a.b.y) / 2;
      const off = a.id === "t-hd" ? { dx: 8, dy: 0, anchor: "start" as const } : a.id === "t-di" ? { dx: 10, dy: -12, anchor: "start" as const } : a.id === "t-do" ? { dx: 0, dy: 12, anchor: "middle" as const } : { dx: 0, dy: -10, anchor: "middle" as const };
      items.push(label(`${a.id}-t`, a.text, mx + off.dx, my + off.dy, { anchor: off.anchor, tone: hot ? "accent" : "soft", size: 10.5 }));
    }
    (Object.keys(POS) as StateName[]).forEach((s) => {
      const cur = s === o.cur;
      items.push(box(`st-${s}`, POS[s].x, POS[s].y, s, { w: SW, h: SH, tone: cur ? (o.self ? "accent" : "strong") : "plain", size: 12 }));
    });
    // The machine's "you are here" token rides on the current state.
    items.push(packet("here", { x: mid(o.cur).x, y: POS[o.cur].y - 12 }, { r: 7, tone: "accent" }));
    items.push(label("ev", o.event, 0, 0, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 700 }));
    items.push(label("bal", `balance ${o.balance}`, 0, 270, { anchor: "start", tone: "ink", size: 11.5, mono: true }));
    items.push(label("stk", `Chips ×${o.stock.A1}  Juice ×${o.stock.A2}`, 130, 270, { anchor: "start", tone: "soft", size: 11.5, mono: true }));
    items.push(label("note", o.note, 0, 292, { anchor: "start", tone: "accent", size: 11.5, mono: true }));
    return items;
  };
  const frames: Frame[] = [
    { caption: "The machine starts in Idle with no money, one bag of chips at 15 and one juice at 22. Every customer action is an event handed to the current state.", items: draw({ cur: "Idle", event: "waiting", balance: 0, stock: { A1: 1, A2: 1 }, note: "" }) },
  ];
  let idleInserts = 0;
  let moneyInserts = 0;
  lines.forEach((l) => {
    const arc = arcs.find((a) => a.from === l.from && a.to === l.to);
    const { balance, stock } = l;
    const event = l.text.split(":")[0];
    const note = l.text.slice(l.text.indexOf(":") + 2);
    let caption: string;
    if (l.text.startsWith("dispense")) caption = l.to === "Idle" ? `Dispensing drops the chips and returns ${l.change!.join("+")} in change; juice is still in stock, so the machine goes back to Idle.` : `Dispensing drops the juice and returns ${l.change!.join(" + ")} = ${l.change!.reduce((a, c) => a + c, 0)} in coins. Nothing is left in stock, so the machine moves to OutOfStock.`;
    else if (arc && l.from === "HasMoney") caption = `${event}: the balance of ${balance} covers the price, so HasMoney hands over to Dispensing, which acts at once.`;
    else if (arc) caption = idleInserts++ === 0 ? `${event}: Idle accepts the coin and moves to HasMoney. The balance is now ${balance}.` : `${event} on an Idle machine again: Idle takes the coin and moves to HasMoney, balance ${balance}.`;
    else if (l.text.includes("more")) caption = `${event}: chips cost 15 but only ${balance} is in, so HasMoney stays put and asks for 5 more — no item, no state change.`;
    else if (l.text.includes("sold out")) caption = `${event} in OutOfStock: the state returns the coin at once, which is the whole point of having a state for it.`;
    else caption = moneyInserts++ === 0 ? `${event} in HasMoney: the coin is added and the state stays the same; the balance is ${balance}.` : `Another coin in HasMoney: no transition, the balance just grows to ${balance}.`;
    frames.push({ caption, items: draw({ cur: l.to, arc: arc?.id, self: !arc, event, balance, stock, note }) });
  });
  return finish({ title: "The vending machine's states, one event at a time", input: "", frames });
}

/* ── Change-making ────────────────────────────────────────────────── */

/** The fewest coins for `amount` (a small DP), to set against greedy. */
function fewest(amount: number, coins: readonly number[]): number[] {
  const best: Array<number[] | null> = [[]];
  for (let a = 1; a <= amount; a++) {
    best[a] = null;
    for (const c of coins) {
      const prev = a - c >= 0 ? best[a - c] : null;
      if (prev && (best[a] === null || prev.length + 1 < best[a]!.length)) best[a] = [...prev, c].sort((x, y) => y - x);
    }
  }
  return best[amount]!;
}

function changeMaking(): Walkthrough {
  const lines = runMachine();
  const sale = lines.find((l) => l.to === "OutOfStock")!;
  const amount = sale.change!.reduce((a, c) => a + c, 0);
  // The greedy run, coin by coin.
  type Step = { coin: number; take: boolean; left: number };
  const steps: Step[] = [];
  let left = amount;
  for (const c of COINS) {
    if (left < c) steps.push({ coin: c, take: false, left });
    while (left >= c) {
      left -= c;
      steps.push({ coin: c, take: true, left });
    }
    if (left === 0) break;
  }
  const taken = steps.filter((s) => s.take).map((s) => s.coin);
  if (taken.join("+") !== sale.change!.join("+")) throw new Error("change-making: greedy disagrees with the machine");
  if (fewest(amount, COINS).length !== taken.length) throw new Error("change-making: greedy should be optimal for 10/5/2/1");

  const odd = [4, 3, 1];
  const oddAmount = 6;
  const oddGreedy = greedy(oddAmount, odd);
  const oddBest = fewest(oddAmount, odd);
  if (oddGreedy.length <= oddBest.length) throw new Error("change-making: the counterexample should beat greedy");

  const coinRow = (prefix: string, coins: readonly number[], y: number, tone: (c: number, i: number) => "plain" | "accent" | "strong" | "muted") =>
    coins.map((c, i): Item => ({ k: "node", id: `${prefix}${i}`, x: 20 + i * 56, y, r: 19, text: String(c), tone: tone(c, i), size: 13 }));
  const tray = (prefix: string, coins: readonly number[], y: number, tone: "strong" | "accent" | "error" = "strong") =>
    coins.map((c, i): Item => ({ k: "node", id: `${prefix}${i}`, x: 260 + i * 44, y, r: 16, text: String(c), tone: tone === "error" ? "error" : tone, size: 12 }));
  const frames: Frame[] = [];
  const head = (t: string) => label("head", t, 0, 0, { anchor: "start", tone: "ink", size: 12, mono: true, weight: 700 });
  frames.push({
    caption: `The juice costs 22 and 30 is in, so the machine owes ${amount}. Greedy change tries the coins from the largest down and takes each while it still fits.`,
    items: [head(`change owed: ${amount}`), label("coins-l", "coins", 0, 34, { anchor: "start", tone: "soft", size: 11 }), ...coinRow("c", COINS, 64, () => "plain"), label("tray-l", "tray", 244, 34, { anchor: "start", tone: "soft", size: 11 })],
  });
  steps.forEach((s, n) => {
    const got = steps.slice(0, n + 1).filter((t) => t.take).map((t) => t.coin);
    const caption = s.take
      ? `${s.coin} fits in what is still owed, so it goes in the tray; ${s.left === 0 ? "nothing is owed now: change is " + got.join(" + ") + ", the fewest coins possible here" : `${s.left} is still owed`}.`
      : `${s.coin} is more than the ${s.left} owed, so greedy skips it and moves to the next smaller coin.`;
    frames.push({
      caption,
      items: [
        head(`change owed: ${s.left}`),
        label("coins-l", "coins", 0, 34, { anchor: "start", tone: "soft", size: 11 }),
        ...coinRow("c", COINS, 64, (c) => (c === s.coin ? (s.take ? "accent" : "muted") : "plain")),
        label("tray-l", "tray", 244, 34, { anchor: "start", tone: "soft", size: 11 }),
        ...tray("t", got, 64),
      ],
    });
  });
  frames.push({
    caption: `Greedy is optimal only for some coin sets. With coins 4, 3 and 1, greedy pays ${oddAmount} as ${oddGreedy.join(" + ")} (${oddGreedy.length} coins) while ${oddBest.join(" + ")} needs ${oddBest.length}; a general machine uses dynamic programming.`,
    items: [
      head(`coins 4/3/1, owed ${oddAmount}`),
      label("coins-l", "coins", 0, 34, { anchor: "start", tone: "soft", size: 11 }),
      ...coinRow("c", odd, 64, () => "plain"),
      label("tray-l", "greedy", 244, 34, { anchor: "start", tone: "soft", size: 11 }),
      ...tray("t", oddGreedy, 64, "error"),
      label("best-l", "fewest", 244, 100, { anchor: "start", tone: "soft", size: 11 }),
      ...tray("b", oddBest, 130),
    ],
  });
  return finish({ title: "Making change: greedy over 10, 5, 2 and 1, and where greedy fails", input: "", frames });
}

/* ── select("A2") as a sequence diagram ───────────────────────────── */

function selectSequence(): Walkthrough {
  const lines = runMachine();
  const n = lines.findIndex((l) => l.text.startsWith("select A2"));
  const before = lines[n];
  const done = lines[n + 1];
  const balance = before.balance;
  const change = done.change!.join("+");
  const names = ["Customer", "Machine", "HasMoney", "Dispensing", "Item A2"];
  const msgs: Array<{ from: number; to: number; text: string; reply?: boolean; caption: string }> = [
    { from: 0, to: 1, text: "select(A2)", caption: `With ${balance} inserted, the customer presses A2. The machine does not decide anything itself: it hands the event to its current state.` },
    { from: 1, to: 2, text: "select(m, A2)", caption: "The current state is HasMoney, so HasMoney.select runs." },
    { from: 2, to: 4, text: "price, stock?", caption: "HasMoney checks the item: is any left, and does the balance cover the price?" },
    { from: 4, to: 2, text: `22, ${before.stock.A2} left`, reply: true, caption: `Juice costs 22 and ${before.stock.A2} is left; ${balance} covers it.` },
    { from: 2, to: 1, text: "move(Dispensing)", caption: "HasMoney switches the machine to Dispensing — the transition is the state's call, not the machine's." },
    { from: 1, to: 3, text: "dispense(m)", caption: "The machine asks the new state to act. Dispensing reduces the stock and drops the juice." },
    { from: 3, to: 4, text: "stock -= 1", caption: "Juice's stock falls to 0. With chips already gone, nothing is left in the machine." },
    { from: 3, to: 1, text: "move(OutOfStock)", caption: "Dispensing reads the stock and moves the machine to OutOfStock rather than Idle." },
    { from: 1, to: 0, text: `Juice + ${change}`, reply: true, caption: `The customer gets the juice and ${change} in change; any coin inserted now comes straight back.` },
  ];
  const Y0 = 62;
  const DY = 36;
  const frames: Frame[] = [];
  msgs.forEach((_, k) => {
    const { items, xOf } = lifelines("ll", names, { gap: 110, w: 92, length: Y0 + DY * msgs.length - 30, tone: (i) => (i === msgs[k].to ? "accent" : undefined) });
    msgs.slice(0, k + 1).forEach((m, j) => items.push(...message(`m${j}`, xOf(m.from), xOf(m.to), Y0 + j * DY, m.text, { dashed: m.reply, tone: j === k ? "accent" : "ink", size: 10.5 })));
    frames.push({ caption: msgs[k].caption, items });
  });
  return finish({ title: "select(A2): the state decides, the machine only delegates", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "class-diagram": classDiagram,
  "state-machine": stateMachine,
  "change-making": changeMaking,
  "select-sequence": selectSequence,
};
