import test from "node:test";
import assert from "node:assert/strict";

import { firstName, welcomeHtml, welcomeSubject, welcomeText, type WelcomeRecipient } from "./welcome-mail-copy.js";
import { sendWelcome } from "./auth-mail.js";

/**
 * The welcome mail: its copy rules without a network, and the one send it
 * makes with fetch replaced (the same stub pattern as brevo.test.ts).
 */

const ORIGIN = "https://codekairo.com";
const PERSON: WelcomeRecipient = { email: "ayaan@codekairo.com", name: "Ayaan Pathan", username: "ayaan_p", via: "google" };

test("the greeting is the first word of the name, or nobody in particular", () => {
  assert.equal(firstName("Ayaan Pathan"), "Ayaan");
  assert.equal(firstName("  Mei  "), "Mei");
  assert.equal(firstName(null), null);
  assert.equal(firstName("   "), null);
  // A profile name is whatever was typed into Google or GitHub; one that
  // reads as an address or a link is not put in a subject line.
  assert.equal(firstName("visit.evil.com now"), null);
  assert.equal(firstName("me@example.com"), null);
  assert.equal(firstName("https://x"), null);
  assert.equal(firstName("A".repeat(25)), null);

  assert.equal(welcomeSubject(PERSON), "Welcome to CodeKairo, Ayaan");
  assert.equal(welcomeSubject({ ...PERSON, name: null }), "Welcome to CodeKairo");
});

test("a name is escaped before it reaches the HTML", () => {
  const html = welcomeHtml({ ...PERSON, name: "<b>Eve&Co" }, ORIGIN);
  assert.ok(!html.includes("<b>Eve"));
  assert.ok(html.includes("Welcome to CodeKairo, &lt;b&gt;Eve&amp;Co."));
});

test("both bodies carry the account, every first move and the footer", () => {
  const html = welcomeHtml(PERSON, ORIGIN);
  const text = welcomeText(PERSON, ORIGIN);
  for (const body of [html, text]) {
    for (const path of ["/roadmap", "/contests", "/bug-hunts", "/mock-interview", "/challenges", "/profile"]) {
      assert.ok(body.includes(`${ORIGIN}${path}`), `missing ${path}`);
    }
    assert.ok(body.includes("@ayaan_p"));
    assert.ok(body.includes("Google"));
    assert.ok(body.includes("ayaan@codekairo.com"));
    assert.ok(!/undefined|\bnull\b|\[object /.test(body), "a missing value leaked into the copy");
  }
  // The sign-in road is named for each way in; a password account has no handle line when it has no username.
  assert.ok(welcomeText({ ...PERSON, via: "email" }, ORIGIN).includes("email + password"));
  assert.ok(welcomeText({ ...PERSON, via: "github" }, ORIGIN).includes("GitHub"));
  assert.ok(!welcomeText({ ...PERSON, username: null }, ORIGIN).includes("Username"));
});

test("the mark and fonts come from the public site even when the links do not", () => {
  const html = welcomeHtml(PERSON, "http://localhost:3000");
  assert.ok(html.includes('src="https://codekairo.com/icon-192.png"'));
  assert.ok(html.includes("https://codekairo.com/fonts/Gilroy-700.woff2"));
  assert.ok(html.includes('href="http://localhost:3000/roadmap"'));
  // Gmail clips a message past ~102 KB behind "View entire message".
  assert.ok(Buffer.byteLength(html) < 60_000);
});

async function withFetch(fn: () => Promise<boolean>) {
  const real = globalThis.fetch;
  const calls: RequestInit[] = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    calls.push(init);
    return new Response(JSON.stringify({ messageId: "m" }), { status: 201 });
  }) as typeof fetch;
  try {
    return { ok: await fn(), calls };
  } finally {
    globalThis.fetch = real;
  }
}

test("with no Brevo key nothing is sent", async () => {
  const { ok, calls } = await withFetch(() => sendWelcome(PERSON, { NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv));
  assert.equal(ok, false);
  assert.equal(calls.length, 0);
});

test("a welcome is one Brevo message, tagged with how the account signs in", async () => {
  const { ok, calls } = await withFetch(() =>
    sendWelcome({ ...PERSON, via: "github" }, { BREVO_API_KEY: "k" } as unknown as NodeJS.ProcessEnv),
  );
  assert.equal(ok, true);
  assert.equal(calls.length, 1);
  const body = JSON.parse(String(calls[0].body));
  assert.deepEqual(body.to, [{ email: "ayaan@codekairo.com" }]);
  assert.equal(body.subject, "Welcome to CodeKairo, Ayaan");
  assert.deepEqual(body.tags, ["welcome", "github"]);
  assert.match(body.htmlContent, /Welcome to CodeKairo, Ayaan\./);
  assert.match(body.textContent, /Welcome to CodeKairo, Ayaan\./);
});
