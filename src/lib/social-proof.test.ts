import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MIN_MEMBERS_TO_NAME, collegeKey, firstName, summariseColleges } from "./social-proof.js";

/**
 * The landing page's privacy floor: a college is named only when enough
 * members share it that the name never points at one person; quotes are
 * signed with a first name only.
 *
 * Run with: npm test
 */
describe("summariseColleges", () => {
  it("names only colleges at the floor, counts every one", () => {
    const out = summariseColleges([
      { name: "VIT Vellore", members: 5 },
      { name: "IIT Bombay", members: MIN_MEMBERS_TO_NAME - 1 },
      { name: "NIT Trichy", members: 1 },
    ]);
    assert.equal(out.count, 3);
    assert.deepEqual(out.named, ["VIT Vellore"]);
  });

  it("merges spellings and shows the most common one", () => {
    const out = summariseColleges([
      { name: "vit vellore", members: 1 },
      { name: "VIT  Vellore", members: 2 },
      { name: "V.I.T. Vellore", members: 0 },
      { name: "VIT, Vellore", members: 1 },
    ]);
    assert.equal(out.named.length, 1);
    assert.equal(out.named[0], "VIT Vellore");
  });

  it("orders by members and ignores blanks", () => {
    const out = summariseColleges([
      { name: "A College", members: 3 },
      { name: "B College", members: 9 },
      { name: "  ", members: 40 },
    ]);
    assert.deepEqual(out.named, ["B College", "A College"]);
    assert.equal(out.count, 2);
  });

  it("keys punctuation and case away", () => {
    assert.equal(collegeKey("I.I.T. (Delhi)"), collegeKey("i i t delhi"));
  });
});

describe("firstName", () => {
  it("signs with the first word only", () => {
    assert.equal(firstName("Priya Sharma"), "Priya");
    assert.equal(firstName("  Arjun  "), "Arjun");
    assert.equal(firstName("A"), null);
    assert.equal(firstName(null), null);
  });
});
