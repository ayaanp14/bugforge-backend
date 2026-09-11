import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { FREE_PLAN, OWNER_PLAN, PLANS, isOwnerEmail, isPaidPlan, periodEnd, planFor, priceOf } from "./plans.js";
import { dayStart, weekStart } from "../services/entitlements.js";

/**
 * The plan table decides what people are charged and what they are refused, so
 * the prices and the entitlement ladder are asserted rather than trusted to a
 * careful edit.
 */

describe("plan catalogue", () => {
  it("prices the paid tiers exactly as agreed", () => {
    assert.equal(planFor("starter").monthly, 199);
    assert.equal(planFor("pro").monthly, 399);
    assert.equal(planFor("elite").monthly, 799);
    assert.equal(FREE_PLAN.monthly, 0);
  });

  it("gives two free months on a yearly plan", () => {
    for (const plan of PLANS.filter((p) => p.monthly > 0)) {
      assert.equal(plan.yearly, plan.monthly * 10, `${plan.id} yearly should be ten months`);
    }
  });

  it("offers exactly four tiers, one of them free", () => {
    assert.equal(PLANS.length, 4);
    assert.equal(PLANS.filter((p) => p.monthly === 0).length, 1);
  });

  it("treats an unknown or missing plan id as free, never as paid", () => {
    assert.equal(planFor("enterprise").id, "free");
    assert.equal(planFor(null).id, "free");
    assert.equal(planFor(undefined).id, "free");
    assert.equal(planFor("").id, "free");
  });

  it("refuses to sell the free tier", () => {
    assert.equal(isPaidPlan("free"), false);
    assert.equal(isPaidPlan("nonsense"), false);
    assert.equal(isPaidPlan("starter"), true);
  });

  it("charges the catalogue price for the period asked for", () => {
    const pro = planFor("pro");
    assert.equal(priceOf(pro, "monthly"), 399);
    assert.equal(priceOf(pro, "yearly"), 3990);
  });
});

describe("free tier entitlements", () => {
  it("matches what free was promised", () => {
    const free = FREE_PLAN.entitlements;
    assert.equal(free.interviewsPerWeek, 2);
    assert.equal(free.bugsPerDay, 1);
    assert.deepEqual(free.voiceDurationsMin, [10]);
    // Unlimited, on every plan including this one.
    assert.equal(free.problemsPerDay, null);
    assert.equal(free.duelsPerDay, null);
  });

  it("never restricts problems or duels on any plan", () => {
    for (const plan of PLANS) {
      assert.equal(plan.entitlements.problemsPerDay, null, `${plan.id} problems`);
      assert.equal(plan.entitlements.duelsPerDay, null, `${plan.id} duels`);
    }
  });
});

describe("entitlement ladder", () => {
  const order = ["free", "starter", "pro", "elite"];

  it("never decreases as the price increases", () => {
    let previousInterviews = -1;
    let previousBugs = -1;
    let previousDurations = 0;

    for (const id of order) {
      const e = planFor(id).entitlements;
      // null is unlimited, which is the top of the ladder.
      const interviews = e.interviewsPerWeek ?? Number.POSITIVE_INFINITY;
      const bugs = e.bugsPerDay ?? Number.POSITIVE_INFINITY;

      assert.ok(interviews >= previousInterviews, `${id} interviews went backwards`);
      assert.ok(bugs >= previousBugs, `${id} bugs went backwards`);
      assert.ok(e.voiceDurationsMin.length >= previousDurations, `${id} durations went backwards`);

      previousInterviews = interviews;
      previousBugs = bugs;
      previousDurations = e.voiceDurationsMin.length;
    }
  });

  it("only lifts every limit on the top tier", () => {
    const elite = planFor("elite").entitlements;
    assert.equal(elite.interviewsPerWeek, null);
    assert.equal(elite.bugsPerDay, null);
    assert.deepEqual(elite.voiceDurationsMin, [10, 20, 30]);
  });

  it("includes the ten minute round on every plan, so free is never locked out", () => {
    for (const plan of PLANS) {
      assert.ok(plan.entitlements.voiceDurationsMin.includes(10), `${plan.id} lost the 10 min round`);
    }
  });
});

