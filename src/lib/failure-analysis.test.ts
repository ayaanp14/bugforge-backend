import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFailure, boundValue, constraintsOf, firstCompileError, readError, targetComplexity, type FailureInput } from "./failure-analysis.js";

/**
 * "Why it failed" without a model: constraints read from the statement, the
 * complexity they allow, the judge's error output read in each language,
 * and every verdict explained with facts kept apart from inferences.
 *
 * Run with: npm test
 */

const STATEMENT = [
  "Given an array…",
  "",
  "### Constraints",
  "",
  "- `2 <= nums.length <= 10^5`",
  "- `-10^9 <= nums[i] <= 10^9`",
  "- `1 <= k <= n`",
  "- `Exactly one valid answer exists.`",
  "",
  "**Follow-up:** Can you do it in O(n)?",
].join("\n");

const input = (over: Partial<FailureInput> = {}): FailureInput => ({
  verdict: "WRONG_ANSWER",
  passedCases: 45,
  totalCases: 50,
  runtimeMs: 120,
  timeLimitMs: 2000,
  errorDetail: null,
  language: "python",
  description: STATEMENT,
  ...over,
});

test("bounds are read in every form the catalogue writes them", () => {
  assert.equal(boundValue("10^5"), 1e5);
  assert.equal(boundValue("10⁵"), 1e5);
  assert.equal(boundValue("2 * 10^5"), 2e5);
  assert.equal(boundValue("5 * 10^4"), 5e4);
  assert.equal(boundValue("100000"), 1e5);
  assert.equal(boundValue("10**9"), 1e9);
  assert.equal(boundValue("2^31 - 1"), Math.pow(2, 31));
  assert.equal(boundValue("n"), null);
});

test("constraints tell sizes from values, and ignore lines with no number", () => {
  assert.deepEqual(constraintsOf(STATEMENT), { maxSize: 1e5, maxValue: 1e9 });
  assert.deepEqual(constraintsOf("- `1 <= n == nums.length <= 500`\n### Constraints\n- `1 <= n == nums.length <= 500`"), { maxSize: 500, maxValue: null });
  assert.deepEqual(constraintsOf("### Constraints\n- `1 <= m, n <= 200`\n- `grid[i].length == n`"), { maxSize: 200, maxValue: null }, "a grid's m, n are sizes");
  assert.deepEqual(constraintsOf("### Constraints\n- `1 <= l, w <= 10^9`"), { maxSize: null, maxValue: 1e9 }, "l, w are values");
  assert.deepEqual(constraintsOf("No constraints section here."), { maxSize: null, maxValue: null });
});

test("the complexity the sizes allow follows the usual rule of thumb", () => {
  assert.equal(targetComplexity(20), "O(2^n)");
  assert.equal(targetComplexity(500), "O(n^3)");
  assert.equal(targetComplexity(5000), "O(n^2)");
  assert.equal(targetComplexity(1e5), "O(n log n)");
  assert.equal(targetComplexity(1e7), "O(n)");
  assert.equal(targetComplexity(1e12), "O(log n) or O(1)");
  assert.equal(targetComplexity(null), null);
});

test("the judge's error output is read in each language, with the line it names", () => {
  const py = readError('Traceback (most recent call last):\n  File "solution.py", line 7, in twoSum\n    return nums[i + 1]\nIndexError: list index out of range');
  assert.equal(py.kind, "Index out of range");
  assert.equal(py.line, 7);
  assert.match(py.message!, /IndexError/);

  const java = readError("Exception in thread \"main\" java.lang.NullPointerException\n\tat Solution.solve(Solution.java:23)\n\tat Main.main(Main.java:40)");
  assert.equal(java.kind, "Null or missing value");
  assert.equal(java.line, 40, "the last frame named");

  assert.equal(readError("RangeError: Maximum call stack size exceeded").kind, "Stack overflow");
  assert.equal(readError("Segmentation fault (core dumped)").kind, "Segmentation fault");
  assert.equal(readError("ZeroDivisionError: division by zero").kind, "Division by zero");
  // Node 12 (the judge's JavaScript) names the property between "property" and "of"; Node 16+ after.
  const node12 = readError("Execution error (line 5): Cannot read property 'length' of undefined");
  assert.deepEqual([node12.kind, node12.line], ["Null or missing value", 5]);
  assert.equal(readError("TypeError: Cannot read properties of null (reading 'next')").kind, "Null or missing value");
  assert.equal(readError("").kind, null);

  // A compiler names file:line:col — the line, never the column; the first error, not the last.
  assert.equal(readError("main.cpp:17:5: error: expected ';'\nmain.cpp:30:2: error: …", "first").line, 17);
  assert.equal(firstCompileError("In file included…\nmain.cpp:17:5: error: expected ';' before '}'"), "main.cpp:17:5: error: expected ';' before '}'");
});

