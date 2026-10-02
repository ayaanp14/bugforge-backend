import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env["TELEMETRY_DISABLED"] = "true";
const { feedTagOf } = await import("./community.js");

/**
 * The feed's `?tag=` becomes part of three cache keys, so what it may be is
 * the grammar a stored tag has (extractTags): 2–30 of [a-z0-9_-]. Anything
 * else can match no post and must not reach the cache; no tag at all is "no
 * filter", as it always was.
 *
 * Run with: npx tsx --test src/routes/community-feed-tag.test.ts
 */
describe("feedTagOf", () => {
  it("is no filter when the parameter is missing, blank or not one string", () => {
    assert.equal(feedTagOf(undefined), null);
    assert.equal(feedTagOf(""), null);
    assert.equal(feedTagOf("   "), null);
    assert.equal(feedTagOf(["react", "node"]), null);
    assert.equal(feedTagOf({ tag: "react" }), null);
  });

  it("takes every tag a post can carry, trimmed and lowercased like the old read", () => {
    assert.equal(feedTagOf("react"), "react");
    assert.equal(feedTagOf("  React "), "react");
    assert.equal(feedTagOf("two-pointers"), "two-pointers");
    assert.equal(feedTagOf("dynamic_programming"), "dynamic_programming");
    assert.equal(feedTagOf("ab"), "ab");
    assert.equal(feedTagOf("a".repeat(30)), "a".repeat(30));
    // "all" is a tag like any other; the keys tell it apart from no filter.
    assert.equal(feedTagOf("all"), "all");
  });

  it("refuses what no stored tag can be", () => {
    assert.equal(feedTagOf("a"), false);
    assert.equal(feedTagOf("a".repeat(31)), false);
    assert.equal(feedTagOf("x".repeat(5000)), false);
    assert.equal(feedTagOf("#react"), false);
    assert.equal(feedTagOf("c++"), false);
    assert.equal(feedTagOf("two pointers"), false);
    assert.equal(feedTagOf("feed:candidates:public:v1"), false);
    assert.equal(feedTagOf("react\u0000"), false);
  });
});
