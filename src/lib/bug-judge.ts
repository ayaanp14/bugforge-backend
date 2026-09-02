/**
 * Bug-hunt judge: executes a multi-file JS project on the SAME engine path as
 * problems (runBatch → judge0 locally / wandbox in prod).
 *
 * Trick: the whole project is bundled into one top-level function
 * `__runBugTest(testIndex)` — an in-memory module registry with a CommonJS-style
 * require shim, plus the challenge's test snippets. The existing wrapCode
 * harness detects that function, feeds it each test index as a batch case, and
 * prints its return value ("PASS" or "FAIL: …"), which runBatch then compares
 * against the expected "PASS" per case. One compile + one run for all tests.
 */

import { runBatch } from "./batch-judge.js";

export interface BugFile {
  filePath: string;
  content: string;
}

export interface BugTest {
  name: string;
  /** JS test body. Receives (require, assert). Return nothing on success —
   *  throw (or assert) to fail. Stored in ChallengeTest.runCommand. */
  source: string;
}

export interface BugTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface BugJudgeResult {
  results: BugTestResult[];
  passedTests: number;
  totalTests: number;
  verdict: "ACCEPTED" | "FAILED" | "ERROR";
  runtimeMs?: number;
  memoryKb?: number;
}

/** Bundle files + tests into a single harness-compatible function. */
export function buildBugProgram(files: BugFile[], tests: BugTest[]): string {
  const registry = files
    .map((f) => `  ${JSON.stringify(f.filePath)}: function (module, exports, require) {\n${f.content}\n  },`)
    .join("\n");

  const testFns = tests
    .map((t) => `  function (require, assert) {\n${t.source}\n  },`)
    .join("\n");

  return `var __runBugTest = function(testIndex) {
  var __FILES__ = {
${registry}
  };
  var __cache = {};
  function __dirOf(p) {
    var i = p.lastIndexOf("/");
    return i === -1 ? "" : p.slice(0, i);
  }
  function __joinPath(dir, rel) {
    var parts = dir ? dir.split("/") : [];
    var segs = rel.split("/");
    for (var i = 0; i < segs.length; i++) {
      if (segs[i] === "." || segs[i] === "") continue;
      if (segs[i] === "..") parts.pop();
      else parts.push(segs[i]);
    }
    return parts.join("/");
  }
  function __resolveFrom(fromDir, path) {
    var base = (path.slice(0, 2) === "./" || path.slice(0, 3) === "../") ? __joinPath(fromDir, path) : path;
    var alts = [base, base + ".js", base + "/index.js"];
    for (var i = 0; i < alts.length; i++) {
      if (__FILES__[alts[i]]) return alts[i];
    }
    return null;
  }
  function __makeRequire(fromDir) {
    return function (path) {
      var key = __resolveFrom(fromDir, path);
      if (key === null) throw new Error("Module not found: " + path);
      if (__cache[key]) return __cache[key].exports;
      var mod = { exports: {} };
      __cache[key] = mod;
      __FILES__[key](mod, mod.exports, __makeRequire(__dirOf(key)));
      return mod.exports;
    };
  }
  var __require = __makeRequire("");
  function __fmt(v) {
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  var assert = {
    equal: function (actual, expected, label) {
      var a = __fmt(actual), b = __fmt(expected);
      if (a !== b) throw new Error((label ? label + ": " : "") + "expected " + b + " but got " + a);
    },
    ok: function (value, label) {
      if (!value) throw new Error((label ? label + ": " : "") + "expected a truthy value but got " + __fmt(value));
    },
    throws: function (fn, label) {
      try { fn(); } catch (e) { return; }
      throw new Error((label ? label + ": " : "") + "expected an error to be thrown");
    },
  };
  var __TESTS__ = [
${testFns}
  ];
  var t = __TESTS__[testIndex];
  if (!t) return "FAIL: unknown test " + testIndex;
  try {
    t(__require, assert);
    return "PASS";
  } catch (e) {
    return "FAIL: " + (e && e.message ? e.message : String(e));
  }
};`;
}

/** Run every test of a bug project through the shared execution engine. */
export async function judgeBugProject(
  files: BugFile[],
  tests: BugTest[],
  limits: { timeLimitMs: number; memoryLimitMb: number } = { timeLimitMs: 5000, memoryLimitMb: 256 }
): Promise<BugJudgeResult> {
  const program = buildBugProgram(files, tests);
  const cases = tests.map((_, i) => ({ input: String(i), expectedOutput: "PASS" }));

  const r = await runBatch(program, "javascript", cases, limits);

  const results: BugTestResult[] = tests.map((t, i) => {
    const pc = r.perCase[i];
    const raw = (pc?.actualOutput || "").trim();
    const passed = Boolean(pc?.passed);
    let detail = "";
    if (!passed) {
      if (raw.startsWith("FAIL:")) detail = raw.slice(5).trim();
      else detail = (pc?.stderr || pc?.compile_output || raw || pc?.status || "test did not run").toString().slice(0, 400);
    }
    return { name: t.name, passed, detail };
  });

  const passedTests = results.filter((x) => x.passed).length;
  const compileBroken = r.perCase.some((pc) => pc?.status === "Compilation Error");
  const verdict = compileBroken ? "ERROR" : passedTests === tests.length ? "ACCEPTED" : "FAILED";

  return {
    results,
    passedTests,
    totalTests: tests.length,
    verdict,
    runtimeMs: r.runtimeMs,
    memoryKb: r.memoryKb,
  };
}
