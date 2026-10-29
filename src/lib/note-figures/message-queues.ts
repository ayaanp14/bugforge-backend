import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { bars, label, region } from "../lesson-figures/kit.js";
import { database, packet, service, wire, type NodeBox, type Pt } from "./sd-kit.js";

/**
 * Message Queues: the note's figures (content/notes/system-design/
 * message-queues.md). Each one runs a small simulation of the queue it
 * draws and records every tick:
 *
 *  - burst-buffer: a producer sends a burst; the queue holds what the
 *    consumer cannot take yet, and drains at the consumer's steady rate (the
 *    depth chart is the simulation's own count).
 *  - competing-consumers: one queue, three consumers; each free consumer
 *    takes the next message, so every message is processed exactly once.
 *  - pub-sub: a topic copies every event to every subscriber.
 *  - ack-redelivery: a consumer crashes after doing the work but before the
 *    ack; the message comes back after the visibility timeout, and the
 *    consumer's processed-ids check keeps the charge from happening twice.
 *  - dead-letter: a message that fails every delivery is moved to a
 *    dead-letter queue after the third attempt, and the queue moves on.
 */

/* ── The queue as a row of slots ──────────────────────────────────── */

const SLOT = 30;

interface Queue {
  items: Item[];
  /** Where the message `i` places from the head waits; the head is the right end, next to the consumer. */
  slot: (i: number) => Pt;
  left: Pt;
  right: Pt;
}

function queueBox(id: string, x: number, y: number, slots: number, name: string, tone: Tone = "ghost"): Queue {
  const w = slots * SLOT + 12;
  const h = 40;
  return {
    items: region(id, x, y, w, h, name, { tone }),
    slot: (i) => ({ x: x + w - 6 - SLOT / 2 - i * SLOT, y: y + h / 2 }),
    left: { x, y: y + h / 2 },
    right: { x: x + w, y: y + h / 2 },
  };
}

/* ── Burst buffering ──────────────────────────────────────────────── */

function burstBuffer(): Walkthrough {
  const arrivals = [0, 1, 5, 3, 0, 0];
  const RATE = 2;
  const queue: number[] = [];
  let next = 1;
  const depth: number[] = [];
  const frames: Frame[] = [];
  let done = 0;
  arrivals.forEach((n, t) => {
    const arrived: number[] = [];
    for (let k = 0; k < n; k++) {
      arrived.push(next);
      queue.push(next++);
    }
    const taken = queue.splice(0, RATE);
    done += taken.length;
    depth.push(queue.length);
    const prod = service("prod", 0, 0, "Producer", { w: 90, tone: n > 0 ? "accent" : "plain", sub: `sent ${n}` });
    const q = queueBox("q", 130, 0, 6, "Queue");
    const cons = service("cons", 350, 0, "Consumer", { w: 90, tone: taken.length ? "accent" : "plain", sub: `${RATE} per tick` });
    const items: Item[] = [...prod.items, ...q.items, ...cons.items, wire("w1", prod.right, q.left), wire("w2", q.right, cons.left)];
    queue.forEach((m, i) => items.push(packet(`m${m}`, q.slot(i), { text: m, tone: arrived.includes(m) ? "accent" : "plain" })));
    taken.forEach((m, i) => items.push(packet(`m${m}`, { x: cons.mid.x - 12 + i * 24, y: -20 }, { text: m, tone: "strong" })));
    // The depth chart: one bar per tick so far, the simulation's own count.
    items.push(...bars("d", depth, { x: 150, base: 160, unit: 14, w: 26, gap: 8, tone: (i) => (i === t ? "accent" : "plain") }));
    depth.forEach((_, i) => items.push(label(`dt${i}`, `t${i}`, 150 + 13 + i * 34, 172, { size: 10, tone: "faint" })));
    items.push(label("dl", "queue depth after each tick", 150 + (arrivals.length * 34) / 2, 190, { size: 11 }));
    const caption =
      t === 0
        ? `The producer and the consumer only know the queue. The consumer works at a steady ${RATE} messages per tick, and the queue is empty.`
        : n > RATE && depth.length > 1 && depth[depth.length - 2] > 0
          ? `${n} more arrive while ${depth[depth.length - 2]} still wait, and the consumer still takes only ${taken.length}. The backlog grows to ${queue.length}; the producer is never told to slow down.`
          : n > RATE
          ? `A burst: ${n} messages arrive in one tick but the consumer takes only ${taken.length}. The queue absorbs the rest and holds ${queue.length}, instead of the consumer being overwhelmed.`
          : n > 0
            ? `${n} message arrives and the consumer takes it at once. While traffic is below the consumer's rate, the queue stays empty.`
            : queue.length > 0
              ? `No new messages. The consumer keeps draining at its own pace: ${taken.length} processed, ${queue.length} still waiting.`
              : `The backlog is gone: all ${done} messages processed, none lost, and the consumer never ran faster than ${RATE} per tick. The queue turned a spike into a steady flow.`;
    frames.push({ caption, items });
  });
  if (queue.length !== 0) throw new Error("message-queues: the burst should drain by the last tick");
  if (Math.max(...depth) <= 0) throw new Error("message-queues: the burst should build a backlog");
  return finish({ title: "A queue absorbs a burst and the consumer drains it at a steady rate", input: "", frames });
}

