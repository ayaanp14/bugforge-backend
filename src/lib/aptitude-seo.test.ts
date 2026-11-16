import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aptitudeDescription, coreTitle, searchCore } from "./aptitude-seo.js";

describe("searchCore — the question as it is searched", () => {
  it("reads a series after its instruction", () => {
    assert.deepEqual(searchCore("Find the next term:\n\n**20, 19, 17, 14, 10, ?**", "number-series"), { core: "20, 19, 17, 14, 10, ?", kind: "series" });
  });

  it("reads an analogy out as words, the way it is typed", () => {
    assert.deepEqual(searchCore("**Cow : Calf :: Dog : ?**", "analogies-classification"), { core: "Cow is to Calf as Dog is to ?", kind: "analogy" });
  });

  it("names an odd-one-out by its list", () => {
    assert.deepEqual(searchCore("Which one does **not** belong with the others?\n\n**Rose, Lily, Jasmine, Mango, Marigold**", "analogies-classification"), {
      core: "Odd one out: Rose, Lily, Jasmine, Mango, Marigold",
      kind: "odd-one-out",
    });
  });

  it("takes a one-line question whole, emphasis removed", () => {
    assert.deepEqual(searchCore("What is the unit digit of **3⁴⁷ × 7²³**?", "number-system"), { core: "What is the unit digit of 3⁴⁷ × 7²³?", kind: "question" });
  });

  it("has none for code, tables, passages, data sufficiency, a bare instruction or a name-led topic", () => {
    assert.equal(searchCore("What does this **C** program print?\n\n```c\nint main(void) {}\n```", "number-system"), null);
    assert.equal(searchCore("| Year | Sales |\n|---|---|\n| 2022 | 120 |\n\nWhich year grew most?", "number-system"), null);
    assert.equal(searchCore("> A passage.\n\n> More of it.", "number-system"), null);
    assert.equal(searchCore("**Question:** How old is Ravi?\n\n**Statement I:** He is 5 years older.\n**Statement II:** His brother is 19.", "mathematical-reasoning"), null);
    assert.equal(searchCore("Choose the **correct** sentence:", "number-system"), null);
    assert.equal(searchCore("Choose the word closest in meaning to **ABATE**:\n\n> The storm began to *abate*.", "vocabulary"), null);
  });
});

describe("coreTitle", () => {
  it("leads with the core and promises the answer, within the budget", () => {
    assert.equal(coreTitle("Find the next term:\n\n**2, 5, 10, 17, 26, ?**", "number-series", 60), "2, 5, 10, 17, 26, ? — Next Term: Answer & Explanation");
    assert.equal(coreTitle("**Cow : Calf :: Dog : ?**", "analogies-classification", 60), "Cow is to Calf as Dog is to ? — Answer & Explanation");
  });

  it("steps down to a shorter promise, and gives up on a core too long for any", () => {
    assert.equal(coreTitle("What is the remainder when **7¹⁰⁰** is divided by **5**?", "number-system", 60), "What is the remainder when 7¹⁰⁰ is divided by 5? — Solved");
    assert.equal(coreTitle("A **150 m** long train passes a pole in **15 seconds**. What is its speed in **km/h**?", "time-speed-distance", 60), null);
  });
});

describe("aptitudeDescription", () => {
  const tail = "Answer with a step-by-step solution on CodeKairo.";

  it("is the question, its options lettered as an MCQ is pasted, then the promise", () => {
    assert.equal(
      aptitudeDescription({ title: "Decreasing by 1, 2, 3", stem: "Find the next term: 20, 19, 17, 14, 10, ?", options: ["3", "4", "5", "6"] }, 158),
      `Find the next term: 20, 19, 17, 14, 10, ? A) 3 B) 4 C) 5 D) 6 ${tail}`,
    );
  });

  it("is led by the name where the question alone would not tell two pages apart", () => {
    const a = aptitudeDescription({ title: "The main idea of the passage", stem: "Remote work was once treated as a perk for a favoured few. ".repeat(3), options: ["x"] }, 158);
    const b = aptitudeDescription({ title: "What the passage implies", stem: "Remote work was once treated as a perk for a favoured few. ".repeat(3), options: ["x"] }, 158);
    assert.notEqual(a, b);
    assert.ok(a.startsWith("The main idea of the passage — "));
    const instruction = aptitudeDescription({ title: "Neither of the two", stem: "Choose the correct sentence:", options: ["Neither of the two candidates were selected."] }, 158);
    assert.ok(instruction.startsWith("Neither of the two — Choose the correct sentence: A) Neither"));
  });

  it("never runs past the limit, and always keeps the promise", () => {
    const long = aptitudeDescription({ title: "T", stem: "word ".repeat(80), options: ["an option ".repeat(5), "another ".repeat(5)] }, 158);
    assert.ok(long.length <= 158, String(long.length));
    assert.ok(long.endsWith(tail));
  });
});
