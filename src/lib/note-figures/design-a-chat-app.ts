import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, region } from "../lesson-figures/kit.js";
import { lifelines, message } from "./kit.js";
import { database, packet, service, wire, type Pt } from "./sd-kit.js";

/**
 * Design a Chat App: the case study's figures (content/notes/system-design/
 * design-a-chat-app.md). Every figure loops (a points subject), and every
 * value it draws comes from running a small model of the design:
 *
 *  - websocket-route: one message from Alice to Bob over persistent
 *    WebSockets. The chat service gives it the conversation's next sequence
 *    number, stores it, and finds Bob's gateway in a session registry.
 *  - receipts: the sent → delivered → read ticks as a sequence diagram; the
 *    status Alice sees is the result of applying each event, and it can
 *    only move forward.
 *  - ordering: messages numbered by the server arrive out of order; the
 *    receiver shows a message only when the one before it has been shown,
 *    holding the rest until the gap fills.
 *  - offline: Bob is offline, so messages wait in his inbox and a push
 *    notification goes out; on reconnect he syncs everything after the last
 *    sequence number he saw.
 *  - presence: heartbeats refresh a presence key with a time-to-live; when
 *    they stop the key expires and Bob shows "last seen".
 */

/* ── WebSocket routing ────────────────────────────────────────────── */

function websocketRoute(): Walkthrough {
  // The session registry: which gateway holds each user's WebSocket.
  const sessions = new Map([
    ["alice", "Gateway 1"],
    ["bob", "Gateway 2"],
  ]);
  let lastSeq = 41; // the conversation's counter before this message
  const seq = ++lastSeq;
  const bobGw = sessions.get("bob");
  if (bobGw !== "Gateway 2") throw new Error("websocket-route: Bob should be on gateway 2");

  const stops = ["alice", "gw1", "chat", "store", "lookup", "gw2", "bob"] as const;
  const frames: Frame[] = [];
  stops.forEach((stop, t) => {
    const on = (s: string) => stop === s;
    const alice = service("alice", 0, 40, "Alice", { w: 64, tone: on("alice") ? "accent" : "plain" });
    const gw1 = service("gw1", 90, 40, "Gateway 1", { w: 80, tone: on("gw1") ? "accent" : "plain" });
    const chat = service("chat", 196, 40, "Chat service", { w: 94, tone: on("chat") || on("store") || on("lookup") ? "accent" : "plain", sub: `next seq ${t >= 2 ? seq + 1 : seq}` });
    const gw2 = service("gw2", 316, 40, "Gateway 2", { w: 80, tone: on("gw2") ? "accent" : "plain" });
    const bob = service("bob", 422, 40, "Bob", { w: 64, tone: on("bob") ? "strong" : "plain" });
    const msgs = database("msgs", 136, 150, "Messages", { w: 92, tone: on("store") ? "accent" : "plain", sub: t >= 3 ? `#${seq} stored` : "" });
    const reg = database("reg", 264, 150, "Sessions", { w: 92, tone: on("lookup") ? "accent" : "plain", sub: on("lookup") || t > 4 ? `bob → ${bobGw}` : "" });
    const items: Item[] = [
      ...alice.items, ...gw1.items, ...chat.items, ...gw2.items, ...bob.items, ...msgs.items, ...reg.items,
      wire("ws1", alice.right, gw1.left, { dashed: true, head: false, tone: on("gw1") ? "accent" : "line" }),
      wire("g1c", gw1.right, chat.left, { tone: on("chat") ? "accent" : "line" }),
      wire("cg2", chat.right, gw2.left, { tone: on("gw2") ? "accent" : "line" }),
      wire("ws2", gw2.right, bob.left, { dashed: true, head: false, tone: on("bob") ? "accent" : "line" }),
      wire("cm", { x: chat.mid.x - 22, y: chat.bottom.y + 18 }, msgs.top, { tone: on("store") ? "accent" : "faint" }),
      wire("cr", { x: chat.mid.x + 22, y: chat.bottom.y + 18 }, reg.top, { tone: on("lookup") ? "accent" : "faint" }),
      label("wsl", "dashed = open WebSocket", 0, 96, { size: 11, tone: "faint", anchor: "start" }),
    ];
    const at: Record<(typeof stops)[number], Pt> = {
      alice: { x: alice.mid.x, y: alice.top.y - 16 },
      gw1: { x: gw1.mid.x, y: gw1.top.y - 16 },
      chat: { x: chat.mid.x, y: chat.top.y - 16 },
      store: { x: msgs.mid.x, y: msgs.top.y - 18 },
      lookup: { x: chat.mid.x, y: chat.top.y - 16 },
      gw2: { x: gw2.mid.x, y: gw2.top.y - 16 },
      bob: { x: bob.mid.x, y: bob.top.y - 16 },
    };
    items.push(packet("m", at[stop], { text: t >= 2 ? seq : "m", tone: on("bob") ? "strong" : "accent", r: 12 }));
    const caption = {
      alice: "Each phone keeps one WebSocket open to a gateway, so the server can push a message the moment it arrives instead of waiting to be polled.",
      gw1: "Alice's message goes up her open socket to Gateway 1. Gateways only hold connections; they keep no chat state of their own.",
      chat: `The chat service gives it the conversation's next sequence number, ${seq}. One counter per conversation is what lets every phone agree on the order.`,
      store: `Message ${seq} is written to the messages store before anything else, then Alice is told "sent". From here it survives any crash.`,
      lookup: `To deliver it, the service asks the session registry where Bob is connected: ${bobGw}. Any gateway can reach any user through this lookup.`,
      gw2: `The message is handed to ${bobGw}, which holds Bob's socket.`,
      bob: `${bobGw} pushes message ${seq} down Bob's open WebSocket. No polling was involved anywhere on the path.`,
    }[stop];
    frames.push({ caption, items });
  });
  return finish({ title: "A message from Alice to Bob over WebSockets", input: "", frames });
}

