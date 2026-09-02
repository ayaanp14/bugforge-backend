/** Smoke-test the python + java bug-judge builders with minimal projects. */
import "dotenv/config";
import { judgeBugProject } from "../src/lib/bug-judge.js";

(async () => {
  // ── python ──
  const pyBuggy = [{ filePath: "src/calc.py", content: "def add(a, b):\n    return a - b\n" }];
  const pyFixed = [{ filePath: "src/calc.py", content: "def add(a, b):\n    return a + b\n" }];
  const pyTests = [
    { name: "adds two numbers", source: 'calc = bug_require("src/calc")\nassert_.equal(calc.add(2, 3), 5, "2+3")' },
    { name: "handles negatives", source: 'calc = bug_require("src/calc")\nassert_.equal(calc.add(-2, 7), 5, "-2+7")' },
  ];
  const pb = await judgeBugProject(pyBuggy, pyTests, "python");
  const pf = await judgeBugProject(pyFixed, pyTests, "python");
  console.log(`PYTHON buggy=${pb.verdict}(${pb.passedTests}/${pb.totalTests}) fixed=${pf.verdict}(${pf.passedTests}/${pf.totalTests})`,
    pb.verdict === "FAILED" && pf.verdict === "ACCEPTED" ? "OK" : "PROBLEM " + JSON.stringify(pf.results));

  // ── java ──
  const jBuggy = [{ filePath: "Calc.java", content: "class Calc {\n    static int add(int a, int b) {\n        return a - b;\n    }\n}" }];
  const jFixed = [{ filePath: "Calc.java", content: "class Calc {\n    static int add(int a, int b) {\n        return a + b;\n    }\n}" }];
  const jTests = [
    { name: "adds two numbers", source: '                BugAssert.equal(Calc.add(2, 3), 5, "2+3");' },
    { name: "handles negatives", source: '                BugAssert.equal(Calc.add(-2, 7), 5, "-2+7");' },
  ];
  const jb = await judgeBugProject(jBuggy, jTests, "java");
  const jf = await judgeBugProject(jFixed, jTests, "java");
  console.log(`JAVA   buggy=${jb.verdict}(${jb.passedTests}/${jb.totalTests}) fixed=${jf.verdict}(${jf.passedTests}/${jf.totalTests})`,
    jb.verdict === "FAILED" && jf.verdict === "ACCEPTED" ? "OK" : "PROBLEM " + JSON.stringify(jf.results));
})();
