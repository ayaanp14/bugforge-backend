import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  loopbackUrl,
  parseDesktopSignIn,
  readDesktopSignIn,
  serializeDesktopSignIn,
  verifierMatches,
} from "./desktop-oauth.js";

const verifier = crypto.randomBytes(32).toString("base64url");
const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

describe("desktop sign-in parameters", () => {
  it("accepts a user port and an S256 challenge", () => {
    assert.deepEqual(parseDesktopSignIn("51234", challenge), { port: 51234, challenge });
  });

  it("refuses privileged, out-of-range and non-numeric ports", () => {
    for (const port of ["80", "1023", "65536", "99999", "0x1f90", "5123a", "", undefined, ["51234"]]) {
      assert.equal(parseDesktopSignIn(port, challenge), null, String(port));
    }
  });

  it("refuses anything but a 43-character base64url challenge", () => {
    for (const bad of ["", challenge.slice(1), `${challenge}=`, challenge.replace(/.$/, "+"), 42]) {
      assert.equal(parseDesktopSignIn("51234", bad), null, String(bad));
    }
  });

  it("round-trips through the cookie and re-validates what comes back", () => {
    const desktop = parseDesktopSignIn("51234", challenge)!;
    assert.deepEqual(readDesktopSignIn(serializeDesktopSignIn(desktop)), desktop);
    assert.equal(readDesktopSignIn(`80.${challenge}`), null);
    assert.equal(readDesktopSignIn("51234"), null);
    assert.equal(readDesktopSignIn(undefined), null);
  });
});

describe("the loopback redirect", () => {
  it("always targets 127.0.0.1 on the given port", () => {
    const url = new URL(loopbackUrl({ port: 51234, challenge }, { code: "abc", error: "x&y=z" }));
    assert.equal(url.origin, "http://127.0.0.1:51234");
    assert.equal(url.pathname, "/callback");
    assert.equal(url.searchParams.get("code"), "abc");
    assert.equal(url.searchParams.get("error"), "x&y=z", "values are encoded, not spliced");
  });
});

describe("verifier binding (S256)", () => {
  it("matches only the verifier the challenge was made from", () => {
    assert.equal(verifierMatches(verifier, challenge), true);
    assert.equal(verifierMatches(crypto.randomBytes(32).toString("base64url"), challenge), false);
  });

  it("refuses malformed verifiers before hashing", () => {
    for (const bad of [undefined, "", "short", "x".repeat(129), `${verifier}!`]) {
      assert.equal(verifierMatches(bad, challenge), false, String(bad));
    }
  });
});
