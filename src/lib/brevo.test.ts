import test from "node:test";
import assert from "node:assert/strict";

import { brevoConfigured, sendTransactional } from "./brevo.js";
import { codeHtml, codeSubject, codeText } from "./auth-mail-copy.js";

/**
 * The provider contract, pinned without a network: every case here replaces
 * global fetch. What matters is the shape Brevo is handed (it answers 400 on
 * a wrong one) and that a failure is swallowed rather than thrown — both
 * callers treat "not sent" as an outcome, not an error.
 */

const ENV = {
  BREVO_API_KEY: "xkeysib-test",
  MAIL_FROM_EMAIL: "no-reply@codekairo.com",
  MAIL_FROM_NAME: "CodeKairo",
  MAIL_REPLY_TO: "support@codekairo.com",
} as unknown as NodeJS.ProcessEnv;

const MAIL = { to: "person@example.com", subject: "Subject", html: "<p>hi</p>", text: "hi", tags: ["otp"] };

/** Runs `fn` with fetch replaced, and hands back what the fake was called with. */
async function withFetch(impl: typeof fetch, fn: () => Promise<boolean>) {
  const real = globalThis.fetch;
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return impl(url as never, init as never);
  }) as typeof fetch;
  try {
    return { ok: await fn(), calls };
  } finally {
    globalThis.fetch = real;
  }
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("no key configured means not configured, and nothing is sent", async () => {
  assert.equal(brevoConfigured({} as NodeJS.ProcessEnv), false);
  assert.equal(brevoConfigured(ENV), true);

  const { ok, calls } = await withFetch(
    async () => jsonResponse(201, { messageId: "x" }),
    () => sendTransactional(MAIL, {} as NodeJS.ProcessEnv),
  );
  assert.equal(ok, false);
  assert.equal(calls.length, 0, "an unconfigured send must not reach the network");
});

test("a send posts Brevo's documented shape to the documented endpoint", async () => {
  const { ok, calls } = await withFetch(
    async () => jsonResponse(201, { messageId: "abc" }),
    () => sendTransactional(MAIL, ENV),
  );

  assert.equal(ok, true);
  assert.equal(calls.length, 1);
  const [{ url, init }] = calls;
  assert.equal(url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(init.method, "POST");

  // Brevo authenticates on its own header, not Authorization/Bearer.
  const headers = init.headers as Record<string, string>;
  assert.equal(headers["api-key"], "xkeysib-test");
  assert.equal(headers["content-type"], "application/json");

  const body = JSON.parse(String(init.body));
  assert.deepEqual(body.sender, { email: "no-reply@codekairo.com", name: "CodeKairo" });
  assert.deepEqual(body.to, [{ email: "person@example.com" }]);
  assert.deepEqual(body.replyTo, { email: "support@codekairo.com" });
  assert.equal(body.subject, "Subject");
  assert.equal(body.htmlContent, "<p>hi</p>");
  assert.equal(body.textContent, "hi");
  assert.deepEqual(body.tags, ["otp"]);
});

test("the defaults stand in for unset sender variables", async () => {
  const { calls } = await withFetch(
    async () => jsonResponse(201, { messageId: "abc" }),
    () => sendTransactional(MAIL, { BREVO_API_KEY: "k" } as unknown as NodeJS.ProcessEnv),
  );
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.sender.email, "no-reply@codekairo.com");
  assert.equal(body.replyTo.email, "support@codekairo.com");
});

test("a rejected send resolves false rather than throwing", async () => {
  const { ok } = await withFetch(
    async () => jsonResponse(400, { code: "invalid_parameter", message: "sender not valid" }),
    () => sendTransactional(MAIL, ENV),
  );
  assert.equal(ok, false);
});

test("a network failure resolves false rather than throwing", async () => {
  const { ok } = await withFetch(
    async () => {
      throw new Error("socket hang up");
    },
    () => sendTransactional(MAIL, ENV),
  );
  assert.equal(ok, false);
});

test("both code bodies carry the code, and the subject names the purpose", () => {
  for (const purpose of ["verify_email", "password_reset"] as const) {
    assert.match(codeText("482193", purpose), /482193/);
    assert.match(codeHtml("482193", purpose), /482193/);
    // Five minutes, matching TTL_MS in otp-store.
    assert.match(codeText("482193", purpose), /5 minutes/);
    assert.match(codeSubject(purpose), /CodeKairo/);
  }
  assert.match(codeSubject("verify_email"), /verification/i);
  assert.match(codeSubject("password_reset"), /reset/i);
  // The digits must survive a copy out of the HTML: spacing is CSS, not
  // characters inserted between them.
  assert.ok(!codeHtml("482193", "verify_email").includes("4 8 2 1 9 3"));
});
