import { test } from "node:test";
import assert from "node:assert/strict";
import { checkStatement, rewriteMysql, sqlLiteral, tokenize } from "./dialect.js";

test("the tokenizer is lossless", () => {
  const sql = "SELECT `a`, 'it''s', \"b\" -- note\nFROM t /* x */ WHERE a <=> 1.5e3 AND b != 'x;y'";
  assert.equal(tokenize(sql).map((t) => t.text).join(""), sql);
});

test("one read-only statement passes; a trailing semicolon is fine", () => {
  assert.deepEqual(checkStatement("SELECT 1;"), { ok: true });
  assert.deepEqual(checkStatement("  with x as (select 1 a) select a from x"), { ok: true });
  assert.deepEqual(checkStatement("(SELECT 1) UNION (SELECT 2)"), { ok: true });
  // replace() is a function, not the REPLACE statement
  assert.deepEqual(checkStatement("SELECT REPLACE(name, 'a', 'b') FROM t"), { ok: true });
  // a keyword inside a string or a comment is text
  assert.deepEqual(checkStatement("SELECT 'drop table x' -- delete\n FROM t"), { ok: true });
});

test("anything that writes, or reaches the engine's settings, is refused", () => {
  for (const sql of [
    "PRAGMA hard_heap_limit = 0",
    "SELECT 1; PRAGMA hard_heap_limit = 0",
    "WITH x AS (SELECT 1) DELETE FROM t",
    "SELECT * FROM t; DROP TABLE t",
    "INSERT INTO t VALUES (1)",
    "ATTACH DATABASE 'x' AS y",
    "UPDATE t SET a = 1",
    "",
    "   ;  ",
    "SELECT 'unclosed",
  ]) {
    assert.equal(checkStatement(sql).ok, false, sql);
  }
});

test("MySQL division is decimal and DIV is integer", () => {
  assert.equal(rewriteMysql("SELECT a / b FROM t"), "SELECT a *1.0/ b FROM t");
  assert.equal(rewriteMysql("SELECT 7 DIV 2"), "SELECT CAST((7) *1.0/ (2) AS INTEGER)");
  // a function's result or a decimal column on the left still truncates (MySQL: 440, never 440.5)
  assert.equal(rewriteMysql("SELECT TIMESTAMPDIFF(SECOND, a, b) DIV 60"), "SELECT CAST((TIMESTAMPDIFF('SECOND', a, b)) *1.0/ (60) AS INTEGER)");
  // DIV shares * / %'s precedence and associates left: a * b DIV c is (a * b) DIV c
  assert.equal(rewriteMysql("SELECT t.a * 2 DIV -3 FROM t"), "SELECT CAST((t.a * 2) *1.0/ (-3) AS INTEGER) FROM t");
  assert.equal(rewriteMysql("SELECT a + b DIV 2"), "SELECT a + CAST((b) *1.0/ (2) AS INTEGER)");
  // the MOD operator becomes the function; MOD(…) itself is untouched
  assert.equal(rewriteMysql("SELECT x MOD 60 FROM t"), "SELECT MOD((x), (60)) FROM t");
  assert.equal(rewriteMysql("SELECT MOD(x, 60) DIV 2 FROM t"), "SELECT CAST((MOD(x, 60)) *1.0/ (2) AS INTEGER) FROM t");
  assert.equal(rewriteMysql("SELECT (a + b) DIV 2 DIV 3"), "SELECT CAST((CAST(((a + b)) *1.0/ (2) AS INTEGER)) *1.0/ (3) AS INTEGER)");
  // a slash inside a string is text
  assert.equal(rewriteMysql("SELECT 'a/b'"), "SELECT 'a/b'");
});

