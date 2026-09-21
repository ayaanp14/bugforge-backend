import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, uniqueSlug } from "./slug.js";

test("a title becomes lower-case hyphenated ASCII", () => {
  assert.equal(slugify("The Checkout Meltdown"), "the-checkout-meltdown");
  assert.equal(slugify("Version 2.3.10 Is Not Older Than 2.3.9"), "version-2-3-10-is-not-older-than-2-3-9");
  assert.equal(slugify("rm -rf on an Empty Variable"), "rm-rf-on-an-empty-variable");
  assert.equal(slugify("Profit & Loss"), "profit-and-loss");
  assert.equal(slugify("  Café — Crème  "), "cafe-creme");
});

test("an empty or symbol-only title still yields a slug", () => {
  assert.equal(slugify("???"), "untitled");
});

test("a long title is cut on a hyphen", () => {
  const slug = slugify("word ".repeat(40));
  assert.ok(slug.length <= 80);
  assert.ok(!slug.endsWith("-"));
});

test("uniqueSlug skips reserved ids and taken slugs", async () => {
  const taken = new Set(["python", "the-alarm-that-slept-in", "the-alarm-that-slept-in-2"]);
  assert.equal(await uniqueSlug("Python", async (c) => taken.has(c), new Set(["python"])), "python-2");
  assert.equal(await uniqueSlug("The Alarm That Slept In", async (c) => taken.has(c)), "the-alarm-that-slept-in-3");
  assert.equal(await uniqueSlug("Fresh", async () => false), "fresh");
});
