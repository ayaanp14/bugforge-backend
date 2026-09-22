import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ROBOTS_TXT, robotsAllows } from "./robots.js";

/**
 * A rendering crawler will not fetch what robots.txt disallows — it skips the
 * request rather than making it and ignoring the answer. Every public page on
 * codekairo.com gets its words from this API, so a rule that disallows these
 * reads does not merely hide the JSON: it empties the pages. That is what
 * happened while the host was `Disallow: /` — a study lesson rendered as
 * "That lesson does not exist." and Search filed it as a soft 404. Asserted
 * here because nothing else catches it: the raw HTML the crawl audit reads is
 * complete either way, and the failure only appears after rendering.
 */

describe("robots.txt", () => {
  it("lets a crawler fetch the reads the public pages render from", () => {
    for (const path of [
      "/api/problems/two-sum",
      "/api/study-plans/javascript/lessons/memory-and-garbage-collection",
      "/api/aptitude/sections/quantitative",
      "/api/bug-hunts",
      "/api/roadmap",
      "/api/community/feed",
      "/api/seo/head",
    ]) {
      assert.equal(robotsAllows(path), true, `${path} must stay crawlable or its page renders empty`);
    }
  });

  it("keeps the rest of the host to itself", () => {
    assert.equal(robotsAllows("/"), false);
    assert.equal(robotsAllows("/health"), false);
    assert.equal(robotsAllows("/robots.txt"), false);
  });

  it("is a well-formed file with both rules under one group", () => {
    assert.match(ROBOTS_TXT, /^User-agent: \*$/m);
    assert.match(ROBOTS_TXT, /^Allow: \/api\/$/m);
    assert.match(ROBOTS_TXT, /^Disallow: \/$/m);
    assert.ok(ROBOTS_TXT.endsWith("\n"));
  });
});
