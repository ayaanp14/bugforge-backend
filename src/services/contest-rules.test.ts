import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeStandings, contestState, freezeAt, type ContestSubmissionRow, type ContestWindow } from "./contest-rules.js";

/** ICPC scoring (contest-rules.ts), without a database. Run with: npm test */

const START = new Date("2026-10-06T10:00:00Z");
const at = (minute: number, second = 0) => new Date(START.getTime() + minute * 60_000 + second * 1000);
const window: ContestWindow = { startsAt: START, durationMinutes: 180, freezeMinutes: 60 };
const teams = [
  { id: "t1", name: "Alpha" },
  { id: "t2", name: "Beta" },
  { id: "t3", name: "Gamma" },
];
const sub = (teamId: string, problemId: string, verdict: ContestSubmissionRow["verdict"], minute: number, second = 0): ContestSubmissionRow => ({
  teamId,
  problemId,
  verdict,
  at: at(minute, second),
});
const board = (submissions: ContestSubmissionRow[], revealed = false) =>
  computeStandings({ window, teams, problemIds: ["A", "B"], submissions, revealed });

describe("contest window", () => {
  it("runs, freezes for the last hour, then ends", () => {
    assert.equal(contestState(window, at(-1)), "before");
    assert.equal(contestState(window, at(0)), "running");
    assert.equal(contestState(window, at(120)), "frozen");
    assert.equal(contestState(window, at(180)), "ended");
  });
  it("does not freeze when the freeze would cover the whole contest", () => {
    assert.equal(freezeAt({ ...window, freezeMinutes: 180 }), null);
    assert.equal(freezeAt({ ...window, freezeMinutes: 0 }), null);
  });
});

describe("computeStandings", () => {
  it("charges solve minute plus 20 per earlier wrong try", () => {
    const rows = board([sub("t1", "A", "wrong_answer", 5), sub("t1", "A", "wrong_answer", 8), sub("t1", "A", "accepted", 30, 59)]);
    const alpha = rows.find((r) => r.teamId === "t1")!;
    assert.equal(alpha.solved, 1);
    assert.equal(alpha.penalty, 30 + 2 * 20);
    assert.deepEqual(alpha.cells["A"], { attempts: 3, solvedAt: 30, pending: 0, firstSolve: true });
  });

  it("ignores compile errors, judge errors and anything after the solve", () => {
    const rows = board([
      sub("t1", "A", "compile_error", 1),
      sub("t1", "A", "judge_error", 2),
      sub("t1", "A", "accepted", 10),
      sub("t1", "A", "wrong_answer", 11),
    ]);
    assert.deepEqual(rows[0]!.cells["A"], { attempts: 1, solvedAt: 10, pending: 0, firstSolve: true });
    assert.equal(rows[0]!.penalty, 10);
  });

  it("costs nothing for an unsolved problem", () => {
    const rows = board([sub("t2", "B", "wrong_answer", 3), sub("t2", "B", "wrong_answer", 4)]);
    const beta = rows.find((r) => r.teamId === "t2")!;
    assert.equal(beta.penalty, 0);
    assert.equal(beta.cells["B"]!.attempts, 2);
  });

  it("ranks by solved, then penalty, then earliest last solve; exact ties share a rank", () => {
    const rows = board([
      sub("t1", "A", "accepted", 50),
      sub("t2", "A", "accepted", 20),
      sub("t2", "B", "accepted", 40),
      sub("t3", "A", "accepted", 50),
    ]);
    assert.deepEqual(rows.map((r) => [r.name, r.rank]), [["Beta", 1], ["Alpha", 2], ["Gamma", 2]]);
  });

  it("breaks an equal penalty by who reached their last solve first", () => {
    // Alpha: 10 + 50 = 60, last at 50. Gamma: 30 + 30 = 60, last at 30.
    const rows = board([sub("t1", "A", "accepted", 10), sub("t1", "B", "accepted", 50), sub("t3", "A", "accepted", 30), sub("t3", "B", "accepted", 30)]);
    assert.deepEqual(rows.slice(0, 2).map((r) => r.name), ["Gamma", "Alpha"]);
  });

  it("hides the frozen hour as pending until revealed", () => {
    const subs = [sub("t1", "A", "accepted", 10), sub("t2", "A", "wrong_answer", 130), sub("t2", "A", "accepted", 150)];
    const frozen = board(subs).find((r) => r.teamId === "t2")!;
    assert.deepEqual(frozen.cells["A"], { attempts: 0, solvedAt: null, pending: 2, firstSolve: false });
    assert.equal(frozen.solved, 0);
    const final = board(subs, true).find((r) => r.teamId === "t2")!;
    assert.deepEqual(final.cells["A"], { attempts: 2, solvedAt: 150, pending: 0, firstSolve: false });
  });

  it("drops submissions outside the contest window and for unknown teams or problems", () => {
    const rows = board([sub("t1", "A", "accepted", -1), sub("t1", "A", "accepted", 180), sub("zz", "A", "accepted", 5), sub("t1", "Z", "accepted", 5)]);
    assert.ok(rows.every((r) => r.solved === 0));
  });
});
