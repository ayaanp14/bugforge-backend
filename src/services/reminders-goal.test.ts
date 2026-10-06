import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { digestGoalLine, goalLineOf, weeklyDigestContent, type DigestTest } from "./reminders.js";

/**
 * The weekly digest's goal line (services/reminders.ts digestGoalLine): one
 * suggestion per goal, built from the goal and its details alone — the
 * columns the recipients query already selects. Kept apart from
 * reminders.test.ts, which pins the windows and the rest of the copy.
 */

// In catalogue order, as the job reads them.
const tests: DigestTest[] = [
  { slug: "tcs-nqt-foundation", name: "TCS NQT — Foundation", company: "TCS" },
  { slug: "tcs-nqt-full", name: "TCS NQT — Full", company: "TCS" },
  { slug: "hcltech-aptitude-technical", name: "HCLTech Aptitude + Technical", company: "HCLTech" },
];

describe("the digest's goal line", () => {
  it("placements: the first chosen company with a placement test (the plan's paper), else aptitude", () => {
    assert.deepEqual(digestGoalLine("placements", { companies: ["TCS", "Infosys"] }, tests), {
      text: "Preparing for TCS: sit the TCS NQT — Foundation placement test under the clock this week.",
      href: "/tests/tcs-nqt-foundation",
    });
    // The catalogue's "HCL" is the test's "HCLTech"; a first choice without a paper gives way to one with.
    assert.equal(digestGoalLine("placements", { companies: ["HCL"] }, tests)?.href, "/tests/hcltech-aptitude-technical");
    assert.equal(digestGoalLine("placements", { companies: ["Zoho", "TCS"] }, tests)?.href, "/tests/tcs-nqt-foundation");
    assert.deepEqual(digestGoalLine("placements", { companies: ["Zoho"] }, tests), {
      text: "Preparing for Zoho: an aptitude section a day keeps the first round easy.",
      href: "/aptitude",
    });
    assert.equal(digestGoalLine("placements", {}, tests)?.text, "Preparing for placements: an aptitude section a day keeps the first round easy.");
  });

  it("product: the first company's study list, else the roadmap", () => {
    assert.deepEqual(digestGoalLine("product", { companies: ["Goldman Sachs"] }), {
      text: "Preparing for Goldman Sachs: work through its study list, the problems tagged Goldman Sachs.",
      href: "/challenges/company/goldman-sachs",
    });
    assert.equal(digestGoalLine("product", {})?.href, "/roadmap");
  });

  it("language: the track, else the study plans", () => {
    assert.deepEqual(digestGoalLine("language", { language: "cpp" }), {
      text: "Learning C++: a lesson a day keeps your study plan moving.",
      href: "/study-plans/cpp",
    });
    assert.equal(digestGoalLine("language", {})?.href, "/study-plans");
  });

  it("practice: a duel, since every nudge already names today's problem", () => {
    assert.equal(digestGoalLine("practice", {})?.href, "/duels");
  });

  it("nothing for an account that skipped or was never asked", () => {
    assert.equal(digestGoalLine(null, {}), null);
    assert.equal(goalLineOf(null, null), null);
    assert.equal(goalLineOf("something-else", { companies: ["TCS"] }), null);
  });

  it("reads the stored Json defensively: unknown companies and keys of another goal are dropped", () => {
    assert.equal(goalLineOf("product", { companies: ["Not A Company", "Amazon"] })?.href, "/challenges/company/amazon");
    assert.equal(goalLineOf("language", { companies: ["Amazon"], language: "rust" })?.href, "/study-plans");
    assert.equal(goalLineOf("placements", "garbage", tests)?.href, "/aptitude");
  });
});

describe("the digest with a goal line", () => {
  const week = { solved: 2, sql: 0, bugs: 0, contestPoints: 0, streak: 3, xp: 90 };
  const line = { text: "Learning Java: a lesson a day keeps your study plan moving.", href: "/study-plans/java" };

  it("ends the in-app body with it and gives it its own link in the email", () => {
    const c = weeklyDigestContent("Ayaan", week, line);
    assert.match(c.body, /today's problem keeps it that way\. Learning Java: a lesson a day/);
    assert.match(c.text, /Learning Java: a lesson a day keeps your study plan moving\.\nhttp\S+\/study-plans\/java\n\nYou can turn reminders off/);
  });

  it("is unchanged without one", () => {
    const c = weeklyDigestContent("Ayaan", week);
    assert.doesNotMatch(c.body, /Learning/);
    assert.doesNotMatch(c.text, /study-plans/);
  });
});
