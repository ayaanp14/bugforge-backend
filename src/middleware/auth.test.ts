import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAdminEmail } from "./auth.js";

describe("isAdminEmail", () => {
  it("accepts ADMIN_EMAIL case-insensitively and with whitespace", () => {
    const env = { ADMIN_EMAIL: "Admin@Example.com" } as NodeJS.ProcessEnv;
    assert.equal(isAdminEmail("admin@example.com", env), true);
    assert.equal(isAdminEmail("  ADMIN@example.COM ", env), true);
    assert.equal(isAdminEmail("someone@example.com", env), false);
  });

  it("accepts a comma-separated ADMIN_EMAIL list and has no built-in admin", () => {
    const env = { ADMIN_EMAIL: "a@x.com, B@Y.com ,," } as NodeJS.ProcessEnv;
    assert.equal(isAdminEmail("a@x.com", env), true);
    assert.equal(isAdminEmail("b@y.com", env), true);
    assert.equal(isAdminEmail("c@z.com", env), false);
    // There is no built-in admin: an address is an admin only when the
    // environment names it, or when it is a built-in owner (QA-039). This uses
    // a neutral address to keep those two rules apart — the owner list moved to
    // tabassump8319@gmail.com, which now passes by the owner rule instead.
    assert.equal(isAdminEmail("nobody@example.com", {} as NodeJS.ProcessEnv), false);
    assert.equal(isAdminEmail("  Nobody@Example.com ", { ADMIN_EMAIL: "nobody@example.com" } as NodeJS.ProcessEnv), true);
  });

  it("treats the owner accounts as admins", () => {
    assert.equal(isAdminEmail("tabassump8319@gmail.com", {} as NodeJS.ProcessEnv), true);
    assert.equal(isAdminEmail("x@y.com", { OWNER_EMAILS: "x@y.com" } as NodeJS.ProcessEnv), true);
  });

  it("never matches an empty ADMIN_EMAIL against an empty address", () => {
    assert.equal(isAdminEmail("", { ADMIN_EMAIL: "" } as NodeJS.ProcessEnv), false);
    assert.equal(isAdminEmail(null, {} as NodeJS.ProcessEnv), false);
    assert.equal(isAdminEmail("nobody@example.com", {} as NodeJS.ProcessEnv), false);
  });
});
