import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseFeedback, platformPromptDue } from "./feedback.js";

const days = (n: number) => n * 24 * 60 * 60 * 1000;

describe("platform prompt rationing", () => {
  const now = new Date("2026-09-09T12:00:00Z");

  it("waits until the account is two days old", () => {
    assert.equal(platformPromptDue({ accountCreatedAt: new Date(now.getTime() - days(1)), lastPlatformAt: null, now }), false);
    assert.equal(platformPromptDue({ accountCreatedAt: new Date(now.getTime() - days(2)), lastPlatformAt: null, now }), true);
  });

  it("asks again a month after the last rating, not before", () => {
    const created = new Date(now.getTime() - days(400));
    assert.equal(platformPromptDue({ accountCreatedAt: created, lastPlatformAt: new Date(now.getTime() - days(29)), now }), false);
    assert.equal(platformPromptDue({ accountCreatedAt: created, lastPlatformAt: new Date(now.getTime() - days(30)), now }), true);
  });
});

describe("feedback parsing", () => {
  it("accepts a whole-star rating with trimmed extras", () => {
    const parsed = parseFeedback({ kind: "platform", rating: 4, comment: "  fast and clean  ", tags: ["Speed", " Design ", ""], path: "/challenges" });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.value, { kind: "platform", rating: 4, comment: "fast and clean", tags: ["Speed", "Design"], sessionId: null, path: "/challenges" });
  });

  it("rejects half stars, out-of-range stars and unknown kinds", () => {
    assert.equal(parseFeedback({ kind: "platform", rating: 4.5 }).ok, false);
    assert.equal(parseFeedback({ kind: "platform", rating: 0 }).ok, false);
    assert.equal(parseFeedback({ kind: "platform", rating: 6 }).ok, false);
    assert.equal(parseFeedback({ kind: "bug", rating: 3 }).ok, false);
    assert.equal(parseFeedback({ kind: "platform", rating: "5" }).ok, false);
  });

  it("requires a session for interview feedback and drops one for platform feedback", () => {
    assert.equal(parseFeedback({ kind: "interview", rating: 5 }).ok, false);
    const interview = parseFeedback({ kind: "interview", rating: 5, sessionId: "abc" });
    assert.equal(interview.ok && interview.value.sessionId, "abc");
    const platform = parseFeedback({ kind: "platform", rating: 5, sessionId: "abc" });
    assert.equal(platform.ok && platform.value.sessionId, null);
  });

  it("caps comment length and tag count", () => {
    const parsed = parseFeedback({ kind: "platform", rating: 3, comment: "x".repeat(5000), tags: Array.from({ length: 20 }, (_, i) => "t" + i) });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.comment?.length, 2000);
    assert.equal(parsed.value.tags.length, 8);
  });
});
