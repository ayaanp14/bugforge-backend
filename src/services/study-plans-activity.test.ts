import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { firstToday } from "./study-plans.js";

/**
 * The once-a-day memo behind the study band's dashboard drop: the first
 * write of a (user, track) on a UTC day answers true, the rest of that day
 * false, and the next day starts over. No database.
 *
 * Run with: npx tsx --test src/services/study-plans-activity.test.ts
 */
describe("firstToday", () => {
  const morning = new Date("2026-10-03T00:00:00.000Z");
  const night = new Date("2026-10-03T23:59:59.999Z");
  const nextDay = new Date("2026-10-04T00:00:00.000Z");

  it("answers true once per key per UTC day", () => {
    const memo = new Map<string, number>();
    assert.equal(firstToday(memo, "u1:java", morning), true);
    assert.equal(firstToday(memo, "u1:java", morning), false);
    assert.equal(firstToday(memo, "u1:java", night), false);
    assert.equal(firstToday(memo, "u1:java", nextDay), true);
    assert.equal(firstToday(memo, "u1:java", nextDay), false);
  });

  it("keeps keys apart", () => {
    const memo = new Map<string, number>();
    assert.equal(firstToday(memo, "u1:java", morning), true);
    assert.equal(firstToday(memo, "u1:javascript", morning), true);
    assert.equal(firstToday(memo, "u2:java", morning), true);
    assert.equal(firstToday(memo, "u1:java", morning), false);
  });

  it("stays bounded: a full clear at the cap, after which a key answers true again", () => {
    const memo = new Map<string, number>();
    for (let i = 0; i < 3; i++) assert.equal(firstToday(memo, `u${i}`, morning, 3), true);
    assert.equal(memo.size, 3);
    // The fourth key clears the memo before it is recorded.
    assert.equal(firstToday(memo, "u3", morning, 3), true);
    assert.equal(memo.size, 1);
    assert.equal(firstToday(memo, "u0", morning, 3), true);
  });
});
