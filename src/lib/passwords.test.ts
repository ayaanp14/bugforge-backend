import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { BCRYPT_COST, burnCompare, hashPassword, needsRehash, verifyPassword } from "./passwords.js";

describe("password hashing", () => {
  it("hashes at the current cost and verifies", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.match(hash, /^\$2[aby]\$12\$/);
    assert.equal(bcrypt.getRounds(hash), BCRYPT_COST);
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
    assert.equal(await verifyPassword("correct horse battery stapl", hash), false);
  });

  it("flags a hash made at the old cost for rewriting, and still verifies it", async () => {
    const legacy = await bcrypt.hash("hunter22", 10);
    assert.equal(needsRehash(legacy), true);
    assert.equal(await verifyPassword("hunter22", legacy), true);
    assert.equal(needsRehash(await hashPassword("hunter22")), false);
    assert.equal(needsRehash("not a bcrypt hash"), false);
  });

  it("burns a compare for a missing account and always fails", async () => {
    const started = Date.now();
    assert.equal(await burnCompare("anything"), false);
    // A real compare at cost 12 is tens of milliseconds at least; this must
    // not be the instant answer the old "no such user" branch gave.
    assert.ok(Date.now() - started >= 20, "the dummy compare should cost real time");
  });
});
