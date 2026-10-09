import { test } from "node:test";
import assert from "node:assert/strict";
import { grantsLifetimeAccess, honourDef, isHonourShareAction, parseHonourFeedback, parseHonourees } from "./honours.js";
import { honourHtml, honourSubject, honourText } from "./honour-mail.js";

test("only known kinds resolve, and the founding member lifts every quota", () => {
  assert.equal(honourDef("founding_member")?.name, "Founding Member");
  assert.equal(honourDef("toString"), null);
  assert.equal(honourDef(undefined), null);
  assert.equal(grantsLifetimeAccess(["founding_member"]), true);
  assert.equal(grantsLifetimeAccess(["nope"]), false);
  assert.equal(grantsLifetimeAccess([]), false);
});

test("a grant's names: emails or usernames, @ dropped, lower-cased, de-duplicated", () => {
  assert.deepEqual(parseHonourees("A@x.com, @Bob\ncarol;  a@x.com"), ["a@x.com", "bob", "carol"]);
  assert.deepEqual(parseHonourees(["@one", "two three"]), ["one", "two", "three"]);
  assert.deepEqual(parseHonourees(42), []);
});

test("the holder's note wants words; the stars are optional and whole", () => {
  assert.deepEqual(parseHonourFeedback({ comment: "  love it  " }), { ok: true, comment: "love it", rating: null });
  assert.deepEqual(parseHonourFeedback({ comment: "great", rating: 4 }), { ok: true, comment: "great", rating: 4 });
  assert.equal(parseHonourFeedback({ comment: "ok" }).ok, false);
  assert.equal(parseHonourFeedback({ comment: "great", rating: 4.5 }).ok, false);
  assert.equal(parseHonourFeedback({ comment: "great", rating: 9 }).ok, false);
});

test("only the LinkedIn actions are tracked", () => {
  assert.equal(isHonourShareAction("linkedin_post"), true);
  assert.equal(isHonourShareAction("linkedin_profile"), true);
  assert.equal(isHonourShareAction("x"), false);
});

test("the mail names the person, escapes them, and says lifetime access", () => {
  const person = { email: "a@b.com", name: "Aditya <b>Jain</b>", username: "aditya_jain" };
  assert.equal(honourSubject("founding_member", person), "Aditya, you're a CodeKairo Founding Member");
  const html = honourHtml("founding_member", person, "https://codekairo.com");
  assert.ok(!html.includes("<b>Jain"));
  assert.match(html, /Lifetime free access/);
  assert.match(html, /@aditya_jain/);
  assert.match(honourText("founding_member", person, "https://codekairo.com"), /Lifetime free access/);
});
