import { test } from "node:test";
import assert from "node:assert/strict";
import { summarise, titles } from "./seo.js";

// The meta description of every content page — a problem statement, a bug
// report, a lesson — comes through here, and the SPA's lib/seo/summary is
// the same function. Pin the behaviour both must share.

test("a short text is returned whole, markup stripped", () => {
  assert.equal(summarise("Given `nums`, return **indices**."), "Given nums, return indices.");
  assert.equal(summarise("", "fallback"), "fallback");
});

test("whole sentences up to the limit, ending on one", () => {
  const out = summarise("The first sentence is here and it has some length to it. The second sentence follows the first one closely. The third one is long enough to push the total past the limit of the description by a comfortable margin, surely.");
  assert.equal(out, "The first sentence is here and it has some length to it. The second sentence follows the first one closely.");
});

test("a decimal, a version or an abbreviation is not a sentence boundary", () => {
  const text = "Add a Desk Lamp ($40.00) to the cart and the total goes NEGATIVE on larger carts, e.g. with three items. It shows $0.00 in staging but a small positive number in prod. More words follow here to make the text longer than the limit allows for.";
  const out = summarise(text);
  assert.ok(out.startsWith("Add a Desk Lamp ($40.00) to the cart"), out);
  assert.ok(out.endsWith("."), out);
  assert.ok(out.length <= 158, String(out.length));
});

test("one long sentence is cut on a word with an ellipsis", () => {
  const out = summarise("word ".repeat(80).trim() + ".");
  assert.ok(out.endsWith("…"));
  assert.ok(out.length <= 158);
});

/*
 * The title templates. The SPA's src/lib/seo/titles.ts holds the same
 * functions and its e2e suite compares a rendered page's title with the
 * HTML the edge served; these pin the shapes so a change here is a
 * deliberate one made in both places.
 */
test("every content page kind has a title with its intent and the brand last", () => {
  assert.equal(titles.problem("Two Sum", "Easy"), "Two Sum — Easy Coding Problem & Solution — CodeKairo");
  assert.equal(titles.topicHub("Arrays", 343), "Arrays Coding Problems: 343 Practice Questions with Solutions — CodeKairo");
  assert.equal(titles.companyHub("TCS", 57), "TCS Coding Interview Questions: 57 Tagged Problems to Practise — CodeKairo");
  assert.equal(titles.bugHunt("The Checkout Meltdown", "JavaScript"), "The Checkout Meltdown — JavaScript Bug Hunt — CodeKairo");
  assert.equal(titles.bugHub("JavaScript", 105, "language"), "JavaScript Debugging Practice: 105 Bug Hunts on Real Code — CodeKairo");
  assert.equal(titles.bugHub("Database", 29, "category"), "Database Bug Hunts: 29 Debugging Challenges — CodeKairo");
  assert.equal(titles.aptitudeCategory("Quantitative Aptitude", 13, 517), "Quantitative Aptitude Questions with Solutions: 13 Topics, 517 Practice Questions — CodeKairo");
  assert.equal(titles.aptitudeTopic("Percentages"), "Percentages Questions with Solutions — Aptitude Practice — CodeKairo");
  assert.equal(titles.aptitudeQuestion("Remainder of a large power", "Number System"), "Remainder of a large power — Number System Aptitude Question with Solution — CodeKairo");
  assert.equal(titles.studyTrack("Java", 20, 138), "Learn Java: 20-Module Study Plan with 138 Lessons — CodeKairo");
  assert.equal(titles.studyLesson("Records", "Java", false), "Records — Java lesson — CodeKairo");
  assert.equal(titles.studyLesson("Module test", "Java", true), "Module test — Java checkpoint — CodeKairo");
  assert.equal(titles.test("TCS NQT — Foundation", "TCS"), "TCS NQT — Foundation Mock Test — CodeKairo");
  assert.equal(titles.test("Foundation", "Infosys"), "Foundation Mock Test — Infosys Pattern — CodeKairo");
});

test("two aptitude questions of one topic never share a title", () => {
  assert.notEqual(titles.aptitudeQuestion("Successive discounts", "Percentages"), titles.aptitudeQuestion("Percentage points", "Percentages"));
});