/* ── Delivery receipts ────────────────────────────────────────────── */

const STATUSES = ["sending", "sent", "delivered", "read"] as const;
type Status = (typeof STATUSES)[number];

function receipts(): Walkthrough {
  const A = 0;
  const S = 1;
  const B = 2;
  // Each event, and the status it reports back to Alice (if any).
  const events: Array<{ from: number; to: number; text: string; sets?: Status; caption: string }> = [
    { from: A, to: S, text: "send m1", caption: "Alice sends m1 up her socket. Until the server answers, her phone shows it as sending, with a clock." },
    { from: S, to: A, text: "ack: stored", sets: "sent", caption: "The server stores m1 and acks. Alice now sees one tick, sent: the server has it, even if Bob's phone is off." },
    { from: S, to: B, text: "m1", caption: "The server pushes m1 to Bob's phone over his WebSocket." },
    { from: B, to: S, text: "delivered m1", caption: "Bob's app acks receipt as soon as the message is on the device, before he opens the chat." },
    { from: S, to: A, text: "delivered", sets: "delivered", caption: "The server relays it and Alice's tick becomes two: delivered. A receipt is just another small message on the same sockets." },
    { from: B, to: S, text: "read m1", caption: "Bob opens the chat; his app sends a read receipt for the newest message on screen, which covers every earlier one too." },
    { from: S, to: A, text: "read", sets: "read", caption: "Alice sees read. The status only ever moves forward, so a late or duplicate receipt can never turn read back into delivered." },
  ];
  let status: Status = "sending";
  const STEP = 34;
  const frames: Frame[] = [];
  for (let k = 0; k < events.length; k++) {
    const e = events[k];
    if (e.sets) {
      if (STATUSES.indexOf(e.sets) <= STATUSES.indexOf(status)) throw new Error("receipts: a status moved backwards");
      status = e.sets;
    }
    const ll = lifelines("p", ["Alice", "Server", "Bob"], { gap: 170, w: 84, length: events.length * STEP + 16, tone: (i) => (i === e.from ? "accent" : "plain") });
    const items: Item[] = [...ll.items];
    for (let j = 0; j <= k; j++) {
      const ev = events[j];
      items.push(...message(`e${j}`, ll.xOf(ev.from), ll.xOf(ev.to), ll.top + 28 + j * STEP, ev.text, { tone: j === k ? "accent" : "ink", dashed: ev.from !== A && ev.to === A }));
    }
    items.push(box("st", ll.xOf(A) - 60, ll.top + events.length * STEP + 30, `Alice sees: ${status}`, { w: 150, h: 28, tone: status === "read" ? "strong" : "accent", size: 12 }));
    frames.push({ caption: e.caption, items });
  }
  if (status !== "read") throw new Error("receipts: should end at read");
  return finish({ title: "Delivery receipts: sent, delivered, read", input: "", frames });
}

/* ── Ordering ─────────────────────────────────────────────────────── */