test("GROUP_CONCAT's SEPARATOR moves into SQLite's argument order", () => {
  assert.equal(rewriteMysql("SELECT GROUP_CONCAT(x SEPARATOR ';')"), "SELECT GROUP_CONCAT(x , ';')");
  assert.equal(rewriteMysql("SELECT GROUP_CONCAT(x ORDER BY x DESC SEPARATOR ',')"), "SELECT GROUP_CONCAT(x , ',' ORDER BY x DESC )");
  // DISTINCT with MySQL's default separator: SQLite allows no second argument, and ',' is its default too
  assert.equal(rewriteMysql("SELECT GROUP_CONCAT(DISTINCT x ORDER BY x SEPARATOR ',')"), "SELECT GROUP_CONCAT(DISTINCT x  ORDER BY x )");
  // any other separator with DISTINCT: values tagged with char(1), the tag + ',' swapped for it
  assert.equal(
    rewriteMysql("SELECT GROUP_CONCAT(DISTINCT x ORDER BY x SEPARATOR '; ')"),
    "SELECT REPLACE(REPLACE(group_concat(DISTINCT ( x ) || char(1) ORDER BY x ), char(1) || ',', '; '), char(1), '')",
  );
});

test("a LIKE pattern with a backslash names MySQL's default escape", () => {
  assert.equal(rewriteMysql("SELECT 1 FROM t WHERE s LIKE 'rider\\_%'"), "SELECT 1 FROM t WHERE s LIKE 'rider\\_%' ESCAPE '\\'");
  assert.equal(rewriteMysql("SELECT 1 FROM t WHERE s LIKE 'a%'"), "SELECT 1 FROM t WHERE s LIKE 'a%'");
});

test("INTERVAL, TIMESTAMPDIFF units, CAST types and <=> are rewritten", () => {
  assert.equal(rewriteMysql("SELECT DATE_ADD(d, INTERVAL 1 DAY)"), "SELECT DATE_ADD(d,  1 , 'DAY')");
  assert.equal(rewriteMysql("SELECT DATE_SUB(d, INTERVAL n + 1 month)"), "SELECT DATE_SUB(d,  n + 1 , 'MONTH')");
  assert.equal(rewriteMysql("SELECT TIMESTAMPDIFF(DAY, a, b)"), "SELECT TIMESTAMPDIFF('DAY', a, b)");
  assert.equal(rewriteMysql("SELECT CAST(x AS SIGNED)"), "SELECT CAST(x AS INTEGER)");
  assert.equal(rewriteMysql("SELECT CAST(x AS UNSIGNED INTEGER)"), "SELECT CAST(x AS INTEGER)");
  assert.equal(rewriteMysql("SELECT CAST(d AS DATE)"), "SELECT date(d )");
  assert.equal(rewriteMysql("SELECT a <=> b"), "SELECT a IS b");
});

test("comments are dropped so nothing appended is swallowed", () => {
  assert.equal(rewriteMysql("SELECT 1 -- trailing"), "SELECT 1 ");
});

test("literals are escaped for the dataset INSERTs", () => {
  assert.equal(sqlLiteral(null), "NULL");
  assert.equal(sqlLiteral(12.5), "12.5");
  assert.equal(sqlLiteral("O'Brien"), "'O''Brien'");
  assert.equal(sqlLiteral(true), "1");
  assert.throws(() => sqlLiteral(Number.NaN));
});

test("MySQL backslash escapes in strings become the characters SQLite should see", () => {
  // '\\.' in MySQL is the two characters \. — a literal dot to REGEXP.
  assert.equal(rewriteMysql(String.raw`SELECT 'a\\.b'`), String.raw`SELECT 'a\.b'`);
  // An unknown escape is the character itself, as in MySQL.
  assert.equal(rewriteMysql(String.raw`SELECT 'a\.b'`), "SELECT 'a.b'");
  assert.equal(rewriteMysql(String.raw`SELECT 'It\'s'`), "SELECT 'It''s'");
  assert.equal(rewriteMysql(String.raw`SELECT 'x\%y'`), String.raw`SELECT 'x\%y'`);
  assert.equal(rewriteMysql("SELECT 'plain'"), "SELECT 'plain'");
});
