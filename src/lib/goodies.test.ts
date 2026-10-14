import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { CREDIT_PACKS } from "./plans.js";
import { GOODIES, MIN_ACCOUNT_DAYS, goodieFor, pointsOf, redeemRefusal, type PointFacts } from "./goodies.js";

const NONE: PointFacts = { codingSolves: [], sqlSolves: [], chests: [], credentials: [], tracks: [], spent: 0 };
const DAY = 86_400_000;
const NOW = new Date("2026-10-15T12:00:00+05:30");
const OLD = new Date(NOW.getTime() - 60 * DAY);

describe("pointsOf", () => {
  it("is zero for an account that has done nothing", () => {
    const p = pointsOf(NONE);
    assert.equal(p.earned, 0);
    assert.equal(p.balance, 0);
    assert.deepEqual(p.sources.map((s) => s.key), ["coding", "sql", "roadmap", "credentials", "tracks"]);
  });

  it("pays each source its own XP: solves 10/20/30 by difficulty, either spelling", () => {
    const p = pointsOf({ ...NONE, codingSolves: ["Easy", "medium", "HARD"], sqlSolves: ["easy", "Medium"], chests: [30, 50], credentials: [50, 100], tracks: [100] });
    const by = Object.fromEntries(p.sources.map((s) => [s.key, s]));
    assert.equal(by["coding"]!.points, 60);
    assert.equal(by["coding"]!.count, 3);
    assert.equal(by["sql"]!.points, 30);
    assert.equal(by["roadmap"]!.points, 80);
    assert.equal(by["roadmap"]!.count, 2);
    assert.equal(by["credentials"]!.points, 150);
    assert.equal(by["tracks"]!.points, 100);
    assert.equal(p.earned, 420);
  });

  it("takes redemptions off the balance and never shows it below zero", () => {
    assert.equal(pointsOf({ ...NONE, codingSolves: ["hard"], spent: 20 }).balance, 10);
    const over = pointsOf({ ...NONE, codingSolves: ["easy"], spent: 200 });
    assert.equal(over.balance, 0);
    // The race check in services/goodies reads the unclamped sum.
    assert.ok(over.earned - over.spent < 0);
  });

  it("ignores a negative amount rather than letting it eat the balance", () => {
    assert.equal(pointsOf({ ...NONE, chests: [-50, 30] }).earned, 30);
  });
});

describe("redeemRefusal", () => {
  const item = GOODIES[0]!;
  const ok = { emailVerified: true, createdAt: OLD, balance: item.points, item, now: NOW };

  it("admits a verified, old-enough account with the points", () => {
    assert.equal(redeemRefusal(ok), null);
  });

  it("asks for a verified email first", () => {
    assert.match(redeemRefusal({ ...ok, emailVerified: false, balance: 0 })!, /Verify your email/);
  });

  it("waits until the account is old enough and says how long", () => {
    const young = new Date(NOW.getTime() - (MIN_ACCOUNT_DAYS - 3) * DAY);
    assert.match(redeemRefusal({ ...ok, createdAt: young })!, /3 more days/);
    const almost = new Date(NOW.getTime() - (MIN_ACCOUNT_DAYS * DAY - 1000));
    assert.match(redeemRefusal({ ...ok, createdAt: almost })!, /1 more day\b/);
    assert.equal(redeemRefusal({ ...ok, createdAt: new Date(NOW.getTime() - MIN_ACCOUNT_DAYS * DAY) }), null);
  });

  it("says how many points are missing", () => {
    assert.match(redeemRefusal({ ...ok, balance: item.points - 1 })!, /1 more point for this/);
  });
});

describe("the catalogue", () => {
  it("has unique ids that goodieFor finds, and nothing else", () => {
    assert.equal(new Set(GOODIES.map((g) => g.id)).size, GOODIES.length);
    for (const g of GOODIES) assert.equal(goodieFor(g.id), g);
    assert.equal(goodieFor("nope"), null);
    assert.equal(goodieFor(undefined), null);
  });

  it("prices every item in positive whole points and credits, ≤ 40 characters of id (Redemption.itemId)", () => {
    for (const g of GOODIES) {
      assert.ok(Number.isInteger(g.points) && g.points > 0, g.id);
      assert.ok(Number.isInteger(g.credits) && g.credits > 0, g.id);
      assert.ok(g.id.length <= 40, g.id);
    }
  });

  it("never gives more credits than the largest pack sells", () => {
    const largest = Math.max(...CREDIT_PACKS.map((p) => p.credits));
    for (const g of GOODIES) assert.ok(g.credits <= largest, g.id);
  });
});
