import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { resetAddressBudgets, sendAuthCode } from "./auth-mail.js";

// No key and no flow outside production: the code is "delivered" to the
// console, which is the road that answers true without a network.
const DEV = { NODE_ENV: "development" } as NodeJS.ProcessEnv;

describe("sendAuthCode", () => {
  beforeEach(() => resetAddressBudgets());

  it("stops mailing verification codes to one address after its hourly budget, whoever asks", async () => {
    for (let i = 0; i < 6; i++) assert.equal(await sendAuthCode("victim@example.com", "123456", "verify_email", DEV), true);
    assert.equal(await sendAuthCode("Victim@Example.com ", "123456", "verify_email", DEV), false, "the budget ignores spelling");
    assert.equal(await sendAuthCode("someone@example.com", "123456", "verify_email", DEV), true, "other addresses are unaffected");
  });

  it("never withholds a reset code, so a stranger cannot lock an owner out of recovery", async () => {
    for (let i = 0; i < 6; i++) await sendAuthCode("owner@example.com", "123456", "verify_email", DEV);
    for (let i = 0; i < 10; i++) assert.equal(await sendAuthCode("owner@example.com", "123456", "password_reset", DEV), true);
  });
});