/* ── Competing consumers ──────────────────────────────────────────── */

function competingConsumers(): Walkthrough {
  // How many ticks each message takes to process.
  const cost = [2, 1, 1, 3, 1, 2, 1];
  const queue = cost.map((_, i) => i + 1);
  const NC = 3;
  const busy: Array<{ m: number; left: number } | null> = Array.from({ length: NC }, () => null);
  const done: number[][] = Array.from({ length: NC }, () => []);
  const handledBy = new Map<number, number>();
  const frames: Frame[] = [];
  const draw = (taken: Map<number, number>, finished: number[], caption: string) => {
    const q = queueBox("q", 0, 66, 7, "Queue");
    const cs: NodeBox[] = Array.from({ length: NC }, (_, i) => service(`c${i}`, 300, i * 66, `Consumer ${i + 1}`, { w: 104, tone: busy[i] ? "accent" : "plain", sub: `done: ${done[i].length}` }));
    const items: Item[] = [...q.items];
    cs.forEach((c, i) => items.push(wire(`w${i}`, q.right, c.left, { tone: busy[i] && taken.get(busy[i]!.m) === i ? "accent" : "line" }), ...c.items));
    queue.forEach((m, i) => items.push(packet(`m${m}`, q.slot(i), { text: m, tone: "plain" })));
    busy.forEach((b, i) => {
      if (b) items.push(packet(`m${b.m}`, { x: cs[i].right.x + 18, y: cs[i].mid.y }, { text: b.m, tone: taken.has(b.m) ? "accent" : "plain" }));
    });
    finished.forEach((m) => {
      const i = handledBy.get(m)!;
      items.push(packet(`m${m}`, { x: cs[i].right.x + 44, y: cs[i].mid.y }, { text: m, tone: "strong" }));
    });
    frames.push({ caption, items });
  };
  draw(new Map(), [], `${cost.length} messages wait in one queue with three consumers reading it. Each message will go to exactly one of them: they compete for the work.`);
  for (let tick = 1; tick <= 12 && (queue.length || busy.some(Boolean)); tick++) {
    const finished: number[] = [];
    busy.forEach((b, i) => {
      if (b && --b.left === 0) {
        done[i].push(b.m);
        finished.push(b.m);
        busy[i] = null;
      }
    });
    const taken = new Map<number, number>();
    busy.forEach((b, i) => {
      if (!b && queue.length) {
        const m = queue.shift()!;
        if (handledBy.has(m)) throw new Error("message-queues: a message was handed out twice");
        handledBy.set(m, i);
        busy[i] = { m, left: cost[m - 1] };
        taken.set(m, i);
      }
    });
    const tailFor = (tk: number, tk2: Map<number, number>) => {
      if (tk === 2) return "A consumer that finishes early simply takes more, so one slow message does not hold the others up.";
      if (tk2.size && !queue.length) return "That empties the queue; the consumers now finish what they hold.";
      const slow = busy.map((b, i) => ({ b, i })).filter((x) => x.b).sort((a, b) => cost[b.b!.m - 1] - cost[a.b!.m - 1])[0];
      return slow ? `Consumer ${slow.i + 1} is still on message ${slow.b!.m}, which takes ${cost[slow.b!.m - 1]} ticks; nothing else waits for it.` : "";
    };
    const parts: string[] = [];
    if (finished.length) parts.push(`${finished.map((m) => `message ${m}`).join(" and ")} finished`);
    if (taken.size) parts.push(`${[...taken].map(([m, i]) => `consumer ${i + 1} takes message ${m}`).join(", ")}`);
    const caption =
      tick === 1
        ? `Each free consumer takes the next message from the head: ${[...taken].map(([m, i]) => `consumer ${i + 1} gets ${m}`).join(", ")}. A taken message is hidden from the others.`
        : !queue.length && !busy.some(Boolean)
          ? `All ${cost.length} messages processed, each by one consumer (${done.map((d, i) => `${d.length} by consumer ${i + 1}`).join(", ")}). Add consumers to drain faster; that is how a queue scales out.`
          : `Tick ${tick}: ${parts.join("; ")}. ${tailFor(tick, taken)}`;
    draw(taken, finished, caption);
  }
  if (handledBy.size !== cost.length || done.flat().length !== cost.length) throw new Error("message-queues: every message should be processed exactly once");
  return finish({ title: "Point-to-point: competing consumers, each message processed by one", input: "", frames });
}

