import test from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  bandFor,
  BREACH_LIMIT,
  breachCausesOf,
  credentialCode,
  credentialPath,
  credentialStatus,
  flagsFor,
  improvesCredential,
  isCorrectSelection,
  nextSittingAt,
  normalizeCredentialCode,
  parseSelection,
  percentOf,
  recordBreach,
  type Signals,
} from "./skill-tests.js";
import { similarity, tokenize } from "./code-similarity.js";
import { SKILLS, credentialName, skillTopic } from "./skill-catalog.js";

test("percentOf rounds down, so a near miss is not a pass", () => {
  assert.equal(percentOf(23.98, 40), 59);
  assert.equal(percentOf(24, 40), 60);
  // 0.6 * 100 is 59.99999999999999 in floating point; the point is still earned.
  assert.equal(percentOf(0.6, 1), 60);
  assert.equal(percentOf(5, 0), 0);
  assert.equal(percentOf(-3, 40), 0);
});

test("bands sit on the pass and distinction marks inclusively", () => {
  assert.equal(bandFor(59, 60, 85), "fail");
  assert.equal(bandFor(60, 60, 85), "pass");
  assert.equal(bandFor(84, 60, 85), "pass");
  assert.equal(bandFor(85, 60, 85), "distinction");
  assert.equal(bandFor(100, 60, 85), "distinction");
});

test("a selection is integer indices in range, deduplicated and sorted", () => {
  assert.deepEqual(parseSelection(2, 4), [2]);
  assert.deepEqual(parseSelection([3, 1, 3], 4), [1, 3]);
  assert.equal(parseSelection(null, 4), null);
  assert.equal(parseSelection([], 4), null);
  assert.equal(parseSelection(4, 4), "invalid");
  assert.equal(parseSelection([-1], 4), "invalid");
  assert.equal(parseSelection(["1.5"], 4), "invalid");
  assert.equal(parseSelection([0, 1, 2, 3, 0], 4), "invalid");
});

test("a multi-answer question is all-or-nothing on the exact set", () => {
  assert.equal(isCorrectSelection([0, 2], [0, 2]), true);
  assert.equal(isCorrectSelection([2, 0], [0, 2]), true);
  assert.equal(isCorrectSelection([0], [0, 2]), false);
  assert.equal(isCorrectSelection([0, 1, 2], [0, 2]), false);
  assert.equal(isCorrectSelection(null, [1]), false);
  assert.equal(isCorrectSelection([1], [1]), true);
});

test("the cooldown runs from when the last sitting closed", () => {
  const closed = new Date("2026-10-01T10:00:00Z");
  assert.equal(nextSittingAt(null, 7), null);
  assert.equal(nextSittingAt(closed, 0, new Date("2026-10-01T11:00:00Z")), null);
  assert.deepEqual(nextSittingAt(closed, 7, new Date("2026-10-03T00:00:00Z")), new Date("2026-10-08T10:00:00Z"));
  assert.equal(nextSittingAt(closed, 7, new Date("2026-10-08T10:00:00Z")), null);
});

test("addMonths clamps to the end of a shorter month", () => {
  assert.equal(addMonths(new Date("2026-01-31T12:00:00Z"), 1).toISOString(), "2026-02-28T12:00:00.000Z");
  assert.equal(addMonths(new Date("2026-10-01T00:00:00Z"), 24).toISOString(), "2028-10-01T00:00:00.000Z");
});

