import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { PASS_TTL_MS, challengeRequired, mintPass, passIsValid, verifyTurnstile } from "./visitor-pass.js";

const ADDRESS = "203.0.113.7";
const NOW = 1_800_000_000_000;

describe("visitor pass", () => {
  it("is valid for its own address until it expires", () => {
    const { pass, expiresAt } = mintPass(ADDRESS, NOW);
    assert.equal(expiresAt, NOW + PASS_TTL_MS);
    assert.equal(passIsValid(pass, ADDRESS, NOW), true);
    assert.equal(passIsValid(pass, ADDRESS, expiresAt - 1), true);
    assert.equal(passIsValid(pass, ADDRESS, expiresAt), false);
  });

  it("is refused from another network, so one answered challenge cannot be shared", () => {
    const { pass } = mintPass(ADDRESS, NOW);
    assert.equal(passIsValid(pass, "198.51.100.9", NOW), false);
  });

  it("is refused when its claims are rewritten (a longer expiry, another address)", () => {
    const { pass } = mintPass(ADDRESS, NOW);
    const [, sig] = pass.split(".");
    const forged = Buffer.from(JSON.stringify({ a: "x", e: NOW + 10 * PASS_TTL_MS })).toString("base64url");
    assert.equal(passIsValid(`${forged}.${sig}`, ADDRESS, NOW), false);
  });

  it("refuses anything that is not a pass", () => {
    for (const value of [undefined, null, "", ".", "abc", "a.b", 42, "x".repeat(600)]) {
      assert.equal(passIsValid(value, ADDRESS, NOW), false, String(value));
    }
  });
});

describe("challengeRequired / verifyTurnstile", () => {
  const saved = { site: process.env["TURNSTILE_SITE_KEY"], secret: process.env["TURNSTILE_SECRET_KEY"] };
  afterEach(() => {
    process.env["TURNSTILE_SITE_KEY"] = saved.site ?? "";
    process.env["TURNSTILE_SECRET_KEY"] = saved.secret ?? "";
  });

  it("asks for a challenge only when both keys are set", () => {
    process.env["TURNSTILE_SITE_KEY"] = "";
    process.env["TURNSTILE_SECRET_KEY"] = "";
    assert.equal(challengeRequired(), false);
    process.env["TURNSTILE_SITE_KEY"] = "site";
    assert.equal(challengeRequired(), false, "a site key alone would lock visitors out with no way to verify");
    process.env["TURNSTILE_SECRET_KEY"] = "secret";
    assert.equal(challengeRequired(), true);
  });

  it("reads Cloudflare's answer, and calls a network failure unavailable rather than a failed check", async () => {
    process.env["TURNSTILE_SECRET_KEY"] = "secret";
    const answer = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    assert.equal(await verifyTurnstile("t", ADDRESS, answer({ success: true })), "passed");
    assert.equal(await verifyTurnstile("t", ADDRESS, answer({ success: false, "error-codes": ["invalid-input-response"] })), "failed");
    assert.equal(await verifyTurnstile("t", ADDRESS, answer({}, 500)), "unavailable");
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    assert.equal(await verifyTurnstile("t", ADDRESS, down), "unavailable");
  });

  it("sends the secret, the token and the caller's address", async () => {
    process.env["TURNSTILE_SECRET_KEY"] = "secret";
    let sent: URLSearchParams | null = null;
    const capture = (async (_url: string, init: RequestInit) => {
      sent = init.body as URLSearchParams;
      return new Response(JSON.stringify({ success: true }));
    }) as unknown as typeof fetch;
    await verifyTurnstile("tok", ADDRESS, capture);
    assert.equal(sent!.get("secret"), "secret");
    assert.equal(sent!.get("response"), "tok");
    assert.equal(sent!.get("remoteip"), ADDRESS);
  });
});
