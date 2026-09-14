import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env["JWT_SECRET"] ??= "test-secret-that-is-long-enough-for-hs256-0123456789";
process.env["TELEMETRY_DISABLED"] = "true";

type Mod = typeof import("./otp-store.js");
let mod: Mod;
before(async () => {
  mod = await import("./otp-store.js");
});
beforeEach(() => mod.resetChallenges());

describe("one-time codes", () => {
  it("accepts the right code once, for the purpose it was issued for", async () => {
    const token = await mod.issueChallenge("password_reset", "a@x.com", "123456");
    assert.deepEqual(await mod.consumeChallenge("password_reset", token, "123456"), { ok: true, email: "a@x.com" });
    // Spent.
    assert.equal((await mod.consumeChallenge("password_reset", token, "123456")).ok, false);
  });

  it("never lets a code for one purpose serve the other", async () => {
    const token = await mod.issueChallenge("verify_email", "a@x.com", "123456");
    const asReset = await mod.consumeChallenge("password_reset", token, "123456");
    assert.deepEqual(asReset, { ok: false, reason: "unknown" }, "a verification handle is not a reset handle");
    // And the wrong-purpose attempt did not spend it.
    assert.equal((await mod.consumeChallenge("verify_email", token, "123456")).ok, true);
  });

  it("runs out after five wrong guesses", async () => {
    const token = await mod.issueChallenge("verify_email", "a@x.com", "123456");
    for (let i = 0; i < 5; i++) {
      assert.deepEqual(await mod.consumeChallenge("verify_email", token, "000000"), { ok: false, reason: "mismatch" });
    }
    assert.notEqual((await mod.consumeChallenge("verify_email", token, "123456")).ok, true, "the right code is refused once the budget is spent");
  });

  it("retires the previous code for an address, per purpose", async () => {
    const first = await mod.issueChallenge("verify_email", "a@x.com", "111111");
    const reset = await mod.issueChallenge("password_reset", "a@x.com", "222222");
    const second = await mod.issueChallenge("verify_email", "a@x.com", "333333");
    assert.equal((await mod.consumeChallenge("verify_email", first, "111111")).ok, false, "superseded");
    assert.equal((await mod.consumeChallenge("verify_email", second, "333333")).ok, true);
    assert.equal((await mod.consumeChallenge("password_reset", reset, "222222")).ok, true, "the other purpose's code is untouched");
  });

  it("issues a handle for an unknown address that can never succeed", async () => {
    const token = await mod.issueChallenge("password_reset", null, "123456");
    assert.equal(typeof token, "string");
    assert.deepEqual(await mod.consumeChallenge("password_reset", token, "123456"), { ok: false, reason: "mismatch" });
  });

  it("generates six digits from a secure source", () => {
    for (let i = 0; i < 50; i++) assert.match(mod.generateOtp(), /^\d{6}$/);
  });
});
