import test from "node:test";
import assert from "node:assert/strict";
import {
  CONNECTOR_TIERS,
  FRAME_GOODIES,
  FRAME_GRANT_KINDS,
  HONOUR_FRAMES,
  KATA_MONTH_SOLVES,
  LIMITED_FRAMES,
  NO_FRAME,
  SOLVER_TIERS,
  STREAK_TIERS,
  UNASSISTED_HARD,
  frameCards,
  istDay,
  limitedWindow,
  monthLabel,
  parseFrameId,
  wearableFrames,
  type FrameFacts,
} from "./frames.js";

/*
 * The frames' rules (lib/frames.ts). The client's mirror
 * (frontend/src/lib/frames.ts) draws these ids — change both, then this.
 */

const NOW = new Date("2026-11-17T06:00:00Z");

const nothing: FrameFacts = {
  solved: 0,
  unassistedHard: 0,
  bestStreak: 0,
  chests: 0,
  credentials: 0,
  honours: [],
  kataMonths: {},
  tracks: [{ key: "java", title: "Java", finished: false }],
  topics: [
    { slug: "array", label: "Array", solved: 0, total: 14 },
    { slug: "two-pointers", label: "Two Pointers", solved: 0, total: 12 },
    { slug: "graph", label: "Graph", solved: 0, total: 14 },
  ],
  referrals: 0,
  simulations: [
    { slug: "tcs", company: "TCS", done: 0, total: 4, complete: false },
    { slug: "infosys", company: "Infosys", done: 0, total: 3, complete: false },
  ],
  limited: [],
  owned: [],
};
const facts = (over: Partial<FrameFacts>): FrameFacts => ({ ...nothing, ...over });
const ids = (f: FrameFacts, now = NOW) => frameCards(f, now).map((c) => c.id);
const card = (f: FrameFacts, id: string, now = NOW) => frameCards(f, now).find((c) => c.id === id);

test("the ids the client draws, pinned", () => {
  assert.deepEqual(SOLVER_TIERS.map((t) => t.id), ["solver-50", "solver-200", "solver-500", "solver-1000"]);
  assert.deepEqual(STREAK_TIERS.map((t) => t.id), ["streak-30", "streak-100", "streak-365"]);
  assert.deepEqual(CONNECTOR_TIERS.map((t) => t.id), ["connector-3", "connector-10"]);
  assert.deepEqual(Object.keys(HONOUR_FRAMES), ["founding", "diwali-2026", "ambassador", "champion", "contributor"]);
  assert.deepEqual(FRAME_GRANT_KINDS, ["frame_ambassador", "frame_champion", "frame_contributor"]);
  assert.deepEqual(FRAME_GOODIES.map((g) => g.id), ["goodies-orbit", "goodies-eclipse"]);
  assert.deepEqual(LIMITED_FRAMES.map((l) => l.id), ["newyear-2027"]);
  assert.equal(UNASSISTED_HARD, 25);
  assert.equal(KATA_MONTH_SOLVES, 20);
  // Every id fits the column and the id grammar the wear route accepts.
  for (const c of frameCards(facts({ honours: ["founding_member", "diwali_2026_diya"] }))) assert.equal(parseFrameId(c.id), c.id);
});

test("a new account earns nothing but may wear no frame", () => {
  const cards = frameCards(nothing, NOW);
  assert.equal(cards.filter((c) => c.earned).length, 0);
  assert.deepEqual([...wearableFrames(nothing, NOW)], [NO_FRAME]);
});

test("the counts: solver, unassisted, streak, connector", () => {
  const f = facts({ solved: 200, unassistedHard: 25, bestStreak: 100, referrals: 3 });
  const wear = wearableFrames(f, NOW);
  for (const id of ["solver-50", "solver-200", "unassisted", "streak-30", "streak-100", "connector-3"]) assert.ok(wear.has(id), id);
  for (const id of ["solver-500", "solver-1000", "streak-365", "connector-10"]) assert.ok(!wear.has(id), id);
  // Progress never reads past its target.
  assert.deepEqual(card(f, "solver-50")?.progress, { have: 50, need: 50 });
  assert.deepEqual(card(f, "solver-500")?.progress, { have: 200, need: 500 });
});

test("the frames worn before the picker: road, credential, the two honours", () => {
  assert.equal(card(facts({ chests: 1 }), "road")?.earned, true);
  assert.equal(card(nothing, "road")?.earned, false);
  assert.equal(card(facts({ credentials: 2 }), "credential")?.earned, true);
  // An honour frame nobody can earn is shown only to its holders.
  assert.ok(!ids(nothing).includes("founding"));
  assert.ok(!ids(nothing).includes("diwali-2026"));
  assert.equal(card(facts({ honours: ["founding_member"] }), "founding")?.earned, true);
  assert.equal(card(facts({ honours: ["diwali_2026_diya"] }), "diwali-2026")?.earned, true);
  // The frames given by hand are shown as goals to everyone, earned by their row.
  assert.equal(card(nothing, "champion")?.earned, false);
  assert.equal(card(facts({ honours: ["frame_champion"] }), "champion")?.earned, true);
});

