import { test } from "node:test";
import assert from "node:assert/strict";
import { markdownToHtml } from "./markdown-html.js";

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

test("a long source is cut on a paragraph boundary", () => {
  const src = Array.from({ length: 200 }, (_, i) => `Paragraph ${i} with some words in it.`).join("\n\n");
  const html = markdownToHtml(src, 2_000);
  assert.ok(html.length < 2_700);
  assert.ok(html.endsWith("</p>"));
  assert.ok(!html.includes("Paragraph 199"));
});
