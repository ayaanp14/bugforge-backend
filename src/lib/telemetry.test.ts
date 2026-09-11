import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fingerprintOf, normaliseMessage, parseClientError, parseEvents } from "./telemetry.js";

describe("error fingerprinting", () => {
  it("strips the parts of a message that vary per occurrence", () => {
    assert.equal(normaliseMessage("Order ck_3f9a1b2c3d4e5f6a7b8c not found for user 42"), "order <id> not found for user <n>");
    assert.equal(normaliseMessage('Cannot read "avatar_url" of https://x.test/a/b?c=1'), 'cannot read "<str>" of <url>');
    assert.equal(normaliseMessage("Timeout after 5000ms"), "timeout after <n>ms");
  });

  it("groups two occurrences of the same defect and separates different ones", () => {
    const a = fingerprintOf({ source: "api", kind: "response", message: "Order ck_1a2b3c4d5e6f7a8b9c0d1e2f not found", stack: "Error: x\n    at grantAccess (file:///app/dist/services/billing.js:41:9)" });
    const b = fingerprintOf({ source: "api", kind: "response", message: "Order ck_9f8e7d6c5b4a39281706f5e4 not found", stack: "Error: x\n    at grantAccess (file:///app/dist/services/billing.js:41:12)" });
    const c = fingerprintOf({ source: "api", kind: "response", message: "Order ck_9f8e7d6c5b4a39281706f5e4 not found", stack: "Error: x\n    at verify (file:///app/dist/routes/billing.js:200:3)" });
    const d = fingerprintOf({ source: "web", kind: "response", message: "Order ck_9f8e7d6c5b4a39281706f5e4 not found", stack: null });
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.notEqual(a, d);
    assert.match(a, /^[0-9a-f]{40}$/);
  });

  it("ignores frames from node_modules when picking the top frame", () => {
    const own = "    at handler (file:///app/dist/routes/me.js:10:5)";
    const a = fingerprintOf({ source: "api", kind: "x", message: "boom", stack: `Error: boom\n    at lib (file:///app/node_modules/x/index.js:1:1)\n${own}` });
    const b = fingerprintOf({ source: "api", kind: "x", message: "boom", stack: `Error: boom\n${own}` });
    assert.equal(a, b);
  });
});

describe("client error parsing", () => {
  const ctx = { userId: "u1", userAgent: "UA", source: "web" as const };

  it("requires a message and folds unknown kinds into window", () => {
    assert.equal(parseClientError({ kind: "render" }, ctx), null);
    assert.equal(parseClientError(null, ctx), null);
    const parsed = parseClientError({ kind: "weird", message: " x ", stack: "s", path: "/p", componentStack: "cs", status: 500 }, ctx);
    assert.equal(parsed?.kind, "window");
    assert.equal(parsed?.message, "x");
    assert.equal(parsed?.userId, "u1");
    assert.deepEqual(parsed?.meta, { componentStack: "cs", status: 500 });
  });

  it("keeps a known kind and clips long fields", () => {
    const parsed = parseClientError({ kind: "render", message: "m".repeat(5000), stack: "s".repeat(20_000) }, ctx);
    assert.equal(parsed?.kind, "render");
    assert.equal(parsed?.message.length, 2000);
    assert.equal(parsed?.stack?.length, 8000);
    assert.equal(parsed?.meta, null);
  });
});

describe("event batch parsing", () => {
  it("drops rows with a bad name and keeps the rest", () => {
    const events = parseEvents({
      events: [
        { name: "page_view", path: "/challenges/:slug", sessionId: "abc" },
        { name: "Bad Name!" },
        { name: "" },
        "junk",
        { name: "submit", props: { verdict: "ACCEPTED" } },
      ],
    });
    assert.deepEqual(
      events.map((e) => e.name),
      ["page_view", "submit"],
    );
    assert.deepEqual(events[1].props, { verdict: "ACCEPTED" });
    assert.equal(events[0].sessionId, "abc");
  });

  it("caps a batch at 25 and drops oversized props", () => {
    const events = parseEvents({ events: Array.from({ length: 40 }, () => ({ name: "e", props: { big: "x".repeat(3000) } })) });
    assert.equal(events.length, 25);
    assert.equal(events[0].props, null);
  });

  it("returns nothing for a body that is not a batch", () => {
    assert.deepEqual(parseEvents(null), []);
    assert.deepEqual(parseEvents({ events: "nope" }), []);
  });
});
