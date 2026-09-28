import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pairEditedFiles } from "./admin-submissions.js";

/**
 * The admin code view pairs each file a bug hunt submission sent with the
 * hunt's original, so the fix reads as a diff. Pinned without a database.
 *
 * Run with: npm test
 */

const HUNT = [
  { filePath: "src/app.js", content: "let n = 0;\n", language: "javascript" },
  { filePath: "src/util.js", content: "export const x = 1;\n", language: "javascript" },
  { filePath: "README.md", content: "# hunt\n", language: "markdown" },
];

describe("pairEditedFiles", () => {
  it("pairs each submitted file with its original and marks what changed", () => {
    const out = pairEditedFiles({ "src/util.js": "export const x = 1;\n", "src/app.js": "let n = 1;\n" }, HUNT);
    assert.deepEqual(out, [
      { path: "src/app.js", language: "javascript", original: "let n = 0;\n", submitted: "let n = 1;\n", changed: true },
      { path: "src/util.js", language: "javascript", original: "export const x = 1;\n", submitted: "export const x = 1;\n", changed: false },
    ]);
  });

  it("puts changed files first, then the hunt's own order, new files last", () => {
    const out = pairEditedFiles(
      { "zz-new.js": "new", "README.md": "# hunt\n", "src/util.js": "changed", "src/app.js": "changed too" },
      HUNT,
    );
    assert.deepEqual(out.map((f) => [f.path, f.changed]), [
      ["src/app.js", true],
      ["src/util.js", true],
      ["zz-new.js", true],
      ["README.md", false],
    ]);
    const added = out.find((f) => f.path === "zz-new.js");
    assert.equal(added?.original, null);
    assert.equal(added?.language, null);
  });

  it("ignores rows that are not a path → string map instead of throwing", () => {
    assert.deepEqual(pairEditedFiles(null, HUNT), []);
    assert.deepEqual(pairEditedFiles([["src/app.js", "x"]], HUNT), []);
    assert.deepEqual(pairEditedFiles("src/app.js", HUNT), []);
    assert.deepEqual(pairEditedFiles({ "src/app.js": 42 }, HUNT), []);
  });
});
