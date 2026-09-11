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

  it("accepts a comma-separated ADMIN_EMAIL list and the built-in admins", () => {
    const env = { ADMIN_EMAIL: "a@x.com, B@Y.com ,," } as NodeJS.ProcessEnv;
    assert.equal(isAdminEmail("a@x.com", env), true);
    assert.equal(isAdminEmail("b@y.com", env), true);
    assert.equal(isAdminEmail("c@z.com", env), false);
    assert.equal(isAdminEmail("tabassump8319@gmail.com", {} as NodeJS.ProcessEnv), true);
    assert.equal(isAdminEmail("  Tabassump8319@Gmail.com ", {} as NodeJS.ProcessEnv), true);
  });

  it("treats the owner accounts as admins", () => {
    assert.equal(isAdminEmail("ayaanpathan14@gmail.com", {} as NodeJS.ProcessEnv), true);
    assert.equal(isAdminEmail("x@y.com", { OWNER_EMAILS: "x@y.com" } as NodeJS.ProcessEnv), true);
  });

  it("never matches an empty ADMIN_EMAIL against an empty address", () => {
    assert.equal(isAdminEmail("", { ADMIN_EMAIL: "" } as NodeJS.ProcessEnv), false);
    assert.equal(isAdminEmail(null, {} as NodeJS.ProcessEnv), false);
    assert.equal(isAdminEmail("nobody@example.com", {} as NodeJS.ProcessEnv), false);
  });
});
