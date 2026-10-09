/**
 * What a learner's query may be, and the MySQL spellings it may use.
 *
 * SQL problems run on SQLite (sql.js — SQLite compiled to WebAssembly, on a
 * worker thread: lib/sql/engine.ts), but the placement rounds and the
 * interview questions they prepare for are written in MySQL. Three things
 * close most of that gap without a MySQL server per sitting:
 *
 *  - functions SQLite lacks are registered on every connection
 *    (lib/sql/mysql-functions.ts: IF, DATEDIFF, YEAR, DATE_FORMAT, LEFT, MOD…);
 *  - a handful of MySQL *syntax* forms that no function can stand in for are
 *    rewritten here, on tokens, before the query runs: `/` divides as a
 *    decimal (SQLite's 5/2 is 2, MySQL's 2.5 — every "percentage" problem
 *    would read as a wrong answer), `DIV` is integer division,
 *    `GROUP_CONCAT(x ORDER BY y SEPARATOR ';')` is moved into SQLite's
 *    argument order, `INTERVAL n DAY` inside DATE_ADD/DATE_SUB becomes two
 *    arguments, `TIMESTAMPDIFF(DAY, …)`'s unit becomes a string,
 *    `CAST(x AS SIGNED)` becomes an integer cast, and `<=>` becomes `IS`;
 *  - everything that is not one read-only statement is refused with a
 *    sentence, before it reaches the engine.
 *
 * The refusal is not the sandbox — each run gets a fresh in-memory database
 * on a thread that is killed past its deadline — but PRAGMA must never reach
 * the engine: `PRAGMA hard_heap_limit = 0` would lift the memory cap the
 * worker sets. Pure and pinned by dialect.test.ts.
 */

export type TokenKind = "word" | "string" | "ident" | "number" | "punct" | "space" | "comment";

export interface Token {
  kind: TokenKind;
  text: string;
}

const MULTI_PUNCT = ["<=>", "<=", ">=", "<>", "!=", "==", "||", "<<", ">>"];

