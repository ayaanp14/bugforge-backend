import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { botSignal, FILL_TIME_FIELD, HONEYPOT_FIELD, MIN_FILL_MS } from "./bot-check.js";

describe("botSignal", () => {
  it("passes a request that carries neither field (the mobile app, a direct API client)", () => {
    assert.equal(botSignal({ email: "a@b.co", password: "hunter22" }), null);
  });

  it("passes a person: an empty trap and a human fill time", () => {
    assert.equal(botSignal({ [HONEYPOT_FIELD]: "", [FILL_TIME_FIELD]: 9000 }), null);
    assert.equal(botSignal({ [HONEYPOT_FIELD]: "   ", [FILL_TIME_FIELD]: MIN_FILL_MS }), null);
  });

  it("catches anything in the honeypot, whatever the time", () => {
    assert.equal(botSignal({ [HONEYPOT_FIELD]: "https://spam.example", [FILL_TIME_FIELD]: 60000 }), "honeypot");
    assert.equal(botSignal({ [HONEYPOT_FIELD]: 1 }), "honeypot");
    assert.equal(botSignal({ [HONEYPOT_FIELD]: true }), "honeypot");
  });

  it("catches a form sent faster than a person fills it", () => {
    assert.equal(botSignal({ [FILL_TIME_FIELD]: 40 }), "too-fast");
    assert.equal(botSignal({ [FILL_TIME_FIELD]: MIN_FILL_MS - 1 }), "too-fast");
    assert.equal(botSignal({ [FILL_TIME_FIELD]: 2500 }, { minFillMs: 3000 }), "too-fast");
  });

  it("ignores a fill time that is not a finite number, and the timing check when switched off", () => {
    assert.equal(botSignal({ [FILL_TIME_FIELD]: "10" }), null);
    assert.equal(botSignal({ [FILL_TIME_FIELD]: Number.NaN }), null);
    assert.equal(botSignal({ [FILL_TIME_FIELD]: 10 }, { minFillMs: 0 }), null);
  });
});
