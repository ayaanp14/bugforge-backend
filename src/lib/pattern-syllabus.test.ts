import test from "node:test";
import assert from "node:assert/strict";
import { APTITUDE_TOPICS } from "./aptitude-topics.js";
import { patternsByTopic, sectionTopics } from "./pattern-syllabus.js";

test("a section's topics come from its rules: named topics, or every topic of a named category", () => {
  assert.deepEqual(sectionTopics([{ topics: ["percentages", "no-such-topic"], count: 3 }, { topics: ["percentages"], count: 1 }]).map((t) => t.id), ["percentages"]);
  const verbal = APTITUDE_TOPICS.filter((t) => t.category === "verbal").map((t) => t.id);
  assert.deepEqual(sectionTopics([{ category: "verbal", count: 10 }]).map((t) => t.id), verbal);
});

test("the reverse index never reads a coding section and lists a pattern once per topic", () => {
  const index = patternsByTopic([
    { slug: "a", name: "A", company: "X", sections: [{ kind: "mcq", blueprint: [{ topics: ["percentages"], count: 2 }] }, { kind: "mcq", blueprint: [{ topics: ["percentages"], count: 2 }] }] },
    { slug: "b", name: "B", company: "Y", sections: [{ kind: "coding", blueprint: [{ topics: ["percentages"], count: 2 }] }] },
  ]);
  assert.deepEqual(index.get("percentages")?.map((t) => t.slug), ["a"]);
});
