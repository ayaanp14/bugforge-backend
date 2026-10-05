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
  assert.equal(rewriteMysql("SELECT 7 DIV 2"), "SELECT 7 / 2");
  // a slash inside a string is text
  assert.equal(rewriteMysql("SELECT 'a/b'"), "SELECT 'a/b'");
});

test("GROUP_CONCAT's SEPARATOR moves into SQLite's argument order", () => {
  assert.equal(rewriteMysql("SELECT GROUP_CONCAT(x SEPARATOR ';')"), "SELECT GROUP_CONCAT(x , ';')");
  assert.equal(rewriteMysql("SELECT GROUP_CONCAT(x ORDER BY x DESC SEPARATOR ',')"), "SELECT GROUP_CONCAT(x , ',' ORDER BY x DESC )");
  // DISTINCT with MySQL's default separator: SQLite allows no second argument, and ',' is its default too
  assert.equal(rewriteMysql("SELECT GROUP_CONCAT(DISTINCT x ORDER BY x SEPARATOR ',')"), "SELECT GROUP_CONCAT(DISTINCT x  ORDER BY x )");
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
