import { test } from "node:test";
import assert from "node:assert/strict";
import { editorialIdea, joinAnd, problemDescription, problemIntro } from "./problem-intro.js";

test("joinAnd", () => {
  assert.equal(joinAnd([]), "");
  assert.equal(joinAnd(["a"]), "a");
  assert.equal(joinAnd(["a", "b"]), "a and b");
  assert.equal(joinAnd(["a", "b", "c"]), "a, b and c");
});

test("editorialIdea is the explain() idea before ## Approach", () => {
  const md = "Treat the symbols as denominations and pay out greedily.\n\nLargest first.\n\n## Approach\n\n1. List values.\n\n## Complexity\n\n- **Time** — `O(1)`";
  assert.equal(editorialIdea(md), "Treat the symbols as denominations and pay out greedily. Largest first.");
});

test("editorialIdea falls back to the first prose paragraph, and to nothing", () => {
  assert.equal(editorialIdea("## Intuition\n\n```js\nx\n```\n\n- a list\n\nThe real idea."), "The real idea.");
  assert.equal(editorialIdea(null), "");
  assert.equal(editorialIdea("## Approach\n\n1. only steps"), "");
});

test("problemDescription says what the page offers, then its facts, never the approach", () => {
  const twoSum = problemDescription({ title: "Two Sum", difficulty: "EASY", topics: ["Arrays", "Hash Table", "Math"], companies: ["Amazon", "Google"], complexity: true });
  assert.equal(twoSum, "Two Sum solution explained: step-by-step approach, complexity and code in Python, Java, C++ and JavaScript. An easy problem, asked at Amazon and Google.");
  assert.ok(twoSum.length <= 158, twoSum);
  // No complexity in the editorial: none promised.
  assert.doesNotMatch(problemDescription({ title: "Two Sum", difficulty: "Easy", topics: [], companies: [], complexity: false }), /complexity/);
  // A long name keeps the offer and drops the facts first, then "explained", and never runs past the limit.
  for (const title of ["Maximize Consecutive Elements in an Array After Modification", "Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold"]) {
    const d = problemDescription({ title, difficulty: "Hard", topics: ["Dynamic Programming", "Sorting"], companies: ["Amazon", "Microsoft", "Google"], complexity: true });
    assert.ok(d.startsWith(`${title} solution`) && d.length <= 158, d);
  }
});

test("problemIntro states facts, never the approach", () => {
  assert.equal(
    problemIntro({ title: "Integer to Roman", difficulty: "MEDIUM", topics: ["Strings", "Math", "Greedy", "Hash Table"], companies: ["Amazon", "Microsoft"] }),
    "Integer to Roman is a medium coding problem on strings, math and greedy, asked in Amazon and Microsoft interviews.",
  );
  assert.equal(problemIntro({ title: "Two Sum", difficulty: "easy", topics: [], companies: [] }), "Two Sum is an easy coding problem.");
  assert.equal(
    problemIntro({ title: "Network Delay Time", difficulty: "Medium", topics: ["Dijkstra's Algorithm", "BFS"], companies: [] }),
    "Network Delay Time is a medium coding problem on Dijkstra's Algorithm and BFS.",
  );
});
