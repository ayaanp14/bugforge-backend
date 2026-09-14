import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { loginAccountLimiter, rateLimit } from "./rate-limit.js";

/** Enough of Express for the limiter: an address, a body, a status, `finish`. */
function call(limiter: ReturnType<typeof rateLimit>, ip: string, body?: unknown, outcome = 401): number {
  const req = { method: "POST", ip, socket: { remoteAddress: ip }, headers: {}, body } as unknown as Request;
  const res = new EventEmitter() as EventEmitter & Response;
  let status = 200;
  res.setHeader = () => res;
  res.status = (code: number) => {
    status = code;
    return res;
  };
  res.json = () => res;
  let passed = false;
  limiter(req, res, () => {
    passed = true;
  });
  if (passed) {
    // The route answered; the limiter listens for this to refund a success.
    res.statusCode = outcome;
    res.emit("finish");
    return outcome;
  }
  return status;
}

describe("rate limiting", () => {
  it("counts per key and refuses past the ceiling", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    assert.equal(call(limiter, "1.1.1.1"), 401);
    assert.equal(call(limiter, "1.1.1.1"), 401);
    assert.equal(call(limiter, "1.1.1.1"), 429);
    assert.equal(call(limiter, "2.2.2.2"), 401, "another address has its own budget");
  });

  it("refunds a successful attempt when asked", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, skipSuccessful: true });
    assert.equal(call(limiter, "1.1.1.1", undefined, 200), 200);
    assert.equal(call(limiter, "1.1.1.1", undefined, 200), 200, "a correct password never spends the budget");
    assert.equal(call(limiter, "1.1.1.1", undefined, 401), 401);
    assert.equal(call(limiter, "1.1.1.1", undefined, 401), 429);
  });

  it("limits sign-in per account across addresses", () => {
    const body = { identifier: "  Victim@Example.com " };
    let last = 0;
    for (let i = 0; i < 10; i++) last = call(loginAccountLimiter, `10.0.0.${i}`, body);
    assert.equal(last, 401);
    assert.equal(call(loginAccountLimiter, "10.0.0.99", { identifier: "victim@example.com" }), 429, "the eleventh guess at the same account is refused whatever its address");
    assert.equal(call(loginAccountLimiter, "10.0.0.99", { identifier: "someone-else" }), 401, "other accounts are unaffected");
  });
});
