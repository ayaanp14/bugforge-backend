import { test } from "node:test";
import assert from "node:assert/strict";
import { summarise } from "./seo.js";

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