test("topic finishers: every earned one, the closest goals, else the first", () => {
  assert.deepEqual(ids(nothing).filter((id) => id.startsWith("topic-")), ["topic-array"]);
  const f = facts({
    topics: [
      { slug: "array", label: "Array", solved: 14, total: 14 },
      { slug: "two-pointers", label: "Two Pointers", solved: 3, total: 12 },
      { slug: "graph", label: "Graph", solved: 10, total: 14 },
    ],
  });
  assert.deepEqual(ids(f).filter((id) => id.startsWith("topic-")), ["topic-array", "topic-graph", "topic-two-pointers"]);
  assert.ok(wearableFrames(f, NOW).has("topic-array"));
  assert.ok(!wearableFrames(f, NOW).has("topic-graph"));
  // An empty plan is never "finished".
  assert.equal(card(facts({ topics: [{ slug: "x", label: "X", solved: 0, total: 0 }] }), "topic-x")?.earned, false);
});

test("the kata: each month earned, and this month as the goal", () => {
  const f = facts({ kataMonths: { "2026-09": 22, "2026-10": 12, "2026-11": 5 } });
  assert.deepEqual(ids(f).filter((id) => id.startsWith("kata-")), ["kata-2026-11", "kata-2026-09"]);
  assert.equal(card(f, "kata-2026-09")?.earned, true);
  assert.equal(card(f, "kata-2026-09")?.name, "Kata · Sep 2026");
  assert.deepEqual(card(f, "kata-2026-11")?.progress, { have: 5, need: KATA_MONTH_SOLVES });
  // A month that fell short is not a frame.
  assert.ok(!wearableFrames(f, NOW).has("kata-2026-10"));
  // This month, once earned, is listed once.
  assert.deepEqual(ids(facts({ kataMonths: { "2026-11": 20 } })).filter((id) => id.startsWith("kata-")), ["kata-2026-11"]);
  // IST decides the month: 23:00 UTC on 30 November is 1 December in India.
  assert.ok(ids(nothing, new Date("2026-11-30T23:00:00Z")).includes("kata-2026-12"));
});

test("study tracks and company simulations", () => {
  assert.equal(card(facts({ tracks: [{ key: "java", title: "Java", finished: true }] }), "track-java")?.name, "Java graduate");
  assert.equal(card(nothing, "track-java")?.earned, false);
  const sims = facts({
    simulations: [
      { slug: "tcs", company: "TCS", done: 4, total: 4, complete: true },
      { slug: "infosys", company: "Infosys", done: 1, total: 3, complete: false },
    ],
  });
  assert.equal(card(sims, "process-tcs")?.earned, true);
  assert.equal(card(sims, "process-tcs")?.name, "TCS full process");
  assert.deepEqual(card(sims, "process-infosys")?.progress, { have: 1, need: 3 });
});

test("a limited edition: a goal until its window shuts, then only for those who earned it", () => {
  const before = new Date("2026-12-20T06:00:00Z");
  const during = new Date("2027-01-03T06:00:00Z");
  const after = new Date("2027-01-08T06:00:00Z");
  assert.ok(ids(nothing, before).includes("newyear-2027"));
  assert.ok(ids(nothing, during).includes("newyear-2027"));
  assert.ok(!ids(nothing, after).includes("newyear-2027"));
  assert.equal(card(facts({ limited: ["newyear-2027"] }), "newyear-2027", after)?.earned, true);
  // The window is IST days: it opens at 18:30 UTC the evening before.
  const l = LIMITED_FRAMES[0];
  assert.equal(limitedWindow(l, new Date("2026-12-31T18:29:59Z")).started, false);
  assert.equal(limitedWindow(l, new Date("2026-12-31T18:30:00Z")).open, true);
  assert.equal(limitedWindow(l, new Date("2027-01-07T18:30:00Z")).open, false);
});

test("goodies frames are owned by purchase", () => {
  assert.equal(card(nothing, "goodies-orbit")?.earned, false);
  assert.equal(card(nothing, "goodies-orbit")?.points, 300);
  assert.equal(card(facts({ owned: ["goodies-orbit"] }), "goodies-orbit")?.earned, true);
});

test("a wear request's id", () => {
  for (const auto of [undefined, null, "", "auto"]) assert.equal(parseFrameId(auto), null);
  assert.equal(parseFrameId("none"), "none");
  assert.equal(parseFrameId("kata-2026-11"), "kata-2026-11");
  for (const bad of [42, "Solver", "../x", "a b", "-x", "x".repeat(101), {}]) assert.equal(parseFrameId(bad), undefined, String(bad));
});

test("dates in India", () => {
  assert.equal(istDay(new Date("2026-11-16T19:00:00Z")), "2026-11-17");
  assert.equal(monthLabel("2027-01"), "Jan 2027");
});
