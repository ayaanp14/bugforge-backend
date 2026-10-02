import { CELL, and, bandOver, finish, note, row, rowLabel, show, slotMid, slotX, spanOver, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { label } from "./kit.js";

/**
 * Greedy Algorithms: the lesson's figures (content/roadmap/greedy-algorithms.md
 * places each with "@figure <name>"). Plausible rules against their
 * counterexamples, the earliest-finish sweep, the exchange argument that
 * proves it, Jump Game II's levels, and the two classic failures (coins,
 * 0/1 knapsack). Every greedy here is run for real and checked against a
 * brute force over all subsets, so a "best" drawn is the true optimum.
 */

type Meeting = readonly [number, number];
const fmt = (m: Meeting) => `(${m[0]},${m[1]})`;

/** Every subset of meetings that do not overlap (touching ends allowed), the largest first. */
function bestSchedule(ms: readonly Meeting[]): Meeting[] {
  let best: Meeting[] = [];
  for (let mask = 0; mask < 1 << ms.length; mask++) {
    const pick = ms.filter((_, i) => mask & (1 << i)).slice().sort((a, b) => a[0] - b[0]);
    if (pick.every((m, k) => k === 0 || pick[k - 1][1] <= m[0]) && pick.length > best.length) best = pick;
  }
  return best;
}

/** The greedy sweep under any order: take a meeting when it starts at or after the room is free. */
function sweep(ms: readonly Meeting[], key: (m: Meeting) => number): Meeting[] {
  const order = ms.slice().sort((a, b) => key(a) - key(b) || a[1] - b[1] || a[0] - b[0]);
  const taken: Meeting[] = [];
  for (const m of order) {
    if (taken.every((t) => t[1] <= m[0] || m[1] <= t[0])) taken.push(m);
  }
  return taken;
}

const PX = 40; // px per time unit
const LANE = 30;
const BAR = 22;

/** Meetings as bars on a time axis, one lane each, with the axis and its ticks under them. */
function timeline(prefix: string, ms: readonly Meeting[], tone: (i: number) => Tone, o: { y?: number; tMax: number; lanes?: number[] }): Item[] {
  const y0 = o.y ?? 0;
  const items: Item[] = [];
  ms.forEach((m, i) => {
    const lane = o.lanes ? o.lanes[i] : i;
    items.push({ k: "cell", id: `${prefix}${fmt(m)}`, x: m[0] * PX, y: y0 + lane * LANE, w: (m[1] - m[0]) * PX, h: BAR, text: fmt(m), tone: tone(i), size: 11 });
  });
  const lanes = o.lanes ? Math.max(...o.lanes) + 1 : ms.length;
  const ay = y0 + lanes * LANE + 2;
  items.push({ k: "path", id: `${prefix}ax`, pts: [[0, ay], [o.tMax * PX, ay]], tone: "line", width: 1 });
  for (let t = 0; t <= o.tMax; t += 2) items.push({ k: "text", id: `${prefix}t${t}`, x: t * PX, y: ay + 10, text: String(t), tone: "faint", size: 10 });
  return items;
}

/* ── Which rule? ───────────────────────────────────────────────────── */

/** Three plausible rules on small examples: earliest start and shortest first each lose to a counterexample; earliest finish does not. */
function rules(): Walkthrough {
  const A: Meeting[] = [[0, 10], [1, 2], [3, 4]];
  const B: Meeting[] = [[1, 5], [4, 7], [6, 10]];
  const T = 10;
  const frames: Frame[] = [];
  const show1 = (ms: Meeting[], name: string, key: (m: Meeting) => number, id: string, good: boolean, text: string) => {
    const taken = sweep(ms, key);
    const best = bestSchedule(ms).length;
    const ok = taken.length === best;
    if (ok !== good) throw new Error(`rules: ${name} on ${ms.map(fmt).join(" ")} was expected to ${good ? "win" : "lose"}`);
    const items: Item[] = [label(`${id}h`, name, 0, -18, { anchor: "start", size: 12.5, weight: 600, tone: "ink" })];
    items.push(...timeline(id, ms, (i) => (taken.includes(ms[i]) ? (ok ? "strong" : "error") : ok ? "muted" : "plain"), { tMax: T }));
    items.push(note(`${id}n`, `${name.split(":")[0]} takes ${taken.length}; the best is ${best}`, 0, ms.length * LANE + 40, { size: 12.5, weight: 600, tone: ok ? "accent" : "error" }));
    frames.push({ caption: text.replace("{taken}", and(taken.map(fmt))).replace("{best}", String(best)), items });
  };
  show1(A, "earliest start", (m) => m[0], "a1", false, "Earliest start first takes {taken}: it starts first, but it holds the room until 10 and blocks both short meetings. The best is {best}, so the rule is wrong.");
  show1(B, "shortest first", (m) => m[1] - m[0], "b1", false, "Shortest first takes {taken}, three hours long, but it overlaps both of the others. The best is {best}, from the two longer meetings, so this rule is wrong too.");
  show1(A, "earliest finish", (m) => m[1], "a2", true, "Earliest finish on the first example takes {taken}: the long meeting ends last, so it is considered last and skipped. That is the best, {best}.");
  show1(B, "earliest finish", (m) => m[1], "b2", true, "Earliest finish on the second example takes {taken}, again the best. It survives both counterexamples because the meeting that ends first leaves the room free the longest.");
  return finish({ title: "Three greedy rules for one meeting room", input: "", frames });
}

/* ── The sweep ─────────────────────────────────────────────────────── */

/** Activity selection: sort by end time, keep every meeting that starts once the room is free. */
function activity(): Walkthrough {
  const meetings: Meeting[] = [[5, 9], [1, 2], [5, 7], [0, 6], [8, 9], [3, 4]];
  const sorted = meetings.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const T = 10;
  const state: Array<"wait" | "take" | "skip"> = sorted.map(() => "wait");
  let freeAt = 0;
  const frames: Frame[] = [];

  const draw = (cur: number, done = false): Item[] => {
    const items: Item[] = [];
    items.push(...timeline("m", sorted, (i) => (done ? (state[i] === "take" ? "strong" : "muted") : i === cur ? (state[i] === "take" ? "accent" : "error") : state[i] === "take" ? "strong" : state[i] === "skip" ? "muted" : "plain"), { tMax: T }));
    const ay = sorted.length * LANE + 2;
    if (!done) {
      items.unshift({ k: "path", id: "free", pts: [[freeAt * PX, -10], [freeAt * PX, ay]], tone: "accent", dashed: true, width: 1.6 });
      items.push(label("freel", `room free at ${freeAt}`, freeAt * PX + 4, -18, { anchor: "start", size: 11, tone: "accent", weight: 600 }));
    }
    const count = state.filter((s) => s === "take").length;
    items.push(note("count", `taken: ${count}`, 0, ay + 34, { size: 12.5, weight: 600, tone: "accent" }));
    return items;
  };

  frames.push({
    caption: `The meetings, sorted by end time, one per row (ties by start). The sweep keeps one number: when the room is next free. It starts free at time 0.`,
    items: draw(-1),
  });
  sorted.forEach((m, i) => {
    const fits = m[0] >= freeAt;
    const was = freeAt;
    state[i] = fits ? "take" : "skip";
    if (fits) freeAt = m[1];
    frames.push({
      caption: fits
        ? `${fmt(m)} starts at ${m[0]}, at or after ${was}, so it fits: take it, and the room is now free from ${m[1]}.${i === 0 ? " Of all the meetings it ends first, so it leaves the most time for the rest." : ""}`
        : `${fmt(m)} starts at ${m[0]}, before the room is free at ${was}: it would overlap a meeting already taken, so it is skipped for good.`,
      items: draw(i),
    });
  });
  const taken = sorted.filter((_, i) => state[i] === "take");
  const best = bestSchedule(meetings).length;
  if (taken.length !== best) throw new Error("activity: the sweep did not find the optimum");
  frames.push({
    caption: `${taken.length} meetings, ${and(taken.map(fmt))}, and a brute force over all ${1 << meetings.length} subsets agrees that ${best} is the most. One sort and one pass: O(n log n).`,
    items: draw(-1, true),
  });
  return finish({ title: "Activity selection: earliest finish first", input: `meetings = ${meetings.map(fmt).join(", ")}`, frames });
}

/** The exchange argument, run: swap an optimal schedule's meetings for greedy's one at a time; it stays valid and as large, and becomes greedy's. */
function exchange(): Walkthrough {
  const meetings: Meeting[] = [[1, 3], [0, 4], [4, 6], [4, 7], [7, 9], [8, 10]];
  const T = 10;
  const greedy = sweep(meetings, (m) => m[1]);
  const best = bestSchedule(meetings).length;
  // An optimal schedule that disagrees with greedy at every position: checked, not assumed.
  const O: Meeting[] = [[0, 4], [4, 7], [8, 10]];
  const valid = (s: readonly Meeting[]) => s.every((m, k) => k === 0 || s[k - 1][1] <= m[0]);
  if (!valid(O) || O.length !== best || greedy.length !== best) throw new Error("exchange: example is not optimal");
  const opt = O.slice();
  const frames: Frame[] = [];
  const Y2 = 92;

  const draw = (k: number | null, done = false): Item[] => {
    const items: Item[] = [rowLabel("lg", "greedy", -10, 0, BAR), rowLabel("lo", "optimal", -10, Y2, BAR)];
    items.push(...timeline("g", greedy, (i) => (done || (k !== null && i < k) ? "strong" : i === k ? "accent" : "plain"), { tMax: T, lanes: greedy.map(() => 0) }));
    // The optimal row: ids follow the meeting, so a swapped-in meeting glides down from the greedy row's place.
    opt.forEach((m, i) => items.push({ k: "cell", id: `o${fmt(m)}`, x: m[0] * PX, y: Y2, w: (m[1] - m[0]) * PX, h: BAR, text: fmt(m), tone: done || greedy.includes(m) ? "strong" : i === k ? "accent" : "plain", size: 11 }));
    items.push({ k: "path", id: "oax", pts: [[0, Y2 + LANE + 2], [T * PX, Y2 + LANE + 2]], tone: "line", width: 1 });
    for (let t = 0; t <= T; t += 2) items.push({ k: "text", id: `ot${t}`, x: t * PX, y: Y2 + LANE + 12, text: String(t), tone: "faint", size: 10 });
    if (k !== null && !done) {
      const e = greedy[k][1];
      items.unshift({ k: "path", id: "edge", pts: [[e * PX, -8], [e * PX, Y2 + LANE]], tone: "accent", dashed: true, width: 1.6 });
      items.push(label("edgel", `greedy's end: ${e}`, e > T / 2 ? e * PX - 4 : e * PX + 4, -14, { anchor: e > T / 2 ? "end" : "start", size: 11, tone: "accent", weight: 600 }));
    }
    items.push(note("cnt", `optimal: ${opt.length} meetings, ${valid(opt) ? "no overlaps" : "overlapping!"}`, 0, Y2 + LANE + 38, { size: 12, weight: 600, tone: "accent" }));
    return items;
  };

  frames.push({
    caption: `Greedy picks ${and(greedy.map(fmt))}. Take any optimal schedule — this one, ${and(O.map(fmt))}, also holds ${best} — and suppose it differs from greedy. The exchange argument turns it into greedy's without ever losing a meeting.`,
    items: draw(null),
  });
  for (let k = 0; k < opt.length; k++) {
    if (opt[k] === greedy[k] || (opt[k][0] === greedy[k][0] && opt[k][1] === greedy[k][1])) continue;
    const f = opt[k];
    const g = greedy[k];
    const nextStart = k + 1 < opt.length ? opt[k + 1][0] : null;
    frames.push({
      caption: `At position ${k + 1} the optimal schedule has ${fmt(f)} where greedy has ${fmt(g)}. Greedy's choice ends no later (${g[1]} ≤ ${f[1]}), because it ends first among the meetings that fit${nextStart !== null ? `, and the next meeting starts at ${nextStart}` : ""}.`,
      items: draw(k),
    });
    opt[k] = g;
    if (!valid(opt)) throw new Error(`exchange: swap ${k} broke the schedule`);
    frames.push({
      caption: `Swap ${fmt(f)} for ${fmt(g)}: ${k + 1 < opt.length ? `everything after it started at or after ${f[1]}, so also after ${g[1]}` : "nothing comes after it"}${k > 0 ? `, and ${fmt(g)} starts at ${g[0]}, once the meeting before it has ended at ${opt[k - 1][1]}` : ""}. No overlap, same count: still optimal, and it agrees with greedy one meeting further.`,
      items: draw(k),
    });
  }
  frames.push({
    caption: `After ${O.filter((m, i) => fmt(m) !== fmt(greedy[i])).length} swaps the optimal schedule is greedy's. No swap lost a meeting, so greedy's schedule is optimal too. That is the exchange argument, and it is the proof to look for before trusting any greedy rule.`,
    items: draw(null, true),
  });
  return finish({ title: "The exchange argument: turning an optimal schedule into greedy's", input: `meetings = ${meetings.map(fmt).join(", ")}`, frames });
}

/* ── Jump Game II ──────────────────────────────────────────────────── */

/** Fewest jumps: jumping as far as possible each time loses; counting levels of reachable indices wins. */
function jumpLevels(): Walkthrough {
  const nums = [2, 3, 1, 1, 4];
  const n = nums.length;
  const last = n - 1;
  const frames: Frame[] = [];
  const arc = (id: string, a: number, b: number, tone: "accent" | "error"): Item => ({ k: "edge", id, x1: slotMid(a), y1: -4, x2: slotMid(b), y2: -4, tone, arrow: true, bow: -(12 + 9 * (b - a)) });

  // The tempting rule: always take the longest jump from where you stand.
  const naive: number[] = [0];
  while (naive[naive.length - 1] < last) {
    const at = naive[naive.length - 1];
    naive.push(Math.min(last, at + nums[at]));
    if (naive.length > n + 1) break;
  }
  // The levels: every index reachable with exactly j jumps forms a range; the next range ends at the farthest reach from it.
  const levels: Array<[number, number]> = [[0, 0]];
  while (levels[levels.length - 1][1] < last) {
    const [lo, hi] = levels[levels.length - 1];
    let far = hi;
    for (let i = lo; i <= hi; i++) far = Math.max(far, i + nums[i]);
    if (far === hi) break;
    levels.push([hi + 1, Math.min(far, last)]);
  }
  const jumps = levels.length - 1;
  // A path for the last frame: from the goal, step back to any index in the previous level that reaches it.
  const path = [last];
  for (let L = jumps - 1; L >= 0; L--) {
    const [lo, hi] = levels[L];
    for (let i = lo; i <= hi; i++) if (i + nums[i] >= path[0]) { path.unshift(i); break; }
  }

  const base = (): Item[] => [rowLabel("nl", "nums", -10, 0), ...row("c", nums, { index: true })];
  frames.push({
    caption: `nums[i] is the longest jump from index i. What is the fewest jumps from index 0 to index ${last}? The tempting rule — always jump as far as you can — is wrong.`,
    items: base(),
  });
  frames.push({
    caption: `Jumping as far as possible goes ${naive.join(" → ")}: from 0 the longest jump lands on index ${naive[1]}, whose value ${nums[naive[1]]} is a poor springboard, so it takes ${naive.length - 1} jumps.`,
    items: [...base(), ...naive.slice(1).map((b, k) => arc(`n${k}`, naive[k], b, "error")), note("res", `${naive.length - 1} jumps`, 0, CELL + 40, { size: 12.5, weight: 600, tone: "error" })],
  });
  const lvlItems = (upto: number, spans = true): Item[] => {
    const items: Item[] = [];
    for (let L = 0; L <= upto; L++) {
      const [lo, hi] = levels[L];
      items.push(bandOver(`lv${L}`, lo, hi, { tone: L === upto ? "accent" : "strong" }));
      if (spans) items.push(spanOver(`ls${L}`, lo, hi, L === 0 ? "start" : `${L} jump${L === 1 ? "" : "s"}`, { lift: 12, tone: L === upto ? "accent" : "line" }));
    }
    return items;
  };
  for (let L = 1; L <= jumps; L++) {
    const [lo, hi] = levels[L];
    const [plo, phi] = levels[L - 1];
    const reachers = [];
    for (let i = plo; i <= phi; i++) reachers.push(`${i} + ${nums[i]} = ${i + nums[i]}`);
    frames.push({
      caption:
        hi === last
          ? `From anywhere in the ${L - 1}-jump range the farthest landing is ${Math.max(...reachers.map((r) => Number(r.split("= ")[1])))} (${reachers.join(", ")}), so ${L} jumps reach indices ${lo} to ${hi}, which includes the last index: the answer is ${L}.`
          : `With ${L} jump${L === 1 ? "" : "s"} you can stand anywhere from ${lo} to ${hi}: every index up to the farthest landing (${reachers.join(", ")}), since a shorter jump is always allowed.`,
      items: [...lvlItems(L), ...base(), note("res", `${L} jump${L === 1 ? "" : "s"}: indices ${lo}..${hi}`, 0, CELL + 40, { size: 12.5, weight: 600, tone: "accent" })],
    });
  }
  frames.push({
    caption: `${jumps} jumps, for example ${path.join(" → ")}. The scan never chooses a jump; it only counts levels, which is "greedy stays ahead": after k jumps, nobody can be beyond the end of level k. Two numbers, one pass: O(n).`,
    items: [...lvlItems(jumps, false), ...base(), ...path.slice(1).map((b, k) => arc(`p${k}`, path[k], b, "accent")), note("res", `fewest jumps: ${jumps}`, 0, CELL + 40, { size: 12.5, weight: 600, tone: "accent" })],
  });
  return finish({ title: "Jump Game II: why counting levels beats the longest jump", input: `nums = ${show(nums)}`, frames });
}

/* ── When greedy fails ─────────────────────────────────────────────── */

/** Largest coin first: right for canonical coins, wrong for 1, 3, 4. */
function coins(): Walkthrough {
  const cases: Array<{ coins: number[]; amount: number }> = [
    { coins: [1, 2, 5, 10, 20, 50], amount: 80 },
    { coins: [1, 3, 4], amount: 6 },
  ];
  const greedyCoins = (cs: number[], amt: number) => {
    const out: number[] = [];
    for (const c of cs.slice().sort((a, b) => b - a)) while (amt >= c) { out.push(c); amt -= c; }
    return out;
  };
  const bestCoins = (cs: number[], amt: number) => {
    const dp: Array<number[] | null> = [[]];
    for (let a = 1; a <= amt; a++) {
      dp[a] = null;
      for (const c of cs) {
        const prev = c <= a ? dp[a - c] : null;
        if (prev && (!dp[a] || prev.length + 1 < dp[a]!.length)) dp[a] = [...prev, c].sort((x, y) => y - x);
      }
    }
    return dp[amt]!;
  };
  const R = 17;
  const frames: Frame[] = [];
  cases.forEach((cs, f) => {
    const g = greedyCoins(cs.coins, cs.amount);
    const b = bestCoins(cs.coins, cs.amount);
    const ok = g.length === b.length;
    const items: Item[] = [];
    const rowOf = (id: string, vals: number[], y: number, tone: Tone, name: string) => {
      items.push(label(`${id}l`, name, 0, y - R - 12, { anchor: "start", size: 11.5, weight: 600, tone: "soft" }));
      vals.forEach((v, i) => items.push({ k: "node", id: `${id}${i}`, x: R + i * (2 * R + 8), y, r: R, text: String(v), tone, size: 12 }));
      items.push(note(`${id}n`, `${vals.length} coins`, vals.length * (2 * R + 8) + 8, y, { size: 12.5, weight: 600, tone: tone === "error" ? "error" : "accent" }));
    };
    rowOf(`c${f}g`, g, 30, ok ? "strong" : "error", `largest coin first: ${g.join(" + ")}`);
    rowOf(`c${f}b`, b, 110, "strong", `fewest possible: ${b.join(" + ")}`);
    items.push(note(`c${f}h`, `coins ${cs.coins.join(", ")} · make ${cs.amount}`, 0, -22, { size: 12.5, weight: 600 }));
    frames.push({
      caption: ok
        ? `With coins ${cs.coins.join(", ")}, largest-first makes ${cs.amount} from ${g.join(" + ")}, and nothing does it in fewer than ${b.length}. Systems like this, where greedy is always optimal, are called canonical — which is why it feels natural at a till.`
        : `With coins ${cs.coins.join(", ")}, largest-first takes the ${g[0]} and is left with ${g.slice(1).join(" + ")}: ${g.length} coins. But ${b.join(" + ")} needs only ${b.length}. Taking the ${g[0]} looked best and was not, and greedy never reconsiders; dynamic programming does.`,
      items,
    });
  });
  return finish({ title: "Largest coin first: right for some coin systems, wrong for others", input: "", frames });
}

/** Fractional knapsack: best ratio first is optimal. 0/1 knapsack: the same rule leaves room unused and loses. */
function knapsack(): Walkthrough {
  const CAP = 50;
  const items0 = [
    { name: "A", value: 60, weight: 10 },
    { name: "B", value: 100, weight: 20 },
    { name: "C", value: 120, weight: 30 },
  ];
  const byRatio = items0.slice().sort((a, b) => b.value / b.weight - a.value / a.weight);
  // Fractional: whole items by ratio, then a fraction of the next.
  const frac: Array<{ name: string; weight: number; value: number; part: boolean }> = [];
  let room = CAP;
  for (const it of byRatio) {
    const w = Math.min(room, it.weight);
    if (w <= 0) break;
    frac.push({ name: it.name, weight: w, value: (it.value * w) / it.weight, part: w < it.weight });
    room -= w;
  }
  // 0/1, greedy by ratio: whole items only.
  const greedy01: typeof items0 = [];
  room = CAP;
  for (const it of byRatio) if (it.weight <= room) { greedy01.push(it); room -= it.weight; }
  // 0/1, the true best: every subset.
  let best01: typeof items0 = [];
  for (let mask = 0; mask < 1 << items0.length; mask++) {
    const pick = items0.filter((_, i) => mask & (1 << i));
    const w = pick.reduce((s, it) => s + it.weight, 0);
    const v = pick.reduce((s, it) => s + it.value, 0);
    if (w <= CAP && v > best01.reduce((s, it) => s + it.value, 0)) best01 = pick;
  }
  const S = 7; // px per kg
  const H = 30;
  const rowsY = [0, 78, 156];
  const items: Item[] = [];
  const bag = (id: string, y: number, parts: Array<{ name: string; weight: number; value: number; part?: boolean }>, tone: Tone, title: string) => {
    items.push(label(`${id}t`, title, 0, y - 12, { anchor: "start", size: 11.5, weight: 600, tone: "soft" }));
    items.push({ k: "cell", id: `${id}bag`, x: 0, y, w: CAP * S, h: H, text: "", tone: "ghost" });
    let x = 0;
    parts.forEach((p, i) => {
      items.push({ k: "cell", id: `${id}${i}`, x, y, w: p.weight * S, h: H, text: `${p.name}${p.part ? ` ${p.weight}/${items0.find((it) => it.name === p.name)!.weight}` : ""} · ${Math.round(p.value)}`, tone, size: 11 });
      x += p.weight * S;
    });
    const total = parts.reduce((s, p) => s + p.value, 0);
    const used = parts.reduce((s, p) => s + p.weight, 0);
    items.push(note(`${id}v`, `${Math.round(total)}${used < CAP ? ` (${CAP - used} kg empty)` : ""}`, CAP * S + 10, y + H / 2, { size: 12.5, weight: 600, tone: tone === "error" ? "error" : "accent" }));
    return total;
  };
  const vf = bag("f", rowsY[0], frac, "strong", "fractions allowed: best value per kg first");
  const vg = bag("g", rowsY[1], greedy01, "error", "whole items, same rule");
  const vb = bag("b", rowsY[2], best01, "strong", "whole items, best choice (dynamic programming)");
  // A weight scale under the last bag, so each segment's width reads as kilograms.
  const ay = rowsY[2] + H + 8;
  items.push({ k: "path", id: "kax", pts: [[0, ay], [CAP * S, ay]], tone: "line", width: 1 });
  for (let kg = 0; kg <= CAP; kg += 10) items.push({ k: "text", id: `kg${kg}`, x: kg * S, y: ay + 10, text: String(kg), tone: "faint", size: 10 });
  items.push(label("kgl", "kg", CAP * S + 18, ay + 10, { anchor: "start", size: 10.5, tone: "faint" }));
  if (vg >= vb) throw new Error("knapsack: the example should show greedy losing");
  const ratios = byRatio.map((it) => `${it.name} ${it.value / it.weight}`).join(", ");
  return finish({
    title: "Fractional knapsack against 0/1 knapsack",
    input: "",
    frames: [
      {
        caption: `A ${CAP} kg bag; values per kg are ${ratios}. With fractions, best ratio first fills the bag for ${vf}, and an exchange argument proves it. With whole items the same rule stops at ${vg} with room to spare, while ${best01.map((it) => it.name).join(" and ")} make ${vb}: no part of an item can be swapped, so the proof breaks.`,
        items,
      },
    ],
  });
}


export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  rules,
  activity,
  exchange,
  "jump-levels": jumpLevels,
  coins,
  knapsack,
};
