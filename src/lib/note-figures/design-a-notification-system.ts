import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label, region } from "../lesson-figures/kit.js";
import { database, packet, service, wire, type Pt } from "./sd-kit.js";

/**
 * Design a Notification System: the case study's figures (content/notes/
 * system-design/design-a-notification-system.md). Every figure loops (a
 * points subject), and every value it draws comes from running a small
 * model of the design:
 *
 *  - channels: four notifications routed by type to a queue per channel
 *    (push, SMS, email) and on to that channel's provider, as a pipeline.
 *  - retries: a worker's attempts against a provider; a 5xx is retried
 *    with exponential backoff (1 s, 2 s …), a 4xx is permanent and goes
 *    to the dead-letter queue. The clock is the simulation's own.
 *  - idempotency: the producer sends the same event twice; the worker's
 *    "set if absent" on the event's key lets only the first through.
 *  - gates: one user's events through opt-in, quiet hours and a rate limit
 *    on marketing, each gate evaluated in order, first refusal wins.
 */

/* ── Channels ─────────────────────────────────────────────────────── */

const CHANNELS = ["Push", "SMS", "Email"] as const;
type Channel = (typeof CHANNELS)[number];
const PROVIDER: Record<Channel, string> = { Push: "APNs / FCM", SMS: "SMS gateway", Email: "Email provider" };

function channels(): Walkthrough {
  // The routing rule: which channel each kind of notification uses.
  const RULE: Record<string, Channel> = { "login code": "SMS", receipt: "Email" };
  const route = (type: string): Channel => RULE[type] ?? "Push";
  const notes = [
    { id: "n1", type: "order shipped" },
    { id: "n2", type: "login code" },
    { id: "n3", type: "receipt" },
    { id: "n4", type: "new follower" },
  ].map((n) => ({ ...n, ch: route(n.type) }));
  if (new Set(notes.map((n) => n.ch)).size !== CHANNELS.length) throw new Error("channels: the example should use every channel");
  const RY = (i: number) => i * 62;
  const frames: Frame[] = [];
  const done: Record<Channel, string[]> = { Push: [], SMS: [], Email: [] };
  for (let t = 0; t <= notes.length + 1; t++) {
    const atSvc = notes[t];
    const atQueue = notes[t - 1];
    const atProv = notes[t - 2];
    if (atProv) done[atProv.ch].push(atProv.id);
    const svc = service("svc", 0, RY(1), "Notification svc", { w: 116, tone: atSvc ? "accent" : "plain", sub: "picks the channel" });
    const items: Item[] = [...svc.items];
    CHANNELS.forEach((c, i) => {
      const qOn = atQueue?.ch === c;
      const pOn = atProv?.ch === c;
      items.push(...region(`q${i}`, 160, RY(i), 92, 38, `${c} queue`, { tone: qOn ? "accent" : "ghost" }));
      const prov = service(`p${i}`, 300, RY(i), PROVIDER[c], { w: 112, tone: pOn ? "accent" : "plain", sub: `${done[c].length} delivered` });
      items.push(...prov.items);
      items.push(wire(`sq${i}`, svc.right, { x: 160, y: RY(i) + 19 }, { tone: qOn ? "accent" : "faint" }));
      items.push(wire(`qp${i}`, { x: 252, y: RY(i) + 19 }, prov.left, { tone: pOn ? "accent" : "faint" }));
      done[c].forEach((id, k) => {
        if (id !== atProv?.id) items.push(packet(id, { x: 426 + k * 24, y: RY(i) + 19 }, { text: id, tone: "strong" }));
      });
      if (pOn) items.push(packet(atProv.id, { x: 426 + (done[c].length - 1) * 24, y: RY(i) + 19 }, { text: atProv.id, tone: "accent" }));
      if (qOn) items.push(packet(atQueue.id, { x: 206, y: RY(i) + 19 }, { text: atQueue.id }));
    });
    if (atSvc) items.push(packet(atSvc.id, { x: svc.mid.x, y: svc.top.y - 16 }, { text: atSvc.id }));
    const caption =
      t === 0
        ? `A "${atSvc.type}" event (${atSvc.id}) reaches the notification service, which reads the user's preferences and the rule for this type.`
        : t <= notes.length
          ? `${atQueue.id} (${atQueue.type}) goes on the ${atQueue.ch} queue${atProv ? `, while ${atProv.id} reaches ${PROVIDER[atProv.ch]}` : ""}. Each channel has its own queue and workers, so a slow one never blocks the rest.`
          : `${atProv.id} goes out through ${PROVIDER[atProv.ch]}. Push ${done.Push.length}, SMS ${done.SMS.length}, email ${done.Email.length}: each channel scaled and retried on its own.`;
    frames.push({ caption, items });
  }
  return finish({ title: "One queue and one set of workers per channel", input: "", frames });
}

