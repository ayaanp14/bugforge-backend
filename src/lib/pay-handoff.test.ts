import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

process.env["JWT_SECRET"] ??= "test-secret-that-is-long-enough-for-hs256-0123456789";

/**
 * The desktop app's checkout hand-off (lib/pay-handoff.ts): the signed
 * ticket the site's /pay page carries instead of a session, the two URLs
 * it rides in, and the address the page shows. A ticket is the only thing
 * standing between a stranger and the order's payment session, so every
 * way of bending one is refused here.
 *
 * Run with: npx tsx --test src/lib/pay-handoff.test.ts
 */

type Handoff = typeof import("./pay-handoff.js");
let h: Handoff;
before(async () => {
  h = await import("./pay-handoff.js");
});

const ORDER = "ck_0123456789abcdef01234567";
const USER = "cmabc123user";
const NOW = 1_800_000_000_000;

describe("pay ticket", () => {
  it("names its order and account until it expires", () => {
    const { ticket, expiresAt } = h.payTicket(ORDER, USER, NOW);
    assert.equal(expiresAt, NOW + h.PAY_TICKET_TTL_MS);
    assert.deepEqual(h.readPayTicket(ticket, NOW), { orderId: ORDER, userId: USER, expiresAt });
    assert.deepEqual(h.readPayTicket(ticket, expiresAt - 1)?.orderId, ORDER);
    assert.equal(h.readPayTicket(ticket, expiresAt), null);
  });

  it("is URL-safe as it stands, so it rides in a fragment or a query unescaped", () => {
    const { ticket } = h.payTicket(ORDER, USER, NOW);
    assert.match(ticket, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    assert.equal(encodeURIComponent(ticket), ticket);
  });

  it("is refused when its claims are rewritten — another order, another account, a later expiry", () => {
    const { ticket } = h.payTicket(ORDER, USER, NOW);
    const [, sig] = ticket.split(".");
    const forge = (claims: object) => `${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${sig}`;
    assert.equal(h.readPayTicket(forge({ o: "ck_ffffffffffffffffffffffff", u: USER, e: NOW + 1000 }), NOW), null);
    assert.equal(h.readPayTicket(forge({ o: ORDER, u: "someone-else", e: NOW + 1000 }), NOW), null);
    assert.equal(h.readPayTicket(forge({ o: ORDER, u: USER, e: NOW + 100 * h.PAY_TICKET_TTL_MS }), NOW), null);
  });

  it("is refused when signed with another key (a session token's, a visitor pass's)", async () => {
    const crypto = await import("node:crypto");
    const body = Buffer.from(JSON.stringify({ o: ORDER, u: USER, e: NOW + 1000 })).toString("base64url");
    const plain = crypto.createHmac("sha256", process.env["JWT_SECRET"]!).update(body).digest("base64url");
    assert.equal(h.readPayTicket(`${body}.${plain}`, NOW), null);
  });

  it("refuses anything that is not a ticket", () => {
    for (const value of [undefined, null, 42, {}, "", ".", "abc", "a.b", `${"x".repeat(600)}.y`]) {
      assert.equal(h.readPayTicket(value, NOW), null, String(value));
    }
  });

  it("is only ever made for one of our order ids", () => {
    assert.throws(() => h.payTicket("order_123", USER, NOW));
    assert.throws(() => h.payTicket("ck_../../etc", USER, NOW));
    assert.throws(() => h.payTicket(ORDER, "", NOW));
  });
});

describe("desktop checkout URLs", () => {
  it("puts the ticket in the page link's fragment and in the return URL's query", () => {
    const { ticket } = h.payTicket(ORDER, USER, NOW);
    const urls = h.desktopCheckoutUrls("https://codekairo.com/", ticket);
    assert.equal(urls.payUrl, `https://codekairo.com/pay#${ticket}`);
    assert.equal(urls.returnUrl, `https://codekairo.com/pay?done=1&t=${ticket}`);
    // The fragment never reaches a server; the return URL's ticket reads back.
    assert.equal(new URL(urls.payUrl).search, "");
    assert.equal(h.readPayTicket(new URL(urls.returnUrl).searchParams.get("t"), NOW)?.orderId, ORDER);
  });

  it("is asked for only by the literal client flag", () => {
    assert.equal(h.wantsDesktopHandoff({ offerId: "pro-yearly", client: "desktop" }), true);
    for (const body of [null, undefined, {}, { client: "Desktop" }, { client: true }, { offerId: "pro-yearly" }]) {
      assert.equal(h.wantsDesktopHandoff(body), false, JSON.stringify(body));
    }
  });
});

describe("masked address", () => {
  it("keeps enough for its owner to recognise", () => {
    assert.equal(h.maskEmail("ayaan@gmail.com"), "a•••n@gmail.com");
    assert.equal(h.maskEmail("ab@x.io"), "a•••@x.io");
    assert.equal(h.maskEmail("a@x.io"), "a•••@x.io");
  });

  it("shows nothing for something that is not an address", () => {
    for (const value of [null, undefined, "", "nobody", "@x.io", "me@"]) assert.equal(h.maskEmail(value), null, String(value));
  });
});