test("credential codes are Crockford base32 and survive a round trip through a URL", () => {
  assert.equal(credentialCode(new Uint8Array([0, 0, 0, 0, 0])), "CK-0000-0000");
  assert.equal(credentialCode(new Uint8Array([255, 255, 255, 255, 255])), "CK-ZZZZ-ZZZZ");
  for (let i = 0; i < 50; i += 1) {
    const code = credentialCode();
    assert.match(code, /^CK-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    assert.equal(normalizeCredentialCode(credentialPath(code).split("/").pop()), code);
  }
});

test("a typed code forgives case, dashes and the look-alike letters", () => {
  assert.equal(normalizeCredentialCode("ck-7h3k-9qxm"), "CK-7H3K-9QXM");
  assert.equal(normalizeCredentialCode("CK7H3K9QXM"), "CK-7H3K-9QXM");
  assert.equal(normalizeCredentialCode("7h3k 9qxm"), "CK-7H3K-9QXM");
  assert.equal(normalizeCredentialCode("ck-7h3k-9qxo"), "CK-7H3K-9QX0");
  assert.equal(normalizeCredentialCode("ck-7h3k-9qxl"), "CK-7H3K-9QX1");
  assert.equal(normalizeCredentialCode("ck-7h3k-9qxu"), null);
  assert.equal(normalizeCredentialCode("ck-7h3k"), null);
  assert.equal(normalizeCredentialCode(42), null);
});

test("a credential is valid until it expires, and revocation wins", () => {
  const now = new Date("2026-10-01T00:00:00Z");
  const later = new Date("2028-10-01T00:00:00Z");
  const earlier = new Date("2026-09-01T00:00:00Z");
  assert.equal(credentialStatus({ expiresAt: later, revokedAt: null }, now), "valid");
  assert.equal(credentialStatus({ expiresAt: earlier, revokedAt: null }, now), "expired");
  assert.equal(credentialStatus({ expiresAt: later, revokedAt: earlier }, now), "revoked");
});

test("a sitting raises or renews a credential, never un-revokes one", () => {
  const now = new Date("2026-10-01T00:00:00Z");
  const live = { percent: 70, expiresAt: new Date("2028-01-01T00:00:00Z"), revokedAt: null };
  assert.equal(improvesCredential(live, { percent: 90 }, now), true);
  assert.equal(improvesCredential(live, { percent: 70 }, now), false);
  assert.equal(improvesCredential(live, { percent: 65 }, now), false);
  assert.equal(improvesCredential({ ...live, expiresAt: new Date("2026-01-01T00:00:00Z") }, { percent: 61 }, now), true);
  assert.equal(improvesCredential({ ...live, revokedAt: new Date("2026-09-01T00:00:00Z") }, { percent: 99 }, now), false);
});

test("flags name what crossed a bar and stay quiet below it", () => {
  assert.deepEqual(flagsFor({ tabHidden: 2, paste: 1, breaches: BREACH_LIMIT - 1 }, [{ title: "Two Sum", similarity: 0.4 }]), []);
  const flags = flagsFor({ tabHidden: 9, paste: 5, fullscreenExit: 4 }, [{ title: "Two Sum", similarity: 0.93 }]);
  assert.equal(flags.length, 4);
  assert.match(flags[0]!, /9 times/);
  assert.match(flags[3]!, /Two Sum.*93%/);
  assert.match(flagsFor({ breaches: BREACH_LIMIT }, [])[0]!, /^Ended automatically/);
});

test("one departure is one breach, whatever it fired, and the limit ends the sitting", () => {
  // Alt+Tab out of full screen fires blur, then fullscreenchange: one breach.
  const first = recordBreach({ paste: 2 }, ["focusLost", "fullscreenExit"]);
  assert.deepEqual(first, { signals: { paste: 2, focusLost: 1, fullscreenExit: 1, breaches: 1 }, breaches: 1, ended: false });
  let state: Signals = first.signals;
  for (let i = 2; i < BREACH_LIMIT; i++) {
    const step = recordBreach(state, ["tabHidden"]);
    assert.equal(step.ended, false);
    state = step.signals;
  }
  const last = recordBreach(state, ["tabHidden"]);
  assert.equal(last.breaches, BREACH_LIMIT);
  assert.equal(last.ended, true);
  // Past the limit (a request that raced the close) still reads as ended.
  assert.equal(recordBreach(last.signals, []).ended, true);
});

test("breach causes are the departure signals only, once each", () => {
  assert.deepEqual(breachCausesOf(["tabHidden", "tabHidden", "paste", "nonsense", 3, "focusLost"]), ["tabHidden", "focusLost"]);
  assert.deepEqual(breachCausesOf("tabHidden"), []);
});

const EDITORIAL = `
def two_sum(nums, target):
    # remember where each value was seen
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        if need in seen:
            return [seen[need], i]
        seen[value] = i
    return []
`;

test("similarity sees the editorial through comments and layout", () => {
  const copied = EDITORIAL.replace("# remember where each value was seen", "").replace(/    /g, "  ");
  assert.equal(similarity(copied, EDITORIAL, "python"), 1);
  const own = `
def two_sum(nums, target):
    for a in range(len(nums)):
        for b in range(a + 1, len(nums)):
            if nums[a] + nums[b] == target:
                return [a, b]
    return []
`;
  assert.ok(similarity(own, EDITORIAL, "python") < 0.5);
  // Too little code to judge is never a match.
  assert.equal(similarity("return []", EDITORIAL, "python"), 0);
});

test("C-like comments are stripped and strings stay whole", () => {
  assert.deepEqual(tokenize('int x = 1; // note\n/* block */ s = "a b";', "java"), ["int", "x", "=", "1", ";", "s", "=", '"a b"', ";"]);
});

test("every skill names distinct topics and a short label that fits the seal", () => {
  for (const skill of SKILLS) {
    assert.ok(skill.short.length <= 3, skill.id);
    assert.equal(new Set(skill.topics.map((t) => t.id)).size, skill.topics.length, skill.id);
  }
  assert.equal(skillTopic("java", "strings")?.label, "Strings");
  assert.equal(credentialName("java", "intermediate"), "Java · Intermediate");
});
