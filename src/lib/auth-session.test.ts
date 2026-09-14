import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env["JWT_SECRET"] ??= "test-secret-that-is-long-enough-for-hs256-0123456789";
process.env["TELEMETRY_DISABLED"] = "true";

type Mod = typeof import("./auth-session.js");
let mod: Mod;
before(async () => {
  mod = await import("./auth-session.js");
});

const user = { id: "user_1", email: "one@example.com" };

describe("session tokens", () => {
  it("mints a token with an id, an issue time and an expiry, and reads it back", () => {
    const token = mod.signSession(user);
    const claims = mod.readSessionToken(token);
    assert.ok(claims);
    assert.equal(claims.userId, "user_1");
    assert.equal(claims.email, "one@example.com");
    assert.match(claims.jti, /^[0-9a-f-]{36}$/);
    assert.ok(claims.exp > claims.iat);
    // Thirty days, give or take the second that ticked over.
    assert.ok(Math.abs(claims.exp - claims.iat - 30 * 24 * 3600) <= 1);
  });

  it("gives every token its own id", () => {
    const a = mod.readSessionToken(mod.signSession(user))!;
    const b = mod.readSessionToken(mod.signSession(user))!;
    assert.notEqual(a.jti, b.jti);
  });

  it("refuses the earlier generations: no expiry, or no id", () => {
    const secret = process.env["JWT_SECRET"]!;
    const forever = jwt.sign({ userId: "user_1", email: user.email }, secret, { algorithm: "HS256" });
    assert.equal(mod.readSessionToken(forever), null, "a token with no exp must not verify");

    const noId = jwt.sign({ userId: "user_1", email: user.email }, secret, { algorithm: "HS256", expiresIn: "30d" });
    assert.equal(mod.readSessionToken(noId), null, "a token with no jti must not verify");
  });

  it("refuses an expired token, a foreign signature and a non-HS256 header", () => {
    const secret = process.env["JWT_SECRET"]!;
    const expired = jwt.sign({ userId: "user_1" }, secret, { algorithm: "HS256", expiresIn: -10, jwtid: "x" });
    assert.equal(mod.readSessionToken(expired), null);

    const foreign = jwt.sign({ userId: "user_1" }, "another-secret-entirely-0123456789abcdef", { algorithm: "HS256", expiresIn: "1h", jwtid: "x" });
    assert.equal(mod.readSessionToken(foreign), null);

    const none = jwt.sign({ userId: "user_1", exp: Math.floor(Date.now() / 1000) + 60, jti: "x" }, "", { algorithm: "none" });
    assert.equal(mod.readSessionToken(none), null);
  });

  it("re-mints the same token from pinned claims", () => {
    const original = mod.signSession(user);
    const claims = mod.readSessionToken(original)!;
    const again = mod.signSession(user, claims);
    assert.equal(again, original, "the handoff store must be able to reproduce the cookie's token exactly");
  });

  it("reads its own cookie out of a raw Cookie header", () => {
    assert.equal(mod.cookieFromHeader("a=1; __session=abc%3D; b=2", "__session"), "abc=");
    assert.equal(mod.cookieFromHeader("a=1", "__session"), null);
    assert.equal(mod.cookieFromHeader(undefined, "__session"), null);
  });
});