test("a near miss is filed as an edge case, a far miss as the approach", () => {
  const near = analyzeFailure(input());
  assert.equal(near.category, "EDGE_CASE");
  assert.match(near.headline, /edge case/);
  assert.equal(near.findings[0]!.kind, "fact");
  assert.match(near.findings[0]!.text, /wrong answer on 5 of 50 cases/);
  assert.ok(near.findings.some((f) => f.kind === "inference" && /special case/.test(f.text)));

  const far = analyzeFailure(input({ passedCases: 10 }));
  assert.equal(far.category, "CONCEPTUAL");
  const none = analyzeFailure(input({ passedCases: 0 }));
  assert.ok(none.findings.some((f) => /No case passed/.test(f.text)));
});

test("a time limit names the complexity the constraints need", () => {
  const tle = analyzeFailure(input({ verdict: "TIME_LIMIT_EXCEEDED", passedCases: 30 }));
  assert.equal(tle.category, "COMPLEXITY");
  assert.deepEqual(tle.complexity, { target: "O(n log n)", basis: "n up to 10^5" });
  assert.ok(tle.findings.some((f) => f.kind === "inference" && /O\(n log n\) or better/.test(f.text)));
});

test("a time limit on a tiny input points at a loop that never ends, not at complexity", () => {
  const tiny = "### Constraints\n- `2 <= nums.length <= 20`";
  const tle = analyzeFailure(input({ verdict: "TIME_LIMIT_EXCEEDED", passedCases: 0, description: tiny }));
  assert.ok(tle.findings.some((f) => /loop that never ends/.test(f.text)));
  assert.ok(!tle.findings.some((f) => /O\(2\^n\) or better/.test(f.text)));
  // And under a wrong answer, a tiny bound earns no complexity line at all.
  const wa = analyzeFailure(input({ description: tiny }));
  assert.ok(!wa.findings.some((f) => /constraints allow/.test(f.text)));
  assert.ok(analyzeFailure(input()).findings.some((f) => /constraints allow n up to 10\^5/.test(f.text)));
});

test("a crash says what kind and where; a compile error points at the first error", () => {
  const crash = analyzeFailure(input({ verdict: "RUNTIME_ERROR", passedCases: 3, errorDetail: 'File "solution.py", line 9\nKeyError: 4' }));
  assert.equal(crash.category, "IMPLEMENTATION");
  assert.deepEqual([crash.error.kind, crash.error.line], ["Missing key", 9]);
  const ce = analyzeFailure(input({ verdict: "COMPILATION_ERROR", passedCases: 0, errorDetail: "Solution.java:12: error: ';' expected" }));
  assert.equal(ce.category, "SYNTAX");
  assert.equal(ce.error.line, 12);
  assert.match(ce.findings[0]!.text, /compiler stopped at/);
});

test("overflow is raised only where it can happen: large values in a fixed-width language", () => {
  const java = analyzeFailure(input({ language: "java", passedCases: 20 }));
  assert.ok(java.findings.some((f) => /overflow a 32-bit int/.test(f.text)));
  const py = analyzeFailure(input({ language: "python", passedCases: 20 }));
  assert.ok(!py.findings.some((f) => /overflow/.test(f.text)), "Python integers do not overflow");
});