/** SQL text → tokens. Lossless: joining every token's text gives the input back. */
export function tokenize(sql: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i]!;
    // Whitespace
    if (/\s/.test(c)) {
      let j = i + 1;
      while (j < n && /\s/.test(sql[j]!)) j++;
      out.push({ kind: "space", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // -- line comment (MySQL also takes #)
    if ((c === "-" && sql[i + 1] === "-") || c === "#") {
      let j = i;
      while (j < n && sql[j] !== "\n") j++;
      out.push({ kind: "comment", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // /* block comment */ — unterminated runs to the end
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const j = end === -1 ? n : end + 2;
      out.push({ kind: "comment", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Quoted: 'string', "ident", `ident`, [ident]
    if (c === "'" || c === '"' || c === "`" || c === "[") {
      const close = c === "[" ? "]" : c;
      let j = i + 1;
      while (j < n) {
        if (sql[j] === close) {
          if (close !== "]" && sql[j + 1] === close) { j += 2; continue; } // doubled quote = escaped
          j++;
          break;
        }
        // MySQL also escapes with a backslash inside strings
        if (c === "'" && sql[j] === "\\" && j + 1 < n) { j += 2; continue; }
        j++;
      }
      // A string in double quotes is a string in MySQL; SQLite would read an
      // identifier, find no such column, and *then* fall back to the string —
      // the same answer, so it stays an ident token and is left untouched.
      out.push({ kind: c === "'" ? "string" : "ident", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Numbers: 12, 1.5, .5, 1e3
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(sql.slice(i))!;
      out.push({ kind: "number", text: m[0] });
      i += m[0].length;
      continue;
    }
    // Words: keywords, names, functions
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_$]*/.exec(sql.slice(i))!;
      out.push({ kind: "word", text: m[0] });
      i += m[0].length;
      continue;
    }
    const multi = MULTI_PUNCT.find((p) => sql.startsWith(p, i));
    const text = multi ?? c;
    out.push({ kind: "punct", text });
    i += text.length;
  }
  return out;
}

const upper = (t: Token | undefined) => (t && t.kind === "word" ? t.text.toUpperCase() : "");
const significant = (tokens: Token[]) => tokens.filter((t) => t.kind !== "space" && t.kind !== "comment");

/** Words that change the database or the engine. REPLACE only when it is not the replace() function. */
const FORBIDDEN = new Set([
  "INSERT", "UPDATE", "DELETE", "MERGE", "UPSERT", "CREATE", "DROP", "ALTER", "TRUNCATE_TABLE",
  "ATTACH", "DETACH", "PRAGMA", "VACUUM", "REINDEX", "ANALYZE", "SAVEPOINT", "RELEASE",
  "BEGIN", "COMMIT", "ROLLBACK", "GRANT", "REVOKE", "LOAD", "HANDLER", "CALL", "LOCK", "UNLOCK",
]);

export type StatementCheck = { ok: true } | { ok: false; error: string };

/** One read-only statement, or a sentence saying why not. */
export function checkStatement(sql: string): StatementCheck {
  if (sql.length > 20_000) return { ok: false, error: "That query is over 20,000 characters." };
  const tokens = significant(tokenize(sql));
  if (tokens.length === 0) return { ok: false, error: "Write a query first." };
  // Unterminated quote: the tokenizer ran it to the end of the text.
  const last = tokens[tokens.length - 1]!;
  if ((last.kind === "string" || last.kind === "ident") && last.text.length >= 1) {
    const q = last.text[0]!;
    const close = q === "[" ? "]" : q;
    if (last.text.length === 1 || last.text[last.text.length - 1] !== close) {
      return { ok: false, error: `A quote (${q}) is never closed.` };
    }
  }
  // Statements are separated by `;` — a trailing one is fine.
  const statements: Token[][] = [[]];
  for (const t of tokens) {
    if (t.kind === "punct" && t.text === ";") statements.push([]);
    else statements[statements.length - 1]!.push(t);
  }
  const nonEmpty = statements.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) return { ok: false, error: "Write a query first." };
  if (nonEmpty.length > 1) return { ok: false, error: "Run one statement at a time — this problem is answered by a single query." };
  const stmt = nonEmpty[0]!;
  const first = upper(stmt[0]);
  if (first !== "SELECT" && first !== "WITH" && !(stmt[0]?.kind === "punct" && stmt[0].text === "(")) {
    return { ok: false, error: "Only a SELECT query runs here — the problem asks for a result, not a change to the tables." };
  }
  for (let i = 0; i < stmt.length; i++) {
    const w = upper(stmt[i]);
    if (!w) continue;
    if (w === "REPLACE" && stmt[i + 1]?.kind === "punct" && stmt[i + 1]!.text === "(") continue;
    if (w === "REPLACE" || FORBIDDEN.has(w)) {
      return { ok: false, error: `${w} is not allowed here — the query must only read the tables.` };
    }
  }
  return { ok: true };
}

/** Index of the `)` closing the `(` at `open`, over significant tokens; -1 if unbalanced. */
function closingParen(tokens: Token[], open: number): number {
  let depth = 0;
  for (let i = open; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.kind !== "punct") continue;
    if (t.text === "(") depth++;
    else if (t.text === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** The index of the `(` matching the `)` at `close`, or -1. */
function openingParen(tokens: Token[], close: number): number {
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    const t = tokens[i]!;
    if (t.kind !== "punct") continue;
    if (t.text === ")") depth++;
    else if (t.text === "(" && --depth === 0) return i;
  }
  return -1;
}

const skipSpaceBack = (tokens: Token[], i: number) => {
  while (i >= 0 && tokens[i]!.kind === "space") i--;
  return i;
};
const skipSpaceFwd = (tokens: Token[], i: number) => {
  while (i < tokens.length && tokens[i]!.kind === "space") i++;
  return i;
};
const isOperand = (t: Token | undefined) => !!t && (t.kind === "number" || t.kind === "ident" || t.kind === "string" || (t.kind === "word" && !OPERAND_STOP.has(t.text.toUpperCase())));
/** Words that end an operand when scanning left from DIV (`SELECT a DIV b`, `WHEN x DIV 2`). */
const OPERAND_STOP = new Set(["SELECT", "WHERE", "AND", "OR", "NOT", "ON", "WHEN", "THEN", "ELSE", "CASE", "BY", "AS", "HAVING", "DIV", "IN", "IS", "LIKE", "BETWEEN", "DISTINCT", "RETURN", "SET", "END", "FROM", "INTERVAL"]);

/** Start of the primary (column, t.col, literal, f(…), (…)) ending at `end`, or -1. */
function primaryStart(tokens: Token[], end: number): number {
  const t = tokens[end];
  if (!t) return -1;
  let start: number;
  if (t.kind === "punct" && t.text === ")") {
    start = openingParen(tokens, end);
    if (start === -1) return -1;
    const fn = skipSpaceBack(tokens, start - 1);
    if (fn >= 0 && tokens[fn]!.kind === "word" && !OPERAND_STOP.has(tokens[fn]!.text.toUpperCase())) start = fn;
  } else if (isOperand(t)) start = end;
  else return -1;
  // qualified names: alias.column
  while (start >= 2 && tokens[start - 1]!.kind === "punct" && tokens[start - 1]!.text === "." && isOperand(tokens[start - 2])) start -= 2;
  return start;
}

/** End of the primary starting at `start` (a leading unary minus included), or -1. */
function primaryEnd(tokens: Token[], start: number): number {
  let i = start;
  if (tokens[i]?.kind === "punct" && (tokens[i]!.text === "-" || tokens[i]!.text === "+")) i = skipSpaceFwd(tokens, i + 1);
  const t = tokens[i];
  if (!t) return -1;
  let end: number;
  if (t.kind === "punct" && t.text === "(") end = closingParen(tokens, i);
  else if (isOperand(t)) {
    end = i;
    const next = skipSpaceFwd(tokens, i + 1);
    if (t.kind === "word" && tokens[next]?.kind === "punct" && tokens[next]!.text === "(") end = closingParen(tokens, next);
  } else return -1;
  if (end === -1) return -1;
  while (tokens[end + 1]?.kind === "punct" && tokens[end + 1]!.text === "." && isOperand(tokens[end + 2])) end += 2;
  return end;
}

/**
 * MySQL's `a DIV b` (and the `a MOD b` operator, same precedence) is integer division, truncating towards zero whatever the
 * operand types — `7.5 DIV 2` is 3, `TIMESTAMPDIFF(SECOND, …) DIV 60` an
 * integer. Rewriting it to SQLite's bare `/` (as this did until 2026-10-09)
 * truncated only when both sides were stored integers: a decimal column or a
 * function's REAL result gave 440.5 where MySQL gives 440, a learner's right
 * answer marked wrong. So it becomes CAST((a) / (b) AS INTEGER), with the
 * left operand taking in a chain of `*`, `/`, `%` before it (they share DIV's
 * precedence and associate left: `a * b DIV c` is `(a * b) DIV c`) and the
 * right operand one primary. The `/` inside is made decimal by the main pass.
 */
function rewriteDiv(tokens: Token[]): Token[] {
  for (let guard = 0; guard < 200; guard++) {
    // `MOD` is an operator here only when no `(` follows (MOD(a, b) is the function).
    const at = tokens.findIndex((t, k) => upper(t) === "DIV" || (upper(t) === "MOD" && tokens[skipSpaceFwd(tokens, k + 1)]?.text !== "("));
    if (at === -1) return tokens;
    const isMod = upper(tokens[at]) === "MOD";
    let leftEnd = skipSpaceBack(tokens, at - 1);
    let leftStart = primaryStart(tokens, leftEnd);
    while (leftStart !== -1) {
      const op = skipSpaceBack(tokens, leftStart - 1);
      const o = tokens[op];
      if (!(o && o.kind === "punct" && (o.text === "*" || o.text === "/" || o.text === "%"))) break;
      const prev = primaryStart(tokens, skipSpaceBack(tokens, op - 1));
      if (prev === -1) break;
      leftStart = prev;
    }
    const rightStart = skipSpaceFwd(tokens, at + 1);
    const rightEnd = primaryEnd(tokens, rightStart);
    if (leftStart === -1 || rightEnd === -1) {
      // Not an expression we can read — keep the old rewrite rather than fail the query.
      tokens = [...tokens.slice(0, at), punct(isMod ? "%" : "/"), ...tokens.slice(at + 1)];
      continue;
    }
    leftEnd = Math.max(leftEnd, leftStart);
    if (isMod) {
      // `a MOD b` → MOD((a), (b)): the registered function keeps MySQL's sign and
      // decimals (SQLite's % casts both sides to integers: 7.5 % 2 = 1, MySQL 1.5).
      tokens = [
        ...tokens.slice(0, leftStart),
        word("MOD"), punct("("), punct("("), ...tokens.slice(leftStart, leftEnd + 1), punct(")"), punct(","), space,
        punct("("), ...tokens.slice(rightStart, rightEnd + 1), punct(")"), punct(")"),
        ...tokens.slice(rightEnd + 1),
      ];
      continue;
    }
    tokens = [
      ...tokens.slice(0, leftStart),
      word("CAST"), punct("("), punct("("), ...tokens.slice(leftStart, leftEnd + 1), punct(")"), space, punct("/"), space,
      punct("("), ...tokens.slice(rightStart, rightEnd + 1), punct(")"), space, word("AS"), space, word("INTEGER"), punct(")"),
      ...tokens.slice(rightEnd + 1),
    ];
  }
  return tokens;
}

const word = (text: string): Token => ({ kind: "word", text });
const punct = (text: string): Token => ({ kind: "punct", text });
const space: Token = { kind: "space", text: " " };

const DATE_ARITH = new Set(["DATE_ADD", "DATE_SUB", "ADDDATE", "SUBDATE"]);

/**
 * MySQL syntax → SQLite syntax, token by token. Comments are dropped (a `--`
 * comment would otherwise swallow anything appended after it); every other
 * token keeps its text unless a rule below names it.
 */
export function rewriteMysql(sql: string): string {
  let tokens = tokenize(sql).filter((t) => t.kind !== "comment");

  // GROUP_CONCAT([DISTINCT] x [ORDER BY …] SEPARATOR 's') → group_concat(x, 's' [ORDER BY …])
  for (let i = 0; i < tokens.length; i++) {
    if (upper(tokens[i]) !== "GROUP_CONCAT") continue;
    let open = i + 1;
    while (tokens[open]?.kind === "space") open++;
    if (tokens[open]?.text !== "(") continue;
    const close = closingParen(tokens, open);
    if (close === -1) continue;
    let sepAt = -1;
    let orderAt = -1;
    let distinct = false;
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const t = tokens[j]!;
      if (t.kind === "punct" && t.text === "(") depth++;
      else if (t.kind === "punct" && t.text === ")") depth--;
      else if (depth === 0) {
        const w = upper(t);
        if (w === "SEPARATOR") sepAt = j;
        else if (w === "ORDER" && orderAt === -1) orderAt = j;
        else if (w === "DISTINCT") distinct = true;
      }
    }
    if (sepAt === -1) continue;
    let litAt = sepAt + 1;
    while (tokens[litAt]?.kind === "space") litAt++;
    const lit = tokens[litAt];
    if (!lit || lit.kind !== "string") continue;
    // SQLite refuses a second argument next to DISTINCT; its default separator is MySQL's own ','.
    // Any other separator with DISTINCT: each value is tagged with char(1), joined
    // with SQLite's ',' and the tag + ',' then swapped for the separator — the comma
    // inside a value carries no tag, so it survives. NULL || x is NULL, skipped as MySQL skips it.
    if (distinct && lit.text !== "','") {
      let distinctAt = open + 1;
      while (upper(tokens[distinctAt]) !== "DISTINCT") distinctAt++;
      const exprEnd = orderAt !== -1 && orderAt < sepAt ? orderAt : sepAt;
      const expr = tokens.slice(distinctAt + 1, exprEnd);
      const order = orderAt !== -1 && orderAt < sepAt ? tokens.slice(orderAt, sepAt) : [];
      const tag = [word("char"), punct("("), word("1"), punct(")")];
      const rewritten: Token[] = [
        word("REPLACE"), punct("("), word("REPLACE"), punct("("),
        word("group_concat"), punct("("), word("DISTINCT"), space, punct("("), ...expr, punct(")"), space, punct("||"), space, ...tag, space, ...order,
        punct(")"), punct(","), space, ...tag, space, punct("||"), space, { kind: "string", text: "','" }, punct(","), space, lit,
        punct(")"), punct(","), space, ...tag, punct(","), space, { kind: "string", text: "''" }, punct(")"),
      ];
      tokens = [...tokens.slice(0, i), ...rewritten, ...tokens.slice(close + 1)];
      i += rewritten.length - 1;
      continue;
    }
    const sepTokens: Token[] = distinct && lit.text === "','" ? [] : [punct(","), space, lit];
    const without = [...tokens.slice(0, sepAt), ...tokens.slice(litAt + 1, close)];
    // Positions before sepAt are unchanged; ORDER BY (if any) sits before SEPARATOR in MySQL.
    const insertAt = orderAt !== -1 && orderAt < sepAt ? orderAt : without.length;
    const inner = [...without.slice(0, insertAt), ...sepTokens, ...(insertAt < without.length ? [space] : []), ...without.slice(insertAt)];
    tokens = [...inner, ...tokens.slice(close)];
  }

  // DATE_ADD(d, INTERVAL n UNIT) → DATE_ADD(d, n, 'UNIT')
  for (let i = 0; i < tokens.length; i++) {
    if (!DATE_ARITH.has(upper(tokens[i]))) continue;
    let open = i + 1;
    while (tokens[open]?.kind === "space") open++;
    if (tokens[open]?.text !== "(") continue;
    const close = closingParen(tokens, open);
    if (close === -1) continue;
    let intervalAt = -1;
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const t = tokens[j]!;
      if (t.kind === "punct" && t.text === "(") depth++;
      else if (t.kind === "punct" && t.text === ")") depth--;
      else if (depth === 0 && upper(t) === "INTERVAL") { intervalAt = j; break; }
    }
    if (intervalAt === -1) continue;
    let unitAt = close - 1;
    while (unitAt > intervalAt && tokens[unitAt]!.kind === "space") unitAt--;
    const unit = tokens[unitAt]!;
    if (unit.kind !== "word" || unitAt === intervalAt) continue;
    const amount = tokens.slice(intervalAt + 1, unitAt);
    tokens = [
      ...tokens.slice(0, intervalAt),
      ...amount,
      punct(","), space,
      { kind: "string", text: `'${unit.text.toUpperCase()}'` },
      ...tokens.slice(close),
    ];
  }

  // CAST(x AS DATE) → date(x): SQLite gives the type name DATE numeric affinity, so the
  // cast would turn '2024-01-05' into 2024. DATETIME/TIMESTAMP and TIME likewise.
  for (let i = 0; i < tokens.length; i++) {
    if (upper(tokens[i]) !== "CAST") continue;
    let open = i + 1;
    while (tokens[open]?.kind === "space") open++;
    if (tokens[open]?.text !== "(") continue;
    const close = closingParen(tokens, open);
    if (close === -1) continue;
    let asAt = -1;
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const t = tokens[j]!;
      if (t.kind === "punct" && t.text === "(") depth++;
      else if (t.kind === "punct" && t.text === ")") depth--;
      else if (depth === 0 && upper(t) === "AS") asAt = j;
    }
    if (asAt === -1) continue;
    const typeWords = tokens.slice(asAt + 1, close).filter((t) => t.kind !== "space");
    const type = typeWords.length === 1 ? upper(typeWords[0]) : "";
    const fn = type === "DATE" ? "date" : type === "DATETIME" || type === "TIMESTAMP" ? "datetime" : type === "TIME" ? "time" : "";
    if (!fn) continue;
    tokens = [...tokens.slice(0, i), word(fn), punct("("), ...tokens.slice(open + 1, asAt), punct(")"), ...tokens.slice(close + 1)];
  }

  tokens = rewriteDiv(tokens);

  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const w = upper(t);
    // MySQL string escapes ('It\'s', '\\.' in a REGEXP) → SQLite, which has none but ''.
    if (t.kind === "string") {
      out.push({ kind: "string", text: mysqlStringToSqlite(t.text) });
      // MySQL's LIKE escapes with a backslash by default ('rider\_%' matches a literal
      // underscore); SQLite's LIKE has no escape character unless one is named.
      if (t.text.includes("\\") && upper(prevSignificant(out, 2)) === "LIKE") {
        let k = i + 1;
        while (tokens[k]?.kind === "space") k++;
        if (upper(tokens[k]) !== "ESCAPE") out.push(space, word("ESCAPE"), space, { kind: "string", text: "'\\'" });
      }
      continue;
    }
    // MySQL's `/` is decimal division.
    if (t.kind === "punct" && t.text === "/") {
      out.push(punct("*"), word("1.0"), punct("/"));
      continue;
    }
    if (t.kind === "punct" && t.text === "<=>") {
      out.push(word("IS"));
      continue;
    }
    // CAST(x AS SIGNED [INTEGER]) / UNSIGNED → INTEGER
    if ((w === "SIGNED" || w === "UNSIGNED") && upper(prevSignificant(out)) === "AS") {
      out.push(word("INTEGER"));
      let k = i + 1;
      while (tokens[k]?.kind === "space") k++;
      if (upper(tokens[k]) === "INTEGER" || upper(tokens[k]) === "INT") i = k;
      continue;
    }
    // TIMESTAMPDIFF(DAY, a, b) → TIMESTAMPDIFF('DAY', a, b)
    if (t.kind === "word" && upper(prevSignificant(out)) === "(" && upper(prevSignificant(out, 2)) === "TIMESTAMPDIFF") {
      out.push({ kind: "string", text: `'${t.text.toUpperCase()}'` });
      continue;
    }
    out.push(t);
  }
  return out.map((t) => t.text).join("");
}

const MYSQL_ESCAPES: Record<string, string> = { "0": "\0", "'": "'", '"': '"', b: "\b", n: "\n", r: "\r", t: "\t", Z: "\x1a", "\\": "\\", "%": "\\%", _: "\\_" };

/**
 * A MySQL single-quoted literal as SQLite reads the same characters. MySQL
 * takes backslash escapes inside strings (`'\\.'` is the two characters
 * `\.`, which a REGEXP reads as a literal dot); SQLite takes none, so the
 * same text there was `\\.` — "a backslash, then any character" — and a
 * correct query read as a wrong answer. `\%` and `\_` stay escaped (they
 * mean something to LIKE); any other `\x` is `x`, as in MySQL.
 */
export function mysqlStringToSqlite(text: string): string {
  if (!text.includes("\\")) return text;
  const inner = text.slice(1, text.endsWith("'") && text.length > 1 ? -1 : undefined);
  let raw = "";
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]!;
    if (c === "\\" && i + 1 < inner.length) {
      const next = inner[++i]!;
      raw += MYSQL_ESCAPES[next] ?? next;
    } else if (c === "'" && inner[i + 1] === "'") {
      raw += "'";
      i++;
    } else {
      raw += c;
    }
  }
  return `'${raw.replace(/'/g, "''")}'`;
}

/** The nth significant token from the end of `out` (1 = last), uppercased if a word, its text otherwise. */
function prevSignificant(out: Token[], nth = 1): Token | undefined {
  let seen = 0;
  for (let i = out.length - 1; i >= 0; i--) {
    const t = out[i]!;
    if (t.kind === "space" || t.kind === "comment") continue;
    seen++;
    if (seen === nth) return t.kind === "punct" ? { kind: "word", text: t.text } : t;
  }
  return undefined;
}

/** A value as SQL text, for the INSERTs that load a dataset. */
export function sqlLiteral(v: string | number | boolean | null): string {
  if (v === null) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error(`Not a finite number: ${v}`);
    return String(v);
  }
  return `'${v.replace(/'/g, "''")}'`;
}

/** Quote a table or column name for SQLite. */
export const quoteIdent = (name: string): string => `"${name.replace(/"/g, '""')}"`;