/* ── Retries with backoff ─────────────────────────────────────────── */

function retries(): Walkthrough {
  const MAX = 4;
  // What the provider answers to each attempt of each notification.
  const answers: Record<string, number[]> = { n1: [503, 503, 200], n2: [400] };
  const backoff = (attempt: number) => 2 ** (attempt - 1); // seconds before the next try
  const transient = (code: number) => code >= 500 || code === 429;
  type Job = { id: string; attempt: number; due: number };
  let queue: Job[] = [{ id: "n1", attempt: 1, due: 0 }, { id: "n2", attempt: 1, due: 0 }];
  const dlq: string[] = [];
  const sent: string[] = [];
  const frames: Frame[] = [];
  const draw = (now: number, active: { job: Job; code: number } | null, caption: string) => {
    const q = region("q", 0, 30, 130, 44, "Push queue");
    const worker = service("worker", 170, 33, "Worker", { w: 80, tone: active ? "accent" : "plain" });
    const prov = service("prov", 300, 33, "APNs / FCM", { w: 100, tone: !active ? "plain" : active.code === 200 ? "strong" : "error", sub: active ? `answered ${active.code}` : "waiting" });
    const items: Item[] = [...q, ...worker.items, ...prov.items, ...region("dlq", 0, 140, 130, 44, "Dead-letter queue", {})];
    items.push(wire("qw", { x: 130, y: 52 }, worker.left), wire("wp", worker.right, prov.left, { tone: !active ? "line" : active.code === 200 ? "accent" : "error", label: active ? `try ${active.job.attempt}` : undefined }));
    items.push(wire("wd", worker.bottom, { x: 130, y: 162 }, { tone: dlq.length && active?.code === 400 ? "error" : "faint", dashed: true }));
    items.push(label("clock", `t = ${now}s`, 210, 4, { size: 12, mono: true, tone: "ink" }));
    queue.forEach((j, i) => {
      items.push(packet(j.id, { x: 112 - i * 30, y: 52 }, { text: j.id, tone: "plain" }));
      if (j.attempt > 1) items.push(label(`due-${j.id}`, `retry at ${j.due}s`, 112 - i * 30, 92, { size: 10, tone: "accent", mono: true }));
    });
    sent.forEach((id) => items.push(packet(id, { x: prov.right.x + 20, y: prov.mid.y }, { text: id, tone: "strong" })));
    dlq.forEach((id, i) => items.push(packet(id, { x: 112 - i * 30, y: 162 }, { text: id, tone: "error" })));
    frames.push({ caption, items });
  };
  draw(0, null, `Two push notifications wait. The worker retries a temporary failure with exponential backoff and gives up after ${MAX} attempts.`);
  let now = 0;
  while (queue.length) {
    queue.sort((a, b) => a.due - b.due);
    const job = queue.shift()!;
    now = Math.max(now, job.due);
    const code = answers[job.id][job.attempt - 1];
    let caption: string;
    if (code === 200) {
      sent.push(job.id);
      caption = `At ${now}s attempt ${job.attempt} of ${job.id} gets 200 and it is sent. The waits doubled, ${Array.from({ length: job.attempt - 1 }, (_, k) => `${backoff(k + 1)}s`).join(" then ")}, so a struggling provider was not flooded.`;
    } else if (transient(code) && job.attempt < MAX) {
      const wait = backoff(job.attempt);
      queue.push({ id: job.id, attempt: job.attempt + 1, due: now + wait });
      caption = job.attempt === 1 ? `${job.id} gets ${code}, a temporary failure. It goes back on the queue to retry in ${wait}s; real systems add random jitter so retries do not arrive together.` : `Attempt ${job.attempt} of ${job.id} at ${now}s gets ${code} again, so the wait doubles: retry in ${wait}s.`;
    } else {
      dlq.push(job.id);
      caption = `${job.id} gets ${code}: the device token is invalid, a permanent error. Retrying cannot help, so it goes straight to the dead-letter queue.`;
    }
    draw(now, { job, code }, caption);
  }
  if (sent.join() !== "n1" || dlq.join() !== "n2") throw new Error("retries: n1 should be sent and n2 dead-lettered");
  return finish({ title: "Retries: back off on temporary errors, give up on permanent ones", input: "", frames });
}