/* ── Publish / subscribe ──────────────────────────────────────────── */

function pubSub(): Walkthrough {
  const EVENTS = ["e1", "e2", "e3"];
  const SUBS = ["Email", "Analytics", "Search index"];
  const pub = (tone: Tone) => service("pub", 0, 66, "Order service", { w: 110, tone });
  const frames: Frame[] = [];
  const received = SUBS.map(() => 0);
  for (let t = 0; t <= EVENTS.length + 2; t++) {
    // Event j waits at the publisher in frame j, is on the topic in j + 1, and reaches every subscriber in j + 2.
    const atTopic = t - 1 >= 0 && t - 1 < EVENTS.length ? t - 1 : -1;
    const fanned = t - 2 >= 0 && t - 2 < EVENTS.length ? t - 2 : -1;
    if (fanned >= 0) for (let i = 0; i < SUBS.length; i++) received[i] += 1;
    const p = pub(t < EVENTS.length ? "accent" : "plain");
    const topic = service("topic", 170, 66, "Topic: orders", { w: 116, tone: atTopic >= 0 ? "accent" : "plain" });
    const subs = SUBS.map((s, i) => service(`s${i}`, 350, i * 66, s, { w: 106, tone: fanned >= 0 ? "accent" : "plain", sub: `received ${received[i]}` }));
    const items: Item[] = [...p.items, ...topic.items, wire("pt", p.right, topic.left)];
    subs.forEach((s, i) => items.push(wire(`ts${i}`, topic.right, s.left, { tone: fanned >= 0 ? "accent" : "line" }), ...s.items));
    EVENTS.forEach((e, j) => {
      if (j === t) items.push(packet(`${e}-0`, { x: p.mid.x, y: p.top.y - 16 }, { text: e }));
      else if (j === atTopic) for (let i = 0; i < SUBS.length; i++) items.push(packet(`${e}-${i}`, { x: topic.mid.x, y: topic.top.y - 16 }, { text: e }));
      else if (j <= t - 2) for (let i = 0; i < SUBS.length; i++) items.push(packet(`${e}-${i}`, { x: subs[i].right.x + 16 + j * 24, y: subs[i].mid.y }, { text: e, tone: j === fanned ? "accent" : "strong" }));
    });
    const caption =
      t === 0
        ? `The order service publishes events to a topic. It does not know who listens; three services have subscribed.`
        : atTopic >= 0 && fanned < 0
          ? `Event ${EVENTS[atTopic]} reaches the topic, while ${EVENTS[t] ?? "the next event"} is about to be published. The topic keeps it for every subscriber.`
          : atTopic >= 0 && fanned > 0
            ? `${EVENTS[fanned]} fans out the same way; each subscriber reads at its own pace and keeps its own place in the stream. ${EVENTS[atTopic]} reaches the topic.`
          : atTopic >= 0
            ? `Every subscriber gets its own copy of ${EVENTS[fanned]}: email, analytics and the search index each act on it independently. ${EVENTS[atTopic]} reaches the topic.`
            : fanned >= 0
              ? `${EVENTS[fanned]} is copied to all three subscribers too. Unlike a queue, where one consumer would take it, one published event here does three jobs.`
              : `Each subscriber received all ${EVENTS.length} events (${received.join(", ")}). A new subscriber can join without the publisher changing a line.`;
    frames.push({ caption, items });
  }
  if (received.some((r) => r !== EVENTS.length)) throw new Error("message-queues: every subscriber should receive every event");
  return finish({ title: "Publish/subscribe: every subscriber gets a copy of every event", input: "", frames });
}

/* ── Acknowledgement and redelivery ───────────────────────────────── */

type Step = "deliver" | "work" | "crash" | "timeout" | "ack";

