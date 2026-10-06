import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bucketsOf, detailsSummary, eventsSummary, goalFilterWhere, onboardingDetail, onboardingRow, onboardingStatus } from "./admin-onboarding.js";

/**
 * The admin panel's reading of the onboarding answer (services/admin-onboarding.ts):
 * the status rule, the list filter, and how the grouped SQL rows become the
 * Analytics tab's buckets — the queries themselves run against MySQL only.
 */

describe("an account's onboarding status", () => {
  it("is unasked without a stamp, skipped with a stamp and no goal, answered with a goal", () => {
    assert.equal(onboardingStatus({ goal: null, onboardedAt: null }), "unasked");
    assert.equal(onboardingStatus({ goal: null, onboardedAt: new Date() }), "skipped");
    assert.equal(onboardingStatus({ goal: "placements", onboardedAt: new Date() }), "answered");
    // A value the app no longer knows reads as a skip, never as a goal.
    assert.equal(onboardingStatus({ goal: "jobs", onboardedAt: "2026-10-06T00:00:00Z" }), "skipped");
  });

  it("gives the list row only a valid goal and level, and the detail the checked details", () => {
    assert.deepEqual(onboardingRow({ goal: "product", level: "comfortable", onboardedAt: new Date() }), { status: "answered", goal: "product", level: "comfortable" });
    assert.deepEqual(onboardingRow({ goal: null, level: "new", onboardedAt: new Date() }), { status: "skipped", goal: null, level: null });
    const detail = onboardingDetail({ goal: "product", level: null, goalDetails: { companies: ["Amazon", "Nope"], language: "java" }, onboardedAt: new Date("2026-10-06T10:00:00Z"), createdAt: new Date("2026-10-06T09:00:00Z") });
    assert.deepEqual(detail.details, { companies: ["Amazon"] });
    assert.equal(detail.at, "2026-10-06T10:00:00.000Z");
    assert.equal(detail.ask, null);
    // Never answered: an account from before the question gets the dashboard's line, a new one /welcome.
    const old = onboardingDetail({ goal: null, level: null, goalDetails: null, onboardedAt: null, createdAt: new Date("2026-09-01T00:00:00Z") });
    assert.deepEqual([old.status, old.ask, old.at], ["unasked", "prompt", null]);
    assert.equal(onboardingDetail({ goal: null, level: null, goalDetails: null, onboardedAt: null, createdAt: new Date("2026-10-07T00:00:00Z") }).ask, "welcome");
  });

  it("filters the list by goal or status", () => {
    assert.deepEqual(goalFilterWhere("language"), { goal: "language" });
    assert.deepEqual(goalFilterWhere("unasked"), { onboardedAt: null });
    assert.deepEqual(goalFilterWhere("skipped"), { onboardedAt: { not: null }, goal: null });
  });
});

describe("the window's report", () => {
  it("folds the grouped split into the six buckets, in order, with levels and first-week activity", () => {
    const buckets = bucketsOf([
      // Counts arrive as BIGINT, DECIMAL-as-number or strings depending on the expression.
      { goal: "placements", level: "new", answered: 1n, accounts: 3n, matured: 2, active: 2, maturedActive: 1 },
      { goal: "placements", level: null, answered: 1n, accounts: 1n, matured: 0, active: 0, maturedActive: 0 },
      { goal: "practice", level: "some", answered: 1, accounts: "2", matured: "2", active: "1", maturedActive: "1" },
      { goal: null, level: null, answered: 1n, accounts: 4n, matured: 4, active: 1, maturedActive: 1 },
      { goal: null, level: null, answered: 0n, accounts: 10n, matured: 9, active: 3, maturedActive: 2 },
    ]);
    assert.deepEqual(buckets.map((b) => b.key), ["placements", "product", "language", "practice", "skipped", "unasked"]);
    const placements = buckets[0];
    assert.equal(placements.accounts, 4);
    assert.deepEqual(placements.levels, { new: 3, some: 0, comfortable: 0, unset: 1 });
    assert.deepEqual([placements.matured, placements.activated, placements.activeSoFar], [2, 1, 2]);
    assert.equal(buckets[1].accounts, 0);
    assert.deepEqual([buckets[3].accounts, buckets[3].levels.some], [2, 2]);
    assert.deepEqual([buckets[4].accounts, buckets[4].activated], [4, 1]);
    assert.deepEqual([buckets[5].accounts, buckets[5].matured, buckets[5].activated, buckets[5].activeSoFar], [10, 9, 2, 3]);
    // Levels are a goal's; the statuses carry none.
    assert.deepEqual(buckets[5].levels, { new: 0, some: 0, comfortable: 0, unset: 0 });
  });

  it("tallies the companies and languages named, checked like the app reads them", () => {
    const s = detailsSummary([
      { goal: "placements", goalDetails: { companies: ["TCS", "Infosys"] } },
      { goal: "placements", goalDetails: { companies: ["TCS"] } },
      { goal: "product", goalDetails: { companies: ["TCS", "Facebook", "Unknown Co"] } },
      { goal: "language", goalDetails: { language: "python" } },
      { goal: "language", goalDetails: { language: "rust" } },
    ]);
    assert.deepEqual(s.companies[0], { company: "TCS", placements: 2, product: 1 });
    // Renames apply (Facebook → Meta); unknown names are dropped.
    assert.ok(s.companies.some((c) => c.company === "Meta"));
    assert.ok(!s.companies.some((c) => c.company === "Unknown Co"));
    assert.deepEqual(s.languages, [{ language: "python", count: 1 }]);
  });

  it("sums the onboarding events: skips, and guesses kept among answers that had one; later changes apart", () => {
    const e = eventsSummary([
      { goal: "placements", prefilled: "true", keptGuess: "true", skipped: "false", edit: "false", source: "welcome", n: 5n },
      { goal: "product", prefilled: "true", keptGuess: "false", skipped: "false", edit: "false", source: "welcome", n: 3n },
      { goal: "practice", prefilled: "false", keptGuess: "false", skipped: "false", edit: "false", source: "welcome", n: 1n },
      { goal: null, prefilled: "true", keptGuess: "false", skipped: "true", edit: "false", source: "welcome", n: 2n },
      // The dashboard line's "Not now" sends only { skipped, source }.
      { goal: null, prefilled: null, keptGuess: null, skipped: "true", edit: null, source: "prompt", n: 4n },
      // A change from the profile: no guess, not a first decision.
      { goal: "language", prefilled: "false", keptGuess: "false", skipped: "false", edit: "true", source: "welcome", n: 3n },
      { goal: "language", prefilled: null, keptGuess: null, skipped: null, edit: null, source: null, n: 1 },
    ]);
    assert.deepEqual([e.total, e.answered, e.skipped, e.prefilled, e.keptGuess, e.changes], [16, 10, 6, 8, 5, 3]);
    assert.deepEqual(e.sources, [
      { source: "welcome", total: 11, skipped: 2 },
      { source: "prompt", total: 4, skipped: 4 },
      { source: "unknown", total: 1, skipped: 0 },
    ]);
  });
});
