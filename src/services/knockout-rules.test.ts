import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bracketSize, firstRound, nextSlot, placementLabel, problemForRound, roundName, roundsFor, seedOrder, timeoutWinner } from "./knockout-rules.js";

/** The knockout's pure rules (knockout-rules.ts), without a database. Run with: npm test */

describe("bracket shape", () => {
  it("rounds the field up to a power of two", () => {
    assert.deepEqual([2, 3, 5, 8, 9, 33].map(bracketSize), [2, 4, 8, 8, 16, 64]);
    assert.equal(roundsFor(16), 4);
  });

  it("seeds so the top two can only meet in the final", () => {
    assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
    assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
    const order = seedOrder(16);
    assert.ok(order.indexOf(1) < 8 && order.indexOf(2) >= 8, "1 and 2 in opposite halves");
  });

  it("gives the byes to the top seeds, never two in one match", () => {
    const matches = firstRound(["p1", "p2", "p3", "p4", "p5", "p6"]);
    assert.equal(matches.length, 4);
    const byes = matches.filter((m) => !m.a || !m.b).map((m) => (m.a ?? m.b)!.seed);
    assert.deepEqual(byes.sort(), [1, 2]);
    assert.ok(matches.every((m) => m.a || m.b));
    assert.deepEqual(matches[1], { position: 1, a: { player: "p4", seed: 4 }, b: { player: "p5", seed: 5 } });
  });

  it("sends a winner to the right slot of the next round", () => {
    assert.deepEqual(nextSlot(1, 0, 3), { round: 2, position: 0, side: "a" });
    assert.deepEqual(nextSlot(1, 3, 3), { round: 2, position: 1, side: "b" });
    assert.equal(nextSlot(3, 0, 3), null);
  });

  it("names the rounds and places the players", () => {
    assert.deepEqual([1, 2, 3, 4].map((r) => roundName(r, 4)), ["Round of 16", "Quarterfinal", "Semifinal", "Final"]);
    assert.equal(placementLabel(4, true, 4), "Champion");
    assert.equal(placementLabel(4, false, 4), "Runner-up");
    assert.equal(placementLabel(3, false, 4), "Semifinalist");
    assert.equal(placementLabel(1, false, 4), "Round of 16");
  });

  it("plays the problem set in order, wrapping", () => {
    assert.equal(problemForRound(["A", "B"], 1), "A");
    assert.equal(problemForRound(["A", "B"], 3), "A");
    assert.equal(problemForRound([], 1), null);
  });
});

describe("timeoutWinner", () => {
  const at = (s: number) => new Date(Date.UTC(2026, 9, 6, 10, 0, s));
  it("prefers more cases passed", () => {
    assert.equal(timeoutWinner({ seed: 1, passed: 10, bestAt: at(5) }, { seed: 2, passed: 40, bestAt: at(50) }), "b");
  });
  it("then whoever reached that score first", () => {
    assert.equal(timeoutWinner({ seed: 1, passed: 40, bestAt: at(50) }, { seed: 2, passed: 40, bestAt: at(20) }), "b");
  });
  it("beats a no-show with any attempt, and falls back to the better seed", () => {
    assert.equal(timeoutWinner({ seed: 1, passed: 0, bestAt: null }, { seed: 8, passed: 0, bestAt: at(3) }), "b");
    assert.equal(timeoutWinner({ seed: 5, passed: 0, bestAt: null }, { seed: 4, passed: 0, bestAt: null }), "b");
  });
});
