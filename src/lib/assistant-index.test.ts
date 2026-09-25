import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildIndex, chunkBriefing, renderChunks, tokens } from "./assistant-index.js";

const HANDBOOK = readFileSync(new URL("../../content/handbook.md", import.meta.url), "utf8");

test("chunks carry their section heading and a ### block's label", () => {
  const md = "# Title\n\nIntro line.\n\n## Duels — `/duels`\n\n- First rule.\n- Second rule.\n\n### Strikes\n\n- Third strike disqualifies.\n";
  const chunks = chunkBriefing(md);
  assert.equal(chunks[0].section, "Title");
  const duel = chunks.filter((c) => c.section === "Duels — `/duels`");
  assert.ok(duel.length >= 1);
  assert.ok(duel.every((c) => c.text.startsWith("## Duels — `/duels`\n\n")));
  assert.match(duel.map((c) => c.text).join("\n"), /\(Strikes\)\n- Third strike disqualifies\./);
});

test("the handbook packs into small chunks, in order", () => {
  const chunks = chunkBriefing(HANDBOOK);
  assert.ok(chunks.length > 40);
  // One piece may exceed the target rather than be cut mid-sentence, but none is a wall.
  assert.ok(chunks.every((c) => c.text.length < 2500), chunks.filter((c) => c.text.length >= 2500).map((c) => c.id).join(", "));
  assert.deepEqual(
    chunks.map((c) => c.order),
    chunks.map((_, i) => i),
  );
});

test("stems fold plurals and -ing so a question meets the handbook's words", () => {
  assert.deepEqual(tokens("Duels, streaks and paying"), ["duel", "streak", "pay"]);
  assert.deepEqual(tokens("the what is a"), []);
});

const index = buildIndex(chunkBriefing(HANDBOOK));
const sectionsFor = (q: string) => [...new Set(index.search(q).map((c) => c.section.replace(/ — .*/, "")))];

for (const [question, section] of [
  ["How does a duel end if my opponent leaves?", "Duels"],
  ["what happens if I take a screenshot in a duel", "Duels"],
  ["What does the Pro plan cost?", "Plans, billing and allowances"],
  ["how do i get a certificate for java", "Study plans"],
  ["what file types can I upload to the resume analyzer", "Resume ATS Analyzer"],
  ["my streak broke yesterday why", "Rank, XP, rating, streaks, leaderboard"],
  ["can I practice with a friend live", "Pair rooms"],
  ["I forgot my password", "Accounts and signing in"],
  ["is there a dark mode", "Search, theme, devices, connectivity"],
  ["how long is the TCS NQT placement test", "Placement tests"],
  ["how do I contact support about a refund", "Feedback, campus ambassadors, help"],
  ["how can I host a coding contest for my college", "Tournaments"],
  ["how is penalty time counted in an ICPC style contest", "Tournaments"],
] as const) {
  test(`"${question}" finds ${section}`, () => {
    assert.ok(sectionsFor(question).includes(section), `got: ${sectionsFor(question).join(" · ")}`);
  });
}

test("a greeting picks nothing, and a pick stays inside its budget", () => {
  assert.deepEqual(index.search("hi"), []);
  const picked = index.search("duels plans roadmap interviews resume aptitude tests community", { maxChars: 4000 });
  assert.ok(picked.reduce((n, c) => n + c.text.length, 0) <= 4000);
});

test("rendering shares one heading between consecutive chunks of a section", () => {
  const md = "## A\n\n" + Array.from({ length: 30 }, (_, i) => `- item ${i} ${"x".repeat(60)}`).join("\n") + "\n";
  const chunks = chunkBriefing(md);
  assert.ok(chunks.length > 1);
  const out = renderChunks(chunks);
  assert.equal(out.match(/^## A$/gm)?.length, 1);
});
