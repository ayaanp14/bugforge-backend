import { test } from "node:test";
import assert from "node:assert/strict";
import { companyBlurb, renamedCompanyHubSlug } from "./problem-topics.js";

/*
 * The company hubs: a renamed company's old address moves to the new one,
 * and each hub's intro is told apart by its own most common topics
 * (2026-09-30 — the Facebook and Meta hubs listed one company twice, and
 * every company hub opened with the same paragraph but the name).
 */
test("a renamed company's old hub address moves to the new one", () => {
  assert.equal(renamedCompanyHubSlug("facebook"), "meta");
  assert.equal(renamedCompanyHubSlug("meta"), undefined);
  assert.equal(renamedCompanyHubSlug("amazon"), undefined);
});

test("a company hub's intro names its most common topics, and says nothing it cannot count", () => {
  const amazon = companyBlurb("Amazon", 914, [
    { label: "Arrays", count: 600 },
    { label: "Hash Table", count: 200 },
    { label: "Strings", count: 150 },
  ]);
  assert.match(amazon, /The most common topics among them are Arrays \(600\), Hash Table \(200\) and Strings \(150\)\./);
  assert.match(companyBlurb("Zoho", 12, [{ label: "Math", count: 5 }]), /most common topics among them are Math \(5\)\./);
  const bare = companyBlurb("Zoho", 12);
  assert.match(bare, /^12 problems the CodeKairo catalogue tags as commonly asked in Zoho's coding rounds/);
  assert.doesNotMatch(bare, /most common topics/);
  assert.match(bare, /not affiliated with/);
});