/* ── Idempotency ──────────────────────────────────────────────────── */

function idempotency(): Walkthrough {
  const events = [
    { id: "e1", key: "order-77:shipped" },
    { id: "e1b", key: "order-77:shipped" }, // the producer timed out and sent it again
    { id: "e2", key: "order-78:shipped" },
  ];
  const seen = new Set<string>();
  const received: string[] = [];
  const frames: Frame[] = [];
  const draw = (k: number | null, fresh: boolean, caption: string) => {
    const prod = service("prod", 0, 40, "Order service", { w: 104, tone: k !== null && k === 1 ? "accent" : "plain" });
    const worker = service("worker", 150, 40, "Worker", { w: 84, tone: k === null ? "plain" : fresh ? "accent" : "error" });
    const store = database("keys", 136, 140, "Sent keys", { w: 112, tone: k === null ? "plain" : "accent", sub: `keys: ${seen.size}` });
    const phone = service("phone", 300, 40, "User's phone", { w: 100, tone: k !== null && fresh ? "strong" : "plain", sub: `received: ${received.length}` });
    const items: Item[] = [...prod.items, ...worker.items, ...store.items, ...phone.items, wire("pw", prod.right, worker.left), wire("wk", worker.bottom, store.top, { tone: k === null ? "faint" : "accent", head: false, label: "SET NX" }), wire("wu", worker.right, phone.left, { tone: k !== null && fresh ? "accent" : "faint" })];
    const pos: Pt = { x: worker.mid.x, y: worker.top.y - 16 };
    events.forEach((e, i) => {
      if (k === null && i === 0) items.push(packet(e.id, { x: prod.mid.x, y: prod.top.y - 16 }, { text: "e1" }));
      if (k === i) items.push(packet(e.id, pos, { text: e.id === "e1b" ? "e1" : e.id, tone: fresh ? "accent" : "error" }));
    });
    received.forEach((id, i) => {
      if (!(k !== null && fresh && i === received.length - 1)) items.push(packet(`${id}-r`, { x: phone.mid.x - 12 + i * 24, y: phone.top.y - 16 }, { text: id, tone: "strong" }));
    });
    if (k !== null && fresh) items.push(packet(`${received[received.length - 1]}-r`, { x: phone.mid.x - 12 + (received.length - 1) * 24, y: phone.top.y - 16 }, { text: received[received.length - 1], tone: "accent" }));
    items.push(label("key", k === null ? "key = order id + event" : `key ${events[k].key}`, 192, 222, { size: 11, mono: true, tone: k === null ? "soft" : fresh ? "accent" : "error" }));
    frames.push({ caption, items });
  };
  draw(null, true, "Each event carries an idempotency key, the order id plus what happened. The worker records a key the moment it claims one.");
  events.forEach((e, i) => {
    const fresh = !seen.has(e.key);
    if (fresh) {
      seen.add(e.key);
      received.push(e.id);
    }
    draw(i, fresh, fresh ? (i === 0 ? `The key ${e.key} is new, so "set if absent" succeeds and the notification is sent. The user gets "Order 77 shipped".` : `Event ${e.id} has a new key, ${e.key}, so it is sent: ${received.length} notifications for ${received.length} real events.`) : `The order service timed out and sent the same event again. Its key is already stored, so the worker skips it: no second "Order 77 shipped".`);
  });
  if (received.length !== 2) throw new Error("idempotency: the duplicate should be dropped");
  return finish({ title: "Idempotency keys: a duplicate event sends nothing", input: "", frames });
}

/* ── Preference, quiet hours, rate limit ──────────────────────────── */