describe("periodEnd", () => {
  it("adds a calendar month, not thirty days", () => {
    const end = periodEnd(new Date("2026-01-31T10:00:00Z"), "monthly");
    // JS rolls 31 Feb forward; the point is that it is a month later, not +30d.
    assert.ok(end > new Date("2026-02-27T10:00:00Z"));
    assert.ok(end < new Date("2026-03-10T10:00:00Z"));
  });

  it("clamps to the last day of a shorter month rather than rolling into the next", () => {
    const end = periodEnd(new Date("2026-01-31T10:00:00Z"), "monthly");
    assert.equal(end.getMonth(), 1); // February, not March
    assert.equal(end.getDate(), 28);
    const fromMarch = periodEnd(new Date("2026-03-31T10:00:00Z"), "monthly");
    assert.equal(fromMarch.getMonth(), 3);
    assert.equal(fromMarch.getDate(), 30);
  });

  it("adds a year for a yearly period", () => {
    const end = periodEnd(new Date("2026-05-10T00:00:00Z"), "yearly");
    assert.equal(end.getFullYear(), 2027);
  });

  it("extends from the date given, so renewing early does not lose time", () => {
    const futureExpiry = new Date("2026-12-01T00:00:00Z");
    const extended = periodEnd(futureExpiry, "monthly");
    assert.ok(extended > futureExpiry);
  });
});

// The windows are anchored to IST (UTC+05:30) whatever the server's zone, so
// the expectations are written as instants rather than local fields.
describe("quota windows", () => {
  it("starts the week on Monday 00:00 IST", () => {
    // A Wednesday afternoon in India.
    const start = weekStart(new Date("2026-09-09T15:00:00+05:30"));
    assert.equal(start.toISOString(), new Date("2026-09-07T00:00:00+05:30").toISOString());
  });

  it("puts Sunday in the week that began six days earlier, not a new one", () => {
    const sunday = new Date("2026-09-13T23:00:00+05:30");
    const start = weekStart(sunday);
    // Monday the 7th, not the 14th.
    assert.equal(start.toISOString(), new Date("2026-09-07T00:00:00+05:30").toISOString());
  });

  it("starts the day at IST midnight, not the server's", () => {
    const start = dayStart(new Date("2026-09-09T23:59:00+05:30"));
    assert.equal(start.toISOString(), new Date("2026-09-09T00:00:00+05:30").toISOString());
    // 01:00 IST is still 19:30 UTC the day before; the window must not have rolled.
    const early = dayStart(new Date("2026-09-10T01:00:00+05:30"));
    assert.equal(early.toISOString(), new Date("2026-09-10T00:00:00+05:30").toISOString());
  });
});

describe("owner accounts", () => {
  it("always includes the built-in owners, case-insensitively", () => {
    assert.equal(isOwnerEmail("ayaanpathan14@gmail.com", {}), true);
    assert.equal(isOwnerEmail("  AyaanPathan14@Gmail.com ", {}), true);
    assert.equal(isOwnerEmail("kingsenterprises1414@gmail.com", {}), true);
    assert.equal(isOwnerEmail(" KingsEnterprises1414@Gmail.com ", {}), true);
    assert.equal(isOwnerEmail("someone@example.com", {}), false);
    assert.equal(isOwnerEmail(null, {}), false);
    assert.equal(isOwnerEmail("", {}), false);
  });

  it("adds the comma-separated OWNER_EMAILS", () => {
    const env = { OWNER_EMAILS: "a@x.com, B@Y.com ,," };
    assert.equal(isOwnerEmail("a@x.com", env), true);
    assert.equal(isOwnerEmail("b@y.com", env), true);
    assert.equal(isOwnerEmail("ayaanpathan14@gmail.com", env), true);
    assert.equal(isOwnerEmail("c@z.com", env), false);
  });

  it("has no ceilings and cannot be bought or listed", () => {
    const e = OWNER_PLAN.entitlements;
    assert.equal(e.interviewsPerWeek, null);
    assert.equal(e.bugsPerDay, null);
    assert.equal(e.problemsPerDay, null);
    assert.equal(e.duelsPerDay, null);
    assert.deepEqual(e.voiceDurationsMin, [10, 20, 30]);
    assert.equal(isPaidPlan("owner"), false);
    assert.equal(PLANS.some((plan) => plan.id === "owner"), false);
    // A subscription row claiming "owner" grants nothing: only the allow-list does.
    assert.equal(planFor("owner").id, "free");
  });
});
