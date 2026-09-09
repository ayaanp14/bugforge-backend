import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeStarterCode } from "./starter-code.js";

describe("starter code normalisation", () => {
  it("returns null for nothing, so the editor stays closed", () => {
    assert.equal(normalizeStarterCode("", "javascript"), null);
    assert.equal(normalizeStarterCode("   \n  ", "javascript"), null);
    assert.equal(normalizeStarterCode(null, "javascript"), null);
    assert.equal(normalizeStarterCode("```js\n\n```", "javascript"), null);
  });

  it("leaves a complete stub alone apart from the trailing newline", () => {
    const stub = "function twoSum(nums, target) {\n  // your code here\n}";
    assert.equal(normalizeStarterCode(stub, "javascript"), stub + "\n");
  });

  it("strips a markdown fence and dedents", () => {
    const raw = "```javascript\n    function f(a) {\n      return a;\n    }\n```";
    assert.equal(normalizeStarterCode(raw, "javascript"), "function f(a) {\n  return a;\n}\n");
  });

  it("repairs escaped newlines", () => {
    assert.equal(normalizeStarterCode("def solve(nums):\\n    pass", "python"), "def solve(nums):\n    pass\n");
  });

  it("closes a signature the model stopped after", () => {
    assert.equal(
      normalizeStarterCode("function containsDuplicate(nums) {", "javascript"),
      "function containsDuplicate(nums) {\n  // your code here\n}\n",
    );
    assert.equal(
      normalizeStarterCode("class Solution {\n  public int[] twoSum(int[] nums, int target) {", "java"),
      "class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // your code here\n  }\n}\n",
    );
  });

  it("gives a bare python signature a body", () => {
    assert.equal(normalizeStarterCode("def contains_duplicate(nums):", "python"), "def contains_duplicate(nums):\n    pass  # your code here\n");
  });

  it("uses the language's comment for the placeholder and never touches SQL braces", () => {
    assert.equal(normalizeStarterCode("SELECT *\nFROM users\nWHERE {", "sql"), "SELECT *\nFROM users\nWHERE {\n");
  });

  it("collapses runs of blank lines and trailing spaces", () => {
    assert.equal(normalizeStarterCode("int main() {  \n\n\n\n  return 0;\n}\n\n\n", "cpp"), "int main() {\n\n  return 0;\n}\n");
  });
});
