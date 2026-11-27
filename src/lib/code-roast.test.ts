import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRoastMessages, cookedLevel, guardRoast, isRoastStyle, maskAbuse, roastSetOf } from "./code-roast.js";

test("the cooked meter comes from the judge's counts", () => {
  assert.equal(cookedLevel("COMPILE_ERROR", 0, 0), 10);
  assert.equal(cookedLevel("WRONG_ANSWER", 0, 50), 10);
  assert.equal(cookedLevel("WRONG_ANSWER", 49, 50), 1);
  assert.ok(cookedLevel("WRONG_ANSWER", 25, 50) >= 5 && cookedLevel("WRONG_ANSWER", 25, 50) <= 6);
  // Slow but right on most cases is the middle of the dial, never 10.
  assert.ok(cookedLevel("TIME_LIMIT_EXCEEDED", 0, 50) <= 7);
  // A crash is never "barely cooked".
  assert.ok(cookedLevel("RUNTIME_ERROR", 49, 50) >= 5);
});

test("a roast hands over no code and carries no abuse", () => {
  const r = guardRoast(
    { roast: "Bro this is so stupid 💀 ```py\nfor i in a:\n  for j in a:\n    pass\n``` nested loops on 10^5, it's giving TLE. Chutiya move.", fix: "Use a hashmap, fr." },
    { style: "english", cooked: 7, promptVersion: 1, now: new Date("2026-11-27T00:00:00Z") },
  );
  assert.ok(r);
  assert.doesNotMatch(r.text, /for j in a/);
  assert.doesNotMatch(r.text, /stupid|chutiya/i);
  assert.equal(r.cooked, 7);
  assert.equal(r.createdAt, "2026-11-27T00:00:00.000Z");
  assert.equal(maskAbuse("abc bcd mca"), "abc bcd mca");
});

test("an empty answer is not a roast", () => {
  assert.equal(guardRoast({ roast: "  ", fix: "x" }, { style: "hinglish", cooked: 3, promptVersion: 1 }), null);
});

test("styles and stored sets are read defensively", () => {
  assert.ok(isRoastStyle("hinglish"));
  assert.ok(!isRoastStyle("spicy"));
  assert.deepEqual(roastSetOf(null), {});
  assert.deepEqual(Object.keys(roastSetOf({ english: { text: "x" }, klingon: { text: "y" } })), ["english"]);
});

test("the prompt is given the code as fenced data and names the style", () => {
  const msgs = buildRoastMessages(
    { title: "Two Sum", statement: "Find two.", code: "return []", language: "python", verdict: "WRONG_ANSWER", passedCases: 1, totalCases: 9, headline: null, reviewSummary: "Returns nothing.", cooked: 9 },
    "SYSTEM",
    "hinglish",
  );
  const user = msgs[1]!.content;
  assert.match(user, /=== BEGIN CODE ===[\s\S]*1\| return \[\][\s\S]*=== END CODE ===/);
  assert.match(user, /Hinglish/);
  assert.match(user, /What the code review found: Returns nothing\./);
  assert.match(user, /Cooked meter \(from the judge's counts\): 9\/10/);
});