function gates(): Walkthrough {
  const OPTED_OUT = new Set(["SMS:marketing"]); // the user's own settings
  const QUIET = { from: 22 * 60, to: 7 * 60 }; // 22:00 to 07:00, the user's local time
  const LIMIT = 2; // marketing notifications per hour
  const events = [
    { at: "10:00", what: "Shipped", ch: "push", kind: "transactional" },
    { at: "10:05", what: "Sale", ch: "SMS", kind: "marketing" },
    { at: "10:10", what: "Sale", ch: "push", kind: "marketing" },
    { at: "10:20", what: "Flash deal", ch: "push", kind: "marketing" },
    { at: "10:40", what: "Price drop", ch: "push", kind: "marketing" },
    { at: "23:15", what: "Delivered", ch: "push", kind: "transactional" },
  ];
  const mins = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const sentMarketing: number[] = [];
  type Verdict = { gates: Array<"pass" | "fail" | "hold" | "skip">; result: string; tone: Tone };
  const verdicts: Verdict[] = [];
  const decide = (e: (typeof events)[number]): Verdict => {
    const t = mins(e.at);
    if (OPTED_OUT.has(`${e.ch}:${e.kind}`)) return { gates: ["fail", "skip", "skip"], result: "dropped", tone: "error" };
    if (t >= QUIET.from || t < QUIET.to) return { gates: ["pass", "hold", "skip"], result: "held to 07:00", tone: "accent" };
    if (e.kind === "marketing") {
      const inHour = sentMarketing.filter((s) => t - s < 60).length;
      if (inHour >= LIMIT) return { gates: ["pass", "pass", "fail"], result: "dropped", tone: "error" };
      sentMarketing.push(t);
    }
    return { gates: ["pass", "pass", "pass"], result: "sent", tone: "strong" };
  };
  const COLS = ["Opt-in", "Quiet hrs", "Rate limit"];
  const EW = 168;
  const GW = 72;
  const RX = EW + 6 + COLS.length * (GW + 6);
  const RY = (i: number) => 24 + i * 34;
  const frames: Frame[] = [];
  const draw = (current: number, caption: string) => {
    const items: Item[] = [label("he", "Event", 0, 10, { anchor: "start", size: 11, tone: "soft" })];
    COLS.forEach((c, j) => items.push(label(`h${j}`, c, EW + 6 + j * (GW + 6) + GW / 2, 10, { size: 11, tone: "soft" })));
    items.push(label("hr", "Result", RX + 50, 10, { size: 11, tone: "soft" }));
    events.forEach((e, i) => {
      const v = verdicts[i];
      items.push(box(`e${i}`, 0, RY(i), `${e.at} ${e.what} · ${e.ch}`, { w: EW, h: 28, size: 11, tone: i === current ? "accent" : "plain" }));
      COLS.forEach((_, j) => {
        const g = v?.gates[j];
        items.push(box(`g${i}-${j}`, EW + 6 + j * (GW + 6), RY(i), g === "pass" ? "ok" : g === "fail" ? "stop" : g === "hold" ? "hold" : g === "skip" ? "–" : "", { w: GW, h: 28, size: 11, tone: g === "fail" ? "error" : g === "hold" ? "accent" : g === "skip" ? "muted" : g === "pass" && i === current ? "accent" : "plain" }));
      });
      items.push(box(`r${i}`, RX, RY(i), v ? v.result : "", { w: 100, h: 28, size: 11, tone: v ? v.tone : "plain" }));
    });
    frames.push({ caption, items });
  };
  const why = [
    "A shipping update passes every gate and is sent. Transactional messages are still checked; only security codes usually skip quiet hours.",
    "The user turned off marketing by SMS, so this sale is dropped at the first gate. Preferences are checked before anything costs money.",
    `The same sale by push is allowed. It is the first marketing message this hour (limit ${LIMIT}), so it is sent.`,
    `A flash deal 10 minutes later is the second marketing message in the hour: still within the limit of ${LIMIT}, sent.`,
    `A third marketing message within the hour hits the limit of ${LIMIT} and is dropped. The limit protects users from notification fatigue.`,
    "At 23:15 the user is in quiet hours (22:00 to 07:00), so the delivery update is held and sent at 07:00 instead of waking them.",
  ];
  events.forEach((e, i) => {
    verdicts.push(decide(e));
    draw(i, why[i]);
  });
  const results = verdicts.map((v) => v.result).join();
  if (results !== "sent,dropped,sent,sent,dropped,held to 07:00") throw new Error(`gates: unexpected results ${results}`);
  return finish({ title: "Every notification passes the user's gates in order", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  channels: channels,
  retries: retries,
  idempotency: idempotency,
  gates: gates,
};
