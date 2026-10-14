import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CREDIT_COSTS,
  CREDIT_PACKS,
  FREE_FOR_ALL_UNTIL,
  FREE_PLAN,
  LIFTED_ENTITLEMENTS,
  METERED_ACTIONS,
  OWNER_PLAN,
  PLANS,
  PLAN_OFFERS,
  allowanceLabel,
  creditPackFor,
  freeForAll,
  isOwnerEmail,
  isPaidPlan,
  offerFor,
  periodEnd,
  planFor,
  planOfSubscription,
  tierOf,
  withFreeForAll,
} from "./plans.js";
import { dayStart, weekStart } from "../services/entitlements.js";

/**
 * The plan table decides what people are charged and what they are refused, so
 * the prices and the entitlement ladder are asserted rather than trusted to a
 * careful edit.
 */

describe("plan catalogue", () => {
  it("sells Pro, the passes and the credit packs at exactly the agreed prices (2026-10-15)", () => {
    const price = (id: string) => PLAN_OFFERS.find((o) => o.id === id)?.price;
    assert.equal(price("pro-monthly"), 149);
    assert.equal(price("pro-quarterly"), 399);
    assert.equal(price("pro-yearly"), 999);
    assert.equal(price("max-monthly"), 399);
    assert.equal(price("max-quarterly"), 999);
    assert.equal(price("max-yearly"), 2999);
    assert.equal(offerFor("max-yearly")!.bonusCredits, 600);
    assert.equal(price("sprint"), 99);
    assert.equal(price("season"), 699);
    assert.deepEqual(
      CREDIT_PACKS.map((p) => [p.id, p.price, p.credits]),
      [
        ["credits-100", 99, 100],
        ["credits-300", 249, 300],
        ["credits-700", 499, 700],
      ],
    );
    assert.deepEqual(CREDIT_COSTS, { resumeAnalysis: 10, placementMock: 20, writtenInterview: 15, voiceInterview: 40, simulation: 60 });
  });

  it("makes a longer commitment cheaper per month, so the ladder reads right", () => {
    const perMonth = (id: string) => {
      const o = offerFor(id)!;
      return o.price / (o.months ?? 1);
    };
    assert.ok(perMonth("pro-quarterly") < perMonth("pro-monthly"));
    assert.ok(perMonth("pro-yearly") < perMonth("pro-quarterly"));
    assert.ok(perMonth("season") < perMonth("pro-monthly"));
    assert.ok(perMonth("max-quarterly") < perMonth("max-monthly"));
    assert.ok(perMonth("max-yearly") < perMonth("max-quarterly"));
  });

  it("lists Free, Pro and Pro Max; the old Starter and Elite resolve but cannot be bought", () => {
    assert.deepEqual(PLANS.map((p) => p.id), ["free", "pro", "max"]);
    assert.equal(isPaidPlan("max"), true);
    assert.ok(tierOf("max") > tierOf("pro") && tierOf("elite") > tierOf("max"));
    assert.equal(planFor("starter").name, "Starter");
    assert.equal(planFor("elite").name, "Elite");
    assert.equal(isPaidPlan("starter"), false);
    assert.equal(isPaidPlan("elite"), false);
    assert.equal(isPaidPlan("pro"), true);
    assert.ok(tierOf("elite") > tierOf("pro"));
    assert.equal(tierOf("starter"), tierOf("pro"));
  });

  it("keeps Pro as it was sold for a subscription bought before 15 October 2026", () => {
    assert.deepEqual(planOfSubscription("pro", "monthly").entitlements.allowances.voiceInterview, { limit: 20, days: 7 });
    assert.deepEqual(planOfSubscription("pro", "yearly").entitlements.allowances.voiceInterview, { limit: 20, days: 7 });
    assert.deepEqual(planOfSubscription("pro", "pro-monthly").entitlements.allowances.voiceInterview, { limit: 8, days: 30 });
    assert.deepEqual(planOfSubscription("pro", "season").entitlements.allowances.voiceInterview, { limit: 8, days: 30 });
    assert.equal(planOfSubscription("elite", "monthly").entitlements.allowances.voiceInterview.limit, null);
  });

  it("treats an unknown or missing plan id as free, never as paid", () => {
    assert.equal(planFor("enterprise").id, "free");
    assert.equal(planFor(null).id, "free");
    assert.equal(planFor(undefined).id, "free");
    assert.equal(planFor("").id, "free");
    assert.equal(isPaidPlan("free"), false);
    assert.equal(isPaidPlan("nonsense"), false);
    assert.equal(offerFor("pro-weekly"), null);
    assert.equal(creditPackFor("credits-1"), null);
  });
});

