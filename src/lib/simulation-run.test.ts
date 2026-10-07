import { test } from "node:test";
import assert from "node:assert/strict";
import { canOpen, formatOf, readRunRounds, runView, type SessionFact, type SittingFact, type StoredRun } from "./simulation-run.js";
import type { Simulation } from "./simulations/types.js";

/**
 * A simulation run as it stands: rounds open in order, each round's result
 * read from the sitting or session it produced, never stored.
 *
 * Run with: npm test
 */

const T0 = Date.UTC(2026, 9, 7, 6);
const MIN = 60_000;

const SIM: Simulation = {
  slug: "acme",
  company: "Acme",
  family: "service",
  role: "campus fresher",
  difficulty: "beginner",
  rounds: [
    { key: "oa", kind: "assessment", name: "Acme Test", covers: "Aptitude and coding.", test: "acme-test" },
    { key: "technical", kind: "technical", name: "Technical Interview", covers: "Programming and projects.", focus: ["oop"] },
    { key: "hr", kind: "hr", name: "HR Interview", covers: "Fit and relocation." },
  ],
  firmness: "consistent",
  sourceNote: "Test fixture.",
  sources: [{ label: "Fixture", url: "https://example.com" }],
};

const run = (rounds: unknown[], over: Partial<StoredRun> = {}): StoredRun => ({ id: "r1", slug: "acme", hrMode: "voice", rounds, endedAt: null, createdAt: new Date(T0), ...over });
const sitting = (over: Partial<SittingFact>): SittingFact => ({ id: "a1", slug: "acme-test", startedAt: T0 + 5 * MIN, status: "submitted", pct: 64.4, ...over });
const session = (over: Partial<SessionFact>): SessionFact => ({ id: "s1", savedInterviewId: "si-tech", createdAt: T0 + 90 * MIN, status: "completed", mode: "written", overallScore: 55, ...over });

test("a fresh run: the first round is ready, the rest wait for the one before", () => {
  const v = runView(SIM, run([]), { sittings: [], sessions: [] });
  assert.deepEqual(v.rounds.map((r) => r.state), ["ready", "locked", "locked"]);
  assert.equal(v.current, "oa");
  assert.equal(v.complete, false);
  assert.equal(v.summary, null);
});

test("the assessment round is the first sitting of its pattern started after the round opened", () => {
  const opened = [{ key: "oa", openedAt: T0 }];
  // A sitting from before the run is someone's earlier practice, not this round.
  const earlier = sitting({ id: "old", startedAt: T0 - 3 * 86_400_000, pct: 90 });
  assert.equal(runView(SIM, run(opened), { sittings: [earlier], sessions: [] }).rounds[0]!.state, "open");
  const live = runView(SIM, run(opened), { sittings: [earlier, sitting({ status: "in-progress", pct: null })], sessions: [] });
  assert.equal(live.rounds[0]!.state, "in-progress");
  assert.equal(live.rounds[1]!.state, "locked");
  const graded = runView(SIM, run(opened), { sittings: [earlier, sitting({})], sessions: [] });
  assert.equal(graded.rounds[0]!.state, "done");
  assert.equal(graded.rounds[0]!.score, 64);
  assert.equal(graded.rounds[1]!.state, "ready", "the next round opens once this one is sat");
});

test("a sitting the proctor closed counts as sat, and says so", () => {
  const v = runView(SIM, run([{ key: "oa", openedAt: T0 }]), { sittings: [sitting({ status: "terminated", pct: 20 })], sessions: [] });
  assert.equal(v.rounds[0]!.state, "done");
  assert.equal(v.rounds[0]!.disqualified, true);
});

test("an interview round is the newest session of its own setup; an abandoned one can be held again", () => {
  const opened = [
    { key: "oa", openedAt: T0 },
    { key: "technical", openedAt: T0 + 80 * MIN, savedInterviewId: "si-tech" },
  ];
  const sittings = [sitting({})];
  assert.equal(runView(SIM, run(opened), { sittings, sessions: [] }).rounds[1]!.state, "open");
  assert.equal(runView(SIM, run(opened), { sittings, sessions: [session({ status: "started", overallScore: null })] }).rounds[1]!.state, "in-progress");
  assert.equal(runView(SIM, run(opened), { sittings, sessions: [session({ status: "abandoned", overallScore: null })] }).rounds[1]!.state, "open");
  // Another setup's session is not this round's.
  assert.equal(runView(SIM, run(opened), { sittings, sessions: [session({ savedInterviewId: "other" })] }).rounds[1]!.state, "open");
  const done = runView(SIM, run(opened), { sittings, sessions: [session({})] });
  assert.equal(done.rounds[1]!.state, "done");
  assert.equal(done.rounds[1]!.score, 55);
  assert.equal(done.current, "hr");
});

test("a finished run sums up: the mean of the scored rounds and the weakest", () => {
  const opened = [
    { key: "oa", openedAt: T0 },
    { key: "technical", openedAt: T0 + 80 * MIN, savedInterviewId: "si-tech" },
    { key: "hr", openedAt: T0 + 140 * MIN, savedInterviewId: "si-hr" },
  ];
  const v = runView(SIM, run(opened), {
    sittings: [sitting({})],
    sessions: [session({}), session({ id: "s2", savedInterviewId: "si-hr", createdAt: T0 + 150 * MIN, mode: "voice", overallScore: 80 })],
  });
  assert.equal(v.complete, true);
  assert.equal(v.current, null);
  assert.deepEqual(v.summary, { score: 66, weakest: "technical" });
});

test("rounds open in order, never twice once done, never after the run ended", () => {
  const fresh = runView(SIM, run([]), { sittings: [], sessions: [] });
  assert.equal(canOpen(SIM, fresh, "oa"), "ok");
  assert.equal(canOpen(SIM, fresh, "hr"), "locked");
  assert.equal(canOpen(SIM, fresh, "nope"), "missing");
  const sat = runView(SIM, run([{ key: "oa", openedAt: T0 }]), { sittings: [sitting({})], sessions: [] });
  assert.equal(canOpen(SIM, sat, "oa"), "done");
  assert.equal(canOpen(SIM, sat, "technical"), "ok");
  const ended = runView(SIM, run([], { endedAt: new Date(T0 + MIN) }), { sittings: [], sessions: [] });
  assert.equal(canOpen(SIM, ended, "oa"), "ended");
});

test("the conversation rounds are held as the candidate chose; technical rounds need the editor", () => {
  assert.equal(formatOf(SIM.rounds[0]!, "voice"), "test");
  assert.equal(formatOf(SIM.rounds[1]!, "voice"), "written");
  assert.equal(formatOf(SIM.rounds[2]!, "voice"), "voice");
  assert.equal(formatOf(SIM.rounds[2]!, "written"), "written");
});

test("stored rounds are read defensively", () => {
  assert.deepEqual(readRunRounds([{ key: "oa", openedAt: 1 }, { key: 3 }, null, "x"]), [{ key: "oa", openedAt: 1 }]);
  assert.deepEqual(readRunRounds({}), []);
});