/** Runs the consumer against the queue's events and returns how often the side effect happened. */
function runConsumer(steps: readonly Step[], idempotent: boolean) {
  const seen = new Set<string>();
  let charges = 0;
  let deliveries = 0;
  let inQueue = true;
  let visible = true;
  const states: Array<{ charges: number; deliveries: number; inQueue: boolean; visible: boolean; skipped: boolean; seen: boolean }> = [];
  for (const s of steps) {
    let skipped = false;
    if (s === "deliver") {
      if (!visible) throw new Error("message-queues: delivered a message that was in flight");
      deliveries += 1;
      visible = false;
    } else if (s === "work") {
      if (idempotent && seen.has("m1")) skipped = true;
      else {
        charges += 1;
        seen.add("m1");
      }
    } else if (s === "timeout") visible = true;
    else if (s === "ack") inQueue = false;
    states.push({ charges, deliveries, inQueue, visible, skipped, seen: seen.has("m1") });
  }
  return states;
}

function ackRedelivery(): Walkthrough {
  const steps: Step[] = ["deliver", "work", "crash", "timeout", "deliver", "work", "ack"];
  const run = runConsumer(steps, true);
  const naive = runConsumer(steps, false);
  const last = run[run.length - 1];
  if (last.deliveries !== 2 || last.charges !== 1 || last.inQueue) throw new Error("message-queues: two deliveries, one charge, then deleted");
  if (naive[naive.length - 1].charges !== 2) throw new Error("message-queues: without the check the charge should repeat");
  const frames: Frame[] = [];
  const q0 = queueBox("q", 0, 30, 3, "Queue");
  const draw = (k: number, caption: string) => {
    const st = k < 0 ? { charges: 0, deliveries: 0, inQueue: true, visible: true, skipped: false, seen: false } : run[k];
    const step = k < 0 ? null : steps[k];
    const crashed = step === "crash" || step === "timeout";
    const cons = service("cons", 180, 30, "Consumer", { w: 100, tone: crashed ? (step === "crash" ? "error" : "muted") : step === "work" || step === "deliver" || step === "ack" ? "accent" : "plain", sub: crashed ? "crashed" : "running" });
    const db = database("db", 350, 36, "Payments DB", { w: 108, sub: `charges for #42: ${st.charges}`, tone: step === "work" && !st.skipped ? "accent" : "plain" });
    const items: Item[] = [...q0.items, ...cons.items, ...db.items, wire("qc", q0.right, cons.left, { tone: step === "deliver" ? "accent" : "line" }), wire("cd", cons.right, db.left, { tone: step === "work" && !st.skipped ? "accent" : "line" })];
    items.push(label("seen", `processed ids: ${st.seen ? "{ m1 }" : "{ }"}`, db.mid.x, db.bottom.y + 34, { size: 11, mono: true, tone: step === "work" && st.skipped ? "accent" : "soft" }));
    items.push(label("dlv", `deliveries: ${st.deliveries}`, q0.slot(1).x, q0.left.y + 40, { size: 11, tone: "soft" }));
    if (st.inQueue) {
      const atConsumer = !st.visible && !crashed;
      const p = atConsumer ? { x: cons.mid.x, y: cons.top.y - 18 } : q0.slot(0);
      items.push(packet("m1", p, { text: "m1", tone: !st.visible && crashed ? "muted" : step === "deliver" || step === "timeout" ? "accent" : "plain" }));
      if (!st.visible && crashed) items.push(label("inflight", "in flight", q0.slot(0).x, q0.left.y - 30, { size: 11, tone: "soft" }));
    } else {
      items.push(packet("m1", { x: cons.mid.x, y: cons.top.y - 18 }, { text: "m1", tone: "strong" }));
      items.push(label("acked", "acked → deleted", cons.mid.x + 60, cons.top.y - 18, { anchor: "start", size: 11, tone: "accent" }));
    }
    frames.push({ caption, items });
  };
  draw(-1, `Message m1 says "charge order #42". The consumer will charge the card, then acknowledge, and only an ack deletes a message from the queue.`);
  draw(0, `The queue delivers m1 and hides it from other consumers for a visibility timeout. It stays in the queue until it is acknowledged.`);
  draw(1, `The consumer charges the card: charges for #42 = ${run[1].charges}. It records m1 as processed in the same database write.`);
  draw(2, `The consumer crashes before sending the ack. The work is done, but the queue cannot know that; m1 is still in flight.`);
  draw(3, `The visibility timeout expires with no ack, so m1 becomes visible again. This is at-least-once delivery: a message may arrive more than once.`);
  draw(4, `A restarted consumer receives m1 again: delivery number ${run[4].deliveries}. Without a check it would charge #42 a second time (${naive[5].charges} charges).`);
  draw(5, `The consumer finds m1 in its processed ids and skips the charge, so it stays at ${run[5].charges}. Handling a message twice has the same effect as once: the consumer is idempotent.`);
  draw(6, `Now it acks, and the queue deletes m1. Two deliveries, one charge: at-least-once delivery plus an idempotent consumer gives an exactly-once effect.`);
  return finish({ title: "Acks and redelivery: a crash before the ack means the message comes back", input: "", frames });
}

