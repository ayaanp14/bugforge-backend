import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_GOAL_COMPANIES, ONBOARDING_LAUNCH, detailsFor, normalizeCompany, onboardingStateOf, parseOnboarding } from "./onboarding.js";

/**
 * The onboarding answer's rules: what PUT /api/me/onboarding accepts, how the
 * stored Json is read back, and when the SPA is told to ask. The column is
 * Json and the body is a stranger's, so every path here is a guard.
 *
 * Run with: npm test
 */

const row = (over: Partial<Parameters<typeof onboardingStateOf>[0]> = {}) => ({
  goal: null,
  level: null,
  goalDetails: null,
  onboardedAt: null,
  createdAt: ONBOARDING_LAUNCH,
  ...over,
});

describe("parseOnboarding", () => {
  it("takes a skip", () => {
    assert.deepEqual(parseOnboarding({ skip: true }), { ok: true, value: { skip: true } });
  });

  it("takes an answer, with the level optional", () => {
    assert.deepEqual(parseOnboarding({ goal: "practice" }), { ok: true, value: { skip: false, goal: "practice", level: null, details: {} } });
    assert.deepEqual(parseOnboarding({ goal: "product", level: "some", details: { companies: ["Amazon", "Google"] } }), {
      ok: true,
      value: { skip: false, goal: "product", level: "some", details: { companies: ["Amazon", "Google"] } },
    });
  });

  it("refuses a body that is not an object", () => {
    for (const body of [null, undefined, "placements", 3, ["placements"]]) {
      assert.equal(parseOnboarding(body).ok, false, JSON.stringify(body));
    }
  });

  it("refuses an unknown goal, level or language, and a skip that is not literally true", () => {
    assert.equal(parseOnboarding({ goal: "fun" }).ok, false);
    assert.equal(parseOnboarding({ goal: "Placements" }).ok, false);
    assert.equal(parseOnboarding({ goal: "practice", level: "expert" }).ok, false);
    assert.equal(parseOnboarding({ goal: "language", details: { language: "rust" } }).ok, false);
    assert.equal(parseOnboarding({ skip: "true" }).ok, false);
  });

  it("refuses details or companies of the wrong shape", () => {
    assert.equal(parseOnboarding({ goal: "product", details: ["Amazon"] }).ok, false);
    assert.equal(parseOnboarding({ goal: "product", details: "Amazon" }).ok, false);
    assert.equal(parseOnboarding({ goal: "product", details: { companies: "Amazon" } }).ok, false);
  });

  it("drops unknown companies rather than refusing the answer", () => {
    const parsed = parseOnboarding({ goal: "placements", details: { companies: ["TCS", "Initech", 42, "Infosys"] } });
    assert.deepEqual(parsed, { ok: true, value: { skip: false, goal: "placements", level: null, details: { companies: ["TCS", "Infosys"] } } });
  });

  it("keeps only what the goal uses", () => {
    const parsed = parseOnboarding({ goal: "language", details: { language: "java", companies: ["Amazon"] } });
    assert.deepEqual(parsed, { ok: true, value: { skip: false, goal: "language", level: null, details: { language: "java" } } });
  });
});

describe("detailsFor", () => {
  it("drops the companies when the goal no longer uses them", () => {
    const stored = { companies: ["Amazon", "Google"] };
    assert.deepEqual(detailsFor("product", stored), { companies: ["Amazon", "Google"] });
    assert.deepEqual(detailsFor("language", stored), {});
    assert.deepEqual(detailsFor("practice", stored), {});
    assert.deepEqual(detailsFor(null, stored), {});
  });

  it("drops unknown companies, duplicates and anything past the cap", () => {
    assert.deepEqual(detailsFor("product", { companies: ["Amazon", "Initech", "Amazon", "  Google  "] }), { companies: ["Amazon", "Google"] });
    const many = ["Amazon", "Google", "Adobe", "Microsoft", "Meta", "Apple", "Uber"];
    assert.equal(detailsFor("product", { companies: many }).companies?.length, MAX_GOAL_COMPANIES);
  });

  it("renames a company the catalogue renamed — Facebook is Meta", () => {
    assert.equal(normalizeCompany("Facebook"), "Meta");
    assert.deepEqual(detailsFor("product", { companies: ["Facebook", "Meta"] }), { companies: ["Meta"] });
  });

  it("reads anything else in the Json column as nothing", () => {
    for (const raw of [null, undefined, "Amazon", 7, ["Amazon"], { companies: "Amazon" }, { language: "rust" }]) {
      assert.deepEqual(detailsFor("product", raw), {});
      assert.deepEqual(detailsFor("language", raw), {});
    }
  });

  it("keeps a known language for the language goal", () => {
    assert.deepEqual(detailsFor("language", { language: "cpp" }), { language: "cpp" });
  });
});

describe("onboardingStateOf", () => {
  it("asks a new account to the welcome page, from the launch instant on", () => {
    assert.equal(onboardingStateOf(row({ createdAt: ONBOARDING_LAUNCH })).ask, "welcome");
    assert.equal(onboardingStateOf(row({ createdAt: new Date(ONBOARDING_LAUNCH.getTime() + 60_000) })).ask, "welcome");
  });

  it("asks an older account with the dashboard line instead", () => {
    assert.equal(onboardingStateOf(row({ createdAt: new Date(ONBOARDING_LAUNCH.getTime() - 1) })).ask, "prompt");
    assert.equal(onboardingStateOf(row({ createdAt: "2025-01-01T00:00:00.000Z" })).ask, "prompt");
  });

  it("never asks once answered or skipped, whatever the account's age", () => {
    const at = new Date("2026-10-07T10:00:00.000Z");
    assert.equal(onboardingStateOf(row({ onboardedAt: at })).ask, null);
    assert.equal(onboardingStateOf(row({ onboardedAt: at, createdAt: new Date("2024-01-01") })).ask, null);
    assert.equal(onboardingStateOf(row({ onboardedAt: at })).answeredAt, at.toISOString());
  });

  it("reads a skip as answered with no goal", () => {
    const state = onboardingStateOf(row({ onboardedAt: new Date() }));
    assert.equal(state.goal, null);
    assert.equal(state.ask, null);
  });

  it("reads unknown stored values as unset rather than passing them on", () => {
    const state = onboardingStateOf(row({ goal: "fun", level: "expert", goalDetails: { companies: ["Amazon"] } }));
    assert.deepEqual({ goal: state.goal, level: state.level, details: state.details }, { goal: null, level: null, details: {} });
  });

  it("shapes a stored answer", () => {
    const state = onboardingStateOf(row({ goal: "placements", level: "new", goalDetails: { companies: ["TCS", "Facebook"] }, onboardedAt: new Date("2026-10-06T12:00:00Z") }));
    assert.deepEqual(state, {
      goal: "placements",
      level: "new",
      details: { companies: ["TCS", "Meta"] },
      answeredAt: "2026-10-06T12:00:00.000Z",
      ask: null,
    });
  });
});
