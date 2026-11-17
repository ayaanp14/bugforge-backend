import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { absolutize, devtoArticle, devtoTags, interleave, liquidSafe, nextToPost, siteLink, type CrosspostItem } from "./crosspost.js";

const ORIGIN = "https://codekairo.com";

const item: CrosspostItem = {
  kind: "lesson",
  path: "/roadmap/two-pointers",
  slug: "two-pointers",
  title: "Two Pointers Technique",
  seoTitle: "Two Pointers Technique: Explained with Examples & Code",
  description: "Learn the two pointers technique.",
  answer: "Two indices walk the array in one pass.",
  faq: [{ q: "Is it the same as sliding window?", a: "Sliding window is a case of it — see [the lesson](/roadmap/sliding-window)." }],
  body: [
    "Pairs are everywhere. See [Two Sum](/problems/two-sum) and [why](#why-it-works).",
    "",
    "@figure meet-in-middle",
    "",
    "## Why it works",
    "",
    "```cpp",
    "int main() { return 0; }",
    "```",
    "```java",
    "class Main {}",
    "```",
    "```python",
    "print(1)",
    "```",
    "```javascript",
    "console.log(`{% x %}`)",
    "```",
    "```output",
    "1",
    "```",
    "",
    "@figure still",
    "",
    "@figure missing",
  ].join("\n"),
  tags: ["dsa", "algorithms", "programming", "interview", "extra"],
  series: "CodeKairo DSA Roadmap",
  home: { path: "/roadmap", label: "DSA roadmap" },
  practice: 9,
};

const figures: Record<string, { title: string; input: string; captions: string[] }> = {
  "meet-in-middle": { title: "Pointers meeting in the middle", input: "nums = [1, 3, 5]", captions: ["Start at both ends.", "Move the left one."] },
  still: { title: "The two shapes", input: "", captions: ["Opposite ends, or the same direction."] },
};

const article = devtoArticle(item, { origin: ORIGIN, figure: (n) => figures[n] ?? null, coverImage: "https://api.codekairo.com/card.jpg" });
const body = article.body_markdown;

describe("devtoArticle", () => {
  it("names the original as canonical, untagged, and carries the page's words", () => {
    assert.equal(article.canonical_url, "https://codekairo.com/roadmap/two-pointers");
    assert.equal(article.title, item.seoTitle);
    assert.equal(article.description, item.description);
    assert.equal(article.series, "CodeKairo DSA Roadmap");
    assert.equal(article.main_image, "https://api.codekairo.com/card.jpg");
    assert.equal(article.published, true);
    assert.deepEqual(article.tags, ["dsa", "algorithms", "programming", "interview"]);
    assert.match(body, /^\*First published on \[CodeKairo\]\(https:\/\/codekairo\.com\/roadmap\/two-pointers\?utm_source=devto/);
    assert.match(body, /> \*\*In short:\*\* Two indices walk the array in one pass\./);
  });

  it("makes every site link absolute and tagged, and in-page anchors point at the original", () => {
    assert.match(body, /\[Two Sum\]\(https:\/\/codekairo\.com\/problems\/two-sum\?utm_source=devto&utm_medium=crosspost&utm_campaign=two-pointers\)/);
    assert.match(body, /\[why\]\(https:\/\/codekairo\.com\/roadmap\/two-pointers\?utm_source=devto&utm_medium=crosspost&utm_campaign=two-pointers#why-it-works\)/);
    assert.match(body, /\[the lesson\]\(https:\/\/codekairo\.com\/roadmap\/sliding-window\?utm_/);
    assert.doesNotMatch(body, /\]\(\//);
  });

  it("shows a code group as each language in turn, then the output", () => {
    const order = ["**C++**", "**Java**", "**Python**", "**JavaScript**", "**Output**"].map((l) => body.indexOf(l));
    assert.ok(order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])), String(order));
    assert.match(body, /```cpp\nint main\(\) \{ return 0; \}\n```/);
    // A Liquid tag inside code is shown raw, not run by Dev.to.
    assert.match(body, /\{% raw %\}\n```javascript\nconsole\.log\(`\{% x %\}`\)\n```\n\{% endraw %\}/);
  });

  it("turns figures into their steps, links the animation once, and drops an unknown one", () => {
    assert.match(body, /\*\*Figure: Pointers meeting in the middle\*\* — `nums = \[1, 3, 5\]`\n\n1\. Start at both ends\.\n2\. Move the left one\.\n\n\*▶ \[Watch this figure animated/);
    assert.match(body, /\*\*Figure: The two shapes\*\*\n\nOpposite ends, or the same direction\./);
    assert.equal(body.match(/Watch this figure animated/g)?.length, 1);
    assert.doesNotMatch(body, /@figure|missing/);
  });

  it("ends with the questions, then the way back", () => {
    assert.ok(body.indexOf("## Common questions") < body.indexOf("**Is it the same as sliding window?**"));
    assert.match(body, /part of CodeKairo's free \[DSA roadmap\]\(https:\/\/codekairo\.com\/roadmap\?utm_.*The 9 practice problems/);
    assert.match(body, /\[company-wise coding questions\]\(https:\/\/github\.com\/ayaanp14\/company-wise-coding-questions\)[^\n]*\*\n$/);
  });
});

describe("helpers", () => {
  it("interleaves and picks the first page not yet claimed", () => {
    assert.deepEqual(interleave<number | string>([1, 2, 3], ["a"]), [1, "a", 2, 3]);
    const q = [item, { ...item, path: "/notes/dbms/joins" }];
    assert.equal(nextToPost(q, new Set(["/roadmap/two-pointers"]))?.path, "/notes/dbms/joins");
    assert.equal(nextToPost(q, new Set(q.map((i) => i.path))), null);
  });

  it("keeps Dev.to's tag rules", () => {
    assert.deepEqual(devtoTags(["System Design", "system-design", "C++", "oop", "sql", "x"]), ["systemdesign", "c", "oop", "sql"]);
  });

  it("tags links before their fragment and leaves outside links alone", () => {
    assert.equal(siteLink(ORIGIN, "/a?b=1#c", "s"), "https://codekairo.com/a?b=1&utm_source=devto&utm_medium=crosspost&utm_campaign=s#c");
    assert.equal(absolutize("[x](https://example.com/a) [y](//cdn.example.com/b)", ORIGIN, "/p", "s"), "[x](https://example.com/a) [y](//cdn.example.com/b)");
    assert.equal(liquidSafe("plain"), "plain");
  });
});
