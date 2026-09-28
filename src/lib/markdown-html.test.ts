import { test } from "node:test";
import assert from "node:assert/strict";
import { headingAnchor, markdownOutline, markdownToHtml } from "./markdown-html.js";

test("paragraphs, headings shifted down, inline code and emphasis", () => {
  const html = markdownToHtml("# Two Sum\n\nGiven an array `nums`, return **indices**.\n\nSecond *paragraph*.");
  assert.equal(html, "<h2>Two Sum</h2>\n<p>Given an array <code>nums</code>, return <strong>indices</strong>.</p>\n<p>Second <em>paragraph</em>.</p>");
});

test("authored HTML is text, never markup", () => {
  const html = markdownToHtml('<script>alert("x")</script> and a < b');
  assert.equal(html, '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; and a &lt; b</p>');
});

test("fenced code keeps its text verbatim and escaped", () => {
  const html = markdownToHtml("Input:\n\n```js\nif (a < b) { return `${a}`; }\n```\n\nAfter.");
  assert.equal(html, '<p>Input:</p>\n<pre><code class="language-js">if (a &lt; b) { return `${a}`; }</code></pre>\n<p>After.</p>');
});

test("lists, ordered and not, with continuation lines", () => {
  const html = markdownToHtml("- one\n- two\n  continued\n\n1. first\n2. second");
  assert.equal(html, "<ul><li>one</li><li>two continued</li></ul>\n<ol><li>first</li><li>second</li></ol>");
});

test("GFM tables and blockquotes", () => {
  const html = markdownToHtml("| a | b |\n|---|---|\n| 1 | 2 |\n\n> note\n> more");
  assert.equal(html, "<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>\n<blockquote><p>note more</p></blockquote>");
});

test("links only to the site or https; images become their alt text", () => {
  const html = markdownToHtml("[in](/challenges) [out](https://example.com) [no](javascript:alert(1)) ![alt](/x.png)");
  assert.equal(html, '<p><a href="/challenges">in</a> <a href="https://example.com">out</a> [no](javascript:alert(1)) alt</p>');
});

/*
 * Heading anchors. The SPA's components/study/lesson-anchors.ts computes
 * the same ids for the running page, so a "#section" link lands in the
 * same place with or without JavaScript — a change here is a change there.
 */
test("a heading's anchor is its words, lower-cased and hyphenated", () => {
  assert.equal(headingAnchor("The JVM: an abstract machine made real"), "the-jvm-an-abstract-machine-made-real");
  assert.equal(headingAnchor("Compiled *and* interpreted"), "compiled-and-interpreted");
  assert.equal(headingAnchor("`public static void main(String[] args)`"), "public-static-void-main-string-args");
  assert.equal(headingAnchor("C++ and [the STL](/x)"), "c-and-the-stl");
  assert.equal(headingAnchor("—"), "section");
});

test("anchors are written only when asked, numbered on repeats, and skip fenced code", () => {
  const src = "## Operators\n\n```cpp\n## not a heading\n```\n\n### `operator<<`\n\ntext\n\n### `operator>>`\n\n## Key takeaways";
  assert.ok(!markdownToHtml(src).includes(" id="));
  const html = markdownToHtml(src, 24_000, { anchors: true });
  assert.ok(html.includes('<h3 id="operators">Operators</h3>'), html);
  assert.ok(html.includes('<h4 id="operator">'), html);
  assert.ok(html.includes('<h4 id="operator-2">'), html);
  assert.ok(html.includes('<h3 id="key-takeaways">Key takeaways</h3>'), html);
  // The outline is the ## sections alone, with the same ids.
  assert.deepEqual(markdownOutline(src), [
    { id: "operators", text: "Operators" },
    { id: "key-takeaways", text: "Key takeaways" },
  ]);
});

test("a long source is cut on a paragraph boundary", () => {
  const src = Array.from({ length: 200 }, (_, i) => `Paragraph ${i} with some words in it.`).join("\n\n");
  const html = markdownToHtml(src, 2_000);
  assert.ok(html.length < 2_700);
  assert.ok(html.endsWith("</p>"));
  assert.ok(!html.includes("Paragraph 199"));
});
