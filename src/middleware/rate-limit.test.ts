import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { addressKey, loginAccountLimiter, rateLimit, registerLimiter } from "./rate-limit.js";

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

  it("counts every registration, successful or not", () => {
    for (let i = 0; i < 30; i++) assert.equal(call(registerLimiter, "10.9.9.9", undefined, 201), 201);
    assert.equal(call(registerLimiter, "10.9.9.9", undefined, 201), 429, "a success is not refunded: each one is an account, a hash and a mail");
    assert.equal(call(registerLimiter, "10.9.9.10", undefined, 201), 201, "another address has its own budget");
  });
});

describe("addressKey", () => {
  it("keys IPv4 as itself, and an IPv4-mapped address as its IPv4", () => {
    assert.equal(addressKey("13.201.108.73"), "13.201.108.73");
    assert.equal(addressKey("::ffff:13.201.108.73"), "13.201.108.73");
    assert.equal(addressKey("::FFFF:10.0.0.1"), "10.0.0.1");
  });

  it("keys IPv6 by its /64, however it is written", () => {
    const key = "2409:40c4:f7:e0cb::/64";
    assert.equal(addressKey("2409:40c4:f7:e0cb:d7e0:acd3:95ff:b05f"), key);
    assert.equal(addressKey("2409:40c4:f7:e0cb:3927:3f4a:332f:5b1b"), key, "a privacy address in the same /64");
    assert.equal(addressKey("2409:40C4:00f7:E0CB::1"), key, "case, leading zeros and :: compression");
    assert.equal(addressKey("2409:40c4:f7:e0cb::"), key);
    assert.equal(addressKey("2409:40c4:f7:e0cc::1"), "2409:40c4:f7:e0cc::/64", "the next /64 is someone else");
    assert.equal(addressKey("2406:da1a::1"), "2406:da1a:0:0::/64");
    assert.equal(addressKey("::1"), "0:0:0:0::/64");
    assert.equal(addressKey("64:ff9b::13.201.108.73"), "64:ff9b:0:0::/64", "an embedded IPv4 tail");
    assert.equal(addressKey("fe80::1%eth0"), "fe80:0:0:0::/64", "a zone index is not part of the address");
  });

  it("leaves anything that is not an address alone", () => {
    assert.equal(addressKey("unknown"), "unknown");
    assert.equal(addressKey("2409:zzzz::1"), "2409:zzzz::1");
  });

  it("gives one /64 one budget", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    assert.equal(call(limiter, "2409:40c4:f7:e0cb::1"), 401);
    assert.equal(call(limiter, "2409:40c4:f7:e0cb::2"), 401);
    assert.equal(call(limiter, "2409:40c4:f7:e0cb:ffff:ffff:ffff:ffff"), 429, "a new address in the same /64 is the same caller");
    assert.equal(call(limiter, "2409:40c4:f7:e0cc::1"), 401, "another /64 has its own budget");
  });
});