function ordering(): Walkthrough {
  const arrivals = [1, 3, 4, 2, 5]; // the order the network happens to deliver them
  const pending = [...arrivals];
  const held: number[] = [];
  const shown: number[] = [];
  const frames: Frame[] = [];
  const SL = 40;
  const draw = (just: number | null, caption: string) => {
    const items: Item[] = [
      ...region("net", 0, 0, 5 * SL + 12, 44, "Arriving from the network"),
      ...region("held", 250, 0, 4 * SL + 12, 44, "Held: waiting for a gap"),
      ...region("chat", 0, 96, 5 * SL + 12, 44, "Shown in the chat, in order"),
      label("next", `next expected: ${shown.length + 1}`, 330, 118, { size: 12, tone: "accent", mono: true }),
    ];
    pending.forEach((m, i) => items.push(packet(`p${m}`, { x: 26 + i * SL, y: 22 }, { text: m, tone: "plain", r: 13 })));
    held.forEach((m, i) => items.push(packet(`p${m}`, { x: 276 + i * SL, y: 22 }, { text: m, tone: m === just ? "accent" : "muted", r: 13 })));
    shown.forEach((m, i) => items.push(packet(`p${m}`, { x: 26 + i * SL, y: 118 }, { text: m, tone: m === just ? "accent" : "strong", r: 13 })));
    frames.push({ caption, items });
  };
  draw(null, "The server numbered Alice's messages 1 to 5, but the network delivers them in the order 1, 3, 4, 2, 5. The receiver must not trust arrival order.");
  while (pending.length) {
    const m = pending.shift()!;
    if (m === shown.length + 1) {
      shown.push(m);
      const released: number[] = [];
      held.sort((a, b) => a - b);
      while (held.length && held[0] === shown.length + 1) {
        const h = held.shift()!;
        shown.push(h);
        released.push(h);
      }
      draw(m, released.length ? `Message ${m} fills the gap, so it is shown and the held ${released.join(" and ")} follow it at once. The chat reads ${shown.join(", ")}.` : m === 1 ? "Message 1 is the next expected number, so it is shown straight away." : `Message ${m} is next in line and is shown. The chat now holds all ${shown.length}, in the order they were sent.`);
    } else {
      held.push(m);
      draw(m, `Message ${m} arrives but ${shown.length + 1} has not, so ${m} is held rather than shown out of order. A gap that lasts too long triggers a resync from the server.`);
    }
  }
  if (shown.join() !== "1,2,3,4,5" || held.length) throw new Error("ordering: every message should be shown in order");
  return finish({ title: "Ordering by sequence number, not by arrival", input: "", frames });
}

/* ── Offline delivery ─────────────────────────────────────────────── */