/* ── Dead-letter queue ────────────────────────────────────────────── */

function deadLetter(): Walkthrough {
  const MAX = 3;
  // m7 fails on every attempt (a malformed payload); m8 is fine.
  const fails = (m: string) => m === "m7";
  const queue = ["m7", "m8"];
  const dlq: string[] = [];
  const attempts = new Map<string, number>();
  const frames: Frame[] = [];
  const q = queueBox("q", 0, 30, 4, "Queue");
  const d = queueBox("dlq", 0, 150, 4, "Dead-letter queue");
  const draw = (atConsumer: string | null, outcome: "fail" | "ok" | null, caption: string) => {
    const cons = service("cons", 220, 30, "Consumer", { w: 100, tone: outcome === "fail" ? "error" : outcome === "ok" ? "accent" : "plain", sub: atConsumer ? `attempt ${attempts.get(atConsumer)} of ${MAX}` : "waiting" });
    const items: Item[] = [...q.items, ...d.items, ...cons.items, wire("qc", q.right, cons.left), wire("qd", { x: q.right.x - 8, y: q.left.y + 20 }, { x: q.right.x - 8, y: d.left.y - 20 }, { tone: dlq.length ? "accent" : "faint", dashed: true })];
    queue.forEach((m, i) => items.push(packet(m, q.slot(i), { text: m, tone: "plain" })));
    if (atConsumer) items.push(packet(atConsumer, { x: cons.mid.x, y: cons.top.y - 18 }, { text: atConsumer, tone: outcome === "fail" ? "error" : outcome === "ok" ? "strong" : "accent" }));
    dlq.forEach((m, i) => items.push(packet(m, d.slot(i), { text: m, tone: "error" })));
    if (attempts.get("m7")) items.push(label("tries", `m7 failed ${Math.min(attempts.get("m7")!, MAX)} of ${MAX}`, q.left.x + 6, q.left.y + 40, { anchor: "start", size: 11, tone: "soft" }));
    frames.push({ caption, items });
  };
  draw(null, null, `The consumer takes messages from the head of the queue. m7 has a malformed payload that makes the consumer fail every time; the queue allows ${MAX} deliveries per message.`);
  let finalCaption = "";
  while (queue.length) {
    const m = queue.shift()!;
    const n = (attempts.get(m) ?? 0) + 1;
    attempts.set(m, n);
    if (!fails(m)) {
      draw(m, "ok", `${m} is processed and acknowledged. A poison message no longer blocks the queue: ${m} went through right behind it.`);
      finalCaption = `The queue is clear and m7 waits in the dead-letter queue with its error, for someone to inspect, fix and replay. Nothing was lost and nothing looped forever.`;
      continue;
    }
    draw(m, "fail", n === 1 ? `Delivery 1 of m7 fails and is not acknowledged, so the message goes back to the queue to be tried again.` : n < MAX ? `Delivery ${n} of m7 fails as well. Retrying helps with a passing fault, such as a timeout, but not with a bad payload.` : `Delivery ${n} fails too: m7 has used all ${MAX} attempts.`);
    if (n < MAX) {
      queue.unshift(m);
      draw(null, null, n === 1 ? `m7 is back at the head of the queue with its delivery count at ${n}. Many queues wait a little longer before each retry (backoff).` : `m7 returns to the head again, count ${n}. One more failure and the queue gives up on it.`);
    } else {
      dlq.push(m);
      draw(null, null, `After ${MAX} failed deliveries m7 is moved to the dead-letter queue instead of being retried forever, and the main queue moves on.`);
    }
  }
  draw(null, null, finalCaption);
  if (dlq.length !== 1 || dlq[0] !== "m7" || attempts.get("m7") !== MAX || attempts.get("m8") !== 1) throw new Error("message-queues: only m7 should be dead-lettered, after the last attempt");
  return finish({ title: "Dead-letter queue: a message that keeps failing is set aside after N tries", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "burst-buffer": burstBuffer,
  "competing-consumers": competingConsumers,
  "pub-sub": pubSub,
  "ack-redelivery": ackRedelivery,
  "dead-letter": deadLetter,
};
