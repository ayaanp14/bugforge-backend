import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env["JWT_SECRET"] ??= "test-secret-that-is-long-enough-for-hs256-0123456789";
process.env["TELEMETRY_DISABLED"] = "true";

type Mod = typeof import("./session-revocation.js");
let mod: Mod;
before(async () => {
  mod = await import("./session-revocation.js");
});
beforeEach(() => mod.clearRevocationCache());

// Seconds, as a JWT's `iat` is.
const at = (ms: number) => Math.floor(ms / 1000);

describe("session revocation", () => {
  it("allows a token when the account has revoked nothing", async () => {
    mod.primeRevocationCache("u1", {});
    assert.equal(await mod.isSessionRevoked("u1", at(Date.now()), "jti-a"), false);
  });

  it("refuses a token signed out by id, and only that one", async () => {
    mod.primeRevocationCache("u1", { revokedIds: ["jti-a"] });
    assert.equal(await mod.isSessionRevoked("u1", at(Date.now()), "jti-a"), true);
    assert.equal(await mod.isSessionRevoked("u1", at(Date.now()), "jti-b"), false, "the other device stays signed in");
  });

  it("refuses every token older than the account-wide stamp", async () => {
    const stamp = Date.now();
    mod.primeRevocationCache("u1", { validFrom: stamp });
    assert.equal(await mod.isSessionRevoked("u1", at(stamp - 5_000), "jti-old"), true);
    // Same second as the stamp: iat rounds down, so it reads as older.
    assert.equal(await mod.isSessionRevoked("u1", at(stamp), "jti-same-second"), stamp % 1000 !== 0);
    assert.equal(await mod.isSessionRevoked("u1", at(stamp + 5_000), "jti-new"), false);
  });

  it("keeps accounts apart", async () => {
    mod.primeRevocationCache("u1", { revokedIds: ["jti-a"] });
    mod.primeRevocationCache("u2", {});
    assert.equal(await mod.isSessionRevoked("u2", at(Date.now()), "jti-a"), false);
  });
});
