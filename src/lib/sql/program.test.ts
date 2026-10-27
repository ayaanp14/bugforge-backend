import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prepareScript, formatResult, showNumber } from "./program.js";
import { judgeProgram, runProgram, normalizeOutput } from "../program-judge.js";
import { closeSqlEngine } from "./engine.js";

after(() => closeSqlEngine());

const SETUP = `CREATE TABLE emp (id INT PRIMARY KEY, name VARCHAR(20), dept VARCHAR(10), salary INT);
INSERT INTO emp VALUES (1, 'Asha', 'eng', 90), (2, 'Ravi', 'eng', 70), (3, 'Meera', 'ops', 50);`;

test("prepareScript splits statements and refuses what reaches past the tables", () => {
  const ok = prepareScript("SELECT 1; -- a comment; with a semicolon\nSELECT 'a;b';");
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.statements.length, 2);
  for (const bad of ["PRAGMA hard_heap_limit = 0", "SELECT 1; ATTACH 'x' AS y", "VACUUM", "SHOW TABLES", "SELECT 'open", "", "  ;  ", "hello world"]) {
    assert.equal(prepareScript(bad).ok, false, bad);
  }
});

test("prepareScript rewrites the MySQL statement forms SQLite lacks", () => {
  const s = (sql: string) => {
    const r = prepareScript(sql);
    assert.ok(r.ok, sql);
    return r.ok ? r.statements : [];
  };
  assert.deepEqual(s("START TRANSACTION"), ["BEGIN"]);
  assert.deepEqual(s("TRUNCATE TABLE emp"), ["DELETE FROM emp"]);
  assert.match(s("INSERT IGNORE INTO t VALUES (1)")[0]!, /^INSERT OR IGNORE INTO/);
  assert.match(s("CREATE TABLE t (id INT(11) AUTO_INCREMENT PRIMARY KEY, n INT)")[0]!, /id INTEGER\s+PRIMARY KEY/);
  assert.match(s("CREATE TABLE t (id INT UNSIGNED NOT NULL AUTO_INCREMENT, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")[0]!, /^CREATE TABLE t \(id INTEGER\s+NOT NULL\s*, PRIMARY KEY \(id\)\)$/);
});

test("formatResult and showNumber print what the exercises compare", () => {
  assert.equal(formatResult({ columns: ["a", "b"], rows: [[1, null], [2.5, "x"]] }), "a | b\n1 | NULL\n2.5 | x");
  assert.equal(formatResult({ columns: ["a"], rows: [] }), "a\n(no rows)");
  assert.equal(showNumber(1 / 3), "0.3333");
  assert.equal(showNumber(-0.00001), "0");
});

test("a script runs on its setup: changes, then the SELECT that shows them", async () => {
  const run = await runProgram("UPDATE emp SET salary = salary + 10 WHERE dept = 'ops';\nSELECT name, salary FROM emp ORDER BY id;", "sql", SETUP);
  assert.equal(run.status, "ACCEPTED");
  assert.equal(run.stdout, "name | salary\nAsha | 90\nRavi | 70\nMeera | 60");
});

test("AUTO_INCREMENT numbers rows and a failing statement is a runtime error with its number", async () => {
  const run = await runProgram("CREATE TABLE t (id INT AUTO_INCREMENT PRIMARY KEY, v VARCHAR(5));\nINSERT INTO t (v) VALUES ('a'), ('b');\nSELECT * FROM t;\nSELECT nope FROM t;", "sql", "");
  assert.equal(run.status, "RUNTIME_ERROR");
  assert.equal(run.stdout, "id | v\n1 | a\n2 | b");
  assert.match(run.stderr ?? "", /^Statement 4: .*nope/);
});

test("judgeProgram on sql: every case's setup, hidden cases withheld", async () => {
  const query = "SELECT dept, AVG(salary) AS avg_salary FROM emp GROUP BY dept ORDER BY dept;";
  const cases = [
    { stdin: SETUP, expected: "dept | avg_salary\neng | 80\nops | 50\n" },
    { stdin: "CREATE TABLE emp (id INT, name TEXT, dept TEXT, salary INT); INSERT INTO emp VALUES (1,'a','x',1),(2,'b','x',2);", expected: "dept | avg_salary\nx | 1.5", hidden: true },
  ];
  const ok = await judgeProgram(query, "sql", cases);
  assert.equal(ok.verdict, "ACCEPTED");
  assert.equal(ok.passed, 2);
  const wrong = await judgeProgram("SELECT dept, MAX(salary) AS avg_salary FROM emp GROUP BY dept ORDER BY dept", "sql", cases);
  assert.equal(wrong.verdict, "WRONG_ANSWER");
  assert.equal(wrong.cases[1]!.actual, null);
  assert.equal(normalizeOutput(wrong.cases[0]!.actual), "dept | avg_salary\neng | 90\nops | 50");
  const refused = await judgeProgram("PRAGMA hard_heap_limit = 0", "sql", cases);
  assert.equal(refused.verdict, "COMPILE_ERROR");
});

test("a setup is checked like the query: no PRAGMA, MySQL forms rewritten", async () => {
  const refused = await runProgram("SELECT 1 AS one", "sql", "PRAGMA hard_heap_limit = 0;");
  assert.equal(refused.status, "RUNTIME_ERROR");
  assert.match(refused.stderr ?? "", /PRAGMA is not allowed/);
  const numbered = await runProgram("SELECT id, v FROM t ORDER BY id", "sql", "CREATE TABLE t (id INT NOT NULL AUTO_INCREMENT, v VARCHAR(5), PRIMARY KEY (id)) ENGINE=InnoDB; INSERT IGNORE INTO t (v) VALUES ('a'), ('b');");
  assert.equal(numbered.stdout, "id | v\n1 | a\n2 | b");
});

test("a broken setup on Run is reported as the input's fault", async () => {
  const run = await runProgram("SELECT 1 AS one", "sql", "CREATE TABLE (");
  assert.equal(run.status, "RUNTIME_ERROR");
  assert.match(run.stderr ?? "", /setup script/);
});
