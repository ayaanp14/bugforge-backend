/**
 * Bug-hunt judge: executes a multi-file project on the SAME engine path as
 * problems (runBatch → judge0 locally / wandbox in prod).
 *
 * Supported project languages: javascript, python, java.
 *
 * javascript/python: the project is bundled into one harness-compatible entry
 * function (`__runBugTest(i)` / `__run_bug_test(i)`) — an in-memory module
 * registry with a require/import shim plus the challenge's test snippets. The
 * existing wrapCode harness feeds each test index as a batch case and prints
 * the return value ("PASS" or "FAIL: …").
 *
 * java: files are top-level (non-public) classes concatenated into one
 * self-contained Main.java carrying its own batch driver (sentinel protocol,
 * identical to the driver-codegen java driver).
 */

import { runBatch } from "./batch-judge.js";

export type BugLanguage = "javascript" | "python" | "java";

export interface BugFile {
  filePath: string;
  content: string;
}

export interface BugTest {
  name: string;
  /** Test body in the challenge's language. Receives require/assert (js),
   *  bug_require/assert_ (python), or Assert + direct classes (java). */
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

const SENTINEL = "__CODEXA_CASE__";

/* ── javascript ──────────────────────────────────────────────────── */

function buildJsProgram(files: BugFile[], tests: BugTest[]): string {
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

/* ── python ──────────────────────────────────────────────────────── */

function buildPyProgram(files: BugFile[], tests: BugTest[]): string {
  // Sources travel base64-encoded so arbitrary quoting/indentation in file
  // contents can never break the generated program.
  const data = Buffer.from(
    JSON.stringify({ files: files.map((f) => [f.filePath, f.content]), tests: tests.map((t) => t.source) }),
    "utf8"
  ).toString("base64");

  return `import base64 as __b64, json as __json, types as __types

__DATA = __json.loads(__b64.b64decode("${data}").decode("utf-8"))
__FILES = dict(__DATA["files"])
__TEST_SRCS = __DATA["tests"]
__MODS = {}

# NOTE: this MUST be the first top-level def — the wrapCode harness treats the
# first top-level function as the entry point. Helpers are defined below and
# resolve at call time.
def __run_bug_test(testIndex):
    if testIndex < 0 or testIndex >= len(__TEST_SRCS):
        return "FAIL: unknown test " + str(testIndex)
    ns = {"bug_require": __make_require(""), "assert_": __Assert()}
    try:
        exec(compile(__TEST_SRCS[testIndex], "<test-" + str(testIndex) + ">", "exec"), ns)
        return "PASS"
    except Exception as e:
        return "FAIL: " + str(e)

def __dir_of(p):
    i = p.rfind("/")
    return "" if i == -1 else p[:i]

def __join_path(d, rel):
    parts = d.split("/") if d else []
    for seg in rel.split("/"):
        if seg in (".", ""):
            continue
        if seg == "..":
            if parts:
                parts.pop()
        else:
            parts.append(seg)
    return "/".join(parts)

def __resolve(from_dir, path):
    base = __join_path(from_dir, path) if path.startswith("./") or path.startswith("../") else path
    for cand in (base, base + ".py", base + "/__init__.py"):
        if cand in __FILES:
            return cand
    return None

def __make_require(from_dir):
    def bug_require(path):
        key = __resolve(from_dir, path)
        if key is None:
            raise ImportError("Module not found: " + path)
        if key in __MODS:
            return __MODS[key]
        mod = __types.ModuleType(key)
        mod.bug_require = __make_require(__dir_of(key))
        __MODS[key] = mod
        exec(compile(__FILES[key], key, "exec"), mod.__dict__)
        return mod
    return bug_require

def _bug_fmt(v):
    try:
        return __json.dumps(v, sort_keys=True)
    except Exception:
        return repr(v)

class __Assert:
    def equal(self, actual, expected, label=""):
        if _bug_fmt(actual) != _bug_fmt(expected):
            raise AssertionError((label + ": " if label else "") + "expected " + _bug_fmt(expected) + " but got " + _bug_fmt(actual))
    def ok(self, value, label=""):
        if not value:
            raise AssertionError((label + ": " if label else "") + "expected a truthy value but got " + _bug_fmt(value))
    def throws(self, fn, label=""):
        try:
            fn()
        except Exception:
            return
        raise AssertionError((label + ": " if label else "") + "expected an error to be raised")`;
}

/* ── java ────────────────────────────────────────────────────────── */

function buildJavaProgram(files: BugFile[], tests: BugTest[]): string {
  // Hoist import lines out of every file — after concatenation an import
  // between class declarations is illegal Java.
  const importRe = /^\s*import\s+[\w.*]+\s*;\s*$/;
  const hoisted = new Set<string>();
  const bodies = files.map((f) =>
    f.content
      .split("\n")
      .filter((line) => {
        if (importRe.test(line)) {
          hoisted.add(line.trim());
          return false;
        }
        return true;
      })
      .join("\n")
  );
  const extraImports = [...hoisted].filter((l) => l !== "import java.util.*;").join("\n");
  const classes = (extraImports ? extraImports + "\n" : "") + bodies.join("\n\n");
  const cases = tests
    .map((t, i) => `            case ${i}: {\n${t.source}\n                break;\n            }`)
    .join("\n");

  return `import java.util.*;

${classes}

class BugAssert {
    static String fmt(Object v) {
        if (v == null) return "null";
        if (v instanceof int[]) return Arrays.toString((int[]) v);
        if (v instanceof long[]) return Arrays.toString((long[]) v);
        if (v instanceof Object[]) return Arrays.deepToString((Object[]) v);
        return String.valueOf(v);
    }
    static void equal(Object actual, Object expected, String label) {
        if (!fmt(actual).equals(fmt(expected))) {
            throw new RuntimeException((label == null || label.isEmpty() ? "" : label + ": ") + "expected " + fmt(expected) + " but got " + fmt(actual));
        }
    }
    static void equal(Object actual, Object expected) {
        equal(actual, expected, "");
    }
    static void ok(boolean value, String label) {
        if (!value) throw new RuntimeException((label == null || label.isEmpty() ? "" : label + ": ") + "expected condition to hold");
    }
    static void ok(boolean value) {
        ok(value, "");
    }
}

public class Main {
    static String runBugTest(int testIndex) {
        try {
            switch (testIndex) {
${cases}
                default: return "FAIL: unknown test " + testIndex;
            }
            return "PASS";
        } catch (Throwable e) {
            String msg = e.getMessage();
            return "FAIL: " + (msg == null ? e.toString() : msg);
        }
    }

    public static void main(String[] args) throws Exception {
        Scanner scin = new Scanner(System.in).useDelimiter("\\\\A");
        String raw = scin.hasNext() ? scin.next() : "";
        List<String> lines = new ArrayList<>();
        for (String l0 : raw.split("\\n")) {
            String l = l0.trim();
            if (!l.isEmpty()) lines.add(l);
        }
        long __t0 = System.currentTimeMillis();
        StringBuilder OUT = new StringBuilder();
        for (String line : lines) {
            if (line.equals("${SENTINEL}")) continue;
            int idx;
            try { idx = Integer.parseInt(line); } catch (Exception e) { continue; }
            OUT.append(runBugTest(idx)).append("\\n");
            OUT.append("${SENTINEL}\\n");
        }
        long __mem = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024;
        OUT.append("__CODEXA_STATS__ " + (System.currentTimeMillis() - __t0) + " " + __mem + "\\n");
        System.out.print(OUT);
    }
}`;
}

/* ── shared ──────────────────────────────────────────────────────── */

export function buildBugProgram(files: BugFile[], tests: BugTest[], language: BugLanguage = "javascript"): string {
  if (language === "python") return buildPyProgram(files, tests);
  if (language === "java") return buildJavaProgram(files, tests);
  return buildJsProgram(files, tests);
}

/** Run every test of a bug project through the shared execution engine. */
export async function judgeBugProject(
  files: BugFile[],
  tests: BugTest[],
  language: BugLanguage = "javascript",
  limits: { timeLimitMs: number; memoryLimitMb: number } = { timeLimitMs: 8000, memoryLimitMb: 256 }
): Promise<BugJudgeResult> {
  const program = buildBugProgram(files, tests, language);
  const cases = tests.map((_, i) => ({ input: String(i), expectedOutput: "PASS" }));

  const r = await runBatch(program, language, cases, limits);

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
