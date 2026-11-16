import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CLAIM_WINDOW_DAYS,
  REFERRAL_CAP,
  REFERRAL_REWARDS,
  claimRefusal,
  inviterName,
  mailboxKey,
  nextSlotAt,
  normalizeReferralCode,
  randomReferralCode,
  rewardSplit,
  rewardsInWindow,
} from "./referrals.js";

const DAY = 86_400_000;
const now = new Date("2026-11-17T10:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * DAY);

describe("normalizeReferralCode", () => {
  it("lower-cases and trims a code", () => {
    assert.equal(normalizeReferralCode("  Ayaan_14 "), "ayaan_14");
  });
  it("refuses what cannot be a code", () => {
    for (const bad of ["ab", "a-b-c", "x".repeat(25), "../etc", "", null, 42, {}]) assert.equal(normalizeReferralCode(bad), null, String(bad));
  });
});

describe("randomReferralCode", () => {
  it("is 8 characters a link can carry, from the unambiguous alphabet", () => {
    const code = randomReferralCode(Uint8Array.from([0, 1, 2, 3, 200, 250, 255, 128]));
    assert.equal(code.length, 8);
    assert.ok(normalizeReferralCode(code));
    assert.doesNotMatch(code, /[01ilouv]/);
  });
});

describe("mailboxKey", () => {
  it("drops +tags everywhere and dots for Gmail", () => {
    assert.equal(mailboxKey("A.B+promo@Gmail.com"), "ab@gmail.com");
    assert.equal(mailboxKey("ab@googlemail.com"), "ab@gmail.com");
    assert.equal(mailboxKey("first.last+x@college.edu"), "first.last@college.edu");
  });
  it("is null for something that is not an address", () => {
    for (const bad of [null, undefined, "", "noat", "@x.com", "x@", "+tag@x.com"]) assert.equal(mailboxKey(bad), null, String(bad));
  });
});

describe("claimRefusal", () => {
  const base = {
    inviteeId: "u2",
    referrerId: "u1",
    accountCreatedAt: daysAgo(0.01),
    alreadyInvited: false,
    hasSolved: false,
    inviteeEmail: "friend@gmail.com",
    referrerEmail: "me@gmail.com",
    now,
  };
  it("admits a new account with no solve", () => {
    assert.equal(claimRefusal(base), null);
  });
  it("refuses the inviter's own account and own inbox", () => {
    assert.match(claimRefusal({ ...base, inviteeId: "u1" })!.error, /your own invite/);
    assert.match(claimRefusal({ ...base, inviteeEmail: "m.e+alt@gmail.com" })!.error, /your own invite/);
  });
  it("counts an account once, while it is new, before its first solve", () => {
    assert.match(claimRefusal({ ...base, alreadyInvited: true })!.error, /already joined/);
    assert.match(claimRefusal({ ...base, accountCreatedAt: daysAgo(CLAIM_WINDOW_DAYS + 0.1) })!.error, /first 7 days/);
    assert.equal(claimRefusal({ ...base, accountCreatedAt: daysAgo(CLAIM_WINDOW_DAYS - 0.1) }), null);
    assert.match(claimRefusal({ ...base, hasSolved: true })!.error, /haven't solved/);
  });
});

describe("rewardSplit", () => {
  const base = { referrerPaidAt: [] as Date[], knownMailboxes: new Set(["me@gmail.com"]), inviteeEmail: "friend@gmail.com", now };
  it("pays both sides", () => {
    assert.deepEqual(rewardSplit(base), { referrerCredits: REFERRAL_REWARDS.referrer, inviteeCredits: REFERRAL_REWARDS.invitee, withheld: null });
  });
  it("still pays the friend once the referrer's window is full", () => {
    const full = Array.from({ length: REFERRAL_CAP.rewards }, (_, i) => daysAgo(i + 1));
    assert.deepEqual(rewardSplit({ ...base, referrerPaidAt: full }), { referrerCredits: 0, inviteeCredits: REFERRAL_REWARDS.invitee, withheld: "cap" });
    // Rewards older than the window free their slot.
    const old = full.map((d) => new Date(d.getTime() - REFERRAL_CAP.days * DAY));
    assert.equal(rewardSplit({ ...base, referrerPaidAt: old }).withheld, null);
  });
  it("withholds the referrer's side for an inbox already counted", () => {
    assert.equal(rewardSplit({ ...base, inviteeEmail: "m.e+2@gmail.com" }).withheld, "mailbox");
    assert.equal(rewardSplit({ ...base, inviteeEmail: "m.e+2@gmail.com" }).inviteeCredits, REFERRAL_REWARDS.invitee);
  });
});

describe("the cap's window", () => {
  it("counts rewards inside it and says when the next slot frees", () => {
    const paid = Array.from({ length: REFERRAL_CAP.rewards }, (_, i) => daysAgo(i + 1)); // 1..10 days ago
    assert.equal(rewardsInWindow(paid, now), REFERRAL_CAP.rewards);
    // The oldest (10 days ago) leaves the window 20 days from now.
    assert.deepEqual(nextSlotAt(paid, now), new Date(daysAgo(10).getTime() + REFERRAL_CAP.days * DAY));
    assert.equal(nextSlotAt(paid.slice(1), now), null);
  });
});

describe("inviterName", () => {
  it("never shows more than the profile does", () => {
    assert.equal(inviterName({ name: "Ayaan P", username: "ayaan", profileHidden: false }), "Ayaan P");
    assert.equal(inviterName({ name: " ", username: "ayaan", profileHidden: false }), "ayaan");
    assert.equal(inviterName({ name: "Ayaan P", username: "ayaan", profileHidden: true }), "A CodeKairo member");
  });
});