function offline(): Walkthrough {
  const lastSeen = 40; // the newest sequence number already on Bob's phone
  const incoming = [41, 42, 43];
  const inbox: number[] = [];
  let pushes = 0;
  let online = false;
  let onPhone: number[] = [];
  const frames: Frame[] = [];
  const draw = (focus: "chat" | "inbox" | "push" | "bob" | null, moving: number | null, caption: string) => {
    const chat = service("chat", 0, 40, "Chat service", { w: 100, tone: focus === "chat" ? "accent" : "plain" });
    const box1 = database("inbox", 150, 136, "Bob's inbox", { w: 104, tone: focus === "inbox" ? "accent" : "plain", sub: `${inbox.length} undelivered` });
    const push = service("push", 150, 40, "Push service", { w: 104, tone: focus === "push" ? "accent" : "plain", sub: `${pushes} sent` });
    const bob = service("bob", 320, 88, "Bob", { w: 84, tone: !online ? "muted" : focus === "bob" ? "strong" : "plain", sub: online ? `has up to #${onPhone.length ? onPhone[onPhone.length - 1] : lastSeen}` : "offline" });
    const items: Item[] = [
      ...chat.items, ...box1.items, ...push.items, ...bob.items,
      wire("ci", chat.bottom, box1.left, { tone: focus === "inbox" ? "accent" : "faint" }),
      wire("cp", chat.right, push.left, { tone: focus === "push" ? "accent" : "faint" }),
      wire("pb", push.right, bob.left, { tone: focus === "push" ? "accent" : "faint", dashed: true }),
      wire("ib", box1.right, bob.left, { tone: focus === "bob" ? "accent" : "faint" }),
    ];
    inbox.forEach((m, i) => items.push(packet(`m${m}`, { x: box1.left.x + 18 + i * 34, y: box1.top.y - 18 }, { text: m, tone: m === moving ? "accent" : "plain", r: 12 })));
    onPhone.forEach((m, i) => items.push(packet(`m${m}`, { x: bob.left.x + 8 + i * 34, y: bob.top.y - 18 }, { text: m, tone: "strong", r: 12 })));
    frames.push({ caption, items });
  };
  draw(null, null, `Bob's phone is off. It last received message ${lastSeen}, and his WebSocket is gone from the session registry.`);
  incoming.forEach((m, i) => {
    inbox.push(m);
    pushes += 1;
    draw(i === 0 ? "push" : "inbox", m, i === 0 ? `Message ${m} finds no live socket for Bob, so it is kept in his inbox of undelivered messages and a push notification wakes his phone.` : i === 1 ? `Message ${m} joins the inbox too (${inbox.length} waiting). Push notifications are best effort; the inbox is what guarantees delivery.` : `Message ${m} waits as well: ${inbox.length} in the inbox, kept in sequence order, ${pushes} pushes sent.`);
  });
  online = true;
  draw("chat", null, `Bob comes back online and opens a new WebSocket, asking for everything after #${lastSeen}, the last number his phone holds.`);
  const sync = inbox.filter((m) => m > lastSeen);
  onPhone = sync;
  inbox.splice(0, inbox.length);
  draw("bob", null, `The server sends ${sync.join(", ")} in order; Bob's app acks #${sync[sync.length - 1]} and the inbox is cleared. Nothing was lost while he was away.`);
  if (onPhone.join() !== incoming.join() || inbox.length) throw new Error("offline: Bob should end with every message and an empty inbox");
  return finish({ title: "Offline delivery: an inbox, a push, then a sync", input: "", frames });
}

/* ── Presence ─────────────────────────────────────────────────────── */

function presence(): Walkthrough {
  const EVERY = 30; // seconds between heartbeats
  const TTL = 45; // the presence key expires this long after the last heartbeat
  const beats = [0, 30, 60]; // the app is closed after the third heartbeat
  const moments = [0, 30, 60, 90, 105];
  const X = (s: number) => 20 + s * 3.2;
  const frames: Frame[] = [];
  moments.forEach((now) => {
    const sent = beats.filter((b) => b <= now);
    const last = sent[sent.length - 1];
    const left = last + TTL - now;
    const online = left > 0;
    const items: Item[] = [{ k: "edge", id: "axis", x1: X(0), y1: 80, x2: X(120), y2: 80, tone: "line" }];
    for (let s = 0; s <= 120; s += 30) items.push(label(`tk${s}`, `${s}s`, X(s), 98, { size: 10, tone: "faint", mono: true }));
    sent.forEach((b) => items.push(packet(`hb${b}`, { x: X(b), y: 80 }, { text: "", tone: "accent", r: 6 })));
    items.push({ k: "ptr", id: "now", x: X(now), y: 66, label: "now", tone: "ink", up: false });
    const tone: Tone = online ? "accent" : "muted";
    items.push(box("key", 20, 130, online ? `presence:bob  TTL ${left}s` : "presence:bob  expired", { w: 200, h: 32, tone, size: 12 }));
    items.push(box("view", 236, 130, online ? "Alice sees: online" : `Alice sees: last seen at ${last}s`, { w: 210, h: 32, tone: online ? "plain" : "accent", size: 12 }));
    const caption =
      now === 0
        ? `Bob's app sends a heartbeat every ${EVERY} seconds. Each one sets a presence key that expires ${TTL} seconds later unless refreshed.`
        : beats.includes(now)
          ? now === beats[1]
            ? `Heartbeat at ${now}s, before the key ran out: its time-to-live is reset to ${TTL}s and Bob stays online.`
            : `Another heartbeat at ${now}s. While beats come every ${EVERY}s, the ${TTL}s time-to-live never runs out.`
          : online
            ? `No heartbeat at ${now}s: Bob closed the app. The key still has ${left}s to live, so a single late beat does not flicker him offline.`
            : `At ${now}s the key expires and Bob shows "last seen at ${last}s". Presence is cheap state with a timeout, not something to store forever.`;
    frames.push({ caption, items });
  });
  return finish({ title: "Presence: heartbeats keep a key alive until they stop", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "websocket-route": websocketRoute,
  receipts: receipts,
  ordering: ordering,
  offline: offline,
  presence: presence,
};
