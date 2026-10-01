import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { TOPIC_HUBS } from "../problem-topics.js";
import { WALKTHROUGHS, walkthroughFor } from "./index.js";
import { walkthroughProblems } from "./validate.js";

/*
 * Every topic hub shows its technique working, frame by frame (2026-10-01).
 * A generator runs its algorithm, so the test only has to hold the shape:
 * one per hub, each within the page's limits, and small enough to ride in
 * the hub payload.
 */

test("every topic hub has a walkthrough, and every walkthrough a hub", () => {
  const hubs = new Set(TOPIC_HUBS.map((t) => t.slug));
  assert.deepEqual(TOPIC_HUBS.map((t) => t.slug).filter((s) => !WALKTHROUGHS[s]), []);
  assert.deepEqual(Object.keys(WALKTHROUGHS).filter((s) => !hubs.has(s)), []);
});

test("every walkthrough passes the page's rules", () => {
  const problems = Object.keys(WALKTHROUGHS).flatMap((slug) => walkthroughProblems(slug, walkthroughFor(slug)!));
  assert.deepEqual(problems, []);
});

test("a walkthrough is a few kilobytes of the hub payload, and the same on every call", () => {
  // The frames repeat most of their items, so the JSON compresses ~20×:
  // the largest (the segment tree, 53 KB raw) is 2.3 KB on the wire. The
  // budget is on what the reader downloads; the raw cap bounds memory.
  for (const slug of Object.keys(WALKTHROUGHS)) {
    const once = JSON.stringify(WALKTHROUGHS[slug]());
    assert.ok(gzipSync(once).length <= 4_096, `${slug} is ${gzipSync(once).length} bytes gzipped`);
    assert.ok(once.length <= 64_000, `${slug} is ${once.length} bytes of JSON`);
    assert.equal(JSON.stringify(WALKTHROUGHS[slug]()), once, `${slug} is not deterministic`);
  }
});
