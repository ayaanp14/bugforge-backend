import { describe, it, before, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

process.env["JWT_SECRET"] ??= "test-secret-that-is-long-enough-for-hs256-0123456789";
process.env["TELEMETRY_DISABLED"] = "true";

type Handoff = typeof import("./handoff-store.js");
type Session = typeof import("./auth-session.js");
let handoff: Handoff;
let session: Session;
before(async () => {
  handoff = await import("./handoff-store.js");
  session = await import("./auth-session.js");
});
beforeEach(() => handoff.resetHandoffs());

const user = { id: "user_1", email: "one@example.com" };

describe("OAuth handoff codes", () => {
  it("exchanges a code for the exact token the cookie holds, once", async () => {
    const token = session.signSession(user);
    const claims = session.readSessionToken(token)!;
    const code = handoff.issueHandoff(user, claims);
    assert.match(code, /^[A-Za-z0-9_-]{43}$/, "256 random bits, url-safe");

    assert.equal(await handoff.redeemHandoff(code), token);
    assert.equal(await handoff.redeemHandoff(code), null, "a code is spent by its first exchange");
  });

  it("knows nothing about a code it never issued", async () => {
    assert.equal(await handoff.redeemHandoff("not-a-code"), null);
  });

  it("binds a desktop code to its verifier (S256)", async () => {
    const crypto = await import("node:crypto");
    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const token = session.signSession(user);
    const claims = session.readSessionToken(token)!;

    assert.equal(await handoff.redeemHandoff(handoff.issueHandoff(user, claims, challenge), verifier), token);

    const withoutVerifier = handoff.issueHandoff(user, claims, challenge);
    assert.equal(await handoff.redeemHandoff(withoutVerifier), null, "no verifier, no session");
    assert.equal(await handoff.redeemHandoff(withoutVerifier, verifier), null, "and the attempt spent the code");

    const wrong = handoff.issueHandoff(user, claims, challenge);
    assert.equal(await handoff.redeemHandoff(wrong, crypto.randomBytes(32).toString("base64url")), null);
    assert.equal(await handoff.redeemHandoff(wrong, verifier), null, "a wrong guess spends it too");
  });

  it("ignores a verifier on a code the site's own sign-in issued", async () => {
    const token = session.signSession(user);
    const code = handoff.issueHandoff(user, session.readSessionToken(token)!);
    assert.equal(await handoff.redeemHandoff(code, "anything-at-all-anything-at-all-anything-at-all"), token);
  });

  it("expires after a minute", async () => {
    mock.timers.enable({ apis: ["Date"] });
    try {
      const claims = session.readSessionToken(session.signSession(user))!;
      const code = handoff.issueHandoff(user, claims);
      mock.timers.tick(61_000);
      assert.equal(await handoff.redeemHandoff(code), null);
    } finally {
      mock.timers.reset();
    }
  });
});
