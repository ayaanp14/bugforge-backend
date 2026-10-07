import test from "node:test";
import assert from "node:assert/strict";
import { BADGES, badgeById, badgeFeat, countersOfMe, hasBadge } from "./badges.js";

/*
 * The server's copy of the badge table must match the client's
 * (frontend/src/lib/badges.ts) id for id: the client sends an id, and a
 * badge the wall shows as earned must be one the share check accepts. This
 * list is that table — change both sides, then this.
 */
test("the table is the client's: same ids, in the same order", () => {
  assert.deepEqual(
    BADGES.map((b) => b.id),
    [
      "solver-1", "solver-10", "solver-25", "solver-50", "solver-100", "solver-250", "solver-500",
      "hunter-1", "hunter-10", "hunter-25", "hunter-50",
      "streak-3", "streak-7", "streak-30", "streak-100",
      "road-1", "road-2", "road-3", "road-4",
    ],
  );
  for (const b of BADGES) assert.equal(b.id, `${b.track}-${b.threshold}`);
});

test("an unknown or malformed id is no badge", () => {
  assert.equal(badgeById("solver-2"), null);
  assert.equal(badgeById(7), null);
  assert.equal(badgeById(undefined), null);
  assert.equal(badgeById("streak-7")?.name, "Week Warrior");
});

test("the solver track counts SQL solves with coding ones", () => {
  const c = countersOfMe({ stats: { problemsSolved: 20, sqlSolved: 5, bugsFixed: 0, longestStreak: 0, currentStreak: 0 } });
  assert.equal(hasBadge(badgeById("solver-25")!, c), true);
  assert.equal(hasBadge(badgeById("solver-50")!, c), false);
});

test("the streak counts the current run when the longest has not caught up", () => {
  const c = countersOfMe({ stats: { longestStreak: 5, currentStreak: 7 } });
  assert.equal(hasBadge(badgeById("streak-7")!, c), true);
});

test("chests are the roadmap rewards on the payload; a missing stats row is zeros", () => {
  const c = countersOfMe({ stats: null, roadmapRewards: [{ tierKey: "a" }, { tierKey: "b" }] });
  assert.equal(hasBadge(badgeById("road-2")!, c), true);
  assert.equal(hasBadge(badgeById("road-3")!, c), false);
  assert.equal(hasBadge(badgeById("solver-1")!, c), false);
});

test("each badge reads as a phrase", () => {
  assert.equal(badgeFeat(badgeById("solver-1")!), "a first problem solved");
  assert.equal(badgeFeat(badgeById("hunter-10")!), "10 bugs fixed");
  assert.equal(badgeFeat(badgeById("streak-30")!), "a 30-day streak");
  assert.equal(badgeFeat(badgeById("road-4")!), "every roadmap chest opened");
  assert.equal(badgeFeat(badgeById("road-2")!), "2 roadmap chests opened");
});