describe("allowances", () => {
  it("gives Free exactly what the owner set", () => {
    const a = FREE_PLAN.entitlements.allowances;
    assert.deepEqual(a.resumeAnalysis, { limit: 1, days: 7 });
    assert.deepEqual(a.placementMock, { limit: 1, days: 10 });
    assert.deepEqual(a.writtenInterview, { limit: 1, days: 7 });
    assert.deepEqual(a.voiceInterview, { limit: 1, days: 10 });
    assert.deepEqual(a.simulation, { limit: 1, days: 14 });
    assert.deepEqual(FREE_PLAN.entitlements.skillTestLevels, ["basic"]);
    assert.equal(FREE_PLAN.entitlements.resumeExport, false);
  });

  it("gives Pro exactly what the owner set, voice capped even there", () => {
    const a = planFor("pro").entitlements.allowances;
    assert.deepEqual(a.resumeAnalysis, { limit: 1, days: 1 });
    assert.deepEqual(a.placementMock, { limit: 1, days: 2 });
    assert.equal(a.writtenInterview.limit, null);
    assert.deepEqual(a.voiceInterview, { limit: 8, days: 30 });
    assert.deepEqual(a.simulation, { limit: 5, days: 30 });
    assert.equal(planFor("pro").entitlements.skillTestLevels, null);
  });

  it("never gives a higher plan less than a lower one, per day of window", () => {
    for (const action of METERED_ACTIONS) {
      const rate = (id: string) => {
        const { limit, days } = planFor(id).entitlements.allowances[action];
        return limit === null ? Number.POSITIVE_INFINITY : limit / days;
      };
      assert.ok(rate("pro") >= rate("free"), action);
      assert.ok(rate("max") >= rate("pro"), action);
    }
  });

  it("never restricts problems, duels or bug hunts on any plan", () => {
    for (const plan of PLANS) {
      assert.equal(plan.entitlements.problemsPerDay, null, `${plan.id} problems`);
      assert.equal(plan.entitlements.duelsPerDay, null, `${plan.id} duels`);
      assert.equal(plan.entitlements.bugsPerDay, null, `${plan.id} bugs`);
      assert.ok(plan.entitlements.voiceDurationsMin.includes(10), `${plan.id} lost the 10 min round`);
    }
  });

  it("words each window the way the pricing page prints it", () => {
    assert.equal(allowanceLabel({ limit: 1, days: 7 }), "1 a week");
    assert.equal(allowanceLabel({ limit: 1, days: 10 }), "1 every 10 days");
    assert.equal(allowanceLabel({ limit: 1, days: 14 }), "1 every 2 weeks");
    assert.equal(allowanceLabel({ limit: 1, days: 1 }), "1 a day");
    assert.equal(allowanceLabel({ limit: 1, days: 2 }), "1 every 2 days");
    assert.equal(allowanceLabel({ limit: 8, days: 30 }), "8 a month");
    assert.equal(allowanceLabel({ limit: null, days: 30 }), "Unlimited");
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

  it("runs each offer for its own length", () => {
    const from = new Date("2026-10-15T10:00:00Z");
    assert.equal(periodEnd(from, "sprint").toISOString(), "2026-10-22T10:00:00.000Z");
    assert.equal(periodEnd(from, "pro-quarterly").getMonth(), 0); // January
    assert.equal(periodEnd(from, "season").getMonth(), 3); // April
    assert.equal(periodEnd(from, "pro-yearly").getFullYear(), 2027);
    assert.equal(periodEnd(from, "pro-monthly").getMonth(), periodEnd(from, "monthly").getMonth());
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
    assert.equal(isOwnerEmail("tabassump8319@gmail.com", {}), true);
    assert.equal(isOwnerEmail("  TabassumP8319@Gmail.com ", {}), true);
    assert.equal(isOwnerEmail("ayaanpathan14@gmail.com", {}), true);
    assert.equal(isOwnerEmail(" AyaanPathan14@Gmail.com ", {}), true);
    assert.equal(isOwnerEmail("someone@example.com", {}), false);
    assert.equal(isOwnerEmail(null, {}), false);
    assert.equal(isOwnerEmail("", {}), false);
  });

  it("adds the comma-separated OWNER_EMAILS", () => {
    const env = { OWNER_EMAILS: "a@x.com, B@Y.com ,," };
    assert.equal(isOwnerEmail("a@x.com", env), true);
    assert.equal(isOwnerEmail("b@y.com", env), true);
    assert.equal(isOwnerEmail("tabassump8319@gmail.com", env), true);
    assert.equal(isOwnerEmail("c@z.com", env), false);
  });

  it("has no ceilings and cannot be bought or listed", () => {
    const e = OWNER_PLAN.entitlements;
    for (const action of METERED_ACTIONS) assert.equal(e.allowances[action].limit, null, action);
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

describe("free-for-all period", () => {
  const before = new Date("2026-12-31T23:59:59+05:30");
  const at = new Date("2027-01-01T00:00:00+05:30");

  it("runs until midnight IST on 1 January 2027 and not a second longer", () => {
    assert.equal(freeForAll(before).active, true);
    assert.equal(freeForAll(at).active, false);
    assert.equal(freeForAll(new Date("2026-10-01T00:00:00Z")).active, true);
    // Midnight in India is still the previous evening in UTC: the instant is the Indian one.
    assert.equal(FREE_FOR_ALL_UNTIL.toISOString(), "2026-12-31T18:30:00.000Z");
    assert.equal(freeForAll(before).until, FREE_FOR_ALL_UNTIL.toISOString());
  });

  it("names the date the way it is read in India", () => {
    assert.equal(freeForAll(before).untilLabel, "1 January 2027");
  });

  it("lifts every limit on every listed plan while it runs, keeping the plan's identity and prices", () => {
    for (const plan of PLANS) {
      const lifted = withFreeForAll(plan, before);
      assert.equal(lifted.id, plan.id);
      assert.equal(lifted.name, plan.name);
      assert.deepEqual(lifted.entitlements, LIFTED_ENTITLEMENTS, `${plan.id} lifted`);
      assert.deepEqual(lifted.entitlements.voiceDurationsMin, [10, 20, 30]);
    }
    // The table itself is untouched: the pricing page still lists Free's real limits.
    assert.deepEqual(FREE_PLAN.entitlements.allowances.placementMock, { limit: 1, days: 10 });
  });

  it("hands the plan back unchanged once the period is over, and never touches the owner plan", () => {
    assert.equal(withFreeForAll(FREE_PLAN, at), FREE_PLAN);
    assert.equal(withFreeForAll(planFor("pro"), at), planFor("pro"));
    assert.equal(withFreeForAll(OWNER_PLAN, before), OWNER_PLAN);
  });
});
